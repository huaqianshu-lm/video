# Claude Code 视频化 · 第三步：Scene Script

## Scene 01｜三字符替代重启

### sceneId

slash-commands-01

### title

三字符替代重启

### purpose

用“退出 claude、重新启动、重新加载项目”的低效路径制造问题，并用 /clear 建立斜杠命令的即时控制价值。

### narrativeRole

问题钩子。

### narrationIntent

解释新手为了清空上下文而反复重启的浪费，指出 /clear 可以在会话内开一段空上下文的新对话。

### visualIntent

让重启链路先经过 Ctrl+C、启动和加载，再被 /clear 三个字符截短。

### visualType

OpeningScene／Process

### keyOnScreenText

/clear、Ctrl+C、重新启动、空上下文

### videoValue

时间线上的“重启很长”到“斜杠很短”的替换能直接展示控制面板带来的效率差异。

## Scene 02｜/ 是 Claude Code 的控制面板

### sceneId

slash-commands-02

### title

/ 不是普通提示，是控制面板

### purpose

定义斜杠命令的控制对象，区分对模型派任务与对 Claude Code 做元操作。

### narrativeRole

概念建立。

### narrationIntent

说明 /clear、/model、/init 这类动作控制的是程序本身，而不是让模型理解一段普通需求。

### visualIntent

把“帮我重构函数”送往模型，把“清上下文、切模型、生成说明”送往 Claude Code 控制面板。

### visualType

ConceptScene／Concept Diagram

### keyOnScreenText

普通任务、程序控制、/clear、/model、/init

### videoValue

分流动画能让抽象的“任务与元操作”边界变成一眼可见的两条路径。

## Scene 03｜命令只认消息开头

### sceneId

slash-commands-03

### title

/clear 放哪儿，结果完全不同

### purpose

建立消息开头识别规则，避免观众在讨论命令时误触发命令。

### narrativeRole

关键边界。

### narrationIntent

讲清 / 必须是消息第一个字符，命令名后的文本才作为参数；句子中间出现的 /clear 只会被当作普通文字。

### visualIntent

展示“/clear 开头”被执行并清空上下文，“帮我解释 /clear”则保持为普通文本。

### visualType

ComparisonScene／State Change

### keyOnScreenText

/clear、消息开头、普通文字、参数

### videoValue

同一段字符在两个位置产生不同结果，是规则最适合用并列状态演示的场景。

## Scene 04｜按你正在做什么查命令

### sceneId

slash-commands-04

### title

内置命令不用背，按场景查

### purpose

把几十个内置命令从记忆负担转成可检索的使用地图。

### narrativeRole

方法建立。

### narrationIntent

按进入项目、干活中、交付前、杂项与恢复四组说明代表性命令，并强调当前设备打 / 看到的菜单才是真实全集。

### visualIntent

四组命令卡片从不同入口汇入一个可筛选的 / 菜单。

### visualType

StepListScene／Reference Board

### keyOnScreenText

/init、/memory、/mcp、/agents、/permissions、/model、/clear、/compact、/diff、/review、/help、当前菜单

### videoValue

从“按用途选择”到“菜单实时筛选”的变化，比静态照读完整命令表更能建立使用习惯。

## Scene 05｜文件名就是命令名

### sceneId

slash-commands-05

### title

一个 markdown，变成一个 /review

### purpose

展示自定义命令的最低成本创建方式，以及项目级和个人级的作用域选择。

### narrativeRole

创造入口。

### narrationIntent

说明把重复提示写入 .claude/commands/review.md 就会得到 /review；项目级适合团队共享，个人级适合跨项目复用。

### visualIntent

让 review.md 的文件名沿箭头变成 /review，并在项目级与 ~/.claude/commands/ 两条路径之间分叉。

### visualType

Process／Concept Diagram

### keyOnScreenText

.claude/commands/review.md、/review、项目级、~/.claude/commands/

### videoValue

文件到命令的映射是自定义能力的核心因果，动态映射比口头定义更直观。

## Scene 06｜参数与 frontmatter 给命令加边界

### sceneId

slash-commands-06

### title

让一键命令接参数，也知道何时该停

### purpose

展示 $ARGUMENTS、位置参数和 frontmatter 如何把固定提示变成可控模板。

### narrativeRole

能力扩展。

### narrationIntent

解释整串输入如何进入 $ARGUMENTS，多词值为何要加引号，以及 description、disable-model-invocation 和 allowed-tools 分别控制什么。

### visualIntent

同一个命令模板并列接收完整参数与位置参数，再叠加描述、手动触发和工具范围三层配置。

### visualType

ConceptScene／Process

### keyOnScreenText

$ARGUMENTS、$0、$1、description、disable-model-invocation、allowed-tools

### videoValue

占位符被替换、配置护栏被点亮的状态变化，可以同时证明复用性与可控性。

## Scene 07｜发送前注入现场数据

### sceneId

slash-commands-07

### title

让 /review 自带当前 git diff

### purpose

说明动态上下文注入如何在提示发送前把真实现场数据填进去。

### narrativeRole

进阶转折。

### narrationIntent

解释行首的感叹号加反引号命令会先执行 git diff HEAD，再把输出替换到提示中；同时提醒团队可以用 disableSkillShellExecution 禁止这类执行。

### visualIntent

展示 review.md 中的占位行经过预处理后变成真实 diff，再进入 Claude。

### visualType

TerminalScene／Data Injection

### keyOnScreenText

git diff HEAD、动态上下文注入、真实 diff、disableSkillShellExecution

### videoValue

数据在发送前被替换的过程是动态上下文的关键证据，单纯静态展示语法无法表达先后关系。

## Scene 08｜命令来源各有自己的名字

### sceneId

slash-commands-08

### title

同名不一定冲突：Skill、插件和 MCP

### purpose

消除多个命令来源混在一起时的命名困惑。

### narrativeRole

消歧。

### narrationIntent

讲清同名 Skill 优先于 command，插件用 plugin-name:skill-name 命名空间，MCP server 提示使用 /mcp__server__prompt 格式。

### visualIntent

把同名 command 与 Skill 放进优先级分流，把插件名和 MCP server 名挂到各自命令名前缀上。

### visualType

ComparisonScene／Routing Diagram

### keyOnScreenText

Skill > command、plugin-name:skill-name、/mcp__server__prompt

### videoValue

优先级和命名空间都属于关系规则，用分支与前缀展示比并列文字更容易记住。

## Scene 09｜command 还是 Skill

### sceneId

slash-commands-09

### title

一段提示用 command，需要配套能力就用 Skill

### purpose

把斜杠命令与 Skill 的关系收束成可执行的选择标准。

### narrativeRole

选择标准。

### narrationIntent

说明自定义 command 已合并进 Skill 体系；简单、手动、单文件的提示用 command 足够，需要配套文件、自动触发或渐进式披露时选择 Skill。

### visualIntent

左右两条路线展示单文件 command 与可携带目录、资源和自动触发能力的 Skill。

### visualType

ComparisonScene／Concept Diagram

### keyOnScreenText

.claude/commands/、.claude/skills/、手动喊、配套文件、自动触发

### videoValue

对照表能把“调用方式”和“能力本体”的关系从概念相似变成选型动作。

## Scene 10｜五分钟刻出 /explain

### sceneId

slash-commands-10

### title

从目录到两次调用：/explain 实战

### purpose

把前面的文件、frontmatter 和参数知识串成一个可以照做的验证闭环。

### narrativeRole

实操闭环。

### narrationIntent

依次讲创建目录、写入 explain.md、启动 Claude 查看菜单、带代码参数调用，再换成报错参数调用及预期差异。

### visualIntent

五个步骤逐项完成，/explain 先解释平均值代码，再解释 ZeroDivisionError。

### visualType

TerminalScene／StepListScene

### keyOnScreenText

mkdir -p .claude/commands、explain.md、/explain、print(sum([1,2,3]) / len([1,2,3]))、ZeroDivisionError

### videoValue

目录、文件、识别、调用和换参数的连续状态能证明自定义命令不是抽象配置，而是一条可验证流程。

## Scene 11｜把重复提示变成工作流入口

### sceneId

slash-commands-11

### title

从 / 菜单到自己的快捷动作

### purpose

收束斜杠命令的控制、查找、复用和扩展价值，并承接下一篇检查点。

### narrativeRole

结论与系列承接。

### narrationIntent

回顾 / 是控制面板、内置命令按场景查、自定义命令用文件和参数复用，最后预告下一篇 37「检查点」将拆解 /rewind。

### visualIntent

让 / 菜单、markdown 模板、参数和动态数据汇成个人工作流入口，并出现下一篇预告卡片。

### visualType

SummaryScene／Concept Diagram

### keyOnScreenText

/ 菜单、markdown、参数、现场数据、个人工作流、37「检查点」

### videoValue

将多个分散能力汇成一条控制链，并把下一篇预告作为最后视觉事件，形成可记忆的结论。

## Gate 1 内部审查

- 11 个 Scene 按“问题 → 定义 → 边界 → 查找 → 创造 → 增强 → 消歧 → 选择 → 实操 → 收束”推进，没有机械复制文章章节。
- 每个 Scene 只有一个主要认知任务，并完整填写 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText、videoValue。
- /clear、内置命令、自定义文件、参数、frontmatter、动态上下文、命名空间、Skill 和 /explain 均在 Scene 中得到承接。
- 末幕包含源文章明确给出的下一篇 37「检查点」预告。
- 画面文字范围仅使用指定文章和本文件已确认的表达，不执行文章命令。

**结论：Scene Script 通过 Gate 1。**
