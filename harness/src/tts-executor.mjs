import path from "node:path";
import { commandConfigFromEnv, createCommandExecutor } from "./command-executor.mjs";

const TTS_RATE = "+25%";
const TTS_VOICE = "zh-CN-XiaoxiaoNeural";

function ttsInput(project, executionTask) {
  const slug = project.config.slug;
  return {
    schemaVersion: 1,
    kind: "video-tts-execution",
    videoId: slug,
    rate: TTS_RATE,
    voice: TTS_VOICE,
    workspaceRoot: project.config.workspaceRoot,
    ...(executionTask ? { executionTask } : {}),
    input: {
      ttsScript: `videos/${slug}/tts-script.json`,
    },
    output: {
      audioDirectory: `src/videos/${slug}/generated/audio`,
      audioManifest: `src/videos/${slug}/generated/audio-manifest.json`,
      subtitleManifest: `src/videos/${slug}/generated/subtitle-manifest.json`,
      timelineManifest: `src/videos/${slug}/generated/timeline-manifest.json`,
      subtitleDirectory: `src/videos/${slug}/generated/subtitles`,
    },
    constraints: [
      "只能消费冻结且已通过 Harness 校验的 tts-script.json。",
      "音频、字幕和 Timeline 必须由同一份 TTS Script 和实际音频生成。",
      "已有有效 Segment 应复用，失败或空文件 Segment 才允许重试。",
      "完成后必须让 Harness 重新校验所有输出。",
    ],
  };
}

export function buildTtsExecutionInput(project) {
  return ttsInput(project);
}

export function createTtsExecutor(options = {}) {
  const commandExecutor = createCommandExecutor({
    name: "tts",
    ...options,
    input: ({ project, executionTask }) => ttsInput(project, executionTask),
  });
  return {
    async run(context) {
      const result = await commandExecutor.run(context);
      // The adapter emits its structured result on the final stdout line.
      const lastLine = result.stdout.trim().split("\n").at(-1);
      let report;
      try { report = JSON.parse(lastLine); } catch { return result; }
      if (report?.executor === "tts-harness-adapter" && report.generationRecord) result.generationRecord = report.generationRecord;
      return result;
    },
  };
}

export function createTtsExecutorFromEnv() {
  return createTtsExecutor(commandConfigFromEnv("HARNESS_TTS_EXECUTOR"));
}

export function ttsOutputPaths(project) {
  const slug = project.config.slug;
  return [
    path.join(project.config.workspaceRoot, `src/videos/${slug}/generated/audio-manifest.json`),
    path.join(project.config.workspaceRoot, `src/videos/${slug}/generated/subtitle-manifest.json`),
    path.join(project.config.workspaceRoot, `src/videos/${slug}/generated/timeline-manifest.json`),
  ];
}
