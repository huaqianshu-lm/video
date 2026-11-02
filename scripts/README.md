# 独立视频制作工具

本目录存放系列选择、TTS、输入打包、预览及交付工具；`lib/` 为工具共用模块，`test/` 存放定向测试。实际制作步骤见各环节 Skill，验证范围见 [ROADMAP](../ROADMAP.md)。

## 环境与依赖

在项目根目录执行命令，先用 `npm ci` 安装锁文件中的工程依赖。首次制作的整体操作见[项目使用说明](../README.md)，本页维护工具参数与实际运行条件。

| 使用范围 | 实际依赖 |
|---|---|
| Node 工具与预览 | Node.js 18+、npm 及本项目依赖；Studio 需要可用浏览器 |
| 输入包准备、校验与安装 | `PATH` 中的 `python3`、`zip`、`unzip`、`ffprobe`；Python ZIP 处理使用标准库 |
| TTS | Python 3.10+、标准 TTS 模块及其依赖，`PATH` 中的 `ffprobe`；百炼另需 worker 依赖及 `ffmpeg` |
| 本地渲染 | macOS／Linux、FFmpeg 9、ffprobe、Remotion 浏览器及 compositor；编码能力和空间要求见下文 |
| GitHub 交付 | `git`、GitHub CLI `gh`、可用的系统凭据及网络；仓库权限与成功基线见交付规范 |

这些外部工具不由 `npm ci` 安装。安装或调整环境前先核对已有可用环境，具体授权按对应规范执行。

## 日常使用

示例中的 `<...>` 均须替换为实际值，`<series-id|none>` 表示填入系列标识或 `none`；不将尖括号或竖线原样输入终端。路径或名称含空格时使用引号。

```bash
# 显示真实系列和封面状态，用户选择后再 select。
node scripts/video-series.mjs list
node scripts/video-series.mjs select <slug> <series-id|none>
# 新建系列；已有系列缺封面时用 cover 添加。
node scripts/video-series.mjs create <series-id> --title <title> --style <style> --cover <project-image>
node scripts/video-series.mjs cover <series-id> --file <project-image>

# 环境配置见下文「TTS 配置与结果」。
node scripts/video-tts.mjs build <slug>
# 仅在当前输入／服务外发已授权时调用。
node scripts/video-tts.mjs generate <slug>
node scripts/video-tts.mjs validate <slug>

# 准备新快照，不覆盖历史包。返回 directory、archive 和 SHA。
node scripts/video-input.mjs prepare <slug>
# 需要时传 --component-path、--component-export、--config-path、
# --config-export、--duration-export、--composition-id 明确入口。
node scripts/video-input.mjs validate <input-directory>
# 需要单独安装输入包到隔离工作区时使用：
node scripts/video-input.mjs install <input-directory> --workspace <empty-directory>

# 当前正式输入包预览；目录模式跳过不可用包，不自动补写视频。
npm run preview -- <slug>
# 只生成预览入口和隔离 public，不启动 Studio：
node scripts/video-preview.mjs <slug>

# 先检查，用户明确授权本次渲染后再执行 render。
node scripts/video-render.mjs check <input-directory>
node scripts/video-render.mjs render <input-directory>
# 中断后只查原记录，不自动再次渲染。
node scripts/video-render.mjs inspect <run-directory>
```

两种预览命令都会改写共用的、被忽略的 `src/RenderInputRoot.tsx`，并生成隔离 public；当前脚本没有占用保护，执行前核对正在使用的 Studio 及入口，避免影响已有预览。受跟踪的 `src/Root.tsx` 只注册通用 Composition。

`create` 的 `--cover` 可省略；`cover` 仅给缺封面的已有系列添加图片，不覆盖已有封面。`<project-image>` 须为项目内图片。`install` 会校验并复制包、解压资源及生成入口，目标须为空目录或不存在的目录；项目内日常使用 `local/direct-render/<name>/`，不安装到项目根目录。本地渲染会自行安装隔离工作区，无需额外执行 `install`。

正式输入包保存在 `local/render-input/<slug>/direct-<stamp>/`；当前指针位于同视频 `direct-current.json`。包包含本条视频及共享运行代码快照，不写入其他具体视频。准备失败不更新指针，不自动删除已有包。

### 组件、配置与时长入口

`prepare` 的入口解析见 [input.mjs](lib/input.mjs)。组件和配置路径均须属于 `src/videos/<slug>/`；路径从项目根目录填写，导出名使用具名导出。

| 参数 | 实际行为 |
|---|---|
| `--component-path`、`--component-export` | 指定 `.tsx` 文件及组件导出；未指定且无已有入口记录时，从本视频目录唯一的 `*Video.tsx` 推断，导出名默认与文件名相同 |
| `--config-path`、`--config-export` | 指定 `.ts` 配置及其导出；默认 `src/videos/<slug>/video.config.ts` 中的 `videoConfig` |
| `--duration-export` | 指定配置文件中无参数函数的导出名，返回正文总帧数；未提供时调用共享 `getTotalDurationFrames(config)` |
| `--composition-id` | 指定 Composition ID，默认视频标识；仅使用字母、数字、下划线和连字符 |

组件、配置与时长导出可沿用同视频 `local/render-input/<slug>/render-input.json` 的已有入口记录；`direct-current.json` 用于选择当前包，不承担上述入口默认值。需要避免歧义时显式传参。

配置至少提供实际 `width`、`height`、`fps`；使用默认时长计算时，还须满足 [VideoConfig](../src/lib/videoTypes.ts) 与 [时长计算函数](../src/lib/timing.ts) 的接口，由 `scenes` 的时长及可选音频／字幕结束时间确定正文时长。正式制作使用真实 Timeline 的时间，不使用估算口播时长。指定时长函数时，也须让返回帧数与当前真实 Timeline 和组件播放范围一致。

统一入口在正文帧数之外加一次封面帧数，正文配置不重复声明 `series.coverSrc`；衔接规则见[系列与封面说明](../docs/AGENT-SERIES-COVER.md)。

### 本地检查与输出

本地 `check` 校验输入包，检查 FFmpeg 9／ffprobe、libx264／AAC、amix 及其 normalize 能力、浏览器与 compositor 文件和可用空间。它不实际加载组件或启动浏览器，不核对运行时 Composition 规格，也不执行渲染；通过预检不代表组件可运行或成片合格。

当前本地 `render` 固定要求 **1920×1080／30fps**，在实际加载 Composition 后核对，其他规格会失败。这是执行器当前支持范围；质量规范中的其他画幅或帧率口径不代表本工具已支持。

渲染使用 Node 绝对路径的 FFmpeg 包装器；输出在 `out/direct-render/<slug>/<stamp>/<slug>.mp4`，日志、输入工作区和结果在 `local/direct-render/<slug>/<stamp>/`。预览、渲染授权、结果核对及恢复按[渲染交付规范](../docs/RENDER-DELIVERY-BASELINE.md)执行。

### 本地渲染环境

| 环境变量 | 用途与未设置时的行为 |
|---|---|
| `VIDEO_LOCAL_FFMPEG` | FFmpeg 可执行文件路径；未设置则从 `PATH` 查找 |
| `VIDEO_LOCAL_FFPROBE` | ffprobe 可执行文件路径；未设置则从 `PATH` 查找 |
| `VIDEO_LOCAL_BROWSER` | 显式指定浏览器可执行文件；未设置则使用 Remotion 已安装且版本匹配的 headless-shell |

本地渲染入口兼容对应的 `HARNESS_LOCAL_FFMPEG`、`HARNESS_LOCAL_FFPROBE`、`HARNESS_LOCAL_BROWSER`，新变量优先。显式路径使用实际绝对路径；FFmpeg／ffprobe 显式路径无效时不回退 `PATH`。执行器目前支持 macOS／Linux，要求至少 2 GiB 可用空间；脚本不自动安装或升级环境，浏览器可执行文件检查不代表已实际启动成功。

未指定浏览器时，预检核对 Remotion 缓存中的 headless-shell 是否为匹配版本；显式设置 `VIDEO_LOCAL_BROWSER` 时只核对文件可执行性，不验证浏览器版本匹配或实际兼容性。

以上媒体工具变量仅作用于本地渲染环境解析。TTS 校验、输入包校验仍从 `PATH` 调用 `ffprobe`，百炼 worker 从 `PATH` 调用 `ffmpeg`；仅设置 `VIDEO_LOCAL_FFPROBE`／`VIDEO_LOCAL_FFMPEG` 不能覆盖这些调用。本地 render 的输入校验也先使用 `PATH` 中的 `ffprobe`。

## TTS 配置与结果

Agent 按 [TTS 环境文档](../docs/TTS-SETUP.md) 核对环境、外发授权及恢复条件后调用上述命令；声音与输入规则见 [制作规范第 10 章及 8.6](../docs/VIDEO-PRODUCTION-RULES.md)。

| 环境变量 | 用途 | 兼容别名 |
|---|---|---|
| `VIDEO_TTS_PYTHON` | 标准输入生成器及 Edge 生成脚本使用的 Python 绝对路径 | `HARNESS_TTS_PYTHON` |
| `VIDEO_TTS_SCRIPTS_DIR` | 标准 TTS 模块的 scripts 绝对路径 | `HARNESS_TTS_SCRIPTS_DIR` |
| `VIDEO_BAILIAN_PYTHON` | 百炼 worker 使用的 Python 绝对路径 | `HARNESS_BAILIAN_TTS_PYTHON` |

标准模块来自 [tts 仓库](https://github.com/huaqianshu-lm/tts) ，按其说明准备 Python 环境和依赖，环境要求见 [TTS 环境与配置](../docs/TTS-SETUP.md#环境与配置)。在 Agent 实际执行命令的环境中设置路径，以下占位路径均需替换：

```bash
export VIDEO_TTS_PYTHON="/absolute/path/to/tts-venv/bin/python"
export VIDEO_TTS_SCRIPTS_DIR="/absolute/path/to/tts/scripts"
# 仅使用百炼时配置其 worker 环境。
export VIDEO_BAILIAN_PYTHON="/absolute/path/to/bailian-venv/bin/python"
```

百炼 worker 的依赖声明在 [bailian-requirements.txt](tts/bailian-requirements.txt)；百炼生成仍需先用标准模块派生 TTS Script。

新变量优先于兼容别名。使用获准的实际绝对路径在调用环境中设置；工具不自动搜索其他项目。build 调用标准 `build_tts_script.py`，仅在临时副本中规范化 Scene 标题冒号；Edge generate 调用同目录的 `generate_audio.py`、`generate_subtitles.py` 和 `generate_timeline.py`。

generate 的配置优先级为 `--provider-json '<JSON>'`、只读历史项目中的 `tts` 配置、内置 Edge 默认配置。具体字段见 [配置解析器](lib/tts-provider.mjs)；未完成的新视频不需要初始化历史项目记录，completed 状态仅读取。百炼音色须显式提供。

以下是已选定服务并满足外发条件后的调用写法，JSON 直接填写服务配置，无需再包一层 `tts`：

```bash
node scripts/video-tts.mjs generate <slug> \
  --provider-json '{"provider":"edge","voice":"zh-CN-XiaoxiaoNeural","rate":"+25%"}'
# 将 <voice-id> 替换为本视频选定的有效百炼音色。
node scripts/video-tts.mjs generate <slug> \
  --provider-json '{"provider":"bailian","voice":"<voice-id>"}'
```

未填写字段由解析器补齐；声音要求按制作规范执行。百炼凭据仅在运行环境提供，配置方式见 TTS 环境文档。

generate 检查口播指纹，并在复制结果前复核口播及 TTS Script 未变；变化时保留缓存，停止复制。validate 对已有生成目录检查 Scene／Segment 映射、音频原文与文件、真实音轨和时长、字幕覆盖及 Cue 顺序／范围、Timeline 起止与总时长；完整 SRT／VTT 只检查存在且非空，不逐条核对。它不验证实际发音、词级证据绑定或分镜锚点；相关检查入口见 TTS 环境文档。

缓存内 `result.json` 的 `completedAt` 是本次流水线结束时间，`cachedAudioFilesBefore` 是执行前缓存音频文件数，`outputs` 保存生成目录文件及 SHA-256；这些字段不证明重新合成。是否复用及实际范围按 TTS 文档记录。

## GitHub 操作

执行前读取[渲染交付规范](../docs/RENDER-DELIVERY-BASELINE.md)的成功基线、授权及恢复要求，当前实施与验证状态见 [ROADMAP](../ROADMAP.md)。输入包发布使用 `gh release create`／`gh release upload`，不使用 `--clobber`；脚本不自动发布或 commit／push。

```bash
node scripts/render-preflight.mjs --workspace <workspace> --repository <owner/code> \
  --input-repository <owner/input> --ref <branch> --baseline-run <successful-run> \
  > <new-report.json>
```

独立预检只将 JSON 输出到终端，上例将其保存到新的本地报告文件；先准备父目录，不覆盖已有报告。核对退出码成功且报告 `ok=true` 后继续；预检会访问 GitHub 并执行 `git fetch`，不是纯离线检查。`dispatch` 自身还会重新预检并保存报告。

输入发布另需相应授权。以下命令均为操作示例，不由绑定脚本自动执行；将占位值替换为本次实际值：

```bash
# 先查看 Release；只有明确不存在时才创建，认证或网络报错不能当作不存在。
gh release view <release-tag> --repo <owner/input> --json assets
# 新 Release，上传 prepare 返回的 archive。
gh release create <release-tag> <archive.zip> --repo <owner/input> \
  --title <release-title> --notes <release-notes>
# 已有 Release 且尚无本次资产时，使用 upload，不重复创建。
gh release upload <release-tag> <archive.zip> --repo <owner/input>
# 获取资产名称、API URL 和大小，选中与本次 archive 对应的资产。
gh release view <release-tag> --repo <owner/input> --json assets \
  --jq '.assets[] | {name, apiUrl, size}'
```

创建与上传两种情况择一；已有同名资产时先核对字节，不覆盖或加 `--clobber`。取得的 URL 须为 `https://api.github.com/repos/<owner>/<input>/releases/assets/<asset-id>`，不能用浏览器下载链接替代。绑定会下载远端资产并核对 SHA-256。

```bash
node scripts/video-github.mjs bind <input-directory> --archive <archive.zip> \
  --url <Release-Asset-API-URL>
# 完成交付规范要求的代码提交推送，并获本次派发授权后执行。
node scripts/video-github.mjs dispatch <binding.json> --repository <owner/code> \
  --input-repository <owner/input> --ref <branch> --baseline-run <successful-run> \
  --confirm <archive-sha256>
node scripts/video-github.mjs find <dispatch.json>
node scripts/video-github.mjs status <run-id> --repository <owner/code>
```

`bind` 返回的持久绑定供 `dispatch` 使用；`find` 读取派发记录查询同一 dispatchId，`status` 按 Run ID 查询结果。工具检查范围、重派条件和 Artifact 验收要求见渲染交付规范。

## 检查

```bash
node --version
npm run check:tools
python3 -B -m unittest discover -s scripts/test -p 'bailian_test.py'
npm run check
git diff --check
```

工具测试使用临时视频和真实 PCM 音频，不调用外部 TTS、不启动浏览器、不渲染视频。整体类型检查如被历史视频阻断，单独记录，不修改完成视频以让检查变绿。

检查只覆盖当前改动及直接影响行为，整套回归仅在用户明确要求时运行；按改动选择上面的命令，不默认全部执行。长驻命令、预览和渲染控制日志体积；除本次排查确有需要，不读取 node_modules、缓存、构建产物或大媒体。

重复问题先读已有成功基线，复用仍有效的环境。修复依赖宿主权限、认证、远端修改或替代入口时，记录实际依赖及下一条视频的复用方式；通用修复进入实际工具入口并做必要定向回归，不靠临时手工操作长期维持。实际入口验证与另一条未完成／新视频的跨视频验证分别报告，缺口记入 ROADMAP；不修改 completed 视频作为验证素材。
