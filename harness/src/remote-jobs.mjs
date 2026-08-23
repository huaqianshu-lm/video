import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { createJobRecord, findActiveJob, getJob, listAllJobs, updateJob } from "./jobs.mjs";
import { markAdapterStageFailed, completeAdapterStage, runStage } from "./runner.mjs";
import { loadProject } from "./storage.mjs";

const DEFAULT_POLL_INTERVAL_MS = 20 * 60 * 1_000;

function isoNow(now) {
  return now().toISOString();
}

function errorRecord(error) {
  return {
    code: error?.code ?? "remote-job-failed",
    message: error instanceof Error ? error.message : String(error),
    issues: error?.issues ?? undefined,
  };
}

export function createRemoteJobMonitor({
  adapterFactory = () => createGitHubActionsAdapterFromEnv(),
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  now = () => new Date(),
  setIntervalImpl = setInterval,
  clearIntervalImpl = clearInterval,
} = {}) {
  const inFlight = new Set();
  let timer = null;

  function schedulePatch(job, patch = {}) {
    return {
      ...patch,
      lastCheckedAt: isoNow(now),
      nextCheckAt: new Date(now().getTime() + pollIntervalMs).toISOString(),
    };
  }

  async function failJob(job, error, { markStage = true } = {}) {
    const failure = errorRecord(error);
    if (markStage) {
      try {
        const project = loadProject(job.slug, { refresh: true });
        if (project.state.currentStage === job.stage && project.state.stages[job.stage]?.status === "running") {
          markAdapterStageFailed(project, job.stage, error);
        }
      } catch {
        // The job record still carries the remote failure if the project state cannot be updated.
      }
    }
    return updateJob(job.slug, job.id, schedulePatch(job, {
      status: "failed",
      error: failure,
      completedAt: isoNow(now),
    }));
  }

  async function processJob(jobId) {
    if (inFlight.has(jobId)) return getJobForId(jobId);
    inFlight.add(jobId);
    try {
      let job = listAllJobs().find((item) => item.id === jobId) ?? null;
      if (!job || !["queued", "dispatching", "waiting-config", "waiting-run", "running"].includes(job.status)) {
        return job;
      }

      let project;
      try {
        project = loadProject(job.slug, { refresh: true });
        const adapter = adapterFactory();
        let remote = job.remote ?? null;

        if (!remote?.workflow) {
          const dispatchingAt = job.dispatchingAt ?? job.createdAt;
          updateJob(job.slug, job.id, {
            status: "dispatching",
            dispatchingAt,
            error: null,
          });
          const candidate = adapter.createDispatch({ stage: job.stage, project, dispatchedAt: dispatchingAt });
          updateJob(job.slug, job.id, { remote: candidate });
          const existingRun = await adapter.findDispatchedRunOnce(candidate);
          remote = existingRun
            ? { ...candidate, runId: existingRun.id, runUrl: existingRun.html_url }
            : await adapter.dispatchWorkflow({ stage: job.stage, project, dispatchedAt: dispatchingAt });
        }

        if (project.state.currentStage === job.stage && project.state.stages[job.stage]?.status === "ready") {
          await runStage(project, job.stage, {
            deferAdapters: true,
            adapters: {
              [job.stage]: { run: async () => ({ deferred: true, remote }) },
            },
          });
        }

        updateJob(job.slug, job.id, schedulePatch(job, {
          status: remote.runId ? "running" : "waiting-run",
          remote,
          startedAt: job.startedAt ?? isoNow(now),
          error: null,
        }));

        const inspection = await adapter.inspectRun({
          stage: job.stage,
          dispatch: remote,
          runId: remote.runId ?? null,
        });
        if (inspection.status === "waiting-run" || inspection.status === "running") {
          return updateJob(job.slug, job.id, schedulePatch(job, {
            status: inspection.status,
            remote: inspection.remote,
            error: null,
          }));
        }
        if (inspection.status === "failed") {
          return failJob({ ...job, remote: inspection.remote }, new Error(inspection.error));
        }

        const completedProject = loadProject(job.slug, { refresh: true });
        const result = completeAdapterStage(completedProject, job.stage, inspection.result);
        return updateJob(job.slug, job.id, schedulePatch(job, {
          status: "succeeded",
          remote: inspection.remote,
          result: inspection.result,
          completedAt: isoNow(now),
          error: null,
          stageResult: result,
        }));
      } catch (error) {
        if (error?.code === "github-config-invalid") {
          return updateJob(job.slug, job.id, schedulePatch(job, {
            status: "waiting-config",
            error: errorRecord(error),
          }));
        }
        return failJob(job, error);
      }
    } finally {
      inFlight.delete(jobId);
    }
  }

  function getJobForId(jobId) {
    return listAllJobs().find((item) => item.id === jobId) ?? null;
  }

  async function poll() {
    const jobs = listAllJobs().filter((job) => ["queued", "dispatching", "waiting-config", "waiting-run", "running"].includes(job.status));
    await Promise.all(jobs.map((job) => processJob(job.id)));
  }

  function submit({ slug, stage }) {
    if (findActiveJob(slug, stage)) {
      throw new Error("A remote job for this stage is already running");
    }
    const job = createJobRecord({ slug, stage });
    void processJob(job.id);
    return job;
  }

  return {
    submit,
    processJob,
    poll,
    start() {
      if (timer) return;
      void poll();
      timer = setIntervalImpl(() => void poll(), pollIntervalMs);
      timer.unref?.();
    },
    stop() {
      if (!timer) return;
      clearIntervalImpl(timer);
      timer = null;
    },
  };
}
