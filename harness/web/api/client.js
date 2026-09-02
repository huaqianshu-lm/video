export class ApiError extends Error {
  constructor(message, { code = "api-request-failed", issues = [], status = 0 } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.issues = issues;
    this.status = status;
  }
}

async function toApiError(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // Keep a stable error when a server or proxy returns non-JSON.
  }
  return new ApiError(payload.error ?? `HTTP ${response.status}`, {
    code: payload.code ?? "api-request-failed",
    issues: Array.isArray(payload.issues) ? payload.issues : [],
    status: response.status,
  });
}

export function createApiClient({ fetchImpl = globalThis.fetch, baseUrl = "" } = {}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required");

  async function request(path, options = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options,
      cache: "no-store",
    });
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  async function json(path, options) {
    return request(path, options).then((response) => response.json());
  }

  return Object.freeze({
    getHealth: () => json("/api/health"),
    getProjects: async () => (await json("/api/projects")).projects ?? [],
    getProject: async (slug) => (await json(`/api/projects/${encodeURIComponent(slug)}`)).project,
    getProjectWorkspace: (slug) => json(`/api/projects/${encodeURIComponent(slug)}/workspace`),
    getProjectFile: async (slug, filePath) => {
      const query = new URLSearchParams({ path: filePath });
      return (await json(`/api/projects/${encodeURIComponent(slug)}/file?${query}`)).file;
    },
    getProjectJobs: (slug) => json(`/api/projects/${encodeURIComponent(slug)}/jobs`),
    getJobs: async () => (await json("/api/jobs")).jobs ?? [],
    getAgentJobs: async () => (await json("/api/agent-jobs")).jobs ?? [],
    getBatches: () => json("/api/batches"),
    getRemotionTasks: async () => (await json("/api/remotion-tasks")).tasks ?? [],
    getRemotionTask: async (id) => (await json(`/api/remotion-tasks/${encodeURIComponent(id)}`)).task,
    getSeries: async () => (await json("/api/series")).series ?? [],
    getGitHubDiagnostics: () => json("/api/diagnostics/github"),
    importSource: (file, { slug, seriesId } = {}) => {
      const query = new URLSearchParams({ filename: file.name });
      if (slug) query.set("slug", slug);
      if (seriesId && seriesId !== "none") query.set("seriesId", seriesId);
      return json(`/api/projects/import?${query}`, {
        method: "PUT",
        headers: { "Content-Type": file.type || "text/plain" },
        body: file,
      });
    },
    saveSeries: (input) => json("/api/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    uploadSeriesCover: (id, blob) => json(`/api/series/${encodeURIComponent(id)}/cover`, {
      method: "PUT",
      headers: { "Content-Type": blob.type },
      body: blob,
    }),
    runProjectAction: (slug, input) => json(`/api/projects/${encodeURIComponent(slug)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    createBatch: (input) => json("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    runBatchAction: (id, input) => json(`/api/batches/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    runRemotionTaskAction: (id, input) => json(`/api/remotion-tasks/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
    runAgentJobAction: (id, input) => json(`/api/agent-jobs/${encodeURIComponent(id)}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  });
}

export const apiClient = createApiClient();
