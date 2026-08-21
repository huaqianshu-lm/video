# VS Code 集成视频化 · 第三步：Scene Script

## Scene 01｜Spark 图标去哪了？

### purpose

用一个真实且可复现的安装后阻塞抓住注意力，并给出最关键的第一条排查结论。

### narrativeRole

问题钩子。

### narrationIntent

说明扩展看似装好，却在空工作区找不到编辑器右上角 Spark；指出光打开文件夹不够，打开具体文件后入口才会出现。

### visualIntent

演示“空文件夹无入口”到“打开 demo.py 后入口出现”的状态变化。

### visualType

IDE Simulation

### keyOnScreenText

- Claude Code
- Spark
- 打开具体文件
- 光开文件夹不够

### videoValue

只有通过前后状态变化，观众才能直观看到“图标不是没装好，而是出现条件尚未满足”。

## Scene 02｜扩展和 CLI 是什么关系？

### purpose

建立两者共享引擎、配置和可恢复历史，同时明确能力差异。

### narrativeRole

概念建立与对比。

### narrationIntent

解释扩展不是 CLI 替代品，而是同一个后厨的另一扇点单窗口；指出 CLI 更完整，扩展更适合文件和改动审阅。

### visualIntent

让 CLI 和 VS Code 扩展两个窗口连接到同一个“共享配置／历史”核心，并用少量标签呈现差异。

### visualType

Comparison Diagram

### keyOnScreenText

- CLI
- VS Code 扩展
- 共享配置
- 可恢复历史
- 并排 diff
- 选中代码上下文
- 命令和 skills：全部／子集

### videoValue

连接线和能力标签能把“同一个引擎、不同窗口”变成结构化直觉，避免观众把扩展和 CLI 当成两个互斥产品。

## Scene 03｜安装官方扩展，找不到入口就这样查

### purpose

把文章中的安装方式和 Spark 排查动作压缩成一条可执行路径。

### narrativeRole

问题解决与操作清单。

### narrationIntent

说明 VS Code 1.98.0 以上、认准 Anthropic 发布者，以及应用市场、直装链接和其他编辑器分支三种入口；随后按顺序排查图标。

### visualIntent

先突出官方发布者，再让排查清单逐项亮起，最后显示活动栏、状态栏和命令面板三个备用入口。

### visualType

Step List + IDE Simulation

### keyOnScreenText

- VS Code ≥ 1.98.0
- Anthropic
- Cmd+Shift+X
- vscode:extension/anthropic.claude-code
- 打开文件
- Developer: Reload Window
- 信任工作区
- 活动栏 Spark
- ✱ Claude Code

### videoValue

步骤的先后关系和入口位置需要通过逐项点亮与界面状态变化来记忆，静态文字列表不如过程清楚。

## Scene 04｜并排 diff：看清了再点头

### purpose

展示扩展相对终端文本 diff 的核心图形优势，并保留用户审阅和修改权。

### narrativeRole

第一个价值证明。

### narrationIntent

解释红绿改动让原稿和建议版并排对质；用户可以接受、拒绝，或在接受前直接改正建议。

### visualIntent

模拟 demo.py 的原始代码、Claude 建议的 f-string 和类型注解、手动修正后的右侧代码，最后展示接受动作。

### visualType

Diff Review

### keyOnScreenText

- 原稿
- 建议改动
- 手动修正
- 接受
- 拒绝
- def greet(name: str) -> str:
- return f"Hello {name}"

### videoValue

改动颜色、左右对照和接受前的手动修改，是图形界面才能高效表达的审阅过程。

## Scene 05｜@ 提及和选中代码：把上下文喂准

### purpose

展示如何减少 Claude 猜测文件和代码范围的成本。

### narrativeRole

第二个价值证明。

### narrationIntent

解释输入 @ 可模糊匹配文件或文件夹；直接选中代码时，Claude 自动看到选中内容；Option+K／Alt+K 可插入带行号的引用。

### visualIntent

让 @auth、@src/components/ 和选中的两行 greet 函数依次进入提示框，形成“上下文被准确喂入”的视觉因果。

### visualType

Context Injection

### keyOnScreenText

- @auth
- @src/components/
- 已选中 2 行
- Option+K／Alt+K
- 上下文更准确

### videoValue

文件标签和选中高亮进入提示框的动作，把抽象的“提供上下文”变成可观察的输入过程。

## Scene 06｜Plan Mode：先交方案，再动手

### purpose

建立大改动前先审阅计划的工作习惯，并强调用户保留判断权。

### narrativeRole

第三个价值证明与风险转折。

### narrationIntent

对比正常模式、Plan Mode 和自动接受模式；重点说明 Plan Mode 会先打开 Markdown 计划，用户可以逐条批注，确认后才执行。

### visualIntent

显示“给 demo.py 增加命令行参数支持”的请求，Plan Mode 生成步骤列表，用户在第二步旁边加入批注，最后状态变为“等待批准”。

### visualType

Plan Review

### keyOnScreenText

- 正常模式
- Plan Mode
- 自动接受模式
- 先看方案
- 第 2 步：引入 argparse
- 这里先确认参数入口
- 等待批准

### videoValue

计划文档、内联批注和批准前停顿能直接表达“先框住方向，再让 AI 执行”，比口播规则更有说服力。

## Scene 07｜10 分钟跑通最小练习

### purpose

把扩展入口、选中上下文、diff 审阅和 Plan Mode 串成一次最小闭环。

### narrativeRole

能力串联与操作验证。

### narrationIntent

从创建 vscode-claude-demo 和 demo.py 开始，依次打开工作区、登录、选中 greet、要求改成 f-string 并加类型注解、审阅 diff，再切到 Plan Mode 规划命令行参数。

### visualIntent

用一条状态时间线推进工作区、面板、代码选区、diff 和计划文档，不展示与文章无关的额外项目功能。

### visualType

Workflow Timeline

### keyOnScreenText

- mkdir vscode-claude-demo
- demo.py
- code .
- 已登录
- 已选中 2 行
- f-string + 类型注解
- diff：接受
- Plan Mode

### videoValue

完整状态链能证明前三个能力不是孤立功能，而是可以合成一条日常开发路径。

## Scene 08｜快捷键和切回 CLI

### purpose

留下可立即使用的快捷键，并明确何时切回终端。

### narrativeRole

工具箱与选择标准。

### narrationIntent

说明焦点切换、新对话、提及引用、恢复会话的常用快捷键；文件和改动留在扩展，批量命令、完整 skills 或 MCP 配置切到 CLI。

### visualIntent

左侧显示快捷键卡片，右侧显示“扩展／集成终端 CLI”的任务分流；用同一条历史连接线保持连续性。

### visualType

Shortcut Map + Comparison

### keyOnScreenText

- Cmd+Esc／Ctrl+Esc
- Option+K／Alt+K
- Cmd+Shift+T／Ctrl+Shift+T
- 文件与 diff → 扩展
- 命令、skills、MCP → CLI
- claude
- /ide

### videoValue

键位与任务分流需要并列展示，帮助观众把“知道功能”转为“知道下一步用哪个入口”。

## Scene 09｜同一套能力，按任务切换

### purpose

收束本篇结论，并加入系列规定的下一集预告。

### narrativeRole

结论与下一集预告。

### narrationIntent

总结扩展不替代 CLI：文件、上下文和改动审阅适合扩展；终端专属能力和完整配置适合 CLI。最后预告下一篇 JetBrains 集成。

### visualIntent

将“扩展”和“CLI”放到同一条工作流的两个入口，中央显示“按任务切换”，最后切换为下一集预告卡。

### visualType

Summary Scene

### keyOnScreenText

- 扩展 ≠ 替代 CLI
- 按任务切换
- 文件／上下文／diff
- 命令／skills／MCP
- 下一篇：09 JetBrains 集成

### videoValue

结论关系和下一集预告必须形成最后一个视觉事件，给观众留下可执行的选择标准和系列期待。

## Scene Script 总览

| Scene | 主要任务 | 类型 | 屏幕文字边界 |
| --- | --- | --- | --- |
| 01 | 解决 Spark 入口误判 | IDE Simulation | 只显示入口条件 |
| 02 | 解释扩展／CLI 关系 | Comparison Diagram | 只显示共同点和能力差异 |
| 03 | 完成安装排查 | Step List + IDE | 只显示 Source 中的版本、入口和排查项 |
| 04 | 审阅改动 | Diff Review | 只显示 demo.py 相关代码与动作 |
| 05 | 提供上下文 | Context Injection | 只显示 Source 中的提及和选中行为 |
| 06 | 审阅计划 | Plan Review | 只显示 Source 中的模式和练习任务 |
| 07 | 串联练习 | Workflow Timeline | 只显示 Source 中的命令和预期状态 |
| 08 | 快捷键与 CLI 分流 | Shortcut Map | 只显示 Source 中的快捷键和入口 |
| 09 | 结论与预告 | Summary Scene | 只显示本篇结论和下一集主题 |

## Gate 1 内部审查

- 每个 Scene 均包含 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText 和 videoValue 对应字段。
- Scene 顺序符合“问题 → 关系 → 排查 → 三个价值 → 闭环 → 选择 → 预告”的认知路径。
- Scene 07 的练习只复用 Source 中的 demo.py、greet、f-string、类型注解和命令行参数任务。
- Scene 09 的 JetBrains 内容只作为下一篇预告，没有提前读取或展开下一篇文章。
- 没有将参考视频中的业务语义或固定状态文字带入本片。

## 下一步

基于 Scene Script 冻结 9 个 Scene，生成纯口播 narration-script.md 和与旁白互补的 visual-script.md，再制作横屏 Visual Prototype。
