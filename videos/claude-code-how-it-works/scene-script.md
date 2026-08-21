# Claude Code 如何工作视频化 · 第三步：Scene Script

> 共 12 个 Scene。每幕只承担一个主要认知任务；原型中的命令和状态均为文章内容的模拟，不在本任务中执行。

## Scene 01｜一句问题，连续几步

### 目的

用一个测试失败的连续处理过程制造“它怎么自己干活”的疑问。

### narrativeRole

Opening：从观众熟悉的故障场景切入。

### narrationIntent

复述测试失败、跑测试、读函数、修改 return、重新验证的最小故事。

### visualIntent

让 Terminal、文件和测试状态按时间顺序变化，证明这不是一次回复。

### visualType

`Opening Process Simulation`

### keyOnScreenText

```text
测试失败
validateEmail → undefined
少了 return
Tests passed
```

### videoValue

连续状态和跨文件动作需要时间线才能看出“自己做了几步”。

### 信息分工

- 声音提出观众的困惑。
- 画面只展示动作和结果，不重复整段解释。

## Scene 02｜聊天框与 Claude Code

### 目的

明确本片要解释的是“能实际行动的工作机制”，不是普通聊天回答。

### narrativeRole

Question：把差异从抽象定义变成两个运行表面。

### narrationIntent

说明聊天框通常返回文字，而 Claude Code 会在项目中读、改、跑和验证。

### visualIntent

左右对比静态文字回复与项目内连续操作。

### visualType

`Comparison Scene`

### keyOnScreenText

```text
普通聊天框
只返回文字

Claude Code
读 · 改 · 跑 · 验证
```

### videoValue

并置两个界面的状态差异比口播“本质不同”更直观。

### 信息分工

- 声音给出问题：它凭什么能自己干活？
- 画面建立“文字回答”和“项目动作”的视觉反差。

## Scene 03｜代理循环：想 → 做 → 看

### 目的

建立全片最重要的机制地图。

### narrativeRole

Foundation：给后续所有工具和状态变化提供骨架。

### narrationIntent

解释收集上下文、采取行动、验证结果，以及验证不通过时继续循环。

### visualIntent

让三个节点按顺序点亮，最后从“看”回到“想”。

### visualType

`Agent Loop Diagram`

### keyOnScreenText

```text
想：收集上下文
做：采取行动
看：验证结果
不够？再来一圈
agentic loop
```

### videoValue

闭环、顺序和回路是视频比静态定义更有优势的地方。

### 信息分工

- 声音解释三步含义。
- 画面让循环真的转起来。

## Scene 04｜一轮修复如何展开

### 目的

把“想→做→看”映射到开头的真实任务，并说明模型与工具的分工。

### narrativeRole

Mechanism：从概念回到可观察动作。

### narrationIntent

说明模型负责判断下一步，工具负责读、改、执行和返回结果；任务复杂度决定循环轮数。

### visualIntent

将测试、报错、搜索、文件修改、测试验证串成一条路径。

### visualType

`Workflow Timeline`

### keyOnScreenText

```text
跑测试 → 读报错 → 搜文件
读代码 → 改文件 → 再测试
模型：想
工具：做 / 看
```

### videoValue

工具结果如何喂给下一步，必须通过前后状态连接表现。

### 信息分工

- 声音解释模型和工具的角色。
- 画面展示一次循环在工具层面的展开。

## Scene 05｜Esc：立刻叫停

### 目的

让观众理解自主执行仍然受用户控制。

### narrativeRole

Control：给代理循环加上人为刹车。

### narrationIntent

说明看到它跑偏或准备大改时，按 `Esc` 会取消当前工具调用。

### visualIntent

让正在增长的改动列表被红色急停标记截断。

### visualType

`Interrupt Simulation`

### keyOnScreenText

```text
正在修改 5 个文件…
Esc
Tool call cancelled
```

### videoValue

即时取消需要时间上的“正在进行”和“突然停止”。

### 信息分工

- 声音解释什么时候该急停。
- 画面展示动作被取消，而不是完成后才返回。

## Scene 06｜补充指令：不打断当前动作

### 目的

区分急停和补充上下文，建立可迭代协作的使用方式。

### narrativeRole

Control：把用户从刹车者推进为循环参与者。

### narrationIntent

说明打字加 `Enter` 不取消当前操作，Claude 会完成手头动作后读取补充；不必一次写出完美提示。

### visualIntent

让当前工具继续运行，同时在输入区排队显示新约束。

### visualType

`Queued Instruction UI`

### keyOnScreenText

```text
当前操作继续中
只改 validateEmail
完成当前动作后读取
迭代 > 一次性完美提示
```

### videoValue

两种输入的时序差异是交互状态，适合用动画表现。

### 信息分工

- 声音解释两种操作的区别。
- 画面展示“继续执行”和“稍后读取”同时存在。

## Scene 07｜五类工具箱

### 目的

建立 Claude 真正能动手的能力来源。

### narrativeRole

Capability：从控制转入工具。

### narrationIntent

解释文件操作、搜索、执行、网络、代码智能五类工具及其对应的人类操作。

### visualIntent

把五类工具装进同一个工具箱，并区分开箱即用与需插件的代码智能。

### visualType

`Toolbox Taxonomy`

### keyOnScreenText

```text
文件操作
搜索
执行
网络
代码智能
```

### videoValue

五类工具的“手”与工作动作的映射，适合通过卡片归类展示。

### 信息分工

- 声音解释每一类能解决什么问题。
- 画面展示工具类别与编辑器、终端、浏览器的关系。

## Scene 08｜模型自己选择工具

### 目的

让观众看到模型如何用任务目标驱动工具序列。

### narrativeRole

Mechanism：将工具清单变成真实流程。

### narrationIntent

用“修复失败测试”说明模型依次执行测试、读取输出、搜索文件、读代码、改文件、再次测试；Skill、MCP、Hook、Subagent 作为外围扩展层提示。

### visualIntent

逐行打印 6 个步骤，每步高亮对应工具类别。

### visualType

`Terminal Process Simulation`

### keyOnScreenText

```text
1 执行：跑测试
2 执行：读输出
3 搜索：找文件
4 文件：读逻辑
5 文件：改 bug
6 执行：再验证
```

### videoValue

工具调用的顺序和结果反馈是动态过程，不能只用一张工具列表替代。

### 信息分工

- 声音解释“模型根据当前进展挑工具”。
- 画面展示每次返回结果如何把流程推向下一步。

## Scene 09｜当前目录是工作范围

### 目的

建立 Claude Code 的项目视野，同时切断“它会翻整个硬盘”的误解。

### narrativeRole

Boundary：给能力画出空间范围。

### narrationIntent

说明当前目录和子目录、终端命令、git 状态、`CLAUDE.md` 与配置扩展构成主要工作范围；其他位置需要权限。

### visualIntent

从当前工作目录向外显示可见资源，硬盘外圈保持灰暗并标注需授权。

### visualType

`Workspace Scope Diagram`

### keyOnScreenText

```text
当前工作目录
项目文件 · 终端 · git
CLAUDE.md · 扩展
不是整个硬盘
```

### videoValue

访问范围需要空间关系表达，能同时展示“可见”和“边界”。

### 信息分工

- 声音解释为什么能跨文件协调。
- 画面把权限范围画成一个有限工作区。

## Scene 10｜两道安全闸

### 目的

区分检查点和权限模式，并让 Plan Mode 成为可执行的安全习惯。

### narrativeRole

Safety：在自主能力之后补上恢复和批准机制。

### narrationIntent

说明检查点可恢复 Claude 编辑的文件但不负责外部副作用；权限模式决定会话级自主权，复杂任务可先进入 Plan Mode。

### visualIntent

让操作依次经过权限闸门，并在改动后出现检查点存档；外部副作用停在闸门外。

### visualType

`Security Layer Diagram`

### keyOnScreenText

```text
Permission mode
Plan Mode：先读、先搜、先计划
Checkpoint：恢复本地编辑
外部副作用：不会自动回滚
```

### videoValue

安全不是一个开关，而是不同时间点的两层机制，适合用闸门和存档状态表示。

### 信息分工

- 声音解释检查点与权限模式的边界。
- 画面展示批准、执行、存档和外部副作用被拦截。

## Scene 11｜空目录实验：先想再做

### 目的

把抽象循环落地到一个新手可复现的最小实验。

### narrativeRole

Demonstration：从机制进入操作。

### narrationIntent

说明创建空目录、启动 Claude、进入 Plan Mode、要求写 `add.py` 和测试，但先不要动手。

### visualIntent

让终端从空目录进入计划模式，显示三步计划和等待批准状态。

### visualType

`Terminal Demo`

### keyOnScreenText

```text
mkdir -p ~/cc-demo && cd ~/cc-demo
claude
Plan Mode
1 创建 add.py
2 创建测试
3 运行测试
需要我开始吗？
```

### videoValue

“不建文件、先给计划”的状态变化能让 Plan Mode 的差别一眼可见。

### 信息分工

- 声音说明计划模式的用途。
- 画面展示计划、空目录和批准等待。

## Scene 12｜验证失败，再来一轮

### 目的

用成功和失败后的再循环收束主命题，并预告下一篇。

### narrativeRole

Closing：把“模型 + 工具 + 验证 + 人的方向”压缩成结论。

### narrationIntent

说明批准后建文件、跑测试；故意改成减法导致失败，测试结果让循环重新开始；下一篇进入 API 配置。

### visualIntent

展示通过、故意改错、失败、回到“想”，最后出现 `04 · API 配置` 预告卡。

### visualType

`Loop Recap + Next Episode Preview`

### keyOnScreenText

```text
Tests passed ✓
改成减法
Tests failed
回到“想”
下一篇 04｜API 配置
```

### videoValue

失败推动下一轮是代理循环的关键视觉证据；预告卡需要独立停留。

### 信息分工

- 声音总结“给方向、定验收、跑偏时拉一把”。
- 画面用失败回路和下一篇卡片完成记忆收束。
