import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { archiveEntries, ensureAssetArchive } from "./asset-bundler.mjs";
import { validateRemoteRenderInputs } from "./remote-executor.mjs";

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
  const normalized = relativePath.split(path.sep).join("/");
  if (normalized.startsWith("/") || normalized.includes("../") || normalized === "..") {
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

function payloadFingerprint(root) {
  const hash = crypto.createHash("sha256");
  for (const relativePath of listFiles(root).filter((entry) => entry !== "render-input.json")) {
    hash.update(`path:${relativePath}\n`);
    hash.update(fs.readFileSync(path.join(root, relativePath)));
    hash.update("\n");
  }
  return hash.digest("hex");
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

function sourcePaths(workspaceRoot, slug) {
  return {
    source: path.join(workspaceRoot, "videos", slug),
    remotion: path.join(workspaceRoot, "src", "videos", slug),
    assetArchive: path.join(workspaceRoot, "assets", `${slug}-assets.zip`),
  };
}

function requireDirectory(directory, label) {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) fail(`Missing ${label}: ${directory}`, "render-input-source-missing");
}

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) fail(`Missing ${label}: ${filePath}`, "render-input-source-missing");
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
  requireSlug(manifest?.videoSlug);
  if (manifest?.schemaVersion !== SCHEMA_VERSION || manifest?.kind !== "video-render-input") {
    return ["render-input.json 的 schemaVersion 或 kind 不受支持"];
  }
  if (typeof manifest.compositionId !== "string" || !manifest.compositionId.trim()) return ["render-input.json 缺少 compositionId"];
  if (!manifest.entry || typeof manifest.entry !== "object") return ["render-input.json 缺少 entry"];
  for (const field of ["componentPath", "componentExport", "configPath", "configExport"]) {
    if (typeof manifest.entry[field] !== "string" || !manifest.entry[field].trim()) return [`render-input.json 缺少 entry.${field}`];
  }
  if (!Array.isArray(manifest.files)) return ["render-input.json 缺少 files 列表"];
  return [];
}

export function renderInputRoot(workspaceRoot) {
  return path.resolve(process.env.HARNESS_RENDER_INPUT_DIR ?? path.join(requireWorkspaceRoot(workspaceRoot), "local", "render-input"));
}

export function renderInputDirectory(workspaceRoot, slug) {
  requireSlug(slug);
  return path.join(renderInputRoot(workspaceRoot), slug);
}

export function renderInputArchivePath(workspaceRoot, slug) {
  requireSlug(slug);
  return path.join(renderInputRoot(workspaceRoot), `${slug}.zip`);
}

export function validateRenderInputDirectory(directory, { expectedSlug = null, listArchiveEntries = archiveEntries } = {}) {
  const packageRoot = path.resolve(directory);
  const manifestPath = path.join(packageRoot, "render-input.json");
  if (!fs.existsSync(packageRoot) || !fs.statSync(packageRoot).isDirectory()) return [`输入包目录不存在：${packageRoot}`];

  let manifest;
  try {
    manifest = readManifest(manifestPath);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const issues = validateManifestShape(manifest);
  if (expectedSlug && manifest.videoSlug !== expectedSlug) issues.push(`输入包 videoSlug 为 ${manifest.videoSlug}，不是 ${expectedSlug}`);
  if (issues.length > 0) return issues;

  const slug = manifest.videoSlug;
  for (const relativePath of [
    `videos/${slug}`,
    `src/videos/${slug}`,
    `assets/${slug}-assets.zip`,
    manifest.entry.componentPath,
    manifest.entry.configPath,
  ]) {
    const absolutePath = path.join(packageRoot, requireSafeRelative(relativePath));
    if (!fs.existsSync(absolutePath)) issues.push(`输入包缺少 ${relativePath}`);
  }

  for (const entry of manifest.files) {
    if (!entry || typeof entry.path !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      issues.push("render-input.json 包含无效文件哈希记录");
      continue;
    }
    const relativePath = requireSafeRelative(entry.path, "manifest file path");
    const absolutePath = path.join(packageRoot, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      issues.push(`输入包缺少文件 ${relativePath}`);
      continue;
    }
    if (sha256File(absolutePath) !== entry.sha256) issues.push(`输入包文件哈希不一致：${relativePath}`);
  }

  const remoteIssues = validateRemoteRenderInputs({ config: { slug, workspaceRoot: packageRoot } }, {
    listArchiveEntries,
    compareLocalAssets: false,
  });
  issues.push(...remoteIssues.map((issue) => `远程渲染输入：${issue}`));
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
    },
    payload: {
      sourceDirectory: `videos/${slug}`,
      remotionDirectory: `src/videos/${slug}`,
      assetArchive: `assets/${slug}-assets.zip`,
    },
    packageFingerprint: payloadFingerprint(packageRoot),
    files: manifestFiles(packageRoot),
  };
}

function removeTemporaryDirectory(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
}

export function prepareRenderInput(project, {
  compositionId = project?.config?.compositionId ?? project?.config?.slug,
  componentFile = null,
  componentExport = null,
  configFile = "video.config.ts",
  configExport = "videoConfig",
} = {}) {
  const workspaceRoot = requireWorkspaceRoot(project);
  const slug = requireSlug(project?.config?.slug ?? project?.state?.slug);
  if (typeof compositionId !== "string" || !compositionId.trim()) fail("compositionId is required", "render-input-composition-invalid");
  const sources = sourcePaths(workspaceRoot, slug);
  requireDirectory(sources.source, `videos/${slug}`);
  requireDirectory(sources.remotion, `src/videos/${slug}`);

  const projectForAssets = { config: { slug, workspaceRoot } };
  const archiveResult = ensureAssetArchive(projectForAssets);
  if (!["current", "packaged", "archive-only"].includes(archiveResult.status)) {
    fail(`Cannot prepare asset archive for ${slug}`, "render-input-assets-invalid");
  }
  requireFile(sources.assetArchive, `assets/${slug}-assets.zip`);
  const entry = selectEntry(sources.remotion, { componentFile, componentExport, configFile, configExport });
  const root = renderInputRoot(workspaceRoot);
  const destination = renderInputDirectory(workspaceRoot, slug);
  fs.mkdirSync(root, { recursive: true });

  if (fs.existsSync(destination)) {
    const existingIssues = validateRenderInputDirectory(destination, { expectedSlug: slug });
    if (existingIssues.length === 0) return {
      status: "current",
      directory: destination,
      archivePath: fs.existsSync(renderInputArchivePath(workspaceRoot, slug)) ? renderInputArchivePath(workspaceRoot, slug) : null,
      manifest: readManifest(path.join(destination, "render-input.json")),
    };
    fail(`已有输入包 ${destination} 无法复用，请先由操作者清理后重新准备：${existingIssues.join("；")}`, "render-input-existing-invalid");
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
    fs.renameSync(temporaryDirectory, destination);
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
  const packageRoot = renderInputDirectory(workspaceRoot, slug);
  const archivePath = renderInputArchivePath(workspaceRoot, slug);
  const manifest = assertRenderInputDirectory(packageRoot, { expectedSlug: slug });
  const temporaryArchive = path.join(os.tmpdir(), `${slug}-render-input-${process.pid}-${Date.now()}.zip`);
  try {
    execFileSync("zip", ["-q", "-r", "-X", temporaryArchive, "."], { cwd: packageRoot, stdio: "pipe" });
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

export function renderEntryPointSource(manifest) {
  const issues = validateManifestShape(manifest);
  if (issues.length > 0) fail(issues.join("；"));
  const componentImport = manifest.entry.componentPath.replace(/^src\//, "./").replace(/\.tsx$/, "");
  const configImport = manifest.entry.configPath.replace(/^src\//, "./").replace(/\.ts$/, "");
  return `import {Composition, registerRoot} from 'remotion';\nimport {getTotalDurationFrames} from './lib/timing';\nimport {${manifest.entry.componentExport}} from '${componentImport}';\nimport {${manifest.entry.configExport}} from '${configImport}';\n\nexport const Root = () => (\n  <Composition\n    id=${JSON.stringify(manifest.compositionId)}\n    component={${manifest.entry.componentExport}}\n    durationInFrames={getTotalDurationFrames(${manifest.entry.configExport})}\n    fps={${manifest.entry.configExport}.fps}\n    width={${manifest.entry.configExport}.width}\n    height={${manifest.entry.configExport}.height}\n  />\n);\n\nregisterRoot(Root);\n`;
}

function topLevelFiles(directory, predicate) {
  return fs.readdirSync(directory, {withFileTypes: true})
    .filter((entry) => entry.isFile() && predicate(entry.name))
    .map((entry) => entry.name);
}

function versionSuffix(fileName) {
  const match = fileName.match(/(\d+)(?:\.[^.]+)?$/);
  return match?.[1] ?? null;
}

function inferConfigExport(configPath) {
  const source = fs.readFileSync(configPath, "utf8");
  const matches = [...source.matchAll(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*(?::[^=]+)?=\s*\{/g)]
    .map((match) => match[1])
    .filter((name) => /config$/i.test(name));
  return matches.at(-1) ?? null;
}

function inferCompositionId(configPath, fallback) {
  const source = fs.readFileSync(configPath, "utf8");
  return source.match(/\bslug\s*:\s*["']([^"']+)["']/)?.[1] ?? fallback;
}

function inferDurationExport(configPath) {
  const source = fs.readFileSync(configPath, "utf8");
  return source.match(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*TotalDurationFrames)\s*=/)?.[1] ?? null;
}

function inferComponentExport(componentPath) {
  const source = fs.readFileSync(componentPath, "utf8");
  return source.match(/export\s+const\s+([A-Za-z_$][A-Za-z0-9_$]*Video(?:\d+)?)\s*(?::[^=]+)?=/)?.[1] ?? null;
}

function chooseStudioPair(remotionDirectory) {
  const configFiles = topLevelFiles(remotionDirectory, (name) => CONFIG_PATTERN.test(name));
  const componentFiles = topLevelFiles(remotionDirectory, (name) => COMPONENT_PATTERN.test(name) && /Video(?:\d+)?\.tsx$/.test(name));
  const pairs = [];

  for (const configFile of configFiles) {
    const configVersion = versionSuffix(configFile.replace(/\.ts$/, ""));
    const matchingComponents = componentFiles.filter((componentFile) => {
      const componentVersion = versionSuffix(componentFile.replace(/\.tsx$/, ""));
      return configVersion ? componentVersion === configVersion : !componentVersion;
    });
    for (const componentFile of matchingComponents) {
      const configPath = path.join(remotionDirectory, configFile);
      const componentPath = path.join(remotionDirectory, componentFile);
      const configExport = inferConfigExport(configPath);
      const componentExport = inferComponentExport(componentPath);
      if (!configExport || !componentExport) continue;
      pairs.push({
        configFile,
        configExport,
        componentFile,
        componentExport,
        durationExport: inferDurationExport(configPath),
        compositionId: inferCompositionId(configPath, path.basename(remotionDirectory)),
        configMtime: fs.statSync(configPath).mtimeMs,
        componentMtime: fs.statSync(componentPath).mtimeMs,
      });
    }
  }

  if (pairs.length === 0 && configFiles.length === 1 && componentFiles.length === 1) {
    const configFile = configFiles[0];
    const componentFile = componentFiles[0];
    const configPath = path.join(remotionDirectory, configFile);
    const componentPath = path.join(remotionDirectory, componentFile);
    const configExport = inferConfigExport(configPath);
    const componentExport = inferComponentExport(componentPath);
    if (configExport && componentExport) {
      pairs.push({
        configFile,
        configExport,
        componentFile,
        componentExport,
        durationExport: inferDurationExport(configPath),
        compositionId: inferCompositionId(configPath, path.basename(remotionDirectory)),
        configMtime: fs.statSync(configPath).mtimeMs,
        componentMtime: fs.statSync(componentPath).mtimeMs,
      });
    }
  }

  pairs.sort((left, right) => right.configMtime - left.configMtime || right.componentMtime - left.componentMtime);
  return pairs[0] ?? null;
}

export function discoverStudioEntries(workspaceRoot) {
  const root = requireWorkspaceRoot(workspaceRoot);
  const remotionRoot = path.join(root, "src", "videos");
  requireDirectory(remotionRoot, "src/videos");
  const entries = [];
  const skipped = [];

  for (const directoryEntry of fs.readdirSync(remotionRoot, {withFileTypes: true}).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!directoryEntry.isDirectory()) continue;
    const slug = directoryEntry.name;
    const remotionDirectory = path.join(remotionRoot, slug);
    const pair = chooseStudioPair(remotionDirectory);
    if (!pair) {
      skipped.push({slug, reason: "没有找到可匹配的视频组件和配置"});
      continue;
    }
    const sourceDirectory = path.join(root, "videos", slug);
    if (!fs.existsSync(sourceDirectory) || !fs.statSync(sourceDirectory).isDirectory()) {
      skipped.push({slug, reason: `缺少 videos/${slug}`});
      continue;
    }
    entries.push({
      slug,
      compositionId: pair.compositionId,
      componentPath: `src/videos/${slug}/${pair.componentFile}`,
      componentExport: pair.componentExport,
      configPath: `src/videos/${slug}/${pair.configFile}`,
      configExport: pair.configExport,
      durationExport: pair.durationExport,
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
  const target = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, renderStudioCatalogSource(discovered.entries), "utf8");
  return {outputPath: target, entries: discovered.entries, skipped: discovered.skipped};
}

export function writeRenderEntryPoint(manifestPath, outputPath) {
  const manifest = readManifest(path.resolve(manifestPath));
  const source = renderEntryPointSource(manifest);
  const target = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source, "utf8");
  return { outputPath: target, compositionId: manifest.compositionId };
}
