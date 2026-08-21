# Scene Script：Claude Code 常见问题排查

## Scene 01｜四十分钟，错在一行旧配置

- **sceneId**：`troubleshooting-01`
- **title**：四十分钟，错在一行旧配置
- **purpose**：用 `organization disabled` 的反转案例建立“先找根因”的问题意识。
- **narrativeRole**：Opening Hook / Reversal
- **narrationIntent**：讲清用户误以为账号被封、反复重装，最后发现旧 `ANTHROPIC_API_KEY` 压过订阅的过程。
- **visualIntent**：让错误提示从“账号问题”转化为“凭证来源问题”，并展示 `unset` 后恢复。
- **visualType**：Opening / State Change
- **keyOnScreenText**：`This organization has been disabled`、`Max`、`ANTHROPIC_API_KEY`、`unset`、`OAuth`
- **videoValue**：只有通过前后状态变化才能直观看出“相同错误，不同根因”的反转。

## Scene 02｜先给症状分诊

- **sceneId**：`troubleshooting-02`
- **title**：先给症状分诊
- **purpose**：建立症状到问题类别的总路由。
- **narrativeRole**：Problem Framing
- **narrationIntent**：解释安装、认证、配置、性能和 API／请求问题不能混着查。
- **visualIntent**：将代表性错误标签流向不同诊断入口，显示分类决定后续动作。
- **visualType**：Decision Diagram / Routing Board
- **keyOnScreenText**：`command not found`、`403`、`hooks`、`MCP`、`529`、`context full`、`INSTALL`、`AUTH`、`CONFIG`、`PERF`、`API`
- **videoValue**：动态分流能把抽象的“先分类”变成可复用的视觉动作。

## Scene 03｜先敲自助入口

- **sceneId**：`troubleshooting-03`
- **title**：先敲 `/doctor`，解决不了再上报
- **purpose**：明确 `/doctor`、`claude doctor` 和 `/feedback` 的使用时机。
- **narrativeRole**：Orientation / Tool Introduction
- **narrationIntent**：说明能启动时用 `/doctor`，不能启动时用 `claude doctor`，查完仍无法解决再用 `/feedback`。
- **visualIntent**：让体检面板先出现，再把未解决问题转到上报入口。
- **visualType**：Step List / Diagnostic Panel
- **keyOnScreenText**：`/doctor`、`claude doctor`、`/feedback`、`install`、`settings`、`MCP`、`context`
- **videoValue**：顺序动画能表现“先诊断，后上报”的决策关系。

## Scene 04｜认证先看当前凭证

- **sceneId**：`troubleshooting-04`
- **title**：`/status` 先告诉你谁在登录
- **purpose**：解决反复登录、组织禁用和 API key 误用的第一判断。
- **narrativeRole**：Case Resolution
- **narrationIntent**：说明 `/status` 用于确认 OAuth 订阅还是 API key，并解释残留环境变量的优先级。
- **visualIntent**：展示 OAuth 与 API key 的分叉，API key 分支被标出为旧配置，再以 `unset` 回到订阅。
- **visualType**：Comparison / Credential Flow
- **keyOnScreenText**：`/status`、`OAuth subscription`、`API key`、`ANTHROPIC_API_KEY`、`unset`
- **videoValue**：凭证分流和回退路径需要状态变化，静态说明难以突出优先级。

## Scene 05｜配置没生效，查实际加载了什么

- **sceneId**：`troubleshooting-05`
- **title**：别猜配置，查实际加载
- **purpose**：把配置排查从“反复改文件”转为“读取当前状态”。
- **narrativeRole**：Method Expansion
- **narrationIntent**：说明 `/context`、`/memory`、`/hooks`、`/mcp`、`/permissions` 和 `/status` 分别帮助查看什么。
- **visualIntent**：让命令逐一连接到 Context、Memory、Hooks、MCP 和 Permissions 面板。
- **visualType**：Process / Diagnostic Board
- **keyOnScreenText**：`/context`、`/memory`、`/hooks`、`/mcp`、`/permissions`、`loaded`
- **videoValue**：多命令到多状态面板的映射，适合用动画建立“命令—证据”关系。

## Scene 06｜软请求拦不住硬操作

- **sceneId**：`troubleshooting-06`
- **title**：CLAUDE.md 是请求，不是硬保证
- **purpose**：解释权限相关问题的软硬边界和字面匹配陷阱。
- **narrativeRole**：Boundary Clarification
- **narrationIntent**：说明强制约束应使用 `deny` 或 `PreToolUse` hook，并提醒 `Bash(rm *)` 不会自动覆盖所有等效写法。
- **visualIntent**：对比自然语言请求、deny 规则和 hook 闸门，再展示大小写和字面命令变体。
- **visualType**：Comparison / Security Boundary
- **keyOnScreenText**：`CLAUDE.md`、`request`、`deny`、`PreToolUse`、`Bash(rm *)`、`/bin/rm`、`find . -delete`
- **videoValue**：让规则像闸门一样拦截不同命令变体，能直观看到“写了规则但没匹配”的原因。

## Scene 07｜卡顿先清上下文

- **sceneId**：`troubleshooting-07`
- **title**：先收拾工作台
- **purpose**：给出卡顿、高内存、自动压缩抖动和搜索失灵的第一处理方向。
- **narrativeRole**：Operational Triage
- **narrationIntent**：说明 `/compact`、重启、`claude --resume`、分块读取和系统 `ripgrep` 的适用场景。
- **visualIntent**：表现 Context 接近上限后通过压缩、重启和分块输入恢复；旁路显示 ripgrep 环境检查。
- **visualType**：State Change / Terminal
- **keyOnScreenText**：`Context full`、`/compact`、`claude --resume`、`chunked read`、`ripgrep`、`/terminal-setup`
- **videoValue**：容量条和恢复前后状态能解释性能问题的因果，比单列建议更易理解。

## Scene 08｜API 红字先分锅

- **sceneId**：`troubleshooting-08`
- **title**：服务器、额度，还是你的请求
- **purpose**：建立 API 报错的三分法，并补上网络连接分支。
- **narrativeRole**：Decision Framework
- **narrationIntent**：解释 5xx／529、limit、too long／too large 和 Unable to connect 各自应等待、查额度、精简输入或查网络。
- **visualIntent**：把错误标签分到 Server、Quota、Request 和 Network 四个处理区。
- **visualType**：Comparison / Decision Diagram
- **keyOnScreenText**：`API Error: 500`、`529 Overloaded`、`hit your limit`、`Prompt is too long`、`Unable to connect`、`status.claude.com`
- **videoValue**：错误分类的分叉及不同终点是视频最有价值的部分，避免观众把所有红字当成本机故障。

## Scene 09｜怪问题用两个杀手锏

- **sceneId**：`troubleshooting-09`
- **title**：实时日志加干净配置对照
- **purpose**：把难定位的问题转成可观察、可二分的实验。
- **narrativeRole**：Advanced Technique
- **narrationIntent**：说明 `claude --debug`、`--debug mcp`、`--debug hooks` 观察内部过程，再用 `CLAUDE_CONFIG_DIR` 指向空目录判断配置是否是根因。
- **visualIntent**：左侧展示 debug 日志命中 matcher，右侧对比日常配置和 clean config，并逐项加回变量。
- **visualType**：Comparison / Debug Flow
- **keyOnScreenText**：`claude --debug`、`--debug mcp`、`--debug hooks`、`CLAUDE_CONFIG_DIR`、`clean config`、`add one variable`
- **videoValue**：实时日志和二分对照必须通过过程和状态变化呈现，才能体现“缩小变量”的方法。

## Scene 10｜走完一条完整体检链

- **sceneId**：`troubleshooting-10`
- **title**：从版本到干净会话
- **purpose**：把前面的零散工具组合成一次可执行的安装体检。
- **narrativeRole**：Guided Practice
- **narrationIntent**：依次说明 `claude --version`、启动 Claude、`/doctor`、`/status` 和可选 clean session 的预期结果。
- **visualIntent**：让四步检查依次亮起，并在每一步显示“看什么证据”。
- **visualType**：Step List / Terminal
- **keyOnScreenText**：`claude --version`、`/doctor`、`/status`、`CLAUDE_CONFIG_DIR=/tmp/claude-clean`、`version`、`healthy`
- **videoValue**：顺序执行和结果反馈能把框架转成观众可以复用的动作记忆。

## Scene 11｜把方法装进肌肉记忆

- **sceneId**：`troubleshooting-11`
- **title**：先分诊，再查证据
- **purpose**：将全文归纳为问题类型、首个动作和关键判断点。
- **narrativeRole**：Summary
- **narrationIntent**：重申先分类、`/doctor` 指方向、`/status` 看凭证、按根因处理、用 debug 和 clean config 缩小范围。
- **visualIntent**：将安装、认证、配置、性能、API 五类与对应动作配对，形成一张可截图的速查板。
- **visualType**：Summary / Diagnostic Map
- **keyOnScreenText**：`分诊`、`查状态`、`按根因处理`、`留证据`、`/doctor`、`/status`、`--debug`
- **videoValue**：多类问题和动作的映射需要空间和收束动画，适合作为视频结论。

## Scene 12｜下一篇：术语表

- **sceneId**：`troubleshooting-12`
- **title**：下一篇：52 · 术语表（小白友好）
- **purpose**：承接 Source 结尾的系列导航，并让观众知道下一篇解决什么认知问题。
- **narrativeRole**：Series Teaser / Closing
- **narrationIntent**：说明下一篇会把 CLAUDE.md、上下文窗口、MCP、Subagent、Hook、检查点和 auto-compact 讲成小白能查懂的术语表。
- **visualIntent**：在总结卡收起后单独升起第 52 篇预告卡，避开字幕区域并停留 2～3 秒。
- **visualType**：Summary / Teaser Card
- **keyOnScreenText**：`下一篇`、`52 · 术语表`、`CLAUDE.md`、`Context`、`MCP`、`Subagent`、`Hook`
- **videoValue**：预告是系列节奏的最后视觉事件，需要独立入场和停留，不能只藏在口播里。

## Gate 1 内部检查

- 12 个 Scene 均包含 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText 和 videoValue。
- 每幕只有一个主要认知任务，Scene 之间无重复承担同一结论。
- Scene 01 的案例、Scene 04 的凭证、Scene 08 的报错分类和 Scene 10 的体检链均能追溯到 Source。
- Scene 12 是最后视觉事件，预告文案有 Source 结尾依据。

**Gate 1：通过。**
