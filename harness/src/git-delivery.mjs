import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { readGitHubActionsConfig } from "./github-config.mjs";

const RENDER_RELEVANT_PREFIXES = [
  "src/",
  "assets/",
  ".github/workflows/",
];
const RENDER_RELEVANT_FILES = new Set(["package.json", "package-lock.json"]);

function gitCommand(workspaceRoot, args, { trim = true } = {}) {
  const output = execFileSync("git", ["-C", workspaceRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return trim ? output.trim() : output;
}

export function isGitWorkspace(workspaceRoot) {
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim()) return false;
  try {
    return Boolean(gitCommand(workspaceRoot, ["rev-parse", "--show-toplevel"]));
  } catch {
    return false;
  }
}

export function localGitCommit(workspaceRoot, ref = "HEAD") {
  try {
    return gitCommand(workspaceRoot, ["rev-parse", "--verify", `${ref}^{commit}`]);
  } catch {
    return null;
  }
}

function parseStatusPath(line) {
  const value = line.slice(3);
  if (value.includes(" -> ")) return value.split(" -> ").at(-1);
  return value;
}

function isRenderRelevantPath(relativePath) {
  return RENDER_RELEVANT_FILES.has(relativePath)
    || RENDER_RELEVANT_PREFIXES.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

export function renderRequiredPaths(project) {
  return [
    "src/Root.tsx",
    "src/TemplateVideo.tsx",
    "src/lib/timing.ts",
    "harness/src/cli.mjs",
    "harness/src/render-input.mjs",
    "harness/src/remote-executor.mjs",
    "package.json",
    "package-lock.json",
    ".github/workflows/smoke-test-video.yml",
    ".github/workflows/render-video.yml",
  ];
}

function isAutoCommitPath(relativePath, requiredPaths) {
  return requiredPaths.includes(relativePath)
    || relativePath.startsWith("src/components/")
    || relativePath.startsWith("src/lib/")
    || relativePath.startsWith("src/scenes/")
    || relativePath.startsWith("src/styles/")
    || relativePath.startsWith(".github/workflows/")
    || RENDER_RELEVANT_FILES.has(relativePath);
}

function currentBranchFor(workspaceRoot) {
  try {
    return gitCommand(workspaceRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch {
    return "";
  }
}

function statusPathsFor(workspaceRoot) {
  return gitCommand(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"], { trim: false })
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseStatusPath);
}

export function buildGitRenderCommitPlan(project, { environment = process.env } = {}) {
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    const error = new Error("缺少视频工作区路径，无法准备 Git 渲染交付");
    error.code = "git-render-commit-workspace-invalid";
    throw error;
  }
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  if (!isGitWorkspace(workspaceRoot)) {
    const error = new Error("渲染工作区不是 Git 仓库，无法准备 Git 渲染交付");
    error.code = "git-render-commit-repository-invalid";
    throw error;
  }
  const branch = currentBranchFor(workspaceRoot);
  if (!branch) {
    const error = new Error("当前工作区处于 detached HEAD，无法自动提交和推送");
    error.code = "git-render-commit-detached-head";
    throw error;
  }
  const config = readGitHubActionsConfig(environment, { currentGitRef: branch, cwd: workspaceRoot });
  const requiredPaths = renderRequiredPaths(project);
  const statusPaths = statusPathsFor(workspaceRoot);
  const relevantPaths = statusPaths.filter((relativePath) => isRenderRelevantPath(relativePath));
  const commitPaths = relevantPaths.filter((relativePath) => isAutoCommitPath(relativePath, requiredPaths));
  const outOfScopePaths = relevantPaths.filter((relativePath) => !isAutoCommitPath(relativePath, requiredPaths));

  return {
    branch,
    ref: config.ref,
    requiredPaths,
    commitPaths: [...new Set(commitPaths)],
    outOfScopePaths: [...new Set(outOfScopePaths)],
  };
}

function commitError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function commitAndPushRenderDelivery(
  project,
  { environment = process.env, commitMessage = `chore: prepare ${project.config.slug} smoke render delivery` } = {},
) {
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  const plan = buildGitRenderCommitPlan(project, { environment });
  if (plan.ref !== plan.branch) {
    throw commitError(`dispatch 分支 ${plan.ref} 与当前工作区分支 ${plan.branch} 不一致，无法自动推送`, "git-render-commit-branch-mismatch");
  }
  if (plan.outOfScopePaths.length > 0) {
    throw commitError(`发现未纳入当前视频提交范围的渲染改动：${plan.outOfScopePaths.join("、")}`, "git-render-commit-out-of-scope");
  }
  if (plan.commitPaths.length === 0) {
    const commit = localGitCommit(workspaceRoot);
    return { status: "unchanged", commit, ...plan };
  }

  try {
    execFileSync("git", ["-C", workspaceRoot, "add", "--", ...plan.commitPaths], { stdio: ["ignore", "pipe", "pipe"] });
    execFileSync("git", ["-C", workspaceRoot, "commit", "--only", "-m", commitMessage, "--", ...plan.commitPaths], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const commit = localGitCommit(workspaceRoot);
    if (!commit) throw commitError("定向提交完成后无法解析本地提交", "git-render-commit-missing");
    execFileSync("git", ["-C", workspaceRoot, "push", "origin", `HEAD:${plan.branch}`], { stdio: ["ignore", "pipe", "pipe"] });
    const remote = gitCommand(workspaceRoot, ["ls-remote", "--heads", "origin", plan.branch]).split(/\s+/)[0] ?? "";
    if (remote !== commit) {
      throw commitError(`推送完成后远程分支 ${plan.branch} 未指向本次提交`, "git-render-commit-remote-mismatch");
    }
    return { status: "committed", commit, ...plan };
  } catch (cause) {
    if (cause?.code?.startsWith("git-render-commit-")) throw cause;
    throw commitError(`渲染交付 commit/push 失败：${cause instanceof Error ? cause.message : String(cause)}`, "git-render-commit-push-failed");
  }
}

function addIssue(issues, message) {
  if (!issues.includes(message)) issues.push(message);
}

export function validateGitRenderDelivery(project, { environment = process.env, requireRepository = true } = {}) {
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    return requireRepository ? ["缺少视频工作区路径，无法确认远程分支交付状态"] : [];
  }
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  if (!isGitWorkspace(workspaceRoot)) {
    if (requireRepository) return ["渲染工作区不是 Git 仓库，无法确认远程分支交付状态"];
    return [];
  }

  const issues = [];
  const requiredPaths = renderRequiredPaths(project);
  let currentBranch = "";
  try {
    currentBranch = gitCommand(workspaceRoot, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch {
    addIssue(issues, "当前工作区处于 detached HEAD，无法确认 dispatch 分支");
  }

  let statusLines = [];
  try {
    statusLines = gitCommand(workspaceRoot, ["status", "--porcelain=v1", "--untracked-files=all"], { trim: false })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    addIssue(issues, "无法读取 Git 工作区状态");
  }
  for (const line of statusLines) {
    const relativePath = parseStatusPath(line);
    if (isRenderRelevantPath(relativePath)) {
      addIssue(issues, `渲染相关文件存在未提交修改：${relativePath}`);
    }
  }

  const config = readGitHubActionsConfig(environment, { currentGitRef: currentBranch, cwd: workspaceRoot });
  if (!config.ref.trim()) {
    addIssue(issues, "没有可用的 GitHub Actions dispatch 分支");
    return issues;
  }
  if (!currentBranch && !environment.HARNESS_GITHUB_REF) {
    addIssue(issues, `dispatch 分支 ${config.ref} 无法对应当前工作区分支`);
  }

  if (!localGitCommit(workspaceRoot, config.ref)) {
    addIssue(issues, `无法在本地解析 dispatch 分支：${config.ref}`);
    return issues;
  }

  for (const relativePath of requiredPaths) {
    try {
      gitCommand(workspaceRoot, ["ls-files", "--error-unmatch", "--", relativePath]);
    } catch {
      addIssue(issues, `渲染所需文件未被 Git 跟踪：${relativePath}`);
      continue;
    }

    let targetBlob;
    try {
      targetBlob = gitCommand(workspaceRoot, ["rev-parse", `${config.ref}:${relativePath}`]);
    } catch {
      addIssue(issues, `dispatch 分支 ${config.ref} 不包含文件：${relativePath}`);
      continue;
    }
    let headBlob;
    try {
      headBlob = gitCommand(workspaceRoot, ["rev-parse", `HEAD:${relativePath}`]);
    } catch {
      addIssue(issues, `当前提交不包含渲染文件：${relativePath}`);
      continue;
    }
    if (targetBlob !== headBlob) {
      addIssue(issues, `dispatch 分支 ${config.ref} 与当前提交的文件不一致：${relativePath}`);
    }
  }

  return issues;
}
