import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requireProjectSlug(project) {
  const slug = project?.config?.slug ?? project?.state?.slug;
  if (!SLUG_PATTERN.test(String(slug ?? ""))) {
    const error = new Error(`Invalid video slug for asset bundle: ${slug ?? "missing"}`);
    error.code = "asset-bundle-slug-invalid";
    throw error;
  }
  return slug;
}

function workspaceRootFor(project) {
  const workspaceRoot = project?.config?.workspaceRoot;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim()) {
    const error = new Error("Asset bundle requires project.config.workspaceRoot");
    error.code = "asset-bundle-workspace-invalid";
    throw error;
  }
  return path.resolve(workspaceRoot);
}

export function assetSourcePath(project) {
  const slug = requireProjectSlug(project);
  return path.join(workspaceRootFor(project), "public", "local-assets", slug);
}

export function hasAssetSource(project) {
  try {
    const sourceRoot = assetSourcePath(project);
    return fs.existsSync(sourceRoot) && fs.statSync(sourceRoot).isDirectory();
  } catch {
    return false;
  }
}

export function assetArchiveRelativePath(projectOrSlug) {
  const slug = typeof projectOrSlug === "string"
    ? projectOrSlug
    : requireProjectSlug(projectOrSlug);
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid video slug for asset bundle: ${slug}`);
  return `assets/${slug}-assets.zip`;
}

export function assetArchivePath(project) {
  return path.join(workspaceRootFor(project), assetArchiveRelativePath(project));
}

function listFiles(root, current = root) {
  if (!fs.existsSync(current)) return [];
  const entries = fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isSymbolicLink()) {
      const error = new Error(`Asset bundle does not allow symbolic links: ${absolutePath}`);
      error.code = "asset-bundle-symlink";
      throw error;
    }
    if (entry.isDirectory()) files.push(...listFiles(root, absolutePath));
    else if (entry.isFile()) files.push(path.relative(root, absolutePath).split(path.sep).join("/"));
  }
  return files;
}

function hashBuffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function assetDirectoryFingerprint(sourceRoot) {
  const hash = crypto.createHash("sha256");
  for (const relativePath of listFiles(sourceRoot)) {
    hash.update(`path:${relativePath}\n`);
    hash.update(fs.readFileSync(path.join(sourceRoot, relativePath)));
    hash.update("\n");
  }
  return hash.digest("hex");
}

export function assetSourceIssues(project) {
  const sourceRoot = assetSourcePath(project);
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) {
    return [`缺少 public/local-assets/${requireProjectSlug(project)}`];
  }
  const files = listFiles(sourceRoot);
  const issues = [];
  if (!files.includes("subtitles/captions.vtt")) issues.push("资源目录缺少 subtitles/captions.vtt");
  if (!files.includes("subtitles/captions.srt")) issues.push("资源目录缺少 subtitles/captions.srt");
  if (!files.some((file) => file.startsWith("audio/") && file.endsWith(".mp3"))) {
    issues.push("资源目录缺少 audio/*.mp3");
  }
  return issues;
}

export function archiveEntries(archivePath, { unzipCommand = "unzip", execFile = execFileSync } = {}) {
  execFile(unzipCommand, ["-tqq", archivePath], { stdio: "pipe" });
  return execFile(unzipCommand, ["-Z1", archivePath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

export function archiveMatchesAssetDirectory(
  project,
  { entries = null, listArchiveEntries = archiveEntries, unzipCommand = "unzip", execFile = execFileSync } = {},
) {
  const sourceRoot = assetSourcePath(project);
  const archivePath = assetArchivePath(project);
  if (!fs.existsSync(sourceRoot) || !fs.statSync(sourceRoot).isDirectory()) return null;
  if (!fs.existsSync(archivePath) || !fs.statSync(archivePath).isFile()) return false;

  let archiveFileEntries;
  try {
    archiveFileEntries = (entries ?? listArchiveEntries(archivePath, { unzipCommand, execFile }))
      .filter((entry) => !entry.endsWith("/"))
      .sort();
  } catch {
    return false;
  }

  const slug = requireProjectSlug(project);
  const expectedEntries = listFiles(sourceRoot).map((file) => `${slug}/${file}`).sort();
  if (JSON.stringify(archiveFileEntries) !== JSON.stringify(expectedEntries)) return false;

  for (const file of expectedEntries) {
    const localHash = hashBuffer(fs.readFileSync(path.join(sourceRoot, file.slice(`${slug}/`.length))));
    let archiveContent;
    try {
      archiveContent = execFile(unzipCommand, ["-p", archivePath, file], { encoding: "buffer" });
    } catch {
      return false;
    }
    if (localHash !== hashBuffer(archiveContent)) return false;
  }
  return true;
}

function cleanupDirectory(directory) {
  try {
    fs.rmSync(directory, { recursive: true, force: true });
  } catch {
    // Temporary cleanup must not hide the packaging result.
  }
}

export function packageVideoAssets(
  project,
  { zipCommand = "zip", execFile = execFileSync } = {},
) {
  const slug = requireProjectSlug(project);
  const workspaceRoot = workspaceRootFor(project);
  const sourceRoot = assetSourcePath(project);
  const sourceIssues = assetSourceIssues(project);
  if (sourceIssues.length > 0) {
    const error = new Error(`无法打包 ${slug} 资源：${sourceIssues.join("；")}`);
    error.code = "asset-bundle-source-invalid";
    error.issues = sourceIssues;
    throw error;
  }

  const archivePath = assetArchivePath(project);
  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  const temporaryDirectory = fs.mkdtempSync(path.join(path.dirname(archivePath), `.video-assets-${slug}-`));
  const temporaryArchive = path.join(temporaryDirectory, `${slug}-assets.zip`);
  try {
    execFile(zipCommand, ["-q", "-r", "-X", temporaryArchive, slug], {
      cwd: path.dirname(sourceRoot),
      stdio: "pipe",
    });
    fs.renameSync(temporaryArchive, archivePath);
  } catch (cause) {
    const error = new Error(`无法生成 ${assetArchiveRelativePath(slug)}：${cause instanceof Error ? cause.message : String(cause)}`);
    error.code = "asset-bundle-package-failed";
    error.cause = cause;
    throw error;
  } finally {
    cleanupDirectory(temporaryDirectory);
  }

  return {
    archivePath,
    archiveRelativePath: assetArchiveRelativePath(slug),
    sourcePath: path.relative(workspaceRoot, sourceRoot),
    fileCount: listFiles(sourceRoot).length,
    fingerprint: assetDirectoryFingerprint(sourceRoot),
  };
}

export function ensureAssetArchive(project, options = {}) {
  const sourceRoot = assetSourcePath(project);
  const sourceExists = fs.existsSync(sourceRoot) && fs.statSync(sourceRoot).isDirectory();
  const archivePath = assetArchivePath(project);
  if (!sourceExists) {
    return {
      status: fs.existsSync(archivePath) ? "archive-only" : "source-missing",
      archivePath,
      archiveRelativePath: assetArchiveRelativePath(project),
      sourcePath: path.relative(workspaceRootFor(project), sourceRoot),
    };
  }

  if (archiveMatchesAssetDirectory(project, options) === true) {
    return {
      status: "current",
      archivePath,
      archiveRelativePath: assetArchiveRelativePath(project),
      sourcePath: path.relative(workspaceRootFor(project), sourceRoot),
      fileCount: listFiles(sourceRoot).length,
      fingerprint: assetDirectoryFingerprint(sourceRoot),
    };
  }
  return { status: "packaged", ...packageVideoAssets(project, options) };
}
