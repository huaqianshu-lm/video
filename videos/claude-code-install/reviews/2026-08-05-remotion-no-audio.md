# claude-code-install · Remotion 无音频阶段审查记录

## 当前结论

Visual Prototype 已确认，12 个 Scene 已接入横屏 Remotion。上游音频、字幕和时间轴资料已经复制并接入，当前版本已进入真实音频驱动阶段；根据人工复核反馈，Scene 12 四张总结卡片已按 `12-03`、`12-04`、`12-05`、`12-06` 语义绑定并统一提前 0.4 秒入场，顶部标题也已下移避开进度条，关键视觉事件和人工逐幕检查仍待完成。

## 已完成

- Composition ID：`claude-code-install`
- 画布：1920 × 1080
- 帧率：30fps
- Scene：12 个
- 场景组件：复用 `OpeningScene`、`ConceptScene`、`ComparisonScene`、`StepListScene`、`TerminalScene`、`SummaryScene`
- Scene 09 保留“先看 diff，再确认写入”的核心视觉高潮。
- Scene 12 只在最后一句字幕中加入下一节预告。
- 真实音频时间轴：76 段 Segment MP3、176 条全局字幕 Cue，场景总帧数为 10972。
- 视觉同步锚点：12 个 Scene 共 41 个主要视觉事件，使用对应 Segment 的 Scene 局部偏移。

## 资源归位

- 原始 TTS 资料：`local/claude-code-install/`
- Remotion 可播放音频和字幕：`public/local-assets/claude-code-install/`
- Remotion 消费的 Manifest：`src/videos/claude-code-install/generated/`
- 资源规模：12 个 Scene、76 段 MP3、时间轴总长 365.736 秒。

## 验证结果

- `node --version`：`v22.21.0`
- `npm install`：成功，依赖已同步
- `npm run check`：通过
- `npm run preview -- --port 3010`：Studio 启动并完成 bundling，随后已停止进程
- `git diff --check`：通过
- Manifest 引用检查：12 个 Scene、76 个音频引用、176 条 Cue，全部路径存在
- Scene 12 卡片同步修正：四个视觉起点按对应 Segment 提前 0.4 秒，音频与字幕时间轴保持不变；顶部标题下移 28px

## 尚未完成

- 尚未做浏览器中的逐幕人工画面检查；本机旧版 macOS 的 Chromium 画面验证存在 `SIGTRAP` 环境限制。

## 下一步

下一步在 Studio 中逐幕人工复核音频、字幕、视觉事件和文字安全区；本机无法完成画面检查时，改用可用的 GitHub Actions／新 Chromium 环境。
