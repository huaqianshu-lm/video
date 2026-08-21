# Video Production Harness 0.4

## 目标

把当前已经验证的视频生产流程包装成一个可检查、可暂停、可恢复的单视频编排层。0.4 在 0.3 的阶段契约、任务包和样式边界基础上，补齐生产资料结构校验、Remotion 技术校验、Gate 自动前置校验和人工检查清单；不追求自动替代内容判断，也不建设 Web 平台。

## 0.4 新增能力

- Content Analysis、Video Narrative、Scene Script、Visual Script 和 Visual Prototype 的结构校验。
- Remotion Composition 配置、横屏规格、30fps、Scene 定义和字幕／时间轴 Manifest 接入校验。
- Gate 进入等待前先执行自动校验；校验失败时停留在 `failed`，不伪装成待人工确认。
- `context`、`next` 和 `report` 输出 Gate 对应的人工检查清单。
- 有效、无效、Legacy 和真实视频只读回归测试。

完整校验项和当前实现状态见 [`VALIDATION-MATRIX.md`](./VALIDATION-MATRIX.md)。

## 仓库边界

Harness 的代码、测试夹具和实现文档放在当前仓库的顶层 `harness/` 目录。

Harness 可以读取并调用现有的：

- `videos/<video-slug>/` 生产资料；
- `src/videos/<video-slug>/` 视频配置和组件；
- 现有检查脚本；
- 项目既定的 TTS 和 GitHub Actions 入口。

0.2 不直接修改已经完成的视频资料，也不重写共享 Remotion 场景。真实视频只用于只读回归，继续用最小测试项目验证 Harness 自身行为。

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

- Web UI、数据库和多用户权限；
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

## Web UI 第一版

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
- 查看生产资料、TTS／字幕／Timeline Manifest 和 Remotion 文件；
- 预览 Visual Prototype；
- 初始化 Harness 项目状态；
- 执行校验、阶段推进、Gate 通过／驳回、重试和断点续做；
- 发起远程 Smoke Render／Render 后查看任务状态和 Artifact 元数据；
- 对未初始化的旧视频执行 Legacy 只读检查。

Web UI 只监听 `127.0.0.1`，运行状态写入被 Git 忽略的 `harness/projects/`，不会修改视频生产资料。第一版不自动生成口播、视觉脚本或 Remotion 代码。

## CLI 使用

初始化和查看项目状态：

```bash
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs validate <video-slug> [stage]
node harness/src/cli.mjs next <video-slug>
node harness/src/cli.mjs report <video-slug>
node harness/src/cli.mjs context <video-slug>
node harness/src/cli.mjs plan <video-slug> --until visual-prototype
node harness/src/cli.mjs next <video-slug> --json
node harness/src/cli.mjs report <video-slug> --json
```

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
export GITHUB_REF_NAME="<branch>"
node harness/src/cli.mjs run <video-slug> smoke-render
node harness/src/cli.mjs run <video-slug> render
```

真实渲染使用 GitHub Actions，不使用本机 Remotion 渲染；适配器会等待对应 Run 完成，并把 Run 和 Artifact 元数据写入 Harness 阶段状态。
