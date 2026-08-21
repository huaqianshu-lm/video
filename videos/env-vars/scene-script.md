# Claude Code 环境变量 · Scene Script

## Scene 01｜每次都要重新拨

- sceneId：`env-vars-01`
- title：每次都要重新拨
- purpose：展示手动重复设置的摩擦，建立学习动机。
- narrativeRole：问题钩子。
- narrationIntent：解释模型、超时和隐私偏好为什么会在新会话里反复出现。
- visualIntent：展示两个会话启动前后反复拨动同一组设置。
- visualType：UI Simulation / Process Loop
- keyOnScreenText：`/model`、`API_TIMEOUT_MS`、`DISABLE_TELEMETRY`、`每次重新设置`
- videoValue：循环和状态重置能直观传达重复成本。

## Scene 02｜启动时读入的总开关

- sceneId：`env-vars-02`
- title：启动时读入的总开关
- purpose：给环境变量一个简单、可记忆的定义。
- narrativeRole：核心概念建立。
- narrationIntent：说明环境变量是启动时读取的键值对，控制连接、认证、超时和隐私等行为。
- visualIntent：把变量从 shell 和 `settings.json` 汇入 Claude Code 启动入口，再分流到行为节点。
- visualType：Concept Diagram / Connection Diagram
- keyOnScreenText：`ENV`、`启动时读取`、`连接`、`认证`、`超时`、`隐私`
- videoValue：变量被读入并改变启动行为的关系需要动态连接。

## Scene 03｜三种设置范围

- sceneId：`env-vars-03`
- title：三种设置范围
- purpose：让观众按影响时长选择设置方式。
- narrativeRole：操作分类。
- narrationIntent：区分 shell 临时设置、shell 配置文件和 `settings.json` 的 `env`。
- visualIntent：用从窄到宽的范围轴展示终端、机器和配置文件的持续范围。
- visualType：Comparison / Scope Diagram
- keyOnScreenText：`export`、`~/.zshrc`、`settings.json`、`当前终端`、`这台机器`、`跟配置走`
- videoValue：范围是时间和对象的变化，范围轴比并排说明更直观。

## Scene 04｜四类 settings.json

- sceneId：`env-vars-04`
- title：四类 settings.json
- purpose：解释文件位置决定影响对象，并建立 git 安全边界。
- narrativeRole：风险边界。
- narrationIntent：说明四类设置分别管谁，个人凭据不要放进会提交的项目设置。
- visualIntent：让变量卡沿四个文件入口移动，显示对象和 git 标签。
- visualType：UI Simulation / Ownership Diagram
- keyOnScreenText：`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`托管设置`、`进入 git`、`不进入 git`
- videoValue：归属和 git 边界需要视觉分层。

## Scene 05｜四组常用开关

- sceneId：`env-vars-05`
- title：四组常用开关
- purpose：把长变量表压缩成四个可记忆的使用场景。
- narrativeRole：知识地图。
- narrationIntent：带观众认识连接认证、超时、隐私遥测、多账号与上下文四组变量和默认值。
- visualIntent：四个区域依次亮起，变量卡进入对应区域。
- visualType：Concept Map / UI Simulation
- keyOnScreenText：`ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL`、`ANTHROPIC_MODEL`、`API_TIMEOUT_MS`、`600000`、`BASH_DEFAULT_TIMEOUT_MS`、`120000`、`DISABLE_TELEMETRY`、`DO_NOT_TRACK`、`CLAUDE_CONFIG_DIR`
- videoValue：分组和亮起顺序帮助观众建立用途关系。

## Scene 06｜改了，为什么没变化

- sceneId：`env-vars-06`
- title：改了，为什么没变化
- purpose：解释环境变量的读取时机。
- narrativeRole：因果澄清。
- narrationIntent：说明只在启动时读变量，修改后要退出并重新打开。
- visualIntent：左侧旧会话保持 `120000`，右侧新会话启动后读到 `300000`。
- visualType：Process / State Transition
- keyOnScreenText：`旧会话`、`新会话`、`启动时读取`、`120000`、`300000`、`重启 Claude Code`
- videoValue：同一变量在两个会话状态中的差异必须按时间顺序展示。

## Scene 07｜谁说了算

- sceneId：`env-vars-07`
- title：谁说了算
- purpose：建立优先级通则并展示模型配置例外。
- narrativeRole：规则反转。
- narrationIntent：说明环境变量高于设置字段，但 `/model` 或 `--model` 会覆盖 `ANTHROPIC_MODEL`。
- visualIntent：先让环境变量压过 `settings.json`，再让会话指令进入顶层。
- visualType：Decision Diagram / Priority Stack
- keyOnScreenText：`环境变量 > 设置字段`、`/model`、`--model`、`ANTHROPIC_MODEL`、`model`
- videoValue：覆盖关系用动态阶梯表达最清楚。

## Scene 08｜最小验证闭环

- sceneId：`env-vars-08`
- title：最小验证闭环
- purpose：把抽象规则变成可复用的安全验证方法。
- narrativeRole：实战证明。
- narrationIntent：从默认值开始，临时设置 `300000`，在新会话读取，关闭终端后确认恢复，再写入本地设置。
- visualIntent：按顺序显示默认、临时值、恢复和持久化四个状态。
- visualType：Terminal Demo / Process
- keyOnScreenText：`claude`、`BASH_DEFAULT_TIMEOUT_MS`、`120000`、`export ...=300000`、`300000`、`settings.local.json`
- videoValue：验证闭环的价值来自状态变化和可观察结果。

## Scene 09｜把开关拨在正确的位置

- sceneId：`env-vars-09`
- title：把开关拨在正确的位置
- purpose：收束环境变量的选择原则并引出系列下一篇。
- narrativeRole：总结与下一集预告。
- narrationIntent：总结先临时试、再按影响范围持久化，带凭据的设置不要进 git，最后预告 Git 工作流。
- visualIntent：总开关收束后，最后出现 `下一篇：Git 工作流` 卡片。
- visualType：SummaryScene / Preview Card
- keyOnScreenText：`先试，再固化`、`按范围选择`、`个人凭据不进 git`、`下一篇：Git 工作流`
- videoValue：总结和预告需要明确停留与最后一次视觉变化。

## Gate 1 字段审查

- [x] 9 个 Scene 均包含规范要求的九个字段。
- [x] Scene 顺序覆盖定义、三种方式、四类文件、变量分组、启动时机、优先级和验证闭环。
- [x] 每个 Scene 只有一个主要认知任务。
- [x] Scene 09 的下一集预告是最后视觉事件。
- [x] 所有命令和变量均来自 Source 或结构化转述，不执行。

