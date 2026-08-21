import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const fps = 30;

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-terminal-then-what',
    type: 'opening',
    durationSeconds: 0,
    headline: '终端打开了，然后呢？',
    subtitle: '从空光标到第一次成功',
    cards: ['然后呢？', '怕改坏', '跑通第一个任务'],
    highlight: '跑通第一个任务',
    cardDetails: [
      {title: '然后呢？', label: '第一次', description: '终端打开后，不知道下一步敲什么。', items: ['光标闪烁'], tone: 'warning'},
      {title: '怕改坏', label: '担心', description: '一句话说错，代码会不会被改坏。', items: ['先控制范围'], tone: 'warning'},
      {title: '跑通第一个任务', label: '今天', description: '用一个小项目拿到第一次成功体验。', items: ['不超过五分钟'], tone: 'success'},
    ],
    caption: [],
  },
  {
    id: 'scene-02-rebuildable-project',
    type: 'terminal',
    durationSeconds: 0,
    headline: '先建一个可以重来的玩具项目',
    command: 'mkdir hello-claude && cd hello-claude',
    output: ['练车场：hello-claude', 'main.py', 'def add(a, b):', '改砸了也能重建'],
    reviewFlow: [
      {title: '创建目录', label: '01', description: '正式项目先放在一边。', tone: 'accent'},
      {title: '进入项目', label: '02', description: '只在 hello-claude 里练习。', tone: 'accent'},
      {title: '准备 main.py', label: '03', description: '文件只保留一个 add 函数。', tone: 'success'},
      {title: '随时重建', label: '04', description: '改砸了也能从头来。', tone: 'success'},
    ],
    caption: [],
  },
  {
    id: 'scene-03-project-boundary',
    type: 'terminal',
    durationSeconds: 0,
    headline: '一定要在项目目录里启动',
    command: 'cd ~/hello-claude && claude',
    output: ['当前目录 = 工作区', '~/hello-claude $ claude', 'main.py'],
    reviewFlow: [
      {title: '切到项目目录', label: '01', description: '不要在桌面或主目录裸启。', tone: 'accent'},
      {title: '启动 Claude', label: '02', description: '启动位置决定它先看到哪里。', tone: 'accent'},
      {title: '锁定工作区', label: '03', description: 'Claude 从这里读取 main.py。', tone: 'success'},
    ],
    caption: [],
  },
  {
    id: 'scene-04-welcome-screen',
    type: 'concept',
    durationSeconds: 0,
    headline: '欢迎屏幕先认住三样东西',
    keyPoints: ['输入框', '/help', '/resume'],
    workspaceDemo: {
      windowTitle: 'Claude Code — Welcome',
      filePanelTitle: 'WELCOME',
      files: ['输入框', '/help', '/resume'],
      codeLines: ['> Claude Code', '用大白话提需求', '/help：查看命令', '/resume：继续会话'],
      statusLabels: ['输入框', '/help', '/resume'],
      command: '用大白话提需求',
      readyStatus: '第一次先不管 /resume',
      actions: [
        {title: '输入框', description: '这里就是主战场。', tone: 'accent'},
        {title: '/help', description: '需要时查看命令。', tone: 'accent'},
        {title: '/resume', description: '继续会话，第一次先不管。', tone: 'muted'},
      ],
    },
    caption: [],
  },
  {
    id: 'scene-05-read-before-change',
    type: 'concept',
    durationSeconds: 0,
    headline: '先让 Claude 读懂，再让它动手',
    keyPoints: ['解释型：只读', '修改型：需批准', '生成型：需批准'],
    workspaceDemo: {
      windowTitle: 'hello-claude — main.py',
      filePanelTitle: 'PROJECT FILES',
      files: ['main.py', 'add(a, b)', '解释结果'],
      codeLines: ['def add(a, b):', '    return a + b', 'add(a, b) → 返回 a + b', '状态：Unchanged'],
      statusLabels: ['Reading', 'Unchanged', '只读验证'],
      command: '解释 main.py 这个文件在做什么',
      readyStatus: 'add(a, b) → 返回 a + b',
      actions: [
        {title: '读取 main.py', description: '让 Claude 先看到真实文件。', tone: 'accent'},
        {title: '返回解释', description: '确认 add 接收两个参数。', tone: 'accent'},
        {title: '保持不变', description: '解释型任务不会修改文件。', tone: 'success'},
        {title: '只读验证', description: '先拿到一个零风险成功信号。', tone: 'success'},
      ],
    },
    caption: [],
  },
  {
    id: 'scene-06-diff-approval',
    type: 'comparison',
    durationSeconds: 0,
    headline: '看懂 diff，再批准改动',
    columns: [
      {
        title: 'Before',
        items: ['def add(a, b):', 'return a + b', '文件未修改'],
        visualSteps: [
          {title: '旧代码', label: '-', tone: 'muted'},
          {title: '当前文件', label: 'Before', tone: 'muted'},
          {title: '等待请求', label: '未修改', tone: 'muted'},
        ],
        workflowTitle: 'main.py · 当前版本',
        workflowStatus: 'Before',
      },
      {
        title: 'Proposed Change',
        items: ['+ 类型注解', '+ 基本错误处理', '等待批准', 'Updated'],
        visualSteps: [
          {title: '+ 类型注解', label: '+', tone: 'success'},
          {title: '+ 错误处理', label: '+', tone: 'success'},
          {title: '人看 diff', label: 'Review', tone: 'warning'},
          {title: '同意一次', label: 'Yes', tone: 'success'},
        ],
        workflowTitle: 'main.py · Proposed Change',
        workflowStatus: '等待批准',
      },
    ],
    highlightIndex: 1,
    caption: [],
  },
  {
    id: 'scene-07-recovery-paths',
    type: 'comparison',
    durationSeconds: 0,
    headline: '改错了，还有两条后悔药',
    columns: [
      {
        title: '改回去',
        items: ['直接告诉 Claude', '回到你想要的状态', '自然语言回退'],
        visualSteps: [
          {title: '当前修改', label: 'Now', tone: 'warning'},
          {title: '改回去', label: 'Undo', tone: 'accent'},
          {title: '恢复状态', label: 'Back', tone: 'success'},
        ],
        workflowTitle: '自然语言回退',
        workflowStatus: '可以反悔',
      },
      {
        title: '/rewind',
        items: ['输入框为空时双击 Esc', 'Checkpoint = 本地撤销', 'Git = 永久历史'],
        visualSteps: [
          {title: '/rewind', label: 'Menu', tone: 'accent'},
          {title: 'Checkpoint', label: 'Local', tone: 'accent'},
          {title: 'Git', label: 'History', tone: 'success'},
        ],
        workflowTitle: '回溯边界',
        workflowStatus: '本地撤销 ≠ Git 历史',
      },
    ],
    highlightIndex: 1,
    caption: [],
  },
  {
    id: 'scene-08-five-step-loop',
    type: 'step-list',
    durationSeconds: 0,
    headline: '五步跑通第一个任务',
    steps: ['建项目', '启动', '解释', '批准', '确认结果'],
    stepVisuals: [
      {title: '建项目', label: 'mkdir + cd', description: '创建 hello-claude 练车场。', tone: 'accent'},
      {title: '启动', label: 'claude', description: '在项目目录里启动。', tone: 'accent'},
      {title: '解释', label: '解释 main.py', description: '先确认 Claude 读懂了文件。', tone: 'accent'},
      {title: '批准', label: '看 diff / 同意', description: '只批准你看过的这一处。', tone: 'warning'},
      {title: '确认结果', label: 'cat main.py', description: '检查类型注解和错误处理已写入。', tone: 'success'},
    ],
    caption: [],
  },
  {
    id: 'scene-09-minimal-core',
    type: 'summary',
    durationSeconds: 0,
    headline: '第一次使用的最小内核',
    summary: '提需求 → 看 diff → 批准 / 反悔',
    bullets: ['人：确认与判断', 'Claude：读取、分析、执行', '可恢复：改回去或 /rewind'],
    highlight: '批准 / 反悔',
    roleCards: [
      {title: '人：确认与判断', label: 'Human', description: '决定这一次改动是否值得落盘。', tone: 'accent'},
      {title: 'Claude：读取、分析、执行', label: 'Claude', description: '从项目目录读取文件并提出候选改动。', tone: 'success'},
      {title: '可恢复：改回去或 /rewind', label: 'Recovery', description: '批准不等于不可逆，保留反悔路径。', tone: 'warning'},
    ],
    teaser: {
      title: '08 · VS Code 集成',
      label: '下一篇',
      description: '让代码和 diff 并排出现。',
      tone: 'accent',
    },
    caption: [],
  },
];

const getSegmentStartSeconds = (sceneIndex: number, segmentId: string) => {
  const scene = timelineManifest.scenes[sceneIndex];
  const segment = scene?.segments.find((item) => item.segmentId === segmentId);

  if (!scene || !segment) {
    throw new Error(`Missing visual timing for scene index ${sceneIndex}, segment ${segmentId}`);
  }

  return segment.offset;
};

const getSceneDurationSeconds = (sceneIndex: number) => {
  const timing = timelineManifest.scenes[sceneIndex];

  if (!timing) {
    throw new Error(`Missing timeline for scene index ${sceneIndex}`);
  }

  const startInFrames = Math.round(timing.offset * fps);
  const endInFrames = Math.round(timing.end * fps);

  return (endInFrames - startInFrames) / fps;
};

export const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/claude-code-first-run/${segment.audioFile}`,
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

const visualRevealSegmentIds: string[][] = [
  ['01-01', '01-02', '01-03'],
  ['02-01', '02-02', '02-03', '02-04'],
  ['03-01', '03-02', '03-03'],
  ['04-01', '04-02', '04-03'],
  ['05-01', '05-02', '05-03', '05-04'],
  ['06-01', '06-03'],
  ['07-01', '07-02'],
  ['08-01', '08-02', '08-03', '08-04', '08-04'],
  ['09-02', '09-03', '09-04'],
];

const visualRevealSeconds = visualRevealSegmentIds.map((segmentIds, sceneIndex) =>
  segmentIds.map((segmentId, index) => {
    const extraDelay = sceneIndex === 7 && index === 4 ? 1.2 : 0;
    return getSegmentStartSeconds(sceneIndex, segmentId) + extraDelay;
  }),
);

if (visualRevealSeconds.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} reveal mappings, received ${visualRevealSeconds.length}`);
}

export const videoConfig: VideoConfig = {
  slug: 'claude-code-first-run',
  title: 'Claude Code 第一次使用',
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
    visualRevealSeconds: visualRevealSeconds[index],
  })),
};
