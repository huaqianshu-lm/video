import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { initializeProject } from "../../src/storage.mjs";
import { runStage, approveGate } from "../../src/runner.mjs";
import { writeVisualReviewFixture } from "./visual-review-fixture.mjs";
const repositoryRoot = path.resolve(new URL("../../..", import.meta.url).pathname);

export function createFixture({ prototypeBaseline = null } = {}) {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-workspace-"));
  const projectsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "video-harness-projects-"));
  const slug = "fixture-video";
  const files = [
    `videos/${slug}/source.md`,
    `videos/${slug}/content-analysis.md`,
    `videos/${slug}/video-narrative.md`,
    `videos/${slug}/scene-script.md`,
    `videos/${slug}/narration-script.md`,
    `videos/${slug}/visual-script.md`,
    `videos/${slug}/visual-prototype.html`,
    `videos/${slug}/tts-script.json`,
    `src/videos/${slug}/generated/audio-manifest.json`,
    `src/videos/${slug}/generated/subtitle-manifest.json`,
    `src/videos/${slug}/generated/timeline-manifest.json`,
    `src/videos/${slug}/video.config.ts`,
    `src/videos/${slug}/FixtureVideo.tsx`,
  ];

  for (const relativePath of files) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    let content = "fixture\n";
    if (relativePath.endsWith("content-analysis.md")) content = "# Content Analysis\n\n## 核心命题\n验证 Harness。\n\n## 关键关系\n输入、校验和输出。\n\n## 可视觉化内容\n展示阶段状态。\n";
    if (relativePath.endsWith("video-narrative.md")) content = "# Video Narrative\n\n## 叙事目标\n解释流程。\n\n## 叙事原则\n先展示，再验证。\n\n## 整体叙事结构\n从输入到输出。\n";
    if (relativePath.endsWith("scene-script.md")) content = "# Scene Script\n\n## Scene 01｜测试\n\n### 目的\n验证 Harness。\n\n### narrativeRole\n建立流程。\n\n### narrationIntent\n解释测试。\n\n### visualIntent\n展示测试状态。\n\n### visualType\n流程。\n\n### keyOnScreenText\nHarness。\n\n### videoValue\n让流程可检查。\n";
    if (relativePath.endsWith("narration-script.md")) content = "# Narration Script\n\n## Scene 01｜测试\n\n这是测试口播。\n";
    if (relativePath.endsWith("visual-script.md")) content = "# Visual Script\n\n## 全局视觉原则\n保持清晰。\n\n## Scene 01｜测试\n\n### 视觉目标\n展示测试状态。\n\n### 画面结构\n一个状态卡片。\n\n### 动画\n淡入。\n\n### 屏幕文字\nHarness。\n\n### Visual Type\n流程。\n";
    if (relativePath.endsWith("visual-prototype.html")) content = "<!doctype html><main><button>上一幕</button><button>下一幕</button><button>自动播放</button><div id=\"progress\"></div><section class=\"scene\">Scene 01</section></main>\n";
    if (relativePath.endsWith("FixtureVideo.tsx")) content = "export const FixtureVideo = () => null;\n";
    if (relativePath.endsWith("video.config.ts")) content = "const fps = 30; const subtitleManifest = {}; const timelineManifest = {}; export const videoConfig = { slug: 'fixture-video', format: 'horizontal', width: 1920, height: 1080, fps, scenes: [] };\n";
    if (relativePath.endsWith("tts-script.json")) content = JSON.stringify({
      schemaVersion: "1.0",
      scenes: [{ sceneId: "01", segments: [{ id: "01-01", text: "这是测试口播。" }] }],
    });
    if (relativePath.endsWith("audio-manifest.json")) content = JSON.stringify({
      videoId: slug,
      scenes: [{ sceneId: "01", segments: [{ id: "01-01", file: "audio/scene-01/01-01.mp3", duration: 1 }] }],
    });
    if (relativePath.endsWith("subtitle-manifest.json")) content = JSON.stringify({
      videoId: slug,
      scenes: [{ sceneId: "01", segments: [{ segmentId: "01-01", cues: [{ start: 0, end: 0.9, text: "这是测试口播" }] }] }],
    });
    if (relativePath.endsWith("timeline-manifest.json")) content = JSON.stringify({
      videoId: slug,
      duration: 1,
      scenes: [{
        sceneId: "01",
        offset: 0,
        duration: 1,
        end: 1,
        segments: [{ segmentId: "01-01", offset: 0, duration: 1, end: 1 }],
      }],
    });
    fs.writeFileSync(absolutePath, `${content}\n`, "utf8");
  }

  const fixtureAssets = {
    [`public/local-assets/${slug}/audio/scene-01/01-01.mp3`]: "fixture-audio",
    [`public/local-assets/${slug}/subtitles/captions.vtt`]: "WEBVTT\n",
    [`public/local-assets/${slug}/subtitles/captions.srt`]: "1\n00:00:00,000 --> 00:00:01,000\nFixture\n",
  };
  for (const [relativePath, content] of Object.entries(fixtureAssets)) {
    const absolutePath = path.join(workspaceRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  }

  process.env.HARNESS_PROJECTS_DIR = projectsRoot;
  process.env.HARNESS_WORKSPACE_ROOT = workspaceRoot;
  process.env.HARNESS_TTS_PROJECT_DIR = path.resolve(repositoryRoot, "..", "tts");
  writeVisualReviewFixture(workspaceRoot, slug);
  // These fixtures exercise the supported legacy stage-by-stage contract.
  initializeProject(slug, { prototypeBaseline, productionContract: "legacy-v1" });
  return { slug, projectsRoot };
}


export function runToGate3(project) {
  runToGate2(project);
  approveGate(project, "gate-2");
  runStage(project, "tts");
  runStage(project, "subtitle-timeline");
  runStage(project, "remotion");
  runStage(project, "gate-3");
}

function runToGate2(project) {
  const preGateStages = [
    "source",
    "content-analysis",
    "video-narrative",
    "scene-script",
    "narration-script",
    "visual-script",
    "visual-prototype",
  ];
  for (const stage of preGateStages) {
    runStage(project, stage);
  }
  runStage(project, "gate-2");
}
