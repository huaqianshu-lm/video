# Visual Script｜Voice 语音模式：把提示词说出来，而不是打出来

## 1. 全局视觉原则

- 16:9 横屏，1920 × 1080 构图；深色背景、冷蓝与青绿色作为可用状态，琥珀表示等待，红色只表示限制或失败。
- 画面核心是“输入框、麦克风、服务器和状态变化”，不做泛化的声波装饰。
- 声音负责解释 Voice 的价值、限制和取舍；画面负责展示转写路径、支持／拒绝、按键状态、设置变更和实战结果。
- 主标题控制在 1～2 行；每幕只保留命令、字段、状态、环境标签和结论短语，避免把口播全文上屏。
- 终端、设置面板和输入框均使用模拟 UI；所有文字必须能追溯到 `source.md` 或前置生产资料。

## 2. 逐 Scene 视觉设计

### Scene 01｜Input Reframing

- **画面结构**：左侧是快速键入的代码词，右侧是逐渐变长的需求输入框。
- **视觉动作**：代码输入保持快速闪过；长需求卡片停顿，语音波形从右侧接入并填入文字。
- **状态变化**：`代码要精准` 保持键盘通道，`长需求描述` 从键盘切换到麦克风通道。
- **动画顺序**：键盘光标 → 长文本堆积 → 波形进入 → 输入框被填满。
- **口播互补**：口播解释 Voice 不替代精准代码输入，画面只展示两类输入的分工。

### Scene 02｜Prompt Input

- **画面结构**：中央模拟 Claude Code 提示词输入框，上方显示麦克风波形，下方显示光标。
- **视觉动作**：转写文字先以较暗颜色出现，再定稿变亮；键盘继续追加一段文字。
- **状态变化**：`实时转写` → `提示词输入` → `语音 + 手打`。
- **动画顺序**：按住 Space → 暗色文字增长 → 松手定稿 → 键盘追加。
- **口播互补**：口播定义能力，画面证明转写结果和手打混用。

### Scene 03｜Cloud Transcription

- **画面结构**：左侧麦克风，中间 Anthropic 服务器节点，右侧提示词输入框；底部 `/usage` 仪表。
- **视觉动作**：音频粒子只沿本地到服务器的箭头移动，文字沿服务器返回输入框的箭头移动。
- **状态变化**：`本地麦克风` → `Anthropic 服务器` → `转写文字`；`/usage：不变` 保持绿色。
- **动画顺序**：音频上行 → 云端转写节点高亮 → 文本返回 → 额度仪表不变。
- **口播互补**：口播说明隐私和额度边界，画面只展示处理路径和不变的额度状态。

### Scene 04｜Auth Gate

- **画面结构**：四条认证路径汇入 Voice 门禁：Claude.ai 账户、API key、Bedrock／Vertex／Foundry、HIPAA 组织。
- **视觉动作**：Claude.ai 账户绿灯通过；其他路径红灯拒绝，中央短暂显示错误提示。
- **状态变化**：门禁从“等待认证”切为“允许／拒绝”。
- **动画顺序**：路径出现 → Claude.ai 通过 → 其他路径同时被挡 → 错误提示定位根因。
- **口播互补**：口播讲认证限制，画面帮助观众建立第一排错顺序。

### Scene 05｜Support Matrix

- **画面结构**：上方是 Mac、Windows、Linux、WSL；下方是 SSH、网络版、VS Code Remote；左侧固定本地麦克风图标。
- **视觉动作**：本机平台亮起，WSL 只有在接入 WSLg 标签后亮起；远程项变灰，麦克风与远端进程之间出现断开的虚线。
- **状态变化**：`本机可用`、`WSLg 前提`、`远程不可用`。
- **动画顺序**：麦克风定位 → 平台扫描 → 本机绿灯／远程灰灯 → 根因标签出现。
- **口播互补**：口播解释“麦克风在本地，进程在远端”，画面展示两者错位。

### Scene 06｜Interaction Modes

- **画面结构**：左右双轨，左侧 hold，右侧 tap；每条轨道都有 Space 键、波形和输入框。
- **视觉动作**：hold 的 Space 持续变亮，松手后波形停止；tap 的 Space 两次闪烁，第二次后状态结束。
- **状态变化**：`等待` → `录音` → `停止`，两轨触发方式不同。
- **动画顺序**：hold 轨先演示 → tap 轨追赶 → 中央显示“精控／说完即走”。
- **口播互补**：口播讲使用习惯，画面把两种时间交互并排证明。

### Scene 07｜Recording State Machine

- **画面结构**：一条横向时间轴，标出 `keep holding…`、波形、松手、Enter、自动发送、15 秒无声和 2 分钟。
- **视觉动作**：hold 轨松手停在“待 Enter”；tap 轨达到 `≥3 个词` 后直接进入“已发送”。
- **状态变化**：预热、录音、定稿、发送、自动停止分别使用不同颜色。
- **动画顺序**：版本标签先出现 → hold 预热 → tap 三词门槛 → 自动停止条件闪现。
- **口播互补**：口播解释版本和发送差异，画面突出第一次操作最容易困惑的时间点。

### Scene 08｜Settings

- **画面结构**：模拟 `settings.json` 和右侧 Voice 状态面板。
- **视觉动作**：依次切换 `voice.enabled`、`mode` 和 `autoSubmit`，右侧提示从“未启用”切为“hold／tap／自动发送”。
- **状态变化**：关闭 → 常驻 → 模式选择 → 松手自动发。
- **动画顺序**：字段高亮 → 值改变 → 输入框页脚同步改变。
- **口播互补**：口播说明长期配置意义，画面展示字段与行为的一一对应。

### Scene 09｜Language and Keybinding

- **画面结构**：左侧语言选择器，右侧 `keybindings.json`；底部是按住模式预热提示。
- **视觉动作**：`language: en` 作为默认值，中文选项显示边界提示，`ja`／`ko` 保留为可选标签；`meta+k` 绑定成功，裸 `v` 出现风险标记。
- **状态变化**：默认英语 → 语言边界 → 组合键可用／裸字母有风险。
- **动画顺序**：语言字段放大 → 支持边界标记 → 触发键替换 → 预热风险出现。
- **口播互补**：口播给出使用预期，画面不铺完整语言列表，只保留决策所需信息。

### Scene 10｜Setup Demo

- **画面结构**：左侧终端命令，右侧系统麦克风权限卡和提示词输入框。
- **视觉动作**：`claude --version` 通过；`/voice` 后权限卡从等待变为允许；输入框实时出现英文句子。
- **状态变化**：版本确认 → Voice enabled → microphone allowed → dictation active。
- **动画顺序**：命令逐行执行 → 权限确认 → Space 按下 → 文字出现。
- **口播互补**：口播走实战顺序，画面保留每一步可观察的成功信号。

### Scene 11｜Input State Closure

- **画面结构**：中央输入框，底部是 `/voice tap` 和 `/voice off` 两个终端状态标签。
- **视觉动作**：语音文字出现后，键盘追加 `and show their sizes`；切到 tap 后显示自动发送；关闭后 Space 标签恢复普通空格。
- **状态变化**：转写 → 手打补充 → Enter 发送／tap 自动发送 → Voice off。
- **动画顺序**：语音文字定稿 → 键盘追加 → 发送状态 → 关闭状态。
- **口播互补**：口播强调混合输入和关闭，画面展示 Voice 并不锁死输入方式。

### Scene 12｜Summary and Preview

- **画面结构**：中央为“省描述成本”结论，周围五个关键词环绕；右下是下一篇预告卡。
- **视觉动作**：`长需求描述`、`Claude.ai 账户`、`本地麦克风`、`hold / tap` 汇聚到结论，预告卡最后淡入。
- **状态变化**：条件回收 → 价值结论 → 下一集预告。
- **动画顺序**：关键词逐个进入 → 结论卡定格 → 预告卡停留约 2～3 秒。
- **口播互补**：口播完成价值判断和系列承接，画面只保留可回忆的关键词。

## 3. 全片视觉类型、组件和动画标准

### 3.1 视觉类型

- Scene 01：Opening／Input Reframing
- Scene 02：UI Simulation／Prompt Input
- Scene 03：Connection Diagram／Cloud Transcription
- Scene 04：Comparison／Auth Gate
- Scene 05：Comparison／Support Matrix
- Scene 06：Comparison／Interaction Modes
- Scene 07：Process／Recording State Machine
- Scene 08：UI Simulation／Settings
- Scene 09：Comparison／Language and Keybinding
- Scene 10：Terminal／Setup Demo
- Scene 11：Task Execution／Input State
- Scene 12：Summary／Series Preview

### 3.2 组件和状态

- `TerminalWindow`：展示版本检查、`/voice`、`/voice tap`、`/voice off` 和可观察输出。
- `PromptInput`：展示实时转写、定稿、手打追加和发送状态。
- `MicNode`、`CloudNode`、`Arrow`：展示音频上行与文字回传。
- `GateCard`、`SupportMatrix`：展示认证与环境支持边界。
- `ModeTrack`、`Timeline`：展示 hold／tap 触发和停止差异。
- `SettingsPanel`、`LanguagePanel`、`KeybindingPanel`：展示配置字段、语言和快捷键。
- `SummaryCard`、`PreviewCard`：展示结论和下一集预告。

### 3.3 动画标准

- 信息动画优先：文字转写、箭头流动、门禁通过／拒绝、按键按下、设置字段变化和发送状态必须可见。
- 注意力动画适量：当前状态高亮，其他状态降低对比度；错误只短暂闪烁，不做持续刺眼发光。
- 装饰动画从简：不使用无意义粒子、旋转或复杂转场，保证输入状态和屏幕文字清楚。
- 主要元素入场后至少保留足够阅读时间；Summary 预告保留约 2～3 秒。
- 原型导航、自动播放、进度提示只服务于 HTML 预览，不能成为正式视频画面文字。

## 4. 下一步

## Gate 2 内部审查

- [x] 12 个 Scene 与 Scene Script、Narration Script、Visual Script 和 Prototype 顺序一一对应。
- [x] Narration Script 每个 Scene 下只有实际口播，没有视觉说明、制作备注或检查清单。
- [x] 视觉承担转写路径、认证门禁、环境支持、录音状态、设置变化和实战结果，没有把口播全文复制到屏幕。
- [x] 所有标题、标签、命令、配置名、版本、状态和下一篇预告均可追溯到 Source 或前置生产资料。
- [x] 结构沿用基线：全局视觉原则 → 逐 Scene 视觉设计 → 全片视觉类型／组件／动画标准 → Gate 2。
- [x] Prototype 使用纯 HTML、CSS 和少量 JavaScript，无外部依赖；包含 Scene 容器、幕内字幕式结论、上一幕／下一幕／自动播放和进度提示。
- [x] Prototype 只用于静态视觉确认，不进入 TTS、`tts-script.json`、音频、字幕、Timeline 或 Remotion。

Gate 2 视觉脚本结论：通过，进入 Visual Prototype 制作。

完成 Gate 2 内部检查后停止在 Visual Prototype。按本次任务边界，不生成 `tts-script.json`、音频、字幕、Timeline，不修改 `src/videos/`，不进入 Remotion。
