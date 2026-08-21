# Video Harness 改造说明

## 目标

不是推翻现有 Video 项目重做，而是在**保留现有单条视频生产逻辑**的基础上，把它逐步改造成一个可执行、可扩展的 **Video Harness**。

核心变化：

> 从「由 Codex 临时理解规则并完成视频」变成「Video 自己定义流程、规则、状态和工具，Codex/Agent 负责执行」。

最终希望达到：

```text
输入文章
   ↓
Video Harness
   ↓
自动加载 Workflow / Style / Context
   ↓
Agent 执行
   ↓
Script → Storyboard → Prototype
   ↓
人工确认
   ↓
TTS → Subtitle → Remotion → Render
   ↓
Verification
   ↓
Video
```

---

## 一、核心架构

建议逐步形成以下结构：

```text
Video Harness
│
├── Core
│   ├── Runner          # 控制执行
│   ├── Workflow        # 定义视频生产流程
│   └── Context         # 给 Agent 提供必要上下文
│
├── Styles              # 视频视觉风格，可扩展
│   ├── current
│   ├── whiteboard
│   └── ...
│
├── Tools
│   ├── TTS
│   ├── Remotion
│   └── FFmpeg
│
├── Shared
│   └── Components      # 公共 Scene / Remotion 组件
│
├── Videos              # 每条视频自己的数据和产物
│
└── Verification        # 字幕、渲染、溢出等质量检查
```

最重要的是明确几个边界：

- **Workflow：怎么生产视频**
- **Style：视频长什么样**
- **Tools：具体能力怎么执行**
- **Video：这一条视频是什么**
- **Runner：当前应该执行哪一步**
- **Agent/Codex：根据 Harness 提供的信息完成具体任务**

不要把这些职责重新混到一起。

---

## 二、最核心的改造

### 1. Workflow 独立

把现有成熟流程固化下来：

```text
Article
↓
Script
↓
Storyboard
↓
Visual Prototype
↓
人工确认
↓
TTS
↓
Subtitle
↓
Remotion
↓
Render
```

现有单条视频逻辑尽量不修改，只把它变成 Harness 可以调用的 Workflow。

### 2. Style 与 Workflow 分离

当前视觉规则整理为：

```text
styles/
└── current/
    ├── STYLE.md
    ├── theme
    ├── scenes
    └── examples
```

以后增加：

```text
styles/
├── current/
├── whiteboard/
└── minimal/
```

新增风格不应该复制整套视频 Workflow。

尤其要避免 Storyboard 过早写死颜色、字体、具体动画等视觉实现，否则同一个 Storyboard 很难切换 Style。

### 3. 每条视频建立明确状态

例如：

```text
videos/xxx/
├── video.yaml
├── article.md
├── script.md
├── storyboard.md
├── prototype/
└── output/
```

`video.yaml` 至少记录：

```yaml
id: xxx
workflow: default
style: current
status: storyboard
target: prototype
```

让系统知道：

> 这是什么视频、用什么流程、什么风格、现在做到哪里、准备做到哪里。

### 4. 建立统一 Runner

以后不要依赖用户每次告诉 Codex下一步干什么。

应该逐渐形成：

```text
video create article.md
video create article.md --style whiteboard
video batch ./articles --until prototype
```

Runner 负责：

```text
读取配置
↓
判断当前状态
↓
加载 Workflow
↓
加载 Style / Context
↓
调用 Agent / Tool
↓
验证结果
↓
更新状态
↓
决定继续 / 暂停 / 失败
```

这是 Harness 最核心的部分之一。

---

## 三、Agent/Codex 的定位

不要把 Codex 本身当成 Video Harness。

正确关系应该是：

```text
用户
 ↓
Video Harness
 ↓
Runner
 ↓
Workflow + Context + Rules
 ↓
Codex / Agent
 ↓
Tools
 ↓
结果
```

也就是说：

> **Video 决定“应该怎么工作”，Codex 负责“执行当前工作”。**

这样未来即使更换 Claude Code、Codex 或其他 Agent，Video 的核心生产体系仍然存在。

---

## 四、批处理属于 Runner，不要修改单条视频逻辑

批量文章：

```text
Batch Runner
     ↓
Single Video Runner
     ↓
Existing Workflow
```

例如：

```text
01.md → Prototype ✓
02.md → Prototype ✓
03.md → Failed → 记录错误 → Continue
04.md → Prototype ✓
```

不要为了支持批量生成，重新做一套 Batch Workflow。

---

## 五、改造过程中重点防止的问题

**1. 过度设计**

第一阶段不要加入：

- 多 Agent
- 自动 Style 选择
- 复杂 Memory
- 插件系统
- 自动质量修复
- 复杂 Agent Loop

先解决真实需求。

**2. 为 Harness 重写已有功能**

现有 Remotion、Storyboard、TTS、单条视频生成等能工作的逻辑优先保留。

原则：

> 包装、拆分、建立边界，而不是推倒重做。

**3. Workflow 和 Style 再次耦合**

这是未来扩展视频风格最大的风险。

应该保证：

```text
同一个 Content / Storyboard
           ↓
     不同 Style
    ↙     ↓      ↘
 Tech  Whiteboard  Minimal
```

**4. Harness 仍然依赖人的记忆**

如果系统仍需要用户告诉 Codex：

> 下一步读哪个文件、执行哪个阶段、在哪里暂停、结果放哪里……

说明这些规则还没有真正进入 Harness。

---

## 六、第一阶段完成标准

暂时只做到 **Video Harness v0.1**：

```text
① 建立 Core / Styles / Tools / Videos 等职责边界

② 固化现有默认 Workflow

③ 当前视觉体系独立为 current Style

④ 每条视频有自己的配置和状态

⑤ 建立统一 Runner

⑥ Runner 支持：
   - single
   - batch
   - target=prototype
   - 单条失败继续
```

完成后应满足：

> 给 Video 一篇文章，它知道该加载哪些规则、按照什么流程工作、当前做到哪里、什么时候暂停，不再依赖用户重复描述整个生产流程。

**最终原则：不是现在重新开发一个“高级 Harness”，而是把目前散落在项目文件、Codex 指令和人工操作中的视频生产知识，逐步固化成 Video 自己能够执行的系统。**