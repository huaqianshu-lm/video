# Claude Code 网页版与云端：Scene Script

> 目标：将 Video Narrative 拆成 10 个 Scene，每幕只承担一个主要认知任务。

## Scene 01｜手机修 README，电脑可以不在场

### purpose
用手机在高铁上修改 README 并最终得到 GitHub 分支的结果，击穿“必须坐在电脑前敲命令”的前提。

### narrativeRole
Opening：建立冲突和观看动机。

### narrationIntent
说明没有电脑也能从手机发起一次仓库任务，并留下“代码到底在哪跑”的问题。

### visualIntent
展示手机、车厢网络和 GitHub 分支的连续状态：任务提交、云端运行、分支等待提 PR。

### visualType
`OpeningScene + Process + Device Handoff`

### keyOnScreenText
```text
手机
README 安装命令
GitHub 分支 · 等待提 PR
```

### videoValue
只有连续展示“手机发任务 → 电脑未开 → 分支出现”的时间关系，才能让远程执行的结果形成直觉。

## Scene 02｜先看代码跑在哪台机器上

### purpose
建立本地、网页版、Remote Control 三种入口的共同判断轴。

### narrativeRole
Definition：给后续所有取舍提供稳定坐标。

### narrationIntent
解释本地是自己到岗，网页版是派云端同事，Remote Control 是用手机遥控自己的电脑；最关键的问题是代码在哪里执行。

### visualIntent
将三个入口连接到“本地机器”“Anthropic 云 VM”“手机窗口／本地机器”，突出只有 Remote Control 的手机是控制端。

### visualType
`Concept Diagram + Comparison`

### keyOnScreenText
```text
本地：你的机器
网页版：Anthropic 云 VM
Remote Control：手机遥控本地会话
代码跑在哪？
```

### videoValue
机器位置和控制窗口的连接关系需要同时出现，静态定义无法直观表达“手机不等于执行端”。

## Scene 03｜网页版：GitHub 到云端分支

### purpose
解释网页版的运行方式和三个最有价值的使用场景。

### narrativeRole
Proof：展示 Web 不是网页聊天，而是一次性云端工作环境。

### narrationIntent
说明浏览器打开 `claude.ai/code` 后，任务会在云 VM 中从 GitHub 仓库开始，完成后通过分支交付；它适合并行、本地没克隆和不想配环境。

### visualIntent
展示 GitHub 仓库克隆进一次性 cloud VM，三个独立任务分别进入隔离会话，最后输出 GitHub 分支。

### visualType
`Process + Task Routing + Cloud Sandbox`

### keyOnScreenText
```text
claude.ai/code
GitHub repo → cloud VM → branch
并行任务 · 免安装 · 不必本地 clone
```

### videoValue
克隆、隔离、运行和分支输出是 Web 的核心过程，必须用状态变化证明“云端同事”如何工作。

## Scene 04｜Web 和本地 CLI：不是替代，是分工

### purpose
让观众根据本地文件、配置和权限模式做入口选择。

### narrativeRole
Trade-off：在展示 Web 价值后补上边界，避免形成“网页版永远更好”的误解。

### narrationIntent
说明需要碰电脑上的文件、本地 MCP 或全局配置时应选本地 CLI；网页版依赖 GitHub，关闭网页仍会运行，但默认自动接受编辑，所以任务描述必须具体。

### visualIntent
用两列对照展示代码位置、本地配置、GitHub、断开后是否继续、权限模式和适用任务。

### visualType
`ComparisonScene + Decision Diagram`

### keyOnScreenText
```text
需要本地文件？→ 本地 CLI
不需要本地环境？→ 网页版
自动接受编辑 · 任务描述要具体
```

### videoValue
这些差异是选择条件，不是装饰性信息；对照状态能让观众快速定位自己的任务。

## Scene 05｜Remote Control：手机只是本地会话的窗口

### purpose
定义 Remote Control，并明确它与网页版的执行位置不同。

### narrativeRole
Turn：从“把活交给云”转向“把本地会话交给另一台设备控制”。

### narrationIntent
说明代码、文件、本地 MCP 和项目配置仍在电脑上，手机或浏览器只负责发指令和看结果，适合本地任务换设备继续。

### visualIntent
展示电脑终端里的本地项目和运行状态保持不变，手机连接后出现同一个会话窗口，文件没有流向云 VM。

### visualType
`Comparison + Connection Diagram + UI Simulation`

### keyOnScreenText
```text
代码：你的机器
手机：遥控窗口
本地文件 · MCP · 工具 · 配置：仍可用
```

### videoValue
“控制端”和“执行端”的分离只有通过两台设备的连接与本地文件状态同时保持，才能被看懂。

## Scene 06｜三个相似命令，三个不同方向

### purpose
消除 `--remote`、`--teleport` 和 `--remote-control` 的命名混淆。

### narrativeRole
Clarification：把产品概念落到命令方向。

### narrationIntent
分别解释本地到云、云到本地，以及本地会话开放给手机／网页；特别强调 `--remote-control` 与云端无关。

### visualIntent
用同一条“本地 ↔ 云 VM”轴展示三条不同箭头，并在 Remote Control 旁边放手机窗口而不是云节点。

### visualType
`ComparisonScene + Direction Diagram`

### keyOnScreenText
```text
claude --remote "任务"：本地 → 云
claude --teleport：云 → 本地
claude --remote-control：本地 → 手机窗口
```

### videoValue
方向是命令差异的核心，箭头和执行位置比逐字解释命令名更有辨识度。

## Scene 07｜deep-links：只填入口，不替你执行

### purpose
说明 deep-links 如何准备仓库和提示词，同时建立安全边界。

### narrativeRole
Safety：把“随处可用”与“用户仍掌握发送权”同时讲清楚。

### narrationIntent
说明 `claude-cli://` 链接可以指定 GitHub 仓库和预填提示词，但点击后只是打开本地会话并填入文本，按回车前不会发送给模型。

### visualIntent
展示链接解析成仓库路径和输入框，最后停在“已填好／等待回车”的闸门状态。

### visualType
`Process + Safety Gate + UI Simulation`

### keyOnScreenText
```text
claude-cli://open?repo=acme/payments&q=review%20open%20PRs
仓库已选择
提示已填入 · 等待回车
```

### videoValue
“只填不发”是一个时序安全事实，需要用输入框停在发送前的状态表现。

## Scene 08｜五步跑通手机接管本地会话

### purpose
把 Remote Control 从抽象定义变成可复现的最小操作闭环。

### narrativeRole
Demonstration：用连续状态验证本地会话确实被手机接管。

### narrationIntent
按顺序说明查版本、启动服务器模式、按空格显示二维码、手机扫码发消息、电脑终端同步结果并用 `Ctrl+C` 收摊。

### visualIntent
用步骤轨道和电脑／手机双面板逐步点亮：URL、二维码、连接、手机消息、电脑目录结果、进程结束。

### visualType
`StepListScene + TerminalScene + Device Handoff`

### keyOnScreenText
```text
claude --version
claude remote-control
空格：显示二维码
列出当前目录下有哪些文件
Ctrl+C：结束会话
```

### videoValue
版本、二维码、消息回传和进程结束组成一个完整事件链，视频能展示每一步状态如何变化。

## Scene 09｜用户链路和云端链路不是一回事

### purpose
解释国内访问时浏览器／手机链路与云 VM 内部网络的边界。

### narrativeRole
Constraint：补充使用条件，防止把两种网络混为一谈。

### narrationIntent
说明网页版、Remote Control 和手机 app 都需要连接 `claude.ai`；而云会话访问 GitHub 或 npm 走 Anthropic 的云基础设施，不等于走用户本地网络。

### visualIntent
将浏览器／手机到 `claude.ai` 画成一条用户连接，将 cloud VM 到 GitHub／npm 画成另一条云端连接，避免两条线合并。

### visualType
`Concept Diagram + Network Boundary`

### keyOnScreenText
```text
浏览器／手机 → claude.ai
cloud VM → GitHub / npm
两条网络链路
```

### videoValue
网络边界是空间关系，分离两条连接线能直接解释“本地网络可访问”与“云任务内部联网”不是同一件事。

## Scene 10｜按任务选择，下一集看 `/init`

### purpose
收束 Web、本地 CLI、Remote Control 和 deep-links 的选择，并给出下一集预告。

### narrativeRole
Summary：形成可执行判断，打开系列下一集。

### narrationIntent
总结免安装和并行选 Web，本地文件和工具选 CLI，换设备控制本地会话选 Remote Control，deep-links 只负责准备入口；预告下一篇 `/init`。

### visualIntent
展示四张任务取舍卡，最后出现独立的“下一篇 12：项目初始化，用 `/init` 生成 CLAUDE.md”预告卡，不与字幕区域重叠。

### visualType
`SummaryScene + Decision Cards + Teaser`

### keyOnScreenText
```text
网页版：云端、免安装、并行
本地 CLI：本机文件和工具
Remote Control：手机接管本地会话
deep-links：选仓库 + 填提示
下一篇 12：项目初始化 · /init
```

### videoValue
把多个边界压缩成任务到入口的映射，并保留下一集预告，是视频结尾比文章列表更易记忆的地方。

## Gate 1／Scene 结构检查

- 10 个 Scene 与 Video Narrative 一一对应，编号连续且每幕只有一个主要认知任务。
- 每幕均明确 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- Web、Remote Control、命令方向、deep-links、操作闭环、网络边界和下一篇预告均可追溯到 source。
- 未把下一篇文章的业务内容带入本片。

**Gate 1 结论：通过。**

## 下一步

基于本 Scene Script 生成纯口播 `narration-script.md` 和互补的 `visual-script.md`，再制作横屏 Visual Prototype。
