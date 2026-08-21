# Claude Code 桌面 app 视频化 · 第三步：Scene Script

> 目标：将 Video Narrative 拆成可制作的场景。每幕只承担一个主要认知任务。

## Scene 01｜桌面 app 不是简化版

### purpose
先挑战“桌面 app 只是给小白的简化版”这一误解，并引出多个任务并行时的真实混乱。

### narrativeRole
Opening：建立冲突和观看动机。

### narrationIntent
说明很多人把桌面 app 当成聊天客户端套壳，但三个任务在终端里来回切换时，真正的问题是工作方式，而不是入口是否“正统”。

### visualIntent
先展示三个终端 tab 的任务混在一起，再让桌面 app 的侧栏出现三个独立会话，形成“它不是弱化版”的反转。

### visualType
`OpeningScene + Comparison + UI Simulation`

### keyOnScreenText
```text
三个任务
一个工作目录
```

以及：`不是简化版 CLI`、`另一种工作方式`。

### videoValue
只有时间连续展示“切错 tab → 会话分开 → 一键切换”的状态变化，才能让“并行工作方式”产生直觉，而不是停留在定义。

## Scene 02｜认准 Code：同一引擎，不同外壳

### purpose
给桌面 app 定义边界，避免观众把 Chat、Cowork 和 Code 混为一谈。

### narrativeRole
Definition：在观众看到问题后补上准确产品定义。

### narrationIntent
说明 Code 是带图形界面的完整 Claude Code，和终端使用同一引擎，能读写本地文件；Chat 和 Cowork 不属于本片主线。

### visualIntent
用一个桌面窗口展开 Chat、Cowork、Code 三个选项卡，只有 Code 连到本地项目文件树和终端。

### visualType
`Concept Diagram + UI Simulation`

### keyOnScreenText
```text
Chat：普通对话
Cowork：云虚拟机
Code：本地文件与命令
```

### videoValue
选项卡的连接状态和文件树的出现能直接证明“Code 能碰本地项目”，比口播重复产品定义更有效。

## Scene 03｜装之前先过三道门

### purpose
把 macOS、Windows、Linux、订阅和 Git 的差异压缩成可执行的安装判断。

### narrativeRole
Orientation：在进入能力演示前交代使用边界。

### narrationIntent
讲清 Linux 没有桌面 app，Code 需要付费订阅，macOS 使用 Universal 版，Windows 本地会话必须先装 Git 并重启应用。

### visualIntent
展示三平台分流，依次点亮 macOS 可用、Windows + Git、Linux → CLI；在路径上叠加订阅和重启两个阻塞标记。

### visualType
`Process + Decision Diagram`

### keyOnScreenText
```text
macOS / Windows
Pro · Max · Team · Enterprise
Windows：Git + 重启
Linux：CLI
```

### videoValue
平台路径、阻塞状态和恢复动作是过程信息，用动画逐步点亮比静态列出安装说明更清楚。

## Scene 04｜三个会话，三个 worktree

### purpose
展示桌面 app 相对终端并行 tab 的核心优势：Git worktree 自动隔离。

### narrativeRole
Proof：用最强的具体能力证明“另一种工作方式”。

### narrationIntent
解释点击 `+ New session` 后，Git 仓库中的每个会话可以获得独立 worktree，多个任务改动互不污染，还能通过侧栏或分屏切换。

### visualIntent
从一个仓库节点分裂出 `登录修复`、`测试补充`、`工具函数重构` 三个会话和三个 worktree；修改其中一个文件时，另外两个保持独立。

### visualType
`Process + Connection Diagram + Task Routing`

### keyOnScreenText
```text
+ New session
Git worktree
改动互不污染
```

### videoValue
隔离关系只有通过节点分裂和状态保持才能被看见；这是桌面 app 价值最需要视频表达的一幕。

## Scene 05｜终端、文件和 Claude 在同一份环境里

### purpose
展示集成终端与文件编辑器如何消除“Claude 改了但我看到的是旧目录”的错位。

### narrativeRole
Proof：从会话隔离转入单个会话内部的共享环境。

### narrationIntent
说明 Views 中可以打开终端，终端位于当前会话工作目录；点文件路径可以直接编辑和保存，磁盘发生外部变化时会提醒用户。

### visualIntent
一个会话窗口内同时展开聊天、文件、终端和预览窗格；终端执行 `git status` 看到与文件编辑器相同的文件变化。

### visualType
`UI Simulation + Demo`

### keyOnScreenText
```text
同一会话工作目录
git status
Save
检测到磁盘变化
```

### videoValue
通过同一文件在不同窗格同步变更，证明“共享环境”而不是只描述界面布局。

## Scene 06｜diff：看清了再点头

### purpose
展示桌面 app 的可视化审阅闭环：看 diff、逐行批注、Review code、再决定接受。

### narrativeRole
Proof：把图形界面优势落到改动安全和反馈精度。

### narrationIntent
说明改动会显示增删行，用户可以在具体行批注，提交后让 Claude 继续修改，也可以先让它做高信号自审；CI 状态还能在会话中追踪。

### visualIntent
从 `+12 -1` 指示器展开左右 diff，鼠标点中一行出现批注框，Review code 产生批注，最终显示接受／拒绝和 CI 状态。

### visualType
`UI Simulation + Task Execution`

### keyOnScreenText
```text
+12 -1
逐行批注
Review code
接受 / 拒绝
CI passed
```

### videoValue
批注、审阅和状态改变本身就是交互过程，画面能把“改对没改对一眼看清”转化为可见动作。

## Scene 07｜Desktop、IDE、CLI 各有主场

### purpose
把三个入口从竞争关系改写为任务路由，给观众明确选择标准。

### narrativeRole
Decision：在能力证明之后完成归纳和选择。

### narrationIntent
说明脚本化和自动化回 CLI，熟悉编辑器中的写码用 IDE 扩展，同时推进多个独立任务和可视化审阅选 Desktop；三者共享配置与底层能力。

### visualIntent
三条任务线分别流向 CLI、IDE 扩展和 Desktop，标签只保留各自主场；中间连接共享 CLAUDE.md、MCP、hooks、skills 和 settings。

### visualType
`Comparison + Task Routing`

### keyOnScreenText
```text
自动化 → CLI
熟悉编辑器 → IDE 扩展
并行 + 审阅 → Desktop
共享配置与引擎
```

### videoValue
路由箭头和共享节点能同时表达“主场不同”和“底层相同”两个关系，避免把选择结论做成文字表格。

## Scene 08｜跑通第一个本地会话

### purpose
用最小操作闭环验证 Code 选项卡的安全使用方式，并带出终端会话迁移。

### narrativeRole
Action：让观众从理解进入可执行的第一步。

### narrationIntent
带观众选择 Local、项目文件夹、模型和询问权限，发送一个小任务，先看 diff 和进度，再接受或拒绝；最后补充 `/desktop` 可把终端会话搬进桌面。

### visualIntent
四项配置依次出现，任务执行后 diff 停在“等待决定”，点击接受才写回；随后一条 `/desktop` 会话线流入 Desktop。

### visualType
`StepList + Terminal + Task Execution`

### keyOnScreenText
```text
Local · Select folder · Model · 询问权限
找一条 TODO，把它修掉
等待决定
接受前不写回磁盘
/desktop
```

### videoValue
权限模式和接受前不落盘是状态变化，必须通过动作顺序证明安全感；会话迁移也需要真实的流向动画。

## Scene 09｜按任务切换，下一集看云端

### purpose
收束桌面 app 的定位、三个入口的选择，并加入系列下一集预告。

### narrativeRole
Summary：形成可记忆结论并打开下一集。

### narrationIntent
总结桌面 app 的三个核心价值和入口选择，强调它是同一 Claude Code 的另一种工作方式；最后预告下一篇 Web / 手机与 Remote 环境。

### visualIntent
三块结论卡片依次合并为“并行 + 共享环境 + 可视化审阅”，下方保持独立的下一集预告卡片，避免与字幕区重叠。

### visualType
`SummaryScene + Connection Diagram`

### keyOnScreenText
```text
并行隔离
共享环境
可视化审阅
下一集：11 网页版与云端
```

### videoValue
结论卡片的合并和预告的最后停留帮助观众建立记忆，并明确系列的下一步，不是简单滚动一段小结文字。

## Scene Script 总览

| Scene | 认知任务 | 主要视觉机制 |
|---|---|---|
| 01 | 打掉简化版误解 | 终端混乱 → 会话侧栏 |
| 02 | 定义 Code 边界 | 三选项卡连接本地项目 |
| 03 | 解释安装门槛 | 平台分流与阻塞点 |
| 04 | 证明 worktree 隔离 | 仓库分裂与独立修改 |
| 05 | 证明共享工作目录 | 多窗格同步文件 |
| 06 | 证明可视化审阅 | diff、批注、Review、状态 |
| 07 | 给出入口选择 | 三路任务路由 |
| 08 | 跑通安全闭环 | 配置 → diff → 接受／拒绝 |
| 09 | 总结并预告 | 三个价值合并 → 下一集 |

## Gate 1 内部审查

- 9 个 Scene 的 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText`、`videoValue` 均已明确。
- 每个 Scene 只有一个主要认知任务，Scene 04—06 的视觉机制彼此不同。
- Scene 01—09 与 Video Narrative 一一对应，未遗漏平台限制、三个核心价值、入口选择、上手闭环和系列预告。
- 所有屏幕文字均来自 source 或由 source 中的关系压缩而来，没有复用其他视频的业务语义。
- Gate 1 结论：通过。

## 下一步

基于本 Scene Script 生成纯口播 Narration Script、逐 Scene Visual Script 和横屏 Visual Prototype。
