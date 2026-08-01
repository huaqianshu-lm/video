# 文章到视频：完整工作流总结

> 目标：把一篇文章重新演绎成一条独立的视频作品。  
> 文档和视频表达的是同一套知识，但两者互相独立：
>
> - 看完文档，不需要再看视频
> - 看完视频，也不需要再看文档
> - 两者信息密度接近
> - 视频充分利用时间、动画、演示、对比、流程和界面模拟，而不是把文章做成动态 PPT

---

# 一、核心目标

整个流程不是：

```text
文章
↓
改成口语
↓
加字幕
↓
配几张图
↓
视频
```

而是：

```text
                原始知识
                    │
             ┌──────┴──────┐
             ↓             ↓
          文档表达        视频表达
          文字逻辑        时间 + 声音 + 视觉 + 演示
```

核心原则：

> **不是“把文章变成视频”，而是“用视频重新表达同一套知识”。**

---

# 二、整体流程

完整的视频内容设计与生产流程：

```text
原始文章
   ↓
① Content Analysis
   ↓
② Video Narrative
   ↓
③ Scene Script
   ↓
        ┌──────────────────────┐
        │                      │
        ↓                      ↓
④ Narration Script       ⑤ Visual Script
        │                      │
        ↓                      ↓
⑥ TTS Script           HTML Visual Prototype
        │                      │
        ↓                      │
⑦ edge-tts Audio              │
        │                      │
        ↓                      │
⑧ Audio Manifest              │
        │                      │
        ↓                      │
⑨ Subtitle System             │
        │                      │
        └──────────┬───────────┘
                   ↓
              ⑩ Remotion
                   ↓
             ⑪ Quality Review
                   ↓
               Final Video
```

---

# 三、第一步：Content Analysis

## 目的

第一步不写口播，也不设计镜头。

先解决：

> **这篇内容到底想让观众理解什么？**

需要从原文章节中提取真正的知识结构。

## 需要分析的内容

包括：

- 核心命题
- 必须保留的知识点
- 辅助信息
- 因果关系
- 对比关系
- 流程关系
- 哪些内容适合案例解释
- 哪些内容适合视觉化
- 哪些内容不适合进入当前视频

## Claude Code 案例中的核心命题

最终提炼为：

> **Claude Code 让 AI 从“回答问题”进入“执行任务”。**

进一步拆成：

```text
顾问 → 搭档

Copilot → Agent

单段代码 → 整个项目

给建议 → 直接执行

人拆每一步 → AI 接受任务目标

AI 能做什么 → AI 不能做什么

人负责判断 → AI 负责执行
```

## 本阶段生成文档

`claude-code-video-content-analysis.md`

---

# 四、第二步：Video Narrative

## 目的

Content Analysis 解决：

> 讲什么。

Video Narrative 解决：

> **按什么顺序讲。**

视频不应该机械按照原文章节顺序播放。

应该根据观众的认知过程重新组织。

## Claude Code 案例的叙事结构

```text
01 一个真实问题
↓
02 两种完全不同的解决方式
↓
03 Claude Code 到底改变了什么
↓
04 Agent 是什么
↓
05 Claude Code 到底能做到什么程度
↓
06 为什么不能把项目完全交给它
↓
07 ChatGPT / Cursor / Claude Code 怎么分工
↓
08 AI 编程真正发生的变化
```

## 本阶段生成文档

`claude-code-video-narrative.md`

---

# 五、第三步：Scene Script

## 目的

Video Narrative 仍然是宏观结构。

Scene Script 开始把整条视频拆成：

> **一个个真正可制作的 Scene。**

## 每个 Scene 需要定义

```text
Scene 编号
Scene 名称
目的
口播方向
画面
屏幕重点
Scene Type
声音与视觉的信息分工
```

## Claude Code 案例最终拆成 14 个 Scene

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

## 本阶段生成文档

`claude-code-video-scene-script.md`

---

# 六、第四步：Narration Script

## 目的

直到 Scene Script 完成以后，才正式生成完整口播。

不要：

```text
原文
↓
直接生成口播
```

应该：

```text
原文
↓
知识分析
↓
视频叙事
↓
Scene Script
↓
Narration Script
```

## 口播的职责

口播主要负责：

- 解释
- 推进
- 因果
- 转折
- 结论
- 建立认知

不应该承担所有信息。

## 本阶段生成文档

`claude-code-video-narration-script.md`

---

# 七、第五步：Visual Script

## 目的

Narration Script 解决：

> 声音讲什么。

Visual Script 解决：

> **画面到底怎么表达。**

## 核心原则

### 1. 画面不能重复口播

```text
声音：解释意义
+
画面：展示过程
=
完整信息
```

### 2. 少做页面，多做过程

视频应该尽量出现：

```text
变化
移动
执行
扫描
连接
替换
比较
展开
收缩
```

### 3. 动画必须表达信息

如果动画不能帮助理解，就不要加。

## 固定 Scene Type

```text
IDE Simulation
Terminal Simulation
Workflow Simulation
Comparison
Concept Diagram
Code Exploration
Task Execution Demo
Connection Diagram
Decision Diagram
Task Routing
Closing Visualization
```

## 本阶段生成文档

`claude-code-video-visual-script.md`

---

# 八、第六步：HTML / CSS Visual Prototype

## 目的

在真正进入 Remotion 之前，先用成本更低的方式验证：

- 整体设计方向
- 场景结构
- 信息密度
- 排版
- 视觉语言
- 是否存在 PPT 感

## 第一版原型

`claude-code-video-visual-prototype.html`

## 完整版原型

`claude-code-video-visual-prototype-full.html`

完整版包含全部 14 个 Scene，并支持：

- 上一幕
- 下一幕
- 自动播放
- 键盘方向键
- Scene 进度

---

# 九、第七步：TTS Script

## 目的

Narration Script 还是面向内容和口播的文档。

真正进入 TTS 前，再加工成：

> **TTS Script**

主要解决两件事：

### 1. 拆 Narration Segment

一个 Scene 可以拆成多个 Narration Segment。

例如：

```text
Scene 06

06-01
这里其实还涉及一个现在非常重要的概念：Agent。

06-02
过去我们用 AI 写代码时，人的角色其实非常重。

06-03
Agent 的变化就在这里。

06-04
人开始从管理每一步操作，转向管理最终目标。
```

### 2. 清理 TTS 文本

包括：

- 去掉 Markdown
- 去掉标题
- 调整标点
- 控制停顿
- 统一数字读法
- 统一英文产品名
- 处理技术词发音

## 推荐结构

```json
{
  "videoId": "what-is-claude-code",
  "scenes": [
    {
      "sceneId": "06",
      "segments": [
        {
          "id": "06-01",
          "text": "这里其实还涉及一个现在非常重要的概念：Agent。"
        }
      ]
    }
  ]
}
```

## 核心原则

> **Segment ID 全流程保持一致。**

例如：

```text
03-02
```

后续同时用于：

```text
TTS Script
Audio Manifest
Subtitle Data
Remotion Timeline
```

---

# 十、第八步：edge-tts Audio

## 工具选择

当前确定使用：

> **edge-tts**

原因：

- 接入简单
- 可脚本化
- 不需要单独购买 TTS API
- 适合批量生成
- 可以获取语音边界信息
- 非常适合后续字幕同步

## 生成方式

不要整篇一次生成。

按 Scene / Narration Segment 生成。

例如：

```text
audio/
└── scene-06/
    ├── 06-01.mp3
    ├── 06-02.mp3
    ├── 06-03.mp3
    └── 06-04.mp3
```

## 为什么按 Segment 生成

好处：

- 单段不满意可以单独重生成
- 单段语速可以单独调整
- 更方便控制动画节奏
- 更方便生成字幕
- 更容易排查问题

---

# 十一、第九步：Audio Manifest

## 目的

TTS 完成以后，不只是输出一堆音频文件。

还要生成：

`audio-manifest.json`

## 示例

```json
{
  "scenes": [
    {
      "sceneId": "03",
      "segments": [
        {
          "id": "03-01",
          "file": "audio/scene-03/03-01.mp3",
          "text": "如果换成 Claude Code，同一个问题，工作方式会完全不一样。",
          "duration": 4.82
        }
      ],
      "narrationDuration": 4.82
    }
  ]
}
```

## 核心作用

Audio Manifest 告诉后续系统：

- 每段音频是什么
- 属于哪个 Scene
- 对应什么文本
- 实际时长是多少

## Scene 时长原则

Scene 不要提前人工写死。

应该：

```text
Segment 实际音频时长
+
场景必要缓冲
=
Scene 基础时长
```

也就是说：

> **真实语音时长决定 Scene 的时间基础。**

---

# 十二、第十步：Subtitle System

## 目标

字幕不直接来自文章。

字幕应该来自：

```text
TTS Script
↓
edge-tts
↓
音频 + WordBoundary
↓
Subtitle Cue
```

## 字幕层级

```text
Scene
  ↓
Narration Segment
  ↓
Subtitle Cue
```

例如：

```text
03-02
├── 03-02-a
├── 03-02-b
└── 03-02-c
```

## 为什么这样设计

一眼可以知道：

- 属于哪个 Scene
- 属于哪段音频
- 当前是哪一个字幕块

---

# 十三、字幕时间来源

不要根据文字长度猜时间。

优先使用 edge-tts 返回的真实边界信息。

流程：

```text
edge-tts
↓
WordBoundary
↓
结合语义切分
↓
字幕时间
```

## 字幕时间建议

字幕 Cue 主要控制在：

```text
约 1.2 ～ 4 秒
```

避免大量：

```text
0.4 秒
0.6 秒
0.8 秒
```

快速闪烁。

---

# 十四、中文字幕切分规则

字幕切分同时考虑：

```text
语义完整
+
阅读长度
+
真实语音停顿
```

推荐：

```text
单行约 10～16 个中文字符
最多两行
一个 Cue 约 15～26 个中文字符
```

但优先级是：

```text
语义完整
>
阅读舒适
>
字数限制
```

---

# 十五、Subtitle Manifest

建议首先生成：

`subtitle-manifest.json`

而不是直接只生成 SRT。

## 示例

```json
{
  "sceneId": "03",
  "segmentId": "03-02",
  "audioFile": "audio/scene-03/03-02.mp3",
  "cues": [
    {
      "id": "03-02-a",
      "text": "接下来，它可以自己去查看相关文件，",
      "start": 0.0,
      "end": 2.46
    },
    {
      "id": "03-02-b",
      "text": "搜索代码之间的调用关系，",
      "start": 2.46,
      "end": 4.38
    }
  ]
}
```

时间建议保存为：

> **相对于当前 Segment 的时间。**

后续 Remotion 再结合 Scene 和 Segment Offset 计算绝对时间。

---

# 十六、字幕与视觉重点文字必须分开

字幕负责：

> 观众听到什么。

Visual Script 中的重点文字负责：

> 这一幕希望观众记住什么。

例如：

```text
字幕：
人开始从管理每一步操作，转向管理最终目标。

视觉重点：
管理步骤
↓
管理目标
```

两套文字不要合并。

---

# 十七、字幕样式建议

字幕保持克制。

建议：

```text
位置：底部居中
最大宽度：画面 70%～75%
最多两行
半透明深色背景
浅色高对比文字
轻微圆角
淡入 / 淡出
```

避免：

- 卡拉 OK 式逐字跳色
- 大幅缩放
- 每个字弹跳
- 复杂描边
- 过强装饰

---

# 十八、音频与字幕输出目录

建议：

```text
video-assets/
├── tts-script.json
│
├── audio/
│   ├── scene-01/
│   ├── scene-02/
│   └── ...
│
├── audio-manifest.json
│
├── subtitles/
│   ├── scene-01.json
│   ├── scene-02.json
│   └── ...
│
└── subtitle-manifest.json
```

可选再导出：

```text
captions.srt
captions.vtt
```

---

# 十九、第十一步：Remotion Implementation

到了这里，Remotion 才正式进入生产。

此时输入已经非常完整：

```text
Scene Script
Visual Script
Visual Prototype
TTS Script
Audio
Audio Manifest
Subtitle Manifest
```

Remotion 不再负责：

> 视频应该怎么设计。

只负责：

> **把已经设计好的 Scene 准确实现。**

---

# 二十、Remotion 组件层建议

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

<Subtitle />
<SceneTransition />
```

---

# 二十一、Remotion 的正确实现顺序

不要一次生成整条视频。

建议：

```text
搭基础框架
↓
建立公共组件
↓
Scene 01
↓
验证
↓
Scene 02
↓
验证
↓
……
↓
Scene 14
↓
整体串联
```

> **逐 Scene 实现，而不是一次性生成整条视频。**

---

# 二十二、动画层级

## 一级：信息动画

必须有。

例如：

- 节点出现
- 流程连接
- 文件修改
- 测试运行
- 文件扫描
- 状态变化

## 二级：注意力动画

少量使用。

例如：

- 高亮
- 放大
- 聚焦
- 淡化背景

## 三级：装饰动画

尽量少。

例如：

- 粒子
- 无意义漂浮
- 无意义旋转
- 过多弹跳
- 炫技式转场

如果不能帮助理解，就不要使用。

---

# 二十三、视频是否 PPT 化的检查标准

## 检查 1

关闭声音，只看画面。

> 能不能大概理解这一幕发生了什么？

## 检查 2

检查画面文字。

> 是否只是把口播重新显示了一遍？

## 检查 3

检查动画。

> 动画是否真的表达新信息？

理想状态：

```text
声音：解释意义
+
画面：展示过程
+
字幕：保证语音可读
=
完整视频表达
```

---

# 二十四、最终生产架构

```text
原始文章
   ↓
Content Analysis
   ↓
Video Narrative
   ↓
Scene Script
   ↓
┌───────────────────────────────┐
│                               │
↓                               ↓
Narration Script            Visual Script
↓                               ↓
TTS Script                HTML Prototype
↓                               │
edge-tts                        │
↓                               │
Audio                           │
↓                               │
Audio Manifest                  │
↓                               │
Subtitle System                 │
↓                               │
Subtitle Manifest               │
│                               │
└───────────────┬───────────────┘
                ↓
             Remotion
                ↓
         Scene + Audio + Subtitle
                ↓
          Quality Review
                ↓
            Final Video
```

---

# 二十五、所有阶段生成的文档与文件

## 原始文章

`01-what-is-claude-code(1).md`

## 工作流总结

`article-to-video-workflow.md`

## Step 1

`claude-code-video-content-analysis.md`

## Step 2

`claude-code-video-narrative.md`

## Step 3

`claude-code-video-scene-script.md`

## Step 4

`claude-code-video-narration-script.md`

## Step 5

`claude-code-video-visual-script.md`

## 第一版视觉原型

`claude-code-video-visual-prototype.html`

## 完整视觉原型

`claude-code-video-visual-prototype-full.html`

## 后续结构化生产文件

`tts-script.json`

`audio-manifest.json`

`subtitle-manifest.json`

---

# 二十六、最终核心原则

### 1

> **文档和视频共享知识，不共享表达结构。**

### 2

> **先设计视频，再写口播，而不是先写口播再给它配图。**

### 3

> **声音负责解释，视觉负责演示、证明和建立直觉。**

### 4

> **音频决定真实时间轴，视觉围绕真实时间组织。**

### 5

> **字幕来自最终语音，而不是来自原文章节。**

### 6

> **Remotion 是执行层，不是内容设计层。**

---

# 二十七、最终目标

最终希望形成的不是：

> AI 自动把 Markdown 转成视频。

而是一套：

> **AI 辅助的视频内容再创作系统。**

输入：

```text
一篇高质量文章
```

输出：

```text
一条信息密度接近、
但充分发挥视频媒介优势的独立视频作品
```

这才是整套流程真正要解决的问题。
