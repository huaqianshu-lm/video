# claude-code-what-is 当前视频审计

> 目标：按新规范检查当前 6 个大场景，决定 KEEP / REWORK / REMOVE / ADD。当前只做导演层审计，不改 Remotion 代码。

## 总体判断

当前视频已经比纯文字卡片好，但仍有 3 个核心问题：

1. 场景数量被 6 个大段限制，部分 Scene 承载多个认知点。
2. 「普通聊天 AI vs Claude Code」的差异还可以更像同一任务的过程对比。
3. Summary 过长，包含角色类比、适用场景、最终结论和下一条预告，应该拆开。

推荐改法：保留现有 6 个基础组件优先复用，但把视频重排为约 10 个视觉事件 Scene。

## Existing Video Audit

| 当前 Scene | 结论 | 原因 | 处理方式 |
|---|---|---|---|
| opening | REWORK | 开场问题清楚，但 4 个工具卡容易提前进入解释，画面仍偏概念卡片。 | 保留钩子，改成「听说很强 → 到底是不是聊天框？」的困惑状态。 |
| concept | KEEP + REWORK | 项目工作区、文件树、代码编辑器方向正确。 | 强化 Reading / Editing / Running / Verify 状态，不只是展示能力列表。 |
| comparison | REWORK + SPLIT | 左右对比方向正确，但一个 Scene 同时讲普通聊天工具和 Claude Code，信息过重。 | 拆成「普通 AI 复制粘贴循环」和「Claude Code 直接执行任务」。 |
| workflow | REWORK | 能力列表完整，但仍像功能清单。 | 改成真实项目任务队列或连续工程流程，不逐条展示功能。 |
| terminal | KEEP + REWORK | 人负责方向、AI 执行、人验收的边界是必要信息。 | 用 Review Gate / Decision Gate 表现边界，而不是只列三条职责。 |
| summary | REWORK + SPLIT | 当前时长最长，混合角色类比、适用场景、最终总结和预告。 | 拆成「三类工具类比」「什么时候用」「最终记忆点」。 |

## ADD 建议

新增的不是新组件类型，而是新的视频 Scene：

1. 普通聊天 AI 的复制粘贴循环。
2. Claude Code 接同一任务后的执行过程。
3. 人机协作边界的 Review Gate。
4. 什么时候该用 Claude Code 的选择场景。
5. 最终一句话记忆点。

## 当前应保留的资产和表达

- 保留深色科技感整体方向。
- 保留文件树、代码编辑器、终端、任务看板、状态标签。
- 保留 `Reading / Editing / Running / Passed` 这类状态表达。
- 保留「ChatGPT 顾问 / Copilot 输入法 / Claude Code 搭档」类比，但后移到总结前。

## 当前应减少的表达

- 减少一屏多个工具卡同时解释。
- 减少能力清单式展示。
- 减少长 Summary 中连续 bullet point。
- 减少旁白已经说清楚、画面又完整复述的文字。
