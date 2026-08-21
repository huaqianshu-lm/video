# GitHub Actions 视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 画面展示触发、执行和结果，不重复口播

旁白解释为什么要把 Claude Code 放到云端、配置如何选择以及安全边界；画面展示本地终端迁移到 runner、评论触发、YAML 流程、PR 结果和 Secret 隔离。不要把整段旁白铺成大字卡。

### 2. 一个 Scene 一个视觉中心

12 个 Scene 分别承担问题钩子、云端迁移、评论触发、安装权限、workflow 骨架、模式分支、三种用例、安全、验证和总结预告。每幕只保留一条主要流程或关系。

### 3. 视觉语言

- 16:9 横屏，深蓝黑背景，终端、GitHub 仓库和 workflow 面板使用统一深色窗口。
- 白色主文字，蓝色表示连接和执行，绿色表示通过，黄色表示需要注意，红色只用于错误或危险路径。
- 命令、路径、变量和 YAML key 使用等宽字体；主标题保持 1—2 行。
- 预览控件和进度条只服务于原型，不属于视频画面内容。

### 4. 动画规则

- 优先使用迁移、触发、扫描、分支、运行、生成、阻断和状态替换。
- 当前事件或配置块高亮，其他内容降低透明度。
- 不使用无意义粒子、旋转或装饰性弹跳。
- Scene 12 的总结卡淡出后，最后只留下 Agent SDK 预告，并预留阅读停留。

## Scene 01｜人已经睡了，PR 还在等 review

### 视觉目标

用时间差证明「人不在场」仍然可以得到 review。

### 画面结构

左侧为深夜状态和群聊气泡，中央为待处理 PR，右侧为第二天出现的 review 结果：`空指针风险`、`边界问题`。

### 动画

1. `PR 卡了一天` 出现。
2. 夜色覆盖开发者状态，时间推进。
3. PR 状态从等待变为 `自动 review`。
4. 两条 review 结果依次亮起。

### 口播互补

声音讲半夜场景，画面只证明「睡着后仍有结果」。

### 屏幕文字

`PR 卡了一天`、`明天要上线`、`自动 review`、`空指针风险`

### Visual Type

`UI Simulation / Process Timeline`

## Scene 02｜Claude Code 住进 GitHub runner

### 视觉目标

展示本地 Claude Code 到 GitHub runner 的运行地点迁移。

### 画面结构

左侧 Terminal 中的 Claude Code，中央为仓库，右侧为 `GitHub runner`；仓库下方挂着 `CLAUDE.md`。

### 动画

1. 本地终端亮起 `人在场`。
2. Claude Code 节点移动到 GitHub runner。
3. 仓库事件从 issue、PR、schedule 三个入口进入 runner。
4. `CLAUDE.md` 被扫描并连接到执行节点。

### 口播互补

声音解释底层仍是 Claude Code，画面展示「从本地到云端」的边界变化。

### 屏幕文字

`本地 Claude Code`、`GitHub runner`、`仓库事件`、`CLAUDE.md`

### Visual Type

`Connection Diagram / UI Simulation`

## Scene 03｜@claude，不是 /claude

### 视觉目标

让符号差异成为触发与不触发的直接证据。

### 画面结构

左右两个评论窗口：左侧 issue／PR 评论出现 `@claude`，右侧出现 `/claude` 并停在未触发状态。

### 动画

1. 左侧评论进入 `workflow`，显示 `created`。
2. 右侧斜杠被红色划掉，不进入执行链。
3. 左侧补充具体任务和 `CLAUDE.md` 上下文。

### 口播互补

声音解释评论位置和具体要求，画面强调符号的差异。

### 屏幕文字

`@claude`、`/claude`、`issue`、`PR comment`、`具体要求`

### Visual Type

`UI Simulation / Decision Diagram`

## Scene 04｜装上三件套，给最小工牌

### 视觉目标

将安装件和权限组成一个可检查的仓库状态。

### 画面结构

中央仓库卡，左侧三个输入：`GitHub App`、`ANTHROPIC_API_KEY`、`.github/workflows/`；右侧权限卡只列三项读写。

### 动画

1. `/install-github-app` 从本地终端发出。
2. 三个安装件依次进入仓库。
3. `Contents`、`Issues`、`Pull requests` 权限亮起。
4. `管理员` 和 `直接 Claude API` 作为前提标签停留。

### 口播互补

声音解释前提，画面展示「安装三件套 + 最小工牌」。

### 屏幕文字

`/install-github-app`、`GitHub App`、`ANTHROPIC_API_KEY`、`.github/workflows/`、`Contents`、`Issues`、`Pull requests`、`管理员`、`直接 Claude API`

### Visual Type

`Connection Diagram / Permission Map`

## Scene 05｜workflow 是值班表

### 视觉目标

通过运行路径理解 YAML 的四块，而不是阅读整段代码。

### 画面结构

左侧为四段 YAML：`name`、`on`、`jobs`、`steps`；右侧为 runner 和 Action 结果。

### 动画

1. `name` 亮起。
2. `on` 接收 `issue_comment.created` 和 `pull_request_review_comment.created`。
3. `jobs` 将任务送到 `ubuntu-latest`。
4. `steps` 调用 `anthropics/claude-code-action@v1`。
5. 密钥只显示为 `${{ secrets.ANTHROPIC_API_KEY }}`。

### 口播互补

声音逐块翻译，画面用路径展示配置如何产生执行。

### 屏幕文字

`name`、`on`、`jobs`、`steps`、`ubuntu-latest`、`anthropics/claude-code-action@v1`、`${{ secrets.ANTHROPIC_API_KEY }}`

### Visual Type

`Code Exploration / Task Routing`

## Scene 06｜prompt 决定它等你还是自动跑

### 视觉目标

展示同一 Action 的两种运行模式和参数出口。

### 画面结构

中央 `claude-code-action@v1` 分叉：左侧无 `prompt` 指向 `@claude`，右侧有 `prompt` 指向 `自动化模式`；底部挂 `claude_args`。

### 动画

1. `prompt` 开关处于无值状态，左路亮起。
2. 开关填入指令，右路亮起。
3. `--max-turns` 和 `--model` 从 `claude_args` 进入 Action。

### 口播互补

声音给出规则，画面让配置变化直接产生分支。

### 屏幕文字

`prompt`、`@claude`、`交互模式`、`自动化模式`、`claude_args`、`--max-turns`、`--model`

### Visual Type

`Decision Diagram / Task Routing`

## Scene 07｜PR 一更新，自动 review

### 视觉目标

展示 `pull_request` 事件到 review 结果的自动链路。

### 画面结构

横向流程：`opened / synchronize` → runner → `Code Review`；PR 卡中显示质量、正确性和安全检查。

### 动画

1. PR 从 opened 进入队列。
2. 新提交让 synchronize 再次触发。
3. runner 扫描后，review 评论落回 PR。

### 口播互补

声音解释无需 @，画面展示事件自动带来结果。

### 屏幕文字

`pull_request`、`opened`、`synchronize`、`Code Review`、`code quality`、`correctness`、`security`

### Visual Type

`Process / UI Simulation`

## Scene 08｜issue 变成一个新 PR

### 视觉目标

展示交互模式从自然语言任务到可审查 PR 的过程。

### 画面结构

左侧 issue 描述和 `@claude` 评论，中间为 runner 的 `read → edit` 状态，右侧为新分支和 PR。

### 动画

1. 具体评论进入 workflow。
2. issue 和 `CLAUDE.md` 被读取。
3. 新分支出现，代码状态从待修改变为已修改。
4. PR 卡生成并标记 `待审查`。

### 口播互补

声音解释任务上下文，画面演示任务的状态转换。

### 屏幕文字

`@claude`、`按这个 issue 的描述把功能实现了`、`新分支`、`Pull Request`、`待审查`

### Visual Type

`Task Execution / Process`

## Scene 09｜到点生成报告

### 视觉目标

用时间轴区分 schedule 自动化和评论触发。

### 画面结构

顶部时间轴停在 `0 9 * * *`，下方为 `schedule` → runner → `Daily Report`。

### 动画

1. 时间轴走到 9 点。
2. `schedule` 触发 runner。
3. `prompt` 进入执行。
4. 报告卡出现 `昨日提交` 和 `待办 issue`。

### 口播互补

声音说明不需要评论，画面让「到点」成为触发原因。

### 屏幕文字

`schedule`、`cron`、`0 9 * * *`、`Daily Report`、`昨日提交`、`待办 issue`

### Visual Type

`Process / Timeline`

## Scene 10｜真实 key 进保险柜

### 视觉目标

把密钥安全从口号变成可见的路径阻断和引用。

### 画面结构

左侧危险路径是明文 key → YAML，中央红线阻断；右侧为 GitHub Secrets 保险柜 → `${{ secrets.ANTHROPIC_API_KEY }}` → runner。底部三条边界：最小权限、提示注入、合并前审查。

### 动画

1. 明文 key 靠近 YAML 时被红线挡住。
2. key 进入 Secrets 保险柜，页面只显示名称。
3. workflow 取出引用，runner 获得可用密钥但画面不显示明文。
4. 三条安全边界依次亮起。

### 口播互补

声音解释风险和原则，画面只展示安全／危险路径与治理动作。

### 屏幕文字

`不要提交 API key`、`GitHub Secrets`、`ANTHROPIC_API_KEY`、`${{ secrets.ANTHROPIC_API_KEY }}`、`最小权限`、`提示注入`、`合并前审查`

### Visual Type

`Decision Diagram / Security Flow`

## Scene 11｜五分钟跑通闭环

### 视觉目标

展示验证的预期状态，而不是模拟真实 GitHub 操作。

### 画面结构

五个检查点沿横向排列：安装、workflow、Secret、测试 issue、PR 审查；右侧状态从等待变为通过。

### 动画

1. `/install-github-app` 勾选完成。
2. `claude.yml` 出现。
3. `ANTHROPIC_API_KEY` 名称出现但值隐藏。
4. 测试 issue 中出现 `@claude`。
5. Actions 变为运行完成，PR 进入 `审查再合`。

### 口播互补

声音讲五步，画面保留每步的可观察结果。

### 屏幕文字

`claude.yml`、`ANTHROPIC_API_KEY`、`@claude`、`Actions`、`PR`、`审查再合`

### Visual Type

`Process / Checklist`

## Scene 12｜从触发到执行，再往下一层

### 视觉目标

收束核心规则并把下一篇预告作为最后一次视觉变化。

### 画面结构

中央六边关系图：`云端 Claude Code`、`@claude`、`workflow`、`prompt`、`GitHub Secrets`、`人工审查`；随后收缩为 `下一篇：Agent SDK`。

### 动画

1. 六个关键词按视频顺序亮起并连成闭环。
2. 关键词逐渐收束，避免形成静态功能墙。
3. 最后一张 `下一篇：Agent SDK` 卡片从闭环中心出现并停留。

### 口播互补

声音总结并提出下一层问题，画面只保留关键词关系和预告。

### 屏幕文字

`云端 Claude Code`、`@claude`、`workflow`、`prompt`、`GitHub Secrets`、`人工审查`、`下一篇：Agent SDK`

### Visual Type

`SummaryScene / Preview Card`

## 全片视觉类型、组件与动画标准

### 视觉类型

- `UI Simulation`：深夜 PR、issue／PR 评论、GitHub 页面。
- `Connection Diagram`：本地 Claude Code、仓库和 GitHub runner 的关系。
- `Code Exploration`：workflow 四块和 Action 调用。
- `Decision Diagram`：`@`／`/`、`prompt` 模式和 Secret 安全路径。
- `Process`：PR review、issue 改动、定时报告和五步验证。
- `SummaryScene`：六个关键词和 Agent SDK 预告。

### 组件标准

- `Window`：终端、issue、PR 和 GitHub Actions 窗口。
- `EventBadge`：`issue_comment`、`pull_request`、`schedule`。
- `WorkflowLane`：`on`、`jobs`、`steps` 的运行路径。
- `PermissionCard`：三项最小权限。
- `SecretVault`：Secret 名称和隐藏值。
- `ResultCard`：review、PR、报告和审查状态。
- `PreviewCard`：总结和下一篇预告。

### 动画标准

- 迁移：本地终端 → GitHub runner。
- 触发：评论、PR 事件或时间轴进入 workflow。
- 分支：`prompt` 有无产生两种模式。
- 执行：runner 依次读取、修改、审查或生成结果。
- 安全：明文路径被阻断，Secret 引用路径通过。
- 收束：Scene 12 只保留预告，给读完文字留下停留时间。

## Gate 2 内部审查

- [x] 12 个 Scene 与 Scene Script、Narration Script 一一对应。
- [x] 每个 Scene 的正文只有实际口播，没有视觉说明、制作备注或检查清单。
- [x] 画面承担触发、执行、状态和结果，未把口播全文复制到画面。
- [x] 所有命令、路径、YAML key、权限、状态和下一集预告均可追溯到 Source 或前置资料。
- [x] 结构沿用基线：全局视觉原则 → 逐 Scene 视觉设计 → 全片类型／组件／动画标准 → Gate 2。
- [x] Prototype 使用纯 HTML、CSS 和少量 JavaScript，无外部依赖。
- [x] Prototype 只用于静态视觉确认，不进入 TTS、字幕、Timeline 或 Remotion。

Gate 2 结论：通过，完成 Visual Prototype 后停止。
