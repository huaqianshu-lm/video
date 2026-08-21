# Claude.md 使用指南视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成 9 个可制作场景。每个 Scene 只承担一个主要认知任务，并明确声音、画面和 Video Value 的分工。

## Scene 01｜三百行，零条被听见

### sceneId
`S01`

### title
三百行，零条被听见

### purpose
用包管理器规则被埋没的失败现场建立问题：CLAUDE.md 写得更长，不代表 Claude 更容易遵守。

### narrativeRole
问题钩子

### narrationIntent
解释一份冗长的 CLAUDE.md 如何让重要规则被背景、愿景和历史说明稀释，并引出“问题不一定是不听话”。

### visualIntent
演示文档滚动、规则短暂出现、任务执行错误三步之间的因果关系。

### visualType
`UI Simulation + Process`

### keyOnScreenText
`CLAUDE.md`、`依赖管理只用 pnpm`、`npm install`、`重要规则被埋没`

### videoValue
只有通过时间顺序和状态变化，观众才能直观看到规则从文档中出现、再被错误执行掩盖的过程。

### narration
最没用的 CLAUDE.md，往往不是没写规则，而是写了三百行，重要的一条却被埋在里面。比如明明写着依赖管理只用 pnpm，Claude 还是顺手执行了 `npm install`。问题可能不在它完全不听话，而在真正重要的规则，被背景介绍和长篇说明稀释了。

### visual
画面从一份很长的 `CLAUDE.md` 开始，背景、愿景和历史说明快速向上滚动。一条 `依赖管理只用 pnpm` 短暂高亮后被滚出视野，随后右侧任务区出现 `npm install` 和红色的“规则未生效”状态。最后只留下“重要规则被埋没”。

## Scene 02｜CLAUDE.md 是入职手册，不是铁律

### sceneId
`S02`

### title
CLAUDE.md 是入职手册，不是铁律

### purpose
给出 CLAUDE.md 的准确定位和执行边界。

### narrativeRole
概念建立

### narrationIntent
解释每次会话重新加载项目记忆的必要性，以及“强烈建议、非铁律”的边界。

### visualIntent
把一个白纸会话转成读取项目手册后开始任务的启动流程，同时展示指导与强制之间的差异。

### visualType
`Concept Diagram + Process`

### keyOnScreenText
`Blank session`、`Read CLAUDE.md`、`Start task`、`强烈建议`、`非铁律`

### videoValue
启动流程的前后变化能建立“每次加载”的时间直觉，双标签对照能避免把文件误解成硬性安全锁。

### narration
每个 Claude Code 会话都可以看成从一张白纸开始。CLAUDE.md 就像给新员工的入职手册：项目做什么、常用命令是什么、哪些地方不能碰，它会在开工前重新读一遍。但它的定位要记准：这是强烈建议，不是铁律。它会影响 Claude 的行为，却没有百分之百严格遵守的保证。

## Scene 03｜三层范围，从广到窄加载

### sceneId
`S03`

### title
三层范围，从广到窄加载

### purpose
解释用户级、项目级、子目录级的范围差异，以及本地变体。

### narrativeRole
结构拆解

### narrationIntent
说明每一层适合保存什么，并纠正“后一个文件覆盖前一个文件”的误解。

### visualIntent
用三层文件堆叠和加载箭头展示范围、顺序与拼接关系。

### visualType
`Connection Diagram + Process`

### keyOnScreenText
`~/.claude/CLAUDE.md`、`./CLAUDE.md`、`subdir/CLAUDE.md`、`CLAUDE.local.md`、`拼接，不是覆盖`

### videoValue
层级的范围和加载顺序是空间加时间的关系，堆叠与箭头比一张静态层级表更容易建立直觉。

### narration
CLAUDE.md 不是只有一份。用户级文件管这台机器上的所有项目，项目级文件管团队共享的项目规矩，子目录级文件只在 Claude 读到那个模块时加入。本地的 `CLAUDE.local.md` 则适合只给自己看的项目偏好。加载方向是从范围最广到最具体，越靠近当前目录越晚读。多个文件是拼接，不是简单覆盖。

## Scene 04｜该写什么，也该删什么

### sceneId
`S04`

### title
该写什么，也该删什么

### purpose
建立 CLAUDE.md 的内容筛选标准和 200 行目标。

### narrativeRole
取舍标准

### narrationIntent
给出五类应写内容，再说明长篇背景、过时信息和可推断内容为什么应该删除。

### visualIntent
让五类长期事实逐条进入短文件，再用裁剪动作展示从冗长到精简的变化。

### visualType
`Task Routing + Process`

### keyOnScreenText
`项目概述`、`技术栈`、`常用命令`、`代码约定`、`不要做`、`< 200 lines`

### videoValue
逐条加入和批量裁剪能把“精简”变成可观察的筛选动作，而不是抽象口号。

### narration
真正值得写进去的，是每个会话都应该保持的事实：项目概述、技术栈、常用命令、代码约定，以及明确的不要做。公司背景、过时命令，还有 Claude 看代码就能推出来的目录结构，都应该删掉。官方建议每个文件目标控制在二百行以内。短，不是为了好看，而是把上下文留给真正的任务。

## Scene 05｜`@` 引用：整理，不省上下文

### sceneId
`S05`

### title
`@` 引用：整理，不省上下文

### purpose
解释 `@` 引用的用法边界和上下文代价。

### narrativeRole
认知转折

### narrationIntent
说明引用可以让文件结构更清楚，但被引用内容仍会在启动时展开加载。

### visualIntent
演示一个 `@README` 引用展开成上下文内容，同时保持上下文用量不下降。

### visualType
`Connection Diagram + UI Simulation`

### keyOnScreenText
`@README`、`@docs/git-instructions.md`、`最多递归四跳`、`Context usage 不下降`

### videoValue
“文件更短”与“上下文没变少”的反差需要展开动画才能被看见。

### narration
如果项目里已经有规范文档，可以用 `@README` 或 `@docs/git-instructions.md` 引用，不必复制内容。相对路径相对于包含引用的文件解析，引用还可以继续引用其他文件，最多递归四跳。可是要注意，引用是整理，不是上下文减肥。被引用的内容启动时照样会展开加载，文件结构变清楚了，Context usage 却不会因此下降。

## Scene 06｜让记忆跟着项目一起收敛

### sceneId
`S06`

### title
让记忆跟着项目一起收敛

### purpose
展示新增长期规则和定期精简的维护闭环。

### narrativeRole
方法落地

### narrationIntent
告诉观众如何在会话中补规则，什么情况下需要精简，以及发现失效时的排查顺序。

### visualIntent
把一次纠正转成文件更新，再经过 `/memory` 检查和项目变化后的旧规则删除。

### visualType
`Process + Task Execution`

### keyOnScreenText
`加进 CLAUDE.md`、`/memory`、`文件是否加载`、`规则是否模糊`、`是否冲突`

### videoValue
维护本质上是跨时间的状态变化，流程动画能表现“补入—确认—精简”的循环。

### narration
CLAUDE.md 不是写完一次就不再动。会话里发现一条以后每次都该遵守的规则，可以直接让 Claude 把它加进 CLAUDE.md，也可以用 `/memory` 打开并自己编辑。换了包管理器、调整了依赖、改了约定，或者文件又超过二百行，就该回头精简。发现规则没生效时，先确认文件有没有加载，再看规则是不是太模糊，最后检查有没有互相冲突。

## Scene 07｜好规则要一眼能验收

### sceneId
`S07`

### title
好规则要一眼能验收

### purpose
用反例和正例建立“具体到可验证”的规则标准。

### narrativeRole
标准校准

### narrationIntent
对比模糊散文与具体规则，说明为什么只有后者容易被稳定执行和检查。

### visualIntent
让模糊规则逐条被替换为带有明确条件、目录或工具的规则。

### visualType
`Comparison + Code Exploration`

### keyOnScreenText
`代码应该比较整洁`、`函数不超过 50 行`、`尽量写测试`、`每个新增函数必须有单元测试`、`禁用 npm 和 yarn`

### videoValue
“模糊”到“可验证”的替换过程能让观众看到规则质量的判断标准，而不只是听到建议。

### narration
一条好规则，应该具体到能一眼看出有没有违反。比如“代码应该比较整洁”无法验收；“函数不超过五十行，超了必须拆”就很明确。“尽量写测试”也太虚；“每个新增函数都必须有对应单元测试”才是能检查的约定。规则要像规则，不要像散文。

## Scene 08｜用最小项目验证它真的生效

### sceneId
`S08`

### title
用最小项目验证它真的生效

### purpose
把前面的原则落到一个不到 15 行的玩具项目验证流程。

### narrativeRole
实践验收

### narrationIntent
串起建立项目、写精简 CLAUDE.md、用 `/memory` 检查和执行任务验证约定的完整闭环。

### visualIntent
展示最小项目从建立文件到确认加载、再到产生符合约定的 diff。

### visualType
`Demo + Task Execution`

### keyOnScreenText
`claude-md-demo`、`< 15 lines`、`/memory`、`函数必须有类型注解`、`验证通过`

### videoValue
验证链路包含连续动作和结果状态，能把“写得好”转化为“实际加载并影响任务”。

### narration
可以用一个最小玩具项目做验收。只保留一个 `add` 函数，写一份不到十五行的 CLAUDE.md，里面放测试命令、类型注解和不能修改的函数签名。然后用 `/memory` 确认文件真的被加载，再让 Claude 做一件会触碰这些约定的任务。最后看它给出的 diff，规则有没有真正影响结果，就清楚了。

## Scene 09｜把 CLAUDE.md 变成项目护栏

### sceneId
`S09`

### title
把 CLAUDE.md 变成项目护栏

### purpose
收束全片原则，并以 source 已给出的下一篇主题完成系列预告。

### narrativeRole
结论与下一集预告

### narrationIntent
总结文件的正确职责、四个关键动作和人与规则的关系，再预告下一篇上下文管理。

### visualIntent
把范围、规则、引用、维护和验证收束成一条护栏路径，最后切换到独立的下一集预告卡片。

### visualType
`Summary + Process`

### keyOnScreenText
`范围`、`具体规则`、`引用`、`维护`、`验证`、`CLAUDE.md 不是百科全书`、`下一篇：上下文管理`

### videoValue
路径逐项点亮和预告卡片的停留，让观众在结尾形成可复用的检查框架，并明确系列下一步。

### narration
所以，CLAUDE.md 最好的状态，不是一本百科全书，而是一道项目护栏：放对范围，写具体规则，删掉过时内容，知道 `@` 不会减少上下文，再用 `/memory` 和真实任务验证它。下一篇我们继续看上下文管理：这些文件和对话到底怎样占用那张工作台，以及窗口满了之后该怎么办。

## Scene Script 总览

| Scene | 主要认知任务 | Visual Type |
| --- | --- | --- |
| S01 | 规则被长文档稀释 | UI Simulation + Process |
| S02 | 定位 CLAUDE.md 的能力边界 | Concept Diagram + Process |
| S03 | 理解层级和加载关系 | Connection Diagram + Process |
| S04 | 建立写入与删除标准 | Task Routing + Process |
| S05 | 理解 `@` 的真实代价 | Connection Diagram + UI Simulation |
| S06 | 建立维护闭环 | Process + Task Execution |
| S07 | 将散文改成可验证规则 | Comparison + Code Exploration |
| S08 | 用最小项目验收 | Demo + Task Execution |
| S09 | 收束原则并预告下一篇 | Summary + Process |

## Gate 1 内部结论

- 9 个 Scene 的 `sceneId`、标题、目的、叙事作用、口播意图、视觉意图、类型、屏幕重点和 Video Value 均已填写。
- 每个 Scene 只有一个主要认知任务，且声音解释、画面演示／证明，没有把口播全文直接当屏幕文字。
- 所有画面文字均可追溯到 source 或本文件及后续 Visual Script；没有读取或引入下一篇文章的业务内容。
- S09 的下一篇预告承载在 Summary Scene 中，并为原型预留独立停留时间。

## 下一步

基于以上 Scene Script 冻结口播结构，编写纯口播 Narration Script 和互补的 Visual Script。
