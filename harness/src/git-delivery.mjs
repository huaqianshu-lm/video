import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assetArchiveRelativePath } from "./asset-bundler.mjs";
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

function renderRequiredPaths(project) {
  const workspaceRoot = path.resolve(project.config.workspaceRoot);
  const slug = project.config.slug;
  const videoDirectory = path.join(workspaceRoot, "src", "videos", slug);
  const componentPaths = fs.existsSync(videoDirectory) && fs.statSync(videoDirectory).isDirectory()
    ? fs.readdirSync(videoDirectory)
      .filter((entry) => entry.endsWith("Video.tsx"))
      .sort()
      .map((entry) => `src/videos/${slug}/${entry}`)
    : [];
  return [
    assetArchiveRelativePath(slug),
    "src/Root.tsx",
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    ...componentPaths,
  ];
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
