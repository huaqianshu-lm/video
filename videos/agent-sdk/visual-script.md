# Agent SDK 视频化 · 第六步：Visual Script

## 全局视觉原则

- 16:9 横屏、深色科技感、克制的蓝绿高亮；主体是过程化界面，不是文章卡片墙。
- 声音负责解释「为什么、谁负责、何时选择」，画面负责展示入口迁移、工具循环、权限变化、消息流和文件结果。
- 每幕只突出一个认知变化，标题控制在 1—2 行；代码和命令用等宽字体，字幕区域留在底部安全区。
- 统一使用终端窗口、代码窗口、流程节点、权限标签、结果卡和预告卡；动画只服务于连接、扫描、编辑、通过和收束。
- Prototype 只验证构图、信息密度、Scene 顺序和状态变化，不代表最终 Remotion 动画或真实执行。

## Scene 01｜从用工具的人到造工具的人

### 视觉目标



### 画面结构

左侧是人在终端输入 `claude`，右侧依次浮出「自动审 PR」「定时任务」「产品里的 AI 助手」三个程序化需求，中间用一条蓝色能力线连接到 `Agent SDK`。

### 视觉动作

1. 终端中的人／CLI 先亮起。
2. 三个需求标签从右侧出现，按重复流程、定时触发、产品嵌入的顺序排列。
3. `Agent SDK` 节点接住三条线，形成新的程序入口。

### 口播互补

声音提出「从用工具的人到造工具的人」的问题，画面把需求从人手操作变成程序调用。

### 屏幕文字

`CLI`、`自动审 PR`、`定时任务`、`产品里的 AI 助手`、`Agent SDK`

### Visual Type

`OpeningScene / Process`

## Scene 02｜SDK 搬走的是 Claude Code 内核

### 视觉目标



### 画面结构

中央为 `Agent SDK`，左侧三个能力模块 `工具`、`代理循环`、`上下文管理` 依次连入；下方以小标签展示 `Read`、`Edit`、`Bash`。

### 视觉动作

1. 三个模块由外向内汇入 SDK。
2. `Read`、`Edit`、`Bash` 沿工具模块展开。
3. 中央节点变为「可编程的 Claude 代理」。

### 口播互补

声音定义内核，画面用模块汇聚建立「不是单纯模型调用」的直觉。

### 屏幕文字

`Agent SDK`、`工具`、`代理循环`、`上下文管理`、`Read`、`Edit`、`Bash`、`可编程的 Claude 代理`

### Visual Type

`ConceptScene / Connection Diagram`

## Scene 03｜同一个内核，两个入口

### 视觉目标



### 画面结构

左上 `人` 连接 `CLI`，右上 `程序` 连接 `Agent SDK`，两条路径向下汇入 `Claude Code 内核`，底部出现 `同一套工具与代理循环`。

### 视觉动作

1. 先展示人和程序的不同触发位置。
2. 两条路径同时向下合流。
3. CLI 标签标记「人在场」，SDK 标签标记「自动触发」。

### 口播互补

声音解释适用场景，画面证明内核没有被拆成两套产品。

### 屏幕文字

`人`、`CLI`、`人在场`、`程序`、`Agent SDK`、`自动触发`、`Claude Code 内核`、`同一套工具与代理循环`

### Visual Type

`ComparisonScene / Connection Diagram`

## Scene 04｜差别不在模型，在工具循环

### 视觉目标



### 画面结构

左右两栏代码窗口。左侧 `Client SDK` 展开 `while`、`your_tool_executor`、`tool_result`；右侧 `Agent SDK` 只保留 `query()` 和消息流节点。

### 视觉动作

1. 左侧模型请求发出 `tool_use`。
2. 结果被拉入执行器，再回到模型，循环箭头转一圈。
3. 右侧 `query()` 接住相同任务，蓝色线直接流向 `message stream`。
4. 左侧胶水代码淡化，右侧入口高亮。

### 口播互补

声音解释责任归属，画面用循环长度证明 Agent SDK 省掉的是工具编排。

### 屏幕文字

`Client SDK`、`while`、`tool_use`、`your_tool_executor`、`tool_result`、`Agent SDK`、`query()`、`message stream`

### Visual Type

`ComparisonScene / Code Exploration`

## Scene 05｜按项目语言选择入口

### 视觉目标



### 画面结构

两张语言卡并排：TypeScript 卡显示安装命令和 `Node.js 18+`；Python 卡显示安装命令和 `Python 3.10+`。下方横跨两卡的是隐藏值的 `ANTHROPIC_API_KEY`。

### 视觉动作

1. 两张语言卡同时出现，避免制造功能高低差。
2. 版本要求被逐项勾选。
3. API key 进入锁定区域，只显示名称不显示真实值。

### 口播互补

声音说明按项目语言选择，画面保留最少的安装决策信息和密钥边界。

### 屏幕文字

`TypeScript`、`npm install @anthropic-ai/claude-agent-sdk`、`Node.js 18+`、`Python`、`pip install claude-agent-sdk`、`Python 3.10+`、`ANTHROPIC_API_KEY`

### Visual Type

`StepListScene / UI Simulation`

## Scene 06｜`query()` 是代理入口

### 视觉目标



### 画面结构

左侧代码块显示 `query({ prompt, options })`，箭头指向右侧纵向消息流：`AssistantMessage`、`Tool: Read`、`Tool: Edit`、`ResultMessage`。

### 视觉动作

1. `prompt` 和 `options` 从代码中被抽出成两个标签。
2. `query()` 节点启动消息流。
3. 消息卡按时间顺序向下出现，最后落到 `ResultMessage`。

### 口播互补

声音讲参数职责，画面展示入口如何变成可观察的流。

### 屏幕文字

`query()`、`prompt`、`options`、`allowed_tools`、`async for`、`AssistantMessage`、`Tool: Read`、`Tool: Edit`、`ResultMessage`

### Visual Type

`ConceptScene / Process`

## Scene 07｜权限决定代理能做什么

### 视觉目标



### 画面结构

同一个代理节点左侧连接三档工具权限：只读分析、分析 + 改代码、完全自动化；每档逐步增加 `Read`、`Glob`、`Grep`、`Edit`、`Bash`。

### 视觉动作

1. 第一档只亮起三个只读工具。
2. 第二档新增 `Edit`，代码文件状态从查看变为可修改。
3. 第三档新增 `Bash`，执行节点亮起。

### 口播互补

声音解释最小权限，画面让工具列表直接改变可行动作。

### 屏幕文字

`Read`、`Glob`、`Grep`、`只读分析`、`Edit`、`分析 + 改代码`、`Bash`、`完全自动化`

### Visual Type

`StepListScene / Permission Map`

## Scene 08｜先造一个会崩的 `utils.py`

### 视觉目标



### 画面结构

左侧终端显示 `mkdir my-agent` 和安装完成，中央代码窗口显示 `utils.py` 两个函数，右侧错误卡分别指出空列表和空用户。

### 视觉动作

1. 目录和安装命令依次出现。
2. 两个函数在代码窗口中高亮。
3. `calculate_average([])` 与 `get_user_name(None)` 分别连接到 `ZeroDivisionError` 和 `TypeError`。

### 口播互补

声音讲实战前置和两个 bug，画面把代理即将解决的目标固定下来。

### 屏幕文字

`my-agent`、`utils.py`、`calculate_average([])`、`get_user_name(None)`、`ZeroDivisionError`、`TypeError`

### Visual Type

`TerminalScene / Code Exploration`

## Scene 09｜让代理读、改、再回报

### 视觉目标



### 画面结构

左侧 `agent.py` 的 prompt 和 options，中央为 `query()`，右侧是 `Read → Edit` 工具执行线，顶部标出 `acceptEdits`。

### 视觉动作

1. prompt 从代码窗口进入 `query()`。
2. `allowed_tools` 展开三个权限标签。
3. 工具线先读 `utils.py`，再把编辑动作写回文件。
4. `acceptEdits` 作为自动批准状态亮起。

### 口播互补

声音解释代码组合，画面展示代理如何把一句任务转成真实动作。

### 屏幕文字

`agent.py`、`Review utils.py for bugs`、`allowed_tools`、`Read`、`Edit`、`Glob`、`acceptEdits`、`utils.py`

### Visual Type

`TerminalScene / Task Execution`

## Scene 10｜成功要落在文件里

### 视觉目标



### 画面结构

左侧终端消息流从 `Tool: Read` 到 `Tool: Edit` 再到 `Done: success`；右侧 `utils.py` diff 显示空列表和空用户的处理分支。

### 视觉动作

1. 工具消息沿时间线出现。
2. `Done: success` 变绿，但右侧文件仍显示待检查。
3. `utils.py` 的两处 diff 出现，状态变为 `防御性处理`。

### 口播互补

声音强调「消息成功不等于结果落地」，画面用双栏验收呈现这一判断。

### 屏幕文字

`python agent.py`、`Tool: Read`、`Tool: Edit`、`Done: success`、`utils.py`、`防御性处理`

### Visual Type

`TerminalScene / Process`

## Scene 11｜什么时候该用 SDK

### 视觉目标



### 画面结构

三路选择图：`只想终端操作` → `CLI`；`重复自动化／机器人／定时任务` → `Agent SDK`；`生产托管基础设施与会话` → `Managed Agents`。

### 视觉动作

1. 一个问题节点「谁来触发？」出现。
2. 三种需求沿不同路径分流。
3. Agent SDK 路径先经过「本地原型」，再连接 Managed Agents。

### 口播互补

声音给出适用边界，画面把选择条件和成长路径同时可视化。

### 屏幕文字

`只想终端操作`、`CLI`、`重复自动化`、`机器人`、`定时任务`、`Agent SDK`、`本地原型`、`Managed Agents`

### Visual Type

`ComparisonScene / Decision Diagram`

## Scene 12｜把能力变成你能调用的零件

### 视觉目标



### 画面结构

六个关键词围绕中央 `Agent SDK`：`工具`、`代理循环`、`上下文管理`、`CLI`、`query()`、`allowed_tools`。关键词收缩后只留下预告卡。

### 视觉动作

1. 六个关键词按全片顺序亮起并连到中央节点。
2. 关系图收缩，中央节点变为「能调用的零件」。
3. 最后出现 `下一篇：开发配置`，停留 2—3 秒。

### 口播互补

声音完成总结和下一篇的内容承接，画面只保留关系关键词和预告。

### 屏幕文字

`工具`、`代理循环`、`上下文管理`、`CLI`、`query()`、`allowed_tools`、`能调用的零件`、`下一篇：开发配置`

### Visual Type

`SummaryScene / Preview Card`

## 全片视觉类型、组件与动画标准

### 视觉类型

- `OpeningScene`：终端到程序的入口迁移。
- `Concept Diagram`：内核模块、消息流和同内核双入口。
- `Comparison`：CLI／SDK、Client SDK／Agent SDK、三种工具权限。
- `UI Simulation`：语言安装卡、终端、代码窗口和结果卡。
- `Task Execution`：`utils.py` 从 bug 到防御性处理。
- `Decision Diagram`：CLI、Agent SDK、Managed Agents 的选择路径。
- `SummaryScene`：关键词收束和下一篇预告。

### 组件标准

- `Window`：终端、代码和消息流窗口。
- `FlowNode`：工具、代理循环、入口和结果节点。
- `CodeDiff`：`Client SDK` 的循环、`query()` 示例和 `utils.py` 修改。
- `PermissionBadge`：工具列表和权限等级。
- `ResultCard`：错误、`Done: success` 和文件验收状态。
- `PreviewCard`：总结和下一篇预告。

### 动画标准

- 迁移：人／CLI → 程序／Agent SDK。
- 汇聚：工具、代理循环、上下文管理 → 内核。
- 对比：`while` 循环展开，`query()` 路径收缩。
- 解锁：`Read` → `Edit` → `Bash` 对应能力扩大。
- 执行：`Read` → `Edit` → `Done: success` → 文件 diff。
- 收束：关键词汇入 `Agent SDK`，预告卡停留 2—3 秒。

## Gate 2 内部审查

- [x] 12 个 Scene 与 Scene Script、Narration Script 一一对应。
- [x] Narration Script 每个 Scene 下只有实际口播，没有视觉说明、制作备注或检查清单。
- [x] 视觉承担入口迁移、工具执行、权限变化和文件结果，没有把口播全文复制到屏幕。
- [x] 所有标题、标签、命令、代码、状态和下一篇预告均可追溯到 Source 或前置生产资料。
- [x] 结构沿用基线：全局视觉原则 → 逐 Scene 视觉设计 → 全片类型／组件／动画标准 → Gate 2。
- [x] Prototype 使用纯 HTML、CSS 和少量 JavaScript，无外部依赖。
- [x] Prototype 只用于静态视觉确认，不进入 TTS、`tts-script.json`、音频、字幕、Timeline 或 Remotion。

Gate 2 结论：通过，完成 Visual Prototype 后停止。
