# 视频生产 MVP 功能清单

本文档记录仓库中可复用视频制作能力的 MVP 状态。完成能力后，同步补充实现路径和验证依据。具体视频的生产资料和渲染状态不在此记录。

## 状态说明

- `[x]`：该条限定范围内已有实现与验证依据；不代表所有入口或实际质量验收完成。
- `[ ]`：未完成、待验证或仍需用户确认。

## 当前生产迭代

- [x] Harness 第一轮减负工程实现：紧凑审计3、直接组装联合任务包及同次同步读取复用；隔离 CLI／HTTP／后台／批量、冻结5与真实时间消费定向验证，保留人工 Gate 和历史只读。证据见 `local/harness-slim/acceptance.md`。
- [x] 按用户要求将精简提交 `b5cb6a5` 合入当前 `main` 工作目录，验收资料保存在当前 `local/`；现有项目不自动迁移，兼容清单见 `local/harness-slim/compatibility.json`。
- [ ] 新视频人工 Gate 试点及实际质量／耗时／token／跨视频效果待验；工程合入不代表实片验收通过。

- [x] 新建默认、旧流程阻断、正常返工和历史只读已实现；定向回归 45 项，证据见 local/current-production-iteration/acceptance.md。
- [ ] 新片实际画面／试听、真实交付与跨视频验收待完成；不将机器检查视为实片验收。

## 能力清单

- [x] 真实词级时间接入：TTS适配器保留原始边界并绑定脚本／Manifest／音频，时间计划及alignment校验消费实际词起点，Remotion任务输入和独立包绑定证据；旧Cue级事件兼容，缺词级证据的Cue内镜头继续阻断。22项定向检查及20-mcp实际CLI／输入包验证通过；正常速度实片及跨视频固化待验，见 `local/remotion/20-mcp/acceptance.md`。

- [x] 对话／CLI 显式音频复用入口已实现：用户授权、同视频原成功生成记录、冻结口播／provider／全部产物一致性及当前任务校验；独立复用记录不冒充新生成。定向单元8／8、CLI集成1／1及19-memory真实提交通过。默认不自动复用；Web自动入口与跨视频固化不在已验范围，证据见 `local/tts/19-memory/entry-rebuild-20261024/reuse-acceptance.md`。

- [x] 已有音频执行记录后的 TTS 配置切换使用共享重制计划，保留 Gate 2 并失效音频及下游，CLI／HTTP、批次、冲突恢复和 completed 保护定向 9／9；生成记录及 provider 定向 8／8。真实入口及跨视频验证进度见 ROADMAP。
- [x] 百炼 WAV 在资源打包、Remotion 音频指纹和远程输入检查中兼容，保留 MP3；ASR 允许有限同音代词及等值整数写法映射并保留原文与识别时间证据，数值变化、其他错字及增漏字继续阻断。定向格式／路径／缺失资源检查 8 项、词级映射／术语检查 13 项通过，实际完整 TTS 及跨视频验证状态见 ROADMAP.md。
- [x] 内容驱动的分镜任务与独立内部审查要求已接入共享任务包；取景／相机及审计重复文本的非阻断提示、CLI／Web 的结构校验与 Agent 审查分开展示已实现。隔离入口与展示 40／40、镜头定向 12／12 通过，证据见 `local/storyboard-design-quality-improvement/acceptance.md`。
- [x] 视觉导演创作要求已接入共享联合任务：全片构思、逐幕表达、镜头组织、按难点画面推敲、全片统筹后再整理数据；两份原创设计推导与现有审计骨架纳入输入指纹。定向入口／版本／只读保护 8 项通过，不新增 schema、阶段或自动评分；证据见 `local/storyboard-director-design/acceptance.md`。
- [x] 共享导演方法第二轮补强：完整情境与前提、声画共同含义、镜头内注意力顺序、针对性实验与可推翻原设计的内部审查，已同步权威指导、通用推导、Skill／审计路由及共享任务包；工程验证范围见 `local/storyboard-director-design/revision-02/acceptance.md`，不代表画面质量已验收。
- [ ] 视觉导演创作的首次交付质量与跨视频验收：`20-mcp` 首次提交主线获基本认可，但状态与时序问题仍需用户指出；第二轮共享方法的真实首次交付与跨视频稳定性待验。保留首次版本及画面依据，由用户判断成熟度；入口接入不等于设计质量已经改善。
- [x] 根目录设计参考层与共享任务包索引：9份参考资料、Skill路由、4个相关阶段含索引／TTS排除的只读检查通过，证据见 `local/references-iteration/acceptance.md`。
- [ ] 参考资料在实际Agent设计任务、Web／批量入口及后续视频上的应用与画面质量验收；目录和阅读提示不代表设计能力已提升。
- [x] 视觉模板目录职责及入口路由：14个原混合文件已分别迁入 `contracts/`、`scaffolds/`、`legacy/`；`templates/README.md` 只接收验收后的可运行视觉实现；实际 CLI、HTTP、批量、TTS、Remotion 及历史兼容／completed 保护定向84／84通过，Storyboard／Gate 2／Remotion按需读取，TTS排除；模板清单已收入 `boundary-permission`（历史单场景交互预览认可）、`document-key-points`（10.8秒独立Shot无声预览认可，提取324帧一致）及 `sources-to-brief`（7.4秒独立Shot无声预览认可，修正播放器适配后入库，提取222帧一致）及 `code-walkthrough`（6.6秒独立Shot无声预览认可，逐行高亮时固定编辑器、连续入出场，提取198帧一致）及 `condition-filter`（8.4秒独立Shot无声预览认可，同一装置切换条件并展示通过／拦截，提取252帧一致）及 `object-comparison`（8.2秒独立Shot无声预览认可，盒体／分区柜对比，合门及双向滑出收尾，提取246帧一致）及 `aligned-comparison`（8秒独立Shot无声预览认可，三列逐行比较及窄条上滑收尾，提取240帧一致）及 `context-detail`（串行修正版8秒独立Shot无声预览认可，处理节点展开与收回完成后再输出，提取240帧一致）及 `digital-workspace`（静帧及7.8秒独立Shot无声预览认可，独立内容串行归入数字工作空间，窗口收拢上移收尾，提取234帧一致）及 `network-volume`（静帧及持续循环独立Shot无声预览认可，曲面网络与轨道光点共享24秒闭合周期，无入场／离场，提取720帧一致）及 `metal-volume`（实体金属持续循环独立Shot无声预览认可，浅槽与纹理转动、世界光照固定，24秒一周期，无入场／离场；提取渲染逻辑一致、720帧角度一致）及 `material-comparison`（8.8秒双球独立Shot无声预览认可，左右比较、暖金／青绿分层光晕与实体暗面；提取264帧状态与SVG一致，绘制代码核对及定向严格类型检查通过）及 `operation-feedback`（7.8秒独立Shot无声预览认可，配置２改４、执行与并行轨道反馈；结束保留完整结果，无收尾动画；提取234帧状态与SVG一致，定向严格类型检查通过）及 `context-focus`（6.2秒独立Shot无声预览认可，低亮上下文、来源选择与明亮细节展开；结束保留结果；提取186帧状态与SVG一致，定向严格类型检查通过）及 `chapter-title`（5.1秒独立Shot无声预览认可，字符归位、科技字形及右到左风吹散出场；提取153帧状态／碎片参数／SVG一致，字形构建与定向严格类型检查通过）及 `opening-questions`（7.4秒独立Shot无声预览认可，任务核心、能力问题与权限边界依次演示，结束保留完整画面；提取222帧状态与SVG一致，定向严格类型检查通过）；新候选按短时长独立Shot无声预览准入，生产实片／跨视频待验。证据见 `local/visual-template-directory-acceptance/acceptance.md`。
- [ ] 首个原创模板正式生产实片及另一条视频跨视频验证：`boundary-permission` 已获独立场景交互预览质量认可并入库，含主体实现和两个中性示例；实际Remotion成片、中性示例观看及跨视频复用待验。

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
