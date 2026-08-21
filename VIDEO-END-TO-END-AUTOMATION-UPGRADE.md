# Video 端到端自动生产流程升级方案

> 目的：把现有视频制作流程进一步打通，让程序自动完成所有可客观判断、可程序化执行的工作；人只负责关键创作判断和最终确认。
>
> 本方案基于现有 `END-TO-END-VIDEO-PRODUCTION-PLAN.md` 调整，不推翻原有 Video → TTS → Remotion → GitHub Actions 主链路，只补足自动化所需的状态管理、结构化数据、校验、人工闸门和失效传播机制。

---

# 1. 最终目标

输入一份源文档后，Video 项目自动推进整条视频生产流程：

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
TTS
↓
Audio / Subtitle / Timeline
↓
Remotion
↓
Preview
↓
GitHub Render
↓
Final MP4
```

核心原则：

> **程序负责执行和客观校验，人负责主观判断和最终确认。**

程序应该知道：

- 当前做到哪一步
- 上一步是否完成
- 输出是否有效
- 下一步应该执行什么
- 是否需要人工确认
- 某一步修改后，哪些后续产物失效

---

# 2. 第一版成功标准

第一版只打通一条 `narrated` 视频。

成功标准：

1. 输入 `source.md` 后，程序能自动运行到第一个人工确认点。
2. 人确认内容方案后，程序继续生成 Narration / Visual / Prototype。
3. 人确认创作方案后，程序自动进入 TTS。
4. TTS 自动返回音频、字幕、时间数据和 Manifest。
5. Video 自动完成资源一致性检查并生成 Remotion 时间线。
6. Remotion 自动完成构建、类型检查和预览准备。
7. 人确认最终预览后，自动进入 GitHub Smoke Render。
8. Smoke 通过后自动进入 Full Render。
9. 最终 Artifact 自动下载并验证。
10. 人只需要完成关键 Gate 的确认。

---

# 3. 推荐后的完整流程

```text
源文档
↓
创建 videoSlug + Production State
↓
Content Analysis
↓
Video Narrative
↓
Scene Script
↓
自动一致性检查
↓
【人工 Gate 1：内容方案】
↓
         ┌─────────────────┐
         ↓                 ↓
Narration Script      Visual Script
         └────────┬────────┘
                  ↓
            自动互补检查
                  ↓
           Visual Prototype
                  ↓
【人工 Gate 2：创作方案】
                  ↓
            冻结 Narration
                  ↓
           生成 TTS Script
                  ↓
              TTS 项目
                  ↓
 Audio + Subtitle + Manifest
                  ↓
            自动 TTS 质检
          ┌───────┴───────┐
        通过              失败
         ↓                 ↓
      自动继续         停止并报告异常
         ↓
      Remotion Timeline
         ↓
      Remotion Scene 实现
         ↓
   类型 / 资源 / 布局自动检查
         ↓
       本地完整预览
         ↓
【人工 Gate 3：视频预览】
         ↓
    GitHub Smoke Render
         ↓
       自动验证
         ↓
    GitHub Full Render
         ↓
 Artifact + ffprobe 自动验证
         ↓
【人工 Gate 4：最终成片】
```

---

# 4. 人工确认点压缩为 4 个

## Gate 1：内容方案

一次确认：

```text
Content Analysis
+
Video Narrative
+
Scene Script
```

人工确认：

- 核心命题是否正确
- 信息有没有遗漏或误解
- 叙事路径是否合理
- Scene 拆分是否合适
- 每个 Scene 是否有明确 Video Value

## Gate 2：创作方案

一次确认：

```text
Narration Script
+
Visual Script
+
Visual Prototype
```

人工确认：

- 口播是否自然
- 信息是否准确
- 视觉是否真的服务理解
- 声音和画面是否互补
- 是否存在 PPT 化
- 整体视觉方向是否满意

确认后 Narration Script 冻结并进入 TTS。

## Gate 3：完整视频预览

人工确认：

- 音画同步
- 字幕
- 节奏
- 动画
- 信息密度
- 视觉溢出
- 是否达到发布标准

## Gate 4：最终成片

人工确认最终 MP4。

---

# 5. Narration Script 与 Visual Script 并行

不要采用：

```text
Scene Script
↓
Narration Script
↓
Visual Script
```

改为：

```text
Scene Script
      ↓
 ┌────┴────┐
 ↓         ↓
Narration  Visual Script
 ↓         ↓
 └────┬────┘
      ↓
一致性检查
```

原因：

> Visual Script 不能退化成“给已经写好的口播配图”。

自动检查：

- 每个 Scene 是否都有 Narration
- 每个 Scene 是否都有 Visual
- Scene ID 是否一致
- 是否存在画面纯复述口播的问题

---

# 6. 必须增加 Production State

新增：

```text
videos/<video-slug>/production-state.json
```

建议结构：

```json
{
  "videoSlug": "claude-code-what-is",
  "buildId": "2026-08-14-001",
  "stage": "visual-prototype",
  "status": "waiting-approval",
  "approvedGates": ["content-plan"],
  "pendingAction": "approve-creative-plan",
  "lastError": null
}
```

至少记录：

```text
videoSlug
buildId
stage
status
approvedGates
pendingAction
lastError
inputs
outputs
```

目标：

> 即使 Claude Code 退出或终端关闭，流程仍能恢复。

---

# 7. 建立最小 Pipeline Controller

第一版不做复杂任务平台，只需要一个很薄的流程控制入口。

目标命令可以设计成：

```text
video pipeline start <slug>
video pipeline status <slug>
video pipeline approve <slug>
video pipeline resume <slug>
```

控制器负责：

```text
读取 production-state
↓
检查当前阶段输入
↓
执行阶段任务
↓
运行 Validator
↓
写入输出
↓
更新状态
↓
判断：
├─ 可自动继续 → 下一阶段
└─ 需要人工确认 → waiting-approval
```

---

# 8. 每个 Stage 应统一定义

每一个阶段都应该拥有：

```text
input
action
output
validator
nextStage
requiresApproval
```

例如：

```text
Content Analysis
requiresApproval: false

Video Narrative
requiresApproval: false

Scene Script
requiresApproval: true
```

于是 Source 开始以后：

```text
Content Analysis
↓ 自动
Video Narrative
↓ 自动
Scene Script
↓ 自动校验
Gate 1
```

---

# 9. Markdown 保留，但不能成为唯一机器接口

现有：

```text
content-analysis.md
video-narrative.md
scene-script.md
narration-script.md
visual-script.md
```

继续保留给人阅读。

同时增加机器可读结构，例如：

```text
scene-script.md
scene-script.json

narration-script.md
narration-script.json
```

或者统一生成：

```text
production-manifest.json
```

程序应能直接判断：

- Scene 数量
- Scene ID
- Segment 数量
- Visual Type
- Narration 是否覆盖 Scene
- Visual Script 是否覆盖 Scene
- 重复 ID
- 缺失 ID

---

# 10. Video → TTS 的接口

现有 TTS Script 方案继续使用。

Video 项目负责从冻结后的 Narration Script 生成：

```text
tts-script.json
```

每个 Segment 至少包含：

```text
videoSlug
sceneId
segmentId
order
text
voice
rate
```

`segmentId` 必须贯穿：

```text
TTS Script
↓
Audio
↓
Subtitle
↓
Manifest
↓
Timeline
↓
Remotion
```

---

# 11. TTS 回传数据

继续采用：

```text
video-assets/
├── audio/<scene-id>/<segment-id>.mp3
├── boundaries/<scene-id>/<segment-id>.json
├── subtitles/captions.srt
├── subtitles/captions.vtt
├── audio-manifest.json
├── subtitle-manifest.json
├── timeline-manifest.json
└── generation-report.json
```

为了防止新旧产物混用，建议增加：

```text
generationId
manifestVersion
narrationHash
buildId
```

所有后续数据必须能够证明：

> 这一批声音和字幕来自哪一版 Narration。

---

# 12. TTS 自动质检

自动检查：

1. Scene 数量是否一致
2. Segment 数量是否一致
3. 每个文件是否存在
4. ID 是否重复
5. 是否缺 ID
6. 字幕是否落在 Segment 时间范围内
7. 是否存在负时间
8. 是否存在时间倒序
9. 最后一条字幕与音频总时长是否合理
10. Narration Hash 是否一致

客观检查通过：

> 自动继续。

失败：

> 停止 Pipeline，记录错误。

声音自然度、发音和听感仍属于人工判断。

---

# 13. 增加失效传播机制

如果：

```text
03-02 narration
```

发生修改，应该自动标记：

```text
03-02 audio              INVALID
03-02 subtitle           INVALID
Scene 03 timeline        INVALID
后续 global offset       RECALCULATE
Remotion preview         INVALID
final render             INVALID
```

但 Scene 01 / Scene 02 音频不应重生成。

目标：

> 修改哪里，只重做受影响的部分。

---

# 14. Remotion 的职责

Remotion 不负责重新设计内容。

它消费：

```text
Scene Script
Visual Script
Visual Prototype
Audio Manifest
Subtitle Manifest
Timeline Manifest
```

时间轴原则：

```text
真实 Audio Timeline
↓
Scene Timing
↓
Animation Timing
↓
Subtitle Timing
```

不要先锁死视频总时间再塞声音。

---

# 15. Remotion 自动检查

进入人工预览前，程序自动完成：

```text
TypeScript Check
资源存在性
Manifest 一致性
Scene 数量
Timeline 顺序
字幕范围
字体
布局安全检查
资源路径
Composition 注册
```

这些都不需要人工确认。

---

# 16. GitHub Actions 通用化

现有 GitHub Actions 仍绑定具体视频，需要把：

```text
Composition ID
video slug
asset path
固定 MP3 数量
```

改成可控输入：

```text
videoSlug
compositionId
buildId
assetPackage
manifest
renderMode
```

或者从 Manifest 自动读取。

---

# 17. GitHub Render 流程

Gate 3 通过以后：

```text
本地检查
↓
Smoke Render
↓
自动验证
↓
Full Render
↓
Artifact 下载
↓
ffprobe
↓
Gate 4
```

Smoke 失败：

> 不进入 Full Render。

---

# 18. 失败处理

```text
TypeScript / Build
→ 修复代码

Asset / Manifest
→ 修资源或数据

Font / Linux
→ 修渲染环境

GitHub 临时故障
→ 确认后重跑

外部服务无明确日志
→ 停止猜测，要求补充信息
```

连续两轮没有新的证据：

> 停止自动重试。

输出：

- 当前结论
- 当前阻塞
- 已尝试内容
- 需要人工补充什么

---

# 19. 关于 1.25 倍语速

1.25 倍继续作为当前默认目标值，但不要硬编码为所有视频、所有 Segment 的绝对规则。

建议：

```text
video default rate
+
segment override
```

优先使用 TTS 引擎原生语速。

如果后处理加速：

```text
newTime = oldTime / 1.25
```

必须同时重算：

- Word Boundary
- Subtitle
- Segment Duration
- Timeline

不能只修改 MP3。

---

# 20. 第一版暂时不做

第一版明确不做：

- Web 管理后台
- 数据库
- 任务队列
- 多视频并行生产
- 自动发布到平台
- 复杂任务编排系统
- 复杂失败重试平台
- 自动绕过人工 Gate
- visual-only 的正式实现

`visual-only` 只保留设计，不进入第一版。

---

# 21. 第一版实施顺序

## Step 1：Production State

新增：

```text
production-state.json
```

预期：

> 流程可以中断恢复。

## Step 2：机器可读数据

建立：

```text
scene-script.json
narration-script.json
production-manifest.json
```

预期：

> 程序不再依赖解析 Markdown 推断 Scene 和 Segment。

## Step 3：Stage 定义

建立：

```text
input
action
output
validator
nextStage
requiresApproval
```

预期：

> Source 可以自动运行到 Gate 1。

## Step 4：Narration / Visual 并行

基于 Scene Script 并行生成，并增加一致性检查。

预期：

> 声音与视觉拥有独立表达。

## Step 5：打通 Video → TTS

增加：

```text
generationId
buildId
narrationHash
manifestVersion
```

预期：

> 新旧声音、字幕不会混用。

## Step 6：实现依赖失效传播

预期：

> 修改一个 Segment，只重生成相关内容。

## Step 7：Remotion 消费 Timeline Manifest

预期：

> 真实音频驱动 Scene、字幕和动画。

## Step 8：GitHub Actions 通用化

预期：

> 换一个 `videoSlug` 仍然使用同一套渲染流程。

## Step 9：完整跑通第一条 narrated 视频

验证：

```text
Source
↓
Gate 1
↓
Gate 2
↓
TTS
↓
Remotion
↓
Gate 3
↓
Smoke
↓
Full Render
↓
Gate 4
```

---

# 22. 最重要的三个新增能力

这次升级真正要补的不是更多 Agent，而是：

## 1. Production State

让系统知道：

> **现在做到哪里。**

## 2. Machine-readable Manifest

让系统知道：

> **这些生产资料到底是什么。**

## 3. Validator + Gate + Invalidation

让系统知道：

> **什么时候自动继续、什么时候停下来等人、修改以后哪些东西必须重做。**

---

# 23. 最终判断

现有端到端方案可以继续实施，不需要推翻。

当前主链路已经具备：

```text
Video
↓
TTS
↓
Remotion
↓
GitHub Render
```

下一阶段重点是把 SOP 变成真正可以自动推进的 Pipeline：

```text
SOP
↓
State
↓
Manifest
↓
Validator
↓
Gate
↓
Invalidation
↓
Pipeline
```

最终目标：

> **程序负责执行，人负责判断。**

而不是：

> **程序做一步，人手动告诉它再做下一步。**
