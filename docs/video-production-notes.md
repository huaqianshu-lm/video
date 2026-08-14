# 视频制作问题与流程沉淀

本文档记录 Remotion AI Video MVP 制作过程中遇到的问题、根因、解决方案和可复用流程。后续制作新视频、排查问题或写教程文章时，先看这里。

## 记录规则

每条记录尽量包含：

- 问题现象：用户或预览中看到什么。
- 根因判断：问题来自脚本、音频、字幕、场景时长、Remotion 配置还是渲染环境。
- 解决方案：这次怎么解决。
- 以后流程：下次如何提前避免。
- 教程素材：可以写进文章的经验总结。

## 2026-08-14：字幕 Cue 切分必须保留原文中的边界空格

### 问题现象

`claude-code-api-config` 的 `08-04` 原文包含 `API 密钥`。字幕生成器恰好在 `API` 与 `密钥` 之间切分 Cue，并对每条 Cue 调用 `.strip()`，导致两条 Cue 拼接后变成 `API密钥`，不再与冻结版 TTS Script 逐字一致。

### 处理方式

1. Cue 文本直接保留原文切片，不再删除切分边界上的空格。
2. 重新生成 Subtitle Manifest、SRT、VTT 和 Timeline Manifest。
3. 对全部 Segment 执行 `Cue 文本按顺序拼接 === tts-script.json text` 校验，不只检查 Cue 数量和时间。

### 以后流程

字幕确定性校验必须同时覆盖文本、时间和来源关系。对于中英文混排内容，尤其要检查英文缩写与中文之间的空格是否在 Cue 切分时丢失；任何 Segment 拼接不一致都应阻止回传和 Remotion 接入。

## 2026-08-14：跨项目调用 TTS 要使用 TTS 项目的虚拟环境，并允许按 Segment 恢复

### 问题现象

Video 项目把口播稿交给独立 TTS 项目后，使用系统 `python3` 调用音频生成脚本时提示未安装 `edge-tts`；切换到 TTS 项目自带的 `.venv/bin/python` 后，生成过程中又可能因外部 TTS 连接重置而在某个 Segment 中断。

### 处理方式

1. 不安装或修改系统 Python，优先检查并使用 TTS 项目自己的虚拟环境。
2. 使用 TTS 脚本的稳定 `segmentId` 和跳过已有产物能力，从失败 Segment 继续生成。
3. 单 Segment 重试时避免立即重建完整 Manifest；等所有 Segment 完成后，再统一生成 `audio-manifest.json`、字幕 Manifest 和 Timeline Manifest。
4. 生成完成后同时校验音频、Timing、字幕 Cue、总时长、语速参数和跨项目 Manifest 副本。

### 以后流程

跨项目 TTS 的实际调用顺序固定为：

```text
Video narration-script.md → TTS tts-script.json → TTS .venv/bin/python → Segment 音频／Timing → 字幕／Timeline → Video 资源回传
```

网络连接重置只重试受影响的 Segment，不重复生成已通过校验的音频；如果 TTS 项目不支持跳过和幂等，不能直接把它接入自动化流程。

## 2026-08-06：总结卡片需要早于口播开始入场

当视觉卡片使用约半秒的淡入和上移动画，并且把动画起点直接绑定到对应音频 Segment 起点时，观众会感知到卡片滞后于口播。此时不应改动音频或字幕时间轴，而应让视觉锚点提前一小段时间入场。本片 Scene 12 的四张总结卡片统一提前 0.4 秒，保留动画完成时间，同时让关键词出现时卡片已经基本可见。

另外，视觉锚点必须按卡片语义绑定 Segment，不能只按顺序跳过中间的口播段。本幕四张卡片对应 `12-03`、`12-04`、`12-05`、`12-06`；如果从第二张开始误绑定到下一段，卡片就会等对应说明音频结束后才出现。标题还下移 28px，避开画面顶部的全局进度条。

## 2026-08-05：无音频 Remotion 版只能作为视觉实现中间态

### 问题现象

`claude-code-install` 的 Visual Prototype 已确认，但人工音频和逐句 SRT 尚未准备好，仍然需要先把 12 个 Scene 接入 Remotion 并验证 Composition 能构建。

### 处理方式

1. 配置中保留与口播稿一致的 `caption` 数组，让场景组件先按正常口播估算时长。
2. 使用 `estimateSceneDurationSeconds` 计算静音版本的场景时长，先验证布局、Scene 类型和主视觉动作。
3. 暂不写入 `audioTracks`、真实 `subtitleCues` 或 `public/local-assets/<video-slug>/` 音频资源。

### 以后流程

这类无音频配置不能直接视为最终时间轴。拿到人工音频和逐句 SRT 后，应保留 Scene 内容和组件映射，改用音频真实时长、SRT Cue 和统一帧边界反推 Scene 起止时间，再接入音频驱动的关键视觉事件。

## 2026-08-06：TTS 资源复制要区分原始资料、可播放资源和 Manifest

### 处理方式

`how-to-install/video-assets` 已生成结构化的 12 个 Scene、76 段 MP3、逐句字幕和统一时间轴。复制到 Video 项目时分成三层：

1. `local/claude-code-install/` 保留音频、字幕、Timing 和上游 Manifest 的原始资料。
2. `public/local-assets/claude-code-install/` 提供 Remotion 运行时通过 `staticFile()` 读取的音频和字幕文件。
3. `src/videos/claude-code-install/generated/` 保存供 TypeScript 消费的 `audio-manifest.json`、`subtitle-manifest.json` 和 `timeline-manifest.json`。

### 以后流程

复制完成后先按 Timeline Manifest 检查每个 `audioFile` 和 `subtitleFile` 是否存在，再接入 `video.config.ts`；不要只复制 `captions.srt` 或只复制 Manifest，否则无法保证 Scene、音频和字幕能够使用同一时间源。

## 2026-08-06：真实音频接入后要关闭旧的场景内估算字幕

### 问题现象

`claude-code-install` 原本由通用场景组件按 `caption` 数组显示估算字幕。接入逐句 Subtitle Manifest 后，如果直接叠加全局 `TimedCaption`，同一时间会出现两层字幕，且两层文案和切换时间并不一致。

### 处理方式

1. 在音频时间轴中记录每个 Segment 的绝对起点，Scene 时长按 `round(offset × fps)` 的帧边界计算，避免 Scene、音频和字幕分别累计取整。
2. 通过 `Audio` 的 `Sequence` 接入 76 段 MP3，每段提前 2 秒 `premount`，并使用 `pauseWhenBuffering` 降低连续短音频漏掉开头的风险。
3. 将 Subtitle Manifest 展开为全局 `TimedCaption`；每个 Segment 的第一条 Cue 从 Segment 边界开始，抵消源文件为音频启动预留的 100ms。
4. 给基础 Scene 增加可选的 `showCaption` 开关；音频版关闭旧字幕，静音或未接入全局字幕的视频仍保留默认行为。
5. 视觉事件不使用全片绝对秒数直接传入 Scene，而是从 Manifest 查询对应 Segment 的 Scene 局部偏移；这样 `Sequence` 内的局部帧和旁白 Segment 能保持同一坐标系。

### 以后流程

有逐句字幕时，场景内 `caption` 只作为无音频视觉版的备用文案，不应与真实字幕同时渲染。接入后先检查 Scene、Segment、Cue 数量和所有静态资源路径，再进入 Studio 逐幕检查音画同步。

## 2026-08-02：字幕必须使用独立顶层图层并在渲染前校验 CJK 字体

### 问题现象

修复后的视频仍出现中文乱码和字幕不可见，单靠修改字体列表和字幕时间判断无法证明最终 MP4 已经生效。

### 根因判断

字幕虽然有 269 条有效 Cue，但原实现把字幕作为普通绝对定位节点叠加在场景树上，缺少明确的全屏顶层层级；渲染环境也没有在执行前确认 CJK 字体实际可用。本机 Remotion Chromium 还因旧版 macOS 以 `SIGTRAP` 启动失败，因此不能把 TypeScript 检查当作渲染验证。

### 本次处理方式

1. 将字幕包进 `AbsoluteFill` 顶层 overlay，设置 `zIndex: 1000`，避免被场景画面覆盖。
2. 字体顺序改为优先 `Noto Sans CJK SC` 和 `PingFang SC`，字幕背景提高不透明度，保证渲染后可读。
3. GitHub Actions 渲染前安装并用 `fc-match` 强制校验 `Noto Sans CJK SC`，字体缺失时直接失败，不再产出乱码视频。
4. 校验 Manifest 仍为 14 个 Scene、166 段音频和 269 条字幕 Cue。

### 以后流程

渲染问题必须分成三层验证：Manifest 数据存在 → 字体和素材环境存在 → still／MP4 画面可见。`npm run check` 只能证明第一层代码可编译，不能替代后两层。

完整视频渲染前先运行独立的 `Smoke test video` 工作流：渲染开头、Scene 边界和后半段的 3 张代表帧，再渲染前 10 秒短片。人工确认中文字形、字幕层级、音频和字幕切换后，才运行 `Render full video`，避免用 40 分钟全片渲染做基础问题排查。

## 2026-08-02：短音频开头丢字与长场景动画提前结束要分层排查

### 问题现象

按 Segment 接入 166 段短 MP3 后，Studio 预览中每段音频像是漏掉开头两三个词；同时，原静音样片的动画仍在场景开始后的固定几秒内播放完，后续几十秒旁白只能停在最终画面。

### 根因判断

音频问题不在 TTS 源文件：166 个 Word Boundary 文件全部包含首词，首词时间均为 0.1 秒；对 166 个源 MP3 做静音检测后，最大前置静音约为 0.21 秒。代码中也没有音量淡入。实际风险来自短音频在开始帧才挂载，Studio 连续播放时需要临时加载和解码，可能错过媒体开头。

画面问题来自时间模型不一致：Scene 已被真实旁白扩展到 18～77 秒，但组件内部仍使用静音样片阶段的固定帧触发值，所以动画会在前几秒集中结束。

### 本次处理方式

1. 每个音频 Sequence 提前 2 秒预挂载，并开启播放缓冲等待，让媒体在真正起点前完成准备。
2. 保持 Timeline Manifest 为 Scene、音频和字幕的统一时间源。
3. 新增 Segment 帧查询工具，让 14 个 Scene 的复制、搜索、修改、测试、判断、分工和总结等关键视觉事件在对应旁白 Segment 开始时触发。
4. 最后一幕仍在最后一句口播结束后保留 3 秒静默思考时间，不用提前出现最终总结来填满旁白。

### 以后流程

遇到音频开头丢字时，按以下顺序判断：

```text
检查 Word Boundary 首词 → 检查 MP3 前置静音 → 检查 volume／fade → 检查媒体预挂载与缓冲
```

音频驱动画面不要再使用脱离语义的固定帧。应把关键视觉事件直接绑定到 Segment ID；只有同一 Segment 内部的微动画，才使用少量相对帧偏移。同一个 Segment 内连续口播了多个独立视觉项时，不要重新均匀估算时间，应使用该 Segment 返回的 Word Boundary，把每个视觉项绑定到对应关键词的局部起点。

## 2026-08-02：按 Segment 交付的 TTS 应直接驱动 Remotion 时间线

### 问题现象

新版横屏视频已经完成 14 个 Scene 的静音视觉实现，而独立 TTS 项目输出的是 166 个逐句 MP3、逐 Segment 时间信息、269 条字幕 Cue 和完整 Scene Offset。如果先把音频手工合并，再重新解析一遍 SRT，会丢失已经生成好的 Scene／Segment 对齐关系。

### 结论

当 TTS 项目已经提供结构化 Timeline Manifest 和 Subtitle Manifest 时，应把它们作为 Remotion 的唯一时间源：Scene Offset 决定画面边界，Segment Offset 决定音频起点，Subtitle Cue 决定字幕显示。总 SRT／VTT只作为通用交付和人工检查文件，不再反向推导内部时间线。

### 本次处理方式

1. 保留 TTS 项目中的生成产物作为上游源文件。
2. 将逐句 MP3 复制到 `public/local-assets/<video-slug>/`，由 `staticFile()` 读取。
3. 将 Timeline／Subtitle Manifest 同步到视频源码，生成 Scene 时长、音轨 Sequence 和全局字幕 Cue。
4. 所有秒数在同一个 30fps 边界上统一换算为帧，避免 Scene、Audio 和字幕分别累计取整。
5. 最后一幕在口播结束后额外保留 3 秒静默画面，满足总结阅读后的思考停留。

### 以后流程

```text
Narration Script → TTS Segment → Audio／Subtitle Manifest → Remotion Scene／Audio／Caption
```

接入后先验证 Scene、Segment、Cue 数量和资源路径，再进入 Studio 逐幕检查动画语义点；Manifest 接入通过不等于动画同步已经完成。

## 2026-07-30：横屏静态视觉预览先行

### 问题现象

`claude-code-what-is` 已接近 195 秒，内容是在解释 Claude Code 的定位、工作方式和工程协作边界。继续按 9:16 竖屏短视频优化，代码、文件树、terminal、三栏工具对比都会受限。同时，直接修改 Remotion 配置和组件再进 Studio 预览，试错成本高，容易反复返工。

### 结论

这类工具教程更适合先按 B 站 / YouTube 的 16:9 横屏教程视频设计。正式写 Remotion 前，应先用低成本静态视觉预览确认画面语言、横屏构图、信息密度和状态变化。

推荐流程调整为：

```text
设计规范 → Storyboard → 横屏静态视觉预览 → 用户确认 → Remotion 横屏实现 → Studio 预览 → 渲染
```

### 本次处理方式

本次没有继续修改正式 Remotion 视频逻辑，而是：

1. 更新 `CLAUDE.md`，把当前阶段改为 16:9 横屏静态视觉预览先行。
2. 更新 `VIDEO-DESIGN-PRINCIPLES.md` 和 `STORYBOARD-SPEC.md`，在 Storyboard 和 Remotion 实现之间加入静态视觉预览确认 gate。
3. 新增 `previews/claude-code-what-is/index.html`，用无依赖 HTML + CSS 生成 9 个横屏静态 Scene board。
4. 更新 `ROADMAP.md`，把进行中和待办切换到等待用户确认静态预览。

### 以后流程

当视频表达方向不确定、用户反馈「像 PPT」或平台尺寸需要重定时，不要直接继续改 Remotion：

```text
先停 Remotion 实现 → 用 HTML/CSS 或图片做静态视觉预览 → 确认方向 → 再写正式视频
```

执行要点：

1. 静态预览只确认构图、视觉事件、屏幕文字和状态变化，不追求动画细节。
2. HTML 预览优先无依赖单文件，避免引入新工具链。
3. 预览文件放在 `previews/<video-slug>/index.html`，不要放进 `local/` 或 `public/local-assets/`。
4. 用户确认静态预览前，不批量修改 `src/` 下的 Remotion 实现。
5. 静态预览确认后，再把布局、字号、安全区和动画说明翻译成 Remotion 组件。

## 2026-07-30：先用两个验证场景摆脱动态 PPT

### 问题现象

`claude-code-what-is` 从 6 个大段重排为 9 个视觉事件 Scene 后，结构更清楚，但画面仍然主要是标题、卡片、列表和标签出现，本质上还是更细的动态 PPT。

### 结论

只改 `video.config.ts` 的场景切分和文案，不足以让教程视频变成真正的视频表达。要产生本质区别，核心场景必须从「解释概念」改成「演示过程」：让观众看到文件树、代码窗口、diff、terminal 输出、检查结果和人工 review 状态。

### 本次处理方式

本次没有一次性重做全部 9 个 Scene，而是先改两个验证场景：

1. `project-definition`：从概念卡片改成 mock IDE 项目工作区，展示读取脚本、映射场景、修改配置、运行检查。
2. `human-review-gate`：从责任链说明改成 terminal 执行日志，展示读取项目、更新配置、运行检查、打开预览、等待人工 review。

### 以后流程

当用户反馈「像 PPT」时，不要继续只调卡片样式或场景数量。先选 1-2 个核心场景做过程演示试点：

```text
选择试点 Scene → mock IDE / terminal 演示 → 预览确认表达成立 → 再迁移其他 Scene
```

执行要点：

1. 优先选择最能体现真实任务的场景，不必拘泥于前两个场景。
2. 画面必须出现状态变化，例如 reading、editing、checking、waiting for review。
3. 代码行、文件树和 terminal 输出要少而具体，避免竖屏不可读。
4. 试点未确认前，不批量重做其他场景。

## 2026-07-30：改画面结构不一定要重做音频和 SRT

### 问题现象

`claude-code-what-is` 的 Storyboard 从 6 个大段重排为 9 个视觉事件 Scene 后，现有音频和 SRT 是基于上一版画面结构制作的，容易误判为必须重新录音或重新导出字幕。

### 结论

如果口播文案和字幕句子没有改，音频和 SRT 仍然是有效时间轴。需要重做的是视频 Scene 切分和画面配置，不是音频和字幕文件。

但实现时不能硬套新版 Storyboard 里的理想秒点，而要按现有 SRT 的句子结束点微调 Scene 边界，避免画面在一句话中间切走。

### 本次处理方式

本次没有改口播、音频和 SRT，只把 `claude-code-what-is` 的 Remotion scenes 从 6 个大段重排为 9 个视觉事件 Scene：

```text
Opening question → Project definition → Chat copy-paste → Claude project execution → Real task workflow → Human review gate → Same task three tools → Final memory → Next preview
```

关键处理：

1. S01 不硬切在 Storyboard 草案的 16.0 秒，而是切到约 17.5 秒，覆盖「Claude Code 到底是什么」句末。
2. S05 画面改成 `Fix login error` 连续任务，但步骤吸收原口播里的理解项目、解释函数、跨文件修改、修 bug、补测试、清 lint、写文档等能力点。
3. S07 用同一任务对比 ChatGPT、Copilot 和 Claude Code，同时承接原口播里的工具类比和使用判断。
4. 短预告 Scene 使用 `SummaryScene`，不使用 `TerminalScene`，避免终端打字动画在 3 秒左右的短场景里启动过晚。

### 以后流程

当用户反馈「画面要重排」时，先判断有没有改口播：

- 只改画面表达、Scene 数量或组件配置：复用音频和 SRT，按字幕边界重切 Scene。
- 改口播文本、删减句子、调整讲述顺序：先重做音频和 SRT，再实现画面。

不要因为 Scene 数量变化就默认重做音频；真正决定音频是否可复用的是口播文本和字幕顺序是否变化。


### 问题现象

`claude-code-what-is` 接入正式口播、字幕和按场景时长分布动画后，画面仍然偏「文字卡片 + 读字幕」。观众能看到几种场景变化，但很多信息仍只是把口播内容换成了屏幕文字，没有充分体现视频媒介的优势。

### 结论

教程类视频不能只把脚本文案搬到画面上。更有效的做法是把抽象句子转成观众能看懂的操作画面、界面状态和流程反馈。

例如：

1. 讲到 ChatGPT、Copilot、Cursor、Claude Code 时，不只显示名字，而是显示它们的角色差异和能力标签。
2. 讲到「读代码」时，用文件树、代码窗口、扫描高亮表达读项目。
3. 讲到「改文件」时，用 diff 行、绿色新增标记表达修改已经落到文件里。
4. 讲到「跑命令」时，用终端命令、检查状态 chip 表达执行过程。
5. 讲到「人把关」时，用责任链卡片表达人负责方向和验收，AI 负责分析和执行。

### 当前项目处理状态

当前已新增轻量视觉基础组件，并在 6 个既有场景内补充语义化画面：

- `OpeningScene`：工具特征卡，区分 ChatGPT、Copilot、Cursor 和 Claude Code。
- `ConceptScene`：模拟项目工作区，展示读代码、改文件、跑命令、做验证。
- `ComparisonScene`：左右工作流对比，展示复制粘贴循环 vs 项目内连续执行。
- `StepListScene`：工程任务看板和每步小预览。
- `TerminalScene`：终端执行加人机责任链。
- `SummaryScene`：三张角色类比卡收束总结。

### 以后流程

后续制作同类教程视频时，脚本定稿后增加一次「语义画面拆解」：

```text
逐句口播 → 抽取动作词和对象 → 设计 mock UI / 流程 / 状态反馈 → 写入 video.config.ts → 场景组件渲染
```

执行原则：

1. 优先用自绘 mock UI、流程线、状态标签和代码/终端片段表达，不默认找外部图片。
2. 外部图片和 logo 只有在用户提供或确认版权后再使用，并放进本地静态目录，不远程热链。
3. 画面增强服务于口播语义，不为了热闹堆装饰元素。
4. 每个场景保留一个主视觉动作，避免信息太密导致字幕、主标题和卡片互相抢注意力。
5. 配置里写语义内容，组件里写通用渲染逻辑，方便后续自然语言反馈优先改配置。

## 2026-07-29：音频驱动长场景不要继续使用固定帧动画

### 问题现象

接入约 195.8 秒正式口播后，部分场景变成长场景，但组件内部动画仍沿用早期无音频短样片的固定帧触发方式。例如步骤列表、终端输出、总结 bullet 都在场景开始几秒内全部出现，后续口播仍在继续，画面却已经静止。

### 结论

音频驱动视频里，场景内部动画不能只写固定帧偏移。固定帧适合短技术 spike，但不适合后续根据音频和 SRT 反推出来的长场景。

更稳妥的做法是：

1. 用 `scene.durationSeconds` 作为场景动画的时间基础。
2. 给标题、主要元素和结尾分别保留时间窗口。
3. 列表项、终端输出、总结 bullet 等元素按场景时长分布出现。
4. 场景时长变长时，动画节奏自动拉开；场景时长变短时，动画仍保持紧凑。

### 当前项目处理状态

当前已新增通用分布式 reveal 时间工具，并把 6 个场景组件的主要元素从固定帧动画改成按场景时长分布，重点解决 `workflow`、`terminal`、`summary` 场景动画过早结束的问题。

## 2026-07-29：多段音频要先统一成一条连续时间轴

### 问题现象

本次用户提供的 `claude-code-what-is` 正式口播音频不是一条文件，而是两段顺序音频：

- `local/assets/claude-code-what-is/audio/1.mp3`
- `local/assets/claude-code-what-is/audio/2.mp3`

字幕文件是一份总 SRT：

- `local/assets/claude-code-what-is/subtitles/subtitle.srt`

### 结论

Remotion 预览时不要把两段音频当成两个独立视频处理，也不要手工重新拼成一个必须提交的音频文件。更稳妥的做法是：

1. 保留 `local/` 下的原始音频和字幕。
2. 复制一份到 `public/local-assets/<video-slug>/`，供 Remotion 预览读取。
3. 在视频配置中按文件名自然顺序声明多段音频。
4. 用前面音频的累计时长作为后面音频的开始时间。
5. Composition 总时长取场景总时长、音频总时长、字幕最后结束时间三者最大值。

### 当前项目处理状态

当前 `claude-code-what-is` 已按两段音频接入：

- 第 1 段音频约 140.976 秒。
- 第 2 段音频约 54.840 秒。
- 两段合计约 195.816 秒。
- SRT 最后一条结束在约 195.466 秒。

后续制作新视频时，如果口播被拆成多段导出，优先复用这个「多段音频 → 连续时间轴」流程，而不是先手工合并音频再写配置。

## 2026-07-29：剪映文字朗读存在单次 500 字符限制

### 问题现象

剪映文字朗读单次可输入文本不能超过 500 字符。如果把完整口播稿一次性复制进去，会超过限制，无法直接导出一条完整音频。

### 结论

不要为了适配 500 字符限制随意截断句子。应把逐句口播稿按场景或语义段拆成多个短片段，每段控制在 300～450 字符更稳，再在剪映时间线上顺序生成和拼接音频。

### 推荐流程

```text
逐句口播稿 → 按语义拆成多个 ≤500 字符的剪映朗读片段 → 分段生成音频 → 时间线顺序拼接 → 导出完整音频和字幕
```

执行要点：

1. 分段只改变复制输入方式，不改口播文案本身。
2. 每段不要贴近 500 字符上限，保留工具统计误差空间。
3. 分段边界优先放在场景切换、语义转折或总结句之后。
4. 在剪映中每段单独生成文字朗读，再按顺序放到同一条时间线上。
5. 最终仍导出一条完整音频和字幕文件，供 Remotion 反推场景时长。

### 当前项目处理状态

当前已新增 `local/claude-code-what-is-jianying-voiceover-parts.md`，把 `claude-code-what-is` 的剪映朗读文本拆成 8 个语义片段，每段均控制在 500 字符以内。

## 2026-07-29：视频时长控制分为有明确口播和无明确口播两种流程

### 结论

后续制作视频时，不能只写一个统一的「估算场景时长」流程，需要先判断视频是否有明确口播。

- **有明确口播的视频**：以音频和逐句字幕时间轴作为时间源，用它们反推场景时长。
- **无明确口播的视频**：沿用原始内容驱动方案，按画面内容、字幕阅读或口播估算节奏、必要停顿和动画入场时间估算场景时长。

### 有明确口播的视频流程

```text
脚本文案 → 音频 → 逐句字幕时间轴 → 反推场景时长 → 生成视频配置
```

执行要点：

1. 先确认最终口播文案。
2. 用同一份文案生成或录制音频。
3. 制作逐句字幕时间轴，最好一条字幕对应一句讲解。
4. 用字幕时间轴确定每个场景的起止点。
5. 视频总时长跟随音频真实时长。
6. `video.config.ts` 只负责承接已经确定的时间轴，不再用预设场景时长硬配音频和字幕。

### 无明确口播的视频流程

```text
脚本文案 → 拆场景 → 按内容和字幕阅读节奏估算时长 → 生成视频配置
```

执行要点：

1. 按画面内容和字幕阅读节奏估算每个场景时长。
2. 保证主要文字、列表、终端输出等元素有足够入场和阅读时间。
3. 场景尾部只保留必要停顿。
4. 如果整体时长不合适，优先调整文案信息密度，而不是硬拉静止画面或压缩正常讲解节奏。

### 以后流程

制作新视频进入视频结构配置前，先做一次判断：

- 如果这条视频有明确口播、音频或计划生成音频，必须优先走音频驱动流程。
- 如果这条视频没有明确口播，只是字幕型、图文型或概念预览型视频，才走原始估算流程。

这个区分已经同步到 `CLAUDE.md` 和 `docs/video-production-workflow.md`。

## 2026-07-29：字幕与音频从第二个场景开始逐渐不同步

### 问题现象

在 `claude-code-what-is` 样片接入 `local/audio.mp3` 和 `local/subtitle.srt` 后，Remotion Studio 预览中出现字幕与音频不同步：

- 第一个场景基本可接受。
- 从第二个场景开始，字幕有些落后于音频。
- 后续只能按场景逐段提前字幕时间，效率低。

相关文件：

- `local/audio.mp3`
- `local/subtitle.srt`
- `src/videos/claude-code-what-is/video.config.ts`
- `src/videos/claude-code-what-is/ClaudeCodeWhatIsVideo.tsx`

### 结论

这次主要不是 Remotion 音频和视频起点没对上，而是 `local/subtitle.srt` 不适合直接作为逐句字幕时间轴。

音频在视频中通过 Remotion `Audio` 从第 0 帧开始播放：

```tsx
<Audio src={staticFile(videoConfig.audio.src)} />
```

视频配置中的音频路径和时长也覆盖完整音频：

```ts
audio: {
  src: 'local-assets/claude-code-what-is/audio.mp3',
  durationSeconds: 72.8,
}
```

真正的问题是：SRT 是粗粒度长段字幕，而最终上屏字幕是干净的逐句讲解字幕，两者不是一一对应关系。

### 根因 1：SRT 不是逐句字幕，而是长段字幕

当前 `local/subtitle.srt` 只有 7 条字幕，而视频实际使用的是 18 句讲解字幕。

例如 SRT 第 2 条：

```text
00:00:06,000 --> 00:00:17,920
or到底有什么区别先别把它当成另一个聊天框更准确地说它是一个能进项目里干活的AI编码
搭档你可以把它理解成一个运行在项目里的AI助手它不是只给建议而是能读取文件理解代码再
```

这一条同时包含：

- 第一幕第一句的后半截。
- 第一幕第二句。
- 第一幕第三句。
- 第二幕第一句。
- 第二幕第二句的前半截。

所以它不能直接映射成视频里的某一句字幕。后续手工拆成 18 条 `subtitleCues` 时，只能估算每句话在长段中的位置，误差会从前往后累积。

### 根因 2：SRT 文本识别质量不稳定

SRT 中存在明显断词和识别错误，例如：

```text
C la u de Co de
C ur s
or
c lu b co
de
```

这说明它更像是剪映自动识别生成的粗字幕结果，不是人工校准后的字幕文件。它的文本不能直接上屏，时间码也不能被视为逐句级精准时间码。

本次因此采用了「干净讲解文案作为上屏字幕，SRT 只作为时间参考」的做法。这个做法能保证字幕文字质量，但会带来时间映射误差。

### 根因 3：场景边界、音频语义边界、字幕时间边界没有统一生成

视频按 6 个场景切换：

- OpeningScene
- ConceptScene
- ComparisonScene
- StepListScene
- TerminalScene
- SummaryScene

但音频中的自然句并不一定刚好落在场景切换点上。当前全局字幕 `subtitleCues` 又独立于场景组件渲染。

如果先有场景时长，再接音频和 SRT，就会出现三个时间源：

1. 场景 `durationSeconds`。
2. 音频真实语句时间。
3. SRT 粗时间码。

三者没有统一来源，就容易出现「前面看起来还可以，后面越来越偏」的问题。

### 本次解决方式

本次没有改组件结构，也没有改视频总时长，而是只在 `video.config.ts` 中微调 `subtitleCues`：

- 第一阶段先把第三句开始的字幕整体提前，解决第二个场景明显落后。
- 用户确认第二个场景后，再按用户反馈逐场景微调后续场景。
- 每次只改一个场景的字幕时间，避免破坏前面已经确认的同步效果。
- 每次修改后运行 `npm run check`，确保 TypeScript 配置仍然合法。

这种方式适合当前样片救急，但不适合视频场景变多后的长期流程。

### 以后推荐流程

后续制作带音频的视频，时间源应该按下面顺序生成：

```text
脚本文案 → 音频 → 逐句字幕时间轴 → 反推场景时长 → 生成视频配置
```

不要采用：

```text
先定场景时长 → 再接音频 → 再人工调字幕
```

具体执行建议：

1. **先确定逐句讲解文案**
   - 每一句就是最终上屏的一条字幕。
   - 脚本文档中保留句子编号。

2. **生成音频时尽量保持句子边界**
   - 用同一份逐句文案生成音频。
   - 避免在剪映或其他工具中把多个句子合并成一条长字幕。

3. **导出或制作逐句字幕文件**
   - 理想状态：一条 SRT = 一句讲解。
   - 如果工具只能导出粗 SRT，需要先拆分和校准，不能直接导入配置。

4. **先检查字幕质量，再写入 Remotion 配置**
   - 检查字幕条数是否接近脚本文案句数。
   - 检查单条字幕是否过长，例如超过 6～7 秒。
   - 检查是否有异常断词，例如 `C la u de`。
   - 检查是否一条字幕跨多个场景。
   - 检查最后字幕结束时间和音频总时长差距是否合理。

5. **用字幕时间反推场景时长**
   - 场景开始和结束优先跟随该场景第一句和最后一句字幕。
   - 场景尾部只保留必要停顿。
   - 不要为了预设总时长硬拉静止画面。

6. **只让人工确认高风险位置**
   - 自动检查通过后，再让用户重点看：场景切换点、英文词、长句、结尾。
   - 避免每个场景都从头听一遍调一次。

### 后续可补的工具能力

为了避免重复手工调字幕，可以补一个轻量工具，不做复杂自动字幕对齐，只做质量检查和配置辅助。

建议工具输入：

- `scripts/<video-slug>.md`
- `local/subtitle.srt`
- 可选：音频时长

建议工具输出：

- 字幕条数与脚本句数对比。
- 每条字幕时长统计。
- 疑似异常断词列表。
- 疑似跨场景字幕列表。
- 最后一条字幕结束时间与音频时长差距。
- 可人工校准的 `subtitleCues` 初稿。

第一版可以只生成报告，不自动改代码。

### 教程文章可提炼的观点

可以写成教程文章里的经验：

1. 做 AI 视频时，最重要的不是先做画面，而是先统一时间源。
2. 逐句脚本、音频、字幕、场景时长必须来自同一套结构。
3. 自动识别 SRT 只能作为参考，不能默认就是可用的逐句时间轴。
4. 如果字幕文件只有几条长段字幕，后面再手工拆成很多句，必然产生同步误差。
5. 正确流程是用音频和逐句字幕反推画面节奏，而不是先定画面节奏再硬配音频。
6. 对教程类短视频来说，字幕质量检查应该前置，否则后期逐场景微调会非常浪费时间。

### 当前项目处理状态

当前 `claude-code-what-is` 已通过人工反馈逐场景微调 `subtitleCues`，但这属于样片救急方案。后续制作第二条视频前，应优先按本文档的推荐流程准备逐句字幕时间轴。
## 2026-08-06：GitHub Actions 远程渲染带音频视频

### 问题

本机 Chromium 因旧版 macOS 返回 `SIGTRAP`，无法可靠生成最终 still 或 MP4；同时 `local/` 和 `public/local-assets/` 按项目规则不提交到 Git。

### 解决方案

1. 将当前视频需要的 `public/local-assets/<video-slug>/` 打包为 `assets/<video-slug>-assets.zip`，只把压缩包提交到仓库。
2. GitHub Actions 解压资源后，先运行 `npm run check` 和资源数量校验，再执行冒烟工作流。
3. 冒烟工作流先渲染 3 张代表帧和前 10 秒短片；确认分辨率、字幕、字体和音频轨正常后，再触发完整渲染。
4. 完整渲染结束后，从 Artifact 下载 MP4，并用 `ffprobe` 核对分辨率、帧率、视频编码、音频编码、采样率、声道和总时长。

### 本次结果

`claude-code-install` 的冒烟 Run `31066848943` 和完整 Run `31067176077` 均成功。最终 MP4 为 1920×1080、30fps、H.264 + AAC、48kHz 双声道，时长约 365.782 秒。

## 2026-08-02：Linux 渲染中文变方框，字幕边界帧偶尔空白

### 问题现象

渲染视频中的中文主文案显示为方框，部分字幕看起来没有出现。

### 根因

渲染 Runner 不保证安装中文字体，浏览器找不到 CJK 字形时会把中文显示为 tofu 方框。字幕时间轴的 Cue 本身连续，没有真实空档；但 SRT 小数秒落在视频帧之间，直接用浮点秒数判断会让边界帧短暂返回空节点。

### 解决方案

1. 场景和字幕统一使用带 CJK fallback 的字体栈。
2. GitHub Actions 渲染前安装 `fonts-noto-cjk`，让 Linux Runner 具备稳定中文字体。
3. 每个 Segment 的首条字幕从 Segment 起点开始显示，避免音频启动预留的 100ms 在 166 个 Segment 间重复形成空档。
4. `TimedCaption` 改为按 30fps 帧边界判断 Cue，并提升字幕层级，避免边界空白和被场景内容遮挡。

### 以后流程

渲染包含中文的视频前，先确认执行环境具备 CJK 字体；接入逐句字幕后，同时检查 Cue 的连续性和按帧映射后的覆盖情况。

## 2026-08-14：显式视觉展开时间必须匹配画面元素数量

### 问题现象

Remotion Studio 报错：`Expected 3 explicit reveal times, received 1`。

### 根因

`visualRevealSeconds` 会直接传给场景组件的 `getDistributedRevealFrames`，它要求时间数组长度等于该组件实际渲染的元素数量。例如 `OpeningScene` 有 3 张卡片，`StepListScene` 有多个步骤，`TerminalScene` 有多条输出；不能直接把 1～2 个音频 Segment 起点当成全部画面元素的展开时间。

### 解决方案

1. 只有显式时间点数量与场景画面元素数量完全一致时，才传入 `visualRevealSeconds`。
2. 数量不一致时省略显式时间点，让场景组件按自己的场景时长自动均匀展开。
3. 如果以后需要精确绑定，应先为每个视觉元素建立独立的机器可读视觉锚点，再生成与元素数量严格匹配的时间数组。

## 2026-08-14：Narration Script 不能直接作为 TTS 输入

### 问题现象

`claude-code-api-config` 的字幕中出现了“本段口播作用：”等制作内部文字。原因是把包含口播作用说明和 Gate 检查清单的整份 `narration-script.md` 直接交给 TTS 项目解析，TTS 将这些内容生成了音频和字幕。

### 根因

项目既有流程明确区分 `Narration Script` 和 `TTS Script`。`narration-script.md` 是面向人工确认的口播文档，`tts-script.json` 才是交给 TTS 的清理后、机器可读输入。本次错误跳过了独立的 TTS Script 派生步骤；TTS 解析器按 Scene 下的非空段落处理，无法替制作人员判断哪些文字“不应该朗读”。

### 固定规则

1. `narration-script.md` 的每个 Scene 下只能保留实际口播；“本段口播作用”、视觉说明、制作备注和 Gate 检查清单不能放入 Scene 口播正文。
2. Gate 2 通过后，先生成独立的 `tts-script.json`，再调用 TTS；不能把整份制作说明 Markdown 直接交给 TTS。

## 2026-08-14：GitHub 渲染工作流应从 Manifest 派生校验和冒烟帧

### 问题现象

早期 GitHub Actions 工作流把视频 slug、Composition ID、资源包路径、音频数量和三张代表帧全部写死为 `claude-code-install`。制作下一条视频时，即使 Remotion 已经完成，直接触发仍会渲染旧视频。

### 处理方式

1. 冒烟和完整渲染工作流只接收经过格式校验的 `video_slug` 与 `composition_id`。
2. 资源包固定使用 `assets/<video-slug>-assets.zip`，解压到 `public/local-assets/`。
3. 预期音频数量从 `src/videos/<video-slug>/generated/audio-manifest.json` 自动统计，不再维护人工数字。
4. 冒烟代表帧从 Timeline Manifest 的首个、中间和最后一个 Scene 自动选择，避免每条视频手工计算固定帧。
5. Artifact 名称和最终 MP4 路径统一由 `video_slug` 派生。

### 以后流程

每条新视频进入远程渲染前，只需要确认 slug、Composition ID、资源压缩包和三份 Manifest 一致。首次参数化后仍必须用真实 Run 验证工作流；冒烟 Artifact 未通过人工检查前，不能触发完整渲染。
3. 调用 TTS 前检查 `tts-script.json` 的 Segment 文本，只允许实际口播内容；检查通过后，音频、字幕和时间轴必须由同一份 TTS Script 派生。
4. 参考 `videos/claude-code-what-is/narration-script.md` 的格式，不新增“口播作用”这类夹在口播正文中的内部标注。

### 以后流程

```text
narration-script.md（纯口播、人工确认）
  → tts-script.json（拆 Segment、清理文本、机器校验）
  → TTS 音频／字幕／时间轴
  → Video 项目回传与质检
```

## 2026-08-14：Visual Script 与 Visual Prototype 必须逐 Scene 对照

### 检查规则

Gate 2 检查 `Visual Script` 和 `Visual Prototype` 时，不能只检查 Scene 数量。还要逐 Scene 对照：

1. Scene 编号、标题和顺序一致。
2. Visual Script 中承诺的主要状态变化，在 Prototype 中有对应的可见表达；如果 Prototype 只是静态结构，不能把未实现的动作当成已验证动画。
3. Visual Script 中列出的屏幕文字、别名和辅助标签，要么在 Prototype 中出现，要么从 Visual Script 删除，避免两个文档表达不同设计。
4. Prototype 中每个 Scene 自带的 `.caption` 只是静态原型中的字幕效果预览，不是最终 TTS 字幕，不能把它当成字幕产物。
5. Gate 检查结论应进入审查记录或流程状态，不要用它替代 Visual Script 中面向后续实现的全片标准和下一步说明。

## 2026-08-14：新视频必须复用已验证的同名生产资料模板

### 问题现象

`claude-code-api-config` 的主题内容虽然成立，但 Gate 2 三份资料被重新设计成另一套格式：Narration Script 在每幕口播后加入“本段口播作用”和 Gate 检查，Visual Script 改成编号章节和简化 Scene 模板，Visual Prototype 也改用了另一套 Scene 容器、固定字幕区和编号按钮。结果是 TTS 输入边界失效，Visual Script 与 Prototype 也出现状态和标签不对应。

### 根因

误把“根据新原文生成内容”理解成“为新视频重新设计制作资料”。项目真正需要验证的是已有方法能否复用和打通；新主题只改变每层承载的内容，不自动授权改变文档格式、描述粒度、视觉语言和上下游契约。

### 固定规则

1. 在没有确认新基线前，以 `videos/claude-code-what-is/` 中的同名文件作为格式和交付基线。
2. 新视频允许改变 Scene 数量、主题知识和具体视觉对象，但不自行改写七层资料的职责和模板。
3. Gate 2 至少对照 Narration Script、Visual Script 和 Visual Prototype 的结构、Scene 顺序、幕内信息和交互方式。
4. 基线无法覆盖时先停下来说明缺口，获得确认后再扩展，不能边生成边发明新模板。

### 以后流程

```text
读取新原文
  → 打开基线目录中的同名文件
  → 保留模板和交付边界
  → 替换并重组新主题内容
  → 同名文件逐项回归对照
  → 进入人工 Gate
```
