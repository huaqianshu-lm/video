import type {SceneConfig, VideoConfig} from '../../lib/videoTypes';
import audioManifest from './generated/audio-manifest.json';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import {createNarratedTiming} from '../../lib/timing';

const fps = 30;

const narratedTiming = createNarratedTiming({
  fps,
  audioSrcPrefix: 'local-assets/claude-code-install',
  audioManifest,
  subtitleManifest,
  timelineManifest,
});

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-install-is-not-ready',
    type: 'opening',
    durationSeconds: 0,
    headline: '安装命令结束，真的能用了吗？',
    subtitle: '安装只是起点，真正可用要经过三道确认',
    cards: ['环境准备', '命令可用', '完成登录'],
    highlight: '完成登录',
    cardDetails: [
      {
        title: '环境准备',
        label: '未确认',
        description: '系统、终端与账号前提',
        items: ['macOS / Linux / Windows', '可用账号'],
        tone: 'warning',
      },
      {
        title: '命令可用',
        label: '未确认',
        description: '版本和诊断命令能返回结果',
        items: ['claude --version', 'claude doctor'],
        tone: 'warning',
      },
      {
        title: '完成登录',
        label: '未确认',
        description: '授权完成后才能进入项目任务',
        items: ['浏览器 OAuth', '远程环境可回传'],
        tone: 'warning',
      },
    ],
    caption: [
      '安装命令跑完，不等于 Claude Code 已经真正可用。',
      '你还需要确认环境、命令和账号状态。',
      '这条视频就沿着这条链路，把第一次任务跑通。',
    ],
  },
  {
    id: 'scene-02-preflight-check',
    type: 'step-list',
    durationSeconds: 0,
    headline: '安装之前，先确认三个前提',
    steps: ['环境与终端', '账号与访问资格', '安装入口与权限'],
    stepVisuals: [
      {
        title: '环境与终端',
        label: '01',
        description: '先知道自己在哪个平台、哪个终端里操作。',
        items: ['macOS / Linux', 'PowerShell / CMD / WSL'],
        tone: 'accent',
      },
      {
        title: '账号与访问资格',
        label: '02',
        description: '安装完成后仍然需要完成登录和授权。',
        items: ['账号可用', '网络可达'],
        tone: 'accent',
      },
      {
        title: '安装入口与权限',
        label: '03',
        description: '选定安装来源，后续升级和卸载才能对应。',
        items: ['官方原生优先', '避免混装'],
        tone: 'success',
      },
    ],
    caption: [
      '第一步不是复制命令，而是确认三个前提。',
      '你当前使用什么系统和终端？账号是否具备访问资格？',
      '最后，明确准备使用哪一种安装入口。',
      '这三个判断会直接决定后面的命令。',
    ],
  },
  {
    id: 'scene-03-terminal-routes',
    type: 'comparison',
    durationSeconds: 0,
    headline: '不是 Windows 一条命令：终端决定入口',
    columns: [
      {
        title: 'macOS / Linux',
        items: ['确认当前 Shell', '按官方 Unix 路径安装', '打开新终端验证'],
        visualSteps: [
          {title: '平台识别', label: '01', tone: 'accent'},
          {title: '官方入口', label: '02', tone: 'accent'},
          {title: '新终端', label: '03', tone: 'success'},
        ],
      },
      {
        title: 'Windows PowerShell / CMD',
        items: ['确认 Windows 终端', '使用对应安装说明', '不要照搬 Unix 命令'],
        visualSteps: [
          {title: 'PowerShell / CMD', label: '01', tone: 'accent'},
          {title: '平台命令', label: '02', tone: 'accent'},
          {title: '重新验证', label: '03', tone: 'success'},
        ],
      },
      {
        title: 'Windows WSL',
        items: ['确认是在 WSL 内', '按 Linux 方式判断', '注意浏览器授权回传'],
        visualSteps: [
          {title: '进入 WSL', label: '01', tone: 'accent'},
          {title: 'Linux 路径', label: '02', tone: 'accent'},
          {title: 'OAuth 回传', label: '03', tone: 'success'},
        ],
      },
    ],
    highlightIndex: 1,
    caption: [
      '平台相同，不代表入口相同。',
      '尤其在 Windows 上，PowerShell、CMD 和 WSL 是三种不同的工作环境。',
      '先识别终端，再选择命令，能少掉很多看似奇怪的报错。',
    ],
  },
  {
    id: 'scene-04-install-source',
    type: 'comparison',
    durationSeconds: 0,
    headline: '官方原生安装优先，npm 是备选',
    left: {
      title: '官方原生安装',
      items: ['优先选择', '按当前平台说明执行', '后续按同一来源维护'],
      visualSteps: [
        {title: '官方入口', label: '01', tone: 'accent'},
        {title: '安装完成', label: '02', tone: 'success'},
        {title: '来源清晰', label: '03', tone: 'success'},
      ],
    },
    right: {
      title: 'npm 备选路径',
      items: ['确有需要时再用', '不要用 sudo npm', '升级和卸载仍匹配 npm'],
      visualSteps: [
        {title: '确认需要', label: '01', tone: 'warning'},
        {title: 'npm 安装', label: '02', tone: 'warning'},
        {title: '来源可追溯', label: '03', tone: 'muted'},
      ],
    },
    highlight: 'left',
    caption: [
      '安装来源最好从一开始就保持清晰。',
      '默认优先官方原生安装，npm 只作为确有需要时的备选。',
      '不要为了绕过权限随手加 sudo npm，混装会让后续维护更难判断。',
    ],
  },
  {
    id: 'scene-05-verify-command',
    type: 'terminal',
    durationSeconds: 0,
    headline: '安装之后，用证据确认命令可用',
    command: 'claude --version',
    output: [
      '版本信息已返回',
      '当前终端已经找到 claude',
      '继续运行 claude doctor',
      '发现问题，再处理 PATH 或终端状态',
    ],
    reviewFlow: [
      {title: '检查版本', label: '01', description: '确认命令能被当前终端找到。', tone: 'accent'},
      {title: '运行诊断', label: '02', description: '让环境问题先暴露出来。', tone: 'accent'},
      {title: '重新打开终端', label: '03', description: '安装后 PATH 变化可能需要新会话。', tone: 'success'},
      {title: '记录结果', label: '04', description: '有证据再进入登录步骤。', tone: 'success'},
    ],
    caption: [
      '安装结束后，先不要急着进入项目。',
      '用 claude --version 确认命令已经被当前终端找到。',
      '再用 claude doctor 检查环境。',
      '如果刚安装完命令找不到，先打开一个新终端再判断。',
    ],
  },
  {
    id: 'scene-06-login',
    type: 'terminal',
    durationSeconds: 0,
    headline: '命令可用，还要完成登录',
    command: 'claude',
    output: [
      '交互式会话已启动',
      '浏览器打开授权页面',
      '授权完成，终端收到结果',
      '现在可以进入项目任务',
    ],
    reviewFlow: [
      {title: '进入项目目录', label: '01', description: '在目标项目里启动 Claude Code。', tone: 'accent'},
      {title: '浏览器 OAuth', label: '02', description: '完成账号授权。', tone: 'accent'},
      {title: '返回终端', label: '03', description: '让会话拿到授权结果。', tone: 'success'},
      {title: '会话可用', label: '04', description: '安装和登录是两个不同状态。', tone: 'success'},
    ],
    caption: [
      '命令能运行，只说明程序已经在本机启动。',
      '第一次进入项目时，还要完成浏览器授权。',
      '所以安装和登录是两个不同的状态，不能混为一谈。',
    ],
  },
  {
    id: 'scene-07-remote-oauth',
    type: 'comparison',
    durationSeconds: 0,
    headline: '远程环境没有浏览器，也能完成授权',
    left: {
      title: '远程终端',
      items: ['复制授权 URL', '保持当前会话等待', '把授权结果带回'],
      visualSteps: [
        {title: '复制 URL', label: '01', tone: 'accent'},
        {title: '等待会话', label: '02', tone: 'warning'},
        {title: '收到结果', label: '03', tone: 'success'},
      ],
    },
    right: {
      title: '本地浏览器',
      items: ['打开授权 URL', '完成登录授权', '回到终端继续'],
      visualSteps: [
        {title: '打开页面', label: '01', tone: 'accent'},
        {title: '完成授权', label: '02', tone: 'accent'},
        {title: '返回终端', label: '03', tone: 'success'},
      ],
    },
    highlight: 'right',
    caption: [
      '如果 Claude Code 跑在 SSH、远程主机或 WSL 里，环境里可能没有浏览器。',
      '这时复制终端给出的授权地址，用本地浏览器完成授权。',
      '再把授权结果带回原来的会话，必要时使用 claude auth login。',
    ],
  },
  {
    id: 'scene-08-first-task',
    type: 'terminal',
    durationSeconds: 0,
    headline: '先用一个空目录跑通第一次任务',
    command: 'mkdir claude-code-test && cd claude-code-test && claude',
    output: [
      '空目录已打开',
      '输入 /help 查看可用命令',
      '提出小任务：创建 test.py',
      '等待查看改动，而不是直接扩大范围',
    ],
    reviewFlow: [
      {title: '空目录', label: '01', description: '先把试验范围控制在安全边界内。', tone: 'accent'},
      {title: '/help', label: '02', description: '确认当前会话可用的操作。', tone: 'accent'},
      {title: '小任务', label: '03', description: '先提出一个可检查的文件任务。', tone: 'warning'},
      {title: '等待 review', label: '04', description: '不要一开始就交给它大范围修改。', tone: 'success'},
    ],
    caption: [
      '第一次使用，不建议直接在重要项目里放开操作。',
      '先创建一个空目录，启动 Claude Code，用 /help 看看当前会话。',
      '然后只提出一个很小的任务，比如创建 test.py。',
      '重点不是让它一次做很多，而是先跑通完整闭环。',
    ],
  },
  {
    id: 'scene-09-review-diff',
    type: 'terminal',
    durationSeconds: 0,
    headline: '先看 diff，再让文件真正落盘',
    command: 'claude "创建 test.py，并先展示 diff"',
    output: [
      '读取当前目录状态',
      '提出 test.py 的新增 diff',
      '等待人工确认写入',
      '确认后文件才真正落盘',
    ],
    reviewFlow: [
      {title: '理解任务', label: '01', description: '先明确要改什么。', tone: 'accent'},
      {title: '生成 diff', label: '02', description: '把拟议修改展示出来。', tone: 'accent'},
      {title: '人工检查', label: '03', description: '确认路径、内容和影响范围。', tone: 'warning'},
      {title: '确认写入', label: '04', description: '通过后，文件才进入工作区。', tone: 'success'},
    ],
    caption: [
      '第一次任务最重要的不是“它会不会改文件”，而是你能不能看懂它准备怎么改。',
      '先让它展示 diff，人检查路径、内容和影响范围。',
      '确认之后，修改才真正写入文件。',
      '这一步建立的是可控的协作边界。',
    ],
  },
  {
    id: 'scene-10-diagnose-layer',
    type: 'concept',
    durationSeconds: 0,
    headline: '遇到报错，先判断错误发生在哪一层',
    keyPoints: [
      '命令找不到：PATH 或终端状态',
      '登录失败：账号、网络或 OAuth',
      '运行异常：资源、权限或项目状态',
      '多套安装：先定位实际命令来源',
    ],
    caption: [
      '遇到报错，不要第一反应就是重新安装。',
      '先判断它属于命令层、登录层、运行环境层，还是项目状态层。',
      '如果机器上有多套安装，还要先定位当前实际调用的是哪一个。',
    ],
  },
  {
    id: 'scene-11-maintenance',
    type: 'step-list',
    durationSeconds: 0,
    headline: '升级和卸载，要匹配最初的安装来源',
    steps: [
      '官方原生安装 → 按官方方式升级',
      'npm 安装 → 用 npm 维护',
      '清理前确认目标和不可逆影响',
      '不确定时先查当前安装来源',
    ],
    stepVisuals: [
      {
        title: '对应来源',
        label: '01',
        description: '先回忆或查明最初的安装入口。',
        items: ['原生安装', 'npm 安装'],
        tone: 'accent',
      },
      {
        title: '对应维护',
        label: '02',
        description: '升级和卸载沿用同一条来源。',
        items: ['版本更新', '卸载命令'],
        tone: 'accent',
      },
      {
        title: '谨慎清理',
        label: '03',
        description: '破坏性清理前必须确认目标。',
        items: ['备份配置', '确认路径'],
        tone: 'warning',
      },
      {
        title: '留下证据',
        label: '04',
        description: '不确定时先查来源，不要盲删。',
        items: ['实际路径', '当前版本'],
        tone: 'success',
      },
    ],
    caption: [
      '后续升级和卸载，必须匹配最初的安装来源。',
      '官方原生安装和 npm 安装，不要混着维护。',
      '涉及配置或缓存清理时，先确认目标和不可逆影响。',
      '不确定就先查当前安装来源，不要直接执行破坏性命令。',
    ],
  },
  {
    id: 'scene-12-ready-summary',
    type: 'summary',
    durationSeconds: 0,
    headline: '最后检查：四项结果都成立',
    summary: '能安装只是起点，能安全完成第一次任务才算准备好',
    bullets: ['环境准备完成', '命令验证通过', '登录授权完成', 'Diff 已确认写入'],
    highlight: 'Diff',
    roleCards: [
      {
        title: '环境准备完成',
        label: '01',
        description: '平台、终端和账号前提已经明确。',
        tone: 'success',
      },
      {
        title: '命令验证通过',
        label: '02',
        description: '版本和诊断命令都能返回证据。',
        tone: 'success',
      },
      {
        title: '登录授权完成',
        label: '03',
        description: '本地或远程 OAuth 都能完成闭环。',
        tone: 'success',
      },
      {
        title: 'Diff 已确认写入',
        label: '04',
        description: '第一次任务在人工检查后安全落盘。',
        tone: 'success',
      },
    ],
    caption: [
      '回到最后，真正准备好要看四项结果。',
      '环境明确，命令可用，登录完成，第一次 diff 经过确认并写入。',
      '到这里，你才算把 Claude Code 的第一次使用闭环跑通。',
      '下一节，我们会拆开 Claude Code 背后的“代理循环”，看看一句自然语言指令是怎样变成一次真实文件修改的。',
    ],
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const visualRevealSegments: string[][] = [
  ['01-01', '01-03', '01-04'],
  ['02-02', '02-03', '02-04'],
  ['03-01', '03-02', '03-03'],
  ['04-01', '04-03'],
  ['05-03', '05-04', '05-06', '05-07'],
  ['06-01', '06-02', '06-03', '06-05'],
  ['07-01', '07-03'],
  ['08-02', '08-04', '08-05', '08-06'],
  ['09-02', '09-03', '09-04', '09-06'],
  ['10-03', '10-04', '10-05', '10-07'],
  ['11-01', '11-03', '11-04', '11-06'],
  ['12-03', '12-04', '12-05', '12-06'],
];

// Summary cards use a 0.55-second fade/slide. Start them slightly before the
// narration segment so the card is visually present when its point is spoken.
const visualRevealAdvanceSecondsBySceneId: Record<string, number> = {
  'scene-12-ready-summary': 0.4,
};

if (visualRevealSegments.length !== sceneDefinitions.length) {
  throw new Error(`Expected reveal mapping for ${sceneDefinitions.length} scenes, received ${visualRevealSegments.length}`);
}

const getSegmentStartSeconds = (sceneIndex: number, segmentId: string) => {
  const scene = narratedTiming.scenes[sceneIndex];
  const segment = scene?.segments.find((item) => item.segmentId === segmentId);

  if (!scene || !segment) {
    throw new Error(`Missing visual timing for scene index ${sceneIndex}, segment ${segmentId}`);
  }

  return segment.startSeconds - scene.startSeconds;
};

export const audioTracks = narratedTiming.audioTracks;
export const subtitleCues = narratedTiming.subtitleCues;

export const videoConfig: VideoConfig = {
  slug: 'claude-code-install',
  title: 'Claude Code 安装与使用',
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
    visualRevealSeconds: visualRevealSegments[index].map((segmentId) => {
      const advanceSeconds = visualRevealAdvanceSecondsBySceneId[scene.id] ?? 0;

      return Math.max(0, getSegmentStartSeconds(index, segmentId) - advanceSeconds);
    }),
  })),
};
