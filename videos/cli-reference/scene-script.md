# Claude Code 视频化 · 第三步：Scene Script

## Scene 01｜你敲的不是一个入口

### sceneId

`cli-reference-01`

### title

你敲的不是一个入口

### purpose

用“只会光敲 `claude`”的常见状态制造问题，建立 CLI 远不止交互界面的预期。

### narrativeRole

问题钩子。

### narrationIntent

指出很多人只把 Claude Code 当成聊天窗口，并承诺这篇会把命令、标志、管道和退出码摊开。

### visualIntent

让单独的 `claude` 从交互窗口退到终端轨道上，旁边依次出现 command、flag、pipe、exit code 四个能力入口。

### visualType

OpeningScene／Concept Diagram

### keyOnScreenText

`claude`、`command`、`flag`、`pipe`、`exit code`

### videoValue

“一个入口”变成“可编排工具”的视觉变化能快速建立主题，单纯口头说明很难形成同样的反差。

## Scene 02｜一行命令拆成两样

### sceneId

`cli-reference-02`

### title

一行命令拆成两样：command 与 flag

### purpose

建立后续查表所需的 CLI 基本语法。

### narrativeRole

概念澄清。

### narrationIntent

解释 `claude update` 中的 `update` 是子动作，而 `claude -p ... --model sonnet` 中的 `-p` 和 `--model` 是调整运行方式的标志。

### visualIntent

把两行真实示例拆成程序、子命令、标志和参数四个层级，并突出错误子命令会建议匹配项后退出。

### visualType

ConceptScene／Code Exploration

### keyOnScreenText

`claude update`、`claude -p "解释这个函数" --model sonnet`、`command`、`flag`

### videoValue

分层、连线和高亮能让抽象的语法关系一眼可见，为后续标志表建立阅读方式。

## Scene 03｜会话怎么启动、继续和恢复

### sceneId

`cli-reference-03`

### title

最近还是指定：会话入口怎么选

### purpose

把启动、继续、恢复和维护命令放进同一张选择地图。

### narrativeRole

路径选择。

### narrationIntent

讲清 `claude`、带提示启动、`-c`、`-r`、`--name` 的关系，并补上 `update`、`install`、`auth login`、`auth status` 的维护位置。

### visualIntent

从启动节点分出交互、最近会话和指定会话三条路径；用名字标签连接到 `--resume`，再把维护命令放在侧边。

### visualType

ComparisonScene／Task Routing

### keyOnScreenText

`-c` = 最近、`-r` = 指定、`--name`、`update`、`auth status`

### videoValue

最近／指定的分岔和恢复路线是动态选择关系，比把命令并列列出更容易形成使用直觉。

## Scene 04｜-p 把 Claude 变成 headless 零件

### sceneId

`cli-reference-04`

### title

`-p`：不进交互，直接出结果

### purpose

完成从交互模式到 headless 模式的关键认知转折。

### narrativeRole

核心转折。

### narrationIntent

解释 `-p`／`--print` 会读取提示、执行、打印结果并退出，是脚本和管道玩法的地基。

### visualIntent

左右对比交互窗口和 headless 终端：左侧有人等待输入，右侧 `claude -p` 输出后回到 shell 提示符。

### visualType

ComparisonScene／TerminalScene

### keyOnScreenText

`claude`、`claude -p "解释这个函数"`、`interactive`、`headless`、`result → exit`

### videoValue

窗口消失、结果落地和提示符返回是 headless 的核心状态变化，只有视频过程能把这个转折清楚演示出来。

## Scene 05｜stdin 把 Claude 接进流水线

### sceneId

`cli-reference-05`

### title

文件和 diff，从 stdin 流进 Claude

### purpose

展示 headless 不是孤立调用，而是可以成为命令行流水线中的一个工位。

### narrativeRole

能力展开。

### narrationIntent

解释 `cat build-error.txt | claude -p ... > output.txt`、`git diff main | claude -p ...` 的输入和输出方向，并提醒管道输入上限为 10MB。

### visualIntent

让文件／git diff 沿箭头进入 Claude，再分别流向 `output.txt` 和 `lint:claude`，在入口处显示 `stdin`。

### visualType

TerminalScene／Connection Diagram

### keyOnScreenText

`cat build-error.txt`、`git diff main`、`stdin`、`claude -p`、`output.txt`、`10MB`

### videoValue

管道是方向和数据流，动态连接能直接证明“上一道工序喂料、下一道工序接结果”。

## Scene 06｜一趟调用的控制面板

### sceneId

`cli-reference-06`

### title

模型、权限、目录：给一次调用加边界

### purpose

把高频控制标志按风险和作用分层，避免观众只记住 `-p` 却不会控制脚本。

### narrativeRole

边界建立。

### narrationIntent

说明 `--model`、`--permission-mode`、`--add-dir`、`--allowedTools`／`--disallowedTools` 的职责，并明确危险权限开关不应成为真实项目的默认选择。

### visualIntent

在同一条调用上逐层挂载模型、权限、目录和工具标签；`--dangerously-skip-permissions` 被隔离在红色警示区。

### visualType

ConceptScene／Decision Diagram

### keyOnScreenText

`--model`、`--permission-mode`、`--add-dir`、`--allowedTools`、`--dangerously-skip-permissions`

### videoValue

参数像护栏一样逐层加上，能把“控制一次调用”从抽象说明变成可见的风险边界。

## Scene 07｜JSON 让脚本接住结果

### sceneId

`cli-reference-07`

### title

从一大坨 JSON 取出你真正要的字段

### purpose

证明结构化输出可以被脚本继续消费，而不是只能把整段答案打印给人看。

### narrativeRole

数据落地。

### narrationIntent

介绍 `--output-format json` 的三类关键信息：`.result`、`.session_id` 和 `total_cost_usd`，以及 `jq -r '.result'` 的字段提取。

### visualIntent

JSON 对象展开，`.result` 被高亮抽出；`.session_id` 沿另一条箭头进入 `--resume`，形成多轮会话连接。

### visualType

TerminalScene／Connection Diagram

### keyOnScreenText

`--output-format json`、`.result`、`.session_id`、`total_cost_usd`、`jq -r '.result'`

### videoValue

字段被提取和分流的过程直接体现结构化输出价值，避免把 JSON 只讲成一个格式名称。

## Scene 08｜追加提示还是替换提示

### sceneId

`cli-reference-08`

### title

脚本身份：追加默认提示，还是整套替换

### purpose

澄清两个容易混淆的 system prompt 标志及其风险差异。

### narrativeRole

误用预防。

### narrationIntent

说明 `--append-system-prompt` 保留默认编程助手能力并追加要求，而 `--system-prompt` 会替换整套默认提示；多数场景优先追加。

### visualIntent

把默认系统提示画成底板，`append` 以绿色条叠加，`system` 以红色替换并显示默认层被移除。

### visualType

ComparisonScene／Decision Diagram

### keyOnScreenText

`--append-system-prompt`、`--system-prompt`、`default prompt`、`security instructions`

### videoValue

叠加和替换是结构变化，视觉能准确表达保留边界与替换风险。

## Scene 09｜退出码是脚本的成绩单

### sceneId

`cli-reference-09`

### title

`0` 继续，非 `0` 停下处理

### purpose

让观众建立命令行自动化最基本的成功／失败判断。

### narrativeRole

判断机制。

### narrationIntent

解释 `echo $?` 读取上一条命令结果，`auth status` 已登录返回 `0`、未登录返回 `1`，并展示 `||` 如何在失败时终止。

### visualIntent

终端运行 `claude auth status`，结果分成绿色 `0` 和红色 `1` 两条分支，红色分支进入 `未登录，终止`。

### visualType

TerminalScene／Decision Diagram

### keyOnScreenText

`claude auth status`、`echo $?`、`0 = success`、`1 = not logged in`、`||`

### videoValue

退出码从命令流向脚本分支，能展示“数字是给脚本看的成绩单”，不是只背一条约定。

## Scene 10｜标志全表是查阅工具

### sceneId

`cli-reference-10`

### title

不用背：按用途查 CLI 标志

### purpose

把几十个标志从记忆负担转成可检索的分类地图。

### narrativeRole

知识收束前的工具化总结。

### narrationIntent

按启动与会话、模型与权限、目录与配置、headless 输出与控制、杂项五类带观众扫过完整常用表，并再次强调 `--help` 不列全。

### visualIntent

速查板分成五列或五行，当前高亮 `--bare`、`--max-turns`、`--max-budget-usd`，角落标注“查，不背”。

### visualType

StepListScene／Reference Table

### keyOnScreenText

`启动与会话`、`模型与权限`、`目录与配置`、`headless 输出与控制`、`杂项`、`--help 不全`

### videoValue

分类表的扫描和高亮能把大量选项压缩成可导航的地图，适合“参考手册”主题。

## Scene 11｜四步跑通 headless

### sceneId

`cli-reference-11`

### title

裸调用 → 管道 → JSON → 退出码

### purpose

把前面概念串成文章明确给出的可执行学习链路。

### narrativeRole

实践闭环。

### narrationIntent

依次讲清四步：裸 `-p` 输出、管道喂入代码、`--output-format json | jq` 取结果、`auth status` 加 `$?` 判断。

### visualIntent

单一终端窗口按时间推进四个状态，每一步完成后留下绿色标记，最后连成“自动化地基”。

### visualType

TerminalScene／StepListScene

### keyOnScreenText

`1 claude -p`、`2 cat buggy.py | claude -p`、`3 --output-format json | jq`、`4 auth status + $?`

### videoValue

连续执行和结果反馈让观众看到“会用”而不是“听过”，是 CLI 教程必须保留的过程价值。

## Scene 12｜从聊天窗口到流水线零件

### sceneId

`cli-reference-12`

### title

命令、标志、管道、退出码，组成可编排的 Claude

### purpose

收束核心心智模型，并自然承接下一篇控制与模式。

### narrativeRole

总结与下一集预告。

### narrationIntent

回顾从 `claude` 到可编排流水线的变化，并明确下一篇将拆解 `plan`、`acceptEdits`、`bypassPermissions` 以及会话里的模式切换。

### visualIntent

把命令、标志、管道、JSON、退出码连成一条完整链路；最后切入下一篇预告卡片，留出可读停留空间。

### visualType

SummaryScene／Connection Diagram

### keyOnScreenText

`命令`、`标志`、`管道`、`JSON`、`退出码`、`35 · 控制与模式`

### videoValue

关系链和预告的连续收束能让观众带走可复用心智模型，同时为系列下一集留下明确问题。

## Scene Script 总览

| Scene | 类型 | 主要视觉事件 | 口播／画面关系 |
|---|---|---|---|
| 01 | Opening／Concept | 单入口扩展为 CLI 能力轨道 | 口播提出误区，画面给出能力地图 |
| 02 | Concept | 命令行分层拆解 | 口播解释术语，画面高亮结构 |
| 03 | Comparison | 最近／指定会话分岔 | 口播讲选择，画面演示路径 |
| 04 | Comparison／Terminal | 交互窗口切换为 headless | 口播解释模式，画面展示退出 |
| 05 | Terminal／Connection | stdin 管道流动 | 口播讲流水线，画面证明数据方向 |
| 06 | Concept／Decision | 控制参数逐层加护栏 | 口播讲边界，画面展示风险层级 |
| 07 | Terminal／Connection | JSON 字段分流 | 口播讲字段用途，画面显示取值路径 |
| 08 | Comparison | 追加与替换两条路径 | 口播讲差异，画面表现保留与移除 |
| 09 | Terminal／Decision | 退出码分支 | 口播讲判断，画面展示脚本反应 |
| 10 | StepList／Table | 分类速查表 | 口播讲查阅方式，画面提供索引 |
| 11 | Terminal／StepList | 四步 headless 链路 | 口播逐步推进，画面逐步完成 |
| 12 | Summary | CLI 关系链与下一篇预告 | 口播收束，画面保留预告卡片 |

## Gate 1 内部审查结论

- 12 个 Scene 均有单一主要认知任务、明确 Video Value 和对应视觉类型。
- Scene 顺序遵循“问题 → 概念 → 选择 → 转折 → 数据流 → 控制 → 判断 → 实操 → 总结”的认知路径。
- 每个 Scene 的画面文字均来自指定文章或当前生产资料，不借用其他视频的业务语义。
- Scene 12 已同时承担总结和下一篇预告，符合系列结尾规则。

**结论：Scene Script 通过 Gate 1。**

