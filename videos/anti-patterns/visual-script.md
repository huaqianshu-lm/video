# Visual Script｜Claude Code 反模式

## 全局视觉原则

- 画幅按 1920 × 1080 的 16:9 横屏设计，原型容器保持比例。
- 风格延续系列基线：深色工作台、克制的蓝色结构、红色表示反模式、绿色表示替换动作。
- 画面用短标签、状态和结果表达，不把 narration-script 逐字复制到屏幕。
- 红色只标记错误状态，绿色只标记可执行替换；发光保持轻量。
- 每幕保留字幕安全区，不让底部卡片和预览字幕重叠。
- 屏幕文字均可从 Source、Content Analysis、Video Narrative、Scene Script 或本 Visual Script 追溯；不使用其他文章的业务文案或状态文字。

## 逐 Scene 视觉设计

### Scene 01｜好工具也能被用废

### 视觉目标

先建立「同一工具，不同用法」的反差。

### 画面结构

左右两张大卡：左侧为 `Good tool` 和清晰的任务边界，右侧为 `Wrong usage`、多个红色警示标签和 `Feels worse`。中央只保留一个细箭头，强调差异来自用法。

### 动画

左侧稳定进入，右侧先堆叠多个警示标签，再显示 `反模式`。最后绿色边框短暂强调左侧。

### 屏幕文字

`Good tool`、`Wrong usage`、`Feels worse`、`反模式`

### Visual Type

Comparison / Opening

### Scene 02｜七个坑会互相喂养

### 视觉目标

把文章中的恶性循环压缩成可读的系统图。

### 画面结构

环形节点依次为 `Wide task`、`Context full`、`More errors`、`No verify`、`Naked mode`、`Wide research`，中心显示 `7 anti-patterns`。右下方另置一张绿色 Break the loop 卡，包含 `Split`、`Clear`、`Verify`、`Scope`。

### 动画

节点顺时针依次点亮并连成环；中心出现后，绿色卡片从底部进入，表示破局而不是第八个反模式。

### 屏幕文字

`7 anti-patterns`、`Wide task`、`Context full`、`More errors`、`No verify`、`Naked mode`、`Wide research`、`Break the loop`、`Split`、`Clear`、`Verify`、`Scope`

### Visual Type

Concept Diagram / Process

### Scene 03｜一句话塞一大堆需求

### 视觉目标

展示范围从四条混杂任务收窄为一条可规划主线。

### 画面结构

左侧红色卡列出 `OAuth`、`Bug`、`Button`、`Tests`；右侧绿色卡只保留 `OAuth`，下方接 `Plan first` 和 `One mainline`。

### 动画

左侧四项快速叠入并轻微抖动；右侧 `OAuth` 单独放大，随后 `Plan first` 和 `One mainline` 依次出现。

### 屏幕文字

`OAuth`、`Bug`、`Button`、`Tests`、`Plan first`、`One mainline`

### Visual Type

Comparison / Task Planning

### Scene 04｜不写或全塞进 CLAUDE.md

### 视觉目标

用容量和重点对比表现两个极端。

### 画面结构

左侧卡标题 `No CLAUDE.md`，底部显示 `Repeat rules`；中间窄箭头；右侧卡标题 `Bloated`，列出 `Background`、`Docs`、`Everything`，其中 `Tests` 被压在底部。下方绿色提示 `Keep what prevents mistakes`。

### 动画

左卡先显示空白规则，再出现重复提示；右卡从少量标签快速填满，`Tests` 被压低；绿色判断标准最后出现。

### 屏幕文字

`No CLAUDE.md`、`Repeat rules`、`Bloated`、`Background`、`Docs`、`Everything`、`Tests`、`Keep what prevents mistakes`

### Visual Type

Comparison / UI Simulation

### Scene 05｜一个会话从早开到晚

### 视觉目标

表现厨房水槽会话如何污染上下文，再用两个动作清理。

### 画面结构

左侧是 `Context` 容器，依次塞入 `Bug fix`、`GIL?`、`Deploy`、`Correction 1`、`Correction 2`；右侧是两个操作按钮 `/clear`、`/compact` 和绿色 `Clean context`。

### 动画

标签逐个掉入左侧容器并把容量条推满；`/clear` 清空无关内容，`/compact` 把剩余要点压成一个小摘要，最后显示 `Clean context`。

### 屏幕文字

`Context`、`Bug fix`、`GIL?`、`Deploy`、`Correction 1`、`Correction 2`、`/clear`、`/compact`、`Clean context`

### Visual Type

State Change / Process

### Scene 06｜把它当搜索引擎，而且说啥信啥

### 视觉目标

展示「看着对」进入项目与「核验后」进入项目的差异。

### 画面结构

左右两条路径。左侧为 `Looks right` → `Unknown API` → `Copy`，终点红色 `Unverified`；右侧为 `Official docs` → `Run check` → `Evidence`，终点绿色 `Verified`。

### 动画

左路径先快速通过并在终点变红；右路径逐步亮起，证据卡最后锁定绿色状态。

### 屏幕文字

`Looks right`、`Unknown API`、`Copy`、`Unverified`、`Official docs`、`Run check`、`Evidence`、`Verified`

### Visual Type

Comparison / Verification

### Scene 07｜不给它能自己验证的办法

### 视觉目标

把「声称完成」转为「执行检查并显示证据」。

### 画面结构

左侧终端显示 `Looks done` 和 `No test`；右侧循环显示 `Execute` → `Check` → `Evidence` → `Fix root cause`，底部为 `✓ verified`。

### 动画

左侧的 `Looks done` 短暂出现后变成红色；右侧四个节点依次点亮，失败结果回到 `Fix root cause`，通过后出现绿色证据。

### 屏幕文字

`Looks done`、`No test`、`Execute`、`Check`、`Evidence`、`Fix root cause`、`✓ verified`

### Visual Type

Process / Terminal Simulation

### Scene 08｜无脑开启 bypassPermissions

### 视觉目标

清晰区分日常权限模式和隔离环境边界。

### 画面结构

三张纵向卡：`acceptEdits`（工作目录内的编辑）、`auto`（分类器审查操作）、`bypassPermissions`（隔离容器／VM）。工作机区域用红色警示覆盖 bypassPermissions，隔离区域用绿色边框承载它。

### 动画

先显示工作机边界，再让 `bypassPermissions` 试图穿过边界并被拦下；切换到 `Isolated VM` 后，绿色边框打开。

### 屏幕文字

`acceptEdits`、`auto`、`bypassPermissions`、`Work machine`、`Isolated VM`

### Visual Type

Comparison / Security Boundary

### Scene 09｜调查一下，却不给范围

### 视觉目标

展示主窗口被全仓库原始内容灌满，以及两种控制方式。

### 画面结构

左侧主窗口标记 `Whole repo?`，文件标签大量涌入并覆盖 `Context`，最终显示 `Context overflow`。右侧上方为 `src/auth/` → `Token refresh`，右侧下方为 `Subagent` → `Summary`。

### 动画

左侧文件以连续流动方式进入并使容量条变红；右侧两条受控路径从各自入口进入，最终只留下少量摘要。

### 屏幕文字

`Whole repo?`、`Context`、`Context overflow`、`src/auth/`、`Token refresh`、`Subagent`、`Summary`

### Visual Type

Comparison / Concept Diagram

### Scene 10｜反面操作体检

### 视觉目标

把七条行为和七个编号建立一一对应。

### 画面结构

左侧诊断板列出 `OAuth + Bug + UI`、`No CLAUDE.md`、`Mix topics`、`Whole project`、`Unverified API`、`Skip permissions`、`Hide error`；右侧逐行显示 `#1` 至 `#7` 和 `Replace`。

### 动画

行为逐条进入，右侧编号按顺序翻出；每一行完成映射后由红色转为绿色。

### 屏幕文字

`OAuth + Bug + UI`、`No CLAUDE.md`、`Mix topics`、`Whole project`、`Unverified API`、`Skip permissions`、`Hide error`、`#1`、`#2`、`#3`、`#4`、`#5`、`#6`、`#7`、`Replace`

### Visual Type

Process / Diagnostic Board

### Scene 11｜七条速查与下一篇预告

### 视觉目标

让观众带走七个可执行的自检动作，并把下一篇预告作为最后视觉事件。

### 画面结构

上半区为七条速查：`拆需求`、`写精规则`、`清上下文`、`查证据`、`给验证`、`保安全`、`限范围`。七条全部点亮后，下方单独升起预告卡 `下一篇：FAQ／Troubleshooting`。

### 动画

七条动作依次点亮；速查卡收束后，预告卡最后从底部进入并停留 2～3 秒。预览控制、进度提示和说明文字均位于幕外壳，不属于画面内容。

### 屏幕文字

`拆需求`、`写精规则`、`清上下文`、`查证据`、`给验证`、`保安全`、`限范围`、`下一篇：FAQ／Troubleshooting`

### Visual Type

Summary / Teaser Card

## 全片视觉类型／组件／动画标准

### 视觉类型

- Comparison：Scene 01、03、04、06、08、09。
- Concept Diagram：Scene 02、09。
- Process：Scene 02、05、07、10。
- State Change：Scene 05、07、08。
- Summary／Teaser：Scene 11。

### 组件

- 深色 Stage、顶部 Scene 标签、卡片、标签、流程节点、容量条、终端框、预告卡。
- 红色 `bad` 状态、绿色 `good` 状态、蓝色结构线和中性灰说明。
- 预览外壳提供上一幕、下一幕、自动播放、进度提示；这些控件不属于幕内画面。

### 动画标准

- 节点依次进入，避免整屏同时出现。
- 反模式状态先出现，替换动作后出现。
- 主要状态切换保留足够停留时间，确保观众能读完关键标签。
- Scene 11 的预告卡最后进入并保持可读，不与字幕区域重叠。

## Gate 2 内部审查

- Narration Script 每个 Scene 下均为实际口播，没有视觉说明、制作备注或 Gate 清单混入：通过。
- Narration Script、Visual Script、Scene Script 的 Scene ID 和顺序一致：通过。
- 口播负责解释因果和边界，画面负责展示对比、流程、状态和证据：通过。
- 所有画面文字均可追溯到当前文章或当前视频生产资料；未复用其他文章的业务语义、固定文案或状态文字：通过。
- 11 个 Scene 的视觉结构、动画顺序和信息密度适合 16:9 横屏原型：通过。
- Scene 11 的下一篇预告是最后一个视觉事件，且与字幕安全区分离：通过。
- 当前未生成 `tts-script.json`、音频、字幕、Timeline 或 Remotion 文件：通过。

结论：Gate 2 通过，允许停在 Visual Prototype 阶段。

