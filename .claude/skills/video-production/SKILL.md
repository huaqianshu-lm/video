---
name: video-production
description: 通过 Harness 任务和人工审核 Gate，创建或修改口播视频的策划、纯口播与分镜方案。
---

# 视频制作

当前生产仅使用 `storyboard-v1` 与现行分镜契约。先读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 和 `docs/STORYBOARD-EXECUTION-QUALITY.md`；不提供旧流程或版本选择。旧资料不符合当前规则时先用 Harness 正常返工，不自动改写历史项目，completed 永久只读。

## 开始前

- 核对 `docs/HARNESS-PRODUCTION-CONTRACT.md`“视频制作与流程变更的边界”。制作任务不附带流程改造授权；任务包或模板出现未声明的强制生成器、依赖或表达限制时，先报告契约差异，不据此缩减分镜设计。

- 读取项目的 `CLAUDE.md` 和 `ROADMAP.md`。所有生产入口，包括对话，都使用 Harness 任务和持久化标识；不得独立修改状态或自动批准 Gate。
- 新建 Agent 系列视频时，读取 `docs/AGENT-SERIES-COVER.md`，列出实际系列及封面可用情况供用户选择，并冻结确认后的快照。不得根据文件名推断系列归属。
- 使用 `templates/video-production/storyboard-v3.json` 及其 schema。视觉与声音默认数值的唯一权威来源是 `docs/VIDEO-PRODUCTION-RULES.md` 第 9.6 节；不得把数值复制到 Skill 中维护。
- 按同一规则第 14.4 节完成审美与感官设计，写入既有 SQ 审计 evidence／note；采用或沉淀调校配方时读取第 9.7 节和 `templates/video-production/tutorial-motion-recipe.md`，未经实际观看不得标为已验证。
- 按同一规则 6.1 把对象造型、构图、镜头变化的认知收益与因果动画设计具体；视觉难点可按 9.7 在现有任务内局部实验后推广整片，不新增阶段或强制样稿，局部认可不代替整片 Gate。浅色设计作为可选参考，配色按当前内容与风格选择。

## 制作与审核

1. 登记原始资料（Source）；领取共享策划任务，合并制作内容分析（Content Analysis）和视频叙事（Video Narrative）。Harness 校验产物并记录 Gate 1 内部检查。
2. 领取口播与分镜联合收敛任务。Scene 的口播正文只能包含实际朗读内容，观众应能独立理解。Storyboard 使用一致的 Scene ID、Scene → Shot → Event 层级、稳定的镜头／对象／事件 ID、有资料依据的文字，以及可观察的前态／动作／后态（before／action／after）、焦点、停留和衔接设计。
3. 先按内容设计画面和变化，再选择合适组件；没有合适组件，就规划所需实现，不根据组件库倒推分镜。组件积累遵守 `VIDEO-PRODUCTION-RULES.md` 13.3。使用 SQ-1～SQ-10 和 `storyboard-design-audit.json` 审计每个 Scene／Shot／Event；现有组件缺失不算阻塞，React／Remotion 与当前环境确实无法实现时报告具体能力缺口，不能用标签替代实际行为；允许按冻结分镜编写 JSX。
4. 通过 `production-task complete` 提交真实产物；失败仍记为失败，恢复时继续同一任务。按口播与设计的准确 `reviewVersion` 请求 Gate 2 审核。设计审计不等于实际观看证据。
5. Gate 2 通过后，按 `narrated-video-tts` 生成并校验 `tts-script.json`、真实音频和 Timeline；按 `visual-prototype-remotion` 完成按冻结分镜编写的实现及 Gate 3 实际观看／试听。

## 质量与边界

- 按 `VIDEO-PRODUCTION-RULES.md` 第 8～10 章和第 14 章检查教程视觉、标题、对象生命周期、路径、阅读停留及文字重叠。Gate 2 检查设计；Gate 3 检查真实时序下的动作和音频。
- 不把 HTML 原型、独立 Scene Script／Visual Script 或 `visual-self-review.json` 作为当前生产的前置产物。
- 系列视频结尾必须包含有资料依据的下一集预告。结构检查不能代替人工批准或视觉质量检查。
- 具体视频资料保留在本地，并由 Git 忽略。可复用能力进入共享代码或模板。
- 在 `ROADMAP.md` 中分别记录实现与验证状态。尚未验证的观看或试听必须保持待验证。
