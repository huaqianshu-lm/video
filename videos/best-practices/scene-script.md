# Claude Code 最佳实践视频化 · Scene Script

> 共 11 个 Scene。每幕只承担一个主要认知任务；画面文字均来自 `source.md` 或本文件已定义的视觉表达。

## Scene 01｜一句模糊指令，为什么会修错

### 目的
用真实而熟悉的失败开场，让观众意识到“修一下登录 bug”没有给 Claude 足够的任务边界。

### 叙事作用
问题钩子；把责任从“Claude 不够聪明”转向“协作信息不完整”。

### 口播方向
描述模糊 prompt 让模型猜模块、症状和完成标准，再给出带目录、症状和测试要求的具体版本。

### 视觉方向
左右对照两条任务卡，左侧显示猜测和返工，右侧显示明确输入和可验收结果。

### Scene Type
Comparison / UI Simulation

### 屏幕重点
`修一下登录的 bug`、`src/auth/`、`先写能复现的测试`

### Video Value
动态显示“模糊 → 猜测 → 返工”和“具体 → 执行 → 验证”的差异，比口头定义具体 prompt 更有直觉。

## Scene 02｜所有问题都指向一块有限的白板

### 目的
建立全片总约束：上下文窗口会被对话、文件和命令输出快速填满。

### 叙事作用
从单个失败上升到统一解释，为六条法则提供共同根因。

### 口播方向
解释 context window 和“固定大小白板”的比喻，并说明白板填满后早期约束容易被挤掉。

### 视觉方向
白板从空白开始，依次被 message、files、commands、corrections 填充；末尾的“提交前验证”被挤出画面。

### Scene Type
Concept Diagram / Process

### 屏幕重点
`CONTEXT WINDOW`、`Messages`、`Files`、`Commands`、`Corrections`

### Video Value
把不可见的上下文压力变成可观察的空间变化，帮助观众理解后续方法为何都在“省白板”。

## Scene 03｜给它一个能自己验收的方式

### 目的
呈现最重要的第一条法则：执行之后必须有测试、构建或截图等可读的通过／失败信号。

### 叙事作用
建立执行—验证闭环，改变“用户负责质检”的工作关系。

### 口播方向
解释没有检查时 Claude 只能以“看起来完成”为信号；有验收方式后，它可以读结果、继续修正并展示证据。

### 视觉方向
左边的任务在“Looks done”处停住；右边经过 `Run check → Read result → Fix → Pass` 循环，出现测试输出。

### Scene Type
Process / Terminal Simulation

### 屏幕重点
`Run tests`、`Build`、`Screenshot diff`、`✓ 3 examples passed`

### Video Value
动画直接演示“有无验收”如何改变任务是否闭环，而不是只把最佳实践写成标题。

## Scene 04｜先探索，再规划，最后编程

### 目的
给出陌生项目或多文件任务的正确工作顺序，并说明何时可以跳过计划。

### 叙事作用
把“不要一上来就写代码”转化成可执行流程。

### 口播方向
讲清 Plan Mode 的 Explore → Plan → Implement → Verify 四步，以及“一句话能描述 diff 就跳过计划”的边界。

### 视觉方向
四个状态节点依次点亮；微小 diff 走一条短路径，大任务走完整路径。

### Scene Type
Process / Concept Diagram

### 屏幕重点
`Explore`、`Plan`、`Implement`、`Verify`、`One-sentence diff?`

### Video Value
流程和分支让观众看到“先理解再实施”的节奏，以及计划不是所有任务都必须增加的仪式。

## Scene 05｜把话说具体，并把料喂足

### 目的
拆解高质量 prompt 的组成，并补充 `@` 文件、截图、URL、管道等上下文入口。

### 叙事作用
将开场的具体 prompt 抽象为可复用模板。

### 口播方向
说明文件／范围、症状／边界、现有模式和完成标准四个支点；模糊问题只适合探索，实施时应收紧。

### 视觉方向
一个 prompt 卡片由四个字段逐项补齐，旁边的 context chips 依次接入文件、截图、URL 和管道。

### Scene Type
UI Simulation / Process

### 屏幕重点
`File & scope`、`Symptom & edge case`、`Existing pattern`、`Done means...`

### Video Value
把“说具体”从抽象建议转成可直接套用的结构；输入来源的动画体现“喂足上下文”。

## Scene 06｜`CLAUDE.md` 是便签，不是百科全书

### 目的
说明常驻规则应该精简，只保留 Claude 无法从代码推断且会导致错误的内容。

### 叙事作用
把“减少上下文噪音”落实到项目级长期输入。

### 口播方向
对比肥大的规则文件和短便签，解释什么该写、什么应删除或移到 Skill／文档链接。

### 视觉方向
左侧的长文件把重要规则压到折叠区；右侧逐行筛选，只留下命令、特有约束、测试和常见坑。

### Scene Type
Comparison / UI Simulation

### 屏幕重点
`Keep`、`Delete`、`IMPORTANT`、`Commands`、`Project constraints`

### Video Value
通过“重要规则是否还能被看见”的视觉结果，证明精简比堆满背景更有用。

## Scene 07｜一跑偏，就停、退、重开

### 目的
教观众识别错误方向，并给出 Esc、`/rewind`、`/clear` 的止损顺序。

### 叙事作用
为上下文污染提供恢复机制，避免把“坚持到底”误当成效率。

### 口播方向
说明立即停下和回退；同一问题纠正三次仍不行，就带着教训清空并重开。subagent 和会话续接作为辅助出口。

### 视觉方向
错误路径变红并在三次纠正后断开；光标回到干净分支，独立调查卡片只把结论送回主会话。

### Scene Type
Process / State Change

### 屏幕重点
`Esc`、`/rewind`、`3 corrections`、`/clear`、`Clean context`

### Video Value
状态变化把“及时止损”从口号变成可执行的操作判断。

## Scene 08｜一个用顺了，再横向铺开

### 目的
介绍并行会话、Writer／Reviewer、非交互脚本和独立审查的扩展层，同时保留先后顺序和审查边界。

### 叙事作用
把单会话方法扩展到生产效率，但不让扩展抢走基础法则。

### 口播方向
先强调一个会话没用顺时不要开五个；再说明 worktree 隔离、干净上下文审查、`claude -p` 和只修正确性问题。

### 视觉方向
单个稳定节点向四个隔离分支展开，Reviewer 从新白板读取 diff，旁边标出“只追踪 correctness”。

### Scene Type
Concept Diagram / Comparison

### 屏幕重点
`One Claude → Stable`、`Worktree`、`Writer`、`Reviewer`、`Correctness only`

### Video Value
动态展开能表现“先稳定、后扩展”的层级关系，并把并行的隔离要求讲清楚。

## Scene 09｜把 Claude 当资深同事问，并索要证据

### 目的
收纳三条沟通习惯：问资深同事的问题、大功能先采访生成 spec、要求显示验证证据。

### 叙事作用
把前面的流程变成日常沟通动作。

### 口播方向
给出陌生项目提问、大功能采访和“跑一下，把输出贴出来”三个使用时机。

### 视觉方向
三张卡片依次从 `Ask` 到 `SPEC.md` 到 `Evidence`，最后接入前面的验证闭环。

### Scene Type
Process / UI Simulation

### 屏幕重点
`Ask a senior engineer`、`AskUserQuestion`、`SPEC.md`、`Show evidence`

### Video Value
通过连续动作表现沟通不是额外话术，而是探索、澄清和验收的入口。

## Scene 10｜对比实验：具体到底值多少

### 目的
用密码强度函数实验让观众亲眼比较模糊 prompt 和具体 + 验收 prompt。

### 叙事作用
把整篇方法压缩成一次可复现的体验和证据。

### 口播方向
先展示模糊版本由模型自行猜规则且没有测试，再展示明确函数名、文件、规则、样例和验证输出。

### 视觉方向
左右两个终端会话并列；右侧 prompt 字段逐项出现，最终显示三个样例的通过／失败结果。

### Scene Type
Comparison / Terminal Simulation

### 屏幕重点
`写个判断密码强不强的函数`、`isStrongPassword(pwd)`、`password.js`、`✓ true / false`

### Video Value
同一目标的状态对比让“少写十几个字，省下几轮返工”的收益可见、可验收。

## Scene 11｜六条法则，回到一个总原则

### 目的
用速查表收束六条法则，强调它们是节省上下文、建立协作闭环的起点，并加入下一集预告。

### 叙事作用
结论与系列承接；完成本篇最后一个视觉事件。

### 口播方向
按场景回顾六条法则，强调观察什么有效并形成自己的直觉，最后预告下一篇“反模式：常见的错误用法”。

### 视觉方向
六行速查从上到下点亮；下方单独升起下一集预告卡，和字幕区域错开。

### Scene Type
Summary / UI Card

### 屏幕重点
`验收`、`探索`、`具体`、`写精`、`纠偏`、`扩展`、`下一篇：反模式`

### Video Value
让观众得到可带走的决策表，并用预告卡完成系列节奏，而不是停在抽象总结上。
