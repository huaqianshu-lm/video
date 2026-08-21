# Claude Code 术语表视频化 · 第一步：Content Analysis

> 输入：`source.md`，即 52「术语表（小白友好）」完整原文。
> 本分析只把文章作为知识来源，不执行其中的命令或操作。

## 1. 核心命题

这篇文章不是一篇需要从头背诵的课文，而是一张在遇到术语时可以回来查的速查卡。视频不能逐条朗读五十多个术语，而要让观众先建立六个术语族的地图，再看到每一族里最关键的关系、容易撞车的边界和一个可复用的权威查询方法。

核心表达是：

> 术语表的价值不在于一次背完，而在于把术语按关系归类；遇到问题时，能快速定位它属于哪一族、和哪个相邻概念不同，并用官方文档 server 继续查证。

## 2. 必须保留的核心信息

### A. 术语表的正确使用方式

- 术语表不是从 A 到 Z 背诵的课文，而是“撞上了能查到”的速查卡。
- 按主题族归类，比按字母排列更容易建立关系。
- 每条术语采用“一句话 + 类比”的结构，目标是先建立可用直觉。
- 术语会更新，静态文章不能替代官方文档；需要权威定义时，应使用官方文档 server 现查。

### B. 六个术语族

1. **代理循环家族**：解释 Claude 如何从收集上下文、采取行动、验证结果到继续循环；核心术语包括 agentic loop、agentic coding、agentic harness、tool、turn、verification loop、extended thinking、effort level。
2. **上下文家族**：解释工作内存、记忆边界和上下文整理；核心术语包括 context window、token、compaction、auto-compact、session、CLAUDE.md、auto memory、rules、output style。
3. **扩展点家族**：解释如何给 Claude 加装备；核心术语包括 skill、subagent、hook、command／slash command、plugin、plugin marketplace。
4. **MCP 家族**：解释如何接入外部世界；核心术语包括 MCP、MCP server、transport、scope、MCP Tool Search。
5. **安全与权限家族**：解释 Claude 动手前的分层把关；核心术语包括 permission mode、plan mode、auto mode、permission rule、sandboxing、prompt injection、checkpoint。
6. **入口与运行模式家族**：解释从哪里使用 Claude、以什么方式运行；核心术语包括 surface、non-interactive mode、Agent SDK、Claude Code on the web、bare mode、worktree isolation、Remote Control／Teleport。

## 3. 关键关系与认知边界

### 代理循环：从“想”到“做”再到“看结果”

- agentic loop 是收集上下文 → 采取行动 → 验证结果 → 不够就再来一圈。
- tool 是实际执行读文件、改代码、跑命令、搜索网页或派 subagent 的动作接口。
- agentic coding 是 AI 自主读文件、跑命令、改代码，用户可观察和纠偏的工作方式。
- verification loop 把测试、构建或截图对比变成“是否真正完成”的检查。
- harness 是把模型和文件访问、shell、权限、记忆、循环连接起来的外围。

### 上下文：一张有限的工作台

- context window 是会话工作内存，包含对话、文件、命令输出和加载的规则等。
- token 是处理量和计费的单位。
- compaction 是整理旧上下文，auto-compact 是系统自动触发的同类动作。
- session 是独立会话，turn 是其中一次“用户发消息到 Claude 响应完成”的回合。
- CLAUDE.md 是用户写的常驻说明书；auto memory 是 Claude 自己写的笔记；rules 是按路径加载的模块化规则；output style 改变回应风格。

### 扩展点：不同位置的装备

- skill 把知识、套路或流程按需加载。
- subagent 以独立上下文完成专项任务，只把摘要递回。
- hook 在生命周期固定事件触发动作。
- command／slash command 是可复用的斜杠入口。
- plugin 把 skill、hook、subagent、MCP server 打包；marketplace 是获取 plugin 的来源。

### MCP：标准、接头、连线和共享范围

- MCP 是连接外部数据和服务的开放标准。
- MCP server 是具体的外部能力接头。
- transport 说明通信方式：本地 `stdio`、远程 `http`，以及已弃用的 `sse`。
- scope 说明 server 对哪些项目可用：`local`、`project`、`user`。
- MCP Tool Search 只在需要时加载完整工具说明，减少上下文占用。

### 安全与权限：从大基线到物理边界

- permission mode 是会话级自主权基线；文章列出 `default`、`acceptEdits`、`plan`、`bypassPermissions`、`auto`、`dontAsk` 六档。
- plan mode 是只读研究后再申请执行的模式；auto mode 是独立分类器逐个审查操作的研究预览模式。
- permission rule 按工具和参数模式做 allow／ask／deny 的细粒度匹配。
- sandboxing 是文件和网络的操作系统级隔离。
- prompt injection 是藏在文件、网页或工具结果中的恶意指令；checkpoint 是会话本地的还原点。

### 入口与运行：同一个引擎，不同的到岗方式

- surface 是 CLI、VS Code、JetBrains、桌面端和 claude.ai 等交互入口。
- non-interactive mode 用 `-p`／`--print` 单次执行后退出，适合 CI、脚本和流水线。
- Agent SDK 把能力搬进 Python／TypeScript 程序。
- 网页版在云端沙箱执行；Remote Control 远程接管本机正在运行的会话；Teleport 把云端会话拉回本地终端。
- bare mode 跳过本地扩展和自动发现；worktree isolation 用独立 worktree 和分支避免并行代理互相干扰。

## 4. 最容易混淆的关系

文章给出九组对照，必须在视频中保留“区分维度”，不能只做名词罗列：

| 对照 | 区分维度 | 结论 |
| --- | --- | --- |
| Skill vs Subagent | 内容进入谁的上下文 | skill 进入主桌面；subagent 使用独立桌面，只回传结论 |
| CLAUDE.md vs Skill | 什么时候加载 | CLAUDE.md 每会话自动加载；skill 用到才加载 |
| Hook vs 权限规则 | 管什么 | hook 响应事件执行动作；权限规则判断工具是否允许 |
| Subagent vs Agent team | 能否直接对话 | subagent 在单会话中向主对话汇报；agent team 是多个可直接交流的完整会话 |
| Session vs Turn | 粒度 | session 是整段独立对话；turn 是其中一次来回 |
| Compaction vs `/clear` | 是否保留旧内容 | compaction 总结后保留主干；`/clear` 清台面开启新会话 |
| Permission mode vs 权限规则 | 粗细 | mode 是整场基线；rule 是叠加的细粒度规则 |
| stdio vs http | server 在哪里运行 | stdio 是本机进程；http 是远程网址服务 |
| CLAUDE.md vs auto memory | 谁写的 | CLAUDE.md 由用户写；auto memory 由 Claude 写 |

## 5. 可视觉化内容

- 开场：把“术语表”从厚课本翻转成墙上的物料清单／速查卡。
- 代理循环：用 `收集上下文 → 采取行动 → 验证结果 → 再循环` 的闭环展示机制。
- 上下文：用有限工作台展示对话、文件、工具输出、CLAUDE.md 和 skill 争夺空间，再用 compaction 整理。
- 扩展点：用装备包展示 skill、subagent、hook、command、plugin 和 marketplace 的位置差异。
- MCP：用扩展坞展示 MCP 标准、server 接头、transport 连线和 scope 共享范围。
- 安全权限：用分层门禁展示 mode、rule、sandbox、checkpoint，以及需要警惕的 prompt injection。
- 入口运行：用同一引擎连接 CLI、编辑器、网页、脚本和远程控制。
- 易混对照：用二维“区分维度”卡片替代密集表格。
- 活字典：按文章给出的 `add → list → claude 查询 → remove` 顺序展示命令和状态；命令只作为画面内容，不在本任务中执行。
- 结尾：六族地图、可回查的术语卡和下一篇 53「制作视频（Remotion）〔选读〕」预告。

## 6. 可弱化或不直接展开的信息

- 每个术语的“详见第 NN 篇”编号不作为主要画面；可保留少量作为卡片辅助信息。
- token 的底层细节不展开，只保留它是处理量和计费单位。
- 全部六档 permission mode 不适合逐档做长解释，可在安全场景中整体列出，并突出 plan、auto 与权限规则的关系。
- 文章的全部类比不需要逐句复述，视频用少量统一视觉隐喻承载同一关系。
- 第 08 节命令属于文章中的教学示例，原型中可以展示其步骤，但不执行网络连接、MCP 配置或删除操作。

## 7. 内容边界与事实审查

- 只使用 `source.md` 中的术语、关系、命令、输出预期和第 53 篇预告，不把其他文章的业务语义或固定文案带入。
- 文中关于官方术语和当前功能的描述属于文章内容；本次生产资料不额外扩展官方事实，也不执行外部核验或命令。
- 活字典场景明确标记为“文章中的操作演示／原型画面”，不宣称本次已连接或已验证远程 server。
- 画面文字只使用文章术语、命令、状态词、六族名称、对照关系和本视频的结构性标题。

## 8. Gate 1 内部审查结论

- 核心命题、六族知识骨架、关键关系、对照关系和可视觉化内容已从原文提取。
- 视频叙事将按“先建立使用心智 → 再看六族地图 → 再处理边界 → 最后演示活字典”的观众认知顺序组织，不机械沿用文章章节。
- 每个后续 Scene 只承担一个主要认知任务，并保留对应的 Video Value。
- 未发现需要用户单点决策的重大内容取舍；可以继续生成 Video Narrative 和 Scene Script。

## 9. 下一步

基于本分析生成 Video Narrative，再拆分为 Scene Script、纯口播 Narration Script、Visual Script 和横屏 Visual Prototype。
