# 视频端到端生产流程方案

> 状态：日常生产链路已调整为 Gate 3 后直接完整渲染；Smoke Render 仅作为新系列或渲染环境变化时的独立手动环境检查。本文继续作为人工确认闸门、Video 与 TTS 交付契约、远程渲染回路和无音频分支的实施依据。

## 1. 目标

输入一份源文档后，由 Video 项目按照当前 Workflow Profile 分阶段生成视频资料。`narrated-tutorial-v1` 在口播和视觉方案确认后，将标准化的 TTS Script 交给独立 TTS 项目；TTS 生成 1.25 倍目标语速的音频、字幕和时间数据并回传，Video 项目再以真实声音时间轴完成 Remotion 音画同步。`product-promo-v1` 不生成口播、TTS 或字幕，改用 Asset Manifest 和 Visual Timeline 驱动视觉节奏。两类视频在 Gate 3 预览确认后都进入 GitHub Actions 完整渲染，并持续检查远程任务直到成功或需要用户补充外部错误信息。Smoke Render 不再是每条视频的必经步骤。

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

两种模式在 Remotion 实现、人工预览和完整渲染阶段重新汇合；必要时再单独运行 Smoke Render 检查渲染环境。

当前 Harness 将这两种能力落到两个明确的 Workflow Profile：`narrated-tutorial-v1` 对应 `narrated`，`product-promo-v1` 对应视觉节奏驱动的无口播宣传片。通用 `productionMode: visual-only` 只作为未来其他无音频需求的概念描述；新增实际生产流程时，必须先按 Workflow Registry 接入清单定义独立阶段和产物，不能仅设置一个模式字段绕过契约。

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
                         GitHub 完整渲染
                                ↓ 每 20 分钟检查
                      下载并验证最终 Artifact
                                ↓ 人工验收 H
```

独立环境检查（按需）

```text
新系列首次渲染／渲染环境变化
              ↓
选择未完成视频或独立副本，准备并校验独立输入包
              ↓
GitHub Actions 手动触发 Smoke test video
              ↓
查看代表帧、短片和 Artifact；不写 Harness 阶段、审核或 Job
```

### 3.1 `product-promo-v1` 实际流程

```text
产品资料
  ↓
Promo Brief → Creative Concept → Scene Storyboard
  ↓
Visual Script → Motion Prototype
  ↓ Gate 2：人工确认创意、素材和原型
Asset Preparation → Visual Timeline
  ↓
Remotion 正式实现
  ↓ Gate 3：人工确认预览和清洁画面
GitHub Actions 完整渲染
  ↓
下载并验证 Artifact
  ↓ Gate 4：人工验收最终 MP4
完成
```

宣传片的时间基准是 `visual-timeline.json`，默认 20～30 秒、1920×1080、30fps；Remotion 配置必须从当前 Timeline 的精确相对路径导入，并由 `TotalDurationFrames` 直接返回其 `durationInFrames`，禁止硬编码时长或注释式引用。音乐／音效可选，但所有资源必须在 Asset Manifest 中声明并从本地输入包读取。宣传片不创建或伪造 `narration-script.md`、`tts-script.json`、Audio／Subtitle／narrated Timeline Manifest、MP3、VTT 或 SRT。

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
| 完整渲染 | 完整 MP4 Artifact | 远程构建、资源、音轨和最终文件生成 | 渲染环境或 Remotion 实现 |
| 最终验收 | 完整 MP4 | 完整内容和成片质量 | 依据问题回退到对应阶段 |

`product-promo-v1` 的阶段与人工闸门如下：

| 阶段 | 主要产物 | 人工确认内容 | 未通过时回退到 |
|---|---|---|---|
| Promo Brief | `promo-brief.md` | 受众、一个传播目标、核心价值、证据和 CTA | Source／Promo Brief |
| Creative Concept | `creative-concept.md` | 视觉表达机制、节奏和素材路线 | Promo Brief／Concept |
| Scene Storyboard | `scene-script.md` | 4～6 个 Scene、每幕单一任务和 Video Value | Scene Storyboard |
| Visual Script | `visual-script.md` | 视觉事件、屏幕文字来源和素材使用 | Visual Script／Scene Storyboard |
| Motion Prototype | `motion-prototype.html` | 统一外壳、构图、运动语言和信息密度 | Visual Script／Prototype |
| Gate 2 | 无新增文件 | 创意、关键素材、授权风险和原型 | Visual Script |
| Asset Preparation | `asset-manifest.json` | 资源文件、来源、授权和 Scene 关联 | Gate 2 |
| Visual Timeline | `visual-timeline.json` | Scene／Beat／Transition 连续性和可读停留时间 | Asset Preparation |
| Remotion | 配置、主组件、`remotion-alignment.json` | 兑现冻结原型和 Visual Timeline | Visual Timeline |
| Gate 3 | Studio 预览 | 节奏、清洁画面、品牌和 CTA | Remotion |
| 完整渲染 | 完整 MP4 Artifact | Runner、资源和文件生成 | Gate 3 |
| Gate 4 | 人工审查记录 | 最终 MP4 内容、画幅、时长、授权和 CTA | Render |

Smoke Render 不在此表的生产阶段中。它是按需的独立环境检查，检查结果不能替代 Gate 3 或 Gate 4，也不改变视频当前阶段。

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
| `text` | 最终朗读文本；字幕由此派生，但上屏前去掉句末标点，保留句内标点 |
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
3. 字幕文本按句末标点清理规则与冻结口播一致，时间落在所属 Segment 内。
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

不同 Workflow 的具体资料都保持在本地忽略目录；只有资源和运行时结构被 Workflow 声明并通过输入包传递。两类资料落点如下：

| Workflow | 内容资料 | Remotion 配置／组件 | 资源归档 |
|---|---|---|---|
| `narrated-tutorial-v1` | `videos/<slug>/` | `src/videos/<slug>/` | `assets/<slug>-assets.zip` |
| `product-promo-v1` | `videos/product-promo/<slug>/` | `src/videos/product-promo/<slug>/` | `assets/product-promo/<slug>-assets.zip` |

`narrated-tutorial-v1` 的 TTS 结果回传后，沿用当前项目三层结构：

```text
local/<video-slug>/
  保留 TTS 原始交付资料、报告和时间数据

public/local-assets/<video-slug>/
  保存 Remotion 运行时通过 staticFile() 读取的音频和字幕

src/videos/<video-slug>/generated/
  保存 Video 实际使用的 Audio、Subtitle 和 Timeline Manifest
```

`product-promo-v1` 不生成上述 narrated 目录下的音频、字幕和 Timeline Manifest；它在同一 Workflow 的内容目录保存 `asset-manifest.json` 和 `visual-timeline.json`，音乐／音效作为 Asset Manifest 中的可选本地资源引用。

接入 Remotion 时：

- 视频总时长跟随最终音频真实时长。
- Scene 起止点来自 Timeline Manifest，不使用预设总时长反推。
- 字幕使用全局顶层 overlay，并按帧边界判断 Cue。
- Scene 内旧的估算字幕必须关闭，避免出现双层字幕。
- 动画通过 Segment 的 Scene 局部偏移绑定语义事件，必要时允许小幅提前视觉入场。
- Linux 渲染前必须安装并校验 CJK 字体。

## 9. GitHub Actions 渲染流程

用户确认 Remotion 音画预览后，才允许进入完整远程渲染：

1. 确认 Composition ID、资源包、Manifest 和本次代码版本。
2. 运行本地类型检查和资源一致性检查。
3. 经用户明确确认后，只定向提交并推送需要完整渲染的版本。

Remotion 制作、Gate 3 和 Studio 预览必须使用同一个视频输入版本：Agent 只写当前视频目录的配置、组件和对齐清单，Harness 在产物校验通过后从独立输入包生成被忽略的 `src/RenderInputRoot.tsx`。宣传片还必须验证配置对当前 `visual-timeline.json` 的精确导入和 `TotalDurationFrames` 时长派生。受跟踪的 `src/Root.tsx` 只注册通用模板，不作为具体视频入口或校验回退；输入包清单中的组件、配置和 Composition ID 发生变化时，必须重新准备并校验。

输入包的 `render-input.json` 必须声明包内除 Manifest 外的全部实际文件；路径必须是安全的 POSIX 相对路径，不能重复、越界、指向目录、符号链接或其他特殊文件。每个文件的大小和 SHA-256 必须与实际内容一致，按排序后的路径和文件字节重算的 `packageFingerprint` 必须与 Manifest 一致。单视频临时入口只能写当前工作区的 `src/RenderInputRoot.tsx`。

Git 交付确认的 `planId` 同时绑定当前分支、提交、精确文件快照，以及视频 slug、Composition ID、输入包 URL、归档 SHA-256、`packageFingerprint` 和交付记录哈希；必要文件缺失、删除、重命名、类型变化或清单变化时，必须在 `git add` 前重新确认。

4. 触发 `Render full video`。
5. 记录 Workflow、`dispatchId`、Run ID、Run API URL、Run 页面 URL、Commit SHA 和启动时间；正常派发优先使用 `return_run_details: true` 返回的准确 Run ID。
6. 立即检查一次运行状态，之后约每 20 分钟检查一次，直至成功、失败或取消。
7. 成功后下载最终 Artifact，并使用 `ffprobe` 验证分辨率、帧率、视频编码、音频编码、采样率、声道和总时长。
8. 将最终 MP4 交给用户进行 Gate 4 验收。

如果是新系列首次渲染，或字体、Runner、依赖和资源链路发生变化，应在独立视频或副本上额外手动触发 `Smoke test video`。手动输入为 `video_slug`、`composition_id`、`dispatch_id`、`render_input_url` 和 `render_input_sha256`；该 Run 只用于环境判断，不推进 Harness，也不写审核记录。

当前 `.github/workflows/` 中的两条工作流已接收受控的 `video_slug`、`composition_id` 和 `dispatch_id` 输入，使用 `${{ inputs.video_slug }} / ${{ inputs.dispatch_id }}` 作为 Run 名称；Runner 从输入包的 Workflow Registry 解析资源归档、Source、Remotion、Manifest 和时间轴路径：narrated 使用 Audio／Subtitle／Timeline Manifest，promo 使用 Asset Manifest／Visual Timeline，不为 promo 伪造 narrated 文件。冒烟代表帧按对应时间轴选择，确保主要视觉元素已有充分时间展开。流程收口后，Workflow 还必须使用该视频已绑定的输入包 URL／SHA-256；本地自动化契约已验证，真实远程 Run 和 Artifact／Gate 4 仍需在用户确认精确交付清单后单独验收。

## 10. 远程渲染失败回路

| 错误类型 | 处理方式 |
|---|---|
| TypeScript／构建错误 | 定位代码，修复并重新运行本地检查，再经授权推送和续跑 |
| 资源／Manifest 错误 | 检查缺失文件、路径、数量、ID 和时间数据，修复后续跑 |
| CJK 字体／Linux 环境错误 | 检查字体安装、`fc-match`、Chromium 和 Runner 日志 |
| GitHub 临时故障 | 先确认与代码无关，再重跑失败任务 |
| 外部服务器只提供模糊状态 | 暂停猜测，提示用户提供错误文本、截图或关键日志 |

修复后应重新通过本地检查再进入完整渲染。只有改动涉及渲染环境、依赖、字体、Runner 或资源链路时，才需要额外运行独立 Smoke Render；内容或 Remotion 修复不自动增加 Smoke 阶段。

连续两轮没有获得新证据或有效进展时，停止盲目重试，说明已知结论、当前阻塞和需要用户补充的信息。请求已经发出但无法确认 Run 时，恢复只能按同一个 `dispatchId` 查找；零匹配保持 `waiting-run`，多匹配进入 `remote-dispatch-ambiguous`，超出有界窗口进入 `remote-dispatch-uncertain`，不得按最新 Run 猜测或重新派发。

每 20 分钟轮询必须围绕已经记录的 Run ID，并依赖一个仍在执行的任务或后续监控机制。单次对话结束后不能假设 Agent 会永久在后台自行轮询。

## 11. 第一版实施边界

当前工程已打通两套 Workflow 的通用编排和输入包契约；第一条 narrated 流程已有历史验证。`product-promo-v1` 已通过 `huaqianshu-site-promo` 的真实端到端试点验证，完成产品资料、宣传片资料、Asset Manifest、Visual Timeline、Remotion、Gate 2、Gate 3、GitHub Actions 完整渲染、Artifact 校验和 Gate 4 人工验收，项目已进入永久只读的 `completed`。

现有 `narrated-tutorial-v1` 继续保留：

- 已确认口播到 TTS Script 的交接。
- TTS 生成和回传 Segment 音频、字幕与 Manifest。
- 1.25 倍目标语速下的时间一致性。
- 以真实音频驱动的 Remotion 时间线、人工预览、GitHub 完整渲染和 Artifact 验证。

新系列或渲染环境变化时，可另外执行一次 GitHub Actions 独立 Smoke Render 环境检查。

第一版暂不建设：

- 数据库和任务队列。
- 可视化流程后台。
- 多视频并发生产。
- 无人值守自动发布。
- 自动绕过人工确认。
- 复杂失败重试平台。

其他 `visual-only` 需求仍不因本次宣传片实现而自动获得 Workflow 资格；如果它与 `product-promo-v1` 的产品宣传语义、阶段或产物不同，必须按新 Workflow 接入清单单独定义和验证。

## 12. 实施前待确认事项

1. 第一条 `product-promo-v1` 试点的产品资料、目标受众、核心价值和 CTA。
2. Logo、品牌色／字体、产品截图或录屏、音乐／音效及其授权范围。
3. 首条宣传片的 video slug、Composition ID、Style 和本地资源路径。
4. Gate 2 对创意、素材和 Motion Prototype 的人工确认。
5. Gate 3 对 Studio 预览的人工确认。
6. 如需远程 Render，受控输入包托管地址、目标分支和用户明确确认的精确交付文件清单。

以上信息确认后，才能创建真实的宣传片项目并进入 Gate 2 之后的生产；不得用占位资料、空资源或自动 Gate 记录代替这些输入。TTS 项目的配置只对 narrated Workflow 生效。
