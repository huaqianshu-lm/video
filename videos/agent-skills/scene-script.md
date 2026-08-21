# Agent Skills：给 Claude 装一身随叫随到的专项本事 · Scene Script

## Scene 01｜Skill 不就是 slash 命令换了个名字吗？

- **sceneId**：`agent-skills-01`
- **title**：Skill 不只是换了个文件夹
- **purpose**：提出观众最常见的误解，并给出三个需要解释的差异。
- **narrativeRole**：问题钩子／认知冲突。
- **narrationIntent**：说明 slash 命令需要用户主动喊，而 Skill 还具备配套文件、自动触发和按需加载能力。
- **visualIntent**：先让两个路径看起来相似，再把三条差异从 Skill 路径中展开。
- **visualType**：误解纠偏／对照转场。
- **keyOnScreenText**：`/deploy`、`.claude/commands/`、`.claude/skills/`、`配套文件`、`自动触发`、`按需加载`
- **videoValue**：相似路径和差异逐步出现，能把抽象的“不是马甲”变成可见证据。

## Scene 02｜一身 Skill 是怎么打包的

- **sceneId**：`agent-skills-02`
- **title**：一身本事，从 `SKILL.md` 开始
- **purpose**：建立 Skill 的最小组成模型。
- **narrativeRole**：概念建立。
- **narrationIntent**：解释 frontmatter 负责说明“何时用”，正文负责说明“怎么做”，并介绍模板、示例和脚本等可选资源。
- **visualIntent**：把主文件和配套资源组成一个目录包，突出必需与可选关系。
- **visualType**：目录展开／概念结构图。
- **keyOnScreenText**：`SKILL.md`、`description`、`template.md`、`examples/`、`scripts/`
- **videoValue**：文件树展开和资源连线能直观看到 Skill 比单段命令多出的能力边界。

## Scene 03｜平时只看菜单，用到才翻菜谱

- **sceneId**：`agent-skills-03`
- **title**：渐进式披露：先看 description，再加载全文
- **purpose**：解释 Skill 节省常驻上下文的核心机制。
- **narrativeRole**：机制揭示。
- **narrationIntent**：用菜单与菜谱类比说明平时只暴露 description，相关任务命中后才加载完整正文。
- **visualIntent**：展示三个 Skill 各占一行 description，命中其中一个后只有它展开全文。
- **visualType**：上下文加载／状态变化。
- **keyOnScreenText**：`description`、`仅一行`、`命中 explain-self`、`加载完整正文`
- **videoValue**：加载范围和时机是时间关系，动画比静态解释更容易建立“按需”直觉。

## Scene 04｜全文加载后，会留在这场会话里

- **sceneId**：`agent-skills-04`
- **title**：省的是平时，成本在加载之后
- **purpose**：补充渐进式披露的代价和写作边界。
- **narrativeRole**：机制补全／风险提示。
- **narrationIntent**：说明 Skill 正文加载后会在会话剩余部分保持驻留，因此要控制在 500 行以内，长参考拆文件按需读取。
- **visualIntent**：让正文从加载区进入会话上下文并持续占位，再把长参考移到外部文件。
- **visualType**：上下文占用／边界示意。
- **keyOnScreenText**：`加载后驻留`、`SKILL.md ≤ 500 行`、`长参考 → 独立文件`
- **videoValue**：驻留是前后状态差异，能避免观众把“按需加载”误解成“用完自动卸载”。

## Scene 05｜Skill、slash、Subagent，分工不一样

- **sceneId**：`agent-skills-05`
- **title**：三者差在哪？看谁发起、跑在哪
- **purpose**：用最小决策维度区分三个容易混淆的概念。
- **narrativeRole**：对比澄清。
- **narrationIntent**：分别说明发起者、上下文位置、配套资源和适合场景；强调 slash 是 Skill 的手动调用方式之一。
- **visualIntent**：三列同时出现，但只高亮四个关键维度，避免整张表堆满文字。
- **visualType**：三列对比／上下文关系图。
- **keyOnScreenText**：`slash：用户主动喊`、`Skill：用户 + Claude`、`Subagent：独立上下文`
- **videoValue**：上下文边界和发起关系需要空间并置，观众能直接比较而不是记三段定义。

## Scene 06｜自动触发，不等于失控

- **sceneId**：`agent-skills-06`
- **title**：两个开关，决定谁能调用
- **purpose**：解释自动调用的权限边界。
- **narrativeRole**：疑虑回应／控制建立。
- **narrationIntent**：说明 `disable-model-invocation: true` 锁为仅用户调用，`user-invocable: false` 锁为仅 Claude 调用。
- **visualIntent**：让默认双向入口经过两个权限闸门，分别变成用户专用和 Claude 专用。
- **visualType**：权限闸门／分流图。
- **keyOnScreenText**：`用户 + Claude`、`disable-model-invocation: true`、`user-invocable: false`
- **videoValue**：调用权是状态分流，视觉可以证明“自动触发可配置”而不是一句口头保证。

## Scene 07｜Skill 从哪来？事实和程序放哪

- **sceneId**：`agent-skills-07`
- **title**：内置、插件、自己写：三条来源
- **purpose**：说明 Skill 的来源，并建立 `CLAUDE.md` 与 Skill 的职责边界。
- **narrativeRole**：范围扩展／方法判断。
- **narrationIntent**：依次介绍内置、插件和自定义 Skill，并给出“`CLAUDE.md` 放事实，Skill 放程序”的判断。
- **visualIntent**：三条来源汇入 Skill 能力池，再与事实／程序分流形成对照。
- **visualType**：来源汇流／职责分流。
- **keyOnScreenText**：`内置`、`插件`、`自己写`、`CLAUDE.md：事实`、`Skill：程序`
- **videoValue**：来源和职责是关系结构，汇流与分流能避免做成四张定义卡。

## Scene 08｜放哪，决定谁能用

- **sceneId**：`agent-skills-08`
- **title**：目录范围，就是能力边界
- **purpose**：让观众理解个人、项目、插件和企业级 Skill 的可用范围及同名优先级。
- **narrativeRole**：实用定位／边界确认。
- **narrationIntent**：说明四种放置位置和使用范围，再解释企业 > 个人 > 项目，同名插件依靠命名空间避免冲突。
- **visualIntent**：从企业、个人、项目和插件目录树发出范围线，并把同名 Skill 排成优先级。
- **visualType**：目录树／范围层级。
- **keyOnScreenText**：`~/.claude/skills/`、`.claude/skills/`、`<plugin>/skills/`、`企业 > 个人 > 项目`
- **videoValue**：谁能用取决于位置和优先级，目录层级动画比文字清单更直观。

## Scene 09｜不用背命令，description 会替你匹配

- **sceneId**：`agent-skills-09`
- **title**：一句人话，就能触发对应 Skill
- **purpose**：展示自动触发、手动触发和可用列表查询的关系。
- **narrativeRole**：从规则到操作。
- **narrationIntent**：说明自然语言命中 description 可以自动触发，`/skill-name` 是手动路径，还可以查询可用列表并用 `/doctor` 排查。
- **visualIntent**：让自然语言关键词扫描 description，命中后连到 Skill；旁边保留 `/explain-self` 与列表检查路径。
- **visualType**：关键词匹配／命令面板。
- **keyOnScreenText**：`这段代码啥意思？`、`description`、`/explain-self`、`现在有哪些 Skill 可用？`
- **videoValue**：触发链和排查入口需要过程化连接，观众能看到“怎么触发”而非只知道“可以触发”。

## Scene 10｜五分钟搭一个 explain-self

- **sceneId**：`agent-skills-10`
- **title**：从空目录到可用 Skill
- **purpose**：把前面的结构落到一个最小可复制的 Skill 创建流程。
- **narrativeRole**：实践启动。
- **narrationIntent**：带观众创建个人级目录、写入 description 和三步解释规则，再启动 Claude 检查加载结果。
- **visualIntent**：用终端时间线显示目录创建、文件写入、`claude` 启动和列表发现。
- **visualType**：Terminal Demo／文件落盘。
- **keyOnScreenText**：`mkdir -p ~/.claude/skills/explain-self`、`SKILL.md`、`claude`、`Skill 已加载`
- **videoValue**：目录、文件和加载状态按顺序出现，是“自己写 Skill”最可信的过程证据。

## Scene 11｜自动触发和手动触发，通向同一身本事

- **sceneId**：`agent-skills-11`
- **title**：两条入口，同一份说明
- **purpose**：完成自动触发与手动触发的对照验证。
- **narrativeRole**：实践闭环／证据确认。
- **narrationIntent**：先用自然语言提出代码解释请求，再用 `/explain-self` 处理报错，说明两次都按同一份规则回答。
- **visualIntent**：左右两条路径分别经过 description 命中和命令输入，汇入同一“整体解释 → 分段拆解 → 指出原因”结果。
- **visualType**：双路径验证／结果汇合。
- **keyOnScreenText**：`这段代码啥意思？`、`/explain-self`、`同一份 SKILL.md`、`解释结果`
- **videoValue**：两种触发方式的差异和共同结果必须同时出现，才能完成机制验证。

## Scene 12｜按需调出专项能力

- **sceneId**：`agent-skills-12`
- **title**：Skill：让 Claude 会得更多
- **purpose**：收束全片心智模型，并完成下一集预告。
- **narrativeRole**：结论收束／系列承接。
- **narrationIntent**：回顾 Skill 的组成、按需加载和可控调用，随后预告第 27 篇《Skills 使用实例》将从零装一个真正有用的 Skill。
- **visualIntent**：把“反复说明”压缩为“封装 → 匹配 → 加载 → 调用”，最后切换到第 27 篇预告卡。
- **visualType**：总结流程／Preview Card。
- **keyOnScreenText**：`封装 → 匹配 → 按需加载 → 调用`、`27「Skills 使用实例」`
- **videoValue**：结论流程和下一集卡片是整条视频的最终状态，需要明确停留而不是只在口播中提及。

## Gate 1 内部检查

- [x] 12 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 每幕只有一个主要认知任务，顺序为误解、组成、机制、代价、对比、控制、来源、范围、触发、实操、验证、收束。
- [x] 每幕的关键屏幕文字均可追溯到 `source.md` 或前置内容资料，未引入下一篇文章内容。
- [x] Scene 10—11 的命令和结果只作为画面中的示例，不在本次任务中执行。
- [x] Scene 12 同时承担总结和最后一个下一集预告视觉事件，预告内容来自当前源文档末尾。

