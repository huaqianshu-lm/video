# 功能怎么选：CLAUDE.md vs Skill vs Hook vs MCP vs Subagent · Scene Script

## Scene 01｜名词都懂，需求一来就卡

- **sceneId**：`choosing-features-01`
- **title**：名词都懂，需求一来就卡
- **purpose**：建立“知道是什么却不会选”的真实问题。
- **narrativeRole**：问题钩子／需求建立。
- **narrationIntent**：解释多个扩展点单看都懂，但缺少从需求到方案的映射。
- **visualIntent**：六个名词卡片堆在桌面上，用户需求光标出现后卡片互相弹跳，最后聚焦“需求 → 方案”。
- **visualType**：问题钩子／需求映射。
- **keyOnScreenText**：`CLAUDE.md`、`Skill`、`Hook`、`MCP`、`Subagent`、`slash command`、`需求 → 方案`
- **videoValue**：卡片从“名词堆”变成“映射路径”的过程能直观看见困惑来源和本片目标。

## Scene 02｜六个挂钩，插在代理循环不同位置

- **sceneId**：`choosing-features-02`
- **title**：六个挂钩，插在代理循环不同位置
- **purpose**：建立六个扩展点不是平行选项，而是位于“想 → 做 → 看”不同环节的总框架。
- **narrativeRole**：框架建立。
- **narrationIntent**：解释六个扩展点如何分别进入代理循环，并引出“按需求分诊”。
- **visualIntent**：三段代理循环轨道依次亮起，六个挂钩落到背景、外部连接、分身、事件触发和主动流程的位置。
- **visualType**：系统流程图／挂钩关系图。
- **keyOnScreenText**：`想`、`做`、`看`、`扩展插入代理循环的不同部分`
- **videoValue**：位置关系和触发时机需要动态连接才能建立直觉，不适合只展示六个定义。

## Scene 03｜六个科室，各治什么

- **sceneId**：`choosing-features-03`
- **title**：六个科室，各治什么
- **purpose**：给六个扩展点建立最小、可记忆的一句话定位。
- **narrativeRole**：概念定位。
- **narrationIntent**：依次说明常驻规矩、按需能力、主动流程、外部接口、隔离分身和事件动作的主治范围。
- **visualIntent**：六张科室卡片依次翻开，显示主治、触发者和常驻上下文占用。
- **visualType**：定位卡片／信息对照。
- **keyOnScreenText**：`每次都记住`、`需要时调出`、`主动一键触发`、`接到外部世界`、`独立分身`、`自动扣扳机`
- **videoValue**：卡片的触发者和上下文列需要同步对照，观众才能形成选型分水岭。

## Scene 04｜需求表：先找最像你的一句话

- **sceneId**：`choosing-features-04`
- **title**：需求表：先找最像你的一句话
- **purpose**：把抽象定位转成可查阅的需求到方案映射。
- **narrativeRole**：工具落地。
- **narrationIntent**：说明表格的使用方法，并展示常驻规矩、外部连接、隔离工作和事件动作等代表需求。
- **visualIntent**：一张简化决策表逐行出现，当前需求行高亮，右侧方案标签被点亮。
- **visualType**：决策表／行高亮。
- **keyOnScreenText**：`一律按项目约定来`、`查公司数据库`、`读几十个文件只要结论`、`自动跑 ESLint`、`推荐方案`
- **videoValue**：行被选中并映射到方案的动作，能让观众看到“查表”而不是背表。

## Scene 05｜四个问题，走完一棵决策树

- **sceneId**：`choosing-features-05`
- **title**：四个问题，走完一棵决策树
- **purpose**：将决策表压缩成可重复使用的判断顺序。
- **narrativeRole**：方法建立。
- **narrationIntent**：依次解释“连外部？要硬保证？要隔离？每次看还是按需看？”，并落到 MCP、Hook／权限规则、Subagent、CLAUDE.md／Skill。
- **visualIntent**：四个问题依次显示，路径分叉后留下对应方案节点。
- **visualType**：决策树／路径动画。
- **keyOnScreenText**：`连外部？`、`要硬保证？`、`要隔离？`、`每次看还是按需看？`
- **videoValue**：分叉和收敛是选择逻辑的核心，动态路径比静态答案列表更能复用。

## Scene 06｜Skill 和 Subagent：手册还是外派

- **sceneId**：`choosing-features-06`
- **title**：Skill 和 Subagent：手册还是外派
- **purpose**：解决最容易混淆的上下文边界。
- **narrativeRole**：对比澄清。
- **narrationIntent**：说明 Skill 的内容进入主窗口，而 Subagent 在独立窗口工作，只把结果带回。
- **visualIntent**：左侧手册被放进主工作台，右侧外派窗口完成扫描后只回传一张结论卡。
- **visualType**：双窗口对比／上下文流。
- **keyOnScreenText**：`Skill`、`内容进主窗口`、`Subagent`、`过程隔离`、`只回传结论`
- **videoValue**：内容流向和窗口边界是抽象差异，必须用空间和移动表达。

## Scene 07｜CLAUDE.md 和 Skill：每次看还是按需看

- **sceneId**：`choosing-features-07`
- **title**：CLAUDE.md 和 Skill：每次看还是按需看
- **purpose**：说明常驻规矩和按需参考资料的加载差异。
- **narrativeRole**：边界澄清。
- **narrationIntent**：解释 CLAUDE.md 每次会话自动加载，Skill 平时只保留描述，用到时才加载；长资料不应全塞进 CLAUDE.md。
- **visualIntent**：会话启动时 CLAUDE.md 固定进入背景，Skill 在需求出现时才从侧栏展开。
- **visualType**：时间线／加载对比。
- **keyOnScreenText**：`每个会话`、`自动加载`、`按需加载`、`保持 CLAUDE.md 在 200 行以下`
- **videoValue**：加载时机的差异只有在时间线上呈现，才能理解上下文成本。

## Scene 08｜Hook 和权限规则：硬护栏怎么分工

- **sceneId**：`choosing-features-08`
- **title**：Hook 和权限规则：硬护栏怎么分工
- **purpose**：澄清“保证级别”的规则该如何选择。
- **narrativeRole**：风险边界。
- **narrationIntent**：说明文字提醒不是保证，权限规则适合纯准入判断，Hook 适合拦截后还要记录、通知或改写。
- **visualIntent**：同一危险操作先被权限门拦截，再展示 Hook 在拦截旁触发日志和通知的分支。
- **visualType**：护栏对比／事件分支。
- **keyOnScreenText**：`请求`、`保证`、`准不准`、`拦截 + 附带动作`、`deny`
- **videoValue**：拦截和附带动作的差异需要在事件发生时显示，才能避免把两者混成同义词。

## Scene 09｜组合才是常态，Plugin 负责装箱

- **sceneId**：`choosing-features-09`
- **title**：组合才是常态，Plugin 负责装箱
- **purpose**：把“选一个工具”的思路升级为按职责组合，并解释 Plugin 的分发层角色。
- **narrativeRole**：扩展与转折。
- **narrationIntent**：说明 MCP、Skill、Subagent、CLAUDE.md 和 Hook 可以各司其职，Plugin 将能力打包带走。
- **visualIntent**：四组组合连线汇入一个 Plugin 行李箱，箱子标签显示可安装单元。
- **visualType**：组合关系图／装箱动画。
- **keyOnScreenText**：`Skill + MCP`、`Skill + Subagent`、`CLAUDE.md + Skill`、`Hook + MCP`、`Plugin`
- **videoValue**：连接、汇聚和装箱能表达“组合”和“分发”这两个静态表格难以建立的关系。

## Scene 10｜A—G 需求清单，现场分诊

- **sceneId**：`choosing-features-10`
- **title**：A—G 需求清单，现场分诊
- **purpose**：用源文中的练习验证四问模型可以直接落地。
- **narrativeRole**：实战验证。
- **narrationIntent**：快速复盘 A 到 G 的需求和方案，并点出常见混淆：CLAUDE.md 与 Skill、Hook 与权限规则、Skill 与 Subagent。
- **visualIntent**：需求卡逐张进入四问入口，落到对应方案列并保留判断理由。
- **visualType**：练习清单／映射流程。
- **keyOnScreenText**：`A`—`G`、`CLAUDE.md`、`MCP`、`slash command`、`Hook`、`Subagent`、`Skill`、`权限规则`
- **videoValue**：逐项落位是方法是否可用的过程证据，能把前面的抽象模型转成行动记忆。

## Scene 11｜四问锁定方案，下一篇见

- **sceneId**：`choosing-features-11`
- **title**：四问锁定方案，下一篇见
- **purpose**：收束选择口诀，并保留当前系列源文中的下一篇预告。
- **narrativeRole**：总结／下一集预告。
- **narrationIntent**：回顾六个落点和四个问题，强调 Plugin 是打包层，最后念出第 31 篇预告。
- **visualIntent**：四问路径汇聚成“需求 → 方案”，随后最后一个视觉事件展示源文中的下一篇标题卡。
- **visualType**：总结路径／预告卡片。
- **keyOnScreenText**：`连外部？→ 要硬保证？→ 要隔离？→ 每次看还是按需看？`、`31「settings.json：用户级 / 项目级配置」`
- **videoValue**：汇聚路径和最后预告需要时间停留，才能让观众记住判断框架并读完下一篇信息。

## Gate 1 内部检查

- [x] Scene 01—11 的 `sceneId` 唯一，叙事顺序与 `video-narrative.md` 对齐。
- [x] 每幕均包含 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 所有关键事实、示例和下一篇预告均来自 `source.md`，未带入其他文章语义。
- [x] Scene 10 只复用源文 A—G 练习，未执行其中命令。
- [x] Scene 11 的预告作为最后一个视觉事件规划，并与源文标题一致。

