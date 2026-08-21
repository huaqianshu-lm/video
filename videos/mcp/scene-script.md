# MCP：给 Claude 接上外部世界 · Scene Script

> 目标：把 Video Narrative 拆成可制作的视频场景。每个 Scene 同时定义：讲什么、为什么讲、口播承担什么、画面承担什么。

## Scene 01｜参数位置错了，server 连不上

### purpose
用一个真实排坑场景建立注意力，并引出“选项由谁解析”的全片问题。

### narrativeRole
Hook：先让观众看到错误结果，再揭示 MCP 的关键难点是命令位置与边界。

### narrationIntent
讲清错误命令看似合理但把 `--transport stdio` 放到了 `--` 后面，修正后连接成功；提醒观众本片会填平这些细节坑。

### visualIntent
模拟终端从错误命令、反复下载、连接失败切换到正确命令和 Connected 状态，突出 `--` 的责任边界。

### visualType
`TerminalScene + Before/After`

### keyOnScreenText
```text
错误：claude mcp add db -- npx server --transport stdio
正确：claude mcp add db -- npx server
-- 后面：传给 server 的命令
✓ Connected
```

### videoValue
参数位置和状态变化需要通过命令被解析、失败、修正和连通的连续过程建立直觉，静态定义不如动态排错清楚。

## Scene 02｜MCP 是 Claude 的外部扩展坞

### purpose
解释 MCP 补上的短板，建立本地世界与外部服务之间的空间关系。

### narrativeRole
Definition：在观众看到问题后给出核心模型，而不是先念协议全称。

### narrationIntent
说明 Claude Code 默认主要处理本地文件和命令，够不着 Jira、数据库、Figma；MCP 是用于 AI 工具集成的开放标准。

### visualIntent
让 Claude Code 左侧连接本地文件和命令，右侧的 Jira、PostgreSQL、Figma 先处于断开状态，再由 MCP 扩展坞接通。

### visualType
`Connection Diagram + Concept Visualization`

### keyOnScreenText
```text
Claude Code
本地文件 · 命令行
MCP · Model Context Protocol
Jira · PostgreSQL · Figma
```

### videoValue
“连接外部世界”是空间和关系变化，连接线从断开到接通比重复口播“可以访问外部服务”更有证明力。

## Scene 03｜三种 transport：本地、远程、已弃用

### purpose
建立选择 transport 的第一个判断轴：server 跑在本地还是远程。

### narrativeRole
Classification：把抽象协议落到三种可辨认的运行形态。

### narrationIntent
区分 stdio、HTTP、SSE：stdio 是本地进程且默认，HTTP 是远程云服务的推荐方式，SSE 是已弃用的旧方式。

### visualIntent
用三条并列路径展示本机子进程、远程 URL 和带 Deprecated 标签的 SSE；强调 `--` 启动命令只属于 stdio。

### visualType
`ComparisonScene + Connection Diagram`

### keyOnScreenText
```text
stdio：本地进程 · 默认
HTTP：远程 URL · 官方推荐
SSE：远程 · 已弃用
```

### videoValue
运行位置、连接方式和推荐状态是动态连接关系，三路同时对比能避免把三种 transport 混成三个参数名称。

## Scene 04｜`add` 命令的四个区段

### purpose
把最容易出错的命令语法拆成可以检查的结构。

### narrativeRole
Mechanism：解释选项、server 名称、`--` 和启动命令的责任边界。

### narrationIntent
说明所有 `claude mcp add` 自己的选项要放在 server 名称前，`--` 后才是传给 server 的命令和参数，并分别展示 HTTP 与 stdio 写法。

### visualIntent
把命令显示为四段色块：Claude Code 选项、名称、分隔线、server 启动命令；移动错误参数到错误区域，再归位。

### visualType
`TerminalScene + Command Anatomy`

### keyOnScreenText
```text
claude mcp add [选项] [name] -- [command] [args]
--transport http notion https://mcp.notion.com/mcp
airtable -- npx -y airtable-mcp-server
```

### videoValue
命令语法的含义由位置决定，分段、移动和高亮能直接展示“谁处理哪一段”。

## Scene 05｜三种 scope：这个 server 给谁用

### purpose
解释 local、project、user 的适用范围、共享方式和配置位置。

### narrativeRole
Choice：将“加上 server”推进到“决定它在哪些项目里出现”。

### narrationIntent
用个人实验、团队共享、跨项目个人使用三个场景解释三种 scope，并说明 `.mcp.json` 是 project 共享配置。

### visualIntent
用范围圆／项目文件树表现 local 只覆盖当前项目，project 覆盖当前项目并进入 Git，user 跨多个项目但只属于当前用户。

### visualType
`Scope Diagram + ComparisonScene`

### keyOnScreenText
```text
local：当前项目 · 私有 · 默认
project：当前项目 · 团队共享 · .mcp.json
user：所有项目 · 个人私有
```

### videoValue
scope 的差异本质是覆盖范围和共享关系，项目节点与配置文件的出现／扩散比表格朗读更容易记住。

## Scene 06｜工具出现了，但还要过两道闸

### purpose
解释 server 加入后工具如何出现、状态如何确认，以及批准为什么不是多余步骤。

### narrativeRole
Permission：把“已配置”与“可安全使用”区分开。

### narrationIntent
说明 `claude mcp list` 和 `/mcp` 如何查看状态，项目 `.mcp.json` 的 server 首次加载要批准，某个工具第一次调用时还要再次批准。

### visualIntent
先让 server 的工具注册到 Claude 面前，状态牌从 Pending approval 变为 Connected；随后连续亮起“项目 server 批准”和“工具首次调用批准”两道闸。

### visualType
`UI Simulation + Approval Gate`

### keyOnScreenText
```text
claude mcp list
/mcp
⏸ Pending approval → ✓ Connected
项目 server 批准
工具首次调用批准
```

### videoValue
状态和批准是时序事实，只有展示“待批准 → 允许 → 调用”才能让观众理解配置、连接和执行不是同一刻发生。

## Scene 07｜第三方 server 不是自动可信

### purpose
在进入实战前补上第三方代码、提示注入和最小权限的安全边界。

### narrativeRole
Constraint：防止观众把 MCP 理解成无条件扩权的万能入口。

### narrationIntent
说明 Anthropic 不替每个 server 做安全审计，外部内容可能带来提示注入；优先官方来源，数据库尽量使用只读账号。

### visualIntent
把官方目录和大厂官方 server 放在较高信任层，把未知第三方放在警告层，最后将数据库凭据从 read/write 收缩为 readonly。

### visualType
`Trust Gradient + Security Diagram`

### keyOnScreenText
```text
先验证信任
外部内容 → 提示注入风险
生产数据库：readonly
```

### videoValue
信任和权限是梯度关系，画面收缩权限与标记来源能把安全建议从抽象警告变成可执行选择。

## Scene 08｜实战第一段：add，然后看 list

### purpose
用官方文档 HTTP server 把 transport、add 命令和连接状态串成前两步。

### narrativeRole
Demonstration：从概念进入可复现的操作闭环，但仍保持模拟展示。

### narrationIntent
说明先在终端添加 `claude-code-docs` HTTP server，再用 `claude mcp list` 检查是否出现 `✓ Connected`；失败时检查网络或 URL。

### visualIntent
模拟输入 add 命令、显示 Added 确认，再切换到 list 输出并高亮 server 名称和 Connected 状态。

### visualType
`TerminalScene + StepListScene`

### keyOnScreenText
```text
1  add
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
2  list
claude-code-docs   ✓ Connected
```

### videoValue
命令、确认输出和连接状态是连续的操作证据，视频可以让观众看到“写入配置”与“真的连上”之间的区别。

## Scene 09｜实战第二段：批准、调用，再 remove

### purpose
完成会话内调用和清理，展示批准、来源标记与上下文清理。

### narrativeRole
Demonstration：闭合实践链路，并回扣权限与上下文成本。

### narrationIntent
说明进入 Claude 会话后点名 `claude-code-docs` 查询 `MCP_TIMEOUT`，首次调用批准工具，看到 server 名称后确认调用来源，完成后用 remove 清理不用的连接。

### visualIntent
展示会话输入、批准弹窗、工具调用旁的 server 标签和返回结果，最后把 server 从列表移除并释放上下文提示。

### visualType
`UI Simulation + Task Execution`

### keyOnScreenText
```text
用 claude-code-docs server 查一下 MCP_TIMEOUT 这个环境变量是干什么的
允许使用新工具？
server：claude-code-docs
claude mcp remove claude-code-docs
```

### videoValue
“批准—调用—看来源—清理”是多个状态的顺序变化，视频能把安全确认和实际工具调用连成一个可复用动作。

## Scene 10｜接外部能力，也要保留判断

### purpose
总结 MCP 的选择原则、操作闭环和安全边界，并加入系列下一集预告。

### narrativeRole
Summary：把命令细节收束成可执行判断，打开下一集。

### narrationIntent
回顾 MCP、stdio／HTTP／SSE、scope、状态与两道批准闸、信任与只读权限；最后预告下一篇“23 子代理（Subagent）”。

### visualIntent
展示四条结论映射卡，随后在独立区域出现下一篇预告，保持预告与字幕区域分离。

### visualType
`SummaryScene + Decision Cards + Teaser`

### keyOnScreenText
```text
本地工具：stdio
云服务：HTTP
作用域：local / project / user
先检查、再批准、再调用
下一篇 23：子代理（Subagent）
```

### videoValue
总结需要把多个选择压缩成“场景 → 判断”的映射，下一集预告则是系列内容的最后视觉事件。

## Gate 1／Scene 结构检查

- 10 个 Scene 与 Video Narrative 一一对应，编号连续且每幕只有一个主要认知任务。
- 每幕均明确 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- 命令位置、transport、scope、状态、批准、信任、实战清理和下一篇预告均可追溯到 source。
- 所有命令只作为屏幕内容展示，不执行；未生成 TTS、音频、字幕或 Timeline。
- 未把下一篇文章的业务内容带入本片。

**Gate 1 结论：通过。**

## 下一步

基于本 Scene Script 生成纯口播 `narration-script.md` 和互补的 `visual-script.md`，再制作横屏 Visual Prototype。
