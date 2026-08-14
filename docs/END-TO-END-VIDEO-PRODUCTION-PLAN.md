# 视频端到端生产流程方案

> 状态：第一条有口播视频已完成内容生产、TTS 回传、Remotion 接入和 Gate 3，正在验证参数化 GitHub Actions 冒烟与完整渲染。本文继续作为人工确认闸门、Video 与 TTS 交付契约、远程渲染回路和无音频分支的实施依据。

## 1. 目标

输入一份源文档后，由 Video 项目按照现有生产规则分阶段生成视频资料；口播和视觉方案确认后，将标准化的 TTS Script 交给独立 TTS 项目；TTS 生成 1.25 倍目标语速的音频、字幕和时间数据并回传；Video 项目再以真实声音时间轴完成 Remotion 音画同步。用户确认最终预览后，才进入 GitHub Actions 冒烟渲染和完整渲染，并持续检查远程任务直到成功或需要用户补充外部错误信息。

第一版只打通一条有口播的视频，不建设复杂平台、数据库或通用任务编排系统。连续验证多条视频后，再判断是否需要进一步自动化。

## 2. 核心判断

### 2.1 必须保留人工检查

端到端流程不应从源文档无人干预地直接运行到最终视频。内容理解、叙事、口播和视觉判断都可能把早期错误传递到后续阶段，因此采用「自动生成一个阶段，人工确认一个阶段」的方式。

自动检查负责可以客观判断的事项，例如文件存在、Manifest 引用、时长、字体、资源数量和类型检查。人工确认负责内容是否准确、口播是否自然、视觉是否清楚、节奏是否合适。

### 2.2 TTS 的位置

TTS 放在 Narration Script 和 Visual Prototype 确认之后、正式 Remotion 时间线实现之前。

原因是最终使用的真实音频时长、逐句字幕和 Segment 边界应反向决定 Scene 时长、动画触发点和视频总时长。不能先锁死 Remotion 时间线，再把音频和字幕硬塞进去。

### 2.3 两种视频模式

流程入口预留两种模式：

```text
productionMode: narrated | visual-only
```

- `narrated`：有明确口播，进入 TTS，使用音频和逐句字幕驱动时间线。
- `visual-only`：无口播，跳过 TTS，按视觉事件、屏幕文字阅读时间、动画完成时间和必要停顿确定 Scene 时长。

两种模式在 Remotion 实现、人工预览、GitHub 冒烟渲染和完整渲染阶段重新汇合。

## 3. 推荐流程

```text
源文档
  ↓
Source
  ↓
Content Analysis
  ↓ 人工确认 A
Video Narrative
  ↓ 人工确认 B
Scene Script
  ↓ 人工确认 C
Narration Script
  ↓ 人工确认 D：冻结口播
Visual Script
  ↓ 人工确认 E
Visual Prototype
  ↓ 人工确认 F：确认视觉方向
选择 productionMode
  ├─ narrated → 生成 TTS Script → 调用 TTS → 回传音频／字幕／Manifest → TTS 质检
  └─ visual-only → 跳过 TTS → 建立内容驱动时间轴
                                ↓
                         Remotion 正式实现
                                ↓
                      字幕、音频、动画同步
                                ↓
                         Studio／预览检查
                                ↓ 人工确认 G
                         GitHub 冒烟渲染
                                ↓ 人工确认 H
                         GitHub 完整渲染
                                ↓ 每 20 分钟检查
                      下载并验证最终 Artifact
                                ↓ 人工验收 I
```

## 4. 阶段和人工闸门

| 阶段 | 主要产物 | 人工确认内容 | 未通过时回退到 |
|---|---|---|---|
| Source | `source.md` | 原文完整、来源明确 | Source |
| Content Analysis | `content-analysis.md` | 核心命题、知识关系、取舍是否正确 | Content Analysis |
| Video Narrative | `video-narrative.md` | 讲述顺序和认知路径 | Video Narrative |
| Scene Script | `scene-script.md` | Scene 认知任务、Video Value、数量 | Scene Script |
| Narration Script | `narration-script.md` | 事实、措辞、口语感、术语读法 | Narration Script |
| Visual Script | `visual-script.md` | 声音与画面是否互补 | Visual Script 或 Scene Script |
| Visual Prototype | `visual-prototype.html` | 构图、信息密度、视觉事件和统一性 | Visual Script／Prototype |
| TTS 质检 | 音频、字幕、Manifest | 声音、发音、停顿、语速、字幕文本 | 指定 Segment 或 Narration Script |
| Remotion 预览 | 完整音画预览 | 字幕、音频、动画、溢出和节奏 | 配置／Scene／必要的生产资料 |
| 冒烟渲染 | 代表帧、短片 | Linux 字体、字幕层级、音轨和关键画面 | 渲染环境或 Remotion 实现 |
| 最终验收 | 完整 MP4 | 完整内容和成片质量 | 依据问题回退到对应阶段 |

Narration Script 一旦通过并交给 TTS，应视为冻结版本。若后续修改口播，只重新生成受影响的 Segment，并重新计算相应 Manifest 和后续时间线，避免无意中让旧音频、旧字幕和新文案混用。

## 5. Video 交给 TTS 的资料

TTS 不直接读取原始文章、Scene Script 或带制作备注的口播草稿。Video 项目先把已经确认的 Narration Script 整理为标准 TTS Script。

每个 Segment 至少包含：

| 字段 | 说明 |
|---|---|
| `videoSlug` | 视频唯一标识 |
| `sceneId` | 所属 Scene |
| `segmentId` | 固定句段 ID，例如 `03-02` |
| `order` | Scene 和 Segment 顺序 |
| `text` | 最终朗读文本，也是字幕文本源 |
| `voice` | 声音配置 |
| `rate` | 目标语速配置 |

基本约束：

- 一个 Segment 对应一句完整口播或一个不可继续拆分的短语。
- `segmentId` 从 TTS Script 一直保留到音频、字幕、Manifest 和 Remotion 动画引用。
- Markdown 标记、制作说明和不需要朗读的屏幕文字不得进入 `text`。
- 数字、英文产品名和技术词的读法应在送入 TTS 前确认。

## 6. TTS 回传给 Video 的资料

TTS 的目标不是只返回一条合并 MP3，而是返回可以驱动视频的完整声音时间资料。推荐结果包括：

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

其中：

- Segment MP3 用于独立替换和精确定位。
- Word Boundary 记录真实朗读边界，供字幕和视觉锚点使用。
- Subtitle Manifest 保存最终上屏 Cue。
- Audio Manifest 保存文件、文本和真实时长。
- Timeline Manifest 统一 Scene、Segment、音频、字幕和全局时间偏移。
- Generation Report 记录声音、语速、失败 Segment 和生成版本。

回传后先验证：

1. Scene 和 Segment 数量与 TTS Script 一致。
2. 每个 Manifest 引用的文件都存在。
3. 字幕文本与冻结口播一致，时间落在所属 Segment 内。
4. 最后一条字幕结束时间和音频总时长合理。
5. 没有重复 ID、缺失 ID、负时间或时间倒序。
6. 抽听开头、中段、结尾和包含技术词的 Segment。

## 7. 1.25 倍目标语速

优先在 TTS 生成阶段使用引擎原生的相对语速参数，让最终 MP3、Word Boundary、字幕时间和 Manifest 天然来自同一份声音。具体参数名称必须在实施前根据 TTS 项目的实际命令和引擎确认，不能只凭 Video 项目猜测。

如果 TTS 工具只能先生成正常速度音频，再做 1.25 倍后处理，则必须同时重算所有时间数据：

```text
新时间 = 原时间 ÷ 1.25
```

不能只加速 MP3 而保留原字幕和 Word Boundary。后处理还需要避免音高异常，并以处理后的文件重新读取真实时长。

这里的「1.25 倍」表示目标播放速度。若具体 TTS 引擎把相对语速写成百分比，通常对应 `+25%`，最终仍以该引擎实测结果为准。

## 8. Video 项目的资源落点

TTS 结果回传后，沿用当前项目三层结构：

```text
local/<video-slug>/
  保留 TTS 原始交付资料、报告和时间数据

public/local-assets/<video-slug>/
  保存 Remotion 运行时通过 staticFile() 读取的音频和字幕

src/videos/<video-slug>/generated/
  保存 Video 实际使用的 Audio、Subtitle 和 Timeline Manifest
```

接入 Remotion 时：

- 视频总时长跟随最终音频真实时长。
- Scene 起止点来自 Timeline Manifest，不使用预设总时长反推。
- 字幕使用全局顶层 overlay，并按帧边界判断 Cue。
- Scene 内旧的估算字幕必须关闭，避免出现双层字幕。
- 动画通过 Segment 的 Scene 局部偏移绑定语义事件，必要时允许小幅提前视觉入场。
- Linux 渲染前必须安装并校验 CJK 字体。

## 9. GitHub Actions 渲染流程

用户确认 Remotion 音画预览后，才允许进入远程渲染：

1. 确认 Composition ID、资源包、Manifest 和本次代码版本。
2. 运行本地类型检查和资源一致性检查。
3. 经用户授权后提交并推送需要远程渲染的版本。
4. 触发 `Smoke test video`。
5. 下载并检查代表帧和短片 Artifact。
6. 冒烟结果经人工确认后，触发 `Render full video`。
7. 记录 Workflow、Run ID、Commit SHA 和启动时间。
8. 立即检查一次运行状态，之后约每 20 分钟检查一次，直至成功、失败或取消。
9. 成功后下载最终 Artifact，并使用 `ffprobe` 验证分辨率、帧率、视频编码、音频编码、采样率、声道和总时长。
10. 将最终 MP4 交给用户验收。

当前 `.github/workflows/` 中的两条工作流已接收受控的 `video_slug` 和 `composition_id` 输入，资源包按 `assets/<video-slug>-assets.zip` 解析，音频数量从对应 Audio Manifest 自动读取，冒烟代表帧从 Timeline Manifest 的首个、中间和最后一个 Scene 自动选择，并取各 Scene 约 65% 的位置，确保主要视觉元素已有充分时间展开。当前仍需通过 `claude-code-api-config` 的真实 Run 验证这套参数化契约，验证前不能视为已完成通用渲染闭环。

## 10. 远程渲染失败回路

| 错误类型 | 处理方式 |
|---|---|
| TypeScript／构建错误 | 定位代码，修复并重新运行本地检查，再经授权推送和续跑 |
| 资源／Manifest 错误 | 检查缺失文件、路径、数量、ID 和时间数据，修复后续跑 |
| CJK 字体／Linux 环境错误 | 检查字体安装、`fc-match`、Chromium 和 Runner 日志 |
| GitHub 临时故障 | 先确认与代码无关，再重跑失败任务 |
| 外部服务器只提供模糊状态 | 暂停猜测，提示用户提供错误文本、截图或关键日志 |

修复后不能直接跳回完整渲染。凡改动可能影响画面、字幕、音频、资源或环境，都应重新通过本地检查和冒烟渲染，再进入完整渲染。

连续两轮没有获得新证据或有效进展时，停止盲目重试，说明已知结论、当前阻塞和需要用户补充的信息。

每 20 分钟轮询必须围绕已经记录的 Run ID，并依赖一个仍在执行的任务或后续监控机制。单次对话结束后不能假设 Agent 会永久在后台自行轮询。

## 11. 第一版实施边界

第一版只需要打通：

- 一条 `narrated` 视频。
- 已确认口播到 TTS Script 的交接。
- TTS 生成和回传 Segment 音频、字幕与 Manifest。
- 1.25 倍目标语速下的时间一致性。
- Video 项目导入资源并生成音频驱动的 Remotion 时间线。
- 人工预览确认。
- GitHub 冒烟、完整渲染、20 分钟检查和 Artifact 验证。

第一版暂不建设：

- 数据库和任务队列。
- 可视化流程后台。
- 多视频并发生产。
- 无人值守自动发布。
- 自动绕过人工确认。
- 复杂失败重试平台。

`visual-only` 分支先保留流程定义，等有真实无音频视频需求时再实施和验证。

## 12. 实施前待确认事项

1. TTS 项目的实际路径、规范文件和可调用方式。
2. TTS 的输入格式、输出目录、声音名称和 1.25 倍语速参数。
3. Video 与 TTS 是通过本地目录复制、命令调用还是其他接口交接。
4. GitHub Actions 的通用输入设计和音频资源打包方式。
5. 轮询 GitHub Run 的执行载体，以及失败后重新提交和触发所需的授权边界。
6. 第一条用于验证端到端流程的视频 slug 和 Composition ID。

以上信息确认并得到用户实施授权后，应先更新 `CLAUDE.md` 的第一阶段范围和工作流程，再修改代码、TTS 接口或 GitHub Actions。
