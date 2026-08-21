# JetBrains 集成视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成可制作的视频场景。每个 Scene 只承担一个主要认知任务。

## Scene 01｜JetBrains 是不是二等公民？

### purpose
从 JetBrains 用户的真实担心切入，先建立“界面不同不等于能力缺失”的问题。

### narrativeRole
问题钩子。

### narrationIntent
说明 JetBrains 用户会拿 VS Code 的独立面板来比较，并提出“是不是少了核心体验”的疑问。

### visualIntent
并列展示 VS Code 独立图形面板与 JetBrains IDE 内置终端入口，制造可见差异。

### visualType
`Comparison + UI Simulation`

### keyOnScreenText
```text
JetBrains 集成
VS Code：独立图形面板
JetBrains：IDE 内置终端
核心体验？
```

### videoValue
通过入口形态的切换和对照，让观众先感受到“像又不像”，比静态解释“界面不同”更直观。

## Scene 02｜插件是一座桥，不是聊天面板

### purpose
建立 JetBrains 插件的正确心智模型。

### narrativeRole
概念澄清。

### narrationIntent
解释 Claude Code 本体仍是终端里的 CLI，插件负责让 IDE 上下文与 CLI 双向流动；对话发生在内置终端，diff 回到 IDE。

### visualIntent
把 IDE、JetBrains Plugin 和 Claude Code CLI 连接起来，让选区、诊断、改动三种信息流过桥。

### visualType
`Connection Diagram + Concept Diagram`

### keyOnScreenText
```text
IDE
JetBrains Plugin
Claude Code CLI
选区 · 诊断 · 改动
对话在终端，diff 回 IDE
```

### videoValue
桥接、流动和回传是动态关系，只有通过连接过程才能把“插件不是面板”讲成直觉。

## Scene 03｜CLI、插件、重启：安装前提链

### purpose
把安装过程压缩成不会漏项的最小路径。

### narrativeRole
行动前提。

### narrationIntent
说明 CLI 与插件缺一不可，先用 `claude --version` 检查 CLI，再从 Marketplace 安装 Claude Code `[Beta]`，最后完全退出并重启 IDE。

### visualIntent
依次点亮 CLI 版本、插件安装、重启完成三个状态，并短暂展示支持的主流 IDE 家族。

### visualType
`Process + Step List + UI Simulation`

### keyOnScreenText
```text
claude --version
Claude Code [Beta]
Install
完全重启 IDE
IntelliJ IDEA · PyCharm · WebStorm · PhpStorm · GoLand · Android Studio
```

### videoValue
顺序和状态是安装是否成功的关键，逐项点亮能避免观众只记住“去搜插件”而漏掉 CLI 或重启。

## Scene 04｜从哪里启动，决定怎么连接

### purpose
让观众能在内置终端与外部终端之间做出正确选择。

### narrativeRole
路径分叉。

### narrationIntent
解释 IDE 内置终端运行 `claude` 会自动连接；外部终端需要 `/ide` 手动选择 IDE；两种方式都应从项目根目录启动。

### visualIntent
将一条路径自动接通，另一条路径经过 `/ide` 选择后接通，最后汇聚到同一个项目根目录。

### visualType
`Process + Decision Diagram`

### keyOnScreenText
```text
IDE 内置终端
claude
自动激活

外部终端
claude → /ide
手动选择 IDE

项目根目录一致
```

### videoValue
自动连接与手动连接是状态差异，分叉、选择和汇聚能直接展示“什么时候需要 `/ide`”。

## Scene 05｜接通后，核心能力怎么流动

### purpose
证明 JetBrains 插件保留了核心上下文与反馈能力，同时呈现与 VS Code 的体感差异。

### narrativeRole
价值证明。

### narrationIntent
依次讲清快速启动、选区／标签共享、文件引用、diff 和诊断共享；强调 JetBrains 对话在内置终端，文件引用快捷键与 VS Code 不同。

### visualIntent
从编辑器选中 `greet` 函数开始，选区、lint 诊断和文件引用进入终端提示；改动结果回到 IDE diff，并在角落对照两个快捷键。

### visualType
`Demo + UI Simulation + Comparison`

### keyOnScreenText
```text
Cmd/Ctrl+Esc
Cmd+Option+K / Alt+Ctrl+K
@src/auth.ts#L1-99
选区共享 · 诊断共享 · Diff
JetBrains：IDE 内置终端
VS Code：独立图形面板
```

### videoValue
信息从编辑器进入终端、再回到 diff 查看器的过程，能证明“桥接”带来的工作体验，而不是把五项功能重复念一遍。

## Scene 06｜把 diff 从终端搬进 IDE

### purpose
展示 `auto` 配置为什么值得设置。

### narrativeRole
配置转折。

### narrationIntent
说明 `/config` 中的 diff tool 默认选择会影响改动呈现；设为 `auto` 后使用 IDE 并排 diff，`terminal` 则留在终端文本中。

### visualIntent
同一段 `demo.py` 改动先以终端文本 diff 出现，随后设置 `/config` → `auto`，再移动到 IDE 原生 diff 查看器。

### visualType
`UI Simulation + State Change`

### keyOnScreenText
```text
/config
diff tool
terminal → auto
IDE diff viewer
看清了再接受
```

### videoValue
“auto”不是抽象配置，而是改动审阅位置的变化；同一份 diff 的前后迁移必须用视频展示。

## Scene 07｜三个 JetBrains 专属坑

### purpose
把 ESC、WSL2、远程开发三个高频障碍定位到正确的处理方向。

### narrativeRole
风险处理。

### narrationIntent
分别解释 ESC 是终端焦点绑定、WSL2 是网络或防火墙连通问题、远程开发是插件安装主机位置问题，并给出文章中的解决方向。

### visualIntent
三张排障卡依次亮起，每张只显示症状、根因和第一处理方向：改终端快捷键、放行网络或切镜像网络、安装到远程主机。

### visualType
`Troubleshooting Flow + Comparison`

### keyOnScreenText
```text
ESC 中断失灵
取消 Escape → 编辑器焦点

WSL2：No available IDEs detected
检查 NAT / 防火墙

Remote Development
Settings → Plugin (Host)
```

### videoValue
三个坑的症状相似但责任边界不同，分路显示能防止观众把快捷键、网络和远程主机问题混为一谈。

## Scene 08｜用 demo.py 跑通一次

### purpose
把前面的安装、连接、上下文和 diff 配置落到一个最小可验证任务。

### narrativeRole
闭环验证。

### narrationIntent
带观众在 PyCharm 建立 `demo.py`，选中 `greet` 函数提问，再要求改成 f-string 并添加类型注解，最后审阅 IDE diff。

### visualIntent
展示原始函数、选区共享、终端提问、Claude 返回修改和 IDE 并排 diff 的连续状态。

### visualType
`Demo + Task Execution + Diff Review`

### keyOnScreenText
```text
def greet(name):
    return "Hello " + name

这段选中的函数有什么可以改进的地方？
改成 f-string，并加上类型注解
✓ Diff ready
```

### videoValue
最小任务把抽象的“接通”变成可观察的因果链，观众能看到选区真的被使用、改动真的回到 IDE。

## Scene 09｜少的是面板，不是核心能力

### purpose
收束 JetBrains 的选择标准，并完成系列下一篇预告。

### narrativeRole
结论与预告。

### narrationIntent
总结 JetBrains 采用终端对话与 IDE 原生反馈的轻量桥接方式，核心体验一个没少；最后预告下一篇独立 Desktop app。

### visualIntent
先将 JetBrains 的“终端对话 + IDE diff”与 VS Code 的“独立图形面板”并列回收，再把画面焦点移到下一篇预告卡片。

### visualType
`Summary + Comparison`

### keyOnScreenText
```text
核心体验一个没少
终端对话 + IDE 反馈
下一篇：10 桌面 app（Desktop）
独立、不依附编辑器
```

### videoValue
结论需要通过前后关系收束，最后预告卡必须成为独立的视觉事件并停留约 2～3 秒，避免只在口播中带过。

## Scene Script 总览

| Scene | 主要认知任务 | Visual Type |
|---|---|---|
| 01 | 制造“是不是二等公民”的疑问 | Comparison + UI Simulation |
| 02 | 建立插件桥接模型 | Connection Diagram + Concept Diagram |
| 03 | 完成 CLI、插件、重启前提 | Process + Step List |
| 04 | 选择自动或手动连接路径 | Process + Decision Diagram |
| 05 | 展示接通后的核心能力 | Demo + UI Simulation |
| 06 | 证明 `auto` diff 配置价值 | UI Simulation + State Change |
| 07 | 处理三个专属坑 | Troubleshooting Flow |
| 08 | 跑通最小练习闭环 | Demo + Task Execution |
| 09 | 收束结论并预告 Desktop | Summary + Comparison |

## Gate 1 内部审查

- [x] 9 个 Scene 均包含 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText`、`videoValue`。
- [x] 每个 Scene 只承担一个主要认知任务，没有把安装、连接、能力和排障混成一幕。
- [x] 旁白方向与画面方向互补，未把口播全文作为屏幕文字。
- [x] `demo.py`、`greet`、f-string、类型注解、`/config`、`/ide`、ESC、WSL2 和远程主机均可回溯到 Source。
- [x] 所有屏幕文字均来自 Source 或是对 Source 流程的最小标签，没有复用其他视频的业务文案。
- [x] Scene 09 的 Desktop 只作为下一篇预告，未读取下一篇文章。

## 下一步

基于本 Scene Script 编写纯口播 Narration Script、逐幕 Visual Script 和横屏 Visual Prototype，完成 Gate 2 内部检查后停止。
