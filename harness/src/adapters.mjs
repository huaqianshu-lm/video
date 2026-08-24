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
      throw new Error(`GitHub API ${response.status}: ${responseMessage(payload)}`);
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

  function createDispatch({ stage, project, dispatchedAt = now().toISOString() }) {
    const workflow = workflowPath(stage);
    const slug = project.state.slug;
    const compositionId = project.config.compositionId ?? slug;
    return { workflow, ref, slug, compositionId, dispatchedAt, dispatchState: "pending" };
  }

  async function dispatchWorkflow({ stage, project, dispatchedAt = now().toISOString() }) {
    const dispatch = createDispatch({ stage, project, dispatchedAt });

    await request(`/repos/${repository}/actions/workflows/${encodeURIComponent(dispatch.workflow)}/dispatches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref,
        inputs: {
          video_slug: dispatch.slug,
          composition_id: dispatch.compositionId,
        },
      }),
    });

    return {
      ...dispatch,
      dispatchState: "confirmed",
      dispatchConfirmedAt: now().toISOString(),
    };
  }

  async function listRuns({ workflow, ref: runRef = null }) {
    const query = new URLSearchParams({
      event: "workflow_dispatch",
      per_page: "20",
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
        throw new Error(`GitHub Actions run was not discovered for ${dispatch.workflow}`);
      }
      await sleepImpl(discoveryPollIntervalMs);
    }
  }

  async function findDispatchedRunOnce(dispatch) {
    const startTime = Date.parse(dispatch.dispatchedAt) - 15_000;
    const runs = await listRuns(dispatch);
    return runs
      .filter((run) => run.head_branch === dispatch.ref)
      .filter((run) => Date.parse(run.created_at) >= startTime)
      .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0] ?? null;
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
    let run = runId ? await getRun(runId) : await findDispatchedRunOnce(dispatch);
    let artifacts = null;
    if (!run && recoverExisting) {
      const recovered = await findSuccessfulRunWithArtifactOnce(dispatch);
      if (recovered) {
        run = recovered.run;
        artifacts = recovered.artifacts;
      }
    }
    if (!run) {
      return { status: "waiting-run", run: null, remote: dispatch };
    }
    const remote = { ...dispatch, runId: run.id, runUrl: run.html_url };
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
    const discoveredRun = await findDispatchedRun(dispatch);
    const deadline = Date.now() + runTimeoutMs;
    let run = discoveredRun;

    while (run.status !== "completed") {
      if (Date.now() >= deadline) {
        throw new Error(`GitHub Actions run ${run.id} timed out`);
      }
      await sleepImpl(runPollIntervalMs);
      run = await getRun(discoveredRun.id);
    }

    if (run.conclusion !== "success") {
      throw new Error(`GitHub Actions run ${run.id} ended with ${run.conclusion ?? "unknown"}`);
    }

    return { run, artifacts: await listArtifacts(run.id) };
  }

  return {
    async run({ stage, project, defer = false }) {
      const dispatch = await dispatchWorkflow({ stage, project });
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
  const config = requireGitHubActionsConfig();
  return createGitHubActionsAdapter({
    ...config,
    ...options,
  });
}
