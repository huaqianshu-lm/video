# skill-creator 视频化 · 第三步：Scene Script

## Scene 01｜文件写出来了，为什么还是没被调用？

- **sceneId**：`skill-creator-01`
- **title**：文件写出来了，为什么还是没被调用？
- **purpose**：用一个 Skill 已存在但没有自动出场的失败结果，建立本篇的核心问题。
- **narrativeRole**：问题钩子／反共识。
- **narrationIntent**：解释 `SKILL.md` 可以写得完整，但用户说“帮我提交”时仍可能走通用路径；把怀疑从安装位置转向 `description` 的触发设计。
- **visualIntent**：展示 `SKILL.md` 已存在、自然语言请求进入系统、通用路径被选中而目标 Skill 未命中的状态变化。
- **visualType**：Before／After Process。
- **keyOnScreenText**：`SKILL.md`、`帮我提交`、`Commit message helper`、`未命中 Skill`
- **videoValue**：自动触发失败是一个过程和分支问题，必须通过“输入 → 未命中 → 错误路径”建立直觉，不能只用口播定义。

## Scene 02｜`skill-creator` 是造 Skill 的向导

- **sceneId**：`skill-creator-02`
- **title**：`skill-creator` 是造 Skill 的向导
- **purpose**：建立 `skill-creator` 的工具定位，说明它补的是需求澄清和质量检查。
- **narrativeRole**：答案出现／概念建立。
- **narrationIntent**：解释它不是单纯帮用户生成一个文件，而是像向导一样先询问能力、触发场景、输出格式和测试需求。
- **visualIntent**：将四个问题卡片逐项接入一个“Skill Builder”向导，最后汇聚成可执行的创建计划。
- **visualType**：Concept Diagram／Process。
- **keyOnScreenText**：`skill-creator`、`Capture Intent`、`能干什么？`、`何时触发？`、`输出什么？`、`要不要测试？`
- **videoValue**：提问顺序和意图汇聚是向导价值的核心，动态出现能显示它如何降低空白文件的不确定性。

## Scene 03｜从意图到可分发 Skill 的七步循环

- **sceneId**：`skill-creator-03`
- **title**：从意图到可分发 Skill 的七步循环
- **purpose**：展示 `skill-creator` 覆盖的完整生产闭环，突出测试和反馈不是可有可无的尾声。
- **narrativeRole**：方法展开／流程建立。
- **narrationIntent**：依次解释 Capture Intent、写初稿、建测试、跑一遍评估、按反馈修改、优化描述和打包，并强调修改会回到测试。
- **visualIntent**：用一条有回环的轨道让七个节点按顺序亮起，`评估 → 修改 → 再测试` 形成明显回路，最后产出 `.skill`。
- **visualType**：Process／Task Routing。
- **keyOnScreenText**：`Capture Intent`、`写初稿`、`建测试`、`跑一遍 + 评估`、`按反馈改`、`优化 description`、`打包`
- **videoValue**：循环关系和阶段状态是本幕知识本体，动画能证明它不是“生成一次文件”的线性动作。

## Scene 04｜正文、参考资料和脚本各放在该放的位置

- **sceneId**：`skill-creator-04`
- **title**：正文、参考资料和脚本各放在该放的位置
- **purpose**：说明 Skill 目录的职责分层，以及为什么 `SKILL.md` 要保持精简。
- **narrativeRole**：结构解释／上下文边界。
- **narrationIntent**：解释 `SKILL.md` 负责主要说明，参考文件按需读取，`scripts/` 负责执行；将“少堆上下文”与目录分工连接起来。
- **visualIntent**：展开 `my-skill/` 文件树，把 `SKILL.md`、`reference.md`、`examples.md` 和 `scripts/helper.py` 分别连到“主要说明”“按需读取”“执行脚本”。
- **visualType**：Code Exploration／Folder Exploration。
- **keyOnScreenText**：`my-skill/`、`SKILL.md`、`reference.md`、`examples.md`、`scripts/helper.py`、`500 行以下`
- **videoValue**：文件分区和加载边界适合用树状展开与连线表达，能避免观众把目录结构误解成一份长文档。

## Scene 05｜`description` 是自动触发的总开关

- **sceneId**：`skill-creator-05`
- **title**：`description` 是自动触发的总开关
- **purpose**：把“能做什么”和“什么时候使用”拆成可检查的描述公式。
- **narrativeRole**：关键机制／因果解释。
- **narrationIntent**：对比 `Commit message helper` 与包含“帮我提交”“写个 commit”“生成提交信息”的完整描述，解释真实用户说法如何成为匹配入口。
- **visualIntent**：先显示短描述无法连接到用户请求，再加入多个自然表达词，扫描结果从未命中变成命中目标 Skill。
- **visualType**：Comparison／Trigger Flow。
- **keyOnScreenText**：`只说是什么`、`能做什么 + 什么时候使用`、`帮我提交`、`写个 commit`、`生成提交信息`
- **videoValue**：描述改动前后的命中差异必须通过对照和扫描结果证明，单纯展示公式会变成静态知识卡片。

## Scene 06｜自动不触发时，先查 description

- **sceneId**：`skill-creator-06`
- **title**：自动不触发时，先查 `description`
- **purpose**：把 undertrigger 变成可诊断、可修复的分支。
- **narrativeRole**：障碍处理／方法补全。
- **narrationIntent**：说明自动触发失败但直接调用成功时，Skill 正文大概率正常，应优先补充真实触发词、扩大合理场景描述并重新测试。
- **visualIntent**：左侧“我改了啥？”没有命中，右侧 `/summarize-changes` 成功加载同一正文，诊断卡将问题指向 `description`。
- **visualType**：Troubleshooting Flow／Two-path Comparison。
- **keyOnScreenText**：`自动触发：未命中`、`/summarize-changes：成功`、`关键词不足`、`补充触发词 → 重新测试`
- **videoValue**：两条路径的结果差异是定位问题的证据，能让观众记住“自动失败不等于 Skill 没装好”。

## Scene 07｜个人习惯还是项目规矩？

- **sceneId**：`skill-creator-07`
- **title**：个人习惯还是项目规矩？
- **purpose**：解释个人 Skill 与项目 Skill 的路径、范围和共享方式。
- **narrativeRole**：范围决策／落地选择。
- **narrationIntent**：对比 `~/.claude/skills/` 和 `.claude/skills/`，说明前者跨项目跟着个人走，后者跟着仓库并提交 Git 给团队共享，同时提醒先检查外部 Skill。
- **visualIntent**：左右文件树分别标注“个人／跨项目”和“项目／团队”，右侧追加 Git 共享状态与信任检查警示。
- **visualType**：Scope Comparison／Repository Flow。
- **keyOnScreenText**：`~/.claude/skills/<skill-name>/`、`.claude/skills/<skill-name>/`、`个人`、`项目`、`提交 Git`、`先检查外部 Skill`
- **videoValue**：路径决定使用范围，目录和 Git 状态是软件协作中的可观察证据，适合通过并列画面建立判断。

## Scene 08｜从意图开始造 `summarize-changes`

- **sceneId**：`skill-creator-08`
- **title**：从意图开始造 `summarize-changes`
- **purpose**：将前面的设计方法落到一个最小、可验证的实战 Skill。
- **narrativeRole**：实践展开／创建动作。
- **narrationIntent**：说明目标是总结当前 Git 仓库未提交改动，触发说法包括“我改了啥”“总结一下我的改动”，输出为 2～3 条要点；动态上下文注入只作为文章中的示例。
- **visualIntent**：从意图卡片开始，生成 `summarize-changes/`、`SKILL.md`、触发词和 2～3 条输出规则，最后显示 ``!`git diff HEAD` `` 作为注入标记。
- **visualType**：Task Execution／Terminal Demo。
- **keyOnScreenText**：`summarize-changes`、`我改了啥`、`总结一下我的改动`、`2～3 条要点`、``!`git diff HEAD` ``
- **videoValue**：从用户表达、目录和输出规则逐项成形，能证明一个可触发 Skill 的设计如何落地；命令只作示意，不在本任务中执行。

## Scene 09｜自动调用和直接调用，汇入同一个结果

- **sceneId**：`skill-creator-09`
- **title**：自动调用和直接调用，汇入同一个结果
- **purpose**：验证自动触发与手动调用分别覆盖匹配层和正文层，并共同得到预期输出。
- **narrativeRole**：验证闭环／证据确认。
- **narrationIntent**：分别说明自然语言“我改了啥？”用于验证自动触发，`/summarize-changes` 用于直接调用；两条路径都应输出 2～3 条改动要点。
- **visualIntent**：左右两路从不同入口进入同一份 `SKILL.md`，汇合到一致的改动摘要；底部用诊断矩阵显示 A／B 结果的判断方式。
- **visualType**：Dual-path Verification／Decision Diagram。
- **keyOnScreenText**：`我改了啥？`、`/summarize-changes`、`同一份 SKILL.md`、`2～3 条改动要点`、`A 失败 + B 成功：优化 description`
- **videoValue**：只有两条入口汇合并显示不同失败组合的解释，才能证明 Skill 的触发层和执行层已经分别被验证。

## Scene 10｜造得对、叫得动、验得过，最后才能发出去

- **sceneId**：`skill-creator-10`
- **title**：造得对、叫得动、验得过，最后才能发出去
- **purpose**：收束创建、触发、验证和分发，并完成当前系列的下一篇预告。
- **narrativeRole**：结论收束／系列预告。
- **narrationIntent**：总结 Skill 的难点是触发而不只是写文件，回顾意图、description、测试和迭代，说明通过验证后可打包成 `.skill`，最后预告 29「Agent teams 智能体团队」。
- **visualIntent**：将完整目录压缩成 `.skill` 文件，四个总结节点依次亮起，最后切换到独立的下一篇预告卡并留出停留时间。
- **visualType**：Summary Flow／Preview Card。
- **keyOnScreenText**：`意图`、`description`、`测试`、`迭代`、`.skill`、`29「Agent teams 智能体团队」`
- **videoValue**：创建到分发的闭环和系列预告需要有顺序、状态和停留，视频能把方法论压缩成一条可记忆路径。

## Gate 1 内部检查

- [x] 10 个 Scene 均包含 `sceneId`、`title`、`purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 每幕只承担一个主要认知任务，顺序为问题钩子、向导定位、流程建立、结构分层、触发机制、故障诊断、范围选择、实战创建、双路径验证、分发收束。
- [x] 叙事不是按文章 01～08 章节直接切分，而是按照“失败 → 机制 → 方法 → 验证”的观众认知顺序重组。
- [x] 口播和画面分工明确：口播解释原因、规则和判断，画面展示匹配、目录、路径、状态和结果。
- [x] 所有命令、路径、文件名、触发词和预告均可追溯到本篇 `source.md` 或由其直接压缩；文章命令只作为画面示例，不在本任务中执行。
- [x] Scene 10 的下一篇预告来自当前文章末尾，只显示主题，不引入 29「Agent teams 智能体团队」的正文内容。

## 下一步

基于以上 Scene 冻结口播意图，编写纯口播的 Narration Script，并同步设计 Visual Script 与横屏 Visual Prototype。
