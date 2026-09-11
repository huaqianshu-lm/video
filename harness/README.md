# Video Production Harness 0.6

## 目标

把当前已经验证的视频生产流程包装成一个可检查、可暂停、可恢复的单视频编排层。0.6 在 0.5 的阶段契约、资料校验和远程任务基础上，补齐远程任务状态分类、超时与可恢复错误、环境诊断、全局任务视图和 Gate 4 审查记录；不追求自动替代内容判断。

## 0.6 新增能力

- 远程任务统一记录 `submitted`、`waiting-run`、`running`、`recoverable`、`failed`、`timeout` 和 `succeeded` 状态。
- GitHub API 临时网络错误进入 `recoverable` 并保留下一次检查时间；权限、Artifact 和真实 Run 失败仍明确标记为失败。
- 已确认派发的任务超过超时阈值后进入 `timeout`，不再被后台轮询，并同步阻断对应阶段。
- `node harness/src/cli.mjs doctor` 和 Web UI 的 GitHub 配置检查可以验证 Token 是否存在、仓库、分支和两个 Workflow 是否可访问；不显示或持久化 Token。
- Web UI 首页提供全局远程任务列表，显示项目、阶段、Run、Artifact、最近检查和下次检查时间。
- Gate 2、Gate 3、Gate 4 的人工通过／驳回结果写入阶段状态，项目详情可追溯人工审查结果。

## 0.5 新增能力

- 远程任务提交前统一检查 Token、仓库和分支配置，配置错误不会生成失败任务。
- GitHub Actions 适配器支持独立的 dispatch、Run 发现、Run 状态查询和 Artifact 校验。
- 远程任务保存为可恢复记录，包含阶段、Workflow、分支、Run、Artifact、检查时间和错误信息。
- Web 服务启动时恢复未完成任务；页面关闭或服务重启后，任务仍可继续监控。
- 远程 Smoke Render／Render 成功后自动推进对应 Harness 阶段，失败时同时记录任务和阶段错误。
- CLI 新增 `jobs` 命令，Web UI 展示 Run 链接、Artifact、最近检查时间和后台状态。

## 0.4 新增能力

- Content Analysis、Video Narrative、Scene Script、Visual Script 和 Visual Prototype 的结构校验。
- Remotion Composition 配置、横屏规格、30fps、Scene 定义和字幕／时间轴 Manifest 接入校验。
- Gate 进入等待前先执行自动校验；校验失败时停留在 `failed`，不伪装成待人工确认。
- `context`、`next` 和 `report` 输出 Gate 对应的人工检查清单。
- 有效、无效、Legacy 和真实视频只读回归测试。

完整校验项和当前实现状态见 [`VALIDATION-MATRIX.md`](./VALIDATION-MATRIX.md)。

## 仓库边界

Harness 的代码、测试夹具和实现文档放在当前仓库的顶层 `harness/` 目录；通用视频模板放在 `templates/`，项目专项 Skill 放在 `.claude/skills/`。

Harness 可以读取并调用现有的：

- 本地 `videos/<video-slug>/` 生产资料；
- 本地 `src/videos/<video-slug>/` 视频配置和组件；
- 现有检查脚本；
- 项目既定的 TTS 和 GitHub Actions 入口。

这些具体视频目录不属于远端仓库能力，Harness 不应把它们当作唯一的通用模板来源。可复用的原型基线和脚本结构使用受 Git 跟踪的 `templates/`。Harness 不直接修改已经完成的视频资料，也不重写共享 Remotion 场景。真实视频只用于只读回归，继续用最小测试项目验证 Harness 自身行为。

## 0.2 范围

### 包含

1. 单视频项目初始化和配置读取。
2. 阶段状态记录和产物清单。
3. 阶段前置条件检查。
4. Gate 暂停、通过和驳回。
5. 确定性资料校验。
6. 失败重试和断点续做。
7. TTS、字幕／时间轴、Remotion 和远程渲染适配器接口。
8. Mock 适配器和自动化验收测试。
9. 15 阶段统一 Workflow 元数据。
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
source
→ content-analysis
→ video-narrative
→ scene-script
→ narration-script
→ visual-script
→ visual-prototype
→ gate-2
→ tts
→ subtitle-timeline
→ remotion
→ gate-3
→ smoke-render
→ render
→ gate-4
```

其中 Gate 1 是 `content-analysis`、`video-narrative` 和 `scene-script` 的组合审查；Gate 2 是口播、视觉脚本和原型的组合审查。TTS、字幕和时间轴必须从 Gate 2 冻结后的 `tts-script.json` 派生。

## 执行原则

- 阶段只有在输入存在、前置校验通过且上游状态有效时才能执行。
- 已成功且输入未变化的阶段不得重复生成。
- 上游输入变化时，受影响的下游产物必须标记为失效，不能静默复用。
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

- 15 个阶段由单一 Workflow 定义提供顺序、Gate、适配器和产物信息。
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

在仓库根目录执行：

```bash
npm test --prefix harness
```

测试使用 Node 原生测试运行器和系统临时目录，不调用真实 TTS、GitHub Actions 或本机 MP4 渲染。

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

- 查看视频项目列表、15 个生产阶段和下一步动作；
- 在首页导入 Markdown 或纯文本原文件；系统按文件名或手工填写的 slug 创建新项目，保存为 `videos/<slug>/source.md`，已存在项目不会被覆盖；
- 查看生产资料、TTS／字幕／Timeline Manifest 和 Remotion 文件；
- 预览 Visual Prototype；
- 初始化 Harness 项目状态；
- 为 Agent 阶段创建持久化后台任务，查看状态、有界日志并在失败后重试；Agent 退出后只有真实产物通过 Harness 校验才推进阶段；
- Gate 2 通过时冻结 Visual Script／Visual Prototype 指纹，Remotion 阶段校验逐 Scene `remotion-alignment.json`，Gate 3 并排对照原型与 Remotion Studio；
- 执行校验、阶段推进、Gate 通过／驳回、重试和断点续做；
- 发起远程 Smoke Render／Render 后查看任务状态和 Artifact 元数据；
- 在远程渲染阶段提供“准备远程渲染资源”动作：从本地 `videos/<video-slug>/`、`src/videos/<video-slug>/` 和资源包整理独立输入包，并在提交前检查输入包、Manifest、能力代码和 dispatch 分支；不自动 commit 或 push；
- 通过 `render-input` 命令把本地 `videos/<video-slug>/`、`src/videos/<video-slug>/` 和资源包整理为被 Git 忽略的独立输入包；远端只下载这个包到临时工作区，不把具体视频资料混入能力仓库；
- 查看后台任务的 Run 链接、Run ID、Artifact 名称、最近检查时间和失败原因；
- 在首页查看所有视频项目的远程任务，并手动执行 GitHub 配置诊断；
- 对未初始化的旧视频执行 Legacy 只读检查。

Web UI 只监听 `127.0.0.1`，运行状态写入被 Git 忽略的 `harness/projects/`。导入原文件时先选择系列；项目会锁定系列 Style，并在视觉原型阶段读取该 Style 对应的已验证原型基线。Agent 任务会按当前阶段声明的输出路径修改视频生产资料，但仍不自动通过人工 Gate。普通 Agent 阶段默认使用项目内适配器调用本机 `codex` CLI；TTS 阶段默认使用项目内 TTS 适配器；Remotion 阶段使用独立的 Remotion 适配器。环境变量只用于显式覆盖默认执行器。

如果需要替换普通 Agent 的执行器，可配置本地命令及 JSON 参数数组：

```bash
export HARNESS_AGENT_EXECUTOR_COMMAND="<agent-command>"
export HARNESS_AGENT_EXECUTOR_ARGS='["<arg-1>","<arg-2>"]'
export HARNESS_AGENT_EXECUTOR_CWD="<optional-working-directory>"
```

Harness 通过 stdin 发送结构化阶段任务包。`subtitle-timeline` 和 `remotion` 分别继续使用 `HARNESS_TTS_EXECUTOR_*` 与 `HARNESS_REMOTION_EXECUTOR_*`；浏览器不会接触执行器凭据。

### TTS 执行器

当前项目已提供可直接接入既有 TTS 工程的 Harness 适配器。Gate 2 通过时，Harness 会调用既有 TTS 工程的 `scripts/build_tts_script.py`，从冻结的 `narration-script.md` 生成 `tts-script.json`；CLI、WebUI 不各自实现 Markdown 解析规则。普通 `npm run harness:web` 会自动使用该适配器；它读取生成并校验过的 `videos/<video-slug>/tts-script.json`，按 `+25%` 调用 TTS 工程中的三个脚本，再把音频、字幕和 Timeline Manifest 同步到当前视频目录，并自动生成 `assets/<video-slug>-assets.zip`。默认假设 TTS 工程与本仓库同级，目录为 `../tts`；如果目录不同，或需要替换适配器，显式设置：

```bash
export HARNESS_TTS_EXECUTOR_COMMAND="node"
export HARNESS_TTS_EXECUTOR_ARGS='["/Users/limiao/personal/2-topic/4-AI/project/video/harness/src/tts-harness-adapter.mjs"]'
export HARNESS_TTS_EXECUTOR_CWD="/Users/limiao/personal/2-topic/4-AI/project/video"
export HARNESS_TTS_PROJECT_DIR="/Users/limiao/personal/2-topic/4-AI/project/tts"
export HARNESS_TTS_PYTHON="/Users/limiao/personal/2-topic/4-AI/project/tts/.venv/bin/python"
export HARNESS_TTS_SCRIPT_BUILDER="/Users/limiao/personal/2-topic/4-AI/project/tts/scripts/build_tts_script.py"
```

适配器会在 `harness/.cache/tts/` 保留按 TTS Script 内容哈希区分的可恢复中间结果；这个目录已加入 Git 忽略。启动 Web UI 的终端必须继承上述环境变量，修改后需要重启 Web Server。

## CLI 使用

初始化和查看项目状态：

```bash
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs jobs <video-slug>
node harness/src/cli.mjs jobs --all
node harness/src/cli.mjs doctor
node harness/src/cli.mjs validate <video-slug> [stage]
node harness/src/cli.mjs next <video-slug>
node harness/src/cli.mjs report <video-slug>
node harness/src/cli.mjs context <video-slug>
node harness/src/cli.mjs plan <video-slug> --until visual-prototype
node harness/src/cli.mjs next <video-slug> --json
node harness/src/cli.mjs report <video-slug> --json
node harness/src/cli.mjs doctor --json
node harness/src/cli.mjs assets package <video-slug> --json
node harness/src/cli.mjs render-input prepare <video-slug> --json
node harness/src/cli.mjs render-input validate <video-slug> --json
node harness/src/cli.mjs render-input package <video-slug> --json
node harness/src/cli.mjs render-input entry-all --output src/RenderInputRoot.tsx --json
```

远程渲染输入包位于被忽略的 `local/render-input/<video-slug>/`，压缩包位于同目录下的 `<video-slug>.zip`。准备输入包不会 commit 或 push：

```bash
node harness/src/cli.mjs render-input prepare <video-slug>
node harness/src/cli.mjs render-input package <video-slug>
export HARNESS_RENDER_INPUT_URL="<private-input-package-url>"
export HARNESS_RENDER_INPUT_SHA256="<sha256-of-zip>"
node harness/src/cli.mjs remote-run <video-slug> smoke-render
```

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

该命令扫描本地 `src/videos/` 和 `videos/`，为每个可匹配的视频注册一个 Composition。一个视频目录存在多个版本时，优先选择组件与配置版本号匹配且修改时间较晚的一组；因此 `claude-code-what-is` 使用 `ClaudeCodeWhatIsVideo14.tsx`、`video14.config.ts` 和 `claude-code-what-is-v2`。入口文件仍被 Git 忽略，视频资料和资源不会因此进入仓库。

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

执行真实 GitHub Actions 的 Smoke Render 或完整 Render 时，需要提供：

```bash
export GITHUB_TOKEN="<token>"
export GITHUB_REPOSITORY="<owner>/<repo>"
export HARNESS_GITHUB_REF="<optional-explicit-branch>"
export HARNESS_RENDER_INPUT_URL="<private-input-package-url>"
export HARNESS_RENDER_INPUT_SHA256="<sha256-of-zip>"
node harness/src/cli.mjs run <video-slug> smoke-render
node harness/src/cli.mjs run <video-slug> render
```

`HARNESS_GITHUB_REF` 是显式覆盖项；未设置时，本地 Harness 默认使用当前 Git 工作区分支。只有无法从当前工作区解析分支时，才回退到 `GITHUB_REF_NAME`。

远程渲染提交前，Web UI 会要求输入包和渲染能力代码已准备，并确认 dispatch 分支包含当前能力代码提交。已有视频可以先点击“准备远程渲染资源”；命令行等价操作为 `node harness/src/cli.mjs render-input prepare <video-slug>` 和 `node harness/src/cli.mjs render-input package <video-slug>`。输入包上传到独立受控地址后，再配置 `HARNESS_RENDER_INPUT_URL` 与 `HARNESS_RENDER_INPUT_SHA256`。如果输入包或能力代码随后发生变化，提交动作必须重新准备并校验，不能继续使用旧输入包。

真实渲染使用 GitHub Actions，不使用本机 Remotion 渲染；Web UI 后台监控器会持续查询对应 Run，完成后检查 Artifact 并推进 Harness 阶段。CLI 的 `run` 保留一次性等待模式；`jobs` 可查看已经持久化的远程任务。
