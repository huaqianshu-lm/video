import type {SceneConfig, VideoConfig, VisualBeat} from '../../lib/videoTypes';
import audioManifest from './generated/audio-manifest.json';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import {createNarratedTiming} from '../../lib/timing';

const fps = 30;

const narratedTiming = createNarratedTiming({
  fps,
  audioSrcPrefix: 'local-assets/claude-code-third-party-models',
  audioManifest,
  subtitleManifest,
  timelineManifest,
});

const beat = (
  title: string,
  description: string,
  items: string[] = [],
  tone: VisualBeat['tone'] = 'accent',
): VisualBeat => ({title, description, items, tone});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-worth-switching',
    type: 'opening',
    durationSeconds: 0,
    headline: '第三方模型，值得换吗？',
    subtitle: '先判断，再配置',
    cards: ['省钱', '国内直连', '复杂任务能力', '稳定与支持'],
    highlight: '省钱',
    cardDetails: [
      beat('省钱', 'API 用量高时，成本可能低很多。', ['收益'], 'success'),
      beat('国内直连', '部分服务可能更容易连接。', ['连接'], 'accent'),
      beat('复杂任务能力', '结果可能和官方模型不同。', ['代价'], 'warning'),
      beat('稳定与支持', '兼容不等于官方兜底。', ['边界'], 'warning'),
    ],
    caption: [],
  },
  {
    id: 'scene-02-tradeoff',
    type: 'comparison',
    durationSeconds: 0,
    headline: '便宜和直连，换来了什么？',
    columns: [
      {
        title: '第三方模型',
        items: ['价格可能更低', '部分服务更易直连', '适合重度 API 用户'],
        workflowTitle: '成本／连接',
        workflowStatus: '第三方优势',
        visualSteps: [
          beat('成本', '价格可能更低。', ['省钱'], 'success'),
          beat('连接', '部分服务更容易直连。', ['直连'], 'accent'),
        ],
      },
      {
        title: '官方模型',
        items: ['复杂任务更稳', '工具调用更有保障', '有官方支持边界'],
        workflowTitle: '能力／稳定',
        workflowStatus: '官方保障',
        visualSteps: [
          beat('能力', '复杂代码任务更稳定。', ['能力'], 'accent'),
          beat('支持', '保留官方支持边界。', ['支持'], 'success'),
        ],
      },
    ],
    highlightIndex: 0,
    caption: [],
  },
  {
    id: 'scene-03-request-route',
    type: 'concept',
    durationSeconds: 0,
    headline: 'Claude Code 不变，请求路径改变',
    keyPoints: ['Claude Code 外壳', '兼容接口 Base URL', '具体模型回答', 'URL ≠ Model'],
    caption: [],
  },
  {
    id: 'scene-04-three-variables',
    type: 'step-list',
    durationSeconds: 0,
    headline: '三个变量，三种职责',
    steps: ['BASE_URL：去哪里', 'AUTH_TOKEN：用谁的身份', 'MODEL：谁来回答'],
    stepVisuals: [
      beat('地址', '请求发到哪个兼容接口。', ['ANTHROPIC_BASE_URL'], 'accent'),
      beat('身份', '携带第三方服务提供的 Token。', ['ANTHROPIC_AUTH_TOKEN'], 'warning'),
      beat('模型', '决定实际由哪个模型回答。', ['ANTHROPIC_MODEL'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-05-session-lifecycle',
    type: 'comparison',
    durationSeconds: 0,
    headline: '当前终端有效，不等于永久生效',
    left: {
      title: '当前终端',
      items: ['export / $env:', '当前窗口有效', '关闭后可能消失'],
      workflowTitle: '临时配置',
      workflowStatus: '窗口生命周期',
      visualSteps: [
        beat('Session', '临时环境变量已加载。', ['loaded'], 'success'),
        beat('Exit', '窗口关闭后状态消失。', ['cleared'], 'warning'),
      ],
    },
    right: {
      title: '长期配置',
      items: ['shell / 系统变量', '更长时间暴露密钥', '不要写入代码或 Git'],
      workflowTitle: '持久配置',
      workflowStatus: '安全边界',
      visualSteps: [
        beat('Persist', '长期使用才考虑持久化。', ['配置'], 'accent'),
        beat('Protect', 'Token 只用占位符。', ['安全'], 'warning'),
      ],
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-06-status-acceptance',
    type: 'step-list',
    durationSeconds: 0,
    headline: '用 /status 验收，而不是凭感觉',
    steps: ['Base URL', 'Model', '模型是否存在', '401／鉴权失败'],
    stepVisuals: [
      beat('Base URL', '确认请求没有仍然发往官方地址。', ['/status'], 'accent'),
      beat('Model', '确认当前模型名和供应商文档一致。', ['Model'], 'success'),
      beat('模型存在', '模型不存在时回到官方文档核对。', ['docs'], 'warning'),
      beat('鉴权错误', '检查 Token、过期时间和多余空格。', ['401'], 'warning'),
    ],
    caption: [],
  },
  {
    id: 'scene-07-task-routing',
    type: 'comparison',
    durationSeconds: 0,
    headline: '别让所有任务都走同一个模型',
    columns: [
      {
        title: '复杂任务',
        items: ['架构设计', '跨模块重构', '疑难调试'],
        workflowTitle: '强模型',
        workflowStatus: '优先能力与稳定性',
        visualSteps: [beat('强模型', '优先保证能力和稳定性。', ['能力'], 'warning')],
      },
      {
        title: '日常任务',
        items: ['增删改查', '写测试', '补文档'],
        workflowTitle: '均衡模型',
        workflowStatus: '性价比档位',
        visualSteps: [beat('均衡模型', '选择性价比更高的档位。', ['平衡'], 'accent')],
      },
      {
        title: '轻量任务',
        items: ['问答', '后台杂活', '子代理'],
        workflowTitle: '快速模型',
        workflowStatus: '低风险任务',
        visualSteps: [beat('快速模型', '用便宜模型处理低风险任务。', ['速度'], 'success')],
      },
    ],
    highlightIndex: 1,
    caption: [],
  },
  {
    id: 'scene-08-compatibility-boundary',
    type: 'step-list',
    durationSeconds: 0,
    headline: '兼容接口，不等于官方支持',
    steps: ['旧变量可能被替代', 'Token 与 API key 头不同', '高级能力可能有差异'],
    stepVisuals: [
      beat('变量更新', '不要照搬过时教程。', ['SMALL_FAST_MODEL'], 'warning'),
      beat('请求头', 'Token 和 API key 要按供应商要求配置。', ['AUTH'], 'warning'),
      beat('能力边界', '工具调用和 MCP 可能出现差异。', ['MCP'], 'accent'),
    ],
    caption: [],
  },
  {
    id: 'scene-09-keep-control',
    type: 'summary',
    durationSeconds: 0,
    headline: '第三方模型是一条可验证、可分层、可回退的后端路径',
    summary: '切换权始终留在自己手里',
    bullets: ['先判断是否值得换', '地址、身份、模型配对', '用 /status 看证据'],
    highlight: '用 /status 看证据',
    roleCards: [
      beat('先判断是否值得换', '高用量或连接困难时再评估。', ['判断'], 'accent'),
      beat('地址、身份、模型配对', '三个变量分别承担不同职责。', ['配置'], 'success'),
      beat('用 /status 看证据', '验证后按任务分层，也随时可以切回官方。', ['/status', '回退'], 'success'),
    ],
    caption: [],
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

type VisualRevealAnchor = {
  segmentId: string;
  offsetSeconds?: number;
};

const revealAt = (segmentId: string, offsetSeconds = 0): VisualRevealAnchor => ({segmentId, offsetSeconds});

const visualRevealAnchors: VisualRevealAnchor[][] = [
  [revealAt('01-01', 0.5), revealAt('01-01', 2.4), revealAt('01-03', 0.4), revealAt('01-03', 2.4)],
  [revealAt('02-01'), revealAt('02-02')],
  [revealAt('03-02'), revealAt('03-03'), revealAt('03-04'), revealAt('03-05')],
  [revealAt('04-02'), revealAt('04-03'), revealAt('04-04')],
  [revealAt('05-01'), revealAt('05-02')],
  [revealAt('06-02'), revealAt('06-03'), revealAt('06-04'), revealAt('06-05')],
  [revealAt('07-03'), revealAt('07-04'), revealAt('07-05')],
  [revealAt('08-02'), revealAt('08-03'), revealAt('08-04')],
  [revealAt('09-02'), revealAt('09-04'), revealAt('09-05')],
];

const getVisualRevealSeconds = (sceneIndex: number, anchor: VisualRevealAnchor) => {
  const scene = narratedTiming.scenes[sceneIndex];
  const segment = scene?.segments.find((item) => item.segmentId === anchor.segmentId);

  if (!scene || !segment) {
    throw new Error(`Missing visual timing for scene index ${sceneIndex}, segment ${anchor.segmentId}`);
  }

  const offsetSeconds = anchor.offsetSeconds ?? 0;

  if (offsetSeconds < 0 || offsetSeconds > segment.durationSeconds) {
    throw new Error(`Invalid visual offset ${offsetSeconds} for segment ${anchor.segmentId}`);
  }

  return segment.startSeconds - scene.startSeconds + offsetSeconds;
};

if (visualRevealAnchors.length !== sceneDefinitions.length) {
  throw new Error(`Expected reveal mapping for ${sceneDefinitions.length} scenes, received ${visualRevealAnchors.length}`);
}

export const audioTracks = narratedTiming.audioTracks;
export const subtitleCues = narratedTiming.subtitleCues;

export const videoConfig: VideoConfig = {
  slug: 'claude-code-third-party-models',
  title: 'Claude Code 第三方模型',
  format: 'horizontal',
  width: 1920,
  height: 1080,
  fps,
  audioTracks,
  subtitleCues,
  scenes: sceneDefinitions.map((scene, index) => ({
    ...scene,
    durationSeconds: narratedTiming.scenes[index].durationSeconds,
    showCaption: false,
    visualRevealSeconds: visualRevealAnchors[index].map((anchor) => getVisualRevealSeconds(index, anchor)),
  })),
};
