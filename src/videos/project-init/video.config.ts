import type {SceneConfig, VideoConfig} from '../../lib/videoTypes';
import audioManifest from './generated/audio-manifest.json';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import {createNarratedTiming} from '../../lib/timing';

const fps = 30;

const narratedTiming = createNarratedTiming({
  fps,
  audioSrcPrefix: 'local-assets/project-init',
  audioManifest,
  subtitleManifest,
  timelineManifest,
});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01', type: 'opening', durationSeconds: 0,
    headline: '同一个项目问题，反复从头问', subtitle: 'Workflow Simulation',
    cards: ['新会话 01', '新会话 02', '新会话 03'], highlight: '测试怎么跑？', caption: [],
  },
  {
    id: 'scene-02', type: 'concept', durationSeconds: 0,
    headline: '根因不是 Claude 笨', keyPoints: ['从零摸索', '项目说明书'], caption: [],
  },
  {
    id: 'scene-03', type: 'concept', durationSeconds: 0,
    headline: '/init：先把项目读一遍', keyPoints: ['/init', 'CLAUDE.md 草稿'], caption: [],
  },
  {
    id: 'scene-04', type: 'step-list', durationSeconds: 0,
    headline: '进入根目录，输入一个命令', steps: ['cd /path/to/your-project', 'claude', '/init'], caption: [],
  },
  {
    id: 'scene-05', type: 'concept', durationSeconds: 0,
    headline: '从依赖、文档和结构开始扫描',
    keyPoints: ['Dependencies', 'README', 'Config + Code Structure', 'CLAUDE.md · draft'], caption: [],
  },
  {
    id: 'scene-06', type: 'comparison', durationSeconds: 0,
    headline: '已有 CLAUDE.md：建议改进，不直接覆盖',
    columns: [
      {title: 'CLAUDE.md', items: ['unchanged']},
      {title: '建议改进', items: ['补充命令', '补充约定']},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-07', type: 'concept', durationSeconds: 0,
    headline: '一份项目说明书的五个区块',
    keyPoints: ['项目概述', '技术栈', '目录结构', '常用命令', '开发规范'], caption: [],
  },
  {
    id: 'scene-08', type: 'terminal', durationSeconds: 0,
    headline: '用两个文件验证 /init', command: '/init',
    output: ['CLAUDE.md', 'Node.js / JavaScript', 'echo test ok'], caption: [],
  },
  {
    id: 'scene-09', type: 'comparison', durationSeconds: 0,
    headline: '自动扫描是起点，不是终稿',
    columns: [
      {title: '客观事实', items: ['技术栈', '目录结构', '常用命令']},
      {title: '团队约定', items: ['分支命名', '部署流程', 'Review 与业务背景']},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-10', type: 'summary', durationSeconds: 0,
    headline: '先 /init，再审阅和迭代', summary: '扫描 → 草稿 → 审阅 → 迭代',
    bullets: ['根目录', 'claude', '/init', '扫描', 'CLAUDE.md 草稿', '审阅', '迭代'],
    highlight: '项目结构', caption: [], compactLayout: true,
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length || audioManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes in audio and timeline manifests`);
}

export const videoConfig: VideoConfig = {
  slug: 'project-init',
  title: '项目初始化：用 /init 生成 CLAUDE.md',
  format: 'horizontal',
  width: 1920,
  height: 1080,
  fps,
  audioTracks: narratedTiming.audioTracks,
  subtitleCues: narratedTiming.subtitleCues,
  scenes: sceneDefinitions.map((scene, index) => ({
    ...scene,
    durationSeconds: narratedTiming.scenes[index].durationSeconds,
    showCaption: false,
  })),
};
