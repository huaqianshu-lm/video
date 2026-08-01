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

export const video14Config: Video14Config = {
  slug: 'claude-code-what-is-v2',
  title: 'Claude Code 到底是什么？',
  width: 1920,
  height: 1080,
  fps: 30,
  scenes: [
    {
      id: 'scene-01-bug-appears',
      title: '一个 Bug，把问题带出来',
      durationInFrames: 210,
      visualType: 'ui-simulation',
    },
    {
      id: 'scene-02-chatgpt-workflow',
      title: '传统 AI 工作流为什么麻烦',
      durationInFrames: 240,
      visualType: 'workflow-simulation',
    },
    {
      id: 'scene-03-claude-code-workflow',
      title: '同一个 Bug，Claude Code 怎么处理',
      durationInFrames: 240,
      visualType: 'terminal-simulation',
    },
    {
      id: 'scene-04-advice-to-action',
      title: '真正的区别不是“更聪明”',
      durationInFrames: 210,
      visualType: 'concept-diagram',
    },
    {
      id: 'scene-05-definition',
      title: 'Claude Code 到底是什么',
      durationInFrames: 210,
      visualType: 'concept-diagram',
    },
    {
      id: 'scene-06-copilot-to-agent',
      title: '从 Copilot 到 Agent',
      durationInFrames: 210,
      visualType: 'concept-diagram',
    },
    {
      id: 'scene-07-understand-project',
      title: '第一层能力：看懂项目',
      durationInFrames: 240,
      visualType: 'code-exploration',
    },
    {
      id: 'scene-08-execute-task',
      title: '第二层能力：真正动手',
      durationInFrames: 240,
      visualType: 'task-execution',
    },
    {
      id: 'scene-09-connect-tools',
      title: '第三层能力：从代码库向外延伸',
      durationInFrames: 210,
      visualType: 'connection-diagram',
    },
    {
      id: 'scene-10-can-ai-do-everything',
      title: '是不是以后项目都可以交给 AI？',
      durationInFrames: 180,
      visualType: 'decision-diagram',
    },
    {
      id: 'scene-11-human-judgment',
      title: 'AI 能执行，但不能替你判断',
      durationInFrames: 210,
      visualType: 'decision-diagram',
    },
    {
      id: 'scene-12-human-ai-split',
      title: '真正的人机分工',
      durationInFrames: 210,
      visualType: 'task-routing',
    },
    {
      id: 'scene-13-tool-choice',
      title: 'ChatGPT、Cursor、Claude Code 怎么选',
      durationInFrames: 240,
      visualType: 'task-routing',
    },
    {
      id: 'scene-14-closing',
      title: '最后真正发生了什么变化',
      durationInFrames: 210,
      visualType: 'closing-visualization',
    },
  ],
};

export const getVideo14TotalDurationFrames = () => {
  return video14Config.scenes.reduce((total, scene) => total + scene.durationInFrames, 0);
};
