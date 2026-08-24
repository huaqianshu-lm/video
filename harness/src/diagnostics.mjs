import { validateGitHubActionsConfig } from "./github-config.mjs";

const DEFAULT_API_URL = "https://api.github.com";
const WORKFLOWS = Object.freeze([
  { stage: "smoke-render", file: "smoke-test-video.yml" },
  { stage: "render", file: "render-video.yml" },
]);

function check(name, status, message) {
  return { name, status, message };
}

function requestHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "video-production-harness/0.6",
  };
}

export async function diagnoseGitHubActions({
  environment = process.env,
  apiUrl = DEFAULT_API_URL,
  fetchImpl = globalThis.fetch,
} = {}) {
  const validation = validateGitHubActionsConfig(environment);
  const checks = [];
  const config = {
    valid: validation.valid,
    tokenConfigured: Boolean(validation.config.token.trim()),
    repository: validation.config.repository,
    ref: validation.config.ref,
    issues: validation.issues,
  };

  if (!validation.valid) {
    checks.push(check("configuration", "failed", "GitHub Actions 配置不完整，未发起远程请求。"));
    return { ok: false, config, checks };
  }
  if (typeof fetchImpl !== "function") {
    checks.push(check("configuration", "failed", "当前 Node 环境没有可用的 fetch。"));
    return { ok: false, config, checks };
  }

  const baseUrl = apiUrl.replace(/\/$/, "");
  async function probe(path, label) {
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, { headers: requestHeaders(validation.config.token) });
      return response.ok
        ? check(label, "ok", "可访问")
        : check(label, "failed", `GitHub API 返回 HTTP ${response.status}`);
    } catch (error) {
      return check(label, "failed", error instanceof Error ? error.message : String(error));
    }
  }

  checks.push(check("configuration", "ok", "本地配置字段完整，Token 值不会显示或持久化。"));
  checks.push(await probe(`/repos/${validation.config.repository}`, "repository"));
  checks.push(await probe(
    `/repos/${validation.config.repository}/git/ref/heads/${encodeURIComponent(validation.config.ref)}`,
    "ref",
  ));
  for (const workflow of WORKFLOWS) {
    checks.push(await probe(
      `/repos/${validation.config.repository}/actions/workflows/${encodeURIComponent(workflow.file)}`,
      `${workflow.stage} workflow`,
    ));
  }

  return {
    ok: checks.every((item) => item.status === "ok"),
    config,
    checks,
  };
}
