# ROADMAP.md

## 当前阶段

- `claude-code-install` 已接入真实音频、逐句字幕和 Manifest 时间轴，12 个 Scene 的 41 个主要视觉锚点也已绑定到 Segment 局部时间；当前等待人工逐幕同步复核。
- `claude-code-what-is-v2` 已接入 14 个 Scene、166 段音频、269 条字幕 Cue 和约 645.744 秒真实时间线。
- 字幕已改为顶层 overlay，Linux 渲染前强制校验 CJK 字体，音频已预挂载并按 Segment 驱动画面。
- GitHub Actions 已拆分为 `Smoke test video` 和 `Render full video` 两条独立工作流；冒烟工作流会渲染 3 张代表帧和前 10 秒短片，人工确认后才执行约 40 分钟的完整渲染。
- 本机 Chromium 因旧版 macOS 返回 `SIGTRAP`，最终画面验证改由 GitHub Actions 完成。

## 已完成（最近 10 条）

- 2026-08-06：复制 `how-to-install` 的音频、字幕、Timing 和 Manifest 资料；`local/claude-code-install/` 保留原始资料，`public/local-assets/claude-code-install/` 提供 76 段 MP3 与字幕，Remotion `generated/` 保存三份 Manifest。
- 2026-08-06：完成 `claude-code-install` 的音频驱动时间轴；以 Manifest 生成 12 个帧对齐 Scene、76 段带起点的音轨和 176 条全局字幕 Cue，音频 Sequence 使用 2 秒预挂载。
- 2026-08-06：完成 `claude-code-install` 的 Segment 驱动画面映射；12 个 Scene 共配置 41 个主要视觉锚点，列表、终端输出、Diff 确认和总结卡片使用 Scene 局部 Segment 时间触发。
- 2026-08-06：根据人工复核反馈，Scene 12 四张总结卡片统一提前 0.4 秒入场，补偿淡入动画相对口播的感知滞后。
- 2026-08-06：修正 Scene 12 四张卡片的语义 Segment 映射为 `12-03`、`12-04`、`12-05`、`12-06`，并将顶部标题下移 28px 避开进度条。
- 2026-08-05：完成 `claude-code-install` 的横屏 Remotion 配置和主组件，接入 12 个 Scene、1920×1080、30fps 的 `claude-code-install` Composition；当时使用口播估算时长，未接入音频和 SRT。
- 2026-08-05：完成 `claude-code-install/visual-prototype.html`，使用无依赖 HTML + CSS + 少量 JS 展示 12 个可切换 Scene、Scene 09 的确认写入示意和 Scene 12 延迟出现的下节预告；等待用户确认后进入 Remotion。
- 2026-08-05：完成并补充 `claude-code-install/content-analysis.md`，将原文整理为安装前提、平台分流、验证登录、首次任务和排错维护五层知识骨架，并在末尾加入简短下节预告；已作为 Video Narrative 的输入。
- 2026-08-05：完成 `claude-code-install/video-narrative.md`，按环境判断、安装入口、验证、登录、第一次任务、排错维护和结尾预告重组观众认知顺序；已作为 Scene Script 的输入。
- 2026-08-05：完成 `claude-code-install/scene-script.md`，拆分为 12 个视觉事件，明确每幕认知任务、口播方向、画面、Scene Type、Video Value 和信息分工；待用户确认后继续。

## 进行中

- `claude-code-install` 的音频、字幕、时间轴和主要视觉事件已接入；当前只剩 Studio 中的人工逐幕音画同步与文字溢出复核。
- `Smoke test video` 已实现，等待在 GitHub Actions 首次运行并人工检查 Artifact。
- 完整渲染等待冒烟截图和 10 秒短片确认通过。

## 下一步

1. 在 Remotion Studio 中人工复核 12 个 Scene 的音画同步与文字溢出。
2. 根据逐幕反馈修正配置或通用场景组件。
3. 预览确认后再进入项目统一的冒烟检查流程。

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

- 2026-08-06：上游资源复制校验通过；12 个 Scene、76 段 MP3、365.736 秒时间轴均匹配，Manifest 与 SRT／VTT `cmp` 一致，所有 Timeline 音频和字幕引用均有对应文件。
- 2026-08-06：音频时间轴接入校验通过；`npm run check`、`git diff --check` 和自定义 Manifest 引用检查通过，Studio 在 3010 端口完成 bundling 后已停止。
- 2026-08-06：视觉 Segment 映射校验通过；12 组 reveal 映射共 41 个局部时间点，均能找到对应 Segment 且落在所属 Scene 时长内；修正绝对时间误用后 `npm run check` 和 Studio bundling 通过。
- 2026-08-06：Scene 12 视觉起点修正后，`npm run check`、`git diff --check`、四个局部起点边界校验和 Studio bundling 均通过；音频与字幕时间轴未改变。
- 2026-08-06：Scene 12 卡片语义映射修正后，四个卡片起点均早于对应音频，动画完成时间落在场景内；`npm run check`、`git diff --check` 和局部时间校验通过。
- 2026-08-05：`npm install` 成功，`node --version` 为 v22.21.0，`npm run check` 通过；`npm run preview -- --port 3010` 成功启动并完成 Remotion bundling，随后已停止 Studio 进程。
- 2026-08-05：源码级验证 `claude-code-install/visual-prototype.html`；包含 12 个 Scene、12 个 Scene 选择按钮，JavaScript 语法检查通过，无行尾空白，CSS 明确按 16:9 构图且未引入外部依赖。
- 2026-08-05：已完整读取 `claude-code-install/source.md`，生成并补充 `content-analysis.md`；文件包含核心命题、知识关系、视频价值、取舍项、时效性核验清单和末尾下节预告。
- 2026-08-05：已基于 Content Analysis 生成 `claude-code-install/video-narrative.md`；文档包含八段叙事结构、状态变化主线、第一次任务高潮、内容边界、视觉方向和末尾下节预告，且未进入 Scene Script。
- 2026-08-05：已基于 Video Narrative 生成 `claude-code-install/scene-script.md`；包含 12 个 Scene，Scene 09 聚焦 diff 确认，Scene 12 承担唯一的结尾下节预告；`git diff --check` 通过。
