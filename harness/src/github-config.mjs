import { execFileSync } from "node:child_process";

const repositoryPattern = /^[^/\s]+\/[^/\s]+$/;

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
