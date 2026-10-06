# Harness 0.6 阶段校验矩阵

这份矩阵是 Workflow Registry 中阶段契约的实现清单。它区分自动校验、适配器校验和必须由人工完成的质量判断；0.6 另外覆盖远程任务状态、超时／恢复、环境诊断、全局任务视图和 Gate 4 审查记录。

## 校验类型

Agent 封面契约见 `docs/AGENT-SERIES-COVER.md`：新 CLI 项目必须明确选择系列或 none；检查本地快照／图片哈希、输入 Manifest 与资源 ZIP 封面一致性。旧无快照输入保持兼容。带封面的单条 Gate 3 入口必须匹配当前 Manifest 的完整生成契约，防止漏封面或总时长偏移错误。11-agents-md 已验证实际选择、TTS 包装、输入包和 Studio 入口，相关 Alignment／Render Input 回归22/22通过；正式画面、Runner 和最终渲染仍待人工及真实交付验证。

共享交付服务使用 `src/render-preflight.mjs`；专项回归位于 `test/render-preflight.test.mjs`：覆盖真实 Git 祖先关系、旧代码阻断、钥匙串不可读、网络／401 区分、两个仓库写权限、成功 Workflow 归属、API／fetch 快照变化、origin 不匹配及凭据不外泄。Web UI／批量已接入共享准备服务，Fixture 回归使用注入的认证与基线检查；实际宿主认证和完整 Render 仍须单独验收。

Agent 单条固定交付入口 `cli.mjs render-delivery` 的回归位于 `test/render-delivery.test.mjs`：从实际 CLI 分派调用准备、发布／绑定、清单确认、真实 Fixture Git 定向提交／推送和既有 Monitor／GitHub 适配器；网络与凭据使用 Fixture，验证正常 Gate 4 停留、过期计划／绑定阻断、发布后绑定失败恢复、提交后推送失败恢复、派发响应中断的 dispatchId 恢复、已知 Run 超时对账、Artifact 过期阻断、显式远端失败重试及 completed 只读。不能据此声称执行了新的真实远端渲染。

| 类型 | 含义 |
| --- | --- |
| 自动 | Harness 可以基于文件、Manifest 或代码结构确定判断结果 |
| 适配器 | 由 TTS、字幕／时间轴、Remotion 或 GitHub Actions 适配器返回结果 |
| 人工 | Harness 只能阻断并提示，不能替代用户对画面、声音和交付质量的判断 |

## 阶段矩阵

| 阶段 | 校验项 | 类型 | 0.4 目标 |
| --- | --- | --- | --- |
| source | `required-artifacts` | 自动 | 已实现 |
| content-analysis | `required-artifacts` | 自动 | 已实现 |
|  | `content-analysis-structure` | 自动 | 0.4 补齐 |
| video-narrative | `required-artifacts` | 自动 | 已实现 |
|  | `narrative-structure` | 自动 | 0.4 补齐 |
| scene-script | `required-artifacts` | 自动 | 已实现 |
|  | `scene-structure` | 自动 | 0.4 补齐 |
| narration-script | `narration-purity` | 自动 | 已实现 |
|  | `source-reference-boundary` | 自动 | 已实现 |
| visual-script | `visual-script-structure` | 自动 | 0.4 补齐 |
|  | `screen-text-provenance` | 自动／规则化 | 0.4 补齐可确定部分 |
| visual-prototype | `prototype-structure` | 自动 | 0.4 补齐 |
| gate-2 | `visual-self-review-contract` | 自动前置 | 已实现：当前指纹、证据路径、必检项；审批前重检 |
|  | `manual-gate` | 人工 | 保留人工确认 |
| tts | `tts-script-alignment` | 自动 | 已实现 |
|  | `tts-script-purity` | 自动 | 已实现 |
| subtitle-timeline | `tts-coverage` | 自动 | 已实现 |
|  | `subtitle-timeline-alignment` | 自动 | 已实现 |
| remotion | `remotion-config` | 自动 | 0.4 补齐 |
|  | `resource-manifest` | 自动 | 0.4 补齐 |
|  | `remotion-alignment` | 自动 | 已实现：冻结指纹、Scene 覆盖、布局／事件／文字字段、实现文件，以及当前输入包生成的临时入口导入、配置和 Composition 注册 |
| gate-3 | `manual-gate` | 人工 | 保留人工确认 |
|  | `clean-output-review` | 人工 | 只记录人工检查要求 |
| render | `adapter-result` | 适配器 | 已实现 |
|  | `render-artifact-metadata` | 适配器 | 已实现 |
| gate-4 | `manual-gate` | 人工 | 保留人工确认 |
|  | `final-output-review` | 人工 | 只记录人工检查要求 |

## 已完成视频只读边界

`state.json.currentStage` 为 `completed` 的项目是永久只读对象。所有会改变项目状态、任务记录、审核记录、系列资料、远程任务或输入包的入口都必须先阻断并返回 `completed-project-readonly`；`status`、`report`、`next`、详情读取和恢复检查可以继续执行，但不得刷新回写或重新打开任何阶段。需要修改时只能创建新的 video slug 或独立副本。

## 独立 Smoke Render 检查

`smoke-test-video.yml` 保留为 GitHub Actions 手动环境检查，不属于当前任一 Workflow 的生产阶段。它用于新系列首次渲染，或字体、Runner、依赖、资源链路等渲染环境发生变化时的验证，检查代表帧、短片、字体、音频和独立输入包。

Smoke Render 只能针对未完成视频或独立副本，并通过 GitHub Actions 手动填写 `video_slug`、`composition_id`、`dispatch_id`、`render_input_url` 和 `render_input_sha256`。它不写入 Harness 阶段、审核、尝试次数或 Job；历史 Harness Smoke 记录仍可只读查看。

## Remotion 临时入口与输入包

- Remotion Agent 只写当前视频 Workflow 声明的 Remotion 目录和对齐清单；narrated 使用 `src/videos/<slug>/` 与 `videos/<slug>/remotion-alignment.json`。受跟踪的 `src/Root.tsx` 永远不是具体视频产物或校验回退。
- Remotion 任务产物通过校验后，Harness 必须从当前视频已校验的 `local/render-input/<slug>/render-input.json` 生成被忽略的 `src/RenderInputRoot.tsx`；任务记录会保存组件、配置、Composition ID、包指纹和 ZIP SHA-256。
- Remotion 任务的创建、启动、执行、完成和重试必须重新读取项目阶段，并且只允许 `remotion / ready`；Gate 3 及后续阶段的遗留任务只读展示，Web API 必须拒绝直接调用，任务列表不得提供执行按钮。Gate 3 人工驳回并回退到 Remotion 后仍允许正常重试。
- 输入包实际文件集合必须与 `render-input.json` 的 `files` 集合完全相等；路径只能是安全的 POSIX 相对路径，不能重复、越界、指向目录、符号链接或其他特殊文件。每个文件的大小和 SHA-256 必须匹配，按排序文件内容重算的 `packageFingerprint` 也必须匹配 Manifest。
- Gate 3 校验、单视频 Studio 和远程 Workflow 使用同一份输入包清单。临时入口缺失、导入旧版本、Composition ID 不一致或输入包与源资料不一致时，必须阻断。
- 教程输入包使用 `local/render-input/<slug>/` 外层协议；包内的 Source、Remotion 和资源归档路径由 Workflow Registry 解析，不能由 Actions 或 shell 重新拼接成 narrated 路径。
- 单视频入口只能写当前工作区的 `src/RenderInputRoot.tsx`；`entry-all` 也只按逐视频输入包清单注册 Composition。未完成视频可先更新包，`completed` 视频只能读取已有包，缺包或损坏时跳过并说明。

## 0.6 远程任务边界

- CLI `jobs <slug> --refresh` 只刷新该视频已有 Run ID 或处于 `sending` 的持久化任务；未确认派发时只按原 `dispatchId` 对账，不会创建新派发。回归覆盖目标视频隔离和不重复派发：`test/jobs.test.mjs`。
- 远程任务提交前必须通过 GitHub Actions 配置和真实 API 预检；本地默认读取 `gh auth` 系统凭据，只有显式设置 `HARNESS_GITHUB_AUTH_SOURCE=env` 时才读取 `GITHUB_TOKEN`／`GH_TOKEN`。
- 完整 Render 的 Git 交付预检必须展示精确候选文件、分支、当前提交、文件哈希和 `planId`；`planId` 同时绑定 Git 分支／提交／文件快照，以及视频 slug、Composition ID、输入包 URL、归档 SHA-256、`packageFingerprint` 和交付记录哈希。确认请求必须携带同一 `planId` 与 `selectedPaths`，任何变化都要求重新确认。自动提交只允许精确文件，必要文件缺失、删除、重命名、类型变化或哈希不可读时必须在 `git add` 前阻断。
- Run 发现、状态查询和 Artifact 验证可以分次执行，任务记录保存在 `harness/projects/<slug>/jobs/`；正常派发优先使用 API 返回的准确 Run ID，不按“同分支最新 Run”猜测。
- Web 服务重启后恢复 `queued`、`submitted`、`waiting-run`、`running`、`recoverable` 和 `waiting-config` 任务；已有 `dispatchId`、输入包绑定和 `sending` 状态会保留，恢复时只按同一 `dispatchId` 查询。匹配不到保持等待，匹配多条进入 `remote-dispatch-ambiguous`，超过有界恢复窗口进入 `remote-dispatch-uncertain`，均不自动重派。
- 临时网络／GitHub API 错误进入 `recoverable` 并等待下一次检查；权限错误、Run 失败、Artifact 缺失和超时进入明确终态，不会无限轮询。`remote-dispatch-uncertain` 或 `remote-dispatch-ambiguous` 必须由人工核对 Run 名称和 Artifact 后，通过显式 Run ID 接管。
- `doctor` 检查认证身份、仓库、分支和 Workflow 访问能力，不输出 Token；Web UI 首页提供全局远程任务列表和显式诊断入口。认证失效时，单条和批量入口都会在创建远程 Job 前阻断，批量项目进入 `waiting-config`，修复后可继续。
- Gate 通过／驳回会记录审查决定、时间、回退阶段和驳回原因；Harness 不自动判断最终 MP4 的内容质量。
- Agent 只检查 Run 结论和 Artifact 元数据；Artifact 下载、视频播放和最终 Gate 4 内容检查仍由用户完成。

## 0.4 边界

- “0.4 补齐”表示实现确定性、可重复的结构和技术校验，不表示自动判断内容质量。
- Gate 2、Gate 3 和 Gate 4 的画面、声音、节奏和最终清洁输出仍必须人工确认。
- Legacy 只读回归允许历史资料产生警告，但新项目的严格口播和来源边界规则不放宽。

## Agent Job 与原型对齐边界

- Web UI 的 Agent 阶段先创建本地持久化 Job，再由 Server 调用配置的命令；浏览器只读取状态和有界日志。
- 命令进程退出码为 0 仍不代表阶段完成；Harness 必须重新读取当前阶段产物并执行全部确定性校验。
- Gate 2 冻结前已经存在 Remotion 实现的历史项目按兼容模式处理；新项目必须提供引用当前冻结指纹的 `remotion-alignment.json`。
- 自动校验只检查契约完整性和指纹有效性，`visual-self-review-contract` 还要检查 Gate 2 自检记录及其证据路径；它不自动判断审美质量，也不自动通过人工 Gate。实际布局、动画和视觉质量仍需在 Gate 2／Gate 3 人工对照。

轻量原型播放与视觉自检回归：`node --test harness/test/dynamic-prototype.test.mjs harness/test/visual-self-review.test.mjs`。覆盖估算事件播放／暂停／重播／切幕、Workflow 分离、版本失效、证据越界、legacy 不降级、Web／单条／批量阻断和失败回退。机器校验不证明实际画面质量。

## 退役 Workflow 兼容

宣传片生产能力已移除；已完成宣传片保持永久只读，仅保留历史资料展示和已有输入包预览。生产目录仅返回口播教程；新建、任务和输入包生产入口必须返回 `workflow-retired`。只读兼容元数据不含执行器。已有输入包预览仍校验文件集合、路径、大小和 SHA-256，不重新生成历史产物。

## 统一生产迁移验收（自动回归已覆盖，实际验收待完成）

| ID | 条件与期望 | 当前状态 |
|---|---|---|
| AC-1 | 对话与 Web 使用相同 task packet、next 和阻塞；Gate 3 显示试听清单 | `unified-production` 覆盖实际 CLI、现代／兼容 HTTP 与共享服务；`web-server` 覆盖连续制作到 Gate 2 |
| AC-2 | 对话 claim／submit 使用持久化 Job；无产物、未变化、过期输入拒绝推进 | `unified-production` 覆盖三份产物校验、原样／过期回传阻断及单条／批量 TTS 持久化 |
| AC-3 | 同项目排斥重复执行；服务器重启保留对话任务，失败恢复原 ID | `unified-production` 覆盖两个 CLI 进程竞争、跨入口互斥、原 ID 重试及已保存阶段检查点恢复；强制杀进程的全部落盘窗口尚未验证 |
| AC-4 | 一次策划三份产物；Gate 1 内部检查；新项目 Gate 3 合并试听，旧契约保留独立试听 | `unified-production`、`harness`、`web-modules` 覆盖统一及旧契约；实际动态画面、正常速度试听和人工 Gate 待验收 |
| AC-5 | 上游变化导致正确返工与审核失效；completed 所有资料／状态／任务保持只读 | `unified-production` 覆盖音频审核失效、锁／任务／旧对象只读；`completed-readonly` 与 `web-regression` 校验保护及真实资料／状态哈希 |
| AC-6 | CLI、Web、批量共享交付服务；未授权或清单变化阻断，批量一次提交、逐视频恢复 | `render-delivery`、`batch-delivery`、`git-delivery`、`web-server` 覆盖准备、授权、清单变化、失败恢复及批量独立 Job；外部服务模拟，Git 使用临时本地远端 |
| AC-7 | 对话及 Web 实际路径、未完成视频从输入到 Gate 4 验收 | 待用户人工审核、授权渲染与跨视频验证 |

既有依赖旧审核流程的 Fixture 显式使用 `legacy-v1`；统一契约另有 25 项专项回归。模拟音频、视觉审核证据和外部响应只验证契约，不代表真实音视频质量或人工确认。

运行 `npm run test:production --prefix harness` 检查统一任务／审核及共享交付，运行 `npm test --prefix harness` 检查全部模块。入口隔离与证据位置见 `README.md`；本轮完整结果保存到本地 `local/harness-unified-production/verification.json`。AC-7 和上述强制中断窗口未全部验收，整体迁移仍未完成。
