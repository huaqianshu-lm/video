# ROADMAP.md

## 长期产品目标

- 将已验证的 AI 视频生产流程逐步产品化为专门的视频生产 Harness，最终支持其他人安装、配置和使用。
- Harness 只覆盖视频生产，不扩展为通用任务平台；后续工作优先沉淀流程编排、状态记录、校验、人工 Gate、重试、断点续做和工具适配能力。

## 当前阶段

- Harness 0.4 已完成本地实现、测试和推送，PR #3 已合并到 `main`（`5fcefb89`）；Harness 0.5 已在 `feat/video-harness-v0.5` 完成本地实现、全量测试和文档收尾，待提交推送，不改现有视频内容。
- Harness Web UI 第一版已合入待处理视频集成分支；53 个视频项目按原文件序号 01–53 展示和排序，目录索引已补齐，项目卡片以完整项目名称为主信息，项目列表、详情、资料和 Visual Prototype 预览人工回归通过。
- 新视频 `remotion-video` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `glossary` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止，未生成 TTS 或 Remotion 资料。
- 新视频 `troubleshooting` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档与指定文章字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `voice` 已完成七层生产资料、Gate 1、Gate 2 和 12 Scene 横屏 Visual Prototype；源文档字节一致，按任务边界停止在原型阶段，未生成 TTS 或 Remotion 资料。
- 新视频 `claude-code-how-it-works` 已通过 GitHub Smoke Render 和完整 Render；Run `32360625092` 成功，最终 MP4 已完成 Gate 4 人工确认。
- `claude-code-coding-plan`、`claude-code-third-party-models` 已进入 Gate 3 视觉检查，分别关注场景节奏、字幕安全区、文字溢出和清洁输出。
- 新视频 `vscode` 和 `claude-code-first-run` 已完成 TTS、字幕／Timeline、Remotion 接入及完整 GitHub Actions Render，最终 MP4 均通过用户 Gate 4 人工验收。
- Harness 0.5 已完成远程配置预检、GitHub Actions 分阶段监控、持久化任务、重启恢复、重复 dispatch 防护、CLI／Web UI 状态展示及 30 项全量测试。

## 已完成（最近 10 条）

- 2026-08-21：`vscode` Scene 01 将“右上角”口播绑定到编辑器顶部实际入口位置，并增加缺失态红色定位框与出现态蓝绿色高亮。
- 2026-08-21：将 `vscode` Scene 01、02、04、05、06、07、08、09 统一改为 VSCode 模拟工作区，突出各幕当前操作重点；Scene 03 保留为独立扩展市场素材场景。
- 2026-08-21：完成 `vscode` 的 `tts-script.json`、`+25%` TTS、117 条字幕 Cue、262.464 秒 Timeline 和独立 Remotion Composition；9 个 Scene、音频／字幕／时间轴 ID 对齐，未执行渲染。
- 2026-08-21：重排 Harness Web UI 项目卡片；序号／类型／状态置于顶部，项目名称独占完整宽度并取消截断，按钮保持紧凑，未修改视频内容。
- 2026-08-21：增大 Harness Web UI 的视觉原型预览区域至 820px，并让 iframe 填满容器，便于查看完整原型页面，未修改视频内容。
- 2026-08-21：为 Harness Web UI 增加原文件序号索引；项目 API、卡片、详情页和 `videos/VIDEO-INDEX.md` 均按 01–53 对齐，未修改视频目录名称和内容。
- 2026-08-21：完成 Harness Web UI 与待处理视频生产基线的集成；动态只读回归覆盖 53 个视频项目，23 个 Harness 测试、TypeScript、脚本语法和差异检查通过，未修改 `videos/` 或 `src/videos/`。
- 2026-08-20：Harness 0.1 完成独立目录契约、阶段状态模型、产物清单、`init`／`status` CLI、真实 GitHub Actions 适配器和 Smoke Render 验收；临时目录语法、自动化测试和远程样本验证通过，未修改现有视频内容。
- 2026-08-20：逐一核对 `claude-code-how-it-works` 全部 12 个 Scene 的字幕区间与视觉事件；将固定帧／百分比动画改为对应字幕 Cue 驱动，确认视觉事件顺序与 Scene 边界一致，未修改其他视频。
- 2026-08-20：根据 `claude-code-how-it-works` 截图反馈，修复 Scene 05 在字幕结束边界因帧取整误差产生的透明白屏；仅调整目标视频的 Scene 帧区间连续性。
- 2026-08-20：根据 `claude-code-how-it-works` 的原型与 Remotion 画面不一致反馈，新增目标视频专用动态场景实现；补齐终端逐行打印、工具选择、循环回路、进度冻结、排队指令和安全结构等原型效果，未修改共享场景组件与其他视频。
- 2026-08-20：根据 `claude-code-how-it-works` Gate 3 截图反馈，修复 Scene 12 的顶部标题安全区、四列总结卡片、独立定位的下一篇预告和目标视频字幕下边距；未改变其他视频的默认场景布局。
- 2026-08-20：完成新视频 `claude-code-how-it-works` 的 TTS 与 Remotion 接入；27 个 Segment 以 `+25%` 生成音频和 Timing，产生 107 条字幕 Cue、228.168 秒 Timeline，并完成独立 Composition 注册与类型检查。
- 2026-08-20：完成新视频 `remotion-video` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `glossary` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `troubleshooting` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `best-practices` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 11 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成新视频 `capstone-project` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。
- 2026-08-20：完成 `voice` 的完整 Source 副本、Content Analysis、Video Narrative、Scene Script、Narration Script、Visual Script 和 12 Scene 横屏 Visual Prototype；源文档字节一致，Gate 1／Gate 2、Scene 对齐、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未生成 TTS 或 Remotion 资料。

## 进行中

- `claude-code-coding-plan` 已完成 Gate 2 和 Remotion 接入；Scene 03 的三张付费卡片已提前到对应口播前约 1.2 秒，等待 Gate 3 视觉检查。
- `claude-code-third-party-models` 的 Remotion Studio 已构建完成；等待检查字幕安全区、主文案密度、9 个 Scene 的状态变化和是否存在无关画面文字。
- `claude-code-api-config` 的第二次冒烟 Artifact 已下载并检查，等待用户确认代表帧；Scene 12 的下一条预告卡片与底部字幕区域有视觉叠放，需要用户决定是否接受。

## 下一步

1. 提交并推送 Harness 0.5 分支；合并前不触发现实视频渲染。
2. 由用户决定是否进行一次受控真实 GitHub Actions 任务监控验收；不自动触发远程渲染。

## 阻塞

- 当前 macOS 上 Remotion Chromium 启动即因旧系统返回 `SIGTRAP`，无法在本机生成 still／MP4；需要本机画面复核的视频必须使用可访问 Studio／Chromium 的环境。
- `claude-code-third-party-models` 的本机浏览器画面检查仍受旧版 macOS Chromium `SIGTRAP` 影响；Studio 服务已构建并运行，需在可访问 Studio 的环境完成人工画面检查。
- 当前 macOS 上 Remotion Chromium 启动即因旧系统返回 `SIGTRAP`，无法在本机生成 still／MP4；当前视频必须由 GitHub Actions 完成冒烟和最终画面验证。
- `claude-code-coding-plan` 的本机浏览器画面检查可能受旧版 macOS Chromium `SIGTRAP` 影响；Studio 构建已通过，需在可访问 Studio 的环境完成人工 Gate 3。

## 关键避坑

- TypeScript 保持 `~5.8.3`；TypeScript 7 与当前 Remotion bundler 不兼容。
- CSS Grid 内的软件界面区域要使用 `minmax(0, 1fr)`，子项配合 `minHeight: 0`，避免内容最小高度把 Terminal 等区域挤出并裁切。
- 延迟动画传给 `spring()` 的帧数不能为负数。
- 总结画面要预留读完文字后的 2～3 秒思考时间，并使用足够不透明的背景避免后方内容干扰。
- narrated 视频 TTS 默认使用 `+25%` 语速；生成前显式校验 TTS 参数，字幕和时间轴必须基于加速后的实际音频重新生成。当前 `claude-code-third-party-models` 的 `+0%` 资源保持不变。
- Linux 渲染必须安装并校验 CJK 字体；字幕必须放在明确的顶层 overlay；字幕 Cue 应按帧边界判断，不直接依赖浮点秒数。
- 字幕、音频、场景节奏和 Remotion 配置的完整经验统一查阅 `docs/video-production-notes.md`，不在 Roadmap 重复记录。
- 画面文字必须能追溯到当前视频生产资料；预览导航、调试标记和辅助说明不得进入最终 MP4，具体检查要求见 `CLAUDE.md` 和 `docs/video-production-notes.md`。
- 新视频口播必须在生成阶段按独立视频表达，禁止把原始材料作为口播叙事对象；来源指代检查必须在派生 `tts-script.json` 前完成，已完成视频不回溯修改。
- Web UI 提交远程任务前必须确认 GitHub Actions 适配器所需环境变量已配置；缺少 Token 时应在提交前给出明确配置提示，不应创建一个立即失败的远程任务。
- 远程渲染完成后，Agent 只检查 GitHub Actions Run 结论和 Artifact 是否存在、非空、未过期；Artifact 下载、视频播放和最终 Gate 4 内容检查由用户完成。

## 最近验证（最近 10 条）

- 2026-08-23：Web UI 人工回归通过；53 个项目的模块内容、项目状态、详情、资料和 Visual Prototype 预览均能正常显示。
- 2026-08-23：`vscode` 和 `claude-code-first-run` 最终 MP4 通过用户人工验收，内容、声音、字幕和清洁输出无问题，Gate 4 完成。
- 2026-08-23：Harness 0.5 全量回归通过 30 项测试；53 个视频项目只读检查、Web 服务/API、配置预检、远程任务恢复和 Artifact 验证均通过，视频目录无改动。

- 2026-08-21：`vscode` 完整 Render Run `32496527485` 和 `claude-code-first-run` 完整 Render Run `32496531865` 均为 `success`；Artifact 分别为 12,153,238 和 14,683,118 bytes，均未过期。
- 2026-08-21：`vscode` Scene 01 右上角定位标识改动通过 `npm run check` 和 `git diff --check`；本机 Chromium 仍无法完成实际画面复核，Gate 3 保持未通过。
- 2026-08-21：`vscode` 8 个模拟工作区场景改动通过 `npm run check` 和 `git diff --check`；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核，Gate 3 保持未通过。
- 2026-08-21：`vscode` 的 TTS／字幕／Timeline／Remotion 确定性回归通过；9 个 Scene、9 个 Segment、117 条字幕 Cue、262.464 秒 Timeline、资源路径和连续 30fps Scene 边界均有效，Composition 已注册。
- 2026-08-21：视觉原型预览区域已由固定 620px iframe 调整为 820px 容器并填满显示；`npm run check`、`git diff --check` 和 Harness 23/23 回归测试通过，运行中的 Web UI 已返回新 CSS。
- 2026-08-21：当前 Web UI 服务已提供项目卡片新布局；序号回归仍通过，live API 返回 53 条项目，序号连续且唯一为 01–53，视频目录前后哈希一致。
- 2026-08-21：集成后的 Web UI 健康接口返回正常，项目列表发现 53 条视频项目；`claude-code-how-it-works` 详情包含 15 个阶段，只有 `claude-code-api-config` 存在 Harness 状态记录。
- 2026-08-20：Harness 对 `claude-code-first-run`、`claude-code-coding-plan` 和 `claude-code-third-party-models` 的只读结构与产物回归全部通过；必要产物齐全、Scene／Segment／字幕／Timeline 对齐，三条目标视频目录前后哈希一致。
- 2026-08-20：Harness 对 `claude-code-how-it-works` 的只读结构与产物回归通过；Source 至 Remotion 所需产物全部存在，12 个 Scene、27 个 TTS／音频 Segment、107 条字幕 Cue、12 个时间轴 Scene 和 228.168 秒 Timeline 对齐，目标视频目录前后哈希一致。
- 2026-08-20：`claude-code-how-it-works` 完整 Render Run `32360625092` 成功；Artifact MP4 为 1920×1080、30fps、H.264＋AAC、228.224 秒，完整性检查和开头／中段／结尾代表帧核验通过，用户确认最终视频无问题。
- 2026-08-20：Harness 真实 GitHub Actions 适配器已成功触发 `smoke-test-video.yml` 和 `render-video.yml`，受控输入为 `claude-code-how-it-works`，Run 与 Artifact 均可被识别并返回。
- 2026-08-20：GitHub Smoke Render Run `32358631515` 成功；三张代表帧为 1920×1080，首 10 秒短片为 H.264＋AAC、30fps、48kHz 双声道、10.048 秒，画面文字、场景结构和清洁输出核验通过。
- 2026-08-20：`claude-code-how-it-works` 12 个 Scene 的字幕 Cue 驱动视觉节奏回归通过；视觉事件映射无越界、顺序无回退，Scene 边界为连续 `0-481-930-1517-2105-2519-3047-3644-4235-4819-5535-6047-6845` 帧；`npm run check` 与 `git diff --check` 通过。
- 2026-08-20：`claude-code-how-it-works` 专用动态场景接入后的 `npm run check`、差异检查和连续帧边界回归检查通过；12 个 Scene、总计 6845 帧、区间无空档；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核。
- 2026-08-20：`claude-code-how-it-works` 遮挡修复后的 TypeScript 检查、差异检查和字幕 Manifest 校验通过；目标场景启用紧凑安全布局，12 个 Scene、107 条 Cue、空字幕 0、句末标点 0；本机 Chromium 仍因 `SIGTRAP` 无法完成实际画面复核。
- 2026-08-20：`claude-code-how-it-works` 通过 TTS／Manifest／Remotion 确定性校验；12 个 Scene、27 个 Segment、27 个 MP3、27 个 Timing、107 条 Cue、ID 全对齐，字幕末尾标点为 0，Timeline 为 228.168 秒，`npm run check` 通过；本机 Chromium 因 `SIGTRAP` 未完成画面检查。
- 2026-08-20：`videos/remotion-video/` 七层文件齐全；`source.md` 与指定 `53-remotion-video.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/glossary/` 七层文件齐全；`source.md` 与指定 `52-glossary.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/troubleshooting/` 七层文件齐全；`source.md` 与指定 `51-troubleshooting.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/anti-patterns/` 七层文件齐全；`source.md` 与指定 `50-anti-patterns.md` 通过字节一致性检查，11 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/best-practices/` 七层文件齐全；`source.md` 与指定 `49-best-practices.md` 通过字节一致性检查，11 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/capstone-project/` 七层文件齐全；`source.md` 与指定 `48-capstone-project.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript 和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
- 2026-08-20：`videos/voice/` 七层文件齐全；`source.md` 与指定 `47-voice.md` 通过字节一致性检查，12 个 Scene 在 Scene Script／Narration／Visual Script／Prototype 中对齐，必需字段、纯口播边界、画面文字归属、原型 HTML／JavaScript、控件／进度结构和范围保护检查通过，未发现 TTS、音频、字幕或 Timeline 文件。
