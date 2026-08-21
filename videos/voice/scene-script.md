# Scene Script｜Voice 语音模式：把提示词说出来，而不是打出来

## Scene 01｜语音不是替你念代码

- **sceneId**：`voice-01`
- **title**：语音不是替你念代码
- **purpose**：从程序员打字快、语音容易听错的偏见出发，建立真实问题。
- **narrativeRole**：Opening／Problem Hook
- **narrationIntent**：说明 Voice 不负责替代变量名和函数名的精准输入，而是替代那一长段需求描述。
- **visualIntent**：左侧快速键入 `useEffect` 和 `snake_case`，右侧长需求卡片逐渐变满，语音波形接管后者。
- **visualType**：`OpeningScene / Input Reframing`
- **keyOnScreenText**：`代码要精准`、`长需求描述`、`少打一点`
- **videoValue**：用两个输入通道的速度和用途变化，直观看出语音的真正价值。

## Scene 02｜Voice 就是把话放进输入框

- **sceneId**：`voice-02`
- **title**：Voice 就是把话放进输入框
- **purpose**：建立 Voice 的准确概念，排除“语音聊天”的误解。
- **narrativeRole**：Core Concept
- **narrationIntent**：解释语音实时转成文字、落入提示词输入框，之后与手打文字完全一样使用。
- **visualIntent**：按住录音后，暗色实时转写逐字变成定稿文字，光标继续允许键盘追加。
- **visualType**：`UISimulation / Prompt Input`
- **keyOnScreenText**：`实时转写`、`提示词输入`、`语音 + 手打`
- **videoValue**：文字从波形到输入框的实时变化是 Voice 的核心交互，静态页面无法证明。

## Scene 03｜声音上云，文字回来

- **sceneId**：`voice-03`
- **title**：声音上云，文字回来
- **purpose**：说明音频处理位置和额度边界，让观众在开启前知道数据路径。
- **narrativeRole**：Data and Usage Boundary
- **narrationIntent**：说明音频流传到 Anthropic 服务器转写、不在本地处理，转录不消耗消息、令牌或 `/usage` 限制。
- **visualIntent**：麦克风音频沿上行箭头进入 Anthropic 服务器，文字沿返回箭头进入输入框，额度仪表保持不变。
- **visualType**：`ConnectionDiagram / Cloud Transcription`
- **keyOnScreenText**：`本地麦克风`、`Anthropic 服务器`、`转写文字`、`/usage：不变`
- **videoValue**：数据路径和“额度不变”是两个同时发生的状态，流程动画比文字解释更清楚。

## Scene 04｜第一道门：必须是 Claude.ai 账户

- **sceneId**：`voice-04`
- **title**：第一道门：必须是 Claude.ai 账户
- **purpose**：提前给出最关键的可用性红线，避免把认证失败误判成麦克风故障。
- **narrativeRole**：Hard Gate
- **narrationIntent**：说明 Claude.ai 账户可用，API key、Bedrock、Vertex、Foundry 和 HIPAA 组织不可用。
- **visualIntent**：Claude.ai 账户通过绿色门禁；API key 等路径撞上红色门禁并显示错误提示。
- **visualType**：`ComparisonScene / Auth Gate`
- **keyOnScreenText**：`Claude.ai 账户`、`API key`、`Bedrock / Vertex / Foundry`、`Voice mode requires a Claude.ai account`
- **videoValue**：不同认证路径的“通过／拒绝”状态需要动态对比，能直接建立排错顺序。

## Scene 05｜第二道门：本地麦克风和运行环境

- **sceneId**：`voice-05`
- **title**：第二道门：本地麦克风和运行环境
- **purpose**：说明云端转写不等于远程环境可用，建立平台和环境判断。
- **narrativeRole**：Environment Gate
- **narrationIntent**：说明 Mac、Windows、Linux 本机支持，WSL 需要 WSLg；SSH、网络版、VS Code Remote 因麦克风在本地而不可用。
- **visualIntent**：支持矩阵中本机平台亮起，WSL 标注 WSLg，远程环境变灰并把麦克风画在另一台机器上。
- **visualType**：`ComparisonScene / Support Matrix`
- **keyOnScreenText**：`Mac`、`Windows`、`Linux`、`WSLg`、`SSH：不可用`、`VS Code Remote：不可用`
- **videoValue**：把“进程在哪里”和“麦克风在哪里”的错位画出来，能解释远程失败的根因。

## Scene 06｜按住，还是点击？

- **sceneId**：`voice-06`
- **title**：按住，还是点击？
- **purpose**：让观众用交互习惯选择两种录音模式。
- **narrativeRole**：Interaction Comparison
- **narrationIntent**：对比 hold 的精确控制和 tap 的说完即走：按住 Space 录音，点击 Space 切换录音。
- **visualIntent**：左右两条轨道并行演示：hold 的键盘持续按压与松手，tap 的两次点击与停止。
- **visualType**：`ComparisonScene / Interaction Modes`
- **keyOnScreenText**：`hold · 默认`、`tap · 点击切换`、`按住 Space`、`点两次 Space`
- **videoValue**：触发和停止动作是两种不同的时间关系，分屏动态对比比模式说明更直觉。

## Scene 07｜模式差异藏在“什么时候发送”

- **sceneId**：`voice-07`
- **title**：模式差异藏在“什么时候发送”
- **purpose**：补齐预热、自动发送、三词门槛、自动停止和版本要求，防止第一次使用产生误判。
- **narrativeRole**：Interaction Detail／Pitfall
- **narrationIntent**：说明 hold 松手后默认等 Enter，tap 停止后至少三个词自动发送；展示版本门槛和自动停止条件。
- **visualIntent**：hold 显示 `keep holding…` 后进入波形，tap 显示 `v2.1.116+`、`≥3 个词`、`15 秒无声／2 分钟`。
- **visualType**：`ProcessScene / Recording State Machine`
- **keyOnScreenText**：`keep holding…`、`Enter`、`≥3 个词`、`15 秒无声`、`2 分钟`、`v2.1.69+ / v2.1.116+`
- **videoValue**：发送时机、预热和自动停止都是状态变化，适合用时间轴逐点呈现。

## Scene 08｜把 Voice 调成自己的输入开关

- **sceneId**：`voice-08`
- **title**：把 Voice 调成自己的输入开关
- **purpose**：展示 settings 中的常驻模式和自动发送配置。
- **narrativeRole**：Configuration
- **narrationIntent**：解释 `voice.enabled`、`voice.mode` 和 `voice.autoSubmit` 分别改变什么。
- **visualIntent**：设置面板从关闭切到 enabled，再在 hold／tap 间切换，最后打开 autoSubmit，输入框状态同步改变。
- **visualType**：`UISimulation / Settings`
- **keyOnScreenText**：`voice.enabled`、`mode: hold / tap`、`autoSubmit: true`、`settings.json`
- **videoValue**：设置字段到交互结果的对应关系需要前后状态变化才能被理解。

## Scene 09｜语言和触发键也有边界

- **sceneId**：`voice-09`
- **title**：语言和触发键也有边界
- **purpose**：处理中文用户最容易踩的听写语言问题，并说明按住模式的绑定风险。
- **narrativeRole**：Configuration Boundary
- **narrationIntent**：说明听写语言跟随 `language`，默认英语，文章所列支持列表暂无中文；触发键可改，但 hold 避免绑定裸字母。
- **visualIntent**：语言选择器显示 `language: en`，中文选项变为不支持提示；`meta+k` 绑定成功，裸 `v` 显示预热输入风险。
- **visualType**：`ComparisonScene / Language and Keybinding`
- **keyOnScreenText**：`language: en`、`中文：暂无`、`ja`、`ko`、`voice:pushToTalk`、`meta+k`、`避免裸字母`
- **videoValue**：支持与回退、组合键与裸字母的差异都是配置后的实际结果，适合做状态提示。

## Scene 10｜从 `/voice` 到第一句转写

- **sceneId**：`voice-10`
- **title**：从 `/voice` 到第一句转写
- **purpose**：把前面的门槛和配置落成最小可运行链路。
- **narrativeRole**：Hands-on Demo
- **narrationIntent**：依次说明检查版本、运行 `/voice`、允许麦克风、按住 Space 说英文，并观察文字进入输入框。
- **visualIntent**：终端命令依次完成，系统权限从待处理变成已允许，输入框出现 `list all files in the current directory`。
- **visualType**：`TerminalScene / Setup Demo`
- **keyOnScreenText**：`claude --version`、`/voice`、`Voice mode enabled (hold)`、`allow microphone`、`list all files in the current directory`
- **videoValue**：操作顺序和可观察结果形成验证链，不能只靠静态命令列表理解。

## Scene 11｜说一半，再用手补完

- **sceneId**：`voice-11`
- **title**：说一半，再用手补完
- **purpose**：证明语音不是封闭输入，并完成 tap 与关闭流程的结果验证。
- **narrativeRole**：Proof and Closure
- **narrationIntent**：说明松手后默认可手打补充并按 Enter 发送；可切到 tap 自动发送，最后用 `/voice off` 关闭。
- **visualIntent**：输入框先出现语音文字，再追加 `and show their sizes`；切换 tap 后自动发送，关闭后 Space 恢复普通空格。
- **visualType**：`Task Execution / Input State`
- **keyOnScreenText**：`语音转写`、`and show their sizes`、`/voice tap`、`自动发送`、`/voice off`
- **videoValue**：混合输入、自动发送和关闭是连续状态，视频能证明这条链路确实闭环。

## Scene 12｜它省的是描述成本

- **sceneId**：`voice-12`
- **title**：它省的是描述成本
- **purpose**：回收 Voice 的价值、限制和适用场景，并承接系列下一篇。
- **narrativeRole**：Summary／Next Episode Preview
- **narrationIntent**：总结 Voice 不能替代精准代码输入，但能减少长需求描述的手打成本；提醒账户、本机、语言和模式边界，预告下一篇综合实战。
- **visualIntent**：五个关键词汇聚为“省描述成本”，右下出现下一篇预告卡，保持独立停留空间。
- **visualType**：`SummaryScene / Series Preview`
- **keyOnScreenText**：`长需求描述`、`Claude.ai 账户`、`本地麦克风`、`hold / tap`、`省描述成本`、`48 综合实战`
- **videoValue**：多个前置条件汇聚为一个判断，再引出下一集，适合用收束动画建立记忆。
