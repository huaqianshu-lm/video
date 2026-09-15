import { randomUUID } from "node:crypto";

import { createGitHubActionsAdapterFromEnv } from "./adapters.mjs";
import { createJobRecord, findActiveJob, getJob, listAllJobs, updateJob } from "./jobs.mjs";
import { markAdapterStageFailed, completeAdapterStage, runStage } from "./runner.mjs";
import {
  ACTIVE_REMOTE_JOB_STATUSES,
  REMOTE_JOB_STATUS,
  classifyRemoteError,
} from "./remote-status.mjs";
import { isGateStage } from "./stages.mjs";
import { assertProjectSlugMutable, isCompletedProject, loadProject } from "./storage.mjs";
import { assertRemoteRenderDeliveryInputs, prepareRemoteRenderInputs } from "./remote-executor.mjs";
import { assertRenderInputDelivery, readRenderInputDelivery } from "./render-input.mjs";

const DEFAULT_POLL_INTERVAL_MS = 20 * 60 * 1_000;
const DEFAULT_JOB_TIMEOUT_MS = 45 * 60 * 1_000;
const REMOTE_STAGES = new Set(["render"]);

function hasRunId(remote) {
  return remote?.runId !== null && remote?.runId !== undefined;
}

function canReconcileDispatchedJob(job) {
  return ["failed", "waiting-config"].includes(job.status)
    && REMOTE_STAGES.has(job.stage)
    && Boolean(job.remote?.workflow)
    && !hasRunId(job.remote)
    && job.remote?.dispatchState !== "confirmed";
}

function isPollableJob(job) {
  if ([REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN, REMOTE_JOB_STATUS.DISPATCH_AMBIGUOUS].includes(job.status)) {
    return false;
  }
  return ["queued", "dispatching", REMOTE_JOB_STATUS.WAITING_CONFIG, ...ACTIVE_REMOTE_JOB_STATUSES].includes(job.status)
    || canReconcileDispatchedJob(job)
    || (job.status === "failed"
      && REMOTE_STAGES.has(job.stage)
      && Boolean(job.remote?.workflow)
      && !hasRunId(job.remote)
      && job.remote?.dispatchState !== "confirmed");
}

function isoNow(now) {
  return now().toISOString();
}

function dispatchState(remote) {
  if (remote?.dispatchState === "pending") return "prepared";
  return remote?.dispatchState ?? "prepared";
}

function dispatchIdError() {
  const error = new Error("远程 Job 缺少 dispatchId，无法安全判断请求是否已经到达 GitHub；请人工核对后再处理");
  error.code = "remote-dispatch-uncertain";
  return error;
}

function dispatchIdMismatchError(expected, actual) {
  const error = new Error(`远程适配器返回了不同的 dispatchId：期望 ${expected}，实际 ${actual}`);
  error.code = "remote-dispatch-id-mismatch";
  return error;
}

function dispatchBindingMismatchError(field, expected, actual) {
  const error = new Error(`远程派发绑定的 ${field} 不一致：期望 ${expected}，实际 ${actual}`);
  error.code = "remote-dispatch-binding-mismatch";
  return error;
}

function confirmedRemote(dispatch, run, now) {
  return {
    ...dispatch,
    runId: run.id,
    ...(run.url ? { runApiUrl: run.url } : {}),
    ...(run.html_url ? { runUrl: run.html_url } : {}),
    dispatchState: "confirmed",
    dispatchConfirmedAt: run.created_at ?? isoNow(now),
  };
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
      nextCheckAt: patch.status && [
        "succeeded",
        "failed",
        REMOTE_JOB_STATUS.TIMEOUT,
        REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN,
        REMOTE_JOB_STATUS.DISPATCH_AMBIGUOUS,
      ].includes(patch.status)
        ? null
        : new Date(now().getTime() + pollIntervalMs).toISOString(),
    };
  }

  function timeoutReached(job) {
    const awaitingDispatchConfirmation = job.remote?.dispatchState === "sending" && !hasRunId(job.remote);
    if (!awaitingDispatchConfirmation && !job.remote?.dispatchConfirmedAt && !hasRunId(job.remote)) return false;
    const startedAt = awaitingDispatchConfirmation
      ? job.remote?.dispatchSentAt ?? job.remote?.dispatchedAt ?? job.dispatchingAt ?? job.createdAt
      : job.remote?.dispatchConfirmedAt ?? job.startedAt ?? job.createdAt;
    if (!startedAt) return false;
    return Number.isFinite(Date.parse(startedAt))
      && now().getTime() - Date.parse(startedAt) >= jobTimeoutMs;
  }

  async function timeoutJob(job) {
    const error = new Error(`Remote ${job.stage} job exceeded timeout of ${jobTimeoutMs}ms`);
    error.code = "remote-job-timeout";
    return failJob(job, error, { status: REMOTE_JOB_STATUS.TIMEOUT });
  }

  async function uncertainDispatchJob(job) {
    const error = new Error(`Remote ${job.stage} dispatch ${job.remote?.dispatchId ?? ""} cannot be confirmed safely; manual Run verification is required`);
    error.code = "remote-dispatch-uncertain";
    return failJob(job, error, { status: REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN });
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
      if (isCompletedProject(job.slug)) return job;

      if (timeoutReached(job)) {
        return job.remote?.dispatchState === "sending" && !hasRunId(job.remote)
          ? uncertainDispatchJob(job)
          : timeoutJob(job);
      }

      let project;
      try {
        project = loadProject(job.slug, { refresh: true });
        const currentDelivery = readRenderInputDelivery(project.config.workspaceRoot, job.slug);
        if (job.remote?.renderInputUrl || job.remote?.renderInputSha256) {
          if (!currentDelivery
            || currentDelivery.url !== job.remote.renderInputUrl
            || currentDelivery.archiveSha256 !== job.remote.renderInputSha256
            || currentDelivery.packageFingerprint !== job.remote.renderInputPackageFingerprint) {
            const error = new Error(`远程 Job ${job.id} 绑定的输入包已变化，请停止旧任务并重新预检提交`);
            error.code = "remote-job-input-binding-changed";
            throw error;
          }
        }
        const adapter = adapterFactory();
        let remote = job.remote ?? null;

        if (remote?.workflow && !hasRunId(remote) && !remote.dispatchId) {
          throw dispatchIdError();
        }

        const dispatchId = remote?.dispatchId ?? randomUUID();
        if (!remote?.dispatchId || !remote?.dispatchState) {
          remote = {
            ...(remote ?? {}),
            dispatchId,
            dispatchState: dispatchState(remote),
          };
          updateJob(job.slug, job.id, { remote });
        }

        if (remote?.workflow) {
          const expectedCompositionId = project.config.compositionId ?? project.config.slug;
          if (remote.slug && remote.slug !== job.slug) {
            throw dispatchBindingMismatchError("video slug", job.slug, remote.slug);
          }
          if (remote.compositionId && remote.compositionId !== expectedCompositionId) {
            throw dispatchBindingMismatchError("Composition ID", expectedCompositionId, remote.compositionId);
          }
        }

        if (!hasRunId(remote)) {
          const state = dispatchState(remote);
          if (state === "sending" || state === "confirmed") {
            if (!remote.workflow || !remote.slug || !remote.compositionId) {
              throw dispatchIdError();
            }
            if (typeof adapter.findDispatchedRunOnce !== "function") {
              throw dispatchIdError();
            }
            const existingRun = await adapter.findDispatchedRunOnce(remote);
            if (existingRun) {
              remote = confirmedRemote(remote, existingRun, now);
              updateJob(job.slug, job.id, { remote });
            } else {
              remote = { ...remote, dispatchState: "sending" };
              updateJob(job.slug, job.id, { remote });
            }
          } else {
            if (adapter.requiresRenderPreflight) {
              prepareRemoteRenderInputs(project);
              assertRemoteRenderDeliveryInputs(project);
            }
            const dispatchingAt = remote.dispatchedAt ?? job.dispatchingAt ?? job.createdAt;
            updateJob(job.slug, job.id, {
              status: "dispatching",
              dispatchingAt,
              error: null,
            });
            const candidate = adapter.createDispatch
              ? adapter.createDispatch({ stage: job.stage, project, dispatchedAt: dispatchingAt, dispatchId })
              : remote;
            if (!candidate?.workflow) {
              throw new Error(`Remote adapter cannot create a dispatch for ${job.stage}`);
            }
            if (candidate.dispatchId && candidate.dispatchId !== dispatchId) {
              throw dispatchIdMismatchError(dispatchId, candidate.dispatchId);
            }
            if (candidate.slug && candidate.slug !== project.state.slug) {
              throw dispatchBindingMismatchError("video slug", project.state.slug, candidate.slug);
            }
            const expectedRunName = `${project.state.slug} / ${dispatchId}`;
            if (candidate.runName && candidate.runName !== expectedRunName) {
              throw dispatchBindingMismatchError("Run name", expectedRunName, candidate.runName);
            }
            const expectedCompositionId = project.config.compositionId ?? project.config.slug;
            if (candidate.compositionId && candidate.compositionId !== expectedCompositionId) {
              throw dispatchBindingMismatchError("Composition ID", expectedCompositionId, candidate.compositionId);
            }
            const persistedInputBinding = job.remote?.renderInputUrl
              || job.remote?.renderInputSha256
              || job.remote?.renderInputPackageFingerprint ? {
              renderInputUrl: job.remote.renderInputUrl,
              renderInputSha256: job.remote.renderInputSha256,
              renderInputPackageFingerprint: job.remote.renderInputPackageFingerprint,
              renderInputBoundAt: job.remote.renderInputBoundAt,
            } : {};
            const preparedDispatch = {
              ...candidate,
              slug: candidate.slug ?? project.state.slug,
              compositionId: candidate.compositionId ?? expectedCompositionId,
              dispatchId: candidate.dispatchId ?? dispatchId,
              runName: candidate.runName ?? `${candidate.slug ?? project.state.slug} / ${candidate.dispatchId ?? dispatchId}`,
              dispatchedAt: candidate.dispatchedAt ?? dispatchingAt,
              ...persistedInputBinding,
              dispatchState: "prepared",
            };
            updateJob(job.slug, job.id, { remote: preparedDispatch });
            if (typeof adapter.verifyDispatchRef === "function") {
              await adapter.verifyDispatchRef({ project, dispatch: preparedDispatch });
            }
            const sendingDispatch = {
              ...preparedDispatch,
              dispatchState: "sending",
              dispatchSentAt: remote.dispatchSentAt ?? isoNow(now),
            };
            updateJob(job.slug, job.id, { remote: sendingDispatch, status: "dispatching", error: null });
            const dispatched = await adapter.dispatchWorkflow({
              stage: job.stage,
              project,
              dispatchedAt: sendingDispatch.dispatchedAt,
              dispatchId: sendingDispatch.dispatchId,
              dispatch: sendingDispatch,
            });
            if (dispatched?.dispatchId && dispatched.dispatchId !== sendingDispatch.dispatchId) {
              throw dispatchIdMismatchError(sendingDispatch.dispatchId, dispatched.dispatchId);
            }
            remote = {
              ...sendingDispatch,
              ...(dispatched ?? {}),
              dispatchId: dispatched?.dispatchId ?? sendingDispatch.dispatchId,
              runName: dispatched?.runName ?? sendingDispatch.runName,
              dispatchState: dispatched?.dispatchState ?? (dispatched?.runId != null ? "confirmed" : "sending"),
              dispatchSentAt: dispatched?.dispatchSentAt ?? sendingDispatch.dispatchSentAt,
            };
            if (remote.runId != null && !remote.dispatchConfirmedAt) {
              remote.dispatchConfirmedAt = isoNow(now);
            }
            updateJob(job.slug, job.id, { remote });
          }
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
          status: hasRunId(remote) ? REMOTE_JOB_STATUS.RUNNING : REMOTE_JOB_STATUS.SUBMITTED,
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
          const inspectedRemote = inspection.remote ?? remote;
          const normalizedRemote = inspectedRemote?.runId !== null && inspectedRemote?.runId !== undefined
            ? {
              ...inspectedRemote,
              dispatchState: "confirmed",
              dispatchConfirmedAt: inspectedRemote.dispatchConfirmedAt
                ?? remote.dispatchConfirmedAt
                ?? isoNow(now),
            }
            : inspectedRemote;
          return updateJob(job.slug, job.id, schedulePatch(job, {
            status: inspection.status,
            remote: normalizedRemote,
            error: null,
          }));
        }
        if (inspection.status === "failed") {
          const inspectedRemote = inspection.remote ?? remote;
          return failJob({ ...job, remote: inspectedRemote }, new Error(inspection.error));
        }

        const completedProject = loadProject(job.slug, { refresh: true });
        const result = completeAdapterStage(completedProject, job.stage, inspection.result);
        const nextStage = completedProject.state.currentStage;
        if (isGateStage(nextStage)) {
          runStage(completedProject, nextStage);
        }
        return updateJob(job.slug, job.id, schedulePatch(job, {
          status: "succeeded",
          remote: inspection.remote ?? remote,
          result: inspection.result,
          completedAt: isoNow(now),
          error: null,
          stageResult: result,
        }));
      } catch (error) {
        if (["github-config-invalid", "github-auth-invalid", "render-input-remote-config-invalid"].includes(error?.code)) {
          return updateJob(job.slug, job.id, schedulePatch(job, {
            status: REMOTE_JOB_STATUS.WAITING_CONFIG,
            error: errorRecord(error),
          }));
        }
        if (error?.code === "remote-dispatch-uncertain") {
          return failJob(getJob(job.slug, job.id) ?? job, error, {
            status: REMOTE_JOB_STATUS.DISPATCH_UNCERTAIN,
          });
        }
        if (error?.code === "remote-dispatch-ambiguous") {
          return failJob(getJob(job.slug, job.id) ?? job, error, {
            status: REMOTE_JOB_STATUS.DISPATCH_AMBIGUOUS,
          });
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
    assertProjectSlugMutable(slug, "接管历史远程结果");
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
    if (!REMOTE_STAGES.has(stage)) {
      const error = new Error(stage === "smoke-render"
        ? "Smoke Render 已退出 Harness 生产流程，请从 GitHub Actions 手动触发独立环境检查。"
        : `Remote job monitor does not support stage: ${stage}`);
      if (stage === "smoke-render") error.code = "standalone-smoke-render";
      throw error;
    }
    assertProjectSlugMutable(slug, "创建远程渲染任务");
    if (findActiveJob(slug, stage)) {
      throw new Error("A remote job for this stage is already running");
    }
    const project = loadProject(slug, { refresh: true });
    const delivery = assertRenderInputDelivery(project);
    const dispatchId = randomUUID();
    const job = createJobRecord({
      slug,
      stage,
      metadata: {
        remote: {
          dispatchId,
          dispatchState: "prepared",
          renderInputUrl: delivery.url,
          renderInputSha256: delivery.archiveSha256,
          renderInputPackageFingerprint: delivery.packageFingerprint,
          renderInputBoundAt: delivery.boundAt,
        },
      },
    });
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
