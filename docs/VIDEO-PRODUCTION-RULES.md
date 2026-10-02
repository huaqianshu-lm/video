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

# 8. 避免 PPT 化与视觉收敛

这是一条适用于所有 Workflow 的公共质量基线，但不是简单禁止标题、卡片、代码界面或静态画面。判断标准是：画面是否通过动作、证据、关系或状态变化提供了视频特有的价值。

## 8.1 所有 Workflow 的公共基线

尽量避免：

- 大段文字承担主要信息
- 多层列表或多张卡片承担整幕叙事
- 大量静态页面连续出现
- 口播全文上屏
- 每个 Scene 都是同一套“标题 + 卡片 + 转场”模板
- 只替换文案，不改变视觉机制
- 场景之间仅靠翻页、淡入淡出或版式切换连接

优先使用：

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
持续对象
视觉证据
```

一个短暂的静态停留可以用于阅读或强调，但不能成为整条视频默认的组织方式。如果任意代表帧都可以脱离上下文被当作 PPT 页面，必须判定视觉收敛失败。

## 8.2 `product-promo-v1` 的更严格约束

- `PROMO-1 [MUST]`：开头应先出现产品、作品、操作或视觉证据，不能先用“编号 + 阶段名 + 大标题”充当独立章节页。
- `PROMO-2 [MUST]`：不得把功能列表、方法列表、三列卡片或独立 CTA 卡作为主要叙事骨架。
- `PROMO-3 [MUST]`：画面应围绕持续存在的对象、空间或信号推进，通过生成、扫描、移动、变形、合并或拉远形成连续关系。
- `PROMO-4 [MUST]`：文字只能作为少量语境、品牌、状态或 CTA 注释，不能替代作品展示和动作本身。

## 8.3 `narrated-tutorial-v1` 的适用方式

- `TUTORIAL-1 [MUST]`：可以使用标题、代码、终端、UI、流程图、对比卡或解释面板，但它们必须推进口播中的认知过程或提供可核验的视觉证据。
- `TUTORIAL-2 [MUST]`：允许短暂的教学标题或总结卡，但不能让每个 Scene 都退化为同一套标题页模板。
- `TUTORIAL-3 [MUST]`：代码、界面和流程图应通过执行、修改、扫描、连线、高亮、状态改变或结果出现来表达信息；静态界面不能只是口播的背景图。
- `TUTORIAL-4 [MUST]`：视觉可以解释口播没有直接说出的过程、状态和关系，不得只是把口播重新排版上屏。

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

## 10.1 Gate 2 前视觉收敛自检

所有 Workflow 在请求 Gate 2 前都必须完成以下自检。自检必须基于实际 Prototype／预览画面或代表帧，不能只看 Markdown、源代码、文件是否存在或 Harness 结构校验结果；自检不替代用户的人工 Gate 2。

| ID | 级别 | 验收标准 | 失败处理 |
|---|---|---|---|
| VC-1 | [MUST] | 每个 Scene 都有可观察的视觉信息、过程、证据、关系或状态变化；不是只有文字和装饰。 | 回到 Visual Script，补齐视觉任务和动作。 |
| VC-2 | [MUST] | 整条序列不依赖重复的“标题 + 卡片 + 转场”页面结构；按 8.2 和 8.3 执行 Workflow 差异。 | 判定为 PPT 化，重做视觉机制。 |
| VC-3 | [MUST] | Scene 之间存在可理解的连续关系、对象延续或状态变化；不能只靠换页连接。 | 重做转场和跨 Scene 视觉叙事。 |
| VC-4 | [MUST] | 文字层级不压过视觉证据；所有可见文字都能追溯到当前视频资料。 | 删除、降级或改写无依据的文字，并重新检查画面重心。 |
| VC-5 | [MUST] | 已查看开头、中段、结尾及各类关键 Scene 的实际代表帧或短预览，并逐项记录通过／失败证据。 | 未完成实际画面检查时，不得声称视觉已验证。 |
| VC-6 | [MUST] | 任一 MUST 失败时，不能进入 Remotion 或下一生产阶段，必须回到 Visual Script。 | 保持当前阶段为阻塞或重新生成后续视觉资料。 |

最少的自检记录应包含：使用的 Visual Script／Prototype 版本、代表帧或预览范围、VC-1～VC-6 的结果、发现的问题和对应修正。没有实际画面证据时，只能报告“结构已校验，视觉未验证”。

## 10.2 Gate 2 机器校验契约

视觉自检必须落为当前视频资料目录下的 `visual-self-review.json`。现有 narrated 视频使用 `videos/<slug>/visual-self-review.json`，`product-promo-v1` 使用 `videos/product-promo/<slug>/visual-self-review.json`；该文件属于本地视频资料，不进入通用能力代码。

最小结构如下：

```json
{
  "schemaVersion": 1,
  "videoSlug": "example",
  "workflow": "product-promo-v1",
  "visualScriptFingerprint": "...",
  "prototypeFingerprint": "...",
  "reviewedAt": "2026-09-19T12:00:00+08:00",
  "evidence": [
    {
      "id": "opening",
      "kind": "frame-sheet",
      "path": "visual-review/opening.png"
    }
  ],
  "checks": [
    {
      "id": "VC-1",
      "status": "passed",
      "evidenceIds": ["opening"],
      "note": "存在可观察的作品生成动作。"
    }
  ],
  "workflowChecks": [
    {
      "id": "PROMO-1",
      "status": "passed",
      "evidenceIds": ["opening"],
      "note": "开头先出现作品证据。"
    }
  ]
}
```

Gate 2 的自动前置校验必须检查：

- JSON 存在、格式正确、`schemaVersion` 受支持，`videoSlug` 和 `workflow` 与 Harness Registry／项目配置一致。
- `visualScriptFingerprint` 和 `prototypeFingerprint` 与当前资料一致；Visual Script 或 Prototype 改动后，旧自检自动失效。
- `VC-1`～`VC-6` 全部出现且为 `passed`；对应 Workflow 的 `PROMO-1`～`PROMO-4` 或 `TUTORIAL-1`～`TUTORIAL-4` 也必须全部出现且通过。
- 每个 `evidenceIds` 都能找到记录，证据路径是安全的项目内相对路径且文件真实存在；不能用空文件、占位字符串或旧版本证据绕过。
- 任一必检项缺失、失败、指纹过期或证据无效时，Gate 2 不能进入可人工审批的就绪状态，也不能推进 TTS、Asset Preparation、Visual Timeline 或 Remotion。

该机器校验只负责验证“自检记录完整、针对当前版本且没有失败项”，不能自动判断视频是否好看，也不能替代用户人工通过 Gate 2。Harness 尚未接入这份契约前，只能标记为“规则已定义、机器校验待实现”，不得报告为已完成的自动阻断能力。

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

## Visual Convergence Test

在进入 Gate 2 前，先执行 10.1 的 VC-1～VC-6；在 Gate 3 前，再对照冻结的 Visual Prototype 和 Remotion 输出复查。结构校验、类型检查、文件存在和指纹一致只能证明生产资料可消费，不能证明视频好看或已经摆脱 PPT 化。

如果开头、中段或结尾的代表帧仍然像独立幻灯片，或者连续播放时只是不断替换标题和卡片，即使所有自动校验通过，也必须判定失败并回到 Visual Script。

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

本章的视觉收敛基线适用于所有新建或尚未完成的视频；已标记为 `completed` 的视频仍按项目永久只读规则保护，不因本规则回写旧资料。教程和宣传片可以有不同的视觉例外，但不能绕过实际画面自检。

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
