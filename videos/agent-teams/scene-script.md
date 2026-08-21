# Agent teams 智能体团队：多会话协作 · Scene Script

## Scene 01｜三个 Claude 同时跑，为什么还不乱？

- **sceneId**：`agent-teams-01`
- **title**：三个 Claude 同时跑，为什么还不乱？
- **purpose**：提出多会话协作的直觉冲突，并定位单会话的两种天花板。
- **narrativeRole**：问题钩子／需求建立。
- **narrationIntent**：解释上下文有限和只能串行，说明 Agent teams 要把用户从工人变成工头。
- **visualIntent**：让前端、后端、测试三个窗口并行工作，再把单会话的两堵墙推到画面中央。
- **visualType**：并行窗口／问题钩子。
- **keyOnScreenText**：`前端`、`后端`、`测试`、`上下文有限`、`只能串行`
- **videoValue**：多个窗口的同时变化和单会话的阻塞状态必须通过时间与空间呈现，才能直观看到问题来源。

## Scene 02｜Team 不是放大版 subagent

- **sceneId**：`agent-teams-02`
- **title**：Team 不是放大版 subagent
- **purpose**：建立 Agent teams 与 subagent 的最小可用区别。
- **narrativeRole**：对比澄清。
- **narrationIntent**：说明 subagent 只向主对话回传结果，而 team 队友能直接通信，用户也能绕过 leader 管理队友；同时提示 team 成本更高。
- **visualIntent**：左侧显示主对话与 subagent 的单向回传，右侧显示 leader、队友和互通消息的网络。
- **visualType**：双路径对比／通信关系图。
- **keyOnScreenText**：`Subagent`、`只回传结果`、`Agent teams`、`队友直接通信`、`用户可直接管理`
- **videoValue**：单向箭头与互通网络是关系差异，画面比连续定义更容易让观众记住选择分水岭。

## Scene 03｜四个零件，组成一个团队

- **sceneId**：`agent-teams-03`
- **title**：四个零件，组成一个团队
- **purpose**：建立 leader、teammates、task list、mailbox 的团队结构。
- **narrativeRole**：概念建立。
- **narrationIntent**：解释四个关键件各自负责什么，并指出 leader 创建后不能更换、队友拥有独立上下文。
- **visualIntent**：中心 leader 连接三个队友，下方放任务板，横向消息线连接 mailbox。
- **visualType**：系统结构图／关系网络。
- **keyOnScreenText**：`Team lead`、`Teammates`、`Task list`、`Mailbox`、`leader 不可更换`
- **videoValue**：四件套的所有权和连接关系是抽象架构，网络动画能把“团队”从名词变成结构。

## Scene 04｜任务板和信箱，让并行不撞车

- **sceneId**：`agent-teams-04`
- **title**：任务板和信箱，让并行不撞车
- **purpose**：展示共享任务、依赖、文件锁和消息如何协调队友。
- **narrativeRole**：机制展开／风险回应。
- **narrationIntent**：说明队友可以被指派或自我认领，任务有待处理、进行中、已完成状态；依赖完成会解锁，文件锁避免重复认领，mailbox 负责互发消息。
- **visualIntent**：任务卡从待处理进入进行中，依赖锁解除后第二张卡解锁；另一侧消息气泡在队友之间流动。
- **visualType**：任务流／状态变化。
- **keyOnScreenText**：`待处理`、`进行中`、`已完成`、`依赖未完成`、`自动解锁`、`文件锁`
- **videoValue**：认领、等待、解锁和通信都是时序过程，动画能证明并行并不等于无序。

## Scene 05｜用 agent view 看全场

- **sceneId**：`agent-teams-05`
- **title**：用 `claude agents` 看全场
- **purpose**：解决多会话运行时的观察和介入问题。
- **narrativeRole**：控制面建立。
- **narrationIntent**：介绍 agent view 的状态行、Peek、回复和 Attach，并说明后台会话由 supervisor 托管。
- **visualIntent**：总控屏依次显示工作中、需要输入、已完成、失败四种状态；Space 打开 Peek，Enter 进入会话。
- **visualType**：总控面板／状态监控。
- **keyOnScreenText**：`claude agents`、`工作中`、`需要输入`、`已完成`、`失败`、`Space：Peek`、`Enter：Attach`
- **videoValue**：状态与操作随时间变化，能把“多个后台会话可管理”变成可观察的总控体验。

## Scene 06｜leader 怎么分活、切人和收摊

- **sceneId**：`agent-teams-06`
- **title**：leader 怎么分活、切人和收摊
- **purpose**：给出 leader 在团队内部的核心控制动作和清理边界。
- **narrativeRole**：操作方法／责任边界。
- **narrationIntent**：说明自然语言组队、`Shift+Down` 直聊队友、计划批准和模型指定；强调先停止活跃队友，最后由 leader 清理。
- **visualIntent**：队友轨道高亮切换，计划请求经过批准闸门，最后 leader 触发清理并让资源归零。
- **visualType**：操作轨道／权限闸门。
- **keyOnScreenText**：`Shift+Down`、`计划批准`、`Sonnet`、`先停止队友`、`leader 清理`
- **videoValue**：切换、批准和收摊形成清晰操作链，能避免观众只记住快捷键而不理解职责顺序。

## Scene 07｜并不是任务越多越该组队

- **sceneId**：`agent-teams-07`
- **title**：并不是任务越多越该组队
- **purpose**：建立使用 Agent teams 的收益／成本判断。
- **narrativeRole**：反共识转折／决策框架。
- **narrationIntent**：解释 token 和协调开销，列出适合并行的研究、审查、竞争假设、跨层改动，以及不适合的依赖链、同文件修改和小任务。
- **visualIntent**：将场景分流为“值得拆”和“不要拆”，并用 token、依赖、文件冲突三个警示标记解释原因。
- **visualType**：决策矩阵／风险分流。
- **keyOnScreenText**：`值得拆`、`不要拆`、`研究／审查`、`有先后依赖`、`改同一文件`、`token 成本`
- **videoValue**：同一任务经过不同条件会进入不同分支，分流动画比一张静态建议表更能建立判断直觉。

## Scene 08｜从 3—5 个队友起步

- **sceneId**：`agent-teams-08`
- **title**：从 3—5 个队友起步
- **purpose**：把成本判断落成稳妥的上手策略。
- **narrativeRole**：策略落地。
- **narrationIntent**：建议先做不写代码的研究或审查，再逐步进入并行改代码；团队规模从 3—5 个起步，只有明确有并行收益才扩容。
- **visualIntent**：三张审查卡并行产生结果，旁边出现协调成本计量器，再将 3—5 人区间标为推荐起点。
- **visualType**：研究审查示例／规模标尺。
- **keyOnScreenText**：`安全`、`性能`、`测试覆盖`、`协调成本`、`3—5 个队友`
- **videoValue**：并行审查的无冲突结果和规模标尺能把抽象建议转成可模仿的起步动作。

## Scene 09｜启用、组队、切人、清理

- **sceneId**：`agent-teams-09`
- **title**：启用、组队、切人、清理
- **purpose**：展示从零跑通 Agent teams 的最小实操闭环。
- **narrativeRole**：Terminal Demo／能力验证。
- **narrationIntent**：按顺序说明版本检查、启用环境变量、进入 `team-demo`、用自然语言创建三人团队、切队友补充任务，最后回到 leader 清理。
- **visualIntent**：终端时间线逐步出现设置、目录、`claude`、三角色组队提示、`Shift+Down` 消息和清理完成状态。
- **visualType**：Terminal Demo／操作时间线。
- **keyOnScreenText**：`claude --version`、`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`、`team-demo`、`三人团队`、`Shift+Down`、`清理完成`
- **videoValue**：完整链路按顺序出现，能让观众看到“启用到收摊”而不是只记一条孤立命令。

## Scene 10｜把自己变成工头

- **sceneId**：`agent-teams-10`
- **title**：把自己变成工头
- **purpose**：收束 Agent teams 的工作模型并承接下一篇。
- **narrativeRole**：总结／系列预告。
- **narrationIntent**：回顾突破天花板、选择 team、观察状态、直接沟通和判断拆分的原则；保留第 30 篇“功能怎么选”的预告。
- **visualIntent**：将“问题 → 分工 → 协作 → 验收 → 收摊”收束成路径，最后显示原文明确的下一篇标题。
- **visualType**：总结流程／下一集预告。
- **keyOnScreenText**：`分工`、`协作`、`验收`、`收摊`、`30「功能怎么选：CLAUDE.md vs Skill vs Hook vs MCP vs Subagent」`
- **videoValue**：总结路径和下一集卡片需要停留与顺序，能把一组功能记忆成可复用的工作模型。

## Gate 1 内部检查

- [x] 10 个 Scene 的 `sceneId` 唯一且按叙事顺序排列。
- [x] 每幕均包含 title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText、videoValue。
- [x] Scene 01—09 覆盖源文档的核心机制、操作和取舍；Scene 10 承担总结及下一篇最后视觉事件。
- [x] 屏幕文字均来自当前源文档或其前置内容资料；文章中的命令仅作为示例，不执行。
- [x] 没有引入下一篇文章的业务内容，也没有处理文章目录中的其他文章。

