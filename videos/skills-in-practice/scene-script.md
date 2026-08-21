# Skills 使用实例：装一个、喊一声、看它干活 · Scene Script

## Scene 01｜半天的活，为什么不到五分钟就出图？

- **sceneId**：`skills-in-practice-01`
- **title**：半天的活，为什么不到五分钟就出图？
- **purpose**：用 `baoyu-diagram` 的结果差异建立 Skill 的实际价值和观看问题。
- **narrativeRole**：结果钩子／问题提出。
- **narrationIntent**：解释从手工整理、排版、导出到一句话得到 SVG 和 @2x PNG 的压缩，提出“封装流程”这一核心答案。
- **visualIntent**：左侧堆叠半天的手工步骤，右侧展示一句需求、Skill 加载和两个文件产出。
- **visualType**：Before／After Process。
- **keyOnScreenText**：`半天`、`不到五分钟`、`baoyu-diagram`、`SVG`、`@2x PNG`
- **videoValue**：时间压缩和连续产出状态必须通过过程对照建立直觉，单靠定义无法证明 Skill 的价值。

## Scene 02｜用之前，先查手里有哪些 Skill

- **sceneId**：`skills-in-practice-02`
- **title**：用之前，先查手里有哪些 Skill
- **purpose**：把“确认当前环境”设为使用 Skill 的第一步。
- **narrativeRole**：动作建立／使用前检查。
- **narrationIntent**：说明询问可用列表、打开 `/skills` 和必要时运行 `/doctor` 的目的。
- **visualIntent**：模拟会话从输入“有哪些可用的 skill？”到列表出现，再分出 `/skills` 菜单和 `/doctor` 诊断卡。
- **visualType**：Command Panel／Inventory Check。
- **keyOnScreenText**：`有哪些可用的 skill？`、`/skills`、`/doctor`、`baoyu-diagram`
- **videoValue**：列表出现与诊断入口是可观察的环境证据，能把“别凭印象乱喊”变成实际动作。

## Scene 03｜拆开一个真实 Skill：description 是触发命门

- **sceneId**：`skills-in-practice-03`
- **title**：拆开一个真实 Skill：description 是触发命门
- **purpose**：建立 `SKILL.md`、description、正文和配套资源的结构认知。
- **narrativeRole**：机制解释／因果建立。
- **narrationIntent**：解释目录、frontmatter、description 和 Markdown 正文各自负责什么，并给出“说法 → 匹配 → 加载 → 产出”的链条。
- **visualIntent**：从 `baoyu-diagram/` 目录展开 `SKILL.md`、`references/`、`scripts/`，再用连线表现 description 命中后加载正文。
- **visualType**：Folder Exploration／Trigger Flow。
- **keyOnScreenText**：`SKILL.md`、`description`、`references/`、`scripts/`、`匹配 → 加载 → 产出`
- **videoValue**：目录展开和匹配连线能直接证明 Skill 不是一个孤立的提示词。

## Scene 04｜不记名字，也能用：让 Claude 自己匹配

- **sceneId**：`skills-in-practice-04`
- **title**：不记名字，也能用：让 Claude 自己匹配
- **purpose**：演示自然语言自动触发的完整结果链。
- **narrativeRole**：第一次实践／自动入口。
- **narrationIntent**：说明用户只说“帮我画一张图，说明 Claude 的想→做→看代理循环”，Claude 会根据 description 选择 `baoyu-diagram` 并按其流程产出。
- **visualIntent**：输入自然语言，扫描多个 description，命中 `baoyu-diagram`，随后依次显示参考文档、暗色设计系统、SVG 和 @2x PNG。
- **visualType**：Demo／Process。
- **keyOnScreenText**：`帮我画一张图，说明 Claude 的「想→做→看」代理循环`、`匹配 baoyu-diagram`、`27-agent-loop.svg`、`27-agent-loop@2x.png`
- **videoValue**：从一句请求到文件落盘的状态序列，是自动触发价值最直接的视频证据。

## Scene 05｜不想等它猜？用 `/` 直接点名

- **sceneId**：`skills-in-practice-05`
- **title**：不想等它猜？用 `/` 直接点名
- **purpose**：对比自然语言触发与 `/` 手动触发的入口差异。
- **narrativeRole**：对比澄清／选择策略。
- **narrationIntent**：说明探索时可以让 Claude 自己挑，明确知道 Skill 或涉及副作用时用 `/baoyu-diagram` 直接点名。
- **visualIntent**：左右两路分别显示自然语言匹配和 `/baoyu-diagram 画一张用户登录的时序图`，两路汇入同一 Skill 流程。
- **visualType**：Two-path Comparison。
- **keyOnScreenText**：`自然语言：让 Claude 选`、`/baoyu-diagram`、`直接点名`、`同一份 Skill 流程`
- **videoValue**：两种入口的选择逻辑要用路径分流和汇合展示，避免只停留在口头定义。

## Scene 06｜喊了没反应？三步排查

- **sceneId**：`skills-in-practice-06`
- **title**：喊了没反应？三步排查
- **purpose**：把“不触发”从模糊故障变成可执行的排查顺序。
- **narrativeRole**：障碍处理／方法补全。
- **narrationIntent**：依次讲清换直白说法、确认在可用列表、最后 `/名字` 兜底，并补充触发太勤时收窄 description 或关闭自动调用。
- **visualIntent**：用三段检查轨道显示“说法太含糊 → 不在册 → 自动匹配没中”，右下角展示 `disable-model-invocation: true` 的控制开关。
- **visualType**：Troubleshooting Flow／Permission Toggle。
- **keyOnScreenText**：`帮我画一张架构图`、`有哪些可用的 skill？`、`/baoyu-diagram`、`disable-model-invocation: true`
- **videoValue**：排查的顺序和分支关系适合用动画路径表现，能让观众记住下一步做什么。

## Scene 07｜想让全队都能用：把 Skill 放进项目

- **sceneId**：`skills-in-practice-07`
- **title**：想让全队都能用：把 Skill 放进项目
- **purpose**：解释个人 Skill 与项目级 Skill 的共享边界和安全动作。
- **narrativeRole**：范围扩展／团队落地。
- **narrationIntent**：对比 `~/.claude/skills/` 与项目 `.claude/skills/`，说明项目级 Skill 要进 Git，并提醒信任外部仓库前查看其 Skill 权限。
- **visualIntent**：文件树左侧为个人目录，右侧为项目目录和 Git 提交流程，最后弹出“先查看项目 skills”的信任警示。
- **visualType**：Scope Comparison／Repository Flow。
- **keyOnScreenText**：`~/.claude/skills/`、`.claude/skills/`、`git add .claude/skills/`、`先查看项目 skills`
- **videoValue**：目录范围、提交状态和信任警示是软件协作的过程信息，画面比静态说明更清楚。

## Scene 08｜从零造一个：`explain-casual`

- **sceneId**：`skills-in-practice-08`
- **title**：从零造一个：`explain-casual`
- **purpose**：把创建个人 Skill 的最小步骤落成可复用的示例。
- **narrativeRole**：实践展开／创建流程。
- **narrationIntent**：带观众创建目录、写入带真实说法的 description 和三步解释规则，再重启会话。
- **visualIntent**：终端依次展示目录创建和文件写入，右侧卡片拆出 description、整体作用、关键代码、潜在坑三条规则。
- **visualType**：Terminal Demo／File Creation。
- **keyOnScreenText**：`mkdir -p ~/.claude/skills/explain-casual`、`SKILL.md`、`description`、`整体作用 → 关键代码 → 潜在坑`
- **videoValue**：目录、文件和规则按顺序生成，能把“自己写 Skill”从概念变成可执行模板。

## Scene 09｜两条入口，同一份说明

- **sceneId**：`skills-in-practice-09`
- **title**：两条入口，同一份说明
- **purpose**：验证新建 Skill 已进入列表，并证明自动和手动调用读取同一套规则。
- **narrativeRole**：验证闭环／证据确认。
- **narrationIntent**：说明重启后先确认 `explain-casual` 在列表，再分别用自然语言和 `/explain-casual` 解释代码，得到同样的三步结构。
- **visualIntent**：左路显示列表发现和自然语言输入，右路显示 `/explain-casual`，两路汇入相同的解释结果。
- **visualType**：Dual-path Verification。
- **keyOnScreenText**：`explain-casual`、`用大白话讲讲这段代码`、`/explain-casual`、`同一份 SKILL.md`
- **videoValue**：只有把列表、两种入口和共同结果串在一起，才能证明 Skill 已加载且规则可复用。

## Scene 10｜把重复流程封装起来，下一步自己造 Skill

- **sceneId**：`skills-in-practice-10`
- **title**：把重复流程封装起来，下一步自己造 Skill
- **purpose**：收束使用、排查、共享和创建的完整路径，并承接系列下一篇。
- **narrativeRole**：结论收束／系列预告。
- **narrationIntent**：回顾查列表、看结构、触发、排查、共享和验证，强调 Skill 是把重复流程封装成可调用能力，最后预告 28「skill-creator：造你自己的 skill」。
- **visualIntent**：将“查 → 看 → 触发 → 排查 → 共享／创建 → 验证”串成一条路径，末端切换到下一篇预告卡。
- **visualType**：Summary Flow／Preview Card。
- **keyOnScreenText**：`查 → 看 → 触发 → 排查 → 共享／创建 → 验证`、`28「skill-creator：造你自己的 skill」`
- **videoValue**：全片方法论和下一集预告需要稳定停留，作为视频最后一个视觉事件完成记忆收束。

## Gate 1 内部检查

- [x] 10 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 每幕只有一个主要认知任务，顺序为价值钩子、环境检查、结构机制、自动调用、手动调用、排查、共享、创建、验证、收束。
- [x] 所有命令、路径、文件名、状态和预告均能追溯到 `source.md` 或本片前置资料。
- [x] Scene 04、05、06、08、09 中的命令只作为画面示例，不在本次任务中执行。
- [x] Scene 10 的下一篇预告来自当前文章末尾，未引入下一篇的业务内容。
