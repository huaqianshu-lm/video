---
name: narrated-video-tts
description: 在视频的视觉与口播审核 Gate 通过后，准备并校验口播、TTS、音频、字幕和 Timeline Manifest。
---

# 口播视频与 TTS

视频包含口播，或需要处理 TTS、音频、字幕、时间数据及 Timeline Manifest 文件时，使用本 Skill。

当前生产仅使用 `storyboard-v1` 与现行分镜契约。先读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 和 `docs/STORYBOARD-EXECUTION-QUALITY.md`；不提供旧流程或版本选择。旧资料不符合当前规则时先用 Harness 正常返工，不自动改写历史项目，completed 永久只读。

## 执行顺序

1. 确认 Gate 2 已通过，口播基线已冻结。
2. 使用 `scripts/build_tts_script.py`，从纯口播文件 `narration-script.md` 派生 `tts-script.json`。
3. 校验 Scene／Segment ID、文本覆盖、空文本，以及是否混入制作指令。
   首次为 TTS 请求权限提升前，按 `docs/TTS-SETUP.md` 中的 Agent 执行申请清单操作：读取实际已有授权，核对其项目／输入／服务范围；在首次申请中附上授权路径与相关原文，并说明冻结输入、目的地、语速、输出范围和缓存选择。不能等申请被拒绝后才补授权证据；已获授权且范围未变的工作，不重复询问用户。本要求不绕过工具审批。
4. 从已校验的 TTS Script 和实际生成的音频制作音频、字幕及 Timeline。
5. 读取 `docs/HARNESS-PRODUCTION-CONTRACT.md`。生产必须使用当前 Storyboard 契约；旧项目必须先正常返工。进入 Remotion 前完成自动检查，人工试听与 Gate 3 实际观看合并，并绑定当前音频／Timeline 指纹。历史独立试听审核保持只读。

## 必须保持的约束

- 不得把完整的制作 Markdown 文档发送给 TTS。
- 口播视频默认显式传入 `--rate +25%`，除非用户指定其他语速。
- 字幕展示可以去掉句末标点，但不得修改 TTS 朗读文本、音频或时间来源。
- Scene、Segment、Cue、音频、字幕与 Timeline 的映射必须一致。
- Shot 边界消费真实 Cue／Timeline，不按镜头拆分或重拼口播；没有词级证据时阻断 Cue 内切点。
- 时长来自真实音频与已校验时间数据；音频生成后不得按估算重新调整视频时间。
- 同内容重新生成 TTS 时，使用 `docs/HARNESS-PRODUCTION-CONTRACT.md` 中规定的共享执行器当前任务生成记录；不得事后伪造记录或修改时间戳来通过生产检查。
- 既有 Edge TTS 授权仅适用于当前项目、冻结口播及既定服务。项目、输入范围、目的地或服务改变时，重新询问用户。

## 按需读取的参考资料

- 跨项目交接契约与交接文件：读取 `docs/END-TO-END-VIDEO-PRODUCTION-PLAN.md`。
- 决定 TTS 制作规则时：读取 `docs/VIDEO-PRODUCTION-RULES.md` 中的 TTS 相关章节。
- 字幕展示、阅读停留与可选混音默认值：读取 `docs/VIDEO-PRODUCTION-RULES.md` 第 9.6 节 A／B／H。保留真实音频及 Cue／Segment／Timeline 映射；不得为了满足字幕展示长度而虚构时间。记录偏离情况，分别验证最终试听结果与源素材音量倍率。
- 申请 TTS 网络权限前：读取 `docs/TTS-SETUP.md` 中的 Agent 执行申请章节；其他章节仅在环境配置和排障时读取。
