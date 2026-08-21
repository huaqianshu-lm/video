# 33 · 钩子（Hooks）：在固定时机自动扣扳机 · Scene Script

## Scene 01｜23 次重复动作，为什么还要靠记忆

- **sceneId**：`hooks-01`
- **title**：23 次重复动作，为什么还要靠记忆
- **purpose**：用手动补敲 `prettier --write` 的重复劳动建立问题钩子。
- **narrativeRole**：问题钩子。
- **narrationIntent**：说明一周重复 23 次、漏掉两次并被 CI 打回，指出“改完记得格式化”不是可靠机制。
- **visualIntent**：让同一条 prettier 命令在计数器中不断重复，最后出现 CI 驳回，再停在“请求”标签。
- **visualType**：任务执行／故障结果。
- **keyOnScreenText**：`prettier --write`、`23 次`、`漏了 2 次`、`CI rejected`、`请求`
- **videoValue**：重复计数和失败状态只有通过时间变化才能表现机械劳动的代价。

## Scene 02｜Hook：把请求变成保证

- **sceneId**：`hooks-02`
- **title**：Hook：把请求变成保证
- **purpose**：给出 Hook 定义，建立确定性控制的核心概念。
- **narrativeRole**：概念建立。
- **narrationIntent**：解释“某个事件一发生，就自动执行一段命令或请求”，并对比 Claude 是否记得与事件是否触发。
- **visualIntent**：把 `CLAUDE.md` 的请求卡片放入“可能漏做”轨道，把 Hook 卡片接到事件触发器并亮起“guaranteed”。
- **visualType**：概念对比／状态变化。
- **keyOnScreenText**：`CLAUDE.md`、`请求`、`Hook`、`事件发生`、`确定性控制`、`guaranteed`
- **videoValue**：请求到保证的转化关系需要通过分流和必然亮起的状态建立直觉。

## Scene 03｜Hook 挂在 Claude 生命周期的哪一刻

- **sceneId**：`hooks-03`
- **title**：Hook 挂在 Claude 生命周期的哪一刻
- **purpose**：建立常见生命周期事件的时序位置。
- **narrativeRole**：框架建立。
- **narrationIntent**：按会话、对话轮次和工具调用三档解释 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop` 和 `SessionEnd`。
- **visualIntent**：一条横向时间线从会话开始走到结束，工具调用区间以循环箭头标出前后两个 Hook 点。
- **visualType**：生命周期时间线／Process。
- **keyOnScreenText**：`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`Stop`、`SessionEnd`
- **videoValue**：事件名称只有放到流程位置中才有可操作意义，时间线能证明“什么时候触发”。

## Scene 04｜Pre 能拦，Post 只能补刀

- **sceneId**：`hooks-04`
- **title**：Pre 能拦，Post 只能补刀
- **purpose**：明确 `PreToolUse` 和 `PostToolUse` 的控制边界，并引出 matcher。
- **narrativeRole**：关键规则对比。
- **narrationIntent**：解释工具执行前可以阻止，工具成功后只能格式化或记录；matcher 再把范围收窄到目标工具，且区分大小写。
- **visualIntent**：同一条 Bash 命令分别经过 Pre 的红色闸门和 Post 的绿色补刀站；`Edit|Write` 过滤器只点亮目标工具。
- **visualType**：Comparison／Task Routing。
- **keyOnScreenText**：`PreToolUse`、`PostToolUse`、`Bash`、`Edit|Write`、`阻止`、`事后动作`、`case-sensitive`
- **videoValue**：前后位置与过滤结果共同决定 Hook 是否能拦截，适合用闸门和筛选器动态证明。

## Scene 05｜Hook 配在哪个 settings 文件

- **sceneId**：`hooks-05`
- **title**：Hook 配在哪个 settings 文件
- **purpose**：让观众根据影响范围选择全局、项目或本地配置文件。
- **narrativeRole**：配置落点。
- **narrationIntent**：说明用户级跟着个人走，项目级可共享给团队，本地级只给当前用户且不进 git；团队 Hook 和个人通知 Hook 的放置选择不同。
- **visualIntent**：三层 settings 依次显示路径、影响范围和版本控制标签，格式化 Hook 进入 Project，通知 Hook 进入 User。
- **visualType**：作用域分层／Task Routing。
- **keyOnScreenText**：`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`所有项目`、`团队共享`、`gitignored`
- **videoValue**：配置范围是 Hook 是否误伤其他项目或无法共享的关键，空间层级能直接表达影响半径。

## Scene 06｜Claude 和 Hook 怎么对话

- **sceneId**：`hooks-06`
- **title**：Claude 和 Hook 怎么对话
- **purpose**：建立 stdin JSON、退出码、stdout 和 stderr 的通信模型。
- **narrativeRole**：机制解释。
- **narrationIntent**：解释事件 JSON 从 stdin 进入，脚本读取 `tool_name` 和 `tool_input`，再用退出码、stdout JSON 或 stderr 返回结果。
- **visualIntent**：一张 JSON 数据包沿输入管道流入 Hook，随后分成 `exit 0`、`exit 2`、stdout JSON 和 stderr 四条出口。
- **visualType**：Connection Diagram／Process。
- **keyOnScreenText**：`stdin`、`tool_input.command`、`exit 0`、`exit 2`、`stdout JSON`、`stderr`
- **videoValue**：Hook 的行为由数据流和返回通道决定，管道分流比静态协议表更能建立因果关系。

## Scene 07｜改完文件，格式化自动跟上

- **sceneId**：`hooks-07`
- **title**：改完文件，格式化自动跟上
- **purpose**：用完整的 `PostToolUse` + `Edit|Write` 例子展示自动格式化。
- **narrativeRole**：低风险实践 Demo。
- **narrationIntent**：说明 matcher 只监听 Edit 和 Write，Hook 从 stdin 取文件路径，再交给 `prettier --write`；同一套路可替换为 lint 工具。
- **visualIntent**：`Edit` 改动文件后，路径从 JSON 中被抽出，流入 Prettier，文件状态从 `needs format` 变为 `formatted`；`Bash` 被过滤掉。
- **visualType**：Demo／Task Execution。
- **keyOnScreenText**：`PostToolUse`、`Edit|Write`、`.tool_input.file_path`、`prettier --write`、`formatted`
- **videoValue**：自动格式化的价值在“改完之后自动发生”，文件状态流转比展示完整 JSON 更重要。

## Scene 08｜危险命令，在执行前被拦住

- **sceneId**：`hooks-08`
- **title**：危险命令，在执行前被拦住
- **purpose**：展示 `PreToolUse` 脚本如何检测命令并用 `exit 2` 阻止操作。
- **narrativeRole**：安全实践 Demo。
- **narrationIntent**：说明脚本读取 `.tool_input.command`，发现 `rm -rf` 后写 stderr、返回 `exit 2`；其他命令 `exit 0`，并提醒脚本权限和不能放松权限的边界。
- **visualIntent**：Bash 命令在红色闸门前被识别，危险命令停在 `BLOCKED`，stderr 原因流回 Claude；旁边显示 `chmod +x` 和“deny 不能被 allow 绕过”。
- **visualType**：UI Simulation／Decision Diagram。
- **keyOnScreenText**：`PreToolUse`、`rm -rf`、`exit 2`、`BLOCKED`、`chmod +x`、`allow ≠ bypass deny`
- **videoValue**：阻止必须发生在工具执行前，退出码 2 与红色闸门是安全结果的直接视觉证明。

## Scene 09｜需要你输入时，Hook 发一条通知

- **sceneId**：`hooks-09`
- **title**：需要你输入时，Hook 发一条通知
- **purpose**：展示 `Notification` Hook 的个人提醒场景与平台差异。
- **narrativeRole**：实践扩展。
- **narrationIntent**：说明 Claude 等待批准或下一句输入时，可以用通知 Hook 主动提醒；macOS、Linux 和 Windows 使用不同命令，个人偏好适合放全局设置。
- **visualIntent**：Claude 会话停在 `waiting for input`，通知从会话窗口流向 macOS、Linux、Windows 三个平台卡片。
- **visualType**：Connection Diagram／UI Simulation。
- **keyOnScreenText**：`Notification`、`waiting for input`、`macOS`、`Linux`、`Windows`、`~/.claude/settings.json`
- **videoValue**：通知的意义是跨出终端把状态送到用户所在的平台，连接路径比命令全文更重要。

## Scene 10｜五分钟跑通：注册、触发、验证

- **sceneId**：`hooks-10`
- **title**：五分钟跑通：注册、触发、验证
- **purpose**：用无害 Bash 日志练习串起 Hook 的最小验证闭环。
- **narrativeRole**：实践闭环。
- **narrationIntent**：说明在练习目录配置 `PostToolUse` + `Bash`，用 `/hooks` 确认注册，让 Claude 执行 `ls`，最后查看 `claude-bash-log.txt` 验证副作用。
- **visualIntent**：配置文件进入 `/hooks` 注册列表，`ls` 从 Claude 流向 Bash，命令文本落入日志文件并出现绿色 check。
- **visualType**：Demo／Process。
- **keyOnScreenText**：`.claude/settings.json`、`PostToolUse`、`Bash`、`/hooks`、`ls`、`claude-bash-log.txt`、`verified`
- **videoValue**：Hook 是否真的触发必须有外部副作用证据，完整闭环能把抽象配置变成可验证动作。

## Scene 11｜不触发时，按证据排查

- **sceneId**：`hooks-11`
- **title**：不触发时，按证据排查
- **purpose**：把常见症状映射到注册、匹配、脚本和调试检查。
- **narrativeRole**：故障排查。
- **narrationIntent**：按 `/hooks` 注册、matcher 大小写和事件、JSON 与文件位置、脚本路径和权限、exit 2、手动 JSON、`--debug` 的顺序排查。
- **visualIntent**：诊断表从症状逐行亮起，箭头指向对应检查动作；“想拦没拦住”聚焦到 `exit 1 → exit 2`。
- **visualType**：Diagnostic Table／Decision Diagram。
- **keyOnScreenText**：`/hooks`、`matcher`、`JSON`、`chmod +x`、`exit 1 → exit 2`、`echo $?`、`--debug`
- **videoValue**：排查是一个顺序过程，诊断表的逐行定位比口播罗列更可复用。

## Scene 12｜把确定性还给系统

- **sceneId**：`hooks-12`
- **title**：把确定性还给系统
- **purpose**：回收 Hook 的定义、时机、配置、协议和验证，并承载下一集预告。
- **narrativeRole**：总结／系列承接。
- **narrationIntent**：总结 Hook 把请求变保证，提醒 `Pre`、`Post`、matcher、stdin、`exit 2` 和验证路径；最后预告源文已有的 34「CLI 参考手册」。
- **visualIntent**：五个核心节点依次点亮并汇入 `guaranteed`，最后出现下一集预告卡片，作为最后一个视觉事件停留。
- **visualType**：Summary／Process。
- **keyOnScreenText**：`事件`、`matcher`、`stdin JSON`、`exit 2`、`/hooks + --debug`、`guaranteed`、`34 CLI 参考手册`
- **videoValue**：总结需要把分散机制重新连成一条可执行路径，预告卡片提供系列连续性并保留阅读停留。

## Gate 1 内部检查

- [x] 12 个 Scene 均具备 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] Scene 顺序从问题、概念、时机、范围、协议推进到实例、验证、排查和总结，符合 Video Narrative。
- [x] `PreToolUse`／`PostToolUse`、`exit 2` 和 matcher 的事实边界没有被合并或弱化。
- [x] 所有屏幕文字均来自 `source.md` 或由源文明确关系推导，未使用其他文章内容。
- [x] Scene 12 的下一集预告是当前 source 已有的最后一个视觉事件，并与口播顺序一致。

