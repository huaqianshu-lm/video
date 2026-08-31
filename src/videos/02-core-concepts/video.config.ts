import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import seriesConfig from '../../../series/codex-guide/series.json';

const fps = 30;

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-split-result', type: 'opening', durationSeconds: 0,
    headline: '同一个任务，为什么只完成了一半', subtitle: 'Opening Result',
    cards: ['项目目录', '桌面目录'], highlight: '项目目录', caption: [],
  },
  {
    id: 'scene-02-agent-loop', type: 'step-list', durationSeconds: 0,
    headline: '先确认谁在行动：Agent', steps: ['理解目标', '读取', '执行', '查看结果', '调整'], caption: [],
  },
  {
    id: 'scene-03-boundary-map', type: 'concept', durationSeconds: 0,
    headline: 'Sandbox 画出行动边界', keyPoints: ['Sandbox', 'workspace-write', '工作区内：可写', '边界之外：当前不可直接写入'], caption: [],
  },
  {
    id: 'scene-04-decision-flow', type: 'comparison', durationSeconds: 0,
    headline: '越过边界之前，还要经过 Approval',
    columns: [
      {title: 'Sandbox：能不能', items: ['边界内 → 执行']},
      {title: 'Approval：问不问', items: ['边界外 → 请求许可', '获准范围内继续', '未获许可 → 停止']},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-05-rule-injection', type: 'concept', durationSeconds: 0,
    headline: '有权限，还要先读项目规则', keyPoints: ['AGENTS.md', '构建命令', '测试要求', '审查规则', '仓库约定'], caption: [],
  },
  {
    id: 'scene-06-context-map', type: 'comparison', durationSeconds: 0,
    headline: '规则负责确定，上下文负责补充',
    columns: [
      {title: 'AGENTS.md', items: ['稳定项目规则']},
      {title: 'Memory', items: ['过去会话的提炼信息']},
      {title: 'Chronicle', items: ['近期屏幕活动上下文']},
    ], highlightIndex: 0, caption: [],
  },
  {
    id: 'scene-07-controlled-experiment', type: 'terminal', durationSeconds: 0,
    headline: '请求没变，边界变了，结果就变了', command: '在当前项目创建 hello.txt', output: ['read-only：未写入', 'workspace-write：hello.txt 已创建'], caption: [],
  },
  {
    id: 'scene-08-system-map', type: 'summary', durationSeconds: 0,
    headline: '把五个概念合成一套工作模型', summary: '给清目标 · 画好边界 · 写下规则', bullets: ['Agent', 'Sandbox', 'Approval', '项目规则', '上下文'], highlight: '目标', caption: [],
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) => scene.segments.map((segment) => ({
  id: segment.segmentId,
  src: `local-assets/02-core-concepts/${segment.audioFile}`,
  startSeconds: scene.offset + segment.offset,
  durationSeconds: segment.duration,
})));

const subtitleCues: SubtitleCue[] = subtitleManifest.scenes.flatMap((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  if (!sceneTiming) throw new Error(`Missing timeline for scene ${scene.sceneId}`);

  return scene.segments.flatMap((segment) => {
    const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);
    if (!segmentTiming) throw new Error(`Missing timeline for segment ${segment.segmentId}`);

    return segment.cues.map((cue) => ({
      startSeconds: sceneTiming.offset + segmentTiming.offset + cue.start,
      endSeconds: sceneTiming.offset + segmentTiming.offset + cue.end,
      text: cue.text,
    }));
  });
});

export const videoConfig: VideoConfig = {
  slug: '02-core-concepts',
  title: 'Codex 核心概念速览',
  format: 'horizontal',
  width: 1920,
  height: 1080,
  fps,
  series: {
    id: seriesConfig.id,
    style: seriesConfig.style,
    coverSrc: seriesConfig.cover ?? undefined,
    coverDurationFrames: seriesConfig.coverDurationFrames,
  },
  audioTracks,
  subtitleCues,
  scenes: sceneDefinitions.map((scene, index) => ({
    ...scene,
    durationSeconds: timelineManifest.scenes[index].duration,
    showCaption: false,
  })),
};
