# Claude Code 视频化 · 第五步：Visual Script

> 目标：基于 Scene Script，为每一个 Scene 明确视觉表达方式。  
> 这一步完成后，Remotion 不再“根据口播猜画面”，而是按照明确的视觉脚本执行。

---

## 全局视觉原则

整条视频应该遵循 5 个基本规则。

### 1. 画面不能只是重复口播

如果口播说：

> Claude Code 可以直接修改代码。

画面不要只是出现：

```text
Claude Code 可以直接修改代码
```

应该真正演示：

```text
auth.ts      Modified
user.ts      Modified
tests.ts     Created
```

---

### 2. 视觉承担“证明”和“演示”

口播更多负责：

- 为什么
- 结论
- 转折
- 解释

画面更多负责：

- 发生了什么
- 怎么发生
- 两种方式有什么差异
- 一个抽象概念如何运作

---

### 3. 一个 Scene 只表达一个视觉中心

避免：

```text
标题
+ 三个卡片
+ 五行说明
+ 流程图
+ 图标
+ 大段字幕
```

同时出现。

每一个 Scene 应该只有一个主要视觉动作。

---

### 4. 少做“页面”，多做“过程”

视频应该尽量出现：

```text
变化
移动
连接
执行
比较
展开
收缩
替换
```

而不是大量静态信息页。

---

### 5. 动画必须有意义

动画不是为了“让画面动起来”。

每个动画都应该表达信息。

例如：

```text
ChatGPT ↔ IDE
```

来回移动，就是在表达：

> 工作流割裂。

而文件树被扫描，就是表达：

> AI 正在理解项目。

---

# Scene 01｜Bug 出现

## 视觉目标

快速建立“真实开发场景”。

## 主要画面

模拟一个 VS Code / Cursor 风格 IDE。

画面结构：

```text
┌─────────────────────────────┐
│ Explorer │ editor           │
│          │                  │
│          │                  │
├──────────┴──────────────────┤
│ Terminal                   │
└─────────────────────────────┘
```

代码正在运行。

Terminal 突然出现：

```text
TypeError: Cannot read properties of undefined
```

## 动画

1. 正常运行状态
2. Terminal 出现红色报错
3. 报错轻微放大
4. 鼠标拖选错误信息
5. Copy

## 屏幕文字

只出现一次：

```text
遇到 Bug
```

不要加解释文字。

## Visual Type

`IDE Simulation`

---

# Scene 02｜ChatGPT 工作流

## 视觉目标

让观众“感受到麻烦”。

不是告诉观众流程复杂，而是让流程真的变复杂。

## 画面结构

左右布局：

```text
┌──────────────┬──────────────┐
│ IDE          │ ChatGPT      │
│              │              │
└──────────────┴──────────────┘
```

## 动画流程

报错从左边：

```text
IDE
```

复制到：

```text
ChatGPT
```

然后 ChatGPT 返回建议。

画面焦点重新移回 IDE。

打开：

```text
user.ts
```

复制代码。

再次移动到 ChatGPT。

ChatGPT 返回修改建议。

再回 IDE。

## 关键视觉设计

随着操作次数增加，在两个窗口之间逐渐出现更多移动轨迹。

例如：

```text
IDE → ChatGPT
IDE ← ChatGPT
IDE → ChatGPT
IDE ← ChatGPT
```

最后形成一个略显混乱的连接网络。

## 收尾

所有移动停止。

画面中央出现：

```text
AI 在项目外面
```

## Visual Type

`Workflow Simulation`

---

# Scene 03｜Claude Code 工作流

## 视觉目标

和 Scene 02 形成极强反差。

Scene 02：

```text
很多操作
```

Scene 03：

```text
一个任务
```

## 画面

Terminal / Claude Code。

输入：

```text
帮我找到这个报错的原因，然后修掉。
```

## 动画

输入完成后，不再切窗口。

同一界面内依次出现状态：

```text
Searching files...
```

↓

```text
Reading auth.ts
```

↓

```text
Checking references
```

↓

```text
Editing user.ts
```

↓

```text
Running tests
```

↓

```text
✓ Tests passed
```

## 视觉节奏

这些动作不要像字幕逐条出现。

应该模拟真实任务执行日志。

## 收尾

画面缩略。

中央出现：

```text
一个任务
vs
一串操作
```

左侧用 Scene 02 的复杂轨迹缩略图。

右侧是 Claude Code 一条直线流程。

## Visual Type

`Terminal Simulation + Comparison`

---

# Scene 04｜Advice → Action

## 视觉目标

把前面两个案例抽象成一个核心认知。

## 画面

左右两个模型。

左：

```text
Human
  ↓
ChatGPT
  ↓
Advice
  ↓
Human
  ↓
Project
```

右：

```text
Human
  ↓
Claude Code
  ↓
Project
```

## 动画

左边每一步依次出现。

然后整体压缩。

右边 Claude Code 直接连接 Project。

最后屏幕中央出现：

```text
Advice
  ↓
Action
```

## Visual Type

`Concept Diagram`

---

# Scene 05｜Claude Code 定义

## 视觉目标

正式建立 Claude Code 的认知模型。

## 画面

Claude Code Logo / 名称居中。

周围三个核心能力依次连接：

```text
理解项目
```

```text
修改文件
```

```text
执行命令
```

形成三角结构。

## 动画

每个能力出现时，配一个非常短的实际视觉：

### 理解项目

文件树被扫描。

### 修改文件

Diff：

```text
- old code
+ new code
```

### 执行命令

Terminal：

```text
npm test
```

## 补充入口

下方快速横向滚过：

```text
Terminal
VS Code
Cursor
JetBrains
Desktop
Web
```

这一部分不要停留。

## Visual Type

`Concept Hub`

---

# Scene 06｜Copilot → Agent

## 视觉目标

解释抽象概念 Agent。

这是全片最重要的 Diagram Scene。

## 第一阶段

传统方式：

```text
Human
  ↓
发现问题
  ↓
拆任务
  ↓
问 AI
  ↓
执行
  ↓
判断
  ↓
继续
```

所有节点逐个亮起。

重点突出：

```text
Human
```

始终控制流程。

## 第二阶段

整个结构发生重组。

Human 上升到顶部。

只保留：

```text
Human
  ↓
Goal
```

下方展开：

```text
Agent
├─ Search
├─ Read
├─ Analyze
├─ Edit
└─ Test
```

## 核心动画

“步骤控制”从 Human 身上逐渐转移到 Agent 内部。

## 最后文字

```text
管理步骤
      ↓
管理目标
```

## Visual Type

`Animated System Diagram`

---

# Scene 07｜理解项目

## 视觉目标

把“理解项目”真正视觉化。

## 画面

左边是复杂文件树：

```text
src/
├── api/
├── auth/
├── components/
├── hooks/
├── services/
├── utils/
└── tests/
```

开始时看起来杂乱。

## 动画

Claude Code 扫描不同目录。

一些文件被临时高亮。

随后文件树逐渐转化成简单架构图：

```text
UI
 ↓
Auth
 ↓
Service
 ↓
API
```

## 核心视觉意义

表达：

```text
复杂代码
      ↓
结构理解
```

而不是简单写：

> Claude Code 能理解项目。

## Visual Type

`Codebase → Architecture Transformation`

---

# Scene 08｜执行任务

## 视觉目标

展示一次“完整任务”，而不是功能清单。

## 任务

```text
Refactor auth module
```

## 画面

IDE 中三个文件：

```text
auth.ts
login.ts
auth.test.ts
```

## 动画

首先：

```text
auth.ts Modified
```

随后：

```text
login.ts Modified
```

再：

```text
auth.test.ts Created
```

接着 Terminal：

```text
npm test
```

测试进度。

最后：

```text
24 passed
```

随后快速出现：

```text
git diff
```

## 核心视觉

任务从：

```text
Todo
```

变成：

```text
Done
```

总结卡完整展开后保持静止约 4.6 秒，让观众先读完“把一个连续任务推进到可验证的结果”，再保留约 2.6 秒思考时间。

## Visual Type

`Task Execution Demo`

---

# Scene 09｜连接外部工具

## 视觉目标

展示 Claude Code 的工作范围向代码库外扩展。

## 画面

Claude Code 位于中心。

左侧：

```text
Codebase
```

右侧：

```text
Docs
Jira
Slack
Drive
```

## 动画

最开始只有：

```text
Claude Code ↔ Codebase
```

随后连接一条一条展开。

最后形成：

```text
        Docs
         │
Jira ─ Claude Code ─ Codebase
         │
       Drive
```

连接按 `Codebase → Docs → Jira → Slack → Drive` 的认知顺序逐条展开。最终总结卡完整展开后静置约 4 秒，让观众读完“围绕真实项目，连接完成任务所需的上下文”，并保留约 2～3 秒思考时间。

## 注意

这一幕不要做真实 MCP 配置演示。

这里只解释“能力范围”。

## Visual Type

`Connection Diagram`

---

# Scene 10｜全部交给 AI？

## 视觉目标

制造叙事停顿和反转。

## 画面

快速回顾前三层：

```text
理解
+
执行
+
连接
```

三个词聚合。

变成：

```text
全自动？
```

停顿约半秒。

然后：

```text
NO
```

但 NO 不要做红色警告风格。

更适合使用：

```text
Not quite.
```

或：

```text
还不行。
```

前三层能力依次出现后向中央聚合，再形成“全自动？”的自然推论；提问短暂停顿后，以克制、非警告式的总结卡回答“还不行。”。总结卡完整展开后静置约 4 秒，留出明确的思考时间。

## Visual Type

`Narrative Pause`

---

# Scene 11｜判断不能外包

## 视觉目标

表现“分析”和“决策”的区别。

## 第一部分

屏幕左右：

```text
方案 A
```

```text
方案 B
```

Claude Code 在中间分析：

```text
成本
性能
复杂度
风险
```

两侧形成 Pros / Cons。

## 动画

Claude Code 能够把信息整理完整。

但是最终：

```text
Decision
```

按钮停留在 Human 一侧。

## 第二部分

出现：

```text
Tests passed ✓
```

观众以为结束。

短暂停顿。

下面出现：

```text
Business correct ?
```

## 核心文字

```text
AI Output
≠
Final Truth
```

先完成方案 A／B 的分析，再将 Decision 明确保留在 Human 一侧；随后切换到 `Tests passed ✓ ≠ Business correct？`。最终总结完整展开后静置约 4 秒，让观众读完“AI 生成候选结果，人负责最终判断”，并保留思考时间。

## Visual Type

`Decision Diagram + Contrast`

---

# Scene 12｜人机分工

## 视觉目标

形成整条视频非常重要的稳定认知。

## 画面

左右对称。

### Human

```text
Goal
Judgment
Decision
Review
```

### AI

```text
Understand
Analyze
Execute
Repeat
```

## 动画

不要让 Human 和 AI 对立。

两侧通过中心任务连接。

例如：

```text
Human
   ↘
    Project
   ↗
AI
```

然后形成循环：

```text
Goal
 ↓
AI Execution
 ↓
Human Review
 ↓
Next Goal
```

## 重点文字

```text
协作 ≠ 托管
```

Human 与 AI 的职责逐项出现后，共同连接到 Project，并形成 `Goal → AI Execution → Human Review → Next Goal` 的协作循环。最终总结完整展开后静置约 4 秒，让观众读完“人负责方向与验收，AI 承担分析与执行”，并保留思考时间。

## Visual Type

`Responsibility Diagram`

---

# Scene 13｜工具怎么分工

## 视觉目标

不要做传统四列表格。

应该做“任务路由”。

## 画面

中央：

```text
Developer
```

从 Developer 出发三条路径。

### ChatGPT

```text
问知识
讨论方案
分析问题
```

### Cursor / Copilot

```text
实时编码
代码补全
编辑器协作
```

### Claude Code

```text
项目任务
跨文件修改
测试 / 重构
```

## 动画

不同任务卡片出现。

例如：

```text
解释 OAuth
```

自动移动到 ChatGPT。

```text
补全函数
```

移动到 Cursor。

```text
重构 auth 模块
```

移动到 Claude Code。

## 最后文字

```text
按任务派工
```

## Visual Type

`Task Routing Animation`

## Remotion 实现节奏

Developer 出现后，三条任务路径依次连接 ChatGPT、Cursor／Copilot 与 Claude Code；任务卡分别落入对应工具，形成“问答、实时编码、项目级执行”的动态分工。场景时长为 18 秒，最终「按任务派工」完整展开后静置约 4.4 秒，保证观众读完并留出思考时间。

---

# Scene 14｜AI 编程方式的变化

## 视觉目标

最终从具体工具提升到“工作方式变化”。

## 第一阶段

画面出现：

```text
这段代码怎么写？
```

对应：

```text
Human → AI → Code
```

## 第二阶段

替换：

```text
这个问题怎么解决？
```

对应：

```text
Human ↔ AI
    ↓
 Solution
```

## 第三阶段

最终：

```text
这个任务要达到这个结果。
```

画面转为：

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

## 最终画面

整个流程逐渐简化成：

```text
Human × AI
```

然后出现最后一句：

```text
人负责判断
AI 负责执行
```

## Visual Type

`Evolution Diagram + Closing`

## Remotion 实现节奏

三种提问方式依次演进，再将第三阶段展开成 `Human → Goal → Agent → Execution → Human Review`。场景时长为 21 秒，最终以 `Human × AI`、`人负责判断 · AI 负责执行` 收束；结论完整展开后静置约 5 秒，作为全片读字与思考留白。

---

# 全片视觉类型分布

建议控制在以下几种核心类型里：

```text
UI Simulation
Terminal Simulation
Workflow
Comparison
Concept Diagram
Code Exploration
Task Execution
Connection Diagram
Decision Diagram
Task Routing
Closing Visualization
```

不要每个 Scene 都发明一种新风格。

---

# Remotion 组件层建议

后续真正进入代码制作时，可以提前抽象这些通用组件：

```text
<IDEWindow />
<TerminalWindow />
<ChatWindow />

<FileTree />
<CodeDiff />
<TestResult />

<FlowNode />
<FlowArrow />
<ProcessDiagram />

<TaskCard />
<ToolCard />
<DecisionCard />

<Keyword />
<SectionTitle />

<SceneTransition />
```

这样 14 个 Scene 可以大量复用已有视觉语言。

---

# 动画层级建议

整条视频动画建议分成三层。

## 一级：信息动画

必须有。

例如：

```text
节点出现
流程连接
文件被修改
测试执行
```

它们直接表达知识。

---

## 二级：注意力动画

少量使用。

例如：

```text
高亮
放大
聚焦
淡化其他元素
```

用于告诉观众：

> 现在看这里。

---

## 三级：装饰动画

尽量少。

例如：

```text
粒子
背景漂浮
无意义旋转
过多弹跳
```

如果不能帮助理解，就不要加。

---

# Visual Script 最终标准

每一幕制作完成后，都应该检查：

### 1

关闭声音。

只看画面。

能不能大概理解这一幕发生了什么？

### 2

只听声音。

是不是仍然能理解主要逻辑？

### 3

声音 + 画面一起播放。

两者是不是互相补充，而不是重复？

理想状态：

```text
声音：解释意义
+
画面：展示过程
=
完整信息
```

而不是：

```text
声音：Claude Code 可以修改文件

画面：Claude Code 可以修改文件
```

---

# 下一步

Visual Script 完成之后，整个内容设计已经基本完整。

接下来可以进入真正生产环节：

```text
Narration Script
↓
TTS
↓
音频
↓
字幕时间轴
```

同时：

```text
Visual Script
↓
Remotion
↓
Scenes
```

最后再根据真实音频长度，对 Scene 时长和动画节奏做同步调整。

从这里开始，工作重点就从“内容设计”正式进入“视频制作”。
