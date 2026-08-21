# Claude Code 视频化 · 第三步：Scene Script

## Scene 01｜会话不是输入框加回车

### sceneId

`modes-and-control-01`

### title

会话不是输入框加回车

### purpose

从“打字、回车、等”的常见使用状态制造问题，建立会话内还有控制台的预期。

### narrativeRole

问题钩子。

### narrationIntent

指出 Claude 跑起来以后仍可能跑偏、过早改文件或让用户长时间等待，这篇要讲的是如何在会话中实时操纵它。

### visualIntent

让一个普通交互输入框向外展开成控制面板，露出自主权、过程、响应三类控制入口。

### visualType

OpeningScene／Concept Diagram

### keyOnScreenText

`输入`、`回车`、`等待`、`自主权`、`过程`、`响应`

### videoValue

输入框扩展成控制台的状态变化能立刻表现“会话控制”这个抽象主题，单纯定义很难建立同样的直觉。

## Scene 02｜先把控制手段分成三类

### sceneId

`modes-and-control-02`

### title

三类开关，各管一摊

### purpose

建立后续所有快捷键和命令的分类地图，避免观众把它们当成一张零散速记表。

### narrativeRole

心智模型。

### narrationIntent

解释自主权、过程、响应分别控制什么，并给每类放入文章中的代表手段。

### visualIntent

让三条控制路径汇入同一个会话节点：自主权接 `Shift+Tab`，过程接 `Esc`／`Ctrl+C`／`Ctrl+B`，响应接 `Option+P`／`/fast`。

### visualType

ConceptScene／Connection Diagram

### keyOnScreenText

`自主权`、`过程`、`响应`、`Shift+Tab`、`Esc`、`/fast`

### videoValue

三路分流和汇聚把“想控制什么，就伸手到哪一类”变成可见关系，比并列列表更容易记忆。

## Scene 03｜过程控制：刹车、倒车和后台

### sceneId

`modes-and-control-03`

### title

跑偏了，先把方向盘拿回来

### purpose

优先讲最常救场的过程控制，并准确区分暂停、回退、中断、退出和后台运行。

### narrativeRole

立即可用。

### narrationIntent

解释 `Esc` 不是撤销，双击 `Esc` 取决于输入框是否有字；同时提醒 `Ctrl+C`、`Ctrl+D` 和 `Ctrl+B` 的边界。

### visualIntent

模拟同一个会话依次出现“正在执行”“暂停并保留”“回退菜单”“清空输入”“退出”“后台运行”状态。

### visualType

TerminalScene／StepListScene

### keyOnScreenText

`Esc`、`Esc Esc`、`Ctrl+C`、`Ctrl+D`、`Ctrl+B`、`已完成保留`

### videoValue

按键之后的状态变化是过程控制的核心证据，静态展示快捷键名称无法说明它们之间的差异。

## Scene 04｜Shift+Tab：权限模式的循环

### sceneId

`modes-and-control-04`

### title

Shift+Tab：默认三档怎么转

### purpose

让观众掌握默认权限循环，并知道可选模式不是无条件出现。

### narrativeRole

自主权展开。

### narrationIntent

说明 `default`、`acceptEdits`、`plan` 的默认循环，以及 `auto`、`bypassPermissions`、`dontAsk` 的加入条件和顺序。

### visualIntent

用环形路径展示默认三档，再把满足条件后插入的 `bypassPermissions` 和 `auto` 放在 `plan` 后；将 `dontAsk` 放在循环外。

### visualType

ConceptScene／Decision Diagram

### keyOnScreenText

`default → acceptEdits → plan`、`bypassPermissions`、`auto`、`dontAsk`

### videoValue

模式节点真的插入循环、某个模式永远在循环外，是时间和空间共同表达的规则，不能只靠口头顺序。

## Scene 05｜Plan Mode：先谋后动

### sceneId

`modes-and-control-05`

### title

先出方案，再决定怎么动手

### purpose

把 `plan` 从一个模式名升级为一套“研究、计划、审查、执行”的工作流。

### narrativeRole

核心转折。

### narrationIntent

解释 Plan Mode 可以读文件、运行探索命令、写计划，但不编辑源代码；进入方式包括 `Shift+Tab` 和单条提示前的 `/plan`。

### visualIntent

从项目文件和探索终端出发，生成计划文档，停在“等待批准”状态，明确源代码仍保持未修改。

### visualType

Process／TerminalScene

### keyOnScreenText

`/plan`、`Research`、`Write plan`、`No source edits`、`等待批准`

### videoValue

“只走戏、不实拍”的前后状态是 Plan Mode 最重要的直觉，过程动画比定义更能避免误解。

## Scene 06｜批准计划：同时选择下一档自主权

### sceneId

`modes-and-control-06`

### title

批准计划，也是在选择怎么执行

### purpose

展示 Plan Mode 的出口，让观众理解批准不是单一的“继续”按钮。

### narrativeRole

工作流落地。

### narrationIntent

解释批准菜单中的自动执行、接受编辑、手动审查和继续规划；补充 `Ctrl+G` 可以编辑计划。

### visualIntent

“等待批准”节点展开四个选择，前三个通往不同执行状态，继续规划回到计划阶段；右下角显示 `Ctrl+G` 编辑计划。

### visualType

Decision Diagram／ComparisonScene

### keyOnScreenText

`批准并自动执行`、`批准并接受编辑`、`手动审查`、`继续规划`、`Ctrl+G`

### videoValue

批准动作产生多条后续路径，清楚展示了 Plan Mode 如何连接审查和执行，比把选项列成文字更有决策价值。

## Scene 07｜快速模式：用成本买响应速度

### sceneId

`modes-and-control-07`

### title

/fast 买的是速度，不是质量

### purpose

澄清快速模式与换模型、调努力级别之间的差异，并建立使用取舍。

### narrativeRole

响应取舍。

### narrationIntent

说明 `/fast` 使用同一个 Opus 的不同 API 配置，文章给出的上限是最多快 2.5 倍，但每个 token 更贵；实时调试可开，长任务和成本敏感任务应谨慎。

### visualIntent

左侧保持同一 Opus，右侧两条轨道分别显示更快／更贵与降低努力级别／可能影响复杂任务质量，底部给出开关时机提示。

### visualType

ComparisonScene／Decision Diagram

### keyOnScreenText

`/fast`、`同一个 Opus`、`最多 2.5 倍`、`更贵`、`努力级别`、`速度 vs 成本`

### videoValue

速度、成本和质量的三方关系需要同时对照；用分叉和标签表达，能避免把“快”误解成“更强”。

## Scene 08｜Vim：给输入框加两种状态

### sceneId

`modes-and-control-08`

### title

Vim 模式：输入框里的 NORMAL 与 INSERT

### purpose

说明 Vim 模式是输入效率的可选增强，而不是所有人的必修控制手段。

### narrativeRole

输入效率补充。

### narrationIntent

解释从 `/config` 的编辑器模式开启 Vim，NORMAL 模式使用命令，INSERT 模式负责打字；介绍 `dd`、`cw`、`0`、`$`、`u`、`i`、`a` 中的代表手势，并提醒新手可以跳过。

### visualIntent

让同一段提示在 INSERT 和 NORMAL 两种状态间切换，依次演示删行、改词、跳行首和撤销；右侧显示“Vim 党适合／新手可跳过”。

### visualType

UI Simulation／StepListScene

### keyOnScreenText

`/config`、`INSERT`、`NORMAL`、`dd`、`cw`、`0`、`$`、`u`

### videoValue

光标和文本的实时变化能让 Vim 手势变得可理解；同时保留适用人群判断，避免把可选功能包装成主线必需品。

## Scene 09｜练习：只出方案，到批准后执行

### sceneId

`modes-and-control-09`

### title

练习前三步：观察、计划、批准

### purpose

把前面的模式和 Plan Mode 变成一次可观察的实践闭环。

### narrativeRole

实践验证。

### narrationIntent

带观众完成状态栏观察、切到 Plan Mode 请求创建 `hello.txt`，以及批准并接受编辑后文件才出现、模式发生切换的三步。

### visualIntent

用同一终端按时间展示：状态栏循环 → `plan` 只生成方案且文件不存在 → 批准后切到 `acceptEdits`，`hello.txt` 出现。

### visualType

TerminalScene／StepListScene

### keyOnScreenText

`Shift+Tab`、`plan`、`hello.txt`、`文件未创建`、`accept edits on`、`文件已创建`

### videoValue

“批准前不存在、批准后出现”的反差是 Plan Mode 价值的直接验证，必须通过连续状态展示。

## Scene 10｜练习：喊停，再检查速度开关

### sceneId

`modes-and-control-10`

### title

练习后两步：Esc 喊停，/fast 看取舍

### purpose

完成文章五步练习，把过程控制和响应控制接回实际会话。

### narrativeRole

闭环完成。

### narrationIntent

说明长任务开始后用 `Esc` 停止并保留已完成部分、补充新方向；最后选做 `/fast` 检查是否可用，能开就体验，不能开也正常。

### visualIntent

让长任务日志被 `Esc` 截断，已有文件行保留，新指令接管；随后 `/fast` 显示“可用”或“不可用”两种文章允许的结果。

### visualType

TerminalScene／Decision Diagram

### keyOnScreenText

`Esc`、`保留已完成`、`重定向`、`/fast`、`Fast mode ON`、`不可用也正常`

### videoValue

前后状态把“暂停交还”与“失败退出”区分开，也把快速模式的账户条件转化为可观察反馈。

## Scene 11｜从等待到掌握操纵杆

### sceneId

`modes-and-control-11`

### title

会话跑起来以后，你仍然握着方向盘

### purpose

收束三类控制、练习结果和日常使用判断，并承接下一篇。

### narrativeRole

总结与系列承接。

### narrationIntent

回顾自主权、过程、响应三类控制，强调从“只会打字回车干等”升级为随时可暂停、可规划、可取舍；最后预告第 36 篇斜杠命令。

### visualIntent

把三类控制和代表手段连成一张控制矩阵，最后切换为下一篇第 36 篇预告卡片，留出阅读停留。

### visualType

SummaryScene／Connection Diagram

### keyOnScreenText

`自主权`、`过程`、`响应`、`Shift+Tab`、`Esc`、`/fast`、`下一篇 36 · 斜杠命令（Slash Commands）`

### videoValue

把分散的控制手段重新连成一张可回忆的地图，并用预告卡形成系列连续性，视频收束比文字结论更容易留下结构记忆。

## Scene Script 总览

| Scene | 类型 | 主要认知任务 | 核心画面 |
|---|---|---|---|
| 01 | Opening | 输入框之外还有控制台 | 三类控制入口展开 |
| 02 | Concept | 建立三类控制地图 | 自主权／过程／响应汇聚 |
| 03 | Terminal／StepList | 掌握过程快捷键 | 暂停、回退、中断、后台 |
| 04 | Concept／Decision | 看懂模式循环 | 默认三档与可选模式 |
| 05 | Process／Terminal | 理解 Plan Mode | 研究到等待批准 |
| 06 | Decision／Comparison | 选择批准后的执行方式 | 四条批准分支 |
| 07 | Comparison／Decision | 取舍速度、成本、努力 | /fast 与 effort 对照 |
| 08 | UI／StepList | 判断 Vim 是否适合 | NORMAL／INSERT 手势 |
| 09 | Terminal／StepList | 验证计划与批准差异 | 文件从未创建到已创建 |
| 10 | Terminal／Decision | 完成喊停与速度练习 | Esc 截断、/fast 反馈 |
| 11 | Summary | 形成最终控制模型 | 控制矩阵与下一篇预告 |

## Gate 1 内部审查结论

- 11 个 Scene 各自只承担一个主要认知任务，顺序从问题、分类、救场、控权、取舍到实践收束。
- 每个 Scene 均明确了 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText 和 videoValue。
- 画面文字来自指定文章或前置生产资料，未引入其他视频的业务语义。
- Scene 11 同步承担总结和下一篇预告，符合系列结尾规则。
- 现有六类基础场景足以表达本片，不新增场景组件。

**结论：Scene Script 通过 Gate 1。**
