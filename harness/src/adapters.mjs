import { randomUUID } from "node:crypto";

export function createMockAdapter({ failOnce = false } = {}) {
  let shouldFail = failOnce;
  const calls = [];

  return {
    calls,
    run({ stage, project }) {
      calls.push({ stage, slug: project.state.slug });
      if (shouldFail) {
        shouldFail = false;
        throw new Error(`Mock adapter failure for ${stage}`);
      }
      return {
        outputs: [{ kind: "mock", stage, slug: project.state.slug }],
      };
    },
  };
}

const WORKFLOWS_BY_STAGE = Object.freeze({
  "smoke-render": "smoke-test-video.yml",
  render: "render-video.yml",
});

import { requireGitHubActionsConfig } from "./github-config.mjs";
import { localGitCommit } from "./git-delivery.mjs";
import { readRenderInputDelivery } from "./render-input.mjs";

const DEFAULT_API_URL = "https://api.github.com";
const DEFAULT_DISCOVERY_TIMEOUT_MS = 120_000;
const DEFAULT_RUN_TIMEOUT_MS = 45 * 60 * 1_000;
const DEFAULT_DISCOVERY_POLL_INTERVAL_MS = 5_000;
const DEFAULT_RUN_POLL_INTERVAL_MS = 20 * 60 * 1_000;

function expectedArtifactName(stage, slug) {
  if (stage === "smoke-render") return `${slug}-smoke-test`;
  if (stage === "render") return slug;
  return null;
}

function requireUsableArtifact(stage, slug, artifacts) {
  const expectedName = expectedArtifactName(stage, slug);
  const artifact = artifacts.find((item) => item.name === expectedName);
  if (!artifact) {
    throw new Error(`GitHub Actions ${stage} did not produce expected artifact: ${expectedName}`);
  }
  if (artifact.expired) {
    throw new Error(`GitHub Actions ${stage} produced an expired artifact: ${expectedName}`);
  }
  if (!artifact.id || !(artifact.size_in_bytes > 0)) {
    throw new Error(`GitHub Actions ${stage} produced an unusable artifact: ${expectedName}`);
  }
  return artifact;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function requireAdapterValue(value, name) {
  if (!value) {
    throw new Error(`GitHub Actions adapter requires ${name}`);
  }
  return value;
}

function responseMessage(payload) {
  if (payload && typeof payload.message === "string") {
    return payload.message;
  }
  return "GitHub API request failed";
}

function requireDispatchId(dispatchId) {
  if (typeof dispatchId !== "string" || dispatchId.trim() === "") {
    const error = new Error("GitHub Actions dispatch requires a non-empty dispatchId");
    error.code = "remote-dispatch-id-missing";
    throw error;
  }
  return dispatchId;
}

function runNameForDispatch(slug, dispatchId) {
  return `${slug} / ${dispatchId}`;
}

function expectedRunName(dispatch, dispatchId) {
  const expectedName = runNameForDispatch(dispatch.slug, dispatchId);
  if (dispatch.runName && dispatch.runName !== expectedName) {
    const error = new Error(`GitHub Actions dispatch 的 Run 名称与 dispatchId 不一致：期望 ${expectedName}，实际 ${dispatch.runName}`);
    error.code = "remote-dispatch-id-mismatch";
    error.dispatchId = dispatchId;
    throw error;
  }
  return expectedName;
}

function dispatchBindingMismatchError(field, expected, actual) {
  const error = new Error(`GitHub Actions dispatch 的 ${field} 不一致：期望 ${expected}，实际 ${actual}`);
  error.code = "remote-dispatch-binding-mismatch";
  return error;
}

function dispatchRunDetails(payload) {
  if (payload?.workflow_run_id === undefined || payload?.workflow_run_id === null) {
    return null;
  }
  return {
    runId: payload.workflow_run_id,
    ...(payload.workflow_run_url ? { runApiUrl: payload.workflow_run_url } : {}),
    ...(payload.html_url ? { runUrl: payload.html_url } : {}),
  };
}

function exactRunName(run, expectedName) {
  return run?.display_title === expectedName || run?.run_name === expectedName;
}

function ambiguousDispatchError(dispatch, candidates) {
  const error = new Error(`GitHub Actions returned multiple Runs for dispatchId ${dispatch.dispatchId}`);
  error.code = "remote-dispatch-ambiguous";
  error.candidates = candidates.map((run) => ({
    id: run.id,
    url: run.html_url ?? run.url ?? null,
    displayTitle: run.display_title ?? run.run_name ?? null,
    createdAt: run.created_at ?? null,
  }));
  error.issues = error.candidates;
  return error;
}

export function createGitHubActionsAdapter({
  token,
  repository,
  ref,
  apiUrl = DEFAULT_API_URL,
  workflowByStage = WORKFLOWS_BY_STAGE,
  fetchImpl = globalThis.fetch,
  now = () => new Date(),
  discoveryTimeoutMs = DEFAULT_DISCOVERY_TIMEOUT_MS,
  discoveryPollIntervalMs = DEFAULT_DISCOVERY_POLL_INTERVAL_MS,
  runTimeoutMs = DEFAULT_RUN_TIMEOUT_MS,
  runPollIntervalMs = DEFAULT_RUN_POLL_INTERVAL_MS,
  sleepImpl = sleep,
  renderInputUrl = null,
  renderInputSha256 = null,
  requireRenderInput = false,
} = {}) {
  requireAdapterValue(token, "token");
  requireAdapterValue(repository, "repository");
  requireAdapterValue(ref, "ref");
  if (typeof fetchImpl !== "function") {
    throw new Error("GitHub Actions adapter requires fetch");
  }

  const baseUrl = apiUrl.replace(/\/$/, "");

  async function request(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "video-production-harness/0.2",
        ...(options.headers ?? {}),
      },
    });

    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { message: text.slice(0, 200) };
      }
    }

    if (!response.ok) {
      const error = new Error(`GitHub API ${response.status}: ${responseMessage(payload)}`);
      if (response.status === 401) error.code = "github-auth-invalid";
      else if (response.status === 403) error.code = "github-permission-denied";
      throw error;
    }
    return payload;
  }

  function workflowPath(stage) {
    const workflow = workflowByStage[stage];
    if (!workflow) {
      throw new Error(`GitHub Actions adapter does not support stage ${stage}`);
    }
    return workflow;
  }

  function createDispatch({ stage, project, dispatchedAt = now().toISOString(), dispatchId = randomUUID() }) {
    const workflow = workflowPath(stage);
    const slug = project.state.slug;
    const compositionId = project.config.compositionId ?? slug;
    const resolvedDispatchId = requireDispatchId(dispatchId);
    const dispatch = {
      workflow,
      ref,
      slug,
      compositionId,
      dispatchId: resolvedDispatchId,
      runName: runNameForDispatch(slug, resolvedDispatchId),
      dispatchedAt,
      dispatchState: "prepared",
    };
    let delivery = null;
    if (project?.config?.workspaceRoot) {
      delivery = readRenderInputDelivery(project.config.workspaceRoot, slug);
    }
    if (delivery?.url && delivery?.archiveSha256) {
      if (delivery.videoSlug !== slug || (delivery.compositionId && delivery.compositionId !== compositionId)) {
        const error = new Error(`视频 ${slug} 的输入包交付绑定与当前 Composition 不一致`);
        error.code = "render-input-delivery-invalid";
        throw error;
      }
      dispatch.renderInputUrl = delivery.url;
      dispatch.renderInputSha256 = delivery.archiveSha256;
      dispatch.renderInputPackageFingerprint = delivery.packageFingerprint ?? null;
    } else if (renderInputUrl && renderInputSha256 && stage !== "render") {
      // Standalone Smoke can receive its explicit workflow input without affecting Complete Render.
      dispatch.renderInputUrl = renderInputUrl;
      dispatch.renderInputSha256 = renderInputSha256;
    }
    return dispatch;
  }

  async function dispatchWorkflow({
    stage,
    project,
    dispatchedAt = now().toISOString(),
    dispatchId = randomUUID(),
    dispatch: persistedDispatch = null,
  }) {
    let dispatch;
    if (persistedDispatch) {
      const resolvedDispatchId = requireDispatchId(persistedDispatch.dispatchId ?? dispatchId);
      const resolvedSlug = persistedDispatch.slug ?? project.state.slug;
      const resolvedRunName = expectedRunName({ ...persistedDispatch, slug: resolvedSlug }, resolvedDispatchId);
      dispatch = {
        ...persistedDispatch,
        slug: resolvedSlug,
        dispatchId: resolvedDispatchId,
        runName: resolvedRunName,
      };
    } else {
      dispatch = createDispatch({ stage, project, dispatchedAt, dispatchId });
    }

    const expectedWorkflow = workflowPath(stage);
    if (dispatch.workflow !== expectedWorkflow) {
      throw dispatchBindingMismatchError("Workflow", expectedWorkflow, dispatch.workflow);
    }
    if (dispatch.ref !== ref) {
      throw dispatchBindingMismatchError("Git 分支", ref, dispatch.ref);
    }
    if (dispatch.slug !== project.state.slug) {
      throw dispatchBindingMismatchError("video slug", project.state.slug, dispatch.slug);
    }
    const expectedCompositionId = project.config.compositionId ?? project.state.slug;
    if (dispatch.compositionId !== expectedCompositionId) {
      throw dispatchBindingMismatchError("Composition ID", expectedCompositionId, dispatch.compositionId);
    }

    if (requireRenderInput && stage === "render" && (!dispatch.renderInputUrl || !dispatch.renderInputSha256)) {
      const error = new Error(`视频 ${dispatch.slug} 缺少已绑定的输入包 URL 和 SHA-256，请先绑定该视频的发布包`);
      error.code = "render-input-remote-config-invalid";
      throw error;
    }

    const payload = await request(`/repos/${repository}/actions/workflows/${encodeURIComponent(dispatch.workflow)}/dispatches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: dispatch.ref,
        return_run_details: true,
        inputs: {
          video_slug: dispatch.slug,
          composition_id: dispatch.compositionId,
          dispatch_id: dispatch.dispatchId,
          ...(dispatch.renderInputUrl && dispatch.renderInputSha256
            ? { render_input_url: dispatch.renderInputUrl, render_input_sha256: dispatch.renderInputSha256 }
            : {}),
        },
      }),
    });

    const runDetails = dispatchRunDetails(payload);
    return {
      ...dispatch,
      ...(runDetails ?? {
        dispatchState: "sending",
        dispatchSentAt: now().toISOString(),
      }),
      ...(runDetails ? {
        ...runDetails,
        dispatchState: "confirmed",
        dispatchConfirmedAt: now().toISOString(),
      } : {}),
    };
  }

  async function verifyDispatchRef({ project, dispatch }) {
    const localSha = localGitCommit(project.config.workspaceRoot, dispatch.ref);
    if (!localSha) {
      const error = new Error(`无法在本地解析 dispatch 分支：${dispatch.ref}`);
      error.code = "remote-ref-local-missing";
      throw error;
    }
    const payload = await request(
      `/repos/${repository}/git/ref/heads/${encodeURIComponent(dispatch.ref)}`,
    );
    const remoteSha = payload?.object?.sha;
    if (!remoteSha) {
      const error = new Error(`GitHub 未返回 dispatch 分支的提交：${dispatch.ref}`);
      error.code = "remote-ref-invalid";
      throw error;
    }
    if (remoteSha !== localSha) {
      const error = new Error(`dispatch 分支 ${dispatch.ref} 尚未包含当前本地提交，请先 push 后再提交渲染`);
      error.code = "remote-ref-out-of-sync";
      error.localSha = localSha;
      error.remoteSha = remoteSha;
      throw error;
    }
    return { ref: dispatch.ref, localSha, remoteSha };
  }

  async function listRuns({ workflow, ref: runRef = null }) {
    const query = new URLSearchParams({
      event: "workflow_dispatch",
      per_page: "100",
    });
    if (runRef) query.set("branch", runRef);
    const payload = await request(
      `/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/runs?${query.toString()}`,
    );
    return Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  }

  async function findDispatchedRun(dispatch) {
    const deadline = Date.now() + discoveryTimeoutMs;

    while (true) {
      const matchingRun = await findDispatchedRunOnce(dispatch);
      if (matchingRun) {
        return matchingRun;
      }
      if (Date.now() >= deadline) {
        const error = new Error(`GitHub Actions Run was not discovered for dispatchId ${dispatch.dispatchId}`);
        error.code = "remote-dispatch-uncertain";
        error.dispatchId = dispatch.dispatchId;
        throw error;
      }
      await sleepImpl(discoveryPollIntervalMs);
    }
  }

  async function findDispatchedRunOnce(dispatch) {
    const dispatchId = requireDispatchId(dispatch.dispatchId);
    const expectedName = expectedRunName(dispatch, dispatchId);
    const runs = await listRuns(dispatch);
    const candidates = runs
      .filter((run) => run.head_branch === dispatch.ref)
      .filter((run) => run?.id !== undefined && run?.id !== null)
      .filter((run) => exactRunName(run, expectedName));
    if (candidates.length > 1) {
      throw ambiguousDispatchError(dispatch, candidates);
    }
    return candidates[0] ?? null;
  }

  async function findSuccessfulRunsWithArtifactOnce(dispatch, { anyBranch = false } = {}) {
    const runs = await listRuns(anyBranch ? { ...dispatch, ref: null } : dispatch);
    const artifactStage = dispatch.workflow === "render-video.yml" ? "render" : "smoke-render";
    const expectedName = expectedArtifactName(artifactStage, dispatch.slug);
    const candidates = runs
      .filter((run) => anyBranch || run.head_branch === dispatch.ref)
      .filter((run) => run.status === "completed" && run.conclusion === "success")
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));

    const matches = [];
    for (const run of candidates) {
      const artifacts = await listArtifacts(run.id);
      const artifact = artifacts.find((item) => item.name === expectedName);
      if (artifact && !artifact.expired && artifact.id && artifact.size_in_bytes > 0) {
        matches.push({ run, artifacts, artifact });
      }
    }
    return matches;
  }

  async function findSuccessfulRunWithArtifactOnce(dispatch, options = {}) {
    return (await findSuccessfulRunsWithArtifactOnce(dispatch, options))[0] ?? null;
  }

  async function getRun(runId) {
    return request(`/repos/${repository}/actions/runs/${runId}`);
  }

  async function listArtifacts(runId) {
    const payload = await request(`/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`);
    return Array.isArray(payload?.artifacts) ? payload.artifacts : [];
  }

  function outputForRun(stage, dispatch, run, artifacts, expectedArtifact) {
    return {
      kind: "github-actions-run",
      stage,
      workflow: dispatch.workflow,
      ref: dispatch.ref,
      runId: run.id,
      runApiUrl: run.url,
      runUrl: run.html_url,
      status: run.status,
      conclusion: run.conclusion,
      artifactName: expectedArtifact.name,
      artifacts: artifacts.map((artifact) => ({
        name: artifact.name,
        id: artifact.id,
        sizeInBytes: artifact.size_in_bytes,
        expired: artifact.expired,
        archiveDownloadUrl: artifact.archive_download_url,
        createdAt: artifact.created_at,
        expiresAt: artifact.expires_at,
      })),
    };
  }

  async function inspectRun({ stage, dispatch, runId = null, recoverExisting = false }) {
    let run = runId !== null && runId !== undefined ? await getRun(runId) : await findDispatchedRunOnce(dispatch);
    let artifacts = null;
    if (!run) {
      return { status: "waiting-run", run: null, remote: dispatch };
    }
    const remote = {
      ...dispatch,
      runId: run.id,
      ...(run.url ? { runApiUrl: run.url } : {}),
      ...(run.html_url ? { runUrl: run.html_url } : {}),
      dispatchState: "confirmed",
      dispatchConfirmedAt: dispatch.dispatchConfirmedAt ?? run.created_at ?? now().toISOString(),
    };
    if (run.status !== "completed") {
      return { status: "running", run, remote };
    }
    if (run.conclusion !== "success") {
      return {
        status: "failed",
        run,
        remote,
        error: `GitHub Actions run ${run.id} ended with ${run.conclusion ?? "unknown"}`,
      };
    }
    artifacts ??= await listArtifacts(run.id);
    const expectedArtifact = requireUsableArtifact(stage, dispatch.slug, artifacts);
    return {
      status: "succeeded",
      run,
      remote,
      result: { outputs: [outputForRun(stage, dispatch, run, artifacts, expectedArtifact)] },
    };
  }

  async function waitForRun(dispatch) {
    const discoveredRun = dispatch.runId !== null && dispatch.runId !== undefined
      ? null
      : await findDispatchedRun(dispatch);
    const trackedRunId = dispatch.runId ?? discoveredRun?.id;
    const deadline = Date.now() + runTimeoutMs;
    let run = discoveredRun ?? await getRun(trackedRunId);

    while (run.status !== "completed") {
      if (Date.now() >= deadline) {
        throw new Error(`GitHub Actions run ${run.id} timed out`);
      }
      await sleepImpl(runPollIntervalMs);
      run = await getRun(trackedRunId);
    }

    if (run.conclusion !== "success") {
      throw new Error(`GitHub Actions run ${run.id} ended with ${run.conclusion ?? "unknown"}`);
    }

    return { run, artifacts: await listArtifacts(run.id) };
  }

  return {
    requiresRenderPreflight: true,
    async run({ stage, project, defer = false, dispatchId = randomUUID() }) {
      const dispatch = await dispatchWorkflow({ stage, project, dispatchId });
      if (defer) {
        return { deferred: true, remote: dispatch };
      }
      const { run, artifacts } = await waitForRun(dispatch);
      const expectedArtifact = requireUsableArtifact(stage, dispatch.slug, artifacts);
      return {
        outputs: [outputForRun(stage, dispatch, run, artifacts, expectedArtifact)],
      };
    },
    dispatchWorkflow,
    verifyDispatchRef,
    createDispatch,
    findDispatchedRun,
    findDispatchedRunOnce,
    findSuccessfulRunsWithArtifactOnce,
    findSuccessfulRunWithArtifactOnce,
    getRun,
    inspectRun,
    listArtifacts,
    waitForRun,
  };
}

export function createGitHubActionsAdapterFromEnv(options = {}) {
  const {
    environment = process.env,
    authSource,
    execFileSyncImpl,
    ghBinary,
    hostname,
    ...adapterOptions
  } = options;
  const config = requireGitHubActionsConfig(environment, {
    authSource,
    execFileSyncImpl,
    ghBinary,
    hostname,
  });
  return createGitHubActionsAdapter({
    ...config,
    requireRenderInput: true,
    ...adapterOptions,
  });
}
