# Claude Code 常见工作流 · Scene Script

## Scene 01｜日常活儿，其实就四类

- **sceneId**：`common-workflows-01`
- **title**：日常活儿，其实就四类
- **purpose**：把观众熟悉但杂乱的编码工作压缩成四类任务地图。
- **narrativeRole**：Opening Hook／建立问题
- **narrationIntent**：说明接手项目、修 bug、重构、写测试占据日常工作的大头，并引出每类任务需要不同打法。
- **visualIntent**：四张任务卡从工作台上依次亮起，形成“探索／修 bug／重构／写测试”的可见分类。
- **visualType**：`Concept Diagram + Cards`
- **keyOnScreenText**：`探索`、`修 bug`、`重构`、`写测试`
- **videoValue**：让抽象的“日常工作大头”变成四个可快速识别的视觉对象，为后续分流建立地图。

## Scene 02｜先按动不动代码选工具

- **sceneId**：`common-workflows-02`
- **title**：先按动不动代码选工具
- **purpose**：建立四类任务最关键的判断轴和各自的检查重点。
- **narrativeRole**：Frame／定义分流规则
- **narrationIntent**：解释探索只读、修 bug 修改、重构修改但行为不变、写测试新增验证资产的差异。
- **visualIntent**：用四行分流表对齐“代码影响／Claude 在做什么／用户盯什么”，让风险差异可比较。
- **visualType**：`Comparison Table`
- **keyOnScreenText**：`只读`、`修改`、`行为不变`、`新增测试`
- **videoValue**：表格的并列关系比口播更快建立任务选择逻辑，避免四个模板被误认为可以互换。

## Scene 03｜探索：从大到小三层问

- **sceneId**：`common-workflows-03`
- **title**：探索代码库，从大到小三层问
- **purpose**：给陌生代码库探索建立稳定的提问顺序和只读边界。
- **narrativeRole**：Method／展示第一种工作流
- **narrationIntent**：依次解释整体架构、相关文件协同和核心执行链路；说明前两层适合 Plan Mode。
- **visualIntent**：镜头从项目全景缩放到认证文件，再沿登录调用链连接到数据库，过程中保持“只读”状态。
- **visualType**：`Code Exploration + Process`
- **keyOnScreenText**：`整体架构 → 相关文件 → 执行链路`、`只读`
- **videoValue**：缩放和连线能直接展示“从面到线”的认知路径，体现探索不是盲目翻文件。

## Scene 04｜修 bug：别只让报错消失

- **sceneId**：`common-workflows-04`
- **title**：修 bug，先找根因再动手
- **purpose**：建立修 bug 的四步闭环，并区分根因修复和症状压制。
- **narrativeRole**：Method／展示第二种工作流
- **narrationIntent**：要求提供报错和复现，先解释根因，再修改，最后补回归测试；强调错误消失不等于问题解决。
- **visualIntent**：让错误堆栈经过“复现 → 根因 → 修复 → 回归测试”四个节点，最后从红色转为绿色。
- **visualType**：`Process + Test Loop`
- **keyOnScreenText**：`找根因`、`不要盖住症状`、`回归测试`
- **videoValue**：状态变化可以证明修复有证据链，不只是展示一条“已修好”的结论。

## Scene 05｜重构：行为必须不变

- **sceneId**：`common-workflows-05`
- **title**：重构，整理代码但不能改行为
- **purpose**：说明重构的风险来自“没坏的代码”，并给出改前改后的保护方式。
- **narrativeRole**：Method／展示第三种工作流
- **narrationIntent**：解释先理解现状、明确目标、小步修改、改前改后都测；没有测试时先补测试锁定现有行为。
- **visualIntent**：同一段代码在“改前／重构后”结构发生变化，但输入输出和测试结果保持一致。
- **visualType**：`Before/After Comparison + Test`
- **keyOnScreenText**：`行为不变`、`改前测试`、`小步改`、`改后测试`
- **videoValue**：前后对照比口播更能让观众理解“代码结构变了、对外行为没变”。

## Scene 06｜写测试：逼它覆盖边界

- **sceneId**：`common-workflows-06`
- **title**：写测试，重点不是正常路径
- **purpose**：把测试工作的核心从“补几个例子”转为“覆盖会出问题的输入”。
- **narrativeRole**：Method／展示第四种工作流
- **narrationIntent**：说明沿用现有测试风格，显式要求空值、零、负数、超大值和类型错误，并让 Claude 补漏。
- **visualIntent**：正常输入通过后，空输入、零和类型错误依次进入测试网格，显示边界覆盖范围。
- **visualType**：`Test Matrix`
- **keyOnScreenText**：`正常路径`、`空输入`、`零`、`负数`、`类型不对`
- **videoValue**：并列输入状态能让“边界才容易出 bug”的价值形成直觉，而不是停留在口号。

## Scene 07｜实战：先造出一个真 bug

- **sceneId**：`common-workflows-07`
- **title**：实战，先让 bug 可复现
- **purpose**：把前面的修 bug 模板落到 `bug-demo` 和 `average([])` 的具体上下文。
- **narrativeRole**：Case Setup／进入完整实战
- **narrationIntent**：说明创建 `bug-demo`，写入 `calc.py` 的平均值函数，并用空列表触发除零错误。
- **visualIntent**：终端依次显示 `mkdir bug-demo`、`calc.py` 和函数代码，随后显示 `average([]) → ZeroDivisionError`。
- **visualType**：`Terminal Demo`
- **keyOnScreenText**：`bug-demo`、`calc.py`、`average([])`、`ZeroDivisionError`
- **videoValue**：终端中的真实复现把抽象 bug 变成后续验证的共同起点。

## Scene 08｜实战：先解释根因

- **sceneId**：`common-workflows-08`
- **title**：把报错和复现步骤一次交代清楚
- **purpose**：展示模板如何约束 Claude 先诊断而不是立即遮住错误。
- **narrativeRole**：Case Diagnosis／展示正确指令
- **narrationIntent**：给出空列表报错和必现步骤，要求先解释 `len(numbers) = 0` 导致除零，先别改代码。
- **visualIntent**：提示卡、根因链和暂停的修改按钮依次出现，突出“先定位，后动手”。
- **visualType**：`Prompt + Causal Diagram`
- **keyOnScreenText**：`先定位根因`、`len(numbers) = 0`、`先别改代码`
- **videoValue**：把权限顺序和因果链显式化，观众能看到为什么不能只贴一句“帮我修一下”。

## Scene 09｜实战：修复并留下回归锁

- **sceneId**：`common-workflows-09`
- **title**：修复后，测试必须跑绿
- **purpose**：完成修复、回归测试和结果验证，闭合整条实战链路。
- **narrativeRole**：Case Resolution／证据闭环
- **narrationIntent**：说明批准修复后新增测试，至少验证空列表和正常输入，并以测试全绿作为完成证据。
- **visualIntent**：终端从修复 diff 切换到 `test_average_empty_list PASSED` 和 `test_average_normal PASSED`，最后锁定结果。
- **visualType**：`Terminal Demo + Test Result`
- **keyOnScreenText**：`average([])`、`average([2, 4])`、`PASSED`、`回归测试`
- **videoValue**：绿色测试结果把“修好了”变成可复查的证据，也回应文章对回归测试的强调。

## Scene 10｜四套打法，下一篇看图片

- **sceneId**：`common-workflows-10`
- **title**：把四类模板存成速查卡
- **purpose**：收束四类工作流的模板核心，并完成系列下一集预告。
- **narrativeRole**：Summary + Next Preview／总结与承接
- **narrationIntent**：复述探索、修 bug、重构、写测试各自的核心动作和检查点，说明复杂任务也可以是它们的组合，并预告图片与多模态。
- **visualIntent**：四格速查卡先出现，随后单独升起“17 图片与多模态”预告卡，给读完和停留时间。
- **visualType**：`Summary Card + Preview`
- **keyOnScreenText**：`探索：从大到小`、`修 bug：根因 + 回归`、`重构：行为不变`、`写测试：覆盖边界`、`17 图片与多模态`
- **videoValue**：一张速查卡便于记忆和复用，最后的预告卡把本篇结论连接到系列下一篇。

