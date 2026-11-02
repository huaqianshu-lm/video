# TTS 安装与配置

本文说明如何安装 Video Harness 使用的独立 TTS 模块。该模块负责从 Gate 2 冻结后的 `tts-script.json` 生成分段音频、字幕和时间轴，不直接读取整份口播文档。`unified-v1`／`storyboard-v1` 在机器质检后继续 Remotion，人工试听合并到 Gate 3；仅旧契约保留独立 TTS 人工质检。

Harness 调用标准 TTS Script 生成器时，会将 `## Scene 01：标题` 或英文冒号标题转换为生成器接受的 `## Scene 01｜标题` 临时输入；已冻结文件、Scene 正文和源文件指纹保持原样。

## 1. 获取 TTS 模块

Edge TTS 模块已作为独立仓库发布：[huaqianshu-lm/tts](https://github.com/huaqianshu-lm/tts)。建议先创建工作目录，再把 Video 和 TTS 仓库克隆到同一级：

```bash
mkdir video-workspace
cd video-workspace
git clone https://github.com/huaqianshu-lm/video.git
git clone https://github.com/huaqianshu-lm/tts.git
```

目录布局应为：

```text
video-workspace/
├── video/
└── tts/
```

Video Harness 默认从 `../tts` 查找 TTS 模块。

## 2. 环境要求

- Python 3.10 或更高版本。
- FFmpeg，且终端可以执行 `ffprobe`。
- `zip` 和 `unzip`，用于生成并校验远程渲染资源包。
- 可以访问 Microsoft Edge 在线 TTS 服务 `speech.platform.bing.com:443`。

当前流程优先支持 macOS 和 Linux。Windows 建议使用 WSL2；如果直接使用 Windows Python，必须显式配置 Python 路径，并自行确保兼容的 `zip`、`unzip` 命令可用。

缺省 TTS 使用 Microsoft Edge 在线服务，不需要单独申请 API Key。显式选择百炼时，Harness 使用项目内 `harness/tts/bailian/` worker，须在其 `.venv` 安装锁定的 `requirements.txt` 并仅在运行环境设置 `DASHSCOPE_API_KEY`；Key 不写入项目配置、任务、日志或资源包。百炼将冻结口播发送到 TTS，并将生成音频发送到 `qwen-audio-3.1-asr-flash` 取得词级时间证据。每段 ASR 请求只附带从该段冻结文本提取的技术术语，术语不改写朗读文本、音频、字幕或时间轴。

百炼原始 WAV 与 Edge MP3 都属于合法音频输入；资源打包、Remotion 音频指纹和远程输入检查须同时支持，保留文件存在、路径安全、归档数量及内容指纹校验，不为格式兼容转码或改变时间基准。

同音代词差异仅允许“他／她／它”之间的一对一替换，仍使用对应 ASR 词条的真实起止时间，不插值或猜测字内时间。字幕取冻结原文；`wordMapping` 中须记录源字位置、原识别字、原文字及替换原因，原始 ASR 结果完整保留。其他文字差异、数值变化、增字、漏字继续阻断。该映射不代表实际发音或正常速度试听通过。

另允许数值完全相同的中文整数与阿拉伯整数书写转换，例如“三／3、三千／3000”。不接受数值改变、小数或日期格式转换，不推测含糊的中文数字省略写法。记录原文范围、识别形式、整数值及所采用的原始 ASR 词索引；跨越多个词的数词只能合并使用这些相邻词的真实区间，不能按字符分配或插值时间。原文字幕保持不变；没有独立词时间证据的位置不能作为镜头切点。

### Agent 首次执行申请

在受限网络环境中，Agent 首次申请宿主权限执行 TTS 时，必须先核对已有外部发送授权，并在该次申请的 `justification` 中附上以下证据，不能只写“已授权”，也不能等被拒绝后才补：

- 授权记录的实际路径和相关原文；当前项目可读取本地 `local/tts/external-service-authorization.md`，其他安装必须使用各自真实的用户授权，不能继承本项目授权。
- 本次视频标识、冻结的 `tts-script.json`、既定 TTS／ASR 服务及其实际目的地；百炼还须说明音频会发送到 Qwen-Audio ASR。
- 本次生成音频、字幕和 Timeline 的范围；Edge 须显式 `+25%`，百炼须确认原始语速，以及项目、输入范围、服务和数据目的地与授权一致的核对结果。
- 实际 Harness 命令；重新制作使用独立缓存，恢复中断任务沿用该次缓存，不回退到旧缓存。

申请示例（必须替换为已核对的真实信息）：

> 用户已授权当前项目的冻结口播及其生成音频发送到既定 TTS／ASR 服务。证据：<授权记录路径>，原文：<相关授权原文>。本次通过 Harness 为 <video-slug> 的冻结 tts-script.json 生成 <Edge +25% 或百炼原始语速> 的音频、字幕和 Timeline，目的地为 <实际服务端点>。项目、输入范围、服务和数据目的地均与授权一致，使用 <本次缓存目录>。

授权缺失或范围改变时先确认。已有同范围授权时不重复向用户索取授权。工具层的自动审批仍可拒绝执行；证据齐全不能保证放行。拒绝后报告原理由，只在新增授权证据或明确用户批准支持下重新提交同一操作，不通过改写命令绕过拒绝。

这项规则约束 Agent 的首次申请和 Harness 任务提示，不会更改 Codex 的沙箱、自动审批配置或网络权限。CLI、Web UI、批量及后台进程仍须具备实际网络访问能力。

## 3. 安装系统依赖

### macOS

```bash
brew install python ffmpeg
```

macOS 通常已经提供 `zip` 和 `unzip`。安装后执行：

```bash
python3 --version
ffprobe -version
zip -v
unzip -v
```

### Ubuntu／Debian

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip ffmpeg zip unzip
```

安装后执行：

```bash
python3 --version
ffprobe -version
zip -v
unzip -v
```

## 4. 创建 Python 虚拟环境

进入 TTS 工具目录：

```bash
cd ../tts
python3 -m venv .venv
source .venv/bin/activate
```

升级 `pip` 并安装固定依赖：

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

当前 `requirements.txt` 应包含：

```text
edge-tts==7.2.8
```

## 5. 验证本地安装

先执行不联网检查：

```bash
python --version
python -m pip show edge-tts
python scripts/build_tts_script.py --help
python scripts/generate_audio.py --help
python scripts/generate_subtitles.py --help
python scripts/generate_timeline.py --help
ffprobe -version
```

再使用不含敏感信息的文本验证在线语音服务：

```bash
edge-tts \
  --voice zh-CN-XiaoxiaoNeural \
  --rate="+25%" \
  --text "语音模块安装测试" \
  --write-media tts-test.mp3
```

确认 `tts-test.mp3` 存在、文件非空并且可以正常播放。

## 6. 连接 Video Harness

如果 Video 和 TTS 使用推荐的同级目录结构，无需设置 TTS 环境变量。Harness 默认使用：

```text
../tts
../tts/.venv/bin/python
../tts/scripts
```

回到 Video 项目并启动：

```bash
cd ../video
npm install
npm run harness:web
```

浏览器打开 `http://127.0.0.1:4173`。视频通过 Gate 2 后，Harness 会从冻结的 `tts-script.json` 生成配音、字幕和 Timeline。`unified-v1`／`storyboard-v1` 机器质检通过后继续制作 Remotion，在 Gate 3 统一审核实际画面与试听；旧契约在独立 TTS 人工质检处暂停。

默认语音参数为：

```text
voice: zh-CN-XiaoxiaoNeural
rate: +25%
pitch: +0Hz
volume: +0%
```

## 7. 使用自定义 TTS 路径

TTS 模块不在 `../tts` 时，在启动 Harness 前配置绝对路径：

```bash
export HARNESS_TTS_PROJECT_DIR="/absolute/path/to/tts"
export HARNESS_TTS_PYTHON="/absolute/path/to/tts/.venv/bin/python"
export HARNESS_TTS_SCRIPTS_DIR="/absolute/path/to/tts/scripts"
export HARNESS_TTS_SCRIPT_BUILDER="/absolute/path/to/tts/scripts/build_tts_script.py"
npm run harness:web
```

环境变量只对当前终端会话生效。修改后需要重新启动 Harness Web Server。

## 8. 生成结果

TTS 阶段成功后，Harness 会生成或更新：

```text
src/videos/<video-slug>/generated/audio-manifest.json
src/videos/<video-slug>/generated/subtitle-manifest.json
src/videos/<video-slug>/generated/timeline-manifest.json
public/local-assets/<video-slug>/audio/
public/local-assets/<video-slug>/subtitles/
assets/<video-slug>-assets.zip
```

可恢复的 TTS 中间结果保存在 `harness/.cache/tts/`，该目录不会提交到 Git。

共享执行器为带 Harness 任务 ID 的 TTS 执行使用按任务隔离的缓存，同一任务恢复沿用自身缓存。成功完成生成、产物校验和打包后，才在被忽略的 `local/tts-generation/<slug>/<task-id>-<attempt>.json` 保存生成记录并回传。记录包含任务 ID、执行次数、开始／完成时间、冻结输入和完整产物字节指纹。Harness 校验这些证据后允许生成内容相同；不以文件修改时间判断重制。旧任务无此记录时不能事后仅补时间戳通过，应从共享入口重新执行。

## 9. 常见问题

### 缺少 TTS Python 执行器

确认 `tts/.venv/bin/python` 存在。使用自定义目录或 Windows Python 时，显式设置 `HARNESS_TTS_PYTHON`。百炼使用 `harness/tts/bailian/.venv/bin/python`，需要覆盖时设置 `HARNESS_BAILIAN_TTS_PYTHON`；它固定稳定模型别名 `qwen3-tts-flash`、`qwen-audio-3.1-asr-flash` 与原始语速，不接入音频加速。

### `ffprobe: command not found`

安装 FFmpeg，并确认当前终端可以执行 `ffprobe -version`。

### `zip` 或 `unzip` 不可用

安装对应命令后重启 Harness。TTS 音频可能已经生成，但远程渲染资源包无法在缺少这两个命令时完成。

### 无法连接语音服务

检查网络、代理和防火墙是否允许访问 `speech.platform.bing.com:443`。该 TTS 服务依赖网络，离线环境不能生成新配音。

### 音频、字幕或时间轴不一致

不要手工混用不同批次的产物。音频、字幕和 Timeline 必须由同一份经过校验并冻结的 `tts-script.json` 派生；修改口播后，应重新执行受影响的 TTS 阶段和下游校验。
