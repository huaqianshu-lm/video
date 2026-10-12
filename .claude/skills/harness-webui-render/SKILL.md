---
name: harness-webui-render
description: 操作或修改本地 Harness Web UI、持久化任务、批量编排、资源预检、独立 Smoke Render 环境检查及 GitHub Actions 交付。
---

# Harness Web UI 与远程渲染

修改入口、任务执行或交付方式前，遵守 `docs/HARNESS-PRODUCTION-CONTRACT.md`“视频制作与流程变更的边界”；实际调用检查包括任务提示、自动生成调用、强制依赖、校验拒绝条件及默认／回退路径。视频制作或 Gate 批准不附带流程改造授权，阶段名称未变也不能省略对制作方式变更的说明与确认。

处理 Harness Web UI、批量任务、Agent 执行器、资源打包、Smoke Render、完整渲染或 GitHub Actions 交付时，使用本 Skill。

当前生产仅使用 `storyboard-v1` 与现行分镜契约。先读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 和 `docs/STORYBOARD-EXECUTION-QUALITY.md`；不提供旧流程或版本选择。旧资料不符合当前规则时先用 Harness 正常返工，不自动改写历史项目，completed 永久只读。

## 核心行为

- 处理分镜任务和审核时，读取 `docs/STORYBOARD-EXECUTION-QUALITY.md` 及其审计模板。当前生产使用Agent 制作的画面产物、alignment 5 和绑定版本的观看证据；旧格式仅供历史读取。批准后的返工必须保留历史 Gate 事实并使用共享服务；不得强行调用仅适用于等待中 Gate 的驳回 API，也不得直接修改项目状态。
- 单条新交付默认本地；显式选择 `github` 时保留既有远程流程。批量渲染仅使用 `github`。两种方式都复用 `render-delivery prepare／start／resume`；没有 `backend` 字段的旧记录仍解释为 `github`。按 `docs/RENDER-DELIVERY-BASELINE.md` 完成对应方式的准备；本地交付不得要求 GitHub 凭据、发布、commit 或 push。不得在应用代码中提升浏览器权限。
- 复用 Harness 阶段契约和持久化项目状态；不得在浏览器中重复实现阶段或 Gate 逻辑。
- Web UI 只监听 `127.0.0.1`；浏览器不得接收到 GitHub Token。
- Agent、TTS、Remotion 和远程任务必须持久化、可恢复、幂等，并在进程退出后根据真实产物重新校验。
- 缺少执行器、进程失败或产物无效时，保持可重试失败或等待任务状态；不得创建占位产物。
- 读取 `docs/HARNESS-PRODUCTION-CONTRACT.md`：生产只使用当前 Storyboard 契约。Gate 2 审核口播／设计；Gate 3 合并实际观看与正常速度试听；Gate 4 审核交付。历史契约只读，不支持的资料须正常返工。所有入口使用 Harness 任务和持久化记录。
- Smoke Render 是新系列或渲染环境变化时独立、手动的环境检查。它不推进 Harness 阶段、不创建 Harness 生产 Job，也不写入视频审核记录。
- 决定阶段、产物、资源检查或远程输入前，先解析服务端 Workflow Profile；浏览器不得复制 Workflow 阶段图或业务规则。
- `narrated-tutorial-v1` 保留 MP3／VTT／SRT 及口播 Manifest 契约。
- 新 Workflow 项目资料使用 Profile 定义的唯一命名空间路径；已有口播视频的 legacy-flat 路径仍可读取，不做迁移。持久化的 `project.json.workflow` 和解析后的路径字段是权威依据。

## 远程交付预检

Agent 系列封面按 `docs/AGENT-SERIES-COVER.md` 处理；独立输入必须包含冻结封面快照，以及资源 ZIP 中与之匹配的图片。Studio 与 Runner 使用同一生成封面入口；封面资源缺失或不一致时阻断交付。

操作此路径前，遵守项目 `CLAUDE.md` 中强制要求的成功验证复用规则。沿用此前已验证的执行环境和代码基线；明确记录尚未实现的机器检查和未完成的跨视频验证，不得把操作上的临时解决办法声称为永久修复。

每个交付入口都读取 `docs/RENDER-DELIVERY-BASELINE.md`。对话／CLI 使用 `render-delivery prepare／start／resume`；Web 操作和批量交付复用该服务。复用已验证的本地方法配置；准备阶段检查成功基线，并在展示精确提交清单前发布／绑定输入。准备阶段不 commit、不 push、不派发。只有明确确认当前计划 ID 后才能开始执行。批量交付一次确认合并文件清单并提交一次，每条视频保留独立输入和 Job。恢复持久化交付，不重新构建或重复派发。旧 CLI `remote-run` 和 `run <slug> render` 保持停用。实际入口和跨视频待验证事项见 `ROADMAP.md`。

### Agent 执行环境

- macOS 上的 Agent 沙箱可能同时阻断系统钥匙串和 GitHub 网络访问。在该沙箱中，`gh auth token` 或 `gh auth status` 失败，不能证明已保存凭据无效。
- 已授权的远程渲染操作读取凭据或连接失败时，使用执行工具批准的宿主访问方式，移除该命令环境中的 `GITHUB_TOKEN` 和 `GH_TOKEN` 后重新进行只读检查。提出任何凭据变更前，检查 `gh auth status`、Harness `doctor` 及独立输入仓库的读写权限。需要时通过执行工具申请沙箱权限提升；不得从应用代码中尝试逃离沙箱。
- 输入发布／绑定、已授权 Git push、派发和监控，必须在通过上述检查的同一已批准环境中执行。限制沙箱中启动的服务，不会因另一终端检查成功而获得宿主访问权限。
- 只有已批准环境确认缺少凭据，或 GitHub 实际拒绝认证时，才建议重新认证。不得仅因沙箱无法读取钥匙串而修改 Token、Shell 启动文件、Secrets 或账号登录。输出和持久化记录不得包含 Token。

派发 Harness 完整渲染前，以及输入包通过 Harness 准备的独立 Smoke Render 手动触发前：

- 完整渲染必须有单视频绑定记录，固定 slug、Composition ID、已发布 URL、输入包指纹及 ZIP SHA-256；旧全局 URL／SHA 环境变量不得绕过此检查。
- 验证资源 ZIP 可以完整解压，且包含预期的 `<video-slug>/` 顶层目录。
- `narrated-tutorial-v1` 必须同时包含 `subtitles/captions.vtt` 和 `subtitles/captions.srt`，再将 ZIP 中每个 MP3 的路径与数量同 Audio Manifest 及其他口播 Manifest 核对。
- 确认所需代码、配置和资源文件均已受跟踪、无未提交修改，并存在于派发分支。
- 按以下顺序解析分支：显式 `HARNESS_GITHUB_REF`、当前 Git 工作树分支，最后才以 `GITHUB_REF_NAME` 作为回退。

## Git 边界

- 构建交付计划前，在已批准的执行环境中 fetch 实际派发分支，并比较其提交与本地分支。本地 `origin/<branch>` 可能过期。存在此前成功渲染时，检查其准确 Run `head_sha`，确认新交付基线包含该提交或明确审核过的等效修复；不得根据分支名或上一条视频成功推断代码兼容。
- 本地开发与远程派发分支分叉时，从已验证远端基线准备隔离交付检出目录，保留原有含未提交修改的工作树。针对该基线重新计算必要文件的精确差异，并在 commit／push 前取得所需文件清单确认。不得推送无关本地祖先提交，也不重复提交远端已有修复。这不表示开发分支已经同步；剩余整合工作必须在 `ROADMAP.md` 中明确保留。
- 准备资源时不得 commit 或 push。
- 只有用户明确确认的「提交并完整渲染」入口，才可为当前视频交付文件定向 commit 和 push。
- 不得使用 `git add .`；不得包含无关视频、文档或工作树改动。
- 不得绕过人工审核；没有已校验产物时，不得把任务状态转换为生产阶段完成。
- Remotion 生产任务在 Gate 3 校验或 Studio 预览前，必须从当前已校验的单视频输入包生成由 Git 忽略的 `src/RenderInputRoot.tsx`；受跟踪的 `src/Root.tsx` 保持通用，不得用作具体视频的回退入口。
- 独立 Smoke Render 必须使用未完成视频或独立副本；不得修改 `completed` 视频的内容、状态、Job、审核或相关产物。

## 按需读取的参考资料

- 端到端交接：读取 `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md`。
- 命令与本地配置：读取 `harness/README.md`。
- 适用回归覆盖：读取 `harness/VALIDATION-MATRIX.md`。

## 已退役 Workflow

生产只提供 `narrated-tutorial-v1`。历史已完成宣传片保持只读，包括记录和输入包；保留的宣传片组件仅作为预览依赖。不得启动已退役 Workflow 的生产或打包。
