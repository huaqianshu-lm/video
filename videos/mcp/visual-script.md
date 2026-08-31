# MCP：给 Claude 接上外部世界 · Visual Script

> 目标：基于 Scene Script 和 Narration Script，为每个 Scene 明确视觉表达。声音负责解释，画面负责演示、证明和建立直觉。

## 全局视觉原则

### 1. 画面不重复口播

口播解释 MCP 的意义和命令规则，画面展示 server 的运行位置、参数边界、状态和权限变化。不要把整段口播直接铺在屏幕上。

### 2. 用连接和状态表达抽象概念

本片的核心视觉语言是“接通／断开、范围、状态、闸门”。MCP 层、transport、scope、Connected 和 Pending approval 都通过关系变化表达。

### 3. 一个 Scene 只有一个视觉中心

命令拆解、scope 范围、批准闸门和实战步骤分别占据不同 Scene，不在同一幕堆叠完整教程页面。

### 4. 命令只做屏幕内容

所有命令和预期输出都是原型中的模拟文字，不在本任务中执行，不把原型控件误当成正式视频交互。

### 5. 动画必须传递信息

优先使用参数移动、连接线出现、范围扩散、状态切换、批准闸打开和 server 从列表移除；少用无意义粒子、旋转和装饰性弹跳。

## Scene 01｜参数位置错了，server 连不上

### 视觉目标

先让错误命令看起来“像是能跑”，再展示参数被错误分配，最后用正确命令得到连接状态。

### 画面结构

深色 Terminal window，分为错误尝试和修正后的两段状态。错误命令中把 `--transport stdio` 放在 `--` 后并标红；正确命令把它移除，终端出现 `✓ Connected`。

### 动画

1. 输入错误命令。
2. `npx` 下载进度反复循环，状态停在 `Connection error`。
3. 放大 `--` 分界线，并显示“后面是 server 命令”。
4. 切换正确命令，出现 `✓ Connected`。

### 屏幕文字

```text
参数位置
--transport：Claude Code 选项
-- 后面：server 启动命令
```

### Visual Type

`Terminal Simulation + Before/After`

## Scene 02｜MCP 是 Claude 的外部扩展坞

### 视觉目标

把“本地够得着、外部够不着、MCP 接通”变成一张可读的连接图。

### 画面结构

中间是 MCP hub，左侧是 Claude Code 与本地文件、命令行，右侧是 Jira、PostgreSQL、Figma。初始右侧节点灰暗断开，随后两侧连线同时点亮。

### 动画

1. 本地节点先亮起。
2. 外部服务节点显示断开状态。
3. MCP hub 展开，向外发出连接线。
4. 外部服务节点变为可用状态。

### 屏幕文字

```text
Claude Code
本地文件 · 命令行
MCP · Model Context Protocol
Jira · PostgreSQL · Figma
```

### Visual Type

`Connection Diagram`

## Scene 03｜三种 transport：本地、远程、已弃用

### 视觉目标

用运行位置而不是术语记忆区分三种 server 形态。

### 画面结构

三列连接卡：本地机器中的 stdio 子进程、远程 URL 的 HTTP server、带灰色 Deprecated 标签的 SSE server。每列只保留一条示例命令。

### 动画

1. 本地机器启动 stdio 子进程。
2. HTTP 连接线从 Claude 延伸到远程网址。
3. SSE 卡片出现并被压低透明度，保留“已弃用”标签。

### 屏幕文字

```text
stdio · 本地进程 · 默认
HTTP · 远程 URL · 官方推荐
SSE · 远程 · 已弃用
```

### Visual Type

`Comparison Diagram`

## Scene 04｜`add` 命令的四个区段

### 视觉目标

让观众直接看到命令的解析边界。

### 画面结构

一条横向命令轨道分成四色区段：`[Claude Code options] [server name] [--] [server command]`。下方同时给出 HTTP 和 stdio 的正确示例。

### 动画

1. 高亮名称前的 `--transport http`。
2. 放大 `--` 分隔线。
3. 让 `npx -y airtable-mcp-server` 滑入右侧 server command 区。
4. 错误参数短暂滑入右侧后被退回选项区。

### 屏幕文字

```text
claude mcp add [选项] [name] -- [command] [args]
--transport http notion https://mcp.notion.com/mcp
airtable -- npx -y airtable-mcp-server
```

### Visual Type

`Command Anatomy + Terminal Simulation`

## Scene 05｜三种 scope：这个 server 给谁用

### 视觉目标

用范围覆盖和文件位置展示 local、project、user 的差异。

### 画面结构

左侧是当前项目，右侧是多个项目。local 只覆盖当前项目；project 的配置从 `.mcp.json` 进入 Git 团队节点；user 的连接线覆盖多个项目但带个人锁。

### 动画

1. local 节点只点亮一个项目。
2. project 从 `.mcp.json` 延伸到“团队”节点。
3. user 的范围扩散到多个项目，个人锁保持可见。

### 屏幕文字

```text
local · 当前项目 · 私有
project · 当前项目 · 团队共享 · .mcp.json
user · 所有项目 · 个人私有
```

### Visual Type

`Scope Diagram + Comparison`

## Scene 06｜工具出现了，但还要过两道闸

### 视觉目标

把“注册、连接、批准、调用”按顺序展示，避免观众以为 add 后就能无条件使用。

### 画面结构

左侧为 `claude mcp list` 状态面板，中间为 MCP server 工具列表，右侧为两道批准闸。初始状态是 `⏸ Pending approval`，批准后变为 `✓ Connected`，工具调用闸再单独亮起。

### 动画

1. 工具名从 server 注册到 Claude 面前。
2. 状态显示 `Pending approval`。
3. 第一扇“项目 server 批准”打开。
4. 第二扇“工具首次调用批准”打开。
5. 调用结果旁显示 server 名称。

### 屏幕文字

```text
claude mcp list · /mcp
⏸ Pending approval
项目 server 批准
工具首次调用批准
✓ Connected
```

### Visual Type

`UI Simulation + Approval Gate`

## Scene 07｜第三方 server 不是自动可信

### 视觉目标

把信任验证和最小权限从口号变成选择路径。

### 画面结构

四级信任梯度：官方目录、大厂官方 server、来源不明的第三方 server、生产数据库写权限。前两级为绿色，第三方为黄色警告，写权限为红色；最后将数据库凭据切换到 `readonly`。

### 动画

1. 外部内容卡片流入“提示注入风险”警告。
2. 未知第三方卡片停在检查点。
3. `read/write` 权限收缩为 `readonly`。
4. 最小权限标签稳定显示。

### 屏幕文字

```text
先验证信任
外部内容 → 提示注入风险
生产数据库：readonly
```

### Visual Type

`Trust Gradient + Security Diagram`

## Scene 08｜实战第一段：add，然后看 list

### 视觉目标

模拟从配置写入到连接确认的前两步，不把“Added”误当成“Connected”。

### 画面结构

左侧 Terminal 输入 HTTP add 命令，右侧状态面板先显示 Added，再切换到 `claude mcp list` 和 `✓ Connected`。

### 动画

1. 命令逐字出现。
2. 输出 `Added HTTP MCP server...`。
3. 状态面板从 Loading 转到 Connected。
4. 绿色高亮锁定 `claude-code-docs`。

### 屏幕文字

```text
1  add
claude mcp add --transport http claude-code-docs https://code.claude.com/docs/mcp
2  list
claude-code-docs   ✓ Connected
```

### Visual Type

`Step List + Terminal Simulation`

## Scene 09｜实战第二段：批准、调用，再 remove

### 视觉目标

展示从点名 server 到工具调用和清理的后两步。

### 画面结构

一个简化 Claude 会话窗口显示提问和批准弹窗；工具结果旁有 `claude-code-docs` 标签；底部列表中的 server 最后被 remove。

### 动画

1. 用户点名 server 并发送问题。
2. “允许使用新工具？”弹窗出现。
3. 批准后结果逐行返回，server 名称保持可见。
4. 执行 remove，列表中的连接淡出。
5. 上下文占用指示下降。

### 屏幕文字

```text
用 claude-code-docs server 查一下 MCP_TIMEOUT 这个环境变量是干什么的
允许使用新工具？
server：claude-code-docs
claude mcp remove claude-code-docs
```

### Visual Type

`UI Simulation + Task Execution`

## Scene 10｜接外部能力，也要保留判断

### 视觉目标

用少量映射卡收束全片，并把下一集预告作为最后一个独立视觉事件。

### 画面结构

四张窄卡依次显示：本地工具 → stdio、云服务 → HTTP、作用域 → local/project/user、安全 → 先检查再批准再调用。随后右下方出现独立预告卡，避开底部字幕胶囊。

### 动画

1. 四张总结卡按顺序出现。
2. 中央结论亮起“先检查、再批准、再调用”。
3. 总结卡降低亮度。
4. 最后出现下一篇 23“子代理（Subagent）”预告卡，停留 2—3 秒。

### 屏幕文字

```text
本地工具：stdio
云服务：HTTP
作用域：local / project / user
先检查、再批准、再调用
下一篇 23：子代理（Subagent）
```

### Visual Type

`Summary + Decision Cards + Teaser`

## 全片视觉类型／组件／动画标准

### 视觉类型

- `Terminal Simulation`：错误排坑、命令拆解、实战命令。
- `Connection Diagram`：MCP hub、transport 和工具注册。
- `Comparison`：三种 transport、三种 scope 和信任梯度。
- `Approval Gate`：项目 server 与工具调用的两道批准。
- `Task Execution`：add、list、approve、remove 的连续状态。
- `Summary + Teaser`：结尾选择映射和下一集预告。

### 组件

- 深色 Terminal Window、Status Badge、Command Segment、MCP Hub、Service Node。
- Scope Ring、Config File Chip、Tool Registry、Approval Gate、Trust Ladder。
- Step Rail、Result Panel、Summary Card、Teaser Card、幕内字幕胶囊。

### 动画

- 一级信息动画：参数移动、连接线、范围扩散、状态切换、批准闸打开、列表移除。
- 二级注意力动画：高亮 `--`、Connected、readonly 和 server 名称。
- 三级装饰动画：仅使用轻微光晕和面板淡入，不使用无意义粒子和复杂转场。

### 输出边界

- 视觉原型包含上一幕／下一幕、自动播放和进度提示，仅服务于原型检查。
- 这些预览控件、调试状态和制作说明不得进入未来正式 Composition 或 MP4。
- 本阶段不生成 TTS、音频、字幕、Timeline，也不修改 `src/videos/`。

## Gate 2 内部审查结论

- 10 个 Scene 的口播均只保留实际朗读内容，没有加入“本段作用”、视觉说明、制作备注或 Gate 清单。
- 口播来自 Scene Script，声音承担解释、因果、转折和结论；画面承担命令拆解、连接、状态和批准演示。
- 所有画面文字均可追溯到 source、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；没有复用其他视频的业务语义或状态文字。
- 三种 transport、三种 scope、四类状态、两道批准闸、第三方信任和四步实战均有对应视觉事件。
- 原型最后一幕包含 source 已给出的下一篇 23“子代理（Subagent）”预告，且与字幕区域分离。
- 不执行文章中的命令，不生成 TTS、音频、字幕、Timeline，不进入 Remotion。

**Gate 2 结论：通过，可停止在 Visual Prototype 阶段。**

## 下一步

本任务到 Visual Prototype 检查完成即停止。后续如进入下一阶段，必须先获得对静态视觉原型的人工确认，再按项目流程处理 TTS 或 Remotion；本次不执行。
