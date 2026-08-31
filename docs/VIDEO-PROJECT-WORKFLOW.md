# Video 项目生产流程说明

> 本文档用于说明 `video` 项目的职责、每条视频的标准生产流程，以及它与独立 `tts` 项目的边界。

---

# 1. Video 项目的定位

`video` 项目不只是一个 Remotion 项目。

它应该承担完整的视频内容生产流程：

```
① 先生成 Content Analysis
→ 你确认

② 再生成 Video Narrative
→ 你确认

③ 再生成 Scene Script
→ 你确认

④ 再生成 Narration Script
→ 你确认

⑤ 再生成 Visual Script
→ 你确认

⑥ 再生成 Visual Prototype
→ 你确认

⑦ 最后进入 Remotion
```



> **从原始文章开始，完成视频内容设计、视觉设计，并最终由 Remotion 实现视频。**

也就是说，`video` 项目负责：

```text
原始文章
↓
内容分析
↓
视频叙事
↓
场景脚本
↓
口播稿
↓
视觉脚本
↓
视觉原型
↓
Remotion 实现
↓
最终视频
```

---

# 2. 每条视频的标准流程

以后制作一条新视频时，建议固定按以下顺序进行。

## Step 1：准备原始内容

把原始文章放入当前视频自己的目录中。

例如：

```text
videos/
└── claude-code-what-is/
    └── source.md
```

---

## Step 2：生成 Content Analysis

让 Claude Code 分析原文，输出：

```text
content-analysis.md
```

这一阶段主要解决：

> 这篇内容真正要表达什么？

需要提取：

- 核心命题
- 必须保留的信息
- 因果关系
- 对比关系
- 流程关系
- 案例
- 可视觉化内容
- 可以弱化或删除的信息

完成后先人工确认。

---

## Step 3：生成 Video Narrative

基于 Content Analysis 生成：

```text
video-narrative.md
```

这一阶段解决：

> 这条视频应该按什么顺序讲？

不要机械沿用文章章节。

应该按照观众的认知过程重新组织叙事。

完成后先人工确认。

---

## Step 4：生成 Scene Script

基于 Video Narrative 生成：

```text
scene-script.md
```

这一阶段把整条视频拆成一个个 Scene。

每个 Scene 至少明确：

- Scene ID
- Scene 名称
- 目的
- 叙事作用
- 口播方向
- 视觉方向
- Scene Type
- 屏幕重点
- Video Value

完成后先人工确认。

---

## Step 5：生成 Narration Script

基于 Scene Script 生成：

```text
narration-script.md
```

口播不直接从原文改写。

它应该服务于已经确定的视频叙事和 Scene。

口播主要负责：

- 解释
- 推进
- 因果
- 转折
- 结论

完成后先人工确认。

---

## Step 6：生成 Visual Script

基于 Scene Script 和 Narration Script 生成：

```text
visual-script.md
```

Visual Script 主要定义：

- 每个 Scene 的画面结构
- 视觉动作
- 状态变化
- 动画顺序
- 视觉重点
- 视觉类型
- 画面与口播如何互补

核心原则：

> 声音负责解释，视觉负责演示和证明。

完成后先人工确认。

---

## Step 7：制作 Visual Prototype

正式进入 Remotion 前，先制作：

```text
visual-prototype.html
```

当前推荐使用：

```text
HTML + CSS + 少量 JS
```

主要用于验证：

- 整体视觉方向
- 信息密度
- Scene 结构
- UI 风格
- 是否 PPT 化
- Scene 之间是否统一

确认视觉方向后，再进入 Remotion。

Gate 2 通过时由 Harness 冻结 Visual Script、Visual Prototype 指纹和 Scene 清单。Remotion 实现必须同时提交 `remotion-alignment.json`，逐 Scene 说明原型中的布局、视觉事件和屏幕文字由哪些组件或配置实现；Gate 3 在 Web UI 中结合原型预览、对齐清单和 Remotion Studio 做人工对照。

---

# 3. 不要一次生成全部文档

不要给 Claude Code 一条指令：

> “根据这篇文章，把所有视频文档和视频全部做出来。”

推荐：

```text
Content Analysis
↓
人工确认
↓
Video Narrative
↓
人工确认
↓
Scene Script
↓
人工确认
↓
Narration Script
↓
人工确认
↓
Visual Script
↓
人工确认
↓
Visual Prototype
↓
人工确认
↓
Remotion
```

这样可以避免前面一个判断错误，一直传递到后面的所有阶段。

---

# 4. 每条视频拥有独立的生产资料

这些文件都不是公共规则，而是某一条视频自己的生产结果。

例如：

```text
videos/
├── claude-code-what-is/
│   ├── source.md
│   ├── content-analysis.md
│   ├── video-narrative.md
│   ├── scene-script.md
│   ├── narration-script.md
│   ├── visual-script.md
│   └── visual-prototype.html
│
└── claude-code-install/
    ├── source.md
    ├── content-analysis.md
    ├── video-narrative.md
    ├── scene-script.md
    ├── narration-script.md
    ├── visual-script.md
    └── visual-prototype.html
```

以后每增加一条视频，就增加一个独立目录。

---

# 5. 公共规则与单条视频资料分开

公共规则：

```text
VIDEO-PRODUCTION-RULES.md
```

它负责告诉 Claude Code：

> 所有视频制作时长期都要遵守什么原则。

例如：

- 不把文章直接做成 PPT
- 不按文章章节机械拆 Scene
- Scene 是基本叙事单位
- 声音与视觉互补
- 动画必须传递信息
- 先做 Visual Prototype
- Remotion 逐 Scene 实现

---

单条视频资料负责：

> 这一条视频具体怎么做。

例如：

```text
content-analysis.md
video-narrative.md
scene-script.md
narration-script.md
visual-script.md
visual-prototype.html
```

两者不要混在一起。

---

# 6. TTS 项目的职责

`tts` 项目独立存在。

它不负责视频内容设计，也不负责 Remotion。

它主要负责：

```text
Narration Script
↓
TTS 处理
↓
音频
↓
字幕
↓
时间数据
```

最终把标准化结果交给 `video` 项目使用。

---

# 7. Video 与 TTS 的关系

整体关系：

```text
                         ┌──────────────┐
                         │    video     │
                         └──────┬───────┘
                                │
                          原始文章
                                ↓
                       Content Analysis
                                ↓
                       Video Narrative
                                ↓
                         Scene Script
                                ↓
                   ┌────────────┴────────────┐
                   ↓                         ↓
           Narration Script            Visual Script
                   │                         ↓
                   │                 Visual Prototype
                   │
                   ↓
              ┌─────────┐
              │   tts   │
              └────┬────┘
                   ↓
             Audio / Subtitle
                   │
                   └──────────────┐
                                  ↓
                               Remotion
                                  ↓
                              Final Video
```

---

# 8. Remotion 的进入时机

Remotion 不应该一开始就介入。

应该等这些内容基本确定之后：

```text
Scene Script
Visual Script
Visual Prototype
```

再开始真正实现。

音频和字幕准备好之后，再用于最终时间同步。

进入 Remotion 前必须确认 Gate 2 冻结基线存在。若 Visual Script 或 Visual Prototype 在冻结后发生变化，应先回到对应阶段重新确认，不允许继续沿用旧实现。

---

# 9. Remotion 的实现方式

进入 Remotion 后仍然不要一次实现整条视频。

推荐：

```text
搭基础框架
↓
建立公共组件
↓
Scene 01
↓
预览确认
↓
Scene 02
↓
预览确认
↓
……
↓
全部 Scene
↓
整体串联
↓
音频 / 字幕同步
↓
最终检查
```

---

# 10. 推荐的项目结构

可以逐步整理成：

```text
video/
├── docs/
│   ├── VIDEO-PRODUCTION-RULES.md
│   └── article-to-video-complete-workflow-summary.md
│
├── videos/
│   ├── claude-code-what-is/
│   │   ├── source.md
│   │   ├── content-analysis.md
│   │   ├── video-narrative.md
│   │   ├── scene-script.md
│   │   ├── narration-script.md
│   │   ├── visual-script.md
│   │   └── visual-prototype.html
│   │
│   └── ...
│
├── public/
│   └── assets/
│
├── src/
│   ├── components/
│   ├── scenes/
│   ├── compositions/
│   └── Root.tsx
│
└── ...
```

---

# 11. 最终职责划分

## video 项目负责

```text
原文理解
↓
内容分析
↓
视频叙事
↓
Scene 设计
↓
口播设计
↓
视觉设计
↓
视觉原型
↓
Remotion
↓
最终视频
```

## tts 项目负责

```text
口播文本
↓
音频
↓
字幕
↓
时间数据
```

---

# 12. 最终原则

以后制作任何新视频，都按照下面的思路：

> **原文进入 video 项目，由 Claude Code 按固定流程一步步生成视频生产资料；每一步人工确认后再进入下一步；TTS 作为独立模块处理音频和字幕；最后由 Remotion 完成视频实现。**

这样 `video` 项目就不只是一个代码工程，而是一套可以长期复用的视频生产系统。
