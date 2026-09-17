# Remotion AI Video Harness

这是一个专门服务于视频生产的 Harness。它把一条视频从原始内容推进到最终 MP4：内容分析、视频叙事、Scene 脚本、口播稿、视觉脚本、视觉原型、TTS、字幕与时间轴、Remotion、远程渲染和人工验收都在同一套阶段契约下管理。

它不是“点一下就自动出片”的黑盒。系统负责记录状态、校验资料、调度任务、保存失败信息和恢复上下文；口播、视觉原型、Remotion 预览和最终视频仍然要经过人工 Gate。

当前 Harness 版本为 `0.6.0`。当前生产流程有 14 个阶段；历史上的 `Smoke Render` 已经退出生产阶段，只保留为独立的 GitHub Actions 环境检查。

## 当前生产流程

```text
原始内容
  ↓
内容分析 → 视频叙事 → Scene 脚本
  ↓ Gate 1：内容与叙事内部审查
口播稿 → 视觉脚本 → 视觉原型
  ↓ Gate 2：人工确认口播和视觉原型
TTS → 音频／字幕／Timeline
  ↓ TTS 人工质检
Remotion 实现
  ↓ Gate 3：人工预览确认
完整 Render
  ↓ Gate 4：人工验收最终 MP4
完成
```

Harness 里实际登记的 14 个生产阶段是：

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
→ render
→ gate-4
```

其中：

- Gate 1 是内容分析、视频叙事和 Scene 脚本完成后的内部审查，不是一个单独的生产阶段。
- Gate 2、TTS 质检、Gate 3 和 Gate 4 都必须由人确认，Harness 不会替用户点击通过。
- Gate 3 通过后直接进入完整 Render，不再插入 Smoke Render。
- 远程 Render 成功只代表 Run 和 Artifact 通过机器校验，项目会停在 Gate 4 等待用户下载、播放和验收。
- 已经进入 `completed` 的视频永久只读。需要做新版本时，使用新的 video slug，不能回写旧视频。

## 已实现的能力

- 单视频阶段管理：初始化、校验、运行、暂停、恢复、重试、Gate 通过和 Gate 驳回。
- 本地 Web UI：查看项目、资料、阶段状态、下一步动作、Agent Job、Remotion 任务、远程 Job、Run 和 Artifact。
- 持久化后台任务：Agent、TTS、Remotion 和远程任务都会保存状态；服务重启后可以继续检查，失败任务可以重试。
- 批量编排：支持批量到 Gate 2、批量完成 TTS、批量完成 Remotion 和批量完整渲染；每条视频仍使用自己的阶段状态和人工检查点。
- TTS 与音画同步：Gate 2 后先生成并校验独立的 `tts-script.json`，音频、字幕和 Timeline Manifest 从它派生，Remotion 使用经过校验的 Manifest 驱动时间轴。
- Visual Prototype 与 Remotion 对照：Gate 2 冻结原型基线，Gate 3 按 Scene 对照原型、Visual Script 和 `remotion-alignment.json`。
- 独立渲染输入包：每条视频有自己的输入目录、Manifest、资源 ZIP、源资料快照、package fingerprint 和远程绑定记录。
- GitHub Actions 远程 Render：Runner 在临时目录恢复输入包，校验 slug、Composition、资源、Manifest 和 SHA-256 后生成最终 MP4 并上传 Artifact。
- 远程任务恢复：保存准确的 dispatch、Run ID、Run URL 和 Artifact 信息；批量远程 Job 进入终态后可以继续批次，不会因为页面关闭而丢失上下文。
- 只读保护：已完成视频的资料、配置、状态、Gate、Job、批次和相关产物都不能被 Harness、Web UI 或后台任务修改。

## 快速开始

### 环境要求

- Node.js 18 或更高版本。
- npm。
- 本机可用的 `codex` CLI，用于默认 Agent 执行器。
- 需要生成 TTS 时，使用项目既定的 TTS 工程；默认位置是当前仓库同级的 `../tts`。
- 需要远程 Render 时，安装并登录 GitHub CLI（`gh`），并拥有目标仓库的 Actions 和推送权限。

### 安装依赖

```bash
npm install
```

### 启动 Harness Web UI

```bash
npm run harness:web
```

然后打开：

```text
http://127.0.0.1:4173
```

Web UI 只监听本机 `127.0.0.1`，浏览器不会接触 GitHub Token。首页可以导入 Markdown／纯文本源文件、选择系列或通用风格，并查看当前所有视频项目。

### 启动 Remotion Studio

```bash
npm run preview
```

这个命令会先扫描已经校验通过的逐视频输入包，生成被 Git 忽略的 `src/RenderInputRoot.tsx`，再启动 Studio。它不会把具体视频硬编码进受跟踪的 `src/Root.tsx`。

也可以手动生成入口：

```bash
node harness/src/cli.mjs render-input entry-all \
  --output src/RenderInputRoot.tsx
npx remotion studio src/RenderInputRoot.tsx
```

没有有效输入包的未完成视频会先尝试准备；`completed` 视频缺包或包损坏时只读跳过，不会为了预览修改它。

## 单视频 CLI

常用的状态和诊断命令：

```bash
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs validate <video-slug> [stage]
node harness/src/cli.mjs next <video-slug>
node harness/src/cli.mjs report <video-slug>
node harness/src/cli.mjs context <video-slug>
node harness/src/cli.mjs plan <video-slug> --until visual-prototype
node harness/src/cli.mjs jobs <video-slug>
node harness/src/cli.mjs jobs --all
node harness/src/cli.mjs doctor --json
```

阶段执行和人工 Gate：

```bash
node harness/src/cli.mjs run <video-slug> [stage]
node harness/src/cli.mjs resume <video-slug>
node harness/src/cli.mjs retry <video-slug> [stage]
node harness/src/cli.mjs approve <video-slug> <gate>
node harness/src/cli.mjs reject <video-slug> <gate> \
  --return-to <stage> --reason "<reason>"
```

Remotion 制作任务可以单独查看和重试：

```bash
node harness/src/cli.mjs remotion-task list
node harness/src/cli.mjs remotion-task show <task-id>
node harness/src/cli.mjs remotion-task run <task-id>
node harness/src/cli.mjs remotion-task retry <task-id>
```

Remotion 任务只有在项目当前处于 `remotion / ready` 时才能执行。Gate 3 通过后，旧任务只读展示；只有 Gate 3 驳回并明确回退到 Remotion，任务才可以重新执行。

## 批量制作

当前有四种批量目标：

| 批量目标 | 自动推进 | 停在哪里 |
| --- | --- | --- |
| `to-gate-2` | 内容分析、叙事、Scene、口播、视觉脚本、视觉原型 | Gate 2 人工确认 |
| `to-tts` | TTS、音频、字幕和 Timeline | TTS 人工质检 |
| `to-remotion` | Remotion 任务和产物校验 | Gate 3 人工预览 |
| `to-render` | Gate 3 通过后的完整 Render 交付 | Gate 4 人工验收 |

批量记录可以用 CLI 查看和创建：

```bash
node harness/src/cli.mjs batch types
node harness/src/cli.mjs batch create to-gate-2 <video-slug>...
node harness/src/cli.mjs batch create to-tts <video-slug>...
node harness/src/cli.mjs batch create to-remotion <video-slug>...
node harness/src/cli.mjs batch create to-render <video-slug>...
node harness/src/cli.mjs batch list
node harness/src/cli.mjs batch status <batch-id>
node harness/src/cli.mjs batch run <batch-id>
node harness/src/cli.mjs batch resume <batch-id> --retry-failed
node harness/src/cli.mjs batch approve-tts-qc <batch-id> <video-slug>
```

上面的 `batch run` 和 `batch resume` 只适用于非正式渲染批次。`to-render` 批次不能通过 CLI 绕过交付流程；它必须在 Web UI 中按下面的顺序执行。

### 批量完整 Render 的正确方式

每条视频都必须独立准备，不能把一条视频的 ZIP、URL、SHA-256 或绑定记录复用给另一条：

1. 确认视频已经通过 Gate 3，当前状态是 `render / ready`。
2. 对每条视频分别执行 `render-input prepare`、`render-input validate`、`render-input package`。
3. 把各自的 ZIP 发布到受控的独立输入源，再分别用 `render-input bind` 保存 URL 和 SHA-256。发布地址如果是私有 GitHub Release，必须使用 API 资产地址，不使用网页下载地址。
4. 在 Web UI 创建或打开 `to-render` 批次。系统会重新准备和校验输入包，并展示每条视频的 Composition ID、URL、ZIP SHA-256、package fingerprint、绑定文件 SHA-256、分支和精确提交文件清单。
5. 逐项确认页面展示的精确文件清单，然后分别确认定向 commit 和 push。系统只操作交付计划列出的路径，禁止使用 `git add .`，也不会提交具体视频资料、媒体或 `local/`。
6. 代码推送成功后，再单独确认是否真的触发 GitHub Actions Render。没有这一步确认，系统不会创建真实 Render Job。
7. 远程 Job 完成后，Harness 会分别保存 Job、Run ID、Run URL、输入包绑定和 Artifact 归属；批量流程可以从远程 Job 终态继续运行，但不会自动通过 Gate 4。
8. 用户负责下载 Artifact、播放最终 MP4，并完成每条视频的 Gate 4 验收。

如果任意一条视频的输入包、绑定、Manifest、Git 文件、分支或提交发生变化，交付计划会失效，需要重新预检和确认。不能用临时 shell 变量里的全局 URL／SHA-256 冒充持久化绑定。

## 远程渲染输入包

每条视频的本地输入包都放在被 Git 忽略的目录中：

```text
local/render-input/<video-slug>/
├── render-input.json
├── videos/<video-slug>/...
├── src/videos/<video-slug>/...
└── assets/<video-slug>-assets.zip

local/render-input/<video-slug>.zip
local/render-input/<video-slug>.delivery.json
```

准备和检查命令：

```bash
node harness/src/cli.mjs render-input prepare <video-slug>
node harness/src/cli.mjs render-input validate <video-slug>
node harness/src/cli.mjs render-input package <video-slug>
node harness/src/cli.mjs render-input bind <video-slug> \
  --url "<published-zip-url>" \
  --sha256 "<zip-sha256>"
```

校验不是只看 ZIP 是否存在，还会核对：

- Manifest 声明的实际文件集合、逐文件大小和 SHA-256。
- `packageFingerprint` 和源资料快照。
- Remotion 配置、组件导出和 Composition ID。
- 资源 ZIP 是否可以完整解压，顶层目录是否正确。
- `captions.vtt`、`captions.srt`、Audio／Subtitle／Timeline Manifest 是否存在且相互匹配。
- 资源 ZIP 中的每一个 MP3 路径和数量是否与 Audio Manifest 一致。
- 发布 URL 下载到的内容是否与本地 ZIP 的 SHA-256 一致。

GitHub Actions 会把 ZIP 下载到 Runner 临时目录，在临时工作区恢复 `videos/`、`src/videos/` 和资源包，生成临时 `src/RenderInputRoot.tsx`，完成类型检查后执行完整 Render。具体视频资料和媒体不会进入能力仓库。

## GitHub Actions 和认证

本地默认使用 GitHub CLI 的系统凭据：

```bash
unset GITHUB_TOKEN GH_TOKEN
gh auth login --hostname github.com --git-protocol https --web
gh auth setup-git
export GITHUB_REPOSITORY="<owner>/<repo>"
export HARNESS_GITHUB_REF="<optional-explicit-branch>"
node harness/src/cli.mjs doctor --json
```

分支选择顺序是：显式的 `HARNESS_GITHUB_REF`、当前 Git 工作区分支、最后才是 `GITHUB_REF_NAME`。`RENDER_INPUT_TOKEN` 是 GitHub Actions 下载私有输入包使用的仓库 Secret，不是本地 GitHub API 登录 Token。

仓库有两个 Workflow：

- `.github/workflows/render-video.yml`：完整 Render，上传 `<video-slug>` Artifact。
- `.github/workflows/smoke-test-video.yml`：独立 Smoke Render，上传代表帧和短片 Artifact。

### Smoke Render 的边界

Smoke Render 只用于新系列或渲染环境变化时检查字体、Runner、依赖、资源链路和音轨。它必须从 GitHub Actions 页面手动触发，不能从 Harness 的 `run`、`remote-run` 或批量按钮触发，也不会推进项目阶段、创建 Harness 生产 Job 或写入视频审核记录。

Smoke Render 应选择未完成视频或独立副本；不能对已经 `completed` 的视频做会写回状态、资料或产物的操作。

## 项目结构和 Git 边界

```text
.
├── .github/workflows/       # 完整 Render 和独立 Smoke Render Workflow
├── harness/                 # Harness 核心、Web UI、任务状态、交付逻辑和测试
├── .claude/skills/          # 项目专项 Skill
├── templates/               # 不包含具体主题的通用脚本和原型模板
├── styles/                  # 可复用视觉风格基线
├── src/components/          # 通用 Remotion 组件
├── src/scenes/              # 通用场景组件
├── src/lib/                 # 类型、时间轴和同步工具
├── src/Root.tsx             # 受跟踪的通用 Composition 入口
├── src/RenderInputRoot.tsx  # 被忽略的逐视频临时入口
├── docs/                    # 稳定规范、架构和使用文档
├── videos/<slug>/           # 本地具体视频资料，不提交
├── src/videos/<slug>/       # 本地具体视频配置和组件，不提交
├── assets/                  # 本地资源 ZIP，不提交
├── public/local-assets/     # 本地解压资源，不提交
├── series/                  # 本地系列资料，不提交
├── local/                   # 本地输入包和快照，不提交
├── out/                     # 本地渲染产物，不提交
├── drafts/                  # 本地方案，不提交
└── notes/                   # 本地笔记，不提交
```

应长期维护并提交的是 Harness、通用 Remotion 能力、模板、Skill、稳定文档、测试和 `ROADMAP.md`。具体视频资料、生产资源、媒体、输入包、状态目录和临时 Studio 入口都只保存在本地。

## 检查命令

在仓库根目录执行：

```bash
node --version
npm run check
npm test --prefix harness
git diff --check
```

测试使用 Node 原生测试运行器和测试夹具，主要验证阶段契约、Gate、任务恢复、输入包、资源完整性、Git 交付、Web API 和 Web Server；不会代替真实 GitHub Actions Render，也不会自动完成用户的 Gate 4 播放验收。

## 规则和进一步阅读

- [`CLAUDE.md`](./CLAUDE.md)：项目边界、不可变约束和 Skill 路由。
- [Harness 使用文档](./harness/README.md)：Harness 内部命令、适配器和 Web UI 细节。
- [Harness 校验矩阵](./harness/VALIDATION-MATRIX.md)：当前测试覆盖范围。
- [端到端视频生产方案](./docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md)：人工 Gate 和远程交付架构。
- [视频生产流程](./docs/VIDEO-PROJECT-WORKFLOW.md)：七层资料和生产职责。
- [视频生产规范](./docs/VIDEO-PRODUCTION-RULES.md)：Scene、视觉、字幕和质量要求。
- [TTS 安装与配置](./docs/TTS-SETUP.md)：TTS 工程和本地配置。
- [`ROADMAP.md`](./ROADMAP.md)：当前视频数量、项目阶段、阻塞和下一步。

README 只描述当前稳定能力和正确使用方式。具体某条视频是否完成、是否有 Render Job、是否等待人工 Gate，以 `ROADMAP.md` 和对应项目的实时 `state.json` 为准。
