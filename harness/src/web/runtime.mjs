import { blockRemotionTask, runRemotionTask } from "../remotion-tasks.mjs";
import { getAgentJob, runAgentJob } from "../agent-jobs.mjs";
import { loadProject } from "../storage.mjs";
import { findBatchesForRemoteJob, runBatch } from "../batches.mjs";
import { runStage } from "../runner.mjs";
import { createAgentExecutorFromEnv } from "../agent-executor.mjs";
import { createTtsExecutorFromEnv } from "../tts-executor.mjs";
import { createRemotionExecutorFromEnv } from "../remotion-executor.mjs";
import { assertGitHubActionsReady } from "../diagnostics.mjs";

export function createRuntime({
  remoteJobMonitor,
  agentExecutorFactory = (stage) => stage === "subtitle-timeline" ? createTtsExecutorFromEnv() : createAgentExecutorFromEnv(),
  remotionExecutorFactory = () => createRemotionExecutorFromEnv(),
  githubPreflight = (options) => assertGitHubActionsReady(options),
} = {}) {
  const runtime = { remoteJobMonitor, githubPreflight };
  const resumeBatchForRemoteJob = async (job) => {
    const batchIds = job?.batchId ? [job.batchId] : findBatchesForRemoteJob(job);
    for (const batchId of [...new Set(batchIds)]) {
      await runBatch(batchId, { queueAgentJob: runtime.queueAgentJob, remoteMonitor: remoteJobMonitor });
    }
  };
  remoteJobMonitor?.setJobSettledHandler?.(resumeBatchForRemoteJob);
  runtime.queueAgentJob = (id) => {
    void (async () => {
      let executor;
      try {
        executor = agentExecutorFactory(getAgentJob(id)?.stage);
      } catch (error) {
        executor = { async run() { throw error; } };
      }
      const finished = await runAgentJob(id, { executor });
      if (finished.batchId) await runBatch(finished.batchId, { queueAgentJob: runtime.queueAgentJob, remoteMonitor: remoteJobMonitor });
    })().catch(() => {});
  };
  runtime.queueRemotionTask = (id) => {
    void (async () => {
      let executor;
      try {
        executor = remotionExecutorFactory();
      } catch (error) {
        blockRemotionTask(id, error);
        return;
      }
      const result = await runRemotionTask(id, { executor });
      if (!result.completed) return;
      const project = loadProject(result.task.slug, { refresh: true });
      if (project.state.currentStage === "remotion" && project.state.stages.remotion.status === "ready") {
        await runStage(project, "remotion", { adapters: {} });
        await runStage(loadProject(result.task.slug, { refresh: true }), "gate-3", { adapters: {} });
      }
      if (result.task.batchId) await runBatch(result.task.batchId, { remoteMonitor: remoteJobMonitor });
    })().catch(() => {});
  };
  return runtime;
}
