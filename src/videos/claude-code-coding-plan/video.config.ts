import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig, VisualBeat} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const fps = 30;

const beat = (
  title: string,
  description: string,
  items: string[] = [],
  tone: VisualBeat['tone'] = 'accent',
): VisualBeat => ({title, description, items, tone});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-billing-blind-spot',
    type: 'opening',
    durationSeconds: 0,
    headline: '账单为什么会失控',
    subtitle: '先把钱花在哪里看明白',
    cards: ['model processing', 'context', '请求轨迹', '我到底在为什么付钱？'],
    highlight: '我到底在为什么付钱？',
    cardDetails: [
      beat('model processing', '模型正在处理请求。', ['请求'], 'accent'),
      beat('context', '旧对话和文件也会进入处理量。', ['上下文'], 'warning'),
      beat('请求轨迹', '每一次请求都可能让总额继续增长。', ['增长'], 'accent'),
      beat('我到底在为什么付钱？', '先看懂成本来源，再比较套餐。', ['问题入口'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-02-token-meter',
    type: 'concept',
    durationSeconds: 0,
    headline: 'Token 到底怎么计费',
    keyPoints: ['Input', 'Context', 'Output', '内容进入计价器'],
    caption: [],
  },
  {
    id: 'scene-03-plan-paths',
    type: 'comparison',
    durationSeconds: 0,
    headline: '三条付费路径怎么选',
    columns: [
      {
        title: '按量计费',
        items: ['官方原生模型', '按实际用量支付', '适合用量可控'],
        workflowTitle: '官方原生模型',
        workflowStatus: '按量付费',
        visualSteps: [beat('原生', '适合需要官方模型和按量控制的人。', ['官方'], 'accent')],
      },
      {
        title: '官方订阅',
        items: ['固定支出', '适合稳定使用', '按套餐边界使用'],
        workflowTitle: '固定支出',
        workflowStatus: '订阅额度',
        visualSteps: [beat('固定', '适合希望先锁定支出的使用方式。', ['订阅'], 'success')],
      },
      {
        title: '国产 Coding Plan',
        items: ['国内成本／网络', '按厂商方案使用', '先核对接口规则'],
        workflowTitle: '国内成本／网络',
        workflowStatus: '厂商套餐',
        visualSteps: [beat('核对', '网络和计费边界要以厂商资料为准。', ['文档'], 'warning')],
      },
    ],
    highlightIndex: 1,
    caption: [],
  },
  {
    id: 'scene-04-routing-trap',
    type: 'terminal',
    durationSeconds: 0,
    headline: '买了套餐，为什么还会多一笔账单',
    command: 'cat .env | grep ANTHROPIC_BASE_URL',
    output: [
      '.../api/coding  →  套餐额度',
      '切换为 .../api/v3',
      '.../api/v3  →  按量账单',
      '套餐专属 API Key  ✓',
      '买了套餐 ≠ 一定走套餐',
    ],
    reviewFlow: [
      beat('正确路径', '请求进入套餐额度。', ['coding'], 'success'),
      beat('路径变化', '只改 URL 末段，计费路径可能改变。', ['v3'], 'warning'),
      beat('核对 Key', '套餐专属 Key 也要按当前文档配置。', ['API Key'], 'accent'),
    ],
    caption: [],
  },
  {
    id: 'scene-05-usage-commands',
    type: 'terminal',
    durationSeconds: 0,
    headline: '三个命令分别看什么',
    command: '/usage && /usage-credits && /status',
    output: [
      '/usage          →  Session',
      '/usage-credits  →  Limit',
      '/status         →  Status',
      '本地估算，不等于最终账单',
      '看明细 · 设上限 · 核配置',
    ],
    reviewFlow: [
      beat('看明细', '查看当前 Session 的使用情况。', ['/usage'], 'accent'),
      beat('设上限', '官方 Pro／Max 用户查看额度。', ['/usage-credits'], 'success'),
      beat('核配置', '确认版本、模型和连接状态。', ['/status'], 'warning'),
    ],
    caption: [],
  },
  {
    id: 'scene-06-saving-habits',
    type: 'step-list',
    durationSeconds: 0,
    headline: '省钱不是只换便宜套餐',
    steps: ['/clear', 'Sonnet', 'plan mode', '具体提示'],
    stepVisuals: [
      beat('/clear', '清掉陈旧上下文，减少无效输入。', ['上下文变短'], 'success'),
      beat('Sonnet', '日常任务使用更均衡的模型档位。', ['模型成本'], 'accent'),
      beat('plan mode', '先规划再执行，减少返工。', ['少返工'], 'warning'),
      beat('具体提示', '限定范围和验收标准，避免无关扫描。', ['少扫描'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-07-control-loop',
    type: 'step-list',
    durationSeconds: 0,
    headline: '现在就建立用量感知',
    steps: ['启动 Claude Code', '/status', '跑一个小任务', '/usage', '设置上限'],
    stepVisuals: [
      beat('启动', '从一个最小任务开始。', ['开始'], 'accent'),
      beat('/status', '先确认当前配置基准。', ['核配置'], 'success'),
      beat('小任务', '用小范围任务观察真实消耗。', ['观察'], 'accent'),
      beat('/usage', '查看本次 Session 的使用情况。', ['看明细'], 'success'),
      beat('设置上限', '官方额度或厂商控制台分别核对。', ['设上限'], 'warning'),
    ],
    caption: [],
  },
  {
    id: 'scene-08-summary-teaser',
    type: 'summary',
    durationSeconds: 0,
    headline: '把账、配置和上下文管起来',
    summary: '看懂计费，核对路径，控制上下文',
    bullets: ['看懂计费', '核对路径', '控制上下文'],
    highlight: '控制上下文',
    roleCards: [
      beat('看懂计费', '知道费用和输入、输出、上下文的关系。', ['Token'], 'accent'),
      beat('核对路径', '确认 URL、Key 和套餐路径没有错配。', ['Base URL'], 'warning'),
      beat('控制上下文', '用命令和习惯减少无效消耗。', ['/clear'], 'success'),
    ],
    teaser: beat(
      '下一集',
      '正式启动 Claude Code，跑通第一个真实项目',
      ['07 第一次使用：跑通第一个例子'],
      'accent',
    ),
    caption: [],
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const getFrameAlignedSceneDurationSeconds = (sceneIndex: number) => {
  const timing = timelineManifest.scenes[sceneIndex];
  if (!timing) throw new Error(`Missing timeline for scene index ${sceneIndex}`);
  const startInFrames = Math.round(timing.offset * fps);
  const endInFrames = Math.round(timing.end * fps);
  return (endInFrames - startInFrames) / fps;
};

type VisualRevealAnchor = {segmentId: string; offsetSeconds?: number};
const revealAt = (segmentId: string, offsetSeconds = 0): VisualRevealAnchor => ({segmentId, offsetSeconds});

const visualRevealAnchors: VisualRevealAnchor[][] = [
  [revealAt('01-01', 0.5), revealAt('01-02'), revealAt('01-03'), revealAt('01-04', 1)],
  [revealAt('02-01'), revealAt('02-02'), revealAt('02-03'), revealAt('02-04')],
  // 先让卡片进入画面，再让对应的付费路径口播和字幕开始。
  [revealAt('03-02', -1.2), revealAt('03-03', -1.2), revealAt('03-04', -1.2)],
  [revealAt('04-01'), revealAt('04-02'), revealAt('04-03'), revealAt('04-04'), revealAt('04-05')],
  [revealAt('05-01'), revealAt('05-02'), revealAt('05-03'), revealAt('05-04'), revealAt('05-05')],
  [revealAt('06-01'), revealAt('06-02'), revealAt('06-03'), revealAt('06-04')],
  [revealAt('07-01'), revealAt('07-02'), revealAt('07-03'), revealAt('07-04'), revealAt('07-05')],
  [revealAt('08-01'), revealAt('08-02'), revealAt('08-03')],
];

const getVisualRevealSeconds = (sceneIndex: number, anchor: VisualRevealAnchor) => {
  const scene = timelineManifest.scenes[sceneIndex];
  const segment = scene?.segments.find((item) => item.segmentId === anchor.segmentId);
  if (!scene || !segment) throw new Error(`Missing visual timing for ${anchor.segmentId}`);
  const offsetSeconds = anchor.offsetSeconds ?? 0;
  if (offsetSeconds < -segment.offset || offsetSeconds > segment.duration) {
    throw new Error(`Invalid visual offset for ${anchor.segmentId}`);
  }
  return segment.offset + offsetSeconds;
};

export const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/claude-code-coding-plan/${segment.audioFile}`,
    startSeconds: scene.offset + segment.offset,
    durationSeconds: segment.duration,
  })),
);

export const subtitleCues: SubtitleCue[] = subtitleManifest.scenes.flatMap((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  if (!sceneTiming) throw new Error(`Missing timeline for scene ${scene.sceneId}`);
  return scene.segments.flatMap((segment) => {
    const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);
    if (!segmentTiming) throw new Error(`Missing timeline for segment ${segment.segmentId}`);
    return segment.cues.map((cue, cueIndex) => ({
      startSeconds: sceneTiming.offset + segmentTiming.offset + (cueIndex === 0 ? 0 : cue.start),
      endSeconds: sceneTiming.offset + segmentTiming.offset + cue.end,
      text: cue.text,
    }));
  });
});

export const videoConfig: VideoConfig = {
  slug: 'claude-code-coding-plan',
  title: 'Claude Code 订阅套餐与计费',
  format: 'horizontal',
  width: 1920,
  height: 1080,
  fps,
  audioTracks,
  subtitleCues,
  scenes: sceneDefinitions.map((scene, index) => ({
    ...scene,
    durationSeconds: getFrameAlignedSceneDurationSeconds(index),
    showCaption: false,
    visualRevealSeconds: visualRevealAnchors[index].map((anchor) => getVisualRevealSeconds(index, anchor)),
  })),
};
