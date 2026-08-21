import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const fps = 30;

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
    visualRevealSeconds: [0, 6.63, 13.56, 18.48],
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
    visualRevealSeconds: [0, 8.68, 17.95, 21.31],
  },
  {
    id: 'scene-03-install-and-find',
    type: 'concept',
    durationSeconds: 0,
    headline: '安装官方扩展，找不到入口就这样查',
    keyPoints: ['打开具体文件', '确认版本', 'Reload Window', '禁用冲突扩展', '信任工作区'],
    caption: [],
    visualRevealSeconds: [0, 4.05, 12.34, 21.31, 29.42],
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
    visualRevealSeconds: [0, 5.88, 12.75, 20.21],
  },
  {
    id: 'scene-05-context',
    type: 'concept',
    durationSeconds: 0,
    headline: '@ 提及和选中代码：把上下文喂准',
    keyPoints: ['@auth', '@src/components/', '选中代码', 'Option+K／Alt+K'],
    caption: [],
    visualRevealSeconds: [0, 6.12, 13.84, 23.18],
  },
  {
    id: 'scene-06-plan-mode',
    type: 'concept',
    durationSeconds: 0,
    headline: 'Plan Mode：先交方案，再动手',
    keyPoints: ['正常模式：每步询问', 'Plan Mode：先看方案', '自动接受：直接执行'],
    caption: [],
    visualRevealSeconds: [0, 7.14, 19.55],
  },
  {
    id: 'scene-07-minimal-practice',
    type: 'step-list',
    durationSeconds: 0,
    headline: '10 分钟跑通最小练习',
    steps: ['工作区', '面板', '选中', 'diff', '计划'],
    caption: [],
    visualRevealSeconds: [0, 4.28, 9.34, 15.37, 22.15],
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
    visualRevealSeconds: [0, 8.26, 16.52, 24.12],
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
    visualRevealSeconds: [0, 8.64, 17.28],
  },
];

const getSceneDurationSeconds = (sceneIndex: number) => {
  const timing = timelineManifest.scenes[sceneIndex];

  if (!timing) {
    throw new Error(`Missing timeline for scene index ${sceneIndex}`);
  }

  return (Math.round(timing.end * fps) - Math.round(timing.offset * fps)) / fps;
};

export const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/vscode/${segment.audioFile}`,
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
    durationSeconds: getSceneDurationSeconds(index),
    showCaption: false,
  })),
};
