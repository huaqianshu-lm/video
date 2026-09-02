import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import seriesConfig from '../../../series/codex-guide/series.json';

const fps = 30;

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01', type: 'opening', durationSeconds: 0,
    headline: '同样一条消息，为什么消耗不同？', subtitle: '消息条数相同，真正进入处理的上下文可能完全不同。',
    cards: ['小脚本', '大型项目＋长会话＋规则'], highlight: '消息条数 ≠ 实际用量', caption: [],
  },
  {
    id: 'scene-02', type: 'concept', durationSeconds: 0,
    headline: '工具、模型与 token 不是一回事', keyPoints: ['工具入口', '模型处理', '输入 token', '输出 token', '上下文'], caption: [],
  },
  {
    id: 'scene-03', type: 'step-list', durationSeconds: 0,
    headline: 'ChatGPT 订阅这条账', steps: ['ChatGPT 订阅', '固定月费', '订阅用量规则', '滚动限额', '积分'], caption: [],
  },
  {
    id: 'scene-04', type: 'comparison', durationSeconds: 0,
    headline: 'API key 这条账：两套账',
    columns: [
      {title: 'ChatGPT 订阅', items: ['ChatGPT 积分', '订阅路径']},
      {title: 'API 账本', items: ['程序或脚本', 'API key', '输入／输出 token', 'Platform 账单']},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-05', type: 'comparison', durationSeconds: 0,
    headline: '套餐先按使用场景分层',
    columns: [
      {title: 'Plus', items: ['个人开发者', '基础使用']},
      {title: 'Pro', items: ['高频重度个人', '使用强度']},
      {title: 'Business', items: ['团队协作', '协作管理']},
      {title: 'Enterprise & Edu', items: ['组织级部署', '安全管理']},
    ], highlightIndex: 0, caption: [],
  },
  {
    id: 'scene-06', type: 'comparison', durationSeconds: 0,
    headline: '滚动窗口与任务复杂度',
    columns: [
      {title: '5 小时滚动窗口', items: ['小脚本', '大型项目', '长会话']},
      {title: '达到限额', items: ['积分', '积分 ≠ API 账单']},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-07', type: 'step-list', durationSeconds: 0,
    headline: '升级前先控制上下文', steps: ['缩小输入范围', '压缩固定上下文', '按需连接工具', '匹配模型与任务', '/new'], caption: [],
  },
  {
    id: 'scene-08', type: 'terminal', durationSeconds: 0,
    headline: '查看、调整、清理、复盘', command: '/status → /model → /new',
    output: ['/status', '/model', '/new', '订阅用量面板', 'API Platform 账单'], caption: [],
  },
  {
    id: 'scene-09', type: 'summary', durationSeconds: 0,
    headline: '先识别付费路径，再进入模型接入', summary: '订阅额度 or API 按量计费',
    bullets: ['登录路径', '任务类型', '上下文规模', '用量观察位置'], highlight: '接入 DeepSeek 等国产模型', caption: [],
    compactLayout: true,
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/04-pricing/${segment.audioFile}`,
    startSeconds: scene.offset + segment.offset,
    durationSeconds: segment.duration,
  })),
);

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

const sceneDuration = (index: number) => {
  const scene = timelineManifest.scenes[index];
  if (!scene) throw new Error(`Missing timeline for scene index ${index}`);
  return (Math.round(scene.end * fps) - Math.round(scene.offset * fps)) / fps;
};

export const videoConfig: VideoConfig = {
  slug: '04-pricing',
  title: 'Codex 订阅与计费',
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
    durationSeconds: sceneDuration(index),
    showCaption: false,
  })),
};
