# Codex 核心概念速览 · 第三步：Scene Script

> 目标：把 Video Narrative 的 8 个叙事段落拆成 8 个可制作的视觉事件。每幕只承担一个主要认知任务；本阶段只设计 Scene，不执行文件写入实验，也不展开下一集的安装步骤。

---

## Scene 01｜同一个任务，为什么只完成了一半

### purpose
用项目目录成功、桌面目录未变化的反常结果建立全片问题。

### narrativeRole
开场钩子：先让观众怀疑 Agent 漏做或失灵，再留下“为什么不同位置会有不同结果”的悬念。

### narrationIntent
提出一个同时重命名项目文件和桌面文件的任务，说明执行结束后只有项目文件发生变化，但暂不解释原因。

### visualIntent
同一条任务从中央分成两条路径：项目目录中的文件完成重命名并变为绿色，桌面目录中的文件保持原名并停在灰色状态；两条结果同时定格。

### visualType
`OpeningScene / Split Result`

### keyOnScreenText
```text
统一重命名
项目目录：已修改
桌面目录：未修改
它漏做了吗？
```

### videoValue
同一请求产生两种状态的动态分叉，能立即制造因果疑问，比先讲五个术语更容易让观众追踪后续解释。

### 信息分工
- **声音**：描述任务与反常结果，提出疑问。
- **画面**：证明两个目录的最终状态确实不同。

### narrativeBasis
Video Narrative 第 3 段“一个看似失灵的写文件任务”。

## Scene 02｜先确认谁在行动：Agent

### purpose
建立 Agent 会围绕目标执行并验证一串真实动作的基本认知。

### narrativeRole
执行者确认：证明开场的文件变化不是一段建议，而是 Agent 推进任务后的结果。

### narrationIntent
解释用户给出目标后，Agent 会理解目标、读取环境、决定步骤、执行动作、查看结果，并根据结果继续调整；把这套循环压缩为“想、做、看、再决定”。

### visualIntent
任务卡进入 Agent 核心后，依次点亮“理解目标 → 读取 → 执行 → 查看结果 → 调整”；随后切换到失败测试，展示“运行测试 → 读取报错 → 修改代码 → 再次测试”的闭环。

### visualType
`StepListScene / Agent Loop`

### keyOnScreenText
```text
Agent
想 → 做 → 看 → 再决定
运行测试
读取报错
修改代码
再次测试
```

### videoValue
动作链和测试状态随时间推进，能让观众直接看见 Agent 与普通问答在“是否真正执行并继续决策”上的差异。

### 信息分工
- **声音**：解释 Agent 如何围绕目标自主推进和验证。
- **画面**：用连续动作与失败后重试证明它不是只给建议。

### narrativeBasis
Video Narrative 第 4 段“先确认是谁在行动：Agent”。

## Scene 03｜Sandbox 画出行动边界

### purpose
解释开场的结果分叉来自可访问、可修改范围，而不是 Agent 能力突然消失。

### narrativeRole
第一层因果揭示：从“谁在行动”推进到“行动发生在哪里”。

### narrationIntent
说明 Sandbox 限制 Agent 能访问和修改的文件、命令、网络或其他资源；`workspace-write` 表示工作区内可写，不代表整台机器都可写。

### visualIntent
画面出现发光的工作区边界，项目目录和写入动作位于边界内，桌面目录位于边界外；同一写入箭头在边界内通过，在边界处停止。

### visualType
`ConceptScene / Boundary Map`

### keyOnScreenText
```text
Sandbox
workspace-write
工作区内：可写
边界之外：当前不可直接写入
```

### videoValue
空间边界、资源位置和动作去向能同时可视化，让“工作区可写不等于整机可写”形成直接的空间直觉。

### 信息分工
- **声音**：解释 Sandbox 管理的资源范围及 `workspace-write` 的准确含义。
- **画面**：展示项目文件和桌面文件位于边界两侧，因此产生不同结果。

### narrativeBasis
Video Narrative 第 5 段“Sandbox 不是能力消失，而是边界出现”。

## Scene 04｜越过边界之前，还要经过 Approval

### purpose
把 Sandbox 的技术边界与 Approval 的授权过程拆成两个连续判断。

### narrativeRole
权限模型补全：回答“边界外动作是永远不能做，还是可以先询问用户”。

### narrationIntent
解释动作先判断是否在 Sandbox 边界内；边界内按当前权限执行，边界外再进入 Approval 流程，只有获得许可才能在获准范围内继续。

### visualIntent
一条动作请求进入决策流：先经过“在 Sandbox 内吗”，是则直接执行；否则转入“请求 Approval”，再分成“获得许可 → 继续”和“未获许可 → 停止”。

### visualType
`ComparisonScene / Decision Flow`

### keyOnScreenText
```text
Sandbox：能不能
Approval：问不问
边界内 → 执行
边界外 → 请求许可
获准范围内继续
```

### videoValue
连续决策流能准确表达先后关系，避免把 Sandbox 与 Approval 误解成两个互不相关或能彼此替代的开关。

### 信息分工
- **声音**：解释技术边界与授权策略分别解决什么问题。
- **画面**：演示动作在边界内、获准和未获准三种路径中的状态变化。

### narrativeBasis
Video Narrative 第 6 段“把 Sandbox 与 Approval 拆成两个连续判断”。

## Scene 05｜有权限，还要先读项目规则

### purpose
说明 Agent 即使具备执行权限，也需要明确规则决定应该怎样执行。

### narrativeRole
维度转换：从“动作能不能发生”转向“动作应该按什么约定发生”。

### narrationIntent
解释 Agent 进入项目后先读取 `AGENTS.md`，获得构建命令、测试要求、审查规则和仓库约定；稳定的纠正应写回规则文件，供后续任务复用。

### visualIntent
任务目标与 `AGENTS.md` 两条信息流先汇入 Agent，规则卡依次点亮“构建、测试、审查、仓库约定”；随后一次错误假设被用户纠正，并沉淀为新的稳定规则。

### visualType
`ConceptScene / Rule Injection`

### keyOnScreenText
```text
AGENTS.md
构建命令
测试要求
审查规则
仓库约定
权限决定能做什么
规则决定应该怎样做
```

### videoValue
规则在行动前汇入 Agent、纠正后再写回规则文件的反馈动画，能证明项目约定不是临时提示，也不是等待系统自行记住。

### 信息分工
- **声音**：解释稳定项目规则为什么要显式写入 `AGENTS.md`。
- **画面**：展示规则进入执行上下文并在后续任务中持续复用。

### narrativeBasis
Video Narrative 第 7 段“Agent 开工时应该遵守什么：AGENTS.md”。

## Scene 06｜规则负责确定，上下文负责补充

### purpose
区分 `AGENTS.md`、Memory 与 Chronicle 的信息来源、用途和可靠性边界。

### narrativeRole
上下文补全：在稳定规则已经建立后，引入过去会话和近期屏幕活动提供的补充信息。

### narrationIntent
说明 `AGENTS.md` 承载明确、稳定、需要持续遵守的规则；Memory 提炼过去会话中的可复用信息；Chronicle 补充近期屏幕活动形成的工作上下文，但二者都不能代替明确规则。

### visualIntent
三条不同颜色的信息路径分别从 `AGENTS.md`、Memory、Chronicle 汇入 Agent；规则路径带“确定”标识，另外两条带“补充”标识，Chronicle 旁出现隐私、提示注入和资源限制警示。

### visualType
`ComparisonScene / Context Map`

### keyOnScreenText
```text
AGENTS.md：稳定项目规则
Memory：过去会话的提炼信息
Chronicle：近期屏幕活动上下文
规则负责确定性
上下文负责补充性
```

### videoValue
三条信息流同时汇入 Agent，并用不同可靠性标签保持区分，能避免把项目规则、记忆和屏幕上下文误认为同一种机制。

### 信息分工
- **声音**：解释三种信息来源的职责和使用边界。
- **画面**：呈现信息从哪里来、如何汇入 Agent，以及 Chronicle 的风险提示。

### narrativeBasis
Video Narrative 第 8 段“Memory 与 Chronicle 不是另一份项目规则”。

## Scene 07｜请求没变，边界变了，结果就变了

### purpose
用同一个创建文件请求在两种 Sandbox 模式下的结果对照，验证权限边界确实决定动作结果。

### narrativeRole
实验验证：把前面的抽象概念转成观众可以观察的文件状态变化。

### narrationIntent
说明两轮实验使用完全相同的请求和 Agent，只把模式从 `read-only` 改为 `workspace-write`；第一轮文件树不变，第二轮在工作区生成 `hello.txt`。

### visualIntent
上下两轮实验共用一张请求卡“在当前项目创建 `hello.txt`”：`read-only` 轮的写入动作在边界处停止，文件树不变；`workspace-write` 轮的动作通过，文件树新增 `hello.txt`。

### visualType
`TerminalScene / Controlled Experiment`

### keyOnScreenText
```text
在当前项目创建 hello.txt
read-only：未写入
workspace-write：hello.txt 已创建
请求没有变
Agent 没有变
边界变了
结果就变了
```

### videoValue
严格控制变量的双轮状态对照能亲眼证明权限边界与执行结果之间的因果关系，避免把受限表现误判为 Agent 时灵时不灵。

### 信息分工
- **声音**：指出两轮实验唯一改变的是 Sandbox 边界，并解释结论。
- **画面**：展示相同请求、相同 Agent 与不同文件树结果的完整证据链。

### narrativeBasis
Video Narrative 第 9 段“用同一个请求，让权限边界亲眼可见”。

## Scene 08｜把五个概念合成一套工作模型

### purpose
把执行者、边界、授权、规则和上下文收束为统一模型，并以系列下一集预告结束。

### narrativeRole
总结与系列承接：回答开场问题，给出稳定使用 Agent 的方法，再从概念地图过渡到实际安装与登录。

### narrationIntent
解释 Codex 是会自主推进任务的 Agent，但动作始终受 Sandbox、Approval、项目规则和可用上下文共同影响；最后收束为“给清目标、画好边界、写下规则”，并预告下一集安装与登录。

### visualIntent
任务目标、Agent、Sandbox、Approval、`AGENTS.md`、Memory 与 Chronicle 依次归位成一张统一关系图；模型锁定后，开场的桌面文件结果获得边界解释；最后切换为独立停留约 2～3 秒的下一集预告卡。

### visualType
`SummaryScene / System Map + Preview Card`

### keyOnScreenText
```text
任务目标 → Agent → Sandbox → Approval
AGENTS.md：稳定规则
Memory／Chronicle：补充上下文
给清目标 · 画好边界 · 写下规则
下一集：03 · 安装与登录
Mac · Windows · Linux
```

### videoValue
关系图的逐项组装能把五个分散概念压缩为一套可复用心智模型；独立预告卡则让系列下一步成为明确的最后视觉事件，而不是口播附注。

### 信息分工
- **声音**：回答开场问题，提炼使用方法，并自然引出下一集。
- **画面**：完成统一模型、因果回扣和下一集预告的三段状态转换。

### narrativeBasis
Video Narrative 第 10 段“把五个概念合成一台机器”及系列下一集预告。

# Scene Script 总览

| Scene | 主要认知任务 | Visual Type | 关键变化 |
| --- | --- | --- | --- |
| 01 | 用不同文件结果建立问题 | Opening / Split Result | 同一任务分成成功与未修改两种状态 |
| 02 | 说明 Agent 会执行并验证 | Step List / Agent Loop | 目标变成动作链与测试闭环 |
| 03 | 建立 Sandbox 边界 | Concept / Boundary Map | 项目文件与桌面文件分处边界两侧 |
| 04 | 区分 Sandbox 与 Approval | Comparison / Decision Flow | 越界动作进入授权分支 |
| 05 | 说明 `AGENTS.md` 的规则作用 | Concept / Rule Injection | 规则在行动前注入并在纠正后沉淀 |
| 06 | 区分规则与补充上下文 | Comparison / Context Map | 三条信息流以不同职责汇入 Agent |
| 07 | 用双轮实验验证边界 | Terminal / Controlled Experiment | 相同请求在两种模式下得到不同结果 |
| 08 | 合成统一模型并预告下一集 | Summary / System Map | 概念归位、回扣问题、预告卡进入 |

# Gate 1 内部审查要点

- [x] 8 个 Scene 与 Video Narrative 的 8 个叙事段落一一对应，因果顺序未改变。
- [x] 每个 Scene 只有一个主要认知任务，并包含 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 四个关键视觉事件均已保留：结果分叉、Sandbox／Approval 决策流、规则与上下文信息路径、双模式写入实验。
- [x] 声音负责解释意义和因果，画面负责演示边界、状态变化与验证证据，没有逐句重复。
- [x] 所有屏幕文字均可追溯到当前 Video Narrative，未引入安装步骤、具体菜单路径或其他下游内容。
- [x] Scene 08 明确承载“03 · 安装与登录”预告，并预留独立停留约 2～3 秒及字幕避让空间。

# 下一步边界

下一阶段基于本 Scene Script 生成只包含实际朗读内容的 Narration Script；本阶段不提前编写口播正文、Visual Script、Visual Prototype、TTS 或 Remotion 产物。
