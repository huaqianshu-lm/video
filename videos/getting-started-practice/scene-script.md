# 实战入门：Scene Script

## Scene 01｜一句话交给 AI，为什么会失控

- `sceneId`：`scene-01`
- `title`：一句话交给 AI，为什么会失控
- `purpose`：从常见误解切入，建立观看动机。
- `narrativeRole`：提出问题。
- `narrationIntent`：解释“说清需求然后等结果”会带来方向跑偏、多改文件和 Bug 未修好的返工。
- `visualIntent`：让一个任务卡在没有交接的情况下裂成三个风险结果。
- `visualType`：`Concept Diagram + Failure States`
- `keyOnScreenText`：`说需求 → 等结果`、`方向跑偏`、`多改文件`、`Bug 仍崩溃`
- `videoValue`：风险从同一任务卡动态分裂，能直观看到缺少中间步骤如何造成失控。

## Scene 02｜一趟实战，就这六步

- `sceneId`：`scene-02`
- `title`：一趟实战，就这六步
- `purpose`：给整条视频建立可记忆的全景骨架。
- `narrativeRole`：提出总方法。
- `narrationIntent`：说明开工、探索、规划、动手、验证、交付是六个交接棒，熟练后可压缩但不能跳过。
- `visualIntent`：六根棒按顺序点亮并标出最容易掉棒的探索和验证。
- `visualType`：`Process Diagram + Relay Handoff`
- `keyOnScreenText`：`开工`、`探索`、`规划`、`动手`、`验证`、`交付`
- `videoValue`：顺序和交接关系需要时间上的逐步点亮，静态列表无法同样清楚地表达“不能跳”。

## Scene 03｜先造一个有原点的练手项目

- `sceneId`：`scene-03`
- `title`：先造一个有原点的练手项目
- `purpose`：把抽象流程落到足够小、但包含完整任务的项目。
- `narrativeRole`：进入案例。
- `narrationIntent`：介绍 `wordcount-demo`、两个文件、两个待办目标和开工前 git commit 的意义。
- `visualIntent`：目录和文件生成，原始输出出现，两个问题被标出，git 原点变成可回退节点。
- `visualType`：`Terminal Simulation + File Tree + Checkpoint`
- `keyOnScreenText`：`wordcount-demo`、`wordcount.py`、`sample.txt`、`--top N`、`IndexError`、`git commit`
- `videoValue`：文件生成、原始运行和原点建立是连续过程，能证明练习不是抽象示例而是可运行任务。

## Scene 04｜开工先定最小规则

- `sceneId`：`scene-04`
- `title`：开工先定最小规则
- `purpose`：建立工作目录和项目约束。
- `narrativeRole`：固定边界。
- `narrationIntent`：说明要在 `wordcount-demo` 中启动 `claude`，并让项目根目录的 `CLAUDE.md` 固定标准库依赖和验证命令。
- `visualIntent`：终端路径进入 `wordcount-demo`，两条规则卡落进项目根目录。
- `visualType`：`Terminal Simulation + Rule Card`
- `keyOnScreenText`：`claude`、`CLAUDE.md`、`纯标准库`、`python3 wordcount.py sample.txt`
- `videoValue`：规则从提示语移动到项目文件，能表现“一次说明，整场生效”。

## Scene 05｜探索：先看懂，别急着改

- `sceneId`：`scene-05`
- `title`：探索：先看懂，别急着改
- `purpose`：建立“只读探索先于修改”的肌肉记忆。
- `narrativeRole`：改变默认动作。
- `narrationIntent`：解释 `@wordcount.py`、入口、`sys.argv[1]` 和由探索主动发现缺参风险。
- `visualIntent`：文件被扫描，入口和危险访问被标记，编辑区保持 `未修改`。
- `visualType`：`Code Exploration + File Scan`
- `keyOnScreenText`：`先别改任何代码`、`@wordcount.py`、`main()`、`sys.argv[1]`、`未修改`
- `videoValue`：扫描线和红色风险标记把“先理解再行动”变成可观察状态，而不是一句口号。

## Scene 06｜规划：先出方案，再砸代码

- `sceneId`：`scene-06`
- `title`：规划：先出方案，再砸代码
- `purpose`：建立批准前不编辑的方向闸门。
- `narrativeRole`：把理解转成可审方案。
- `narrationIntent`：说明小改动可用提示约束，大任务用 plan mode；方案包括 `argparse`、`--top`、`most_common` 和缺参提示。
- `visualIntent`：需求进入方案卡，三个改动点出现，状态停在 `等待批准`。
- `visualType`：`Plan Mode Simulation + Decision Gate`
- `keyOnScreenText`：`--top N`、`argparse`、`most_common(N)`、`等待批准`、`plan mode`
- `videoValue`：方案卡停住而代码不动，直接表达“先审方向、后执行”的时间边界。

## Scene 07｜动手，但每处 diff 都过一眼

- `sceneId`：`scene-07`
- `title`：动手，但每处 diff 都过一眼
- `purpose`：展示批准后的受控修改和事中审查。
- `narrativeRole`：将计划落地。
- `narrationIntent`：说明批准后检查红删绿加、改动范围和依赖约束，不应顺手修改 `count_words` 或引入第三方库。
- `visualIntent`：`sys.argv` 被 `argparse` 替换，`--top` 进入 `main()`，范围框只覆盖 `wordcount.py`。
- `visualType`：`Code Diff + Review Overlay`
- `keyOnScreenText`：`- sys.argv[1]`、`+ argparse`、`--top`、`纯标准库`、`范围符合方案`
- `videoValue`：红删绿加和审查框只有在变化中才能说明“动了什么、没动什么”。

## Scene 08｜验证：新、旧、边界三连验

- `sceneId`：`scene-08`
- `title`：验证：新、旧、边界三连验
- `purpose`：把“已完成”从声明变成证据。
- `narrativeRole`：证明结果。
- `narrationIntent`：依次验证 `--top 3`、不带 `--top` 的回归和不带文件名时的友好提示；可选地把 Bug 固化为测试。
- `visualIntent`：三条命令依次亮绿，分别展示前三、完整输出和 `usage`／缺少 `path`。
- `visualType`：`Terminal Simulation + Test Matrix`
- `keyOnScreenText`：`python3 wordcount.py sample.txt --top 3`、`python3 wordcount.py`、`usage:`、`path`
- `videoValue`：三次真实执行及结果差异直接证明新功能、旧功能和边界都被覆盖。

## Scene 09｜交付：概览、commit、log

- `sceneId`：`scene-09`
- `title`：交付：概览、commit、log
- `purpose`：完成本地交付闭环。
- `narrativeRole`：存档并确认结果。
- `narrationIntent`：说明先看只改了 `wordcount.py`，再确认提交信息，最后查看最后一次提交；本地 commit 与远程 push 有边界。
- `visualIntent`：`git status` 概览收缩成一条 commit，随后 `git log -1` 亮出成果。
- `visualType`：`Git Workflow + State Transition`
- `keyOnScreenText`：`git status`、`wordcount.py`、`feat: --top N`、`git commit`、`git log -1`、`push ≠ commit`
- `videoValue`：从未交付到已入库的状态变化必须通过连续动作表现。

## Scene 10｜改岔了：干净退回再重开

- `sceneId`：`scene-10`
- `title`：改岔了：干净退回再重开
- `purpose`：给失败路径提供止损动作。
- `narrativeRole`：处理异常并强化原点价值。
- `narrationIntent`：说明不要在烂摊子上硬补；轻档用 `/rewind`，重档回到开工 git 提交，之后补清指令约束。
- `visualIntent`：错误改动堆叠后分成轻档和重档两条回退路径，最终回到 `clean origin`。
- `visualType`：`Recovery Flow + Checkpoint Diagram`
- `keyOnScreenText`：`改岔了`、`/rewind`、`git restore .`、`git reset --hard`、`clean origin`
- `videoValue`：混乱状态被清空并回到已知正确点，能把“止损”表现为可执行过程。

## Scene 11｜老手不是跳步，而是交接完整

- `sceneId`：`scene-11`
- `title`：老手不是跳步，而是交接完整
- `purpose`：把案例提升为通用工作习惯，并结束系列本篇。
- `narrativeRole`：总结与下一集预告。
- `narrationIntent`：对照新手和老手的六步差异，强调流程是骨架不是镣铐；预告下一篇 Chrome 将让 Claude 操作浏览器。
- `visualIntent`：新手路径缺棒、老手路径逐棒点亮，最后汇聚为完整闭环并出现下一篇预告卡。
- `visualType`：`Comparison Diagram + Summary + Preview Card`
- `keyOnScreenText`：`新手`、`老手`、`先探索`、`亲手验证`、`流程是骨架，不是镣铐`、`下一篇：Chrome：让它操作浏览器`
- `videoValue`：对照、汇聚和预告是连续收束动作，能把局部操作转成可记忆结论，并为下一集留出停留时间。

## Scene Script 总览

| Scene | 类型 | 主视觉任务 |
| --- | --- | --- |
| 01 | Concept Diagram | 展示一句话交给 AI 的失控结果 |
| 02 | Process Diagram | 建立六步交接骨架 |
| 03 | Terminal + File Tree | 生成练手项目并建立 git 原点 |
| 04 | Terminal + Rule Card | 写入最小 `CLAUDE.md` |
| 05 | Code Exploration | 扫描代码但保持未修改 |
| 06 | Plan Mode | 方案等待批准 |
| 07 | Code Diff | 审查实际改动范围 |
| 08 | Terminal + Test Matrix | 三类验证依次通过 |
| 09 | Git Workflow | 从改动概览到提交确认 |
| 10 | Recovery Flow | 两档干净回退 |
| 11 | Comparison + Summary | 老手／新手对照和 Chrome 预告 |

## Gate 1 内部审查结论

- 11 个 Scene 的认知任务、叙事角色、声音方向、视觉方向和 Video Value 均已明确。
- Scene 顺序遵循“问题 → 全景 → 案例 → 控制顺序 → 证据 → 交付 → 止损 → 抽象总结”。
- 画面文字均来自文章命令、文件、输出、原文结论或其直接压缩；未引入下一篇内容。
- 最后一个 Scene 承载下一篇预告，预告为最后视觉事件。

