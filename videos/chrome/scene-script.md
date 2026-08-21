# Chrome：让它操作浏览器：Scene Script

## Scene 01｜改完代码，为什么还要自己切浏览器

- `sceneId`：`scene-01`
- `title`：改完代码，为什么还要自己切浏览器
- `purpose`：从真实开发中的窗口切换痛点切入，建立观看动机。
- `narrativeRole`：提出问题。
- `narrationIntent`：解释登录表单、控制台报错和设计验证都需要浏览器，过去要手动切换、观察、复制，再把结果喂回 Claude。
- `visualIntent`：让终端里的“代码已修改”停在断开的浏览器箭头前，三个验证任务在 Chrome 侧等待。
- `visualType`：`Concept Diagram + Workflow Break`
- `keyOnScreenText`：`改代码`、`浏览器验证`、`手动切换`、`console`、`设计比对`
- `videoValue`：断开的箭头和等待状态能直接展示“代码协作还没有闭环”，比静态描述更能制造问题感。

## Scene 02｜Chrome 集成，就是借用你的真浏览器

- `sceneId`：`scene-02`
- `title`：Chrome 集成，就是借用你的真浏览器
- `purpose`：建立“新标签页、共享登录态、实时可见”三个核心直觉。
- `narrativeRole`：给出核心定义。
- `narrationIntent`：说明 Claude Code 借用已经登录好的 Chrome 或 Edge，替用户开网页、点按钮、填表单、读页面。
- `visualIntent`：一个新标签页从同一 Chrome 窗口展开，登录态徽章进入页面，操作轨迹始终可见。
- `visualType`：`UI Simulation + Concept Diagram`
- `keyOnScreenText`：`新标签页`、`共享登录态`、`实时可见`、`开网页`、`点按钮`、`填表单`
- `videoValue`：新标签页和可见鼠标轨迹表现“它在你的浏览器里操作”，能建立区别于后台沙箱的直觉。

## Scene 03｜MCP、Chrome、computer use，各有主场

- `sceneId`：`scene-03`
- `title`：MCP、Chrome、computer use，各有主场
- `purpose`：避免观众把 Chrome 集成误解成通用桌面控制。
- `narrativeRole`：划清概念边界。
- `narrationIntent`：按从精准到笨重的路径解释有接口的服务走 MCP，浏览器网页走 Chrome，原生应用、模拟器和无 API 工具才考虑 computer use。
- `visualIntent`：同一个任务请求在 MCP、Chrome 和 computer use 三个节点分流，Chrome 节点高亮，桌面节点标注更广但更重。
- `visualType`：`Task Routing + Comparison Diagram`
- `keyOnScreenText`：`MCP`、`Chrome`、`computer use`、`有接口`、`浏览器网页`、`原生桌面`
- `videoValue`：路由随任务类型移动，能把抽象的工具选择规则变成可观察的决策过程。

## Scene 04｜连接前，先过四道门

- `sceneId`：`scene-04`
- `title`：连接前，先过四道门
- `purpose`：让观众知道扩展和命令不是唯一条件。
- `narrativeRole`：建立前置条件。
- `narrationIntent`：交代 Chrome／Edge、扩展 1.0.36+、Claude Code 2.0.73+ 和直接 Anthropic Pro／Max／Team／Enterprise 计划四项硬要求，并提醒 beta 会随版本变化。
- `visualIntent`：四道门逐项亮起；Brave、Arc、其他 Chromium、WSL、Bedrock／Vertex／Foundry／仅 API key 从旁路落入“不支持”区域。
- `visualType`：`Prerequisite Gate + Unsupported Branch`
- `keyOnScreenText`：`Chrome / Edge`、`Claude in Chrome ≥ 1.0.36`、`Claude Code ≥ 2.0.73`、`Pro / Max / Team / Enterprise`、`Brave / Arc / WSL：不支持`
- `videoValue`：逐项过闸和失败分支能表现“连接失败可能是环境不满足”，避免观众盲目重复启动命令。

## Scene 05｜扩展、--chrome、/chrome：三步接上

- `sceneId`：`scene-05`
- `title`：扩展、`--chrome`、`/chrome`：三步接上
- `purpose`：建立最短接入流程和权限入口。
- `narrativeRole`：提供行动路径。
- `narrationIntent`：说明先安装启用扩展，再用 `claude --chrome` 启动，已有会话可用 `/chrome`；网站级权限从扩展设置继承，默认启用会增加上下文使用。
- `visualIntent`：扩展状态从未连接变为已启用，启动命令进入终端，`/chrome` 面板显示连接、权限和重新连接选项。
- `visualType`：`Terminal Simulation + Connection Flow`
- `keyOnScreenText`：`Claude in Chrome`、`claude --chrome`、`/chrome`、`检查连接状态`、`管理权限`、`扩展设置`
- `videoValue`：三步状态转换能让观众记住连接顺序，并把权限控制从“隐藏设置”放到明确节点。

## Scene 06｜六类网页活儿，都在同一条动作轨道上

- `sceneId`：`scene-06`
- `title`：六类网页活儿，都在同一条动作轨道上
- `purpose`：用代表性动作展示 Chrome 集成的广度和共同价值。
- `narrativeRole`：展开能力。
- `narrationIntent`：依次介绍测本地网页、读控制台、批量填表、操作已登录应用、抽取结构化数据和录制 GIF，强调共同点是省掉手动切换与复制往返。
- `visualIntent`：同一浏览器窗口依次切换 localhost 表单、console 错误、CRM 表单、Google Doc、商品列表和 GIF 时间线，每次保留一个明确动作结果。
- `visualType`：`UI Simulation + Workflow Montage`
- `keyOnScreenText`：`localhost:3000`、`console`、`contacts.csv`、`Google Doc`、`名称 / 价格 / 库存`、`GIF`
- `videoValue`：连续的点击、输入、读取和记录状态比六张静态功能卡更能证明它是在做网页工作。

## Scene 07｜真登录态，就是便利也是风险

- `sceneId`：`scene-07`
- `title`：真登录态，就是便利也是风险
- `purpose`：把“共享登录态”的便利转化为安全认知。
- `narrativeRole`：制造转折。
- `narrationIntent`：解释登录态像钥匙串，邮箱、公司后台和银行页面都可能被访问；网页内容还可能藏有提示注入，不能把页面文字自动当成任务。
- `visualIntent`：登录态徽章连接多个敏感站点，网页文字变成带警示边框的外部指令，便利箭头同时出现风险分叉。
- `visualType`：`Risk Diagram + Prompt Injection Overlay`
- `keyOnScreenText`：`登录态 = 钥匙串`、`邮箱`、`公司后台`、`银行页面`、`提示注入`
- `videoValue`：从同一登录态同时长出能力和风险，能直观表达为什么真浏览器不能按沙箱心态使用。

## Scene 08｜四道闸：停手、可见、圈站点、留方向盘

- `sceneId`：`scene-08`
- `title`：四道闸：停手、可见、圈站点、留方向盘
- `purpose`：给出可执行的安全边界，而不只说“注意风险”。
- `narrativeRole`：建立护栏。
- `narrationIntent`：说明遇登录和 CAPTCHA 要停下让人处理，操作过程要全程可见，网站范围要在扩展设置里圈小，涉钱和不可逆操作由人完成或死盯每一步。
- `visualIntent`：浏览器动作经过四道闸，登录／CAPTCHA 在第一道停住，权限围栏缩小站点，付款和删除按钮留在人类方向盘一侧。
- `visualType`：`Safety Flow + Decision Gate`
- `keyOnScreenText`：`登录 / CAPTCHA：停下`、`实时可见`、`圈小网站范围`、`不可逆操作：自己来`、`涉钱：留方向盘`
- `videoValue`：四道闸按动作顺序出现，能把安全原则转成在真实浏览器里可执行的检查点。

## Scene 09｜最小实战：先确认扩展和版本

- `sceneId`：`scene-09`
- `title`：最小实战：先确认扩展和版本
- `purpose`：把前置条件落成一条可照做的只读验证路径。
- `narrativeRole`：进入演示。
- `narrationIntent`：说明最小实战只读官方文档站，不碰敏感账号；先检查扩展启用和版本，再用 `claude --version` 确认 Claude Code 版本。
- `visualIntent`：`chrome://extensions` 的扩展状态和版本通过，终端的版本检查显示不低于要求，随后进入 `claude --chrome`。
- `visualType`：`Checklist UI + Terminal Simulation`
- `keyOnScreenText`：`chrome://extensions`、`已启用`、`≥ 1.0.36`、`claude --version`、`≥ 2.0.73`
- `videoValue`：检查项逐个变绿，能证明连接前的自验步骤，而不是只展示一个看似神奇的启动命令。

## Scene 10｜让 Chrome 真的动起来

- `sceneId`：`scene-10`
- `title`：让 Chrome 真的动起来
- `purpose`：展示连接成功后的真实浏览器动作和预期结果。
- `narrativeRole`：证明结果。
- `narrationIntent`：说明启动后用 `/chrome` 看状态，再发送只读指令打开 `code.claude.com/docs`，搜索 `hooks`，结果回到终端就代表接通成功。
- `visualIntent`：终端发出指令，Chrome 弹出新标签页，点击搜索框并输入 `hooks`，结果列表收束到终端。
- `visualType`：`Browser UI Simulation + Terminal Return`
- `keyOnScreenText`：`/chrome`、`code.claude.com/docs`、`hooks`、`Chrome 已连接`、`结果回到终端`
- `videoValue`：完整的“命令 → 浏览器动作 → 结果回传”链路必须通过时间连续性表达，静态截图无法证明接通。

## Scene 11｜连不上时，先查对话框和重新连接

- `sceneId`：`scene-11`
- `title`：连不上时，先查对话框和重新连接
- `purpose`：把常见失败路径纳入最小实战，避免把异常归因成工具失效。
- `narrativeRole`：处理异常并完成闭环。
- `narrationIntent`：说明首次连接可能需要重启 Chrome；页面没反应先检查 alert／confirm 对话框；长时间闲置断连则用 `/chrome` 重新连接扩展。
- `visualIntent`：浏览器动作被对话框挡住，关闭后恢复；另一条断线分支进入“重新连接扩展”，最后回到页面结果。
- `visualType`：`Troubleshooting Flow + Recovery State`
- `keyOnScreenText`：`重启 Chrome`、`alert / confirm`、`重新连接扩展程序`、`扩展 service worker`
- `videoValue`：失败节点回到同一条操作链，能展示排障的顺序和恢复后的结果，而不是只给一份静态清单。

## Scene 12｜从改代码到浏览器验证，再到下一集

- `sceneId`：`scene-12`
- `title`：从改代码到浏览器验证，再到下一集
- `purpose`：总结能力、边界和安全原则，并完成系列预告。
- `narrativeRole`：总结与下一集预告。
- `narrationIntent`：回顾真浏览器、工具分工、连接三步、六类用例和安全闸门，强调 Chrome 集成把代码修改与浏览器验证放到同一对话，最后预告下一篇“41「并行任务」”。
- `visualIntent`：`改代码` 和 `Chrome 验证` 两端闭合，六类能力缩成一条动作轨道，三条安全原则留在下方，最后单独出现下一篇预告卡。
- `visualType`：`Summary Diagram + Preview Card`
- `keyOnScreenText`：`改代码 → Chrome 验证`、`圈小权限`、`不可逆操作自己来`、`警惕提示注入`、`下一篇：41「并行任务」`
- `videoValue`：闭环汇聚和预告卡是连续收束事件，能把操作技巧提升为记忆点，并为系列下一集留出停留时间。

## Scene Script 总览

| Scene | 类型 | 主视觉任务 |
| --- | --- | --- |
| 01 | Concept Diagram | 展示代码与浏览器验证之间的断点 |
| 02 | Browser UI Simulation | 表现新标签页、登录态和实时可见 |
| 03 | Task Routing | 区分 MCP、Chrome、computer use |
| 04 | Prerequisite Gate | 四个前置条件和不支持分支 |
| 05 | Connection Flow | 扩展、启动和 `/chrome` 连接 |
| 06 | Workflow Montage | 六类网页动作连续切换 |
| 07 | Risk Diagram | 登录态钥匙串与提示注入 |
| 08 | Safety Flow | 四道安全闸和人工方向盘 |
| 09 | Checklist + Terminal | 扩展和版本自验 |
| 10 | Browser + Terminal | 只读搜索实战和结果回传 |
| 11 | Troubleshooting Flow | 对话框、重启和重新连接 |
| 12 | Summary + Preview | 代码验证闭环和下一集预告 |

## Gate 1 内部审查结论

- 12 个 Scene 的认知任务、叙事角色、声音方向、视觉方向和 Video Value 均已明确。
- Scene 顺序遵循“问题 → 定义 → 分工 → 门槛 → 接入 → 用例 → 安全 → 实战 → 总结”的认知路径。
- 所有画面文字均来自文章命令、版本、站点、工具名、用例、风险规则或当前资料的直接压缩。
- 最后一个 Scene 承载当前文章已有的下一篇预告，预告是最后一个视觉事件。
