import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadProject, projectsRoot, readJson, writeJson } from "./storage.mjs";
import { retryStage, runStage, validateStage } from "./runner.mjs";
import { buildNextAction } from "./reports.mjs";
import { stageIndex } from "./stages.mjs";
import { ensureRemotionTask, getRemotionTask, retryRemotionTask } from "./remotion-tasks.mjs";
import { createRemoteJobMonitor } from "./remote-jobs.mjs";
import { createRemoteRenderExecutor } from "./remote-executor.mjs";
import { createRemotionExecutorFromEnv } from "./remotion-executor.mjs";
import { createTtsExecutorFromEnv } from "./tts-executor.mjs";
import { runSingleStage } from "./single-runner.mjs";
import { getJob } from "./jobs.mjs";
import { REMOTE_JOB_STATUS } from "./remote-status.mjs";

const BATCH_DEFINITIONS = Object.freeze({
  "to-gate-2": Object.freeze({
    type: "to-gate-2",
    label: "批量到 Gate 2",
    targetStage: "gate-2",
    description: "批量推进到 Gate 2，等待人工确认口播与视觉原型。",
    requiresGate2Approval: false,
    requiresTtsQc: false,
    requiresGate3Approval: false,
  }),
  "to-tts": Object.freeze({
    type: "to-tts",
    label: "批量完成 TTS",
    targetStage: "subtitle-timeline",
    description: "批量生成音频、字幕和 Timeline，完成后等待 TTS 质检。",
    requiresGate2Approval: true,
    requiresTtsQc: false,
    requiresGate3Approval: false,
    pauseAfterStage: "subtitle-timeline",
    waitingStatus: "waiting-tts-qc",
    waitingMessage: "TTS 音频、字幕和 Timeline 已生成，等待人工确认发音、语速、停顿和字幕时间。",
  }),
  "to-remotion": Object.freeze({
    type: "to-remotion",
    label: "批量完成 Remotion",
    targetStage: "gate-3",
    description: "批量完成 Remotion 视频实现，等待 Gate 3 预览确认。",
    requiresGate2Approval: true,
    requiresTtsQc: true,
    requiresGate3Approval: false,
    requiresRemotionTask: true,
  }),
  "to-render": Object.freeze({
    type: "to-render",
    label: "批量渲染",
    targetStage: "gate-4",
    description: "批量执行 Smoke Render 和完整渲染，等待 Gate 4 最终确认。",
    requiresGate2Approval: false,
    requiresTtsQc: false,
    requiresGate3Approval: true,
    pauseAfterStage: "smoke-render",
    waitingStatus: "waiting-smoke-qc",
    waitingMessage: "Smoke Render 已完成，等待确认代表帧、短片、字体、资源和音轨。",
  }),
});

const LEGACY_DEFINITIONS = Object.freeze({
  "to-prototype": Object.freeze({
    ...BATCH_DEFINITIONS["to-gate-2"],
    type: "to-prototype",
    label: "批量生成到原型（旧批次）",
  }),
  "to-gate-3": Object.freeze({
    ...BATCH_DEFINITIONS["to-remotion"],
    type: "to-gate-3",
    label: "批量制作到 Gate 3（旧批次）",
    pauseAfterStage: "subtitle-timeline",
    waitingStatus: "waiting-tts-qc",
    waitingMessage: "TTS 音频、字幕和 Timeline 已生成，等待人工确认发音、语速、停顿和字幕时间。",
  }),
});

const ALL_DEFINITIONS = Object.freeze({ ...BATCH_DEFINITIONS, ...LEGACY_DEFINITIONS });
const WAITING_ITEM_STATUSES = new Set([
  "waiting-gate",
  "waiting-tts-qc",
  "waiting-remotion-task",
  "waiting-remote",
  "waiting-smoke-qc",
]);
const activeBatchIds = new Set();

function batchesRoot() {
  return path.resolve(process.env.HARNESS_BATCHES_DIR ?? path.join(projectsRoot(), "..", "batches"));
}

function batchPath(id) {
  return path.join(batchesRoot(), `${id}.json`);
}

function saveBatch(batch) {
  batch.updatedAt = new Date().toISOString();
  writeJson(batchPath(batch.id), batch);
  return batch;
}

function validateType(type) {
  if (!ALL_DEFINITIONS[type]) throw new Error(`Unknown batch type: ${type}`);
  return ALL_DEFINITIONS[type];
}

function validateSlug(slug) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid video slug: ${slug}`);
  }
}

function item(slug, status, message, extra = {}) {
  return {
    slug,
    status,
    phase: null,
    message,
    error: null,
    ttsQcApprovedAt: null,
    remotionTaskId: null,
    smokeQcApprovedAt: null,
    remoteJobId: null,
    startedAt: null,
    completedAt: null,
    updatedAt: new Date().toISOString(),
    ...extra,
  };
}

function projectPathExists(slug) {
  const directory = path.join(projectsRoot(), slug);
  return fs.existsSync(path.join(directory, "project.json"))
    && fs.existsSync(path.join(directory, "state.json"))
    && fs.existsSync(path.join(directory, "artifacts.json"));
}

function isApproved(project, stage, kind = null) {
  const review = project.state.stages[stage]?.review;
  return review?.decision === "approved" && (!kind || review.kind === kind);
}

function preflightItem(type, slug) {
  const definition = validateType(type);
  validateSlug(slug);
  if (!projectPathExists(slug)) {
    return item(slug, "skipped", "Harness 项目尚未初始化。", { preflight: "uninitialized" });
  }

  let project;
  try {
    project = loadProject(slug, { refresh: true });
  } catch (error) {
    return item(slug, "skipped", error instanceof Error ? error.message : String(error), { preflight: "invalid" });
  }

  const current = project.state.currentStage;
  if (current === "completed" || stageIndex(current) > stageIndex(definition.targetStage)) {
    return item(slug, "succeeded", `已超过批次目标阶段 ${definition.targetStage}，不重复执行。`, {
      preflight: "already-reached",
      phase: current,
      completedAt: new Date().toISOString(),
    });
  }

  if (definition.requiresGate2Approval && !isApproved(project, "gate-2")) {
    return item(slug, "skipped", "Gate 2 尚未通过，不能进入当前批次。", { preflight: "gate-2-required" });
  }
  if (definition.requiresTtsQc && !isApproved(project, "subtitle-timeline", "tts-qc")) {
    return item(slug, "skipped", "TTS 质检尚未通过，不能进入 Remotion 批次。", { preflight: "tts-qc-required" });
  }
  if (definition.requiresGate3Approval && !isApproved(project, "gate-3")) {
    return item(slug, "skipped", "Gate 3 尚未通过，不能进入渲染批次。", { preflight: "gate-3-required" });
  }

  return item(slug, "queued", `等待推进到 ${definition.targetStage}。`, { preflight: "eligible", phase: current });
}

function summarize(batch) {
  const counts = Object.fromEntries([
    "queued",
    "running",
    "waiting-gate",
    "waiting-tts-qc",
    "waiting-remote",
    "waiting-smoke-qc",
    "succeeded",
    "failed",
    "skipped",
  ].map((status) => [status, batch.items.filter((entry) => entry.status === status).length]));
  return { total: batch.items.length, counts };
}

function updateItem(batch, target, patch) {
  Object.assign(target, patch, { updatedAt: new Date().toISOString() });
  saveBatch(batch);
}

function refreshBatchStatus(batch) {
  const hasActive = batch.items.some((entry) => entry.status === "queued" || entry.status === "running");
  const hasWaiting = batch.items.some((entry) => WAITING_ITEM_STATUSES.has(entry.status));
  const hasFailed = batch.items.some((entry) => entry.status === "failed");
  batch.status = hasActive ? "running" : hasFailed ? "completed-with-errors" : hasWaiting ? "waiting" : "completed";
  batch.summary = summarize(batch);
  saveBatch(batch);
  return batch;
}

export function batchDefinitions() {
  return Object.values(BATCH_DEFINITIONS);
}

export function createBatch({ type, slugs }) {
  const definition = validateType(type);
  if (definition.type !== type || LEGACY_DEFINITIONS[type]) {
    throw new Error(`Batch type ${type} is retired; use one of ${Object.keys(BATCH_DEFINITIONS).join(", ")}`);
  }
  if (!Array.isArray(slugs) || slugs.length === 0) throw new Error("A batch requires at least one video slug");
  const uniqueSlugs = [...new Set(slugs)];
  const now = new Date().toISOString();
  const batch = {
    schemaVersion: 2,
    id: crypto.randomUUID(),
    type: definition.type,
    label: definition.label,
    description: definition.description,
    targetStage: definition.targetStage,
    status: "queued",
    selectedSlugs: uniqueSlugs,
    items: uniqueSlugs.map((slug) => preflightItem(type, slug)),
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    completedAt: null,
    summary: null,
  };
  batch.summary = summarize(batch);
  return saveBatch(batch);
}

export function getBatch(id) {
  if (!id || !fs.existsSync(batchPath(id))) return null;
  return readJson(batchPath(id));
}

export function listBatches() {
  const root = batchesRoot();
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => readJson(path.join(root, entry)))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function currentProjectStateForBatchItem(slug) {
  if (!projectPathExists(slug)) return null;
  try {
    const project = loadProject(slug, { refresh: false });
    const next = buildNextAction(project);
    return {
      currentStage: next.currentStage,
      status: next.status,
      action: next.action,
      message: next.message,
      ttsQcApproved: project.state.stages["subtitle-timeline"]?.review?.decision === "approved",
    };
  } catch {
    return null;
  }
}

export function batchForView(batch) {
  return {
    ...batch,
    items: batch.items.map((batchItem) => ({
      ...batchItem,
      currentProject: currentProjectStateForBatchItem(batchItem.slug),
    })),
  };
}

export function getBatchForView(id) {
  const batch = getBatch(id);
  return batch ? batchForView(batch) : null;
}

export function listBatchesForView() {
  return listBatches().map(batchForView);
}

function configuredExecutor(factory, environmentKey) {
  if (!process.env[`${environmentKey}_COMMAND`]) return null;
  return factory();
}

function defaultBatchExecutionOptions() {
  const remoteMonitor = createRemoteJobMonitor();
  return {
    executors: {
      "subtitle-timeline": configuredExecutor(createTtsExecutorFromEnv, "HARNESS_TTS_EXECUTOR"),
      remotion: configuredExecutor(createRemotionExecutorFromEnv, "HARNESS_REMOTION_EXECUTOR"),
    },
    remoteMonitor,
    remoteExecutor: createRemoteRenderExecutor({ monitor: remoteMonitor }),
  };
}

function mergeExecutionOptions(options) {
  const defaults = defaultBatchExecutionOptions();
  const remoteMonitor = options.remoteMonitor ?? defaults.remoteMonitor;
  return {
    ...defaults,
    ...options,
    executors: { ...defaults.executors, ...(options.executors ?? {}) },
    remoteMonitor,
    remoteExecutor: options.remoteExecutor ?? createRemoteRenderExecutor({ monitor: remoteMonitor }),
  };
}

function usesInjectedLegacyAdapter(stage, options) {
  return Boolean(options.stageRunner || options.adapters?.[stage]);
}

function remoteJobState(batchItem) {
  if (!batchItem.remoteJobId) return null;
  return getJob(batchItem.slug, batchItem.remoteJobId);
}

async function resolveWaitingRemoteItem(batch, batchItem) {
  if (batchItem.status !== "waiting-remote") return;
  const job = remoteJobState(batchItem);
  if (!job) {
    updateItem(batch, batchItem, {
      status: "failed",
      error: { code: "remote-job-missing", message: "找不到批量任务关联的远程任务。" },
      message: "远程任务记录丢失，无法安全恢复。",
      completedAt: new Date().toISOString(),
    });
    return;
  }

  if (job.status === "succeeded") {
    if (batchItem.phase === "smoke-render") {
      updateItem(batch, batchItem, {
        status: "waiting-smoke-qc",
        message: "Smoke Render 已完成，等待确认代表帧、短片、字体、资源和音轨。",
      });
    } else {
      updateItem(batch, batchItem, {
        status: "queued",
        message: `远程 ${batchItem.phase} 已完成，继续执行下一阶段。`,
      });
    }
    return;
  }

  if (["failed", REMOTE_JOB_STATUS.TIMEOUT].includes(job.status)) {
    updateItem(batch, batchItem, {
      status: "failed",
      error: job.error ?? { code: "remote-job-failed", message: `远程 ${batchItem.phase} 执行失败。` },
      message: "该视频远程任务失败，其他视频继续。",
      completedAt: new Date().toISOString(),
    });
    return;
  }

  updateItem(batch, batchItem, {
    message: job.error?.message ?? `等待远程 ${batchItem.phase} 任务完成。`,
  });
}

function waitForBatchCheckpoint(batch, batchItem, definition, stage) {
  if (definition.pauseAfterStage !== stage) return false;
  updateItem(batch, batchItem, {
    status: definition.waitingStatus,
    phase: stage,
    message: definition.waitingMessage,
  });
  return true;
}

async function executeItem(batch, batchItem, definition, options) {
  if (batchItem.status !== "queued") return;
  const now = new Date().toISOString();
  updateItem(batch, batchItem, { status: "running", startedAt: batchItem.startedAt ?? now, message: "正在执行批次阶段。" });

  try {
    while (true) {
      const project = loadProject(batchItem.slug, { refresh: true });
      const currentStage = project.state.currentStage;
      batchItem.phase = currentStage;

      if (currentStage === "completed" || stageIndex(currentStage) > stageIndex(definition.targetStage)) {
        updateItem(batch, batchItem, { status: "succeeded", phase: currentStage, message: "已到达或超过批次目标阶段。", completedAt: new Date().toISOString() });
        return;
      }

      if (currentStage === definition.targetStage && project.state.stages[currentStage].status === "waiting") {
        updateItem(batch, batchItem, { status: "waiting-gate", phase: currentStage, message: `等待人工确认 ${currentStage}。` });
        return;
      }

      const stageItem = project.state.stages[currentStage];
      if (stageItem.status === "failed") {
        throw new Error(stageItem.error?.message ?? `${currentStage} 执行失败。`);
      }
      if (stageItem.status !== "ready") {
        throw new Error(`${currentStage} 当前状态为 ${stageItem.status}，无法继续批量执行。`);
      }

      if (currentStage === "remotion" && definition.requiresRemotionTask) {
        const issues = validateStage(project, "remotion");
        if (issues.length > 0 && !options.executors?.remotion) {
          const task = ensureRemotionTask({ slug: batchItem.slug, batchId: batch.id });
          updateItem(batch, batchItem, {
            status: "waiting-remotion-task",
            phase: currentStage,
            remotionTaskId: task.id,
            message: "Remotion 制作任务已创建，等待 Agent 生成配置和主组件。",
          });
          return;
        }
      }

      const result = usesInjectedLegacyAdapter(currentStage, options)
        ? await (options.stageRunner ?? runStage)(project, currentStage, { adapters: options.adapters ?? {} })
        : await runSingleStage(project, currentStage, {
          adapters: options.adapters ?? {},
          ttsExecutor: options.executors?.["subtitle-timeline"],
          remotionExecutor: options.executors?.remotion,
          remotionTaskId: batchItem.remotionTaskId,
          remotionTaskBatchId: batch.id,
          remoteExecutor: options.remoteExecutor,
        });

      if (currentStage === "remotion" && result?.completed === false) {
        if (result.task?.status === "failed") {
          throw Object.assign(new Error(result.task.error?.message ?? "Remotion 制作任务失败。"), result.task.error ?? {});
        }
        updateItem(batch, batchItem, {
          status: "waiting-remotion-task",
          phase: currentStage,
          remotionTaskId: result.task?.id ?? batchItem.remotionTaskId,
          message: result.task?.message ?? "Remotion 制作任务尚未完成，等待 Agent 继续。",
        });
        return;
      }

      if (result?.deferred && result.job?.id) {
        updateItem(batch, batchItem, {
          status: "waiting-remote",
          phase: currentStage,
          remoteJobId: result.job.id,
          message: `远程 ${currentStage} 任务已提交，等待任务完成。`,
        });
        return;
      }

      updateItem(batch, batchItem, { phase: currentStage, message: `已完成 ${currentStage}。` });

      if (waitForBatchCheckpoint(batch, batchItem, definition, currentStage)) return;
      if (result?.status === "waiting") {
        if (currentStage === definition.targetStage) {
          updateItem(batch, batchItem, { status: "waiting-gate", phase: currentStage, message: `等待人工确认 ${currentStage}。` });
        } else {
          throw new Error(`批次在前置 Gate ${currentStage} 处暂停。`);
        }
        return;
      }
    }
  } catch (error) {
    updateItem(batch, batchItem, {
      status: "failed",
      error: { message: error instanceof Error ? error.message : String(error), phase: batchItem.phase },
      message: "该视频执行失败，其他视频继续。",
      completedAt: new Date().toISOString(),
    });
  }
}

export async function runBatch(id, options = {}) {
  const batch = getBatch(id);
  if (!batch) throw new Error(`Batch not found: ${id}`);
  if (activeBatchIds.has(id)) return batch;
  const definition = validateType(batch.type);
  const executionOptions = mergeExecutionOptions(options);
  activeBatchIds.add(id);
  batch.startedAt ??= new Date().toISOString();
  batch.status = "running";
  for (const batchItem of batch.items) {
    if (batchItem.status === "running") {
      batchItem.status = "queued";
      batchItem.message = "检测到上次批次中断，已恢复到队列。";
    }
    if (batchItem.status === "waiting-remotion-task" && batchItem.remotionTaskId) {
      const task = getRemotionTask(batchItem.remotionTaskId);
      if (task?.status === "completed") {
        batchItem.status = "queued";
        batchItem.message = "Remotion 制作任务已完成，继续执行阶段校验。";
      }
    }
  }
  saveBatch(batch);
  try {
    if (typeof executionOptions.remoteMonitor?.poll === "function") {
      await executionOptions.remoteMonitor.poll();
    }
    for (const batchItem of batch.items) {
      await resolveWaitingRemoteItem(batch, batchItem);
    }
    for (const batchItem of batch.items) {
      await executeItem(batch, batchItem, definition, executionOptions);
    }
    batch.completedAt = new Date().toISOString();
    return refreshBatchStatus(batch);
  } finally {
    activeBatchIds.delete(id);
  }
}

function approveProjectReview(slug, stage, kind) {
  const project = loadProject(slug, { refresh: true });
  if (project.state.stages[stage]?.status !== "succeeded") {
    throw new Error(`${slug} 的 ${stage} 尚未完成，不能确认质检`);
  }
  if (project.state.stages[stage].review?.decision === "approved") return;
  project.state.stages[stage].review = {
    kind,
    decision: "approved",
    reviewedAt: new Date().toISOString(),
  };
  writeJson(project.files.state, project.state);
}

function approveTtsBatchItem(batch, target) {
  target.ttsQcApprovedAt = new Date().toISOString();
  target.status = "queued";
  target.message = "TTS 质检已确认，等待继续执行。";
  saveBatch(batch);
}

export function approveTtsQc(id, slug) {
  const batch = getBatch(id);
  if (!batch) throw new Error(`Batch not found: ${id}`);
  const target = batch.items.find((entry) => entry.slug === slug);
  if (!target) throw new Error(`Video is not part of batch: ${slug}`);
  if (target.status !== "waiting-tts-qc") throw new Error(`${slug} is not waiting for TTS quality review`);
  approveProjectReview(slug, "subtitle-timeline", "tts-qc");
  approveTtsBatchItem(batch, target);
  return batch;
}

export async function approveTtsQcForProject(slug) {
  approveProjectReview(slug, "subtitle-timeline", "tts-qc");
  const resumedBatches = [];
  for (const batch of listBatches()) {
    if (batch.type !== "to-tts") continue;
    const target = batch.items.find((entry) => entry.slug === slug && entry.status === "waiting-tts-qc");
    if (!target) continue;
    approveTtsBatchItem(batch, target);
    resumedBatches.push(await runBatch(batch.id));
  }
  return {
    project: loadProject(slug, { refresh: true }),
    batches: resumedBatches,
  };
}

export function approveSmokeQc(id, slug) {
  const batch = getBatch(id);
  if (!batch) throw new Error(`Batch not found: ${id}`);
  const target = batch.items.find((entry) => entry.slug === slug);
  if (!target) throw new Error(`Video is not part of batch: ${slug}`);
  if (target.status !== "waiting-smoke-qc") throw new Error(`${slug} is not waiting for Smoke Render review`);
  approveProjectReview(slug, "smoke-render", "smoke-qc");
  target.smokeQcApprovedAt = new Date().toISOString();
  target.status = "queued";
  target.message = "Smoke Render 已确认，等待继续完整渲染。";
  saveBatch(batch);
  return batch;
}

export function retryFailedBatchItems(id) {
  const batch = getBatch(id);
  if (!batch) throw new Error(`Batch not found: ${id}`);
  for (const target of batch.items) {
    if (target.status !== "failed") continue;
    const project = loadProject(target.slug, { refresh: true });
    const failedStage = project.state.currentStage;
    if (project.state.stages[failedStage]?.status === "failed") retryStage(project, failedStage);
    if (target.remotionTaskId) {
      const task = getRemotionTask(target.remotionTaskId);
      if (["failed", "blocked"].includes(task?.status)) retryRemotionTask(target.remotionTaskId);
    }
    target.status = "queued";
    target.error = null;
    target.message = "已加入批次重试队列。";
    target.completedAt = null;
  }
  batch.status = "queued";
  saveBatch(batch);
  return batch;
}
