# ROADMAP.md

## 当前阶段

- `claude-code-api-config` 已通过 Gate 3；修正后的冒烟 Run `31790807181` 执行成功，Artifact 和媒体参数均通过校验，当前等待人工确认代表帧后进入完整渲染。
- `claude-code-install` 已接入真实音频、逐句字幕和 Manifest 时间轴，12 个 Scene 的 41 个主要视觉锚点也已绑定到 Segment 局部时间；GitHub 冒烟和完整 MP4 渲染均已通过并核验。
- 新视频 `claude-code-third-party-models` 已完成 Gate 1、Gate 2、TTS 资源接入和 Remotion 实现；Studio 已在 `http://localhost:3001` 构建，当前等待 Gate 3 视觉检查。
- `claude-code-third-party-models` 已修正通用对比组件误带参考视频文案的问题；`npm run check` 通过，Studio 已完成重建，等待 Gate 3 视觉检查。
- 字幕已改为顶层 overlay，Linux 渲染前强制校验 CJK 字体，音频已预挂载并按 Segment 驱动画面。
- 本机 Chromium 因旧版 macOS 返回 `SIGTRAP`，最终画面验证改由 GitHub Actions 完成。

## 已完成（最近 10 条）

- 2026-08-14：补充字幕生成规则；字幕去掉句末标点、保留句内标点，且不修改 TTS 朗读文本、音频或时间轴，已同步到项目规范与流程说明。
- 2026-08-14：完成 `claude-code-third-party-models` 的 Remotion Composition 接入；48 个音频轨道、156 条顶层字幕 Cue、9 个 Scene 和 396.192 秒时间轴均已接入，并移除不属于本片内容的通用顶部进度线。
- 2026-08-14：发现并定位 `ComparisonScene` 中残留的 `copy-paste loop`／“来回搬运上下文”固定文案；已改为由每个对比列显式提供本片相关的工作流标题和状态。
- 2026-08-14：完成 `claude-code-third-party-models` 的纯口播稿、Visual Script 和 9 Scene 横屏 Visual Prototype；口播正文、原型脚本、导航和幕内字幕结构均通过确定性检查。
- 2026-08-14：完成 `claude-code-third-party-models` 的 `tts-script.json`；9 个 Scene、48 个 Segment 与纯口播稿逐段一致，未包含视觉或制作说明。
- 2026-08-14：完成 `claude-code-third-party-models` 的 Source、Content Analysis、Video Narrative 和 Scene Script；9 个 Scene 已通过字段完整性、内容覆盖和基线结构检查。
- 2026-08-14：完成 `claude-code-api-config` 的第二次 GitHub 冒烟渲染；Run `31790807181` 的 17 个步骤全部成功，完整 Artifact 已通过摘要、图片规格和短片媒体参数校验。
- 2026-08-14：用户完成 `claude-code-api-config` 的 Studio 音画、字幕、节奏和溢出检查，Gate 3 通过，当前预览版本已冻结进入远程渲染。
- 2026-08-14：完成 GitHub Actions 渲染参数化和 `claude-code-api-config` 资源打包；两条工作流接收受控 slug／Composition 输入，音频数量由 Manifest 校验，冒烟代表帧由 Timeline 自动选择。
- 2026-08-14：完成 `claude-code-api-config` 的正确 TTS 资源接入；60 段音频和三份 Manifest 已同步到 Remotion 消费目录，12 个 Scene 的视觉项已按 Segment／Word Boundary 重新绑定，Studio 在 3001 端口构建通过。

## 进行中

- `claude-code-third-party-models` 的 Remotion Studio 已构建完成；等待检查字幕安全区、主文案密度、9 个 Scene 的状态变化和是否存在无关画面文字。
- `claude-code-api-config` 的第二次冒烟 Artifact 已下载并检查，等待用户确认代表帧；Scene 12 的下一条预告卡片与底部字幕区域有视觉叠放，需要用户决定是否接受。
- 根目录 `video-production-process-part-1.md` 正根据用户反馈逐段修订；本轮已完成从文章开头到「总结」的正文。
- `video-production-process-part-2.md` 至 `part-5.md` 已完成重写，等待用户整体审阅和反馈。
- 端到端视频生产流程已完成第一条试点的 TTS、Remotion 接入和 GitHub 工作流参数化；20 分钟轮询仍依赖当前会话或后续监控任务。

## 下一步

1. 用户确认 Run `31790807181` 的三张代表帧，并决定是否接受 Scene 12 预告卡片与字幕区域的视觉叠放。
2. 冒烟通过后触发完整 MP4 渲染，并围绕完整 Run ID 持续检查。
3. 下载最终 Artifact，使用 `ffprobe` 核验后进入 Gate 4。
4. 用户在 Studio 中完成 `claude-code-third-party-models` 的 Gate 3 视觉检查后，根据反馈调整生产资料、配置或场景组件。

## 阻塞

- 完整渲染正在等待 Smoke Render 人工确认；Scene 12 代表帧中，下一条预告卡片的下部区域与字幕胶囊发生视觉叠放。
- `claude-code-third-party-models` 的本机浏览器画面检查仍受旧版 macOS Chromium `SIGTRAP` 影响；Studio 服务已构建并运行，需在可访问 Studio 的环境完成人工画面检查。
- 当前 macOS 上 Remotion Chromium 启动即因旧系统返回 `SIGTRAP`，无法在本机生成 still／MP4；当前视频必须由 GitHub Actions 完成冒烟和最终画面验证。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- narrated 视频 TTS 默认使用 `+25%` 语速；生成前显式校验 TTS 参数，字幕和时间轴必须基于加速后的实际音频重新生成。当前 `claude-code-third-party-models` 的 `+0%` 资源保持不变。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一查阅 `docs/video-production-notes.md`，不在 Roadmap 重复记录。

## 最近验证（最近 10 条）

- 2026-08-14：新视频 `claude-code-third-party-models` 的 `tts-script.json` 与临时确定性生成结果一致；9 个 Scene、48 个 Segment、ID 唯一且无空文本，未包含内部制作文字。
- 2026-08-14：新视频 `claude-code-third-party-models` 的音频、词边界、字幕和时间轴通过一致性校验；48 个 MP3、48 个 Timing、156 条 Cue、396.192 秒总时长和所有公共资源路径均有效。
- 2026-08-14：新视频 `claude-code-third-party-models` 通过 `npm run check`；Remotion bundle 构建完成，Studio 服务在 3001 端口报告 `Built`。
- 2026-08-14：移除 `claude-code-third-party-models` 的通用顶部进度线后再次通过 `npm run check`，Studio 监听到修改并重新构建成功。
- 2026-08-14：移除 `ComparisonScene` 中的参考视频固定文案，第三方模型各对比列改用本片相关工作流标题和状态；`npm run check` 通过，Studio 重建成功。
- 2026-08-14：新视频 `claude-code-third-party-models` 的原文副本与指定源文件字节一致；Narrative 9 段与 Scene 09 个一一对应，每个 Scene 的 9 个必需字段均完整，未提前生成 Gate 2 文件。
- 2026-08-14：GitHub 冒烟 Run `31790807181` 的 17 个步骤全部成功；Artifact `9215404477` 的 SHA-256 与 GitHub 元数据一致，三张代表帧为 1920×1080，短片为 H.264＋AAC、30fps、48kHz 双声道、10.048 秒；首、中、末 Scene 的主要视觉元素均已展开，Scene 12 发现预告卡片与字幕区域视觉叠放，等待人工判断。
- 2026-08-14：GitHub 冒烟 Run `31790003590` 的 17 个步骤全部成功；Artifact SHA-256 一致，三张图片为 1920×1080，短片为 H.264＋AAC、30fps、48kHz 双声道、10.048 秒；人工检查确认字体和字幕正常，但中间与最后代表帧取样过早，需修正后重跑。
- 2026-08-14：用户人工确认 `claude-code-api-config` 的 Studio 预览没有问题，Gate 3 通过；本次确认覆盖音画同步、字幕、动画节奏、信息密度和文字溢出。
- 2026-08-14：参数化渲染工作流通过 YAML 语法检查；资源包包含 60 个 MP3 和 14 个字幕文件且压缩完整，Timeline 自动选出的冒烟帧为 30、3374、6534；Node.js `v22.21.0` 和 `npm run check` 通过。
- 2026-08-14：`claude-code-api-config` 使用 Node.js `v22.21.0` 通过 `npm run check`；12 个 Scene、60 个音频资源、111 条字幕 Cue、256.248 秒 Timeline 和 `+25%` 语速通过资源校验，Remotion Studio 在 3001 端口完成构建。
- 2026-08-14：验证 `claude-code-api-config` 的 12 个 Scene、60 个 MP3、60 个 Timing、111 条字幕 Cue、SRT／VTT 和 Timeline；所有 ID、文件、文本、时间、`+25%` 语速和 256.248 秒总时长一致，MP3 实际时长与 Manifest 差值为 0，TTS 与 Video 回传目录文件完全一致。
