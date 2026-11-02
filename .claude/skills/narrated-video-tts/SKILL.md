---
name: narrated-video-tts
description: 从 Agent 审核通过的纯口播派生 TTS Script，由 Agent 调用脚本生成真实音频、字幕和 Timeline。
---

# 口播与真实时间

Agent 完成口播审核、用户确认分镜后使用。读取 `docs/DIRECT-VIDEO-PRODUCTION.md`，按其中的完成态保护、用户确认及变更规则确定可操作范围；工具实际验证范围见 ROADMAP，命令与配置见 `scripts/README.md`。

开始或恢复本环节时，依据 production-record.md 和当前产物核对工作位置，读取 `docs/VIDEO-PRODUCTION-RULES.md` 第 10 章及 8.6 中声音与字幕相关内容原文。生成后对照当前 TTS Script、真实音频、字幕与 Timeline 检查文本、配置、覆盖及时间一致性；正常速度试听按第 12 章合并画面检查。发现的问题及未验事项沿用现有制作记录，不以读过规范代替产物检查。

1. 核对本条口播的 Agent 审核记录、分镜的用户确认记录及准确范围，确定本次输入。
2. 读取 `docs/TTS-SETUP.md` 的「环境与配置」，按 `scripts/README.md` 的 TTS 配置调用 build，派生并校验独立 tts-script.json；对照 Agent 审核通过的口播核对文本、ID、覆盖及制作指令边界。
3. 外发前先按 `scripts/README.md` 的「TTS 配置与结果」确定实际生效的服务与配置；未显式传入时可能沿用历史项目配置，不能直接认定使用默认服务。再按 `docs/TTS-SETUP.md` 的「服务选择与外发授权」核对有效授权及实际数据流。
4. 使用已核对的本次配置调用 generate；服务、语速与输入要求遵守制作规范第 10 章。显式使用百炼时读取 TTS 文档的「百炼 ASR 文本与时间映射」。
5. 按工具说明核对生成结果，必要时调用 validate 定向排错；恢复或复用时核对当前口播与 TTS Script 的指纹及文本对应，validate 不检查口播指纹，也不验证词级证据或分镜锚点。交接或失败时执行 TTS 文档的「产物交接与失败恢复」。将核对后的音频、字幕、三份 Manifest 及可取得的词级证据交给 `.claude/skills/visual-prototype-remotion/SKILL.md`，在现有制作记录中保留实际生成／复用范围和未验事项。

口播或配置变化时，按直接制作入口确定受影响下游及复用范围。

交接 Shot／Event 时间时读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 的「真实时间映射与异常处理」，对照实际证据及当前实现核对。
