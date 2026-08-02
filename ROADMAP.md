# ROADMAP.md

## 当前阶段

- `claude-code-what-is-v2` 已接入与当前 Narration Script 对应的 TTS 音频、逐句字幕和 Scene 时间线。
- 新版时间线共 14 个 Scene、166 段音频、269 条字幕，总长约 645.744 秒；末尾额外保留 3 秒思考时间。
- 166 段音频已增加 2 秒预挂载，14 个 Scene 的关键视觉事件已改为按旁白 Segment 语义点触发。
- 修复版仍需在 Studio 中人工复核音频开头和逐幕音画同步。
- 已新增 GitHub Actions 服务端渲染工作流；当前 MVP 素材 ZIP 直接随私有仓库提交，工作流会在 Runner 中自动解压。
- GitHub Actions 已升级至 Node.js 24 兼容的官方 Action 版本，项目渲染运行时继续使用 Node.js 22。
- GitHub Actions 素材解压步骤已补充目标目录创建，避免 Runner 中缺少 `public/local-assets` 导致解压失败。
- 已将当前 14 Scene 所需的字幕和 166 段音频打包为 `assets/claude-code-what-is-v2-assets.zip`（约 3.3 MB）；`local/` 下保留未跟踪的本地副本。
- 正式执行依据位于 `videos/claude-code-what-is/`；`claude-code-what-is-legacy` 仅作历史对照。

## 已完成（最近 10 条）

- 2026-08-02：排查并修复音频开头丢字和画面提前播完：全量确认 166 个源 MP3 的首词存在且前置静音不超过约 0.21 秒，排除源文件缺字与淡入；音频 Sequence 增加 2 秒预挂载和缓冲等待，14 个 Scene 的视觉事件改由对应旁白 Segment 触发；`npm run check`、`git diff --check`、182 处 Segment 引用完整性和资源一致性检查通过。
- 2026-08-02：从独立 `tts` 项目接入新版 14 Scene 时间线：复制 166 段音频与总 SRT／VTT，读取 Timeline／Subtitle Manifest，渲染 269 条逐句字幕，并为最终总结增加 3 秒静默停留；`npm run check`、`git diff --check` 和资源一致性检查通过。
- 2026-08-01：用户完成新版 14 Scene 全片人工预览，确认 Scene 13～14 及全片目前没有明显问题；逐 Scene 实现与第一轮全片视觉复核完成。
- 2026-08-01：用户确认 Scene 12 后，已一起实现 Scene 13～14：Scene 13 以动态任务路由完成 ChatGPT、Cursor／Copilot、Claude Code 分工，时长 18 秒；Scene 14 以三阶段演进和人机执行链收束全片，时长 21 秒；两幕最终总结完整展开后分别静置约 4.4 秒和 5 秒；`npm run check` 与 `git diff --check` 通过，等待用户联合视觉确认。
- 2026-08-01：用户确认 Scene 11 后，已实现 Scene 12 人机分工：Human 与 AI 职责逐项出现并共同连接 Project，再形成 `Goal → AI Execution → Human Review → Next Goal` 协作循环；时长 15 秒，以「协作 ≠ 托管」收束并静置约 4 秒；`npm run check` 和 `git diff --check` 通过，等待用户视觉确认。
- 2026-08-01：用户确认 Scene 10 后，已实现 Scene 11 判断边界：动态比较方案 A／B，由 Claude Code 分析成本、性能、复杂度和风险，将 Decision 留给 Human，并以 `Tests passed ✓ ≠ Business correct？` 和人类 Review 收束；时长 18 秒，最终总结完整展开后静置约 4 秒；`npm run check` 和 `git diff --check` 通过，等待用户视觉确认。
- 2026-08-01：用户确认 Scene 09 后，已实现 Scene 10 叙事反转：将「理解＋执行＋连接」聚合成「全自动？」并以「还不行。」收束；时长 12 秒，最终结论完整展开后静置约 4 秒；`npm run check` 和 `git diff --check` 通过，等待用户视觉确认。
- 2026-08-01：用户确认 Scene 08 后，已实现 Scene 09 动态连接图：以 Claude Code 为项目中心，依次连接 Codebase、Docs、Jira、Slack、Drive，并以「理解 → 执行 → 连接」收束；时长 13 秒，最终总结完整展开后静置约 4 秒；`npm run check` 和 `git diff --check` 通过，等待用户视觉确认。
- 2026-08-01：已将 Scene 08 时长延长至 12 秒；最终总结卡完整展开后静置约 4.6 秒，其中末尾约 2.6 秒保留给观众思考；`npm run check` 和 `git diff --check` 通过，等待用户视觉确认。
- 2026-08-01：已将 Roadmap 精简规则同步到全局 `~/.claude/CLAUDE.md`，后续所有项目统一限制状态区和历史记录长度。

## 进行中

- 音频预挂载和 Segment 驱动动画已实现，等待 Remotion Studio 人工回归。
- GitHub Actions 渲染链路已完成兼容性修复，等待手动触发一次验证。

## 下一步

1. 启动 `npm run preview`，选择 `claude-code-what-is-v2`，重点检查每段音频首词是否完整。
2. 按 Scene 检查画面是否在对应旁白出现时切换，并复核总结画面的阅读与思考停留。
3. 在 GitHub Actions 中手动运行 `Render video`，下载生成的 MP4 Artifact 做最终检查。
4. 根据人工预览反馈做最后定点微调；全片音画同步确认后再进入最终交付。

## 阻塞

- 需要用户完成修复版 Studio 人工预览，才能确认浏览器实际播放时的音频首词和逐幕语义节奏。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一查阅 `docs/video-production-notes.md`，不在 Roadmap 重复记录。

## 最近验证（最近 10 条）

- 2026-08-02：将 `actions/checkout`、`actions/setup-node` 和 `actions/upload-artifact` 分别升级至 v6，消除 Node.js 20 Action 弃用警告；`npm run check` 与 `git diff --check` 通过。
- 2026-08-02：确认 GitHub Actions 首次解压因目标父目录不存在失败，补充 `mkdir -p public/local-assets`。
- 2026-08-02：全量检查 166 个 Timing 文件均含首词，首词时间均为 0.1 秒；166 个源 MP3 最大前置静音约 0.21 秒；14 个 Scene 共 182 处 Segment 时间引用均存在；Node.js `v22.21.0`，`npm run check`、`git diff --check` 和音频资源一致性检查通过。
- 2026-08-02：Node.js 为 `v22.21.0`；TTS Manifest 校验为 14 个 Scene、166 个 Segment、269 个 Cue，旁白总长 642.744 秒，Composition 加末尾停留后为 645.744 秒；`npm run check`、`git diff --check` 和复制资源一致性检查通过。
- 2026-08-01：用户在 Remotion Studio 中完成新版 14 Scene 全片人工预览，反馈目前未发现明显问题；Scene 13～14 与全片第一轮视觉复核通过。
- 2026-08-01：Scene 13～14 接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户联合人工视觉确认。
- 2026-08-01：Scene 12 初版接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
- 2026-08-01：Scene 11 初版接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
- 2026-08-01：Scene 10 初版接入后，Node.js 为 `v22.21.0`，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
- 2026-08-01：Scene 09 初版接入后，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
- 2026-08-01：Scene 08 总结停留延长后，`npm run check` 与 `git diff --check` 通过；尚未启动 Studio，等待用户人工视觉确认。
- 2026-08-01：已核对全局与项目 Roadmap 规则一致；本次仅修改 Markdown 文档。
