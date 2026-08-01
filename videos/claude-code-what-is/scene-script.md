# Claude Code 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成可制作的视频场景。  
> 每个 Scene 同时定义：讲什么、为什么讲、口播承担什么、画面承担什么。

---

## Scene 01｜一个 Bug，把问题带出来

### 目的
不要先解释 Claude Code，而是让观众先进入真实开发场景。

### 口播
假设你正在写一个项目，突然遇到一个报错。

以前我们用 ChatGPT 解决这种问题，大概率会这么做：先复制报错，打开聊天窗口，把错误发给 AI。

### 画面
IDE 中项目正在运行。

突然出现红色报错：

```text
TypeError: Cannot read properties of undefined
```

鼠标选中报错 → Copy。

随后切换到 ChatGPT。

### 屏幕重点
```text
遇到 Bug
```

### Scene Type
`UI Simulation + Demo`

### 信息分工
- **声音**：建立场景。
- **画面**：让观众看到真实开发过程。

---

## Scene 02｜传统 AI 工作流为什么麻烦

### 目的
让观众亲眼看到聊天 AI 和项目之间存在距离。

### 口播
ChatGPT 看完报错之后，可能会告诉你问题出在哪。

但它看不到整个项目。

所以你还要回到编辑器，找到对应文件，把代码复制出来，再发给它。

它给出修改建议以后，你再回来手动修改、运行。

如果还有问题，就继续重复。

### 画面

左右双窗口：

```text
IDE            ChatGPT
```

流程连续发生：

```text
报错
↓
复制
↓
ChatGPT
↓
返回 IDE
↓
找文件
↓
复制代码
↓
ChatGPT
↓
修改建议
↓
返回 IDE
↓
手动修改
```

随着步骤增加，画面中的箭头越来越多。

### 屏幕重点

最后只留下：

```text
AI 在项目外面
```

### Scene Type
`Process + Comparison`

### 信息分工
- **声音**：解释为什么反复切换。
- **画面**：突出操作链路有多长。

---

## Scene 03｜同一个 Bug，Claude Code 怎么处理

### 目的
用完全相同的问题制造强烈对比。

### 口播
如果换成 Claude Code，同一个问题，工作方式会完全不一样。

你可能只需要告诉它：

“帮我找到这个报错的原因，然后修掉。”

### 画面

切到 Terminal / Claude Code。

输入：

```text
帮我找到这个报错的原因，然后修掉。
```

随后界面依次出现：

```text
Searching files...
Reading auth.ts...
Checking references...
Editing user.ts...
Running tests...
```

最终：

```text
✓ Tests passed
```

### 屏幕重点

```text
一个任务
而不是一串操作
```

### Scene Type
`Demo`

### 信息分工
- **声音**：只负责提出任务。
- **画面**：负责证明 Claude Code 如何执行。

---

## Scene 04｜真正的区别不是“更聪明”

### 目的
从案例进入核心概念。

### 口播
所以 Claude Code 真正重要的地方，并不是它比 ChatGPT 更会写代码。

而是它和你的项目之间，没有那层距离了。

它可以直接读取文件、理解代码关系、修改代码，还可以执行命令。

### 画面

上一幕复杂的 ChatGPT 流程缩到左侧：

```text
你 ↔ ChatGPT ↔ 你 ↔ 项目
```

右侧出现：

```text
你
↓
Claude Code
↓
Project
```

然后 Project 展开：

```text
src/
components/
services/
tests/
package.json
```

Claude Code 与这些文件建立连接。

### 屏幕重点

```text
Advice
   ↓
Action
```

### Scene Type
`Concept Visualization`

### 信息分工
- **声音**：解释本质区别。
- **画面**：抽象出“项目外”和“项目内”。

---

## Scene 05｜Claude Code 到底是什么

### 目的
在观众已经看到区别后，再正式给定义。

### 口播
所以，如果要给 Claude Code 一个更准确的定义：

它是 Anthropic 推出的 AI 编程工具，可以进入你的代码项目，理解项目上下文，并直接执行开发任务。

它不是一个单纯“会写代码的聊天框”。

更像是一个真正参与项目工作的 AI 编程搭档。

### 画面

三个关键词依次出现：

```text
理解项目
```

随后：

```text
修改文件
```

最后：

```text
执行命令
```

三者合并：

```text
Claude Code
```

### 补充画面

终端只是其中一个入口。

快速闪过：

```text
Terminal
VS Code / Cursor
JetBrains
Desktop
Web
```

不要停留太久。

### Scene Type
`Concept Visualization + UI Montage`

### 信息分工
- **声音**：完成正式定义。
- **画面**：把定义压缩成三个核心能力。

---

## Scene 06｜从 Copilot 到 Agent

### 目的
解释整条视频最重要的概念：Agent。

### 口播
这里真正发生的变化，其实是从 Copilot 走向 Agent。

以前，我们和 AI 一起写代码时，人仍然负责拆解每一步。

你发现问题、找代码、把问题发给 AI，再根据它的建议继续操作。

AI 只是参与其中某一个环节。

### 画面

传统方式：

```text
人
↓
发现问题
↓
拆步骤
↓
问 AI
↓
执行
↓
再问 AI
```

其中“人”的节点一直高亮。

### 口播继续
Agent 不一样。

你开始把一个完整目标交给 AI。

至于中间要看哪些文件、修改哪些代码、运行什么命令，它可以自己完成。

### 画面

结构变化成：

```text
        人
        ↓
      任务目标
        ↓
      Agent
   ┌────┼────┐
 找文件 分析代码 修改
   │     │     │
   └──运行测试──┘
        ↓
       结果
```

### 屏幕重点

```text
告诉 AI 下一步
        ↓
告诉 AI 最终目标
```

### Scene Type
`Diagram + Concept Visualization`

### 信息分工
- **声音**：解释 Agent。
- **画面**：展示控制权是如何变化的。

---

## Scene 07｜第一层能力：看懂项目

### 目的
开始解释 Claude Code 能做到什么，但避免功能列表。

### 口播
理解 Agent 以后，再看 Claude Code 的能力就容易多了。

第一层，是理解。

比如你刚接手一个完全陌生的项目。

以前你可能要自己翻目录、读文档、查入口文件。

现在可以先让 Claude Code 阅读代码库，然后告诉你项目是怎么组织的。

### 画面

一个陌生项目文件树展开：

```text
src/
├─ api/
├─ components/
├─ hooks/
├─ services/
└─ utils/
```

文件逐个被扫描。

随后重新组合成简单架构：

```text
UI
 ↓
Service
 ↓
API
 ↓
Database
```

### 口播继续
它可以帮你找核心模块、解释调用关系，也可以顺着代码定位一个 Bug 的根因。

### 屏幕重点

```text
第一层：理解
```

### Scene Type
`Code Exploration + Diagram`

---

## Scene 08｜第二层能力：真正动手

### 目的
从“理解”自然升级到“执行”。

### 口播
第二层，是执行。

看懂以后，它不只是告诉你应该怎么改，而是真的可以动手。

修改文件、跨文件重构、补测试、修 Bug、清理 lint、升级依赖，甚至处理 Git 操作。

### 画面

不要逐条文字展示。

用一个连续任务演示：

```text
Refactor auth module
```

随后：

```text
auth.ts          Modified
login.ts         Modified
auth.test.ts     Created
```

然后：

```text
npm test
```

结果：

```text
24 passed
```

再出现：

```text
git diff
```

### 屏幕重点

```text
第二层：执行
```

### Scene Type
`Demo + Code Focus`

### 信息分工
- **声音**：覆盖能力范围。
- **画面**：只演一个代表性完整任务。

---

## Scene 09｜第三层能力：从代码库向外延伸

### 目的
让观众理解 Claude Code 的能力边界可以超过代码。

### 口播
再往前一步，Claude Code 的工作范围甚至不一定只停留在代码库里。

通过 MCP，它可以连接外部工具和数据。

比如读取文档、获取项目任务，或者访问其他服务。

### 画面

中央：

```text
Claude Code
```

左侧：

```text
Codebase
```

右侧逐渐连接：

```text
Docs
Jira
Slack
Drive
```

不要展示过多具体操作。

### 口播继续
所以你可以把它理解成：

它正在从一个单纯的代码工具，变成一个以项目为中心的 AI 工作入口。

### 屏幕重点

```text
理解 → 执行 → 连接
```

### Scene Type
`Diagram`

---

## Scene 10｜是不是以后项目都可以交给 AI？

### 目的
制造反转，控制观众预期。

### 口播
看到这里，很容易产生一个想法：

既然它已经能看项目、改代码、跑测试，那以后是不是整个项目都可以直接交给 AI？

答案是：不行。

### 画面

前面的：

```text
理解
执行
连接
```

快速汇聚。

出现：

```text
全部交给 AI？
```

随后一个明显的：

```text
NO
```

但不要做夸张警告动画。

### Scene Type
`Text Emphasis + Transition`

---

## Scene 11｜AI 能执行，但不能替你判断

### 目的
建立正确的人机协作边界。

### 口播
比如项目现在有两个技术方案。

到底选 A 还是 B？

要不要为了未来扩展性增加现在的复杂度？

这个功能应该优先追求速度，还是长期可维护性？

这些问题背后有业务、成本、风险和团队情况。

AI 可以分析，但最终的判断仍然应该由人完成。

### 画面

中央出现：

```text
方案 A       方案 B
```

Claude Code 在中间给出：

```text
Pros / Cons
```

但最终 Decision 按钮留在人这一侧。

### 口播继续
还有一个非常重要的问题：

Claude Code 修改了代码，也不代表它一定正确。

测试通过，同样不代表业务逻辑百分之百正确。

### 画面

```text
Tests passed ✓
```

停顿。

下面出现：

```text
Business correct ?
```

### 屏幕重点

```text
AI 生成候选结果
人负责 Review
```

### Scene Type
`Comparison + Concept Visualization`

---

## Scene 12｜真正的人机分工

### 目的
把上一幕的边界转化为明确协作方式。

### 口播
所以真正适合 Claude Code 的工作方式，不是：

“这个项目以后全部交给 AI。”

而是重新分工。

### 画面

屏幕从中间分开。

左：

```text
人

目标
判断
决策
验收
```

右：

```text
AI

理解
分析
执行
重复劳动
```

中间有协作箭头，而不是替代箭头。

### 屏幕重点

```text
协作
≠
托管
```

### Scene Type
`Diagram + Text Emphasis`

---

## Scene 13｜ChatGPT、Cursor、Claude Code 怎么选

### 目的
解决观众最现实的问题：工具之间到底什么关系。

### 口播
理解这一点以后，再看 ChatGPT、Copilot、Cursor 和 Claude Code，就不会那么容易混淆。

ChatGPT 最典型的是：

你问，它答。

Copilot 最典型的是：

你写，它补。

Cursor 现在正在把编辑器和 Agent 能力融合在一起。

而 Claude Code 最典型的方式是：

你给任务，它执行，最后你验收。

### 画面

依次出现三种关系：

```text
ChatGPT
你问 → 它答
```

```text
Copilot
你写 → 它补
```

```text
Claude Code
你给任务 → 它执行 → 你验收
```

Cursor 放在 Copilot 与 Agent 之间，表现为边界逐渐融合。

### 口播继续
所以它们不是非要二选一。

真正合理的方式，是按任务派工。

### 画面

```text
问知识 / 讨论方案
→ ChatGPT

实时编码
→ Copilot / Cursor

项目级执行
→ Claude Code
```

### 屏幕重点

```text
按任务派工
```

### Scene Type
`Comparison`

---

## Scene 14｜最后真正发生了什么变化

### 目的
结尾不再总结功能，而是提升到新的 AI 编程方式。

### 口播
如果把这件事拉远一点看，你会发现真正变化的其实不是某一个工具。

而是我们和 AI 一起写代码的方式。

以前，我们问：

“这段代码怎么写？”

后来开始问：

“这个问题怎么解决？”

而现在，我们正在越来越多地告诉 AI：

“这个任务我要做到什么结果，你去处理，完成之后告诉我。”

### 画面

三句话依次出现：

```text
这段代码怎么写？
```

变成：

```text
这个问题怎么解决？
```

最后：

```text
这个任务要达到这个结果。
你去完成。
```

画面随之从：

```text
Human → AI → Human → Code
```

慢慢变成：

```text
Human
  ↓
Goal
  ↓
Agent
  ↓
Execution
  ↓
Human Review
```

### 最终口播
Claude Code 真正改变的，不只是写代码的速度。

而是人和 AI 在开发流程里的分工方式。

人负责目标、判断和验收。

AI 开始承担越来越多理解、分析和执行工作。

这可能才是 Claude Code 最值得理解的地方。

### 最终画面

```text
人负责判断
AI 负责执行
```

随后缩小为：

```text
Human × AI
```

结束。

### Scene Type
`Concept Visualization + Closing`

---

# Scene Script 总览

```text
01 Bug 出现
↓
02 ChatGPT 工作流
↓
03 Claude Code 工作流
↓
04 Advice → Action
↓
05 Claude Code 定义
↓
06 Copilot → Agent
↓
07 理解项目
↓
08 执行任务
↓
09 连接外部工具
↓
10 能不能全部交给 AI？
↓
11 AI 不能替代判断
↓
12 人机重新分工
↓
13 工具如何选择
↓
14 AI 编程方式发生变化
```

---

# 当前阶段的一个重要原则

到 Scene Script 这一步以后，后续不应该再直接从“原文章节”生成画面。

后面的所有生产内容，都应该以 Scene Script 为基准：

```text
                Scene Script
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
     Narration Script      Visual Script
          ↓                     ↓
         TTS                 Remotion
          ↓                     ↓
       音频/字幕               场景
          └──────────┬──────────┘
                     ↓
                   成片
```

这样才能确保声音与视觉来自同一个视频设计，而不是“先有口播，再给口播配图”。

---

# 下一步

下一步建议进入：

> **Narration Script：正式生成完整口播稿**

但这一次生成口播时，不再从原文直接改写。

而是严格按照这 14 个 Scene 的叙事任务生成。

这样得到的口播会天然适合视频节奏，同时 Scene Script 仍然保留视觉设计所需要的信息。
