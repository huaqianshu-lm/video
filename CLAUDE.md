# CLAUDE.md

本文件是当前 Remotion AI Video MVP 工程的项目级核心规范。全局约束来自 `~/.claude/CLAUDE.md`；本文件只保留所有项目任务都需要知道的边界、不可变约束和按需加载入口。

## 项目定位

本项目用于验证并产品化一套可复用的视频生产 Harness：

`原始内容 → 合并策划 → Gate 1 内部检查 → 口播与 Storyboard 联合收敛 → Gate 2 → TTS／字幕／真实 Timeline → Agent 编写的 Remotion → Gate 3 实际观看与试听 → 共享渲染交付 → Gate 4`

Harness 只服务于视频生产，不扩展为处理代码、数据或其他任务的通用 Harness。一次性的视频内容和具体视频产物属于本地工作资料，不属于仓库长期能力。

所有视频生产入口（包括对话）必须由 Harness 调度；Agent 是领取任务并制作产物的执行者，不自行推进阶段。统一任务、策划合并、试听审核及共享交付的权威契约见 `docs/HARNESS-PRODUCTION-CONTRACT.md`；旧项目仅保留历史读取，不符合当前规则的未完成视频通过正常返工补齐；completed 永久只读。

渲染方式以 `docs/RENDER-DELIVERY-BASELINE.md` 为权威来源：单条新交付默认本地，可显式选择 GitHub；批量只允许 GitHub。所有方式复用 render-delivery prepare／start／resume，保留人工 Gate。没有 backend 字段的旧交付／Job 解释为 GitHub，恢复不得切换方式。下文远程认证、发布、提交和派发要求仅适用于 GitHub；本地无需发布、commit 或 push。接入及跨视频验收状态见 ROADMAP.md。

当前唯一生产流程为 `storyboard-v1`，新建统一使用现行分镜契约（内部格式标识 `storyboardSchemaVersion: 3`），不提供流程或版本选择。权威来源为 `docs/STORYBOARD-PRODUCTION-CONTRACT.md`：Storyboard 按 Scene → Shot → Event 整合场景与镜头／视觉变化设计，Gate 2 审核口播与分镜方案，Gate 3 审核实际画面与试听。生产不要求 HTML 原型、独立 Scene Script／Visual Script 或旧 visual-self-review.json。legacy-v1／unified-v1 和旧分镜格式仅供历史读取，不能继续生产；未完成视频通过正常返工补齐当前规则，不自动改写历史状态。

当前唯一生产 Workflow 为 `narrated-tutorial-v1`：阶段按当前 Storyboard 契约组织，保留人工 Gate、TTS、字幕和 narrated Timeline。历史项目缺少 `workflow` 或使用兼容值 `default` 时，运行时解释为该 Workflow，不批量改写历史状态。

`product-promo-v1` 已退役，不允许新建、制作、批处理、打包或渲染。已完成宣传片只允许读取资料、展示历史记录及使用已有输入包进行本地预览；`src/components/promo/`、`src/lib/promoTypes.ts` 和 `src/lib/promoTiming.ts` 仅保留为历史视频预览依赖。不得修改历史视频及其状态或产物。

Workflow 的判断以 Harness 服务端 Registry 和项目 `project.json.workflow` 为事实来源，不根据目录或 Style 推断。生产目录只提供口播教程；退役 Workflow 的只读兼容不提供生产执行器。

## 规则分层与按需加载

- 本文件：项目定位、仓库边界、核心不变量、Skill 路由和验证要求。
- `.claude/skills/`：只在对应任务发生时加载的操作流程和专项规则。
- `docs/`：稳定、可共享的详细规则和工作流参考，不在本文件中重复全文。
- `drafts/`：实施方案、讨论结果、临时设计和被替代方案，不具有规范效力。
- `notes/`：本地问题记录和经验沉淀，不作为远端执行的唯一规则来源。

按任务加载 Skill：

- 新建或修改视频生产资料：读取 `.claude/skills/video-production/SKILL.md`。
- Agent 新视频的系列选择、封面快照和统一片头：读取 `docs/AGENT-SERIES-COVER.md`；先列出实际系列名称与封面状态，由用户选择，不根据文件名自动归类。
- 处理口播、TTS、字幕或 Timeline：读取 `.claude/skills/narrated-video-tts/SKILL.md`。
- 处理 Storyboard 实现、Remotion、音画对齐或 Gate 3：读取 `.claude/skills/visual-prototype-remotion/SKILL.md`。
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

- `videos/`：具体视频的生产资料和审核记录；旧原型仅为历史资料。
- `src/videos/`：具体视频配置和 Remotion 主组件。
- `assets/`、`series/`、`local/`、`out/`：视频资源、系列资料、本地运行资料和渲染产物。
- `drafts/`、`notes/`：过程方案、项目笔记和经验记录。
- `*.mp4`、`*.mp3`、`*.wav`、`*.m4a`、`*.webm` 等本地媒体。

具体视频目录不得成为远端仓库唯一的模板或规范来源；需要复用的结构必须提取到 `templates/` 或 Skill 的 `references/`。

## 不可变核心约束

- 视频默认采用 16:9、1920 × 1080、30fps；视频时长由内容或真实音频决定，不用固定总时长硬拉或压缩内容。
- 视频生产保留人工 Gate。Agent、Harness 和远程任务不得自动通过 Gate，不得用“已有文件校验”伪装成真实制作完成。
- 已标记为 `completed` 的视频永久只读。一旦视频进入该状态，任何后续任务、Agent、Harness、Web UI、批处理、渲染、状态刷新、校验、修复、规则迭代、数据转换或其他操作都不得修改该视频的内容、生产资料、Remotion 配置和代码、音视频／字幕／Timeline／Manifest、Gate／审核记录、状态、阶段、进度、尝试次数、Job／任务记录及其他相关产物；只允许只读检查和展示。若必须产生新版本，只能创建新的视频标识或独立副本，不得回写原视频。
- `narration-script.md` 的 Scene 正文只能是实际口播；Gate 2 后必须先生成并校验独立的 `tts-script.json`，音频、字幕和 Timeline 只能从它生成。
- narrated 视频默认显式使用 TTS `+25%` 语速；字幕展示文本去掉句末标点，但不能修改朗读文本、音频或时间轴。
- Remotion 必须使用已校验的 Timeline Manifest 作为 narrated 视频的时间基准，并保持 Scene、Audio、Subtitle 和视觉事件的映射一致。
- 新视频的每个 Scene 要有明确的视觉焦点和可观察的状态／关系变化，旧主体应在新主体出现时让位或有意保留；允许为阅读和理解静置，不以持续运动或镜头次数代替视觉质量。Storyboard 和Agent 编写的 Remotion 必须表达同一条变化链，Gate 2 检查方案与设计审计，Gate 3 检查真实时序下的实际画面。
- 口播教程进入 Gate 2 前必须完成当前分镜设计审计；Gate 3 前必须提交绑定当前冻结、实现及真实音频的观看／试听证据。结构、类型、文件、状态或指纹校验不能代替实际画面质量。方案不通过时返工 Storyboard，实际画面不通过时按影响范围返工，不绕过人工 Gate。
- 画面中的标题、标签、按钮、状态、终端输出和卡片文案必须能追溯到当前视频资料，不得复制参考视频的业务语义或固定文案。
- 每条系列视频的最后一个视觉事件必须包含有资料依据的下一集预告；系列封面、风格和成员关系按需读取对应 Skill。
- 远程渲染前必须验证代码、配置和资源包的提交状态；不得使用 `git add .`。完整渲染交付入口必须先展示精确文件清单并获得用户明确确认，之后才可为本次交付定向 commit／push；Smoke Render 仅作为新系列或渲染环境变化时手动运行的独立检查，不推进生产阶段。
- 所有入口复用已有成功 Render 时，整理交付清单前必须在实际交付工作区运行 `harness/src/render-preflight.mjs` 并保存通过报告；认证、代码基线及独立输入包发布步骤以 `docs/RENDER-DELIVERY-BASELINE.md` 为权威来源。统一服务已接入对话／CLI、Web UI 和批量；实际入口与跨视频验收状态见 ROADMAP.md。该检查不代替人工 Gate 和交付授权。
- 具体视频的远程渲染输入必须通过被 Git 忽略的 `local/render-input/<video-slug>/` 整理，并以独立输入包 URL 和 SHA-256 交给 GitHub Actions；不得把 `videos/`、`src/videos/` 或视频资源重新加入能力代码仓库。
- 所有完整渲染入口复用 `render-delivery prepare／start／resume` 服务；批量合并精确文件计划一次提交，每条视频独立输入包和 Job。按 `docs/RENDER-DELIVERY-BASELINE.md` 复用固定方法配置，准备阶段不提交、推送或派发；用户明确确认后执行交付，中断恢复同一 Job。
- 口播教程使用 `videos/<slug>/`、`src/videos/<slug>/` 和 `assets/<slug>-assets.zip` 的 legacy-flat 路径。历史退役视频的命名空间保持只读，不能作为新生产入口。
- 本地 Studio 预览具体视频时，必须从独立输入包生成被忽略的 `src/RenderInputRoot.tsx` 临时入口；该入口支持注册单条视频或本地扫描后批量注册全部可匹配视频。受跟踪的 `src/Root.tsx` 只保留通用 Composition，不重新硬编码具体视频。

## 流程迭代与验收标准

- 视频制作授权与流程改造授权分开；阶段内部新增生成器、强制工具或表达限制，也属于流程变更，不得以内部实现为由隐藏或半路接入。变更确认、实际调用检查及未验收能力的使用边界，以 `docs/HARNESS-PRODUCTION-CONTRACT.md`“视频制作与流程变更的边界”为唯一详细来源；已明确授权的工作不重复请求确认。

当前工作是在现有项目内迭代、优化唯一生产流程，不要求整体搬迁项目或批量转换历史视频。流程与格式标识用于识别资料契约，不作为可选生产版本；未完成视频资料不符合当前要求时，通过正常返工补齐，completed 永久只读。历史中确实发生的数据转换或文件移动按事实记录，不能作为当前生产入口。

- 文档更新不自动改变运行时默认值或历史项目契约。修改涉及功能、流程、默认值或契约的规则后，交付说明必须明确区分“文档已更新”“功能已实现”和“实际入口已验证”，列出尚未落实的功能及影响，并同步记录到 `ROADMAP.md`；不得只报告文档完成，让用户误以为功能已经生效。仍需实现且用户尚未授权继续时，必须在文档更新完成后明确提示“功能尚未落实”，并询问“是否继续落实？”。已有实现授权时继续完成授权范围内的工作，不重复请求确认；实现完成但未验证时必须明确提示“已实现，尚未验证”。
- 修改阶段顺序、调用入口、任务包／执行器、产物或状态契约、校验及下游消费方式前，先列出受影响的发起入口、单条与批量路径、生产者、消费者、旧路径、文档和测试，并明确新旧契约及验收方式；只核对本次变更实际涉及的环节。
- 流程迭代可以分步实施，但每一步都必须保持可用且约定一致。旧路径要么继续受支持并经验证，要么明确停用；不得依赖未声明的回退、过期临时产物或仅靠局部校验掩盖新旧流程不一致。
- 只有任务说明、实现、校验、使用入口和适用文档／测试均已同步，并从实际入口走通受影响的完整路径，才能声明本次迭代验收完成。无法完成或无法验证时，在 `ROADMAP.md` 标记“实现中”“待实际入口验证”或“阻塞”，写明剩余环节、影响和恢复步骤；不得把局部可用写成整体完成。

## 成功验证的固化与后续复用（强制）

- 所有入口复用已有成功 Render 时，整理交付清单前必须执行统一服务的实际工作区预检并保存报告；权威步骤见 `docs/RENDER-DELIVERY-BASELINE.md`，实际入口及跨视频验收状态见 ROADMAP.md。机器检查不代替人工 Gate 和交付授权。

- 用户对试点视频或问题修复的验证，是对后续可复用流程的验收。不得把“本条视频成功”直接等同于“整个流程已修复”或“以后不会再出现”。必须记录成功所需的实际入口、执行环境与权限、认证来源、代码提交、Workflow／输入契约及 Run／Artifact 等证据；不得记录凭据值，具体视频证据保存在本地资料中，不回写已完成视频。
- 成功依赖宿主权限、临时工作区、远端补丁、手动操作或替代入口时，必须明确这些条件如何被下一条视频继承。通用修复必须进入能力代码和对应实际入口，操作要求必须进入权威规则；临时方案不能作为未声明的永久依赖。本地开发分支未包含已发布修复时，必须完成整合，或明确使用已验证的隔离交付路径并登记未完成的整合工作。
- 每条后续视频开始前，以及进入受影响的 TTS／Remotion／远程交付入口前，必须读取并核对已有成功基线，确认当前实际进程具备所需权限、认证和网络访问，当前代码包含已验证修复。涉及 GitHub 时按渲染 Skill 更新真实远端引用并核对成功 Run 的代码提交，不能只凭同名分支、旧缓存或上一条成功推断本次条件成立。条件不一致时先核实并纠正，不得重新从零猜测或要求用户重复完成已有效的配置。
- 重复问题必须修复到执行入口的前置检查、错误分类和恢复步骤，并以必要的回归检查防止再次误判；规则提醒不能替代程序约束。只补文档、只通过局部检查或只依赖 Agent 记忆时，只能报告“操作规则已补齐，机器约束／完整验证待完成”，不得报告“已根治”“彻底解决”或“固化完成”。
- 固化完成必须用另一条未完成或新建的视频，从实际使用入口走通受影响的完整路径，并按适用人工 Gate 验收。没有完成跨视频验证时，在 `ROADMAP.md` 明确标记“固化中／待跨视频验证”，列明剩余约束、影响和下一步；不得为了验证修改永久只读的已完成视频，也不得绕过原有授权和人工 Gate。

## 高层工作流

1. 读取对应 Skill 与当前契约，所有生产由 Harness 调度。
2. 登记 Source，合并制作 Content Analysis 与 Video Narrative，完成 Gate 1 内部检查。
3. 联合收敛 Narration Script 与 Storyboard，完成设计审计，进入 Gate 2 人工审核并冻结同版本方案。
4. 派生并校验独立 tts-script.json，显式 +25% 生成真实音频、字幕与 Timeline，完成机器质检。
5. 按冻结分镜及真实时间使用Agent 编写的实现，提交实际观看／正常速度试听证据，进入 Gate 3 人工审核。
6. Gate 3 通过后复用 render-delivery prepare／start／resume，保留精确计划确认；单条默认本地，可选 GitHub，批量只用 GitHub。渲染后进入 Gate 4。Smoke Render 仅为独立手动环境检查。
7. 资料不符合当前规则时，先用 storyboard-rework 展示正常返工范围，按同一计划执行／恢复；不自动改写历史视频，不继承失效审核。
8. 完成开发、修复、文档补齐或重要调研后同步 ROADMAP；重要阶段变化使用 record-project-event Skill。


详细流程按需查阅：

- `docs/VIDEO-PRODUCTION-RULES.md`：视频内容、Scene、视觉和质量规则；9.6 是教程片通用视觉与声音量化参数的唯一权威来源，9.7 规定调校配方留证与复用，14.4 规定设计及实际观看／试听的审美与感官自检；制作与审核按需读取，具体数值不在 Skill／模板重复维护。
- `docs/VIDEO-PROJECT-WORKFLOW.md`：当前资料链和 Video／TTS／Remotion 职责流程。
- `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md`：人工 Gate、TTS 回传和远程渲染架构。
- `docs/article-to-video-complete-workflow-summary.md`：文章到视频的完整背景说明。
- `docs/TTS-SETUP.md`：本地 TTS 环境和依赖配置。
- `harness/README.md`、`harness/VALIDATION-MATRIX.md`：Harness 使用和验证入口。

## 工程约束

- 使用 React、TypeScript 和 Remotion；Node.js 18+；TypeScript 继续固定为 `~5.8.3`。
- 先按内容设计画面，再选择合适组件；没有合适组件就编写所需实现。组件从持续视频制作中经过实际验证且有复用价值的实现逐步积累，不为复用改变表达，不预建组件库作为制作前置条件。具体提取与验证边界见 `docs/VIDEO-PRODUCTION-RULES.md` 13.3；时间基准继续使用 `src/lib/timing.ts`。
- 不引入数据库、登录系统、后端服务、复杂状态管理或与 MVP 无关的新依赖。
- 分镜按当前 schema 和内容表达需要设计；Gate 2 冻结后才实现正式画面，由 Agent 按冻结分镜编写正式 React／Remotion 画面，不使用统一画面生成器。
- 执行长驻命令、预览和渲染时控制日志体积，不读取 `node_modules/`、缓存、构建产物和大型媒体，除非任务确有必要。
- 修改完成后主动运行适用的检查；未验证的事项不得写成已完成。
- 默认只测试本次修改及其直接受影响行为；只有用户明确要求整套测试时，才运行整套生产回归或全项目回归。测试范围按 `docs/HARNESS-PRODUCTION-CONTRACT.md` 执行，不因共享模块或跨入口修改自动扩大。

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


画面由 Agent 按冻结分镜编写 React／Remotion，不使用统一画面执行器或固定动作白名单；实现、时间和观看证据契约见 docs/STORYBOARD-EXECUTION-QUALITY.md。
