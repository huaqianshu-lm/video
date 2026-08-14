# ROADMAP.md

## 当前阶段

- `claude-code-api-config` 已通过 Gate 3；60 段音频、111 条字幕 Cue 和 256.248 秒时间轴已冻结，当前正在启动 GitHub Actions 冒烟渲染。
- `claude-code-install` 已接入真实音频、逐句字幕和 Manifest 时间轴，12 个 Scene 的 41 个主要视觉锚点也已绑定到 Segment 局部时间；GitHub 冒烟和完整 MP4 渲染均已通过并核验。
- `claude-code-what-is-v2` 已接入 14 个 Scene、166 段音频、269 条字幕 Cue 和约 645.744 秒真实时间线。
- 字幕已改为顶层 overlay，Linux 渲染前强制校验 CJK 字体，音频已预挂载并按 Segment 驱动画面。
- 本机 Chromium 因旧版 macOS 返回 `SIGTRAP`，最终画面验证改由 GitHub Actions 完成。

## 已完成（最近 10 条）

- 2026-08-14：用户完成 `claude-code-api-config` 的 Studio 音画、字幕、节奏和溢出检查，Gate 3 通过，当前预览版本已冻结进入远程渲染。
- 2026-08-14：完成 GitHub Actions 渲染参数化和 `claude-code-api-config` 资源打包；两条工作流接收受控 slug／Composition 输入，音频数量由 Manifest 校验，冒烟代表帧由 Timeline 自动选择。
- 2026-08-14：完成 `claude-code-api-config` 的正确 TTS 资源接入；60 段音频和三份 Manifest 已同步到 Remotion 消费目录，12 个 Scene 的视觉项已按 Segment／Word Boundary 重新绑定，Studio 在 3001 端口构建通过。
- 2026-08-14：完成 `claude-code-api-config` 的正确 TTS 生成和回传；60 个 Segment 音频／Timing、111 条字幕 Cue、SRT／VTT 和 256.248 秒 Timeline 已通过确定性校验并复制到 Video 本地原始资料目录。
- 2026-08-14：完成 `claude-code-api-config` 的 Gate 2 确认和 TTS Script 派生；`tts-script.json` 与纯口播稿逐句一致，包含 12 个 Scene、60 个稳定 Segment，已同步修正 TTS 项目的跨项目输入规则。
- 2026-08-14：按 `claude-code-what-is` 同名文件回归修复 `claude-code-api-config` 的 Gate 2 资料；Narration Script 已恢复纯口播结构，Visual Script 已恢复基线层级，Visual Prototype 已恢复幕内字幕、自动播放和进度结构，并补齐 Scene 07、08、10 的视觉对应关系。

## 进行中

- `claude-code-api-config` 已通过 Gate 3，正在准备提交并触发 GitHub 冒烟渲染。
- 根目录 `video-production-process-part-1.md` 正根据用户反馈逐段修订；本轮已完成从文章开头到「总结」的正文。
- `video-production-process-part-2.md` 至 `part-5.md` 已完成重写，等待用户整体审阅和反馈。
- 端到端视频生产流程已完成第一条试点的 TTS、Remotion 接入和 GitHub 工作流参数化；20 分钟轮询仍依赖当前会话或后续监控任务。

## 下一步

1. 选择性提交并推送 `claude-code-api-config` 的代码、资源包和参数化工作流。
2. 触发并检查 GitHub 冒烟 Run，下载代表帧和前 10 秒短片进行验证。
3. 冒烟结果经人工确认后，再触发完整 MP4 渲染。

## 阻塞

- 当前 macOS 上 Remotion Chromium 启动即因旧系统返回 `SIGTRAP`，无法在本机生成 still／MP4；当前视频必须由 GitHub Actions 完成冒烟和最终画面验证。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一查阅 `docs/video-production-notes.md`，不在 Roadmap 重复记录。

## 最近验证（最近 10 条）

- 2026-08-14：用户人工确认 `claude-code-api-config` 的 Studio 预览没有问题，Gate 3 通过；本次确认覆盖音画同步、字幕、动画节奏、信息密度和文字溢出。
- 2026-08-14：参数化渲染工作流通过 YAML 语法检查；资源包包含 60 个 MP3 和 14 个字幕文件且压缩完整，Timeline 自动选出的冒烟帧为 30、3374、6534；Node.js `v22.21.0` 和 `npm run check` 通过。
- 2026-08-14：`claude-code-api-config` 使用 Node.js `v22.21.0` 通过 `npm run check`；12 个 Scene、60 个音频资源、111 条字幕 Cue、256.248 秒 Timeline 和 `+25%` 语速通过资源校验，Remotion Studio 在 3001 端口完成构建。
- 2026-08-14：验证 `claude-code-api-config` 的 12 个 Scene、60 个 MP3、60 个 Timing、111 条字幕 Cue、SRT／VTT 和 Timeline；所有 ID、文件、文本、时间、`+25%` 语速和 256.248 秒总时长一致，MP3 实际时长与 Manifest 差值为 0，TTS 与 Video 回传目录文件完全一致。
