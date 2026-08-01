# ROADMAP.md

## 当前阶段

Remotion AI Video MVP 新版 14 Scene Remotion 骨架阶段。

当前目录已从早期 `HelloIntro` 技术 spike 转向可复用的视频生产工程。第一条样片 `claude-code-what-is` 已切换为 16:9 横屏教程视频方向，当前正式视觉原型为新版 14 Scene `videos/claude-code-what-is/visual-prototype.html`。现阶段已开始建立新版 Remotion 骨架：保留旧版 Composition 作为 legacy，同时新增 `claude-code-what-is-v2` 用于逐 Scene 实现；当前只完成 Scene 01 初版，Scene 02～14 仍为结构 placeholder。

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
- 2026-07-29：已新增 `docs/video-production-workflow.md`，记录从选题、文本生成脚本、Remotion 配置、Studio 预览、人工反馈修改到最终输出的视频制作主流程。
- 2026-07-29：已基于本地参考文件 `/Users/limiao/personal/2-topic/4-AI/project/aitutorial/ai-coding-guide/claude-code/01-what-is-claude-code.md` 更新 `scripts/claude-code-what-is.md`，整理出已确认的视频主题、受众、核心信息、大纲和口播脚本。
- 2026-07-29：已完善 `CLAUDE.md`、`docs/video-production-workflow.md` 和 `docs/video-production-notes.md`，明确区分有明确口播视频的音频驱动流程，以及无明确口播视频的原始内容驱动估算流程。
- 2026-07-29：已在 `scripts/claude-code-what-is.md` 中新增逐句口播字幕稿，用于后续生成音频、制作逐句 SRT，并作为反推场景时长的时间轴基础。
- 2026-07-29：已生成 `local/claude-code-what-is-jianying-voiceover.txt`，用于在剪映中基于逐句口播稿生成音频和字幕。
- 2026-07-29：已新增 `local/claude-code-what-is-jianying-voiceover-parts.md`，把剪映朗读文本拆成 8 个 500 字符以内的语义片段，并在 `docs/video-production-notes.md` 沉淀剪映 500 字符限制的处理流程。

- 2026-07-29：已接入新一版两段本地音频和总 SRT 字幕：音频按 `1.mp3`、`2.mp3` 顺序播放，Composition 总时长跟随两段音频、字幕最后结束时间和场景总时长的最大值，当前约 195.8 秒。
- 2026-07-29：已将 `claude-code-what-is` 画面节奏按新口播重排为 6 个既有场景，继续复用 `OpeningScene`、`ConceptScene`、`ComparisonScene`、`StepListScene`、`TerminalScene`、`SummaryScene`，未新增场景组件。
- 2026-07-29：已在 `docs/video-production-notes.md` 沉淀多段音频按顺序接入、SRT 与音频总时长核对、Composition 时长取最大值的复用流程。

- 2026-07-29：已根据预览反馈，将 6 个场景组件的主要元素动画从固定帧触发改为按 `scene.durationSeconds` 分布，避免长场景开头几秒动画全部结束。
- 2026-07-29：已修复 `ComparisonScene` 左右栏时机：左栏条目在场景前半段展开，右栏条目在场景后半段展开，避免两栏内容同时过早出现。
- 2026-07-29：已完成 `claude-code-what-is` 的语义化画面增强：新增轻量视觉基础组件，6 个既有场景分别补充工具特征卡、模拟项目工作区、左右工作流对比、工程任务看板、终端责任链和角色类比卡，未新增场景类型、未引入新依赖。
- 2026-07-30：已压缩更新 `docs/VIDEO-DESIGN-PRINCIPLES.md` 和 `docs/STORYBOARD-SPEC.md`，明确视频制作优先按真实任务、过程演示、状态变化和视觉事件组织；6 个基础场景组件作为优先复用对象，不再作为视频场景数量上限。
- 2026-07-30：已新增 `docs/claude-code-what-is-video-audit.md` 和 `docs/claude-code-what-is-storyboard.md`，完成当前视频 KEEP / REWORK / REMOVE / ADD 审计，并将 `claude-code-what-is` 从 6 个大段重排为约 10 个视觉事件 Scene 的新版 Storyboard。
- 2026-07-30：已将当前视频的具体 Storyboard 合并回 `scripts/claude-code-what-is.md`，让主题、口播、逐句字幕和分镜集中在同一个视频脚本文档中；单独 Storyboard 文件暂未删除，等待用户确认。
- 2026-07-30：已按反馈小幅优化 `claude-code-what-is` Storyboard：压缩 S01，重写 S05 为真实工程任务连续推进，将 S07 改为同一任务下 ChatGPT、Copilot、Claude Code 三种处理方式，并合并原 S08 以减少重复。
- 2026-07-30：已把优化版 `claude-code-what-is` Storyboard 落到 Remotion 配置：在复用现有音频和 SRT 的前提下，将视频从 6 个大段重排为 9 个视觉事件 Scene，并按 SRT 句子边界微调场景时长。
- 2026-07-30：已最小增强 `ComparisonScene`，兼容旧 `left/right` 两栏配置和新 `columns/highlightIndex` 三栏配置，用于 S07 同一任务三工具对比；未新增场景类型、未新增依赖。
- 2026-07-30：已在 `docs/video-production-notes.md` 沉淀「改画面结构但不改口播时，音频和 SRT 可继续复用，Scene 边界按字幕句末重切」的流程经验。

- 2026-07-30：已确认 `claude-code-what-is` 不再继续按竖屏短视频方向优化，当前方向切换为适合 B 站 / YouTube 的 16:9 横屏教程视频。
- 2026-07-30：已更新 `CLAUDE.md`、`docs/VIDEO-DESIGN-PRINCIPLES.md` 和 `docs/STORYBOARD-SPEC.md`，将工作流调整为 Storyboard → 静态视觉预览 → 用户确认 → Remotion 实现，避免继续直接改 Remotion 带来高试错成本。
- 2026-07-30：已确认 `docs/VIDEO-DESIGN-PRINCIPLES.md`、`docs/STORYBOARD-SPEC.md` 和 `docs/VISUAL-REFERENCE.md` 已废弃，不再作为当前日常执行规则；当前公共规则以 `docs/VIDEO-PRODUCTION-RULES.md` 和 `docs/VIDEO-PROJECT-WORKFLOW.md` 为准。
- 2026-07-30：已新增 `previews/claude-code-what-is/index.html`，用无依赖 HTML + CSS 生成 9 个 16:9 横屏静态 Scene board，用于先确认画面语言、构图、状态变化和信息密度。
- 2026-07-30：已完成视频项目第一阶段目录规范整改：`CLAUDE.md` 改为以 `videos/<video-slug>/` 保存单条视频生产资料，日常公共规则以 `docs/VIDEO-PRODUCTION-RULES.md` 和 `docs/VIDEO-PROJECT-WORKFLOW.md` 为准；已新建 `videos/claude-code-what-is/`，暂未迁移现有文件、未修改 `src`、未删除旧文档。
- 2026-07-30：已完成第二阶段单条视频生产资料迁移：`scripts/claude-code-what-is.md` 判断为混合型旧版脚本资料，迁为 `videos/claude-code-what-is/legacy-script.md`；`previews/claude-code-what-is/index.html` 迁为 `videos/claude-code-what-is/visual-prototype.html`；`docs/claude-code-what-is-video-audit.md` 迁为 `videos/claude-code-what-is/reviews/video-audit.md`。本阶段未修改 `src`、未整理 `local`、未处理音频字幕、未删除旧公共文档。
- 2026-07-30：已确认第三阶段最终版生产文档已放入 `videos/claude-code-what-is/`：`source.md`、`content-analysis.md`、`video-narrative.md`、`scene-script.md`、`narration-script.md`、`visual-script.md`。`legacy-script.md` 保留为历史参考；`reviews/video-audit.md` 保留为历史审查记录。检查发现当前同时存在旧 9 Scene 的 `visual-prototype.html` 和新版 14 Scene 的 `visual-prototype-full.html`，其中 `visual-prototype-full.html` 更接近新版 `visual-script.md`，后续需要确认是否将其作为标准 `visual-prototype.html`。本阶段未修改 `src`、`local`、`public` 或 Remotion 代码。
- 2026-07-30：已完成视觉原型归一化：新版 14 Scene `visual-prototype-full.html` 已统一为正式 `videos/claude-code-what-is/visual-prototype.html`；旧 9 Scene 原型已归档到 `videos/claude-code-what-is/archive/visual-prototype-legacy.html`；后续 Remotion 实现以新版 `visual-prototype.html` 为准。本阶段未修改 `src`、`local`、`public`、Remotion 代码或其他生产文档。
- 2026-07-30：已建立新版 14 Scene Remotion 最小骨架：新增 `video14.config.ts`、`ClaudeCodeWhatIsVideo14.tsx` 和 `scenes/BugIntroScene.tsx`，注册新版 Composition `claude-code-what-is-v2`，并保留旧版 Composition 为 `claude-code-what-is-legacy`。Scene 01 已实现横屏 IDE Bug 场景，Scene 02～14 暂为结构 placeholder；本阶段未处理 audio、subtitle、local、public，未重构旧版 Scene 系统。
- 2026-08-01：根据用户预览反馈，已定位并修复新版 `claude-code-what-is-v2` 的 Scene 01 Terminal 裁切根因：CSS Grid 第一行 `1fr` 被 sidebar/editor 内容最小高度撑开，导致 Terminal 行即使增高也整体向下溢出并被 `MockWindow` 裁切。现已改为 `minmax(0, 1fr) 320px`，并给 sidebar/editor 设置 `minHeight: 0` 和 `overflow: hidden`，让 Terminal 高度真正生效。本次未处理 audio、subtitle、local、public，未实现 Scene 02。

## 进行中

- 新版 14 Scene Remotion 骨架已建立，Scene 01 视觉方向整体可用，已根据预览反馈修复底部说明遮挡问题，当前应在 Remotion Studio 中复查 `claude-code-what-is-v2` 的 Scene 01 底部内容是否完整显示。
- Scene 02～14 暂为结构 placeholder，等待 Scene 01 视觉确认后再逐 Scene 实现。
- 旧版 Composition `claude-code-what-is-legacy` 保留作为历史预览对照，不作为新版执行来源。

## 待办

1. 在 Remotion Studio 中复查 `claude-code-what-is-v2` 的 Scene 01：底部说明是否完整显示，IDE 横屏构图、Terminal TypeError 焦点、Copy 动作是否仍然成立。
2. 如果 Scene 01 方向合格，再开始实现 Scene 02「传统 AI 工作流为什么麻烦」。
3. Scene 02 仍以 `videos/claude-code-what-is/scene-script.md`、`visual-script.md` 和 `visual-prototype.html` 为唯一执行依据。
4. 横屏 Remotion 实现阶段后续再逐步调整类型、字幕安全区和场景组件布局。
5. 后续制作新视频或排查问题前，先查阅并维护 `docs/video-production-notes.md`。
6. 用户确认 Remotion Studio 预览效果后，再执行渲染。
7. 用第二条视频验证组件复用率。

## 阻塞

- Scene 02～14 仍未正式实现，需要先复查 Scene 01 底部遮挡修复效果，再确认是否进入 Scene 02。
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
- 2026-07-29：已新增 `docs/video-production-workflow.md` 并同步更新 `ROADMAP.md`，用于确认视频制作主流程。
- 2026-07-29：已更新 `scripts/claude-code-what-is.md` 并同步更新 `ROADMAP.md`，用于保存第一块流程中已确认的主题、受众、大纲和口播脚本。
- 2026-07-29：已更新 `CLAUDE.md`、`docs/video-production-workflow.md` 和 `docs/video-production-notes.md`，验证流程文档已明确区分有明确口播与无明确口播两种时长控制方式。
- 2026-07-29：已更新 `scripts/claude-code-what-is.md` 中的逐句口播字幕稿并同步更新 `ROADMAP.md`；本次只改 Markdown 文档，未运行代码检查。
- 2026-07-29：已新增 `local/claude-code-what-is-jianying-voiceover.txt` 并同步更新 `ROADMAP.md`；该文件用于剪映文字朗读，未运行代码检查。
- 2026-07-29：已新增 `local/claude-code-what-is-jianying-voiceover-parts.md` 并同步更新 `ROADMAP.md` 和 `docs/video-production-notes.md`；已用脚本验证 8 个朗读片段字符数均小于 500，本次未改 TypeScript，未运行代码检查。
- 2026-07-29：接入新两段音频和总 SRT 后，`node --version` → `v22.21.0`；`npm install` 成功；`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-29：长场景动画节奏调整后，`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-29：`ComparisonScene` 左右栏时机修复后，`node --version` → `v22.21.0`；`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-29：语义化画面增强初版完成后，`node --version` → `v22.21.0`；`npm install` 成功且依赖已是最新；`npm run check` 通过；`npm run preview` 检测到 Remotion Studio 已在 3000 端口运行并打开浏览器。
- 2026-07-30：已压缩更新 `docs/VIDEO-DESIGN-PRINCIPLES.md` 和 `docs/STORYBOARD-SPEC.md` 并同步 `ROADMAP.md`；本次只改文档，未运行代码检查。
- 2026-07-30：已新增当前视频审计和新版 Storyboard 文档并同步 `ROADMAP.md`；本次只改 Markdown 文档，未运行代码检查。
- 2026-07-30：已将当前视频 Storyboard 合并回 `scripts/claude-code-what-is.md` 并同步 `ROADMAP.md`；本次只改 Markdown 文档，未运行代码检查。
- 2026-07-30：已按反馈小幅优化 `scripts/claude-code-what-is.md` 中的 Storyboard 并同步 `ROADMAP.md`；本次只改 Markdown 文档，未运行代码检查。
- 2026-07-30：已将当前阶段切换为横屏静态视觉预览先行；已更新 `CLAUDE.md`、`docs/VIDEO-DESIGN-PRINCIPLES.md`、`docs/STORYBOARD-SPEC.md`、`docs/video-production-notes.md` 和 `ROADMAP.md`，并新增 `previews/claude-code-what-is/index.html`。本次未修改 TypeScript / Remotion 源码，未运行 `npm run check` 或 `npm run preview`。
- 2026-07-30：已完成第一阶段目录规范整改：更新 `CLAUDE.md` 中与旧目录结构冲突的规则，新建 `videos/claude-code-what-is/`，同步 `ROADMAP.md`；本次未迁移现有文件、未修改 `src`、未删除旧文档，未运行代码检查。
- 2026-07-30：新版 14 Scene Remotion 骨架建立后，`npm run check` 通过；`npm run preview` 成功打开已在 3000 端口运行的 Remotion Studio。新版 Composition ID：`claude-code-what-is-v2`；旧版对照 Composition ID：`claude-code-what-is-legacy`。
