# CLAUDE.md

本文件用于约束 Claude Code 在当前目录实现和维护 Remotion AI Video MVP 工程。若与历史 demo 约束文档 `remotion-video-demo-constraints.md` 冲突，以本文件为当前执行规范；需要调整实践时，先更新本文件，再改代码。

## 项目定位

当前目录是 Remotion AI Video MVP 工程目录，用于验证「原始内容 → Content Analysis → Video Narrative → Scene Script → Narration Script → Visual Script → Visual Prototype → 人工确认 → Remotion 场景实现 → Studio 预览 → 人工确认 → MP4 渲染」的可复用视频生产流程。

当前目标不是完整视频平台、剪辑软件、素材管理系统或自动化视频工厂。

历史说明：`HelloIntro` 只是早期 Remotion 技术 spike，用于确认环境可运行；它不再作为后续架构、组件或视觉设计基础。

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
5. 编写或更新 `content-analysis.md`，用户确认后再继续。
6. 编写或更新 `video-narrative.md`，用户确认后再继续。
7. 编写或更新 `scene-script.md`，用户确认后再继续。
8. 编写或更新 `narration-script.md`，用户确认后再继续。
9. 编写或更新 `visual-script.md`，用户确认后再继续。
10. 编写或更新 Visual Prototype：`videos/<video-slug>/visual-prototype.html`。
11. 用户确认 Visual Prototype。
12. 编写或更新 TypeScript 视频配置。
13. 实现场景组件或基础组件。
14. 检查 Node.js 版本：`node --version`。
15. 安装或同步依赖：`npm install`。
16. 运行类型检查：`npm run check`。
17. 启动 Remotion Studio 预览：`npm run preview`。
18. 在 Remotion Studio 中检查画面、节奏、字幕和文字溢出。
19. 根据用户反馈优先修改单条视频生产资料、Visual Prototype 或配置。
20. 用户明确要求渲染时，再渲染：`npm run render`。

重要规则：

- Visual Prototype 阶段用于低成本确认画面语言、横屏构图、信息密度和状态变化。
- 用户确认 Visual Prototype 前，不继续修改正式 Remotion 视频逻辑。
- Remotion Studio 预览阶段用于调动画、字幕、音频同步和最终画面效果。
- 默认不讨论、不建议、不执行渲染；只有当用户明确说需要渲染时，才说明渲染命令、渲染前提或执行渲染。
- 渲染只在最后执行，不要每改一次就渲染一次。
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
- [ ] 至少根据一句自然语言反馈修改过一个明确细节。
- [ ] 修改后预览能看到变化。
- [ ] 用户明确要求渲染后，再执行 `npm run render`。
- [ ] `out/claude-code-what-is.mp4` 文件存在。
- [ ] 最终说明里写清楚 Composition ID、预览命令和验证结果；只有已渲染时才写渲染命令和输出路径。

## Roadmap、清单与制作沉淀维护规则

每次完成开发、修复、文档补齐或重要调研后，必须同步更新 `ROADMAP.md`。

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
