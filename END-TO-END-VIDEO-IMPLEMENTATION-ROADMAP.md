# 端到端视频流程正式实施路线

> 状态：实施路线已确认，尚未开始代码实现。
>
> 本文基于 `VIDEO-END-TO-END-AUTOMATION-UPGRADE.md`、当前项目真实实现情况以及后续讨论结果整理而成，用于指导端到端视频生产流程的正式实施。
>
> 本文指导的是第一版半自动、可恢复、带人工 Gate 的视频生产流程，不代表当前已经完成自动 TTS、Pipeline Controller、失效传播或通用化流程。

## 最终判断

这版方案可以指导接下来的工作，且已经达到“可以拆任务、定顺序、写验收标准”的程度。

但它目前指导的是：

> 半自动、可恢复、带人工 Gate 的第一版视频生产流程。

还不是：

> 从源文档到最终视频的无人值守自动化系统。

真正开工前只需要再确认三类事项：

1. 真实 TTS 接口。
2. 机器数据与现有 Manifest 的最终字段。
3. Agent 和 Remotion 阶段的人工边界。

这三项确定后，就可以从 `production-state.json` 和确定性校验器开始实施。

## 一、这版方案已经解决的问题

这版方案已经把 ChatGPT 原方案中的核心能力落下来了：

1. 明确了人工与程序的边界。

   程序负责状态、校验、数据传递和失效传播；Agent 负责内容生产和需要判断的创作工作；用户负责关键 Gate。

2. 明确了机器可读数据的职责。

   不再复制所有 Markdown，而是只保存 Scene、Segment、Hash、时间轴、音频、字幕、状态等工具真正需要的数据。

3. 明确了失效传播。

   修改一个 Segment 后，不只是当前 Segment 失效，还要重新计算后续 Timeline，使 Remotion 预览和旧的人工确认失效。

4. 明确了 TTS 不能只停留在概念上。

   已经写清楚了真实命令、输入输出、版本、1.25 倍速、失败重试、幂等和最小真实闭环。

5. 明确排除了暂时不可行的内容。

   包括完全自动调用 Agent、自动生成完整 Remotion Scene、数据库、任务队列、visual-only 正式分支等。

这些内容已经记录在 `todo.md`，整体方向和 `VIDEO-END-TO-END-AUTOMATION-UPGRADE.md` 一致，而且比原方案更符合当前真实情况。

## 二、当前项目的真实基础

项目目前已经具备：

- 两条视频的真实生产资料。
- 音频 Manifest、字幕 Manifest、Timeline Manifest。
- Remotion 根据真实音频时间轴驱动画面。
- GitHub Smoke Render 和 Full Render。
- 现有视频可以通过实际音频完成渲染。

但目前还没有：

- `production-state.json`。
- Pipeline Controller。
- `video pipeline status / approve / resume` 命令。
- 通用确定性校验器。
- 真实 TTS Adapter。
- 自动失效传播机制。
- 通用化的机器数据 Schema。

例如当前的 `src/videos/claude-code-install/generated/audio-manifest.json` 和 `src/videos/claude-code-install/generated/timeline-manifest.json` 已经是真实可用的机器数据，但它们的字段结构和 `todo.md` 中的示例字段还没有完全统一。

所以当前状态是：

> Remotion 音画生产能力已经存在，但流程控制层和 TTS 接入层还没有实现。

## 三、方案现在能指导到什么程度

可以指导以下工作：

```text
确定生产资料契约
↓
建立 production-state
↓
建立状态和 Gate
↓
建立校验器
↓
接入真实 TTS
↓
生成和校验 Manifest
↓
实现失效传播
↓
让 Remotion 消费稳定数据
↓
完成一条 narrated 视频闭环
```

但它暂时不能指导以下目标：

```text
只放入 source.md
↓
系统自动调用当前对话中的 Agent
↓
自动生成所有内容
↓
自动写完 Remotion Scene
↓
无人干预完成视频
```

原因是当前方案明确没有定义：

- 程序如何调用当前对话中的 Agent。
- Agent 生成内容时使用什么输入输出协议。
- Agent 什么时候结束、如何返回结果。
- Remotion Scene 由谁实现、如何验证。

因此，第一版应该明确采用：

> Agent 负责生成和修改 Markdown、Visual Prototype 以及必要的 Remotion 配置；Pipeline Controller 负责记录状态、校验结果、等待 Gate 和恢复流程。

这样是当前真正可实现的版本。

## 四、开工前还需要补齐的内容

### 1. 明确 Agent 的运行边界

这是原方案和当前 `todo.md` 之间最大的差异。

原方案设想：

```text
source.md → Agent 自动生成 → Gate 1
```

当前最小方案实际上是：

```text
source.md
↓
Agent 生成生产资料
↓
Controller 读取并校验
↓
Gate 1
```

第一版采用第二种。先不做“程序自动调用 Agent”，否则需要额外设计 Agent Adapter。

### 2. 确定真实 TTS 项目和调用方式

这是当前真正的硬阻塞。

还缺：

- TTS 项目路径。
- 调用命令或 API。
- 声音名称。
- 1.25 倍速参数。
- 字幕和时间数据的返回格式。
- `segmentId` 是否能贯穿返回结果。
- 失败 Segment 如何重试。

在这些内容确认前，TTS 部分只能设计，不能真正实施。

### 3. 把机器数据 Schema 对齐当前真实 Manifest

需要用现有 `claude-code-install` 数据做一次字段对照，明确：

- `videoId` 还是 `videoSlug`。
- `id` 还是 `segmentId`。
- `duration` 还是 `audioDurationSeconds`。
- `start/end` 还是 `startSeconds/endSeconds`。
- Manifest 是继续沿用当前结构，还是整体升级。

第一版优先兼容当前已经验证过的 Manifest，不为了追求抽象而全部推翻。

### 4. 固定状态机和 Gate 分类

目前 `todo.md` 里叫“四个主要 Gate”，但实际还有：

- TTS 音频质检。
- Smoke Render 人工检查。

最终定义为：

```text
正式 Gate：
Gate 1：内容方案
Gate 2：创作方案
Gate 3：Remotion 预览
Gate 4：最终成片

阻塞性检查点：
TTS 质检
Smoke Render 检查
```

这样既保留四个核心 Gate，也不会遗漏 TTS 和 Smoke 检查。

### 5. 明确 Remotion 阶段不是全自动

当前项目真实情况是：

- Remotion 可以消费 Manifest。
- Remotion Scene 仍然需要人工或 Agent 编写。
- 不能根据普通 Markdown 自动稳定生成完整 Scene 实现。

因此第一版应当是：

```text
Controller 负责检查 Remotion 是否准备好
Agent 负责完成必要的 Remotion 实现
Controller 负责进入预览和后续流程
```

而不是把“自动完成 Remotion Scene”作为第一版目标。

## 五、建议的实际实施顺序

### 阶段 0：冻结实施契约

先确定：

- 第一条验证视频。
- TTS 项目和真实调用方式。
- Manifest 采用的字段结构。
- 四个 Gate 和两个阻塞性检查点。
- Agent 和 Remotion 的人工边界。

### 阶段 1：实现最小流程控制器

先实现：

```text
production-state.json
video pipeline status
video pipeline approve
video pipeline resume
```

这一阶段不接 TTS，也不自动调用 Agent，只验证状态能否保存、查询、批准和恢复。

### 阶段 2：实现确定性校验器

优先校验：

- 文件存在。
- Scene／Segment ID。
- Manifest 引用。
- 字幕时间。
- 音频时长。
- Timeline 连续性。
- Composition 是否存在。

### 阶段 3：接入真实 TTS

用一条很短的测试视频完成：

```text
tts-script.json
↓
真实 TTS
↓
音频和字幕
↓
audio-manifest
subtitle-manifest
timeline-manifest
↓
Remotion 预览
```

验证 1.25 倍速、中文、英文产品名、数字和停顿。

### 阶段 4：实现失效传播

至少验证两个案例：

1. 修改一个 Segment 文案。
2. 修改全局语速。

确认：

- 是否只重新生成受影响音频。
- 是否重新计算整个 Timeline。
- 是否让旧预览和旧 Gate 失效。
- 是否隔离旧音频和新音频。

### 阶段 5：跑通第一条完整 narrated 视频

完成：

```text
生产资料
↓
Gate 1
↓
Gate 2
↓
TTS
↓
TTS 质检
↓
Remotion 预览
↓
Gate 3
↓
后续 GitHub 流程
↓
Gate 4
```

GitHub 渲染部分单独处理，不作为本路线判断方案是否成立的依据。

## 六、暂不纳入第一版的内容

- 程序自动调用当前对话中的 Agent。
- 完全自动生成所有生产资料。
- 根据普通 Markdown 自动生成完整 Remotion Scene。
- 数据库和任务队列。
- 多视频并行生产。
- visual-only 正式分支。
- 通用依赖图和复杂失败重试平台。

## 七、实施完成的判断标准

第一版完成时，至少应满足：

- 能创建、查询和恢复 `production-state.json`。
- 能记录人工 Gate 以及对应版本 Hash。
- 能执行生产资料和 Manifest 的确定性校验。
- 能接收真实 TTS 结果，并验证音频、字幕和 Timeline 的一致性。
- `segmentId` 能贯穿 TTS Script、音频、字幕、Manifest 和 Remotion。
- 修改 Segment 后能正确传播失效状态。
- 未受影响的音频可以复用，且不会与新版本混用。
- Remotion 能消费通过校验的真实音频时间轴并完成预览。
- 一条 narrated 视频能够按既定 Gate 顺序完成到预览阶段。

