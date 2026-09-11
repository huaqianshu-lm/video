# ROADMAP.md

## 长期产品目标

- 将已验证的 AI 视频生产流程逐步产品化为专门的视频生产 Harness，最终支持其他人安装、配置和使用。
- Harness 只覆盖视频生产，不扩展为通用任务平台；后续工作优先沉淀流程编排、状态记录、校验、人工 Gate、重试、断点续做和工具适配能力。

## 当前阶段

- 仓库规则已按“核心 `CLAUDE.md`、专项 Skill、稳定 `docs/`、本地 `drafts/` 与 `notes/`”完成分层；四个项目内 Skill、通用视频模板和受跟踪 MVP 能力清单已创建并通过适用验证。仓库资料与代码分离的四阶段计划已保存到 `drafts/REPOSITORY-CLEANUP-FOUR-PHASE-PLAN.md`，第二阶段 Git 索引清理和本地能力代码基线提交已完成，下一步是历史清理。
- `videos/` 和 `src/videos/` 已由用户移出本地工作区；根 Remotion 入口已切换为通用 `video-production-template`，仓库不再因具体视频目录缺失而无法通过 TypeScript 检查。
- 仓库正在收敛为只提交 Harness 和通用视频制作能力；具体视频项目、生产资源及讨论过程文档已转入本地忽略目录，当前索引已不再跟踪这些资料，但旧 Git 历史仍待清理。
- 已实现 `render-input prepare／validate／package`：具体视频资料、Remotion 配置和资源包先整理到被忽略的 `local/render-input/<slug>/`，以 Manifest 和 SHA-256 校验后交给远程输入源，不再要求它们进入能力仓库。
- 已实现 `render-input entry-all`：本地扫描全部 `videos/` 与 `src/videos/`，按组件／配置版本匹配和修改时间选择入口，并生成被忽略的多 Composition Studio 入口；`claude-code-what-is` 当前选择 v2 入口，生成入口会显式调用 `registerRoot`。
- 两个 GitHub Actions 渲染 Workflow 已改为接收独立输入包 URL／SHA-256，在 Runner 临时工作区恢复资料并生成临时 Remotion 入口；真实私有输入源和远程 Smoke Render 尚未执行。
- Web UI 已支持从 Source 一键连续执行到 Gate 2：源文档自动登记，六个内容／脚本／视觉 Agent 阶段逐个创建持久化 Job，Gate 1 自动内部审查，最终停在 Gate 2 等待人工确认。
- Web UI 已增加原文件导入入口：支持 Markdown／纯文本上传，按文件名或显式 slug 创建并初始化新视频项目，保存为 `videos/<slug>/source.md`，不覆盖已有项目。
- Web UI 原文件导入现在要求先选择系列（或明确选择通用风格）；项目会锁定系列 Style，视觉原型 Agent 会读取对应的已验证原型基线，既有项目加入系列时会回退到 `visual-script` 重新生成后续资料。所有新视频统一继承 `01-what-is-codex` 的 Visual Prototype 外壳和排版基线，Harness 会阻断只复用 class 名称但改变标题区、导航区、字幕区、Scene 标题锚点或进度区布局的原型。
- `03-install` 已通过 Gate 2 和 TTS 质检，Gate 3 驳回后当前回到 `remotion / ready`；已有 Remotion 任务曾因旧任务包缺少驳回上下文而阻塞，现已修复任务包刷新和重试路径，等待用户重新提交验证。
- Web UI 普通 Agent 阶段已默认复用项目内 Codex CLI 适配器；只有需要替换执行器时才配置 `HARNESS_AGENT_EXECUTOR_*`，不再要求普通启动前手工配置。
- Web UI TTS 阶段已默认加载项目内 TTS 适配器；普通启动不再因缺少 `HARNESS_TTS_EXECUTOR_*` 阻塞，非标准 TTS 工程仍可用环境变量覆盖。
- `02-core-concepts` 已完成 Smoke Run `33403378772`、完整 Render `33403831520` 和 Gate 4 人工验收；两个 Artifact 均存在且未过期，当前视频流程完成。
- `project-init` 已完成 Smoke Run `33479568851`、完整 Render `33480194796` 和 Gate 4 人工验收；两个 Artifact 均存在且未过期，Harness 当前状态为 `completed`。
- Web UI 已对运行中的 Smoke／完整 Render 远程任务锁定重复提交入口：按钮显示“远程任务执行中”并说明任务状态和 ID，详情页每 5 秒同步状态；旧页面或竞态产生的重复请求由服务端幂等返回已有任务，不再报错或创建第二条任务。
- Codex 系列风格已配置为独立 `codex` 基线；01、02 共享 Codex 令牌，Harness 会解析系列风格并在原型／Remotion 校验阶段阻止风格漂移。
- `codex-guide` 系列清单已恢复为同时关联 `01-what-is-codex` 和 `02-core-concepts`；系列关联保存现在禁止未经确认的成员移除，Web UI 会在移除前二次确认。
- Web UI 已修复项目级“执行当前阶段”与 Remotion 任务状态不同步的问题：按接口真实的 `result.taskId` 进入轮询，`ready / in-progress / failed` 分别显示执行、制作中或重试状态，已完成的历史任务不再遮蔽当前 `run-stage` 操作，任务完成前不提供 Gate 3 通过入口。`02-core-concepts` 已重新冻结 Codex 风格 Gate 2 指纹，Remotion 对齐清单已同步，当前为 `remotion / ready`，可执行当前阶段并进入 Gate 3。
- TTS Harness 适配器已补齐并通过不联网契约测试：可从 stdin 接收 `video-tts-execution`，调用既有 TTS 三段 Python 脚本并回写音频／字幕／Timeline；`02-core-concepts` 已完成真实 TTS、字幕和 Timeline 产物并通过质检。
- `02-core-concepts` TTS 已完成并通过 TTS 质检；Remotion 报告已修正为允许在缺少待生成 `remotion-alignment.json` 时创建制作任务，任务完成后仍严格校验对齐清单。
- Harness Web UI 已接入持久化后台 Agent Job、Gate 2 冻结原型、Remotion 逐 Scene 对齐清单和 Gate 3 同屏对照；远程渲染现已补齐资源包自动准备、资源／Manifest／代码交付预检和 dispatch 分支提交一致性校验。
- Web UI 远程渲染交付预检已区分“准备资源”和“提交阻塞”两类提示；资源准备会明确说明不会 commit/push，Git 或资源问题会单独说明修复后重新校验的下一步。
- Smoke Render 入口已支持一次确认后定向提交当前视频渲染文件、推送当前分支并排队远程任务；不使用 `git add .`，不提交无关改动，单独资源准备和完整 Render 仍不自动 commit/push。
- narrated 视频的 Remotion 音频驱动契约已完成统一实施：任务包显式读取 `tts-script.json`、Audio／Subtitle／Timeline Manifest；12 个现有有口播配置已迁移到 `src/lib/timing.ts` 的 Manifest 驱动入口，Alignment 2.0 已要求逐 Scene 时间映射，不回溯重做已完成视频。
- 新视频 `01-what-is-codex` 已关联 `codex-guide` 系列并接入45帧共享封面片头；用户确认已有完整 Render 结果，已按历史完成接管为 Harness `completed`，不再回溯当前资料指纹。
- Harness 0.4 已完成本地实现、测试和推送，PR #3 已合并到 `main`（`5fcefb89`）；Harness 0.5 已完成实现、远程 render／Gate 4 闭环修复、已提交任务自动找回 Run／Artifact、全量测试、文档收尾和受控真实 Smoke Render 监控验收（Run `32632006287`、Artifact `vscode-smoke-test`），PR #4 已合并到 `main`（`bd991479`），不改现有视频内容。
- Harness Web UI 第一版已合入待处理视频集成分支；视频项目按原文件的系列内序号展示和排序，同序号项目以 slug 唯一标识并稳定排序，目录索引已补齐，项目卡片以完整项目名称为主信息。
- 新视频 `remotion-video` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `glossary` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止，未生成 TTS 或 Remotion 资料。
- 新视频 `troubleshooting` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `voice` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `claude-code-how-it-works` 已通过 GitHub Smoke Render 和完整 Render；Run `32360625092` 成功，最终 MP4 已完成 Gate 4 人工确认。
- `claude-code-coding-plan`、`claude-code-third-party-models`、`claude-code-api-config` 和 `claude-code-first-run` 已完成 TTS、字幕／Timeline、Remotion、远程 Smoke Render、完整 Render 及 Gate 4 最终人工确认。
- 新视频 `vscode` 和 `claude-code-first-run` 已完成 TTS、字幕／Timeline、Remotion 接入及完整 GitHub Actions Render，最终 MP4 均通过用户 Gate 4 人工验收。
- Harness 0.6 已在独立分支 `feat/video-harness-v0.6` 完成实现和人工回归；已补齐远程任务状态分类、可恢复错误、超时终态、GitHub 环境诊断、全局远程任务视图和 Gate 审查记录，48 项 Harness 回归、类型检查、差异检查及 GitHub 配置／全局任务／项目详情页人工检查均通过，未修改视频内容；PR #5 已合并到 `main`，合并提交为 `a37cd7e`。
- 批量生产已拆为四类目标：到 Gate 2、完成 TTS、完成 Remotion、批量渲染；批次会在 TTS 质检和 Smoke Render 检查前暂停，旧批次类型保留只读兼容。
- Remotion 制作任务层已接入：TTS 质检后的批量 Remotion 在产物缺失时创建可恢复任务，等待 Agent 生成配置／主组件，完成后自动校验并继续到 Gate 3；当前仍未配置自动 Remotion 生成器。
- 单条 TTS 执行器已接入 Harness 核心：执行器通过无 shell 的 JSON stdin 协议调用外部 TTS，固定传入冻结 `tts-script.json`、`+25%` 和输出契约；执行结束后由 Harness 校验音频、字幕和 Timeline，失败不会推进阶段。
- 单条 Remotion Agent 和远程 Smoke／Render 执行器已接入统一单条入口；Remotion 任务完成后自动校验并停在 Gate 3，远程渲染创建持久化任务并交给现有 GitHub Actions 监控，均未自动通过人工 Gate。
- 批量 TTS、Remotion 和远程渲染已改为复用统一单条入口；批量任务支持执行器产物验收、Remotion 任务关联、远程任务等待、Smoke 质检暂停和避免重复提交，均未触发真实外部执行器。
- Web UI 单视频详情页已增加 TTS 质检确认入口；确认后复用 Harness 审核逻辑，并同步当前等待中的 TTS 批次。
- Web UI 的 Gate 3 驳回回退到 Remotion 时，服务端会在同一次请求中自动创建并提交持久化修改任务；首次修改不再要求用户手动点击“重试 Agent”，只有任务失败或校验阻塞后才显示重试入口。
- 批量页面的每条视频现在统一展示 Harness 项目当前状态；批次自身的历史执行记录与视频当前状态分开保存，避免同一视频在不同批次中显示过期状态。
- `jetbrains`、`desktop`、`web-and-cloud` 已使用冻结的 `tts-script.json` 完成真实 `+25%` TTS、字幕和 Timeline 生成；批次 `b16cceae-8ebc-4619-ba21-b472653e8fb4` 当前等待 TTS 质检。
- 11 个已有 Visual Prototype 且未进入下游生产的视频已接管到 Harness Gate 2 等待确认，保留文件指纹，未修改视频资料。
- 其余 33 个视频已按已有原型接管到 Harness Gate 2 等待确认；当前 53 个视频均已纳入 Harness 管理，未修改视频资料。
- 7 个已有完整下游产物且用户确认已渲染完成的历史视频已标记为 Harness `completed`；保留历史标记，不再按当前严格资料规则回溯处理。
- 22 条未初始化视频的结构缺失已按最早受影响资料完成修复；只调整可识别的 Markdown 结构标题，未改正文和下游产物。
- 17 条未初始化视频的 Scene 字段缺失已按现有内容完成对齐；补齐逐 Scene 的视觉目标、屏幕文字和 Visual Type，未进入 TTS 或 Remotion。
- `claude-md-guide` 的 Visual Prototype Scene 容器已按基线对齐；未修改画面内容、交互逻辑或下游产物。
- `getting-started-practice`、`glossary`、`security`、`slash-commands`、`voice` 的口播来源指代已按语义修复；未生成或修改下游 TTS、字幕和 Remotion 产物。
- `skill-creator` Scene 10、`troubleshooting` Scene 12 的口播边界已清理；移除末尾内部 Gate 检查清单，实际口播内容未变。

## 已完成（最近 10 条）

- 2026-09-10：新增 `docs/TTS-SETUP.md`，说明独立 TTS 模块的仓库获取、Python／FFmpeg／ZIP 依赖、虚拟环境、安装验证、Harness 路径配置、产物和故障排查；根目录 README 已链接 `huaqianshu-lm/tts`。
- 2026-09-10：补齐根目录 `README.md`，面向 GitHub 访客说明项目定位、批量视频制作、人工 Gate、可恢复工作流、快速启动、CLI、远程渲染和目录结构。
- 2026-09-09：修复批次记录与 Remotion 任务卡片滚动失效；两个页面改为页眉固定、列表区唯一滚动，列表高度受限且横向溢出隔离，WebUI 模块测试 32/32、类型检查、前后端语法和差异检查通过。
- 2026-09-09：完成《WebUI 批次与工作台布局问题修复实施方案》六项改造：批量选择详情入口、四按钮统一、批次／Remotion 任务拆页、批次卡片化、工作台密度调整和系列／导入左右布局；模块测试 32/32、类型检查、前后端语法和差异检查通过，Web Server 监听回归受当前沙箱限制。
- 2026-09-09：完成 WebUI 一屏布局、桌面与移动端内容区内部滚动和独立批量创建入口；工作台不再承载批量选择，`#/batches` 与工作台均可进入 `#/batches/new`，未改变 Harness 批量状态模型或视频内容。
- 2026-09-02：WebUI Fixture 已验证原文件导入、连续执行到 Gate 2、持久化 Agent Job 编排和人工 Gate 停止点；WebUI 定向回归 15/15 通过，未上传真实原文件，未调用真实 Agent／TTS／Remotion，未生成 Fixture 正式视频。
- 2026-09-02：Remotion 音画同步契约、Agent 任务包、12 个有口播配置和 Alignment Schema 2 完成总体验证；Harness 全量 `127/127`、`npm run check`、关键脚本语法检查和 `git diff --check` 全部通过，未调用真实 Agent／TTS／Remotion／渲染。
- 2026-09-02：最小 Fixture 已验证 Remotion Agent 任务包、Timeline Scene／Segment／Subtitle Cue 时间映射、音频时长不一致阻断和 Alignment 绑定；相关 11 项定向回归全部通过，未调用真实 Agent／TTS／Remotion／渲染，未生成正式视频，工作区状态未被测试改变。
- 2026-09-02：开始实施 Remotion 音画同步制作契约；规范明确 `src/lib/timing.ts` 的 `createNarratedTiming` 为 narrated 视频统一时间入口，Manifest 映射缺失或音频／Timeline 时长不一致时阻断；`npm run check` 和 `git diff --check` 通过，现有视频配置尚未迁移，未生成正式视频。
- 2026-09-02：Remotion Agent 任务包已显式纳入冻结 `tts-script.json` 及 Audio／Subtitle／Timeline Manifest，并写入 Timeline 唯一基准约束；定向任务包回归 5/5、Harness 全量用例均无本次改动引入的失败，`npm run check` 通过，未触发真实 Agent 或视频生成。
- 2026-09-02：12 个有口播 Remotion 配置已统一复用 `createNarratedTiming`，Scene／Segment／Cue 均暴露秒和帧坐标，视觉事件改为从 Segment 映射取时间；12/12 配置静态审查、15/15 真实 Manifest 时间计划校验、`npm run check` 和 `git diff --check` 通过，未生成正式视频。
- 2026-09-02：Remotion Alignment Schema 2 已完成；逐 Scene 校验 Timeline 来源、Scene 秒／帧边界、Audio Segment、Subtitle Cue 和动画事件绑定，4 份现有清单已迁移；Alignment 回归 9/9、真实清单 4/4、Harness 全量 127/127、`npm run check` 和 `git diff --check` 通过，未生成正式视频。
- 2026-09-02：新增 Smoke Render 一键交付流程；WebUI 自动准备资源，Git 交付阻塞时展示定向提交清单，用户一次确认后只提交渲染文件并推送当前分支，再排队 Smoke Render；临时 Git／Web Server 回归通过，Harness 全量 124/124、`npm run check`、前后端语法和 `git diff --check` 通过。
- 2026-09-02：修复 Web UI 远程渲染预检提示混淆；将资源准备动作与 Git／交付阻塞分开说明，并明确 commit/push 后重新校验的下一步，Harness 全量 125/125、类型检查、前后端语法和差异检查通过。
- 2026-09-02：修复 Gate 3 驳回后 Remotion 重试仍反复阻塞的问题；任务包现在携带驳回原因和必须产生新产物的要求，重试旧任务前刷新任务包，Harness 全量 125/125、TypeScript、前后端语法和差异检查通过。
- 2026-09-02：修复 Web UI Gate 3 驳回后的交互；回退到 Remotion 时自动排队修改 Agent，接口返回 202 和任务 ID，阻塞提示不再误称“执行失败”；新增 Web Server 回归，Harness 全量 108/108、类型检查、前后端语法和差异检查通过。
- 2026-09-01：统一 TTS Script 派生规则；Gate 2 通过后的 CLI／WebUI 均调用既有 `scripts/build_tts_script.py`，不再由 Harness 维护简化解析器；补齐 Markdown 分隔线、引用、格式标记、旧脚本失效校验和当前 `03-install` 输入重生成，Harness 全量 123/123 通过。
- 2026-09-01：修复 Web UI 执行 `subtitle-timeline` 时错误提示为普通 Agent 未配置的问题；启动入口默认加载项目内 TTS 适配器，并保留执行器创建失败的真实原因，Harness 全量 119/119、前后端语法检查通过。
- 2026-09-01：修复 Gate 2 驳回后无法重新连续执行的问题；`fix-validation-issues` 状态现在仍提供“连续生成至 Gate 2”入口，当前校验问题会进入 Agent 任务包，WebUI 重启后可继续修复并推进，Harness 全量 119/119、类型检查、语法和差异检查通过。
- 2026-09-01：修复 Web UI Gate 2 驳回后的状态错显；驳回时同步终止旧的“连续生成至 Gate 2”批次，前端仅在项目真实等待 Gate 2 时显示批次文案，并兼容清理历史残留批次，驳回后可重新创建连续批次；Harness 全量 119/119、类型检查、前后端语法和差异检查通过。
- 2026-09-01：将 Visual Prototype 的 Scene 标题规则固化为全局不可变约束；每个 Scene 必须只有一个包含 eyebrow 与 h1／title 的左上标题区，禁止缺失、重复、居中或 Scene 专属改位；任务包、Harness 校验和回归用例已同步，基线原型通过，`03-install` 被正确阻断。
- 2026-09-01：补齐系列先行与不可变 Visual Prototype 基线；原文件导入支持选择系列并锁定 Style，所有新视频统一继承 `01-what-is-codex` 的外壳与排版，Harness 严格校验标题区、路径区、Scene、字幕、导航和进度布局，系列管理器对既有项目的风格变更提供可恢复回退。
- 2026-09-01：补齐 Web UI 原文件导入入口；新增 UTF-8 Markdown／纯文本上传、大小和 slug 校验、原子写入、重复项目保护及新项目自动初始化，Web Server 回归与 Harness 全量 116/116、类型检查通过。
- 2026-09-01：补齐 Web UI 普通 Agent 的默认 Codex CLI 适配器；`npm run harness:web` 自动加载动态工作区参数和受控审批参数，显式 `HARNESS_AGENT_EXECUTOR_*` 仍可覆盖，适配器专项、Harness 全量 114/114 和 TypeScript 检查通过。
- 2026-09-01：完成 Web UI 连续到 Gate 2；新增幂等项目入口、批次与 Agent Job 自动续做、Gate 1 内部审查记录和失败可恢复状态，新增连续链路回归；Harness 全量 112/112、`npm run check`、前后端语法和 `git diff --check` 通过，未触发真实 Agent、TTS、Remotion 或渲染。
- 2026-09-01：`project-init` 完成 Smoke Render（Run `33479568851`）、完整 Render（Run `33480194796`）和 Gate 4 人工验收；两个 Artifact 均存在且未过期，Harness 项目状态进入 `completed`。
- 2026-09-01：建立远程渲染资源与代码交付闭环；TTS 适配器自动生成资源 ZIP，Web UI／单条入口／批量监控统一执行资源、Manifest、Remotion 代码、Git 跟踪和 dispatch 分支预检，GitHub Actions 增加 checkout 后输入检查。
- 2026-08-31：修复 Web UI 普通重启后再次回退到残留 `GITHUB_REF_NAME` 的问题；本地 Harness 未显式指定分支时改为读取当前 Git 工作区分支，专项与 Web Server 回归 17/17、TypeScript 和实时诊断通过，并将 `02-core-concepts` 新 Smoke 任务提交到正确分支。
- 2026-08-31：将 `02-core-concepts` 的 Remotion 代码、三份 Manifest、生产资料和资产 ZIP 随提交 `53cda64` 推送到 `feat/harness-batch-to-prototype-gate3`；Web UI 已用显式目标分支重启，GitHub 仓库、分支和两个渲染工作流诊断全部通过，项目保持 `smoke-render / ready`。
- 2026-08-31：修复远程渲染显式分支被旧 `GITHUB_REF_NAME` 覆盖的问题；`HARNESS_GITHUB_REF` 现为最高优先级，空值会正确回退，GitHub 配置专项 5/5、TypeScript、`02-core-concepts` Remotion、资产 ZIP 和差异检查通过，未触发远程任务。
- 2026-08-31：修复 Web UI 在 Smoke／完整 Render 已有活跃远程任务时仍显示可提交按钮的问题；详情接口返回当前阶段活跃任务，按钮禁用并显示状态说明，服务端重复提交改为幂等返回已有任务，专项 11/11、Harness 全量 98/98、TypeScript、语法和差异检查通过。
- 2026-08-31：修复 Web UI 将已完成的历史 Remotion 任务误当作当前任务、导致“执行当前阶段”消失的问题；历史任务保留展示但不再参与当前操作判断，目标回归、Harness 全量 97/97、TypeScript、前端语法和差异检查通过。
- 2026-08-31：建立系列级视觉风格继承与校验；新增 `codex`／`claude-code` 风格定义，Codex 01／02 共享 `src/styles/codex.ts`，02 的 Visual Prototype 与 Remotion 已切换到 Codex 基线；`npm run check`、Harness 核心和真实视频只读回归通过。
- 2026-08-31：恢复 `codex-guide` 系列的 `01-what-is-codex` 关联；服务端拒绝未经确认的既有成员移除，Web UI 增加二次确认，系列文件和视频产物未删除。
- 2026-08-31：修复 Web UI 项目级 Remotion 执行状态同步；前端读取 `result.taskId`，运行中自动刷新项目状态并禁用重复执行，失败时保留重试入口，完成后才恢复 Gate 3 操作；Harness 全量 95/95、Web Server 10/10、TypeScript、前端语法和差异检查通过。
- 2026-08-31：修正 Remotion 重试时 Codex CLI 参数互斥和重复提交误报 `in-progress` 的问题；默认适配器改用兼容的 `--approve-for-me` 参数，运行接口支持幂等返回，前端提交后锁定同任务按钮，专项回归、类型检查和 Web UI 重启验证通过。
- 2026-08-31：`02-core-concepts` Remotion 任务完成；修正 Scene 06 三条上下文连接线与箭头的几何对齐，补齐最终确定性／补充性收束文字，Harness Remotion 校验、TypeScript 和差异检查通过，项目进入 Gate 3 等待人工预览。
- 2026-08-31：Web UI 项目详情和 Remotion 任务列表持久显示执行器失败原因；修正任务恢复错误的可读消息并更新前端缓存版本，Remotion 产物未修改。
- 2026-08-30：Web UI“执行当前阶段”增加页面内提交中／错误反馈；即使浏览器不显示弹窗，也能看到 Remotion 任务的阻塞原因，未修改视频或 Remotion 文件。
- 2026-08-30：Web UI 阶段执行按钮增加提交中状态和 Agent Job 立即失败反馈；未配置 TTS 执行器时保留失败 Job 与重试入口，不再表现为无响应。

- 2026-08-30：修复 Gate 2 仅识别 `## Scene` 导致一级或三级 Visual Script Scene 被误判为不一致的问题；统一支持 Markdown 标题层级 1～6，`02-core-concepts` Gate 2 已成功通过并进入 `tts`。

- 2026-08-30：Web UI“执行当前阶段”改为创建持久化后台 Agent Job，支持有界日志、失败重试和 Server 重启后的中断恢复；进程退出后必须由 Harness 校验真实产物才推进，不再把已有文件校验伪装成 Agent 执行。
- 2026-08-30：Gate 2 通过时冻结 Visual Script／Visual Prototype 指纹和 Scene 清单；新视频 Remotion 必须提交逐 Scene `remotion-alignment.json`，Gate 3 Web UI 同屏展示冻结原型、Remotion Studio 和对齐清单，历史实现保持兼容。
- 2026-08-30：`01-what-is-codex` 已在 `feat/harness-batch-to-prototype-gate3` 完成 GitHub Actions Smoke 和完整 Render；完整 Run `33290995317` 成功，Artifact `01-what-is-codex` 为14,485,652 bytes且未过期，Harness 已进入 Gate 4。
- 2026-08-30：用户确认 `01-what-is-codex` Remotion 预览无问题；Harness Gate 3 审批记录已补齐并验证为 `succeeded`，项目进入 `smoke-render / ready`。
- 2026-08-30：系列共享封面支持上传前裁切预览；比例偏差不超过1%的图片会在浏览器内居中 `cover` 裁切并标准化为1920×1080，超过1%仍拒绝上传；资源继续保存到 `public/series-assets/`，Remotion 的45帧片头和 Gate 3 回退规则不变。
- 2026-08-30：`01-what-is-codex` Scene 01 已按 Gate 3 反馈把四个入口卡片改为 2×2，并将“一个 Codex”核心圆绑定到四卡网格几何中心；Visual Prototype 与 Remotion 同步更新，类型和 Harness 校验通过，继续等待 Gate 3 人工确认。
- 2026-08-26：`01-what-is-codex` 使用冻结的 10 Scene、55 Segment 输入完成 `zh-CN-XiaoxiaoNeural`、`+25%` TTS，生成 55 个音频、55 份 Timing、136 条字幕 Cue 和 296.664 秒 Timeline，并通过用户人工 TTS 质检；项目规范已明确同一授权边界内不再重复确认外发权限。
- 2026-08-25：统一批量页面的视频状态展示；所有批次项目通过项目状态投影显示同一条视频的当前阶段和下一步信息，旧批次历史记录不再覆盖当前状态。
- 2026-08-25：为单视频详情页增加 TTS 质检确认按钮和项目级接口；确认后同步等待中的 TTS 批次，不再要求用户返回批量记录操作。
- 2026-08-25：清理 `jetbrains`、`desktop`、`web-and-cloud`、`project-init` 的字幕展示文本句末标点；不修改 TTS 朗读文本、音频和 Timeline。
- 2026-08-25：新增 Remotion 制作任务层；批量 Remotion 遇到缺失产物时不再直接失败，而是创建可恢复任务，支持 CLI／Web API／Web UI 查询、启动、完成校验、重试和批次续做。
- 2026-08-25：接入单条 TTS 执行器；通过配置注入外部命令，使用冻结 `tts-script.json` 和显式 `+25%` 生成真实音频／字幕／Timeline 后再由 Harness 校验，执行失败保持阶段失败；新增执行器成功、失败和输入契约回归。
- 2026-08-25：接入单条 Remotion Agent、Smoke／Render 执行器和共享单条阶段入口；Remotion 成功、失败、远程任务提交、阶段前置条件和统一入口回归通过，Harness 全量 69/69，未触发真实 Agent 或远程渲染。
- 2026-08-25：批量 TTS、Remotion 和远程渲染复用统一单条入口；补充执行器产物验收、Remotion 任务恢复、远程任务等待、防重复提交和失败重试回归，Harness 全量 73/73，`npm run check` 和 `git diff --check` 通过，未触发真实外部执行器。
- 2026-08-25：修复 `claude-md-guide` 的 Visual Prototype Scene 容器结构；原型结构校验清零，未修改画面内容和交互逻辑。
- 2026-08-25：修复 5 条未初始化视频的口播来源指代；目标视频校验清零，历史完成视频仍按约定不回溯。
- 2026-08-25：清理 `skill-creator` 和 `troubleshooting` 口播文档末尾的内部 Gate 检查清单；内部制作文字校验清零，实际口播未改。
- 2026-08-25：将 33 个误按普通初始化的视频按已有原型接管到 Gate 2 等待确认；全部 53 个视频均已建立正确阶段状态，未修改视频资料。
- 2026-08-25：修复 17 条未初始化视频的 Harness `missing-scene-field` 问题；逐 Scene 字段回归清零，未改口播、原型或下游产物。
- 2026-08-25：修复 22 条未初始化视频的 Harness `missing-structure` 问题；结构校验已清零，未修改正文、Scene、口播、原型或下游产物。
- 2026-08-24：新增已有产物接管能力；`desktop`、`web-and-cloud`、`prompting`、`subagents`、`memory`、`agent-skills`、`skills-in-practice`、`agent-teams`、`choosing-features`、`settings-json`、`hooks` 均同步为 Gate 2 等待人工确认。
- 2026-08-24：将 `claude-code-coding-plan`、`claude-code-how-it-works`、`claude-code-install`、`claude-code-third-party-models`、`claude-code-what-is`、`claude-code-api-config` 按用户确认的历史渲染结果标记为 Harness `completed`，未修改视频资料。
- 2026-08-25：将 `claude-code-first-run` 按用户确认的历史渲染结果标记为 Harness `completed`，未修改视频资料。
- 2026-08-24：Harness Gate 2 通过后自动从纯口播稿派生并校验 `tts-script.json`；`jetbrains` 已补齐 9 个 Scene 的 TTS 输入，校验通过且未调用外部 TTS。
- 2026-08-25：批量生产改为“到 Gate 2”“完成 TTS”“完成 Remotion”“批量渲染”四个批次目标；新增 TTS／Smoke Render 质检记录和恢复动作，未配置执行器或缺少真实产物时明确失败。
- 2026-08-25：完成 `jetbrains`、`desktop`、`web-and-cloud`、`project-init` 的真实 `+25%` TTS、字幕和 Timeline；共生成 63 个音频 Segment、385 条字幕 Cue，四个 Harness 项目均通过 `subtitle-timeline` 校验并暂停等待 TTS 质检。
- 2026-08-24：在 `feat/harness-gate-return-stage-select` 将 Web UI 的 Gate 驳回回退阶段改为 Harness 契约驱动的选择框，并保留必填驳回原因；Harness 核心 23/23、Web Server 5/5、类型检查和差异检查通过，未修改视频内容。
- 2026-08-24：Harness 0.6 的 GitHub 配置诊断、全局远程任务列表和项目详情页人工回归完成，状态、操作和远程任务信息均正常，未修改视频内容。
- 2026-08-24：Harness 0.6 完成远程任务状态模型、超时／可恢复错误处理、GitHub `doctor` 诊断、全局任务 API／CLI、Gate 审查记录和 Web UI 展示；`npm test --prefix harness` 48/48、`npm run check`、前端语法和 `git diff --check` 通过，视频目录无改动。
- 2026-08-23：修复远程任务把“已保存 dispatch 意图”误判为“GitHub 已接受提交”的问题；首次 401／网络失败后可自动重试，已确认提交仍不会重复 dispatch；新增跨分支成功 Artifact 的 Web UI 查找与确认认领，未修改视频内容。
- 2026-08-23：补齐已有完整渲染的自动识别；远程任务按工作流、分支和目标 Artifact 找回历史成功 Render，Web UI 打开详情时立即同步远程状态，不再要求用户提供 Run 链接，未修改视频内容。
- 2026-08-23：补齐远程任务自动找回：已 dispatch 但首次因 401 或临时错误检查失败的任务，后续后台轮询会复用原工作流、分支、slug 和提交时间查找既有 Run，不重复触发渲染；回归测试通过，未修改视频内容。
- 2026-08-23：修复 Harness 远程 `render` 前置校验错误：没有本地 `out/<slug>.mp4` 时仍可提交远程任务；远程 Artifact 验证成功后自动进入 Gate 4 等待人工确认，未修改视频内容。
- 2026-08-21：`vscode` Scene 01 将“右上角”口播绑定到编辑器顶部实际入口位置，并增加缺失态红色定位框与出现态蓝绿色高亮。
- 2026-08-21：将 `vscode` Scene 01、02、04、05、06、07、08、09 统一改为 VSCode 模拟工作区，突出各幕当前操作重点；Scene 03 保留为独立扩展市场素材场景。
- 2026-08-21：完成 `vscode` 的 `tts-script.json`、`+25%` TTS、117 条字幕 Cue、262.464 秒 Timeline 和独立 Remotion Composition；9 个 Scene、音频／字幕／时间轴 ID 对齐，未执行渲染。
- 2026-08-21：重排 Harness Web UI 项目卡片；序号／类型／状态置于顶部，项目名称独占完整宽度并取消截断，按钮保持紧凑，未修改视频内容。
- 2026-08-21：增大 Harness Web UI 的视觉原型预览区域至 820px，并让 iframe 填满容器，便于查看完整原型页面，未修改视频内容。
- 2026-08-21：为 Harness Web UI 增加原文件序号索引；项目 API、卡片、详情页和 `videos/VIDEO-INDEX.md` 均按 01–53 对齐，未修改视频目录名称和内容。
- 2026-08-21：完成 Harness Web UI 与待处理视频生产基线的集成；动态只读回归覆盖 53 个视频项目，23 个 Harness 测试、TypeScript、脚本语法和差异检查通过，未修改 `videos/` 或 `src/videos/`。
- 2026-08-20：Harness 0.1 完成独立目录契约、阶段状态模型、产物清单、`init`／`status` CLI、真实 GitHub Actions 适配器和 Smoke Render 验收；临时目录语法、自动化测试和远程样本验证通过，未修改现有视频内容。
- 2026-08-20：逐一核对 `claude-code-how-it-works` 全部 12 个 Scene 的字幕区间与视觉事件；将固定帧／百分比动画改为对应字幕 Cue 驱动，确认视觉事件顺序与 Scene 边界一致，未修改其他视频。
- 2026-08-20：根据 `claude-code-how-it-works` 截图反馈，修复 Scene 05 在字幕结束边界因帧取整误差产生的透明白屏；仅调整目标视频的 Scene 帧区间连续性。
- 2026-08-20：根据 `claude-code-how-it-works` 的原型与 Remotion 画面不一致反馈，新增目标视频专用动态场景实现；补齐终端逐行打印、工具选择、循环回路、进度冻结、排队指令和安全结构等原型效果，未修改共享场景组件与其他视频。
- 2026-08-20：根据 `claude-code-how-it-works` Gate 3 截图反馈，修复 Scene 12 的顶部标题安全区、四列总结卡片、独立定位的下一篇预告和目标视频字幕下边距；未改变其他视频的默认场景布局。
- 2026-08-20：完成新视频 `claude-code-how-it-works` 的 TTS 与 Remotion 接入；27 个 Segment 以 `+25%` 生成音频和 Timing，产生 107 条字幕 Cue、228.168 秒 Timeline，并完成独立 Composition 注册与类型检查。
- 2026-08-20：完成新视频 `remotion-video` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `glossary` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `troubleshooting` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `best-practices` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 11 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `capstone-project` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成 `voice` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。

## 进行中

- Web UI Agent Job 和 Prototype→Remotion 对齐契约已完成自动化验证；Remotion 任务支持 Server 重启恢复、未配置或进程失败时保留可重试状态，详情页和任务列表显示具体错误。
- 四个视频的 TTS 批次 `b16cceae-8ebc-4619-ba21-b472653e8fb4` 已停在 TTS 质检；需要确认发音、自然度、语速、停顿、字幕文本和字幕时间。
- 四个视频的 Remotion 制作任务层已可用；实际 Remotion 配置和主组件仍需 Agent 逐视频生成，完成后由 Harness 校验并续做批次。
- 批量渲染已接入持久化远程任务路径；当前只推进到真实 TTS 产物和 TTS 质检检查点，尚未执行真实批量渲染。
- 全部 53 个视频已初始化 Harness；新增 33 个已有原型视频当前为 Gate 2 `waiting`，下游产物缺失属于尚未通过人工 Gate 的正常状态。

## 下一步

1. 在 Web UI 导入实际新视频原文件并跑通 Source 到 Gate 2；默认使用项目内 Codex CLI 适配器，执行失败时通过持久化 Job 重试。
2. 由用户确认新增 33 个视频的 Gate 2；通过后按四类批次逐段推进，历史完成视频不再回溯。
3. 继续按 `todo.md` 统一改造 Web UI 的其他异步／业务按钮；Smoke Render 一键交付已完成，完整 Render 继续保持 Smoke 检查后的独立入口。
4. 《WebUI 视觉与交互整改实施规范》的阶段一至五已完成；管理页面测试已补齐，全站回归通过，未改变 Harness 核心语义。
5. 由用户按《WebUI 批次与工作台布局问题修复实施方案》第 10 节完成人工视觉验收；在允许监听 `127.0.0.1` 的环境重跑 Web Server 回归。

## 阻塞

- 当前无 `01-what-is-codex` 的 Harness 阻塞；其余阻塞以各批次和人工 Gate 的实时状态为准。
- `project-init` 已进入 `completed`，当前无该视频的 Harness 阻塞；其余阻塞以各批次和人工 Gate 的实时状态为准。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- narrated 视频 TTS 默认使用 `+25%` 语速；生成前显式校验 TTS 参数，字幕和时间轴必须基于加速后的实际音频重新生成。当前 `claude-code-third-party-models` 的 `+0%` 资源保持不变。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一按需查阅本地 `notes/video-production-notes.md`，不在 Roadmap 重复记录。
- 画面文字必须能追溯到当前视频生产资料；预览导航、调试标记和辅助说明不得进入最终 MP4，具体检查要求见 `CLAUDE.md` 及对应专项 Skill。
- 新视频口播必须在生成阶段按独立视频表达，禁止把原始材料作为口播叙事对象；来源指代检查必须在派生 `tts-script.json` 前完成，已完成视频不回溯修改。
- Web UI 提交远程任务前必须确认 GitHub Actions 适配器所需环境变量已配置；缺少 Token 时应在提交前给出明确配置提示，不应创建一个立即失败的远程任务。
- 本地 Harness 的分支优先级必须保持为显式 `HARNESS_GITHUB_REF`、当前 Git 工作区分支、`GITHUB_REF_NAME`；远程渲染提交前必须确认独立输入包已准备、能力代码已提交且 dispatch 分支已包含当前提交。
- 远程渲染资产检查不能停在“ZIP 文件存在”；必须在提交前验证 ZIP 可解压、顶层目录、VTT／SRT、逐个 MP3 路径和数量，并与三份 Manifest 的视频及 Scene 对齐。
- 批量“完成 TTS”只有在音频、字幕和 Timeline Manifest 都实际存在并通过校验后才能进入 TTS 质检；“批量渲染”必须先等待 Smoke Render 检查，不能直接进入完整渲染。
- 批量 Remotion 不应把缺少 `video.config.ts` 或 `*Video.tsx` 直接当作批次失败；应创建 Remotion 制作任务，等待 Agent 产出后重新校验并恢复批次。
- 单条执行器必须先完成副作用，再由 Harness 重新校验产物和推进状态；未配置外部命令或 Agent 时必须明确报错，不能生成占位产物或把任务创建显示为完成。
- 远程渲染完成后，Agent 只检查 GitHub Actions Run 结论和 Artifact 是否存在、非空、未过期；Artifact 下载、视频播放和最终 Gate 4 内容检查由用户完成。

## 最近验证（最近 10 条）

- 2026-09-11：完成仓库视频资料与功能代码分离第一阶段盘点；确认 `.gitignore` 已覆盖本地资料，Git 当前仍跟踪 `videos/` 445 个、`src/videos/` 108 个、`assets/` 15 个、`series/` 1 个和 `public/series-assets/` 1 个，未执行索引删除、历史重写或远端操作。
- 2026-09-11：完成仓库视频资料与功能代码分离第二阶段；本地目录仍保留，Git 索引不再跟踪 `videos/`、`src/videos/`、`assets/`、`series/` 和 `public/series-assets/`，能力代码暂存范围通过 `git diff --cached --check` 和 `npm run check`，已准备创建本地基线提交，未执行历史重写或远端操作。
- 2026-09-09：批次记录与 Remotion 任务滚动修复定向回归 32/32 通过；`find harness/web harness/src ... node --check` 和 `git diff --check` 通过，未触发真实 Agent／TTS／Remotion／渲染。
- 2026-09-09：WebUI 六项布局与交互改造定向回归 32/32 通过；`npm run check`、`find harness/web harness/src ... node --check` 和 `git diff --check` 通过；Harness 全量 143/160，17 项因沙箱禁止监听 `127.0.0.1` 失败，未触发真实 Agent／TTS／Remotion／渲染。
- 2026-09-09：WebUI 完成一屏布局和内部滚动改造；桌面与移动端的工作台项目列表、待处理列表、批次记录和 Remotion 任务均独立滚动，新增 `#/batches/new` 批量创建页面并保留四类批量目标；WebUI 模块测试 31/31、`npm run check`、前后端语法检查和 `git diff --check` 通过。完整 Harness 回归的 Web Server 用例仍受当前沙箱禁止监听 `127.0.0.1` 影响，未触发真实 Agent／TTS／Remotion／渲染。

## 历史验证（旧记录）

- 2026-09-02：Remotion 音画同步最小 Fixture 3/3 通过；任务包包含统一 Scene／Segment／Cue 帧计划，音频／Timeline 时长偏差会被阻断；Harness 全量 127/127、`npm run check`、前后端语法和 `git diff --check` 通过，未生成正式视频。
- 2026-09-02：Smoke Render 一键交付专项通过；未确认时不提交、不推送、不创建远程任务，确认后只提交渲染文件并验证远程分支指向新提交；Harness 全量 124/124、`npm run check`、前后端语法和 `git diff --check` 通过，未访问真实远程仓库。
- 2026-09-02：Gate 3 Remotion 重试上下文专项通过；新增旧任务刷新回归，Harness 全量 125/125、`npm run check`、前后端语法和 `git diff --check` 均通过，未执行真实 Remotion Agent或渲染。
- 2026-09-02：Gate 3 驳回自动进入 Remotion 修改专项通过；Web Server 15/15、Harness 全量 108/108、`npm run check`、前后端语法和 `git diff --check` 均通过，未执行渲染。
- 2026-09-01：修复 WebUI 原文件导入表单初始化时未加载系列选项的问题；后端系列接口正常时，首页现在会同步填充所属系列下拉框并更新上传状态。
- 2026-09-01：复核 Visual Prototype 的 Scene 标题规则；基线 `01-what-is-codex` 校验返回 `issues: []`，`03-install` 被报告为 Scene 04 缺少标题且存在 Scene 专属标题布局偏离，Harness 核心 47/47、类型检查和差异检查通过；完整 Web Server 回归受当前沙箱禁止监听 `127.0.0.1` 影响未通过。
- 2026-09-01：原文件导入 Web 专项验证通过；上传 Markdown 后自动创建初始化项目、保存 `source.md` 并出现在项目列表，重复 slug 返回 409，非文本扩展名返回明确错误；Web Server 14/14、Harness 全量 115/115、`npm run check`、前后端语法和差异检查通过。
- 2026-09-01：默认 Codex Agent 适配器专项验证通过；确认任务包解析、动态 `--cd`、`--approve-for-me`、父 Codex 会话标记清理、Harness 全量 114/114、`npm run check` 和差异检查通过，未触发真实 Agent。
- 2026-09-01：连续 Gate 2 Web 专项验证通过；单次入口依次调度 `content-analysis`、`video-narrative`、`scene-script`、`narration-script`、`visual-script`、`visual-prototype`，Gate 1 记录完成并停在 `waiting-gate`；重复入口复用同一批次，Harness 全量 112/112、类型检查、语法和差异检查通过。
- 2026-09-01：`project-init` 资源包从 `public/local-assets/project-init` 生成并逐文件比对通过，远程输入预检为 0 个问题；Harness 全量 111/111、`npm run check`、前后端语法和 `git diff --check` 通过，未触发远程渲染。
- 2026-08-31：在环境残留 `GITHUB_REF_NAME=feat/video-harness-v0.5` 时，普通 Web UI 启动仍解析到当前分支 `feat/harness-batch-to-prototype-gate3`；GitHub 配置与 Web Server 回归 17/17、`npm run check`、差异检查和实时 GitHub 诊断通过，新任务持久化 ref 与当前分支一致。
- 2026-08-31：远端分支与本地提交差异为 `0/0`；远端树包含 `assets/02-core-concepts-assets.zip`、Composition 代码及三份 Manifest；Web UI GitHub 诊断 `ok: true`，实际 ref 为 `feat/harness-batch-to-prototype-gate3`，项目 API 返回 `smoke-render / ready`。
- 2026-08-31：GitHub 配置专项 5/5、`npm run check`、`validate 02-core-concepts remotion`、资产 ZIP 完整性和目标差异检查通过；Harness 全量运行至第 88 项全部通过后长时间无新增输出并被中止，未记为全量通过。
- 2026-08-31：远程任务运行中禁用重复提交入口并展示任务说明；Web Server 11/11、Harness 全量 98/98、`npm run check`、前后端语法和 `git diff --check` 均通过，未触发新的远程任务或修改视频产物。
- 2026-08-31：已完成历史 Remotion 任务不再遮蔽当前阶段操作；当前 `127.0.0.1:4173` 已加载新判断，Web Server 10/10、Harness 全量 97/97、`npm run check`、`node --check harness/web/app.js` 和 `git diff --check` 均通过。
- 2026-08-31：系列关联保护专项和 Harness 全量回归通过；`npm test --prefix harness` 96/96、`npm run check`、`node --check harness/web/app.js`、`node --check harness/src/server.mjs` 和 `git diff --check` 均通过。
- 2026-08-31：Web UI Remotion 状态同步回归通过；Harness 全量 95/95、Web Server 10/10、`npm run check`、`node --check harness/web/app.js` 和 `git diff --check` 均通过，未修改视频内容或触发渲染。
- 2026-08-31：Remotion Agent 兼容参数与幂等重试通过适配器／恢复 4 项、Web Server 10 项回归，`npm run check`、前端语法和 `git diff --check` 通过；Harness Web Server 已在 `127.0.0.1:4173` 重启，未触发 Agent 或修改视频产物。
- 2026-08-31：`02-core-concepts` Remotion 任务 `b872dce9-0180-4182-a613-63c3b772399f` 完成；`validate 02-core-concepts remotion` 返回 `issues: []`，`npm run check` 和差异空白检查通过，Harness 项目进入 `gate-3 / waiting`。
- 2026-08-31：本地 API `POST /api/projects/02-core-concepts/action` 实测返回 202，任务状态可见为 `in-progress`；前端脚本可从当前 Web Server 取到事件委托、版本标记和 Remotion 状态轮询；`node --check harness/web/app.js`、`npm run check`、`git diff --check` 通过。
- 2026-08-30：修复 Gate 3 驳回后旧 Remotion 产物直接重新进入 Gate 3 的问题；回退记录旧指纹并强制可恢复 Remotion 任务，产物未变化时保持阻塞；新增回归通过，`npm run check` 通过。

- 2026-08-30：修复 Web UI Remotion 按钮无响应链路；启动时恢复遗留 `in-progress` 任务，未配置执行器时保留可重试 `blocked` 状态，前端读取任务终态并提示原因；Remotion 任务恢复回归 2/2、Harness 目标回归 43/43、脚本语法和类型检查通过，未执行渲染。

- 2026-08-30：新增 `harness/src/tts-harness-adapter.mjs`，用模拟三段 TTS CLI 完成桥接契约测试；Harness 88 项中 79 项通过，9 项 Web Server 测试仅因当前沙箱禁止监听 `127.0.0.1` 未运行，`npm run check` 和 `git diff --check` 通过，未调用真实 TTS。

- 2026-08-30：复现 `02-core-concepts` Web UI 执行 `subtitle-timeline`；API 成功创建持久化 Job，但因运行进程未配置 TTS 执行器而立即失败；前端反馈修复后通过 `node --check harness/web/app.js`、Harness 全量 87/87、`npm run check` 和 `git diff --check`。

- 2026-08-30：`02-core-concepts` Gate 2 重新通过；Visual Script 与 Visual Prototype 均识别为 8 个 Scene，Prototype baseline 已冻结，Harness 状态进入 `tts / ready`；Harness 全量 87/87、`npm run check`、`git diff --check` 通过。

- 2026-08-30：修复 Agent 阶段启动前把自身待生成产物误判为阻塞的问题；`02-core-concepts` 的下一步已恢复为 `run-stage`，Agent 无产物退出仍严格失败，Harness 86/86、TypeScript 和 `git diff --check` 通过。
- 2026-08-30：Agent Job 成功、未配置、零产物失败、重试和 Web API 后台排队回归通过；Gate 2 指纹冻结、Remotion 对齐清单、原型变更失效和历史兼容回归通过；Harness 全量测试、TypeScript、前端语法和差异检查通过。
- 2026-08-30：正确分支完整 Render Run `33290995317` 结论为 `success`；Artifact `01-what-is-codex` 存在、大小14,485,652 bytes、未过期，Harness `render` 已为 `succeeded` 并进入 Gate 4。
- 2026-08-30：`01-what-is-codex` Gate 3 审批已写入 Harness，报告显示 `gate-3 / succeeded`、`smoke-render / ready`；系列封面文件确认为1920×1080 PNG。远程渲染前置检查发现目标视频与封面仍未提交，目标资产 ZIP 尚不存在。
- 2026-08-30：系列封面自动裁切通过 `npm run check`、前端脚本语法和 Harness 全量80/80回归；覆盖严格16:9、`1672×941` 近似比例居中裁切、超过1%拒绝、上传 API 和 Gate 3 回退，实际封面与现有 TTS／字幕／Timeline 文件均未修改。
- 2026-08-30：`01-what-is-codex` Scene 01 的 2×2 入口网格与中心圆改动通过 `npm run check`、`git diff --check` 和 Harness Remotion 零问题校验；Visual Prototype 与 Remotion 布局保持一致，Harness 继续为 `gate-3 / waiting`。
- 2026-08-26：`01-what-is-codex` 的 55 个 MP3／Timing、136 条字幕 Cue 和 296.664 秒 Timeline 通过自动质检；语音为 `zh-CN-XiaoxiaoNeural`、语速为 `+25%`，Manifest ID、音频时长和字幕规则无问题，用户已在 Web UI 确认 TTS 质检，Harness 保持 `remotion / ready`。
- 2026-08-25：批次状态投影回归通过；四个真实视频在 `to-tts` 和旧 `to-gate-3` 批次中均返回统一的 `remotion / ready` 项目状态，Harness 全量测试 61/61、`npm run check`、前端语法和 `git diff --check` 通过。
- 2026-08-25：单视频 TTS 质检确认核心流程、Web Server 接口和前端语法检查通过；项目审查记录写入，等待中的 TTS 批次恢复，Harness 全量回归 60/60。
- 2026-08-25：四个视频的 TTS、字幕／Timeline 自动质检重新通过；音频 Segment 全部存在、Manifest 时长与 MP3 差异为 0、字幕 Cue 无时间范围或顺序错误，TTS 质检仍等待实际听感确认。
- 2026-08-25：17 条未初始化视频的 Scene 字段缺失回归通过；每条视频全阶段 `missing-scene-field` 均为 0，`npm run check` 和 `git diff --check` 通过。
- 2026-08-25：`claude-md-guide` 的 Visual Prototype 结构回归通过；`missing-prototype-scenes` 已清零，未修改原型画面内容。
- 2026-08-24：11 个已有原型视频接管回归通过；全部为 Gate 2 `waiting`、前 7 个阶段 `succeeded`、Gate 2 未写入 review，且 `videos/` 与 `src/videos/` 无 Git 变更。
- 2026-08-25：7 个历史视频完成状态接管回归通过；`claude-code-first-run` 的 15/15 阶段均为 `succeeded`、项目 `currentStage` 为 `completed`，历史标记已写入且未伪造远程 Run／Artifact。
- 2026-08-24：Gate 驳回回退阶段改动通过 Harness 核心 23/23、Web Server 5/5、`npm run check`、前端语法检查和 `git diff --check`；后续浏览器点击回归已完成。
- 2026-08-25：四类批量目标、TTS／Smoke Render 质检暂停、跨批次 Gate 前置条件、失败重试和旧批次兼容回归通过；Web Server 测试需在允许 localhost 监听的环境复跑。
- 2026-08-25：四个视频的 TTS／字幕／Timeline 真实产物回传并通过 Harness 校验；`jetbrains` 34 个音频 Segment、`desktop` 9 个、`web-and-cloud` 10 个、`project-init` 10 个，全部显式使用 `+25%`，批次进入 `waiting-tts-qc`。
- 2026-08-24：Harness 全量回归 53/53、`npm run check`、前端语法检查和 `git diff --check` 通过；浏览器点击 E2E 验证批量选择、创建和逐视频跳过，现有视频目录未变化。
- 2026-08-24：`jetbrains` Gate 2 通过后的自动派生回归完成；`tts-script.json` 包含 9 个 Scene，TTS 输入校验 0 个问题，Harness 下一步为可执行 `tts`，尚未调用外部 TTS。
- 2026-08-24：`jetbrains` 已通过 Harness 的 Source 至 Visual Prototype 阶段校验，Web UI 读取状态为已初始化、7/15 阶段完成、当前 `gate-2`，视频资料未修改。
- 2026-08-24：用户确认 `claude-code-coding-plan`、`claude-code-third-party-models` 和 `claude-code-api-config` 已完成全部生产流程及 Gate 4 最终验收。
- 2026-08-24：用户完成人工 Web UI 回归；GitHub 配置诊断、全局远程任务列表、`vscode`／`claude-code-first-run` 项目详情页均正常，未触发重复远程任务，视频目录无改动。
- 2026-08-24：Harness 0.6 完整回归 48/48 通过；包含远程任务生命周期、超时、临时 API 错误恢复、GitHub 诊断、Gate 审查记录、Web API／Web Server 和 53 个视频项目只读回归，视频目录无改动。
- 2026-08-23：远程 dispatch 生命周期、失败后重试、重复提交防护、跨分支历史 Artifact 显式认领和 Web UI 操作路由回归通过；Harness 核心 34 项、Web Server 4 项、`npm run check`、`git diff --check` 通过，未触发远程任务，视频目录无改动。
- 2026-08-23：历史 Render 自动找回和 Web UI 详情即时同步回归通过；Harness 核心测试 28 项、Web Server 3 项通过，未触发远程任务，视频目录无改动。
- 2026-08-23：远程任务自动恢复回归通过；模拟首次 401 后发现成功 Run／有效 Artifact，Harness 自动推进到 `gate-4`，未重复 dispatch；`npm test --prefix harness` 核心 30 项、Web UI 数据回归、Web 服务回归、`npm run check` 和 `git diff --check` 均通过，视频目录无改动。
- 2026-08-23：Harness 远程 render／Gate 4 回归通过；全量 Harness 测试 29 项、`npm run check`、`git diff --check` 通过，当前真实 `vscode` 报告从阻塞校验变为可执行 `render`，视频目录无改动。
- 2026-08-23：Harness 0.5 通过真实 GitHub Actions 后台监控完成 `vscode` Smoke Render；Run `32632006287` 为 `success`，Artifact `vscode-smoke-test` 存在、大小 1,425,085 bytes 且未过期；Harness 任务推进到 `render`，未下载 Artifact，未修改视频目录。
- 2026-08-23：Web UI 人工回归通过；53 个项目的模块内容、项目状态、详情、资料和 Visual Prototype 预览均能正常显示。
- 2026-08-23：`vscode` 和 `claude-code-first-run` 最终 MP4 通过用户人工验收，内容、声音、字幕和清洁输出无问题，Gate 4 完成。
- 2026-08-23：Harness 0.5 全量回归通过 30 项测试；53 个视频项目只读检查、Web 服务/API、配置预检、远程任务恢复和 Artifact 验证均通过，视频目录无改动。

- 2026-08-21：`vscode` 完整 Render Run `32496527485` 和 `claude-code-first-run` 完整 Render Run `32496531865` 均为 `success`；Artifact 分别为 12,153,238 和 14,683,118 bytes，均未过期。
- 2026-08-21：`vscode` Scene 01 右上角定位标识改动通过 `npm run check` 和 `git diff --check`；本机 Chromium 仍无法完成实际画面复核，Gate 3 保持未通过。
- 2026-08-21：`vscode` 8 个模拟工作区场景改动通过 `npm run check` 和 `git diff --check`；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核，Gate 3 保持未通过。
- 2026-08-21：`vscode` 的 TTS／字幕／Timeline／Remotion 确定性回归通过；9 个 Scene、9 个 Segment、117 条字幕 Cue、262.464 秒 Timeline、资源路径和连续 30fps Scene 边界均有效，Composition 已注册。
- 2026-08-21：视觉原型预览区域已由固定 620px iframe 调整为 820px 容器并填满显示；`npm run check`、`git diff --check` 和 Harness 23/23 回归测试通过，运行中的 Web UI 已返回新 CSS。
- 2026-08-21：当前 Web UI 服务已提供项目卡片新布局；序号回归仍通过，live API 返回 53 条项目，序号连续且唯一为 01–53，视频目录前后哈希一致。
- 2026-08-21：集成后的 Web UI 健康接口返回正常，项目列表发现 53 条视频项目；`claude-code-how-it-works` 详情包含 15 个阶段，只有 `claude-code-api-config` 存在 Harness 状态记录。
- 2026-08-20：Harness 对 `claude-code-first-run`、`claude-code-coding-plan` 和 `claude-code-third-party-models` 的只读结构与产物回归全部通过；必要产物齐全、Scene／Segment／字幕／Timeline 对齐，三条目标视频目录前后哈希一致。
- 2026-08-20：Harness 对 `claude-code-how-it-works` 的只读结构与产物回归通过；Source 至 Remotion 所需产物全部存在，12 个 Scene、27 个 TTS／音频 Segment、107 条字幕 Cue、12 个时间轴 Scene 和 228.168 秒 Timeline 对齐，目标视频目录前后哈希一致。
- 2026-08-20：`claude-code-how-it-works` 完整 Render Run `32360625092` 成功；Artifact MP4 为 1920×1080、30fps、H.264＋AAC、228.224 秒，完整性检查和开头／中段／结尾代表帧核验通过，用户确认最终视频无问题。
- 2026-08-20：Harness 真实 GitHub Actions 适配器已成功触发 `smoke-test-video.yml` 和 `render-video.yml`，受控输入为 `claude-code-how-it-works`，Run 与 Artifact 均可被识别并返回。
- 2026-08-20：GitHub Smoke Render Run `32358631515` 成功；三张代表帧为 1920×1080，首 10 秒短片为 H.264＋AAC、30fps、48kHz 双声道、10.048 秒，画面文字、场景结构和清洁输出核验通过。
- 2026-08-20：`claude-code-how-it-works` 12 个 Scene 的字幕 Cue 驱动视觉节奏回归通过；视觉事件映射无越界、顺序无回退，Scene 边界为连续 `0-481-930-1517-2105-2519-3047-3644-4235-4819-5535-6047-6845` 帧；`npm run check` 与 `git diff --check` 通过。
- 2026-08-20：`claude-code-how-it-works` 专用动态场景接入后的 `npm run check`、差异检查和连续帧边界回归检查通过；12 个 Scene、总计 6845 帧、区间无空档；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核。
- 2026-08-20：`claude-code-how-it-works` 遮挡修复后的 TypeScript 检查、差异检查和字幕 Manifest 校验通过；目标场景启用紧凑安全布局，12 个 Scene、107 条 Cue、空字幕 0、句末标点 0；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核。
- 2026-08-20：`claude-code-how-it-works` 通过 TTS／Manifest／Remotion 确定性校验；12 个 Scene、27 个 Segment、27 个 MP3、27 个 Timing、107 条 Cue、ID 全对齐，字幕末尾标点为 0，Timeline 为 228.168 秒，`npm run check` 通过；本机 Chromium 因 `SIGTRAP` 未完成画面检查。
- 2026-08-20：`videos/remotion-video/` 七层文件齐全；`source.md` 与指定 `53-remotion-video.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/glossary/` 七层文件齐全；`source.md` 与指定 `52-glossary.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/troubleshooting/` 七层文件齐全；`source.md` 与指定 `51-troubleshooting.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/anti-patterns/` 七层文件齐全；`source.md` 与指定 `50-anti-patterns.md` 通过字节一致性检查，11 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/best-practices/` 七层文件齐全；`source.md` 与指定 `49-best-practices.md` 通过字节一致性检查，11 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/capstone-project/` 七层文件齐全；`source.md` 与指定 `48-capstone-project.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/voice/` 七层文件齐全；`source.md` 与指定 `47-voice.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
