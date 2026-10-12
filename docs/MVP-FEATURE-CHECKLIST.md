# 视频生产 MVP 功能清单

本文档记录仓库中可复用视频制作能力的 MVP 状态。完成能力后，同步补充实现路径和验证依据。具体视频的生产资料和渲染状态不在此记录。

## 状态说明

- `[x]`：该条限定范围内已有实现与验证依据；不代表所有入口或实际质量验收完成。
- `[ ]`：未完成、待验证或仍需用户确认。

## 当前生产迭代

- [x] 新建默认、旧流程阻断、正常返工和历史只读已实现；定向回归 45 项，证据见 local/current-production-iteration/acceptance.md。
- [ ] 新片实际画面／试听、真实交付与跨视频验收待完成；不将机器检查视为实片验收。

## 能力清单

- [x] Remotion 固定工程：16:9、1920 × 1080、30fps，内容驱动时长。
- [x] 当前资料链：Source、合并策划、纯口播与 Storyboard／设计审计、真实音频／Timeline、按冻结分镜编写的实现与交付。旧七层结构仅供历史读取。
- [x] 六个通用场景组件：Opening、Concept、Comparison、StepList、Terminal、Summary。
- [x] 配置驱动的通用视频实现。
- [x] Storyboard 方案冻结 → Agent 编写的 Remotion → 实际观看／试听的人工 Gate 契约；真实新片验收待完成。
- [x] 逐句字幕、音频驱动时间轴和 Timeline Manifest 契约。
- [x] 当前 Storyboard 公共字幕入口显式采用量化基线的字号及字距，TimedCaption 支持调用参数，其他调用默认值保留；定向类型检查、实际 React 输出及 Cue 起止边界检查通过，证据见 `local/flow-validation/15-permissions-v3/caption-verification.json`。
- [ ] 字幕有效字高、手机可读性及真实画面／试听验收；代码字号和结构检查不代表量化底线已经实测通过。
- [x] 审美与感官规则、调校配方留证模板已同步共享任务包、Gate 2／3 提示及设计输入版本；定向 4 项通过，实际 CLI context 识别旧审计过期，证据见 `local/aesthetic-review-integration/acceptance.md`。
- [ ] 六维感官检查的实片／人工 Gate 验收，以及调校配方的跨视频适用范围验证；模板及机器版本检查不代表实际质感已验证。
- [x] Gate 1 内部检查与 Gate 2／3／4 人工审核；Gate 2 检查口播与分镜方案，Gate 3 检查实际观看和正常速度试听，依据 current-production／storyboard-production 定向回归；旧独立试听仅供历史读取。Smoke Render 为独立手动环境检查。
- [x] Gate 2 后从纯口播派生并校验 `tts-script.json`。
- [x] TTS、Remotion 和完整 Render 的生产执行器边界；Smoke Render 使用独立 GitHub Actions 工作流，不推进 Harness。
- [x] Harness 四类批量任务、持久化 Job、失败重试和断点恢复。
- [x] Harness Web UI 的项目状态、任务状态、Gate 操作和远程任务查询。
- [x] CLI 按视频刷新已有远程 Job；只对账当前视频已派发的任务、不重新派发，并复用批次恢复回调；依据 `harness/test/jobs.test.mjs`。
- [x] 远程渲染资源包、Manifest、分支和 Git 交付预检。
- [ ] 本地渲染共享入口验收：单条默认 local／可选 github、批量仅 github 的代码与文档已接入；本地专项 34/34、全量 392/392 自动回归通过，新入口实片及跨视频验收待完成，见 ROADMAP.md 与 `drafts/LOCAL-RENDER-INTEGRATION-PLAN.md`。
- [x] 已绑定 Render Input ZIP 在副本时间戳变化后的重复打包保留原 SHA；依据 `harness/test/render-input.test.mjs`。
- [x] Agent／CLI 显式成功基线准备检查：`harness/src/render-preflight.mjs`，8 项专项回归及真实仓库正反例通过；固定输入包发布步骤见 `RENDER-DELIVERY-BASELINE.md`。
- [x] Agent 单条固定交付入口 `render-delivery prepare／start／resume`：复用方法配置、发布绑定、确认精确清单、定向提交推送及原 Job 恢复；`harness/test/render-delivery.test.mjs` 14/14，相关回归 86/86、兼容 89/89；真实成功基线预检通过。
- [x] 已知 Render Run 的本地超时对账：先检查远端实际结果，显式恢复同一 Job；过期 Artifact 不能推进 Gate 4，依据单条交付与 Job 回归。
- [ ] 固定入口在下一条新视频上的真实完整 Render／Gate 4 验收；Fixture 不代替实际成片。
- [ ] Harness 统一生产迭代验收：对话任务、策划合并、Gate 3 试听及 Web／批量共享交付已有自动回归；实际画面、试听、人工 Gate、完整远端交付及跨视频验收待完成，见 `harness/VALIDATION-MATRIX.md`。
- [x] 系列风格、系列封面和 45 帧正文起点规则。
- [ ] Agent 系列选择与封面交付完整验证：CLI、快照、统一 Studio／Runner 片头及 ZIP 检查已实现；下一条新视频仍需选择／包装／Gate 2／Gate 3／真实 Render 验证，详见 `AGENT-SERIES-COVER.md`。
- [x] Workflow Registry：`narrated-tutorial-v1` 的阶段、版本、Gate、路径和交付契约统一解析。
- [x] 宣传片生产能力退役：目录仅提供口播教程，退役入口阻断，历史完成态与已有输入包只读预览保留；`workflow-retirement.test.mjs` 5/5、既有 Harness 298 项分批通过，验收证据见本地 `local/workflow-retirement/acceptance.md`。
- [x] 口播教程 legacy-flat 路径与全局 slug 冲突校验；退役 Workflow 命名空间仅供历史读取。
- [x] 完成当前用户确认范围内的最终视频导出闭环；Artifact 已通过远程校验并完成 Gate 4 人工验收。

- 历史能力记录：轻量动态原型及 visual-self-review 曾有专项验证，当前仅用于历史读取，不再属于生产前置或当前 Gate 验收能力。

- [x] 官方动效能力代码接入：版本匹配的 `@remotion/paths`／`@remotion/transitions`、帧驱动弹簧、共享空间、路径运动／描边、展开合并、形状／状态、焦点和到达反馈；通用 Studio 样片见 `docs/MOTION-COMPONENTS.md`，类型检查和 `src/index.ts` 编译通过。
- [ ] 官方动效样片实际画面验收及另一条新视频完整验证；Harness 自动可见性识别尚未实现。

## 维护原则

- 只记录仓库能力，不记录具体视频的本地产物状态。
- 以代码、测试和可复现命令作为验证依据。
- 当前阶段、阻塞和下一步写入 `ROADMAP.md`。


## Storyboard 流程与质量迭代

- [x] 分镜执行质量 Phase A：稳定设计标准、审计模板与任务包读取路径；试点 9 幕／32 事件设计／源码问题清单及实际影响矩阵。证据 `local/storyboard-execution-quality/15-permissions/`，不代表实际动画验收。
- [x] 分镜执行质量 Phase B 核心：当时分镜格式（内部 storyboardSchemaVersion: 2，现已升级 Shot 格式 3）、生命周期／父子／替换关系校验、设计审计依赖及 Gate 2 展示／冻结、真实 Cue 时间阻断、CLI／HTTP 共享批准后返工和适用批次／旧任务失效保护；隔离回归通过，未替代人工 Gate。
- 2026-10-10：按用户要求移除 Phase C 统一画面执行器、自动组件生成和演示样例；保留生命周期、真实事件时间、版本及人工观看校验。
- [ ] Agent 编写画面的实际新片、Gate 3 与完整交付验收；统一执行器不再作为当前生产能力。
- [ ] Phase C～E 的真实画面／试听、试点制作与渲染、跨视频验收；可信词级时间及跨模型验证，详见 `docs/STORYBOARD-EXECUTION-QUALITY.md` 与 ROADMAP。

- [x] storyboard-v1 版本化阶段、共享制作任务、分镜 Schema／模板、Gate 2 口播与分镜审核包和页面，版本绑定与冻结失效；专项隔离回归支持验证。
- [x] 当时 alignment 4 的逐事件真实 Cue／Segment 对齐和携带冻结分镜／当前实现依赖的独立输入包；定向检查通过，真实画面仍需人工检查。旧 alignment 3 仅供历史读取。
- [x] 未完成视频按当前规则正常返工：精确范围、历史快照、最早缺失输入重做、旧审核失效、活动任务／completed 保护与同计划恢复；current-production／storyboard-production 定向验证通过。旧转换／接管入口已停用，未对实际视频执行返工。
- [x] 新建默认已统一当前流程，不提供旧流程或分镜版本选择；current-production 11／11、storyboard-production 31／31、历史解析 3／3 定向通过。
- [ ] 实际 Web 页面、真实视频 Gate 2／3／4 和跨视频验收；代码／隔离入口检查不能替代这些验收。

- [x] Shot 通用程序接入：当前唯一新建格式 3、Scene → Shot → Event、逐镜头设计审计、冻结 5、alignment 5、观看证据 2；CLI／HTTP／批量、真实 Cue 边界、转场、输入包及旧包只读预览的定向 78／78 通过，证据 `local/shot-implementation/acceptance.md`。
- [ ] Shot 实片观看／试听、人工 Gate 与跨视频固化；第15条本轮未修改，隔离样例不代替实片质量验收。
