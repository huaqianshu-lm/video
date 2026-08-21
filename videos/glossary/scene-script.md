# Claude Code 术语表视频化 · 第三步：Scene Script

> 共 12 个 Scene。每幕只承担一个主要认知任务；所有命令仅作为文章内容和原型画面，不在本任务中执行。

## Scene 01｜术语表不是课文

### 目的

改变观众对术语表的使用预期，建立“遇到再查”的观看动机。

### narrativeRole

Opening：提出错误学习方式，再给出速查卡的正确定位。

### narrationIntent

解释为什么从头背术语表容易忘，以及主题族和“一句话加类比”如何帮助查找。

### visualIntent

把密集术语从一堵难读的墙重新整理成六张主题卡。

### visualType

`Opening Scene + Reframing Diagram`

### keyOnScreenText

```text
术语表不是课文
是一张速查卡
遇到 · 定位 · 查清
代理循环 / 上下文 / 扩展点 / MCP / 安全权限 / 入口运行
```

### videoValue

密集词条被动态归类、再转成可回查卡片，能直接制造“从背诵到查找”的认知转折。

### 信息分工

- 声音解释正确使用方式。
- 画面展示六族从混乱到归类的过程。

## Scene 02｜代理循环：想、做、看

### 目的

建立理解 Claude 能自主工作的第一张机制地图。

### narrativeRole

Foundation：先解释其余术语依附的代理循环。

### narrationIntent

讲清 `agentic loop` 的收集上下文、采取行动、验证结果和继续循环；补充 tool、agentic coding、harness、turn、verification loop、extended thinking、effort level 的位置。

### visualIntent

用闭环和零件卡表现“模型不是只回答，而是在工具和验证之间继续工作”。

### visualType

`Agent Loop Diagram`

### keyOnScreenText

```text
收集上下文 → 采取行动 → 验证结果
不够？再来一圈
agentic loop
Tool · Harness · Turn · Verification loop
```

### videoValue

闭环、工具调用和验证状态需要时间顺序与回路动画，视频能让机制变成直觉。

### 信息分工

- 声音解释术语之间的关系。
- 画面让循环实际转动，并让“验证结果”成为下一圈的入口。

## Scene 03｜上下文：一张有限的工作台

### 目的

让观众理解 Claude 的记性边界、压缩动作和会话粒度。

### narrativeRole

Foundation：解释工作台如何容纳和整理信息。

### narrationIntent

说明 context window、token、compaction、auto-compact、session、turn、CLAUDE.md、auto memory、rules 和 output style 的分工。

### visualIntent

把对话、文件、工具输出和规则放上有限工作台，达到容量边界后触发整理。

### visualType

`Context Workspace Simulation`

### keyOnScreenText

```text
Context window
对话 / 文件 / 工具输出 / CLAUDE.md / Skill
Compaction
Auto-compact
```

### videoValue

容量、占用、整理和“会话／回合”的粒度是状态变化，静态定义不如工作台动画直观。

### 信息分工

- 声音区分工作内存、处理单位、会话和规则来源。
- 画面展示工作台变满、压缩成要点和新 turn 继续进入。

## Scene 04｜扩展点：给 Claude 加装备

### 目的

让观众理解不同扩展点不是同一种“插件”，而是插在不同位置的装备。

### narrativeRole

Expansion：从核心循环转向能力定制。

### narrationIntent

分别解释 skill、subagent、hook、command／slash command、plugin 和 plugin marketplace。

### visualIntent

展示专项菜谱、外派帮手、自动卡点、固定按键、装备箱和应用商店之间的层级关系。

### visualType

`Extension Kit Comparison`

### keyOnScreenText

```text
Skill
Subagent
Hook
Command
Plugin
Marketplace
加装备 ≠ 都是同一种装备
```

### videoValue

装备的装配位置和作用差异适合用空间分层表达，避免变成六条平行定义。

### 信息分工

- 声音解释“按需加载、独立上下文、事件触发、打包分发”的差异。
- 画面展示每件装备接入代理循环的不同位置。

## Scene 05｜MCP：把 Claude 接到外部世界

### 目的

建立 MCP 家族的标准、服务、连接和共享范围四层关系。

### narrativeRole

Expansion：把能力边界从项目内部延伸到外部服务。

### narrationIntent

解释 MCP、MCP server、transport、scope 和 MCP Tool Search，并提醒连接第三方 server 前要考虑信任。

### visualIntent

用扩展坞、接头、连线和共享范围展示 MCP 的结构。

### visualType

`Connection Diagram`

### keyOnScreenText

```text
MCP = AI 接外部工具的标准
server = 具体接头
transport = stdio / http
scope = local / project / user
Tool Search = 按需加载
```

### videoValue

连接关系、远近传输和作用域共享需要同时出现并发生变化，空间化图示比逐句解释更容易记住。

### 信息分工

- 声音说明各层职责和 `stdio`／`http` 的区别。
- 画面展示本地 server、远程 server、共享范围和按需工具说明。

## Scene 06｜安全与权限：动手前的多层把关

### 目的

说明 Claude 能动手不等于没有边界，安全机制是分层的。

### narrativeRole

Boundary：在能力扩展之后引入自主权、隔离和风险。

### narrationIntent

区分 permission mode、plan mode、auto mode、permission rule、sandboxing、prompt injection 和 checkpoint。

### visualIntent

让一项操作依次经过会话基线、细则、隔离墙和还原点，同时从侧面标出需要防范的提示注入。

### visualType

`Security Layer Diagram`

### keyOnScreenText

```text
Permission mode
Permission rule
Sandboxing
Checkpoint
Prompt injection？
```

### videoValue

“大基线 → 细规则 → 物理隔离 → 可回溯”是层级关系，动画门禁能把抽象安全概念变成过程。

### 信息分工

- 声音解释各层控制的对象。
- 画面演示操作被允许、询问、隔离或回溯的状态，不模拟真实执行。

## Scene 07｜入口与运行：同一个引擎，不同的到岗方式

### 目的

让观众把入口、运行模式和隔离方式放入同一张地图。

### narrativeRole

Boundary：说明使用形态变化不等于底层能力变化。

### narrationIntent

介绍 surface、non-interactive mode、Agent SDK、网页版、bare mode、worktree isolation、Remote Control 和 Teleport。

### visualIntent

让同一个 Claude Code 引擎分别连接终端、编辑器、网页、脚本和远程控制，并标出本地／云端与隔离边界。

### visualType

`Runtime Surface Map`

### keyOnScreenText

```text
同一个引擎
CLI / VS Code / JetBrains / Web
-p / --print
Agent SDK
Bare mode · Worktree isolation
Remote Control ↔ Teleport
```

### videoValue

入口、单次脚本、云端沙箱和本地接管的关系适合用路由动画，观众能看到“在哪里、怎么跑”。

### 信息分工

- 声音解释运行姿势和隔离方式。
- 画面保持中央引擎不变，只切换连接入口和运行边界。

## Scene 08｜易混关系一：上下文与加载边界

### 目的

用区分维度切开第一组容易混淆的术语。

### narrativeRole

Clarification：从纵向术语地图转到横向辨析。

### narrationIntent

讲清 Skill vs Subagent、CLAUDE.md vs Skill、Session vs Turn、Compaction vs `/clear`、CLAUDE.md vs auto memory 的关键区别。

### visualIntent

把每一对放进“区分维度”卡片，动态高亮决定差异的词，而不是展示两列长定义。

### visualType

`Contrast Cards`

### keyOnScreenText

```text
内容进谁的上下文？
什么时候加载？
粒度？
留不留旧内容？
谁写的？
```

### videoValue

术语撞车的原因是维度相邻；卡片高亮“比较轴”能比死记答案更稳定地建立判断方法。

### 信息分工

- 声音给出五组对照的结论。
- 画面只突出每组的一个决定性维度和两端词条。

## Scene 09｜易混关系二：控制、连接与协作边界

### 目的

完成剩余易混术语的横向切分。

### narrativeRole

Clarification：把权限、连接和代理协作的相邻概念分开。

### narrationIntent

讲清 Hook vs 权限规则、Subagent vs Agent team、Permission mode vs 权限规则、stdio vs http 的区别。

### visualIntent

用四条比较轨道展示“事件还是权限”“能否直接对话”“粗还是细”“本地还是远程”。

### visualType

`Boundary Comparison`

### keyOnScreenText

```text
事件触发 / 工具准不准
单会话汇报 / 多会话对话
大基线 / 细规则
本机进程 / 远程服务
```

### videoValue

四个维度分别对应行为、协作、权限和连接，逐轨高亮能避免九组关系堆成不可读的表格。

### 信息分工

- 声音解释每条比较轴。
- 画面用左右两端和中间标签展示区别，不模拟实际权限结果。

## Scene 10｜官方文档 server：把静态卡变成活字典

### 目的

把术语表的查找方法转成可以复用的四步行动路径。

### narrativeRole

Action：从理解术语转向获取权威定义的方法。

### narrationIntent

按原文顺序讲 add、list、进入 claude 查询、可选 remove，并强调命令只在终端执行、首次调用可能需要批准、绿勾表示连接状态。

### visualIntent

模拟四步命令卡和状态变化，明确这是文章中的练习流程，不是本次任务的实际执行。

### visualType

`Terminal Process Simulation`

### keyOnScreenText

```text
1 add
2 list → ✓ Connected
3 claude → 查询定义
4 remove（可选）
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
```

### videoValue

步骤、命令、预期状态和批准节点需要按顺序展开，视频能演示“怎么查”而不是只说“去查官方文档”。

### 信息分工

- 声音解释每一步的目的和“活字典”的价值。
- 画面展示命令、`Added`、`✓ Connected`、查询标记和可选清理。

## Scene 11｜六族总地图：回来查哪一张

### 目的

把整篇内容收束成可回忆的索引。

### narrativeRole

Summary：把纵向观看结果压缩成长期查找入口。

### narrationIntent

回顾六族的一句话定位和镇族术语，让观众知道遇到陌生词应先归族。

### visualIntent

六张卡围绕“Claude Code 术语速查卡”展开，依次高亮六族与核心词。

### visualType

`Taxonomy Map`

### keyOnScreenText

```text
代理循环｜会自己动手的运转机制
上下文｜记性边界与说话方式
扩展点｜给它加装备
MCP｜接外部世界
安全权限｜动手前的把关
入口运行｜从哪儿用、怎么跑
```

### videoValue

六族的层级和互相关系需要一张可回看的地图，视频的聚合动画能帮助观众形成空间记忆。

### 信息分工

- 声音做快速索引回顾。
- 画面用族卡和镇族术语承载查找路径，不再次朗读全部词条。

## Scene 12｜查卡收束与下一集预告

### 目的

给出最终使用闭环，并完成系列视频的下一集预告。

### narrativeRole

Closing：从术语认知上升到长期使用方法，再承接第 53 篇。

### narrationIntent

总结“遇到术语就定位、对照、必要时现查”，并明确下一篇是 53「制作视频（Remotion）〔选读〕」，介绍用 React 代码写视频。

### visualIntent

先完成 `遇到术语 → 按族定位 → 看区分维度 → 官方 server 现查` 的闭环，再单独展开下一集预告卡。

### visualType

`Closing Flow + Next Episode Preview`

### keyOnScreenText

```text
遇到术语 → 按族定位 → 看区别 → 必要时现查
这是一张速查卡，不是一篇课文
下一篇 53｜制作视频（Remotion）〔选读〕
用 React 代码写视频
```

### videoValue

结尾需要同时留下可执行方法和系列方向；流程动画与预告卡能提供比一句口播更清晰的停留结构。

### 信息分工

- 声音完成方法总结和下一集口播。
- 画面先收束方法，再把预告作为最后一个视觉事件独立停留约 2～3 秒。

## Gate 1 内部审查

- 12 个 Scene 覆盖文章的使用定位、六族、九组易混关系、活字典练习、小结和下一篇预告。
- 每个 Scene 均明确 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- 口播与视觉分工已定义：口播解释关系，画面展示流程、层级、状态或对照。
- 文章命令只属于 Scene 10 的待展示内容，没有被当作本次执行指令。
- 所有画面文字均可追溯到 source 或本生产资料中的结构性表达；没有复用其他视频的业务文案。

## 下一步

基于本 Scene Script 生成纯口播 Narration Script、Visual Script 和横屏 Visual Prototype，进入 Gate 2 内部审查。
