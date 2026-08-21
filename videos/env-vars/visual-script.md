# Claude Code 环境变量 · Visual Script

## 全局视觉原则

### 1. 画面展示控制关系，不重复口播

旁白解释环境变量为什么有用、各类设置如何选择；画面展示设置范围、文件归属、变量分组、覆盖关系和验证状态。不要把整段口播铺成静态文字卡。

### 2. 一个 Scene 一个视觉中心

9 个 Scene 分别只承担重复成本、启动读取、范围、归属、变量地图、重启、优先级、验证、总结预告。每幕只突出一个主流程或关系。

### 3. 视觉语言

- 16:9 横屏，深色终端／配置台风格。
- 背景深蓝黑，主文字白色，连接使用蓝绿色，警告使用黄色或红色。
- 终端、配置文件、范围条、状态卡和优先级阶梯采用统一边框。
- 主标题保持 1–2 行，变量名使用等宽字体，辅助说明保持短句。
- 只使用 Source 中出现的命令、变量、默认值和系列预告；「当前终端」「项目共享」等标签只是对原文分类的结构化转述。

### 4. 动画规则

- 优先使用循环、读入、分流、范围扩展、归属移动、覆盖、重启和值变化。
- 当前变量高亮，未讲变量降低透明度。
- 不使用无意义粒子、旋转或装饰性弹跳。
- 每次状态变化留出读完变量名和结果的时间。

## Scene 01｜每次都要重新拨

### 视觉目标

用两个连续会话展示同一组设置在每次打开时被重新拨动。

### 画面结构

左右两个终端窗口，左侧显示 `/model` 和 `API_TIMEOUT_MS`，右侧重新出现同样的设置；底部显示 `每次重新设置`。

### 动画

第一个终端出现设置，随后会话关闭、设置退回未设置状态，第二个终端再出现同样动作，循环箭头短暂亮起。

### 口播互补

声音描述重复劳动，画面只展示「出现 → 重置 → 再出现」。

### 屏幕文字

`/model`、`API_TIMEOUT_MS`、`DISABLE_TELEMETRY`、`每次重新设置`

### Visual Type

UI Simulation / Process Loop

## Scene 02｜启动时读入的总开关

### 视觉目标

建立环境变量是启动时读入的控制层。

### 画面结构

左侧 shell，中央 `ENV` 变量栈，右侧 Claude Code 启动窗口；右侧分出连接、认证、超时、隐私四个节点。

### 动画

变量从左侧进入 `ENV`，在启动瞬间被读入 Claude Code，四个行为节点依次亮起。

### 口播互补

声音给定义，画面证明变量从配置入口流向启动行为。

### 屏幕文字

`ENV`、`启动时读取`、`连接`、`认证`、`超时`、`隐私`

### Visual Type

Concept Diagram / Connection Diagram

## Scene 03｜三种设置范围

### 视觉目标

通过范围大小理解三种设置方式。

### 画面结构

横向三段范围轴：`当前终端`、`这台机器`、`跟配置走`，下方分别放 `export`、`~/.zshrc`、`settings.json` 的 `env`。

### 动画

范围从当前终端扩展到机器级，再切换为配置文件边界；三段最后同时停留。

### 口播互补

声音解释适用场景，画面用范围宽度和边界变化建立选择直觉。

### 屏幕文字

`export`、`~/.zshrc`、`settings.json`、`env`、`当前终端`、`这台机器`、`跟配置走`

### Visual Type

Comparison / Scope Diagram

## Scene 04｜四类 settings.json

### 视觉目标

把文件路径和影响对象绑定，并显式展示 git 边界。

### 画面结构

中央变量卡通向四个文件卡：`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`托管设置`；各卡下方显示对象和 git 状态。

### 动画

四个文件卡从个人到组织展开；私有地址进入项目共享文件的路径被红线阻断，回到 `.local`。

### 口播互补

声音讲归属和风险，画面演示个人变量回到本地文件。

### 屏幕文字

`进入 git`、`不进入 git`、`你`、`项目所有人`、`组织`

### Visual Type

UI Simulation / Ownership Diagram

## Scene 05｜四组常用开关

### 视觉目标

用用途地图代替完整变量清单。

### 画面结构

四个区域：连接与认证、超时、隐私遥测、多账号与上下文。超时区域显示 `API_TIMEOUT_MS 600000` 和 `BASH_DEFAULT_TIMEOUT_MS 120000`。

### 动画

四组依次亮起，变量卡进入对应区域，最后 `CLAUDE_CONFIG_DIR` 和 `DISABLE_AUTO_COMPACT` 出现。

### 口播互补

声音解释用途，画面提供可扫读的索引，不逐条复述。

### 屏幕文字

`ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL`、`ANTHROPIC_MODEL`、`API_TIMEOUT_MS`、`600000`、`BASH_DEFAULT_TIMEOUT_MS`、`120000`、`DISABLE_TELEMETRY`、`DO_NOT_TRACK`、`CLAUDE_CONFIG_DIR`、`DISABLE_AUTO_COMPACT`

### Visual Type

Concept Map / UI Simulation

## Scene 06｜改了，为什么没变化

### 视觉目标

通过两个会话的数值差异解释启动时读取。

### 画面结构

左侧旧会话结果为 `120000`，中间为 `退出 → 重新打开`，右侧新会话结果为 `300000`。

### 动画

旧会话保持旧值；外部配置改为新值但旧会话不变；重启后右侧读到 `300000`。

### 口播互补

声音解释原因，画面用数值不变和数值更新证明时机。

### 屏幕文字

`旧会话`、`新会话`、`120000`、`300000`、`启动时读取`、`重启 Claude Code`

### Visual Type

Process / State Transition

## Scene 07｜谁说了算

### 视觉目标

先建立通则，再用模型配置例外反转。

### 画面结构

第一层为 `settings.json 的 model` → `ANTHROPIC_MODEL`；顶部再插入 `/model` 和 `--model`。

### 动画

`ANTHROPIC_MODEL` 压过设置字段；标题切换为模型配置例外；会话命令进入顶层并覆盖变量。

### 口播互补

声音说规则和例外，画面让覆盖动作成为证据。

### 屏幕文字

`环境变量 > 设置字段`、`/model`、`--model`、`ANTHROPIC_MODEL`、`model`、`模型配置例外`

### Visual Type

Decision Diagram / Priority Stack

## Scene 08｜最小验证闭环

### 视觉目标

把临时设置和持久化分开验证。

### 画面结构

六步流程：默认 `120000` → `export BASH_DEFAULT_TIMEOUT_MS="300000"` → `claude` → 读到 `300000` → 关闭终端回到 `120000` → `.claude/settings.local.json`。

### 动画

默认卡出现，终端执行 export，新会话结果变为 `300000`，新终端恢复 `120000`，最后把值移入本地设置并显示长期生效。

### 口播互补

声音带观众做实验，画面保留命令、结果和状态。

### 屏幕文字

`claude`、`BASH_DEFAULT_TIMEOUT_MS`、`120000`、`300000`、`.claude/settings.local.json`

### Visual Type

Terminal Demo / Process

## Scene 09｜把开关拨在正确的位置

### 视觉目标

收束选择原则，并把下一篇预告作为最后视觉事件。

### 画面结构

中央总开关显示 `先试，再固化`；周围为 `当前终端`、`机器配置`、`项目本地`；底部警示 `个人凭据不进 git`，最后切换到 `下一篇：Git 工作流`。

### 动画

范围卡依次亮起，总开关变绿；个人凭据进入项目共享文件的路径被阻断；总结卡淡出，只留下下一篇预告。

### 口播互补

声音做结论并提出下一篇问题，画面用最后一张预告卡连接系列。

### 屏幕文字

`先试，再固化`、`按范围选择`、`个人凭据不进 git`、`下一篇：Git 工作流`

### Visual Type

SummaryScene / Preview Card

## 全片视觉类型、组件与动画标准

### 视觉类型

- UI Simulation：终端、设置文件和会话窗口。
- Scope Diagram：设置范围和影响对象。
- Concept Map：变量用途分组。
- Priority Stack：设置字段、环境变量和会话命令的覆盖关系。
- Terminal Demo：验证闭环。
- SummaryScene：总开关和下一篇预告。

### 组件标准

- `TerminalWindow`：窗口点、命令行、输出和状态。
- `ConfigCard`：文件路径、变量和值。
- `ScopeLane`：影响范围和生效时长。
- `VariableGroup`：分组标题、代表变量和默认值。
- `PriorityStep`：覆盖层级和箭头。
- `ProcessStep`：编号、命令、结果和状态。
- `PreviewCard`：总结或下一篇预告。

### 动画标准

- 进入：从配置源到 Claude Code 的短距离位移。
- 状态变化：旧值保持、新值替换、归属移动、红线阻断。
- 聚焦：当前变量亮色，未讲变量降低透明度。
- 收束：总结场景只保留少量卡片，并给预告留阅读停留。

## Gate 2 内部审查

- [x] 9 个 Scene 与 Scene Script、Narration Script 一一对应。
- [x] 每个 Scene 的正文只有实际口播，无视觉说明、制作备注或检查清单。
- [x] 画面与口播互补，没有把口播全文复制到画面。
- [x] 所有画面命令、变量、数值、路径和预告可追溯到 Source 或前置资料。
- [x] 结构沿用基线：全局原则 → 逐 Scene 设计 → 全片类型／组件／动画标准 → Gate 2。
- [x] 原型可用纯 HTML、CSS、少量 JavaScript 展示，无外部依赖。
- [x] 不生成 TTS Script、音频、字幕、Timeline 或 Remotion 资料。

Gate 2 结论：通过，完成 Visual Prototype 后停止，不进入 TTS 或 Remotion。

