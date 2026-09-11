# CLAUDE.md

本文件是当前 Remotion AI Video MVP 工程的项目级核心规范。全局约束来自 `~/.claude/CLAUDE.md`；本文件只保留所有项目任务都需要知道的边界、不可变约束和按需加载入口。

## 项目定位

本项目用于验证并产品化一套可复用的视频生产 Harness：

`原始内容 → Content Analysis → Video Narrative → Scene Script → Narration Script → Visual Script → Visual Prototype → 人工确认 → Remotion → Studio 预览 → 人工确认 → GitHub Actions 渲染`

Harness 只服务于视频生产，不扩展为处理代码、数据或其他任务的通用 Harness。一次性的视频内容和具体视频产物属于本地工作资料，不属于仓库长期能力。

## 规则分层与按需加载

- 本文件：项目定位、仓库边界、核心不变量、Skill 路由和验证要求。
- `.claude/skills/`：只在对应任务发生时加载的操作流程和专项规则。
- `docs/`：稳定、可共享的详细规则和工作流参考，不在本文件中重复全文。
- `drafts/`：实施方案、讨论结果、临时设计和被替代方案，不具有规范效力。
- `notes/`：本地问题记录和经验沉淀，不作为远端执行的唯一规则来源。

按任务加载 Skill：

- 新建或修改视频生产资料：读取 `.claude/skills/video-production/SKILL.md`。
- 处理口播、TTS、字幕或 Timeline：读取 `.claude/skills/narrated-video-tts/SKILL.md`。
- 处理 Visual Prototype、Remotion、音画对齐或 Gate 3：读取 `.claude/skills/visual-prototype-remotion/SKILL.md`。
- 处理 Harness Web UI、后台 Job、批量任务或远程渲染：读取 `.claude/skills/harness-webui-render/SKILL.md`。

只读取当前任务需要的 Skill reference，不默认加载所有 Skill 和长文档。Skill 不得复制已经在 `docs/` 中维护的整套手册；如果规则发生变化，应修改唯一的权威来源并同步更新路由。

## 仓库边界

应提交并维护的内容：

- `harness/`：视频生产 Harness 代码和测试。
- `src/components/`、`src/scenes/`、`src/lib/`：通用 Remotion 能力。
- `styles/`：可复用视觉风格。
- `.claude/skills/`：项目内专项工作流。
- `templates/`：不包含具体视频内容的通用模板和基线。
- `docs/`：稳定规则、架构说明和使用文档。
- `README.md`：项目介绍和使用方式。
- `ROADMAP.md`：当前真实进度、阻塞和下一步。

只保存在本地、不提交到 Git 的内容：

- `videos/`：具体视频的七层生产资料、原型和审核记录。
- `src/videos/`：具体视频配置和 Remotion 主组件。
- `assets/`、`series/`、`local/`、`out/`：视频资源、系列资料、本地运行资料和渲染产物。
- `drafts/`、`notes/`：过程方案、项目笔记和经验记录。
- `*.mp4`、`*.mp3`、`*.wav`、`*.m4a`、`*.webm` 等本地媒体。

具体视频目录不得成为远端仓库唯一的模板或规范来源；需要复用的结构必须提取到 `templates/` 或 Skill 的 `references/`。

## 不可变核心约束

- 视频默认采用 16:9、1920 × 1080、30fps；视频时长由内容或真实音频决定，不用固定总时长硬拉或压缩内容。
- 视频生产保留人工 Gate。Agent、Harness 和远程任务不得自动通过 Gate，不得用“已有文件校验”伪装成真实制作完成。
- `narration-script.md` 的 Scene 正文只能是实际口播；Gate 2 后必须先生成并校验独立的 `tts-script.json`，音频、字幕和 Timeline 只能从它生成。
- narrated 视频默认显式使用 TTS `+25%` 语速；字幕展示文本去掉句末标点，但不能修改朗读文本、音频或时间轴。
- Remotion 必须使用已校验的 Timeline Manifest 作为 narrated 视频的时间基准，并保持 Scene、Audio、Subtitle 和视觉事件的映射一致。
- Visual Prototype 先于正式 Remotion 实现；原型和 Remotion 必须使用统一的可复用外壳、左上标题区、字幕区、导航区和进度区。
- 进入 Gate 3 前必须对照冻结的 Visual Script、Visual Prototype 和 `remotion-alignment.json`；最终输出必须通过清洁画面检查。
- 画面中的标题、标签、按钮、状态、终端输出和卡片文案必须能追溯到当前视频资料，不得复制参考视频的业务语义或固定文案。
- 每条系列视频的最后一个视觉事件必须包含有资料依据的下一集预告；系列封面、风格和成员关系按需读取对应 Skill。
- 远程渲染前必须验证代码、配置和资源包的提交状态；不得使用 `git add .`。自动 commit／push 只允许在用户明确确认的 Smoke Render 入口中进行定向操作。
- 具体视频的远程渲染输入必须通过被 Git 忽略的 `local/render-input/<video-slug>/` 整理，并以独立输入包 URL 和 SHA-256 交给 GitHub Actions；不得把 `videos/`、`src/videos/` 或视频资源重新加入能力代码仓库。
- 本地 Studio 预览具体视频时，必须从独立输入包生成被忽略的 `src/RenderInputRoot.tsx` 临时入口；该入口支持注册单条视频或本地扫描后批量注册全部可匹配视频。受跟踪的 `src/Root.tsx` 只保留通用 Composition，不重新硬编码具体视频。

## 高层工作流

1. 确认任务涉及的 Skill 和参考文档。
2. 新建或更新本地视频的 Source、Content Analysis、Video Narrative 和 Scene Script，完成 Gate 1 内部审查。
3. 更新 Narration Script、Visual Script 和 Visual Prototype，完成 Gate 2。
4. narrated 视频在 Gate 2 后派生并校验 `tts-script.json`，再生成音频、字幕和 Timeline，并完成 TTS 质检。
5. 按冻结原型和 Timeline Manifest 实现 Remotion，完成 Gate 3。
6. 通过 Smoke Render 检查后，才进入完整渲染和 Gate 4。
7. 每次完成开发、修复、文档补齐或重要调研后，更新 `ROADMAP.md`；重要阶段变化使用 `record-project-event` Skill 记录。

详细流程按需查阅：

- `docs/VIDEO-PRODUCTION-RULES.md`：视频内容、Scene、视觉和质量规则。
- `docs/VIDEO-PROJECT-WORKFLOW.md`：七层资料和 Video／TTS／Remotion 职责流程。
- `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md`：人工 Gate、TTS 回传和远程渲染架构。
- `docs/article-to-video-complete-workflow-summary.md`：文章到视频的完整背景说明。
- `docs/TTS-SETUP.md`：本地 TTS 环境和依赖配置。
- `harness/README.md`、`harness/VALIDATION-MATRIX.md`：Harness 使用和验证入口。

## 工程约束

- 使用 React、TypeScript 和 Remotion；Node.js 18+；TypeScript 继续固定为 `~5.8.3`。
- 优先复用 `src/scenes/` 的通用场景和 `src/lib/timing.ts` 的时间工具，不为单条视频重复实现公共能力。
- 不引入数据库、登录系统、后端服务、复杂状态管理或与 MVP 无关的新依赖。
- Visual Prototype 优先使用无依赖 HTML + CSS；正式视频逻辑在用户确认原型后再修改。
- 执行长驻命令、预览和渲染时控制日志体积，不读取 `node_modules/`、缓存、构建产物和大型媒体，除非任务确有必要。
- 修改完成后主动运行适用的检查；未验证的事项不得写成已完成。

## 进度与清单

- `ROADMAP.md` 是项目当前阶段的真实进度源，只保留当前阶段、下一步、阻塞和最近有价值的验证。
- `docs/MVP-FEATURE-CHECKLIST.md` 记录仓库能力的 MVP 功能状态；完成能力后同步更新验证依据。
- `notes/` 中的经验只在排查对应问题时按需读取；不把临时经验直接提升为所有视频都适用的硬规则。

## 常用检查

```bash
node --version
npm run check
git diff --check
```

`npm run preview` 只用于 Studio 预览；`npm run render` 只能在用户明确确认渲染后执行。

## 交付说明

每次完成重要修改后，说明改动范围、预览方式、Composition ID、已完成和未完成的验证。只有实际执行过渲染时，才说明渲染命令和输出路径。
