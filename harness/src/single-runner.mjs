import { loadProject } from "./storage.mjs";
import { runStage, validateStage } from "./runner.mjs";
import { ensureRemotionTask, getRemotionTask, runRemotionTask } from "./remotion-tasks.mjs";

const REMOTE_STAGES = new Set(["smoke-render", "render"]);

export async function runSingleStage(project, stage, {
  ttsExecutor = null,
  remotionExecutor = null,
  remotionTaskId = null,
  remotionTaskBatchId = null,
  remoteExecutor = null,
  adapters = {},
} = {}) {
  if (stage === "remotion") {
    if (!remotionExecutor) {
      const issues = validateStage(project, "remotion");
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

    const stageResult = runStage(loadProject(project.config.slug), "remotion");
    const gateResult = runStage(loadProject(project.config.slug), "gate-3");
    return { ...taskResult, stageResult, gateResult };
  }

  if (REMOTE_STAGES.has(stage)) {
    if (!remoteExecutor || typeof remoteExecutor.run !== "function") {
      throw new Error(`Remote executor is not configured for ${stage}`);
    }
    return remoteExecutor.run({ stage, project });
  }

  const executors = stage === "subtitle-timeline" && ttsExecutor
    ? { "subtitle-timeline": ttsExecutor }
    : {};
  return runStage(project, stage, { adapters, executors });
}
