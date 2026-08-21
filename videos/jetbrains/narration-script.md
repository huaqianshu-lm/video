# JetBrains 集成视频化 · 第四步：Narration Script

> 口播正文只保留实际需要朗读的内容；视觉说明、制作备注和 Gate 检查不放入 Scene 口播段落。

## Scene 01｜JetBrains 是不是二等公民？

如果你天天用 IntelliJ IDEA、PyCharm 或 WebStorm，看到 VS Code 有一个独立的 Claude 面板，可能会有一个担心：JetBrains 这边是不是少了点什么？

答案是，界面确实不一样，但这不代表核心能力少了。

## Scene 02｜插件是一座桥，不是聊天面板

JetBrains 插件不是一个独立的聊天窗口，它更像一座桥。

Claude Code 本体还是运行在终端里的 CLI。插件负责把 IDE 和终端里的 Claude 接起来，让你选中的代码、IDE 里的诊断，以及 Claude 想做的改动，在两边流动。

所以在 JetBrains 里，你真正和 Claude 对话的地方，是 IDE 自带的集成终端，而不是新开的侧边面板。对话在终端里发生，改动可以回到 IDE 的原生 diff 查看器。

## Scene 03｜CLI、插件、重启：安装前提链

安装前先记住，JetBrains 集成需要两样东西：Claude Code CLI 和 JetBrains 插件。

先在终端运行 `claude --version`，确认 CLI 已经存在。然后打开 IDE 的 Settings，进入 Plugins 和 Marketplace，搜索 Claude Code，认准带 Beta 标记的插件并安装。

装完不要只关掉窗口。完全退出 IDE，再重新打开。这个重启步骤，决定插件能不能真正生效。

文章明确列出的主流 IDE 包括 IntelliJ IDEA、PyCharm、WebStorm、PhpStorm、GoLand 和 Android Studio。其他 JetBrains IDE 能不能稳定使用，要按未明确支持来对待。

## Scene 04｜从哪里启动，决定怎么连接

插件装好以后，还要让 Claude 和当前 IDE 接通。

推荐的方式，是直接打开 IDE 底部的集成终端，运行 `claude`。因为 Claude 就是在 IDE 的环境里启动，集成功能会自动激活。

如果你已经在 iTerm 或 Windows Terminal 这类外部终端里启动了 Claude，也可以在对话中输入 `/ide`，选择对应的 JetBrains IDE，手动建立连接。

不管选哪种方式，都要从和 IDE 相同的项目根目录启动。否则 Claude 看到的文件，可能和 IDE 里打开的项目不是同一个。

## Scene 05｜接通后，核心能力怎么流动

连接成功以后，JetBrains 这边的核心增益并没有消失。

你可以用 `Cmd+Esc`，或者 Windows 和 Linux 上的 `Ctrl+Esc`，快速把焦点交给 Claude。编辑器里当前选中的代码和打开的标签页，也可以自动共享给它。

需要精确引用文件时，JetBrains 的快捷键是 macOS 上的 `Cmd+Option+K`，Windows 和 Linux 上的 `Alt+Ctrl+K`，插入的内容类似 `@src/auth.ts#L1-99`。

IDE 的 lint 警告和语法错误也能共享给 Claude，代码改动则可以回到 IDE 的 diff 查看器里审阅。

这里最明显的体感差异是：VS Code 的对话在独立图形面板里，JetBrains 的对话在 IDE 内置终端里。但底层使用的仍然是同一个 Claude Code CLI。

## Scene 06｜把 diff 从终端搬进 IDE

如果你发现改动还停留在终端文本里，不一定是插件没有工作，先检查 diff 配置。

在 Claude Code 里运行 `/config`，找到 diff tool。选择 `terminal`，改动就留在终端里；选择 `auto`，改动会在 IDE 的原生 diff 查看器中并排展示。

既然已经在 JetBrains 里工作，通常更适合把它设成 `auto`。这样每次修改都能先看清楚，再决定是否接受。

插件自己的设置在 Settings、Tools、Claude Code Beta 下面。遇到 command not found，先检查 Claude command 的路径；WSL 用户还要按自己的发行版配置对应的 WSL 启动命令。

## Scene 07｜三个 JetBrains 专属坑

JetBrains 用户还有三个特别容易遇到的坑。

第一个是 ESC 中断失灵。因为终端默认可能把 ESC 绑定成“把焦点移到编辑器”，所以你按 ESC 时，焦点走了，Claude 却没有停。去 Settings、Tools、Terminal，取消这个绑定，或者删除切换焦点到编辑器的快捷键。

第二个是 WSL2 提示没有检测到可用的 IDE。这个方向通常不是插件坏了，而是 WSL2 和 Windows IDE 之间的网络或防火墙没有放行。文章给出的方向是放行对应流量，或者在合适的 Windows 版本上使用镜像网络，然后重启 IDE 和 Claude Code。

第三个是远程开发时插件装错地方。JetBrains 远程开发真正干活的是远程主机，所以插件应该安装在 Settings、Plugin Host 里的远程主机侧，而不是本地客户端。

## Scene 08｜用 demo.py 跑通一次

最后用一个最小练习把它跑通。

在 PyCharm 里新建 `demo.py`，写一个 `greet` 函数，返回 `Hello` 加上名字。然后选中这个函数，在 Claude 终端里问：“这段选中的函数有什么可以改进的地方？”

如果选区共享生效，Claude 能直接基于这两行回答。接着再告诉它：“帮我把它改成用 f-string，并加上类型注解。”

因为前面已经把 diff 设成 `auto`，这次改动会回到 PyCharm 的并排 diff 查看器里。看清原始代码和修改结果，再决定是否接受。

插件、CLI、选区共享和 diff，这条核心链路就这样验证完了。

## Scene 09｜少的是面板，不是核心能力

所以，JetBrains 用户少的不是核心体验，而是一个独立聊天面板。

它采用的是终端对话加 IDE 原生反馈的轻量桥接方式：在正确的项目目录启动，选区和诊断可以共享，改动可以回到 IDE 里审阅，几个专属坑也有对应的处理路径。

到这里，VS Code 和 JetBrains 两个 IDE 阵营就都覆盖了。下一篇是 10 桌面 app（Desktop）：一个独立、不依附任何编辑器的 Claude 客户端。我们再来比较它适合什么场景。
