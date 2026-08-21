# Claude Code「记忆系统」视频化 · Scene Script

> 每个 Scene 只承担一个主要认知任务。画面文字均来自当前 `source.md` 或本片前置生产资料。

## Scene 01｜记错的 8081

- **sceneId**：`memory-01`
- **title**：记得越多，真的越聪明吗？
- **purpose**：用过时端口的例子建立“错误记忆会误导”的问题。
- **narrativeRole**：问题钩子。
- **narrationIntent**：说明从“什么都塞进记忆”到“未来被旧信息误导”的因果。
- **visualIntent**：让 8081 从“曾经有用”变成“已废弃但仍被提起”。
- **visualType**：状态变化 Demo。
- **keyOnScreenText**：`8081`、`已废弃`、`记错比不记更坑`
- **videoValue**：状态变化能把抽象的记忆污染风险变成直觉。

## Scene 02｜两套记忆并行

- **sceneId**：`memory-02`
- **title**：记忆不是一套，是两套
- **purpose**：给出全片最重要的系统地图。
- **narrativeRole**：核心概念建立。
- **narrationIntent**：区分用户写的 CLAUDE.md 和 Claude 写的自动记忆。
- **visualIntent**：用两条纸张／文件通路汇入“新会话上下文”。
- **visualType**：双通路概念图。
- **keyOnScreenText**：`CLAUDE.md`、`自动记忆`、`新会话上下文`
- **videoValue**：两条并行路径和汇合点适合用动态关系表达。

## Scene 03｜CLAUDE.md

- **sceneId**：`memory-03`
- **title**：你写的，是工作守则
- **purpose**：明确 CLAUDE.md 的写入者、内容和共享属性。
- **narrativeRole**：第一套系统解释。
- **narrationIntent**：说明规则、项目架构和工作流要求应由人手动写入，并可进入版本控制共享。
- **visualIntent**：展示带有规则条目的正式文档，标出“手动写”“全量加载”。
- **visualType**：文档卡片／信息对照。
- **keyOnScreenText**：`用户手动写`、`规则和指令`、`项目级共享`、`全量加载`
- **videoValue**：文件属性和加载方式通过标签变化能快速对比。

## Scene 04｜自动记忆

- **sceneId**：`memory-04`
- **title**：它写的，是工作心得
- **purpose**：解释自动记忆的来源和触发方式。
- **narrativeRole**：第二套系统解释。
- **narrationIntent**：说明用户可以直接要求记住，Claude 也可能从纠正中学习稳定规律。
- **visualIntent**：演示“纠正 → Writing memory”和“新会话 → Recalled memory”的两个状态。
- **visualType**：交互状态 Demo。
- **keyOnScreenText**：`记住：构建命令是 make build`、`Writing memory`、`Recalled memory`
- **videoValue**：写入和召回是时间上的动作，静态列表无法证明它们发生。

## Scene 05｜存储与加载边界

- **sceneId**：`memory-05`
- **title**：它存在哪里，又加载多少？
- **purpose**：建立自动记忆的文件结构和上下文加载边界。
- **narrativeRole**：机制解释。
- **narrationIntent**：说明 `MEMORY.md` 是入口，详细主题放在其他 Markdown 中，新会话只自动加载前 200 行或 25KB。
- **visualIntent**：文件树展开，加载窗口停在 `MEMORY.md` 的边界处。
- **visualType**：文件树＋容量边界。
- **keyOnScreenText**：`~/.claude/projects/<project>/memory/`、`MEMORY.md`、`前 200 行或 25KB`
- **videoValue**：文件层级和截断边界用展开、遮罩和标尺最清楚。

## Scene 06｜/memory

- **sceneId**：`memory-06`
- **title**：记忆不是黑箱
- **purpose**：展示用户如何查看、修改、删除和关闭自动记忆。
- **narrativeRole**：控制权转折。
- **narrationIntent**：解释 `/memory` 的四类作用，并补充 settings.json 和环境变量是关闭入口。
- **visualIntent**：把加载文件列表、文件夹、编辑删除和开关串成一个审计面板。
- **visualType**：命令面板／管理界面。
- **keyOnScreenText**：`/memory`、`查看加载文件`、`读改删`、`自动记忆：ON`
- **videoValue**：管理动作需要状态反馈，才能让观众相信记忆可控。

## Scene 07｜三道筛选

- **sceneId**：`memory-07`
- **title**：记之前，先问三个问题
- **purpose**：给出判断一条信息是否值得记忆的实用规则。
- **narrativeRole**：方法论建立。
- **narrationIntent**：依次解释会不会变、能不能复用、敏不敏感。
- **visualIntent**：把临时端口、当前状态、token 送进拒绝区，把构建命令、架构事实、调试心得送进保留区。
- **visualType**：分流筛选／对照表。
- **keyOnScreenText**：`会不会变？`、`能不能复用？`、`敏不敏感？`
- **videoValue**：筛选和分流是可执行判断，不适合只做静态总结卡片。

## Scene 08｜# 的新旧入口

- **sceneId**：`memory-08`
- **title**：`#` 这个老快捷键，还要用吗？
- **purpose**：纠正旧教程带来的入口误解。
- **narrativeRole**：易错点澄清。
- **narrationIntent**：说明 `#` 是早期做法，当前入口按目标分别使用“记住”“加进 CLAUDE.md”和 `/memory`。
- **visualIntent**：让 `#` 变灰退出，再把三个当前入口分流到不同结果。
- **visualType**：入口迁移图。
- **keyOnScreenText**：`#`、`记住 xxx`、`加进 CLAUDE.md`、`/memory`
- **videoValue**：旧入口被替换的关系用动画分流比口播更直接。

## Scene 09｜记一条并落盘

- **sceneId**：`memory-09`
- **title**：让它记一条：从对话到文件
- **purpose**：开始文章给出的最小实操链路。
- **narrativeRole**：实践演示。
- **narrationIntent**：带观众从玩具项目进入 Claude，要求保存构建命令，再用 `/memory` 或 `cat` 检查。
- **visualIntent**：按时间顺序展示 `mkdir`、启动、记忆请求、写入提示和 `MEMORY.md` 新条目。
- **visualType**：Terminal Demo＋文件落盘。
- **keyOnScreenText**：`mkdir memory-demo`、`claude`、`make build`、`Writing memory`
- **videoValue**：命令执行和文件落盘是流程证据，必须用过程展示。

## Scene 10｜换会话验证召回

- **sceneId**：`memory-10`
- **title**：新会话真的想起来了吗？
- **purpose**：验证记忆的跨会话意义，并保留可选删除动作。
- **narrativeRole**：实践闭环。
- **narrationIntent**：说明退出、重新进入、询问构建方式，看到 `Recalled memory` 才证明跨会话生效；错误记忆也可以删掉。
- **visualIntent**：用“会话 A → MEMORY.md → 会话 B”的时间线显示答案从 `npm build` 切换为 `make build`，最后出现删除入口。
- **visualType**：时间线／状态验证。
- **keyOnScreenText**：`/exit`、`这个项目怎么构建？`、`make build`、`Recalled memory`
- **videoValue**：跨会话验证是文章的核心实操结果，用时间线最容易理解。

## Scene 11｜记住该记的

- **sceneId**：`memory-11`
- **title**：记忆系统的正确姿势
- **purpose**：把两套系统、审计入口和三道筛选收束为一句行动原则。
- **narrativeRole**：结论收束。
- **narrationIntent**：回顾两套记忆和筛选原则，强调记忆要准确、稳定、可复用。
- **visualIntent**：展示“规则／经验／不要记”的三栏最终归位图。
- **visualType**：总结关系图。
- **keyOnScreenText**：`规则 → CLAUDE.md`、`经验 → 自动记忆`、`会变／一次性／敏感 → 不要记`
- **videoValue**：最终归位图把分散规则压缩成可复用的行动模型。

## Scene 12｜下一集预告

- **sceneId**：`memory-12`
- **title**：下一集：Agent Skills
- **purpose**：完成系列结尾预告，把记忆与下一集主题建立源文档已有的对照。
- **narrativeRole**：系列承接。
- **narrationIntent**：说明本集是“被动记住事实”，下一集将进入“主动封装能力”。
- **visualIntent**：把 `记忆：更懂你` 推向 `Skills：会得更多`，保持预告卡片与字幕区域分离。
- **visualType**：预告卡片／概念转场。
- **keyOnScreenText**：`26「Agent Skills」`、`记忆：被动记住事实`、`Skills：主动封装能力`
- **videoValue**：下一集预告是系列视频的最后视觉事件，不能只留在口播中。

## Gate 1 内部检查

- [x] 12 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 每幕只有一个主要认知任务，顺序符合“问题 → 概念 → 机制 → 控制 → 方法 → 实操 → 结论”。
- [x] 所有关键事实均可追溯到 `source.md` 或前置 Content Analysis／Video Narrative。
- [x] Scene 12 的预告来自当前文章结尾，不引入下一篇文章的具体内容。
- [x] 视觉中心以过程、对照、状态和关系为主，未将整条视频设计成连续文字卡片。

