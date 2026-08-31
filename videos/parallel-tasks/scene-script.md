# 并行任务视频化 · 第三步：Scene Script

> 目标：把叙事拆成只承担一个主要认知任务的 Scene，并明确声音、画面和 Video Value 的分工。

## Scene 01｜两个终端，撞在同一块地上

### 目的

用共享目录中的真实冲突打开问题，让观众意识到“多开会话”本身不是并行方案。

### narrativeRole

制造问题与风险，建立后续 worktree 隔离的必要性。

### narrationIntent

讲述两个终端同时进入同一项目目录，一个改前端登录页，一个修后端 bug，最终都改到 `package.json`，改动覆盖、状态混乱、合并困难。

### visualIntent

左右两个终端共享同一个路径，分别显示不同任务；两边同时写入 `package.json`，文件状态从 Modified 变成冲突警告。

### visualType

Comparison / Terminal

### keyOnScreenText

`同一目录`、`package.json`、`改动覆盖`、`git status：混乱`

### videoValue

冲突状态的出现顺序和两个会话互相覆盖的过程，必须通过时间和画面变化建立直觉，静态文字难以体现风险。

---

## Scene 02｜并行的两个前提

### 目的

把“并行”从多窗口操作提升为可判断的条件。

### narrativeRole

提出整条视频的核心规则，给后续工具选择提供判断框架。

### narrationIntent

解释并行适合互相独立的任务，但还必须确认它们不抢同一份文件，或者已经用 worktree 隔开。

### visualIntent

先展示所有任务排在一条共享车道，随后拆成两条独立车道；中间出现两道门槛，只有同时通过才亮起“并行”。

### visualType

Concept / Process

### keyOnScreenText

`任务互相独立`、`不抢同一份文件`、`并行成立`

### videoValue

两条条件逐个亮起并汇合成一个判断结果，能把抽象铁律变成可视化流程。

---

## Scene 03｜四种方式，先看谁协调

### 目的

建立四种并行方式的地图，减少术语混淆。

### narrativeRole

从原理转入工具选择，说明 worktree 和 `/batch` 是配合工具。

### narrationIntent

用“谁来协调”区分子代理、代理视图、代理团队和动态工作流，同时提醒研究预览与实验性状态。

### visualIntent

横向四张卡片分别显示方式、协调者和使用场景；底部另放 `Worktree` 与 `/batch`，标记为“配合工具”。

### visualType

Comparison / Concept

### keyOnScreenText

`子代理`、`代理视图`、`代理团队`、`动态工作流`、`谁协调？`

### videoValue

四种方式的关系和状态标签需要同时比较，动态排布比连续念名称更容易建立地图。

---

## Scene 04｜Worktree：给每个会话一份副本

### 目的

展示如何从共享目录冲突切换到隔离工作树。

### narrativeRole

提供第一种可操作的解决方案，落实“别抢文件”。

### narrationIntent

解释 `--worktree` 会建立独立副本和分支；补充 `.gitignore`、`.worktreeinclude` 与非交互 worktree 清理三个坑点。

### visualIntent

中央仓库复制成两个 worktree，分别标记 `feature-auth` 和 `bugfix-123`；命令行依次出现创建、列出和清理命令，未跟踪环境文件以警告卡片出现。

### visualType

Terminal / Process

### keyOnScreenText

`claude --worktree feature-auth`、`git worktree list`、`.worktreeinclude`、`git worktree remove`

### videoValue

“同一仓库、不同副本、最终清理”的空间和时间关系，是 worktree 价值的核心证明。

---

## Scene 05｜后台会话：甩出去，一屏盯

### 目的

展示隔离之后如何集中管理多个后台任务。

### narrativeRole

从文件隔离推进到任务调度，说明并行还需要可观察性和介入点。

### narrationIntent

介绍 `--bg`、`claude agents`、`Space` 窥视、回复和 `Enter` 附加；提醒后台会话仍消耗用量。

### visualIntent

先显示命令返回短 ID 和管理命令，再切入总控台，四个会话按工作中、需要输入、已完成和失败分组，某一任务被窥视后重新回到总览。

### visualType

Terminal / Dashboard

### keyOnScreenText

`claude --bg`、`claude agents`、`工作中`、`需要输入`、`已完成`、`失败`

### videoValue

状态变化、后台返回和人工介入形成连续动作，能证明它不是静态任务列表。

---

## Scene 06｜Headless：把任务写进脚本

### 目的

说明重复、规则明确的独立任务如何批量执行。

### narrativeRole

从“人管理多个会话”转向“脚本管理批量任务”。

### narrationIntent

解释 `claude -p`、`--allowedTools`、`--bare`、`--output-format json` 的分工，再用 `for` 循环形成批量雏形；规模更大时才考虑 `/batch` 或动态工作流。

### visualIntent

一个任务输入经过参数卡片，循环分发到多个文件，最终汇总成 JSON 结果；工具批准和快速启动作为小标签出现。

### visualType

Terminal / Process

### keyOnScreenText

`claude -p`、`--allowedTools`、`--bare`、`--output-format json`、`for f in ...`

### videoValue

循环展开和结构化输出是 headless 批量的关键状态，能让观众理解“批量”不是简单复制命令。

---

## Scene 07｜最重要的判断：什么时候别并行

### 目的

用反转纠正“工具越多越应该并行”的误解。

### narrativeRole

回到开头的风险，给出可迁移的决策标准。

### narrationIntent

对比应该并行、应该串行和需要谨慎的场景，强调独立、不抢文件、有先后依赖、小改动和频繁沟通成本。

### visualIntent

三列判断板依次出现：绿色的独立模块和批量文件；红色的 A→B 依赖与共同修改 `package.json`；黄色的五分钟小改动与频繁沟通。

### visualType

Comparison / Decision

### keyOnScreenText

`独立 + 不抢文件`、`有先后依赖 → 串行`、`小活儿别拆`、`控制在三五个以内`

### videoValue

把条件映射成颜色和路径，能在几秒内呈现多种决策结果，避免把结论变成口号。

---

## Scene 08｜六步走通并行主链

### 目的

把工具和判断收束成一条可练习的操作顺序。

### narrativeRole

提供从准备到清理的完整闭环，增强可执行性。

### narrationIntent

按顺序讲接受信任、建立 worktree、确认列表、甩后台、打开代理视图、停止并清理。

### visualIntent

六个步骤节点沿时间轴依次亮起：`claude`、`--worktree`、`git worktree list`、`--bg`、`claude agents`、`stop + remove`。

### visualType

Step List / Terminal

### keyOnScreenText

`1 接受信任`、`2 建隔离副本`、`3 确认`、`4 甩后台`、`5 盯进度`、`6 清理`

### videoValue

完整顺序和最后的清理动作需要通过进度和状态完成来建立记忆，静态命令清单容易遗漏边界。

---

## Scene 09｜并行的正确姿势

### 目的

留下判断线和下一篇预告，完成系列视频收束。

### narrativeRole

总结并行的价值边界，并自然引出下一篇。

### narrationIntent

总结独立任务、不抢文件、worktree、后台和 headless 的关系；强调先判断再拆任务、先隔离再启动会话，并预告下一篇 42「环境变量」。

### visualIntent

中央显示“独立 + 不抢文件”，向三条路径连接 `worktree：隔离`、`后台：调度`、`headless：批量`；下方出现下一篇卡片 `42 · 环境变量`。

### visualType

Summary / Concept

### keyOnScreenText

`先判断，再并行`、`worktree = 隔离`、`后台 = 调度`、`headless = 批量`、`下一篇 42：环境变量`

### videoValue

让三个工具重新回到同一判断框架，并为下一集留出稳定停留时间，是视频化的收束价值。

---

## Scene Script 总览

| Scene | 主要认知任务 | Visual Type |
|-------|--------------|-------------|
| 01 | 共享目录造成覆盖冲突 | Comparison / Terminal |
| 02 | 建立并行两个前提 | Concept / Process |
| 03 | 按协调者区分四种方式 | Comparison / Concept |
| 04 | 用 worktree 隔离文件 | Terminal / Process |
| 05 | 用后台面板管理会话 | Terminal / Dashboard |
| 06 | 用 headless 批量运行 | Terminal / Process |
| 07 | 判断什么时候不该并行 | Comparison / Decision |
| 08 | 走完六步实践链路 | Step List / Terminal |
| 09 | 总结方法并预告下一篇 | Summary / Concept |

## Gate 1 与画面文字边界

- 9 个 Scene 均包含目的、叙事作用、口播方向、画面方向、Scene Type、屏幕重点和 Video Value。
- 所有命令、文件名、状态词和下一篇标题均来自指定 Source，或由本 Scene Script 对 Source 信息做的直接归纳。
- 不使用其他文章的业务语义，不展开下一篇 42 的正文。
- Scene 顺序与 Video Narrative 一致，且每一幕只有一个主要认知中心。

**Scene Script Gate 1：通过。**

## 下一步

基于本 Scene Script 生成纯口播 Narration Script 和互补的 Visual Script，再制作横屏 Visual Prototype。
