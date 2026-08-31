# 端到端视频流程最小实现 TODO

## 目标

先实现一个不包含复杂自动化的最小流程控制层，减少流程中断、重复检查和远程渲染状态丢失。

第一版采用：

```text
我负责内容生成
+
流程控制器负责状态和校验
+
TTS 负责音频和字幕
+
Remotion 负责视频
+
GitHub 负责远程渲染
+
用户负责人工确认
```

## 最小实现范围

### 1. 增加视频生产状态

为每条视频增加：

```text
videos/<video-slug>/production-state.json
```

至少记录：

- `videoSlug`
- `buildId`
- `stage`
- `status`
- `approvedGate`
- `approvedArtifactHash`
- `narrationHash`
- `manifestVersion`
- `commitSha`
- `runId`
- `lastError`

### 2. 增加最小流程命令

实现以下命令：

```bash
video pipeline status <slug>
video pipeline approve <slug> <gate>
video pipeline resume <slug>
```

命令职责：

- `status`：显示当前阶段、状态、等待操作和错误信息。
- `approve`：记录人工 Gate 确认，并绑定确认时的文件 Hash。
- `resume`：读取当前状态，执行下一个可执行阶段，完成后更新状态。

暂不要求 `start` 自动调用 Agent；新视频可以先由当前 Agent 创建源文档和初始状态。

### 3. 增加确定性校验

优先实现以下校验器：

- 生产资料文件存在性。
- Scene ID 是否重复或缺失。
- Segment ID 是否重复或缺失。
- Narration 与 Visual 是否覆盖全部 Scene。
- TTS Script、音频和字幕数量是否一致。
- Manifest 引用的文件是否存在。
- 字幕时间是否为非负、递增且落在音频范围内。
- Timeline Scene 和 Segment 顺序是否连续。
- Composition ID 是否已注册。
- GitHub 渲染结果是否通过 `ffprobe` 基础检查。

### 4. 记录 GitHub 渲染任务

状态文件需要保存：

- Workflow 名称。
- Run ID。
- Commit SHA。
- 启动时间。
- 当前状态。
- 最后一次检查时间。
- 失败信息。
- Artifact 名称和下载结果。

第一版先支持状态记录和手动恢复，不建设复杂后台监控。

## 人工 Gate 最小方案

保留六个内部生产阶段，但将用户操作压缩为四个主要确认节点。内部阶段仍然分别记录状态，便于精准回退，不因为 Gate 合并而把所有产物绑定成一个整体。

### Gate 1：内容方案

确认：

- `content-analysis.md`
- `video-narrative.md`
- `scene-script.md`

检查核心命题、叙事路径、Scene 拆分和 Video Value。

### Gate 2：创作方案

确认：

- `narration-script.md`
- `visual-script.md`
- `visual-prototype.html`

检查口播准确性、口语感、声音与画面的互补关系、构图和信息密度。确认后冻结 Narration Script，再进入 TTS。

### TTS 音频质检

在进入 Remotion 音画同步前，人工检查：

- 发音是否正确。
- 声音是否自然。
- 1.25 倍语速是否合适。
- 停顿是否合理。
- 字幕文本和时间是否正确。

### Gate 3：Remotion 预览

确认 Studio 预览中的：

- 音画同步。
- 字幕可读性。
- 动画节奏。
- 信息密度。
- 文字和界面是否溢出。

### Smoke Render 人工确认

GitHub Smoke Render 通过后，人工检查代表帧、短片、Linux 中文字体、资源和音轨，确认后才允许进入 Full Render。

### Gate 4：最终成片

确认完整 MP4 的内容、声音、字幕、画面和交付质量。

Gate 不通过时，依据具体问题回退到对应的内部阶段，不默认从头重做。

## 最小流程

```text
源文档
  ↓
Agent 分阶段生成生产资料
  ↓
人工 Gate
  ↓
TTS 结果接入
  ↓
Manifest 自动校验
  ↓
Remotion 预览
  ↓
人工确认
  ↓
GitHub Smoke Render
  ↓
记录 Run ID 并检查结果
  ↓
GitHub Full Render
  ↓
记录 Artifact 并完成验证
```

## Remotion Scene 半自动生成方案

### 方案定位

第一版不做“自然语言 Visual Script 直接生成最终 Remotion Scene”。当前采用“生产资料由 Agent 生成，Scene 由结构化计划驱动，代码由程序或 Agent 生成初稿，画面由人确认”的半自动方案。

原因是现有 Visual Script 面向人类理解，尚不是稳定的机器执行协议；同时，复杂布局、动画节奏、字幕避让和视觉重点仍需要判断。自动生成的目标是减少重复编码，不是取消视觉决策。

### 数据职责和唯一来源

```text
Markdown 生产资料
  保存完整内容、叙事理由、视觉意图和人工审查意见
        ↓ 派生
Scene Plan
  保存组件和程序执行所需的最小契约
        ↓ 生成
Remotion 配置／Scene JSX 初稿
        ↓ 校验和确认
Remotion Studio 预览
```

以下 Markdown 仍是人类阅读和修改的主要资料：

- `source.md`
- `content-analysis.md`
- `video-narrative.md`
- `scene-script.md`
- `narration-script.md`
- `visual-script.md`
- `visual-prototype.html`

Scene Plan 是从已确认的生产资料派生出的执行中间层，不是把所有 Markdown 复制成完整 JSON，也不是另一份需要人工长期同步维护的正文。生产资料改变后，应重新生成对应 Scene Plan，不能长期手工维护两份内容。

### 第一版实际流程

```text
1. Agent 生成 Source、Content Analysis、Narrative、Scene Script
2. Gate 1：人工确认内容方案
3. Agent 生成 Narration Script、Visual Script、Visual Prototype
4. Gate 2：人工确认创作方案，并冻结 Narration Script
5. 从已确认资料派生 Scene Plan
6. TTS 生成音频和字幕，建立音频／字幕 Manifest
7. Scene Plan 匹配现有组件并生成 video.config.ts 初稿
8. 运行 TypeScript、Manifest、时间轴和布局确定性校验
9. Gate 3：人工确认 Remotion Studio 预览
10. 复杂 Scene 进入 Agent 辅助实现分支，完成后回到校验和预览
```

### 第一版允许自动完成的内容

- 根据已确认的 Scene Script 和 Visual Script 推荐现有 Scene 类型。
- 生成结构化 `scene-plan.json`。
- 将标题、列表、终端文本、对比列等结构化内容填入现有组件。
- 生成 `video.config.ts` 的配置骨架和基础时间轴引用。
- 生成 TTS、字幕和音频 Manifest 的引用关系。
- 检查 Scene、Segment、素材、字幕、音频和 Composition 引用。

### 第一版不自动决定的内容

- Visual Script 是否应该拆分或合并 Scene。
- 复杂布局、状态变化和动画如何表达。
- 是否需要新增 Scene 组件。
- 字幕、音频和视觉事件的感知节奏是否自然。
- 最终画面是否真正表达了原文和视觉重点。

如果 Scene Plan 无法匹配现有组件，流程必须暂停并标记：

```json
{
  "requiresNewComponent": true,
  "reason": "现有组件无法表达文件树与代码 Diff 联动",
  "suggestedComponent": "CodeDiffScene"
}
```

此时由 Agent 提出组件实现方案，经过人工确认后再修改代码，不能自动猜测一个复杂 Scene 并直接进入正式视频。

### Scene Plan 最小契约

第一版只记录会被组件、时间轴、TTS、字幕或校验器直接使用的信息：

```json
{
  "sceneId": "01",
  "sceneType": "opening",
  "component": "OpeningScene",
  "duration": 180,
  "narrationSegmentIds": ["01-01", "01-02"],
  "visualEvents": [
    {
      "id": "install-complete",
      "type": "show",
      "target": "status-card",
      "text": "安装完成",
      "timing": {"segmentId": "01-01", "offsetFrames": 12}
    }
  ],
  "assetRefs": [],
  "requiresNewComponent": false
}
```

第一版不把以下内容编码进 Scene Plan：

- 完整内容分析和叙事理由。
- 创意说明、视觉风格解释和设计备选方案。
- 人工审查过程和暂时性的修改意见。
- 尚未对应现有组件的复杂视觉概念。

### 后续改造任务

按以下依赖顺序推进，不能跳过 Scene Plan 直接做全自动代码生成：

#### 阶段一：建立 Scene Plan Schema

- [ ] 固定 `sceneId`、`sceneType`、`component`、`narrationSegmentIds`、`visualEvents` 和 `assetRefs` 字段。
- [ ] 明确帧时间和 Segment 局部时间的换算规则。
- [ ] 明确 Scene Plan 从哪些 Markdown 资料派生，以及哪些字段不进入机器数据。
- [ ] 为现有六类 Scene 各写一份最小样例。

#### 阶段二：建立组件能力协议

- [ ] 为每个现有 Scene 记录支持的配置字段和 `sceneType`。
- [ ] 记录布局、动画、文字长度和列表数量限制。
- [ ] 记录组件不能表达的输入和回退方式。
- [ ] 区分“配置即可表达”和“必须新增组件”的情况。

#### 阶段三：建立确定性校验器

- [ ] 校验 Scene Plan 字段和 ID。
- [ ] 校验组件是否支持当前配置。
- [ ] 校验视觉事件时间、Scene 时长、音频和字幕范围。
- [ ] 校验元素安全区、文字长度、列表数量和字幕避让信息。
- [ ] 校验 Manifest、素材和 Composition 引用。

#### 阶段四：生成 Remotion 初稿

- [ ] 从通过校验的 Scene Plan 生成 `video.config.ts` 初稿。
- [ ] 优先映射到现有六类通用 Scene。
- [ ] 生成后自动运行 TypeScript 和 Manifest 校验。
- [ ] 生成结果进入人工预览 Gate，不直接视为完成。

#### 阶段五：建立 Agent 辅助实现分支

- [ ] 仅允许 Agent 修改指定视频目录下的配置和 Scene 文件。
- [ ] Agent 必须读取 Scene Plan，不直接从自然语言自由发挥。
- [ ] 记录输入 Plan、修改文件、验证结果和预览版本。
- [ ] 新增通用组件前进行范围、依赖和回归检查。

#### 阶段六：积累组件和回归样例

- [ ] 每种稳定视觉表达沉淀一个组件、配置样例和边界条件。
- [ ] 为代表 Scene 保存代表帧或短片回归样例。
- [ ] 将重复出现的问题转成自动校验规则。
- [ ] 同类 Scene 在多条视频中稳定通过后，才提高自动生成权限。

## 机器可读数据模块

### 模块目标

为流程控制器、TTS、字幕处理、Remotion 和 GitHub 渲染提供稳定的数据契约，让不同工具能够读取、校验、传递和恢复同一条视频的生产状态。

本模块只负责机器之间的数据边界和生命周期，不负责自动生成 Remotion Scene，也不重新讨论组件设计。

### 与 Markdown 生产资料的关系

```text
Markdown 生产资料
  保存完整内容、叙事、创意和人工审查信息
        ↓ 派生
机器可读数据
  保存工具执行所需的稳定字段
        ↓ 消费
TTS／字幕／音频／Remotion／GitHub／流程控制器
```

Markdown 仍然是内容和创意的主要资料。机器数据不是 Markdown 的完整复制品，也不是需要人工长期同步维护的第二份正文。上游 Markdown 修改后，应根据依赖关系重新派生受影响的数据。

### 第一批数据文件

优先建设以下稳定执行边界：

- `production-state.json`：流程状态、当前阶段、人工 Gate、Hash、Run ID 和错误信息。
- `scene-plan.json`：Scene、Segment、视觉事件、必要时间点和下游消费关系；它是数据契约，不是 Scene 代码生成器。
- `tts-script.json`：固定 Segment ID、口播文本和 TTS 所需参数。
- `timeline-manifest.json`：音频驱动的 Scene、Segment 和时间范围。
- `subtitle-manifest.json`：字幕文本、Cue ID 和字幕时间轴。
- `audio-manifest.json`：音频文件、Segment、音频时长和生成版本。

### 数据关系和生产顺序

```text
source.md／content-analysis.md／video-narrative.md
  ↓
scene-script.md／narration-script.md／visual-script.md
  ↓
scene-plan.json + tts-script.json
  ↓
TTS 返回 audio + subtitle
  ↓
audio-manifest.json + subtitle-manifest.json
  ↓
timeline-manifest.json
  ↓
Remotion 和 GitHub Render 消费
```

各文件的职责必须保持单向清晰：

- `scene-plan.json` 不替代 `scene-script.md` 或 `visual-script.md`。
- `tts-script.json` 不替代 `narration-script.md`，只提供 TTS 的固定输入。
- `audio-manifest.json` 和 `subtitle-manifest.json` 记录 TTS 实际返回结果，不反向修改口播正文。
- `timeline-manifest.json` 记录音频驱动的时间关系，不重新定义内容叙事。
- `production-state.json` 记录流程状态，不承载视频正文。

### 数据 Schema 原则

第一版只结构化会被工具直接消费或校验的信息：

- 稳定的 `videoSlug`、`sceneId`、`segmentId` 和 `cueId`。
- 数据来源、生成时间、Schema 版本和内容 Hash。
- 文件路径、资源引用、时长、帧数和时间范围。
- 生产者、消费者和当前数据状态。
- 版本之间的依赖和失效关系。

第一版不复制为机器数据的内容：

- 完整内容分析和叙事理由。
- 创意说明、视觉风格解释和设计备选方案。
- 人工审查过程和暂时性的修改意见。
- 还没有稳定用途的自由文本和未来预留字段。

### 数据校验

机器数据模块需要提供确定性校验，包括：

- ID 是否重复、缺失或跨文件不一致。
- 上游 Markdown Hash 是否与派生数据记录一致。
- TTS Script、音频、字幕和 Segment 的对应关系是否完整。
- 音频、字幕和 Timeline 的时间范围是否连续、非负且不越界。
- Manifest 引用的文件、资源和版本是否存在。
- 数据 Schema 版本是否兼容当前消费者。
- 生产状态是否允许进入下一个流程阶段。

### 数据失效和重新生成

失效传播不是只给发生变化的 Segment 加一个 `invalid` 标记，而是要沿着“上游输入 → 派生数据 → 时间轴 → 人工确认 → 渲染任务”的依赖关系，标记所有不能继续安全使用的下游结果。

第一版不建设数据库或通用依赖图，采用“固定依赖规则 + Hash + generationId”的方式实现。生成可以尽量局部化，但凡时间轴或人工确认受到影响，都必须重新计算或重新检查。

#### 依赖关系

```text
Narration Script / tts-script.json
  ↓
Segment TTS 音频 + Segment 字幕
  ↓
audio-manifest.json + subtitle-manifest.json
  ↓
timeline-manifest.json
  ↓
Remotion 预览
  ↓
人工 Gate
  ↓
GitHub 渲染任务和 Artifact
```

Segment 音频可以按 Segment 局部重新生成，但 `timeline-manifest.json` 通常需要重新计算。原因是某个 Segment 的音频时长变化后，当前 Segment 之后的绝对开始时间都会变化；后续 Segment 的音频文件可能仍然有效，但旧的时间位置不能继续使用。

#### 修改类型和传播范围

| 修改内容 | 需要重新生成 | 需要重新检查或失效 |
| --- | --- | --- |
| Segment 口播文本 | 当前 Segment 的 TTS 音频和字幕 | 当前 Scene 的时间轴、当前及后续时间位置、音画 Gate |
| Segment 语速或 TTS 参数 | 受影响 Segment 的音频和字幕；若为全局参数则为全部 Segment | 全部相关 Timeline、Remotion 预览和音画 Gate |
| Segment 顺序变化 | 受影响范围的 Timeline | 当前 Scene 及后续 Scene、相关人工确认 |
| 新增或删除 Segment | 当前 Scene 及后续 Manifest | 视频结构、总时长、Remotion 预览和相关 Gate |
| 字幕文本或字幕时间变化 | `subtitle-manifest.json` | Timeline、Remotion 预览和字幕 Gate；不自动重生成音频 |
| Scene 时间关系变化 | `timeline-manifest.json` | 当前 Scene 之后的时间轴、Remotion 预览和相关 Gate |
| 视觉内容变化但时长不变 | 视觉配置或 Remotion 内容 | 当前 Scene 预览；不自动使 TTS 失效 |
| 素材路径或素材文件变化 | 对应资源 Manifest 或资源校验结果 | 受影响 Scene、Remotion 预览和渲染前资源校验 |
| 只修改人工审查备注 | 无 | 不使执行数据失效 |

#### 第一版的传播规则

1. 记录发生变化的上游文件或 Segment、变化原因、旧 Hash 和新 Hash。
2. 将直接产物标记为 `invalid`，例如口播文本变化会使对应 TTS 音频和字幕失效。
3. 将依赖时长或绝对时间的 `timeline-manifest.json` 标记为 `stale`，重新计算后才能恢复为 `valid`。
4. 只要 Timeline 发生变化，就将 Remotion 预览和音画同步人工 Gate 标记为 `needs-review`。
5. 如果已经创建 GitHub 渲染任务，则比较渲染任务记录的输入 Hash；Hash 不一致时，旧 Run 和 Artifact 标记为 `superseded`，不能作为当前版本成片。
6. 只有所有被传播影响的数据重新生成、校验通过并完成必要的人工确认后，才允许进入下一阶段。
7. 没有受到影响的 Segment 可以继续复用，但必须确认其 `generationId`、`segmentId` 和文件 Hash 没有与新结果混用。

#### 最小失效记录

失效信息至少要能回答“什么变了、为什么失效、影响了什么、目前能否继续”四个问题：

```json
{
  "target": "segment-03",
  "status": "invalid",
  "reason": "narration-text-changed",
  "sourceHashBefore": "sha256:old",
  "sourceHashAfter": "sha256:new",
  "affectedArtifacts": [
    "tts-audio",
    "subtitle",
    "audio-manifest",
    "subtitle-manifest",
    "timeline-manifest",
    "remotion-preview"
  ],
  "requiresHumanReview": true,
  "invalidatedAt": "2026-08-14T10:00:00Z"
}
```

生产状态还要记录被影响的阶段和恢复位置，不能只记录一个全局的“失败”：

- `invalidatedArtifacts`：已经失效的文件或产物。
- `staleStages`：需要重新生成或重新检查的内部阶段。
- `resumeFrom`：修复后允许恢复的最早阶段。
- `requiresHumanReview`：是否必须重新经过人工 Gate。
- `sourceHash`、`generationId`：用于隔离旧版本和新版本。

#### 典型例子：只修改一个 Segment

如果 `segment-03` 的口播从 2.5 秒变成 4 秒：

- 重新生成 `segment-03` 的音频和字幕；
- 保留其他 Segment 的音频文件，但重新生成整个 Timeline；
- `segment-04` 之后的 Segment 不必重新生成音频，但绝对时间需要重新计算；
- 当前 Scene 及后续 Scene 的 Remotion 预览必须重新检查；
- 原来通过的音画同步 Gate 失效；
- 如果旧版本已经提交 GitHub 渲染，旧 Artifact 只能保留作历史记录，不能继续作为当前交付物。

这实现了“局部重新生成、全局时间轴校验”，避免每次改一小段文案都重新调用全部 TTS，同时避免继续使用已经过期的时间和人工确认。

#### 实施顺序

1. 为每个机器数据文件和 TTS Segment 记录 `schemaVersion`、`sourceHash`、`generationId` 和生成状态。
2. 固定第一批依赖规则，不实现通用依赖图；先覆盖口播文本、TTS 参数、字幕、Scene 时间、素材路径五类变化。
3. 实现 `invalid`、`stale`、`needs-review`、`valid`、`superseded` 这几个最小状态。
4. 实现按 `segmentId` 定位直接受影响产物的规则。
5. 实现 Timeline 全量重算规则，并校验所有 Segment 的连续性、非负时间和总时长。
6. 将 Timeline 变化传播到 Remotion 预览和人工 Gate 状态。
7. 将输入 Hash 写入 GitHub 渲染任务，阻止旧 Run 或旧 Artifact 被误认作当前版本。
8. 用“修改一个 Segment”和“修改全局语速”两个样例验证局部重生成、时间轴重算和 Gate 失效。
9. 多条视频验证规则稳定后，再考虑抽象正式依赖协议。

#### 完成标准

- [ ] 修改一个 Segment 后，系统能列出直接失效产物和需要重新检查的下游阶段。
- [ ] 未受影响的 Segment 可以复用，且不会与新版本音频、字幕混用。
- [ ] 任一受影响 Segment 的时长变化都会触发 Timeline 重算。
- [ ] Timeline 变化会使 Remotion 预览和音画同步 Gate 进入 `needs-review`。
- [ ] 已提交渲染任务的输入 Hash 与当前版本不一致时，旧 Run／Artifact 被标记为 `superseded`。
- [ ] 流程可以从最早失效阶段恢复，不要求默认从源文档重新开始。

### 后续实现顺序

按以下顺序建设本模块：

1. 固定第一批文件的字段、版本和生产者／消费者关系。
2. 为现有 `claude-code-install` 样例补充或整理对应的数据契约。
3. 增加 ID、Hash、文件引用和时间范围校验。
4. 将校验结果和失效原因写入 `production-state.json`。
5. 接入 TTS 返回的音频／字幕数据，并生成对应 Manifest。
6. 让 Remotion 和 GitHub Render 只消费通过校验的数据。
7. 在多条视频中验证字段稳定性，再决定是否扩展正式 DSL 或 Manifest 协议。

只有某类字段在多条视频中反复出现、结构稳定且确实被工具使用时，才将其纳入正式协议；不为了覆盖所有 Markdown 内容而提前设计大型数据模型。

## TTS 接口确定与实施依据

### 模块目标

把“调用 TTS”从流程图中的概念步骤，落实为一次可以真实调用、真实返回、真实校验并被 Remotion 消费的接口契约。

本模块不负责选择或实现 TTS 引擎，也不把 TTS 做成平台。第一版只需要为一条有口播的视频确定一个真实可用的调用适配方式，并保留后续替换 TTS 引擎的边界。

### 当前状态

目前已经确定：

- TTS 位于已确认的 `narration-script.md` 和 Visual Prototype 之后、正式 Remotion 时间线实现之前。
- Video 项目向 TTS 提供派生的 `tts-script.json`。
- TTS 返回音频、字幕和时间数据，Video 项目据此生成或整理 Manifest。
- Video 项目不负责 TTS 引擎内部的音频生成、字幕切分和 Word Boundary 计算。

目前尚未确定：

- 实际调用哪个 TTS 项目、命令或 API。
- 调用是本机命令、跨项目文件交换、HTTP API，还是异步任务接口。
- 输入字段的真实名称、允许值和长度限制。
- 输出文件、字幕格式、时间数据和 `segmentId` 的实际结构。
- `1.25` 倍语速的真实参数和最终时间轴行为。
- 失败、重试、幂等、版本和鉴权规则。

因此，在完成一次真实样例闭环前，只能称为“接口设计方向已确定”，不能称为“TTS 接口已确定”。

### “真正确定”的判定

满足以下条件，才算 TTS 接口真正确定：

1. 已选定一个真实可调用的 TTS 实现，并记录项目路径、命令或接口地址、鉴权方式和版本。
2. Video 项目可以用约定的 `tts-script.json` 发起一次生成。
3. TTS 能返回可定位到 `segmentId` 的音频、字幕和时长数据。
4. 返回结果能够通过确定性校验，并被 Remotion 成功读取。
5. 已确认 1.25 倍语速对应的实际参数、音频时长和字幕时间轴。
6. 已验证单个 Segment 失败时如何定位、重试和恢复。
7. 输入、输出、错误和版本信息已经形成可复用的样例，而不是只存在于口头约定中。

### 第一版最小输入契约

Video 项目交给 TTS 的数据只包含已确认的朗读内容和执行参数，不直接交出原始文章、Scene Script 或带制作备注的 Markdown。

```json
{
  "schemaVersion": "1.0",
  "videoSlug": "example-video",
  "generationId": "example-video-tts-001",
  "voice": "待真实 TTS 确认",
  "rate": 1.25,
  "segments": [
    {
      "sceneId": "scene-01",
      "segmentId": "01-01",
      "order": 1,
      "text": "最终朗读文本。"
    }
  ]
}
```

必须在真实 TTS 调用前确认：

- `voice` 的实际取值和默认声音。
- `rate` 的参数名称、单位和允许范围。
- `1.25` 是原生生成速度还是生成后音频处理速度。
- 单个 Segment 和单次请求的最大字符数。
- 中文、英文、数字、产品名和技术术语的读法规则。
- Segment 是逐个生成，还是由 TTS 合并生成后再分段返回。
- `segmentId` 是否会原样保留并贯穿整个返回结果。

### 第一版最小输出契约

每个音频结果至少要能关联到一个固定的 `segmentId`，并提供真实时长。字幕时间必须与最终交付音频使用同一套时间轴。

```json
{
  "schemaVersion": "1.0",
  "generationId": "example-video-tts-001",
  "engine": "待真实 TTS 确认",
  "engineVersion": "待真实 TTS 确认",
  "rate": 1.25,
  "segments": [
    {
      "sceneId": "scene-01",
      "segmentId": "01-01",
      "audioFile": "audio/scene-01/01-01.mp3",
      "audioDurationSeconds": 2.4,
      "subtitleCues": [
        {
          "cueId": "01-01-cue-01",
          "text": "最终朗读文本。",
          "startSeconds": 0,
          "endSeconds": 2.4
        }
      ],
      "status": "succeeded"
    }
  ]
}
```

实际字段名可以根据 TTS 项目调整，但语义不能缺失：

- 音频文件引用。
- 音频真实时长。
- `videoSlug`、`sceneId`、`segmentId` 和 `generationId`。
- 最终字幕文本和起止时间。
- 引擎及版本。
- 每个 Segment 的成功或失败状态。

如果 TTS 只能返回 MP3 和粗粒度 SRT，不能直接视为满足契约；需要确认能否补充逐句时间数据，否则无法稳定驱动 Scene 和字幕同步。

### 1.25 倍语速规则

优先使用 TTS 引擎原生语速参数，让音频、字幕和边界时间从同一份最终声音生成。

如果只能先生成正常速度音频，再进行 1.25 倍后处理，必须同时：

- 将字幕和 Word Boundary 时间按 `原时间 ÷ 1.25` 重算。
- 重新读取处理后音频的真实时长。
- 检查变速后音高、停顿和技术词发音是否可接受。
- 用处理后的音频和时间数据生成 Manifest。

不能只加速 MP3，却继续使用原始字幕和原始时间轴。

### 调用方式和任务状态

实施前必须在以下方式中确定一种真实方案：

- 本机或同一工作区命令调用。
- 跨项目文件输入和输出。
- 同步 HTTP API。
- 异步任务 API，返回任务 ID 后轮询。

无论采用哪种方式，都必须明确：

- 调用入口和完整命令或请求示例。
- 输入文件位置或请求 Body。
- 输出文件位置或下载方式。
- 成功判定和退出码／HTTP 状态码。
- 处理中、成功、失败和部分成功的状态表示。
- 超时、重复调用和中断后的恢复方式。
- Token、密钥和其他凭据的安全注入方式；凭据不能写入仓库、Manifest 或日志。

第一版优先选择最容易真实验证的方式，不先建设通用任务平台。

### 失败、重试和幂等规则

至少要能区分：

- 输入校验失败：修正 `tts-script.json` 后重新生成。
- 单个 Segment 生成失败：只重试失败 Segment，成功结果保持不变。
- 整体任务失败：记录任务和引擎错误，确认是否可以续跑。
- 文件生成成功但回传失败：重新下载或校验，不盲目重复生成。
- 返回结果与输入不一致：阻止进入 Remotion，不能人工猜测补齐。

同一个 `generationId` 和 `segmentId` 的重复执行必须有明确行为：覆盖、生成新版本，或直接复用已有成功结果。旧音频、旧字幕和新口播不得混用。

### TTS 结果的确定性校验

在进入 Remotion 前，至少执行以下检查：

- 输入与返回的 Scene、Segment 数量一致。
- `segmentId` 不重复、不缺失、不漂移。
- 每个音频文件存在且可以读取。
- 音频实际时长与 Manifest 记录一致。
- 字幕文本与冻结版 `tts-script.json` 一致，除非明确记录了标准化规则。
- 字幕时间非负、起止顺序正确，并落在对应音频范围内。
- 最后一条字幕结束时间与音频总时长差距在可接受范围内。
- 1.25 倍速参数、引擎版本和生成版本已记录。
- 结果的 Schema 版本与当前 Video 消费方兼容。

校验失败时，流程停在 TTS 质检阶段，不得继续生成 Remotion 时间线。

### 最小真实闭环

第一版不要求一次接通完整长视频，先用一条包含中文、英文产品名、数字和停顿的短测试视频完成：

```text
tts-script.json
  ↓ 真实调用
音频文件 + 字幕文件／字幕 Manifest
  ↓ 整理并校验
audio-manifest.json + subtitle-manifest.json + timeline-manifest.json
  ↓ 接入 Remotion
Studio 中音频、字幕和画面同步
```

测试闭环必须验证开头、中段、结尾和至少一个技术术语；不能只验证“接口返回 HTTP 200”或“目录里出现了 MP3”。

### 实施顺序

1. 确认第一条验证视频、TTS 项目和实际调用方式。
2. 获取 TTS 项目的官方命令、API 文档或可运行参考，确认声音、语速、格式和任务状态参数。
3. 用短文本完成一次真实调用，保存原始请求、返回结果和生成版本。
4. 根据真实结果固定 `tts-script.json`、音频、字幕和 Manifest 的最小字段。
5. 确认 1.25 倍速后的音频、字幕和时间轴是否来自同一版本。
6. 实现输入、输出、ID、文件、时间和版本校验。
7. 实现失败 Segment 的定位、重试和旧版本隔离。
8. 将通过校验的结果接入 Remotion，按真实音频时间轴生成预览。
9. 通过人工 TTS 质检和 Remotion 预览确认后，才纳入端到端流程。
10. 多条视频验证字段和调用方式稳定后，再考虑抽象 TTS Adapter 或 Pipeline Controller 接口。

### 完成标准

- [ ] 已记录真实 TTS 项目、命令或 API、版本和鉴权注入方式。
- [ ] 一条短测试视频已经完成 Video → TTS → Video 闭环。
- [ ] 输入字段和输出字段经过真实调用验证。
- [ ] `segmentId` 从 `tts-script.json` 贯穿到音频、字幕和时间轴。
- [ ] 1.25 倍速的实现方式和实际时间轴已经验证。
- [ ] TTS 返回结果可以生成并通过三个 Manifest 的确定性校验。
- [ ] 失败 Segment 可以定位、重试，且不会混用旧音频和新口播。
- [ ] Remotion 能消费通过校验的音频和字幕，并完成一次同步预览。

## 暂不实现

- Agent 的完全自动调用。
- 多视频并行生产。
- 数据库和任务队列。
- Web 管理后台。
- 复杂失败自动重试平台。
- 自动绕过人工 Gate。
- `visual-only` 正式分支。
- 根据自然语言直接自动生成未经确认的完整 Remotion Scene 视觉实现。

## 完成标准

- [ ] 新视频可以创建并恢复 `production-state.json`。
- [ ] 可以查询当前阶段和等待中的人工操作。
- [ ] Gate 确认绑定对应版本的文件 Hash。
- [ ] Manifest 和时间轴校验可以自动执行。
- [ ] GitHub Run ID 和 Artifact 状态可以记录。
- [ ] 流程中断后可以从上一次有效阶段恢复。

# Harness Web UI 按钮状态统一改造 TODO

> 盘点日期：2026-08-31。本章只记录后续改造范围，当前尚未统一修改按钮实现。

## 盘点结论

- Web UI 源码中共有 41 个 `<button>` 声明位置，另有 1 个“打开 Remotion Studio”按钮样式链接。
- 合并重复渲染位置后，共 37 类功能按钮。
- 32 类按钮需要统一处理“提交中／运行中／当前不可执行”状态：
  - 25 类会改变项目、任务或 Gate 状态。
  - 7 类会发起异步读取或刷新。
- 5 类为纯本地导航、关闭或外部链接，不需要持久业务禁用，但仍需检查弹窗和可访问性状态。

## 待处理按钮

### 1. 项目与阶段操作（14 类）

- [ ] 初始化 Harness。
- [ ] 重新校验。
- [ ] Legacy 只读检查。
- [ ] 确认 TTS 质检。
- [ ] 执行当前阶段。
- [ ] 执行／重试 Remotion Agent。
- [ ] 提交远程任务。
- [ ] 查找历史 Artifact。
- [ ] 重试当前阶段。
- [ ] 恢复项目。
- [ ] 通过 Gate。
- [ ] 驳回 Gate。
- [ ] 确认驳回。
- [ ] 重试本地 Agent 任务。

### 2. 批量生产与任务（9 类）

- [ ] 批量到 Gate 2。
- [ ] 批量完成 TTS。
- [ ] 批量完成 Remotion。
- [ ] 批量渲染。
- [ ] 确认批次 TTS 质检。
- [ ] 确认批次 Smoke 检查。
- [ ] 重试批次失败项目。
- [ ] Remotion 任务执行／重试 Agent。
- [ ] Remotion 任务提交完成校验。

### 3. 系列与封面（3 类）

- [ ] 新建系列。
- [ ] 保存系列设置。
- [ ] 上传并保存封面。

### 4. 读取与刷新（7 类）

- [ ] 刷新项目。
- [ ] 刷新批次。
- [ ] 刷新全局远程任务。
- [ ] 刷新当前项目远程任务。
- [ ] 检查 GitHub 配置。
- [ ] 查看项目详情。
- [ ] 查看生产资料文件。

### 5. 导航与关闭（5 类）

- [ ] 返回项目列表。
- [ ] 驳回弹窗右上角关闭。
- [ ] 驳回弹窗取消。
- [ ] 新建系列的本地表单切换。
- [ ] 打开 Remotion Studio 链接。

## 非按钮交互控件

统一处理按钮时，一并检查以下控件在请求中和业务不可执行时的锁定状态：

- [ ] 项目批量选择复选框。
- [ ] 系列视频关联复选框。
- [ ] 系列选择下拉框。
- [ ] 系列 ID、名称和封面帧数输入框。
- [ ] 封面文件选择框。
- [ ] Gate 驳回阶段下拉框和原因输入框。

## 统一实施规则

- [ ] 前端立即锁定：用户点击后立即禁用当前按钮及所有互斥按钮，不等待服务端响应。
- [ ] 持久状态投影：页面刷新后，继续根据 Harness 核心状态、Agent Job、Remotion Task 和 Remote Job 显示禁用状态。
- [ ] 可理解的文字：按钮文案应显示“提交中”“Agent 正在制作”“远程任务执行中”等具体状态，并在邻近区域说明原因和下一步。
- [ ] 错误后可恢复：失败时恢复合法操作，保留错误详情和明确重试入口。
- [ ] 服务端幂等：重复请求必须返回已有任务或当前状态，不能只依赖前端 `disabled`。
- [ ] 同任务多入口同步：同一 Remotion 任务在任务列表、项目操作区和错误卡片中的所有按钮必须同时更新。
- [ ] 请求顺序保护：防止旧请求的迟到响应覆盖新状态。
- [ ] 可访问性：统一 `disabled`、`aria-disabled`、`aria-busy`、状态文字和禁用样式。

## 验收标准

- [ ] 32 类异步／业务按钮都有提交中和持久禁用状态。
- [ ] 当前不可执行的操作不会显示为可点击，并在按钮附近显示原因。
- [ ] 快速连续点击不会创建重复 Agent Job、Remotion Task、Remote Job 或批次。
- [ ] 刷新页面后，运行中的任务仍保持禁用状态和文字说明。
- [ ] 任务成功、失败或超时后，按钮状态能恢复到 Harness 允许的下一步。
- [ ] 前端按钮回归、服务端幂等回归、Harness 全量测试、TypeScript 检查和语法检查通过。

# 远程渲染分支与产物预检 TODO

> 记录日期：2026-08-31。已先完成显式 Harness 分支优先级修复；其余远端产物预检继续留作后续统一实现，不修改 GitHub Actions。

## 问题

Web UI 能成功创建 GitHub Actions 远程渲染任务，但当前使用 `GITHUB_REF_NAME` 作为 dispatch ref。运行 Web UI 的环境如果残留旧分支值，任务会在旧分支执行；即使本地已经生成新视频代码、Manifest 和资产 ZIP，只要这些文件尚未提交并推送到目标分支，远程校验仍会失败。

当前配置读取顺序为 `GITHUB_REF_NAME` 优先于 `HARNESS_GITHUB_REF`，因此显式的 Harness 配置可能被旧的 `GITHUB_REF_NAME` 覆盖。Web UI 提交前也没有确认目标远程分支是否真正包含本次渲染所需产物。

## 待处理事项

- [x] 显式 `HARNESS_GITHUB_REF` 优先于 `GITHUB_REF_NAME`，避免旧 GitHub 环境值覆盖本次 Harness 目标分支；当前 Git 上游自动回退仍属于下一项。
- [ ] 优先使用显式 `HARNESS_GITHUB_REF`；未配置时再使用当前 Git 上游分支，并对无法确定分支的情况直接阻止提交。
- [ ] 在 Web UI 中展示本次任务将使用的目标分支和 commit SHA。
- [ ] 提交 Smoke Render 或完整 Render 前，校验目标远程分支存在且包含当前视频的 Remotion 代码、必需 Manifest 和 `assets/<video-slug>-assets.zip`。
- [ ] 检查本地必需产物是否尚未提交或尚未推送；存在差异时禁用提交按钮，并列出缺失或未同步的文件。
- [ ] Remote Job 持久化实际 `ref` 和 commit SHA，任务详情页明确展示，不允许后续轮询误关联其他分支的 Run 或 Artifact。
- [ ] 修复后重新提交新的远程任务；旧分支上的失败 Run 只保留为历史记录，不尝试继续执行。
- [ ] 不在本项中修改 GitHub Actions 工作流；若后续确需调整 `.github/workflows/`，必须单独获得授权。

## 验收标准

- [ ] Web UI 展示的目标分支、Remote Job 保存的 `ref` 和 GitHub Actions Run 的 `head_branch` 完全一致。
- [ ] 目标远程分支缺少 ZIP、Manifest 或视频代码时，提交入口不可点击，并显示具体原因。
- [ ] 本地文件未提交或目标分支未推送时，不会创建远程任务。
- [ ] 分支和产物均满足条件后，可以从当前 `smoke-render` 阶段直接重新提交，不要求重走此前 Gate。
- [ ] 增加分支优先级、远程产物预检、按钮禁用和 Remote Job 关联的自动化回归测试。
