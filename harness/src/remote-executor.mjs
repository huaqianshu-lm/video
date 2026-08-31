import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REMOTE_STAGES = new Set(["smoke-render", "render"]);

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} 无法读取：${error instanceof Error ? error.message : String(error)}`);
  }
}

function defaultArchiveEntries(archivePath) {
  execFileSync("unzip", ["-tqq", archivePath], { stdio: "pipe" });
  return execFileSync("unzip", ["-Z1", archivePath], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

export function validateRemoteRenderInputs(project, { listArchiveEntries = defaultArchiveEntries } = {}) {
  const slug = project.config.slug;
  const workspaceRoot = project.config.workspaceRoot;
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

export function createRemoteRenderExecutor({ monitor, validateInputs = assertRemoteRenderInputs } = {}) {
  if (!monitor || typeof monitor.submit !== "function") {
    throw new Error("Remote render executor requires a remote job monitor");
  }

  return {
    run({ stage, project }) {
      if (!REMOTE_STAGES.has(stage)) {
        throw new Error(`Remote render executor does not support stage: ${stage}`);
      }
      if (project.state.currentStage !== stage || project.state.stages[stage]?.status !== "ready") {
        throw new Error(`${project.config.slug} 当前不在可执行的 ${stage} 阶段`);
      }
      validateInputs(project);
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
