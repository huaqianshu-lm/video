# Remotion AI 视频制作

用 AI Agent 将原始资料制作成带口播、字幕和动画的教程视频。项目提供制作规范、四份阶段 Skill、视觉设计参考、可改造模板，以及 TTS、预览和渲染工具；Agent 负责策划、设计、编写 React／Remotion 和检查，用户确认分镜、观看试听画面并验收成片。

## 环境准备与安装

准备能够读取项目文件、执行命令和编写代码的 AI 编程 Agent，并准备以下环境：

| 环境 | 用途 |
| --- | --- |
| Git、Node.js 18+ 与 npm | 克隆仓库、安装依赖和运行制作工具；具体依赖由锁文件固定。 |
| Python 3.10+ | TTS 脚本及输入包 ZIP 处理，需能通过 `python3` 调用。 |
| FFmpeg 与 ffprobe | 音频检查及渲染；当前本地渲染执行器要求 FFmpeg 9，支持 macOS／Linux。 |
| 与当前 Remotion 匹配的浏览器 | Studio 及渲染；本地渲染可通过 `VIDEO_LOCAL_BROWSER` 指定实际可执行文件。 |
| 标准 TTS 模块及其 Python 依赖 | 派生口播输入；使用 Edge 时还负责音频、字幕和 Timeline 生成，配置见下文。 |

```bash
git clone https://github.com/huaqianshu-lm/video.git
cd video
npm ci

node --version
python3 --version
ffmpeg -version
ffprobe -version
```

仓库包含规范、脚本和公共实现，具体视频的资料、代码、媒体、系列封面、生成音频和成片均在本地忽略目录中，克隆不会获得这些资源。首次使用需要自行提供源资料、所需图片和 TTS 环境。

标准 TTS 模块单独维护在 [tts 仓库](https://github.com/huaqianshu-lm/tts) 。将它克隆到自行选择的目录，并按该仓库的说明准备 Python 环境和依赖：

```bash
git clone https://github.com/huaqianshu-lm/tts.git /absolute/path/to/tts
```

将示例目标路径替换为实际路径，再按下文配置 `VIDEO_TTS_PYTHON` 和 `VIDEO_TTS_SCRIPTS_DIR`。视频工具需要调用该模块的 `build_tts_script.py`、`generate_audio.py`、`generate_subtitles.py` 和 `generate_timeline.py`，具体接口可查 [TTS 入口](scripts/video-tts.mjs)。仅执行本项目的 `npm ci` 不会安装 TTS 模块及其 Python 依赖。

## 制作第一条视频

下面以视频标识 `my-first-video` 为例。可以换成自己的英文标识，后续目录和命令始终使用同一个标识。文件编写、工具调用和结果检查通常由 Agent 完成，用户在确认位置作决定；下面的命令便于了解和手动复现。

### 1．放入源资料，让 Agent 开始策划

在项目根目录执行：

```bash
mkdir -p videos/my-first-video
```

将文章、课程材料或整理后的内容保存到 `videos/my-first-video/source.md`，然后在项目目录中打开 Agent，给出类似指令：

> 为 my-first-video 制作一条口播教程，源资料在 videos/my-first-video/source.md，目标观众是……，希望观众学会……。先读取 CLAUDE.md、ROADMAP.md 和 docs/DIRECT-VIDEO-PRODUCTION.md，按 .claude/skills/video-production/SKILL.md 开始。完成口播审核、独立设计审查和修订后，把分镜交给我确认。

不同 Agent 的 Skill 加载方式不同；如果不能自动识别项目 Skill，直接让它读取对应 `SKILL.md` 并按内容执行。项目规则以 [CLAUDE.md](CLAUDE.md) 为准；其中提及的作者本机全局规则不随仓库分发，其他使用者需采用自己环境的全局规则。

Agent 会建立本条 `production-record.md`，形成内容分析、叙事策划、纯口播和 Scene → Shot → Event 分镜。系列和封面由 Agent 列出实际可选项，用户选择已有系列、不使用系列或准备新系列；空仓库没有系列时不需要先复制作者的资料。

### 2．确认分镜

Agent 联合收敛口播和分镜，审核口播并完成独立设计审查与修订，再提交分镜供用户确认，口播作为对照资料。

用户明确确认后才进入配音。分镜设计时按表达问题选择 [视觉参考](references/README.md)，需要统一配色和材质时选择风格；设计成立后再查 [模板](templates/README.md)，由 Agent 选择、改造或编写实现。

### 3．配置并生成配音、字幕和真实时间轴

标准 TTS 模块可用后，在执行工具的同一终端设置实际绝对路径。以下路径需要替换，不要照抄占位值：

```bash
export VIDEO_TTS_PYTHON="/absolute/path/to/tts-venv/bin/python"
export VIDEO_TTS_SCRIPTS_DIR="/absolute/path/to/standard-tts/scripts"
```

下面示例使用 Edge 在线服务，无需 API Key，但需要联网，朗读文本会发送到该服务。先明确同意本条口播向所选服务外发，再由 Agent 执行生成；输入派生本身不调用在线服务。

```bash
node scripts/video-tts.mjs build my-first-video
node scripts/video-tts.mjs generate my-first-video \
  --provider-json '{"provider":"edge","voice":"zh-CN-XiaoxiaoNeural","rate":"+25%"}'
node scripts/video-tts.mjs validate my-first-video
```

输入从纯口播派生为 `videos/my-first-video/tts-script.json`，生成音频、字幕和真实 Timeline 位于 `src/videos/my-first-video/generated/`。后续画面使用这些真实时间资料。

如使用百炼，还需要独立的 Python 依赖、音色、运行环境凭据和 TTS／ASR 外发许可；百炼仍依赖标准输入生成器。具体配置见 [TTS 环境说明](docs/TTS-SETUP.md) 和 [工具说明](scripts/README.md)。不要把凭据写入口播、代码或资源包。

### 4．让 Agent 实现画面

让 Agent 读取 [.claude/skills/visual-prototype-remotion/SKILL.md](.claude/skills/visual-prototype-remotion/SKILL.md)，按确认分镜、真实音频和 Timeline 编写当前视频的 React／Remotion。

本条代码放在 `src/videos/my-first-video/`，图片等放在 `public/local-assets/my-first-video/`。后续输入打包需要视频组件及配置入口；下面示例约定为：

- `MyFirstVideo.tsx`：导出组件 `MyFirstVideo`。
- `video.config.ts`：导出 `videoConfig`，包含实际画面规格和时间配置。

这些文件由 Agent 根据当前内容编写，打包命令不会替你生成画面。使用不同文件名或导出名时，修改下一步对应参数；特殊时长导出等参数见 [工具说明](scripts/README.md)。

### 5．准备输入包并预览

在组件、配置和音频就绪后，让 Agent 准备当前视频的独立快照：

```bash
node scripts/video-input.mjs prepare my-first-video \
  --component-path src/videos/my-first-video/MyFirstVideo.tsx \
  --component-export MyFirstVideo \
  --config-path src/videos/my-first-video/video.config.ts \
  --config-export videoConfig
```

命令返回 `directory`、`archive`、`sha256` 等信息。将下列 `<input-directory>` 替换为本次返回的 `directory`，不要把尖括号原样输入终端：

```bash
node scripts/video-input.mjs validate <input-directory>
npm run preview -- my-first-video
```

按终端提示打开 Studio，选择本条 Composition 查看。克隆后尚无视频输入包时，预览不会自动生成一条视频；必须先完成前面的内容、音频和实现步骤。

Agent 先完整观看动态画面、正常速度试听并修正问题，再由用户实际观看、试听并确认画面。实现返修后重新准备输入包并预览当前版本；打开或更新前核对已有 Studio，避免覆盖正在使用的入口。

### 6．渲染并验收 MP4

默认使用本地渲染。将 `<input-directory>` 替换为用户确认画面的同一份输入包目录，先检查环境与输入：

```bash
node scripts/video-render.mjs check <input-directory>
```

预检会检查 FFmpeg 9、ffprobe、编码能力、匹配浏览器和至少 2 GiB 可用空间；不自动安装环境。必要时设置 `VIDEO_LOCAL_FFMPEG`、`VIDEO_LOCAL_FFPROBE` 和 `VIDEO_LOCAL_BROWSER` 的绝对路径，详见 [本地环境配置](scripts/README.md#本地渲染环境)。

用户明确授权当前输入的完整渲染后执行：

```bash
node scripts/video-render.mjs render <input-directory>
```

MP4 输出在 `out/direct-render/my-first-video/<stamp>/my-first-video.mp4`，日志和结果记录在 `local/direct-render/my-first-video/<stamp>/`，实际位置以命令返回结果为准。用户观看、试听成片并验收后，Agent 收尾制作记录；完成态资料按项目规则保持只读。

本地交付无需 GitHub 认证或发布输入包。需要 GitHub 渲染时，另按 [渲染交付规范](docs/RENDER-DELIVERY-BASELINE.md) 准备独立输入仓库、认证、成功基线和相应授权。

## 常见问题与验证

| 现象 | 先检查什么 |
| --- | --- |
| TTS 提示缺少路径或找不到 Python 脚本 | 是否取得标准 TTS 模块、安装其依赖，并在 Agent 实际执行环境中设置路径。 |
| 找不到可预览视频 | 是否已编写组件、生成音频并成功 prepare；源资料或分镜本身不能直接播放。 |
| 输入打包提示组件不唯一或缺少配置 | 组件路径、导出名、配置文件和参数是否与实际代码一致。 |
| 本地渲染预检失败 | 按报错检查 FFmpeg 版本、ffprobe、编码能力、浏览器和空间；先解决预检问题。 |
| 结构检查通过，但声音或画面不合格 | 对照实际口播、分镜与实现，回到 [文档地图](docs/VIDEO-PRODUCTION-DOCUMENT-MAP.md) 查内容、设计、风格或实现的责任位置。 |

修改工具时，可按影响范围执行 `npm run check:tools`；修改 TypeScript 时执行 `npm run check`。更完整的定向检查见 [工具说明](scripts/README.md#检查)。机器检查不代表实际观看或试听通过。

当前工具接入缺口、历史类型检查问题及实际交付验证范围记录在 [ROADMAP](ROADMAP.md)。本文步骤已与当前入口核对，尚未完成全新环境克隆后的全流程实测。

## 目录与深入阅读

| 目录 | 作用与入口 |
| --- | --- |
| `docs/` | 流程、内容与设计原则、质量标准、分镜关联、TTS 和交付规范，见 [文档地图及框架图](docs/VIDEO-PRODUCTION-DOCUMENT-MAP.md)。 |
| `.claude/skills/` | Agent 的 [策划与分镜](.claude/skills/video-production/SKILL.md)、[TTS](.claude/skills/narrated-video-tts/SKILL.md)、[实现与检查](.claude/skills/visual-prototype-remotion/SKILL.md)、[输入包与交付](.claude/skills/video-render/SKILL.md) 操作指引。 |
| `references/` | 分镜、实现和返修时选用的 [设计方法与案例](references/README.md)。 |
| `styles/` | 可选的 [current](styles/current/STYLE.md) 与 [codex](styles/codex/STYLE.md) 配色和材质参考。 |
| `templates/` | 设计成立后按需改造的原创实现，适用条件和验证范围见 [模板索引](templates/README.md)。 |
| `contracts/` | 分镜 [Schema](contracts/video-production/current/storyboard.schema.json) 和 [合法示例](contracts/video-production/current/examples/storyboard.json)。 |
| `scripts/` | [工具、配置及检查说明](scripts/README.md)，以及必要内部模块和定向测试。 |
| `src/components/`、`src/scenes/`、`src/lib/` | 通用画面、场景与时间等实现能力。 |
| `videos/`、`src/videos/`、`public/local-assets/`、`series/`、`public/series-assets/`、`assets/`、`local/`、`out/` | 本地视频资料、代码、资源与产物，不随仓库分发；边界见 [项目规则](CLAUDE.md)。 |
