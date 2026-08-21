# JetBrains 集成视频化 · 第五步：Visual Script

> 目标：基于 Scene Script 和 Narration Script，明确 JetBrains 这条视频的视觉表达。声音解释，画面证明；原型阶段只验证横屏构图、信息密度、状态变化和 Scene 之间的统一性。

## 全局视觉原则

### 1. 声音解释，画面证明

旁白解释 JetBrains 插件为什么不同、两种连接方式怎么选、三个坑的根因是什么。画面展示 IDE、终端、插件桥、连接状态、焦点变化和 diff 位置变化。

### 2. 一个 Scene 只有一个视觉中心

每幕只保留一个主要事件：入口对照、桥接、安装、连接、能力流动、diff 设置、排障、最小任务或结论预告。快捷键和辅助标签只服务于主事件。

### 3. 界面模拟优先表达状态

用 JetBrains 深色 IDE、集成终端、Marketplace、设置页和 diff 查看器模拟真实状态。界面名称采用 Source 中出现的菜单和功能词，不加入其他视频的固定文案。

### 4. 屏幕文字保持可追溯

主要文字只使用 Source、Scene Script 和 Narration 中已有的产品名、命令、快捷键、状态和总结语句。画面不显示“本段目的”“Gate”“制作备注”等内部文字。

### 5. 动画表达因果

桥上的信息流表达 IDE 与 CLI 接通；步骤点亮表达安装顺序；`terminal` 变成 `auto` 表达 diff 位置变化；排障卡分叉表达三个问题的责任边界；diff 左右变化表达审阅价值。

# Scene 01｜JetBrains 是不是二等公民？

## 视觉目标

让观众在第一幕直接看到 VS Code 与 JetBrains 的入口差异，同时保留“核心体验？”这个悬念。

## 画面结构

16:9 深色工作台左右分栏。左侧是 VS Code 的独立图形面板，右侧是 JetBrains IDE，底部展开 Terminal 标签。中央只放一个小问题标记。

## 动画顺序

1. VS Code 独立图形面板先出现。
2. JetBrains IDE 打开，焦点落到内置终端。
3. 两侧入口标签短暂高亮。
4. 中央显示“核心体验？”后停留。

## 主要屏幕文字

```text
JetBrains 集成
VS Code：独立图形面板
JetBrains：IDE 内置终端
核心体验？
```

## 声音与画面互补

声音提出“是不是二等公民”的疑问，画面只证明两种入口形态不同，不提前给出完整结论。

## Visual Type

`Comparison + UI Simulation`

# Scene 02｜插件是一座桥，不是聊天面板

## 视觉目标

用一个连接结构建立正确心智模型。

## 画面结构

左侧是 JetBrains IDE，中间是 `JetBrains Plugin` 桥，右侧是 `Claude Code CLI` 终端。上方从 IDE 流向 CLI 的标签是“选区”“诊断”，下方从 CLI 回到 IDE 的标签是“改动”“diff”。

## 动画顺序

1. IDE 和 CLI 先分别出现。
2. Plugin 桥从中间展开，连接两端。
3. 选区和诊断沿上方箭头进入终端。
4. 改动沿下方箭头回到 IDE，diff 查看器亮起。

## 主要屏幕文字

```text
IDE
JetBrains Plugin
Claude Code CLI
选区 · 诊断
改动 · diff
对话在终端，diff 回 IDE
```

## 声音与画面互补

声音解释插件不是独立面板，画面用双向流动证明它的工作是接通两边。

## Visual Type

`Connection Diagram + Concept Diagram`

# Scene 03｜CLI、插件、重启：安装前提链

## 视觉目标

让观众记住安装不是只搜一次插件，而是 CLI、插件和完全重启的连续前提。

## 画面结构

上方是三个连续状态节点：`claude --version`、Marketplace 中的 `Claude Code [Beta]`、`Restart IDE`。下方是一条 IDE 家族标签带，作为支持范围提示，不展开成名单墙。

## 动画顺序

1. 终端输入 `claude --version`，版本状态变为可用。
2. Marketplace 搜索 Claude Code，Install 按钮变为 Installed。
3. IDE 窗口完全关闭再打开，Tools 菜单出现 Claude Code `[Beta]`。
4. 支持名单标签依次淡入后收起。

## 主要屏幕文字

```text
claude --version
Claude Code [Beta]
Install → Installed
完全重启 IDE
IntelliJ IDEA · PyCharm · WebStorm · PhpStorm · GoLand · Android Studio
```

## 声音与画面互补

声音讲前提和顺序，画面展示每一步的状态完成，不重复显示整段安装说明。

## Visual Type

`Process + Step List + UI Simulation`

# Scene 04｜从哪里启动，决定怎么连接

## 视觉目标

让“内置终端自动连”和“外部终端 `/ide` 手动连”成为两个清晰的操作路径。

## 画面结构

画面左右两列。左列是 JetBrains 内置 Terminal，命令 `claude` 直接连到 IDE；右列是外部终端，先运行 `claude`，再出现 `/ide` 和 IDE 选择器。底部两列共同汇聚到 `project root`。

## 动画顺序

1. 左列 `claude` 输入后自动出现 Connected。
2. 右列 `claude` 输入后停留，随后输入 `/ide`。
3. IDE 选择器亮起，连接线接回 JetBrains。
4. 底部 `project root` 同时点亮，形成共同前提。

## 主要屏幕文字

```text
IDE 内置终端
claude
自动激活

外部终端
claude → /ide
手动选择 IDE

project root
```

## 声音与画面互补

声音解释选择条件和目录前提，画面展示自动与手动连接的差别。

## Visual Type

`Process + Decision Diagram`

# Scene 05｜接通后，核心能力怎么流动

## 视觉目标

用一次具体选区到 diff 的过程，证明五项集成功能不是静态功能表。

## 画面结构

主画面是 PyCharm 风格 IDE 和底部 Claude 终端。编辑器选中 `greet` 函数，终端出现提问；右侧依次出现 `Diagnostics`、`@src/auth.ts#L1-99` 和 `Diff` 状态。顶部只放两个快捷键标签。

## 动画顺序

1. `Cmd/Ctrl+Esc` 让焦点从编辑器移到终端。
2. `greet` 函数高亮，选区标签进入提示区。
3. 一条 lint 诊断从 IDE 进入终端。
4. `Cmd+Option+K / Alt+Ctrl+K` 与文件引用短暂亮起。
5. 改动结果回到 IDE，Diff 面板展开。
6. 右上角用极简标签对照 JetBrains 内置终端与 VS Code 独立图形面板。

## 主要屏幕文字

```text
Cmd/Ctrl+Esc
Cmd+Option+K / Alt+Ctrl+K
@src/auth.ts#L1-99
选区共享 · 诊断共享 · Diff
JetBrains：IDE 内置终端
VS Code：独立图形面板
```

## 声音与画面互补

声音解释功能和快捷键差异，画面只展示上下文进入终端、改动回到 IDE 的实际流动。

## Visual Type

`Demo + UI Simulation + Comparison`

# Scene 06｜把 diff 从终端搬进 IDE

## 视觉目标

把 `auto` 变成一个看得见的配置效果。

## 画面结构

左侧为终端文本 diff，右侧为尚未打开的 IDE diff 区域。中央弹出 `/config` 菜单，`terminal` 和 `auto` 两个选项清晰分开。

## 动画顺序

1. `demo.py` 改动先以终端文本形式出现。
2. 输入 `/config`，diff tool 菜单展开。
3. 选择从 `terminal` 到 `auto`。
4. 同一份修改从左侧移动到右侧 IDE diff viewer。
5. “看清了再接受”作为收尾提示出现。

## 主要屏幕文字

```text
/config
diff tool
terminal → auto
IDE diff viewer
看清了再接受
```

## 声音与画面互补

声音说明配置取值和插件命令路径，画面集中证明 `auto` 改变的是 diff 的查看位置。

## Visual Type

`UI Simulation + State Change`

# Scene 07｜三个 JetBrains 专属坑

## 视觉目标

让观众看到三个问题分别属于快捷键、网络和远程主机，而不是一个模糊的“插件坏了”。

## 画面结构

三列排障卡从暗到亮：ESC 卡显示终端焦点，WSL2 卡显示 Windows IDE 与 WSL 之间断开的网络线，Remote Development 卡显示本地客户端与远程主机两台机器，插件落在远程侧。

## 动画顺序

1. ESC 卡先亮起，焦点箭头从终端误跳到编辑器，再被取消。
2. WSL2 卡亮起，连接线被防火墙挡住，随后显示“检查 NAT / 防火墙”。
3. Remote Development 卡亮起，插件从本地客户端移动到 `Plugin (Host)`。
4. 三张卡同时显示各自的第一处理方向。

## 主要屏幕文字

```text
ESC 中断失灵
取消 Escape → 编辑器焦点
WSL2：No available IDEs detected
检查 NAT / 防火墙
Remote Development
Settings → Plugin (Host)
```

## 声音与画面互补

声音解释根因和处理方向，画面用焦点、网络断线和主机位置来区分三个坑。

## Visual Type

`Troubleshooting Flow + Comparison`

# Scene 08｜用 demo.py 跑通一次

## 视觉目标

以一个最小任务验证选区共享、终端对话和 IDE diff 的完整闭环。

## 画面结构

主画面为 PyCharm IDE。左侧是 `demo.py` 文件和 `greet` 函数，中间是选区高亮，底部是 Claude 终端，右侧最后展开并排 diff。

## 动画顺序

1. 显示原始 `greet` 函数。
2. 选中函数两行，选区沿连接线进入 Claude 终端。
3. 显示“这段选中的函数有什么可以改进的地方？”。
4. 显示“改成 f-string，并加上类型注解”。
5. 右侧 IDE diff 展示签名和返回值的修改。
6. `✓ Diff ready` 出现，停留到观众能审阅。

## 主要屏幕文字

```text
def greet(name):
    return "Hello " + name
这段选中的函数有什么可以改进的地方？
改成 f-string，并加上类型注解
✓ Diff ready
```

## 声音与画面互补

声音带过操作步骤和预期，画面重点展示选区如何被使用、改动如何回到 IDE。

## Visual Type

`Demo + Task Execution + Diff Review`

# Scene 09｜少的是面板，不是核心能力

## 视觉目标

回收选择标准，并把下一篇 Desktop 预告作为最后一个独立视觉事件。

## 画面结构

上半部是 JetBrains 与 VS Code 的简化对照：终端对话 + IDE 反馈，对应独立图形面板。下半部先显示核心结论，再切换到居中的 Desktop 预告卡。

## 动画顺序

1. JetBrains 的终端和 IDE diff 连接线亮起。
2. VS Code 独立图形面板作为对照出现。
3. “核心体验一个没少”居中出现。
4. 上半部淡出，Desktop 卡片从下方进入。
5. “下一篇：10 桌面 app（Desktop）”停留约 2～3 秒。

## 主要屏幕文字

```text
核心体验一个没少
终端对话 + IDE 反馈
下一篇：10 桌面 app（Desktop）
独立、不依附编辑器
```

## 声音与画面互补

声音完成结论和预告，画面先收束当前篇的桥接模型，再独立停留在下一篇卡片，不把下一篇内容提前讲完。

## Visual Type

`Summary + Comparison`

## 全片视觉类型、组件与动画标准

### 视觉类型分布

| Visual Type | Scene |
|---|---|
| Comparison / UI Simulation | 01、05、09 |
| Connection / Concept Diagram | 02 |
| Process / Step List | 03、04 |
| UI Simulation / State Change | 06 |
| Troubleshooting Flow | 07 |
| Demo / Task Execution / Diff Review | 08 |

### 原型组件

- `IDEWindow`：JetBrains 深色窗口、文件树、编辑器和 Terminal。
- `TerminalPanel`：命令、Claude 提问、状态输出和 `/config`。
- `BridgeNode`：IDE、Plugin、CLI 和双向信息流。
- `StepRail`：安装和连接步骤状态。
- `DiffViewer`：终端文本 diff 与 IDE 并排 diff 的切换。
- `TroubleCard`：快捷键、WSL2、远程主机三种排障卡。
- `PreviewCaption`：幕内字幕胶囊，保持 1～2 行和安全区。

### 动画层级

#### 一级：信息动画

- 连接线建立与断开。
- 状态节点从未完成变为完成。
- 选区、诊断和改动在 IDE 与终端间移动。
- `terminal` 变为 `auto`。
- 代码从原始状态变成可审阅 diff。
- 下一篇预告卡最后出现并停留。

#### 二级：注意力动画

- 当前命令、快捷键和错误卡轻微高亮。
- 非当前路径降低透明度。
- 关键 diff 行使用低强度绿色／红色标记。

#### 三级：装饰动画

- 仅使用轻微背景光晕和窗口淡入，不使用无意义粒子、旋转或复杂转场。

### 画面标准

- 16:9 横屏构图，按 1920 × 1080 设计，深色背景，克制发光。
- 主文案控制在 1～2 行，底部字幕保持 1～2 行并留出安全区。
- 列表和排障卡不同时堆叠过多说明；文字优先展示命令、状态和关键结论。
- 原型可有上一幕、下一幕、自动播放和进度提示，但这些只服务静态预览，不进入未来 Remotion Composition。
- 所有画面文字可追溯到 `source.md`、本条 Content Analysis、Video Narrative、Scene Script 或本 Visual Script。

## Gate 2 内部检查

- [x] `narration-script.md` 每个 Scene 下只有实际口播，没有视觉说明、制作备注或 Gate 文本。
- [x] 9 个 Scene 在 Scene Script、Narration Script、Visual Script 中一一对应。
- [x] 声音承担解释、因果、转折和总结，画面承担桥接、过程、状态、诊断和 diff 证明。
- [x] 所有主要屏幕文字均能追溯到当前 Source 或当前视频资料；没有复用 VS Code 文章的业务文案。
- [x] Scene 07 的 WSL2 和远程开发只呈现当前文章支持的根因与处理方向，没有把外部命令变成执行任务。
- [x] Scene 09 的下一篇 Desktop 预告进入口播、视觉脚本和最后一个原型 Scene，未提前读取下一篇文章。
- [x] 原型设计为无依赖 HTML + CSS + 少量 JavaScript，未进入 TTS、音频、字幕、Timeline 或 Remotion。

## 下一步

完成 `visual-prototype.html` 后，执行源文件字节一致性、七层文件、Scene 对应关系、原型 JavaScript 语法和禁止产物检查；检查完成即停止本次任务。
