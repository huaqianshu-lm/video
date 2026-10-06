import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildTaskPacket } from "./context.mjs";
import { beginExecutorStage, completeExecutorStage, retryStage, runStage, validateStage } from "./runner.mjs";
import { fingerprintStageArtifacts, fingerprintTaskInputs } from "./fingerprints.mjs";
import { taskStages, planningStages, usesUnifiedProduction } from "./production-contract.mjs";
import { acquireProductionTask, activeProductionTask, assertProductionTaskOwner, releaseProductionTask } from "./production-lock.mjs";
import { prepareRenderInputEntry } from "./render-input.mjs";
import { listRemotionTasks } from "./remotion-tasks.mjs";
import { assertProjectMutable, assertProjectSlugMutable, isCompletedProject, loadProject, projectsRoot, readJson, writeJson } from "./storage.mjs";
import { workflowStageDefinition } from "./workflows/registry.mjs";

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function jobsRoot() {
  return path.resolve(process.env.HARNESS_AGENT_JOBS_DIR ?? path.join(projectsRoot(), "..", "agent-jobs"));
}

function jobPath(id) {
  return path.join(jobsRoot(), `${id}.json`);
}

function saveJob(job) {
  assertProjectSlugMutable(job.slug, "写入 Agent Job");
  job.updatedAt = new Date().toISOString();
  writeJson(jobPath(job.id), job);
  return job;
}

export function getAgentJob(id) {
  if (!id || !fs.existsSync(jobPath(id))) return null;
  return readJson(jobPath(id));
}

export function listAgentJobs({ slug = null } = {}) {
  const root = jobsRoot();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => readJson(path.join(root, entry)))
    .filter((job) => !slug || job.slug === slug)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function findActiveAgentJob(slug, stage) {
  return listAgentJobs({ slug }).find((job) => job.stage === stage && ACTIVE_STATUSES.has(job.status)) ?? null;
}

export function createAgentJob({ slug, stage, batchId = null, mode = "background" }) {
  if (!["background", "cli", "dialogue"].includes(mode)) throw new Error("未知任务执行方式。");
  assertProjectSlugMutable(slug, "创建 Agent Job");
  const existing = findActiveAgentJob(slug, stage);
  if (existing) {
    if ((existing.mode ?? "background") !== mode) throw Object.assign(new Error(`已有 ${existing.mode ?? "background"} 任务 ${existing.id}，请恢复该任务。`), { code: "production-task-owned", taskId: existing.id });
    if (batchId && !existing.batchId) {
      existing.batchId = batchId;
      saveJob(existing);
    }
    return existing;
  }
  const project = loadProject(slug, { refresh: true });
  if (project.state.currentStage !== stage || project.state.stages[stage]?.status !== "ready") {
    throw new Error(`${slug} 的 ${stage} 当前不可执行`);
  }
  if (workflowStageDefinition(project, stage)?.executor !== "agent" || (stage === "remotion" && mode !== "dialogue")) {
    throw new Error(`${stage} 不使用通用 Agent Job`);
  }
  if (usesUnifiedProduction(project) && ["source", "tts"].includes(stage)) throw new Error("Source 登记与 TTS 输入校验使用 run；无需领取 Agent 制作任务。");
  const now = new Date().toISOString();
  const job = {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    kind: "video-agent-job",
    slug,
    stage,
    stages: taskStages(project),
    originalStages: taskStages(project),
    inputFingerprint: fingerprintTaskInputs(project, taskStages(project)),
    mode,
    batchId,
    status: "queued",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    task: buildTaskPacket(project),
    result: null,
    error: null,
    logs: { stdout: "", stderr: "" },
  };
  acquireProductionTask(project, { id: job.id, stage, mode });
  try { return saveJob(job); } catch (error) { releaseProductionTask(project, job.id); throw error; }
}

function startJob(job) {
  let project = loadProject(job.slug, { refresh: true });
  assertProjectMutable(project, "领取制作任务");
  project.taskOwner = job.id;
  assertProductionTaskOwner(project, job.id);
  const originalStages = job.originalStages ?? job.stages ?? [job.stage];
  if (!originalStages.includes(project.state.currentStage)) throw new Error("任务已过期，项目阶段已改变。");
  const currentInput = fingerprintTaskInputs(project, originalStages);
  if (job.inputFingerprint && job.inputFingerprint !== currentInput) throw Object.assign(new Error("领取后上游输入已改变，请结束原任务并刷新返工。"), { code: "production-input-changed" });
  job.stage = project.state.currentStage;
  job.stages = originalStages.slice(originalStages.indexOf(job.stage));
  if (project.state.stages[job.stage].status === "failed") retryStage(project, job.stage);
  acquireProductionTask(project, { id: job.id, stage: job.stage, mode: job.mode ?? "background" });
  job.inputFingerprint = currentInput;
  job.outputFingerprints ??= Object.fromEntries(originalStages.map((stage) => [stage, fingerprintStageArtifacts(project, stage)]));
  job.task = buildTaskPacket(project);
  beginExecutorStage(project, job.stage);
  job.status = "running";
  job.attempts += 1;
  job.startedAt = new Date().toISOString();
  job.completedAt = null;
  job.error = null;
  saveJob(job);
  return project;
}

function submitJob(job, execution = {}) {
  let project = loadProject(job.slug, { refresh: false });
  assertProjectMutable(project, "回传制作结果");
  project.taskOwner = job.id;
  assertProductionTaskOwner(project, job.id);
  const stages = job.stages ?? [job.stage];
  const finishedCheckpoint = job.validatedFingerprints && stages.every(stage => project.state.stages[stage]?.status === "succeeded");
  if ((!stages.includes(project.state.currentStage) && !finishedCheckpoint) || fingerprintTaskInputs(project, job.originalStages ?? stages) !== job.inputFingerprint) {
    throw Object.assign(new Error("制作期间输入或项目阶段已改变，原任务结果不能推进；结束任务后刷新安排返工。"), { code: "production-input-changed" });
  }
  if (usesUnifiedProduction(project) || job.mode === "dialogue") {
    for (const stage of stages) {
      if (fingerprintStageArtifacts(project, stage) === job.outputFingerprints[stage]) throw Object.assign(new Error(`${stage} 产物没有变化，不能把已有文件作为制作结果。`), { code: "production-output-unchanged" });
    }
  }
  if (job.stage === "remotion") prepareRenderInputEntry(project);
  const issues = stages.flatMap((stage) => validateStage(project, stage)).filter((issue) => issue.severity !== "warning");
  if (issues.length) throw Object.assign(new Error(`${issues.length} 制作产物校验问题。`), { code: "validation-failed", issues });
  job.validatedFingerprints ??= Object.fromEntries(stages.map(stage => [stage, fingerprintStageArtifacts(project, stage)]));
  saveJob(job);
  for (let index = 0; index < stages.length; index += 1) {
    if (project.state.stages[stages[index]].status === "succeeded") {
      if (fingerprintStageArtifacts(project, stages[index]) !== job.validatedFingerprints[stages[index]]) throw new Error("任务内部已完成产物发生变化，不能跳过返工。");
      continue;
    }
    if (project.state.stages[stages[index]].status === "ready") beginExecutorStage(project, stages[index]);
    completeExecutorStage(project, stages[index], execution);
  }
  if (stages.includes(planningStages(project).at(-1)) && (stages.length > 1 || usesUnifiedProduction(project))) {
    project.state.stages[planningStages(project).at(-1)].review = { kind: "gate-1", decision: "approved", internal: true, reviewedAt: new Date().toISOString() };
    writeJson(project.files.state, project.state);
  }
  job.status = "succeeded";
  job.completedAt = new Date().toISOString();
  job.result = { outputs: execution.outputs ?? [], summary: execution.summary ?? null, stages, nextStage: project.state.currentStage };
  job.error = null;
  saveJob(job);
  if (activeProductionTask(project)?.id === job.id) releaseProductionTask(project, job.id);
  if (job.stage === "remotion") runStage(loadProject(job.slug, { refresh: true }), "gate-3");
  return job;
}

export function claimDialogueTask(slug) {
  const project = loadProject(slug, { refresh: true });
  assertProjectMutable(project, "领取对话制作任务");
  const active = activeProductionTask(project);
  if (active) throw Object.assign(new Error(`任务 ${active.id} 已领取，请使用 resume 恢复。`), { code: "production-task-owned", taskId: active.id });
  if (project.state.currentStage === "remotion") {
    const remotion = listRemotionTasks({ slug }).find(task => ["ready", "in-progress", "blocked"].includes(task.status));
    if (remotion) throw Object.assign(new Error(`已有 Remotion 任务 ${remotion.id}，请恢复原任务。`), { code: "production-task-owned", taskId: remotion.id });
  }
  const job = createAgentJob({ slug, stage: project.state.currentStage, mode: "dialogue" });
  try { startJob(job); } catch (error) { failAgentTask(job.id, error.message); throw error; }
  return getAgentJob(job.id);
}

export function completeDialogueTask(id, summary) {
  const job = getAgentJob(id);
  if (!job || job.mode !== "dialogue") throw new Error("对话制作任务不存在。");
  if (job.status === "succeeded") return job;
  if (job.status !== "running" || !summary?.trim()) throw new Error("必须回传运行中的任务和非空制作说明。");
  // A rejected submission leaves the claim intact so the Agent can fix its output.
  return submitJob(job, { summary: summary.trim() });
}

export function failAgentTask(id, reason) {
  const job = getAgentJob(id);
  if (!job || !["queued", "running"].includes(job.status) || !reason?.trim()) throw new Error("任务不存在、已结束或缺少失败原因。");
  const project = loadProject(job.slug, { refresh: false });
  assertProjectMutable(project, "记录制作失败");
  assertProductionTaskOwner(project, id);
  if (project.state.currentStage === job.stage && project.state.stages[job.stage].status === "running") {
    project.state.stages[job.stage].status = "failed";
    project.state.stages[job.stage].error = { code: "production-task-failed", message: reason };
    writeJson(project.files.state, project.state);
  }
  job.status = "failed"; job.completedAt = new Date().toISOString();
  job.error = { code: "production-task-failed", message: reason };
  saveJob(job);
  if (activeProductionTask(project)?.id === id) releaseProductionTask(project, id);
  return job;
}

export function resumeDialogueTask(id) {
  let job = getAgentJob(id);
  if (!job || job.mode !== "dialogue") throw new Error("对话制作任务不存在。");
  const project = loadProject(job.slug, { refresh: false });
  assertProjectMutable(project, "恢复对话制作任务");
  if (job.status === "running") {
    if (activeProductionTask(project)?.id !== id) throw new Error("任务执行锁与记录不一致，不能继续制作。");
    return job;
  }
  if (job.status !== "failed") return job;
  job = retryAgentJob(id, { allowDialogue: true });
  try { startJob(job); } catch (error) { failAgentTask(id, error.message); throw error; }
  return getAgentJob(id);
}

function executionError(error) {
  return {
    code: error?.code ?? "agent-executor-failed",
    message: error instanceof Error ? error.message : String(error),
    ...(Array.isArray(error?.issues) ? { issues: error.issues } : {}),
  };
}

export async function runAgentJob(id, { executor } = {}) {
  const job = getAgentJob(id);
  if (!job) throw new Error(`Agent Job not found: ${id}`);
  if (job.mode === "dialogue") throw new Error("对话任务由当前对话 Agent 制作，不能交给后台执行器。");
  if (job.status === "succeeded") return job;
  if (job.status === "running") throw new Error(`Agent Job is already running: ${id}`);
  assertProjectSlugMutable(job.slug, "执行 Agent Job");
  if (!executor || typeof executor.run !== "function") {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.error = { code: "executor-not-configured", message: "Agent executor is not configured" };
    saveJob(job);
    const project = loadProject(job.slug, { refresh: false });
    if (activeProductionTask(project)?.id === id) releaseProductionTask(project, id);
    return job;
  }

  let execution = null;
  try {
    const project = startJob(job);
    execution = await executor.run({ stage: job.stage, project });
    submitJob(job, execution);
    job.logs = { stdout: execution?.stdout ?? "", stderr: execution?.stderr ?? "" };
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.logs = { stdout: error?.stdout ?? execution?.stdout ?? "", stderr: error?.stderr ?? execution?.stderr ?? "" };
    job.error = executionError(error);
  }
  saveJob(job);
  const finalProject = loadProject(job.slug, { refresh: false });
  const ownsClaim = activeProductionTask(finalProject)?.id === id;
  if (job.status === "failed" && ownsClaim && finalProject.state.stages[job.stage]?.status === "running") {
    finalProject.state.stages[job.stage].status = "failed";
    finalProject.state.stages[job.stage].error = job.error;
    writeJson(finalProject.files.state, finalProject.state);
  }
  if (ownsClaim) releaseProductionTask(finalProject, id);
  return job;
}

export function retryAgentJob(id, { allowDialogue = false } = {}) {
  const job = getAgentJob(id);
  if (!job) throw new Error(`Agent Job not found: ${id}`);
  if (job.mode === "dialogue" && !allowDialogue) throw new Error("对话任务必须使用 production-task resume，由当前对话 Agent 继续制作。");
  if (job.status !== "failed") throw new Error(`Agent Job is not retryable: ${job.status}`);
  const project = loadProject(job.slug, { refresh: true });
  project.taskOwner = job.id;
  assertProjectMutable(project, "重试 Agent Job");
  assertProductionTaskOwner(project, job.id);
  if (!(job.originalStages ?? job.stages ?? [job.stage]).includes(project.state.currentStage)) throw new Error("Agent Job 已经过期，项目阶段已变化");
  job.stage = project.state.currentStage;
  acquireProductionTask(project, { id: job.id, stage: job.stage, mode: job.mode ?? "background" });
  if (project.state.stages[job.stage].status === "failed") retryStage(project, job.stage);
  job.status = "queued";
  job.completedAt = null;
  job.error = null;
  job.result = null;
  job.validatedFingerprints = null;
  return saveJob(job);
}

export function recoverInterruptedAgentJobs() {
  for (const job of listAgentJobs()) {
    if (!["queued", "running"].includes(job.status)) continue;
    if (["dialogue", "cli"].includes(job.mode)) continue;
    if (isCompletedProject(job.slug)) continue;
    if (job.validatedFingerprints) {
      const project = loadProject(job.slug, { refresh: false });
      if ((job.stages ?? [job.stage]).every(stage => project.state.stages[stage]?.status === "succeeded") && activeProductionTask(project)?.id === job.id) {
        try { submitJob(job, { summary: "恢复已校验且已完成的阶段检查点。" }); continue; } catch { /* Preserve the failure and release only this job's claim below. */ }
      }
    }
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.error = { code: "server-restarted", message: "Web Server 重启导致任务中断，可以安全重试。" };
    saveJob(job);
    try {
      const project = loadProject(job.slug, { refresh: false });
      const ownsClaim = activeProductionTask(project)?.id === job.id;
      if (ownsClaim) releaseProductionTask(project, job.id);
      const stage = project.state.stages[job.stage];
      if (ownsClaim && project.state.currentStage === job.stage && stage?.status === "running") {
        stage.status = "failed";
        stage.error = job.error;
        stage.updatedAt = new Date().toISOString();
        project.state.updatedAt = stage.updatedAt;
        writeJson(project.files.state, project.state);
      }
    } catch {
      // 项目可能已被移走；任务记录仍保留中断原因。
    }
  }
}
