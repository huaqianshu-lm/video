import type {AudioTrackConfig, SceneConfig, SubtitleCue, VideoConfig} from '../../lib/videoTypes';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';
import seriesConfig from '../../../series/codex-guide/series.json';

const fps = 30;

const sceneDefinitions: SceneConfig[] = [
  {
    id: 'scene-01-preflight-path',
    type: 'opening',
    durationSeconds: 0,
    headline: '先别急着复制安装命令',
    subtitle: '先确认条件，再选择真正适合自己的启动路径。',
    cards: ['使用入口', '账号路径', '网络连通性'],
    highlight: '我的启动路径',
    caption: [],
  },
  {
    id: 'scene-02-entry-routing',
    type: 'comparison',
    durationSeconds: 0,
    headline: '工作方式决定入口',
    left: {title: '桌面 App', items: ['macOS', 'Windows', '图形项目工作流']},
    right: {title: 'CLI', items: ['Linux', '终端操作', '自动化任务', '官方独立安装器', '不要求 Node.js']},
    highlight: 'right',
    caption: [],
  },
  {
    id: 'scene-03-environment-map',
    type: 'comparison',
    durationSeconds: 0,
    headline: '匹配系统与运行环境',
    columns: [
      {title: '系统', items: ['macOS', 'Linux', 'Windows']},
      {title: '安装路径', items: ['芯片架构', 'Shell', 'CLI', 'PowerShell', 'WSL2']},
      {title: '运行边界', items: ['elevated', 'unelevated', 'Linux 文件系统', '/mnt/c/...']},
    ],
    highlightIndex: 2,
    caption: [],
  },
  {
    id: 'scene-04-command-verification',
    type: 'terminal',
    durationSeconds: 0,
    headline: '用版本号验证 CLI 已可执行',
    command: 'codex --version',
    output: ['codex <版本号>', 'CLI 可执行', 'command not found', '检查 PATH', '检查多重安装'],
    caption: [],
  },
  {
    id: 'scene-05-authentication-flow',
    type: 'concept',
    durationSeconds: 0,
    headline: '完成登录，连接身份与使用边界',
    keyPoints: ['ChatGPT 账号', 'API key', '浏览器登录', '设备码登录', '已认证工作环境'],
    caption: [],
  },
  {
    id: 'scene-06-root-cause-recovery',
    type: 'step-list',
    durationSeconds: 0,
    headline: '遇到问题，回到失败发生的边界',
    steps: ['找不到 codex', '下载超时', '浏览器登录失败', 'Windows 沙箱失败'],
    caption: [],
  },
  {
    id: 'scene-07-stable-start',
    type: 'summary',
    durationSeconds: 0,
    headline: '建立一条可验证、可恢复的启动路径',
    summary: '安装不是终点 · 稳定启动才是',
    bullets: ['选择入口', '匹配环境', '验证命令', '完成登录', '按根因排错'],
    highlight: '可验证、可登录、可安全工作',
    caption: [],
  },
];

const sceneDuration = (index: number) => {
  const timing = timelineManifest.scenes[index];
  if (!timing) throw new Error(`Missing timeline for scene index ${index}`);
  return (Math.round(timing.end * fps) - Math.round(timing.offset * fps)) / fps;
};

const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) =>
  scene.segments.map((segment) => ({
    id: segment.segmentId,
    src: `local-assets/03-install/${segment.audioFile}`,
    startSeconds: scene.offset + segment.offset,
    durationSeconds: segment.duration,
  })),
);

const subtitleCues: SubtitleCue[] = subtitleManifest.scenes.flatMap((scene) => {
  const sceneTiming = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  if (!sceneTiming) throw new Error(`Missing timeline for scene ${scene.sceneId}`);

  return scene.segments.flatMap((segment) => {
    const segmentTiming = sceneTiming.segments.find((item) => item.segmentId === segment.segmentId);
    if (!segmentTiming) throw new Error(`Missing timeline for segment ${segment.segmentId}`);

    return segment.cues.map((cue) => ({
      startSeconds: sceneTiming.offset + segmentTiming.offset + cue.start,
      endSeconds: sceneTiming.offset + segmentTiming.offset + cue.end,
      text: cue.text,
    }));
  });
});

export const videoConfig: VideoConfig = {
  slug: '03-install',
  title: 'Codex 安装与登录',
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
    durationSeconds: sceneDuration(index),
    showCaption: false,
  })),
};
