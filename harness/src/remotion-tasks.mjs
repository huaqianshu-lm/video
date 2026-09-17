import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildTaskPacket } from "./context.mjs";
import { assertProjectMutable, assertProjectSlugMutable, isCompletedProject, loadProject, projectsRoot, readJson, writeJson } from "./storage.mjs";
import { validateStage } from "./runner.mjs";
import { fingerprintStageArtifacts } from "./fingerprints.mjs";
import { prepareRenderInputEntry } from "./render-input.mjs";

const TASK_STATUSES = new Set(["ready", "in-progress", "blocked", "completed", "failed"]);

function tasksRoot() {
  return path.resolve(process.env.HARNESS_REMOTION_TASKS_DIR ?? path.join(projectsRoot(), "..", "remotion-tasks"));
}

function taskPath(id) {
  return path.join(tasksRoot(), `${id}.json`);
}

function saveTask(task) {
  assertProjectSlugMutable(task.slug, "写入 Remotion 任务");
  task.updatedAt = new Date().toISOString();
  writeJson(taskPath(task.id), task);
  return task;
}

function taskMatches(task, { slug, batchId } = {}) {
  return (!slug || task.slug === slug) && (!batchId || task.batchId === batchId);
}

function stageAvailability(task, { refresh = false } = {}) {
  try {
    const project = loadProject(task.slug, { refresh });
    const currentStage = project.state.currentStage;
    const remotionStatus = project.state.stages.remotion?.status ?? "missing";
    return {
      allowed: currentStage === "remotion" && remotionStatus === "ready",
      currentStage,
      remotionStatus,
    };
  } catch {
    return { allowed: false, currentStage: "unavailable", remotionStatus: "unavailable" };
  }
}

export function assertRemotionTaskStageReady(task, operation = "执行 Remotion 任务") {
  const availability = stageAvailability(task, { refresh: true });
  if (availability.allowed) return availability;
  const error = new Error(
    `${task.slug} 当前为 ${availability.currentStage} / ${availability.remotionStatus}，只有 remotion / ready 才能${operation}。`,
  );
  error.code = "remotion-stage-not-ready";
  error.slug = task.slug;
  error.currentStage = availability.currentStage;
  error.remotionStatus = availability.remotionStatus;
  throw error;
}

export function remotionTaskForView(task) {
  const availability = stageAvailability(task);
  return {
    ...task,
    stageActionAllowed: availability.allowed,
    stageActionReason: availability.allowed
      ? null
      : `项目当前为 ${availability.currentStage} / ${availability.remotionStatus}，旧 Remotion 任务只保留查看。`,
  };
}

function refreshTaskPacket(task) {
  const project = loadProject(task.slug, { refresh: true });
  const packet = buildTaskPacket(project);
  return {
    ...task,
    inputStages: packet.task.inputStages,
    inputArtifacts: packet.task.inputArtifacts,
    outputArtifacts: packet.task.outputArtifacts,
    validation: packet.task.validation,
    manualChecks: packet.task.manualChecks,
    context: packet.context,
    commands: packet.task.commands,
  };
}

export function listRemotionTasks(filters = {}) {
  const root = tasksRoot();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => readJson(path.join(root, entry)))
    .filter((task) => task.stage === "remotion" && taskMatches(task, filters))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getRemotionTask(id) {
  if (!id || !fs.existsSync(taskPath(id))) return null;
  return readJson(taskPath(id));
}

export function ensureRemotionTask({ slug, batchId }) {
  assertProjectSlugMutable(slug, "创建 Remotion 任务");
  const project = loadProject(slug, { refresh: true });
  assertRemotionTaskStageReady({ slug }, "创建 Remotion 任务");
  const existing = listRemotionTasks({ slug, batchId })
    .find((task) => TASK_STATUSES.has(task.status) && task.status !== "failed" && task.status !== "completed");
  if (existing) return existing;

  const packet = buildTaskPacket(project);
  const now = new Date().toISOString();
  return saveTask({
    schemaVersion: 1,
    id: crypto.randomUUID(),
    kind: "remotion-production-task",
    stage: "remotion",
    slug,
    batchId,
    status: "ready",
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    error: null,
    inputStages: packet.task.inputStages,
    inputArtifacts: packet.task.inputArtifacts,
    outputArtifacts: packet.task.outputArtifacts,
    validation: packet.task.validation,
    manualChecks: packet.task.manualChecks,
    context: packet.context,
    commands: packet.task.commands,
  });
}

export function startRemotionTask(id) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "启动 Remotion 任务");
  assertRemotionTaskStageReady(task, "启动 Remotion 任务");
  if (!["ready", "blocked"].includes(task.status)) {
    if (task.status === "in-progress") return task;
    throw new Error(`Remotion task is not startable: ${task.status}`);
  }
  task.status = "in-progress";
  task.startedAt ??= new Date().toISOString();
  task.error = null;
  return saveTask(task);
}

function blockedTask(id, error) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "阻塞 Remotion 任务");
  task.status = "blocked";
  task.error = {
    code: error?.code ?? "remotion-task-blocked",
    message: error instanceof Error ? error.message : String(error?.message ?? error),
  };
  task.completedAt = null;
  return saveTask(task);
}

export function blockRemotionTask(id, error) {
  return blockedTask(id, error);
}

function failRemotionTask(id, error) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "记录 Remotion 任务失败");
  task.status = "failed";
  task.error = {
    code: error?.code ?? "remotion-executor-failed",
    message: error instanceof Error ? error.message : String(error),
    ...(error?.stdout ? { stdout: error.stdout } : {}),
    ...(error?.stderr ? { stderr: error.stderr } : {}),
  };
  task.completedAt = new Date().toISOString();
  return saveTask(task);
}

export async function runRemotionTask(id, { executor } = {}) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "执行 Remotion 任务");
  if (task.status === "completed") return { task, completed: true, issues: [] };
  if (task.status === "in-progress") {
    throw new Error(`Remotion task is already in progress: ${id}`);
  }
  assertRemotionTaskStageReady(task);
  if (!executor || typeof executor.run !== "function") {
    const error = new Error("Remotion executor is not configured");
    error.code = "executor-not-configured";
    const blocked = blockedTask(id, error);
    return { task: blocked, completed: false, issues: [error] };
  }

  const started = startRemotionTask(id);
  try {
    const project = loadProject(started.slug, { refresh: true });
    const execution = await executor.run({ stage: "remotion", project, task: started });
    const completed = completeRemotionTask(id);
    return { ...completed, execution };
  } catch (error) {
    return {
      task: failRemotionTask(id, error),
      completed: false,
      issues: [error],
    };
  }
}

export function recoverInterruptedRemotionTasks() {
  for (const task of listRemotionTasks()) {
    if (task.status !== "in-progress") continue;
    if (isCompletedProject(task.slug)) continue;
    blockedTask(task.id, {
      code: "server-restarted",
      message: "Web Server 重启导致 Remotion 任务中断，可以安全重试。",
    });
  }
}

export function completeRemotionTask(id) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "完成 Remotion 任务");
  if (task.status === "completed") return { task, issues: [], completed: true };
  assertRemotionTaskStageReady(task, "完成 Remotion 任务");
  if (!["ready", "in-progress"].includes(task.status)) {
    throw new Error(`Remotion task cannot be completed from status: ${task.status}`);
  }

  const project = loadProject(task.slug, { refresh: true });
  let renderInput;
  try {
    renderInput = prepareRenderInputEntry(project);
  } catch (error) {
    task.status = "blocked";
    task.error = {
      code: error?.code ?? "render-input-preparation-failed",
      message: error instanceof Error ? error.message : String(error),
      ...(error?.issues ? { issues: error.issues } : {}),
    };
    task.completedAt = null;
    saveTask(task);
    return { task, issues: [error], completed: false };
  }
  const issues = validateStage(project, "remotion");
  if (issues.length > 0) {
    task.status = "blocked";
    task.error = {
      code: "validation-failed",
      message: `${issues.length} Remotion 校验问题仍未解决。`,
      issues,
    };
    saveTask(task);
    return { task, issues, completed: false };
  }

  const remotionState = project.state.stages.remotion;
  const currentFingerprint = fingerprintStageArtifacts(project, "remotion");
  if (remotionState.invalidatedBy === "gate-3-rejected"
    && remotionState.rebuildBaselineFingerprint
    && currentFingerprint === remotionState.rebuildBaselineFingerprint) {
    const error = {
      code: "remotion-unchanged-after-gate-rejection",
      message: "Gate 3 驳回后 Remotion 产物没有变化，不能直接重新进入 Gate 3。",
    };
    task.status = "blocked";
    task.error = error;
    saveTask(task);
    return { task, issues: [error], completed: false };
  }

  task.status = "completed";
  task.completedAt = new Date().toISOString();
  task.error = null;
  task.renderInput = {
    compositionId: renderInput.manifest.compositionId,
    packageFingerprint: renderInput.manifest.packageFingerprint,
    archiveSha256: renderInput.archiveSha256,
    entry: renderInput.manifest.entry,
    entryPath: "src/RenderInputRoot.tsx",
  };
  saveTask(task);
  return { task, issues: [], completed: true, renderInput: task.renderInput };
}

export function retryRemotionTask(id) {
  const task = getRemotionTask(id);
  if (!task) throw new Error(`Remotion task not found: ${id}`);
  assertProjectSlugMutable(task.slug, "重试 Remotion 任务");
  assertRemotionTaskStageReady(task, "重试 Remotion 任务");
  if (!["blocked", "failed"].includes(task.status)) {
    throw new Error(`Remotion task is not retryable: ${task.status}`);
  }
  const refreshed = refreshTaskPacket(task);
  Object.assign(task, refreshed);
  task.status = "ready";
  task.error = null;
  task.completedAt = null;
  return saveTask(task);
}
