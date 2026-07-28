# ROADMAP.md

## 当前阶段

Remotion AI Video MVP 样片实现阶段。

当前目录已从早期 `HelloIntro` 技术 spike 转向可复用的视频生产工程。第一阶段目标是完成一条 9:16、60-90 秒的 Claude Code 教程样片：`claude-code-what-is`。

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

## 进行中

- 建立第一条样片 `claude-code-what-is` 的脚本文档、TypeScript 配置、场景组件和 Remotion Composition。

## 待办

1. 创建第一条 Markdown 视频脚本：`scripts/claude-code-what-is.md`。
2. 创建视频类型定义：`src/lib/videoTypes.ts`。
3. 创建时间工具：`src/lib/timing.ts`。
4. 创建第一条视频配置：`src/videos/claude-code-what-is/video.config.ts`。
5. 创建通用组件：`SceneContainer`、`Caption`，必要时创建 `ProgressBar`。
6. 创建 6 个 MVP 场景组件：
   - `OpeningScene`
   - `ConceptScene`
   - `ComparisonScene`
   - `StepListScene`
   - `TerminalScene`
   - `SummaryScene`
7. 创建视频主组件：`src/videos/claude-code-what-is/ClaudeCodeWhatIsVideo.tsx`。
8. 更新 `src/Root.tsx`，注册 Composition ID：`claude-code-what-is`。
9. 更新 `package.json` scripts：新增 `check`，更新 `render`。
10. 重新检查 Node.js 版本：`node --version`。
11. 如依赖需要同步，执行 `npm install`。
12. 运行 TypeScript 检查：`npm run check`。
13. 启动预览：`npm run preview`。
14. 在 Remotion Studio 中检查竖屏样片效果。
15. 根据用户自然语言反馈修改一个明确细节。
16. 再次预览确认。
17. 用户确认预览满意后，再执行渲染：`npm run render`。
18. 渲染成功后确认 `out/claude-code-what-is.mp4` 文件存在。
19. 用第二条视频验证组件复用率。

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
