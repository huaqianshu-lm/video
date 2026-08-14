import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig, VisualBeat} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const fps = 30;

const beat = (title: string, description: string, items: string[] = [], tone: VisualBeat['tone'] = 'accent'): VisualBeat => ({
  title,
  description,
  items,
  tone,
});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-login-cost-conflict',
    type: 'opening',
    durationSeconds: 0,
    headline: '登录了，为什么还会产生 API 费用？',
    subtitle: '登录状态 ≠ 实际生效身份',
    cards: ['订阅已连接', 'API usage', '实际生效身份'],
    highlight: '实际生效身份',
    cardDetails: [
      beat('订阅已连接', '通过 /login 完成授权', ['OAuth', 'PRESENT'], 'success'),
      beat('API usage', '账单仍然持续增加', ['按量计费', '持续增加'], 'warning'),
      beat('实际生效身份', '还要看凭证优先级', ['等待判断', 'priority'], 'accent'),
    ],
    caption: [],
  },
  {
    id: 'scene-02-subscription-or-api-key',
    type: 'comparison',
    durationSeconds: 0,
    headline: '先判断：订阅还是 API key？',
    columns: [
      {
        title: '个人日常交互式开发',
        items: ['优先用订阅登录', '月度订阅', '适合直接进入项目'],
        visualSteps: [
          beat('使用场景', '个人日常开发', ['交互式'], 'accent'),
          beat('支付方式', '月度订阅', ['Claude.ai'], 'success'),
        ],
      },
      {
        title: '脚本 / CI / 团队按量',
        items: ['考虑 API key', '按 token 计费', '适合嵌入自动化'],
        visualSteps: [
          beat('使用场景', '脚本与 CI', ['自动化'], 'accent'),
          beat('支付方式', '按量结算', ['API key'], 'warning'),
        ],
      },
    ],
    highlightIndex: 0,
    caption: [],
  },
  {
    id: 'scene-03-subscription-login',
    type: 'terminal',
    durationSeconds: 0,
    headline: '订阅登录：claude 到浏览器授权',
    command: 'claude',
    output: ['浏览器打开 Claude.ai', '完成登录与授权', '回到终端：Authenticated', '需要换账号：/logout'],
    reviewFlow: [
      beat('启动 CLI', '在终端运行 claude。', ['claude'], 'accent'),
      beat('浏览器授权', '登录 Claude.ai 并确认授权。', ['OAuth'], 'accent'),
      beat('回到终端', '会话收到授权结果。', ['Authenticated'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-04-api-key-path',
    type: 'terminal',
    durationSeconds: 0,
    headline: 'API key：Console、环境变量、批准',
    command: 'export ANTHROPIC_API_KEY="sk-ant-your-key"',
    output: ['Console：Create API key', '环境变量已设置', 'Claude Code：Approve key', '不要写入代码或提交 Git'],
    reviewFlow: [
      beat('01 Console', '创建密钥。', ['占位符'], 'accent'),
      beat('02 Environment', '配置到环境变量。', ['ANTHROPIC_API_KEY'], 'accent'),
      beat('03 Claude Code', '启动后批准一次。', ['Approve'], 'success'),
      beat('安全边界', '真实密钥不能进入画面或仓库。', ['不要提交 Git'], 'warning'),
    ],
    caption: [],
  },
  {
    id: 'scene-05-two-credentials',
    type: 'comparison',
    durationSeconds: 0,
    headline: '两条身份可以同时存在',
    left: {
      title: 'OAuth subscription',
      items: ['PRESENT', '已完成 /login', '订阅凭证仍然存在'],
      visualSteps: [beat('凭证状态', '订阅登录已完成。', ['PRESENT'], 'success')],
    },
    right: {
      title: 'ANTHROPIC_API_KEY',
      items: ['PRESENT', '环境变量仍然存在', '可能成为覆盖源'],
      visualSteps: [beat('凭证状态', 'API key 也存在。', ['PRESENT'], 'warning')],
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-06-identity-priority-stack',
    type: 'step-list',
    durationSeconds: 0,
    headline: '六层身份验证优先级栈',
    steps: ['云提供商', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'apiKeyHelper', 'CLAUDE_CODE_OAUTH_TOKEN', '/login 订阅'],
    stepVisuals: [
      beat('云提供商', '第一层，当前为空时继续扫描。', ['EMPTY'], 'muted'),
      beat('ANTHROPIC_AUTH_TOKEN', '第二层，当前为空时继续扫描。', ['EMPTY'], 'muted'),
      beat('ANTHROPIC_API_KEY', '第三层，命中第一个有值的凭证。', ['PRESENT', 'USED'], 'warning'),
      beat('apiKeyHelper', '第四层，等待前面层级为空。', ['EMPTY'], 'muted'),
      beat('CLAUDE_CODE_OAUTH_TOKEN', '第五层，等待前面层级为空。', ['EMPTY'], 'muted'),
      beat('/login 订阅', '第六层，只有上层为空才会命中。', ['PRESENT'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-07-api-key-overrides-subscription',
    type: 'comparison',
    durationSeconds: 0,
    headline: '为什么 API key 会盖过订阅？',
    left: {
      title: '扫描结果',
      items: ['第 1、2 层 EMPTY', '第 3 层 PRESENT', '扫描在这里停止'],
      visualSteps: [
        beat('命中层', 'ANTHROPIC_API_KEY', ['PRESENT', 'USED'], 'warning'),
        beat('扫描规则', '第一个有值的层优先。', ['STOP'], 'accent'),
      ],
    },
    right: {
      title: '订阅凭证',
      items: ['仍然 PRESENT', '没有成为实际身份', '账单走 API usage'],
      visualSteps: [
        beat('底部状态', '/login subscription', ['PRESENT'], 'muted'),
        beat('实际结果', '被更高层覆盖。', ['SKIPPED'], 'warning'),
      ],
    },
    highlight: 'left',
    caption: [],
  },
  {
    id: 'scene-08-clear-and-verify',
    type: 'terminal',
    durationSeconds: 0,
    headline: '切回订阅：先清理，再复查',
    command: 'unset ANTHROPIC_API_KEY',
    output: ['ANTHROPIC_API_KEY → EMPTY', '扫描继续向下', '再进入 Claude Code：/status', 'Auth: Claude subscription (OAuth)'],
    reviewFlow: [
      beat('清理覆盖源', '移除更高优先级的环境变量。', ['unset'], 'accent'),
      beat('扫描继续', '订阅凭证可以被重新命中。', ['OAuth'], 'accent'),
      beat('/status 复查', '查看实际生效身份。', ['/status'], 'success'),
      beat('/config 备选', '关闭使用自定义 API 密钥。', ['可选入口'], 'muted'),
    ],
    caption: [],
  },
  {
    id: 'scene-09-entry-boundaries',
    type: 'comparison',
    durationSeconds: 0,
    headline: 'CLI、Desktop、Web：入口边界不同',
    columns: [
      {
        title: 'CLI',
        items: ['环境变量', 'OAuth', '终端会话'],
        visualSteps: [beat('读取范围', '会读取相关环境变量。', ['API key + OAuth'], 'accent')],
      },
      {
        title: 'Desktop',
        items: ['OAuth', '独立入口', '不要照搬 CLI 配置'],
        visualSteps: [beat('读取范围', '只认 OAuth。', ['OAuth'], 'success')],
      },
      {
        title: 'Web',
        items: ['订阅凭证', '浏览器入口', '不同读取范围'],
        visualSteps: [beat('读取范围', '使用订阅凭证。', ['Subscription'], 'success')],
      },
    ],
    highlightIndex: 0,
    caption: [],
  },
  {
    id: 'scene-10-identity-and-model',
    type: 'comparison',
    durationSeconds: 0,
    headline: '身份确认后，再选择模型',
    left: {
      title: 'Identity',
      items: ['Claude subscription', '决定用谁的额度', '先确认实际身份'],
      visualSteps: [beat('当前身份', 'Claude subscription', ['Auth'], 'success')],
    },
    right: {
      title: 'Model',
      items: ['Opus：复杂问题', 'Sonnet：日常主力', 'Haiku：简单快速'],
      visualSteps: [
        beat('复杂推理', 'Opus / best', ['opus'], 'accent'),
        beat('日常编程', 'Sonnet / default', ['sonnet'], 'success'),
        beat('快速任务', 'Haiku', ['haiku'], 'muted'),
      ],
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-11-model-priority',
    type: 'step-list',
    durationSeconds: 0,
    headline: '模型配置也有自己的优先级',
    steps: ['/model', 'claude --model', 'ANTHROPIC_MODEL', 'settings.json'],
    stepVisuals: [
      beat('/model', '会话内设置，优先级最高。', ['sonnet'], 'success'),
      beat('claude --model', '启动命令指定模型。', ['--model'], 'accent'),
      beat('ANTHROPIC_MODEL', '环境变量提供默认值。', ['环境变量'], 'accent'),
      beat('settings.json', '配置文件提供底层默认值。', ['default'], 'muted'),
    ],
    caption: [],
  },
  {
    id: 'scene-12-status-acceptance',
    type: 'summary',
    durationSeconds: 0,
    headline: '用 /status 验收：不要凭感觉判断',
    summary: '说清楚当前身份和模型，配置才算真正完成',
    bullets: ['Auth：订阅还是 API key', 'Model：当前运行哪个模型', 'Status：再次复查通过', '下一条：接入第三方 / 国产模型'],
    highlight: 'Status',
    roleCards: [
      beat('Auth：订阅还是 API key', '进入 claude 后用 /status 查看事实。', ['/status'], 'success'),
      beat('Model：当前运行哪个模型', '用 /model 查看或切换模型。', ['/model'], 'accent'),
      beat('Status：再次复查通过', '必要时 unset 后重新检查。', ['verified'], 'success'),
      beat('下一条：接入第三方 / 国产模型', '线索：ANTHROPIC_BASE_URL。', ['next'], 'muted'),
    ],
    caption: [],
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const getFrameAlignedSceneDurationSeconds = (sceneIndex: number) => {
  const timing = timelineManifest.scenes[sceneIndex];

  if (!timing) {
    throw new Error(`Missing timeline for scene index ${sceneIndex}`);
  }

  const startInFrames = Math.round(timing.offset * fps);
  const endInFrames = Math.round(timing.end * fps);

  return (endInFrames - startInFrames) / fps;
};

type VisualRevealAnchor = {
  segmentId: string;
  offsetSeconds?: number;
};

const revealAt = (segmentId: string, offsetSeconds = 0): VisualRevealAnchor => ({segmentId, offsetSeconds});

const getVisualRevealSeconds = (sceneIndex: number, anchor: VisualRevealAnchor) => {
  const scene = timelineManifest.scenes[sceneIndex];
  const segment = scene?.segments.find((item) => item.segmentId === anchor.segmentId);

  if (!scene || !segment) {
    throw new Error(`Missing visual timing for scene index ${sceneIndex}, segment ${anchor.segmentId}`);
  }

  const offsetSeconds = anchor.offsetSeconds ?? 0;

  if (offsetSeconds < 0 || offsetSeconds > segment.duration) {
    throw new Error(`Invalid visual offset ${offsetSeconds} for segment ${anchor.segmentId}`);
  }

  return segment.offset + offsetSeconds;
};

// Keep one narration anchor for every visual element rendered by the generic
// scene component. Offsets come from the returned Word Boundary timing when
// several visual events are spoken inside the same Segment.
const visualRevealAnchors: VisualRevealAnchor[][] = [
  [revealAt('01-01', 1.61), revealAt('01-01', 3.09), revealAt('01-03', 0.09)],
  [revealAt('02-02'), revealAt('02-03')],
  [revealAt('03-02', 1.1), revealAt('03-02', 3.66), revealAt('03-02', 4.58), revealAt('03-05', 0.09)],
  [revealAt('04-01', 2.4), revealAt('04-02', 0.43), revealAt('04-02', 4.73), revealAt('04-04', 0.09)],
  [revealAt('05-01'), revealAt('05-01')],
  [
    revealAt('06-02', 0.09),
    revealAt('06-03', 1.09),
    revealAt('06-03', 3.75),
    revealAt('06-03', 6.3),
    revealAt('06-03', 7.61),
    revealAt('06-04', 0.09),
  ],
  [revealAt('07-02'), revealAt('07-03')],
  [revealAt('08-02'), revealAt('08-03'), revealAt('08-03', 0.09), revealAt('08-05')],
  [revealAt('09-03'), revealAt('09-04'), revealAt('09-05')],
  [revealAt('10-01'), revealAt('10-02')],
  [revealAt('11-02'), revealAt('11-03', 0.72), revealAt('11-03', 1.51), revealAt('11-03', 4.32)],
  [revealAt('12-02'), revealAt('12-03'), revealAt('12-05'), revealAt('12-06')],
];

const visualRevealAdvanceSecondsBySceneId: Record<string, number> = {
  'scene-12-status-acceptance': 0.4,
};

if (visualRevealAnchors.length !== sceneDefinitions.length) {
  throw new Error(`Expected reveal mapping for ${sceneDefinitions.length} scenes, received ${visualRevealAnchors.length}`);
}

export const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/claude-code-api-config/${segment.audioFile}`,
    startSeconds: scene.offset + segment.offset,
    durationSeconds: segment.duration,
  })),
);

export const subtitleCues: SubtitleCue[] = subtitleManifest.scenes.flatMap((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);

  if (!sceneTiming) {
    throw new Error(`Missing timeline for scene ${scene.sceneId}`);
  }

  return scene.segments.flatMap((segment) => {
    const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);

    if (!segmentTiming) {
      throw new Error(`Missing timeline for segment ${segment.segmentId}`);
    }

    return segment.cues.map((cue, cueIndex) => ({
      startSeconds: sceneTiming.offset + segmentTiming.offset + (cueIndex === 0 ? 0 : cue.start),
      endSeconds: sceneTiming.offset + segmentTiming.offset + cue.end,
      text: cue.text,
    }));
  });
});

export const videoConfig: VideoConfig = {
  slug: 'claude-code-api-config',
  title: 'Claude Code API 配置',
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
    visualRevealSeconds: visualRevealAnchors[index].map((anchor) => {
      const advanceSeconds = visualRevealAdvanceSecondsBySceneId[scene.id] ?? 0;

      return Math.max(0, getVisualRevealSeconds(index, anchor) - advanceSeconds);
    }),
  })),
};
