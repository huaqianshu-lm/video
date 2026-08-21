# 上下文管理：别让它「失忆」也别烧爆 token

## Scene 01｜读得越多，怎么反而失忆？

- `sceneId`：context-management-01
- `title`：读得越多，怎么反而失忆？
- `purpose`：用“读完整个项目后反问 auth 模块”的失败场景制造问题。
- `narrativeRole`：问题开场。
- `narrationIntent`：说明盲目读取全仓库会让任务变慢、变迟钝，提出上下文窗口的悬念。
- `visualIntent`：演示文件和终端输出不断进入工作台，最后出现反问和任务停滞。
- `visualType`：UI Simulation + Process
- `keyOnScreenText`：`读了二十几个文件`、`auth 模块在哪个文件？`
- `videoValue`：用堆积和状态反转让观众看到“信息更多但工作质量下降”。

## Scene 02｜上下文窗口是一张有限工作台

- `sceneId`：context-management-02
- `title`：上下文窗口是一张有限工作台
- `purpose`：建立工作台类比，并列出窗口中的主要内容。
- `narrativeRole`：概念建立。
- `narrationIntent`：解释上下文窗口是当前会话能同时看到的全部内容，单位是 token。
- `visualIntent`：把系统提示、`CLAUDE.md`、自动记忆、用户消息、已读文件和工具输出放入同一张工作台。
- `visualType`：Concept Diagram + Process
- `keyOnScreenText`：`上下文窗口`、`工作台`、`已读文件`、`工具输出`
- `videoValue`：把不可见的 token 占用转成空间关系，让“大头是谁”可以被直接比较。

## Scene 03｜工作台塞满后，会出现上下文衰退

- `sceneId`：context-management-03
- `title`：工作台塞满后，会出现上下文衰退
- `purpose`：展示上下文占用过高时的四类症状。
- `narrativeRole`：问题解释与命名。
- `narrationIntent`：解释注意力被摊薄后，为什么会前后矛盾、变笼统、重复询问和反复纠正。
- `visualIntent`：让同一工作台依次出现四种错误状态，最后标记为 `context rot`。
- `visualType`：State Change + UI Simulation
- `keyOnScreenText`：`前后矛盾`、`变得笼统`、`反复询问`、`纠正两遍仍原地打转`
- `videoValue`：用可观察症状帮助观众判断何时该主动清理，而不是等待报错。

## Scene 04｜两把扫帚：`/compact` 与 `/clear`

- `sceneId`：context-management-04
- `title`：两把扫帚：`/compact` 与 `/clear`
- `purpose`：建立两个命令的核心差异。
- `narrativeRole`：解决方案第一次出现。
- `narrationIntent`：说明 `/compact` 是压缩留用，`/clear` 是清空重开；两者不能混用。
- `visualIntent`：左侧把聊天草稿压成一页摘要，右侧把工作台清空，保留与清空的结果同时可见。
- `visualType`：Comparison + Process
- `keyOnScreenText`：`/compact`、`留着继续用`、`/clear`、`从头再来`
- `videoValue`：把两个容易混淆的命令做成互补的动作和结果。

## Scene 05｜什么时候压缩，什么时候清空？

- `sceneId`：context-management-05
- `title`：什么时候压缩，什么时候清空？
- `purpose`：给出 `/compact`、`/clear` 和直接新开会话的选择规则。
- `narrativeRole`：决策整理。
- `narrationIntent`：根据“任务是否继续”和“旧上下文是否仍有用”说明三种选择。
- `visualIntent`：以两道判断分叉将三个动作路由到不同结果。
- `visualType`：Decision Diagram
- `keyOnScreenText`：`任务还没完？`、`前文还要用？`、`直接新开会话`
- `videoValue`：将命令差异转成决策路径，降低观众只记住命令名却不会选择的风险。

## Scene 06｜用 `/context` 和 `/usage` 盯住用量

- `sceneId`：context-management-06
- `title`：用 `/context` 和 `/usage` 盯住用量
- `purpose`：区分两个监控命令的观察对象。
- `narrativeRole`：工具化落地。
- `narrationIntent`：说明 `/context` 看占用构成，`/usage` 看本次会话的 token、时长和本地估算成本。
- `visualIntent`：左右终端分别展示分类占用图和会话统计输出。
- `visualType`：Terminal Demo + Comparison
- `keyOnScreenText`：`/context`、`看占了什么`、`/usage`、`看烧了多少`
- `videoValue`：直接展示命令输出，让“实时监控”成为可以执行的动作。

## Scene 07｜auto-compact 会保命，但别依赖它

- `sceneId`：context-management-07
- `title`：auto-compact 会保命，但别依赖它
- `purpose`：解释自动压缩的用途和边界。
- `narrativeRole`：转折与风险提醒。
- `narrationIntent`：说明自动压缩会在接近上限时总结历史，但触发时机不可控，可能打断并丢掉重点。
- `visualIntent`：关键任务执行中突然弹出自动压缩，随后对比主动带指令压缩和 `CLAUDE.md` 偏好。
- `visualType`：Process + Comparison
- `keyOnScreenText`：`auto-compact`、`被动保命`、`主动 `/compact`、`保留已确认的方案`
- `videoValue`：展示“能用”和“应依赖”之间的差别，建立主动管理意识。

## Scene 08｜五个从源头省 token 的习惯

- `sceneId`：context-management-08
- `title`：五个从源头省 token 的习惯
- `purpose`：将文章的五个预防策略压缩为一套日常动作。
- `narrativeRole`：策略展开。
- `narrationIntent`：解释少读、少塞、分阶段和隔离冗长输出如何减缓工作台堆积。
- `visualIntent`：五个动作依次改变输入范围、任务大小、会话阶段和输出归属。
- `visualType`：Step List + Process
- `keyOnScreenText`：`玩具项目`、`@ 精准指文件`、`拆小任务`、`分阶段清理`、`子代理隔离输出`
- `videoValue`：把抽象的省 token 建议变成可逐项执行的行为路径。

## Scene 09｜三步亲眼验证压缩效果

- `sceneId`：context-management-09
- `title`：三步亲眼验证压缩效果
- `purpose`：用文章提供的练习把前面的判断变成可复现流程。
- `narrativeRole`：实践收束。
- `narrationIntent`：带观众完成先看底子、喂内容、压缩再对比的实验。
- `visualIntent`：同一个终端面板经历占用上升、执行 `/compact` 和对话历史下降。
- `visualType`：Terminal Demo + State Change
- `keyOnScreenText`：`/context`、`读取内容`、`/compact`、`对比前后占用`
- `videoValue`：让观众直接看到上下文如何涨、压缩如何把它压回去。

## Scene 10｜把注意力留给真正重要的任务

- `sceneId`：context-management-10
- `title`：把注意力留给真正重要的任务
- `purpose`：收束上下文管理的本质，并复盘命令与习惯。
- `narrativeRole`：核心结论。
- `narrationIntent`：总结窗口、衰退、清理、监控和预防之间的关系。
- `visualIntent`：工作台从混乱回到只保留目标、结论和下一步的状态。
- `visualType`：Summary Diagram
- `keyOnScreenText`：`有限工作台`、`主动管理`、`留出干活的空地`
- `videoValue`：把分散的命令和习惯归纳成一个可记忆的管理原则。

## Scene 11｜下一篇：权限配置

- `sceneId`：context-management-11
- `title`：下一篇：权限配置
- `purpose`：完成系列视频的下一集预告。
- `narrativeRole`：系列收尾与悬念。
- `narrationIntent`：说明本篇管理的是 Claude 能记住多少，下一篇将讨论它能动手做多少，并保留源文档提出的 git push 问题。
- `visualIntent`：将“上下文窗口”卡片切换为“权限配置”预告卡片，停留在问题上。
- `visualType`：Closing Card + Concept Comparison
- `keyOnScreenText`：`20 · 权限配置`、`能记住多少`、`能动手做多少`、`git push？`
- `videoValue`：为系列建立明确的下一步认知，同时不引入下一篇正文。

## Gate 1 内部审查

- 11 个 Scene 按观众认知过程组织，没有机械复刻文章小节。
- 每幕只有一个主要认知任务，且明确了口播、画面和 Video Value。
- `/compact`、`/clear`、直接新开会话、auto-compact 的边界保持一致。
- 文章五个节省 token 习惯全部进入叙事，没有添加源文档外的具体策略。
- Scene 11 只保留源文档已给出的下一篇标题和预告问题。

