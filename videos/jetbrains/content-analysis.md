# JetBrains 集成视频化 · 第一步：Content Analysis

> Source：`source.md`，来自指定输入文章 `/Users/limiao/Desktop/claude code/09-jetbrains.md`。
> 本分析只使用这篇文章的内容；文章中对上一篇、下一篇的链接只作为系列关系处理，不读取其他文章。

## 0. Source 边界

- `source.md` 必须与指定输入文章保持完整、字节一致，不能删改文章中的命令、链接、图片引用和系列导航。
- 本条视频只讲 Claude Code 与 JetBrains IDE 的集成，不扩展为 VS Code 集成教程，也不提前讲下一篇 Desktop 文章。
- 文章把部分信息表述为“官方明确”“官方解法”或“官方强调”。本阶段只把它们作为 Source 中的内容主张，不额外进行外部事实核验；后续若需要正式发布，应另行核验版本、菜单名和命令。
- 文章中的安装命令、PowerShell 防火墙命令、WSL 配置和快捷键都属于待分析内容，不是本任务需要执行的指令。

## 1. 核心命题

JetBrains 用户不是“二等公民”：Claude Code 的核心能力仍然保留，但 JetBrains 插件的产品形态不同。它不是 VS Code 那样的独立聊天面板，而是把 IDE 与终端里的 Claude Code CLI 接通的轻量桥梁，让选区、诊断和改动信息在两边流动；对话发生在 IDE 内置终端，改动可进入 IDE 原生 diff 查看器。

视频需要让观众形成一个可操作的判断：先安装 CLI 和插件并完全重启；优先从 IDE 内置终端启动以自动连接，外部终端则用 `/ide` 手动连接且要对齐项目根目录；再把 `auto` diff、上下文共享和三个 JetBrains 专属坑处理好，就能在 IDE 内完成一条最小工作闭环。

## 2. 必须保留的信息

### A. 先纠正“插件就是聊天面板”的误解

- JetBrains 插件不是独立聊天窗口，而是 IDE 与 CLI 之间的“桥”。
- 对话在 IDE 自带集成终端中进行，diff 弹进 IDE 原生查看器。
- 插件让选中的代码、IDE 的 lint／语法诊断和 Claude 想做的改动在 IDE 与终端之间传递。

### B. 支持范围与安装前提

- 文章明确列出 IntelliJ IDEA、PyCharm、WebStorm、PhpStorm、GoLand、Android Studio。
- RubyMine、CLion、Rider 等名单外 IDE 只能以“未明确支持”对待，不能在视频中说成官方保证。
- 集成需要 CLI 和 JetBrains 插件两样都在。
- 先用 `claude --version` 确认 CLI；插件从 Settings → Plugins → Marketplace 搜索 Claude Code；安装后完全退出并重启 IDE。
- 插件带 `[Beta]` 后缀，文章提醒行为可能随版本变化。

### C. 两种连接方式

- IDE 内置终端运行 `claude`：自动激活集成功能，推荐。
- 外部终端运行 `claude` 后输入 `/ide`：选择对应 JetBrains IDE，手动建立连接。
- 两种方式都要从与 IDE 项目根目录相同的位置启动，避免 Claude 与 IDE 看到的项目不一致。

### D. 五个核心集成功能及差异

- `Cmd/Ctrl+Esc`：从编辑器快速打开 Claude。
- 当前选中的代码或打开的标签页自动共享给 Claude。
- JetBrains 文件引用快捷键为 macOS `Cmd+Option+K`、Windows/Linux `Alt+Ctrl+K`；文章用 `@src/auth.ts#L1-99` 举例，并强调它不同于 VS Code 的快捷键。
- 改动可以在 IDE diff 查看器中展示，但需要把 diff 工具设为 `auto`。
- IDE 的 lint 警告和语法错误可共享给 Claude。
- 与 VS Code 的核心体验大体一致，最大体感差异是对话界面：JetBrains 是内置终端，VS Code 是独立图形面板。

### E. 配置与排障

- 在 Claude Code 中运行 `/config`，把 diff tool 设为 `auto`；`terminal` 则保留终端文本 diff。
- 插件设置路径为 Settings → Tools → Claude Code `[Beta]`。
- `Claude command` 默认是 `claude`；命令找不到时可配置绝对路径或文章给出的 `npx @anthropic-ai/claude-code`。
- WSL 用户可按文章提示把命令配置为 `wsl -d Ubuntu -- bash -lic "claude"`，需替换发行版名。

### F. 三个 JetBrains 专属坑与最小练习

- ESC 中断失灵：在 Settings → Tools → Terminal 中取消“使用 Escape 将焦点移动到编辑器”，或删除切换焦点快捷键。
- WSL2 检测不到 IDE：文章归因于 WSL2 NAT／Windows 防火墙阻断，并给出放行防火墙或镜像网络两种方向；视频保留“先检查网络边界、重启 IDE 和 Claude”的结论，不把防火墙命令做成可直接执行的教程中心。
- 远程开发：插件应安装在远程主机的 `Settings → Plugin (Host)`，不是本地客户端。
- 最小练习是 PyCharm 中创建 `demo.py`，写入 `greet` 函数，选中函数提问，再要求使用 f-string 和类型注解，最后在 IDE diff 中审阅。

### G. 系列结尾

- 当前篇的结论是：JetBrains 插件是轻量桥接，核心能力没有少，用户需要适应的是入口和少数专属设置。
- 最后一个视觉事件必须预告下一篇“10 桌面 app（Desktop）”，只说明它是独立、不依附编辑器的 Claude 客户端，不展开下一篇内容。

## 3. 因果、对比和流程关系

### 因果关系

- 没有 CLI 或没有插件 → JetBrains 集成无法形成完整闭环。
- 未完全重启 IDE → 插件可能安装后不生效。
- 从 IDE 内置终端启动 → 自动连接；从外部终端启动 → 需要 `/ide`。
- 未从项目根目录启动 → Claude 与 IDE 可能看到不同文件。
- diff 未设为 `auto` → 改动不会按文章描述进入 IDE 并排查看器。
- ESC 绑定到移焦点 → ESC 不能可靠中断 Claude。
- WSL2 网络或防火墙阻断 → `/ide` 可能检测不到 Windows 上的 IDE。
- 远程开发插件装在本地客户端 → 远程项目侧无法正常接通。

### 对比关系

| 维度 | JetBrains | VS Code |
|---|---|---|
| 对话位置 | IDE 内置终端 | 独立图形面板 |
| 选区／诊断共享 | 文章描述为支持 | 文章描述为支持 |
| 文件引用快捷键 | `Cmd+Option+K`／`Alt+Ctrl+K` | `Option+K`／`Alt+K` |
| diff | 设为 `auto` 后进入 IDE 查看器 | 文章描述为支持 |
| 核心 CLI | 同一个 Claude Code CLI | 同一个 Claude Code CLI |

### 流程关系

```text
确认 CLI
→ 安装 Claude Code [Beta] 插件
→ 完全重启 IDE
→ 选择内置终端自动连接 / 外部终端用 /ide 连接
→ 对齐项目根目录
→ diff 设为 auto
→ 选中代码并提问
→ 修改进入 IDE diff 查看器
→ 接受前审阅
```

## 4. 可视觉化内容

- “插件是桥，不是面板”：IDE、CLI、插件桥和代码／诊断／diff 三种信息流。
- 支持 IDE 家族：一个插件节点向 IntelliJ IDEA、PyCharm、WebStorm 等 IDE 分支。
- 安装流程：CLI 检查、Marketplace 安装、完全重启三个状态依次点亮。
- 两种连接路径：内置终端自动连与外部终端 `/ide` 手动连，项目根目录是共同前提。
- 核心能力：选区共享、`@` 文件引用、诊断共享、diff 查看和快捷键入口用实际 IDE 状态表达。
- 配置变化：`terminal` → `auto`，同一份代码改动从终端文本移动到 IDE diff。
- 三个坑：ESC 焦点、WSL2 网络、远程主机插件位置，用三条排障路径表达。
- 最小练习：`demo.py` 的 `greet` 函数从原始代码变成带类型注解和 f-string 的 diff。
- 结尾分流：当前篇 JetBrains 集成 → 下一篇独立 Desktop app。

## 5. 可弱化或删除的信息

- 文章中的 AirDrop、车型和 Wi-Fi 类比可作为旁白辅助，但不必全部上屏，避免画面文字变多。
- 菜单快捷键、完整安装命令和完整防火墙规则不全部塞进同一幕；只展示与操作判断直接相关的关键片段。
- 插件官网 URL、上一篇链接和图片资源路径不作为主要画面内容；保留 Source 完整性，但视觉原型使用无外部资源的模拟界面。
- WSL2 的两套网络方案不展开为网络配置教程，保留根因、方向和重启动作即可。
- “业界最强”等带有作者判断色彩的修辞不作为视频结论。

## 6. 内容与视频表达取舍

- 不按文章 01—09 逐段朗读，而是按“误解 → 关系 → 安装 → 连接 → 能力 → 排障 → 验证 → 选择”的认知路径组织。
- 旁白解释为什么 JetBrains 体验不同、什么时候选哪种连接方式、为什么要做配置和排障；画面展示桥接、连接、状态改变和 diff 结果。
- 每个 Scene 只保留一个主视觉事件；安装、连接和排障不会做成同时堆满文字的静态功能墙。
- 所有屏幕文字都来自 Source，或是对 Source 操作关系的最小化标签；不把 VS Code 文章中的固定文案或业务状态带入本片。

## 7. Gate 1 内部一致性检查

- [x] 核心命题已从 Source 提取，未把 JetBrains 误写成 VS Code 的同一界面。
- [x] CLI、插件、重启、两种连接、项目根目录、五个核心功能、`auto`、三个坑和最小练习均有内容承载。
- [x] 支持名单与“名单外未明确支持”的边界已保留。
- [x] 因果、对比、流程和可视觉化内容已建立，可供后续 Scene 设计使用。
- [x] 下一篇只作为结尾预告，不读取、不展开 `10-desktop.md`。
- [x] 未执行文章中的命令，未把文章内的指令当作工作指令。

## 8. 下一步

基于本分析生成按观众认知顺序组织的 Video Narrative，再拆成每幕一个主要认知任务的 Scene Script。
