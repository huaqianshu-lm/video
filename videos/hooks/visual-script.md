# 33 · 钩子（Hooks）：在固定时机自动扣扳机 · Visual Script

## 全局视觉原则

### 1. 画面不能只是重复口播

声音解释 Hook 为什么把请求变成保证、事件分别发生在何时、退出码怎样控制结果。画面展示重复次数、生命周期位置、配置路径、数据流和执行前后的状态变化。

### 2. 视觉承担“证明”和“演示”

本片的关键证明不是一句“Hook 会自动执行”，而是：

- `prettier --write` 从重复输入变成自动触发。
- `PreToolUse` 在 Bash 执行前挡住 `rm -rf`。
- stdin JSON 把文件路径或命令送入脚本。
- `exit 2` 让危险命令停在闸门前。
- `/hooks` 注册、`ls` 触发、日志出现构成验证证据。

### 3. 一个 Scene 只表达一个视觉中心

12 个 Scene 依次使用重复计数、请求／保证分流、生命周期时间线、前后闸门、作用域楼层、数据管道、文件格式化、危险命令拦截、通知连接、验证闭环、诊断表和总结路径。每幕只保留一个主要状态变化。

### 4. 少做“页面”，多做“过程”

配置示例不做成完整 settings.json 截图，而用路径、过滤器、JSON 字段和结果状态的流动表现规则。命令只显示与当前动作直接相关的部分，不把文章全部代码和安装步骤铺满画面。

### 5. 动画必须有意义

- 信息动画：计数器递增、时间线节点点亮、JSON 流入、文件状态变化、命令被阻止、日志写入。
- 注意力动画：对当前事件或退出码高亮，其他节点降噪。
- 装饰动画：只使用轻微发光和进度变化，不使用无意义粒子、旋转或复杂转场。

### 6. 画面文字语义归属

所有标题、标签、字段、命令、路径、状态和预告均可在 `videos/hooks/source.md` 或本片已冻结的 Content Analysis、Video Narrative、Scene Script、Visual Script 中找到依据。`CLAUDE.md`、`settings.json`、`PreToolUse`、`PostToolUse`、`exit 2`、`/hooks` 和 `--debug` 均来自当前 source；不引入下一篇文章的内容。

## Scene 01｜23 次重复动作，为什么还要靠记忆

### 视觉目标

让观众先感到“同一个动作重复到荒谬”，再看到它因为两次漏做而变成 CI 失败。

### 画面结构

深色工作台中央是一条终端命令行：`prettier --write`。右侧计数器从 `01` 快速跳到 `23`，下方出现“漏了 2 次”和红色 `CI rejected`。左下角放一张 `CLAUDE.md` 卡片，标签为“请求”，卡片边缘出现一次断开的虚线连接。

### 动画流程

1. 命令第一次出现，计数器变为 `01`。
2. 命令行保持同一位置，计数器分段跳到 `08`、`15`、`23`，用重复证明机械劳动。
3. 两个小型缺口从计数器中闪过，随后 `CI rejected` 从右侧压入。
4. `CLAUDE.md · 请求` 卡片淡入，连接线停在“可能漏做”状态。

### 屏幕文字

`prettier --write`、`23 次`、`漏了 2 次`、`CI rejected`、`CLAUDE.md`、`请求`

### Visual Type

Demo／Task Execution。

## Scene 02｜Hook：把请求变成保证

### 视觉目标

用一个事件触发器表现 Hook 的确定性，而不是再展示一段定义文字。

### 画面结构

左右两条路径从同一个“文件已编辑”事件出发。上方路径经过 `CLAUDE.md · 请求` 后显示灰色 `可能漏做`；下方路径经过 `Hook` 触发器后连接到自动动作，显示绿色 `guaranteed`。底部保留短句“事件发生 → 自动执行”。

### 动画流程

1. “文件已编辑”事件节点亮起。
2. 两条路径同时展开，上方路径在断点处停顿，下方路径顺利穿过 Hook。
3. 下方自动动作节点点亮，`guaranteed` 绿色状态出现。
4. 上方请求卡片淡化，观众注意力落到确定性路径。

### 屏幕文字

`CLAUDE.md`、`请求`、`Hook`、`事件发生`、`自动执行`、`可能漏做`、`guaranteed`

### Visual Type

Concept Diagram／Comparison。

## Scene 03｜Hook 挂在 Claude 生命周期的哪一刻

### 视觉目标

把事件名称放回 Claude Code 的会话、轮次和工具循环中，避免变成孤立清单。

### 画面结构

一条从左到右的生命周期轨道包含 `SessionStart`、`UserPromptSubmit`、工具循环、`Stop` 和 `SessionEnd`。工具循环放大为一个环，环的左侧是 `PreToolUse`，中间是 `Tool`，右侧是 `PostToolUse`。轨道下方用小标签显示“每个会话”“每一轮”“每次工具调用”。

### 动画流程

1. `SessionStart` 点亮，光线沿主轨道移动。
2. `UserPromptSubmit` 点亮后进入工具循环。
3. 光线在 `PreToolUse → Tool → PostToolUse` 之间循环两次，第二次缩短速度但不改变顺序。
4. 循环出口进入 `Stop`，最后到 `SessionEnd`。

### 屏幕文字

`SessionStart`、`UserPromptSubmit`、`PreToolUse`、`Tool`、`PostToolUse`、`Stop`、`SessionEnd`、`每个会话`、`每一轮`、`每次工具调用`

### Visual Type

Process／生命周期时间线。

## Scene 04｜Pre 能拦，Post 只能补刀

### 视觉目标

同时表现执行前后的不可逆差异，并让 matcher 成为一个真正的过滤动作。

### 画面结构

画面中央是 `Bash` 工具调用。左侧红色闸门写 `PreToolUse · 阻止`，右侧绿色工作台写 `PostToolUse · 事后动作`。上方有一个 matcher 筛选器，依次接收 `Edit`、`Write`、`Bash`，只点亮 `Edit|Write` 对应的动作通道。

### 动画流程

1. `Bash` 命令靠近红色闸门，闸门可在工具执行前合拢。
2. 另一条已完成的工具流穿过右侧工作台，生成“格式化／记录”小标签。
3. `Edit` 与 `Write` 进入 matcher 后变绿，`Bash` 被灰化。
4. 右下角出现 `case-sensitive`，强调大小写。

### 屏幕文字

`PreToolUse`、`PostToolUse`、`Bash`、`Edit|Write`、`阻止`、`事后动作`、`case-sensitive`

### Visual Type

Comparison／Task Routing。

## Scene 05｜Hook 配在哪个 settings 文件

### 视觉目标

用作用域和版本控制边界告诉观众“规则应该跟着谁走”。

### 画面结构

三层横向楼层从上到下是 User、Project、Local。每层同时显示文件路径、影响范围和 git 标签。右侧出现两张待放置的 Hook 卡片：`格式化`沿箭头进入 Project，`桌面通知`沿箭头进入 User。

### 动画流程

1. User、Project、Local 三层依次亮起。
2. 文件路径和范围标签逐层滑入：所有项目、团队共享、当前项目当前用户。
3. `格式化`卡片落到 `.claude/settings.json`，`桌面通知`卡片落到 `~/.claude/settings.json`。
4. Local 层的 `gitignored` 标签短暂高亮后保持静止。

### 屏幕文字

`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`所有项目`、`团队共享`、`当前项目 · 当前用户`、`gitignored`、`格式化`、`桌面通知`

### Visual Type

作用域分层／Task Routing。

## Scene 06｜Claude 和 Hook 怎么对话

### 视觉目标

把 Hook 的输入、决策和反馈变成一条清晰的数据管道。

### 画面结构

左侧是 JSON 数据包，包含 `tool_name: Bash` 和 `tool_input.command`。数据包沿 `stdin` 管道流入 Hook 脚本。脚本右侧分成四个出口：`exit 0` 绿色继续、`exit 2` 红色阻止、`stdout JSON` 紫色结构化控制、`stderr` 黄色反馈。

### 动画流程

1. JSON 数据包从左侧进入，`tool_input.command` 字段被放大一次。
2. Hook 节点读取字段后出现短暂扫描线。
3. 四条出口按顺序点亮，`exit 2` 最后变成红色闸门。
4. `stdout JSON` 显示 `permissionDecision: "deny"`，并与 `exit 2` 之间出现“不要混用”提示。

### 屏幕文字

`stdin`、`tool_name: Bash`、`tool_input.command`、`exit 0`、`exit 2`、`stdout JSON`、`stderr`、`permissionDecision: "deny"`、`不要混用`

### Visual Type

Connection Diagram／Process。

## Scene 07｜改完文件，格式化自动跟上

### 视觉目标

展示最小可复用配置的输入路径和结果，不让完整代码遮住动作关系。

### 画面结构

左侧是 `Edit` 修改的文件卡片，中间是 stdin JSON 小窗，其中高亮 `.tool_input.file_path`。右侧是 `prettier --write` 工作台，底部状态从 `needs format` 变为绿色 `formatted`。顶部 matcher 显示 `PostToolUse · Edit|Write`，旁边的 `Bash` 标签灰显。

### 动画流程

1. `Edit` 卡片落下并触发 PostToolUse。
2. 文件路径从 JSON 字段抽出，沿线传给 Prettier。
3. Prettier 工作台短暂显示运行状态，文件卡片切换为 `formatted`。
4. `Bash` 标签保持灰色，证明 matcher 没有泛匹配。

### 屏幕文字

`PostToolUse`、`Edit|Write`、`.tool_input.file_path`、`prettier --write`、`needs format`、`formatted`、`Bash`

### Visual Type

Demo／Task Execution。

## Scene 08｜危险命令，在执行前被拦住

### 视觉目标

用红色闸门明确表现 `exit 2` 的阻止效果，并补上脚本权限和安全边界。

### 画面结构

左侧 Bash 命令卡写 `rm -rf`，中间是 `PreToolUse` 红色闸门，右侧是被截断的执行轨道。闸门下方有 `exit 2` 和 `BLOCKED`。stderr 气泡回到 Claude，右下角放 `chmod +x` 和 `allow ≠ bypass deny` 两个小标签。

### 动画流程

1. `rm -rf` 从左侧驶向执行轨道。
2. Hook 扫描命令，检测到危险模式后闸门合拢。
3. `exit 2` 点亮，`BLOCKED` 状态落在命令卡上，stderr 原因气泡回流。
4. `chmod +x` 出现为脚本准备状态，`allow ≠ bypass deny` 保持安全提示。

### 屏幕文字

`PreToolUse`、`rm -rf`、`exit 2`、`BLOCKED`、`stderr`、`chmod +x`、`allow ≠ bypass deny`

### Visual Type

UI Simulation／Decision Diagram。

## Scene 09｜需要你输入时，Hook 发一条通知

### 视觉目标

表现 Notification Hook 把会话状态送到用户桌面，并保留平台差异。

### 画面结构

中央是 Claude Code 会话窗口，状态为 `waiting for input`，一条通知线路从窗口伸向三个平台节点：macOS、Linux、Windows。左上角显示 `Notification`，左下角标注个人设置路径 `~/.claude/settings.json`。

### 动画流程

1. 会话窗口停在等待状态，通知 Hook 节点亮起。
2. 线路向三个平台节点分叉，三个节点依次出现轻微通知闪烁。
3. `waiting for input` 变成“用户收到提醒”的绿色状态。
4. 线路停留，说明它是提醒而不是改变项目行为。

### 屏幕文字

`Notification`、`waiting for input`、`macOS`、`Linux`、`Windows`、`~/.claude/settings.json`

### Visual Type

Connection Diagram／UI Simulation。

## Scene 10｜五分钟跑通：注册、触发、验证

### 视觉目标

让观众看到一个无害 Hook 从配置到日志证据的完整闭环。

### 画面结构

三段连续工作区：左侧 `.claude/settings.json` 配置卡，中间 `/hooks` 只读注册列表，右侧 Bash 执行和 `claude-bash-log.txt` 日志。顶部用一条细进度线标注“写入 → 注册 → 触发 → 验证”。

### 动画流程

1. 配置卡显示 `PostToolUse`、`Bash` 和 `jq`，完成“写入”。
2. 配置沿线进入 `/hooks`，列表显示来源和 matcher，完成“注册”。
3. `ls` 从 Claude 流向 Bash，Hook 静默触发，完成“触发”。
4. `ls` 文本落入日志，绿色 `verified` 出现，完成“验证”。

### 屏幕文字

`.claude/settings.json`、`PostToolUse`、`Bash`、`jq`、`/hooks`、`ls`、`claude-bash-log.txt`、`写入`、`注册`、`触发`、`验证`、`verified`

### Visual Type

Demo／Process。

## Scene 11｜不触发时，按证据排查

### 视觉目标

用诊断表把症状和下一步检查对应起来，形成可复用的故障排查顺序。

### 画面结构

表格三列为“症状、先查、证据”。五行依次是未触发、列表没有、hook error、脚本没运行、想拦没拦住。当前行逐一高亮，右侧证据显示 `/hooks`、JSON、绝对路径、`chmod +x`、`exit 1 → exit 2` 和 `--debug`。

### 动画流程

1. 表头和第一行“压根不触发”出现，指向 `/hooks`。
2. 第二、三行依次亮起，指向 matcher、JSON、文件位置和 `jq`。
3. 第四行放大 `chmod +x`，第五行将 `exit 1` 替换成 `exit 2`。
4. 最后打开 `--debug` 日志窗口，显示 `Executing hooks` 和 `status 0`。

### 屏幕文字

`/hooks`、`matcher`、`JSON`、`command not found`、`chmod +x`、`exit 1 → exit 2`、`echo $?`、`--debug`、`Executing hooks`

### Visual Type

Diagnostic Table／Decision Diagram。

## Scene 12｜把确定性还给系统

### 视觉目标

把全片机制压缩成一条可执行路径，并把下一集预告作为最后一个视觉事件。

### 画面结构

中央横向路径包含五个节点：`事件` → `matcher` → `stdin JSON` → `exit 2` → `/hooks + --debug`，末端汇入绿色 `guaranteed`。前方路径稳定后，下一集预告卡片从下方进入，写 `34 CLI 参考手册：命令与全部标志`。

### 动画流程

1. 五个核心节点按顺序点亮，连接线随节点延伸。
2. `guaranteed` 在路径末端亮起，其他节点降低亮度。
3. 下一集卡片作为最后一个视觉事件出现，停留约 2～3 秒。
4. 不再添加新的业务文字或交互说明，保持收束画面干净。

### 屏幕文字

`事件`、`matcher`、`stdin JSON`、`exit 2`、`/hooks + --debug`、`guaranteed`、`34 CLI 参考手册：命令与全部标志`

### Visual Type

Summary／Process。

## 全片视觉类型／组件／动画标准

### 视觉类型

- `Concept Diagram`：Scene 02、Scene 06。
- `Process`：Scene 03、Scene 10、Scene 12。
- `Comparison`：Scene 02、Scene 04。
- `Task Routing`：Scene 04、Scene 05。
- `Demo`：Scene 01、Scene 07、Scene 10。
- `UI Simulation`：Scene 08、Scene 09。
- `Connection Diagram`：Scene 06、Scene 09。
- `Diagnostic Table`／`Decision Diagram`：Scene 08、Scene 11。

### 组件

- 深色横屏 Stage：16:9、1920 × 1080 构图，顶部保留 Scene 标签和标题。
- Event Node：生命周期、触发器和总结节点。
- Pipeline：stdin、stdout、stderr 与动作结果的流动线路。
- Gate：PreToolUse 的阻止闸门和 PostToolUse 的事后工作台。
- Scope Floor：User、Project、Local 三层配置范围。
- Terminal／JSON Window：只显示当前动作所需字段和命令。
- Status Badge：`guaranteed`、`formatted`、`BLOCKED`、`verified` 等状态变化。
- Diagnostic Table：症状到证据的排查映射。
- Caption：每幕底部一条短解释，控制在 1～2 行，不放口播全文。

### 动画标准

- 关键节点先出现，再沿路径连接；避免标题、卡片和字幕同时大幅移动。
- 事件循环用一次明确的回环表示，不持续快速旋转。
- 状态变化使用颜色和标签同时表达：绿色为继续／完成，红色为阻止／失败，黄色为反馈／注意，紫色为结构化控制。
- `exit 2` 的拦截必须先于执行轨道，不能把工具结果画成已完成。
- 总结节点和下一集预告最后入场，预告卡片与底部说明区保持分离，保留约 2～3 秒阅读停留。
- 所有画面文字在 1920 × 1080 下保持清晰，命令与路径使用等宽字体，标题控制在 1～2 行。

## Gate 2 内部审查结果

- [x] Narration Script 的每个 Scene 下只有实际口播，没有视觉说明、制作备注或 Gate 检查清单。
- [x] 视觉负责展示重复、时间位置、过滤、数据流、格式化、拦截、通知、验证和诊断；没有把口播全文重新铺到画面上。
- [x] 12 个 Scene 在 Scene Script、Narration Script 和 Visual Script 中按 ID、顺序和主要任务对齐。
- [x] 所有画面标题、标签、命令、路径、字段、状态和下一集预告均可追溯到当前视频生产资料。
- [x] 参考基线的“全局视觉原则 → 逐 Scene 视觉设计 → 全片视觉类型／组件／动画标准 → 下一步”结构已复用。
- [x] 未生成或引用 `tts-script.json`、音频、字幕、Timeline、Remotion 配置或渲染结果。

## 下一步

完成 `visual-prototype.html` 后执行原型结构、交互、信息密度、清洁画面和范围保护检查；本任务到此停止，不进入 TTS 或 Remotion。

