# TTS 环境、配置与外发

## 使用时机与职责

配置或排查 TTS 环境、核对外发范围、交接音频结果时读取本文。制作步骤见 [口播与真实时间 Skill](../.claude/skills/narrated-video-tts/SKILL.md)，操作命令见 [工具说明](../scripts/README.md)，实际验证状态见 [ROADMAP](../ROADMAP.md)。

本环节由 Agent 调用脚本处理。输入与声音要求见 [制作规范第 10 章及 8.6](VIDEO-PRODUCTION-RULES.md)，分镜使用真实时间的规则见 [关联与时间映射规则](STORYBOARD-PRODUCTION-CONTRACT.md)。

## 环境与配置

复用已有 Python 3.10 或更高版本环境及 TTS 模块，显式配置绝对路径；不扫描父目录或自行进入其他项目。配置变量、兼容别名及调用方式见 [工具说明的 TTS 配置与结果](../scripts/README.md#tts-配置与结果)。

派生输入使用独立维护的 [标准 TTS 模块](https://github.com/huaqianshu-lm/tts) ，Edge 的音频、字幕与 Timeline 也由该模块生成。首次使用时克隆该仓库，按其说明准备 Python 环境和依赖，再配置实际 Python 与脚本目录的绝对路径。百炼仅替换生成阶段，因此仍需配置标准输入生成器环境，以及百炼 worker 的 Python 环境。

百炼使用 [bailian-generate.py](../scripts/tts/bailian-generate.py)，依赖版本以 [bailian-requirements.txt](../scripts/tts/bailian-requirements.txt) 为准；Edge 依赖以获准使用的实际 TTS 模块依赖声明为准。仅在运行环境提供 `DASHSCOPE_API_KEY`，凭据不写入代码、文档、日志或资源包。

实际执行环境需要可调用的 `ffprobe`；百炼 ASR 音频准备还需要 `ffmpeg`。先在获准范围核对指定 Python、依赖、脚本和媒体工具是否可用；已有有效环境直接复用。确需安装、升级或重建时，先明确目标目录、变更范围并取得相应授权，不将环境重装作为常规制作步骤。

## 服务选择与外发授权

| 服务 | 当前配置与数据流 |
|---|---|
| Edge | 朗读文本发送到既定 Edge 在线服务，需可访问 `speech.platform.bing.com:443`，不需要 API Key |
| 百炼 | 使用 `qwen3-tts-flash`、`cn-beijing`；朗读文本发送到 TTS，生成音频发送到 `qwen-audio-3.1-asr-flash` 获取时间证据。worker 使用 `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` 端点 |

生成前核对当前项目、视频、Agent 审核通过的纯口播、派生输入及实际服务目的地。TTS 只发送实际朗读文本，不发送整份制作 Markdown；百炼 ASR 每段仅附带从该段原文提取的技术术语，不改写朗读或字幕。

先查本条制作记录及已有明确授权。当前项目、审核通过的口播到既定服务的有效授权可以沿用，不重复询问；项目／工作目录、输入范围、目的地或服务变化时重新确认。百炼 TTS 与 ASR 的外发须有相应授权，不从 Edge 授权推导。

外发授权与执行环境权限分别核对。申请网络或宿主权限时说明实际操作、输入及目的地，并引用已有授权依据；工具审批仍按执行环境要求进行。

## 百炼 ASR 文本与时间映射

在制作规范要求的原文字幕与真实时间基础上，保留原始识别结果及 `wordMapping`，仅接受下列文字差异：

| 差异 | 映射要求 |
|---|---|
| 同音代词 | 仅“他／她／它”之间一对一对应，记录源字位置、原识别字、原文字及原因，沿用对应词条真实起止时间 |
| 整数书写形式 | 仅数值完全相同的中文整数与阿拉伯整数，如“三／3、三千／3000”；记录原文范围、识别形式、整数值及原始 ASR 词索引 |

数值改变、小数或日期格式转换、含糊的中文数字省略写法及其他增字、漏字、文字差异继续阻断。跨多个词的数词只能合并使用相邻词的真实区间，不按字符分配或插值；词级切点按关联与时间映射规则处理。

映射通过仅说明识别结果可对应原文，不代表实际发音或正常速度试听通过。

## 产物交接与失败恢复

生成结果位于 `src/videos/<slug>/generated/`：音频、逐幕字幕、Audio／Subtitle／Timeline 三份 Manifest、完整 SRT／VTT，以及有可用边界时的 `word-timing.json`。Edge MP3 与百炼 WAV 均可作为原始音频，不为统一格式转码或改变时间基准。

交接时按工具说明核对本次结果及 `validate` 的实际覆盖；分镜与词级定位按关联与时间映射规则核对，工具接入缺口见 ROADMAP。

缓存位于 `local/tts/<slug>/<script-hash>-<provider-hash>/`。相同输入与服务配置下保留有效片段继续；输入或配置变化使用不同缓存。空失败片段可清理，不删除原成功媒体。复用旧音频时核对同视频文本、配置及实际文件，保留原音频来源；在现有 `production-record.md` 中说明复用与新生成的实际范围。结果字段含义见工具说明。

缺路径、依赖、认证或权限时，先核对已有成功环境和实际报错，不让用户重配仍有效的环境，不修改 Shell、token 或系统设置碰运气。临时网络故障在有效授权和原目的地内有界重试；持续 403、认证或权限错误先解决原因，不靠重复请求推进。音频、字幕或 Timeline 不一致时停止下游使用，核对输入及产物，不手改时间绕过检查。

正常速度完整试听随实际画面按 [制作规范第 12 章](VIDEO-PRODUCTION-RULES.md#12-gate-3-实际观看与试听) 执行，真实发现及未验事项沿用本条制作记录。
