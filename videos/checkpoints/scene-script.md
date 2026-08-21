# Claude Code 视频化 · 第三步：Scene Script

> 目标：把检查点的机制、边界和实战拆成可制作的视觉事件。

## Scene 01｜安全网没接住 `rm`

### sceneId
`checkpoints-01`

### title
安全网没接住 `rm`

### purpose
用文章开头的反例打破“/rewind 能撤销一切”的错误预期。

### narrativeRole
开场冲突／反共识。

### narrationIntent
讲清 Claude 改了很多文件并执行 `rm`、`mv` 后，回退只能恢复一部分的意外结果。

### visualIntent
展示“代码回来了，但被 `rm` 删除的文件没有回来”的分裂结果。

### visualType
`OpeningScene／Failure State`

### keyOnScreenText
`/rewind`、`code restored`、`note.txt missing`、`rm`

### videoValue
静态定义无法制造“同一次回退有的回来、有的回不来”的冲突，状态分裂能让边界问题立即可见。

## Scene 02｜每条提示前自动拍一张

### sceneId
`checkpoints-02`

### title
每条提示前自动拍一张

### purpose
建立检查点的正确心智模型：编辑前代码快照。

### narrativeRole
概念建立／修正定义。

### narrationIntent
解释每条用户提示都会触发一个检查点，检查点对应时间轴上的章节标记，不需要手动保存。

### visualIntent
让提示 1、提示 2、提示 3 依次落在时间轴上，每个节点连接到编辑前文件状态。

### visualType
`ConceptScene／Timeline`

### keyOnScreenText
`Prompt 1`、`Prompt 2`、`Prompt 3`、`自动快照`、`编辑前状态`

### videoValue
自动生成和时间顺序是抽象关系，时间轴动画可以直接展示“说一句，就多一个回退点”。

## Scene 03｜快照存在会话历史里

### sceneId
`checkpoints-03`

### title
快照存在会话历史里

### purpose
补齐检查点的存储位置、跨会话和清理期限，避免观众把它理解成瞬时内存。

### narrativeRole
机制补充／建立可信度。

### narrationIntent
说明快照位于 `~/.claude/file-history/<session>/`，恢复会话后仍可访问，默认按 `cleanupPeriodDays` 清理。

### visualIntent
从会话节点钻入 `file-history/<session>/`，再展示“跨会话可访问”和“默认 30 天清理”的两个标签。

### visualType
`ConceptScene／Storage Map`

### keyOnScreenText
`~/.claude/file-history/<session>/`、`跨会话`、`默认 30 天`、`cleanupPeriodDays`

### videoValue
路径、持久性和期限之间的关系适合用结构图快速定位，避免口播变成一串难记的名词。

## Scene 04｜先选时间点，再选退法

### sceneId
`checkpoints-04`

### title
先选时间点，再选退法

### purpose
教观众打开回退菜单，并区分恢复状态与压缩上下文。

### narrativeRole
操作教学／概念分叉。

### narrationIntent
讲清 `/rewind` 和空输入框双击 `Esc` 两个入口，以及恢复代码和对话、恢复代码、恢复对话、从此处／到此处总结的差别。

### visualIntent
先显示两个入口，再把菜单分成“恢复”与“总结”两条路径，突出恢复会改变状态、总结不改文件。

### visualType
`StepListScene／Menu Comparison`

### keyOnScreenText
`/rewind`、`Esc Esc`、`恢复代码和对话`、`恢复代码`、`恢复对话`、`总结：不改文件`

### videoValue
操作顺序和选项差异需要状态分叉来理解，视频可以同时展示入口、选择和结果。

## Scene 05｜编辑工具与 Bash 是分水岭

### sceneId
`checkpoints-05`

### title
编辑工具与 Bash 是分水岭

### purpose
明确检查点真正跟踪的对象及其不可回滚边界。

### narrativeRole
关键转折／边界钉死。

### narrationIntent
解释编辑工具直接改文件和 Bash 的 `rm`、`mv`、`cp`、重定向不是同一类改动；外部编辑、并发会话和已发出的副作用也不在检查点范围内。

### visualIntent
用两条轨道对照：`Edit／Write／MultiEdit → 可回`，`Bash rm／mv／cp → 回不来`，再把外部状态放在边界线外。

### visualType
`ComparisonScene／Boundary Diagram`

### keyOnScreenText
`Edit / Write / MultiEdit`、`可回`、`Bash rm / mv / cp`、`回不来`、`外部副作用`

### videoValue
“能不能回”取决于改动路径，不是取决于文件看起来像不像代码；分轨动画比文字列表更能建立判断条件。

## Scene 06｜检查点是本地撤销，Git 是永久历史

### sceneId
`checkpoints-06`

### title
检查点是本地撤销，Git 是永久历史

### purpose
把检查点和 Git 放在正确的分工关系中。

### narrativeRole
关系解释／行动原则。

### narrationIntent
说明检查点自动、细粒度、纯本地且会过期；Git 手动提交、可追溯、可协作，完成小阶段就应提交。

### visualIntent
把“每条提示”的细密检查点轨道和“阶段完成”的 Git commit 轨道叠放，标出各自的覆盖范围。

### visualType
`ComparisonScene／Dual Timeline`

### keyOnScreenText
`本地撤销`、`永久历史`、`自动`、`git commit`、`小步试错`、`阶段存档`

### videoValue
两种工具的粒度和寿命是时间关系，双轨时间轴能把“互补而非替代”变成直觉。

## Scene 07｜编辑工具改错，成功倒带

### sceneId
`checkpoints-07`

### title
编辑工具改错，成功倒带

### purpose
用正向实战验证检查点确实能恢复被跟踪的编辑改动。

### narrativeRole
实践演示／正向验证。

### narrationIntent
带观众完成 `hello → 三行水果 → 不想要版本 → /rewind → hello` 的闭环。

### visualIntent
逐步改变 `note.txt`，在选择“恢复代码和对话”后把文件状态倒回一行 `hello`。

### visualType
`TerminalScene／State Replay`

### keyOnScreenText
`note.txt`、`hello`、`apple`、`banana`、`cherry`、`/rewind`、`恢复成功`

### videoValue
真实文件状态的前后变化是口播无法替代的证据，观众能直接看到编辑工具改动被撤销。

## Scene 08｜Bash 删除，Git 接手

### sceneId
`checkpoints-08`

### title
Bash 删除，Git 接手

### purpose
用反向实战验证 Bash 副作用不在检查点范围，并给出 Git 的恢复位置。

### narrativeRole
反例验证／落地建议。

### narrationIntent
说明 `rm note.txt` 后即使 `/rewind` 也找不回来，只有先前的 Git 提交能用 `git checkout note.txt` 恢复 `hello`。

### visualIntent
让 `note.txt` 在 Bash 轨道上消失，`/rewind` 后仍是 missing，随后 Git commit 发出恢复路径。

### visualType
`TerminalScene／Comparison Process`

### keyOnScreenText
`rm note.txt`、`/rewind`、`note.txt missing`、`git checkout note.txt`、`hello`

### videoValue
这个反例直接证明“回退入口存在”不等于“所有副作用可回”，也证明了为什么要有 Git 提交。

## Scene 09｜把两味后悔药放在正确位置

### sceneId
`checkpoints-09`

### title
把两味后悔药放在正确位置

### purpose
收束判断口诀，形成可复用的工作习惯，并承接系列下一篇。

### narrativeRole
总结／系列预告。

### narrationIntent
总结“编辑工具改的靠 `/rewind`，Bash 和外部副作用不要指望检查点，跑通一个阶段就 `git commit`”，再预告 38「插件参考手册」。

### visualIntent
用简短决策流收束：`小步试错 → 检查点`、`阶段完成 → Git`，下方独立展示下一篇预告卡片。

### visualType
`SummaryScene／Decision Flow`

### keyOnScreenText
`编辑工具 → /rewind`、`阶段完成 → git commit`、`检查点 ≠ Git`、`38 · 插件参考手册`

### videoValue
总结需要把多个边界压缩成一个可执行判断，动态决策流比重复表格更适合作为结尾记忆点。

## Gate 1 内部审查

- 9 个 Scene 顺序与 Video Narrative 一致，均填写了项目要求的九项字段。
- 每个 Scene 只有一个主要认知任务，且 `videoValue` 都来自状态变化、对比、操作或可验证的流程。
- Scene 07 和 Scene 08 成对覆盖 Source 的正向与反向实战，不遗漏关键边界。
- Scene 09 的预告只使用 Source 已给出的下一篇主题，不读取或处理下一篇文章。

**结论：Scene Script 通过 Gate 1。**
