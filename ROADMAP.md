# ROADMAP.md

## 当前阶段

- `claude-code-what-is-v2` 已接入 14 个 Scene、166 段音频、269 条字幕 Cue 和约 645.744 秒真实时间线。
- 字幕已改为顶层 overlay，Linux 渲染前强制校验 CJK 字体，音频已预挂载并按 Segment 驱动画面。
- GitHub Actions 已拆分为 `Smoke test video` 和 `Render full video` 两条独立工作流。
- 冒烟工作流会渲染 3 张代表帧和前 10 秒短片，人工确认后才执行约 40 分钟的完整渲染。
- 本机 Chromium 因旧版 macOS 返回 `SIGTRAP`，最终画面验证改由 GitHub Actions 完成。

## 已完成（最近 10 条）

- 2026-08-02：新增完整渲染前冒烟工作流，生成第 30、660、18000 帧和前 10 秒 MP4；工作流 YAML 解析、Remotion CLI 参数核对、`npm run check` 与 `git diff --check` 通过。
- 2026-08-02：将视频制作全过程第一部分改写为教程，重点记录个人制作步骤、判断方法、问题诊断和“视频像 PPT”解决路径；待用户确认后继续整理后续阶段。
- 2026-08-02：完成视频制作全过程第二部分教程，整理从视觉方向确认、6 个大场景重排为 14 个视觉事件、Scene／Visual Script 编写、逐幕 Remotion 实现到 TTS 前冻结视频表达的过程；TTS 相关内容单独整理。
- 2026-08-02：完成视频制作全过程第三部分教程，单独整理从口播稿、TTS Segment、分段音频、Word Boundary 到 Audio／Subtitle／Timeline Manifest 的 TTS 制作过程；后续继续整理 TTS 产物接入视频和音画同步。
- 2026-08-02：完成视频制作全过程第四部分教程，整理 TTS 产物接回 Remotion、统一 Scene／Segment／字幕时间轴、按 Segment 触发画面动作，以及音频开头丢字和长场景动画提前结束的排查与修复；渲染与最终交付后续整理。
- 2026-08-02：完成视频制作全过程第五部分教程，整理渲染前检查、本地 CLI、Studio 预览、GitHub Actions 服务端渲染和未来云渲染方案，并补充最终 MP4 的规格、画面与音画检查清单；当前仍待用户完成修复版 Studio 复核和一次 Actions 渲染验证。
- 2026-08-02：排查并修复音频开头丢字和画面提前播完：全量确认 166 个源 MP3 的首词存在且前置静音不超过约 0.21 秒，排除源文件缺字与淡入；音频 Sequence 增加 2 秒预挂载和缓冲等待，14 个 Scene 的视觉事件改由对应旁白 Segment 触发；`npm run check`、`git diff --check`、182 处 Segment 引用完整性和资源一致性检查通过。
- 2026-08-02：从独立 `tts` 项目接入新版 14 Scene 时间线：复制 166 段音频与总 SRT／VTT，读取 Timeline／Subtitle Manifest，渲染 269 条逐句字幕，并为最终总结增加 3 秒静默停留；`npm run check`、`git diff --check` 和资源一致性检查通过。
- 2026-08-01：用户完成新版 14 Scene 全片人工预览，确认 Scene 13～14 及全片目前没有明显问题；逐 Scene 实现与第一轮全片视觉复核完成。
- 2026-08-01：用户确认 Scene 12 后，已一起实现 Scene 13～14：Scene 13 以动态任务路由完成 ChatGPT、Cursor／Copilot、Claude Code 分工，时长 18 秒；Scene 14 以三阶段演进和人机执行链收束全片，时长 21 秒；两幕最终总结完整展开后分别静置约 4.4 秒和 5 秒；`npm run check` 与 `git diff --check` 通过，等待用户联合视觉确认。

## 进行中

- `Smoke test video` 已实现，等待在 GitHub Actions 首次运行并人工检查 Artifact。
- 完整渲染等待冒烟截图和 10 秒短片确认通过。

## 下一步

1. 在 GitHub Actions 手动运行 `Smoke test video`。
2. 下载 Artifact，检查 3 张截图中的中文字形和字幕，并播放前 10 秒短片检查音频与字幕。
3. 冒烟检查确认通过后，再运行 `Render full video`。
4. 下载完整 MP4，按 Scene 复核音画同步和总结停留。

## 阻塞

- 当前 macOS 上 Remotion Chromium 启动即因旧系统返回 `SIGTRAP`，无法在本机生成 still／MP4；需使用 GitHub Actions 或升级后的可用 Chromium 环境确认最终画面。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一查阅 `docs/video-production-notes.md`，不在 Roadmap 重复记录。

## 最近验证（最近 10 条）

- 2026-08-02：新增 `Smoke test video` 工作流；第 30、660、18000 帧均确认处于有效字幕 Cue 内；YAML 解析、Remotion `--frame`／`--frames` 参数核对、`npm run check` 与 `git diff --check` 通过。
- 2026-08-02：字幕改为全屏顶层 overlay，字体顺序调整为跨平台 CJK 字体优先；Manifest 校验通过（14 个 Scene、166 段音频、269 条 Cue），`npm run check` 与 `git diff --check` 通过；本机 still 因旧 macOS Chromium `SIGTRAP` 未完成。
- 2026-08-02：将 `actions/checkout`、`actions/setup-node` 和 `actions/upload-artifact` 分别升级至 v6，消除 Node.js 20 Action 弃用警告；`npm run check` 与 `git diff --check` 通过。
- 2026-08-02：补充 Linux CJK 字体安装、字幕按帧匹配和字幕层级修复；Node.js `v22.21.0`，`npm run check` 与 `git diff --check` 通过，269 条 Cue 时间轴连续性检查通过。
- 2026-08-02：确认 GitHub Actions 首次解压因目标父目录不存在失败，补充 `mkdir -p public/local-assets`。
- 2026-08-02：全量检查 166 个 Timing 文件均含首词，首词时间均为 0.1 秒；166 个源 MP3 最大前置静音约 0.21 秒；14 个 Scene 共 182 处 Segment 时间引用均存在；Node.js `v22.21.0`，`npm run check`、`git diff --check` 和音频资源一致性检查通过。
- 2026-08-02：Node.js 为 `v22.21.0`；TTS Manifest 校验为 14 个 Scene、166 个 Segment、269 个 Cue，旁白总长 642.744 秒，Composition 加末尾停留后为 645.744 秒；`npm run check`、`git diff --check` 和复制资源一致性检查通过。
- 2026-08-01：用户在 Remotion Studio 中完成新版 14 Scene 全片人工预览，反馈目前未发现明显问题；Scene 13～14 与全片第一轮视觉复核通过。
- 2026-08-01：Scene 13～14 接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户联合人工视觉确认。
- 2026-08-01：Scene 12 初版接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
