import type {SubtitleCue} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

export type Video14VisualType =
  | 'ui-simulation'
  | 'workflow-simulation'
  | 'terminal-simulation'
  | 'concept-diagram'
  | 'code-exploration'
  | 'task-execution'
  | 'connection-diagram'
  | 'decision-diagram'
  | 'task-routing'
  | 'closing-visualization';

export type Video14SceneConfig = {
  id: string;
  title: string;
  durationInFrames: number;
  visualType: Video14VisualType;
};

export type Video14Config = {
  slug: string;
  title: string;
  width: number;
  height: number;
  fps: number;
  scenes: Video14SceneConfig[];
};

export type Video14AudioTrack = {
  id: string;
  src: string;
  startInFrames: number;
  durationInFrames: number;
};

const fps = 30;
const finalHoldSeconds = 3;

const sceneDefinitions: Omit<Video14SceneConfig, 'durationInFrames'>[] = [
  {id: 'scene-01-bug-appears', title: '一个 Bug，把问题带出来', visualType: 'ui-simulation'},
  {id: 'scene-02-chatgpt-workflow', title: '传统 AI 工作流为什么麻烦', visualType: 'workflow-simulation'},
  {id: 'scene-03-claude-code-workflow', title: '同一个 Bug，Claude Code 怎么处理', visualType: 'terminal-simulation'},
  {id: 'scene-04-advice-to-action', title: '真正的区别不是“更聪明”', visualType: 'concept-diagram'},
  {id: 'scene-05-definition', title: 'Claude Code 到底是什么', visualType: 'concept-diagram'},
  {id: 'scene-06-copilot-to-agent', title: '从 Copilot 到 Agent', visualType: 'concept-diagram'},
  {id: 'scene-07-understand-project', title: '第一层能力：看懂项目', visualType: 'code-exploration'},
  {id: 'scene-08-execute-task', title: '第二层能力：真正动手', visualType: 'task-execution'},
  {id: 'scene-09-connect-tools', title: '第三层能力：从代码库向外延伸', visualType: 'connection-diagram'},
  {id: 'scene-10-can-ai-do-everything', title: '是不是以后项目都可以交给 AI？', visualType: 'decision-diagram'},
  {id: 'scene-11-human-judgment', title: 'AI 能执行，但不能替你判断', visualType: 'decision-diagram'},
  {id: 'scene-12-human-ai-split', title: '真正的人机分工', visualType: 'task-routing'},
  {id: 'scene-13-tool-choice', title: 'ChatGPT、Cursor、Claude Code 怎么选', visualType: 'task-routing'},
  {id: 'scene-14-closing', title: '最后真正发生了什么变化', visualType: 'closing-visualization'},
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

export const video14Config: Video14Config = {
  slug: 'claude-code-what-is-v2',
  title: 'Claude Code 到底是什么？',
  width: 1920,
  height: 1080,
  fps,
  scenes: sceneDefinitions.map((scene, index) => {
    const timing = timelineManifest.scenes[index];
    const startInFrames = Math.round(timing.offset * fps);
    const holdInFrames = index === sceneDefinitions.length - 1 ? finalHoldSeconds * fps : 0;
    const endInFrames = Math.round(timing.end * fps) + holdInFrames;

    return {...scene, durationInFrames: endInFrames - startInFrames};
  }),
};

export const video14AudioTracks: Video14AudioTrack[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/claude-code-what-is-v2/${segment.audioFile}`,
    startInFrames: Math.round((scene.offset + segment.offset) * fps),
    durationInFrames: Math.max(1, Math.ceil(segment.duration * fps)),
  })),
);

export const video14SubtitleCues: SubtitleCue[] = subtitleManifest.scenes.flatMap((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);

  if (!sceneTiming) {
    throw new Error(`Missing timeline for scene ${scene.sceneId}`);
  }

  return scene.segments.flatMap((segment) => {
    const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);

    if (!segmentTiming) {
      throw new Error(`Missing timeline for segment ${segment.segmentId}`);
    }

    return segment.cues.map((cue) => ({
      startSeconds: sceneTiming.offset + segmentTiming.offset + cue.start,
      endSeconds: sceneTiming.offset + segmentTiming.offset + cue.end,
      text: cue.text,
    }));
  });
});

export const getVideo14TotalDurationFrames = () => {
  return video14Config.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
};
