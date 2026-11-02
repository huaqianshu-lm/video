---
name: visual-prototype-remotion
description: Agent 按确认分镜和真实 Timeline 编写 Remotion，提供正式预览及实际观看试听结果。
---

# 分镜实现与 Remotion

Agent 完成口播审核、用户确认分镜且真实音频与 Timeline 就绪后使用。开始或恢复时读取 `docs/DIRECT-VIDEO-PRODUCTION.md`，根据 production-record.md 和当前产物确定工作位置及可修改范围，完成态保护与确认规则按该文档执行。读取 `docs/VIDEO-PRODUCTION-RULES.md` 第 8、11 章原文，按当前实现查阅 8.6；对照实际代码、真实 Timeline 和画面核对分镜是否兑现。

1. 读取本条 Agent 审核通过的口播、用户确认的分镜、风格／封面及通过检查的 Audio／Subtitle／Timeline Manifest。先按 references/README.md 的表达问题查参考，再按内容决定是否改造 templates/README.md 的模板；没有匹配就自行编写，不降低表达。
2. 编写前查阅 `scripts/README.md` 的「组件、配置与时长入口」，明确组件、配置导出与正文时长接口。Agent 编写当前视频 React／Remotion，按 `docs/STORYBOARD-PRODUCTION-CONTRACT.md` 核对对象关联并完成真实时间映射，不用脚本生成统一画面。开始或恢复实现、局部返修时，读取 `docs/STORYBOARD-EXECUTION-QUALITY.md` 的「实现与返修核对」，对照当前分镜核对实际表达。正文音频、字幕和 Timeline 保持同一相对时间；封面与正文的衔接按 `docs/AGENT-SERIES-COVER.md` 核对。跨幕按设计接续主体身份、位置与状态，明确转场背景与前后景覆盖关系。
3. 按 `.claude/skills/video-render/SKILL.md` 的「准备预览」准备并校验当前独立包，核对并保护已有 Studio，再加载正式组件、真实音频和封面。本步仅准备和预览；工具命令查 `scripts/README.md`，实际验证范围见 ROADMAP。
4. 提交画面前读取质量规范第 12 章，发现具体问题再回查 8.6 及相关规则。完整观看动态画面并正常速度试听，表达核对按分镜质量规范的「实现与返修核对」，实际效果按质量规范 12.2 检查。连续播放交界，并检查前／中／后实际帧，排查重复入场、无意闪白／闪黑及预览导航、调试标签和场景编号混入成片。技术检查、局部预演与完整感官检查分别报告；必要观看／试听无法完成时，交付前说明具体能力缺口和影响，不宣称画面成熟或无剩余质量阻断，不把明显的内部设计问题留给用户发现。
5. 在 production-record.md 简要记录真实范围、发现、修改和未验事项，交用户实际观看、试听并确认当前画面。对记录中已选用的既有方法及同类问题，实际观看核对是否落实和解决，简要补充结果；没有实际采用或验证，不宣称已复用或已避免重犯。
6. 返修按直接制作入口确定受影响范围及重新确认要求；实现修复后返回第 3 步准备并校验新包、加载当前预览，再重看相关画面与衔接。用户确认当前画面并明确授权渲染后，进入 `.claude/skills/video-render/SKILL.md` 执行交付，最终成片由用户验收。

视觉与声音数值只读质量规范 8.6，审美和感官自检按 12.2；本 Skill 负责当前视频的实现与检查，模板准入与维护另见 `templates/README.md`。
