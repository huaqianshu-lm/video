# VIDEO-PRODUCTION-RULES.md

> 适用于所有基于文章 / 文档进行再创作的视频项目。  
> 本文件只定义视频项目内部长期稳定的公共规则，不包含 TTS、字幕生成等外部项目的具体实现方法。

---

# 1. 核心目标

视频不是文章的 PPT 版，也不是文章的朗读版。

正确目标是：

> **文档和视频共享同一套知识，但拥有独立的表达结构。**

要求：

- 看完文档，不需要再看视频
- 看完视频，也不需要再看文档
- 两者信息密度接近
- 视频必须发挥时间、动画、演示、对比、流程和状态变化的优势

禁止：

```text
文章
↓
改成口语
↓
配几张图
↓
视频
```

应该采用：

```text
Source
↓
Content Analysis
↓
Video Narrative
↓
Scene Script
↓
Narration Script + Visual Script
↓
Visual Prototype
↓
Remotion
↓
Review
```

---

# 2. 内容设计原则

## 2.1 先提取知识，再设计视频

不要按文章章节直接生成 Scene。

必须先完成：

```text
原始文章
↓
核心命题
↓
知识骨架
↓
认知关系
```

需要识别：

- 核心命题
- 必须保留的信息
- 因果关系
- 对比关系
- 流程关系
- 案例
- 可视觉化内容
- 可删除的辅助内容

---

## 2.2 Video Narrative 独立于文章结构

视频叙事应该按照观众的认知过程重新组织。

优先：

```text
问题
↓
对比
↓
发现差异
↓
解释原因
↓
建立概念
↓
制造转折
↓
形成结论
```

避免机械使用：

```text
定义
↓
功能列表
↓
特点
↓
总结
```

除非内容本身确实最适合这种结构。

---

# 3. Scene 规则

Scene 是视频的基本叙事单位。

每个 Scene 必须只承担一个主要认知任务。

每个 Scene 至少需要明确：

```text
sceneId
title
purpose
narrativeRole
narrationIntent
visualIntent
visualType
keyOnScreenText
videoValue
```

其中：

- `purpose`：这一幕为什么存在
- `narrativeRole`：它在整条视频里的作用
- `narrationIntent`：声音需要解释什么
- `visualIntent`：画面需要证明 / 演示什么
- `visualType`：使用哪种视觉表达
- `keyOnScreenText`：真正需要强调的屏幕文字
- `videoValue`：为什么这一幕必须用视频表达

如果一个 Scene 没有明确的 `videoValue`，应该重新设计。

---

# 4. 声音与视觉分工

核心原则：

> **声音负责解释，视觉负责演示、证明和建立直觉。**

理想状态：

```text
声音：解释意义
+
画面：展示过程
=
完整理解
```

错误方式：

```text
旁白：
Claude Code 可以修改文件。

画面：
Claude Code 可以修改文件。
```

正确方式：

```text
旁白：
Claude Code 可以直接参与项目修改。

画面：
auth.ts      Modified
user.ts      Modified
tests.ts     Created
```

---

# 5. Narration Script 规则

Narration Script 不直接从原文生成。

必须基于：

```text
Scene Script
```

生成。

口播主要承担：

- 解释
- 推进
- 因果
- 转折
- 结论
- 建立认知

口播不需要重复视觉已经明确表达的信息。

Narration Script 是视频内容设计的一部分，但音频生成方式不属于本文件管理范围。

---

# 6. Visual Script 规则

Visual Script 不是“配图说明”。

它必须描述：

- 画面结构
- 视觉动作
- 状态变化
- 动画顺序
- 信息重点
- 场景类型
- 视觉与口播的互补关系

---

# 7. 优先使用的视觉类型

优先选择：

## Demo

用于：

- Terminal
- IDE
- 工具执行
- 测试
- 代码修改

## Process

用于：

- 工作流
- 操作步骤
- 状态变化

## Comparison

用于：

- 旧方式 vs 新方式
- 工具对比
- 不同路径

## Concept Diagram

用于：

- 抽象概念
- 系统结构
- 角色关系

## UI Simulation

用于：

- IDE
- Terminal
- Chat
- 浏览器
- 软件界面

## Code Exploration

用于：

- 文件树
- 调用链
- 架构理解

## Task Execution

用于：

- 修改
- 测试
- Git
- Todo → Done

## Connection Diagram

用于：

- 外部工具
- 数据源
- 系统关系

## Decision Diagram

用于：

- AI 分析
- 人类决策
- 方案比较

## Task Routing

用于：

- 不同工具之间的任务分工

---

# 8. 避免 PPT 化

尽量避免：

- 大段文字
- 多层列表
- 三四张卡片同时出现
- 大量静态页面
- 口播全文上屏
- 每个 Scene 都是“标题 + 卡片”
- 只换内容、不换视觉机制

优先：

```text
变化
移动
连接
扫描
执行
比较
展开
替换
状态变化
```

---

# 9. 动画规则

动画必须传递信息。

动画分三层：

## 一级：信息动画

必须优先。

例如：

- 节点出现
- 文件被扫描
- 代码被修改
- 测试运行
- 流程连接
- 状态改变

## 二级：注意力动画

少量使用。

例如：

- 高亮
- 放大
- 聚焦
- 淡化其他元素

## 三级：装饰动画

尽量少用。

例如：

- 粒子
- 无意义漂浮
- 无意义旋转
- 过多弹跳
- 炫技式转场

如果删除动画后信息完全不受影响，说明它可能只是装饰。

---

# 10. Visual Prototype 规则

正式进入 Remotion 前，推荐先制作 Visual Prototype。

当前推荐方式：

```text
HTML + CSS + 少量 JS
```

Prototype 用于验证：

- 视觉方向
- 信息密度
- 场景结构
- 视觉语言
- 是否 PPT 化
- Scene 之间是否统一

Prototype 不是最终实现。

Gate 2 通过时必须冻结 Visual Script 与 Visual Prototype 的内容指纹和 Scene 清单。冻结结果是 Remotion 的实现基线；原型或视觉脚本随后发生变化时，旧的 Remotion 对齐记录必须失效并重新制作。

---

# 11. Remotion 的职责

Remotion 是：

> **实现层**

不是：

> 内容设计层。

Remotion 不应该重新决定：

- 视频讲什么
- Scene 怎么拆
- 视觉应该怎么表达
- 哪个知识点重要

这些必须在前面确定。

Remotion 主要依据：

```text
Scene Script
+
Visual Script
+
Visual Prototype
+
外部提供的音频 / 字幕数据
```

对于有明确口播的视频，Remotion 制作必须先读取已校验的 Audio Manifest、Subtitle Manifest 和 Timeline Manifest，并以 `timeline-manifest.json` 作为唯一时间基准。Scene 时长、音频起点、字幕位置和视觉事件时间必须从同一套 Scene／Segment／Cue 映射产生；TypeScript 配置统一复用 `src/lib/timing.ts` 的 `createNarratedTiming`，`remotion-alignment.json` 的每个 Scene 必须记录这些来源、起止秒／帧和动画事件绑定；不得在单条视频目录内重新实现时间映射，也不得先按估算时长或任意硬编码时间完成画面，再事后适配音频。缺少映射时必须停止制作并报告原因。

每条新视频进入 Remotion 后必须生成 `videos/<video-slug>/remotion-alignment.json`，逐 Scene 记录：

- 对应的原型指纹
- 关键布局关系
- 视觉事件
- 屏幕文字
- Remotion 实现文件

Harness 负责检查指纹是否仍然有效、Scene 是否完整覆盖、实现文件是否存在；Gate 3 负责人工判断画面是否真正兑现原型，不使用像素相似度代替视觉判断。

---

# 12. Remotion 实现规则

不要一次实现整条视频。

正确顺序：

```text
搭基础框架
↓
建立公共组件
↓
Scene 01
↓
预览 / 验证
↓
Scene 02
↓
预览 / 验证
↓
……
↓
Scene N
↓
整体串联
```

> **逐 Scene 实现。**

---

# 13. 公共组件优先

重复视觉语言必须组件化。

例如：

```text
<IDEWindow />
<TerminalWindow />
<ChatWindow />

<FileTree />
<CodeDiff />
<TestResult />

<FlowNode />
<FlowArrow />

<TaskCard />
<ToolCard />
<DecisionCard />

<Keyword />
<SectionTitle />

<Subtitle />
<SceneTransition />
```

不要每个 Scene 单独重新实现同类 UI。

---

# 14. 与 TTS / 字幕项目的边界

TTS 与字幕由独立项目负责生成。

Video 项目不负责：

- 选择或调用 TTS 引擎
- 音频生成
- 字幕切分
- 字幕时间计算
- SRT / VTT 生成
- WordBoundary 等内部处理

Video 项目只消费外部提供的结果。

建议接口包括：

```text
audio files
audio-manifest.json
subtitle-manifest.json
```

Video 项目只需要知道：

- 音频对应哪个 Scene / Segment
- 音频实际时长
- 字幕何时显示
- 字幕文本是什么

外部生成流程如何实现，不属于本规则文件。

---

# 15. 接口一致性规则

如果视频生产链使用 Scene ID / Segment ID，则外部音频、字幕数据必须保持一致。

例如：

```text
Scene 03
Segment 03-02
```

Video 项目读取到：

```text
audioFile
duration
subtitle cues
```

即可。

不要在 Remotion 内重新建立一套不一致的编号体系。

---

# 16. Quality Review

每个 Scene 完成后至少做以下检查。

## Silent Test

关闭声音。

问：

> 只看画面，能不能大概理解这一幕发生了什么？

如果完全不能，画面可能只是装饰。

## Duplication Test

问：

> 画面是不是只把口播重新显示了一遍？

如果是，需要重新设计视觉。

## Motion Value Test

问：

> 动画是否真正表达了信息？

如果删除动画没有任何影响，可能只是装饰。

## Video Value Test

问：

> 这一幕为什么必须用视频来表达？

如果没有答案，需要重新设计。

---

# 17. 公共规则与单条视频必须分离

本文件只能保存：

> 所有视频都长期适用的规则。

禁止写入：

- 某个具体 Scene 的设计
- 某条视频的配色临时决定
- 某个案例的画面方案
- 某个主题的口播内容

单条视频自己的内容应该放在独立目录中，例如：

```text
content-analysis.md
video-narrative.md
scene-script.md
narration-script.md
visual-script.md
visual-prototype.html
```

---

# 18. 最终原则

整个系统必须始终遵守以下几条：

1. **文档和视频共享知识，不共享表达结构。**
2. **先设计视频，再写口播。**
3. **Scene 是基本叙事单位。**
4. **声音负责解释，视觉负责演示和证明。**
5. **动画必须表达信息。**
6. **Visual Prototype 用于在 Remotion 前验证视觉方向。**
7. **Remotion 负责实现，不负责重新设计内容。**
8. **逐 Scene 实现，不一次生成整条视频。**
9. **公共规则和单条视频设计必须分离。**
10. **TTS / 字幕属于外部生产模块，Video 项目只消费标准化结果。**
