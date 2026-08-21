# Claude Code 最佳实践视频化 · Visual Script

## 全局视觉原则

### 1. 画面不能只是重复口播

声音解释为什么上下文会成为约束、每条法则何时使用；画面展示白板如何被填满、检查如何闭环、计划如何推进、错误如何回退，以及具体 prompt 如何产生可验收输出。

### 2. 视觉承担证明和演示

所有关键结论都用状态变化表达：`Looks done` 不能继续前进，`Run check` 才能得到 `Passed`；`Explore` 后才进入 `Plan`；`/clear` 后错误路径消失，新的干净会话重新开始。

### 3. 一个 Scene 只有一个视觉中心

每幕只突出一个关系：模糊／具体、白板填充、验收闭环、计划流程、prompt 字段、规则便签、纠偏路径、扩展分支、沟通卡片、实验对照或最终速查。

### 4. 少做“页面”，多做“过程”

采用深色工作台、终端、便签、流程节点和对照卡，避免把文章段落堆成信息墙。每幕保留少量关键词，详细解释交给口播。

### 5. 动画必须有意义

- 输入逐项出现：表示上下文被补齐。
- 白板逐渐填满：表示 context window 压力增加。
- 节点依次点亮：表示流程先后。
- 红色路径断开、绿色新路径出现：表示及时止损。
- 一个节点展开成多个隔离节点：表示单会话稳定后的横向扩展。

## Scene 01｜模糊指令 vs 具体任务

### 视觉目标

让观众一眼看出，问题不是 Claude 不会修，而是任务没有提供可执行边界。

### 画面结构

16:9 舞台左右分栏。左侧是暗红色“模糊任务”卡，只有 `修一下登录的 bug`，下方依次出现 `猜模块`、`猜症状`、`无法验收`。右侧是蓝绿色“具体任务”卡，包含 `src/auth/`、`session 超时`、`先写测试`，下方显示 `可执行` 和 `可验证`。

### 动画

左侧先出现一个旋转问号，再出现三条猜测；右侧四个字段逐项滑入，最后一条绿色验证线闭合。

### 屏幕文字

`修一下登录的 bug`、`src/auth/`、`session 超时`、`先写测试`、`可验证`

### Visual Type

Comparison / UI Simulation

## Scene 02｜上下文窗口是一块有限白板

### 视觉目标

把不可见的 context window 变成可观察的容量变化。

### 画面结构

中央是一块标有 `CONTEXT WINDOW` 的白板，四个标签 `Messages`、`Files`、`Commands`、`Corrections` 从不同方向贴入。白板底部保留一条绿色 `Verify before done` 便签。

### 动画

标签逐个进入并占据空间；最后一张 `Corrections` 推挤绿色便签，使其变淡但不消失。旁边出现提示 `Keep the useful context`。

### 屏幕文字

`CONTEXT WINDOW`、`Messages`、`Files`、`Commands`、`Corrections`、`Keep the useful context`

### Visual Type

Concept Diagram / Process

## Scene 03｜执行到验证的闭环

### 视觉目标

演示“给它一个能自己验收的方式”如何把任务从停住变成闭环。

### 画面结构

左侧终端显示 `Task complete?` 和 `Looks done`，路径在此停止。右侧是环形流程 `Execute → Run check → Read result → Fix`，中心为 `Evidence`，底部终端出现 `✓ 3 examples passed`。

### 动画

右侧四个节点顺时针点亮；第一次检查失败时回到 `Fix`，第二次到达 `Evidence` 并变绿。左侧“看起来完成”保持灰色，作为对比。

### 屏幕文字

`Looks done`、`Run check`、`Read result`、`Fix`、`Evidence`、`✓ 3 examples passed`

### Visual Type

Process / Terminal Simulation

## Scene 04｜Explore → Plan → Implement → Verify

### 视觉目标

让 Plan Mode 的适用场景和跳过计划的边界同时可见。

### 画面结构

中央横向四节点流程，节点下分别标注 `read code`、`write plan`、`make change`、`show proof`。底部有一条小型 `One-sentence diff` 快速路径，绕过中间计划节点。

### 动画

大任务沿四节点依次点亮；小型 diff 从左侧直接连到 `Implement`，旁边出现 `skip plan`。两条路径最后都汇入 `Verify`。

### 屏幕文字

`Explore`、`Plan`、`Implement`、`Verify`、`One-sentence diff`、`skip plan`

### Visual Type

Process / Concept Diagram

## Scene 05｜具体 Prompt 的四个支点

### 视觉目标

把“说具体”变成一个可套用的 prompt 结构。

### 画面结构

中央是一张 Prompt 卡片，四行字段依次为 `File & scope`、`Symptom & edge case`、`Existing pattern`、`Done means...`。右侧四枚输入芯片为 `@file`、`Screenshot`、`URL`、`Pipe data`。

### 动画

空卡片先显示模糊光标；四个字段和四枚芯片依次接入，卡片底部由灰色 `Guess` 变为绿色 `Execute with confidence`。

### 屏幕文字

`File & scope`、`Symptom & edge case`、`Existing pattern`、`Done means...`、`@file`、`Screenshot`、`URL`、`Pipe data`

### Visual Type

UI Simulation / Process

## Scene 06｜精简 `CLAUDE.md`

### 视觉目标

用便签的可读性对比说明规则文件应该写精。

### 画面结构

左右两块便签。左侧标题 `Too much`，长列表被折叠、重要的 `Run tests` 淹没；右侧标题 `Keep what prevents mistakes`，只保留 `Commands`、`Project constraints`、`Tests`、`Common traps`，底部有 `Delete the rest`。

### 动画

左侧文字快速堆叠并降低对比度；右侧逐行筛选，保留项亮起，`IMPORTANT` 图钉固定在顶部。

### 屏幕文字

`Too much`、`Keep what prevents mistakes`、`Commands`、`Project constraints`、`Tests`、`Common traps`、`Delete the rest`、`IMPORTANT`

### Visual Type

Comparison / UI Simulation

## Scene 07｜止损路径

### 视觉目标

让观众掌握“停、退、重开”的操作判断，而不是继续在错误上下文里硬熬。

### 画面结构

一条从 `Wrong direction` 出发的红色时间线，经过 `Correction 1`、`Correction 2`、`Correction 3` 后断开。上方三个控制按钮为 `Esc`、`/rewind`、`/clear`；右侧是干净的 `New context`，旁边小卡片显示 `Subagent → findings`。

### 动画

错误线前两次纠正变长，第三次后触发 `/clear`，红线淡出；`New context` 从右侧进入并重新点亮 `Goal`。独立调查卡只传回一条结论。

### 屏幕文字

`Wrong direction`、`Correction 1`、`Correction 2`、`Correction 3`、`Esc`、`/rewind`、`/clear`、`New context`、`Subagent → findings`

### Visual Type

Process / State Change

## Scene 08｜从单会话到横向扩展

### 视觉目标

表达扩展的正确前提：一个会话稳定后，再用隔离和新鲜上下文铺开。

### 画面结构

中央先显示 `One Claude → Stable`，随后展开四个分支：`Worktree`、`Writer`、`Reviewer`、`claude -p`。Reviewer 分支连接到 `Diff`，再连接到绿色 `Correctness only` 标签。

### 动画

中央节点先稳定两次脉冲后，四个分支向外展开；Writer 写入 diff，Reviewer 用另一种颜色扫描，非交互分支输出 JSON 小标签。

### 屏幕文字

`One Claude → Stable`、`Worktree`、`Writer`、`Reviewer`、`claude -p`、`Diff`、`Correctness only`

### Visual Type

Concept Diagram / Comparison

## Scene 09｜三种沟通动作

### 视觉目标

将“问、采访、亮证据”变成连续而可复用的沟通流程。

### 画面结构

三张横向卡片：`Ask a senior engineer`、`AskUserQuestion → SPEC.md`、`Show evidence`。卡片下方分别显示一个问题、一个 spec 文件和一段终端输出。

### 动画

三张卡片依次进入；第一张连接到 `Explore`，第二张连接到 `Plan`，第三张连接到 `Verify`，形成一条细线回到 Scene 03 的闭环。

### 屏幕文字

`Ask a senior engineer`、`AskUserQuestion`、`SPEC.md`、`Show evidence`、`✓ output`

### Visual Type

Process / UI Simulation

## Scene 10｜模糊 vs 具体：密码实验

### 视觉目标

用同一任务的两个输入和两个结果证明“具体 + 验收”能减少猜测和返工。

### 画面结构

左右两个终端。左侧标题 `Vague prompt`，只有 `写个判断密码强不强的函数`，输出 `Rules guessed` 和 `No test`. 右侧标题 `Specific + check`，显示 `isStrongPassword(pwd)`、`password.js`、`>= 8`、`Uppercase`、`Number`，下方为三条示例结果。

### 动画

左侧先快速输出一组不确定规则；右侧字段逐字出现，随后三条样例按顺序显示 `true`、`false`、`false`，最终右侧出现 `✓ verified`。

### 屏幕文字

`Vague prompt`、`写个判断密码强不强的函数`、`Rules guessed`、`No test`、`Specific + check`、`isStrongPassword(pwd)`、`password.js`、`>= 8`、`Uppercase`、`Number`、`✓ verified`

### Visual Type

Comparison / Terminal Simulation

## Scene 11｜六条法则速查与下一集预告

### 视觉目标

让观众能带走一张决策表，并完成系列内容承接。

### 画面结构

上半区是六行速查：`验收`、`探索`、`具体`、`写精`、`纠偏`、`扩展`，每行右侧有一个短动作。下半区单独放预告卡 `下一篇：反模式`，与字幕安全区保持距离。

### 动画

六行依次点亮；预告卡最后从底部升起并停留，所有辅助导航保持在原型外壳，不进入场景画面。

### 屏幕文字

`验收`、`探索`、`具体`、`写精`、`纠偏`、`扩展`、`下一篇：反模式`

### Visual Type

Summary / UI Card

## 全片视觉类型／组件／动画标准

### 视觉类型

- Comparison：Scene 01、06、10，用左右状态差异传递判断。
- Process：Scene 03、04、05、07、09，用节点和状态推进表示动作顺序。
- Concept Diagram：Scene 02、08，把上下文容量和扩展关系具象化。
- Summary：Scene 11，提供可带走的速查表和系列预告。

### 组件

- 深色 16:9 舞台、顶部 Scene 标签、窗口／终端卡片、流程节点、提示胶囊。
- 红色只用于错误、猜测和需要停止的状态；绿色只用于通过、证据和稳定状态；蓝紫色用于中性结构和当前焦点。
- 场景容器保持统一内边距和字幕安全区；文字卡片避免超过 5–6 行。

### 动画标准

- Scene 切换：短淡入和轻微位移，不使用复杂转场。
- 状态变化：依次点亮、路径流动、标签滑入、错误线断开。
- 重要结论至少停留到观众能读完；Scene 11 预告卡单独保留约 2–3 秒。
- 字幕区域只用于原型内预览，不和 Scene 11 预告卡重叠。

## Gate 2 内部审查结论

- 11 个 Scene 与 Scene Script、Narration Script 一一对应，视觉目标和口播意图没有跨幕漂移。
- Narration Script 每个 Scene 下只有实际口播，没有视觉说明、制作备注、Gate 清单或内部文字。
- 视觉承担流程、对比、状态和证据；没有把整段口播重复成大段屏幕文字。
- 画面文字均可追溯到 `source.md`、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；没有带入下一篇文章的业务语义或固定文字。
- 原型将在本文件结构基础上提供 Scene 容器、幕内字幕、上一幕／下一幕、自动播放和进度提示。
- 结论：Gate 2 通过，可完成静态 Visual Prototype；本任务到此不进入 TTS、音频、字幕、Timeline 或 Remotion。

## 下一步

完成 `visual-prototype.html` 的横屏静态交互检查后停止。
