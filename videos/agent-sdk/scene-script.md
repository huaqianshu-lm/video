# Agent SDK 视频化 · 第四步：Scene Script

## Scene 01｜从用工具的人到造工具的人

- sceneId：`scene-01`
- title：从用工具的人到造工具的人
- purpose：建立「终端使用」与「程序自动化」之间的需求落差。
- narrativeRole：问题钩子
- narrationIntent：说明 Claude Code 不只是在终端里被人调用，重复流程和产品能力需要程序自动起代理。
- visualIntent：让同一能力从人手敲的终端迁移到自动审 PR、定时任务和产品助手。
- visualType：`OpeningScene / Process`
- keyOnScreenText：`CLI`、`自动审 PR`、`定时任务`、`产品里的 AI 助手`
- videoValue：迁移动画能让观众先感知「入口改变」，再理解 SDK 的定义。
- sourceBasis：Source 开篇的 CLI 用户／程序调用、自动审 PR、定时任务和产品助手。

## Scene 02｜SDK 搬走的是 Claude Code 内核

- sceneId：`scene-02`
- title：SDK 搬走的是 Claude Code 内核
- purpose：定义 Agent SDK，并拆出它承载的核心能力。
- narrativeRole：核心定义
- narrationIntent：解释 Agent SDK 是 Claude Code 内核的库化入口，包含工具、代理循环和上下文管理。
- visualIntent：展示三个能力模块汇入可编程的 Agent SDK。
- visualType：`ConceptScene / Connection Diagram`
- keyOnScreenText：`Agent SDK`、`工具`、`代理循环`、`上下文管理`
- videoValue：模块汇聚能把抽象的「内核」变成可见结构。
- sourceBasis：Source 第 01 节关于内置工具、想→做→看、上下文管理和扩展点的说明。

## Scene 03｜同一个内核，两个入口

- sceneId：`scene-03`
- title：同一个内核，两个入口
- purpose：区分 CLI 与 SDK 的服务对象和触发方式。
- narrativeRole：关系澄清
- narrationIntent：说明 CLI 适合人在场的交互，SDK 适合程序触发的自动化，两者共享内核和工作思路。
- visualIntent：让人和程序从两条入口汇入同一个 Claude Code 内核。
- visualType：`ComparisonScene / Connection Diagram`
- keyOnScreenText：`人`、`CLI`、`程序`、`Agent SDK`、`同一个 Claude Code 内核`
- videoValue：双入口汇聚关系比静态定义更能建立迁移直觉。
- sourceBasis：Source 第 02 节「相同的功能，不同的界面」和 CLI／SDK 用例表。

## Scene 04｜差别不在模型，在工具循环

- sceneId：`scene-04`
- title：差别不在模型，在工具循环
- purpose：明确 Client SDK 与 Agent SDK 的执行责任差异。
- narrativeRole：关键转折
- narrationIntent：解释原始 API 需要自己执行工具并回传结果，Agent SDK 把这条循环收进 `query()`。
- visualIntent：左侧循环展示 `tool_use → executor → tool_result`，右侧压缩为 `query()` 消费消息流。
- visualType：`ComparisonScene / Code Exploration`
- keyOnScreenText：`Client SDK`、`while`、`your_tool_executor`、`Agent SDK`、`query()`
- videoValue：代码循环的展开与收缩是「谁来编排」的直接证据。
- sourceBasis：Source 第 03 节的 Python 对比代码和工具循环解释。

## Scene 05｜按项目语言选择入口

- sceneId：`scene-05`
- title：按项目语言选择入口
- purpose：给出 TypeScript／Python 的选择、安装和运行前提。
- narrativeRole：落地准备
- narrationIntent：说明两套功能对齐，按项目语言选，并记住 Node.js 18+、Python 3.10+ 和 API key 前提。
- visualIntent：两列安装卡将语言、命令、版本和密钥边界并排呈现。
- visualType：`StepListScene / UI Simulation`
- keyOnScreenText：`TypeScript`、`Python`、`Node.js 18+`、`Python 3.10+`、`ANTHROPIC_API_KEY`
- videoValue：对照布局能快速支持选择，不需要把两套教程重复讲一遍。
- sourceBasis：Source 第 04 节的安装表、版本要求和 API key 说明。

## Scene 06｜`query()` 是代理入口

- sceneId：`scene-06`
- title：`query()` 是代理入口
- purpose：建立最小 API 心智模型和消息流概念。
- narrativeRole：概念落地
- narrationIntent：解释 `prompt` 指任务、`options` 指配置，`query()` 返回消息流，Python 用 `async for` 接收。
- visualIntent：沿着 `prompt + options → message stream` 展开，并高亮工具权限。
- visualType：`ConceptScene / Process`
- keyOnScreenText：`query()`、`prompt`、`options`、`allowed_tools`、`async for`、`message stream`
- videoValue：数据流动画能把一行入口代码与代理执行过程连接起来。
- sourceBasis：Source 第 05 节 Python／TypeScript 示例、参数解释和消息流说明。

## Scene 07｜权限决定代理能做什么

- sceneId：`scene-07`
- title：权限决定代理能做什么
- purpose：说明 `allowed_tools` 是能力边界，而不是装饰参数。
- narrativeRole：安全边界
- narrationIntent：从只读、可编辑到可执行三档说明工具列表如何决定代理行为。
- visualIntent：同一代理在三种工具权限下逐步获得 Read、Edit、Bash 能力。
- visualType：`StepListScene / Permission Map`
- keyOnScreenText：`Read`、`Glob`、`Grep`、`Edit`、`Bash`、`只读分析`、`完全自动化`
- videoValue：能力逐项解锁能让权限与行为建立因果关系。
- sourceBasis：Source 第 05 节 allowed_tools 对照表。

## Scene 08｜先造一个会崩的 `utils.py`

- sceneId：`scene-08`
- title：先造一个会崩的 `utils.py`
- purpose：把实战的输入状态和两个边界 bug 具体化。
- narrativeRole：实战起点
- narrationIntent：说明先建目录、安装 SDK，再准备空列表除零和空用户取姓名两个待修问题。
- visualIntent：代码窗口展示 `calculate_average` 与 `get_user_name`，错误状态被标记出来。
- visualType：`TerminalScene / Code Exploration`
- keyOnScreenText：`my-agent`、`utils.py`、`calculate_average([])`、`get_user_name(None)`、`ZeroDivisionError`、`TypeError`
- videoValue：真实输入和可复现错误让后续代理动作有明确目标。
- sourceBasis：Source 第 06 节第一至第三步和两个 bug 说明。

## Scene 09｜让代理读、改、再回报

- sceneId：`scene-09`
- title：让代理读、改、再回报
- purpose：展示 `agent.py` 如何把任务、工具和权限组合起来。
- narrativeRole：执行启动
- narrationIntent：解释 prompt 要求审查并修复，权限开放 Read、Edit、Glob，`acceptEdits` 自动批准编辑。
- visualIntent：从 `agent.py` 的 query 配置发出任务，消息流依次出现 `Read`、`Edit`。
- visualType：`TerminalScene / Task Execution`
- keyOnScreenText：`agent.py`、`Review utils.py for bugs`、`Read`、`Edit`、`Glob`、`acceptEdits`
- videoValue：把配置项和实际工具调用绑定，证明 SDK 不只是返回一段文本。
- sourceBasis：Source 第 06 节第四步的代理代码和权限模式说明。

## Scene 10｜成功要落在文件里

- sceneId：`scene-10`
- title：成功要落在文件里
- purpose：展示运行结果和实际文件验收。
- narrativeRole：结果证明
- narrationIntent：说明先看流式消息和 `Done: success`，再打开 `utils.py` 确认防御性处理已经落地。
- visualIntent：终端状态从工具调用到成功，代码 diff 显示空列表和空用户的处理分支。
- visualType：`TerminalScene / Process`
- keyOnScreenText：`python agent.py`、`Tool: Read`、`Tool: Edit`、`Done: success`、`防御性处理`
- videoValue：从消息到文件的双重验收避免把模型口头结果当作完成。
- sourceBasis：Source 第 06 节第五、六步和成功证据。

## Scene 11｜什么时候该用 SDK

- sceneId：`scene-11`
- title：什么时候该用 SDK
- purpose：给出 CLI 与 SDK 的使用边界和本地到生产的路径。
- narrativeRole：决策收束
- narrationIntent：只想终端操作就用 CLI；想做重复自动化、机器人或产品功能才上 SDK；生产化再考虑 Managed Agents。
- visualIntent：三条选择路径根据「人在场／程序自动跑／托管生产」分流。
- visualType：`ComparisonScene / Decision Diagram`
- keyOnScreenText：`只用 CLI`、`重复自动化`、`嵌入产品`、`Agent SDK`、`Managed Agents`
- videoValue：决策图把「学不学」从抽象建议变成可执行选择。
- sourceBasis：Source 第 07 节适用人群、成长路径和 Managed Agents 对照表。

## Scene 12｜把能力变成你能调用的零件

- sceneId：`scene-12`
- title：把能力变成你能调用的零件
- purpose：收束全片关键判断，并加入下一篇预告。
- narrativeRole：总结与系列预告
- narrationIntent：复述内核、入口、工具循环、`query()`、权限和适用人群，预告下一篇开发配置。
- visualIntent：六个关键词收束成 Agent SDK，再变为「下一篇：开发配置」预告卡。
- visualType：`SummaryScene / Preview Card`
- keyOnScreenText：`工具 + 代理循环 + 上下文管理`、`CLI`、`Agent SDK`、`query()`、`allowed_tools`、`下一篇：开发配置`
- videoValue：关系收束和下一集预告需要时间停留，不能只存在于口播里。
- sourceBasis：Source 第 08 节小结和文末下一篇预告。

## Gate 1 字段审查

- [x] 12 个 Scene 均明确 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText`、`videoValue`。
- [x] Scene 顺序遵循问题→定义→关系→误区→入口→权限→实战→决策→总结，而非照搬文章章节。
- [x] 每个 Scene 都有来自 Source 的依据，未执行命令或引入下一篇正文。
- [x] Scene 12 承担下一篇预告，预告内容与 Source 一致。

Gate 1 结论：通过，进入 Narration Script、Visual Script 和 Visual Prototype。
