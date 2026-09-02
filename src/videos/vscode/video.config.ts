import type {SceneConfig, VideoConfig} from '../../lib/videoTypes';
import audioManifest from './generated/audio-manifest.json';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import {createNarratedTiming} from '../../lib/timing';

const fps = 30;

const narratedTiming = createNarratedTiming({
  fps,
  audioSrcPrefix: 'local-assets/vscode',
  audioManifest,
  subtitleManifest,
  timelineManifest,
});

type VisualRevealAnchor = {segmentId: string; offsetSeconds: number};
const revealAt = (segmentId: string, offsetSeconds: number): VisualRevealAnchor => ({segmentId, offsetSeconds});
const visualRevealAnchors: VisualRevealAnchor[][] = [
  [revealAt('01-01', 0), revealAt('01-01', 6.63), revealAt('01-01', 13.56), revealAt('01-01', 18.48)],
  [revealAt('02-01', 0), revealAt('02-01', 8.68), revealAt('02-01', 17.95), revealAt('02-01', 21.31)],
  [revealAt('03-01', 0), revealAt('03-01', 4.05), revealAt('03-01', 12.34), revealAt('03-01', 21.31), revealAt('03-01', 29.42)],
  [revealAt('04-01', 0), revealAt('04-01', 5.88), revealAt('04-01', 12.75), revealAt('04-01', 20.21)],
  [revealAt('05-01', 0), revealAt('05-01', 6.12), revealAt('05-01', 13.84), revealAt('05-01', 23.18)],
  [revealAt('06-01', 0), revealAt('06-01', 7.14), revealAt('06-01', 19.55)],
  [revealAt('07-01', 0), revealAt('07-01', 4.28), revealAt('07-01', 9.34), revealAt('07-01', 15.37), revealAt('07-01', 22.15)],
  [revealAt('08-01', 0), revealAt('08-01', 8.26), revealAt('08-01', 16.52), revealAt('08-01', 24.12)],
  [revealAt('09-01', 0), revealAt('09-01', 8.64), revealAt('09-01', 17.28)],
];

const visualRevealSeconds = visualRevealAnchors.map((anchors, sceneIndex) => {
  const scene = narratedTiming.scenes[sceneIndex];
  if (!scene) throw new Error(`Missing narrated timing for scene index ${sceneIndex}`);
  return anchors.map((anchor) => {
    const segment = scene.segments.find((item) => item.segmentId === anchor.segmentId);
    if (!segment) throw new Error(`Missing narrated timing for segment ${anchor.segmentId}`);
    if (anchor.offsetSeconds < 0 || anchor.offsetSeconds > segment.durationSeconds) {
      throw new Error(`Invalid visual offset ${anchor.offsetSeconds} for segment ${anchor.segmentId}`);
    }
    return segment.startSeconds - scene.startSeconds + anchor.offsetSeconds;
  });
});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-spark-entry',
    type: 'opening',
    durationSeconds: 0,
    headline: 'Spark 图标去哪了？',
    subtitle: '先打开具体文件，入口才会出现',
    cards: ['空文件夹', '打开 demo.py', 'Spark 出现'],
    highlight: 'Spark 出现',
    caption: [],
  },
  {
    id: 'scene-02-extension-and-cli',
    type: 'comparison',
    durationSeconds: 0,
    headline: '扩展和 CLI：同一个后厨，两个窗口',
    left: {
      title: 'CLI',
      items: ['命令和 skills：全部', 'MCP 配置：完整', '! bash · Tab 补全'],
    },
    right: {
      title: 'VS Code 扩展',
      items: ['并排 diff：原生', '选中代码上下文', '命令和 skills：子集'],
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-03-install-and-find',
    type: 'concept',
    durationSeconds: 0,
    headline: '安装官方扩展，找不到入口就这样查',
    keyPoints: ['打开具体文件', '确认版本', 'Reload Window', '禁用冲突扩展', '信任工作区'],
    caption: [],
  },
  {
    id: 'scene-04-diff-review',
    type: 'comparison',
    durationSeconds: 0,
    headline: '并排 diff：看清了再点头',
    left: {
      title: '原稿 · demo.py',
      items: ['return "Hello " + name', '文件未修改'],
    },
    right: {
      title: '建议改动 · Claude Code',
      items: ['f-string', '类型注解', '接受／拒绝'],
    },
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-05-context',
    type: 'concept',
    durationSeconds: 0,
    headline: '@ 提及和选中代码：把上下文喂准',
    keyPoints: ['@auth', '@src/components/', '选中代码', 'Option+K／Alt+K'],
    caption: [],
  },
  {
    id: 'scene-06-plan-mode',
    type: 'concept',
    durationSeconds: 0,
    headline: 'Plan Mode：先交方案，再动手',
    keyPoints: ['正常模式：每步询问', 'Plan Mode：先看方案', '自动接受：直接执行'],
    caption: [],
  },
  {
    id: 'scene-07-minimal-practice',
    type: 'step-list',
    durationSeconds: 0,
    headline: '10 分钟跑通最小练习',
    steps: ['工作区', '面板', '选中', 'diff', '计划'],
    caption: [],
  },
  {
    id: 'scene-08-shortcuts',
    type: 'comparison',
    durationSeconds: 0,
    headline: '记住快捷键，按任务切回 CLI',
    left: {
      title: 'VS Code 扩展',
      items: ['文件与 diff', '上下文与计划'],
    },
    right: {
      title: '集成终端 CLI',
      items: ['命令、skills、MCP', 'claude · /ide'],
    },
    highlight: 'left',
    caption: [],
  },
  {
    id: 'scene-09-summary',
    type: 'summary',
    durationSeconds: 0,
    headline: '同一套能力，按任务切换',
    summary: '扩展提供贴近文件的上下文，CLI 保留完整终端能力',
    bullets: ['文件 · 上下文 · diff', '命令 · skills · MCP', '按任务切换'],
    highlight: '按任务切换',
    teaser: {
      title: '09 · JetBrains 集成',
      label: '下一篇',
      description: 'IntelliJ IDEA · PyCharm · Claude Code',
      tone: 'accent',
    },
    caption: [],
  },
];

export const audioTracks = narratedTiming.audioTracks;
export const subtitleCues = narratedTiming.subtitleCues;

export const videoConfig: VideoConfig = {
  slug: 'vscode',
  title: 'VS Code 集成 Claude Code',
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
    visualRevealSeconds: visualRevealSeconds[index],
  })),
};
