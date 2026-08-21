# Visual Script：Claude Code 常见问题排查

## 全局视觉原则

- 16:9 横屏，按 1920 × 1080 构图；深色背景、冷蓝主色、绿色表示已定位／健康，红色表示错误或风险，黄色表示待判断。
- 画面是“诊断工作台”，不是文章目录。声音解释判断逻辑，画面展示症状、状态、分支、证据和前后变化。
- 主标题控制在 1～2 行；终端、状态面板和路由标签使用短文本，避免把整段口播搬上屏幕。
- 每幕优先保留一个主要视觉事件：错误反转、分类分流、面板检查、边界拦截、容量恢复或实验对照。
- 所有屏幕文字都必须能在 Source 或本条生产资料中找到依据；不复用其他视频的业务文案或状态文字。
- 底部字幕区域预留安全区；原型中的上一幕／下一幕、自动播放、进度提示和说明只服务于预览，不属于正式画面。

## 逐 Scene 视觉设计

### Scene 01｜四十分钟，错在一行旧配置

### 视觉目标

让观众看到同一个错误从“账号被封”转为“旧凭证误用”，并完成修复。

### 画面结构

左侧为启动窗口，红色显示 `This organization has been disabled`，下方叠加 `Max` 和网络重试痕迹。右侧为 shell 配置卡，突出 `ANTHROPIC_API_KEY`，再切换为 `unset`，状态回到绿色 `OAuth`。

### 动画

错误出现后，`Max` 和网络标签短暂亮起；旧 key 从配置卡流入认证入口并变红；`unset` 切断旧路径，OAuth 节点重新点亮。

### 屏幕文字

`This organization has been disabled`、`Max`、`ANTHROPIC_API_KEY`、`unset`、`OAuth`

### Visual Type

Opening / State Change

### Scene 02｜先给症状分诊

### 视觉目标

把“先分类”变成一个可执行的路由板。

### 画面结构

左侧堆叠代表性症状：`command not found`、`403`、`hooks`、`529`、`context full`。中间为“先分诊”节点，右侧分成 `INSTALL`、`AUTH`、`CONFIG`、`PERF`、`API` 五个入口。

### 动画

症状标签逐个进入中央节点，再沿不同颜色路径流向类别入口；类别入口点亮后显示“查对应方向”。

### 屏幕文字

`command not found`、`403`、`hooks`、`529`、`context full`、`先分诊`、`INSTALL`、`AUTH`、`CONFIG`、`PERF`、`API`

### Visual Type

Decision Diagram / Routing Board

### Scene 03｜先敲 `/doctor`，解决不了再上报

### 视觉目标

建立“体检优先、上报兜底”的工具顺序。

### 画面结构

中央为诊断面板，依次出现 `install`、`settings`、`MCP`、`context` 四个检查项。左下分支为能启动时的 `/doctor`，右下分支为不能启动时的 `claude doctor`；面板未解决的问题最后流向 `/feedback`。

### 动画

先点亮体检项目；当其中一项出现警告时，`f` 把报告送入 Claude；仍未解决时，箭头才进入 `/feedback`。

### 屏幕文字

`/doctor`、`claude doctor`、`/feedback`、`install`、`settings`、`MCP`、`context`、`f`

### Visual Type

Step List / Diagnostic Panel

### Scene 04｜`/status` 先告诉你谁在登录

### 视觉目标

展示认证来源的分叉与旧环境变量造成的错误路径。

### 画面结构

左侧为 `/status` 面板，分出 `OAuth subscription` 和 `API key` 两条路径。API key 路径连接到 `ANTHROPIC_API_KEY` 和红色 `organization disabled`；下方显示 `unset` 后回到 OAuth。

### 动画

`/status` 扫描身份来源；旧 API key 路径闪烁红色；`unset` 消除该路径，OAuth 订阅路径变绿。

### 屏幕文字

`/status`、`OAuth subscription`、`API key`、`ANTHROPIC_API_KEY`、`organization disabled`、`unset`

### Visual Type

Comparison / Credential Flow

### Scene 05｜别猜配置，查实际加载

### 视觉目标

展示“命令对应证据面板”，并让配置排查从猜测变成读取。

### 画面结构

左侧为命令列：`/context`、`/memory`、`/hooks`、`/mcp`、`/permissions`、`/status`。右侧为对应面板：Context、Memory、Hooks、MCP、Permissions、Settings source。

### 动画

命令逐个进入扫描线；对应面板从灰色变为已加载。`/hooks` 面板中的 matcher 用红色标出大小写不匹配，修正为 `Edit|Write` 后变绿。

### 屏幕文字

`/context`、`/memory`、`/hooks`、`/mcp`、`/permissions`、`/status`、`Context`、`Memory`、`Hooks`、`MCP`、`Permissions`、`loaded`、`Edit|Write`

### Visual Type

Process / Diagnostic Board

### Scene 06｜CLAUDE.md 是请求，不是硬保证

### 视觉目标

让观众理解自然语言请求、硬约束和字面命令匹配的差别。

### 画面结构

左侧为 `CLAUDE.md` 卡片，标签为 `request`；中间为 `deny` 和 `PreToolUse` 两道绿色闸门；右侧展示 `Bash(rm *)` 下方的 `/bin/rm` 与 `find . -delete`，其中未匹配项穿过旧规则。

### 动画

自然语言请求被一条红色等效命令绕过；加入 deny／hook 后，多个命令变体逐一被挡下；`/permissions` 作为状态检查入口亮起。

### 屏幕文字

`CLAUDE.md`、`request`、`deny`、`PreToolUse`、`Bash(rm *)`、`/bin/rm`、`find . -delete`、`/permissions`

### Visual Type

Comparison / Security Boundary

### Scene 07｜先收拾工作台

### 视觉目标

展示上下文过满到恢复，以及搜索环境的旁路检查。

### 画面结构

左侧为 Context 容量条，从 `Context full` 红色状态回落；中间依次为 `/compact`、重启、`claude --resume`；右侧小卡显示 `chunked read`、`ripgrep` 和 `/terminal-setup`。

### 动画

文件标签持续涌入使容量条变红；`/compact` 压缩内容，重启后用 `claude --resume` 接回；大文件改为分块进入，容量条回到安全区。

### 屏幕文字

`Context full`、`/compact`、`claude --resume`、`chunked read`、`ripgrep`、`/terminal-setup`

### Visual Type

State Change / Terminal

### Scene 08｜服务器、额度，还是你的请求

### 视觉目标

用分流画面区分 API 错误的责任方和处理动作。

### 画面结构

中央为错误输入区，四条路径通向 `Server`、`Quota`、`Request`、`Network`。每个终点显示一个代表性错误和动作：状态页、`/usage`、`/compact`、`curl`。

### 动画

`API Error: 500` 和 `529 Overloaded` 进入 Server；`hit your limit` 进入 Quota；`Prompt is too long` 进入 Request；`Unable to connect` 进入 Network。四个终点用不同颜色停住。

### 屏幕文字

`API Error: 500`、`529 Overloaded`、`hit your limit`、`Prompt is too long`、`Unable to connect`、`Server`、`Quota`、`Request`、`Network`、`status.claude.com`、`/usage`、`curl`

### Visual Type

Comparison / Decision Diagram

### Scene 09｜实时日志加干净配置对照

### 视觉目标

把“怪问题”转化为可观察、可二分的实验。

### 画面结构

左侧为 Debug Console，三条入口分别是 `claude --debug`、`--debug mcp`、`--debug hooks`，日志中出现 matcher 和连接状态。右侧为 Daily Config 与 `clean config` 对照，中间标记 `problem disappears?`，下方显示 `add one variable`。

### 动画

日志线实时滚动并在命中点停下；右侧切换到 clean config 后错误消失，配置项逐一回流，某一项重新触发错误时被红框锁定。

### 屏幕文字

`claude --debug`、`--debug mcp`、`--debug hooks`、`event: PostToolUse`、`matcher: no match`、`server: connected`、`CLAUDE_CONFIG_DIR`、`clean config`、`problem disappears?`、`add one variable`

### Visual Type

Comparison / Debug Flow

### Scene 10｜从版本到干净会话

### 视觉目标

把全文方法组装成观众可以照跑的体检链。

### 画面结构

横向四步链：`claude --version` → `/doctor` → `/status` → `CLAUDE_CONFIG_DIR=/tmp/claude-clean`。每步下方对应 `version`、`healthy`、`credential`、`baseline` 四个证据标签。

### 动画

步骤从左到右依次亮起；每完成一步，证据标签锁定为绿色。最后 clean session 卡片展开，显示不加载平时的 `CLAUDE.md`、MCP 和自定义设置。

### 屏幕文字

`claude --version`、`/doctor`、`/status`、`CLAUDE_CONFIG_DIR=/tmp/claude-clean`、`version`、`healthy`、`credential`、`baseline`

### Visual Type

Step List / Terminal

### Scene 11｜先分诊，再查证据

### 视觉目标

形成一张可截图的排查速查板。

### 画面结构

左侧为五类问题：`INSTALL`、`AUTH`、`CONFIG`、`PERF`、`API`；右侧逐行对应首个动作：`/doctor`、`/status`、`/hooks`／`/mcp`、`/compact`、状态页／`curl`。顶部显示 `分诊 → 查状态 → 按根因处理 → 留证据`。

### 动画

四个总动作先从顶部依次点亮；五类问题逐行接入对应动作，全部完成后形成稳定的诊断地图。

### 屏幕文字

`分诊`、`查状态`、`按根因处理`、`留证据`、`INSTALL`、`AUTH`、`CONFIG`、`PERF`、`API`、`/doctor`、`/status`、`/compact`、`--debug`

### Visual Type

Summary / Diagnostic Map

### Scene 12｜下一篇：术语表

### 视觉目标

让下一集预告成为最后一个视觉事件，并承接 Source 的系列导航。

### 画面结构

总结地图收起后，中央升起一张独立预告卡：`下一篇`、`52 · 术语表`、`小白友好`。卡片下方以小标签列出 `CLAUDE.md`、`Context`、`MCP`、`Subagent`、`Hook`。

### 动画

Scene 11 的诊断地图先淡出；预告卡从底部进入，标签依次出现，最后保持 2～3 秒。卡片避开底部字幕安全区。

### 屏幕文字

`下一篇`、`52 · 术语表`、`小白友好`、`CLAUDE.md`、`Context`、`MCP`、`Subagent`、`Hook`

### Visual Type

Summary / Teaser Card

## 全片视觉类型／组件／动画标准

### 视觉类型

- Opening / State Change：Scene 01。
- Decision Diagram / Routing Board：Scene 02、08。
- Step List / Diagnostic Panel：Scene 03、10。
- Comparison / Credential Flow：Scene 04。
- Process / Diagnostic Board：Scene 05。
- Comparison / Security Boundary：Scene 06。
- State Change / Terminal：Scene 07。
- Comparison / Debug Flow：Scene 09。
- Summary / Diagnostic Map：Scene 11。
- Summary / Teaser Card：Scene 12。

### 组件

- Scene 容器：统一标题、eyebrow、主工作区和幕内字幕。
- Diagnostic Card：承载错误、状态和检查结果。
- Terminal／Console：承载命令、输出和日志过程。
- Route Node：承载类别和分支关系。
- Status Pill：表达 healthy、loaded、credential 和 baseline 等状态。
- Teaser Card：仅在最后一幕承载下一篇预告。

### 动画标准

- 一级信息动画：路径分流、状态变色、容量下降、步骤点亮、错误被拦截。
- 二级注意力动画：错误闪烁、matcher 命中、旧 key 红框和证据标签锁定。
- 三级装饰动画：轻微背景光、边框呼吸和面板淡入，不抢夺诊断信息。
- 动画节奏以“看清命令—看清状态—看清结果”为单位，不使用快速跳切。

## Gate 2 视觉与文字归属检查

- 12 个 Scene 在 Visual Script 中逐一对应 Scene Script 与 Narration Script。
- 每个 Scene 均明确画面结构、动画、屏幕文字和 Visual Type。
- 屏幕文字仅使用 Source 或本条生产资料中的命令、错误、路径、类别和总结标签。
- Scene 12 的预告主题、顺序和停留要求与 Source 结尾一致。
- 静音检查：仅看画面可以识别错误反转、分类、工具、分支、对照和体检链。
- 去重检查：画面展示状态和过程，不逐字复制旁白。
- Motion Value 检查：动画都承担分流、拦截、恢复、匹配或锁定证据的含义。
- Video Value 检查：每幕均有必须使用过程、对照或状态变化表达的理由。

**Gate 2 视觉部分：通过。**

## 下一步

Gate 2 完成后按用户本次边界停止。不得进入 TTS、`tts-script.json`、音频、字幕、Timeline 或 Remotion 正式实现。
