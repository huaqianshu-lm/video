const ACTIONS = new Set([
  "initialize", "legacy-validate", "validate", "next", "report", "context", "plan", "run", "retry", "resume",
  "approve", "reject", "approve-tts-qc", "run-to-gate-2", "prepare-remote-render", "remote-run", "find-historical", "adopt-historical",
]);

import { artifactManifestFor } from "../../artifacts.mjs";
import { approveTtsQcForProject, createBatch, findActiveBatchForProject, getBatchForView, stopBatchesAfterGateRejection, runBatch } from "../../batches.mjs";
import { buildTaskPacket } from "../../context.mjs";
import { buildGitRenderCommitPlan, commitAndPushRenderDelivery, validateGitRenderDelivery } from "../../git-delivery.mjs";
import { requireGitHubActionsConfig } from "../../github-config.mjs";
import { buildProjectPlan } from "../../plans.mjs";
import { getVideoProject } from "../../project-view.mjs";
import { buildNextAction, buildProjectReport } from "../../reports.mjs";
import { ensureRemotionTask, listRemotionTasks } from "../../remotion-tasks.mjs";
import { assertRemoteRenderDeliveryInputs, prepareRemoteRenderInputs, validateRemoteRenderPackage } from "../../remote-executor.mjs";
import { initializeProject, loadProject } from "../../storage.mjs";
import { STAGE_DEFINITIONS } from "../../stages.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "../../runner.mjs";
import { validateProjectStage } from "../../validation.mjs";
import { createAgentJob } from "../../agent-jobs.mjs";
import { findActiveJob } from "../../jobs.mjs";

export function normalizeProjectAction(input = {}) {
  return {
    slug: input.slug,
    action: input.action,
    stage: input.stage ?? null,
    gate: input.gate ?? null,
    returnTo: input.returnTo ?? null,
    reason: input.reason ?? null,
    runId: input.runId ?? null,
    commitAndPush: input.commitAndPush === true,
    confirmDelivery: input.confirmDelivery === true,
  };
}

export function isSupportedProjectAction(action) {
  return ACTIONS.has(action);
}

export async function executeProjectAction(input, runtime) {
  const action = normalizeProjectAction(input);
  if (!isSupportedProjectAction(action.action)) {
    const error = new Error(`Unknown action: ${action.action ?? "missing"}`);
    error.code = "unknown-project-action";
    throw error;
  }
  if (typeof runtime?.executeProjectAction !== "function") {
    throw new Error("Project action runtime is not configured");
  }
  return runtime.executeProjectAction(action);
}

export function createProjectActionService(runtime) {
  return {
    async execute(input) {
      const action = normalizeProjectAction(input);
      if (!isSupportedProjectAction(action.action)) {
        const error = new Error(`Unknown action: ${action.action ?? "missing"}`);
        error.code = "unknown-project-action";
        throw error;
      }
      const projectView = getVideoProject(action.slug);
      if (!projectView) {
        const error = new Error("Video project not found");
        error.code = "video-project-not-found";
        throw error;
      }
      if (action.action === "initialize") {
        if (projectView.initialized) { const error = new Error("Harness project is already initialized"); error.code = "project-already-initialized"; throw error; }
        return { status: 200, result: { action: action.action, status: "initialized", files: initializeProject(action.slug) }, project: getVideoProject(action.slug) };
      }
      if (action.action === "legacy-validate") {
        const stage = action.stage ?? "remotion";
        const legacyProject = { config: { slug: action.slug, workspaceRoot: process.cwd(), validationPolicy: "legacy" }, artifacts: { stages: artifactManifestFor(action.slug) } };
        const stages = action.stage ? [stage] : ["scene-script", "narration-script", "tts", "subtitle-timeline", "visual-prototype", "remotion"];
        return { status: 200, result: { action: action.action, readOnly: true, validationPolicy: "legacy", stages, issues: stages.flatMap((item) => validateProjectStage(legacyProject, item)) }, project: projectView };
      }
      if (!projectView.initialized) {
        if (action.action === "next") return { status: 200, result: projectView.next, project: projectView };
        const error = new Error("Initialize the Harness project before this action"); error.code = "project-not-initialized"; throw error;
      }
      if (action.action === "find-historical" || action.action === "adopt-historical") {
        if (!["smoke-render", "render"].includes(action.stage)) { const error = new Error(`${action.action} only supports smoke-render and render`); error.code = "invalid-historical-stage"; throw error; }
        requireGitHubActionsConfig();
        if (action.action === "find-historical") return { status: 200, result: { action: action.action, stage: action.stage, candidates: await runtime.remoteJobMonitor.findHistorical({ slug: action.slug, stage: action.stage }) }, project: getVideoProject(action.slug) };
        if (action.runId === null) { const error = new Error("adopt-historical requires runId"); error.code = "historical-run-required"; throw error; }
        const job = await runtime.remoteJobMonitor.adoptHistorical({ slug: action.slug, stage: action.stage, runId: action.runId });
        return { status: 200, result: { action: action.action, stage: action.stage, status: "succeeded" }, job, project: getVideoProject(action.slug) };
      }
      if (action.action === "run-to-gate-2") {
        const active = findActiveBatchForProject("to-gate-2", action.slug); const batch = active ?? createBatch({ type: "to-gate-2", slugs: [action.slug] });
        void runBatch(batch.id, { queueAgentJob: runtime.queueAgentJob }).catch(() => {});
        return { status: 202, result: { action: action.action, status: active ? "already-running" : "queued" }, batch: getBatchForView(batch.id) };
      }
      if (action.action === "remote-run") return this.remoteRun(action);
      if (action.action === "prepare-remote-render") return this.prepareRemote(action);

      const project = loadProject(action.slug, { refresh: true });
      let result; let status = 200;
      switch (action.action) {
        case "validate": result = { action: action.action, stage: action.stage ?? project.state.currentStage, issues: validateStage(project, action.stage) }; break;
        case "next": result = buildNextAction(project); break;
        case "report": result = buildProjectReport(project); break;
        case "context": result = buildTaskPacket(project); break;
        case "plan": if (!input.until) { const error = new Error("plan requires until"); error.code = "plan-target-required"; throw error; } result = buildProjectPlan(project, input.until); break;
        case "run": {
          const stage = action.stage ?? project.state.currentStage;
          if (STAGE_DEFINITIONS[stage]?.executor === "agent") {
            if (stage === "remotion") {
              const needsBuild = validateStage(project, "remotion").length > 0 || project.state.stages.remotion.invalidatedBy === "gate-3-rejected";
              if (!needsBuild) { const stageResult = runStage(project, "remotion", { adapters: {} }); const gateResult = runStage(loadProject(action.slug, { refresh: true }), "gate-3", { adapters: {} }); result = { action: action.action, status: "succeeded", stageResult, gateResult }; break; }
              const task = ensureRemotionTask({ slug: action.slug, batchId: null }); runtime.queueRemotionTask(task.id); status = 202; result = { action: action.action, status: "queued", taskId: task.id }; return { status, result, task, project: getVideoProject(action.slug) };
            }
            const job = createAgentJob({ slug: action.slug, stage }); runtime.queueAgentJob(job.id); status = 202; return { status, result: { action: action.action, status: "queued", jobId: job.id }, job, project: getVideoProject(action.slug) };
          }
          result = await runStage(project, stage, { adapters: {} }); break;
        }
        case "approve":
          if ((action.gate ?? action.stage) === "gate-3") { const task = listRemotionTasks({ slug: action.slug })[0]; if (task && task.status !== "completed") { const error = new Error("Gate 3 暂无可验证的新 Remotion 产物，请先执行或重试 Agent 并完成产物校验。"); error.code = "remotion-output-required"; throw error; } }
          result = approveGate(project, action.gate ?? action.stage); break;
        case "approve-tts-qc": result = await approveTtsQcForProject(action.slug); break;
        case "reject":
          result = rejectGate(project, action.gate ?? action.stage, action.returnTo, action.reason);
          if (result.stage === "gate-2") result.stoppedBatchIds = stopBatchesAfterGateRejection({ slug: action.slug, gate: result.stage, returnTo: result.returnTo, reason: result.reason });
          if (result.stage === "gate-3" && result.returnTo === "remotion") { const task = ensureRemotionTask({ slug: action.slug, batchId: null }); result = { ...result, status: task.status === "in-progress" ? "already-running" : "queued", taskId: task.id }; if (task.status !== "in-progress") runtime.queueRemotionTask(task.id); status = 202; }
          break;
        case "retry": result = retryStage(project, action.stage); break;
        case "resume": result = resumeProject(project); break;
        default: { const error = new Error(`Unknown action: ${action.action ?? "missing"}`); error.code = "unknown-project-action"; throw error; }
      }
      return { status, result, project: getVideoProject(action.slug) };
    },
    async remoteRun(action) {
      if (!["smoke-render", "render"].includes(action.stage)) { const error = new Error("remote-run only supports smoke-render and render"); error.code = "invalid-remote-stage"; throw error; }
      requireGitHubActionsConfig();
      const active = findActiveJob(action.slug, action.stage);
      if (active) return { status: 200, result: { action: action.action, status: "already-running" }, job: active };
      const project = loadProject(action.slug, { refresh: true }); prepareRemoteRenderInputs(project); const inputIssues = validateRemoteRenderPackage(project);
      if (inputIssues.length) { const error = new Error(`远程渲染输入预检失败：${inputIssues.join("；")}`); error.code = "remote-render-inputs-invalid"; error.issues = inputIssues; throw error; }
      const deliveryIssues = validateGitRenderDelivery(project);
      if (deliveryIssues.length && !(action.stage === "smoke-render" && action.commitAndPush && action.confirmDelivery)) {
        if (action.stage === "smoke-render" && !action.commitAndPush) return { status: 200, result: { action: action.action, status: "needs-confirmation" }, error: `远程渲染交付预检失败：${deliveryIssues.join("；")}`, code: "git-render-commit-confirmation-required", issues: deliveryIssues, commitPlan: buildGitRenderCommitPlan(project), project: getVideoProject(action.slug) };
        const error = new Error(`远程渲染交付预检失败：${deliveryIssues.join("；")}`); error.code = "remote-render-delivery-invalid"; error.issues = deliveryIssues; throw error;
      }
      let delivery = null; if (deliveryIssues.length) { delivery = commitAndPushRenderDelivery(project); assertRemoteRenderDeliveryInputs(loadProject(action.slug, { refresh: true })); } else assertRemoteRenderDeliveryInputs(project);
      const job = runtime.remoteJobMonitor.submit({ slug: action.slug, stage: action.stage }); return { status: 202, result: { action: action.action, status: "queued", delivery }, job };
    },
    async prepareRemote(action) {
      const stage = action.stage; if (!["smoke-render", "render"].includes(stage)) { const error = new Error("prepare-remote-render only supports smoke-render and render"); error.code = "invalid-remote-stage"; throw error; }
      const project = loadProject(action.slug, { refresh: true }); const preparation = prepareRemoteRenderInputs(project); try { assertRemoteRenderDeliveryInputs(project); return { status: 200, result: { action: action.action, status: "ready", preparation }, project: getVideoProject(action.slug) }; } catch (error) { if (error.code === "remote-render-delivery-invalid") return { status: 200, result: { action: action.action, status: "blocked" }, error: error.message, code: error.code, issues: error.issues ?? [], project: getVideoProject(action.slug) }; throw error; }
    },
  };
}
