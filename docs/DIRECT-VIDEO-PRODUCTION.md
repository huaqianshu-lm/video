# Agent 直接制作视频

## 文档用途与使用方法

本文是口播教程制作的总入口，规定制作顺序、用户确认、变更处理和完成态保护。开始或恢复工作时，先核对本条视频的制作记录及实际产物，再按下表进入对应 Skill 和规范；质量规范按其「分阶段使用索引」读取当前环节原文。工程能力及实际验证范围见 [ROADMAP](../ROADMAP.md)，工具命令统一查 [scripts/README.md](../scripts/README.md)。

## 制作流程、资料与文档入口

从原始资料到 MP4 的逐环节阅读范围、Skill 交接、工具与产物关系，见[文档使用地图](VIDEO-PRODUCTION-DOCUMENT-MAP.md)。下表保留总入口概览。

| 环节 | 当前工作与形成的资料 | 使用文档 |
| --- | --- | --- |
| 内容与策划 | 保存 `source.md`，合并制作 `content-analysis.md`、`video-narrative.md`；展示实际系列及封面，由用户选择并保存结果。内部检查不新增人工确认。 | [策划 Skill](../.claude/skills/video-production/SKILL.md)、[质量规范](VIDEO-PRODUCTION-RULES.md)第 1、2 章、[系列与封面](AGENT-SERIES-COVER.md) |
| 口播与分镜 | 联合收敛 `narration-script.md` 与 `storyboard.json`；Agent 完成口播审核、独立设计审查及修订后，将分镜提交用户确认；口播作为分镜对照资料。 | 策划 Skill、质量规范第 3～9 章（按使用索引选读）、[分镜设计与审查](STORYBOARD-EXECUTION-QUALITY.md)；字段查 [Schema](../contracts/video-production/current/storyboard.schema.json)及[合法示例](../contracts/video-production/current/examples/storyboard.json)，关联查[分镜关联与时间映射规则](STORYBOARD-PRODUCTION-CONTRACT.md) |
| TTS、字幕与真实时间 | Agent 完成口播审核、用户确认分镜后，派生并校验独立 `tts-script.json`，据此生成实际音频、字幕、Audio／Subtitle／Timeline Manifest 及可取得的词级证据。 | [TTS Skill](../.claude/skills/narrated-video-tts/SKILL.md)、[TTS 环境与外发](TTS-SETUP.md)、质量规范第 10 章及 8.6 相关项；真实时间映射按分镜关联规则 |
| Remotion 实现与预览 | 根据确认分镜和真实 Timeline 编写本视频 React／Remotion，准备独立输入包并加载正式预览。 | [实现 Skill](../.claude/skills/visual-prototype-remotion/SKILL.md)、质量规范第 8、11 章；输入包与预览按[交付 Skill](../.claude/skills/video-render/SKILL.md)及[渲染交付规范](RENDER-DELIVERY-BASELINE.md) |
| 观看、试听与画面确认 | Agent 提交前完整观看动态画面、正常速度试听并修正问题，记录真实检查范围及未验事项，再交用户实际观看、试听并确认当前画面。不能完成的必要感官检查须明确说明，不能用技术检查或自评代替。 | 实现 Skill、质量规范第 12 章、分镜质量规范「实现与返修核对」 |
| 渲染与成片验收 | 用户确认画面并明确授权当前输入后执行渲染；默认本地，GitHub 为用户明确选择的替代方式。保留输入包、日志及结果位置，最终成片由用户验收。 | 交付 Skill、渲染交付规范；认证、发布、提交推送、派发及中断恢复细则均在该规范维护 |

分镜及实现先读 [references/README.md](../references/README.md)，按表达问题选读方法与案例；设计成立后再查 [templates/README.md](../templates/README.md)。具体视频资料、代码和资源分别放在 `videos/<slug>/`、`src/videos/<slug>/`、`public/local-assets/<slug>/`，保持本地忽略；仓库边界以 [CLAUDE.md](../CLAUDE.md) 为准。

打开或更新预览前，Agent 须核对已有 Studio 及其使用的入口，不覆盖或强制关闭正在使用的预览；工具改动验证使用隔离目录。

## 制作记录、用户确认与变更处理

每条新视频只用一份 `videos/<slug>/production-record.md`。简要保存当前工作、必要输入／输出、问题与修正、未验事项，以及用户确认的准确范围和原文或会话位置。确认仅由用户明确决定，工具检查或文件存在不构成确认。

口播、分镜、音频或实现发生变化时，先说明受影响内容及原确认的适用范围，仅返修真正受影响部分；口播变化由 Agent 重新审核，影响分镜时由用户重新确认受影响分镜；分镜变化同样由用户重新确认受影响部分。实现修复重看相关画面与衔接，保留仍有效的音频及其他产物。不能沿用已变化部分的批准。用户已明确授权的范围不重复请求确认；流程改造授权按[项目规则](../CLAUDE.md#直接制作与变更)处理。

用户验收成片后，先记录成片确认、交付结果及产物位置，最后将制作记录顶部状态改为 `状态：completed`。这次记录收尾不改变已验收的画面／音频输入，无需因此重新打包或渲染；标记完成后，制作记录也进入永久只读范围。

## 完成态保护与已有资料使用

任何写入前先核对本条制作记录；若存在 `harness/projects/<slug>/state.json`，一并只读核对。任一记录为 `completed` 即按完成态保护。状态冲突或无法确认时先停止写入、核实事实，不把状态识别视为工具已覆盖全部异常。

`completed` 视频的内容、资料、代码、配置、资源、音频、字幕、Timeline／Manifest、审核、状态、制作记录、历史任务及所有关联产物永久只读，不重包或重渲染；只读检查和已有包预览允许。必须制作新版本时使用新标识或独立副本，不回写原视频。

未完成视频依据实际资料和缺口继续制作，规则文档更新不自动使既有口播、分镜或音频失效。已有 TTS 配置、完成状态、封面及输入包可只读使用，已有审核事实原样保留。

## 交付说明

交付时说明改动范围、预览方式、Composition ID，以及已验／未验范围。执行前可说明拟用的渲染命令；实际执行后才能报告本次输出位置与结果，不把预期产物说成已经生成。具体输入、日志与结果核对按[渲染交付规范](RENDER-DELIVERY-BASELINE.md)执行。
