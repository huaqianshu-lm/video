# Visual Script｜开发配置：把 Claude 干活的工作环境调顺

## 全局视觉原则

- 采用 16:9 横屏、1920 × 1080 构图思路，延续基线的深色、克制、科技教程视觉。
- 画面以终端、配置卡、隔离边界、网络链路和模型排班为主体，不做文章段落的逐屏复制。
- 声音负责解释原因、边界和选择；画面负责展示状态变化、范围差异和验证结果。
- 主标题控制在 1～2 行，关键标签使用短语、命令或配置名；字幕区域预留在底部，原型仅放幕内提示文本。
- 所有画面文字都来自 Source、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；不复用参考视频的业务语义。
- 采用渐进式视觉复杂度：开场风险 → 五维框架 → 隔离边界 → 网络／终端／模型 → 验证闭环 → 预告收束。

## Scene 01｜别再靠一只手按着 `Ctrl+C`

### 视觉目标



### 画面结构

左侧是客户私有仓库的终端窗口，文件树旁出现 `SSH 密钥`、`npm 凭据` 和 `一下午人工监控` 三个风险标签；右侧先显示主机边界，再出现半透明的 `隔离环境` 框。

### 视觉动作

1. `客户私有仓库` 和终端命令出现。
2. `SSH 密钥`、`npm 凭据`、`一下午人工监控` 依次亮起。
3. `隔离环境` 边界从右侧推入，风险标签被收进边界外的暗色区域。

### 口播互补

声音讲人工盯命令的疲惫和问题转向；画面只展示风险对象与边界变化。

### 屏幕文字

`客户私有仓库`、`SSH 密钥`、`npm 凭据`、`一下午人工监控`、`隔离环境`

### Visual Type

`OpeningScene / Risk-to-Isolation Transition`

## Scene 02｜开发配置其实只管五件事

### 视觉目标



### 画面结构

中央是一张深色工作台，五个区域围绕 Claude Code：`隔离`、`网络`、`终端`、`模型`、`验证`。每个区域下放一个最短问题标签：`隔到哪`、`连不连得上`、`顺不顺手`、`派谁来`、`真的生效吗`。

### 视觉动作

1. 五个区域从中央依次展开。
2. 代表困扰标签沿连线落入对应区域。
3. 所有区域收拢成一张“工作环境”面板，突出分类而非开关数量。

### 口播互补

声音解释五类配置的意义；画面把分类关系空间化，不重复口播句子。

### 屏幕文字

`隔离`、`网络`、`终端`、`模型`、`验证`、`隔到哪`、`连不连得上`、`顺不顺手`、`派谁来`、`真的生效吗`

### Visual Type

`ConceptScene / Five-Part Workbench`

## Scene 03｜沙箱给 Bash 圈一块试车场

### 视觉目标



### 画面结构

左侧为终端窗口，顶部显示 `/sandbox`；中央为 `自动允许` 面板，右侧为一块写着 `当前工作目录` 的沙箱区域，外侧是 `新网络域：需要批准` 的门。

### 视觉动作

1. `/sandbox` 进入终端。
2. `自动允许` 选项被点亮，命令在当前工作目录内直接执行。
3. 命令靠近新网络域时，门变为等待批准状态。

### 口播互补

声音解释操作系统边界和权限提示的关系；画面展示圈内与跨界两个状态。

### 屏幕文字

`/sandbox`、`自动允许`、`当前工作目录`、`新网络域：需要批准`

### Visual Type

`TerminalScene / Sandbox Boundary`

## Scene 04｜沙箱不是整台 Claude 的防护罩

### 视觉目标



### 画面结构

左右两栏：左栏是带绿色边框的 `Bash：在沙箱内`；右栏是主机区域，放置 `Read / Edit`、`WebFetch`、`MCP`、`Hook`。底部出现指向 `容器 / VM` 的升级路径。

### 视觉动作

1. Bash 命令被锁进沙箱栏。
2. 其他动作从 Claude 节点直接连到主机栏。
3. 画面中央出现“只管 Bash”的边界线，容器／虚拟机路径向外展开。

### 口播互补

声音完成限制说明；画面用不同边框证明哪些动作受控、哪些动作仍在主机。

### 屏幕文字

`Bash：在沙箱内`、`Read / Edit`、`WebFetch`、`MCP`、`Hook`、`仍在主机`、`容器 / VM`

### Visual Type

`ComparisonScene / Scope Boundary`

## Scene 05｜devcontainer 是一间团队共用的工作间

### 视觉目标



### 画面结构

左侧代码窗口显示 `.devcontainer/devcontainer.json` 和 `Claude Code Feature`；箭头指向中间的 `Docker` 容器；右侧分成 `命令在容器` 与 `改动落本地` 两张结果卡，底部放 `不要挂载 SSH 密钥` 安全提示。

### 视觉动作

1. 配置文件和 Docker 标签出现。
2. 命令流进入容器，容器内显示一致的开发环境。
3. 修改结果从容器同步到本地仓库，SSH 密钥提示保持为警示状态。

### 口播互补

声音解释团队一致和无人值守；画面强调执行位置与结果位置的差异。

### 屏幕文字

`.devcontainer/devcontainer.json`、`Docker`、`Claude Code Feature`、`命令在容器`、`改动落本地`、`不要挂载 SSH 密钥`

### Visual Type

`ProcessScene / Devcontainer Setup`

## Scene 06｜代码越不熟，隔离就越往右

### 视觉目标



### 画面结构

横向五段梯度：`不开隔离` → `/sandbox` → `devcontainer` → `容器 / VM` → `Claude Code on the web`。上方是从低到高的 `隔离强度`，下方是三个场景标签：`个人日常`、`团队一致／无人值守`、`完全不信任代码`。

### 视觉动作

1. 五段隔离方式从左到右依次亮起。
2. 信任程度箭头向右移动，隔离强度同步增高。
3. 三个场景标签落到对应区间，形成选择路径。

### 口播互补

声音讲取舍和适用场景；画面展示连续梯度，不把某一种方式绝对化。

### 屏幕文字

`不开隔离`、`/sandbox`、`devcontainer`、`容器 / VM`、`Claude Code on the web`、`隔离强度`、`个人日常`、`团队一致／无人值守`、`完全不信任代码`

### Visual Type

`ComparisonScene / Isolation Gradient`

## Scene 07｜连不上，先查网络三段链路

### 视觉目标



### 画面结构

从 `Claude Code` 到服务端的三段网络路径：`代理总机`、`CA 安检章`、`域名白名单`。左下角显示 `HTTPS_PROXY`、`NO_PROXY` 和 `NODE_EXTRA_CA_CERTS`，旁边有 `不支持 SOCKS` 警示。

### 视觉动作

1. 请求在代理节点前停住，`HTTPS_PROXY` 点亮后继续。
2. 请求经过 CA 节点，`NODE_EXTRA_CA_CERTS` 作为可选补充出现。
3. `api.anthropic.com` 通过白名单门禁，其他域名保持等待状态。

### 口播互补

声音解释代理、证书和白名单的分工；画面用逐段通行证明“连不上”的定位路径。

### 屏幕文字

`HTTPS_PROXY`、`NO_PROXY`、`NODE_EXTRA_CA_CERTS`、`api.anthropic.com`、`不支持 SOCKS`

### Visual Type

`ProcessScene / Network Route`

## Scene 08｜终端只调三样：换行、通知、主题

### 视觉目标



### 画面结构

三张并列卡片：

1. `换行`：`Shift+Enter`、`/terminal-setup`、`Ctrl+J`。
2. `通知`：`terminal_bell` 和完成提示。
3. `主题`：`/theme` 与自动明暗切换。

### 视觉动作

1. 第一张卡从“提交”状态切到“换行”状态。
2. 第二张卡从静默终端切到铃声提示。
3. 第三张卡切换深色／浅色示意，但保持 Claude Code 界面范围。

### 口播互补

声音给出终端差异和万能后路；画面只显示三种前后状态。

### 屏幕文字

`Shift+Enter`、`/terminal-setup`、`Ctrl+J`、`terminal_bell`、`/theme`

### Visual Type

`UISimulation / Terminal Preferences`

## Scene 09｜模型像排班：硬活派 Opus，日常用 Sonnet

### 视觉目标



### 画面结构

四张模型卡按任务难度排成队列：`opus`—`复杂推理`、`sonnet`—`日常编程`、`haiku`—`简单任务`、`opusplan`—`规划：Opus／执行：Sonnet`。右下角显示“能力／成本”。

### 视觉动作

1. 四类任务从左侧进入排班台。
2. 模型卡根据任务难度被分派。
3. `opusplan` 卡拆成规划和执行两段，分别连到 Opus 与 Sonnet。

### 口播互补

声音解释别名和成本取舍；画面展示模型在任务流中的不同去向。

### 屏幕文字

`opus`、`sonnet`、`haiku`、`opusplan`、`复杂推理`、`日常编程`、`简单任务`、`规划：Opus／执行：Sonnet`、`能力／成本`

### Visual Type

`ComparisonScene / Model Dispatch`

## Scene 10｜同一个模型，也能调“用多少脑子”

### 视觉目标



### 画面结构

左侧是 effort 滑块 `low` → `medium` → `high` → `xhigh` → `max`；右侧是两层控制卡：上层 `ultrathink`／`/effort`，下层 `availableModels` → `sonnet`、`haiku`。

### 视觉动作

1. effort 滑块从低到高移动，token 成本指示随之上升。
2. `ultrathink` 只点亮一次，标注为单轮控制。
3. `availableModels` 收拢为团队白名单，Opus 卡被挡在白名单外。

### 口播互补

声音解释同模型的思考深度和团队模型限制；画面区分单轮旋钮与长期白名单。

### 屏幕文字

`low`、`medium`、`high`、`xhigh`、`max`、`ultrathink`、`/effort`、`availableModels`、`sonnet`、`haiku`

### Visual Type

`ConceptScene / Effort and Budget Controls`

## Scene 11｜改配置之后，回头验它真的生效

### 视觉目标



### 画面结构

横向终端流程：`/sandbox` → `sandbox-test.txt` → `/status` → `/model haiku` → `model: Haiku` → `settings.json`。每个节点带有完成状态，最后一个节点标记为可选固化。

### 视觉动作

1. `/sandbox` 面板出现并切换到自动允许。
2. `sandbox-test.txt` 在当前目录出现，权限提示保持静默。
3. `/status` 显示原模型，`/model haiku` 后再次显示 `model: Haiku`。
4. `settings.json` 作为默认值写入位置出现。

### 口播互补

声音讲验证逻辑；画面同时提供“文件结果”和“状态变化”两类证据。

### 屏幕文字

`/sandbox`、`sandbox-test.txt`、`/status`、`/model haiku`、`model: Haiku`、`settings.json`

### Visual Type

`TerminalScene / Verification Flow`

## Scene 12｜把工作环境调顺，再进入下一种输入方式

### 视觉目标



### 画面结构

五个关键词 `隔离`、`网络`、`终端`、`模型`、`验证` 围绕中央节点 `工作环境调顺`；随后关键词收束，中央下方出现 `下一篇：47 Voice 语音模式` 预告卡。

### 视觉动作

1. 五个关键词按全片顺序进入中央节点。
2. 中央节点变为“更安全、更顺手、少烧冤枉钱”的收束状态。
3. 其他元素淡出，只保留下一篇预告卡停留 2～3 秒。

### 口播互补

声音总结配置价值并说出下一集主题；画面保持低密度，给预告留出阅读时间。

### 屏幕文字

`隔离`、`网络`、`终端`、`模型`、`验证`、`工作环境调顺`、`下一篇：47 Voice 语音模式`

### Visual Type

`SummaryScene / Preview Card`

## 全片视觉类型、组件与动画标准

### 视觉类型

- `OpeningScene`：私有仓库风险和隔离边界。
- `ConceptScene`：五类工作环境、effort 和成本控制。
- `ComparisonScene`：沙箱／主机边界、隔离梯度、模型排班。
- `ProcessScene`：devcontainer、网络三段链路和验证流程。
- `TerminalScene`：`/sandbox`、测试文件、`/status` 和 `/model`。
- `UISimulation`：终端换行、通知和主题。
- `SummaryScene`：五类关键词收束和下一篇预告。

### 组件标准

- `Window`：终端、配置文件、状态面板和网络节点。
- `BoundaryPanel`：沙箱、主机工具和容器范围。
- `FlowNode`：代理、证书、白名单和验证步骤。
- `ConfigCard`：终端设置、模型别名和 effort 选项。
- `DispatchCard`：模型与任务类型的分派。
- `PreviewCard`：结尾总结和下一集预告。

### 动画标准

- 边界：风险对象进入隔离框，Bash 与主机工具分层。
- 梯度：隔离方式从左向右展开，强度随位置增加。
- 通路：代理、证书、白名单按请求经过顺序点亮。
- 分派：任务进入对应模型卡，`opusplan` 分成规划与执行两个阶段。
- 验证：`/sandbox` → 文件结果 → `/status` → 模型变化 → 配置固化。
- 收束：五类关键词汇入工作环境节点，预告卡停留 2～3 秒。

## Gate 2 内部审查

- [x] 12 个 Scene 与 Scene Script、Narration Script 一一对应。
- [x] Narration Script 每个 Scene 下只有实际口播，没有视觉说明、制作备注或检查清单。
- [x] 视觉承担风险边界、隔离范围、网络通路、终端状态、模型分派和验证结果，没有把口播全文复制到屏幕。
- [x] 所有标题、标签、命令、配置名、状态和下一篇预告均可追溯到 Source 或前置生产资料。
- [x] 结构沿用基线：全局视觉原则 → 逐 Scene 视觉设计 → 全片类型／组件／动画标准 → Gate 2。
- [x] Prototype 将使用纯 HTML、CSS 和少量 JavaScript，无外部依赖。
- [x] Prototype 只用于静态视觉确认，不进入 TTS、`tts-script.json`、音频、字幕、Timeline 或 Remotion。

Gate 2 视觉脚本结论：通过，进入 Visual Prototype 制作。
