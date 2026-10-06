const ACTIONS = new Set([
  "initialize", "legacy-validate", "validate", "next", "report", "context", "plan", "run", "retry", "resume",
  "approve", "reject", "approve-tts-qc", "run-to-gate-2", "prepare-remote-render", "resume-render-delivery", "bind-render-input", "remote-run", "find-historical", "adopt-historical",
  "prepare-storyboard-migration", "start-storyboard-migration",
]);

import { artifactManifestFor } from "../../artifacts.mjs";
import { prepareStoryboardMigration, startStoryboardMigration, storyboardMigrationPlanView } from "../../storyboard-migration.mjs";
import { usesUnifiedProduction } from "../../production-contract.mjs";
import { approveTtsQcForProject, createBatch, findActiveBatchForProject, getBatchForView, stopBatchesAfterGateRejection, runBatch } from "../../batches.mjs";
import { buildTaskPacket } from "../../context.mjs";
import { runRenderDelivery } from "../../render-delivery.mjs";
import { requireGitHubActionsConfig } from "../../github-config.mjs";
import { buildProjectPlan } from "../../plans.mjs";
import { getVideoProject } from "../../project-view.mjs";
import { buildNextAction, buildProjectReport } from "../../reports.mjs";
import { ensureRemotionTask, listRemotionTasks } from "../../remotion-tasks.mjs";
import { bindRenderInputDelivery } from "../../render-input.mjs";
import { assertProjectMutable, initializeProject, loadProject } from "../../storage.mjs";
import { workflowStageDefinition } from "../../workflows/registry.mjs";
import { approveGate, rejectGate, resumeProject, retryStage, runStage, validateStage } from "../../runner.mjs";
import { validateProjectStage } from "../../validation.mjs";
import { createAgentJob } from "../../agent-jobs.mjs";
import { findActiveJob } from "../../jobs.mjs";

export function normalizeProjectAction(input = {}) {
  return {
    slug: input.slug,
    ...(typeof input.productionContract === "string" ? { productionContract: input.productionContract } : {}),
    action: input.action,
    stage: input.stage ?? null,
    gate: input.gate ?? null,
    returnTo: input.returnTo ?? null,
    reason: input.reason ?? null,
    ...(typeof input.reviewVersion === "string" ? { reviewVersion: input.reviewVersion } : {}),
    ...(typeof input.migrationVersion === "string" ? { migrationVersion: input.migrationVersion } : {}),
    runId: input.runId ?? null,
    commitAndPush: input.commitAndPush === true,
    confirmDelivery: input.confirmDelivery === true,
    deliveryPlanId: typeof input.deliveryPlanId === "string" ? input.deliveryPlanId : null,
    selectedPaths: Array.isArray(input.selectedPaths) ? input.selectedPaths : null,
    approveGate3: input.approveGate3 === true,
    renderInputUrl: typeof input.renderInputUrl === "string" ? input.renderInputUrl : null,
    renderInputSha256: typeof input.renderInputSha256 === "string" ? input.renderInputSha256 : null,
    ...(typeof input.workflow === "string" ? { workflow: input.workflow } : {}),
    ...(input.workflowVersion === undefined || input.workflowVersion === null || input.workflowVersion === ""
      ? {}
      : { workflowVersion: Number(input.workflowVersion) }),
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
      if (action.action === "start-storyboard-migration") return { status: 200, result: startStoryboardMigration(action.slug, action.migrationVersion), project: getVideoProject(action.slug) };
      if (action.action === "prepare-storyboard-migration") return { status: 200, result: storyboardMigrationPlanView(prepareStoryboardMigration(action.slug)), project: getVideoProject(action.slug) };
      const projectView = getVideoProject(action.slug);
      if (!projectView) {
        const error = new Error("Video project not found");
        error.code = "video-project-not-found";
        throw error;
      }
      if (action.action === "initialize") {
        if (projectView.initialized) { const error = new Error("Harness project is already initialized"); error.code = "project-already-initialized"; throw error; }
        return {
          status: 200,
          result: {
            action: action.action,
            status: "initialized",
            files: initializeProject(action.slug, {
              ...(action.productionContract ? { productionContract: action.productionContract } : {}),
              workflow: action.workflow ?? projectView.workflow ?? "default",
              ...(action.workflowVersion === undefined || action.workflowVersion === null ? {} : { workflowVersion: action.workflowVersion }),
            }),
          },
          project: getVideoProject(action.slug),
        };
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
        if (action.stage !== "render") { const error = new Error(action.action + " only supports render"); error.code = "invalid-historical-stage"; throw error; }
        requireGitHubActionsConfig();
        if (action.action === "find-historical") return { status: 200, result: { action: action.action, stage: action.stage, candidates: await runtime.remoteJobMonitor.findHistorical({ slug: action.slug, stage: action.stage }) }, project: getVideoProject(action.slug) };
        if (action.runId === null) { const error = new Error("adopt-historical requires runId"); error.code = "historical-run-required"; throw error; }
        const job = await runtime.remoteJobMonitor.adoptHistorical({ slug: action.slug, stage: action.stage, runId: action.runId });
        return { status: 200, result: { action: action.action, stage: action.stage, status: "succeeded" }, job, project: getVideoProject(action.slug) };
      }
      if (action.action === "run-to-gate-2") {
        const active = findActiveBatchForProject("to-gate-2", action.slug); const batch = active ?? createBatch({ type: "to-gate-2", slugs: [action.slug] });
        void runBatch(batch.id, { deliveryDependencies: runtime.deliveryDependencies, queueAgentJob: runtime.queueAgentJob, remoteMonitor: runtime.remoteJobMonitor }).catch(() => {});
        return { status: 202, result: { action: action.action, status: active ? "already-running" : "queued" }, batch: getBatchForView(batch.id) };
      }
      if (action.action === "remote-run") return this.remoteRun(action);
      if (action.action === "prepare-remote-render") return this.prepareRemote(action);
      if (action.action === "resume-render-delivery") {
        const delivery = await runRenderDelivery("resume", action.slug, {}, runtime.deliveryDependencies);
        return { status: 200, result: { action: action.action, ...delivery }, job: delivery.job, project: getVideoProject(action.slug) };
      }
      if (action.action === "bind-render-input") {
        if (action.stage && action.stage !== "render") { const error = new Error("bind-render-input only supports render"); error.code = "invalid-render-stage"; throw error; }
        const project = loadProject(action.slug, { refresh: false });
        const binding = await bindRenderInputDelivery(project, { url: action.renderInputUrl, sha256: action.renderInputSha256 });
        return { status: 200, result: { action: action.action, status: "bound", delivery: binding.delivery }, project: getVideoProject(action.slug) };
      }

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
          if (usesUnifiedProduction(project) && ["source", "tts"].includes(stage)) { result = runStage(project, stage); break; }
          if (workflowStageDefinition(project, stage)?.executor === "agent") {
            if (stage === "remotion") {
              const needsBuild = usesUnifiedProduction(project) || validateStage(project, "remotion").length > 0 || project.state.stages.remotion.invalidatedBy === "gate-3-rejected";
              if (!needsBuild) { const stageResult = runStage(project, "remotion", { adapters: {} }); const gateResult = runStage(loadProject(action.slug, { refresh: true }), "gate-3", { adapters: {} }); result = { action: action.action, status: "succeeded", stageResult, gateResult }; break; }
              const task = ensureRemotionTask({ slug: action.slug, batchId: null }); runtime.queueRemotionTask(task.id); status = 202; result = { action: action.action, status: "queued", taskId: task.id }; return { status, result, task, project: getVideoProject(action.slug) };
            }
            const job = createAgentJob({ slug: action.slug, stage }); runtime.queueAgentJob(job.id); status = 202; return { status, result: { action: action.action, status: "queued", jobId: job.id }, job, project: getVideoProject(action.slug) };
          }
          result = await runStage(project, stage, { adapters: {} }); break;
        }
        case "approve":
          if ((action.gate ?? action.stage) === "gate-3") { const task = listRemotionTasks({ slug: action.slug })[0]; if (project.state.stages.remotion.status !== "succeeded" && task && task.status !== "completed") { const error = new Error("Gate 3 暂无可验证的新 Remotion 产物，请先执行或重试 Agent 并完成产物校验。"); error.code = "remotion-output-required"; throw error; } }
          result = approveGate(project, action.gate ?? action.stage, { reviewVersion: action.reviewVersion }); break;
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
      if (action.stage === "smoke-render") { const error = new Error("Smoke Render 已退出 Harness 生产流程，请从 GitHub Actions 手动触发独立环境检查。"); error.code = "standalone-smoke-render"; throw error; }
      if (action.stage !== "render") { const error = new Error("remote-run only supports render"); error.code = "invalid-remote-stage"; throw error; }
      const project = loadProject(action.slug, { refresh: true });
      assertProjectMutable(project, "提交远程渲染任务");
      const active = findActiveJob(action.slug, action.stage);
      if (active) return { status: 200, result: { action: action.action, status: "already-running" }, job: active };
      if (!(action.commitAndPush && action.confirmDelivery)) return this.prepareRemote(action);
      if (action.approveGate3 && project.state.currentStage === "gate-3") approveGate(project, "gate-3");
      const delivery = await runRenderDelivery("start", action.slug, { confirmPlan: action.deliveryPlanId }, runtime.deliveryDependencies);
      return { status: 202, result: { action: action.action, ...delivery }, job: delivery.job, project: getVideoProject(action.slug) };
    },
    async prepareRemote(action) {
      const stage = action.stage; if (stage !== "render") { const error = new Error("prepare-remote-render only supports render"); error.code = "invalid-remote-stage"; throw error; }
      const delivery = await runRenderDelivery("prepare", action.slug, {}, runtime.deliveryDependencies);
      return { status: 200, result: { action: action.action, ...delivery, status: "needs-confirmation" }, commitPlan: { planId: delivery.planId, commitPaths: delivery.files, selectedPaths: delivery.files }, project: getVideoProject(action.slug) };
    },
  };
}
