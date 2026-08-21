# Claude Code 提问与指令 · Scene Script

> 目标：把“减少 Claude 猜测”拆成 9 个可独立制作的视觉事件。

## Scene 01｜一句“修一下”为什么会跑偏

- **sceneId**：`prompting-01`
- **title**：一句“修一下”为什么会跑偏
- **purpose**：用错误执行建立观众对模糊指令代价的直觉。
- **narrativeRole**：Opening Hook
- **narrationIntent**：描述函数报错后只说“修一下这个 bug”，并指出信息量接近于零。
- **visualIntent**：演示 Claude 面对模糊需求时只能猜测，出现不相关修改。
- **visualType**：`Demo + Diff`
- **keyOnScreenText**：`修一下这个 bug`、`Claude 只能脑补`
- **videoValue**：错误 diff 的出现顺序和猜测过程能让观众看到“信息缺口 → 跑偏”，不是只听结论。

## Scene 02｜具体：先圈范围，再给约束和参照

- **sceneId**：`prompting-02`
- **title**：具体，不等于写得更长
- **purpose**：把“具体”拆成三个可执行的信息维度。
- **narrativeRole**：Principle 1
- **narrationIntent**：解释文件／函数范围、约束和现成参照如何减少 Claude 的选择空间。
- **visualIntent**：将模糊卡片逐步补成 `src/auth/`、token 刷新、`HotDogWidget.php` 参照。
- **visualType**：`Process + Cards`
- **keyOnScreenText**：`范围`、`约束`、`参照`
- **videoValue**：三张卡逐层亮起，能直接展示“每补一项，猜测少一项”。

## Scene 03｜上下文：能贴就别只描述

- **sceneId**：`prompting-03`
- **title**：把原始材料直接喂到 Claude 面前
- **purpose**：说明上下文不是口头概括，而是把文件、报错和截图直接提供。
- **narrativeRole**：Principle 2
- **narrationIntent**：解释 `@` 引用、完整 traceback 和截图为什么比二手描述可靠。
- **visualIntent**：展示 `@src/types/user.ts`、包含行号的 traceback 和 UI 截图从输入区进入任务。
- **visualType**：`Input Montage + UI Simulation`
- **keyOnScreenText**：`@文件`、`完整 traceback`、`截图`
- **videoValue**：原始材料被直接拖入任务的动作，把“上下文”从抽象名词变成可模仿的操作。

## Scene 04｜验收：让完成可以被检查

- **sceneId**：`prompting-04`
- **title**：什么结果算成功，要提前说
- **purpose**：建立“可验证成功标准”比“看起来完成”可靠的认知。
- **narrativeRole**：Principle 3
- **narrationIntent**：说明示例输入输出、测试、构建和根因要求如何闭合验证循环。
- **visualIntent**：从 `average([])` 失败到返回 `0`，再到两个测试通过；旁边对比“代码质量很高”无法直接判断。
- **visualType**：`Test Loop + Comparison`
- **keyOnScreenText**：`通过 / 失败`、`average([]) = 0`、`测试通过`
- **videoValue**：验证状态变化是口播无法独立证明的，画面必须展示检查结果。

## Scene 05｜规划：复杂任务先看图纸

- **sceneId**：`prompting-05`
- **title**：复杂任务，先让它列计划
- **purpose**：说明 Plan Mode 的适用边界，避免把规划变成所有任务的固定仪式。
- **narrativeRole**：Principle 4
- **narrationIntent**：区分跨文件／不熟悉代码的复杂任务和拼写错误等小任务。
- **visualIntent**：左侧展示“先读文件 → 列改动 → 批准 → 修改”，右侧展示“重命名变量 → 直接执行”。
- **visualType**：`Decision Split + Process`
- **keyOnScreenText**：`复杂：先规划`、`简单：直接做`、`Plan Mode`
- **videoValue**：分岔和批准节点能让观众理解“什么时候停下来想，什么时候直接做”。

## Scene 06｜模糊提示：Claude 替你做决定

- **sceneId**：`prompting-06`
- **title**：同一个文件，模糊提示会发生什么
- **purpose**：进入可复现实验，先展示低信息量提示的开放结果。
- **narrativeRole**：Experiment Setup
- **narrationIntent**：说明 `@stats.py 帮我改改这个函数` 没有说清真正关心的空列表问题。
- **visualIntent**：在 `stats.py` 中显示 `average`，输入模糊提示后出现“类型注解／文档字符串”等可能猜测，真正 bug 仍未处理。
- **visualType**：`Code Demo`
- **keyOnScreenText**：`@stats.py 帮我改改这个函数`、`方向全凭运气`
- **videoValue**：把“猜测”变成分叉结果，能让观众理解模糊并非高效。

## Scene 07｜具体提示：改哪、改成什么、怎么验收

- **sceneId**：`prompting-07`
- **title**：把三件事一次说清
- **purpose**：用同一实验完成方法证明。
- **narrativeRole**：Experiment Proof
- **narrationIntent**：完整说出空列表返回 0、两个示例结果和跑测试要求。
- **visualIntent**：输入具体提示，依次出现判空修改、两个测试用例和测试通过。
- **visualType**：`Terminal Demo + Test Result`
- **keyOnScreenText**：`average([]) → 0`、`average([2, 4]) → 3`、`✓ tests passed`
- **videoValue**：同一文件、同一函数、不同提示的连续结果对比，是全片最强的因果证据。

## Scene 08｜四条心法变成一张检查表

- **sceneId**：`prompting-08`
- **title**：提问前，快速检查四件事
- **purpose**：把四条原则压缩成可复用的行动清单。
- **narrativeRole**：Synthesis
- **narrationIntent**：依次复述具体、上下文、验收标准和复杂任务先计划。
- **visualIntent**：四张卡从左到右排列，分别展示一个最小示例。
- **visualType**：`Checklist`
- **keyOnScreenText**：`具体`、`给上下文`、`给验收标准`、`先列计划`
- **videoValue**：统一的检查表能把分散技巧变成观众下一次可以直接使用的动作。

## Scene 09｜结论与下一集预告

- **sceneId**：`prompting-09`
- **title**：把话说清，Claude 才接得住
- **purpose**：完成观点收束并承接系列下一集。
- **narrativeRole**：Closing + Next Episode Preview
- **narrationIntent**：总结提问的本质是减少不确定性，并预告下一集“常见工作流”。
- **visualIntent**：将“模糊需求 → 脑补返工”转为“清楚需求 → 执行验证”，最后单独出现下一集预告。
- **visualType**：`Summary + Preview Card`
- **keyOnScreenText**：`少猜，少返工`、`下一集：常见工作流`
- **videoValue**：箭头转化和停留卡片让抽象结论与系列承接同时被看见。
