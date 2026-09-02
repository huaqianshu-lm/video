import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildTaskPacket } from "./context.mjs";
import { retryStage, runStage } from "./runner.mjs";
import { loadProject, projectsRoot, readJson, writeJson } from "./storage.mjs";
import { STAGE_DEFINITIONS } from "./stages.mjs";

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function jobsRoot() {
  return path.resolve(process.env.HARNESS_AGENT_JOBS_DIR ?? path.join(projectsRoot(), "..", "agent-jobs"));
}

function jobPath(id) {
  return path.join(jobsRoot(), `${id}.json`);
}

function saveJob(job) {
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

export function createAgentJob({ slug, stage, batchId = null }) {
  const existing = findActiveAgentJob(slug, stage);
  if (existing) {
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
  if (STAGE_DEFINITIONS[stage]?.executor !== "agent" || stage === "remotion") {
    throw new Error(`${stage} 不使用通用 Agent Job`);
  }
  const now = new Date().toISOString();
  return saveJob({
    schemaVersion: 1,
    id: crypto.randomUUID(),
    kind: "video-agent-job",
    slug,
    stage,
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
  });
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
  if (job.status === "running") throw new Error(`Agent Job is already running: ${id}`);
  if (!executor || typeof executor.run !== "function") {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.error = { code: "executor-not-configured", message: "Agent executor is not configured" };
    return saveJob(job);
  }

  let project = loadProject(job.slug, { refresh: true });
  if (project.state.currentStage !== job.stage) {
    throw new Error(`Agent Job stage is stale: expected ${job.stage}, current ${project.state.currentStage}`);
  }
  if (project.state.stages[job.stage].status === "failed") {
    retryStage(project, job.stage);
    project = loadProject(job.slug, { refresh: false });
  }
  if (project.state.stages[job.stage].status !== "ready") {
    throw new Error(`Agent Job stage is not ready: ${project.state.stages[job.stage].status}`);
  }

  job.status = "running";
  job.attempts += 1;
  job.startedAt = new Date().toISOString();
  job.completedAt = null;
  job.error = null;
  saveJob(job);

  let execution = null;
  const capturingExecutor = {
    async run(context) {
      execution = await executor.run(context);
      return execution;
    },
  };
  try {
    const stageResult = await runStage(project, job.stage, { executors: { [job.stage]: capturingExecutor } });
    job.status = "succeeded";
    job.completedAt = new Date().toISOString();
    job.result = { stageResult, outputs: execution?.outputs ?? [] };
    job.logs = { stdout: execution?.stdout ?? "", stderr: execution?.stderr ?? "" };
    job.error = null;
  } catch (error) {
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.logs = { stdout: error?.stdout ?? execution?.stdout ?? "", stderr: error?.stderr ?? execution?.stderr ?? "" };
    job.error = executionError(error);
  }
  return saveJob(job);
}

export function retryAgentJob(id) {
  const job = getAgentJob(id);
  if (!job) throw new Error(`Agent Job not found: ${id}`);
  if (job.status !== "failed") throw new Error(`Agent Job is not retryable: ${job.status}`);
  const project = loadProject(job.slug, { refresh: true });
  if (project.state.currentStage !== job.stage) throw new Error("Agent Job 已经过期，项目阶段已变化");
  if (project.state.stages[job.stage].status === "failed") retryStage(project, job.stage);
  job.status = "queued";
  job.completedAt = null;
  job.error = null;
  job.result = null;
  return saveJob(job);
}

export function recoverInterruptedAgentJobs() {
  for (const job of listAgentJobs()) {
    if (job.status !== "running") continue;
    job.status = "failed";
    job.completedAt = new Date().toISOString();
    job.error = { code: "server-restarted", message: "Web Server 重启导致任务中断，可以安全重试。" };
    saveJob(job);
    try {
      const project = loadProject(job.slug, { refresh: false });
      const stage = project.state.stages[job.stage];
      if (project.state.currentStage === job.stage && stage?.status === "running") {
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
