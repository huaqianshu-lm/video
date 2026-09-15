import { execFileSync } from "node:child_process";

export const GITHUB_AUTH_SOURCE = Object.freeze({
  GH_CLI: "gh-cli",
  ENV: "env",
});

const DEFAULT_HOSTNAME = "github.com";

function nonEmpty(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function authIssue(code, message) {
  return { code, field: "GITHUB_TOKEN", message };
}

function sourceFor(environment, requestedSource, injectedEnvironment) {
  const requested = nonEmpty(requestedSource ?? environment.HARNESS_GITHUB_AUTH_SOURCE).toLowerCase();
  if (requested) return requested;
  if (injectedEnvironment) return GITHUB_AUTH_SOURCE.ENV;
  const isCi = [environment.GITHUB_ACTIONS, environment.CI]
    .some((value) => ["1", "true", "yes"].includes(String(value ?? "").toLowerCase()));
  if (isCi) return GITHUB_AUTH_SOURCE.ENV;
  return GITHUB_AUTH_SOURCE.GH_CLI;
}

function readEnvironmentToken(environment) {
  const githubToken = nonEmpty(environment.GITHUB_TOKEN);
  const ghToken = nonEmpty(environment.GH_TOKEN);
  if (githubToken && ghToken && githubToken !== ghToken) {
    return {
      token: "",
      issue: authIssue(
        "github-auth-ambiguous",
        "GITHUB_TOKEN 和 GH_TOKEN 同时存在但内容不同，请只保留一个有效认证来源。",
      ),
    };
  }
  const token = githubToken || ghToken;
  return token
    ? { token, issue: null }
    : { token: "", issue: authIssue("missing-token", "GITHUB_TOKEN or GH_TOKEN is required") };
}

function readGhCliToken({ environment, execFileSyncImpl, ghBinary, hostname }) {
  const childEnvironment = { ...environment };
  // gh otherwise gives these variables precedence over its system credential store.
  delete childEnvironment.GITHUB_TOKEN;
  delete childEnvironment.GH_TOKEN;

  let output;
  try {
    output = execFileSyncImpl(ghBinary, ["auth", "token", "--hostname", hostname], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: childEnvironment,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return {
      token: "",
      issue: authIssue(
        "github-auth-unavailable",
        "无法从 GitHub CLI 读取有效认证，请先运行 gh auth login --hostname github.com。",
      ),
    };
  }

  const token = nonEmpty(output);
  if (!token || /\s/.test(token)) {
    return {
      token: "",
      issue: authIssue(
        "github-auth-empty",
        "GitHub CLI 没有返回有效认证，请先运行 gh auth login --hostname github.com。",
      ),
    };
  }
  return { token, issue: null };
}

export function resolveGitHubToken({
  environment = process.env,
  authSource = null,
  execFileSyncImpl = execFileSync,
  ghBinary = "gh",
  hostname = DEFAULT_HOSTNAME,
} = {}) {
  const source = sourceFor(environment, authSource, environment !== process.env);
  if (!Object.values(GITHUB_AUTH_SOURCE).includes(source)) {
    return {
      token: "",
      source,
      issue: authIssue(
        "github-auth-source-invalid",
        `HARNESS_GITHUB_AUTH_SOURCE 必须是 ${GITHUB_AUTH_SOURCE.GH_CLI} 或 ${GITHUB_AUTH_SOURCE.ENV}。`,
      ),
    };
  }

  const result = source === GITHUB_AUTH_SOURCE.ENV
    ? readEnvironmentToken(environment)
    : readGhCliToken({ environment, execFileSyncImpl, ghBinary, hostname });
  return { ...result, source };
}
