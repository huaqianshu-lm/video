# Claude Code 视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 画面不能只是重复口播

旁白解释 CLI 的意义和使用选择，画面展示命令如何拆解、数据如何流动、参数如何加边界、状态如何返回。屏幕不全文显示口播。

### 2. 视觉承担“证明”和“演示”

- 命令与标志：用分层高亮证明语法角色。
- 会话恢复：用最近／指定两条路线演示选择。
- headless：用窗口消失、结果输出、提示符返回演示运行方式变化。
- 管道：用输入文件、stdin、Claude、输出文件的箭头演示数据方向。
- JSON：用字段被 `jq` 提取演示结构化输出的用途。
- 退出码：用 `0`／`1` 分支演示脚本是否继续。

### 3. 一个 Scene 只表达一个视觉中心

12 个 Scene 依次使用入口地图、语法拆解、会话分岔、模式对比、数据流、控制面板、字段分流、提示替换、退出码分支、速查表、终端实操和总结链路。每幕只推动其中一个认知变化。

### 4. 少做“页面”，多做“过程”

画面优先使用终端输入、连线、替换、展开、提取、状态变色和逐项完成。标志全集只在 Scene 10 使用表格，因为它本身承担“查阅入口”的功能。

### 5. 动画必须有意义

- 一级信息动画：命令分段、管道流动、参数挂载、JSON 字段抽取、退出码分支、四步完成。
- 二级注意力动画：当前字段或危险权限的高亮，其他信息降暗。
- 三级装饰动画：只保留轻微光晕和状态闪烁，不添加无关粒子或旋转。

## Scene 01｜你敲的不是一个入口

### 视觉目标

把“单独的 `claude`”扩展成一条可编排 CLI 能力轨道。

### 画面结构

- 中央终端提示符：`$ claude`。
- 右侧依次出现四个节点：`command`、`flag`、`pipe`、`exit code`。
- 终端窗口从单一交互框变为横向工作流轨道。

### 动画

先出现命令，再沿线依次点亮四个节点；最后所有节点连接到“可编排 CLI”。

### 屏幕文字

`claude`、`command`、`flag`、`pipe`、`exit code`、`可编排 CLI`

### Visual Type

OpeningScene／Concept Diagram

### 口播与画面互补

口播提出“只会光敲一个 `claude`”的误区，画面直接展示它背后的四种能力。

## Scene 02｜一行命令拆成两样

### 视觉目标

让观众看到 command 与 flag 在命令行中的不同位置和职责。

### 画面结构

上方显示 `claude update`，按程序／子命令切成两段；下方显示 `claude -p "解释这个函数" --model sonnet`，按程序／标志／参数分层。

### 动画

先从整行扫描到 `claude`，再把 `update`、`-p`、`--model` 分别高亮；右侧浮出“子动作／勾选框”。

### 屏幕文字

`claude update`、`claude -p "解释这个函数" --model sonnet`、`command = 子动作`、`flag = 调整方式`

### Visual Type

ConceptScene／Code Exploration

### 口播与画面互补

口播负责类比和解释，画面负责证明同一行文本如何被拆成层级。

## Scene 03｜最近还是指定

### 视觉目标

用选择分岔建立 `-c`、`-r` 和 `--name` 的使用直觉。

### 画面结构

- 中央节点：`claude session`。
- 左路：`-c / --continue` → `当前目录最近`。
- 右路：`-r / --resume` → `ID 或名字`。
- 上方标签：`--name login-refactor` → `可恢复名称`。
- 侧边维护栏：`update`、`install`、`auth login`、`auth status`。

### 动画

先出现会话节点，再按“最近／指定”分岔；名字标签落到右路，维护命令从侧边独立亮起。

### 屏幕文字

`-c = 最近`、`-r = 指定`、`--name`、`update`、`install`、`auth status`

### Visual Type

ComparisonScene／Task Routing

### 口播与画面互补

口播讲选择条件，画面用两条恢复路线展示差异。

## Scene 04｜`-p` 把 Claude 变成 headless 零件

### 视觉目标

明确表现交互模式和 headless 模式的运行结果不同。

### 画面结构

- 左侧交互窗口：`$ claude`，显示输入框和“等待下一句”。
- 右侧终端：`$ claude -p "解释这个函数"`，输出一行结果，底部出现 `$`。
- 中央标签：`interactive → headless`。

### 动画

左侧保留对话框，右侧从命令输入到结果输出快速完成；最后右侧提示符返回并高亮 `result → exit`。

### 屏幕文字

`claude`、`claude -p`、`interactive`、`headless`、`result → exit`

### Visual Type

ComparisonScene／TerminalScene

### 口播与画面互补

口播解释 headless 的含义，画面展示“没有聊天界面，输出后退出”的状态变化。

## Scene 05｜stdin 把 Claude 接进流水线

### 视觉目标

让数据从文件或 diff 流过 Claude，再流向下游目标。

### 画面结构

```text
build-error.txt ─┐
git diff main ───┼→ stdin → claude -p → output.txt / lint:claude
```

右下角单独显示 `10MB input limit`，不抢主流程。

### 动画

两份输入沿箭头汇入 stdin；Claude 节点亮起后，结果分成文件输出和 linter 两路。

### 屏幕文字

`build-error.txt`、`git diff main`、`stdin`、`claude -p`、`output.txt`、`lint:claude`、`10MB`

### Visual Type

TerminalScene／Connection Diagram

### 口播与画面互补

口播说明管道的用法和上限，画面证明“上一道工序喂料，下一道工序接结果”。

## Scene 06｜一趟调用的控制面板

### 视觉目标

把调用控制项表现为逐层加上的护栏。

### 画面结构

中心命令：`claude -p`。外围依次挂载：

1. `--model sonnet`
2. `--permission-mode plan`
3. `--add-dir ../lib`
4. `--allowedTools Bash,Read,Edit`
5. `--max-turns 3`／`--max-budget-usd 5.00`

右侧红色隔离区：`--dangerously-skip-permissions`。

### 动画

参数从左到右依次挂载；控制面板变得更具体；危险开关出现时整条边界变红并显示 `慎用`。

### 屏幕文字

`--model`、`--permission-mode`、`--add-dir`、`--allowedTools`、`--max-turns`、`--max-budget-usd`、`--dangerously-skip-permissions`

### Visual Type

ConceptScene／Decision Diagram

### 口播与画面互补

口播说明各参数控制哪一层，画面把参数变成实际边界，不把危险开关演成默认路径。

## Scene 07｜JSON 让脚本接住结果

### 视觉目标

展示结构化结果如何被不同下游字段消费。

### 画面结构

- 左侧命令：`claude -p ... --output-format json`。
- 中央 JSON：`result`、`session_id`、`total_cost_usd`。
- 右侧三路：`jq -r '.result'`、`--resume $session_id`、`cost`。

### 动画

JSON 对象展开后，三个字段依次被抽出；`.result` 变成干净文本，`.session_id` 连到下一次 `--resume`。

### 屏幕文字

`--output-format json`、`.result`、`.session_id`、`total_cost_usd`、`jq -r '.result'`、`--resume`

### Visual Type

TerminalScene／Connection Diagram

### 口播与画面互补

口播解释字段用途，画面用分流证明 JSON 是脚本接口而不是单纯的打印格式。

## Scene 08｜追加提示还是整套替换

### 视觉目标

让 `append` 和 `system` 的边界差异一眼可见。

### 画面结构

左右两块同源面板：

- 绿色：`default system prompt` + `--append-system-prompt` → `security review`，默认层保留。
- 红色：`--system-prompt` → `custom prompt`，默认层被替换并标记 `tools／security instructions removed`。

### 动画

绿色提示条叠加在默认层末尾；红色路径将默认层整体滑出，形成保留／替换的明确对比。

### 屏幕文字

`--append-system-prompt`、`--system-prompt`、`default system prompt`、`security instructions`

### Visual Type

ComparisonScene／Decision Diagram

### 口播与画面互补

口播讲多数场景优先追加，画面展示替换会移除默认边界的风险。

## Scene 09｜退出码是脚本的成绩单

### 视觉目标

用一个命令的结果把 shell 分支和后续动作连起来。

### 画面结构

终端依次显示：

```text
$ claude auth status
$ echo $?
0
```

随后切换为 `1`，红色箭头指向：`未登录，终止`。底部补充 `||`。

### 动画

先显示成功分支，再重放为失败分支；脚本节点根据数字改变颜色和去向。

### 屏幕文字

`claude auth status`、`echo $?`、`0 = success`、`1 = not logged in`、`||`、`未登录，终止`

### Visual Type

TerminalScene／Decision Diagram

### 口播与画面互补

口播解释退出码是给脚本看的数字，画面展示数字如何改变流程。

## Scene 10｜标志全表是查阅工具

### 视觉目标

把大量标志压缩成可导航的分类参考板。

### 画面结构

五个分组行：

- 启动与会话：`-p`、`-c`、`-r`、`--name`
- 模型与权限：`--model`、`--permission-mode`、`--allowedTools`
- 目录与配置：`--add-dir`、`--settings`、`--mcp-config`、`--bare`
- headless 输出与控制：`--output-format`、`--max-turns`、`--max-budget-usd`
- 杂项：`--version`、`--ide`、`--debug`

右上角贴纸：`查，不背`；底部提示：`--help 不全`。

### 动画

分组从上到下依次展开，当前脚本相关项短暂高亮；最后出现 CLI 参考文档入口提示。

### 屏幕文字

五个分组名、代表标志、`查，不背`、`--help 不全`

### Visual Type

StepListScene／Reference Table

### 口播与画面互补

口播讲查阅策略，画面提供可扫描的索引，不试图让观众在一幕内背完全集。

## Scene 11｜四步跑通 headless

### 视觉目标

以终端状态变化完成文章中的四步练习。

### 画面结构

一个固定终端窗口，四条执行记录按顺序加入：

1. `claude -p "..."` → `result`
2. `cat buggy.py | claude -p` → `input received`
3. `--output-format json | jq -r '.result'` → `clean text`
4. `claude auth status` → `echo $?` → `0 / 1`

### 动画

每条命令完成后变成绿色完成状态，下一条从提示符开始；第四条完成后四个节点连接为 `automation foundation`。

### 屏幕文字

`1 claude -p`、`2 cat buggy.py | claude -p`、`3 json | jq`、`4 auth status + $?`、`automation foundation`

### Visual Type

TerminalScene／StepListScene

### 口播与画面互补

口播按四步解释动作和预期，画面展示命令真的从输入走向结果。

## Scene 12｜从聊天窗口到流水线零件

### 视觉目标

完成核心关系链，并将下一篇作为最后一个视觉事件。

### 画面结构

中央关系链：

`命令` → `标志` → `stdin` → `claude -p` → `JSON / jq` → `退出码` → `脚本下一步`

下方总结卡片：`从聊天窗口到流水线零件`。

最后替换为预告卡：`下一篇 35 · 控制与模式`，副标题为 `plan · acceptEdits · bypassPermissions`。

### 动画

关系链从左到右点亮；总结卡停留；最后预告卡淡入并保持约 2–3 秒的可读空间，避免与底部画面提示重叠。

### 屏幕文字

`命令`、`标志`、`stdin`、`claude -p`、`JSON / jq`、`退出码`、`脚本下一步`、`35 · 控制与模式`、`plan · acceptEdits · bypassPermissions`

### Visual Type

SummaryScene／Connection Diagram

### 口播与画面互补

口播总结使用方式的改变和下一篇问题，画面用关系链与预告卡完成记忆收束。

## 全片视觉类型／组件／动画标准

### 视觉类型分布

- Opening／Concept Diagram：Scene 01
- Concept／Code Exploration：Scene 02
- Comparison／Task Routing：Scene 03
- Comparison／Terminal：Scene 04
- Terminal／Connection Diagram：Scene 05、07
- Concept／Decision Diagram：Scene 06
- Comparison／Decision Diagram：Scene 08
- Terminal／Decision Diagram：Scene 09
- StepList／Reference Table：Scene 10
- Terminal／StepList：Scene 11
- Summary／Connection Diagram：Scene 12

### 组件层建议

- `TerminalWindow`：统一终端外壳、提示符、命令和输出。
- `CommandToken`：程序、命令、标志、参数的不同高亮。
- `FlowNode`／`FlowArrow`：stdin、Claude、JSON 和下游脚本的连线。
- `FlagRail`：模型、权限、目录、工具和限制参数的护栏排列。
- `StatusBadge`：`result`、`0`、`1`、`BLOCKED` 等状态。
- `ReferenceTable`：Scene 10 的分类速查板。
- `SummaryCard`／`PreviewCard`：总结和下一篇预告。

### 动画标准

- 命令拆解使用扫描和分段高亮。
- 管道使用单向流动，箭头方向始终与数据方向一致。
- JSON 字段使用抽取和分流，不让字段凭空出现。
- 退出码使用颜色和分支，但不使用无意义跳动。
- 危险参数只使用红色隔离和边界提示，不用夸张闪烁。
- 总结和下一篇预告使用淡入与停留，不与底部原型提示重叠。

## Gate 2 内部审查结论

- `narration-script.md` 的每个 Scene 下只有实际口播，没有视觉说明、制作备注或检查清单。
- 视觉脚本与口播逐 Scene 对齐，声音负责解释，画面负责演示／证明。
- 画面文字均能追溯到 `source.md`、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；未带入其他视频的业务语义。
- 视觉原型将实现 12 个 Scene、16:9 横屏、场内提示、上一幕／下一幕／自动播放和进度提示；这些交互只属于原型，不属于 TTS、Timeline 或正式输出。
- 已保留文章中的下一篇预告，并将其作为最后一个视觉事件。

**结论：Gate 2 文案与视觉设计通过，可生成并检查 Visual Prototype；本任务到此停止，不进入 TTS 或 Remotion。**

## 下一步

仅在用户确认 Visual Prototype 后，才考虑进入正式 Remotion 实现；当前不生成 `tts-script.json`、音频、字幕、Timeline 或 `src/videos/` 文件。

