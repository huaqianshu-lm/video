# Project Structure 视频化 · 第五步：Visual Script

> 目标：为 9 个 Scene 明确画面结构、状态变化、动画顺序和声音与画面的互补关系。Visual Prototype 沿用基线的横屏 Scene 容器、幕内字幕、上一幕／下一幕、自动播放和进度提示结构。

## 全局视觉原则

### 1. 先建立两棵树，再讲文件

旁白解释作用域差异，画面先让项目级 ./.claude/ 与用户级 ~/.claude/ 形成稳定的空间关系。

### 2. 文件只显示必要标签

目录树保留原文中的文件名和目录名，职责通过分组卡片呈现，不在画面上塞入完整解释段落。

### 3. 风险使用过程表达

密码事故、Git 分流和 .gitignore 状态都用“出现 → 移动 → 结果”的变化表达，避免只放一个警告标签。

### 4. 机制拆成两条轨道

优先级阶梯与标量覆盖、数组合并分别呈现，避免把多个配置关系压成一张静态表。

### 5. 风格统一

深色背景、低饱和蓝紫主色、绿色表示安全或通过、黄色表示个人边界和提醒、红色表示风险；路径和命令使用等宽字体。

## Scene 01｜.claude/ 不是“别管它”

### 画面结构

中央是一个项目目录卡片，.claude/ 文件夹处于半展开状态；周围依次出现“权限不生效？”、“队友没有命令？”、“秘密进了仓库？”三个问题卡。

### 动画顺序

1. 项目目录和 .claude/ 从暗处出现。
2. 三张问题卡依次滑入并连向 .claude/。
3. 最后一张卡变成红色风险线，短暂显示 database password → git push。
4. 中央文件夹打开，切入下一幕的两棵树。

### 视觉目标

让观众知道本片要解决的是“看懂结构并安全判断”，不是介绍某一个单独文件。

### 与口播互补

旁白负责讲困惑和真实事故，画面只展示问题关系与抽象风险，不显示真实密码。

### 屏幕文字

.claude/；权限不生效？；队友没有命令？；秘密进了仓库？

### Visual Type

OpeningScene + Risk Workflow

## Scene 02｜Claude Code 有两个家

### 画面结构

左右两张大卡片：左边是项目档案柜，标记 ./.claude/、Project、团队共享；右边是个人工位抽屉，标记 ~/.claude/、User、跨项目生效。

### 动画顺序

1. 两张卡片同时进入，但先点亮项目侧。
2. 一条仓库连线从项目卡片延伸到协作者。
3. 一条用户连线从个人卡片延伸到两个不同项目。
4. 底部出现“跟着项目走”与“跟着你走”。

### 视觉目标

用影响范围而不是文件数量区分两种作用域。

### 与口播互补

旁白解释档案柜与工位抽屉的类比，画面证明两种配置的作用对象不同。

### 屏幕文字

./.claude/；~/.claude/；Project；User

### Visual Type

ComparisonScene

## Scene 03｜打开项目级 .claude/

### 画面结构

左侧为项目根目录树，右侧为展开后的 .claude/ 子树；底部单独显示根目录的 .mcp.json。

### 动画顺序

1. 根目录出现 CLAUDE.md、.mcp.json 和 .claude/。
2. .claude/ 展开 settings.json、settings.local.json。
3. commands/、rules/、skills/、agents/ 四个目录依次点亮。
4. 右侧出现“项目级／团队共享”的状态标签。

### 视觉目标

保留完整的结构地图，让观众看到项目级配置不是只有 settings.json。

### 与口播互补

旁白讲“共同使用的结构”，画面承担层级关系和文件名记忆。

### 屏幕文字

.claude/；settings.json；settings.local.json；commands/；rules/；skills/；agents/

### Visual Type

ConceptScene + File Tree

## Scene 04｜用户级目录如何跟着你走

### 画面结构

中央为 User 节点，向左连出 ~/.claude/ 的同名目录，向右连出 Project A 与 Project B；下方显示 ~/.claude.json、projects/ 和 memory/。

### 动画顺序

1. User 节点出现并展开同名目录。
2. 两条项目连线依次亮起，表示跨项目生效。
3. ~/.claude.json、~/.claude/projects/ 和自动记忆在用户侧出现。
4. 项目级卡片淡出，留下用户侧的个人范围边界。

### 视觉目标

显示用户级是个人范围的上层空间，不把它误画成另一个仓库。

### 与口播互补

旁白解释用户级状态和自动记忆，画面通过跨项目连线展示作用范围。

### 屏幕文字

跨项目生效；~/.claude.json；~/.claude/projects/；自动记忆

### Visual Type

ComparisonScene + Scope Diagram

## Scene 05｜文件职责分组

### 画面结构

四列职责卡：指导、配置、扩展、连接。文件标签从目录树飞入对应列；settings.local.json 进入“个人覆盖”小标签。

### 动画顺序

1. CLAUDE.md 与 rules/ 进入“指导”。
2. settings.json 进入“配置”。
3. commands/、skills/、agents/ 依次进入“扩展”。
4. .mcp.json 进入“连接”，settings.local.json 显示黄色个人覆盖标记。

### 视觉目标

用职责分组建立索引，而不是逐个解释所有高级配置细节。

### 与口播互补

旁白解释每类文件“管什么”，画面把文件名归类，避免声音和文字重复。

### 屏幕文字

指导；配置；扩展；连接；个人覆盖

### Visual Type

StepListScene + Document Map

## Scene 06｜Git 边界与泄密风险

### 画面结构

画面分为“共享内容”与“个人／秘密”两条通道。左侧文件进入 Git，右侧 local 文件进入 .gitignore；中间演示 database password → git push → rewrite history 的红色风险链。

### 动画顺序

1. CLAUDE.md、settings.json、commands、rules、skills、agents 进入“提交 Git”。
2. settings.local.json 与 CLAUDE.local.md 进入“.gitignore”。
3. 一个抽象 password 标签错误地进入 settings.json。
4. git push、仓库历史和 rewrite history 依次亮起，随后红线回收为“不提交秘密”。

### 视觉目标

强调任何密钥、token、密码都是红线，不展示实际秘密。

### 与口播互补

旁白讲作者踩坑和环境变量建议，画面展示共享、个人和秘密三种不同处理路径。

### 屏幕文字

提交 Git；.gitignore；不提交；密钥／token／密码

### Visual Type

ComparisonScene + Risk Workflow

## Scene 07｜配置冲突听谁的

### 画面结构

上半部是 Managed → CLI → Local → Project → User 的阶梯；下半部是“标量：覆盖”和“数组：合并”两条轨道。

### 动画顺序

1. 五级优先级从上到下出现。
2. model 标签沿标量轨道移动到更具体的配置，旧值被替换。
3. permissions.allow 标签沿数组轨道与多个来源汇合。
4. 两条轨道同时停留，形成“顺序相同，行为不同”的对照。

### 视觉目标

让覆盖与合并产生不同的动态结果，而不只是显示两个术语。

### 与口播互补

旁白负责解释规则，画面用替换和叠加证明两种行为。

### 屏幕文字

Managed → CLI → Local → Project → User；标量：覆盖；数组：合并

### Visual Type

ConceptScene + Priority Diagram

## Scene 08｜四条只读命令看清现场

### 画面结构

中央终端依次执行四条命令，右侧显示对应的目录或忽略结果；底部保留只读检查状态。

### 动画顺序

1. 输入 ls -a ~/.claude，显示用户级目录。
2. 输入 ls -a .claude，显示项目级目录。
3. 输入 git check-ignore .claude/settings.local.json，显示被忽略的路径。
4. 输入 cat CLAUDE.md，显示项目说明书的开头；旁边短暂提示“非 Git 仓库会报错”。

### 视觉目标

命令是只读的，且每条命令都对应一个明确判断。

### 与口播互补

旁白解释检查目的和 Git 仓库边界，画面展示终端反馈，不替观众执行修改操作。

### 屏幕文字

ls -a ~/.claude；ls -a .claude；git check-ignore；只读检查

### Visual Type

TerminalScene

## Scene 09｜两棵树的判断法

### 画面结构

中央为五节点链路：路径 → 归属 → 共享 → Git → 优先级。右下角为下一篇预告卡“交互界面与快捷键”。

### 动画顺序

1. 五个节点从左到右依次亮起。
2. “共享”节点分出提交 Git 与留在本机两条小支路。
3. “优先级”节点接入 Managed 到 User 的小阶梯。
4. 预告卡最后出现，并与主链路保持距离。

### 视觉目标

用判断顺序收束，而不是再重复文件清单；预告卡留出 2～3 秒可读停留。

### 与口播互补

旁白复述判断链并预告下一篇，画面负责留下可复用的排查方法。

### 屏幕文字

路径 → 归属 → 共享 → Git → 优先级；下一篇：交互界面与快捷键

### Visual Type

SummaryScene + Next Episode Preview

## 全片视觉类型／组件／动画标准

### 视觉类型

- Scene 01：OpeningScene + Risk Workflow
- Scene 02、04、06：ComparisonScene
- Scene 03：ConceptScene + File Tree
- Scene 05：StepListScene + Document Map
- Scene 07：ConceptScene + Priority Diagram
- Scene 08：TerminalScene
- Scene 09：SummaryScene + Next Episode Preview

### 复用组件方向

- OpeningScene：Scene 01 的问题钩子。
- ConceptScene：Scene 03、05、07 的目录、职责和优先级表达。
- ComparisonScene：Scene 02、04、06 的作用域、跨项目和 Git 分流对比。
- StepListScene：Scene 05 的职责分组。
- TerminalScene：Scene 08 的只读命令演示。
- SummaryScene：Scene 09 的判断链和下一篇预告。

本阶段只完成资料和静态原型，不实现或修改 Remotion 组件。

### 动画标准

- 每个 Scene 先出现主结构，再出现次要标签和状态。
- 目录展开、文件归类、Git 分流和命令反馈使用 300～600ms 的渐入、位移或连线亮起。
- 风险用红色，安全／忽略用绿色，个人边界用黄色，路径与命令使用等宽字体。
- 不使用复杂 3D、粒子或快速转场。
- 原型中的导航、自动播放、进度提示和幕内字幕只服务于静态预览，不进入未来 Composition 或 MP4。

## 下一步

完成 Gate 2 后，才可冻结口播并由 Agent 派生 tts-script.json。本任务按用户要求在此停止，不创建 TTS 输入、音频、字幕、Timeline 或 Remotion 配置。
