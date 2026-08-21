# Claude Code 视频化 · 第六步：Visual Script

## 全局视觉原则

- 画布为 16:9 横屏，按 1920 × 1080 设计；深色背景，使用蓝色表达主路径、紫色表达能力结构、绿色表达成功状态、黄色表达参数提醒、红色表达边界风险。
- 每个 Scene 只保留一个视觉中心，优先使用过程、分流、命令拆解、文件映射和状态变化，不把文章做成静态长页。
- 终端、命令和路径使用等宽字体；解释性标签控制在短句和单行，给中央过程留出空间。
- 视觉负责证明“发生了什么”，旁白负责解释“为什么这样做”；不让画面逐字复述旁白。
- 所有命令、路径、参数、状态词和卡片文案都必须能追溯到 source.md、content-analysis.md、video-narrative.md 或 scene-script.md。

## 逐 Scene 视觉设计

### Scene 01｜三字符替代重启

- sceneId：slash-commands-01
- visualType：OpeningScene／Process
- 画面结构：左侧是一条灰色重启链路：Ctrl+C → claude → 重新加载项目 → 等待；右侧是一张绿色控制卡：/clear → 空上下文。
- 视觉动作：重启链路逐段点亮并停顿，/clear 从菜单中弹出，绿色路径直接抵达“空上下文”。
- 状态变化：长路径显示“重复加载”，短路径显示“会话内完成”。
- 画面重点：/clear、Ctrl+C、空上下文。
- 与口播互补：口播讲时间浪费和旧对话可用 /resume 找回，画面只演示重启被替代。
- 屏幕文字归属：均来自指定文章与 Scene Script。

### Scene 02｜/ 是 Claude Code 的控制面板

- sceneId：slash-commands-02
- visualType：ConceptScene／Concept Diagram
- 画面结构：中央放一个 Claude Code 控制面板，左侧普通任务气泡指向“模型”，右侧三个控制按钮指向“程序本身”。
- 视觉动作：普通任务先进入模型路径；/clear、/model、/init 三张控制卡绕面板亮起。
- 状态变化：观众看到“派任务”和“调工具”是两条不同路径。
- 画面重点：普通任务、程序控制、/clear、/model、/init。
- 与口播互补：口播给出遥控器类比，画面建立控制对象边界。
- 屏幕文字归属：均可在 source.md 或 Content Analysis 中找到。

### Scene 03｜命令只认消息开头

- sceneId：slash-commands-03
- visualType：ComparisonScene／State Change
- 画面结构：左右两条消息卡；左卡以 /clear 开头，右卡为“帮我解释 /clear 是什么”。
- 视觉动作：左卡的 / 被标记为起始字符，命令进入清空状态；右卡中的 /clear 保持灰色普通文本。
- 状态变化：左侧“执行”，右侧“普通文字”。
- 画面重点：消息开头、参数、普通文字。
- 与口播互补：口播解释为什么规则能避免讨论命令时误触发，画面直接呈现位置差异。
- 屏幕文字归属：来自文章的识别规则和例句。

### Scene 04｜按你正在做什么查命令

- sceneId：slash-commands-04
- visualType：StepListScene／Reference Board
- 画面结构：四列用途卡：进入项目、干活中、交付前、杂项与恢复；每列只放代表命令。
- 视觉动作：先显示四列，再把四列折叠成一个可筛选的 / 菜单；输入 /re 时高亮 /resume、/review 等匹配项。
- 状态变化：完整列表变成“按当前任务筛选”。
- 画面重点：/init、/model、/clear、/compact、/diff、/review、/help、当前菜单。
- 与口播互补：口播解释如何查找和环境差异，画面提供可复用的检索方法。
- 屏幕文字归属：代表命令与分组均来自文章和 Content Analysis。

### Scene 05｜文件名就是命令名

- sceneId：slash-commands-05
- visualType：Process／Concept Diagram
- 画面结构：左侧文件卡 .claude/commands/review.md，中间映射箭头，右侧命令卡 /review；下方分项目级和个人级两条轨道。
- 视觉动作：文件名去掉 .md 后生成 /review；项目级轨道进入版本库，个人级轨道指向 ~/.claude/commands/。
- 状态变化：重复提示从“手动输入”变成“一个命令调用”。
- 画面重点：.claude/commands/review.md、/review、项目级、个人级。
- 与口播互补：口播解释团队共享与个人复用的取舍，画面证明文件名映射关系。
- 屏幕文字归属：路径和作用域来自 source.md。

### Scene 06｜参数与 frontmatter 给命令加边界

- sceneId：slash-commands-06
- visualType：ConceptScene／Process
- 画面结构：左侧命令模板，中央分出 $ARGUMENTS 与 $0、$1、$2，右侧叠加 frontmatter 三层护栏。
- 视觉动作：输入 /fix-issue 123 后，123 替换 $ARGUMENTS；输入 /migrate-component SearchBar React Vue 后，三个值分别落入 $0、$1、$2。
- 状态变化：固定模板变成可复用模板；description、disable-model-invocation、allowed-tools 依次点亮。
- 画面重点：$ARGUMENTS、$0、$1、$2、description、disable-model-invocation、allowed-tools。
- 与口播互补：口播解释整串参数和位置参数的差异，画面让替换关系可见。
- 屏幕文字归属：参数语法与 frontmatter 字段来自指定文章。

### Scene 07｜发送前注入现场数据

- sceneId：slash-commands-07
- visualType：TerminalScene／Data Injection
- 画面结构：左侧 review.md 中的动态占位行，中间预处理节点，右侧 Claude 收到的完整提示。
- 视觉动作：git diff HEAD 在终端执行，输出替换占位行；“命令”标签消失，“真实 diff”进入提示。
- 状态变化：从“请查看改动”变成“提示已带改动内容”。
- 画面重点：git diff HEAD、真实 diff、disableSkillShellExecution。
- 与口播互补：口播解释执行发生在发送前，画面只展示数据流和禁用开关。
- 屏幕文字归属：动态上下文注入语法和开关来自 source.md。

### Scene 08｜命令来源各有自己的名字

- sceneId：slash-commands-08
- visualType：ComparisonScene／Routing Diagram
- 画面结构：中央是命令入口，三条彩色分支分别标记同名优先级、插件命名空间、MCP server 提示。
- 视觉动作：同名 command 与 Skill 进入优先级箭头；插件名加前缀；MCP server 名进入双下划线格式。
- 状态变化：多个来源从“可能混淆”变成“按前缀识别”。
- 画面重点：Skill > command、plugin-name:skill-name、/mcp__server__prompt。
- 与口播互补：口播讲规则，画面负责建立三种来源的形状差异。
- 屏幕文字归属：均来自文章命名空间说明。

### Scene 09｜command 还是 Skill

- sceneId：slash-commands-09
- visualType：ComparisonScene／Concept Diagram
- 画面结构：左右两张选择卡；左侧是单文件 .claude/commands/xx.md，右侧是带配套文件的 .claude/skills/xx/SKILL.md。
- 视觉动作：左侧标记“简单提示／手动喊”；右侧展开模板、脚本、长文档和自动触发等能力标签。
- 状态变化：同一个 /deploy 入口显示两种实现方式，重点从目录结构切换到能力需求。
- 画面重点：command、Skill、手动喊、配套文件、自动触发。
- 与口播互补：口播给出选择标准，画面用能力差异避免把两者讲成互斥产品。
- 屏幕文字归属：来自 source.md 与 Scene Script。

### Scene 10｜五分钟刻出 /explain

- sceneId：slash-commands-10
- visualType：TerminalScene／StepListScene
- 画面结构：五步终端时间线：创建目录、写文件、菜单识别、代码参数、报错参数。
- 视觉动作：前四步依次变绿；第五步切换参数，右侧输出从“平均值”切换到“除数为 0”。
- 状态变化：命令从不存在变成可识别、可调用、可换参数复用。
- 画面重点：mkdir -p .claude/commands、explain.md、/explain、print(sum([1,2,3]) / len([1,2,3]))、ZeroDivisionError。
- 与口播互补：口播按五步讲预期结果，画面表现每一步的完成状态和参数变化。
- 屏幕文字归属：全部来自文章的实战示例。

### Scene 11｜把重复提示变成工作流入口

- sceneId：slash-commands-11
- visualType：SummaryScene／Concept Diagram
- 画面结构：/ 菜单、markdown、参数、现场数据四个节点汇成“个人工作流”；右下角出现下一篇预告卡。
- 视觉动作：四个节点按顺序连接，末端亮起“自己的快捷动作”；预告卡最后淡入。
- 状态变化：斜杠命令从内置菜单收束为可复用工作流入口。
- 画面重点：/ 菜单、markdown、参数、现场数据、37「检查点」、/rewind。
- 与口播互补：口播复述心智模型并承接系列，画面留下结论与下一集停留空间。
- 屏幕文字归属：总结节点由当前生产资料归纳，下一篇标题与 /rewind 来自 source.md。

## 全片视觉类型、组件与动画标准

- 视觉类型：OpeningScene、ConceptScene、ComparisonScene、StepListScene、TerminalScene、SummaryScene；不新增场景组件。
- 组件语言：命令卡、终端窗口、文件卡、状态标签、流程箭头、对比板和预告卡统一圆角、细边框、深色半透明背景。
- 动画顺序：先建立上下文，再出现命令或文件，随后只高亮一条状态变化，最后保留足够阅读时间。
- 动画节奏：不使用一闪而过的快速切换；参数替换、动态注入和 /explain 五步需要完整看清先后。
- 屏幕文字：主标题控制在 1–2 行，卡片短句不堆叠；未来字幕区域与预告卡分离。
- 原型控件：上一幕、下一幕、自动播放、进度提示和 Scene 计数只属于原型外壳，不进入正式 Composition。

## Gate 2 内部审查结论

- Narration Script 的 11 个 Scene 与 Scene Script 顺序、ID 和主要认知任务一致；Scene 正文只包含实际口播，没有视觉说明、制作备注或 Gate 清单。
- Visual Script 的 11 个 Scene 与 Scene Script、Narration Script 一一对应；每幕均定义画面结构、视觉动作、状态变化、重点文字和声音／视觉分工。
- 画面文字语义归属已逐项检查：命令、路径、参数、状态词、下一篇标题和 /rewind 均可追溯到指定文章或前置生产资料；未复用其他视频的业务语义。
- 原型采用既有横屏结构：16:9 stage、Scene 容器、幕内提示、上一幕／下一幕／自动播放和进度提示；不进入 TTS、tts-script.json、音频、字幕、Timeline 或 Remotion。
- 原型视觉事件覆盖 11 个 Scene，构图、信息密度、过程状态与全局视觉原则一致。

**结论：Gate 2 文案与视觉设计通过；Visual Prototype 完成检查后，本任务停止。**
