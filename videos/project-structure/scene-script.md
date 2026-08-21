# Project Structure 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成 9 个可制作的视觉事件。每幕只承担一个主要认知任务。

## Scene 01｜.claude/ 不是“别管它”

### sceneId
project-structure-01

### title
这个文件夹，为什么不能只说“别管它”

### purpose
用权限不生效、队友没有命令和密钥误提交三个问题，建立理解 .claude/ 结构的必要性。

### narrativeRole
开场问题与风险钩子。

### narrationIntent
说明高级玩法都会落到 .claude/ 的文件和目录里；如果把含数据库密码的配置写进共享文件并推送，问题会从“不生效”变成安全事故。

### visualIntent
让一个神秘的 .claude/ 文件夹展开成权限、命令、技能和密码风险四个分支。

### visualType
OpeningScene + Risk Workflow

### keyOnScreenText
.claude/；权限不生效？；队友没有命令？；秘密进了仓库？

### videoValue
问题卡片接连出现并汇聚到同一个目录，能把“结构认知”与真实后果建立时间关系。

## Scene 02｜Claude Code 有两个家

### sceneId
project-structure-02

### title
项目档案柜，和个人工位抽屉

### purpose
建立项目级与用户级作用域的核心直觉。

### narrativeRole
概念建立。

### narrationIntent
解释项目档案柜代表团队共享的项目级配置，个人工位抽屉代表跟着用户跨项目生效的用户级配置。

### visualIntent
左右并置 ./.claude/ 与 ~/.claude/，分别贴上 Project 和 User 标签，并显示影响范围。

### visualType
ComparisonScene

### keyOnScreenText
./.claude/；~/.claude/；Project；User

### videoValue
两个空间的并置和标签切换，可以让“跟着项目走”和“跟着你走”变成可见关系。

## Scene 03｜打开项目级 .claude/

### sceneId
project-structure-03

### title
项目级目录：团队共享的档案柜

### purpose
展示项目级 .claude/ 的完整树形结构，先建立全景地图。

### narrativeRole
项目侧地图展开。

### narrationIntent
讲清项目级目录包含共享说明、配置、命令、规则、技能、子代理，以及根目录的 .mcp.json。

### visualIntent
从项目根目录展开 .claude/，逐个点亮 settings.json、settings.local.json、commands/、rules/、skills/ 和 agents/。

### visualType
ConceptScene + File Tree

### keyOnScreenText
.claude/；settings.json；settings.local.json；commands/；rules/；skills/；agents/

### videoValue
目录树的展开顺序能把多个文件和目录的层级关系一次讲清，避免观众把它们记成孤立清单。

## Scene 04｜用户级目录如何跟着你走

### sceneId
project-structure-04

### title
用户级目录：换项目也跟着你

### purpose
补全用户级作用域，说明它和项目级目录的“同名双胞胎”以及用户级独有内容。

### narrativeRole
作用域对照与补充。

### narrationIntent
说明用户级也有 commands/、rules/、skills/、agents/、CLAUDE.md 和 settings.json；同时有 ~/.claude.json 与 ~/.claude/projects/ 这类用户级状态。

### visualIntent
让同名目录从一个用户节点连到两个项目，再显示 ~/.claude.json 和 projects/ 留在用户侧。

### visualType
ComparisonScene + Scope Diagram

### keyOnScreenText
跨项目生效；~/.claude.json；~/.claude/projects/；自动记忆

### videoValue
跨项目连线和用户侧独有文件能直接证明“用户级不是第二个项目目录”，而是个人范围的上层空间。

## Scene 05｜文件职责分组

### sceneId
project-structure-05

### title
这些文件，各自管什么

### purpose
把目录树中的文件转成可记忆的职责分组。

### narrativeRole
结构解释。

### narrationIntent
分别解释 CLAUDE.md／rules/ 是指导，settings.json 是配置，commands/、skills/、agents/ 是扩展；.mcp.json 是团队共享的 MCP 配置。

### visualIntent
让文件卡片按“指导”“配置”“扩展”“连接”四组归位，并保留 settings.local.json 的个人覆盖标记。

### visualType
StepListScene + Document Map

### keyOnScreenText
指导；配置；扩展；连接；个人覆盖

### videoValue
动态归类比逐项朗读更容易让观众建立“看到文件名就能判断用途”的索引。

## Scene 06｜Git 边界与泄密风险

### sceneId
project-structure-06

### title
共享的提交，个人的忽略，秘密的红线

### purpose
明确哪些内容进入 Git，哪些内容必须留在本机，并回收开场的密码事故。

### narrativeRole
风险转折与安全边界。

### narrationIntent
说明共享的 CLAUDE.md、settings.json、commands、rules、skills、agents 可以进 Git；settings.local.json、CLAUDE.local.md 和任何密钥、token、密码不能提交。

### visualIntent
将共享文件送入 Git，将 local 文件送入 .gitignore，再把数据库密码从 settings.json 连接到 git push 和重写历史。

### visualType
ComparisonScene + Risk Workflow

### keyOnScreenText
提交 Git；.gitignore；不提交；密钥／token／密码

### videoValue
分流与事故链必须通过时间顺序展示，观众才能理解“文件放错地方”如何变成仓库历史风险。

## Scene 07｜配置冲突听谁的

### sceneId
project-structure-07

### title
优先级之外，还要分清覆盖和合并

### purpose
解释多作用域配置冲突时的优先级与两类设置行为。

### narrativeRole
机制收束。

### narrationIntent
依次讲清 Managed、命令行、Local、Project、User 的优先级；标量值覆盖，数组值合并。

### visualIntent
显示一条由高到低的优先级阶梯，再将 model 放入覆盖轨道、permissions.allow 放入合并轨道。

### visualType
ConceptScene + Priority Diagram

### keyOnScreenText
Managed → CLI → Local → Project → User；标量：覆盖；数组：合并

### videoValue
两条不同的动画轨道可以把“优先级顺序”和“设置合并方式”拆开呈现，避免观众只记住一张排序表。

## Scene 08｜四条只读命令看清现场

### sceneId
project-structure-08

### title
不用改配置，先把两层目录看清

### purpose
把结构地图落到可以立即执行的只读检查。

### narrativeRole
动手验证。

### narrationIntent
展示查看用户级、项目级目录，验证 settings.local.json 是否被忽略，再按需查看 CLAUDE.md；补充没有 Git 仓库时检查命令会报错。

### visualIntent
终端依次执行 ls -a ~/.claude、ls -a .claude、git check-ignore .claude/settings.local.json 和 cat CLAUDE.md，每一步只读并显示结果。

### visualType
TerminalScene

### keyOnScreenText
ls -a ~/.claude；ls -a .claude；git check-ignore；只读检查

### videoValue
真实命令的先后顺序和终端反馈可以把抽象的作用域判断变成可复现的现场排查路径。

## Scene 09｜两棵树的判断法

### sceneId
project-structure-09

### title
先看归属，再决定怎么放、要不要提交

### purpose
总结本篇的判断链，并连接系列下一篇。

### narrativeRole
结论收束与下一篇预告。

### narrationIntent
重申先判断路径属于项目还是用户，再判断共享边界、Git 处理和优先级；预告下一篇的交互界面与快捷键。

### visualIntent
将“路径 → 归属 → 共享 → Git → 优先级”收束为一条检查链，右下角出现下一篇预告卡。

### visualType
SummaryScene + Next Episode Preview

### keyOnScreenText
路径 → 归属 → 共享 → Git → 优先级；下一篇：交互界面与快捷键

### videoValue
判断链的顺序回放能形成可复用的排查方法，并为系列下一集留下明确停留点。

