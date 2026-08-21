# Interface and Shortcuts 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成 9 个可制作的视觉事件。每幕只承担一个主要认知任务。

## Scene 01｜先认出你该盯的三块区域

### sceneId
interface-and-shortcuts-01

### title
这个终端窗口，先看哪一块

### purpose
建立“界面不是一团滚动文字”的最低限度地图。

### narrativeRole
开场问题与界面定位。

### narrationIntent
说明本篇不教提需求，只解决看懂终端界面和把手放到正确按键上的问题。

### visualIntent
从一整块终端中依次框出输入框、状态行、模式／权限提示，并把其他区域淡化为输出。

### visualType
OpeningScene + UI Simulation

### keyOnScreenText
输入框；状态行／页脚；模式／权限提示；`Ctrl+L` 重绘

### videoValue
区域框选和焦点移动能把“应该看哪里”变成空间关系，避免用静态定义列表开场。

## Scene 02｜高频快捷键是一张动作地图

### sceneId
interface-and-shortcuts-02

### title
把常用动作放进手边

### purpose
给观众一张不必逐字背诵的高频快捷键全景。

### narrativeRole
工具地图建立。

### narrationIntent
按会话控制、模式切换、历史检索、屏幕与转录四组解释最常用的按键。

### visualIntent
让快捷键从中央键盘分流到“控制、模式、历史、显示”四个结果区域。

### visualType
Key Map + Process

### keyOnScreenText
`Esc`；`Ctrl+C`；`Ctrl+D`；`Shift+Tab`；`↑`；`Ctrl+R`；`Ctrl+L`；`Ctrl+O`

### videoValue
键帽移动到结果标签的过程能表达“按键是控制动作”，比完整表格更适合视频节奏。

## Scene 03｜Esc、Ctrl+C、Ctrl+D 不要混用

### sceneId
interface-and-shortcuts-03

### title
刹车、清场、退场，是三件事

### purpose
拆开最容易造成误操作的中断、清空和退出行为。

### narrativeRole
风险澄清与关键对比。

### narrationIntent
解释 `Esc` 单击保留已完成部分，双击回退要求输入框为空；`Ctrl+C` 按状态中断或清空，`Ctrl+D` 直接退出。

### visualIntent
展示同一个终端在不同输入状态下的分岔结果，并将会话保留、草稿清空和会话结束分别标色。

### visualType
Comparison + State Diagram

### keyOnScreenText
`Esc` 一下：停止；`Esc` 两下：回退；`Ctrl+C`：清场；`Ctrl+D`：退场

### videoValue
状态分岔是这些快捷键语义的核心，时间顺序和结果颜色能降低误记风险。

## Scene 04｜Shift+Tab 切换权限模式

### sceneId
interface-and-shortcuts-04

### title
“问不问你”的开关在状态行

### purpose
让观众理解 `Shift+Tab` 改变的是权限模式，而不是普通输入状态。

### narrativeRole
操作模式建立。

### narrationIntent
说明 `default`、`acceptEdits`、`plan` 等模式的基本差异，以及状态行会实时反映当前模式。

### visualIntent
模拟状态行在多个模式之间循环，旁边用“先问、自动接受编辑、只出方案”短标签说明结果。

### visualType
UI Simulation + Mode Switch

### keyOnScreenText
`Shift+Tab`；`default`；`acceptEdits`；`plan`

### videoValue
模式标签的循环变化能把权限模式从抽象名称变成可观察的操作反馈。

## Scene 05｜四个输入前缀，四条入口

### sceneId
interface-and-shortcuts-05

### title
输入框开头的符号，会把请求送到不同地方

### purpose
建立 `@`、`!`、`/`、`#` 的入口分工，并深入两个高频前缀。

### narrativeRole
输入路由建立。

### narrationIntent
解释 `@` 用于文件路径补全，`!` 直接进入 Shell，`/` 是命令／Skill 菜单，`#` 与记忆相关且有版本差异。

### visualIntent
让四个前缀从输入框分流到文件、Shell、命令菜单和记忆相关入口，重点放大 `@src/auth.ts` 与 `! git status`。

### visualType
Task Routing + UI Simulation

### keyOnScreenText
`@` 文件；`!` Shell；`/` 命令／Skill；`#` 记忆相关

### videoValue
分流动画能展示前缀改变的是输入处理路径，而不是只增加几个符号定义。

## Scene 06｜Enter 默认发送，多行要换一种按法

### sceneId
interface-and-shortcuts-06

### title
想换行，别让 Enter 抢先发送

### purpose
解决长指令输入时最常见的误提交问题。

### narrativeRole
操作陷阱与解决方案。

### narrationIntent
说明 `Enter` 默认发送，推荐记住跨终端稳定的 `\\` 加 `Enter`，并补充其他换行方式和 `Ctrl+G` 编辑器入口。

### visualIntent
先让半句话从输入框飞入对话，再回放同样文本，用 `\\` 加 `Enter` 留在两行输入框中。

### visualType
UI Simulation + Before/After

### keyOnScreenText
`Enter`：发送；`\\` + `Enter`：换行；`Ctrl+J`；`Shift+Enter`；`Ctrl+G`

### videoValue
同一段输入的两种结果可以直接证明“发送”和“换行”的差异，避免靠文字解释记忆。

## Scene 07｜六步把动作跑一遍

### sceneId
interface-and-shortcuts-07

### title
从看懂到亲手验证

### purpose
把界面、Shell、历史、模式、多行和退出串成一次最小练习。

### narrativeRole
实践验证。

### narrationIntent
带观众走过启动、`! echo hello-shortcuts`、`↑`、`Shift+Tab`、多行输入和 `Ctrl+D` 六步，并说明每步应该看到什么。

### visualIntent
用终端时间线逐步点亮命令、输出、历史回填、模式变化、换行和退出结果。

### visualType
Demo + Task Execution

### keyOnScreenText
`claude`；`! echo hello-shortcuts`；`↑`；`Shift+Tab`；`\\` + `Enter`；`Ctrl+D`

### videoValue
按键与反馈连续发生，能把“快捷键知识”转成可重复的肌肉记忆流程。

## Scene 08｜先用熟默认，再考虑自定义

### sceneId
interface-and-shortcuts-08

### title
快捷键能改，但不是现在就该改

### purpose
交代 `/keybindings`、版本要求和不可修改的保留键边界。

### narrativeRole
进阶入口与边界控制。

### narrationIntent
说明 v2.1.18 或更高版本可用 `/keybindings` 打开 `~/.claude/keybindings.json`，但新手应先熟悉默认配置，`Ctrl+C`、`Ctrl+D` 等保留键不能改。

### visualIntent
展示版本检查、配置文件打开、可修改键与保留键的分流。

### visualType
Configuration Boundary

### keyOnScreenText
`claude --version`；`/keybindings`；`~/.claude/keybindings.json`；保留键：不可重绑

### videoValue
可改与不可改的边界通过分流展示，能防止观众把所有默认键都理解为可配置。

## Scene 09｜把手放对地方

### sceneId
interface-and-shortcuts-09

### title
从“靠鼠标硬刚”到“知道怎么控制”

### purpose
收束界面识别、快捷键选择、输入路由和练习验证，并预告下一篇。

### narrativeRole
结论与下一集预告。

### narrationIntent
回顾界面三块、高频控制键、`@`／`!`、多行输入和六步练习，说明这些动作让手不离键盘，最后预告下一篇的提问方法。

### visualIntent
让“看界面 → 选动作 → 选输入入口 → 验证结果”四个节点依次连通，底部出现下一集预告卡。

### visualType
SummaryScene + Next Episode Preview

### keyOnScreenText
看界面 → 选动作 → 选入口 → 验证结果；下一篇：怎么提问和给指令

### videoValue
流程回放把零散快捷键提升为可复用判断法，结尾预告作为最后一个视觉事件自然承接系列。

## Gate 1 内部审查

- Scene 数量为 9，均有唯一 `sceneId`。
- 每幕只承担一个主要认知任务，且均填写八项基线字段。
- Scene 顺序遵循 Video Narrative 的认知推进，不按 Source 章节机械复制。
- `Esc` 双击的输入框为空前提、`Ctrl+C`／`Ctrl+D` 差异和 `Enter` 默认发送均被显式保留。
- Scene 09 是最后一幕，包含下一篇预告，且预告不与当前主题混淆。

