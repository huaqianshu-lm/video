# Claude Code 桌面 app 视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 声音解释，画面证明

口播负责解释桌面 app 的定位、平台门槛和入口选择；画面负责展示会话如何分裂、窗格如何共享、diff 如何被批注和接受。

### 2. 一个 Scene 只有一个视觉中心

全片使用深色、克制的桌面软件界面。每幕只突出一个状态变化，不把安装清单、功能列表和结论同时堆在画面中心。

### 3. 界面模拟优先表达状态

使用侧栏、文件树、终端、diff、批注框和连接线表达真实工作过程；不使用与桌面 app 无关的抽象装饰。

### 4. 屏幕文字保持可追溯

标题、标签、状态和按钮均来自 `source.md`、Content Analysis、Video Narrative 或 Scene Script。原文外的文字只用于描述这些资料已经确定的关系，不带入下一篇文章内容。

### 5. 动画表达因果

优先使用“分裂、连接、扫描、改动、批注、等待、接受”等信息动画；装饰性发光和漂浮保持最少。

## Scene 01｜桌面 app 不是简化版

### 视觉目标

用“同一份目录里的三个终端 tab”与“侧栏中的三个独立会话”形成第一处认知反转。

### 画面结构

左侧是三个终端 tab：`登录修复`、`测试补充`、`工具函数重构`，三者都标记同一 `project/`；右侧出现 Desktop 侧栏，三个会话分别带有独立 worktree 标记。

### 动画顺序

1. 三个终端 tab 交替闪动，文件名和任务标签短暂错位。
2. 画面中心出现“一个工作目录”的警示线。
3. Desktop 侧栏从右侧滑入，三个会话向不同 worktree 分裂。
4. 右侧会话依次高亮，显示“改动互不污染”。

### 主要屏幕文字

`不是简化版 CLI`、`三个任务`、`一个工作目录`、`另一种工作方式`。

### 声音与画面互补

口播说清误解和混乱来源，画面不复述整句口播，只展示共享目录如何制造切换压力，以及会话隔离如何解除压力。

### Visual Type

`OpeningScene + Comparison + UI Simulation`

## Scene 02｜认准 Code：同一引擎，不同外壳

### 视觉目标

让观众一眼看出 Chat、Cowork、Code 的边界，并看到 Code 连接本地文件。

### 画面结构

桌面窗口顶部有三个选项卡。Chat 下方是对话气泡，Cowork 下方是云虚拟机，Code 下方展开 `src/`、`tests/` 和终端；中间用一条“同一引擎”连接线贯穿。

### 动画顺序

1. 三个选项卡依次点亮。
2. Chat 和 Cowork 的本地文件连接保持断开。
3. Code 点亮后，文件树和终端从窗口下方展开。
4. 底部出现“同一引擎，不同外壳”。

### 主要屏幕文字

`Chat：普通对话`、`Cowork：云虚拟机`、`Code：本地文件与命令`、`同一底层引擎`。

### 声音与画面互补

口播解释产品定义和边界，画面用连接与断开证明 Code 是本片真正的本地开发入口。

### Visual Type

`Concept Diagram + UI Simulation`

## Scene 03｜装之前先过三道门

### 视觉目标

把平台和账号门槛变成一条简洁的安装决策路径。

### 画面结构

横向三路安装节点：macOS、Windows、Linux。macOS 节点连接 `Universal .dmg`；Windows 节点连接 `x64 / ARM64`、`Git for Windows` 和 `重启应用`；Linux 节点终止于 `CLI`。上方单独显示订阅门槛。

### 动画顺序

1. `Pro · Max · Team · Enterprise` 门槛先落下。
2. macOS 和 Windows 路径点亮。
3. Windows 在 Git 节点停顿，安装后变为绿色并继续到“重启应用”。
4. Linux 路径变为灰色，箭头转向 CLI。

### 主要屏幕文字

`macOS / Windows`、`Code 需要订阅`、`Windows：Git + 重启`、`Linux：CLI`。

### 声音与画面互补

口播说清“为什么点 Code 会卡住”，画面展示阻塞和解除，不把所有安装细节做成文字墙。

### Visual Type

`Process + Decision Diagram`

## Scene 04｜三个会话，三个 worktree

### 视觉目标

让 worktree 隔离成为全片最强的直觉画面。

### 画面结构

左侧一个 `project.git` 仓库节点，右侧三条分支卡片：`登录修复 / worktree-a`、`测试补充 / worktree-b`、`工具函数重构 / worktree-c`。每条卡片有自己的文件状态。

### 动画顺序

1. 点击 `+ New session`。
2. 仓库节点沿三条线复制出三个 worktree。
3. `登录修复` 卡片中的 `auth.ts Modified` 出现，另外两张卡片保持原状态。
4. 侧栏高亮在三个会话间循环，再短暂展示分屏。

### 主要屏幕文字

`+ New session`、`Git worktree`、`auth.ts Modified`、`改动互不污染`。

### 声音与画面互补

口播解释“为什么不会互相打架”，画面证明一个会话改动时另两个会话保持独立。

### Visual Type

`Process + Connection Diagram + Task Routing`

## Scene 05｜终端、文件和 Claude 在同一份环境里

### 视觉目标

展示一个会话内部的窗格共享同一工作目录。

### 画面结构

四窗格布局：左侧聊天摘要，中间文件编辑器，右侧文件树，底部集成终端。文件树中的 `src/auth.ts` 被编辑器打开，终端显示 `git status`。

### 动画顺序

1. 从聊天中的文件路径拉出一条线，打开 `auth.ts`。
2. 编辑器出现一行改动，文件树状态同步变为 Modified。
3. 终端执行 `git status`，输出同一文件。
4. 外部变化提示框出现，显示“检测到磁盘变化”。

### 主要屏幕文字

`同一会话工作目录`、`git status`、`Save`、`检测到磁盘变化`。

### 声音与画面互补

口播说明共享环境和文件警告，画面用同一文件在三个位置同步出现来证明它们指向同一份状态。

### Visual Type

`UI Simulation + Demo`

## Scene 06｜diff：看清了再点头

### 视觉目标

把可视化 diff 的“查看—批注—自审—决定”闭环完整演示出来。

### 画面结构

顶部是文件列表和 `+12 -1`，中央左右两栏分别为原稿与建议改动，右侧弹出行批注框；底部显示 `Review code`、`接受`、`拒绝` 和 CI 状态。

### 动画顺序

1. `+12 -1` 指示器出现，点击后展开 diff。
2. 一行绿色改动被点中，批注框展开并写入“请保留现有命名”。
3. `Review code` 点亮，侧栏新增高信号审查批注。
4. 底部出现 `接受 / 拒绝`，最终停在“等待决定”，不自动接受。

### 主要屏幕文字

`+12 -1`、`逐行批注`、`Review code`、`高信号问题`、`接受 / 拒绝`、`CI passed`。

### 声音与画面互补

口播解释审阅方式，画面重点展示鼠标落在具体行、反馈进入下一版 diff，以及最终决定权留在用户手里。

### Visual Type

`UI Simulation + Task Execution`

## Scene 07｜Desktop、IDE、CLI 各有主场

### 视觉目标

用任务路由取代“哪个更正统”的争论。

### 画面结构

中心是共享节点：`CLAUDE.md`、`MCP`、`hooks`、`skills`、`settings.json`。左路为 CLI，连接 `脚本 / 自动化`；中路为 IDE 扩展，连接 `熟悉的编辑器`；右路为 Desktop，连接 `并行 / 可视化审阅`。

### 动画顺序

1. 共享节点先出现并向三路发光。
2. 三个任务标签依次落入对应入口。
3. 三路同时显示“共享配置与引擎”。
4. Desktop 路径短暂高亮后，回到三路平衡布局。

### 主要屏幕文字

`自动化 → CLI`、`熟悉编辑器 → IDE 扩展`、`并行 + 审阅 → Desktop`、`共享配置与引擎`。

### 声音与画面互补

口播给出选择判断，画面把判断变成任务流向，并同时保留三者共享底层能力的关系。

### Visual Type

`Comparison + Task Routing`

## Scene 08｜跑通第一个本地会话

### 视觉目标

用最小任务展示默认权限模式下的安全闭环，并让 `/desktop` 成为最后一个动作。

### 画面结构

左侧四步配置条：`Local`、`Select folder`、`Model`、`询问权限`；中间提示框输入 `找一条 TODO，把它修掉`；右侧依次出现进度、diff 和“等待决定”。

### 动画顺序

1. 四项配置依次打勾。
2. 提示框发送任务，进度从 `Reading` 到 `Editing` 再到 `Review`。
3. diff 出现，`接受` 与 `拒绝` 保持可选。
4. 点击接受后文件状态变为 Saved；随后从终端弹出 `/desktop`，会话流入 Desktop 侧栏。

### 主要屏幕文字

`Local`、`Select folder`、`Model`、`询问权限`、`找一条 TODO，把它修掉`、`等待决定`、`接受前不写回磁盘`、`/desktop`。

### 声音与画面互补

口播讲操作顺序，画面用状态停顿证明“先审阅、后写回”，不把提示框里的整段口播重复铺满屏幕。

### Visual Type

`StepList + Terminal + Task Execution`

## Scene 09｜按任务切换，下一集看云端

### 视觉目标

总结三个桌面 app 价值，并把下一集预告放在独立、可读的安全区域。

### 画面结构

中央三张短卡片：`并行隔离`、`共享环境`、`可视化审阅`，卡片合并成 `同一 Claude Code，另一种工作方式`。底部右侧独立预告卡片：`下一集：11 网页版与云端`，不进入字幕区域。

### 动画顺序

1. 三张卡片按顺序进入并停留。
2. 三条连接线合并到中心结论。
3. CLI、IDE、Desktop 三个小标签在结论下方出现。
4. 预告卡片最后进入并保持约 2—3 秒的阅读停留。

### 主要屏幕文字

`并行隔离`、`共享环境`、`可视化审阅`、`同一 Claude Code，另一种工作方式`、`下一集：11 网页版与云端`、`Remote · Web · 手机`。

### 声音与画面互补

口播完成结论和下一集主题，画面保持三个价值和预告的层级关系，不增加下一篇的业务细节。

### Visual Type

`SummaryScene + Connection Diagram`

## 全片视觉类型、组件与动画标准

### 视觉类型分布

| Scene | 类型 |
|---|---|
| 01 | Opening / Comparison / UI Simulation |
| 02 | Concept Diagram / UI Simulation |
| 03 | Process / Decision Diagram |
| 04 | Process / Connection Diagram / Task Routing |
| 05 | UI Simulation / Demo |
| 06 | UI Simulation / Task Execution |
| 07 | Comparison / Task Routing |
| 08 | StepList / Terminal / Task Execution |
| 09 | Summary / Connection Diagram |

### 原型组件

- DesktopWindow：顶部选项卡、侧栏和窗格容器。
- TerminalTabs：多个任务 tab 和命令输出。
- WorktreeGraph：仓库、会话和隔离工作树。
- FileTree / EditorPane：文件路径、修改状态和保存。
- DiffViewer / CommentBox：左右 diff、行批注、Review code。
- RouteNode：CLI、IDE、Desktop 的任务路由。
- StepRail：Local、项目、模型和权限配置。
- SubtitlePill：幕内字幕，固定在下方安全区。
- PreviewControls：上一幕、下一幕、自动播放和进度提示，仅属于原型预览。

### 动画层级

1. 信息动画：分裂 worktree、连接本地文件、修改状态、展开 diff、批注和接受。
2. 注意力动画：当前会话、当前文件、当前路由和等待决定状态高亮。
3. 装饰动画：仅使用轻微渐变、边框光晕和 Scene 切换，不使用无意义粒子或旋转。

### 画面标准

- 16:9 横屏构图，按 1920 × 1080 设计，原型舞台使用固定宽高比。
- 主标题控制在 1—2 行；界面主体至少保留四周安全边距。
- 字幕固定在底部安全区，预告卡片放在右下或侧边，不与字幕重叠。
- 同时出现的任务卡不超过 3 张；列表项不超过 5—6 条。
- 所有代码、命令、按钮和状态文字都能追溯到本片生产资料。

## Gate 2 内部检查

- `narration-script.md` 9 个 Scene 均只有可朗读正文，没有“本段口播作用”、视觉说明、制作备注或 Gate 检查清单。
- Visual Script 9 个 Scene 与 Scene Script、Narration Script 一一对应；声音解释与画面证明关系明确。
- 原型画面文字仅使用本片已确定的产品名称、平台、功能、任务标签、状态和下一篇预告。
- 三种核心能力使用分裂、共享、diff 三套不同视觉机制，没有连续重复卡片。
- 原型提供 16:9 舞台、幕内字幕、上一幕／下一幕、自动播放和进度提示；这些均属于预览辅助，不进入正式 Composition。
- Gate 2 结论：通过，可停止在 Visual Prototype；不进入 TTS、字幕、Timeline 或 Remotion。

## 下一步

制作 `visual-prototype.html`，完成静态原型和 JavaScript 确定性检查后停止本轮任务。
