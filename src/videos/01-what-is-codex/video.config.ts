import type {SceneConfig, VideoConfig, VisualBeat} from '../../lib/videoTypes';
import audioManifest from './generated/audio-manifest.json';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import seriesConfig from '../../../series/codex-guide/series.json';
import {createNarratedTiming} from '../../lib/timing';

const fps = 30;

const narratedTiming = createNarratedTiming({
  fps,
  audioSrcPrefix: 'local-assets/01-what-is-codex',
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
    id: 'scene-01-one-codex-four-entries',
    type: 'opening',
    durationSeconds: 0,
    headline: '到底哪个才是 Codex？',
    subtitle: '一个 Codex · 四种入口',
    cards: ['桌面 App', 'CLI', 'IDE 扩展', '云端 Web'],
    highlight: '桌面 App',
    cardDetails: [
      beat('桌面 App', '用图形界面查看任务与 diff。', ['LOCAL'], 'accent'),
      beat('CLI', '在终端、SSH 和脚本环境中工作。', ['LOCAL'], 'success'),
      beat('IDE 扩展', '把代理任务放在代码旁边。', ['LOCAL'], 'accent'),
      beat('云端 Web', '在远程隔离环境执行任务。', ['CLOUD'], 'accent'),
    ],
    caption: [],
  },
  {
    id: 'scene-02-answer-versus-execute',
    type: 'comparison',
    durationSeconds: 0,
    headline: '回答代码，和执行任务',
    left: {
      title: '回答：给你建议',
      items: ['解释报错', '生成代码片段', '等待复制与排错'],
      visualSteps: [
        beat('接收问题', '项目跑不起来了。', ['CHAT'], 'muted'),
        beat('给出建议', '解释原因并生成代码。', ['ANSWER'], 'accent'),
        beat('等待复制', '后续动作仍由人手工完成。', ['WAITING'], 'warning'),
      ],
      workflowStatus: '停在建议',
    },
    right: {
      title: '代理：进入项目执行',
      items: ['Read', 'Edit', 'Test', 'Diff'],
      visualSteps: [
        beat('Read', '读取项目文件与上下文。', ['PROJECT'], 'accent'),
        beat('Edit', '修改目标文件。', ['MODIFIED'], 'accent'),
        beat('Test', '运行命令和测试。', ['PASSED'], 'success'),
        beat('Diff', '交付改动等待验收。', ['REVIEW'], 'success'),
      ],
      workflowStatus: '参与执行',
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-03-goal-to-result',
    type: 'step-list',
    durationSeconds: 0,
    headline: '一个目标如何变成结果',
    steps: ['读取项目', '定位问题', '修改文件', '运行测试', '交付 diff'],
    stepVisuals: [
      beat('读取项目', '扫描项目结构与依赖。', ['READING'], 'accent'),
      beat('定位问题', '结合报错锁定原因。', ['LOCATED'], 'warning'),
      beat('修改文件', '围绕目标更新对应文件。', ['MODIFIED'], 'accent'),
      beat('运行测试', '重新执行命令和验证。', ['TESTS PASSED'], 'success'),
      beat('交付 diff', '改动进入人工验收。', ['REVIEW'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-04-local-and-cloud-routing',
    type: 'comparison',
    durationSeconds: 0,
    headline: '三扇门在本机，一扇门去云端',
    columns: [
      {
        title: 'App',
        items: ['Local Project', 'Files', 'Shell'],
        visualSteps: [beat('本机路由', '读取本机项目并运行本机命令。', ['LOCAL'], 'success')],
        workflowStatus: '本机',
      },
      {
        title: 'CLI',
        items: ['Local Project', 'Files', 'Shell'],
        visualSteps: [beat('本机路由', '从终端进入本机项目。', ['LOCAL'], 'success')],
        workflowStatus: '本机',
      },
      {
        title: 'IDE',
        items: ['Local Project', 'Files', 'Shell'],
        visualSteps: [beat('本机路由', '从编辑器连接本机项目。', ['LOCAL'], 'success')],
        workflowStatus: '本机',
      },
      {
        title: 'Web',
        items: ['Remote Repo', 'Isolated Environment', 'Diff'],
        visualSteps: [beat('云端路由', '任务进入远程隔离环境。', ['CLOUD'], 'accent')],
        workflowStatus: '云端',
      },
    ],
    highlightIndex: 3,
    caption: [],
  },
  {
    id: 'scene-05-choose-by-workflow',
    type: 'comparison',
    durationSeconds: 0,
    headline: '这个任务适合在哪里执行？',
    columns: [
      {
        title: '桌面 App',
        items: ['可视化 diff', '并排观察多任务'],
        visualSteps: [beat('图形界面', '适合观察 diff 和多个任务。', ['APP'], 'accent')],
      },
      {
        title: 'CLI',
        items: ['终端', 'SSH', '脚本环境'],
        visualSteps: [beat('终端工作流', '适合命令行与远程环境。', ['CLI'], 'success')],
      },
      {
        title: 'IDE 扩展',
        items: ['编辑器内开发', '任务紧邻代码'],
        visualSteps: [beat('编辑器工作流', '让任务留在代码旁边。', ['IDE'], 'accent')],
      },
      {
        title: '云端 Web',
        items: ['后台长任务', '多个任务并行推进'],
        visualSteps: [beat('远程工作流', '不占用本机持续执行。', ['WEB'], 'accent')],
      },
    ],
    highlightIndex: 0,
    caption: [],
  },
  {
    id: 'scene-06-five-delegated-jobs',
    type: 'step-list',
    durationSeconds: 0,
    headline: '可以委托的五类工作',
    steps: ['写代码', '理解项目', '代码审查', '调试修复', '自动化杂活'],
    stepVisuals: [
      beat('写代码', '按项目现有结构完成实现。', ['Created'], 'accent'),
      beat('理解项目', '快速建立代码库上下文。', ['Indexed'], 'accent'),
      beat('代码审查', '寻找错误和遗漏边界。', ['Reviewed'], 'success'),
      beat('调试修复', '沿日志定位根因并验证。', ['Fixed'], 'success'),
      beat('自动化杂活', '处理重构、测试、迁移与环境调整。', ['Migrated'], 'accent'),
    ],
    caption: [],
  },
  {
    id: 'scene-07-human-review-gate',
    type: 'comparison',
    durationSeconds: 0,
    headline: '执行可以交给 AI，判断不能',
    left: {
      title: 'Human',
      items: ['目标', '边界', '审查', '验收'],
      visualSteps: [
        beat('看 diff', '确认改动内容和影响范围。', ['REVIEW'], 'warning'),
        beat('跑验证', '执行必要测试并核对结果。', ['VERIFY'], 'accent'),
        beat('拍板', '最终决定是否接受。', ['ACCEPTED'], 'success'),
      ],
      workflowStatus: 'Review Gate',
    },
    right: {
      title: 'AI',
      items: ['分析', '执行', '重复劳动', '候选结果'],
      visualSteps: [
        beat('分析', '理解目标与项目上下文。', ['ANALYZE'], 'accent'),
        beat('执行', '修改文件并运行命令。', ['EXECUTE'], 'accent'),
        beat('交付', '提交 diff 等待验收。', ['REVIEW REQUIRED'], 'warning'),
      ],
      workflowStatus: '完成执行 ≠ 自动正确',
    },
    highlight: 'left',
    caption: [],
  },
  {
    id: 'scene-08-chat-and-coding-agents',
    type: 'comparison',
    durationSeconds: 0,
    headline: '问答工具与编程代理',
    columns: [
      {
        title: 'ChatGPT',
        items: ['问答与建议', '解释与方案'],
        visualSteps: [beat('常见交互', '提问后获得解释、建议和方案。', ['ANSWER'], 'muted')],
      },
      {
        title: 'Codex',
        items: ['OpenAI', 'AGENTS.md', '执行项目任务'],
        visualSteps: [beat('编程代理', '进入项目、修改文件、运行命令。', ['AGENT'], 'accent')],
      },
      {
        title: 'Claude Code',
        items: ['Anthropic', 'CLAUDE.md', '执行项目任务'],
        visualSteps: [beat('编程代理', '同类代理，不同产品体系。', ['AGENT'], 'accent')],
      },
    ],
    highlightIndex: 1,
    caption: [],
  },
  {
    id: 'scene-09-check-cli-status',
    type: 'terminal',
    durationSeconds: 0,
    headline: '电脑认不认识 Codex',
    command: 'codex --version',
    output: ['版本号 → 已安装', 'command not found → 尚未安装', '两种结果都不是失败', '状态已确认'],
    reviewFlow: [
      beat('输入命令', '运行不产生项目副作用的检查。', ['$ codex --version'], 'accent'),
      beat('读取结果', '版本号或 command not found。', ['RESULT'], 'accent'),
      beat('确认状态', '安装和登录留到后续步骤。', ['CONFIRMED'], 'success'),
    ],
    caption: [],
  },
  {
    id: 'scene-10-map-summary',
    type: 'summary',
    durationSeconds: 0,
    headline: '一张地图，三个判断',
    summary: '认识入口，也守住人的判断',
    bullets: ['一个 Codex · 四种入口', '按场景选择', 'AI 执行 · 人来验收'],
    highlight: '人来验收',
    roleCards: [
      beat('一个 Codex · 四种入口', 'App、CLI、IDE 扩展与云端 Web。', ['IDENTITY'], 'accent'),
      beat('按场景选择', '根据工作位置和任务节奏选择。', ['ROUTING'], 'accent'),
      beat('AI 执行 · 人来验收', '目标、边界和最终判断留在人手里。', ['REVIEW'], 'success'),
    ],
    teaser: beat(
      '下一集：02 核心概念速览',
      '代理循环 · 上下文 · AGENTS.md',
      ['审批', '沙箱', 'Skills', 'MCP'],
      'accent',
    ),
    teaserStartSeconds: 20.904,
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

const visualRevealAnchors: VisualRevealAnchor[][] = [
  [revealAt('01-01', 1.5), revealAt('01-01', 2.8), revealAt('01-01', 4), revealAt('01-01', 5.1)],
  [revealAt('02-02'), revealAt('02-04')],
  [revealAt('03-02'), revealAt('03-02', 2), revealAt('03-03'), revealAt('03-03', 3), revealAt('03-04')],
  [revealAt('04-02'), revealAt('04-02', 2.2), revealAt('04-02', 4.4), revealAt('04-03')],
  [revealAt('05-02'), revealAt('05-03'), revealAt('05-04'), revealAt('05-05')],
  [revealAt('06-02'), revealAt('06-03'), revealAt('06-04'), revealAt('06-05'), revealAt('06-06')],
  [revealAt('07-02'), revealAt('07-04')],
  [revealAt('08-02'), revealAt('08-03'), revealAt('08-04')],
  [revealAt('09-03'), revealAt('09-04'), revealAt('09-05'), revealAt('09-06')],
  [revealAt('10-02'), revealAt('10-03'), revealAt('10-04')],
];

if (visualRevealAnchors.length !== sceneDefinitions.length) {
  throw new Error(`Expected reveal mapping for ${sceneDefinitions.length} scenes, received ${visualRevealAnchors.length}`);
}

export const audioTracks = narratedTiming.audioTracks;
export const subtitleCues = narratedTiming.subtitleCues;

export const videoConfig: VideoConfig = {
  slug: '01-what-is-codex',
  title: '认识 Codex 与四种入口',
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
    durationSeconds: narratedTiming.scenes[index].durationSeconds,
    showCaption: false,
    visualRevealSeconds: visualRevealAnchors[index].map((anchor) => getVisualRevealSeconds(index, anchor)),
  })),
};
