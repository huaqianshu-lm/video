import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { createJobRecord, findActiveJob, getJob, listAllJobs, updateJob } from "./jobs.mjs";
import { markAdapterStageFailed, completeAdapterStage, runStage } from "./runner.mjs";
import {
  ACTIVE_REMOTE_JOB_STATUSES,
  REMOTE_JOB_STATUS,
  classifyRemoteError,
} from "./remote-status.mjs";
import { isGateStage } from "./stages.mjs";
import { loadProject } from "./storage.mjs";
import { assertRemoteRenderDeliveryInputs, prepareRemoteRenderInputs } from "./remote-executor.mjs";

const DEFAULT_POLL_INTERVAL_MS = 20 * 60 * 1_000;
const DEFAULT_JOB_TIMEOUT_MS = 45 * 60 * 1_000;
const REMOTE_STAGES = new Set(["smoke-render", "render"]);

function canReconcileDispatchedJob(job) {
  return ["failed", "waiting-config"].includes(job.status)
    && REMOTE_STAGES.has(job.stage)
    && Boolean(job.remote?.workflow)
    && !job.remote?.runId
    && job.remote?.dispatchState !== "confirmed";
}

function isPollableJob(job) {
  return ["queued", "dispatching", REMOTE_JOB_STATUS.WAITING_CONFIG, ...ACTIVE_REMOTE_JOB_STATUSES].includes(job.status)
    || canReconcileDispatchedJob(job)
    || (job.status === "failed"
      && REMOTE_STAGES.has(job.stage)
      && Boolean(job.remote?.workflow)
      && !job.remote?.runId
      && job.remote?.dispatchState !== "confirmed");
}

function isoNow(now) {
  return now().toISOString();
}

function errorRecord(error) {
  return {
    code: error?.code ?? "remote-job-failed",
    message: error instanceof Error ? error.message : String(error),
    issues: error?.issues ?? undefined,
    classification: classifyRemoteError(error),
  };
}

function historicalCandidate(match) {
  const expectedArtifact = match.artifact;
  return {
    runId: match.run.id,
    runUrl: match.run.html_url,
    ref: match.run.head_branch,
    createdAt: match.run.created_at,
    artifactName: expectedArtifact?.name ?? null,
    artifactSizeInBytes: expectedArtifact?.size_in_bytes ?? 0,
  };
}

export function createRemoteJobMonitor({
  adapterFactory = () => createGitHubActionsAdapterFromEnv(),
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  jobTimeoutMs = DEFAULT_JOB_TIMEOUT_MS,
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
      nextCheckAt: patch.status && ["succeeded", "failed", REMOTE_JOB_STATUS.TIMEOUT].includes(patch.status)
        ? null
        : new Date(now().getTime() + pollIntervalMs).toISOString(),
    };
  }

  function timeoutReached(job) {
    if (!job.remote?.dispatchConfirmedAt && !job.remote?.runId) return false;
    const startedAt = job.remote?.dispatchConfirmedAt ?? job.startedAt ?? job.createdAt;
    return Number.isFinite(Date.parse(startedAt))
      && now().getTime() - Date.parse(startedAt) >= jobTimeoutMs;
  }

  async function timeoutJob(job) {
    const error = new Error(`Remote ${job.stage} job exceeded timeout of ${jobTimeoutMs}ms`);
    error.code = "remote-job-timeout";
    return failJob(job, error, { status: REMOTE_JOB_STATUS.TIMEOUT });
  }

  async function failJob(job, error, { markStage = true, status = REMOTE_JOB_STATUS.FAILED } = {}) {
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
      status,
      error: failure,
      completedAt: isoNow(now),
    }));
  }

  async function processJob(jobId) {
    if (inFlight.has(jobId)) return getJobForId(jobId);
    inFlight.add(jobId);
    try {
      let job = listAllJobs().find((item) => item.id === jobId) ?? null;
      if (!job || !isPollableJob(job)) {
        return job;
      }

      if (timeoutReached(job)) {
        return timeoutJob(job);
      }

      let project;
      try {
        project = loadProject(job.slug, { refresh: true });
        const adapter = adapterFactory();
        let remote = job.remote ?? null;

        if (!remote?.workflow || (!remote.runId && remote.dispatchState !== "confirmed")) {
          if (adapter.requiresRenderPreflight) {
            prepareRemoteRenderInputs(project);
            assertRemoteRenderDeliveryInputs(project);
          }
          const dispatchingAt = remote?.dispatchState === "pending"
            ? remote.dispatchedAt
            : job.dispatchingAt ?? job.createdAt;
          updateJob(job.slug, job.id, {
            status: "dispatching",
            dispatchingAt,
            error: null,
          });
          const candidate = adapter.createDispatch
            ? adapter.createDispatch({ stage: job.stage, project, dispatchedAt: dispatchingAt })
            : remote ?? null;
          if (!candidate?.workflow) {
            throw new Error(`Remote adapter cannot create a dispatch for ${job.stage}`);
          }
          if (typeof adapter.verifyDispatchRef === "function") {
            await adapter.verifyDispatchRef({ project, dispatch: candidate });
          }
          const pendingDispatch = { ...candidate, dispatchState: "pending" };
          updateJob(job.slug, job.id, { remote: pendingDispatch });
          const existingRun = await adapter.findDispatchedRunOnce(pendingDispatch);
          remote = existingRun
            ? {
              ...pendingDispatch,
              runId: existingRun.id,
              runUrl: existingRun.html_url,
              dispatchState: "confirmed",
              dispatchConfirmedAt: existingRun.created_at ?? isoNow(now),
            }
            : {
              ...await adapter.dispatchWorkflow({ stage: job.stage, project, dispatchedAt: dispatchingAt }),
              dispatchState: "confirmed",
              dispatchConfirmedAt: isoNow(now),
            };
          updateJob(job.slug, job.id, { remote });
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
          status: remote.runId ? REMOTE_JOB_STATUS.RUNNING : REMOTE_JOB_STATUS.SUBMITTED,
          remote,
          startedAt: job.startedAt ?? isoNow(now),
          error: null,
        }));

        const inspection = await adapter.inspectRun({
          stage: job.stage,
          dispatch: remote,
          runId: remote.runId ?? null,
          recoverExisting: canReconcileDispatchedJob(job),
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
        const nextStage = completedProject.state.currentStage;
        if (isGateStage(nextStage)) {
          runStage(completedProject, nextStage);
        }
        return updateJob(job.slug, job.id, schedulePatch(job, {
          status: "succeeded",
          remote: inspection.remote,
          result: inspection.result,
          completedAt: isoNow(now),
          error: null,
          stageResult: result,
        }));
      } catch (error) {
        if (["github-config-invalid", "render-input-remote-config-invalid"].includes(error?.code)) {
          return updateJob(job.slug, job.id, schedulePatch(job, {
            status: REMOTE_JOB_STATUS.WAITING_CONFIG,
            error: errorRecord(error),
          }));
        }
        if (classifyRemoteError(error) === REMOTE_JOB_STATUS.RECOVERABLE) {
          return updateJob(job.slug, job.id, schedulePatch(getJob(job.slug, job.id) ?? job, {
            status: REMOTE_JOB_STATUS.RECOVERABLE,
            error: errorRecord(error),
            completedAt: null,
          }));
        }
        return failJob(getJob(job.slug, job.id) ?? job, error);
      }
    } finally {
      inFlight.delete(jobId);
    }
  }

  async function findHistorical({ slug, stage }) {
    if (!REMOTE_STAGES.has(stage)) {
      throw new Error(`Historical recovery does not support ${stage}`);
    }
    const project = loadProject(slug, { refresh: true });
    const adapter = adapterFactory();
    const dispatch = adapter.createDispatch({ stage, project, dispatchedAt: isoNow(now) });
    const matches = await adapter.findSuccessfulRunsWithArtifactOnce(dispatch, { anyBranch: true });
    return matches.map((match) => historicalCandidate(match));
  }

  async function adoptHistorical({ slug, stage, runId }) {
    if (!REMOTE_STAGES.has(stage)) {
      throw new Error(`Historical recovery does not support ${stage}`);
    }
    const project = loadProject(slug, { refresh: true });
    if (project.state.currentStage !== stage) {
      throw new Error(`Cannot adopt a historical result for ${stage}; current stage is ${project.state.currentStage}`);
    }
    const adapter = adapterFactory();
    const dispatch = adapter.createDispatch({ stage, project, dispatchedAt: isoNow(now) });
    const matches = await adapter.findSuccessfulRunsWithArtifactOnce(dispatch, { anyBranch: true });
    const match = matches.find((item) => String(item.run.id) === String(runId));
    if (!match) {
      throw new Error(`No usable historical ${stage} Artifact was found for Run ${runId}`);
    }
    const remote = {
      ...dispatch,
      ref: match.run.head_branch,
      runId: match.run.id,
      runUrl: match.run.html_url,
      dispatchState: "confirmed",
      dispatchConfirmedAt: match.run.created_at,
      adoptedAt: isoNow(now),
    };
    const inspection = await adapter.inspectRun({ stage, dispatch: remote, runId: match.run.id });
    if (inspection.status !== "succeeded") {
      throw new Error(inspection.error ?? `Historical Run ${runId} is not ready for adoption`);
    }

    const job = findActiveJob(slug, stage) ?? createJobRecord({
      slug,
      stage,
      metadata: { status: "running", remote },
    });
    const completedProject = loadProject(slug, { refresh: true });
    const stageResult = completeAdapterStage(completedProject, stage, inspection.result);
    const nextStage = completedProject.state.currentStage;
    if (isGateStage(nextStage)) runStage(completedProject, nextStage);
    return updateJob(slug, job.id, {
      status: "succeeded",
      remote: inspection.remote,
      result: inspection.result,
      completedAt: isoNow(now),
      error: null,
      stageResult,
    });
  }

  function getJobForId(jobId) {
    return listAllJobs().find((item) => item.id === jobId) ?? null;
  }

  async function poll() {
    const jobs = listAllJobs().filter(isPollableJob);
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
    findHistorical,
    adoptHistorical,
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
