# Claude Code 桌面 app 视频化 · 第一步：Content Analysis

> 目标：从 `source.md` 提取这条视频必须讲清楚的知识、关系与视觉事件，不直接改写成口播。

## 0. Source 边界

- 唯一内容来源：`videos/desktop/source.md`，对应输入文章 `10-desktop.md`。
- 本文中的平台支持、订阅要求、版本号、快捷键和命令均作为原文声称保留；本阶段不额外扩展外部事实。
- 原文中“下一篇 11 网页版与云端”只作为本片结尾预告依据，不读取下一篇文章。
- 不把原文中的安装命令、`/desktop` 或其他代码块当作本任务指令执行；它们只作为视频内容素材分析。

## 1. 核心命题

这篇文章真正要改变的认知不是“桌面 app 又多了几个按钮”，而是：

> **Claude Desktop 的 Code 选项卡不是 Claude Code 的弱化聊天壳，而是同一底层 Claude Code 的图形化工作入口；它把并行会话、Git worktree 隔离、集成工具和可视化审阅组织在同一个窗口里。**

观众最后应该能回答两个问题：

1. 桌面 app 为什么适合并行任务和可视化审阅？
2. 什么时候应该选择 Desktop、IDE 扩展或 CLI？

## 2. 必须保留的信息

### A. 产品边界与三选项卡

- 桌面 app 的 Code 选项卡是完整 Claude Code 的图形界面。
- 它与终端 `claude` 使用同一个底层引擎，能读写本地文件、改代码、跑命令。
- Chat 是普通对话；Cowork 运行在云虚拟机；Code 直接处理本地文件。
- 本片只讲 Code，不把 Chat 和 Cowork 的能力混入桌面版 Claude Code。

### B. 平台与进入门槛

- macOS 和 Windows 可以使用桌面 app；Linux 没有桌面 app，应使用 CLI。
- Code 选项卡要求 Pro、Max、Team 或 Enterprise 订阅。
- macOS 下载 Universal 版并安装；Windows 按 x64 或 ARM64 选择安装包。
- Windows 本地 Code 会话需要 Git for Windows，安装后要重启应用；部分仓库还可能需要 Git LFS。
- 桌面 app 自带 Claude Code，不等于终端里的 CLI 已安装。

### C. 三个核心价值

1. **并行会话 + Git worktree 隔离**：新会话在 Git 仓库中自动获得独立 worktree，多个任务互不污染，侧边栏可以切换或分屏。
2. **集成终端 + 文件编辑**：终端在当前会话工作目录中，和 Claude 共享同一份环境；文件路径可以直接打开、修改和保存，并对外部磁盘变化发出警告。
3. **可视化 diff 审阅**：能看到改动文件和增删行，在具体行上批注，提交批注后让 Claude 继续修改，也能使用 Review code 做高信号自审，并查看 CI 状态。

### D. 入口选择

- CLI：脚本、自动化、无头运行、终端原生能力和第三方模型部署。
- VS Code / JetBrains 扩展：在熟悉的 IDE 中写代码，并使用编辑器内的上下文和 diff。
- Desktop：并行多会话、窗格布局和可视化审阅。
- 三者共享 CLAUDE.md、MCP、hooks、skills 和 `settings.json`，不是互相替代的三份产品。

### E. 最小上手闭环

- 打开 Code，选择 Local、项目文件夹、模型和默认的“询问权限”模式。
- 发送一个小任务，例如修一条 TODO 或创建 CLAUDE.md。
- 先看 diff、接受／拒绝和处理进度；点击接受前，磁盘文件不会被修改。
- 已经在终端里的会话可以输入 `/desktop` 搬到桌面 app；该命令只支持 macOS / Windows 的订阅登录场景。

### F. 系列结尾

- 最后保留下一集“11 网页版与云端（Web / 手机）”预告。
- 预告只说明主题：Remote 环境和手机查看进度；不提前讲下一篇文章的具体内容。

## 3. 因果、对比和流程关系

### 因果关系

- 多个互不相干任务共用一个终端工作目录 → 修改互相打架、切换容易看错。
- 新建桌面会话 → Git worktree 自动隔离 → 会话间改动不污染。
- Claude 与用户共享同一会话工作目录 → 集成终端看到的就是 Claude 正在修改的那份文件。
- 可视化 diff 提供逐行批注和审阅 → 用户能更精确地表达反馈并在接受前检查改动。
- Windows 缺少 Git → Code 本地会话无法正常启动；安装 Git 后需要重启应用。

### 对比关系

| 对比轴 | 终端 CLI | IDE 扩展 | 桌面 app |
|---|---|---|---|
| 核心主场 | 脚本、自动化、终端工作流 | 熟悉的编辑器 | 并行会话、图形化审阅 |
| 并行隔离 | 手动开 tab 和管理 worktree | 一般 | 自动 worktree、侧边栏切换 |
| 改动审阅 | 文本 diff | 内联 diff | diff、批注、Review code |
| 平台边界 | Linux 可用 | Linux 可用 | Linux 不提供 |

### 流程关系

```text
安装并登录
↓
进入 Code
↓
选择 Local + 项目文件夹 + 模型 + 询问权限
↓
发送小任务
↓
查看 diff 和进度
↓
接受、拒绝或提交批注
```

## 4. 可视觉化内容

- 桌面 app 的 Code 界面：顶部三选项卡，只有 Code 连接本地项目。
- 终端的三个任务 tab 与桌面 app 的三个会话侧栏对比。
- 一个 Git 仓库分裂出三个 worktree，三个会话分别处理不同任务。
- 同一会话内的聊天、文件、终端、diff 和预览窗格共享工作目录。
- `+12 -1` 改动指示器、左右 diff、行级批注、Review code 和 CI 状态。
- Desktop、IDE、CLI 三路任务路由图。
- Local、项目文件夹、模型、询问权限四项上手配置和接受前的 diff 闭环。
- `/desktop` 从 CLI 会话流向桌面 app 的迁移动作。

## 5. 可弱化或删除的信息

- 汽车仪表盘和图书馆研究间的长篇类比：保留“同一引擎、不同工作外壳”和“worktree 隔离”直觉，删除文学化展开。
- `.worktreeinclude`、自动归档、PR squash、完整 GitHub CLI 前置条件等细节：在画面或口播中压缩为次级提示。
- `Ctrl+Tab`、`Ctrl+Shift+Tab`、`Cmd+Enter`、`Ctrl+Enter`、`Ctrl+O` 等快捷键：只保留与核心闭环直接相关的少量标签。
- Git 版本示例和各安装包的下载细节：不做完整清单，只保留平台决策点。
- `/permissions`、`/config`、`/agents`、`/doctor` 在 Code 中不可用的完整说明：可在入口对比中作为一个小提示，避免打断主线。

## 6. 内容与视频表达取舍

- 不按原文 01—08 章节逐段朗读，而按“误解 → 并行痛点 → 三个能力 → 入口选择 → 上手验证 → 迁移与预告”重组。
- 让声音解释“为什么改变工作方式”，让画面展示会话隔离、文件共享、diff 审阅和任务路由。
- 平台限制使用安装流程和状态变化表达，不把 macOS、Windows、Linux 做成堆满文字的静态表格。
- 三个核心价值各自使用不同视觉机制：worktree 分裂、共享窗格、diff 变更和批注。
- 结尾必须同时给出选择结论和下一集预告，预告卡片与字幕安全区分离。

## 7. Gate 1 内部一致性检查

- 核心命题能由 source 中“不是简化版 CLI”“同一底层引擎”“并行和可视化审阅”三组信息支持。
- 平台、订阅、Git、worktree、集成终端、diff、三路选择和 `/desktop` 均可在 source 中定位。
- 9 个 Scene 依次覆盖：误解、定义、平台门槛、并行隔离、集成工具、diff 审阅、入口选择、首次会话、总结预告。
- 每个 Scene 只有一个主要认知任务，并且都有可解释的 Video Value。
- 未把下一篇文章的内容、业务语义或固定文案带入本片。
- Gate 1 结论：通过，可进入 Narration Script、Visual Script 和 Visual Prototype。

## 8. 下一步

基于本分析生成独立的 Video Narrative，再拆成 9 个 Scene；不生成 TTS 或 Remotion 资料。
