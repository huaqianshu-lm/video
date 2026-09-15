import { validateGitHubActionsConfig } from "./github-config.mjs";
import { validateRenderInputDelivery } from "./render-input.mjs";

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
  project = null,
  checkRenderInput = true,
  authSource = null,
  execFileSyncImpl,
  ghBinary,
  hostname,
} = {}) {
  const validation = validateGitHubActionsConfig(environment, {
    authSource,
    execFileSyncImpl,
    ghBinary,
    hostname,
  });
  const checks = [];
  const deliveryIssues = checkRenderInput
    ? (project ? validateRenderInputDelivery(project) : ["远程输入包必须按视频绑定 URL、Composition ID 和 SHA-256"])
    : [];
  const renderInputConfigured = deliveryIssues.length === 0;
  const config = {
    valid: validation.valid,
    tokenConfigured: Boolean(validation.config.token.trim()),
    repository: validation.config.repository,
    ref: validation.config.ref,
    renderInputConfigured: checkRenderInput ? renderInputConfigured : null,
    authSource: validation.authSource,
    issues: validation.issues,
  };

  if (!validation.valid) {
    checks.push(check("configuration", "failed", "GitHub Actions 配置不完整，未发起远程请求。"));
    return { ok: false, config, checks };
  }
  if (checkRenderInput && !renderInputConfigured) {
    checks.push(check(
      "render-input",
      "failed",
      deliveryIssues.join("；"),
    ));
  } else if (checkRenderInput) {
    checks.push(check("render-input", "ok", "独立远程输入包配置完整，具体视频资料不会进入能力仓库。"));
  }
  if (typeof fetchImpl !== "function") {
    checks.push(check("configuration", "failed", "当前 Node 环境没有可用的 fetch。"));
    return { ok: false, config, checks };
  }

  const baseUrl = apiUrl.replace(/\/$/, "");
  async function probe(path, label) {
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, { headers: requestHeaders(validation.config.token) });
      let payload = null;
      if (typeof response.json === "function") {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      }
      return {
        check: response.ok
          ? check(label, "ok", "可访问")
          : check(label, "failed", `GitHub API 返回 HTTP ${response.status}`),
        payload,
      };
    } catch (error) {
      return {
        check: check(label, "failed", error instanceof Error ? error.message : String(error)),
        payload: null,
      };
    }
  }

  checks.push(check("configuration", "ok", "本地配置字段完整，Token 值不会显示或持久化。"));
  const authentication = await probe("/user", "authentication");
  checks.push(authentication.check);
  const repository = await probe(`/repos/${validation.config.repository}`, "repository");
  checks.push(repository.check);
  if (repository.check.status === "ok" && repository.payload?.permissions?.push === false) {
    checks.push(check("repository-write", "failed", "当前 GitHub Token 可以读取仓库，但没有推送所需的 contents 写权限。"));
  } else if (repository.check.status === "ok" && repository.payload?.permissions?.push === true) {
    checks.push(check("repository-write", "ok", "仓库报告当前 Token 具有推送权限。"));
  }
  checks.push((await probe(
    `/repos/${validation.config.repository}/git/ref/heads/${encodeURIComponent(validation.config.ref)}`,
    "ref",
  )).check);
  for (const workflow of WORKFLOWS) {
    checks.push((await probe(
      `/repos/${validation.config.repository}/actions/workflows/${encodeURIComponent(workflow.file)}`,
      `${workflow.stage} workflow`,
    )).check);
  }

  return {
    ok: checks.every((item) => item.status === "ok"),
    config,
    checks,
  };
}

function preflightIssue(checkItem) {
  return {
    code: `github-preflight-${checkItem.name}`,
    message: checkItem.message,
  };
}

export async function assertGitHubActionsReady(options = {}) {
  const diagnostics = await diagnoseGitHubActions({
    ...options,
    checkRenderInput: options.checkRenderInput ?? false,
  });
  if (diagnostics.ok) return diagnostics;

  const failed = diagnostics.checks.filter((item) => item.status === "failed");
  const authFailed = failed.some((item) => item.name === "authentication")
    || diagnostics.config.issues.some((issue) => String(issue.code ?? "").startsWith("github-auth-") || issue.code === "missing-token");
  const error = new Error(failed.length > 0
    ? failed.map((item) => item.message).join("；")
    : "GitHub Actions 远程预检失败");
  error.code = authFailed
    ? "github-auth-invalid"
    : diagnostics.config.issues.length > 0 ? "github-config-invalid" : "github-preflight-failed";
  error.issues = [
    ...diagnostics.config.issues.map((issue) => ({ code: issue.code, message: issue.message })),
    ...failed.map(preflightIssue),
  ];
  error.diagnostics = {
    config: {
      valid: diagnostics.config.valid,
      tokenConfigured: diagnostics.config.tokenConfigured,
      repository: diagnostics.config.repository,
      ref: diagnostics.config.ref,
      renderInputConfigured: diagnostics.config.renderInputConfigured,
      authSource: diagnostics.config.authSource,
    },
    checks: diagnostics.checks,
  };
  throw error;
}
