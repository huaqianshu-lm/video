# Project Structure 视频化 · 第一步：Content Analysis

> 目标：从原文提取 Claude Code 项目结构、作用域和提交边界，再决定哪些关系必须用视频表达。

## 1. 核心命题

这篇文章表面上是在介绍 .claude/ 目录里的文件，真正要建立的认知是：

> **Claude Code 的配置不是一堆“自己会处理”的文件，而是分成项目级和用户级两套作用域；理解每个文件的职责、归属、优先级和 Git 边界，才能安全地复用配置。**

观众最后应该能看懂一张地图：

    项目级 ./.claude/
    → 跟着项目走、团队共享、通常进 git

    用户级 ~/.claude/
    → 跟着个人走、跨项目生效、不进仓库

    文件职责 + 作用域 + Git 边界 + 优先级
    → 安全地知道该看什么、该提交什么

## 2. 观众需要完成的认知变化

    “.claude 不用管”
            ↓
    .claude/ 是高级玩法落盘的结构地图
            ↓
    项目级和用户级是两套不同的“家”
            ↓
    每个文件都有职责，且共享配置与个人配置有不同边界
            ↓
    带 local 或含秘密的内容不能提交
            ↓
    配置冲突还要区分覆盖与合并

## 3. 必须保留的信息

### A. 文章的切入问题

- /init 之后，项目里会出现 .claude/ 文件夹。
- 不理解它，遇到权限不生效、队友没有命令等问题时很难排查。
- 作者用把数据库密码写进 .claude/settings.json 并推送到 Git 的经历，说明文件放错位置会造成安全事故。

### B. 两个作用域

- 项目级：项目里的 ./.claude/，影响仓库协作者，跟着项目走，通常提交进 git。
- 用户级：主目录的 ~/.claude/，只影响当前用户，跨项目生效，不提交到仓库。
- CLAUDE.local.md 是项目中的个人偏好文件，文章说明它应进 .gitignore。

### C. 项目级 .claude/ 的结构

- settings.json：团队共享配置，涉及权限、hooks、模型默认值。
- settings.local.json：个人配置覆盖，不提交；文章说明 Claude Code 会自动帮它配置 Git 忽略。
- commands/：自定义斜杠命令，一个 Markdown 文件对应一条命令。
- rules/：从 CLAUDE.md 拆出的模块化项目规则。
- skills/：可手动调用或由 Claude 自动判断调用的工作流技能。
- agents/：有独立上下文的专项子代理。
- .mcp.json：项目根目录中的团队共享 MCP 服务器配置。
- 项目根目录的 CLAUDE.md：项目说明书；文章还提到它也可放在 .claude/CLAUDE.md。

### D. 用户级的对应结构

- commands/、rules/、skills/、agents/、CLAUDE.md、settings.json 等目录和文件，在用户级也有对应形式。
- 用户级配置对所有项目生效，项目级配置只对一个项目生效。
- 用户级独有的内容包括 ~/.claude.json 和 ~/.claude/projects/。
- ~/.claude.json 承载应用状态、登录态、个人 MCP、项目可信记录和 UI 偏好。
- ~/.claude/projects/ 保存项目会话记录，自动记忆在其项目子目录的 memory/ 中。

### E. Git 提交边界

- 团队共享的 CLAUDE.md、.claude/settings.json、commands、rules、skills、agents 应提交。
- settings.local.json、CLAUDE.local.md 不应提交。
- 任何含密钥、token、密码的文件都不能提交。
- 文章建议用环境变量引用，例如 GITHUB_TOKEN，不要把 token 明文落盘。

### F. 配置优先级和合并规则

文章给出的优先级从高到低是：

    Managed
    → 命令行参数
    → Local
    → Project
    → User

- 标量值取更具体的作用域，表现为覆盖。
- 数组值跨作用域合并；文章以 permissions.allow 说明不能把用户级 deny 理解为全局一刀切。

### G. 只读动手验证

- macOS / Linux：ls -a ~/.claude
- Windows PowerShell：dir $HOME\.claude
- 项目级：ls -a .claude
- Git 忽略验证：git check-ignore .claude/settings.local.json
- 可选查看项目说明书：cat CLAUDE.md 或 PowerShell 的 type CLAUDE.md
- 如果不是 Git 仓库，git check-ignore 会报错。

## 4. 因果、对比和流程关系

### 因果关系

    不理解 .claude/
    → 不清楚权限、命令、技能和子代理落在哪里
    → 配置不生效或协作者拿不到配置

    把秘密写入共享 settings.json
    → 提交并推送
    → 密钥进入仓库历史
    → 必须改密码并重写历史

    看清作用域和 Git 边界
    → 共享内容进入项目
    → 个人内容留在本机
    → 降低配置冲突和泄密风险

### 对比关系

| 维度 | 项目级 | 用户级 |
| --- | --- | --- |
| 路径 | ./.claude/ | ~/.claude/ |
| 影响范围 | 当前仓库协作者 | 当前用户的所有项目 |
| 归属 | 项目共享 | 个人偏好与状态 |
| Git | 共享内容通常提交 | 不进入仓库 |

| 设置类型 | 多作用域同时存在 | 原文解释 |
| --- | --- | --- |
| 标量值 | 更具体的值覆盖 | 例如 model |
| 数组值 | 跨作用域合并 | 例如 permissions.allow |

### 流程关系

    识别文件路径
    → 判断它属于项目还是用户
    → 判断是否共享
    → 决定是否提交
    → 如果有冲突，再按作用域和设置类型排查

## 5. 可视觉化内容

- .claude/ 文件夹从“神秘目录”展开成项目级和用户级两棵树。
- 项目档案柜与个人工位抽屉的类比，用于建立作用域直觉。
- settings.json、commands、rules、skills、agents 等文件从目录树中逐个点亮。
- 共享配置进入 Git，个人配置留在本机的分流。
- 数据库密码进入 settings.json、推送到仓库、再触发改密码和重写历史的风险链。
- Managed 到 User 的优先级阶梯。
- 标量“覆盖”和数组“合并”的两种状态。
- 四条只读命令组成的现场验证路径。
- 最后一幕总结两棵树，并预告第 14 篇交互界面与快捷键。

## 6. 可弱化的信息

- 不在本片深讲权限、hooks、模型、MCP、技能和子代理的具体配置方法，只解释它们在结构中的位置。
- 不把 themes/、keybindings.json、output-styles/、workflows/ 展开成独立知识点，只保留“用户级还有独有目录”的概念。
- Windows 命令与 macOS / Linux 命令并列展示，但不展开操作系统差异。
- 作者个人踩坑的“半小时”不作为重点时长信息，保留其安全后果。
- 不把文章中的“官方建议”扩展成未在原文出现的外部规则。

## 7. 事实边界与画面文字归属

- 所有路径、文件名、命令、设置名和优先级文字均来自原文，或是对原文关系的直接可视化。
- settings.local.json 的自动忽略、CLAUDE.local.md 需要手动加入 .gitignore、数组合并等内容只按文章表述呈现。
- 画面可以使用 database password、git push、rewrite history 作为作者经历的流程标签，但不新增真实凭据。
- 画面不显示任何实际 token、密码、个人路径或仓库地址。
- 最后一幕只预告“交互界面与快捷键”，不提前展开下一篇的具体内容。

## 8. Gate 1 内部审查结论

- 核心命题明确：理解 .claude/ 的作用域、文件职责、Git 边界和优先级，才能安全使用 Claude Code 的高级配置。
- 叙事按“神秘目录 → 两个家 → 文件地图 → 安全边界 → 优先级 → 验证 → 总结”组织，没有机械照搬文章小节。
- 文章中的结构、事故案例、提交建议、优先级和验证命令均已进入叙事候选。
- 9 个 Scene 各自只承担一个主要认知任务，并且都有明确 Video Value。
- 本阶段不生成 TTS、音频、字幕、Timeline 或 Remotion 资料。

