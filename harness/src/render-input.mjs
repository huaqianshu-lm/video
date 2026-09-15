import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { archiveEntries, ensureAssetArchive } from "./asset-bundler.mjs";
import { resolveGitHubToken } from "./github-auth.mjs";
import { validateRenderInputUrl } from "./github-config.mjs";
import { validateRemoteRenderInputs } from "./remote-executor.mjs";
import { assertProjectMutable, assertProjectSlugMutable, isCompletedProject, loadProject } from "./storage.mjs";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const COMPONENT_PATTERN = /^[A-Za-z0-9_-]+\.tsx$/;
const CONFIG_PATTERN = /^[A-Za-z0-9_.-]+\.ts$/;
const SCHEMA_VERSION = 1;

function fail(message, code = "render-input-invalid") {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function requireSlug(slug) {
  if (!SLUG_PATTERN.test(String(slug ?? ""))) fail(`Invalid video slug: ${slug ?? "missing"}`, "render-input-slug-invalid");
  return slug;
}

function requireWorkspaceRoot(projectOrRoot) {
  const workspaceRoot = typeof projectOrRoot === "string"
    ? projectOrRoot
    : projectOrRoot?.config?.workspaceRoot;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim()) {
    fail("Render input requires a workspace root", "render-input-workspace-invalid");
  }
  return path.resolve(workspaceRoot);
}

function requireSafeRelative(relativePath, label = "path") {
  if (typeof relativePath !== "string" || !relativePath.trim()) fail(`${label} is required`);
  if (relativePath.includes("\\")) fail(`${label} must use POSIX separators`);
  const normalized = relativePath.split(path.sep).join("/");
  const segments = normalized.split("/");
  if (normalized.startsWith("/")
    || /^[A-Za-z]:\//.test(normalized)
    || segments.some((segment) => !segment || segment === "." || segment === "..")) {
    fail(`${label} must stay inside the render input package`);
  }
  return normalized;
}

function listFiles(root, current = root) {
  if (!fs.existsSync(current)) return [];
  const entries = fs.readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isSymbolicLink()) fail(`Render input does not allow symbolic links: ${absolutePath}`, "render-input-symlink");
    if (entry.isDirectory()) files.push(...listFiles(root, absolutePath));
    else if (entry.isFile()) files.push(path.relative(root, absolutePath).split(path.sep).join("/"));
  }
  return files;
}

function copyTree(sourceRoot, targetRoot) {
  const files = listFiles(sourceRoot);
  for (const relativePath of files) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(targetRoot, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
  return files.length;
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function payloadFingerprint(root, relativePaths = null) {
  const hash = crypto.createHash("sha256");
  const files = relativePaths ?? listFiles(root).filter((entry) => entry !== "render-input.json");
  for (const relativePath of [...files].sort()) {
    hash.update(`path:${relativePath}\n`);
    hash.update(fs.readFileSync(path.join(root, relativePath)));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function collectPackageFiles(root) {
  const files = [];
  const issues = [];

  function visit(directory) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name));
    } catch (error) {
      issues.push(`无法读取输入包目录 ${path.relative(root, directory) || "."}：${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(root, absolutePath).split(path.sep).join("/");
      let stat;
      try {
        stat = fs.lstatSync(absolutePath);
      } catch (error) {
        issues.push(`无法读取输入包文件 ${relativePath}：${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (stat.isSymbolicLink()) {
        issues.push(`输入包不允许符号链接：${relativePath}`);
      } else if (stat.isDirectory()) {
        visit(absolutePath);
      } else if (stat.isFile()) {
        if (relativePath !== "render-input.json") files.push(relativePath);
      } else {
        issues.push(`输入包路径必须是普通文件或目录：${relativePath}`);
      }
    }
  }

  visit(root);
  return { files: files.sort(), issues };
}

function directoryFingerprint(root) {
  const hash = crypto.createHash("sha256");
  for (const relativePath of listFiles(root)) {
    hash.update(`path:${relativePath}\n`);
    hash.update(fs.readFileSync(path.join(root, relativePath)));
    hash.update("\n");
  }
  return hash.digest("hex");
}

function sourceSnapshot({ sources, entry, compositionId }) {
  return {
    compositionId,
    entry: { ...entry },
    sourceFingerprint: directoryFingerprint(sources.source),
    remotionFingerprint: directoryFingerprint(sources.remotion),
    assetArchiveSha256: sha256File(sources.assetArchive),
  };
}

function sourceSnapshotFingerprint(snapshot) {
  return crypto.createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function sourcePaths(workspaceRoot, slug) {
  return {
    source: path.join(workspaceRoot, "videos", slug),
    remotion: path.join(workspaceRoot, "src", "videos", slug),
    assetArchive: path.join(workspaceRoot, "assets", `${slug}-assets.zip`),
  };
}

function requireDirectory(directory, label) {
  if (!fs.existsSync(directory) || !fs.lstatSync(directory).isDirectory()) fail(`Missing ${label}: ${directory}`, "render-input-source-missing");
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) fail(`Missing ${label}: ${filePath}`, "render-input-source-missing");
}

function inferExportName(filePath, suffixPattern) {
  const source = fs.readFileSync(filePath, "utf8");
  const match = source.match(new RegExp(`export\\s+(?:const|function)\\s+([A-Za-z_$][A-Za-z0-9_$]*${suffixPattern})`));
  return match?.[1] ?? null;
}

function selectEntry(remotionDirectory, { componentFile = null, componentExport = null, configFile = "video.config.ts", configExport = "videoConfig" } = {}) {
  if (!CONFIG_PATTERN.test(configFile)) fail(`Invalid config file: ${configFile}`);
  if (!IDENTIFIER_PATTERN.test(configExport)) fail(`Invalid config export: ${configExport}`);
  const componentFiles = fs.readdirSync(remotionDirectory)
    .filter((entry) => COMPONENT_PATTERN.test(entry))
    .sort();
  const selectedComponentFile = componentFile ?? (componentFiles.length === 1 ? componentFiles[0] : null);
  if (!selectedComponentFile || !COMPONENT_PATTERN.test(selectedComponentFile)) {
    fail(`Multiple Remotion components found; pass --component-file (${componentFiles.join(", ")})`, "render-input-component-ambiguous");
  }
  if (!componentFiles.includes(selectedComponentFile)) fail(`Component file not found: ${selectedComponentFile}`, "render-input-component-missing");
  const selectedComponentExport = componentExport ?? inferExportName(path.join(remotionDirectory, selectedComponentFile), "Video");
  if (!selectedComponentExport || !IDENTIFIER_PATTERN.test(selectedComponentExport)) {
    fail(`Cannot infer a component export from ${selectedComponentFile}; pass --component-export`, "render-input-component-export-missing");
  }
  const configPath = path.join(remotionDirectory, configFile);
  requireFile(configPath, "video config");
  return {
    componentFile: selectedComponentFile,
    componentExport: selectedComponentExport,
    configFile,
    configExport,
    durationExport: inferExportName(configPath, "TotalDurationFrames"),
  };
}

function manifestFiles(packageRoot) {
  return listFiles(packageRoot)
    .filter((relativePath) => relativePath !== "render-input.json")
    .map((relativePath) => ({
      path: relativePath,
      size: fs.statSync(path.join(packageRoot, relativePath)).size,
      sha256: sha256File(path.join(packageRoot, relativePath)),
    }));
}

function readManifest(manifestPath) {
  requireFile(manifestPath, "render-input.json");
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    fail(`render-input.json cannot be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateManifestShape(manifest) {
  const issues = [];
  if (!SLUG_PATTERN.test(String(manifest?.videoSlug ?? ""))) {
    issues.push("render-input.json 缺少有效 videoSlug");
  }
  if (manifest?.schemaVersion !== SCHEMA_VERSION || manifest?.kind !== "video-render-input") {
    issues.push("render-input.json 的 schemaVersion 或 kind 不受支持");
  }
  if (typeof manifest?.compositionId !== "string" || !manifest.compositionId.trim()) {
    issues.push("render-input.json 缺少 compositionId");
  }
  if (!manifest?.entry || typeof manifest.entry !== "object" || Array.isArray(manifest.entry)) {
    issues.push("render-input.json 缺少 entry");
  } else {
    for (const field of ["componentPath", "componentExport", "configPath", "configExport"]) {
      if (typeof manifest.entry[field] !== "string" || !manifest.entry[field].trim()) {
        issues.push(`render-input.json 缺少 entry.${field}`);
      }
    }
    if (manifest.entry.durationExport !== undefined
      && (typeof manifest.entry.durationExport !== "string" || !IDENTIFIER_PATTERN.test(manifest.entry.durationExport))) {
      issues.push("render-input.json 的 entry.durationExport 无效");
    }
  }
  if (!Array.isArray(manifest?.files)) issues.push("render-input.json 缺少 files 列表");
  if (typeof manifest?.packageFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(manifest.packageFingerprint)) {
    issues.push("render-input.json 缺少有效 packageFingerprint");
  }
  if (typeof manifest?.sourceFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(manifest.sourceFingerprint)) {
    issues.push("render-input.json 缺少当前源资料指纹");
  }
  if (!manifest?.sourceSnapshot || typeof manifest.sourceSnapshot !== "object" || Array.isArray(manifest.sourceSnapshot)) {
    issues.push("render-input.json 缺少源资料快照");
  }
  return issues;
}

export function renderInputRoot(workspaceRoot, inputRootOverride = null) {
  return path.resolve(inputRootOverride ?? process.env.HARNESS_RENDER_INPUT_DIR ?? path.join(requireWorkspaceRoot(workspaceRoot), "local", "render-input"));
}

export function renderInputDirectory(workspaceRoot, slug, inputRootOverride = null) {
  requireSlug(slug);
  return path.join(renderInputRoot(workspaceRoot, inputRootOverride), slug);
}

export function renderInputArchivePath(workspaceRoot, slug, inputRootOverride = null) {
  requireSlug(slug);
  return path.join(renderInputRoot(workspaceRoot, inputRootOverride), `${slug}.zip`);
}

export function renderInputDeliveryPath(workspaceRoot, slug, inputRootOverride = null) {
  requireSlug(slug);
  return path.join(renderInputRoot(workspaceRoot, inputRootOverride), `${slug}.delivery.json`);
}

function readDeliveryRecord(workspaceRoot, slug, inputRootOverride = null) {
  const deliveryPath = renderInputDeliveryPath(workspaceRoot, slug, inputRootOverride);
  if (!fs.existsSync(deliveryPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(deliveryPath, "utf8"));
  } catch (error) {
    fail(`输入包交付记录无法解析：${error instanceof Error ? error.message : String(error)}`, "render-input-delivery-invalid");
  }
}

export function readRenderInputDelivery(workspaceRoot, slug, inputRootOverride = null) {
  return readDeliveryRecord(requireWorkspaceRoot(workspaceRoot), slug, inputRootOverride);
}

export function validateRenderInputDelivery(project, { inputRoot: inputRootOverride = null } = {}) {
  const workspaceRoot = project?.config?.workspaceRoot;
  const slug = project?.config?.slug ?? project?.state?.slug;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim() || typeof slug !== "string") {
    return ["缺少视频工作区路径或 slug，无法读取输入包交付绑定"];
  }
  const issues = [];
  let delivery;
  try {
    delivery = readDeliveryRecord(workspaceRoot, slug, inputRootOverride);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  if (!delivery) return [`缺少 local/render-input/${slug}.delivery.json，请先绑定已发布输入包`];
  if (delivery.schemaVersion !== SCHEMA_VERSION || delivery.kind !== "video-render-input-delivery") {
    issues.push("输入包交付记录的 schemaVersion 或 kind 不受支持");
  }
  if (delivery.videoSlug !== slug) issues.push(`输入包交付记录 videoSlug 为 ${delivery.videoSlug ?? "缺失"}，不是 ${slug}`);
  if (typeof delivery.compositionId !== "string" || !delivery.compositionId.trim()) issues.push("输入包交付记录缺少 compositionId");
  if (typeof delivery.packageFingerprint !== "string" || !/^[a-f0-9]{64}$/.test(delivery.packageFingerprint)) issues.push("输入包交付记录缺少 packageFingerprint");
  if (typeof delivery.archiveSha256 !== "string" || !/^[a-f0-9]{64}$/.test(delivery.archiveSha256)) issues.push("输入包交付记录缺少有效 archiveSha256");
  if (typeof delivery.url !== "string" || !delivery.url.trim()) issues.push("输入包交付记录缺少发布 URL");
  else {
    const urlIssue = validateRenderInputUrl(delivery.url);
    if (urlIssue) issues.push(urlIssue.message);
  }

  const packageRoot = renderInputDirectory(workspaceRoot, slug, inputRootOverride);
  const manifestPath = path.join(packageRoot, "render-input.json");
  const archivePath = renderInputArchivePath(workspaceRoot, slug, inputRootOverride);
  if (!fs.existsSync(manifestPath)) issues.push("当前输入包缺少 render-input.json");
  if (!fs.existsSync(archivePath)) issues.push("当前输入包缺少 ZIP 归档");
  if (fs.existsSync(manifestPath) && fs.existsSync(archivePath)) {
    try {
      const manifest = assertRenderInputDirectory(packageRoot, { expectedSlug: slug });
      if (delivery.compositionId !== manifest.compositionId) issues.push("交付记录的 Composition ID 与当前输入包不一致");
      if (delivery.packageFingerprint !== manifest.packageFingerprint) issues.push("交付记录的 packageFingerprint 与当前输入包不一致");
      const archiveSha256 = sha256File(archivePath);
      if (delivery.archiveSha256 !== archiveSha256) issues.push("交付记录的 archiveSha256 与当前 ZIP 不一致，请重新绑定");
      if (!manifestMatchesWorkspaceSources(manifest, workspaceRoot, slug)) {
        issues.push("当前视频源资料已变化，输入包已过期，请重新准备、打包并绑定");
      }
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }
  return [...new Set(issues)];
}

export function assertRenderInputDelivery(project) {
  const issues = validateRenderInputDelivery(project);
  if (issues.length === 0) return readRenderInputDelivery(project.config.workspaceRoot, project.config.slug);
  const error = new Error(`输入包交付绑定预检失败：${issues.join("；")}`);
  error.code = "render-input-delivery-invalid";
  error.issues = issues;
  throw error;
}

async function responseBytes(response) {
  if (response && typeof response.arrayBuffer === "function") return Buffer.from(await response.arrayBuffer());
  if (response && typeof response.bytes === "function") return Buffer.from(await response.bytes());
  if (response && typeof response.text === "function") return Buffer.from(await response.text());
  return null;
}

export async function bindRenderInputDelivery(project, {
  url,
  sha256,
  compositionId = null,
  fetchImpl = globalThis.fetch,
  environment = process.env,
  authSource = null,
  execFileSyncImpl,
  ghBinary,
  hostname,
} = {}) {
  assertProjectMutable(project, "绑定视频输入包");
  const workspaceRoot = requireWorkspaceRoot(project);
  const slug = requireSlug(project?.config?.slug ?? project?.state?.slug);
  const normalizedUrl = typeof url === "string" ? url.trim() : "";
  const urlIssue = validateRenderInputUrl(normalizedUrl);
  if (urlIssue) fail(urlIssue.message, urlIssue.code);
  if (!normalizedUrl) fail("发布 URL 是必需的", "render-input-delivery-url-missing");
  const normalizedSha = typeof sha256 === "string" ? sha256.trim().toLowerCase() : "";
  if (!/^[a-f0-9]{64}$/.test(normalizedSha)) fail("发布包 SHA-256 必须是 64 位十六进制", "render-input-delivery-sha-invalid");

  const packageRoot = renderInputDirectory(workspaceRoot, slug);
  const manifest = assertRenderInputDirectory(packageRoot, { expectedSlug: slug });
  if (compositionId !== null && compositionId !== manifest.compositionId) {
    fail("绑定的 Composition ID 与当前输入包不一致", "render-input-delivery-composition-mismatch");
  }
  const archivePath = renderInputArchivePath(workspaceRoot, slug);
  requireFile(archivePath, `assets/${slug}-render-input.zip`);
  const localSha = sha256File(archivePath);
  if (localSha !== normalizedSha) fail("发布包 SHA-256 与当前本地 ZIP 不一致，请重新准备或填写正确哈希", "render-input-delivery-hash-mismatch");
  if (typeof fetchImpl !== "function") fail("无法读取发布包 URL，请提供可用的 fetch", "render-input-delivery-fetch-unavailable");

  let response;
  try {
    const explicitToken = typeof environment.HARNESS_RENDER_INPUT_TOKEN === "string"
      ? environment.HARNESS_RENDER_INPUT_TOKEN.trim()
      : "";
    let token = explicitToken;
    const parsedUrl = new URL(normalizedUrl);
    if (!token && parsedUrl.hostname.toLowerCase() === "api.github.com") {
      const auth = resolveGitHubToken({ environment, authSource, execFileSyncImpl, ghBinary, hostname });
      token = auth.token;
    }
    response = await fetchImpl(normalizedUrl, {
      headers: {
        Accept: "application/octet-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    fail(`发布包 URL 无法访问：${error instanceof Error ? error.message : String(error)}`, "render-input-delivery-remote-unavailable");
  }
  if (!response?.ok) fail(`发布包 URL 返回 HTTP ${response?.status ?? "unknown"}`, "render-input-delivery-remote-unavailable");
  const remoteBytes = await responseBytes(response);
  if (!remoteBytes) fail("发布包 URL 没有返回可读取内容", "render-input-delivery-remote-unavailable");
  const remoteSha = crypto.createHash("sha256").update(remoteBytes).digest("hex");
  if (remoteSha !== normalizedSha) fail("发布包远端内容的 SHA-256 与当前本地 ZIP 不一致", "render-input-delivery-remote-hash-mismatch");

  const delivery = {
    schemaVersion: SCHEMA_VERSION,
    kind: "video-render-input-delivery",
    videoSlug: slug,
    compositionId: manifest.compositionId,
    packageFingerprint: manifest.packageFingerprint,
    archiveSha256: localSha,
    url: normalizedUrl,
    boundAt: new Date().toISOString(),
  };
  const deliveryPath = renderInputDeliveryPath(workspaceRoot, slug);
  assertProjectSlugMutable(slug, "写入视频输入包交付记录");
  fs.mkdirSync(path.dirname(deliveryPath), { recursive: true });
  fs.writeFileSync(deliveryPath, `${JSON.stringify(delivery, null, 2)}\n`, "utf8");
  return { status: "bound", path: deliveryPath, delivery };
}

export function validateRenderInputDirectory(directory, { expectedSlug = null, listArchiveEntries = archiveEntries } = {}) {
  const packageRoot = path.resolve(directory);
  if (!fs.existsSync(packageRoot) || !fs.lstatSync(packageRoot).isDirectory()) return [`输入包目录不存在：${packageRoot}`];

  let manifest;
  try {
    manifest = readManifest(path.join(packageRoot, "render-input.json"));
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const issues = validateManifestShape(manifest);
  if (expectedSlug && manifest.videoSlug !== expectedSlug) issues.push(`输入包 videoSlug 为 ${manifest.videoSlug}，不是 ${expectedSlug}`);

  const slug = manifest.videoSlug;
  const { files: actualFiles, issues: actualFileIssues } = collectPackageFiles(packageRoot);
  issues.push(...actualFileIssues);

  const declaredPaths = new Map();
  if (Array.isArray(manifest.files)) {
    for (const [index, entry] of manifest.files.entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        issues.push(`render-input.json 的 files[${index}] 必须是对象`);
        continue;
      }

      let relativePath = null;
      if (typeof entry.path !== "string" || !entry.path.trim()) {
        issues.push(`render-input.json 的 files[${index}].path 无效`);
      } else {
        try {
          relativePath = requireSafeRelative(entry.path, `files[${index}].path`);
        } catch (error) {
          issues.push(`render-input.json 的 files[${index}].path 路径无效：${error instanceof Error ? error.message : String(error)}`);
        }
      }
      if (relativePath) {
        if (relativePath === "render-input.json") {
          issues.push("render-input.json 的 files 不得声明 Manifest 自身");
        }
        if (declaredPaths.has(relativePath)) {
          issues.push(`render-input.json 的 files 包含重复路径：${relativePath}`);
        } else {
          declaredPaths.set(relativePath, index);
        }
      }

      const validSize = Number.isInteger(entry.size) && entry.size >= 0;
      if (!validSize) issues.push(`render-input.json 的 files[${index}].size 必须是非负整数`);
      const validHash = typeof entry.sha256 === "string" && /^[a-f0-9]{64}$/.test(entry.sha256);
      if (!validHash) issues.push(`render-input.json 的 files[${index}].sha256 必须是 64 位小写 SHA-256`);

      if (!relativePath) continue;
      const absolutePath = path.join(packageRoot, relativePath);
      let stat = null;
      try {
        stat = fs.lstatSync(absolutePath);
      } catch {
        issues.push(`输入包缺少文件 ${relativePath}`);
      }
      if (!stat) continue;
      if (stat.isSymbolicLink()) {
        issues.push(`输入包文件不能是符号链接：${relativePath}`);
        continue;
      }
      if (!stat.isFile()) {
        issues.push(`输入包清单路径必须指向普通文件：${relativePath}`);
        continue;
      }
      if (validSize && stat.size !== entry.size) issues.push(`输入包文件大小不一致：${relativePath}`);
      if (validHash && sha256File(absolutePath) !== entry.sha256) issues.push(`输入包文件哈希不一致：${relativePath}`);
    }
  }

  const actualPathSet = new Set(actualFiles);
  const declaredPathSet = new Set(declaredPaths.keys());
  const missingFromManifest = actualFiles.filter((relativePath) => !declaredPathSet.has(relativePath));
  const missingFromPackage = [...declaredPathSet].filter((relativePath) => !actualPathSet.has(relativePath));
  if (missingFromManifest.length > 0 || missingFromPackage.length > 0) {
    const details = [];
    if (missingFromManifest.length > 0) details.push(`包内未声明：${missingFromManifest.join(", ")}`);
    if (missingFromPackage.length > 0) details.push(`清单声明但包内缺失：${missingFromPackage.join(", ")}`);
    issues.push(`render-input.json 文件清单与包内实际文件集合不一致（${details.join("；")}）`);
  }

  if (typeof manifest.packageFingerprint === "string" && /^[a-f0-9]{64}$/.test(manifest.packageFingerprint)) {
    let actualFingerprint = null;
    try {
      actualFingerprint = payloadFingerprint(packageRoot, actualFiles);
    } catch (error) {
      issues.push(`无法重新计算 packageFingerprint：${error instanceof Error ? error.message : String(error)}`);
    }
    if (actualFingerprint && actualFingerprint !== manifest.packageFingerprint) {
      issues.push(`packageFingerprint 与包内实际内容不一致：${actualFingerprint}`);
    }
  }

  if (SLUG_PATTERN.test(String(slug ?? "")) && manifest.entry && typeof manifest.entry === "object") {
    for (const relativePath of [
      `videos/${slug}`,
      `src/videos/${slug}`,
      `assets/${slug}-assets.zip`,
      manifest.entry.componentPath,
      manifest.entry.configPath,
    ]) {
      if (typeof relativePath !== "string" || !relativePath.trim()) continue;
      let safePath;
      try {
        safePath = requireSafeRelative(relativePath);
      } catch (error) {
        issues.push(`输入包入口路径无效：${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      const absolutePath = path.join(packageRoot, safePath);
      if (!fs.existsSync(absolutePath)) {
        issues.push(`输入包缺少 ${relativePath}`);
      } else if (!fs.lstatSync(absolutePath).isFile() && !fs.lstatSync(absolutePath).isDirectory()) {
        issues.push(`输入包路径不是普通文件或目录：${relativePath}`);
      }
    }
  }

  if (SLUG_PATTERN.test(String(slug ?? ""))) {
    const remoteIssues = validateRemoteRenderInputs({ config: { slug, workspaceRoot: packageRoot } }, {
      listArchiveEntries,
      compareLocalAssets: false,
    });
    issues.push(...remoteIssues.map((issue) => `远程渲染输入：${issue}`));
  }
  return [...new Set(issues)];
}

export function assertRenderInputDirectory(directory, options = {}) {
  const issues = validateRenderInputDirectory(directory, options);
  if (issues.length === 0) return readManifest(path.join(directory, "render-input.json"));
  const error = new Error(`Render input validation failed: ${issues.join("；")}`);
  error.code = "render-input-validation-failed";
  error.issues = issues;
  throw error;
}

function buildManifest({ slug, compositionId, entry, packageRoot }) {
  const sources = {
    source: path.join(packageRoot, "videos", slug),
    remotion: path.join(packageRoot, "src", "videos", slug),
    assetArchive: path.join(packageRoot, "assets", `${slug}-assets.zip`),
  };
  const snapshot = sourceSnapshot({ sources, entry, compositionId });
  return {
    schemaVersion: SCHEMA_VERSION,
    kind: "video-render-input",
    videoSlug: slug,
    compositionId,
    createdAt: new Date().toISOString(),
    entry: {
      componentPath: `src/videos/${slug}/${entry.componentFile}`,
      componentExport: entry.componentExport,
      configPath: `src/videos/${slug}/${entry.configFile}`,
      configExport: entry.configExport,
      ...(entry.durationExport ? { durationExport: entry.durationExport } : {}),
    },
    payload: {
      sourceDirectory: `videos/${slug}`,
      remotionDirectory: `src/videos/${slug}`,
      assetArchive: `assets/${slug}-assets.zip`,
    },
    sourceFingerprint: sourceSnapshotFingerprint(snapshot),
    sourceSnapshot: snapshot,
    packageFingerprint: payloadFingerprint(packageRoot),
    files: manifestFiles(packageRoot),
  };
}

function manifestMatchesSources(manifest, { sources, entry, compositionId }) {
  if (manifest?.compositionId !== compositionId) return false;
  if (!manifest?.sourceSnapshot || typeof manifest.sourceFingerprint !== "string") return false;
  const current = sourceSnapshot({ sources, entry, compositionId });
  return manifest.sourceFingerprint === sourceSnapshotFingerprint(current)
    && JSON.stringify(manifest.sourceSnapshot) === JSON.stringify(current);
}

function manifestEntry(manifest) {
  return {
    componentFile: path.posix.basename(manifest.entry.componentPath),
    componentExport: manifest.entry.componentExport,
    configFile: path.posix.basename(manifest.entry.configPath),
    configExport: manifest.entry.configExport,
    durationExport: manifest.entry.durationExport ?? null,
  };
}

function manifestMatchesWorkspaceSources(manifest, workspaceRoot, slug) {
  const sources = sourcePaths(workspaceRoot, slug);
  if (![sources.source, sources.remotion, sources.assetArchive].every((sourcePath) => fs.existsSync(sourcePath))) return false;
  return manifestMatchesSources(manifest, {
    sources,
    entry: manifestEntry(manifest),
    compositionId: manifest.compositionId,
  });
}

export function validateCurrentRenderInput(project) {
  const workspaceRoot = requireWorkspaceRoot(project);
  const slug = requireSlug(project?.config?.slug ?? project?.state?.slug);
  const directory = renderInputDirectory(workspaceRoot, slug);
  const issues = validateRenderInputDirectory(directory, { expectedSlug: slug });
  if (issues.length > 0) return [...new Set(issues)];
  const manifest = readManifest(path.join(directory, "render-input.json"));
  if (!manifestMatchesWorkspaceSources(manifest, workspaceRoot, slug)) {
    issues.push("当前输入包与视频源资料不一致，请重新准备输入包");
  }
  return [...new Set(issues)];
}

function replaceRenderInputDirectory(temporaryDirectory, destination, beforeReplace = null) {
  const backup = `${destination}.previous-${process.pid}-${Date.now()}`;
  const hadDestination = fs.existsSync(destination);
  beforeReplace?.();
  if (hadDestination) fs.renameSync(destination, backup);
  try {
    fs.renameSync(temporaryDirectory, destination);
  } catch (error) {
    if (hadDestination && fs.existsSync(backup)) fs.renameSync(backup, destination);
    throw error;
  }
  if (hadDestination && fs.existsSync(backup)) removeTemporaryDirectory(backup);
}

function removeTemporaryDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
}

function assertRenderEntryOutputPath(outputPath, slugs, manifestPath = null, workspaceRootHint = null) {
  const target = path.resolve(outputPath);
  const roots = new Set([
    workspaceRootHint,
    process.cwd(),
    process.env.HARNESS_WORKSPACE_ROOT,
    process.env.HARNESS_RENDER_INPUT_DIR ? path.resolve(process.env.HARNESS_RENDER_INPUT_DIR, "../..") : null,
  ].filter(Boolean).map((root) => path.resolve(root)));
  const absoluteManifest = manifestPath ? path.resolve(manifestPath) : null;
  const marker = `${path.sep}local${path.sep}render-input${path.sep}`;
  const markerIndex = absoluteManifest?.indexOf(marker) ?? -1;
  if (markerIndex >= 0) roots.add(absoluteManifest.slice(0, markerIndex));
  const matchingRoot = [...roots].find((root) => target === path.join(root, "src", "RenderInputRoot.tsx"));
  if (!matchingRoot) {
    fail("单视频临时入口只能写入当前工作区的 src/RenderInputRoot.tsx", "render-input-entry-output-invalid");
  }
  for (const root of roots) {
    for (const slug of slugs) {
      const protectedPaths = [
        path.join(root, "videos", slug),
        path.join(root, "src", "videos", slug),
        path.join(root, "public", "local-assets", slug),
        path.join(root, "local", "render-input", slug),
        path.join(root, "assets", `${slug}-assets.zip`),
      ];
      if (protectedPaths.some((protectedPath) => target === protectedPath || target.startsWith(`${protectedPath}${path.sep}`))) {
        fail("临时入口不能写入具体视频资料、资源或输入包目录", "render-input-entry-output-protected");
      }
    }
  }
  return matchingRoot;
}

export function prepareRenderInput(project, {
  compositionId = project?.config?.compositionId ?? project?.config?.slug,
  componentFile = null,
  componentExport = null,
  configFile = "video.config.ts",
  configExport = "videoConfig",
} = {}) {
  assertProjectMutable(project, "准备视频输入包");
  const workspaceRoot = requireWorkspaceRoot(project);
  const slug = requireSlug(project?.config?.slug ?? project?.state?.slug);
  if (typeof compositionId !== "string" || !compositionId.trim()) fail("compositionId is required", "render-input-composition-invalid");
  const sources = sourcePaths(workspaceRoot, slug);
  requireDirectory(sources.source, `videos/${slug}`);
  requireDirectory(sources.remotion, `src/videos/${slug}`);

  const projectForAssets = { config: { slug, workspaceRoot } };
  assertProjectSlugMutable(slug, "生成或更新视频资源 ZIP");
  const archiveResult = ensureAssetArchive(projectForAssets);
  if (!["current", "packaged", "archive-only"].includes(archiveResult.status)) {
    fail(`Cannot prepare asset archive for ${slug}`, "render-input-assets-invalid");
  }
  requireFile(sources.assetArchive, `assets/${slug}-assets.zip`);
  const entry = selectEntry(sources.remotion, { componentFile, componentExport, configFile, configExport });
  const root = renderInputRoot(workspaceRoot);
  const destination = renderInputDirectory(workspaceRoot, slug);
  assertProjectSlugMutable(slug, "准备视频输入包目录");
  fs.mkdirSync(root, { recursive: true });

  if (fs.existsSync(destination)) {
    const existingIssues = validateRenderInputDirectory(destination, { expectedSlug: slug });
    const existingManifest = existingIssues.length === 0
      ? readManifest(path.join(destination, "render-input.json"))
      : null;
    if (existingIssues.length === 0 && manifestMatchesSources(existingManifest, { sources, entry, compositionId })) return {
      status: "current",
      directory: destination,
      archivePath: fs.existsSync(renderInputArchivePath(workspaceRoot, slug)) ? renderInputArchivePath(workspaceRoot, slug) : null,
      manifest: existingManifest,
    };
    if (existingIssues.length > 0 && !existingManifest) {
      // An invalid package is rebuilt below. The old directory stays untouched until the replacement succeeds.
    }
  }

  const temporaryDirectory = fs.mkdtempSync(path.join(root, `.${slug}-`));
  try {
    copyTree(sources.source, path.join(temporaryDirectory, "videos", slug));
    copyTree(sources.remotion, path.join(temporaryDirectory, "src", "videos", slug));
    fs.mkdirSync(path.join(temporaryDirectory, "assets"), { recursive: true });
    fs.copyFileSync(sources.assetArchive, path.join(temporaryDirectory, "assets", `${slug}-assets.zip`));
    const manifest = buildManifest({ slug, compositionId, entry, packageRoot: temporaryDirectory });
    fs.writeFileSync(path.join(temporaryDirectory, "render-input.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    assertRenderInputDirectory(temporaryDirectory, { expectedSlug: slug });
    replaceRenderInputDirectory(temporaryDirectory, destination, () => assertProjectSlugMutable(slug, "替换视频输入包目录"));
  } catch (error) {
    if (fs.existsSync(temporaryDirectory)) removeTemporaryDirectory(temporaryDirectory);
    throw error;
  }

  return {
    status: "prepared",
    directory: destination,
    archivePath: null,
    manifest: readManifest(path.join(destination, "render-input.json")),
  };
}

export function packageRenderInput(workspaceRoot, slug) {
  assertProjectSlugMutable(slug, "打包视频输入包");
  const packageRoot = renderInputDirectory(workspaceRoot, slug);
  const archivePath = renderInputArchivePath(workspaceRoot, slug);
  const manifest = assertRenderInputDirectory(packageRoot, { expectedSlug: slug });
  if (!manifestMatchesWorkspaceSources(manifest, requireWorkspaceRoot(workspaceRoot), slug)) {
    fail("当前视频源资料已变化，不能打包旧输入包，请先重新准备", "render-input-source-stale");
  }
  const temporaryArchive = path.join(os.tmpdir(), `${slug}-render-input-${process.pid}-${Date.now()}.zip`);
  try {
    execFileSync("zip", ["-q", "-r", "-X", temporaryArchive, "."], { cwd: packageRoot, stdio: "pipe" });
    assertProjectSlugMutable(slug, "替换视频输入 ZIP");
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });
    fs.copyFileSync(temporaryArchive, archivePath);
  } finally {
    if (fs.existsSync(temporaryArchive)) fs.rmSync(temporaryArchive, { force: true });
  }
  return {
    status: "packaged",
    directory: packageRoot,
    archivePath,
    archiveSha256: sha256File(archivePath),
    packageFingerprint: manifest.packageFingerprint,
  };
}

export function prepareRenderInputEntry(project, options = {}) {
  assertProjectMutable(project, "生成视频临时入口");
  const workspaceRoot = requireWorkspaceRoot(project);
  const prepared = prepareRenderInput(project, options);
  const packaged = packageRenderInput(workspaceRoot, project.config.slug);
  const manifestPath = path.join(prepared.directory, "render-input.json");
  const entry = writeRenderEntryPoint(
    manifestPath,
    path.join(workspaceRoot, "src", "RenderInputRoot.tsx"),
  );
  return { ...prepared, ...packaged, entry, manifestPath };
}

export function renderEntryPointSource(manifest) {
  const issues = validateManifestShape(manifest);
  if (issues.length > 0) fail(issues.join("；"));
  const componentImport = manifest.entry.componentPath.replace(/^src\//, "./").replace(/\.tsx$/, "");
  const configImport = manifest.entry.configPath.replace(/^src\//, "./").replace(/\.ts$/, "");
  const durationImport = manifest.entry.durationExport
    ? `import {${manifest.entry.durationExport}} from '${configImport}';\n`
    : "import {getTotalDurationFrames} from './lib/timing';\n";
  const durationExpression = manifest.entry.durationExport
    ? `${manifest.entry.durationExport}()`
    : `getTotalDurationFrames(${manifest.entry.configExport})`;
  return `import {Composition, registerRoot} from 'remotion';\n${durationImport}import {${manifest.entry.componentExport}} from '${componentImport}';\nimport {${manifest.entry.configExport}} from '${configImport}';\n\nexport const Root = () => (\n  <Composition\n    id=${JSON.stringify(manifest.compositionId)}\n    component={${manifest.entry.componentExport}}\n    durationInFrames={${durationExpression}}\n    fps={${manifest.entry.configExport}.fps}\n    width={${manifest.entry.configExport}.width}\n    height={${manifest.entry.configExport}.height}\n  />\n);\n\nregisterRoot(Root);\n`;
}

export function discoverStudioEntries(workspaceRoot) {
  const root = requireWorkspaceRoot(workspaceRoot);
  const remotionRoot = path.join(root, "src", "videos");
  const inputRoot = renderInputRoot(root);
  const entries = [];
  const skipped = [];

  const candidateSlugs = new Set();
  for (const directory of [remotionRoot, inputRoot]) {
    if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) continue;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && SLUG_PATTERN.test(entry.name)) candidateSlugs.add(entry.name);
    }
  }

  for (const slug of [...candidateSlugs].sort()) {
    const packageDirectory = renderInputDirectory(root, slug);
    const completed = isCompletedProject(slug);
    let manifest = null;
    let packageIssues = [];
    if (fs.existsSync(packageDirectory)) {
      packageIssues = validateRenderInputDirectory(packageDirectory, { expectedSlug: slug });
      if (packageIssues.length === 0) {
        try {
          manifest = readManifest(path.join(packageDirectory, "render-input.json"));
          if (!completed && !manifestMatchesWorkspaceSources(manifest, root, slug)) {
            packageIssues = ["输入包与当前源资料不一致"];
            manifest = null;
          }
        } catch (error) {
          packageIssues = [error instanceof Error ? error.message : String(error)];
        }
      }
    } else {
      packageIssues = [`缺少 local/render-input/${slug}`];
    }

    if (packageIssues.length > 0 && !completed) {
      try {
        const project = loadProject(slug, { refresh: false });
        const prepared = prepareRenderInputEntry(project);
        manifest = prepared.manifest;
        packageIssues = [];
      } catch (error) {
        packageIssues = [error instanceof Error ? error.message : String(error)];
      }
    }
    if (packageIssues.length > 0 || !manifest) {
      skipped.push({ slug, reason: completed
        ? `已完成视频只能读取已有输入包，当前输入包不可用：${packageIssues.join("；")}`
        : `无法生成已校验输入包：${packageIssues.join("；")}` });
      continue;
    }

    entries.push({
      slug,
      compositionId: manifest.compositionId,
      componentPath: manifest.entry.componentPath,
      componentExport: manifest.entry.componentExport,
      configPath: manifest.entry.configPath,
      configExport: manifest.entry.configExport,
      durationExport: manifest.entry.durationExport ?? null,
      packageFingerprint: manifest.packageFingerprint,
      sourceFingerprint: manifest.sourceFingerprint,
    });
  }

  entries.sort((left, right) => left.compositionId.localeCompare(right.compositionId));
  return {entries, skipped};
}

function identifierForEntry(entry, index) {
  return `videoEntry${index}_${entry.slug.replace(/[^A-Za-z0-9_$]/g, "_")}`;
}

export function renderStudioCatalogSource(entries) {
  if (!Array.isArray(entries) || entries.length === 0) fail("No Studio video entries were discovered", "render-input-studio-empty");
  const imports = ["import {Composition, registerRoot} from 'remotion';", "import {getTotalDurationFrames} from './lib/timing';"];
  const registrations = [];
  entries.forEach((entry, index) => {
    const identifier = identifierForEntry(entry, index);
    const componentImport = entry.componentPath.replace(/^src\//, "./").replace(/\.tsx$/, "");
    const configImport = entry.configPath.replace(/^src\//, "./").replace(/\.ts$/, "");
    const componentAlias = `${identifier}Component`;
    const configAlias = `${identifier}Config`;
    imports.push(`import {${entry.componentExport} as ${componentAlias}} from '${componentImport}';`);
    imports.push(`import {${entry.configExport} as ${configAlias}} from '${configImport}';`);
    if (entry.durationExport) imports.push(`import {${entry.durationExport} as ${identifier}Duration} from '${configImport}';`);
    const durationCall = entry.durationExport
      ? `${identifier}Duration()`
      : `getTotalDurationFrames(${configAlias})`;
    registrations.push(`    <Composition\n      id=${JSON.stringify(entry.compositionId)}\n      component={${componentAlias}}\n      durationInFrames={${durationCall}}\n      fps={${configAlias}.fps}\n      width={${configAlias}.width}\n      height={${configAlias}.height}\n    />`);
  });
  return `${imports.join("\n")}\n\nexport const Root = () => (\n  <>\n${registrations.join("\n")}\n  </>\n);\n\nregisterRoot(Root);\n`;
}

export function writeStudioCatalogEntryPoint(workspaceRoot, outputPath) {
  const discovered = discoverStudioEntries(workspaceRoot);
  assertRenderEntryOutputPath(outputPath, discovered.entries.map((entry) => entry.slug), null, workspaceRoot);
  const target = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, renderStudioCatalogSource(discovered.entries), "utf8");
  return {outputPath: target, entries: discovered.entries, skipped: discovered.skipped};
}

export function writeRenderEntryPoint(manifestPath, outputPath) {
  const absoluteManifestPath = path.resolve(manifestPath);
  const packageRoot = path.dirname(absoluteManifestPath);
  const manifest = readManifest(absoluteManifestPath);
  assertProjectSlugMutable(manifest.videoSlug, "生成视频临时入口");
  const workspaceRoot = assertRenderEntryOutputPath(outputPath, [manifest.videoSlug], absoluteManifestPath);
  assertRenderInputDirectory(packageRoot, { expectedSlug: manifest.videoSlug });
  if (!manifestMatchesWorkspaceSources(manifest, workspaceRoot, manifest.videoSlug)) {
    fail("当前输入包与工作区的视频源资料不一致，不能生成临时入口", "render-input-source-stale");
  }
  const source = renderEntryPointSource(manifest);
  const target = path.resolve(outputPath);
  const temporaryTarget = `${target}.temporary-${process.pid}-${Date.now()}`;
  try {
    assertProjectSlugMutable(manifest.videoSlug, "写入视频临时入口");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(temporaryTarget, source, "utf8");
    assertProjectSlugMutable(manifest.videoSlug, "替换视频临时入口");
    fs.renameSync(temporaryTarget, target);
  } finally {
    if (fs.existsSync(temporaryTarget)) fs.rmSync(temporaryTarget, { force: true });
  }
  return { outputPath: target, compositionId: manifest.compositionId };
}
