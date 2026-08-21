# CLAUDE.md

本文件用于约束 Claude Code 在当前目录实现和维护 Remotion AI Video MVP 工程。若与历史 demo 约束文档 `remotion-video-demo-constraints.md` 冲突，以本文件为当前执行规范；需要调整实践时，先更新本文件，再改代码。

## 项目定位

当前目录是 Remotion AI Video MVP 工程目录，用于验证「原始内容 → Content Analysis → Video Narrative → Scene Script → Narration Script → Visual Script → Visual Prototype → 人工确认 → Remotion 场景实现 → Studio 预览 → 人工确认 → MP4 渲染」的可复用视频生产流程。

当前目标不是完整视频平台、剪辑软件、素材管理系统或自动化视频工厂。Harness Web UI 第一版只作为本地视频生产流程的查看和控制界面，不改变这个范围。

历史说明：`HelloIntro` 只是早期 Remotion 技术 spike，用于确认环境可运行；它不再作为后续架构、组件或视觉设计基础。

「源文档 → 分阶段生产资料 → TTS → 音频／字幕回传 → Remotion 音画同步 → 人工确认 → GitHub Actions 渲染与轮询」端到端方案记录在 `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md`。当前第一条真实验证视频已完成 TTS、Remotion 接入和 Gate 3，GitHub Actions 已支持通过受控输入渲染不同视频；自动 TTS、后台常驻轮询和批量任务编排仍未实现，具体真实进度以 `ROADMAP.md` 为准。

## Harness Web UI 第一版范围

Harness Web UI 第一版建立在 Harness 0.4 之上，只提供本地管理界面，不重新实现视频生产逻辑：

- 通过本地 Web Server 展示视频项目列表、15 个生产阶段、当前状态、校验问题和下一步动作。
- 查看七层生产资料、TTS／字幕／Timeline Manifest、Remotion 配置、Visual Prototype 和远程渲染结果。
- 调用现有 Harness 核心完成校验、`next`、`report`、`context`、`plan`、Gate 通过／驳回、重试和断点续做。
- 通过后台任务触发并查看 GitHub Actions Smoke Render、完整 Render 和 Artifact；浏览器不得接触 GitHub Token。
- Web UI 只绑定 `127.0.0.1`，第一版不引入数据库、登录、多用户、批量编排或公网部署。
- Agent 阶段仍由既定生产流程和 Agent 完成；Web UI 第一版不自动生成内容分析、口播、Visual Script 或 Remotion 代码。
- Web UI 代码放在 `harness/` 内，Remotion 的 `src/Root.tsx` 和现有视频目录不承担管理后台职责。

Web UI 必须复用 Harness 的阶段契约和状态文件，不能在前端复制一套阶段判断、Gate 规则或渲染状态模型。真实视频内容、画面质量和 Gate 人工判断仍以现有生产资料和项目规范为准。

## 端到端试点的人工 Gate 与内部审查

端到端试点不在每份 Markdown 生成后单独停下来确认。Gate 1 默认由 Agent 完成内容一致性、事实边界、叙事关系和基线结构审查；只有遇到无法从源文档判断的重大取舍，才向用户提出单点问题。需要用户直接判断画面和交付质量的阶段，仍保留人工确认：

- Gate 1：完成 `content-analysis.md`、`video-narrative.md` 和 `scene-script.md`，由 Agent 完成核心命题、信息取舍、叙事路径、Scene 拆分、Video Value 和基线结构审查；默认不暂停等待用户逐篇确认。
- Gate 2：完成 `narration-script.md`、`visual-script.md` 和 `visual-prototype.html`，统一确认口播、视觉表达、声音与画面的互补关系、构图和信息密度；同时逐项检查所有画面文字是否能在当前视频的生产资料中找到依据。参考视频只允许提供格式、风格和交互结构参考，不得把其业务语义、固定文案或状态文字带入当前视频。
- `tts-script.json` 内部审查：由 Agent 自动完成 Scene／Segment 数量、ID、空文本、口播覆盖和内部制作文字检查；不单独暂停等待用户确认。
- TTS 质检：确认发音、声音自然度、目标语速、停顿、字幕文本和字幕时间；这是进入 Remotion 前的阻塞性检查点，不单独计入正式 Gate 数量。
- Gate 3：确认 Remotion 音画预览中的同步、字幕、动画节奏、信息密度和溢出情况；确认所有进入 Composition 的画面文字都与当前视频内容相关，并完成最终输出清洁画面检查，移除或隔离预览导航、调试文字、辅助说明和其他不应进入 MP4 的内容。
- Smoke Render 检查：确认远程冒烟结果、代表帧、字体、资源和音轨后，才允许进入完整渲染；代表帧和短片还必须通过画面文字相关性与清洁输出检查。这是远程渲染流程中的阻塞性检查点。
- Gate 4：确认最终完整 MP4 的内容、声音、字幕、画面和交付质量；再次确认最终文件不包含预览辅助控件、调试信息、参考视频残留文案或其他无关画面文字。

Gate 不通过时，依据问题回退到对应的内部生产阶段；不默认从源文档重新开始。`content-analysis.md` 单独生成完成后，不要求用户单独确认，必须与后续两份内容方案资料一起完成 Gate 1 内部审查。

## Narration Script 与 TTS 输入边界

- `narration-script.md` 是面向人工确认的口播文档，Scene 下只能放实际需要朗读的内容；不得把“本段口播作用”、视觉说明、制作备注、Gate 检查清单或其他内部说明放进 Scene 的口播段落中。
- TTS 不直接消费整份制作文档。Gate 2 通过后，必须先从纯口播的 `narration-script.md` 派生独立的 `tts-script.json`，完成 Scene／Segment 拆分和 TTS 文本清理，再把 `tts-script.json` 交给 TTS。
- narrated 视频的 TTS 默认语速为 `+25%`；调用 TTS 前必须显式检查并传入 `--rate +25%`，除非用户明确指定其他语速。当前 `claude-code-third-party-models` 已生成的 `+0%` 音频保持不变，不回溯重做。
- 生成字幕时，去掉每条字幕文本句末的标点符号；句内标点符号保留。该清理只作用于字幕展示文本，不得修改 TTS 朗读文本、音频或时间轴；字幕来源一致性校验应按“应用此规则后的字幕文本”进行。
- 音频、字幕和时间轴只能从经过 Agent 校验并在 Gate 2 冻结的 `tts-script.json` 生成；交给 TTS 前必须检查生成的 Segment 中没有内部制作文字。
- 参考格式以 `videos/claude-code-what-is/narration-script.md` 为准：标题和分隔线可以存在，但每个 Scene 下的正文必须全部是实际口播。

## 单条视频生产资料的基线复用

- 制作新视频的目标是复用已经验证的视频生产方法和交付格式，不是为每条视频重新设计文档层级、描述风格、视觉语言或原型交互。
- 在没有经过用户确认的新基线前，`videos/claude-code-what-is/` 中同名文件是七层生产资料的格式基线。新主题可以改变知识内容、Scene 数量和具体画面，但各文件的职责、标题层级、描述粒度和上下游边界应保持一致。
- `narration-script.md` 沿用基线中的纯口播结构；`visual-script.md` 沿用“全局视觉原则 → 逐 Scene 视觉设计 → 全片视觉类型／组件／动画标准 → 下一步”的结构；`visual-prototype.html` 沿用 Scene 容器、幕内预览字幕、上一幕／下一幕／自动播放和进度提示的原型结构。
- 不允许因为新主题内容不同就另起一套生产资料模板。现有基线确实无法表达需求时，必须先指出缺口、说明准备新增的结构及其影响，获得用户确认后再扩展。
- 每个 Gate 提交人工确认或完成内部审查前，必须把新视频的同名文件与基线文件做一次结构和交付边界对照；不能只检查 Scene 数量或 Markdown 是否能打开。
- 每个 Gate 进入下一阶段前，必须执行画面文字语义归属检查：所有标题、标签、按钮、状态、终端输出和卡片文案都必须能追溯到当前视频的 Source、Content Analysis、Video Narrative、Scene Script 或 Visual Script；参考视频中的业务语义、固定文案和状态文字不得复用。

## MVP 验证目标

第一阶段只验证一件事：

> 能否用固定 Remotion 工程、固定单条视频生产资料规范、横屏 Visual Prototype 和通用场景组件，稳定做出一条 Claude Code 教程横屏预览样片，并为后续视频复用打基础。

第一条样片：

- 视频 slug：`claude-code-what-is`
- 视频主题：`Claude Code 到底是什么？`
- Composition ID：`claude-code-what-is`
- 输出路径：`out/claude-code-what-is.mp4`

成功标准：

- 先产出一版横屏 Visual Prototype，用于确认整体画面语言、构图、信息密度和每个 Scene 的视觉事件。
- 静态预览确认前，不继续修改正式 Remotion 视频逻辑。
- 用户确认静态预览后，再进入 Remotion 横屏实现。
- 能启动 Remotion Studio 预览。
- 能看到一条 16:9 横屏教程预览样片。
- 视频时长由内容决定：无音频版本按逐句字幕的正常口播时长、必要停顿和画面主要元素完成入场时间确定；有本地人工音频时，以音频真实时长和 SRT 时间轴为准，不用固定总时长反推内容。
- 画面优先复用基础场景组件，但视频 Scene 数量按视觉事件和认知变化决定。
- 字幕和主文字在 1920 × 1080 下可读、不明显溢出。
- 能根据自然语言反馈优先修改静态预览、配置或文案，并在预览中看到变化。
- 用户确认 Remotion 预览后，再渲染出 `out/claude-code-what-is.mp4`。

## 第一阶段范围

本节约束现有 MVP 样片的范围，不阻止已经启动的单条端到端验证视频。端到端试点允许在 Gate 2 通过后使用项目既定 TTS 入口接入 TTS，但仍只验证一条 `narrated` 视频，不代表通用自动 TTS 或自动化视频平台已经实现。

只做：

- 16:9 横屏教程视频。
- 1920 × 1080。
- 30fps。
- 正式 Remotion 实现前，先做无依赖 HTML + CSS Visual Prototype。
- Visual Prototype 用于确认横屏构图、视觉事件、屏幕文字、状态变化和动画说明，不追求最终动画还原。
- 时长根据内容确定，不设置固定总时长；无音频预览样片优先按字幕正常口播时长、场景尾部短暂停顿和画面元素入场下限来确定节奏，不为了满足某个秒数硬拉静止画面或压缩讲解。
- 用户提供的本地人工音频和 SRT 字幕，用于 Remotion Studio 预览同步。
- Claude Code / AI 工具教程类内容。
- Markdown 视频脚本文档。
- Visual Prototype 文档。
- TypeScript 视频配置。
- 场景级字幕。
- 无真实配音版本。
- 软件界面、终端、文件树、代码编辑器、diff、任务状态、对比画面等过程化表达。

不做：

- 9:16 竖屏继续优化。
- 方屏 1:1。
- 真实配音录制和剪辑。
- 自动 TTS。
- 逐字字幕高亮。
- 自动字幕对齐。
- 批量生成。
- 后端服务。
- 数据库。
- 登录系统。
- 云渲染。
- 可视化编辑器。
- 拖拽时间轴。
- 自动素材搜索。
- 复杂录屏剪辑。
- 真人实拍精剪。
- 复杂 3D、粒子或电影级转场。

## 内容与配置规则

采用七层生产资料结构：

1. Source：保存原始文章、文档或输入材料。
2. Content Analysis：提取核心命题、知识骨架、关系和可视觉化内容。
3. Video Narrative：按观众认知过程重新组织视频叙事。
4. Scene Script：拆分 Scene，并明确每个 Scene 的认知任务和 Video Value。
5. Narration Script：基于 Scene Script 生成口播稿。
6. Visual Script / Visual Prototype：描述并验证画面结构、视觉动作、状态变化和信息密度。
7. TypeScript 视频配置：描述「如何被 Remotion 渲染」。

第一阶段允许手工从单条视频生产资料同步到 TypeScript 配置，不做自动解析器。

时长规则：

- 视频总时长不在初期固定规定，由内容自然决定。
- 有明确口播的视频，优先采用音频驱动流程：先确定脚本文案，再生成或录制音频，再制作逐句字幕时间轴，然后用音频真实时长和逐句字幕时间轴反推场景时长，最后生成 `video.config.ts`。
- 有明确口播且用户提供本地人工音频和 SRT 字幕时，视频总时长以音频真实时长为准，字幕显示以逐句 SRT 时间轴为准，不再用预设场景时长去硬配音频和字幕。
- 无明确口播的视频，沿用原始内容驱动方案：按画面内容、逐句字幕的正常阅读或口播估算时长、必要停顿和画面主要元素完成入场时间确定每个场景时长。
- 场景时长不能短于画面主要元素完成入场所需时间，避免列表、终端输出或总结要点还没出现就切走。
- 如果无明确口播视频估算后的总时长不适合短视频，优先调整脚本文案的信息密度，而不是强行拉长静止画面或压缩正常讲解节奏。
- 本地原始素材放在 `local/<video-slug>/`；Remotion 可播放资源放在 `public/local-assets/<video-slug>/`，并保持不提交到 Git。

约定路径：

- 单条视频生产资料目录：`videos/<video-slug>/`
- 原始内容：`videos/<video-slug>/source.md`
- 内容分析：`videos/<video-slug>/content-analysis.md`
- 视频叙事：`videos/<video-slug>/video-narrative.md`
- Scene 脚本：`videos/<video-slug>/scene-script.md`
- 口播稿：`videos/<video-slug>/narration-script.md`
- 视觉脚本：`videos/<video-slug>/visual-script.md`
- 视觉原型：`videos/<video-slug>/visual-prototype.html`
- 单条视频审查记录：`videos/<video-slug>/reviews/*.md`
- 视频配置：`src/videos/<video-slug>/video.config.ts`
- 视频主组件：`src/videos/<video-slug>/<VideoName>Video.tsx`
- 通用场景组件：`src/scenes/*.tsx`
- 通用基础组件：`src/components/*.tsx`
- 类型和时间工具：`src/lib/*.ts`

制作新视频时，优先只新增或修改：

- `videos/<video-slug>/source.md`
- `videos/<video-slug>/content-analysis.md`
- `videos/<video-slug>/video-narrative.md`
- `videos/<video-slug>/scene-script.md`
- `videos/<video-slug>/narration-script.md`
- `videos/<video-slug>/visual-script.md`
- `videos/<video-slug>/visual-prototype.html`
- 用户确认视觉原型后的 `src/videos/<video-slug>/video.config.ts`
- 必要素材目录
- 本地人工音频和 SRT 字幕对应的静态预览资源

除非现有场景表达不了需求，否则不要新增场景组件。用户确认 Visual Prototype 前，不继续修改正式 Remotion 视频逻辑。

## 第一阶段场景组件

第一阶段只实现并优先复用以下 6 个场景：

- `OpeningScene`：开场问题或标题钩子。
- `ConceptScene`：解释一个核心概念。
- `ComparisonScene`：左右对比或两种工作方式对比。
- `StepListScene`：步骤、流程、方法论逐项展示。
- `TerminalScene`：模拟终端命令和输出。
- `SummaryScene`：结尾总结和核心观点收束。

不要为了第一条样片额外创建大量场景组件。需要新增组件时，先确认现有 6 个组件确实表达不了。

## 技术约束

- 使用 Remotion。
- 使用 React / TypeScript。
- Node.js 版本必须为 18 或更高。
- 项目应能通过 `npm install` 安装依赖。
- Visual Prototype 应优先使用无依赖 HTML + CSS，直接用浏览器打开查看。
- 项目应能通过 `npm run preview` 或 `npx remotion studio` 启动 Remotion Studio 预览。
- 项目应能在用户明确要求渲染时通过 `npm run render` 渲染视频。
- 不引入与 MVP 无关的新依赖。
- 不引入数据库、后端服务、登录系统、部署配置。
- 不引入复杂状态管理。
- TypeScript 版本继续固定为 `~5.8.3`，不要随意升级。

## 代码约束

- 代码优先简单清晰，不要过度抽象。
- 每个场景组件只解决一种表达形式。
- 视觉方向优先通过 Visual Prototype 确认。
- 自然语言反馈优先转成单条视频生产资料、视觉原型或 `video.config.ts` 修改。
- 内容问题优先改 `videos/<video-slug>/` 下的生产资料。
- 视觉表达能力不足时才改场景组件。
- 不要每条视频重新设计目录结构、视觉风格或动画体系。
- 不为一次性样片创建复杂配置系统。
- 不引入图标库、动画库、UI 组件库，除非用户确认。
- Composition ID 必须明确，并在最终说明里写出来。
- 关键动画优先使用 Remotion 基础能力：
  - `useCurrentFrame()`：获取当前帧。
  - `interpolate()`：做淡入、位移、缩放等过渡。
  - `spring()`：做弹性进入效果。
  - `Sequence`：组织场景时间线。
- 如果使用延迟动画，必须避免传给 `spring()` 的帧数为负数。

## 视觉约束

- 整体风格：干净、科技感、克制、教程感。
- 背景优先深色，不要花哨。
- 字体层级清楚：标题最大，副标题次之，字幕和说明文字更小。
- 横屏主文案控制在 1-2 行，给软件界面、终端、文件树和代码区域留出主体空间。
- 字幕控制在 1-2 行，避免贴边。
- 列表项不超过 5-6 个。
- 动画不要过快，避免一闪而过。
- 发光效果要轻，不要刺眼。
- 画面元素不要太多，优先保证可读和节奏清楚。

## 工作流程

必须按以下顺序执行：

1. 更新项目规范：先改 `CLAUDE.md`，再按新规范执行。
2. 更新真实进度：同步维护 `ROADMAP.md`。
3. 查阅 `docs/VIDEO-PRODUCTION-RULES.md` 和 `docs/VIDEO-PROJECT-WORKFLOW.md`；`docs/article-to-video-complete-workflow-summary.md` 作为完整流程说明书，只有需要了解完整背景时再查阅，不作为日常执行规则。
4. 在 `videos/<video-slug>/` 中编写或更新 `source.md`。
5. 连续编写或更新 `content-analysis.md`、`video-narrative.md` 和 `scene-script.md`，运行内容资料一致性检查并完成 Gate 1 内部审查，不默认暂停等待用户确认。
6. Gate 1 通过后，连续编写或更新 `narration-script.md`、`visual-script.md` 和 Visual Prototype：`videos/<video-slug>/visual-prototype.html`，完成后进入 Gate 2。
7. Gate 2 通过后，冻结 Narration Script；`narrated` 视频由 Agent 派生并校验 `tts-script.json`，再调用项目既定 TTS，`visual-only` 视频跳过 TTS，按视觉事件建立内容驱动时间轴。
8. `narrated` 视频接收并校验 TTS 音频、字幕和时间数据，完成人工 TTS 质检；校验或质检未通过时，回退到对应的 TTS Segment 或 Narration Script。
9. 编写或更新 TypeScript 视频配置，必要时实现或修改场景组件和基础组件。
10. 检查 Node.js 版本：`node --version`。
11. 安装或同步依赖：`npm install`。
12. 运行类型检查和资源、Manifest 校验：`npm run check` 及对应确定性校验命令。
13. 启动 Remotion Studio 预览：`npm run preview`。
14. 在 Remotion Studio 中检查画面、节奏、字幕、音频同步和文字溢出，进入 Gate 3。
15. 根据用户反馈优先修改单条视频生产资料、Visual Prototype 或配置；修改后从最早受影响阶段恢复。
16. 用户明确要求渲染时，按 Smoke Render 检查和最终 Gate 流程执行远程渲染。

重要规则：

- Visual Prototype 阶段用于低成本确认画面语言、横屏构图、信息密度和状态变化。
- 用户确认 Visual Prototype 前，不继续修改正式 Remotion 视频逻辑。
- Remotion Studio 预览阶段用于调动画、字幕、音频同步和最终画面效果。
- 预览页面中的上一幕／下一幕、自动播放、进度提示、调试标记和制作辅助说明只服务于预览，不得进入最终 Composition 或 MP4；渲染前必须执行一次清洁画面检查。
- 默认不讨论、不建议、不执行渲染；只有当用户明确说需要渲染时，才说明渲染命令、渲染前提或执行渲染。
- 渲染只在最后执行，不要每改一次就渲染一次。
- 用户明确要求渲染时，统一使用 GitHub Actions；本机不执行 Remotion MP4 渲染。触发远程渲染后，不持续高频轮询或逐分钟汇报，默认等待约 20 分钟后再检查一次 Run 状态和 Artifact；除非用户另有要求，不改变这个检查节奏。
- 如果 Composition ID 不确定，先查代码或 Remotion Studio，不要猜。
- 如果渲染阶段需要下载 Chromium 组件，网络卡住时说明原因，不要瞎改代码。

## Claude Code 上下文管理

为避免 Claude Code 反复出现 `API Error: 422 Your input exceeds the context window of this model`，工作时必须控制上下文体积：

- 长驻命令必须谨慎使用，尤其是 `npm run preview`、`npx remotion studio`、`npm run dev`、watch 模式、开发服务器和可能持续输出日志的命令。
- 启动预览类命令只用于确认服务能启动或供浏览器检查，不要让 Claude 持续读取无限日志；检查完成后应停止仍在运行的后台任务。
- 不要把完整构建日志、完整渲染日志、超长终端输出、大型 JSON、大段 diff、整段 transcript 或无关文件全文塞进上下文。
- 排查失败时优先保留关键错误、失败用例、错误栈和最后 50-100 行日志；需要更多信息时再按关键词精准检索和局部读取。
- 读取文件时优先读取目标文件和相关片段，不做无目的全项目扫描；本项目常规优先读取 `CLAUDE.md`、`ROADMAP.md`、目标脚本、目标视频配置、对应主组件和相关场景组件。
- 不读取或粘贴 `node_modules`、构建产物、`out` 中的大文件、无关缓存文件和大体积媒体内容，除非用户明确要求且确有必要。
- 使用图片、截图、浏览器快照时只保留与判断相关的信息；不要反复把多张大图或完整页面快照带入同一会话。
- 长任务应分阶段总结当前状态、已完成事项、阻塞和下一步；会话变长或读过大量内容后，优先用简短状态摘要接续，而不是继续堆叠旧上下文。
- 一旦出现 422 上下文超限错误，不要在原会话里反复重试；应先停止仍在运行的 shell 任务，再新开会话，用简短状态摘要恢复工作。
- 新会话恢复时不要复制上个会话全文，只提供目标、已完成、当前阻塞、必要路径和下一步，并让 Claude 重新读取必要文件。
- 最终汇报只保留关键结论、改动路径、验证结果和必要下一步，避免长篇复述中间过程。

## 常用命令

检查 Node.js：

```bash
node --version
```

安装依赖：

```bash
npm install
```

类型检查：

```bash
npm run check
```

启动预览：

```bash
npm run preview
```

渲染视频：

```bash
npm run render
```

渲染命令只能在用户确认预览后执行。

## 验证清单

完成第一阶段实现后必须确认：

- [ ] 已生成 `videos/claude-code-what-is/visual-prototype.html` 横屏 Visual Prototype。
- [ ] 静态预览为 16:9 横屏，按 1920 × 1080 构图设计。
- [ ] 静态预览符合真实任务、展示过程、状态变化、屏幕文字克制的设计原则。
- [ ] 用户确认 Visual Prototype 后，再进入正式 Remotion 横屏实现。
- [ ] `node --version` 显示 Node.js 18+。
- [ ] `npm install` 成功或现有依赖可用。
- [ ] `npm run check` 通过。
- [ ] `npm run preview` 能启动 Remotion Studio。
- [ ] Remotion Studio 中能看到 Composition ID：`claude-code-what-is`。
- [ ] 正式视频规格为 1920 × 1080、30fps，场景时长与字幕口播节奏匹配。
- [ ] 各视觉事件按顺序出现。
- [ ] 字幕可读，主文字不明显溢出。
- [ ] 所有画面文字都能追溯到当前视频生产资料，未带入参考视频的业务语义、固定文案或状态文字。
- [ ] 最终输出清洁画面检查通过，预览导航、调试标记、辅助说明和其他无关内容不会进入 MP4。
- [ ] 至少根据一句自然语言反馈修改过一个明确细节。
- [ ] 修改后预览能看到变化。
- [ ] 用户明确要求渲染后，再执行 `npm run render`。
- [ ] Smoke Render 的代表帧和短片已通过画面文字相关性与清洁输出检查后，才进入完整渲染。
- [ ] `out/claude-code-what-is.mp4` 文件存在。
- [ ] 最终说明里写清楚 Composition ID、预览命令和验证结果；只有已渲染时才写渲染命令和输出路径。

## Roadmap、清单与制作沉淀维护规则

每次完成开发、修复、文档补齐或重要调研后，必须同步更新 `ROADMAP.md`。

`ROADMAP.md` 只用于快速恢复当前项目上下文，不作为永久历史日志。内容应优先回答：当前进行到哪里、下一步做什么、有哪些阻塞、哪些坑需要避免。

- 「已完成」只保留最近 10 条关键完成记录，新增第 11 条时删除最旧且已失去当前参考价值的一条。
- 「最近验证」只保留最近 10 条验证记录，新增第 11 条时删除最旧的一条。
- 「当前阶段」「进行中」「下一步」各自最多保留 5 条，每条只表达一个必要结论；只保留足以让新会话判断当前位置和后续动作的信息，不记录实现过程。
- 「当前阶段」「进行中」「下一步」中的事项完成、失效或被替代后直接更新或删除，不转为冗长的阶段历史。
- 已被后续方案替代、与当前执行无关或在其他文档已有完整记录的历史，不继续堆积在 `ROADMAP.md`。
- 可复用的制作问题、根因和解决方案写入 `docs/video-production-notes.md`；`ROADMAP.md` 只保留当前阶段仍需注意的简短避坑提示和对应文档入口。
- 「进行中」「下一步」「阻塞」必须保持为当前真实状态，确保新会话只读 `CLAUDE.md` 和 `ROADMAP.md` 就能继续工作。

`local/mvp-feature-checklist.md` 记录第一版最小 MVP 主要功能清单。之后每完成一个功能，必须同步更新该文档，把对应功能标记为已完成，并补充完成依据或验证状态。

`docs/video-production-notes.md` 记录视频制作过程中遇到的问题、根因、解决方案、复用流程和可写成教程文章的经验。遇到字幕同步、音频处理、场景节奏、Remotion 配置、渲染问题或形成新流程时，先查阅该文档；如果本次工作产生了可复用经验，完成后必须补充进去。

只有已经实现并验证过的事项才能放进「已完成」。做完代码但未验证时，不得把事项标为已完成。

## 后续扩展边界

只有当第一条横屏样片完成并用第二条视频验证复用价值后，才考虑扩展：

- 第二条 Claude Code 教程视频。
- `CodeBlockScene`。
- `ScreenshotScene`。
- 人工配音导入。
- 字幕时间轴。
- 封面图导出。
- 系列视频目录。
- 批量渲染。
- 自动 TTS。
- 逐字字幕高亮。

不要在第一阶段就做这些扩展。

## 交付说明要求

每次完成开发或重要修改后，最终回复必须包含：

- 改了什么。
- 如何预览。
- Composition ID。
- 哪些验证已完成，哪些因为环境或用户确认未完成。
- 只有已经执行渲染时，才说明渲染命令和输出文件路径；默认不主动提渲染。
