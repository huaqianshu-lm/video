# ROADMAP.md

## 长期产品目标

- 将已验证的 AI 视频生产流程逐步产品化为专门的视频生产 Harness，最终支持其他人安装、配置和使用。
- Harness 只覆盖视频生产，不扩展为通用任务平台；后续工作优先沉淀流程编排、状态记录、校验、人工 Gate、重试、断点续做和工具适配能力。

## 当前阶段

- 按用户明确要求移除统一画面执行器、自动组件生成、固定动作白名单和演示入口；改由 Agent 按冻结分镜编写 React／Remotion。文档与代码已同步；相关隔离任务／输入包／Gate 检查52／52通过，通用 Root 类型检查通过，第15条正式片已完成本地渲染并通过 Gate 4；规则跨视频验收待后续验证。证据见 local/remove-storyboard-renderer/及本条本地渲染Job。
- 教程片审美与感官要求已接入规则 14.4、设计审计／观看证据说明、制作 Skill、共享任务包和 Gate 2／3 页面提示；调校配方按 9.7 留证并区分候选与实际验证。权威规则及配方模板加入现有输入指纹，格式／阶段不变；定向 4 项检查通过，第 15 条通过 Gate 3 实际画面与试听审核、完成渲染并通过 Gate 4；配方复用及跨视频验收仍待验证，流程证据见 `local/aesthetic-review-integration/acceptance.md`。
- `16-security`：第三版Gate 2、Gate 3及本地完整渲染均已通过；Gate 4经用户确认并于2026-10-12 06:03 UTC由Harness批准，状态进入 `completed`，该视频永久只读。首次Job在受限环境启动Chromium失败；同计划重试Job `c8d4bc85-bd2f-4423-879a-cd438f82db0c` 成功，耗时2237.69秒。输出 `out/local-render/16-security/c8d4bc85-bd2f-4423-879a-cd438f82db0c/16-security.mp4`，18,290,770字节，SHA-256 `4a03d0f6e5146ba8765156ea26701e6f86c9db5c1606bb59e2c45ad79503ec16`；1920×1080、30fps、9939帧、H.264/AAC，规格与整片解码检查通过。证据见 `local/remotion/16-security/` 与该Job的 `result.json`。
- 当前生产流程迭代已落实到代码与入口：新建统一 storyboard-v1／现行分镜契约，旧流程与旧格式停止生产，不提供版本选择；资料不足通过正常返工重做，不自动改写历史视频。Shot内部分镜格式3及其上下游已同步，最新定向78项通过，completed 与全部实际视频资料保持原样。实际画面／试听、Web 手动检查、真实交付与跨视频验收仍未完成，不能把入口检查当成整流程质量验收。收敛见 `local/current-production-iteration/acceptance.md`。
- `12-slash-commands` 已通过 Gate 4 并进入 `completed`，后续永久只读。用户已检查成片并确认无问题；Run `37254126010` 成功，head_sha 与推送提交 `151e9c11080e9c0afa1bd6ebe025a72ac0617db2` 一致，Artifact `11322455206` 为 5,389,975 bytes 且未过期。渲染使用 Composition ID `12-slash-commands`、输入包 SHA-256 `1e3e0396de194e817d04a8411c2536d12189fae81a100b70588f57bda6349189`；交付代码只包含 `harness/src/render-delivery.mjs` 和 `harness/src/render-input.mjs`。 `11-agents-md` 完整 Render Run `37202648340` 成功，Artifact 非空且有效，head_sha 与交付提交 `1d5550b` 一致；用户确认成片无问题、封面存在，Gate 4 已通过，Harness 为 `completed`，后续永久只读。 Agent 系列封面已通过 `11-agents-md` 原型、Gate 3 与最终成片人工验收；目录 Studio 一致性与封面精确帧数尚未单独实测，剩余项见 drafts 验证清单。

## 历史状态记录（旧状态，仅供追溯）

以下为当时的实现与视频记录，不代表当前可执行流程、现存视频清单或有效审核。当前唯一生产流程与未完成视频返工规则以 CLAUDE.md 和当前契约为准。

- 宣传片生产能力本地退役完成：生产目录仅提供口播教程；专项定义／校验／测试和三份本地方案已删除，历史宣传片仅保留只读元数据与 5 个预览依赖。303 项适用回归分批通过，TypeScript／隔离 Studio 入口／差异检查通过；24 条已完成视频及依赖共 2,111 个文件无修改、新增或删除。验收见 `local/workflow-retirement/acceptance.md`；退役内容已提交并推送到 main（e2306fc），未调用真实 TTS 或远程 Render，下一次真实教程仍按既有基线与 Gate 验证。

- `product-promo-v1` 多工作流架构提案与工程计划已归档到本地忽略的 `drafts/`；Phase 0 规范基线和 Phase 1 兼容测试已在当前 main 工作目录完成，不使用旧 `product-promo-workflow` 工作树开发。
- 仓库规则已按“核心 `CLAUDE.md`、专项 Skill、稳定 `docs/`、本地 `drafts/` 与 `notes/`”完成分层；四个项目内 Skill、通用视频模板和受跟踪 MVP 能力清单已创建并通过适用验证。仓库资料与代码分离的四阶段计划已保存到 `drafts/REPOSITORY-CLEANUP-FOUR-PHASE-PLAN.md`，第二阶段 Git 索引清理、第三阶段历史重写和现有远端分支强制更新已完成，第四阶段本地验证已完成，独立私有输入源已配置，`vscode` Smoke Render、完整 Render 和 Gate 4 人工验收均已完成。
- 2026-09-14：按 `drafts/VIDEO-PRODUCTION-FLOW-CLOSURE-PLAN.md` 顺序完成四步流程收口，并分别通过单步回归；随后按用户确认的 7 个渲染必要文件定向提交并推送，GitHub Actions 完整 Render Run `34836232221` 成功，Artifact `08-cli` 未过期，用户已完成 Gate 4 人工验收，Harness 状态进入 `completed`。
- 2026-09-14：完成 GitHub 认证长期方案实现；本地默认从 `gh auth` 系统凭据读取，CI／测试只有显式选择 `HARNESS_GITHUB_AUTH_SOURCE=env` 才读取环境 Token，并阻止两个环境 Token 冲突。单条、Web UI、批量和后台远程任务均在新 Job／dispatch 前执行 GitHub `/user`、仓库、分支和 Workflow 真实 API 预检；认证失败进入可恢复的 `waiting-config`，不会创建新的远程任务。私有 GitHub Release 输入包下载也复用同一认证来源；Token 不写入状态、交付记录或错误信息。专项认证回归 5/5、核心远程回归 31/31、输入包／配置回归 22/22、批量／Job 回归 16/16、Harness／Web 模块回归 89/89、Git 交付与 Web Server 回归 23/23，`npm run check` 和 `git diff --check` 通过；在允许本地回环监听并使用 Node `--test-force-exit` 后，Harness 全量 209/209 通过，未执行真实渲染或推送。用户随后完成 `gh` 登录并通过 `doctor --json` 的身份、仓库、推送权限、分支和两个 Workflow 预检；真实远程渲染仍未执行。
- 仓库正在收敛为只提交 Harness 和通用视频制作能力；具体视频项目、生产资源及讨论过程文档已转入本地忽略目录，当前索引和可见 Git 历史均已不再跟踪这些资料。
- 已实现 `render-input prepare／validate／package`：具体视频资料、Remotion 配置和资源包先整理到被忽略的 `local/render-input/<slug>/`，以 Manifest 和 SHA-256 校验后交给远程输入源，不再要求它们进入能力仓库。
- 已实现 `render-input entry-all`：本地扫描可用视频并只读取逐视频已校验输入包 Manifest 中明确的组件、配置和 Composition ID，生成被忽略的多 Composition Studio 入口；不再按文件修改时间猜版本，`completed` 视频缺包时只读跳过并说明原因。
- 两个 GitHub Actions 渲染 Workflow 已改为接收独立输入包 URL／SHA-256，在 Runner 临时工作区恢复资料并生成临时 Remotion 入口；工作流已支持通过 API 下载私有 Release 资产，`vscode` 输入包已发布到独立私有仓库 Release，主仓库 `RENDER_INPUT_TOKEN` Secret 和本地远程配置均已通过诊断；Smoke Run `34687581072` 和完整 Render `34688325027` 均成功，最终 Artifact `vscode` 未过期且已通过 Gate 4 人工验收。
- Web UI 已支持从 Source 一键连续执行到 Gate 2：源文档自动登记，六个内容／脚本／视觉 Agent 阶段逐个创建持久化 Job，Gate 1 自动内部审查，最终停在 Gate 2 等待人工确认。
- Web UI 已增加原文件导入入口：支持 Markdown／纯文本上传，按文件名或显式 slug 创建并初始化新视频项目，保存为 `videos/<slug>/source.md`，不覆盖已有项目。
- Web UI 原文件导入现在要求先选择系列（或明确选择通用风格）；项目会锁定系列 Style，视觉原型 Agent 会读取对应的已验证原型基线，既有项目加入系列时会回退到 `visual-script` 重新生成后续资料。所有新视频统一继承 `01-what-is-codex` 的 Visual Prototype 外壳和排版基线，Harness 会阻断只复用 class 名称但改变标题区、导航区、字幕区、Scene 标题锚点或进度区布局的原型。
- 2026-09-13：新增永久只读规则：任何已标记为 `completed` 的视频及其内容、状态和相关产物均不可再修改；后续变更只能针对未完成视频或新建独立视频标识。
- 2026-09-14：按 Smoke Render 独立化方案完成流程调整：当前 Workflow 收敛为 14 个生产阶段，Gate 3 后直接进入完整 Render 并停在 Gate 4；Smoke Render 仅保留为新系列或渲染环境变化时手动触发的独立 GitHub Actions 检查，历史旧阶段只读展示；Harness 全量回归、类型检查和差异检查通过，未执行真实渲染，`web-and-cloud` 未处理。
- 2026-09-13：按用户明确确认，将有完整渲染成功或历史已渲染确认记录的 15 个视频统一为 `completed`：Codex 01–06、7 个 Claude Code 历史视频、`project-init`、`vscode`；本次恢复 14 个，06 保持原样，其余 47 个视频不变。修改前状态和证据清单保存在 `local/state-recovery/2026-09-13T07-19-51-846Z-rendered-completion.json`；未修改代码、视频资料或触发渲染。
- Web UI 普通 Agent 阶段已默认复用项目内 Codex CLI 适配器；只有需要替换执行器时才配置 `HARNESS_AGENT_EXECUTOR_*`，不再要求普通启动前手工配置。
- Web UI TTS 阶段已默认加载项目内 TTS 适配器；普通启动不再因缺少 `HARNESS_TTS_EXECUTOR_*` 阻塞，非标准 TTS 工程仍可用环境变量覆盖。
- `02-core-concepts` 已完成 Smoke Run `33403378772`、完整 Render `33403831520` 和 Gate 4 人工验收；两个 Artifact 均存在且未过期，当前视频流程完成。
- `project-init` 已完成 Smoke Run `33479568851`、完整 Render `33480194796` 和 Gate 4 人工验收；两个 Artifact 均存在且未过期，Harness 当前状态为 `completed`。
- Web UI 已对运行中的完整 Render 远程任务锁定重复提交入口：按钮显示“远程任务执行中”并说明任务状态和 ID，详情页每 5 秒同步状态；旧页面或竞态产生的重复请求由服务端幂等返回已有任务，不再报错或创建第二条任务，历史 Smoke 任务仅保留只读展示。
- Codex 系列风格已配置为独立 `codex` 基线；01、02 共享 Codex 令牌，Harness 会解析系列风格并在原型／Remotion 校验阶段阻止风格漂移。
- `codex-guide` 系列清单已恢复为同时关联 `01-what-is-codex` 和 `02-core-concepts`；系列关联保存现在禁止未经确认的成员移除，Web UI 会在移除前二次确认。
- Web UI 已修复项目级“执行当前阶段”与 Remotion 任务状态不同步的问题：按接口真实的 `result.taskId` 进入轮询，`ready / in-progress / failed` 分别显示执行、制作中或重试状态，已完成的历史任务不再遮蔽当前 `run-stage` 操作，任务完成前不提供 Gate 3 通过入口。`02-core-concepts` 已按用户确认的历史完整渲染记录恢复为 `completed`。
- TTS Harness 适配器已补齐并通过不联网契约测试：可从 stdin 接收 `video-tts-execution`，调用既有 TTS 三段 Python 脚本并回写音频／字幕／Timeline；`02-core-concepts` 已完成真实 TTS、字幕和 Timeline 产物并通过质检。
- `02-core-concepts` TTS 已完成并通过 TTS 质检；Remotion 报告已修正为允许在缺少待生成 `remotion-alignment.json` 时创建制作任务，任务完成后仍严格校验对齐清单。
- Harness Web UI 已接入持久化后台 Agent Job、Gate 2 冻结原型、Remotion 逐 Scene 对齐清单和 Gate 3 同屏对照；远程渲染现已补齐资源包自动准备、资源／Manifest／代码交付预检和 dispatch 分支提交一致性校验。
- Web UI 远程渲染交付预检已区分“准备资源”和“提交阻塞”两类提示；资源准备会明确说明不会 commit/push，Git 或资源问题会单独说明修复后重新校验的下一步。
- 完整 Render 入口已支持一次确认后定向提交当前视频渲染文件、推送当前分支并排队远程任务；不使用 `git add .`，不提交无关改动，独立 Smoke Render 不经过 Harness 交付入口。
- `vscode` 已重新执行 Remotion Agent，生成并校验 `remotion-alignment.json`，Gate 3 已通过；远程输入包位于独立仓库 `huaqianshu-lm/video-render-inputs` 的 Release `vscode-input-v1`，未进入能力仓库。Smoke Run `34687581072` 经人工检查通过，完整 Render `34688325027` 已成功，Artifact `vscode` 已通过 Gate 4 最终确认。
- narrated 视频的 Remotion 音频驱动契约已完成统一实施：任务包显式读取 `tts-script.json`、Audio／Subtitle／Timeline Manifest；12 个现有有口播配置已迁移到 `src/lib/timing.ts` 的 Manifest 驱动入口，Alignment 2.0 已要求逐 Scene 时间映射，不回溯重做已完成视频。
- 新视频 `01-what-is-codex` 已关联 `codex-guide` 系列并接入45帧共享封面片头；用户确认已有完整 Render 结果，已按历史完成接管并于 2026-09-13 恢复为 Harness `completed`；本次重建当前资料指纹基线，后续按永久只读规则不得触碰该视频内容、状态或相关产物。
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
- 批量生产已拆为四类目标：到 Gate 2、完成 TTS、完成 Remotion、批量渲染；批次会在 TTS 质检、Gate 3 和 Gate 4 停留，批量渲染从 Gate 3 直接提交完整 Render，旧 Smoke 批次记录保留只读兼容。
- Remotion 制作任务层已接入：TTS 质检后的批量 Remotion 在产物缺失时创建可恢复任务，等待 Agent 生成配置／主组件，完成后自动校验并继续到 Gate 3；当前仍未配置自动 Remotion 生成器。
- 单条 TTS 执行器已接入 Harness 核心：执行器通过无 shell 的 JSON stdin 协议调用外部 TTS，固定传入冻结 `tts-script.json`、`+25%` 和输出契约；执行结束后由 Harness 校验音频、字幕和 Timeline，失败不会推进阶段。
- 单条 Remotion Agent 和完整 Render 执行器已接入统一单条入口；Remotion 任务完成后自动校验并停在 Gate 3，完整渲染创建持久化任务并交给现有 GitHub Actions 监控，Smoke Render 保留为独立手动工作流，均未自动通过人工 Gate。
- 批量 TTS、Remotion 和完整渲染已改为复用统一单条入口；批量任务支持执行器产物验收、Remotion 任务关联、远程任务等待、Gate 4 停留和避免重复提交，均未触发真实外部执行器。
- Web UI 单视频详情页已增加 TTS 质检确认入口；确认后复用 Harness 审核逻辑，并同步当前等待中的 TTS 批次。
- Web UI 的 Gate 3 驳回回退到 Remotion 时，服务端会在同一次请求中自动创建并提交持久化修改任务；首次修改不再要求用户手动点击“重试 Agent”，只有任务失败或校验阻塞后才显示重试入口。
- 批量页面的每条视频现在统一展示 Harness 项目当前状态；批次自身的历史执行记录与视频当前状态分开保存，避免同一视频在不同批次中显示过期状态。
- 2026-10-02：根据用户决定取消 `huaqianshu-site-promo-v2`，已删除该视频的专属生产资料、原型、Remotion 配置、Harness 状态、参考快照、输入包、素材、验证片段，以及误放在通用目录的遗留 Composition `src/components/promo/PromoShowcaseComposition.tsx`；通用 `product-promo-v1` 能力与已完成的 `huaqianshu-site-promo` 保留。

- 2026-09-19：将跨 Workflow 的视觉收敛自检和 `visual-self-review.json` Gate 2 机器校验契约正式写入项目核心规则、`VIDEO-PRODUCTION-RULES.md`、视频生产 Skill、Visual Prototype／Remotion Skill 和 Harness 校验矩阵；详细实现待办已记录到 `drafts/todo.md`，明确宣传片与教程片的不同视觉阈值、当前指纹、证据路径、所有入口、失效传播和测试矩阵。规则与契约已验证，Harness 自动阻断实现仍待补齐，未修改具体视频产物或执行渲染。
- 2026-09-19：用户完成人工 Gate 4 验收并确认 `huaqianshu-site-promo` 的完整 Render Artifact；Harness 已将项目状态登记为 `completed`，Gate 4 审核记录为 `approved`。该视频及其生产资料、Remotion 配置、渲染记录和相关产物后续按永久只读规则保护。




## 历史完成记录（旧记录，仅供追溯）

以下旧入口与历史完成接管仅记载当时事实，不能作为当前生产操作指引。

- 2026-09-13：修复 `07-desktop-app` 当前 Remotion 交付预检的 41 个阻塞；10 个 Scene 已补齐命名 `visualBindings`、`visualElements` 和 `implementationSymbols`，场景实现移除固定间隔时间推算，Composition 校验改为识别本地 `RenderInputRoot.tsx`；Remotion 校验阻塞清零，未提交远程任务，等待 Gate 3 人工确认。
- 2026-09-13：修正 Harness Web UI 启动时未继承远程输入包配置的问题；`harness:web` 现在显式加载持久化 Shell 配置，重启后的 Web UI 诊断已确认 Token、仓库、输入包 URL/SHA 和两个 workflow 全部可用；未执行 Smoke Render 或完整渲染。
- 2026-09-13：配置修复后的 `07-desktop-app` Smoke Run `34755740712` 已完成输入包下载、SHA-256 校验和临时工作区恢复，但在 TypeScript 阶段因 `main` 分支缺少 `src/videos/desktop` 具体视频代码而失败；未生成 Smoke Artifact，未擅自提交／推送或重新渲染。
- 2026-09-13：修复 Web UI 项目详情页空闲 Gate 3 仍持续轮询的问题；仅在远程任务、Agent 任务或 Remotion `in-progress` 时自动刷新，避免刷新重建驳回对话框；WebUI 定向回归 32/32、`npm run check`、脚本语法检查和 `git diff --check` 通过，未渲染。
- 2026-09-13：修正已有 Remotion 产物与状态记录失配的问题；后台刷新时会校验规则变更后仍有效的当前产物，自动恢复为 `Remotion succeeded → Gate 3 waiting`，不新增生产步骤、不自动通过人工 Gate 3，Gate 3 驳回后的重制仍要求新产物；Harness 核心与 WebUI 回归 86/86、`npm run check` 和 `git diff --check` 通过，未渲染。
- 2026-09-13：新视频 Remotion 项目启用视觉时间硬门禁；每个 Scene 必须提供逐元素 `visualElements`、`bindingId`、`visualBindings` 和 `implementationSymbols`，实现中使用 Cue 下标、fallback 或固定间隔推算会直接校验失败；历史兼容项目保持原规则，回归测试 10/10、`web-and-cloud` 校验、`npm run check` 和 `git diff --check` 通过。
- 2026-09-13：修复 `web-and-cloud` Scene 10 取舍卡提前出现；四张卡分别绑定 `10-01-c/d/f/g`，原则提示改为四卡全部出现后显示，预告绑定 `10-01-h`；Alignment 校验新增逐元素 `visualElements`／`bindingId` 和实现时间模式检查，禁止 Cue 下标、fallback 与固定间隔推算。Scene 10 Remotion 校验、定向回归、`npm run check` 和 `git diff --check` 通过，未渲染，等待 Gate 3 人工确认。
- 2026-09-13：为 `web-and-cloud` 建立视觉事件统一时间入口；Scene 05／07／08 及同类连接箭头改为 Cue／依赖驱动，补齐 visualBindings 校验，禁止箭头默认从 Scene 起始帧显示；新产物校验通过，Harness 已同步到 `gate-3 / waiting`，未渲染，等待人工 Gate 3 试听画面确认。
- 2026-09-11：完成仓库资料与能力代码分离的第三阶段；重写全部本地分支及现有远端跟踪分支历史，移除视频资料、资源目录、渲染输入目录和已迁移过程文档，清理 `refs/original/` 后以 `force-with-lease` 原子强制更新 GitHub 现有分支；当前索引和可见历史均不再包含这些路径，未创建本地独有远端分支。
- 2026-09-11：完成第四阶段本地验证；`npm run preview` 成功注册 18 个视频，`vscode` 独立远程输入包准备、校验和打包通过，资源 ZIP 顶层为 `vscode/` 且包含字幕两种格式和 9 个 MP3，相关 10 项定向回归与 TypeScript 检查通过；后续已将输入包发布到独立私有仓库并配置 Actions Secret，真实 Smoke Render 等待 Gate 3。
- 2026-09-12：完成 `vscode` Remotion 恢复执行；Agent 重新读取 TTS／字幕／Timeline Manifest 和 Visual Prototype，生成并校验 Alignment 2.0 对齐清单，`npm run check`、Remotion 校验和差异检查通过；当前等待 Gate 3 人工确认，未自动通过 Gate。
- 2026-09-12：完成 `vscode` 远程 Smoke Render 和完整 Render；独立输入包下载、校验、类型检查和完整渲染均通过，Run `34688325027` 生成未过期 Artifact `vscode`，用户确认渲染无问题并通过 Gate 4。

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

- Shot 通用流程程序已接入，固化中／待实片及跨视频验证：格式3、设计审计2、冻结5、alignment5、观看证据2同步，CLI／HTTP／批量及输入包的定向78／78通过；不增加阶段、Gate、统一画面生成器或自动审查调用。真实观看／试听、人工Gate、真实交付及跨视频仍待验，见 `local/shot-implementation/acceptance.md`；本轮第15条当前Gate 2已冻结、正式浅色实现已同步，实际完整观看／试听及人工Gate 3待验。原统一调度的强杀落盘、宿主交付及跨入口／跨视频缺口继续保留于相关验收清单。
- 当前生产迭代的实际质量验收待完成：代码与定向入口检查已通过，Web 手动观看、正常速度试听、真实新片／交付与跨视频仍未验；正式 npm run check 受第15条相关代码的既有类型错误阻断，通用能力专项检查通过。不得修改作废或 completed 视频来凑通过，后续按独立新视频与人工 Gate 验收。 封面实际选择／包装／Studio／Runner 和动态防遮挡／动效实际画面亦待验收，分别见 drafts 的 CV-1～CV-5 及 `docs/MOTION-COMPONENTS.md`。
- TTS 首次执行申请已补齐授权证据清单，并接入 Harness 的 TTS 任务包提示；当前项目授权记录保存在被忽略的 local/tts/external-service-authorization.md。实际 CLI 任务包检查、相关回归 3／3、语法与差异检查通过。未修改工具审批或网络配置，机器约束／跨视频首次申请验证待完成，不保证审批放行。

- 统一执行器方案按用户要求停止，原 Phase C 实片计划被替代；Agent 编写画面的真实新片、完整交付及跨视频验收待完成。制作与流程变更边界已写入权威契约及 Skill，仅操作规则已补齐；自动识别未经授权强制工具／表达限制的机器约束、实际入口及跨视频验证未落实。生命周期、同 Cue 时间阻断和人工 Gate 继续保留，旧模拟回归不作为新实现的整体验收依据。
- 本地渲染 AC-1～AC-4 为 partial：代码及文档已接入，本地专项 34/34、全量 392/392 通过（模拟编码／浏览器，真实 CLI／HTTP 分派）；真实入口整片、所有强制中断落盘窗口的穷举及跨视频成片验收待完成；AC-5 保持接入中标记。固定远程交付仍缺隔离 Studio 入口及风格令牌正常实片验证。原样本 `15-permissions` 已由用户作废，不再作为后续实片及跨视频验收样本；收敛清单见 `local/local-render-integration/acceptance.md`。 本轮成片命名已改为 `<slug>.mp4`，路径为 `out/local-render/<slug>/<jobId>/<slug>.mp4`，prepare 展示同步；命名／重试目录隔离、语法及差异检查通过。旧 Job 仍消费原记录路径。实际 CLI 模拟渲染回归因旧 legacy-v1 fixture 在初始化时被当前生产契约拒绝，尚未验证新路径的完整入口；后续用当前契约 fixture 补验，不修改已完成视频。

## 下一步

- 教程片量化基线已接入 `docs/VIDEO-PRODUCTION-RULES.md` 9.6 及制作 Skill／设计审计模板；后续未完成或新视频按适用 Gate 记录采用值、偏离及实际观看／试听证据。当前仅规则接入，机器参数校验与跨视频实片验证未完成，不回写 completed 视频。
- `15-permissions-v3` 已通过 Gate 3 与 Gate 4 并进入 `completed`，后续永久只读。正式本地渲染入口在本条已验证；共享入口的跨视频固化仍需用另一条未完成／新视频验证。
- 手动查看 Web 分镜页面并走相同版本的批准／驳回，验证批量适用入口；再用另一条未完成／新视频完成跨视频验收。新建默认已统一当前流程；继续完成实际画面与交付验收，不修改 completed 视频。
- 新契约远程交付和渲染按既有精确清单授权与共享交付入口验证；同步修复固定交付 Studio 入口与风格令牌正常检查。
- 后续改动默认只验证本次修改及其直接受影响行为；只有用户明确要求整套测试时才运行整套生产回归或全项目回归。范围按 `docs/HARNESS-PRODUCTION-CONTRACT.md` 执行，新增恢复窗口只补相关测试。

## 阻塞

- `16-security` 的分镜冲突已修复并获新版Gate 2；Edge403失败事实保留，用户本次明确允许复用本条既有成功TTS，文本／生成记录／字节核验通过且Harness已应用。当前仅完整动态观看和正常速度试听待验，不改通用TTS默认。

- 第15条旧实现的开头丢字／断续已用提前60帧预挂载、缓冲等待、绝对起止帧差修正并完成源音频检查；旧完整复听未验。该修复是新Remotion的继承要求；用户已通过本条Gate 3实际观看与试听，不能把旧检查写成独立复听通过。字幕44px现为通用默认。
- 第15条TTS网络阻塞已由用户本次例外复用授权消除：不调用外部服务，原失败任务保留失败事实；复用凭证 `local/formal-sync/15-permissions-v3/tts-reuse-once.json` 绑定当前冻结／既有成功任务和文件指纹，不伪造新生成记录，不改通用默认。Gate 3与Gate 4均已通过；该视频已完成并永久只读。
- 本地渲染共享入口固化中：自动回归392／392曾通过；`15-permissions-v3` 已从正式 Harness 单条入口完成5423帧整片渲染并通过 Gate 4，验证 Node 绝对路径 FFmpeg shim、持久化 Job、FFprobe规格／音轨检查和整片解码。另一条未完成视频上的跨视频复用验证仍待完成，不能据本条宣称固化完成。
- `14-workflows` 保留历史 Gate 2／Gate 3、TTS 和 Remotion 记录，但其旧分镜格式不满足当前生产准入；继续制作须先准备正常返工计划，按影响范围重做与人工审核，不能凭历史批准直接交付。
- `13-prompting` 的 Gate 4 机器校验例外已由用户一次性接受并留档；Codex 风格令牌检查在其他视频上的正常流程验证尚未完成。`12-slash-commands` 与 `13-prompting` 均保持永久只读。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- narrated 视频 TTS 默认使用 `+25%` 语速；生成前显式校验 TTS 参数，字幕和时间轴必须基于加速后的实际音频重新生成。当前 `claude-code-third-party-models` 的 `+0%` 资源保持不变。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一按需查阅本地 `notes/video-production-notes.md`，不在 Roadmap 重复记录。
- 画面文字必须能追溯到当前视频生产资料；预览导航、调试标记和辅助说明不得进入最终 MP4，具体检查要求见 `CLAUDE.md` 及对应专项 Skill。
- 新视频口播必须在生成阶段按独立视频表达，禁止把原始材料作为口播叙事对象；来源指代检查必须在派生 `tts-script.json` 前完成。已标记为 `completed` 的视频永久只读，后续任何改动不得触碰其内容、状态或相关产物。
- Web UI 提交远程任务前必须确认 GitHub Actions 适配器所需环境变量已配置；缺少 Token 时应在提交前给出明确配置提示，不应创建一个立即失败的远程任务。
- 本地 Harness 的分支优先级必须保持为显式 `HARNESS_GITHUB_REF`、当前 Git 工作区分支、`GITHUB_REF_NAME`；远程渲染提交前必须确认独立输入包已准备、能力代码已提交且 dispatch 分支已包含当前提交。
- 远程渲染资产检查不能停在“ZIP 文件存在”；必须在提交前验证 ZIP 可解压、顶层目录、VTT／SRT、逐个 MP3 路径和数量，并与三份 Manifest 的视频及 Scene 对齐。
- 批量“完成 TTS”只有在音频、字幕和 Timeline Manifest 都实际存在并通过校验后才能进入 TTS 质检；“批量渲染”必须先通过 Gate 3，再直接进入完整渲染并等待 Gate 4，不能自动通过人工确认。
- 批量 Remotion 不应把缺少 `video.config.ts` 或 `*Video.tsx` 直接当作批次失败；应创建 Remotion 制作任务，等待 Agent 产出后重新校验并恢复批次。
- 单条执行器必须先完成副作用，再由 Harness 重新校验产物和推进状态；未配置外部命令或 Agent 时必须明确报错，不能生成占位产物或把任务创建显示为完成。
- 远程渲染完成后，Agent 只检查 GitHub Actions Run 结论和 Artifact 是否存在、非空、未过期；Artifact 下载、视频播放和最终 Gate 4 内容检查由用户完成。`vscode` 已完成该人工确认。
- 本次 `08-cli` 首次本地 `remote-run` 在远程 dispatch 成功后，曾因旧版 `harness/src/stages.mjs` 仍要求 Smoke Render 而无法推进本地阶段；阶段表及相关单条、批量和 WebUI 入口现已统一为 Gate 3 后直接完整 Render。此前失败记录只是本地状态推进失败，没有重复创建渲染。

## 最近验证（最近 10 条）

- 2026-10-12：用户确认`16-security` Gate 4，Harness于06:03:04Z批准并进入`completed`，视频永久只读。本地完整渲染Job `c8d4bc85-bd2f-4423-879a-cd438f82db0c` 成功，耗时2237.69秒；输出18,290,770字节，SHA-256 `4a03d0f6e5146ba8765156ea26701e6f86c9db5c1606bb59e2c45ad79503ec16`。FFprobe确认1920×1080、30fps、9939帧、H.264/AAC，音频331.328秒；整片FFmpeg解码与Harness校验通过。首次受限环境Chromium启动失败记录保留。证据见 `local/local-render/16-security/c8d4bc85-bd2f-4423-879a-cd438f82db0c/result.json`。

- 2026-10-12：用户批准16-security第三版Gate 2，冻结成功、独立TTS输入校验通过；真实任务 `571da543-aa0b-49fe-9fa3-281acba34d6e` 同任务两次首段Edge HTTP403。此前成功任务33段+25%音频与当前冻结文本、成功生成记录及全部产物字节核验通过，未复用或恢复下游；见 `local/remotion/16-security/verified-tts-reuse-proposal.json`。

- 2026-10-12：用户确认正常返工范围后，Harness任务 `9936a0d7-14e7-4231-914b-abcda74008d9` 完成两项镜头清单修正；分镜校验、重新绑定设计审计和当前真实时间映射零问题，新审核ready=true，版本 `a210ad06ee369c4481e8992780ee00764d109d8fa229da6375b64953ff17f758`，Gate 2等待人工确认。见 `local/gate-2/16-security/verification.json`。

- 2026-10-12：Harness Remotion任务 `66855e10-d03c-467d-a60b-098520dc39c0` 领取后确认两处镜头对象生命周期冲突并正常fail释放锁；正常返工prepare成功。修正候选通过共享resolveStoryboardTiming的10幕／14镜头／31事件检查，零问题；未改冻结资料、未启动返工或制作正式画面，见 `local/remotion/16-security/`。

- 2026-10-12：`16-security` 获用户本次外部目的地与冻结载荷明确授权，Harness真实TTS任务 `a2f5b26d-d9ab-4617-967d-0bcf8570a569` 成功；10幕／33段音频、155条字幕Cue、329.784秒Timeline与资源包校验零问题，显式+25%，当前Remotion ready。初次DNS失败和自动审批拒绝记录保留；正常速度试听／画面／渲染未验。证据见 `local/tts/16-security/verification.json`。

- 2026-10-11：`16-security` 新版Gate 2用户批准、Harness冻结成功；独立tts-script的10幕／33段校验零问题。真实TTS任务 `1d64cdfd-f59a-43af-b355-8ccf19f76036` 因DNS失败，后续网络执行申请被自动审批拒绝，未生成真实音频／字幕／Timeline；阶段已由retry恢复ready，未绕过拒绝。证据见 `local/tts/16-security/verification.json`。

- 2026-10-11：`16-security` 按用户Gate 2反馈经Harness驳回、策划与口播分镜任务重新制作，五项教学因果修正及重点取景完成；10幕／14镜头／31事件、310项SQ／14项Shot审计零问题，审核ready=true，版本 `0902b85798c0643fe3e47eb9201b4e2cfdac11f5e90c442b5e216d65d70bd28e`。旧稿留档，完整知识依据与返工对照已附入 `local/gate-2/16-security/review.md`；真实画面、音频与渲染未执行。

- 2026-10-11：用户确认 `15-permissions-v3` 成片通过 Gate 4；Harness `approve` 返回 `status=succeeded`、`nextStage=completed`，当前状态已核对。视频及相关生产资料进入永久只读；成片、渲染规格与 Job 见上方记录，跨视频固化仍待验证。

- 2026-10-11：`15-permissions-v3` 正式 Harness 本地渲染 Job `7142363b-2894-4fd1-818c-2478d8b182cb` 成功；5423帧、1920×1080、30fps、H.264／AAC、180.8秒，输出14,769,125字节，FFprobe与整片解码校验通过，耗时1627.955秒。Node绝对路径FFmpeg shim在正式入口实际生效；Harness已进入Gate 4等待用户验片，未自动通过。跨视频固化仍待验证。证据见 `local/local-render/15-permissions-v3/7142363b-2894-4fd1-818c-2478d8b182cb/result.json`。

- 2026-10-11：用户授权本版例外复用既有TTS，32段冻结文字／+25%／成功生成记录及音频字幕Timeline字节核对通过；通过Harness进入当前Remotion任务并安装正式浅色整片／稳定转场背景／44px白字近黑描边字幕。正式入口定向类型零错误、20镜头32事件对齐零问题、独立输入包校验与打包、Composition5423帧编译及29个代表／交界静帧完成，Studio3007 HTTP200。完整播放／试听仍pending，任务保留running，Gate 3与整片渲染未执行；见 `local/formal-sync/15-permissions-v3/verification.json`、`acceptance.md`。
