# Remotion AI Video Harness

基于 Remotion 的 AI 视频生产 Harness，将内容分析、视频叙事、Scene 脚本、视觉原型、AI 配音、字幕时间线、Remotion 动画和远程渲染连接成一条可暂停、可检查、可恢复的工作流。在单条生产链路之上，系统支持通过统一模板批量创建视频任务、集中编排生产阶段，并为每条视频独立保留人工检查点与失败恢复状态，让系列内容能够稳定、连续地规模化制作。

## 项目简介

这个项目用于把 AI 视频从原始内容推进到最终 MP4。它既包含 Remotion 视频工程，也包含一套本地 Harness，用来管理生产阶段、校验产物、执行人工 Gate、恢复失败任务和编排批量制作。

Harness 不替代内容与画面判断。口播、视觉原型、Remotion 预览、Smoke Render 和最终视频仍在关键节点等待人工确认，批量任务不会绕过这些检查点。

## 核心能力

- 七层生产资料：Source、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script／Prototype、Remotion 配置。
- 15 个生产阶段：从原始内容、TTS、字幕时间线一路推进到远程渲染和最终验收。
- 本地 Web UI：查看项目、阶段、资料、校验问题、Agent Job、Remotion 任务和远程渲染状态。
- 批量视频制作：支持批量推进到 Gate 2、完成 TTS、完成 Remotion，以及批量渲染。
- 人工质量门：保留 Gate 2、TTS 质检、Gate 3、Smoke Render 检查和 Gate 4。
- 断点续做：任务状态持久化，失败后可重试，服务重启后可继续恢复。
- 音画同步：以经过校验的 Audio、Subtitle 和 Timeline Manifest 作为 Remotion 时间基准。
- 远程交付：通过 GitHub Actions 执行 Smoke Render 和完整渲染，并检查 Run 与 Artifact。
- 系列化制作：支持系列风格、共享封面和视频关联。

## 工作流

```text
原始内容
  ↓
内容分析 → 视频叙事 → Scene 脚本
  ↓ Gate 1：Agent 内部审查
口播稿 → 视觉脚本 → 视觉原型
  ↓ Gate 2：人工确认
TTS → 字幕／Timeline
  ↓ TTS 人工质检
Remotion 制作
  ↓ Gate 3：人工预览
Smoke Render
  ↓ Smoke 人工检查
完整 Render
  ↓ Gate 4：最终验收
MP4／Artifact
```

批量任务复用同一套单视频阶段契约，只负责编排选中的视频，并在每个人工检查点暂停。

## 技术栈

- Remotion
- React
- TypeScript
- Node.js 原生测试运行器
- Microsoft Edge TTS 适配器
- GitHub Actions
- 本地 Node.js Web Server

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm
- 本机可用的 `codex` CLI，用于默认 Agent 执行器
- 如需生成配音：项目既定 TTS 工程，默认位于当前仓库同级的 `../tts`
- 如需远程渲染：可访问目标仓库的 GitHub Token

### 安装依赖

```bash
npm install
```

### 启动 Harness Web UI

```bash
npm run harness:web
```

浏览器打开：

```text
http://127.0.0.1:4173
```

Web UI 仅监听本机 `127.0.0.1`。你可以在首页导入 Markdown／纯文本源文件、关联系列，并按阶段推进单条或批量视频任务。

### 启动 Remotion Studio

```bash
npm run preview
```

### 运行检查

```bash
npm run check
npm test --prefix harness
```

## 批量制作

Harness 提供四类批量目标：

| 批量目标 | 自动推进范围 | 暂停位置 |
| --- | --- | --- |
| 到 Gate 2 | 内容分析、叙事、脚本和视觉原型 | Gate 2 人工确认 |
| 完成 TTS | 配音、字幕和 Timeline | TTS 人工质检 |
| 完成 Remotion | Remotion 配置、场景实现和对齐校验 | Gate 3 人工预览 |
| 批量渲染 | Smoke Render 与完整 Render | Smoke 检查和 Gate 4 |

批量任务可以在 Web UI 中创建，也可以通过 CLI 执行：

```bash
node harness/src/cli.mjs batch types
node harness/src/cli.mjs batch create to-gate-2 <video-slug>...
node harness/src/cli.mjs batch create to-tts <video-slug>...
node harness/src/cli.mjs batch create to-remotion <video-slug>...
node harness/src/cli.mjs batch create to-render <video-slug>...
node harness/src/cli.mjs batch list
node harness/src/cli.mjs batch run <batch-id>
node harness/src/cli.mjs batch resume <batch-id> --retry-failed
```

## 单视频 CLI

```bash
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs validate <video-slug> [stage]
node harness/src/cli.mjs next <video-slug>
node harness/src/cli.mjs run <video-slug> [stage]
node harness/src/cli.mjs retry <video-slug> [stage]
node harness/src/cli.mjs resume <video-slug>
node harness/src/cli.mjs report <video-slug>
```

完整的 Gate、任务、资源打包和执行器配置命令见 [Harness 使用文档](./harness/README.md)。

## 远程渲染

远程 Smoke Render 和完整 Render 通过 GitHub Actions 执行。启动前配置：

```bash
export GITHUB_TOKEN="<token>"
export GITHUB_REPOSITORY="<owner>/<repo>"
export HARNESS_GITHUB_REF="<optional-explicit-branch>"
```

未设置 `HARNESS_GITHUB_REF` 时，Harness 优先读取当前 Git 工作区分支。提交远程任务前，它会检查资源 ZIP、Manifest、Remotion 代码、Git 跟踪状态，以及目标分支是否包含当前提交。

## 项目结构

```text
.
├── harness/                 # Harness 核心、Web UI、任务状态和测试
├── videos/<video-slug>/     # 单条视频的七层生产资料与 Manifest
├── src/videos/<video-slug>/ # Remotion 配置和视频主组件
├── src/scenes/              # 通用场景组件
├── src/components/          # 通用基础组件
├── src/lib/                 # 类型、时间轴和同步工具
├── series/                  # 系列配置
├── public/series-assets/    # Git 跟踪的系列共享素材
├── public/local-assets/     # 本地视频播放资源，不提交 Git
├── assets/                  # 远程渲染资源包
└── docs/                    # 生产流程、规范和经验文档
```

## 设计边界

- 专注视频生产，不扩展为通用任务 Harness。
- 不引入数据库、登录、多用户或公网部署。
- 不自动通过人工 Gate。
- TTS 只消费 Gate 2 冻结并校验后的 `tts-script.json`。
- Narrated 视频以实际音频、字幕和 Timeline Manifest 驱动 Remotion 时间线。
- Visual Prototype 是正式 Remotion 制作前的视觉确认基线。
- 批量任务只处理用户明确选择的视频。

## 进一步阅读

- [Harness 详细说明](./harness/README.md)
- [端到端视频生产方案](./docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md)
- [视频生产流程](./docs/VIDEO-PROJECT-WORKFLOW.md)
- [视频生产规范](./docs/VIDEO-PRODUCTION-RULES.md)
- [Harness 校验矩阵](./harness/VALIDATION-MATRIX.md)
- [当前路线图](./ROADMAP.md)

## 当前状态

项目处于 MVP 持续验证阶段。单视频阶段管理、本地 Web UI、批量编排、人工 Gate、TTS／Remotion 适配、远程渲染与恢复机制均已接入；不同视频的实际进度和当前阻塞以 [ROADMAP.md](./ROADMAP.md) 为准。
