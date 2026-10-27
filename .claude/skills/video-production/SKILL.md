---
name: video-production
description: 通过 Harness 任务和人工审核 Gate，创建或修改口播视频的策划、纯口播与分镜方案。
---

# 视频制作

当前生产仅使用 `storyboard-v1` 与现行分镜契约。先读取 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 和 `docs/STORYBOARD-EXECUTION-QUALITY.md`；不提供旧流程或版本选择。旧资料不符合当前规则时先用 Harness 正常返工，不自动改写历史项目，completed 永久只读。

## 开始前

- 学习新案例或维护设计参考时，按 `references/README.md` 的「后续案例的更新策略」筛选、合并和留证；优先补充已有主题，独立新主题才新增文档，不要求每个案例产出文件。

- 本任务涉及分镜设计时，先读 `references/README.md`，按表达问题选择相关方法与案例；借鉴点及按当前内容的调整写入分镜设计说明／紧凑审计 summary／findings。外部案例、复现认可与本项目应用验证分别标明，不要求套用案例或读取整个目录。

- 核对 `docs/HARNESS-PRODUCTION-CONTRACT.md`“视频制作与流程变更的边界”。制作任务不附带流程改造授权；任务包或模板出现未声明的强制生成器、依赖或表达限制时，先报告契约差异，不据此缩减分镜设计。

- 读取项目的 `CLAUDE.md` 和 `ROADMAP.md`。所有生产入口，包括对话，都使用 Harness 任务和持久化标识；不得独立修改状态或自动批准 Gate。
- 新建 Agent 系列视频时，读取 `docs/AGENT-SERIES-COVER.md`，列出实际系列及封面可用情况供用户选择，并冻结确认后的快照。不得根据文件名推断系列归属。
- 使用 `contracts/video-production/current/examples/storyboard.json` 及其 schema 理解字段与引用；合法示例不是视觉设计基线。导演创作按 `STORYBOARD-EXECUTION-QUALITY.md`「导演创作与首次交付」执行，设计推导参见 `references/content-to-visual.md`。视觉与声音默认数值的唯一权威来源是 `docs/VIDEO-PRODUCTION-RULES.md` 第 9.6 节；不得把数值复制到 Skill 中维护。
- 按同一规则第 14.4 节完成审美与感官设计，写入紧凑审计 summary／findings；采用或沉淀调校配方时读取第 9.7 节和 `scaffolds/video-production/tutorial-motion-recipe.md`，未经实际观看不得标为已验证。
- 按同一规则 6.1 把对象造型、构图、镜头变化的认知收益与因果动画设计具体；视觉难点可按 9.7 在现有任务内局部实验后推广整片，不新增阶段或强制样稿，局部认可不代替整片 Gate。浅色设计作为可选参考，配色按当前内容与风格选择。

## 制作与审核

联合创作时按 `STORYBOARD-EXECUTION-QUALITY.md`「关键变化怎样完成导演决策」推演完整情境、声画共同含义和镜头内注意力；方法推导见 `references/content-to-visual.md`「把关键变化设计完整」。将其用于作设计决定，再独立判断观众实际能理解什么；不新增审计项或必交文档。按未解决的视觉疑问选择实验，必要观看无法完成时明确缺口，不能用抽帧或解码结果代替动态审美判断。

1. 登记原始资料（Source）；领取共享策划任务，合并制作内容分析（Content Analysis）和视频叙事（Video Narrative）。Harness 校验产物并记录 Gate 1 内部检查。
2. 领取口播与分镜联合收敛任务。Scene 的口播正文只能包含实际朗读内容，观众应能独立理解。Storyboard 使用一致的 Scene ID、Scene → Shot → Event 层级、稳定的镜头／对象／事件 ID、有资料依据的文字，以及可观察的前态／动作／后态（before／action／after）、焦点、停留和衔接设计。
3. 按 `STORYBOARD-EXECUTION-QUALITY.md`「导演创作与首次交付」完成全片构思 → 逐幕表达 → 镜头组织 → 按难点画面推敲 → 全片统筹 → 实现选择与数据整理。Agent 承担导演责任，首次提交须达到主要表达成立、可进入细节打磨的水平。把决定写入现有资料字段，不新增必交文档；脚本不能默认决定镜头设计。没有合适组件就规划新实现，组件积累遵守 `VIDEO-PRODUCTION-RULES.md` 13.3。创作完成后再按「设计与审查的执行顺序」独立检查，按 SQ-1～SQ-10 原则审查，用紧凑审计记录全片判断、实际问题与修正，不逐事件或逐镜头重复填写，不得从创作描述自动生成 pass。重大问题内部修订后再提交，现有组件缺失不算阻塞，真实能力缺口须具体报告。试点保留首次提交及反馈，区分细节打磨与大范围重设计；用户质量验收前不得声称首审质量已提升。
4. 画面设计完成后再读 `templates/README.md`。只有表达任务、对象关系和适用条件匹配时才选择或改造模板；没有匹配项时继续自行设计。模板不自动生成分镜，也不替代当前视频的实际观看验收。
5. 通过 `production-task complete` 提交真实产物；失败仍记为失败，恢复时继续同一任务。按口播与设计的准确 `reviewVersion` 请求 Gate 2 审核。设计审计不等于实际观看证据。
6. Gate 2 通过后，按 `narrated-video-tts` 生成并校验 `tts-script.json`、真实音频和 Timeline；按 `visual-prototype-remotion` 完成按冻结分镜编写的实现及 Gate 3 实际观看／试听。

## 质量与边界

- 按 `VIDEO-PRODUCTION-RULES.md` 第 8～10 章和第 14 章检查教程视觉、标题、必要对象的强调、对象生命周期、路径、阅读停留及文字重叠。Gate 2 检查强调目标与理由；Gate 3 检查真实时序下的动作和音频。
- 不把 HTML 原型、独立 Scene Script／Visual Script 或 `visual-self-review.json` 作为当前生产的前置产物。
- 系列视频结尾必须包含有资料依据的下一集预告。结构检查不能代替人工批准或视觉质量检查。
- 具体视频资料保留在本地，并由 Git 忽略。可复用能力进入共享代码或模板。
- 在 `ROADMAP.md` 中分别记录实现与验证状态。尚未验证的观看或试听必须保持待验证。
