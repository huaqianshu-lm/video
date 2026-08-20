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
    id: 'scene-01-continuous-fix', type: 'opening', durationSeconds: 0,
    headline: '一句问题，连续几步', subtitle: 'Claude Code 不是只回你一段建议',
    cards: ['测试失败', '读报错 / 找函数', '修改代码', 'Tests passed'], highlight: 'Tests passed',
    cardDetails: [
      beat('测试失败', 'validateEmail → undefined', ['failed'], 'warning'),
      beat('读报错 / 找函数', '定位少了 return 的位置', ['search']),
      beat('修改代码', '把判断结果写回文件', ['edit']),
      beat('Tests passed', '修改后重新验证', ['verified'], 'success'),
    ], caption: [],
  },
  {
    id: 'scene-02-chat-vs-project', type: 'comparison', durationSeconds: 0, headline: '聊天框与 Claude Code',
    columns: [
      {title: '普通聊天框', items: ['只返回文字', '给出建议', '等待人来执行'], visualSteps: [beat('回答表面', '返回一段文字。', ['text'], 'muted')]},
      {title: 'Claude Code', items: ['读项目', '改代码', '跑命令', '验证结果'], visualSteps: [beat('工作表面', '在项目中连续行动。', ['read', 'edit', 'run', 'verify'], 'success')]},
    ], highlightIndex: 1, caption: [],
  },
  {
    id: 'scene-03-agent-loop', type: 'comparison', durationSeconds: 0, headline: '代理循环：想 → 做 → 看',
    columns: [
      {title: '想', items: ['收集上下文', '判断下一步'], visualSteps: [beat('上下文', '先理解任务。', ['context'])]},
      {title: '做', items: ['采取行动', '调用工具'], visualSteps: [beat('行动', '让工具推进任务。', ['tools'])]},
      {title: '看', items: ['验证结果', '不够就再来一圈'], visualSteps: [beat('反馈', '结果会回到下一轮。', ['loop'], 'success')]},
    ], highlightIndex: 2, caption: [],
  },
  {
    id: 'scene-04-repair-workflow', type: 'step-list', durationSeconds: 0, headline: '一轮修复如何展开',
    steps: ['跑测试', '读输出', '搜文件', '读逻辑', '改文件', '再测试'],
    stepVisuals: [
      beat('跑测试', '先让失败变成可观察结果。', ['execute'], 'warning'), beat('读输出', '读取错误信息。', ['observe']),
      beat('搜文件', '定位相关函数。', ['search']), beat('读逻辑', '理解当前实现。', ['read']),
      beat('改文件', '把修复写回项目。', ['edit']), beat('再测试', '用结果决定下一轮。', ['verify'], 'success'),
    ], caption: [],
  },
  {
    id: 'scene-05-esc-stop', type: 'terminal', durationSeconds: 0, headline: 'Esc：立刻叫停', command: '正在修改 5 个文件…',
    output: ['修改文件 1 / 5', '修改文件 3 / 5', '修改文件 5 / 5', 'Esc', 'Tool call cancelled'],
    reviewFlow: [beat('正在执行', '动作还没有完成。', ['running'], 'warning'), beat('Esc', '取消当前工具调用。', ['interrupt'], 'warning'), beat('状态冻结', '改动停止继续增长。', ['stopped'], 'success')], caption: [],
  },
  {
    id: 'scene-06-queued-instruction', type: 'terminal', durationSeconds: 0, headline: '补充指令：不打断当前动作', command: '只改 validateEmail，保留当前测试',
    output: ['当前操作继续中', '补充指令已排队', '完成当前动作后读取', '迭代 > 一次性完美提示'],
    reviewFlow: [beat('继续执行', '当前工具动作不会被取消。', ['running']), beat('排队读取', '补充约束等待当前动作完成。', ['queued']), beat('完成后读取', '下一轮使用新的上下文。', ['next'], 'success')], caption: [],
  },
  {
    id: 'scene-07-toolbox', type: 'step-list', durationSeconds: 0, headline: '五类工具箱',
    steps: ['文件操作', '搜索', '执行', '网络', '代码智能'],
    stepVisuals: [beat('文件操作', '读写项目文件。', ['read', 'edit']), beat('搜索', '定位代码和内容。', ['find']), beat('执行', '运行命令与测试。', ['run']), beat('网络', '访问需要的外部信息。', ['web']), beat('代码智能', '更深的编辑器能力，需插件。', ['plugin'], 'muted')], caption: [],
  },
  {
    id: 'scene-08-tool-selection', type: 'terminal', durationSeconds: 0, headline: '模型自己选择工具', command: 'claude --fix failing-test',
    output: ['1 执行：跑测试', '2 执行：读输出', '3 搜索：找文件', '4 文件：读逻辑', '5 文件：改 bug', '6 执行：再验证'],
    reviewFlow: [beat('目标', '修复失败测试。', ['task']), beat('选择', '根据当前结果挑工具。', ['tool']), beat('反馈', '结果推动下一步。', ['loop'], 'success')], caption: [],
  },
  {
    id: 'scene-09-workspace-scope', type: 'comparison', durationSeconds: 0, headline: '当前目录是工作范围',
    columns: [
      {title: '当前工作目录', items: ['项目文件', '终端', 'git', 'CLAUDE.md', '扩展'], visualSteps: [beat('可见资源', '跨文件协调工作。', ['workspace'], 'success')]},
      {title: '目录之外', items: ['不是整个硬盘', '其他位置需要权限', '敏感内容不自动展开'], visualSteps: [beat('边界', '访问范围需要授权。', ['permission'], 'warning')]},
    ], highlightIndex: 0, caption: [],
  },
  {
    id: 'scene-10-safety-gates', type: 'comparison', durationSeconds: 0, headline: '两道安全闸',
    left: {title: 'Permission mode', items: ['Plan Mode', '先读、先搜、先计划', '批准后再执行'], visualSteps: [beat('批准闸门', '控制会话级自主权。', ['approve'])]},
    right: {title: 'Checkpoint', items: ['恢复本地编辑', '保存可回退状态', '外部副作用不会自动回滚'], visualSteps: [beat('存档闸门', '只负责本地编辑恢复。', ['restore'], 'success')]},
    highlight: 'right', caption: [],
  },
  {
    id: 'scene-11-plan-mode-demo', type: 'terminal', durationSeconds: 0, headline: '空目录实验：先想再做', command: 'mkdir -p ~/cc-demo && cd ~/cc-demo',
    output: ['claude', 'Plan Mode', '1 创建 add.py', '2 创建测试', '3 运行测试', '需要我开始吗？'],
    reviewFlow: [beat('空目录', '先准备一个干净工作区。', ['empty']), beat('Plan Mode', '只读、搜索和计划。', ['plan']), beat('等待批准', '文件区保持空白。', ['waiting'], 'warning')], caption: [],
  },
  {
    id: 'scene-12-loop-recap', type: 'summary', durationSeconds: 0, headline: '验证失败，再来一轮', summary: '模型 + 工具 + 验证 + 人的方向',
    bullets: ['给方向', '选择工具', '跑验证', '及时拉回'], highlight: '方向',
    roleCards: [beat('给方向', '人决定目标和验收标准。', ['human']), beat('选择工具', '模型根据结果推进任务。', ['model']), beat('跑验证', '通过或失败都提供反馈。', ['tests'], 'success'), beat('及时拉回', '跑偏时用 Esc 或补充指令。', ['control'], 'warning')],
    teaser: beat('下一篇 04｜API 配置', '继续看 Claude Code 如何接入不同模型和 API。', ['next'], 'muted'), caption: [], compactLayout: true,
  },
];

if (timelineManifest.scenes.length !== sceneDefinitions.length) {
  throw new Error(`Expected ${sceneDefinitions.length} scenes, received ${timelineManifest.scenes.length}`);
}

const audioTracks: AudioTrackConfig[] = timelineManifest.scenes.flatMap((scene) => scene.segments.map((segment) => ({
  id: segment.segmentId,
  src: `local-assets/claude-code-how-it-works/${segment.audioFile}`,
  startSeconds: scene.offset + segment.offset,
  durationSeconds: segment.duration,
})));

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
  slug: 'claude-code-how-it-works', title: 'Claude Code 如何工作', format: 'horizontal', width: 1920, height: 1080, fps,
  audioTracks, subtitleCues,
  scenes: sceneDefinitions.map((scene, index) => ({...scene, durationSeconds: timelineManifest.scenes[index].duration, showCaption: false})),
};
