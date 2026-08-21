# Claude Code Git 工作流 · Visual Script

## 全局视觉原则

### 1. 画面展示判断过程，不重复口播

口播解释为什么本地可逆操作适合委托、远端操作需要人守；画面展示 diff 如何被整理、commit 如何参考三种输入、权限如何拦截 push。

### 2. 一个 Scene 一个视觉中心

每幕只保留一个主界面或关系图。命令、状态和摘要按顺序进入，避免把整篇文章做成静态清单。

### 3. 视觉语言

- 深色终端和编辑器面板，使用蓝色表示理解、流程和可控状态。
- 绿色表示本地完成或测试通过，红色只用于远端风险、force 和 deny。
- 等宽字体呈现命令、文件名、diff 和 commit；中文解释使用清晰的无衬线字体。
- 所有原型文字都来自 Source 或生产资料提炼，不复用其他视频的业务语义。

### 4. 动画规则

- 提交历史逐条出现，重复 message 的视觉密度逐渐增加。
- 对比关系使用左右分栏和中央分界线，流程关系使用单向箭头。
- 代码扫描、摘要生成、权限拦截和测试通过按先后顺序出现。
- Scene 12 先显示总结，再切换到独立的 GitHub Actions 预告卡片。

## Scene 01｜一串 `fix`，从痛点开始

### 视觉目标
让观众看见重复提交信息如何让历史失去检索价值。

### 画面结构
深色 git log 面板，左侧是短哈希和时间，右侧依次列出 `feat: 新增登录限流`、`fix`、`update`、`wip`、`改了下`。底部出现“到底改了什么？”。

### 动画
规范提交先出现，随后重复的 message 快速堆叠；最后一行被高亮并出现问号。

### 口播互补
口播解释写清 message 的即时收益低，画面负责证明三个月后历史难以检索。

### 屏幕文字
`fix`、`update`、`wip`、`三个月后：到底改了什么？`

### Visual Type
`Git Log Simulation`

## Scene 02｜先划线：本地和远端不是一回事

### 视觉目标
建立“可逆性决定委托边界”的核心直觉。

### 画面结构
左右两张卡片：左侧“本地”包含 `git status`、`git diff`、`git commit`、解冲突，标记“可回退”；右侧“远端”包含 `git push`、删除远程分支、release tag、`git push --force`，标记“难收回”。中央是一条红色确认线，连接到“人来按”。

### 动画
左侧操作沿蓝色路径进入 Claude，右侧操作到红线前停止；最后人的确认节点亮起。

### 口播互补
口播用报销类比解释责任边界，画面让命令按可逆性分组。

### 屏幕文字
`本地 · 可回退 · Claude`、`远端 · 难收回 · 人来按`

### Visual Type
`Comparison Diagram`

## Scene 03｜看 diff：把满屏红绿讲成人话

### 视觉目标
展示 Claude 把 staged diff 转成可读摘要的过程。

### 画面结构
左侧代码 diff 面板显示红绿增删，顶部命令为 `git diff --staged`；中间是扫描光带；右侧是“主要改动”和“风险点”两张摘要卡。

### 动画
扫描从上到下经过 diff，右侧先出现三条改动摘要，再出现“检查 console.log、测试数据、误删代码”的风险提示。

### 口播互补
口播给出可以直接使用的提问方式，画面展示输入如何变成重点摘要。

### 屏幕文字
`git diff --staged`、`主要改动`、`风险点`

### Visual Type
`Diff Review Demo`

## Scene 04｜写 commit：diff、历史、规范汇成一句话

### 视觉目标
让观众理解 commit message 来自三个可见输入，而不是随机生成。

### 画面结构
三个输入卡片：`staged diff`、`git log`、`CLAUDE.md`，通过箭头汇入中央的 commit 卡片。卡片从 `fix` 变为 `feat: 新增 sub 减法函数`。

### 动画
三个输入依次亮起；commit 卡片先显示模糊草稿，再替换成中文、带 `feat:` 前缀的描述。

### 口播互补
口播解释参考历史和规范的原因，画面证明风格迁移发生在输入汇合之后。

### 屏幕文字
`staged diff`、`git log`、`CLAUDE.md`、`feat: 新增 sub 减法函数`

### Visual Type
`Commit Message Demo`

## Scene 05｜开 PR：`gh` 让副手接上 GitHub

### 视觉目标
展示本地分支如何连接到 PR 和后续会话。

### 画面结构
左侧“当前分支”卡片，中间 `gh CLI` 节点，右侧“Pull Request”卡片；PR 下方连接“reviewer comments”，旁边放置 `claude --from-pr <number>`。

### 动画
分支沿箭头进入 `gh pr create`，PR 卡片生成；会话线回连到 `claude --from-pr <number>`。

### 口播互补
口播说明认证状态和 API 限流，画面只展示工作链，不扩展成安装教程。

### 屏幕文字
`gh CLI`、`gh pr create`、`Pull Request`、`claude --from-pr <number>`

### Visual Type
`Workflow Diagram`

## Scene 06｜读评论和解冲突：能看懂，不等于盲目照做

### 视觉目标
把“外部内容先检查”和“冲突先解释再修改”放进同一条安全路径。

### 画面结构
左侧 reviewer comment 卡片带“外部内容”标签；右侧两列冲突代码带 `<<<<<<<`、`=======`、`>>>>>>>`。二者都先流向“分析意图”节点，再到“人确认”，最后到“测试通过”。

### 动画
评论卡片出现黄色警示；冲突两侧分别高亮；只有经过人的确认后，合并结果和绿色测试状态才出现。

### 口播互补
口播解释提示注入和冲突合并纪律，画面把共同原则变成可见的闸门。

### 屏幕文字
`外部内容`、`分析意图`、`人确认`、`测试通过`

### Visual Type
`Safety + Conflict Demo`

## Scene 07｜权限规则：把 push 红线焊进机制

### 视觉目标
对比软提示和硬权限，明确 `deny` 对 push 的阻断作用。

### 画面结构
中央展示 `.claude/settings.json` 的三段配置：`allow`、`ask`、`deny`。左侧列出 `git status`、`git diff *`、`git log *`；中间列出 `git commit *`；右侧红色区域列出 `git push *` 和“deny 优先级最高”。

### 动画
只读命令自动通过；commit 停在确认按钮；push 撞上红色门并显示“blocked”。

### 口播互补
口播强调 `CLAUDE.md` 只是请求，画面用拦截结果证明权限规则是机制保证。

### 屏幕文字
`allow`、`ask`、`deny`、`git push *`、`deny 优先级最高`

### Visual Type
`Permission Configuration`

## Scene 08｜完整心智模型：Claude 是副手，你是签字人

### 视觉目标
把分散任务收束成一条有明确交接点的流水线。

### 画面结构
水平流程：`git diff` → `commit` → `PR` → `冲突分析` → `人确认` → `push／force`。前四个节点为蓝绿，最后节点为红色并停在人的手边。

### 动画
蓝色任务节点依次完成，红色远端节点出现后，流程停住并回到“人确认”。

### 口播互补
口播给出“不全自己做，也不全甩给 AI”的判断，画面固定角色分工。

### 屏幕文字
`Claude：副手`、`人：签字人`、`push／force：自己来`

### Visual Type
`Workflow Summary`

## Scene 09｜玩具仓库：先建立本地历史

### 视觉目标
用终端状态变化建立实验基线。

### 画面结构
终端窗口依次展示 `mkdir git-demo && cd git-demo`、`git init`、`calc.py` 的 `add` 函数、`git add calc.py` 和初始 commit 输出。

### 动画
命令逐行执行，root commit 状态变绿；右上角出现“无远端”。

### 口播互补
口播解释为什么先留一笔历史，画面展示可复核的仓库状态。

### 屏幕文字
`git-demo`、`git init`、`calc.py`、`feat: 初始 add 函数`、`无远端`

### Visual Type
`Terminal Demo`

## Scene 10｜玩具仓库：制造改动，让 Claude 读 staged diff

### 视觉目标
展示 `sub` 函数从编辑到 staged diff 再到 Claude 摘要的闭环。

### 画面结构
左侧 `calc.py` 编辑器新增 `sub(a, b)`；中间终端出现 `git add calc.py`；右侧 Claude 会话显示请求和准确摘要。

### 动画
新增代码高亮后进入暂存状态，Claude 对话气泡依次出现“看一下我暂存区的改动”和“新增了一个 `sub` 减法函数”。

### 口播互补
口播给出验证标准，画面显示实际输入和输出。

### 屏幕文字
`def sub(a, b)`、`git add calc.py`、`新增了一个 sub 减法函数`

### Visual Type
`Editor + Chat Demo`

## Scene 11｜玩具仓库：照风格 commit，再用 log 验证

### 视觉目标
用最终 log 证明本地提交风格一致，并把 push 留在红线之外。

### 画面结构
左侧 Claude 提交确认卡显示 `feat: 新增 sub 减法函数`；右侧终端显示 `git log --oneline` 和两条 `feat:` 提交；底部有“未执行 git push”。

### 动画
确认卡变成已提交状态，终端输出第二条提交并与第一条对齐；push 字样保持灰色禁用。

### 口播互补
口播解释验证结果，画面给出两条可比较的历史证据。

### 屏幕文字
`feat: 新增 sub 减法函数`、`git log --oneline`、`feat: 初始 add 函数`、`未执行 git push`

### Visual Type
`Terminal Verification`

## Scene 12｜小结与下一集预告

### 视觉目标
先固定本篇结论，再完成系列预告。

### 画面结构
第一状态是五项总结卡：`看 diff`、`写 commit`、`开 PR`、`解冲突`、`push／force：人来按`。第二状态切换到独立预告卡：“44 · GitHub Actions”，副标题为“把 Claude 搬到云端”。

### 动画
总结卡逐项亮起，停留后整体淡出；预告卡单独进入并保留可读停留时间。

### 口播互补
口播完成分工总结并介绍下一集方向，画面负责让观众记住五个关键词和系列连接。

### 屏幕文字
`看 diff`、`写 commit`、`开 PR`、`解冲突`、`push／force：人来按`、`44 · GitHub Actions`、`把 Claude 搬到云端`

### Visual Type
`Summary + Next Preview`

## 全片视觉类型、组件与动画标准

### 视觉类型

- `Git Log Simulation`：提交历史和重复 message。
- `Comparison Diagram`：本地／远端安全边界。
- `Diff Review Demo`、`Commit Message Demo`：代码输入到摘要／提交输出。
- `Workflow Diagram`、`Workflow Summary`：本地分支、PR、会话和人的交接关系。
- `Safety + Conflict Demo`、`Permission Configuration`：外部内容闸门和权限阻断。
- `Terminal Demo`、`Editor + Chat Demo`、`Terminal Verification`：玩具仓库的可复核操作。

### 组件标准

- 终端、编辑器、PR、权限和摘要均使用统一深色面板、圆角和细边框。
- 代码使用等宽字体；状态颜色只表达成功、警告和阻断，不作为装饰。
- 每幕最多一个主标题、一个主界面和一个底部幕内字幕。
- 控件、进度提示和场景导航只存在于原型页面外层，不进入幕内画面。

### 动画标准

- 场景切换使用淡入和轻微缩放，避免复杂转场。
- 列表和日志逐项进入，给命令、摘要和测试状态留出可读时间。
- 红色只在远端风险、force、外部内容警示和 deny 阻断处使用。
- Scene 12 的下一集预告是最后一个视觉事件，且与总结卡分开显示。

## Gate 2 内部审查

- 12 个 Scene 在 Scene Script、Narration Script、Visual Script 和 Prototype 中保持同一顺序与主题。
- Narration Script 每个 Scene 下只有实际口播，没有画面说明、制作备注或 Gate 清单。
- 画面承担演示和证明：diff 摘要、三输入 commit、PR 连接、冲突闸门、权限拦截和 log 验证均不靠口播重复。
- 原型中的命令、文件名、提交信息、权限字段、状态文字和下一集预告均能追溯到 Source 或前置生产资料。
- Prototype 使用 16:9 stage、上一幕／下一幕／自动播放和进度提示；导航控件位于 stage 外，不属于正式画面。
- 未生成 TTS、音频、字幕、Timeline，也未进入 Remotion。
- Gate 2 结论：通过；按任务边界在 Visual Prototype 检查后停止。
