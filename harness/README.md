# Video Production Harness 0.6

当前分镜在领取 Remotion 任务后由 Agent 编写画面和配置，提交 storyboard-authored-alignment 5。使用 render-input prepare／entry 准备单视频 Studio；实际完整观看和正常速度试听后填写 remotion-viewing-evidence.json，再完成任务并等待人工 Gate 3。Harness 不生成业务 JSX。旧自动画面需正常返工。


## 当前 Storyboard 生产流程（实片验收待完成）

`storyboard-v1` 合并内容分析／叙事策划，以纯口播与 Storyboard 共同收敛替代 Scene／Visual Script 和逐视频 HTML 原型。Gate 2 页面按序并排展示口播与分镜，可附静态图；实际画面与试听在 Gate 3 审核。对话、CLI、Web 和批量复用相同任务和审核版本。

新建统一使用 `storyboard-v1` 与当前分镜契约，不提供旧流程或生产版本选择。旧资料仅可读取；未完成视频不满足当前规则时使用正常返工，completed 永久只读。实际入口与实片验收状态见 ROADMAP；完整边界见 [Storyboard 生产契约](../docs/STORYBOARD-PRODUCTION-CONTRACT.md) 。

```bash
# 先准备 videos/<new-slug>/source.md；初始化后按项目规则确认系列与封面。
node harness/src/cli.mjs init <new-slug>
node harness/src/cli.mjs run <new-slug> source
node harness/src/cli.mjs production-task claim <new-slug>
# 根据任务包制作，再 complete；重复领取下一任务，完成后 run Gate 2。
node harness/src/cli.mjs storyboard-review <new-slug>
# Agent 获取同一机器审核包：追加 --json。
node harness/src/cli.mjs approve <new-slug> gate-2 --review-version <reviewVersion>
```

资料不满足当前规则时运行 `storyboard-rework <slug> prepare --reason <原因>`，查看精确范围后以 `start --reason <同一原因> --rework-version <hash>` 执行。只沿用严格校验通过的上游，从最早缺失输入返工，重新审核下游 Gate；历史资料与快照保留，中断恢复同一计划。旧 storyboard-migration 入口已停用。

Web 项目详情页显示同一分镜卡片。HTTP `GET /api/projects/<slug>/storyboard-review` 获取审核包，`POST .../action` 的 approve 请求必须带当前 `reviewVersion`。初始化与普通导入均使用服务端当前默认，不需要指定版本；旧选择直接拒绝。资料不符合当前规则时，页面提供“按当前规则准备返工”，展示精确范围后确认执行。



## Agent 新视频的系列和封面

按 `docs/AGENT-SERIES-COVER.md`，先运行 `node harness/src/cli.mjs series list`，向用户展示系统里的实际名称和封面状态，再选择：

```bash
node harness/src/cli.mjs init <slug>
node harness/src/cli.mjs series select <slug> <series-id>
# 用户明确选择不加入系列时：series select <slug> none
# 用户确认新系列与图片后：
node harness/src/cli.mjs series create <id> --title <title> --style <style>
node harness/src/cli.mjs series cover <id> --file <image>
```

选择必须在视觉设计开始前完成。新 CLI 项目未选择时不能继续生产；历史项目不自动补写系列或封面。系列图片冻结到该视频自己的资源中，单条与目录 Studio 入口统一添加片头，完整渲染使用相同入口。正文组件、音频、字幕保持正文相对时间，不能自行再偏移一次。

## 目标

把当前已经验证的视频生产流程包装成一个可检查、可暂停、可恢复的单视频编排层。0.6 在 0.5 的阶段契约、资料校验和远程任务基础上，补齐远程任务状态分类、超时与可恢复错误、环境诊断、全局任务视图和 Gate 4 审查记录；不追求自动替代内容判断。

## 0.6 新增能力

- 远程任务统一记录 `submitted`、`waiting-run`、`running`、`recoverable`、`failed`、`timeout` 和 `succeeded` 状态；无法安全确认派发结果时记录 `remote-dispatch-uncertain` 或 `remote-dispatch-ambiguous`，停止自动重派。
- 每次远程 Job 创建时先持久化唯一 `dispatchId`；Workflow 用 `video_slug / dispatch_id` 作为 Run 名称标记，派发 API 返回的准确 Run ID、API 地址和页面地址会原样保存。
- GitHub API 临时网络错误进入 `recoverable` 并保留下一次检查时间；权限、Artifact 和真实 Run 失败仍明确标记为失败。
- 已确认派发的任务超过超时阈值后进入 `timeout`，不再被后台轮询，并同步阻断对应阶段。
- `node harness/src/cli.mjs doctor` 和 Web UI 的 GitHub 检查会验证本机认证、身份、仓库、分支和两个 Workflow 是否可访问；不显示或持久化 Token。
- Web UI 首页提供全局远程任务列表，显示项目、阶段、Run、Artifact、最近检查和下次检查时间。
- Gate 2、Gate 3、Gate 4 的人工通过／驳回结果写入阶段状态，项目详情可追溯人工审查结果。

## 0.5 新增能力

- 远程任务提交前统一检查 GitHub CLI／环境认证、身份、仓库、分支和 Workflow；真实 API 预检失败不会生成新的远程任务。
- GitHub Actions 适配器支持独立的 dispatch、Run 发现、Run 状态查询和 Artifact 校验。
- 远程任务保存为可恢复记录，包含阶段、Workflow、分支、Run、Artifact、检查时间和错误信息。
- Web 服务启动时恢复未完成任务；页面关闭或服务重启后，任务仍可继续监控。
- 完整 Render 成功后自动推进 Harness 到 Gate 4；Smoke Render 不进入 Harness 阶段推进，只保留 GitHub Actions 独立手动检查。
- CLI 新增 `jobs` 命令，Web UI 展示 Run 链接、Artifact、最近检查时间和后台状态。

## 0.4 历史新增能力（旧原型校验不用于当前生产）

- Content Analysis、Video Narrative、Scene Script、Visual Script 和 Visual Prototype 的结构校验。
- Remotion Composition 配置、横屏规格、30fps、Scene 定义和字幕／时间轴 Manifest 接入校验。
- Gate 进入等待前先执行自动校验；校验失败时停留在 `failed`，不伪装成待人工确认。
- `context`、`next` 和 `report` 输出 Gate 对应的人工检查清单。
- 有效、无效、Legacy 和真实视频只读回归测试。

完整校验项和当前实现状态见 [`VALIDATION-MATRIX.md`](./VALIDATION-MATRIX.md)。

## 当前 Workflow Profile

Harness 的阶段顺序、产物、时间基准和资源前置条件由 Workflow Registry 统一提供。当前只有口播教程 Workflow：

| Workflow | 阶段边界 | 时间／声音契约 | 资料命名空间 |
| --- | --- | --- | --- |
| `narrated-tutorial-v1` | 12 个当前 Storyboard 内部阶段 | TTS、音频、字幕和 `timeline-manifest.json` | 现有 legacy-flat：`videos/<slug>/`、`src/videos/<slug>/`、`assets/<slug>-assets.zip` |

对应阶段顺序为：

```text
narrated-tutorial-v1:
source → content-analysis → video-narrative → narration-script → storyboard → gate-2
→ tts → subtitle-timeline → remotion → gate-3 → render → gate-4
```

项目 `project.json.workflow` 和 `workflowVersion` 是事实来源；未知 Workflow 或版本会 fail closed。历史缺少该字段或使用 `default` 的项目只按 narrated 兼容读取，不批量改写目录和状态。教程项目使用 `harness/projects/<slug>/` 状态目录和 `local/render-input/<slug>/` 独立输入包，slug 必须全局唯一。宣传片生产能力已移除；已完成宣传片保持永久只读，仅保留历史资料展示和已有输入包预览。


## 仓库边界

Harness 的代码、测试夹具和实现文档放在当前仓库的顶层 `harness/` 目录；通用视频模板放在 `templates/`，项目专项 Skill 放在 `.claude/skills/`。

Harness 可以按 Workflow Profile 读取并调用现有的：

- narrated 的本地 `videos/<video-slug>/`、`src/videos/<video-slug>/` 和资源归档；
- 现有检查脚本、通用 Remotion 能力和对应的 GitHub Actions 入口。

这些具体视频目录不属于远端仓库能力，Harness 不应把它们当作唯一的通用模板来源。可复用的分镜模板和脚本结构使用受 Git 跟踪的 `templates/`。Harness 不直接修改已经完成的视频资料，也不重写共享 Remotion 场景。真实视频只用于只读回归，继续用最小测试项目验证 Harness 自身行为。

## 0.2 历史范围（不代表当前能力边界）

### 包含

1. 单视频项目初始化和配置读取。
2. 阶段状态记录和产物清单。
3. 阶段前置条件检查。
4. Gate 暂停、通过和驳回。
5. 确定性资料校验。
6. 失败重试和断点续做。
7. TTS、字幕／时间轴、Remotion 和远程渲染适配器接口。
8. Mock 适配器和自动化验收测试。
9. 口播教程 Workflow 的阶段、Gate、适配器、路径和交付契约；历史 Smoke 阶段只读展示。
10. Scene／口播／TTS／字幕／Timeline 的确定性资料校验。
11. SHA-256 产物指纹和上游变化后的下游失效。
12. `next` 和 `report` 状态报告。
13. GitHub Actions Run 与 Artifact 有效性验收。
14. Workflow 阶段契约：目标、输入、输出、执行者、校验、回退和下一阶段。
15. `context` 单阶段任务包和只读 `plan --until` 目标阶段规划。
16. `styles/current` 视觉基线及其版本信息。

### 不包含

- 数据库和多用户权限；
- 批量视频编排；
- 自动生成高质量口播的模型服务；
- 自动替代人工 Gate；
- 本机 MP4 渲染；
- 与视频生产无关的通用任务编排。

## 阶段顺序

```text
narrated-tutorial-v1:
source
→ content-analysis
→ video-narrative
→ narration-script
→ storyboard
→ gate-2
→ tts
→ subtitle-timeline
→ remotion
→ gate-3
→ render
→ gate-4
```


Smoke Render 不属于任一当前生产 Workflow。新系列首次渲染或字体、Runner、依赖、资源链路等渲染环境发生变化时，使用 GitHub Actions 页面手动运行 `Smoke test video`；它不推进 Harness 阶段、不创建 Harness Job，也不写入视频审核记录。手动输入包括 `video_slug`、`composition_id`、`dispatch_id`、`render_input_url` 和 `render_input_sha256`。

其中 Gate 1 是 `content-analysis` 与 `video-narrative` 的内部组合检查；Gate 2 是纯口播、Storyboard 和设计审计的人工审核。TTS、字幕和时间轴必须从 Gate 2 冻结后的 `tts-script.json` 派生。

## 输入包、Git 交付与远程 Run 绑定

- 输入包由 `render-input.json`、清单声明的文件和 ZIP 组成；实际文件集合必须与清单完全相等。路径必须是安全的 POSIX 相对路径，不能重复、越界、指向目录、符号链接或其他特殊文件；清单中的大小和 SHA-256 必须与实际文件逐项一致。
- `packageFingerprint` 按排序后的实际文件，以 `path:<相对路径>\n`、文件字节和换行重新计算；`render-input.json` 不计入 payload 指纹，但必须存在并通过完整校验。源资料快照不一致时，输入包必须重新准备。
- 输入包已有有效交付绑定，且 Composition、`packageFingerprint`、本地 ZIP SHA-256 和 ZIP 内容仍一致时，重复准备／打包会保留原 ZIP 字节，不会因复制目录后的文件修改时间变化而使绑定失效。Payload 变化后仍须重新准备、打包、发布并绑定。
- 单视频临时入口只能是当前工作区的 `src/RenderInputRoot.tsx`，并且只能由当前完整校验通过的输入包生成；不能写 `src/Root.tsx`、具体视频目录、资源目录或输入包目录。
- Git 交付计划的 `planId` 同时绑定当前分支、提交、精确文件快照，以及视频 slug、Composition ID、输入包 URL、归档 SHA-256、`packageFingerprint` 和交付记录哈希。自动提交只处理计划列出的精确文件；必要文件缺失、删除、重命名、类型变化或哈希不可读时，在 `git add` 前阻断。
- 远程 Job 在请求前先持久化唯一 `dispatchId`。Workflow 的 `run-name` 是 `${video_slug} / ${dispatch_id}`；派发请求使用 `return_run_details: true`，成功返回后直接保存准确 Run ID、Run API 地址和页面地址。没有返回 Run 详情时保持 `sending`，恢复只能按同一个 `dispatchId` 精确查找；零匹配继续等待，多匹配进入 `remote-dispatch-ambiguous`，超出有界恢复窗口进入 `remote-dispatch-uncertain`，都不能重派或任选“最新 Run”。
- 若出现 `remote-dispatch-uncertain` 或 `remote-dispatch-ambiguous`，先用 `node harness/src/cli.mjs jobs <video-slug> --json` 记录 `dispatchId`，再按完整 Run 名称核对 GitHub Actions。不要重新提交；若确认某个成功 Run 的 Artifact 属于当前视频，可在 Web UI 的“查找历史 Artifact”中明确选择 Run ID 接管，仍无法唯一确认就保持阻塞。
- `jobs <video-slug>` 默认读取本地持久化快照；加 `--refresh` 会立即查询并写回该视频已有精确 Run ID，或可按既有 `dispatchId` 安全恢复的远程 Job，不会触发新的渲染派发。完整 Render 成功后项目只会进入 `gate-4 / waiting`，仍需人工验收；派发结果有歧义或不确定时不会自动猜测或重派。

## 执行原则

- 阶段只有在输入存在、前置校验通过且上游状态有效时才能执行。
- 已成功且输入未变化的阶段不得重复生成。
- 上游输入变化时，受影响的下游产物必须标记为失效，不能静默复用。
- 项目进入 `completed` 后永久只读。状态刷新、阶段执行、Gate 审核、重试、后台任务、批次、系列资料、远程任务和输入包操作都会先检查这个状态；写入会返回 `completed-project-readonly`，查询和恢复只返回只读结果。
- Remotion 制作任务只有在项目当前确实处于 `remotion / ready` 时才能创建、启动、执行、完成或重试。项目进入 Gate 3 或后续阶段后，遗留任务只读展示；只有 Gate 3 被人工驳回并明确回退到 Remotion 后，任务才重新可执行。
- 失败只影响当前阶段及其未完成的下游阶段；恢复时从最近成功阶段继续。
- 所有外部工具调用都通过适配器，核心流程不绑定某一个 TTS 或渲染实现。
- 真实视频的内容质量、视觉效果和最终交付仍由人工 Gate 确认。

## 0.2 验收标准

- 最小测试视频可以从初始化走到 Mock Render 完成。
- Gate 阻断、通过和驳回行为符合阶段边界。
- 资料错误可以被校验器拦截并指出文件、阶段和规则。
- 模拟失败后可以重试和断点续做，成功产物不会重复生成。
- 已完成的真实视频可以在只读模式下通过结构和产物回归检查。
- `claude-code-how-it-works` 等真实视频不会因为 Harness 测试被修改。
- 真实工具适配至少完成一次受控 Smoke Render 验收后，才能宣称渲染适配可用。
- 新项目默认使用严格口播校验，来源指代必须在生成阶段被拦截。
- 已完成旧视频可以使用 Legacy 只读模式回归；历史来源指代只产生警告，不修改视频资料。
- 上游产物变化后，当前阶段恢复为 `ready`，下游阶段标记为 `invalidated`。
- `next` 能给出唯一的下一步动作，`report` 能列出阶段、错误和失效来源。
- GitHub Actions 成功但缺少预期 Artifact 时，适配器必须判定失败。

## 0.1 基线验收状态

Harness 0.1 已完成以下验证：

- 阶段状态、产物清单、前置校验、Gate 审批／驳回、失败重试和断点续做：自动化测试通过。
- Mock 流程：从初始化到 Gate 4 的完整流程通过。
- GitHub Actions 真实适配器：已成功触发 `smoke-test-video.yml` 和 `render-video.yml`，并返回 Run 与 Artifact 元数据。
- 真实视频只读回归：`claude-code-how-it-works`、`claude-code-first-run`、`claude-code-coding-plan` 和 `claude-code-third-party-models` 的 Source 至 Remotion 产物检查通过，目标视频目录未被修改。
- `claude-code-how-it-works`：Smoke Render、完整 Render 和最终 Gate 4 已完成；完整 MP4 仍由 GitHub Actions Artifact 交付，不写入本机 `out/`。

真实视频的画面、声音、字幕和最终交付质量仍由人工 Gate 确认，Harness 不替代人工判断。

## 0.2 验收状态

Harness 0.2 已完成以下验证：

- 口播教程 Workflow 由 Registry 定义顺序、Gate、适配器、路径和产物信息；历史 15 阶段记录只读展示。
- 严格口播来源指代、TTS 覆盖、Scene 对齐和 Timeline Segment 校验通过。
- 产物变化检测和下游 `invalidated` 状态通过自动化测试。
- `next`／`report` 的 ready、waiting、failed、invalidated 状态输出通过测试和 CLI 冒烟。
- GitHub Actions 缺少预期 Artifact 的失败边界通过测试。
- 四条真实视频只读回归通过，包含 `claude-code-coding-plan` 的历史来源指代警告；视频目录未被修改。

真实视频的历史警告不代表回溯修改要求；新项目仍使用严格规则。

## 实现顺序

1. 状态模型、配置和产物清单。
2. 最小 CLI 和阶段执行器。
3. Gate、校验、失败状态和断点续做。
4. Mock 适配器和自动化测试。
5. 真实视频只读回归。
6. 受控真实工具和 Smoke Render 验收。

## 本地测试

在仓库根目录按本次修改范围选择定向测试，例如：

```bash
# 只检查本次修改的 TTS 生成记录
npm test --prefix harness -- tts-generation.test.mjs
# 用户明确要求整套生产回归时
npm run test:production --prefix harness
# 用户明确要求全项目回归时
npm test --prefix harness
```

测试入口 `scripts/test.mjs` 为每个测试文件隔离工作区、项目状态及任务目录，使用 Node 原生测试运行器。全量包括真实视频资料与状态的前后哈希只读检查；其他生产测试只修改系统临时目录。外网 fetch 被阻断，凭据和外部服务使用模拟值，本地 Git 交付只推送临时本地仓库，不调用真实 TTS、GitHub Actions 或本机 MP4 渲染。HTTP 测试需要本机回环监听权限。涉及本地 worker、Git 交付及真实资料哈希的重测试文件依次运行，其余文件最多并行 4 个，避免双核机器的竞争超时。命令结束打印每个模块的结果及临时 `summary.json` 证据路径；单文件超过 240 秒会失败并停止测试进程组。

`test:production` 集中检查统一任务、审核和单条／批量交付契约。默认只选择本次修改涉及的测试文件或测试名称；只有用户明确要求整套测试时，才运行整套生产回归或全项目回归。测试范围以 `../docs/HARNESS-PRODUCTION-CONTRACT.md` 为准，具体覆盖见 `VALIDATION-MATRIX.md`。这些检查不代替实际画面、试听、人工 Gate 或跨视频验收。

## Web UI

从仓库根目录启动本地管理界面：

```bash
npm run harness:web
```

然后打开：

```text
http://127.0.0.1:4173
```

当前 Web UI 支持：

- 查看视频项目列表、当前 Workflow 的阶段和下一步动作；历史 Smoke 阶段只读展示；
- 在首页导入 Markdown 或纯文本原文件；导入时使用唯一的口播教程 Workflow 与当前 Storyboard 契约，系统创建对应的 Source 路径，已存在项目不会被覆盖；
- 查看教程的生产资料、TTS／字幕／Timeline Manifest 和 Remotion 文件；
- 查看当前 Storyboard，旧 Visual Prototype 仅供历史预览；
- 初始化 Harness 项目状态；
- 为 Agent 阶段创建持久化后台任务，查看状态、有界日志并在失败后重试；Agent 退出后只有真实产物通过 Harness 校验才推进阶段；
- Gate 2 通过时冻结纯口播／Storyboard 与设计审计，Remotion 阶段校验当前 alignment 5，Gate 3 对照冻结分镜、实际 Remotion 画面与观看／试听证据；
- 执行校验、阶段推进、Gate 通过／驳回、重试和断点续做；
- 发起完整 Render 后查看远程任务状态和 Artifact 元数据；Smoke Render 只从 GitHub Actions 手动触发，不经过项目阶段按钮；
- 已完成视频仍可查看和做只读校验，但不能执行阶段、Gate、重试、刷新回写、批次、系列或远程任务写入；如需新版本，使用新的 video slug；
- 在远程渲染阶段提供“准备远程渲染资源”动作：从当前 Workflow 解析出的 Source、Remotion 和资源归档整理独立输入包，并在提交前检查输入包、Manifest、能力代码和 dispatch 分支；不自动 commit 或 push；
- 通过 `render-input` 命令把当前 Workflow 的本地资料和资源归档整理为被 Git 忽略的独立输入包；远端只下载这个包到临时工作区，不把具体视频资料混入能力仓库；
- 查看后台任务的 Run 链接、Run ID、Artifact 名称、最近检查时间和失败原因；
- 在首页查看所有视频项目的远程任务，并手动执行 GitHub 配置诊断；
- 对未初始化的旧视频执行 Legacy 只读检查。

Web UI 只监听 `127.0.0.1`，运行状态写入被 Git 忽略的 `harness/projects/`。导入原文件时先选择系列或明确使用通用风格；项目使用唯一 Workflow 并锁定系列 Style，Storyboard 设计按对应风格及实际 React／Remotion 能力 制作。Agent 任务会按当前阶段声明的输出路径修改视频生产资料，但仍不自动通过人工 Gate。普通 Agent 阶段默认使用项目内适配器调用本机 `codex` CLI；仅 narrated 项目的 TTS／字幕阶段使用 TTS 适配器；Remotion 阶段使用独立的 Remotion 适配器。环境变量只用于显式覆盖默认执行器。

如果需要替换普通 Agent 的执行器，可配置本地命令及 JSON 参数数组：

```bash
export HARNESS_AGENT_EXECUTOR_COMMAND="<agent-command>"
export HARNESS_AGENT_EXECUTOR_ARGS='["<arg-1>","<arg-2>"]'
export HARNESS_AGENT_EXECUTOR_CWD="<optional-working-directory>"
```

Harness 通过 stdin 发送结构化阶段任务包。`subtitle-timeline` 和 `remotion` 分别继续使用 `HARNESS_TTS_EXECUTOR_*` 与 `HARNESS_REMOTION_EXECUTOR_*`；浏览器不会接触执行器凭据。

### TTS 执行器

当前项目已提供可直接接入既有 TTS 工程的 Harness 适配器，但它只适用于 `narrated-tutorial-v1`。Gate 2 通过时，Harness 会调用既有 TTS 工程的 `scripts/build_tts_script.py`，从冻结的 `narration-script.md` 生成 `tts-script.json`；CLI、WebUI 不各自实现 Markdown 解析规则。普通 `npm run harness:web` 会自动使用该适配器；它读取生成并校验过的 narrated `videos/<video-slug>/tts-script.json`，按 `+25%` 调用 TTS 工程中的三个脚本，再把音频、字幕和 Timeline Manifest 同步到当前视频目录，并自动生成 narrated 资源归档。默认假设 TTS 工程与本仓库同级，目录为 `../tts`；如果目录不同，或需要替换适配器，显式设置：

```bash
export HARNESS_TTS_EXECUTOR_COMMAND="node"
export HARNESS_TTS_EXECUTOR_ARGS='["/Users/limiao/personal/2-topic/4-AI/project/video/harness/src/tts-harness-adapter.mjs"]'
export HARNESS_TTS_EXECUTOR_CWD="/Users/limiao/personal/2-topic/4-AI/project/video"
export HARNESS_TTS_PROJECT_DIR="/Users/limiao/personal/2-topic/4-AI/project/tts"
export HARNESS_TTS_PYTHON="/Users/limiao/personal/2-topic/4-AI/project/tts/.venv/bin/python"
export HARNESS_TTS_SCRIPT_BUILDER="/Users/limiao/personal/2-topic/4-AI/project/tts/scripts/build_tts_script.py"
```

CLI 的 `run <slug> subtitle-timeline` 也默认使用项目内适配器，无需设置 `HARNESS_TTS_EXECUTOR_COMMAND`。显式设置 COMMAND 时使用该命令及配置的 ARGS，未设置 ARGS 则传空参数；仅设置 ARGS／CWD 时覆盖默认适配器的对应配置。参数格式错误会直接报错，不静默回退。

适配器会在 `harness/.cache/tts/` 保留按 TTS Script 内容哈希区分的可恢复中间结果；这个目录已加入 Git 忽略。启动 Web UI 的终端必须继承上述环境变量，修改后需要重启 Web Server。

## CLI 使用

初始化和查看项目状态：

```bash
node harness/src/cli.mjs workflow list [--json]
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs jobs <video-slug> [--refresh] [--json]
node harness/src/cli.mjs jobs --all
node harness/src/cli.mjs doctor
node harness/src/cli.mjs validate <video-slug> [stage]
node harness/src/cli.mjs next <video-slug>
node harness/src/cli.mjs report <video-slug>
node harness/src/cli.mjs context <video-slug>
node harness/src/cli.mjs plan <video-slug> --until storyboard
node harness/src/cli.mjs next <video-slug> --json
node harness/src/cli.mjs report <video-slug> --json
node harness/src/cli.mjs doctor --json
node harness/src/cli.mjs assets package <video-slug> --json
node harness/src/cli.mjs render-input prepare <video-slug> --json
node harness/src/cli.mjs render-input validate <video-slug> --json
node harness/src/cli.mjs render-input package <video-slug> --json
node harness/src/cli.mjs render-input bind <video-slug> --url <published-zip-url> --sha256 <zip-sha256> --json
node harness/src/cli.mjs render-input entry-all --output src/RenderInputRoot.tsx --json
```


远程渲染输入包位于被忽略的 `local/render-input/<video-slug>/`，压缩包位于 `local/render-input/<video-slug>.zip`。准备输入包不会 commit 或 push：

Agent／CLI 单条完整渲染使用固定交付入口，自动检查成功方法、准备包、发布和绑定，展示当前精确文件清单。显式选择 GitHub 时，首次传入已验证方法的参数，随后复用本地忽略的 `local/render-method.json`。执行 `start` 前必须取得用户对展示清单的明确确认；发生中断后使用 `resume`。详细步骤见 [单条渲染方法手册](../docs/RENDER-DELIVERY-BASELINE.md)。Web UI／批量复用同一服务，实际人工与跨视频验收状态见 ROADMAP.md。

```bash
node harness/src/cli.mjs render-delivery prepare <video-slug> --backend github \
  --repository "<owner/code-repo>" --input-repository "<owner/input-repo>" \
  --ref "<dispatch-branch>" --baseline-run "<successful-full-render-run>"
# 后续视频直接 prepare；以下 start 仅在用户确认清单后执行。
node harness/src/cli.mjs render-delivery start <video-slug> --confirm-plan "<planId>"
node harness/src/cli.mjs render-delivery resume <video-slug>
```

如果输入包托管在私有 GitHub Release，绑定时传入的 URL 必须是 API 资产地址 `https://api.github.com/repos/<owner>/<repo>/releases/assets/<asset-id>`；不要填写 `https://github.com/<owner>/<repo>/releases/download/...` 网页下载地址。绑定和提交前的 Harness 预检都会直接拦截后者，避免任务运行到 Runner 才因重定向返回 404。

本地需要在 Studio 预览具体视频时，也使用同一个被忽略的输入包生成临时注册入口；它不会修改受跟踪的 `src/Root.tsx`：

```bash
node harness/src/cli.mjs render-input entry \
  --manifest "local/render-input/<video-slug>/render-input.json" \
  --output src/RenderInputRoot.tsx
npx remotion studio src/RenderInputRoot.tsx
```

如果需要在 Studio 左侧同时查看本地所有视频，使用批量入口命令：

```bash
node harness/src/cli.mjs render-input entry-all \
  --output src/RenderInputRoot.tsx
npx remotion studio src/RenderInputRoot.tsx
```

该命令只读取每条视频已经校验过的 `local/render-input/<video-slug>/render-input.json`，按清单中记录的组件、配置和 Composition ID 注册 Composition，不根据文件修改时间猜版本。未完成视频没有有效输入包时，只有符合当前生产规则才会尝试生成并校验；`completed` 视频只读取已有包，缺包或包损坏会跳过并说明原因。入口文件仍被 Git 忽略，视频资料和资源不会因此进入仓库。

如果一个视频目录中存在多个 `*Video.tsx`，准备时显式指定入口：

```bash
node harness/src/cli.mjs render-input prepare <video-slug> \
  --component-file <VideoComponent.tsx> \
  --component-export <VideoComponent>
```

远程输入包的实际托管位置由使用者选择，可以是独立私有 GitHub 仓库的 Release、私有对象存储或其他受控 HTTPS 地址。GitHub Actions 使用仓库 Secret `RENDER_INPUT_TOKEN`（如托管服务需要）下载它；Token 不进入仓库、输入参数或浏览器。

阶段执行遵守当前阶段顺序；Gate 阶段会进入等待状态：

```bash
node harness/src/cli.mjs run <video-slug> [stage]
node harness/src/cli.mjs approve <video-slug> <gate>
node harness/src/cli.mjs reject <video-slug> <gate> --return-to <stage> --reason "<reason>"
node harness/src/cli.mjs retry <video-slug> [stage]
node harness/src/cli.mjs resume <video-slug>
```

单条新交付默认本地（macOS／Linux、FFmpeg 9、ffprobe、已安装且匹配的 Remotion 无头浏览器）；Web UI 可选择本地或 GitHub。旧记录无 backend 时继续按 GitHub 恢复。当前接入及验收状态见 ROADMAP.md。

```bash
node harness/src/cli.mjs render-delivery prepare <video-slug> --backend local
# 用户确认当前本地计划后：
node harness/src/cli.mjs render-delivery start <video-slug> --confirm-plan "<planId>"
node harness/src/cli.mjs render-delivery resume <video-slug>
```

本地无需 GitHub 登录、发布输入包、commit 或 push。默认并发 1，独立 worker 使用冻结的工作目录和系统 FFmpeg，结果校验后停在 Gate 4；输出在 `out/local-render/<slug>/<jobId>/<slug>.mp4`，日志在 `local/local-render/<slug>/<jobId>/render.log`，Web 项目详情提供成片下载。可用 HARNESS_LOCAL_FFMPEG／HARNESS_LOCAL_FFPROBE／HARNESS_LOCAL_BROWSER 指定本机可执行文件，预检不会安装或升级依赖、不会提升权限。resume 仅核实原 worker 和结果；明确失败后的重新渲染需 `prepare --retry-job <jobId>` 及新计划确认。

选择 GitHub 时复用已有成功方法配置：

```bash
node harness/src/cli.mjs render-delivery prepare <video-slug> --backend github
# 确认返回的精确文件清单后：
node harness/src/cli.mjs render-delivery start <video-slug> --confirm-plan "<planId>"
node harness/src/cli.mjs render-delivery resume <video-slug>
```

登录账号须能写两个仓库并触发 Actions；prepare 自动检查身份、仓库、分支、Workflow 和成功代码基线。首次配置环境才需要登录／设置 Git 认证，不能每条视频重复登录。旧 CLI `remote-run` 与 `run <slug> render` 已停用并提示统一入口，低层输入包命令保留作诊断。`jobs <slug> --refresh` 对新交付调用同一 resume 路径。

本地默认使用 `gh auth` 保存的系统凭据；不要把 Token 写进 `.zshrc`、项目文件或命令历史。CI／测试如需显式传 Token，先设置 `HARNESS_GITHUB_AUTH_SOURCE=env`，再设置 `GITHUB_TOKEN` 或 `GH_TOKEN`。两个变量内容不一致时会阻止远程任务。`RENDER_INPUT_TOKEN` 只供 GitHub Actions 下载独立视频输入包，和本地 GitHub API Token 不是一回事。

macOS 的 Agent 沙箱可能无法读取系统钥匙串或访问 GitHub；沙箱内的凭据读取失败不能证明账号失效。Agent 必须通过执行工具获准的宿主访问方式复核 `gh auth status`、`doctor` 和独立输入仓库权限，并从同一环境执行后续远程操作；具体操作边界见 `.claude/skills/harness-webui-render/SKILL.md`。只有该环境确认缺少凭据或 GitHub 实际拒绝认证时，才重新登录；应用代码不得自行绕过沙箱。

如果旧 Token 已写进 shell 启动文件，请删除对应的导出行；当前终端按实际情况执行 `unset GITHUB_TOKEN GH_TOKEN`，避免 `gh` 命令继续使用旧值。

绑定私有 GitHub Release API 资产时，本地会使用 `gh auth` 凭据；其他托管地址若需要认证，只在当前命令中提供 `HARNESS_RENDER_INPUT_TOKEN`，不要写入长期配置。

完整 Render 的 URL 和 SHA-256 不再从全局环境变量读取，而是来自该视频的绑定记录；绑定时会核对当前本地 ZIP 和远端内容。输入包或 Remotion 产物变化后，必须重新准备、打包和绑定。

如需独立 Smoke Render 环境检查，请在 GitHub Actions 页面手动选择 `Smoke test video`，填写以下输入：

- `video_slug`：未完成视频或独立副本的 slug；不要选择 `completed` 视频。
- `composition_id`：目标 Remotion Composition ID。
- `dispatch_id`：本次 Smoke Run 的唯一标识；同一视频的再次检查也必须使用新的值。
- `render_input_url`：独立远程输入包地址。
- `render_input_sha256`：输入包 SHA-256。

先使用 `render-input prepare／validate／package` 准备并校验输入包，再确认目标分支和能力代码版本。Smoke Run 及 Artifact 只作为这次环境检查的外部证据，不回写 Harness 阶段、审核或 Job。

`HARNESS_GITHUB_REF` 是显式覆盖项；未设置时，本地 Harness 默认使用当前 Git 工作区分支。只有无法从当前工作区解析分支时，才回退到 `GITHUB_REF_NAME`。

远程渲染提交前，Web UI 会要求输入包和渲染能力代码已准备，并确认 dispatch 分支包含当前能力代码提交。Git 交付预检会返回本次选中的相对路径、当前分支、当前提交、文件哈希和 `planId`；确认请求必须原样带回 `planId` 与 `selectedPaths`，文件、分支或清单变化后必须重新预检，服务端不会接受旧确认。提交范围按共享交付服务当前返回的精确文件计划及 `docs/RENDER-DELIVERY-BASELINE.md` 核对；不凭旧静态清单加入文件，不包含具体视频资料或无关改动。必要文件缺失、删除、重命名、类型变化或哈希不可读时，会在 `git add` 前阻断。准备资源不会 commit 或 push。

完整渲染按共享交付选择 backend：单条默认本地，可选 GitHub，批量只用 GitHub；GitHub 路径的Web UI 后台监控器会持续查询已经记录的准确 Run ID，完成后检查 Artifact 名称、非空大小、未过期状态和视频归属，并推进 Harness 阶段。CLI 交付使用 `render-delivery start／resume`；`jobs` 可查看已经持久化的远程任务，`jobs <video-slug> --refresh` 可立即刷新指定视频已有的远程任务，不必等待后台轮询，也不会重新派发。

### 当前分镜设计与 Gate 审核

当前制作使用 storyboard-v3.json／schema 与 storyboard-design-audit.json，Gate 2 审核纯口播和分镜方案并冻结同版本；不要求 HTML 原型或 visual-self-review.json。Gate 3 使用真实 Timeline、按冻结分镜编写的实现、alignment 5 与实际观看／正常速度试听证据，设计审计不能替代实际观看。

资料不符合当前规则时，先准备 storyboard-rework，查看范围后按同一计划执行；旧 Gate 批准不能继承。已有旧任务可以显式 production-task fail 结束并释放其锁，再准备返工；后台任务必须先安全停止实际执行，不能用记录失败冒充进程已退出。completed 永久只读。旧转换和资料接管入口停用。


## Harness 统一生产（已实现，实际质量与交付验收待完成）

所有入口遵守 `docs/HARNESS-PRODUCTION-CONTRACT.md`。新建默认 `productionContract: storyboard-v1`、`storyboardSchemaVersion: 3`；旧契约只读，不能执行。不自动改写历史资料，不修改 completed。

对话 Agent 使用：

```bash
node harness/src/cli.mjs context <slug>
node harness/src/cli.mjs production-task claim <slug>
node harness/src/cli.mjs production-task show <task-id>
node harness/src/cli.mjs production-task complete <task-id> --summary "实际制作内容"
node harness/src/cli.mjs production-task fail <task-id> --reason "失败原因"
node harness/src/cli.mjs production-task resume <task-id>
```

Source 登记与冻结 TTS 输入校验使用 `run`，无需 Agent 制作任务。策划合并成一个任务、Content Analysis 与 Video Narrative 两份文件和两个内部阶段，Gate 1 为内部检查；纯口播与 Storyboard 在 Gate 2 审核并冻结同版本。TTS 机器检查完成后可制作Agent 编写的 Remotion，在 Gate 3 实际观看并正常速度试听；旧独立 TTS 试听仅为历史记录。

同一项目只能有一个已领取任务；Web UI 重启不会撤销对话任务。提交结果必须通过真实产物、变化和输入版本校验，过期或原样回传不能推进。

单条交付 `render-delivery prepare／start／resume`；批量交付 `batch delivery prepare／start／resume <batch-id>`，start 须传当前 `--confirm-plan <plan-id>`。Web UI 复用服务，准备不 commit／push／dispatch。批量只提交一次，各视频独立发布绑定与恢复 Job。既有成功基线配置及机器检查见 `docs/RENDER-DELIVERY-BASELINE.md`。

统一任务与交付已有自动回归，实际 CLI 和本机 HTTP 入口使用隔离资料验证；覆盖与未完成项见 `VALIDATION-MATRIX.md`。实际画面、试听、人工 Gate、真实远端交付和跨视频验收尚未完成，本轮迭代的剩余验收项见 ROADMAP.md。

## Shot 分镜设计

当前 Storyboard 按 Scene → Shot → Event 组织：先决定内容与观看方式，再设计变化，最后选择组件或编写实现。镜头设计属于现有口播／分镜任务，不增加阶段或 Gate；没有最少镜头数和画面生成器。新建唯一使用内部格式 3；模板见 `templates/video-production/storyboard-v3.json`，权威字段、真实音频切点、转场和观看证据见 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 的 Shot 章节。Gate 2 展示并冻结镜头设计，Gate 3 审核真实逐镜头／交界观看及整片试听。旧资料只读，未完成视频继续制作先用 storyboard-rework prepare 展示正常返工范围，不自动补镜头。程序及隔离入口验证已完成；真实视频和人工 Gate 验收状态见 ROADMAP。
