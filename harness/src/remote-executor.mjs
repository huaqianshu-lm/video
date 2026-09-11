import fs from "node:fs";
import path from "node:path";
import { archiveEntries, archiveMatchesAssetDirectory, assetSourcePath } from "./asset-bundler.mjs";
import { validateGitRenderDelivery } from "./git-delivery.mjs";
import { packageRenderInput, prepareRenderInput, renderInputDirectory, validateRenderInputDirectory } from "./render-input.mjs";

const REMOTE_STAGES = new Set(["smoke-render", "render"]);

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} 无法读取：${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validateRemoteRenderInputs(project, { listArchiveEntries = archiveEntries, compareLocalAssets = true } = {}) {
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

export function assertRemoteRenderInputs(project, options) {
  const issues = validateRemoteRenderInputs(project, options);
  if (issues.length === 0) return;
  const error = new Error(`远程渲染输入预检失败：${issues.join("；")}`);
  error.code = "remote-render-inputs-invalid";
  error.issues = issues;
  throw error;
}

export function assertRemoteRenderDeliveryInputs(project, options = {}) {
  const issues = [
    ...validateRemoteRenderPackage(project),
    ...validateGitRenderDelivery(project, { requireRepository: options.requireRepository ?? true }),
  ];
  if (issues.length === 0) return;
  const error = new Error(`远程渲染交付预检失败：${issues.join("；")}`);
  error.code = "remote-render-delivery-invalid";
  error.issues = issues;
  throw error;
}

export function prepareRemoteRenderInputs(project, options = {}) {
  if (typeof project?.config?.workspaceRoot !== "string" || !project.config.workspaceRoot.trim()) {
    return { status: "skipped", sourceIssues: [], archivePath: null, archiveRelativePath: null, sourcePath: null };
  }
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

export function createRemoteRenderExecutor({ monitor, validateInputs = null, prepareInputs = null } = {}) {
  if (!monitor || typeof monitor.submit !== "function") {
    throw new Error("Remote render executor requires a remote job monitor");
  }
  const effectiveValidateInputs = validateInputs ?? assertRemoteRenderDeliveryInputs;
  const effectivePrepareInputs = prepareInputs ?? (validateInputs === null ? prepareRemoteRenderInputs : () => {});

  return {
    run({ stage, project }) {
      if (!REMOTE_STAGES.has(stage)) {
        throw new Error(`Remote render executor does not support stage: ${stage}`);
      }
      if (project.state.currentStage !== stage || project.state.stages[stage]?.status !== "ready") {
        throw new Error(`${project.config.slug} 当前不在可执行的 ${stage} 阶段`);
      }
      effectivePrepareInputs(project);
      effectiveValidateInputs(project);
      const job = monitor.submit({ slug: project.config.slug, stage });
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
