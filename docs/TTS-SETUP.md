# TTS 安装与配置

本文说明如何安装 Video Harness 使用的独立 TTS 模块。该模块负责从 Gate 2 冻结后的 `tts-script.json` 生成分段音频、字幕和时间轴，不直接读取整份口播文档，也不会自动通过 TTS 人工质检。

## 1. 获取 TTS 模块

TTS 模块已作为独立仓库发布：[huaqianshu-lm/tts](https://github.com/huaqianshu-lm/tts)。建议先创建工作目录，再把 Video 和 TTS 仓库克隆到同一级：

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

TTS 默认使用 Microsoft Edge 在线服务，不需要单独申请 API Key。生成配音时，冻结后的口播文本会发送至该服务。

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

浏览器打开 `http://127.0.0.1:4173`。视频通过 Gate 2 后，Harness 会从冻结的 `tts-script.json` 生成配音、字幕和 Timeline，并在 TTS 人工质检处暂停。

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

## 9. 常见问题

### 缺少 TTS Python 执行器

确认 `tts/.venv/bin/python` 存在。使用自定义目录或 Windows Python 时，显式设置 `HARNESS_TTS_PYTHON`。

### `ffprobe: command not found`

安装 FFmpeg，并确认当前终端可以执行 `ffprobe -version`。

### `zip` 或 `unzip` 不可用

安装对应命令后重启 Harness。TTS 音频可能已经生成，但远程渲染资源包无法在缺少这两个命令时完成。

### 无法连接语音服务

检查网络、代理和防火墙是否允许访问 `speech.platform.bing.com:443`。该 TTS 服务依赖网络，离线环境不能生成新配音。

### 音频、字幕或时间轴不一致

不要手工混用不同批次的产物。音频、字幕和 Timeline 必须由同一份经过校验并冻结的 `tts-script.json` 派生；修改口播后，应重新执行受影响的 TTS 阶段和下游校验。
