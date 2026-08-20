# Video Production Harness 0.1

## 目标

把当前已经验证的视频生产流程包装成一个可检查、可暂停、可恢复的单视频编排层。第一版优先解决流程可靠性，不追求自动替代内容判断，也不建设 Web 平台。

## 仓库边界

Harness 的代码、测试夹具和实现文档放在当前仓库的顶层 `harness/` 目录。

Harness 可以读取并调用现有的：

- `videos/<video-slug>/` 生产资料；
- `src/videos/<video-slug>/` 视频配置和组件；
- 现有检查脚本；
- 项目既定的 TTS 和 GitHub Actions 入口。

第一版不直接修改已经完成的视频资料，也不重写共享 Remotion 场景。真实视频只用于只读回归，先用最小测试项目验证 Harness 自身行为。

## 第一版范围

### 包含

1. 单视频项目初始化和配置读取。
2. 阶段状态记录和产物清单。
3. 阶段前置条件检查。
4. Gate 暂停、通过和驳回。
5. 确定性资料校验。
6. 失败重试和断点续做。
7. TTS、字幕／时间轴、Remotion 和远程渲染适配器接口。
8. Mock 适配器和自动化验收测试。

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

## 第一版验收标准

- 最小测试视频可以从初始化走到 Mock Render 完成。
- Gate 阻断、通过和驳回行为符合阶段边界。
- 资料错误可以被校验器拦截并指出文件、阶段和规则。
- 模拟失败后可以重试和断点续做，成功产物不会重复生成。
- 已完成的真实视频可以在只读模式下通过结构和产物回归检查。
- `claude-code-how-it-works` 等真实视频不会因为 Harness 测试被修改。
- 真实工具适配至少完成一次受控 Smoke Render 验收后，才能宣称渲染适配可用。

## 第一版验收状态

Harness 0.1 已完成以下验证：

- 阶段状态、产物清单、前置校验、Gate 审批／驳回、失败重试和断点续做：自动化测试通过。
- Mock 流程：从初始化到 Gate 4 的完整流程通过。
- GitHub Actions 真实适配器：已成功触发 `smoke-test-video.yml` 和 `render-video.yml`，并返回 Run 与 Artifact 元数据。
- 真实视频只读回归：`claude-code-how-it-works`、`claude-code-first-run`、`claude-code-coding-plan` 和 `claude-code-third-party-models` 的 Source 至 Remotion 产物检查通过，目标视频目录未被修改。
- `claude-code-how-it-works`：Smoke Render、完整 Render 和最终 Gate 4 已完成；完整 MP4 仍由 GitHub Actions Artifact 交付，不写入本机 `out/`。

真实视频的画面、声音、字幕和最终交付质量仍由人工 Gate 确认，Harness 不替代人工判断。

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

## CLI 使用

初始化和查看项目状态：

```bash
node harness/src/cli.mjs init <video-slug>
node harness/src/cli.mjs status <video-slug>
node harness/src/cli.mjs validate <video-slug> [stage]
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
