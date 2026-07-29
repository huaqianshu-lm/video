# ROADMAP.md

## 当前阶段

Remotion AI Video MVP 样片实现阶段。

当前目录已从早期 `HelloIntro` 技术 spike 转向可复用的视频生产工程。第一阶段目标是完成一条 9:16 的 Claude Code 教程无音频预览样片：`claude-code-what-is`。视频时长由脚本文案、字幕口播节奏和画面入场下限共同决定，不设置固定总时长。

## 已完成

- 创建过最小 Remotion + React + TypeScript 项目骨架。
- 实现过历史技术 spike：单一 Composition `HelloIntro`。
- `HelloIntro` 已验证 Remotion 基础环境可运行，但不再作为长期架构、组件或视觉基础。
- Node.js 曾确认 Node.js 为 v22.21.0，满足 18+ 要求。
- `npm install` 曾成功。
- TypeScript 已固定为 `~5.8.3`，用于避免 TypeScript 7 与 Remotion bundler 不兼容。
- `npx tsc --noEmit` 曾通过。
- `npx remotion studio` 曾成功启动，显示本地地址 `http://localhost:3000`。
- 2026-07-28：已确认新工程目录继续使用当前目录 `/Users/limiao/personal/2-topic/4-AI/project/video`。
- 2026-07-28：已将项目规范从最小 demo 调整为 Remotion AI Video MVP 工程规范。
- 2026-07-28：已补充 Claude Code 上下文管理规则，用于降低长会话、长日志和长驻命令导致 422 上下文超限的概率。
- 2026-07-28：已补充全局 Playwright 使用约束：未获用户明确要求时不使用 Playwright 或浏览器自动化工具。
- 2026-07-28：已补充本项目渲染沟通约束：默认不讨论、不建议、不执行渲染，只有用户明确要求渲染时再处理渲染相关事项。
- 2026-07-28：已完成第一条样片 `claude-code-what-is` 的 Markdown 脚本、TypeScript 视频配置、类型定义、时间工具、通用组件、6 个 MVP 场景组件、视频主组件和 Composition 注册。
- 2026-07-28：已更新 `package.json` scripts：`check`、`preview`、`render` 可用，`render` 指向 `out/claude-code-what-is.mp4`。
- 2026-07-28：已验证 `node --version` → `v22.21.0`，满足 Node.js 18+ 要求。
- 2026-07-28：已验证 `npm run check` 通过。
- 2026-07-28：已验证 `npm run preview` 能打开 Remotion Studio，Composition ID 为 `claude-code-what-is`。
- 2026-07-28：已在 Remotion Studio 中抽样检查 6 个场景按顺序出现，总时长约 71 秒，符合 60-90 秒要求。
- 2026-07-28：已根据用户自然语言反馈压缩 `claude-code-what-is` 场景时长，将总时长从约 71 秒调整为约 60 秒，用于减少元素显示完成后的空等时间。
- 2026-07-28：根据第二轮节奏反馈，已将第一阶段无音频预览样片时长规范调整为 30-60 秒，并将 `claude-code-what-is` 按主要元素完成点压缩到约 30 秒。
- 2026-07-28：已将 `claude-code-what-is` 字幕从单段提示式 `caption` 升级为逐句讲解字幕，脚本文档和 TypeScript 配置均已同步口语化讲解文案。
- 2026-07-28：已取消第一阶段固定总时长硬约束，改为内容驱动时长规则：按逐句字幕正常口播时长、场景尾部停顿和画面入场下限确定每个场景时长。
- 2026-07-28：已将 `Caption` 字幕切换从按句数平均分配改为按每句字幕估算口播时长分配，并将 `claude-code-what-is` 场景时长同步为内容驱动结果。
- 2026-07-28：已生成 `local/claude-code-what-is-narration.txt`，用于在剪映中生成当前样片对应的讲解音频。
- 2026-07-28：已根据用户提供的剪映音频时长 1 分 09 秒，将 `claude-code-what-is` 场景时长调整为总计约 69 秒，并让逐句字幕时间轴按场景时长等比压缩。
- 2026-07-28：已接入本地人工音频和 SRT 时间轴字幕预览：`local/audio.mp3` 已复制到 `public/local-assets/claude-code-what-is/audio.mp3`，视频总时长调整为约 72.8 秒，并新增全局定时字幕层；用户提到的 `subtitle.str` 实际使用的是 `local/subtitle.srt`。
- 2026-07-29：已新增 `docs/video-production-notes.md`，沉淀字幕与音频不同步问题的现象、根因、解决方案和后续制作流程；已在 `CLAUDE.md` 中补充后续制作问题与流程沉淀的维护规则。

## 进行中

- 等待用户基于 Remotion Studio 预览确认本地音频和 SRT 时间轴字幕接入后的画面节奏、声音和字幕同步效果。
- 后续视频制作过程中，持续把问题、根因、解决方案和可复用流程补充到 `docs/video-production-notes.md`，用于后续制作复用和教程文章素材。

## 待办

1. 等待用户确认本地音频和 SRT 时间轴字幕接入后的预览节奏、声音和字幕同步是否可接受。
2. 后续制作新视频或排查问题前，先查阅并维护 `docs/video-production-notes.md`。
3. 用户确认预览效果后，再执行渲染。
4. 用第二条视频验证组件复用率。

## 阻塞

- 根据项目规则，渲染前需要用户确认 Remotion Studio 预览效果。
- 第一阶段不执行 `npm run render`，直到预览被用户明确确认。

## 最近验证

- 2026-07-22：`node --version` → `v22.21.0`。
- 2026-07-22：`npm install` 成功。
- 2026-07-22：首次 `npx remotion studio` 因 TypeScript 7 与 Remotion bundler 不兼容失败；已将 TypeScript 固定为 `~5.8.3` 后解决。
- 2026-07-22：`npx tsc --noEmit` 通过。
- 2026-07-22：`npx remotion studio` 成功启动，显示本地地址 `http://localhost:3000`。
- 2026-07-28：完成新 MVP 方案确认，当前目录作为工程目录，旧 `HelloIntro` 定位为历史技术 spike。
- 2026-07-28：完成 `CLAUDE.md` MVP 规范更新。
- 2026-07-28：完成 `CLAUDE.md` 上下文管理规则补充，明确长驻命令、长日志、局部读取和 422 后新会话接续规则。
- 2026-07-28：`node --version` → `v22.21.0`。
- 2026-07-28：`npm run check` 通过。
- 2026-07-28：`npm run preview` 可打开 Remotion Studio；页面标题为 `claude-code-what-is / video - Remotion Studio`，Studio 记录到 Composition ID：`claude-code-what-is`。
- 2026-07-28：通过浏览器抽样检查 0s、8s、20s、35s、49s、61s、69s，6 个场景均出现，视频总时长约 71 秒。
- 2026-07-28：根据用户反馈压缩 `claude-code-what-is` 场景时长后，`npm run check` 通过，`npm run preview` 成功启动并完成构建；尝试用 `npx remotion compositions` 读取元信息时触发 Chrome Headless Shell 下载，已停止该命令，未继续下载。
- 2026-07-28：二次压缩 `claude-code-what-is` 场景时长到约 30 秒后，`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-28：升级逐句讲解字幕后，`npm run check` 通过；待用户在 Remotion Studio 中人工确认字幕逐句切换和视觉效果。
- 2026-07-28：改为内容驱动场景时长和按字幕口播估算切换后，`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-28：按剪映音频 1 分 09 秒匹配视频时长后，`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-28：接入本地 `audio.mp3` 和 `subtitle.srt` 定时字幕后，`node --version` → `v22.21.0`；`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-28：新增 `local/mvp-feature-checklist.md`，用于跟踪第一版最小 MVP 主要功能完成状态。
- 2026-07-29：已新增 `docs/video-production-notes.md` 并同步更新 `CLAUDE.md`、`ROADMAP.md`，用于沉淀制作问题、解决方案和教程文章素材。
