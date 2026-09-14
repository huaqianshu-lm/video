import { execFileSync } from "node:child_process";

const repositoryPattern = /^[^/\s]+\/[^/\s]+$/;
const githubReleaseDownloadPattern = /^\/[^/\s]+\/[^/\s]+\/releases\/download\//i;

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) ?? "";
}

export function readCurrentGitRef(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

export function readGitHubActionsConfig(environment = process.env, options = {}) {
  const currentGitRef = options.currentGitRef ?? readCurrentGitRef(options.cwd);

  return {
    token: firstNonEmpty(environment.GITHUB_TOKEN, environment.GH_TOKEN),
    repository: firstNonEmpty(environment.GITHUB_REPOSITORY),
    ref: firstNonEmpty(environment.HARNESS_GITHUB_REF, currentGitRef, environment.GITHUB_REF_NAME),
  };
}

export function validateRenderInputUrl(value) {
  const url = typeof value === "string" ? value.trim() : "";
  if (!url) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { code: "invalid-render-input-url", message: "HARNESS_RENDER_INPUT_URL 必须是有效的 HTTP(S) 地址。" };
  }

  if (!(parsed.protocol === "http:" || parsed.protocol === "https:")) {
    return { code: "invalid-render-input-url", message: "HARNESS_RENDER_INPUT_URL 必须使用 HTTP(S) 协议。" };
  }

  if (parsed.hostname.toLowerCase() === "github.com" && githubReleaseDownloadPattern.test(parsed.pathname)) {
    return {
      code: "github-release-download-url",
      message: "私有 GitHub Release 不能使用 /releases/download/ 网页地址，请改用 API 资产地址：https://api.github.com/repos/<owner>/<repo>/releases/assets/<asset-id>。",
    };
  }

  return null;
}

export function validateGitHubActionsConfig(environment = process.env, options = {}) {
  const config = readGitHubActionsConfig(environment, options);
  const issues = [];

  if (!config.token.trim()) {
    issues.push({ code: "missing-token", field: "GITHUB_TOKEN", message: "GITHUB_TOKEN or GH_TOKEN is required" });
  }
  if (!config.repository.trim()) {
    issues.push({ code: "missing-repository", field: "GITHUB_REPOSITORY", message: "GITHUB_REPOSITORY is required" });
  } else if (!repositoryPattern.test(config.repository)) {
    issues.push({ code: "invalid-repository", field: "GITHUB_REPOSITORY", message: "GITHUB_REPOSITORY must use the owner/name format" });
  }
  if (!config.ref.trim()) {
    issues.push({ code: "missing-ref", field: "GITHUB_REF_NAME", message: "GITHUB_REF_NAME or HARNESS_GITHUB_REF is required" });
  }

  return { config, issues, valid: issues.length === 0 };
}

export function requireGitHubActionsConfig(environment = process.env, options = {}) {
  const result = validateGitHubActionsConfig(environment, options);
  if (!result.valid) {
    const error = new Error(result.issues.map((issue) => issue.message).join("; "));
    error.code = "github-config-invalid";
    error.issues = result.issues;
    throw error;
  }
  return result.config;
}
