# Content Analysis｜Output Styles

## Source Boundary

- `source.md` 是 `/Users/limiao/Desktop/claude code/32-output-styles.md` 的完整原文副本。
- 本分析只处理第 32 篇“输出样式（Output Styles）”；上一篇 `31-settings.json` 和下一篇 `33-钩子（Hooks）` 只作为源文中已经出现的系列导航与预告，不展开分析，也不读取下一篇文章。
- 文章中的命令、角色指令和操作示例属于待讲解内容，不改变本项目的生产边界；本阶段不执行这些命令。

## 核心命题

> Output styles 改变 Claude 的响应方式：角色、语气和输出格式；它不是给 Claude 增加项目知识的容器。

因此，想让 Claude 每轮都用某种方式回应，或想让 Claude 暂时承担写作助手、数据分析师等软件工程师之外的角色，应考虑 output style，而不是把这类要求堆进 CLAUDE.md。

## 必须保留的信息

1. **边界**：output styles 改“怎么回应”，不改“知道什么”；它作用于系统提示中的角色、语气和格式。
2. **适用信号**：同一句风格要求每轮重打，或希望 Claude 扮演软件工程之外的角色。
3. **四种内置样式**：Default、Proactive、Explanatory、Learning 的区别、适用时机和响应长度差异。
4. **切换方式**：独立 `/output-style` 命令已被移除；现在使用 `/config` 的输出样式菜单，或编辑 `outputStyle` 字段。
5. **生效时机**：样式在会话开始时读取，修改后要 `/clear` 或开启新会话。
6. **自定义样式结构**：Markdown 文件由 frontmatter 和系统提示说明正文组成；用户级、项目级、托管策略级决定可见范围；文件名默认成为样式名。
7. **frontmatter 字段**：`name`、`description`、`keep-coding-instructions`、`force-for-plugin` 的职责；其中 `keep-coding-instructions` 默认是 `false`。
8. **关键判断**：仍然编程但改变表达方式时设 `keep-coding-instructions: true`；完全不做软件工程时省略该字段，让工程指令被移除。
9. **底层机制**：样式说明拼到系统提示末尾，并在对话中触发提醒；自定义样式默认移除内置工程指令；样式会占输入 token，prompt caching 可降低后续成本，长响应样式主要增加输出 token。
10. **功能边界**：CLAUDE.md 管项目背景和约定；`--append-system-prompt` 管一次性追加；Subagent 管独立上下文的专注工作；Skill 管按需加载的复用工作流；output style 管每轮都套用的角色、语气和格式。
11. **可复现实操**：创建 `diagrams-first.md`，在 `/config` 选择，`/clear` 生效，用“解释用户登录请求路径”验证 Mermaid 图先于文字，再按需清理并切回 Default。
12. **系列承接**：最后预告第 33 篇“钩子（Hooks）”，它负责让某些动作在事件触发时自动发生，而不依赖 Claude 自觉。

## 知识关系

### 概念关系

`output styles` → 修改系统提示中的响应方式 → 每个回应都套用；`CLAUDE.md` → 提供项目内容、背景和约定 → 不负责稳定改变说话方式。

### 选择关系

- 日常软件工程 → Default。
- 希望少确认、倾向直接行动 → Proactive。
- 希望边做边理解实现和代码库模式 → Explanatory。
- 希望边学边做并留下 `TODO(human)` → Learning。
- 仍编程但想换表达方式 → 自定义样式加 `keep-coding-instructions: true`。
- 不再做软件工程 → 自定义样式省略该字段。

### 生效关系

`/config` 或 `outputStyle` → 保存选择 → `/clear`／新会话 → 系统提示重新组装 → 新样式对每个回应生效。

### 功能边界关系

| 需求 | 应放在哪里 | 关键区别 |
| --- | --- | --- |
| 每轮固定角色、语气、格式 | output style | 持续改变响应方式 |
| 项目背景、约定、代码库资料 | CLAUDE.md | 内容和上下文 |
| 单次调用的临时追加指令 | `--append-system-prompt` | 只作用于这次调用 |
| 独立上下文的专注任务 | Subagent | 独立系统提示、模型和工具 |
| 按需加载的可复用工作流 | Skill | 调用时或相关时加载 |

## 可视觉化内容

- 默认工程师人格与写作助手需求之间的错位。
- “知道什么”与“怎么回应”的双层分工。
- 四档样式的对照卡，以及 Explanatory／Learning 更长响应的提示。
- 已移除的 `/output-style` 与当前 `/config`、`outputStyle` 两条路径的分流。
- 会话重启前后的生效时间线。
- 自定义 Markdown 文件的 frontmatter、正文和三种存放级别。
- `keep-coding-instructions` 的二分判断。
- 系统提示组装：内置工程指令、样式说明、会话提醒。
- output style 与 CLAUDE.md、一次性参数、Subagent、Skill 的边界矩阵。
- “建文件 → 选择 → `/clear` → 提问验证 → 清理”的实操流程。
- 最终总结和第 33 篇 Hooks 预告。

## 可弱化或删除的信息

- “主持人换节目”的比喻只保留一次，用来建立直觉，不逐段复述。
- 文章中对第 18、20、23、24、25、26、30、31 篇的交叉引用不展开为新知识。
- 具体 token 计费背景只保留“输入提示有成本、长响应增加输出 token”的决策提示。
- 实操中的 shell 删除命令只作为清理步骤的屏幕文字展示，不在本任务执行。

## 事实边界与画面文字归属

- 版本号 `v2.1.73`、`v2.1.91`、路径、字段、命令、样式名和示例文本均来自当前 `source.md`，画面中只使用已在生产资料登记的文字。
- 不引入下一篇文章的具体内容；Hooks 只展示源文已有的“事件触发自动发生”预告语义。
- 不把参考视频的业务语义、固定状态文字或无关项目文件树带入本片。

## Gate 1 内部审查结果

- [x] 核心命题可由源文直接支持，且与“响应方式／项目知识”的主边界一致。
- [x] 必须保留的信息覆盖内置样式、切换、自定义、关键开关、底层机制、功能边界和实操闭环。
- [x] 叙事可按观众认知从“为什么不该塞进 CLAUDE.md”推进到“怎么选、怎么建、怎么验证”。
- [x] 文章中的命令和版本变更被视为讲解对象，不会在本任务中执行。
- [x] 已规划 12 个 Scene，每个 Scene 只有一个主要认知任务，并可用视频展示过程、对比或状态变化。

