---
name: video-production
description: Agent 直接创建或修改口播视频的策划、纯口播与分镜，由用户审核关键结果。
---

# 视频制作

用于创建或修改策划、口播与分镜。开始或恢复时读取 `CLAUDE.md`、`ROADMAP.md` 与 `docs/DIRECT-VIDEO-PRODUCTION.md`，依据本条 production-record.md 和实际产物确定工作位置及可修改范围；完成态保护、确认与变更处理按直接制作入口执行。

1. 策划：读取 `docs/VIDEO-PRODUCTION-RULES.md` 第 1、2 章，保存 source.md，合并制作 content-analysis.md 与 video-narrative.md；对照实际资料检查受众、学习目标、内容取舍及教学完整性，内部检查不增加人工确认。新视频按 `docs/AGENT-SERIES-COVER.md` 展示实际系列和封面，由用户选择并保存结果。
2. 设计准备：读取质量规范第 3～6 章、第 8 章设计原则及 `docs/STORYBOARD-EXECUTION-QUALITY.md` 的「分镜设计方法」；第 7 章及 8.6 按当前表达涉及的内容选读。先读 `references/README.md`，按表达问题选择方法与案例，再开始口播与分镜联合设计。
3. 联合收敛：形成 narration-script.md 与 storyboard.json，按设计方法核对画面、对象变化、焦点、阅读空间及风格／系列安排；系列结尾核对有资料依据的下一集预告。纯口播要求按质量规范第 5 章，分镜字段及写法查 `contracts/video-production/current/storyboard.schema.json` 和同目录 `examples/storyboard.json`，对象关联查 `docs/STORYBOARD-PRODUCTION-CONTRACT.md`。设计成立后再查 `templates/README.md` 评估实现方式，无匹配则自行编写。返修时读取分镜质量规范的「实现与返修核对」。
4. 独立审查：提交前读取质量规范第 9 章，按分镜质量规范的「提交前独立审查」对照同一版本口播与分镜完成口播审核、设计审查、修订和记录。
5. 用户确认与交接：提交分镜供用户确认，附同一版本已由 Agent 审核通过的口播作为对照，记录准确范围；确认后进入 `.claude/skills/narrated-video-tts/SKILL.md`，完成真实音频与 Timeline 后进入 `.claude/skills/visual-prototype-remotion/SKILL.md`。

恢复制作时按质量规范的「分阶段使用索引」，根据 production-record.md 和当前产物确定工作位置，重新读取对应章节原文；往返收敛时按当前工作切换阅读范围。读取结果由实际产物检验，不新增阅读打卡或逐条勾选表。

沿用一份 production-record.md，记录内容按直接制作入口执行。有相关经验可用时，查看已有制作记录中的同类问题与参考，简要说明采用的方法、用在哪段画面及要避免的问题；没有相关项无需填写，不另建配方表。量化参数、资料边界及流程改造分别按质量规范和项目规则执行。
