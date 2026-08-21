# Claude Code 视频化 · 第六步：Visual Script

> 目标：为每个 Scene 规定画面结构、状态变化和声音／视觉分工，完成 Gate 2 的视觉设计基础。

## 全局视觉原则

### 1. 画面证明边界，不重复定义

口播解释“为什么能回或不能回”，画面展示文件状态、工具路径和回退结果。避免只把“检查点能回滚”作为大字放在屏幕上。

### 2. 一个 Scene 一个视觉中心

每幕只保留一个主要结构：反例状态、时间轴、存储地图、回退菜单、边界分轨、双时间轴、正向实战、反向实战或总结流。

### 3. 状态颜色表达结果

- 蓝色：检查点、提示时间轴和系统机制。
- 绿色：编辑工具改动被成功恢复、Git 恢复成功。
- 红色：风险、缺失、不可回滚的副作用。
- 紫色／黄色：总结分支、期限和辅助路径。

### 4. 原型辅助控件不属于正式画面

原型保留上一幕／下一幕、自动播放和进度提示，便于检查 Scene；这些控件和说明不会进入正式 Composition 或 MP4。

## 逐 Scene 视觉设计

### Scene 01｜安全网没接住 `rm`

- sceneId：`checkpoints-01`
- visualType：`OpeningScene／Failure State`
- 画面结构：左侧为 `claude` 会话和 `/rewind`，右侧为结果分栏。
- 视觉事件：`rm note.txt` 进入红色副作用轨道；点击 `/rewind` 后，代码状态显示 `restored`，`note.txt` 仍显示 `missing`。
- 屏幕重点：`/rewind`、`code restored`、`note.txt missing`。
- 声音／画面互补：口播先制造“应该都回来”的预期，画面用两个不同结果立即打破它。

### Scene 02｜每条提示前自动拍一张

- sceneId：`checkpoints-02`
- visualType：`ConceptScene／Timeline`
- 画面结构：横向时间轴，三个提示卡片下方各连接一个蓝色快照节点。
- 视觉事件：依次出现 `Prompt 1`、`Prompt 2`、`Prompt 3`；每个节点显示“编辑前状态”，最后一条虚线指向 `/rewind`。
- 屏幕重点：`每条提示`、`自动快照`、`编辑前状态`。
- 声音／画面互补：口播讲自动和章节标记，画面让快照密度和回退方向可见。

### Scene 03｜快照存在会话历史里

- sceneId：`checkpoints-03`
- visualType：`ConceptScene／Storage Map`
- 画面结构：会话窗口 → `~/.claude` → `file-history/<session>/` 三层路径。
- 视觉事件：路径逐层展开，右侧出现两个状态标签：`跨会话可访问`、`默认 30 天清理`；底部显示 `cleanupPeriodDays`。
- 屏幕重点：`~/.claude/file-history/<session>/`、`跨会话`、`默认 30 天`。
- 声音／画面互补：口播解释持久性与期限，画面把“存在哪里”和“保存多久”分开呈现。

### Scene 04｜先选时间点，再选退法

- sceneId：`checkpoints-04`
- visualType：`StepListScene／Menu Comparison`
- 画面结构：顶部两个入口按钮 `/rewind` 与 `Esc Esc`；下方为回退菜单，分成“恢复”和“总结”。
- 视觉事件：入口亮起 → 选择一条提示 → 菜单展开；恢复选项连到“文件／对话状态改变”，总结选项连到“文件不变”。
- 屏幕重点：`恢复代码和对话`、`恢复代码`、`恢复对话`、`总结：不改文件`。
- 声音／画面互补：口播解释每个选项，画面只用短标签和结果箭头防止菜单变成文字墙。

### Scene 05｜编辑工具与 Bash 是分水岭

- sceneId：`checkpoints-05`
- visualType：`ComparisonScene／Boundary Diagram`
- 画面结构：中央竖直边界线，左轨“当前会话跟踪”，右轨“检查点视野之外”。
- 视觉事件：`Edit / Write / MultiEdit` 沿左轨进入绿色 `可回`；`Bash rm / mv / cp` 沿右轨进入红色 `回不来`；外部编辑、并发会话、数据库和 push 在边界外出现。
- 屏幕重点：`可回`、`回不来`、`外部副作用`。
- 声音／画面互补：口播给判断规则，画面让不同工具调用走不同轨道。

### Scene 06｜检查点是本地撤销，Git 是永久历史

- sceneId：`checkpoints-06`
- visualType：`ComparisonScene／Dual Timeline`
- 画面结构：上轨密集蓝色检查点，下轨少量绿色 Git commit 节点。
- 视觉事件：上轨标注 `每条提示`、`自动`、`小步试错`；下轨标注 `阶段完成`、`git commit`、`永久历史`；中间出现“不替代”连接词。
- 屏幕重点：`本地撤销`、`永久历史`、`检查点 ≠ Git`。
- 声音／画面互补：口播解释寿命、粒度和协作差异，画面用节点密度建立两种历史的直觉。

### Scene 07｜编辑工具改错，成功倒带

- sceneId：`checkpoints-07`
- visualType：`TerminalScene／State Replay`
- 画面结构：终端左侧显示提示，右侧固定显示 `note.txt` 当前内容。
- 视觉事件：`hello` → 三行水果 → 不想要版本 → `/rewind` 菜单 → `hello`；每次文件变化都有绿色／黄色状态标记。
- 屏幕重点：`apple`、`banana`、`cherry`、`恢复成功`。
- 声音／画面互补：口播报出最小实验步骤，画面承担“确实回到 hello”的证据。

### Scene 08｜Bash 删除，Git 接手

- sceneId：`checkpoints-08`
- visualType：`TerminalScene／Comparison Process`
- 画面结构：三段连续状态卡：Bash 删除、回退失败、Git 恢复。
- 视觉事件：`rm note.txt` 后文件卡变红并消失；`/rewind` 后仍是 `missing`；`git checkout note.txt` 从绿色 `init` 提交拉回 `hello`。
- 屏幕重点：`note.txt missing`、`git checkout note.txt`、`hello`。
- 声音／画面互补：口播说明为什么检查点无能为力，画面展示 Git 从已提交历史恢复文件。

### Scene 09｜把两味后悔药放在正确位置

- sceneId：`checkpoints-09`
- visualType：`SummaryScene／Decision Flow`
- 画面结构：中心决策流，左右两张简短卡片，底部独立预告卡。
- 视觉事件：`小步试错` 指向 `/rewind`；`阶段完成` 指向 `git commit`；`Bash／外部副作用` 指向“先检查提交或备份”；随后出现 `38 · 插件参考手册`。
- 屏幕重点：`编辑工具 → /rewind`、`阶段完成 → git commit`、`检查点 ≠ Git`。
- 声音／画面互补：口播完成记忆口诀和下一篇承接，画面保持三条行动建议，不复述全文表格。

## 全片视觉类型、组件与动画标准

- 场景类型：开场反例、概念时间轴、存储地图、菜单分叉、边界对比、双时间轴、终端状态回放、终端反例、总结决策流。
- 组件类型：深色窗口、命令胶囊、文件卡、时间轴节点、状态标签、双栏对照卡、总结箭头。
- 动画顺序：先出现上下文，再出现主要状态，再出现结果标签；避免多个状态同时跳出。
- 动画速度：关键文件变化和回退结果留出可读停留时间；不使用复杂 3D、粒子或快速转场。
- 文字标准：标题一至两行，命令和路径使用等宽字体；表格被拆成短标签，底部原型字幕不遮挡核心文件状态。

## Gate 2 内部审查结论

- Narration Script 的 9 个 Scene 与 Scene Script 的 ID、顺序和主要认知任务一致。
- 每个 Scene 下只有实际口播，没有视觉说明、制作备注或 Gate 检查清单；后续 TTS 未在本任务范围内生成。
- Visual Script 的每个屏幕文字都能追溯到 Source、Content Analysis、Video Narrative、Scene Script 或本 Visual Script；未引入下一篇文章内容。
- 口播解释原因和判断，画面展示状态变化、工具边界、菜单选择和实战结果，未把画面做成口播文字复读。
- 结尾预告与 Source 中的“下一篇 38「插件参考手册」”一致，且与主体总结分区。

**结论：Gate 2 文案与视觉设计通过；Visual Prototype 完成检查后，本任务停止。**
