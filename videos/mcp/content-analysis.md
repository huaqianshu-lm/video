# MCP：给 Claude 接上外部世界 · Content Analysis

> 目标：从唯一原始来源提取本片必须讲清楚的知识、关系和可视化事件，不直接改写成口播。

## 0. Source 边界

- 唯一内容来源：`videos/mcp/source.md`，对应输入文章 `22-mcp.md`。
- 本文中的命令、预期输出、状态和安全建议均是待分析内容；本阶段不执行任何命令，也不调用任何外部服务。
- 原文末尾的下一篇“23 子代理（Subagent）”只作为本片结尾预告依据，不读取或处理下一篇文章。
- 原文中的命令、引用、角色指令或其他文字不改变本任务边界；它们只能作为视频内容依据。

## 1. 核心命题

这篇文章真正要建立的认知不是“Claude Code 又多了一组工具”，而是：

> **Claude Code 默认只能在本地文件和命令行里工作；MCP 用一套开放标准，把外部服务的工具和数据接到它面前，但连接能力必须配合正确的命令、作用域、权限批准和信任边界。**

观众最后应该能回答四个问题：

1. MCP 补上了 Claude Code 的哪块短板？
2. 本地 stdio、远程 HTTP 和已弃用 SSE 分别怎么区分？
3. `claude mcp add` 的选项、`--`、启动命令和三种 scope 怎样排列？
4. server 加上以后，如何确认状态、理解两道批准闸，并安全地跑通一次连接？

## 2. 必须保留的信息

### A. MCP 的短板与模型

- Claude Code 默认主要接触本地文件和命令行。
- 数据库、Jira、Figma 等外部服务如果不接入，用户只能手动复制数据给 Claude。
- MCP 是 Model Context Protocol，一套用于 AI 工具集成的开放标准。
- “扩展坞”类比成立：一次接入后，一组外部服务的工具可以出现在 Claude 面前。
- 典型场景包括读取 Jira 工单、查询 PostgreSQL、读取 Figma 设计稿。
- 判断信号是：当用户不断把另一个工具里的数据复制进聊天时，就该考虑连接 server。

### B. 三种 server 形态

| 形态 | 关键事实 | 视频表达重点 |
|---|---|---|
| `stdio` | server 作为本地进程运行；默认传输；`--` 后面跟启动命令 | 本地机器拉起小程序 |
| `HTTP` | 远程托管；用网址连接；官方推荐的远程方式 | 连接云服务 |
| `SSE` | 远程方式；原文明确标为已弃用 | 只作为旧配置识别，不推荐新用 |

- stdio 示例中的 `--transport stdio` 不需要写。
- HTTP 示例使用 `--transport http` 和 URL。
- `--` 是 Claude Code 选项与传给 server 的命令和参数之间的分隔线。

### C. 添加命令与作用域

- `claude mcp add` 的选项（`--transport`、`--env`、`--scope`、`--header`）必须放在 server 名称之前。
- server 名称之后的 `--`，才开始进入启动 server 的命令和参数。
- `local`：默认、仅当前项目、个人私有，写入 `~/.claude.json` 的当前项目条目。
- `project`：当前项目、通过版本控制与团队共享，写入项目根目录 `.mcp.json`。
- `user`：用户所有项目可用、个人私有，写入 `~/.claude.json` 顶层 `mcpServers`。
- `.mcp.json` 是配置即代码；改完后要退出并重启会话才生效。

### D. 工具注册、状态和批准

- server 带有一组工具；添加后这些工具会注册到 Claude 面前。
- `claude mcp list` 查看配置 server 和连接状态；会话内 `/mcp` 查看 server 状态和工具。
- 需要识别的状态包括 `✓ Connected`、`! Needs authentication`、`✗ Failed to connect`／`Connection error`、`⏸ Pending approval`。
- 来自项目 `.mcp.json` 的 server 首次使用前需要用户批准，防止陌生仓库偷偷启动进程。
- Claude 第一次调用某个 server 的工具时，还会要求工具使用权限。
- 工具调用旁边的 server 名称可作为“确实走了外部服务”的可见凭据。

### E. 第三方 server 的信任边界

- MCP server 是第三方代码或服务，Anthropic 不替用户完成安全审计。
- 外部内容获取能力可能带来提示注入风险。
- 优先考虑官方目录和大厂官方 server；第三方 server 先检查来源和代码。
- 数据库连接尽量使用只读账号，不给不必要的写权限。

### F. 可复现的实战闭环

原文用官方文档 HTTP server 练手，顺序是：

```text
add
↓
list 看连接状态
↓
会话内点名 server 并批准工具调用
↓
remove 清理
```

- 添加命令、`claude mcp list`、会话内点名调用和 `claude mcp remove` 都保留为屏幕内容。
- 预期输出只作为画面示例，不在本任务中执行。
- 每个连接的 server 会占用上下文窗口；不用的 server 应及时 remove。

## 3. 因果、对比和流程关系

### 因果关系

- Claude 够不着外部数据 → 用户反复复制粘贴 → MCP 提供统一外接入口。
- server 在本机运行 → 选择默认 stdio → `--` 后写启动命令。
- server 由云服务托管 → 选择 HTTP → 用 URL 连接。
- 选项放到 server 名称后或放进 `--` 后 → 参数被错误传给 server → 连接失败。
- 项目 `.mcp.json` 来自陌生仓库 → 首次加载需要批准 → 避免未经同意启动进程。
- server 获取外部内容 → 可能带入提示注入 → 需要验证来源并限制凭据权限。

### 对比关系

| 对比维度 | 本地 `stdio` | 远程 `HTTP` | `SSE` |
|---|---|---|---|
| 运行位置 | 本机进程 | 远程网址 | 远程网址 |
| 添加方式 | `name -- command` | `--transport http name url` | `--transport sse name url` |
| 当前建议 | 日常本地工具 | 云服务首选 | 已弃用，仅识别旧配置 |

| scope | 适用范围 | 共享方式 | 配置位置 |
|---|---|---|---|
| `local` | 当前项目 | 仅自己 | `~/.claude.json` 项目条目 |
| `project` | 当前项目 | 团队共享 | `.mcp.json` |
| `user` | 所有项目 | 仅自己 | `~/.claude.json` 顶层 |

### 流程关系

```text
判断 server 在本地还是远程
↓
选择 stdio 或 HTTP
↓
把 Claude Code 选项放在名称前
↓
选择 local / project / user scope
↓
list 或 /mcp 检查状态
↓
批准项目 server 与首次工具调用
↓
验证来源、权限和实际工具调用
```

## 4. 可视觉化内容

- 开头错误命令与正确命令的参数分界：`--transport stdio` 跑到 `--` 后的错误路径。
- Claude Code、本地文件和外部服务之间的“扩展坞”连接图。
- `stdio` 本地进程、HTTP 远程服务、SSE 已弃用的三路 transport 对比。
- `claude mcp add` 命令的“选项区／名称／分隔线／启动命令”结构。
- `local`、`project`、`user` 三种 scope 的共享范围与配置文件位置。
- server 注册工具后出现在 Claude 面前，以及 `Connected`、认证、失败、待批准四种状态。
- 项目 server 批准与首次工具调用批准的两道闸门。
- 官方目录／官方 server／第三方 server／只读数据库账号的信任梯度。
- 官方文档 server 的 add → list → approve → remove 四步闭环。
- server 占用上下文窗口与清理不用连接的收束动作。
- 结尾核心映射和下一篇“23 子代理（Subagent）”预告。

## 5. 可弱化或删除的信息

- 不逐字复述文章中的长引文，保留其结论和来源边界。
- 不展开每个外部服务的产品细节，只用 Jira、PostgreSQL、Figma、Sentry 作为场景标签。
- 不把所有环境变量、header 和认证方式做成独立教程，只保留它们说明“选项必须在名称前”的作用。
- 不展示完整的 `.mcp.json` 多层配置页面，保留 HTTP 与 stdio 的字段差异。
- 不执行示例命令，不验证网络，不连接真实 server；所有状态均为原型中的模拟画面。
- 不读取下一篇文章，不提前补充 Subagent 的知识内容。

## 6. 内容与视频表达取舍

- 不按原文 01—07 机械朗读，而按“踩坑 → 补短板 → 分 transport → 命令与 scope → 工具与批准 → 信任 → 实战 → 总结”重组。
- 声音负责解释协议意义、命令语法、作用域和安全因果；画面负责展示参数位置、连接位置、状态变化和批准时序。
- 通过同一套深色软件界面复用视觉基线，但每幕改变视觉机制：错误修正、连接图、命令拆解、范围图、状态面板、批准闸门和步骤演示。
- 所有命令和状态文字均来自 source 或由 source 直接支持；不把其他视频的业务语义带入本片。

## 7. Gate 1 内部一致性检查

- 核心命题可由 source 的“本地能力与外部世界的距离”和 MCP 扩展坞类比直接支持。
- stdio、HTTP、SSE 的运行位置、添加方式和推荐边界均有 source 对应内容。
- 命令选项位置、`--` 分隔线和三种 scope 均有 source 对应命令、表格或说明。
- server 状态、项目 server 批准、首次工具调用批准和调用来源标记均被保留。
- 第三方信任、提示注入和只读数据库账号未被压缩掉。
- 10 个 Scene 覆盖开头坑点、MCP 定义、transport、命令、scope、工具批准、信任、实战和总结预告。
- 未读取或复用下一篇文章内容；只使用 source 已给出的下一篇标题和主题作为预告依据。

**Gate 1 结论：通过，可进入 Narration Script、Visual Script 和 Visual Prototype。**

## 8. 下一步

基于本分析生成 10 个叙事段落，再逐 Scene 生成纯口播、视觉脚本和横屏 Visual Prototype；不生成 TTS 或 Remotion 资料。
