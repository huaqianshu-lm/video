import { validateVisualSelfReview } from "./visual-self-review.mjs";
import { usesUnifiedProduction } from "./production-contract.mjs";
import { assertProjectMutable, loadProject } from "./storage.mjs";
import { runStage, validateStage } from "./runner.mjs";
import { ensureRemotionTask, getRemotionTask, runRemotionTask } from "./remotion-tasks.mjs";
import { prepareRenderInputEntry } from "./render-input.mjs";
import { createAgentJob, getAgentJob, runAgentJob } from "./agent-jobs.mjs";

const REMOTE_STAGES = new Set(["render"]);

export async function runSingleStage(project, stage, {
  ttsExecutor = null,
  agentJobId = null,
  remotionExecutor = null,
  remotionTaskId = null,
  remotionTaskBatchId = null,
  batchId = null,
  remoteExecutor = null,
  adapters = {},
} = {}) {
  assertProjectMutable(project, "执行视频阶段");
  if (stage === "remotion" || stage === "subtitle-timeline") {
    const reviewIssues = validateVisualSelfReview(project, stage);
    if (reviewIssues.length) throw new Error(reviewIssues.map((item) => item.message).join("；"));
  }
  if (stage === "remotion") {
    if (!remotionExecutor) {
      if (usesUnifiedProduction(project)) throw Object.assign(new Error("统一契约必须执行 Remotion 制作任务，不能仅检查已有文件。"), { code: "production-task-required" });
      try {
        prepareRenderInputEntry(project);
      } catch (error) {
        error.code ??= "render-input-preparation-failed";
        throw error;
      }
      const refreshed = loadProject(project.config.slug, { refresh: true });
      const issues = validateStage(refreshed, "remotion");
      if (issues.length > 0) {
        const error = new Error("Remotion executor is not configured and Remotion artifacts are not valid");
        error.code = "executor-not-configured";
        error.issues = issues;
        throw error;
      }
      const stageResult = runStage(loadProject(project.config.slug), "remotion");
      const gateResult = runStage(loadProject(project.config.slug), "gate-3");
      return { completed: true, validationOnly: true, stageResult, gateResult };
    }
    const task = remotionTaskId
      ? getRemotionTask(remotionTaskId)
      : ensureRemotionTask({ slug: project.config.slug, batchId: remotionTaskBatchId });
    if (!task) throw new Error(`Remotion task not found: ${remotionTaskId}`);
    const taskResult = await runRemotionTask(task.id, { executor: remotionExecutor });
    if (!taskResult.completed) return taskResult;
    if (usesUnifiedProduction(project)) return taskResult;

    const stageResult = runStage(loadProject(project.config.slug, { refresh: false }), "remotion", { executors: { remotion: { run: () => taskResult.execution ?? { outputs: [] } } } });
    const gateResult = runStage(loadProject(project.config.slug), "gate-3");
    return { ...taskResult, stageResult, gateResult };
  }

  if (stage === "smoke-render") {
    const error = new Error("Smoke Render 已退出 Harness 生产流程，请从 GitHub Actions 手动触发独立环境检查。");
    error.code = "standalone-smoke-render";
    throw error;
  }

  if (REMOTE_STAGES.has(stage)) {
    if (!remoteExecutor || typeof remoteExecutor.run !== "function") {
      throw new Error(`Remote executor is not configured for ${stage}`);
    }
    return await remoteExecutor.run({ stage, project, batchId });
  }

  if (stage === "subtitle-timeline" && usesUnifiedProduction(project)) {
    const job = agentJobId ? getAgentJob(agentJobId) : createAgentJob({ slug: project.config.slug, stage, batchId, mode: batchId ? "background" : "cli" });
    if (!job || job.slug !== project.config.slug || job.stage !== stage) throw new Error("TTS 制作任务与当前视频或阶段不一致。");
    const finished = await runAgentJob(job.id, { executor: ttsExecutor });
    if (finished.status !== "succeeded") throw Object.assign(new Error(finished.error?.message ?? "TTS 制作任务失败。"), finished.error ?? {}, { agentJobId: job.id });
    return { stage, status: "succeeded", nextStage: finished.result.nextStage, agentJobId: finished.id };
  }

  const executors = stage === "subtitle-timeline" && ttsExecutor
    ? { "subtitle-timeline": ttsExecutor }
    : {};
  return runStage(project, stage, { adapters, executors });
}
