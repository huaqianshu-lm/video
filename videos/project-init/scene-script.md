# Project Init 视频化 · 第三步：Scene Script

> 目标：把 Video Narrative 拆成 10 个可制作的视觉事件。每幕只承担一个主要认知任务。

## Scene 01｜同一个问题被问了三遍

### sceneId
project-init-01

### title
同一个项目问题，反复从头问

### purpose
让观众进入接手陌生 Node 项目的真实场景，感受到新会话重复摸索的烦恼。

### narrativeRole
开场问题与共鸣。

### narrationIntent
讲述测试命令、包管理器和项目情况在不同会话中被重复询问。

### visualIntent
用三个会话卡片重复出现同类问题，让“失忆”成为可见的工作流循环。

### visualType
IDE Simulation + Workflow

### keyOnScreenText
测试怎么跑？；npm 还是 pnpm？

### videoValue
重复出现的会话状态和问题计数只有通过时间顺序才能让观众感受到浪费，而不是只知道一个结论。

## Scene 02｜根因不是 Claude 笨

### sceneId
project-init-02

### title
缺的是项目说明书

### purpose
把痛点从“工具能力不足”转成“项目缺少跨会话上下文载体”。

### narrativeRole
问题归因与概念转折。

### narrationIntent
解释没有 CLAUDE.md 时，每次会话都要重新摸索；有了说明书，后续会话可以从已有上下文开始。

### visualIntent
把“空白上下文”和“项目说明书”并置，显示工作起点的差异。

### visualType
Concept Visualization

### keyOnScreenText
从零摸索；项目说明书

### videoValue
空白文件逐渐变成说明书的视觉变化，能把“上下文沉淀”从抽象比喻变成过程。

## Scene 03｜认识 /init

### sceneId
project-init-03

### title
/init：先把项目读一遍

### purpose
给出 /init 的清晰定义和本片核心承诺边界。

### narrativeRole
解决方案登场。

### narrationIntent
说明 /init 是 Claude Code 的内置斜杠命令，会扫描项目并生成 CLAUDE.md 草稿。

### visualIntent
让 /init 从输入框出现，连到项目文件树，再落到一个新的 CLAUDE.md 文件。

### visualType
Terminal Simulation + Process

### keyOnScreenText
/init；生成 CLAUDE.md 草稿

### videoValue
命令输入、扫描和文件落盘是一个有先后关系的动作链，视频可以直接展示这个因果过程。

## Scene 04｜三步跑起来

### sceneId
project-init-04

### title
进入根目录，输入一个命令

### purpose
给观众一条可以照着操作的最短路径。

### narrativeRole
从概念转入行动。

### narrationIntent
讲清先进入项目根目录，再启动 claude，最后输入 /init。

### visualIntent
按顺序展示终端路径、claude 启动和 /init 输入，其他界面保持克制。

### visualType
Terminal Demo

### keyOnScreenText
cd /path/to/your-project；claude；/init

### videoValue
逐步出现的命令和光标位置能明确展示顺序，避免观众只记住一个孤立的 /init。

## Scene 05｜它扫描哪些项目事实

### sceneId
project-init-05

### title
从依赖、文档和结构开始扫描

### purpose
解释 /init 背后不是凭空生成，而是先读取项目可见事实。

### narrativeRole
机制解释。

### narrationIntent
说明依赖清单帮助判断技术栈和命令，README 帮助理解项目，配置和代码结构帮助识别目录与入口。

### visualIntent
用扫描光标依次经过 package.json、README、配置和 src/，再汇聚到项目地图。

### visualType
Codebase Scan

### keyOnScreenText
Dependencies；README；Config + Code Structure

### videoValue
扫描顺序和信息来源的连接关系需要动态展示，才能让观众理解草稿的事实来源。

## Scene 06｜已有文件不会被粗暴覆盖

### sceneId
project-init-06

### title
已有 CLAUDE.md：建议改进，不直接覆盖

### purpose
保留原文强调的安全边界，纠正“再跑一次就会丢文件”的担心。

### narrativeRole
关键细节与风险解除。

### narrationIntent
说明已有 CLAUDE.md 时，/init 会建议改进，而不是粗暴覆盖原文件。

### visualIntent
让已有文件保持不变，旁边出现改进建议列表，明确区分“保留”和“建议”。

### visualType
File State Comparison

### keyOnScreenText
CLAUDE.md · unchanged；建议改进

### videoValue
文件状态“保留”与建议列表“新增”同时出现，能直观看出行为不是覆盖。

## Scene 07｜草稿里面有什么

### sceneId
project-init-07

### title
一份项目说明书的五个区块

### purpose
让观众看懂生成结果，而不是只知道文件被创建了。

### narrativeRole
结果拆解。

### narrationIntent
解释项目概述、技术栈、目录结构、常用命令和开发规范分别回答什么问题。

### visualIntent
让 CLAUDE.md 以五个区块逐项展开，并把每个区块连到对应的重复问题。

### visualType
Document Reveal

### keyOnScreenText
概述 · 技术栈 · 目录结构 · 常用命令 · 开发规范

### videoValue
区块逐项出现并与问题连线，可以把一份 Markdown 的结构和实际收益同时讲清楚。

## Scene 08｜最小项目跑通闭环

### sceneId
project-init-08

### title
用两个文件验证 /init

### purpose
提供一个小而完整的可验证案例。

### narrativeRole
操作演示与证据。

### narrationIntent
讲述创建 init-demo、写入 package.json 和 index.js、启动 Claude Code、运行 /init、检查 CLAUDE.md 的顺序。

### visualIntent
用极简文件树和终端命令展示输入文件、生成文件和测试命令被识别。

### visualType
Terminal Demo + File Tree

### keyOnScreenText
init-demo/；package.json；index.js；CLAUDE.md

### videoValue
从两个输入文件到一个说明书文件的变化是可复现的最小证据，视频能让观众看到闭环而非抽象描述。

## Scene 09｜草稿必须人工补一刀

### sceneId
project-init-09

### title
自动扫描是起点，不是终稿

### purpose
建立正确使用边界，防止观众把生成文件当成完整团队手册。

### narrativeRole
转折与责任边界。

### narrationIntent
说明分支规范、部署流程、Review 要求和业务背景等隐性知识需要人工补充，CLAUDE.md 应持续迭代。

### visualIntent
把“扫描得到的事实”和“待人工补充的约定”分成两条流，最后合并成可用手册。

### visualType
Comparison + Checklist

### keyOnScreenText
客观事实：自动打底；团队约定：人工补充

### videoValue
两条知识来源的分流与合流能清楚展示人与工具的职责边界，单靠口播容易被误解为全自动。

## Scene 10｜把失忆变成起点

### sceneId
project-init-10

### title
先 /init，再审阅和迭代

### purpose
总结本篇动作、价值和限制，并自然连接下一篇。

### narrativeRole
结论收束与系列预告。

### narrationIntent
重申进根目录、启动 Claude、输入 /init、检查草稿、人工补充；预告下一篇的项目结构。

### visualIntent
把整条链路收束为一条稳定路径，右下角出现“下一篇：项目结构”预告卡。

### visualType
Summary + Next Episode Preview

### keyOnScreenText
扫描 → 草稿 → 审阅 → 迭代；下一篇：项目结构

### videoValue
链路回放和预告卡需要时间上的停留，才能形成记忆点并为系列下一集建立期待。

