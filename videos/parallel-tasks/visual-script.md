# 并行任务视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 画面不能只是重复口播

口播解释并行的条件、工具的分工和判断成本；画面展示共享目录如何冲突、worktree 如何分叉、后台状态如何变化、脚本如何批量展开。

### 2. 视觉承担证明和演示

所有命令只保留能推动动作的部分。画面通过文件状态、分支路径、任务状态和循环结果证明工具解决了什么问题，不把整段文章缩成文字卡片。

### 3. 一个 Scene 只表达一个视觉中心

开头只表现冲突，Scene 02 只建立两个前提，Scene 03 只建立方式地图；worktree、后台和 headless 分别对应隔离、调度和批量。

### 4. 少做页面，多做过程

界面统一使用深色终端、分支线、任务卡和状态面板。每幕至少有一次状态变化：覆盖、分叉、排队、完成、失败、清理或汇合。

### 5. 屏幕文字必须有 Source 归属

标题、命令、文件名、状态、参数和下一篇标题全部来自 `41-parallel-tasks.md`，或是对其信息的直接压缩。不得带入其他文章的业务语义或参考视频固定文案。

### 6. 横屏安全区与节奏

按 1920 × 1080、16:9 设计，主标题控制在 1—2 行，终端和卡片给字幕预留底部安全区。每幕先让主要状态出现，再切换到下一幕；最后一幕为下一篇预告保留约 2—3 秒停留。

---

# Scene 01｜两个终端，撞在同一块地上

## 视觉目标

用同一目录中的两条并发修改路径，直观看到覆盖和混乱如何产生。

## 主要画面

横屏画面左右分成两个终端窗口，顶部路径都显示 `/project`。左侧任务为 `frontend login page`，右侧任务为 `backend bug fix`。两边先后写入 `package.json`，中心出现一条被覆盖的 diff 线，底部 `git status` 从干净变为 `Modified / Conflict?`。

## 动画

1. 两个终端从左右进入，路径相同。
2. 左侧写入依赖，出现 `package.json Modified`。
3. 右侧写入另一份依赖，左侧状态被覆盖并闪出警告。
4. 中央合并线断开，标题落下：`同一目录，不等于并行`。

## 屏幕文字

`/project`、`frontend login page`、`backend bug fix`、`package.json`、`git status`、`改动覆盖`

## Visual Type

Comparison / Terminal Demo

---

# Scene 02｜并行的两个前提

## 视觉目标

把“独立”和“不抢文件”表现成必须同时通过的两道门槛。

## 画面结构

左侧是一条拥挤的共享车道，三个任务卡排队并互相撞击；右侧是两条独立车道，任务分别驶向自己的文件区域。画面中央放两个条件卡，底部汇合到 `并行成立`。

## 动画

1. 共享车道出现“排队”和“覆盖”状态。
2. 任务卡被拆到两条独立车道。
3. `任务互相独立` 亮起。
4. `不抢同一份文件` 亮起。
5. 两道门同时通过，`并行成立` 变为绿色。

## 屏幕文字

`任务互相独立`、`不抢同一份文件`、`worktree 隔离`、`并行成立`

## Visual Type

Concept Diagram / Process

---

# Scene 03｜四种方式，先看谁协调

## 视觉目标

用同一套版式比较四种并行方式，突出“谁协调”而不是堆术语。

## 画面结构

四张横向卡片依次为：

- `子代理`：Claude 在当前会话中协调。
- `代理视图`：人甩任务并查看状态，标记 `研究预览`。
- `代理团队`：Claude 统筹多个会话，标记 `实验性`。
- `动态工作流`：脚本批量并交叉验证，标记 `研究预览`。

底部放两枚小标签：`Worktree：配合工具`、`/batch：配合工具`。

## 动画

1. 先出现大标题 `谁来协调？`。
2. 四张卡片从同一中心向外排开。
3. 每张卡片先亮协调者，再亮使用场景。
4. 预览和实验状态最后以低饱和标签显示，避免抢过主结论。

## 屏幕文字

`子代理`、`代理视图`、`代理团队`、`动态工作流`、`谁来协调？`、`Worktree`、`/batch`

## Visual Type

Comparison Matrix / Concept

---

# Scene 04｜Worktree：给每个会话一份副本

## 视觉目标

用分叉的工作树证明会话之间可以互不触及文件。

## 画面结构

中央仓库节点 `main project` 向左、右分叉，分别连接 `feature-auth` 和 `bugfix-123`。底部终端展示 `claude --worktree feature-auth`、`git worktree list` 和 `git worktree remove` 的短片段；右侧警告卡显示 `.worktreeinclude`。

## 动画

1. 共享目录画面收缩为中央仓库。
2. `claude --worktree feature-auth` 触发第一条分支。
3. 第二个会话进入另一分支，两个文件列表分别变化。
4. `.gitignore`、`.worktreeinclude` 和清理提示依次出现。
5. `git worktree remove` 执行后，练习分支淡出。

## 屏幕文字

`claude --worktree feature-auth`、`feature-auth`、`bugfix-123`、`.gitignore`、`.worktreeinclude`、`git worktree remove`

## Visual Type

Terminal Demo / Process Diagram

---

# Scene 05｜后台会话：甩出去，一屏盯

## 视觉目标

展示后台任务从创建、返回短 ID 到状态总览和人工介入的完整变化。

## 画面结构

左侧终端先显示 `claude --bg "..."`，下方输出 `backgrounded · 7c5dcf5d` 以及 `claude agents`、`claude attach`、`claude logs`、`claude stop`。右侧总控台分四组显示 `工作中`、`需要输入`、`已完成`、`失败`。

## 动画

1. 后台命令从输入光标开始执行。
2. 短 ID 和管理命令逐行出现。
3. 总控台展开，任务从工作中移动到已完成。
4. 另一个任务变为需要输入，出现 `Space：窥视` 和 `Enter：附加`。
5. 右下角显示克制的成本提示：`并行会消耗用量`。

## 屏幕文字

`claude --bg`、`backgrounded`、`claude agents`、`工作中`、`需要输入`、`已完成`、`失败`、`Space`、`Enter`

## Visual Type

Terminal Demo / Dashboard Process

---

# Scene 06｜Headless：把任务写进脚本

## 视觉目标

把非交互命令、参数和循环之间的关系做成一条清晰的数据流。

## 画面结构

左侧是任务输入卡 `总结这个文件`，中间是命令参数链 `-p → --allowedTools → --bare → --output-format json`，右侧是循环展开的三个文件和 JSON 结果卡。

## 动画

1. 输入卡进入 `claude -p`。
2. 工具批准、快速启动和结构化输出三个参数依次挂接。
3. `for f in src/*.py` 展开为三个任务卡。
4. 三个任务回流成一个结构化 JSON 结果。
5. 角落补充 `/batch / workflows`，标记为更大规模选择。

## 屏幕文字

`claude -p`、`--allowedTools`、`--bare`、`--output-format json`、`for f in src/*.py`、`JSON`

## Visual Type

Terminal Demo / Data Flow

---

# Scene 07｜最重要的判断：什么时候别并行

## 视觉目标

把并行决策做成三种明确的视觉路径，突出“不该并行”的边界。

## 画面结构

三列卡片：绿色 `适合并行`，包含 `三个独立模块` 和 `批量跑多个文件`；红色 `应该串行`，包含 `先 A，再基于新 A 改 B` 和 `共同修改 package.json`；黄色 `先评估`，包含 `五分钟小改动`、`频繁互通结果`。

顶部横跨三列放出判断式：`独立 + 不抢文件`。

## 动画

1. 判断式先出现，作为筛选门。
2. 绿色案例通过门并分流。
3. 红色案例在门前停住，出现 `串行`。
4. 黄色案例在门边等待，出现 `看情况`。
5. 右下角补上 `手动控制在三五个以内`。

## 屏幕文字

`独立 + 不抢文件`、`适合并行`、`应该串行`、`先评估`、`小活儿别拆`、`三五个以内`

## Visual Type

Decision Matrix / Comparison

---

# Scene 08｜六步走通并行主链

## 视觉目标

用可追踪的步骤时间轴展示从准备到清理的完整实践链路。

## 画面结构

横向六节点时间轴：

`1 claude` → `2 --worktree` → `3 git worktree list` → `4 --bg` → `5 claude agents` → `6 stop + remove`。

每个节点下方有一个简短状态：`接受信任`、`建副本`、`确认`、`甩后台`、`盯进度`、`清理`。

## 动画

1. 节点按 1 到 6 依次亮起。
2. 第 2 节点展开两个隔离分支。
3. 第 4、5 节点切换到后台状态和总控台。
4. 第 6 节点关闭状态卡并回收分支。
5. 时间轴首尾连线，形成可重复的练习闭环。

## 屏幕文字

`接受信任`、`--worktree`、`git worktree list`、`--bg`、`claude agents`、`stop + remove`

## Visual Type

Step List / Process Timeline

---

# Scene 09｜并行的正确姿势

## 视觉目标

把三个工具重新放回同一条判断线上，同时完成下一集预告。

## 画面结构

中央大卡片为 `先判断，再并行`，下方条件为 `独立 + 不抢文件`。三条连线分别指向：`worktree / 隔离`、`后台 / 调度`、`headless / 批量`。底部独立放置预告卡：`下一篇 42 · 环境变量`。

## 动画

1. 两个前提从左右汇入中央判断卡。
2. 三个工具节点依次亮起，形成闭环。
3. `下一篇 42 · 环境变量` 从底部上移，避开字幕安全区。
4. 最终停留在判断卡和预告卡，留出约 2—3 秒阅读时间。

## 屏幕文字

`先判断，再并行`、`独立 + 不抢文件`、`worktree / 隔离`、`后台 / 调度`、`headless / 批量`、`下一篇 42 · 环境变量`

## Visual Type

Summary Diagram / Preview Card

---

## 全片视觉类型、组件与动画标准

### 视觉类型分布

| 类型 | Scene |
|------|-------|
| Terminal Demo | 01、04、05、06、08 |
| Process / Diagram | 02、04、06、08、09 |
| Comparison / Decision | 01、03、07 |
| Summary / Preview | 09 |

### 组件标准

- `TerminalWindow`：深色终端、短命令、逐行状态输出。
- `WorktreeGraph`：中央仓库、分支副本、清理回收。
- `AgentDashboard`：状态分组、短 ID、窥视和附加动作。
- `DecisionCard`：绿色、红色、黄色三类判断路径。
- `ProcessTimeline`：六步链路和节点完成状态。
- `PreviewCard`：下一篇标题，置于字幕上方安全区。

### 动画标准

- 一级动画负责信息进入、分叉、汇合和完成状态。
- 二级动画只用于当前操作对象的轻微高亮，不让所有卡片同时闪动。
- 终端逐行出现，避免一次性铺满。
- Scene 07 的判断卡先出现，案例随后分流，保证结论先于细节。
- Scene 09 的预告卡最后出现并停留，不与底部字幕区域叠放。

## Gate 2 内部审查结论

- 9 个 Scene 在 Narration Script、Scene Script 和 Visual Script 中一一对应。
- 口播正文只承担解释、因果、转折和判断，未把画面说明、制作备注或 Gate 检查文字放入 Scene 正文。
- 画面承担冲突、分叉、状态和批量过程，没有把口播逐句复制到卡片上。
- 所有屏幕文字均能追溯到 Source 或本视频前置生产资料；下一篇预告只使用 Source 末尾明确给出的 42「环境变量」。
- 原型计划为 1920 × 1080 横屏，字幕安全区与最终预告卡已预留，未引入 TTS、音频、字幕或 Timeline。

**Gate 2：通过。**

## 下一步

完成 `visual-prototype.html` 静态原型检查后停止本次任务，不进入 TTS、Remotion 正式实现或渲染。
