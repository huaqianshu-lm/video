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

const DEFAULT_API_URL = "https://api.github.com";
const DEFAULT_DISCOVERY_TIMEOUT_MS = 120_000;
const DEFAULT_RUN_TIMEOUT_MS = 45 * 60 * 1_000;
const DEFAULT_DISCOVERY_POLL_INTERVAL_MS = 5_000;
const DEFAULT_RUN_POLL_INTERVAL_MS = 20 * 60 * 1_000;

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
        "User-Agent": "video-production-harness/0.1",
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

  async function dispatchWorkflow({ stage, project }) {
    const workflow = workflowPath(stage);
    const slug = project.state.slug;
    const compositionId = project.config.compositionId ?? slug;
    const dispatchedAt = now().toISOString();

    await request(`/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/dispatches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref,
        inputs: {
          video_slug: slug,
          composition_id: compositionId,
        },
      }),
    });

    return { workflow, ref, slug, compositionId, dispatchedAt };
  }

  async function listRuns({ workflow, ref: runRef }) {
    const query = new URLSearchParams({
      event: "workflow_dispatch",
      branch: runRef,
      per_page: "20",
    });
    const payload = await request(
      `/repos/${repository}/actions/workflows/${encodeURIComponent(workflow)}/runs?${query.toString()}`,
    );
    return Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  }

  async function findDispatchedRun(dispatch) {
    const startTime = Date.parse(dispatch.dispatchedAt) - 15_000;
    const deadline = Date.now() + discoveryTimeoutMs;

    while (true) {
      const runs = await listRuns(dispatch);
      const matchingRun = runs
        .filter((run) => run.head_branch === dispatch.ref)
        .filter((run) => Date.parse(run.created_at) >= startTime)
        .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0];
      if (matchingRun) {
        return matchingRun;
      }
      if (Date.now() >= deadline) {
        throw new Error(`GitHub Actions run was not discovered for ${dispatch.workflow}`);
      }
      await sleepImpl(discoveryPollIntervalMs);
    }
  }

  async function getRun(runId) {
    return request(`/repos/${repository}/actions/runs/${runId}`);
  }

  async function listArtifacts(runId) {
    const payload = await request(`/repos/${repository}/actions/runs/${runId}/artifacts?per_page=100`);
    return Array.isArray(payload?.artifacts) ? payload.artifacts : [];
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
    async run({ stage, project }) {
      const dispatch = await dispatchWorkflow({ stage, project });
      const { run, artifacts } = await waitForRun(dispatch);
      return {
        outputs: [
          {
            kind: "github-actions-run",
            stage,
            workflow: dispatch.workflow,
            ref: dispatch.ref,
            runId: run.id,
            runUrl: run.html_url,
            status: run.status,
            conclusion: run.conclusion,
            artifacts: artifacts.map((artifact) => ({
              name: artifact.name,
              id: artifact.id,
              sizeInBytes: artifact.size_in_bytes,
              expired: artifact.expired,
            })),
          },
        ],
      };
    },
    dispatchWorkflow,
    findDispatchedRun,
    getRun,
    listArtifacts,
    waitForRun,
  };
}

export function createGitHubActionsAdapterFromEnv(options = {}) {
  return createGitHubActionsAdapter({
    token: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN,
    repository: process.env.GITHUB_REPOSITORY,
    ref: process.env.GITHUB_REF_NAME ?? process.env.HARNESS_GITHUB_REF,
    ...options,
  });
}
