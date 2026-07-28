import type {VideoConfig} from '../../lib/videoTypes';

export const videoConfig: VideoConfig = {
  slug: 'claude-code-what-is',
  title: 'Claude Code 到底是什么？',
  format: 'vertical',
  width: 1080,
  height: 1920,
  fps: 30,
  scenes: [
    {
      id: 'opening',
      type: 'opening',
      durationSeconds: 8,
      headline: 'Claude Code 到底是什么？',
      subtitle: '它不是另一个聊天框',
      cards: ['ChatGPT？', 'Cursor？', 'Claude Code？'],
      highlight: 'Claude Code？',
      caption:
        '很多人第一次听到 Claude Code，都会问：它到底和 ChatGPT、Cursor 有什么区别？',
    },
    {
      id: 'concept',
      type: 'concept',
      durationSeconds: 12,
      headline: '运行在项目里的 AI 编码助手',
      keyPoints: ['读取项目', '理解代码', '修改文件', '运行命令'],
      caption:
        '简单说，Claude Code 是一个可以进入工程目录，理解项目并执行编码任务的 AI 助手。',
    },
    {
      id: 'comparison',
      type: 'comparison',
      durationSeconds: 15,
      headline: '聊天工具像顾问，Claude Code 像搭档',
      left: {
        title: 'ChatGPT',
        items: ['复制代码', '粘贴问题', '获取建议', '手动修改'],
      },
      right: {
        title: 'Claude Code',
        items: ['读取项目', '定位问题', '修改文件', '运行检查'],
      },
      highlight: 'right',
      caption:
        '传统聊天工具更像顾问，而 Claude Code 更像能直接参与执行的搭档。',
    },
    {
      id: 'workflow',
      type: 'step-list',
      durationSeconds: 14,
      headline: '一个典型工作流',
      steps: [
        '你描述目标',
        'Claude Code 阅读文件',
        '它提出修改方案',
        '修改代码并运行验证',
        '你预览、检查和确认',
      ],
      caption:
        '它的核心不是替你思考一切，而是把编码任务拆解、执行，并让你持续验收。',
    },
    {
      id: 'terminal',
      type: 'terminal',
      durationSeconds: 12,
      headline: '它主要从终端开始',
      command: 'claude',
      output: ['Reading project...', 'Planning changes...', 'Running checks...'],
      caption: 'Claude Code 通常从终端启动，围绕当前项目进行上下文理解和操作。',
    },
    {
      id: 'summary',
      type: 'summary',
      durationSeconds: 10,
      headline: '一句话总结',
      summary: 'Claude Code 是能在项目中执行任务的 AI 编码搭档。',
      bullets: ['适合真实工程任务', '需要人工确认', '不是完全自动驾驶'],
      highlight: 'AI 编码搭档',
      caption:
        '所以，Claude Code 最适合被理解为：一个能和你一起改项目、跑验证、推进任务的 AI 编码搭档。',
    },
  ],
};
