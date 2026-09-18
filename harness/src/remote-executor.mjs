import fs from "node:fs";
import path from "node:path";
import { archiveEntries, archiveMatchesAssetDirectory, assetSourcePath } from "./asset-bundler.mjs";
import { assertGitHubActionsReady } from "./diagnostics.mjs";
import { validateGitRenderDelivery } from "./git-delivery.mjs";
import { assertRenderInputDelivery, packageRenderInput, prepareRenderInput, renderInputDirectory, validateRenderInputDelivery, validateRenderInputDirectory } from "./render-input.mjs";
import { assertProjectMutable } from "./storage.mjs";
import { workflowForProject, workflowPaths, workflowStageDefinition } from "./workflows/registry.mjs";

const REMOTE_STAGES = new Set(["render"]);

export function assertRenderStageReady(project, operation = "提交远程渲染任务") {
  assertProjectMutable(project, operation);
  const currentStage = project?.state?.currentStage;
  const renderStatus = project?.state?.stages?.render?.status;
  if (currentStage === "render" && renderStatus === "ready") return project;
  const error = new Error(
    `${project?.config?.slug ?? project?.state?.slug ?? "视频"} 当前不在可执行的 render 阶段（当前为 ${currentStage ?? "unknown"} / ${renderStatus ?? "unknown"}），只有 render / ready 才能${operation}。`,
  );
  error.code = "render-stage-not-ready";
  error.currentStage = currentStage ?? null;
  error.renderStatus = renderStatus ?? null;
  throw error;
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} 无法读取：${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateNarratedRemoteRenderInputs(project, { listArchiveEntries = archiveEntries, compareLocalAssets = true } = {}) {
  const slug = project.config.slug;
  const workspaceRoot = project.config.workspaceRoot;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim()) {
    return ["缺少视频工作区路径，无法检查远程渲染输入"];
  }
  const archiveRelativePath = `assets/${slug}-assets.zip`;
  const archivePath = path.join(workspaceRoot, archiveRelativePath);
  const audioManifestPath = path.join(workspaceRoot, `src/videos/${slug}/generated/audio-manifest.json`);
  const subtitleManifestPath = path.join(workspaceRoot, `src/videos/${slug}/generated/subtitle-manifest.json`);
  const timelineManifestPath = path.join(workspaceRoot, `src/videos/${slug}/generated/timeline-manifest.json`);
  const issues = [];

  for (const [label, filePath] of [
    [archiveRelativePath, archivePath],
    [`src/videos/${slug}/generated/audio-manifest.json`, audioManifestPath],
    [`src/videos/${slug}/generated/subtitle-manifest.json`, subtitleManifestPath],
    [`src/videos/${slug}/generated/timeline-manifest.json`, timelineManifestPath],
  ]) {
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) issues.push(`缺少 ${label}`);
  }
  if (issues.length > 0) return issues;

  let audioManifest;
  let subtitleManifest;
  let timelineManifest;
  try {
    audioManifest = readJson(audioManifestPath, "Audio Manifest");
    subtitleManifest = readJson(subtitleManifestPath, "Subtitle Manifest");
    timelineManifest = readJson(timelineManifestPath, "Timeline Manifest");
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  for (const [label, manifest] of [
    ["Audio Manifest", audioManifest],
    ["Subtitle Manifest", subtitleManifest],
    ["Timeline Manifest", timelineManifest],
  ]) {
    if (manifest.videoId !== slug) issues.push(`${label} 的 videoId 不是 ${slug}`);
    if (!Array.isArray(manifest.scenes) || manifest.scenes.length === 0) issues.push(`${label} 没有有效 Scene`);
  }
  if (issues.length > 0) return issues;

  const invalidAudioScene = audioManifest.scenes.find((scene) =>
    !Array.isArray(scene.segments)
    || scene.segments.length === 0
    || scene.segments.some((segment) => typeof segment.file !== "string" || !segment.file.endsWith(".mp3")));
  if (invalidAudioScene) return [`Audio Manifest 的 Scene ${invalidAudioScene.sceneId ?? "未知"} 缺少有效音频 Segment`];

  let entries;
  try {
    entries = listArchiveEntries(archivePath);
  } catch (error) {
    return [`${archiveRelativePath} 无法通过 ZIP 完整性检查：${error instanceof Error ? error.message : String(error)}`];
  }
  const entrySet = new Set(entries.filter((entry) => !entry.endsWith("/")));
  const rootPrefix = `${slug}/`;
  const outsideRoot = [...entrySet].filter((entry) => !entry.startsWith(rootPrefix) || entry.includes("../"));
  if (outsideRoot.length > 0) issues.push(`ZIP 顶层目录必须仅为 ${slug}/`);

  for (const requiredPath of [
    `${rootPrefix}subtitles/captions.vtt`,
    `${rootPrefix}subtitles/captions.srt`,
  ]) {
    if (!entrySet.has(requiredPath)) issues.push(`ZIP 缺少 ${requiredPath}`);
  }

  const expectedAudioPaths = audioManifest.scenes.flatMap((scene) =>
    scene.segments.map((segment) => `${rootPrefix}${segment.file}`));
  for (const expectedPath of expectedAudioPaths) {
    if (!entrySet.has(expectedPath)) issues.push(`ZIP 缺少音频 ${expectedPath}`);
  }
  const actualAudioPaths = [...entrySet].filter((entry) =>
    entry.startsWith(`${rootPrefix}audio/`) && entry.endsWith(".mp3"));
  if (actualAudioPaths.length !== expectedAudioPaths.length) {
    issues.push(`ZIP 音频数量为 ${actualAudioPaths.length}，Audio Manifest 需要 ${expectedAudioPaths.length}`);
  }

  if (compareLocalAssets && fs.existsSync(assetSourcePath(project))) {
    const matches = archiveMatchesAssetDirectory(project, { entries, listArchiveEntries });
    if (matches === false) {
      issues.push(`ZIP 与 public/local-assets/${slug} 不一致，请重新准备远程渲染资源`);
    }
  }

  const audioSceneIds = audioManifest.scenes.map((scene) => String(scene.sceneId));
  const subtitleSceneIds = subtitleManifest.scenes.map((scene) => String(scene.sceneId));
  const timelineSceneIds = timelineManifest.scenes.map((scene) => String(scene.sceneId));
  if (JSON.stringify(subtitleSceneIds) !== JSON.stringify(audioSceneIds)) {
    issues.push("Subtitle Manifest 与 Audio Manifest 的 Scene 不一致");
  }
  if (JSON.stringify(timelineSceneIds) !== JSON.stringify(audioSceneIds)) {
    issues.push("Timeline Manifest 与 Audio Manifest 的 Scene 不一致");
  }

  return issues;
}

const PROMO_FORBIDDEN_BASENAMES = new Set([
  "narration-script.md",
  "tts-script.json",
  "audio-manifest.json",
  "subtitle-manifest.json",
  "timeline-manifest.json",
]);

function promoArtifactPath(project, stage, index = 0) {
  return workflowStageDefinition(project, stage)?.artifacts?.[index]
    ?.replaceAll("{slug}", project.config.slug) ?? null;
}

function safePromoRelativePath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  const normalized = value.replaceAll("\\", "/");
  return !normalized.startsWith("/")
    && !/^[A-Za-z]:\//.test(normalized)
    && !normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")
    && path.posix.normalize(normalized) === normalized;
}

function readPromoJson(workspaceRoot, relativePath, label, issues) {
  const filePath = path.join(workspaceRoot, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    issues.push(`缺少 ${relativePath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    issues.push(`${label} 无法解析：${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function listForbiddenFiles(root, current = root) {
  if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return [];
  return fs.readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) return listForbiddenFiles(root, absolutePath);
    if (!entry.isFile() || !PROMO_FORBIDDEN_BASENAMES.has(entry.name)) return [];
    return [path.relative(root, absolutePath).split(path.sep).join("/")];
  });
}

function validatePromoRemoteRenderInputs(project, { listArchiveEntries = archiveEntries, compareLocalAssets = true } = {}) {
  const slug = project?.config?.slug;
  const workspaceRoot = project?.config?.workspaceRoot;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim() || typeof slug !== "string") {
    return ["缺少视频工作区路径或 slug，无法检查宣传片远程渲染输入"];
  }
  let paths;
  try {
    paths = workflowPaths(project);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const root = path.resolve(workspaceRoot);
  const archivePath = path.join(root, paths.assetArchive);
  const assetManifestRelativePath = promoArtifactPath(project, "asset-preparation");
  const timelineRelativePath = promoArtifactPath(project, "visual-timeline");
  const issues = [];
  for (const relativeDirectory of [paths.sourceDirectory, paths.remotionDirectory]) {
    for (const forbiddenPath of listForbiddenFiles(path.join(root, relativeDirectory))) {
      issues.push(`宣传片输入不得包含 narrated 产物：${forbiddenPath}`);
    }
  }
  if (!fs.existsSync(archivePath) || !fs.statSync(archivePath).isFile()) issues.push(`缺少 ${paths.assetArchive}`);
  const assetManifest = assetManifestRelativePath ? readPromoJson(root, assetManifestRelativePath, "Asset Manifest", issues) : null;
  const visualTimeline = timelineRelativePath ? readPromoJson(root, timelineRelativePath, "Visual Timeline", issues) : null;
  for (const [label, manifest] of [["Asset Manifest", assetManifest], ["Visual Timeline", visualTimeline]]) {
    if (!manifest) continue;
    if (manifest.slug !== slug) issues.push(`${label} 的 slug 不是 ${slug}`);
  }
  if (assetManifest && (assetManifest.schemaVersion !== 1 || !Array.isArray(assetManifest.assets) || assetManifest.assets.length === 0)) {
    issues.push("宣传片 Asset Manifest 必须包含 schemaVersion=1 和非空 assets");
  }
  const declaredAssetPaths = new Set();
  for (const asset of assetManifest?.assets ?? []) {
    if (!safePromoRelativePath(asset?.path)) {
      issues.push(`Asset Manifest 存在不安全素材路径：${asset?.path ?? "缺失"}`);
      continue;
    }
    declaredAssetPaths.add(asset.path.replaceAll("\\", "/"));
  }
  if (visualTimeline && (visualTimeline.schemaVersion !== 1 || visualTimeline.fps !== 30 || visualTimeline.width !== 1920 || visualTimeline.height !== 1080)) {
    issues.push("宣传片 Visual Timeline 必须声明 schemaVersion=1、1920×1080 和 30fps");
  }
  if (visualTimeline && (!Number.isInteger(visualTimeline.durationInFrames) || visualTimeline.durationInFrames < 600 || visualTimeline.durationInFrames > 900)) {
    issues.push("宣传片 Visual Timeline 总时长必须为 20～30 秒（600～900 帧）");
  }

  let entries = [];
  if (fs.existsSync(archivePath) && fs.statSync(archivePath).isFile()) {
    try {
      entries = listArchiveEntries(archivePath).filter((entry) => !entry.endsWith("/"));
    } catch (error) {
      issues.push(`${paths.assetArchive} 无法通过 ZIP 完整性检查：${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const entrySet = new Set(entries);
  const rootPrefix = `${slug}/`;
  const outsideRoot = entries.filter((entry) => !entry.startsWith(rootPrefix) || entry.includes("../"));
  if (outsideRoot.length > 0) issues.push(`ZIP 顶层目录必须仅为 ${slug}/`);
  const archivedAssetPaths = new Set(entries
    .filter((entry) => entry.startsWith(rootPrefix))
    .map((entry) => entry.slice(rootPrefix.length)));
  for (const relativePath of declaredAssetPaths) {
    if (!entrySet.has(`${rootPrefix}${relativePath}`)) issues.push(`ZIP 缺少宣传片素材 ${rootPrefix}${relativePath}`);
  }
  for (const relativePath of archivedAssetPaths) {
    if (!declaredAssetPaths.has(relativePath)) issues.push(`ZIP 包含未登记宣传片素材：${rootPrefix}${relativePath}`);
  }
  for (const entry of entries) {
    if (PROMO_FORBIDDEN_BASENAMES.has(path.posix.basename(entry))) issues.push(`宣传片 ZIP 不得包含 narrated 产物：${entry}`);
  }
  if (compareLocalAssets && fs.existsSync(path.join(root, "public", "local-assets", slug))) {
    const matches = archiveMatchesAssetDirectory(project, { entries, listArchiveEntries });
    if (matches === false) issues.push(`ZIP 与 public/local-assets/${slug} 不一致，请重新准备远程渲染资源`);
  }
  return [...new Set(issues)];
}

export function validateRemoteRenderInputs(project, options = {}) {
  try {
    return workflowForProject(project).timelineMode === "visual-beats"
      ? validatePromoRemoteRenderInputs(project, options)
      : validateNarratedRemoteRenderInputs(project, options);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
}

export function assertRemoteRenderInputs(project, options) {
  const issues = validateRemoteRenderInputs(project, options);
  if (issues.length === 0) return;
  const error = new Error(`远程渲染输入预检失败：${issues.join("；")}`);
  error.code = "remote-render-inputs-invalid";
  error.issues = issues;
  throw error;
}

function normalizePreparationError(error) {
  if (error?.code === "remote-render-inputs-invalid") return error;
  const message = error instanceof Error ? error.message : String(error);
  const normalized = new Error(`远程渲染输入预检失败：${message}`);
  normalized.code = "remote-render-inputs-invalid";
  normalized.issues = error?.issues?.length ? error.issues : [message];
  return normalized;
}

export function assertRemoteRenderDeliveryInputs(project, options = {}) {
  const issues = [
    ...validateRemoteRenderPackage(project),
    ...validateRenderInputDelivery(project),
    ...validateGitRenderDelivery(project, { requireRepository: options.requireRepository ?? true }),
  ];
  if (issues.length === 0) return;
  const error = new Error(`远程渲染交付预检失败：${issues.join("；")}`);
  error.code = "remote-render-delivery-invalid";
  error.issues = issues;
  throw error;
}

export function prepareRemoteRenderInputs(project, options = {}) {
  assertProjectMutable(project, "准备远程渲染输入");
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    return { status: "skipped", sourceIssues: [], archivePath: null, archiveRelativePath: null, sourcePath: null };
  }
  try {
    const result = prepareRenderInput(project, options);
    const packageResult = packageRenderInput(project.config.workspaceRoot, project.config.slug);
    return {
      ...result,
      ...packageResult,
      sourceIssues: [],
      archivePath: packageResult.archivePath,
      archiveRelativePath: path.relative(project.config.workspaceRoot, packageResult.archivePath),
      sourcePath: result.directory,
    };
  } catch (error) {
    throw normalizePreparationError(error);
  }
}

export function validateRemoteRenderPackage(project) {
  const workspaceRoot = project?.config?.workspaceRoot;
  const slug = project?.config?.slug;
  if (typeof workspaceRoot !== "string" || !workspaceRoot.trim() || typeof slug !== "string") {
    return ["缺少视频工作区路径或 slug，无法检查独立远程输入包"];
  }
  const directory = renderInputDirectory(workspaceRoot, slug);
  if (!fs.existsSync(directory)) return [`缺少 local/render-input/${slug}，请先准备远程渲染输入包`];
  return validateRenderInputDirectory(directory, { expectedSlug: slug });
}

export function createRemoteRenderExecutor({ monitor, validateInputs = null, prepareInputs = null, preflight = null } = {}) {
  if (!monitor || typeof monitor.submit !== "function") {
    throw new Error("Remote render executor requires a remote job monitor");
  }
  const effectiveValidateInputs = validateInputs ?? assertRemoteRenderDeliveryInputs;
  const effectivePrepareInputs = prepareInputs ?? (validateInputs === null ? prepareRemoteRenderInputs : () => {});
  const effectivePreflight = preflight ?? (({ project }) => assertGitHubActionsReady({ project, checkRenderInput: false }));

  return {
    async run({ stage, project, batchId = null }) {
      assertProjectMutable(project, "提交远程渲染任务");
      if (stage === "smoke-render") {
        const error = new Error("Smoke Render 已退出 Harness 生产流程，请从 GitHub Actions 手动触发独立环境检查。");
        error.code = "standalone-smoke-render";
        throw error;
      }
      if (!REMOTE_STAGES.has(stage)) {
        throw new Error(`Remote render executor does not support stage: ${stage}`);
      }
      assertRenderStageReady(project);
      await effectivePrepareInputs(project);
      await effectiveValidateInputs(project);
      if (effectiveValidateInputs === assertRemoteRenderDeliveryInputs) assertRenderInputDelivery(project);
      if (effectivePreflight) await effectivePreflight({ stage, project });
      const job = monitor.submit({ slug: project.config.slug, stage, ...(batchId ? { batchId } : {}) });
      return {
        deferred: true,
        job,
        remote: {
          kind: "harness-remote-job",
          jobId: job.id,
          stage,
          slug: project.config.slug,
        },
      };
    },
  };
}
