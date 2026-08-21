# 子代理（Subagents）视频化 · 第三步：Scene Script

> 目标：把“该外包还是自己干”的判断线拆成可独立表达的视觉事件。每个 Scene 只承担一个主要认知任务。

---

## Scene 01｜拆得多，不等于更专业

### sceneId

`subagents-01`

### title

拆得多，不等于更专业

### purpose

打破“任务越多越该拆”的直觉，提出本片要回答的问题。

### narrativeRole

反共识开场／问题建立。

### narrationIntent

告诉观众子代理用错会又慢又贵，真正重要的是判断什么时候该外包。

### visualIntent

让主对话桌面被任务卡片、启动和回灌信息逐步挤满，直接展示过度拆分的代价。

### visualType

`Decision Diagram` + `Process`

### keyOnScreenText

- `子代理：用对省心，用错又慢又贵`
- `该外包，还是自己干？`

### videoValue

静态说教无法让观众感受到启动和回灌的拥挤；动画化的堆积能把“过度拆分”变成可见的问题。

### 口播方向

很多人一知道子代理，就想把任务拆成五六份。但子代理不是任务越多越该用的高级玩法，用错会增加启动、沟通和 token 成本。

### 画面方向

主对话窗口中连续出现“收集上下文”“等待回灌”“额外上下文”等状态，桌面被推挤；最后只留下判断问题。

---

## Scene 02｜子代理在自己的房间干活

### sceneId

`subagents-02`

### title

子代理在自己的房间干活

### purpose

用空间类比解释子代理与主对话的隔离关系。

### narrativeRole

概念建立。

### narrationIntent

定义子代理：它在自己的上下文中独立工作，完成后只把结论交回主对话。

### visualIntent

同时展示主工作台、子代理房间和一条“结论摘要”回传路径。

### visualType

`Concept Diagram`

### keyOnScreenText

- `独立上下文`
- `独立人设`
- `独立工具`
- `只交结论`

### videoValue

“独立上下文”是抽象概念，用两个空间和一条摘要回传线能建立直觉。

### 口播方向

子代理像一个被临时雇来的专项助手，在自己的房间里干活。它从一张白纸开始，不会看到主对话历史，但有自己的上下文、人设和工具，最后只交回相关结论。

### 画面方向

左侧主工作台保留当前对话，右侧子代理房间堆放日志和文件；大量细节留在右侧，只有一张“结论摘要”卡片回到左侧。

---

## Scene 03｜它真正解决三个问题

### sceneId

`subagents-03`

### title

它真正解决三个问题

### purpose

把子代理的价值从抽象定义归纳为三个可记忆的用途。

### narrativeRole

价值展开。

### narrationIntent

解释隔离上下文、专精任务和可并行分别解决什么问题。

### visualIntent

让三个节点从子代理中心依次展开，并用小动画表现日志隔离、审查员专长和并行分支。

### visualType

`Concept Diagram` + `Connection Diagram`

### keyOnScreenText

- `隔离上下文`
- `专精任务`
- `可并行`
- `只回结论`

### videoValue

三个用途之间是结构关系，节点展开比连续口播列表更容易形成记忆。

### 口播方向

子代理最值钱的地方有三个：把大量中间输出隔离出去；把重复工作固化成专门助手；把互不依赖的任务并行处理。

### 画面方向

中心节点“子代理”向三侧连线，分别连接“测试／日志”“代码审查”“认证／数据库／API”；细节停留在分支内，中心只保留摘要。

---

## Scene 04｜简单活儿别硬拆

### sceneId

`subagents-04`

### title

简单活儿别硬拆

### purpose

建立“不该使用子代理”的反向判断线。

### narrativeRole

反转与边界。

### narrationIntent

说明子代理从白纸收集上下文、有额外 token 和回灌成本；频繁来回、快速小改的任务留在主对话。

### visualIntent

把任务输入分流到“主对话”和“子代理”，显示各自适合的任务形态，而不是堆一张特性表。

### visualType

`Decision Diagram` + `Comparison`

### keyOnScreenText

- `频繁来回 / 共享上下文 / 快速小改 → 主对话`
- `脏活 / 可自包含 / 锁定权限 / 只回结论 → 子代理`
- `拆得多 ≠ 专业`

### videoValue

这是一个条件判断，动态分流能把“什么时候别用”变成可执行的选择。

### 口播方向

简单任务硬拆会增加启动、沟通、花费和结果回灌。要是只改一个变量名，直接在主对话做更快；只有脏、重、自包含、需要锁权限并且只回一句结论的工作，才值得外包。

### 画面方向

左侧快速小改直接抵达“主对话完成”，右侧日志扫描经过“独立上下文”后只回“结论摘要”；多余的回灌卡片在右侧被截住。

---

## Scene 05｜用 /agents 交互式创建

### sceneId

`subagents-05`

### title

用 /agents 交互式创建

### purpose

展示最省事的创建入口和主要选择。

### narrativeRole

方法进入。

### narrationIntent

解释 `/agents` 会把位置、生成方式、工具、模型和保存步骤组织成交互式流程。

### visualIntent

把创建过程表现为连续表单状态，让“主动砍工具”成为关键动作。

### visualType

`UI Simulation` + `Process`

### keyOnScreenText

- `/agents`
- `Library → Create new agent → Personal`
- `Generate with Claude`
- `Read-only tools`
- `Sonnet`
- `Save`

### videoValue

创建是一个有顺序的操作过程，步骤推进比静态字段清单更能说明使用方式。

### 口播方向

最省事的方式是使用 `/agents`。选择位置，让 Claude 生成配置，再主动只保留读工具，选择模型并保存。工具不主动砍掉，子代理可能继承主对话的全部能力。

### 画面方向

模拟管理界面依次高亮 Library、Create new agent、Personal、Generate with Claude、Read-only tools、Sonnet 和 Save；工具列表中 Write／Edit 被移出。

---

## Scene 06｜一个 Markdown 文件就是岗位说明

### sceneId

`subagents-06`

### title

一个 Markdown 文件就是岗位说明

### purpose

解释手写配置的结构、字段和放置位置。

### narrativeRole

机制解释。

### narrationIntent

让观众理解 frontmatter 负责硬配置，正文负责系统提示；`name` 和 `description` 是必填，`tools` 可以收窄权限。

### visualIntent

把一个 Markdown 文件拆成“工牌”和“岗位说明书”两层，并展示个人级与项目级路径。

### visualType

`Code Exploration` + `UI Simulation`

### keyOnScreenText

- `name`
- `description`
- `tools: Read, Glob, Grep`
- `model: sonnet`
- `~/.claude/agents/`
- `.claude/agents/`
- `手写后重启会话`

### videoValue

配置字段、路径和正文的关系适合通过代码文件的高亮和定位来证明，避免变成口播复读。

### 口播方向

交互式创建落到磁盘上，就是一个 Markdown 文件。上面的 YAML 头管名字、描述、工具和模型，下面的正文写这个助手是谁、来了做什么。文件放在个人目录或项目目录，决定谁能用；手写后记得重启会话。

### 画面方向

代码编辑器先高亮 frontmatter，再滑到系统提示；右侧路径树显示 `~/.claude/agents/` 与 `.claude/agents/`，底部出现“重启会话”提示。

---

## Scene 07｜description 自动派单，@ 直接点名

### sceneId

`subagents-07`

### title

description 自动派单，@ 直接点名

### purpose

区分自动委派与直接点名，并说明结果如何返回。

### narrativeRole

触发机制。

### narrationIntent

解释清晰的 `description` 帮助自动委派，`@` 用于确保指定子代理运行；过程留在子代理上下文，主对话接收结论。

### visualIntent

把两种触发路径汇合到同一条“独立工作 → 结论返回”链路。

### visualType

`Task Routing` + `Process`

### keyOnScreenText

- `description → 自动委派`
- `@agent-code-reviewer → 确保运行`
- `独立工作`
- `结论返回`

### videoValue

触发方式本质是任务路由，双路径动画能显示“选择权”在哪里。

### 口播方向

如果岗位描述写得清楚，Claude 可以根据任务自动委派；如果你想确保某个子代理运行，可以自然语言点名，或直接使用 `@`。无论哪种方式，子代理干完只把结论交回来。

### 画面方向

左路是任务气泡与 `description` 匹配，右路是输入框中出现 `@agent-code-reviewer`；两条线在“子代理独立工作”处汇合，最终回传一张摘要卡片。

---

## Scene 08｜五分钟跑通一个只读点评员

### sceneId

`subagents-08`

### title

五分钟跑通一个只读点评员

### purpose

把概念和配置落到一个可照着跑的最小实战。

### narrativeRole

操作演示。

### narrationIntent

带观众走过建立目录、写入 `code-reviewer`、准备 `calc.py`、启动 Claude 和 `@` 点名的关键链路。

### visualIntent

用终端状态变化展示“配置 → 加载 → 点名触发 → 返回点评”的完整过程。

### visualType

`Terminal` + `Demo` + `Task Execution`

### keyOnScreenText

- `mkdir sub-demo`
- `mkdir -p .claude/agents`
- `code-reviewer`
- `@agent-code-reviewer 点评一下 calc.py`
- `点评结论`

### videoValue

实战的价值在于把独立上下文和触发机制变成可观察的状态变化，而不是只展示配置片段。

### 口播方向

现在手写一个只读的代码点评员。创建目录和配置文件，给它 Read、Grep、Glob，再准备一个有命名和除零问题的 `calc.py`。启动 Claude 后，用 `@agent-code-reviewer` 点名让它点评。

### 画面方向

终端命令逐行执行；编辑器短暂展示配置；`calc.py` 出现 `def f(a, b)` 和 `return a / b`；委派状态变成“正在运行”，随后出现简短点评摘要。

---

## Scene 09｜只读权限真的能挡住修改

### sceneId

`subagents-09`

### title

只读权限真的能挡住修改

### purpose

证明工具限制不是装饰，子代理只能给建议而不能修改文件。

### narrativeRole

验证与可信度建立。

### narrationIntent

解释 `tools: Read, Grep, Glob` 没有 Write／Edit，因此点评员只能读和建议；用 `cat calc.py` 验证原文件未变。

### visualIntent

并置工具清单、拒绝写入状态和原样文件，完成权限边界的视觉证据链。

### visualType

`Demo` + `UI Simulation` + `State Change`

### keyOnScreenText

- `tools: Read, Grep, Glob`
- `Write / Edit：未授予`
- `只回结论，不越权`
- `calc.py：原封不动`

### videoValue

只有通过执行前后的文件状态对照，观众才能真正理解“限权”的效果。

### 口播方向

点评员指出命名和除零问题，但没有改文件。退出 Claude 后执行 `cat calc.py`，如果内容还是原来的两行，就证明只读工具确实挡住了写入。

### 画面方向

左侧显示允许工具，Write／Edit 变灰；中间显示“建议已返回、修改被阻止”；右侧 `cat calc.py` 输出与执行前相同，并出现绿色“原封不动”。

---

## Scene 10｜真正的门槛是判断线

### sceneId

`subagents-10`

### title

真正的门槛是判断线

### purpose

把定义、适用场景和实战收束成一条可复用原则。

### narrativeRole

核心结论。

### narrationIntent

重申脏活、可自包含、需要锁权的工作适合外包；简单、快速、来回频繁的工作留在主对话。

### visualIntent

让“会建”退到背景，把“判断”放到中心，形成两个方向清晰的决策分流。

### visualType

`Decision Diagram`

### keyOnScreenText

- `用对场景，不在拆得多`
- `脏活 / 自包含 / 锁权限 → 外包`
- `简单 / 快速 / 频繁来回 → 自己干`

### videoValue

判断线需要被反复对照，分流图能让结论脱离单一例子，成为之后可复用的方法。

### 口播方向

子代理强，不在于拆得多，而在于用对场景。把脏活、可自包含、需要锁权限的任务外包；简单、快速、频繁来回的任务，自己干。

### 画面方向

中心出现“该不该拆？”；两侧分别接入任务特征和结论，前面 Scene 的日志、`calc.py` 和快速小改作为小标签回到对应分支。

---

## Scene 11｜下一篇：插件（Plugins）

### sceneId

`subagents-11`

### title

下一篇：插件（Plugins）

### purpose

完成本片收束，并承接源文档中明确给出的下一集主题。

### narrativeRole

系列预告／最后视觉事件。

### narrationIntent

用一句话提醒观众下一篇会把 CLAUDE.md、斜杠命令、Skill 和 Subagent 打包成插件；不展开下一篇内容。

### visualIntent

让“Subagent”作为最后一个配件卡片进入“Plugins”容器，形成清晰、可停留的预告画面。

### visualType

`Connection Diagram` + `UI Simulation`

### keyOnScreenText

- `下一篇`
- `插件（Plugins）`
- `CLAUDE.md · 斜杠命令 · Skill · Subagent`
- `一键安装 · 一键分享`

### videoValue

系列视频需要一个明确的下一集视觉事件；从多个配件汇入插件容器，比只在口播中提及更容易被记住。

### 口播方向

下一篇，我们再把 CLAUDE.md、斜杠命令、Skill 和 Subagent 这些配件打包成插件，看看怎样一键安装和分享。

### 画面方向

四张配件卡片依次进入“插件（Plugins）”容器，容器下方停留“一键安装 · 一键分享”；不展示下一篇文章的其他内容。

---

# Scene Script 总览

| Scene | 主要任务 | Visual Type |
|---|---|---|
| 01 | 提出过度拆分问题 | Decision Diagram + Process |
| 02 | 解释独立房间 | Concept Diagram |
| 03 | 展开三个价值 | Concept Diagram + Connection Diagram |
| 04 | 建立不该拆的边界 | Decision Diagram + Comparison |
| 05 | 演示 `/agents` | UI Simulation + Process |
| 06 | 解释 Markdown 配置 | Code Exploration + UI Simulation |
| 07 | 解释触发路径 | Task Routing + Process |
| 08 | 跑通只读实战 | Terminal + Demo + Task Execution |
| 09 | 验证权限边界 | Demo + UI Simulation + State Change |
| 10 | 收束判断原则 | Decision Diagram |
| 11 | 下一篇预告 | Connection Diagram + UI Simulation |

---

## Gate 1 内部复核

- 11 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- 每个 Scene 只有一个主要认知任务，创建、触发、实战验证没有被合并成静态大页。
- Scene 11 的预告已同步进入 Scene Script，并明确不处理下一篇文章正文。
- 画面文字均能追溯到当前 Source 或本文件的叙事资料；未复用其他视频的业务语义、固定状态文字或参考文案。

**Gate 1 结论：通过。**

---

## 下一步

基于本 Scene Script 编写纯口播 `narration-script.md` 和视觉动作 `visual-script.md`，完成横屏 Visual Prototype 后停止。
