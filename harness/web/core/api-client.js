export class ApiError extends Error {
  constructor(message, { code = "api-request-failed", issues = [], status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.issues = issues;
    this.status = status;
  }
}

async function errorFromResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Keep a stable error shape when the server did not return JSON.
  }
  return new ApiError(payload.error ?? `HTTP ${response.status}`, {
    code: payload.code ?? "api-request-failed",
    issues: Array.isArray(payload.issues) ? payload.issues : [],
    status: response.status,
  });
}

async function readJson(response) {
  return response.json();
}

export function createApiClient({ fetchImpl = globalThis.fetch, baseUrl = "" } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");

  async function request(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      cache: "no-store",
    });
    if (!response.ok) throw await errorFromResponse(response);
    return response;
  }

  async function json(path, options) {
    return readJson(await request(path, options));
  }

  return {
    request,
    getHealth: () => json("/api/health"),
    getProjects: async () => (await json("/api/projects")).projects ?? [],
    getProject: async (slug) => (await json(`/api/projects/${encodeURIComponent(slug)}`)).project,
    getProjectWorkspace: async (slug) => json(`/api/projects/${encodeURIComponent(slug)}/workspace`),
    getProjectFile: async (slug, filePath) => {
      const query = new URLSearchParams({ path: filePath });
      return (await json(`/api/projects/${encodeURIComponent(slug)}/file?${query}`)).file;
    },
    getBatches: async () => json("/api/batches"),
    getRemotionTasks: async () => (await json("/api/remotion-tasks")).tasks ?? [],
    getSeries: async () => (await json("/api/series")).series ?? [],
    getGitHubDiagnostics: () => json("/api/diagnostics/github"),
    runProjectAction: (slug, body) => json(`/api/projects/${encodeURIComponent(slug)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    runBatchAction: (id, body) => json(`/api/batches/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    runRemotionTaskAction: (id, body) => json(`/api/remotion-tasks/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    runAgentJobAction: (id, body) => json(`/api/agent-jobs/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  };
}

export const apiClient = createApiClient();
