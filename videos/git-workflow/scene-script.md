# Claude Code Git 工作流 · Scene Script

## Scene 01｜一串 `fix`，从痛点开始

### 目的
让观众先看到糟糕提交历史的真实代价，产生“这类总结工作确实适合交出去”的动机。

### 叙事作用
问题钩子。

### 口播方向
解释为什么很多 commit message 变成 `fix`、`update`、`wip`，并指出问题不是能力不足，而是写清楚的即时收益太低。

### 视觉方向
用提交历史列表从规范信息逐渐堆叠到重复的 `fix`，把“未来回看时找不到改动”的痛点具象化。

### Scene Type
`Git Log Simulation`

### 屏幕重点
```text
fix
update
wip
三个月后：到底改了什么？
```

### Video Value
时间轴能让观众同时看到提交不断增加和信息价值不断下降，建立文章开头的真实痛点。

## Scene 02｜先划线：本地和远端不是一回事

### 目的
给整条视频建立统一的安全判断标准。

### 叙事作用
规则建立。

### 口播方向
用报销流程类比 git：填单、整理和审批可以交给助理，最后打款按钮必须由负责人按；本地可逆操作和远端不可逆操作同理。

### 视觉方向
左右两列对比本地和远端操作，中央用一条“最后确认”分界线连接到人的手。

### Scene Type
`Comparison Diagram`

### 屏幕重点
```text
本地 · 可回退 · Claude
远端 · 难收回 · 人来按
```

### Video Value
动画分叉比口头列命令更快建立“可逆性决定委托边界”的直觉。

## Scene 03｜看 diff：把满屏红绿讲成人话

### 目的
展示最适合优先委托的低风险任务：理解改动。

### 叙事作用
第一个正向证明。

### 口播方向
说明 Claude 可以读取 `git diff --staged`，总结主要改动并指出可能夹带的调试代码、测试数据或误删内容。

### 视觉方向
左侧显示 staged diff 的红绿代码，扫描后右侧生成三条中文摘要和一个风险提示。

### Scene Type
`Diff Review Demo`

### 屏幕重点
```text
git diff --staged
主要改动
风险点
```

### Video Value
画面直接展示“原始 diff → 重点摘要”的转换，证明 Claude 做的是消化和审阅，而非重复口播。

## Scene 04｜写 commit：diff、历史、规范汇成一句话

### 目的
解释 Claude 写 commit message 可靠的原因，并让观众看到本地 commit 的可逆性。

### 叙事作用
价值深化。

### 口播方向
说明它会同时看 diff、仓库历史和 `CLAUDE.md`，沿用 `feat:`、`fix:` 等项目风格；commit 还没推出远端，错了可以 reset 或 amend。

### 视觉方向
三个输入卡片汇入一张 commit 卡片，旧的 `fix` 被替换成描述改动和动机的中文 message。

### Scene Type
`Commit Message Demo`

### Video Value
把“照风格写”拆成三个可见输入，帮助观众理解不是凭空生成一句话。

## Scene 05｜开 PR：`gh` 让副手接上 GitHub

### 目的
展示开 PR 的效率，并交代 `gh` CLI 和会话回溯的价值。

### 叙事作用
能力扩展。

### 口播方向
说明安装并登录 `gh` 后，Claude 可以创建 PR、读取评论；`gh pr create` 会把会话和 PR 关联，之后可用 `claude --from-pr <number>` 回来继续。

### 视觉方向
本地分支经由 `gh` 节点连接到 PR 卡片，PR 卡片再连接 reviewer 评论和会话回溯入口。

### Scene Type
`Workflow Diagram`

### Video Value
连接动画能把“本地工具、远端 PR、原会话”三个分散概念串成一条工作链。

## Scene 06｜读评论和解冲突：能看懂，不等于盲目照做

### 目的
把外部内容风险和冲突处理纪律统一为“先理解、再执行”。

### 叙事作用
风险转折。

### 口播方向
提醒 reviewer 评论、PR 描述和 issue 可能含提示注入；解冲突时则让 Claude 先解释两边意图和合并方案，确认后再改，最后跑测试。

### 视觉方向
左侧是带外部内容标记的评论卡片，右侧是两列冲突代码；二者都先进入“检查／解释”节点，再进入人的确认和测试通过状态。

### Scene Type
`Safety + Conflict Demo`

### Video Value
同一条流程动画能让观众记住“理解能力不等于执行授权”。

## Scene 07｜权限规则：把 push 红线焊进机制

### 目的
给“必须自己守”提供可执行的硬约束，而不是停在口头提醒。

### 叙事作用
机制落地。

### 口播方向
展示 `allow`、`ask`、`deny` 的分工，强调 `git push *` 放进 `deny`，且 deny 优先级最高；force-push 永远自己手动并确认分支。

### 视觉方向
三层权限卡片依次亮起：只读命令进入 allow，commit 进入 ask，push 被红色 deny 门拦截。

### Scene Type
`Permission Configuration`

### Video Value
把“请不要 push”的软提示和 `deny` 的硬拦截并排展示，让机制差异一眼可见。

## Scene 08｜完整心智模型：Claude 是副手，你是签字人

### 目的
把前面的细节收束成稳定的角色分工。

### 叙事作用
中段结论。

### 口播方向
总结 Claude 负责副手工作，人负责检查和最后签字；既不用因为害怕而全部自己做，也不能为了省事把 push 交出去。

### 视觉方向
一条流水线从 diff、commit、PR、冲突分析流向“人确认”，再在 push／force 处停在红线前。

### Scene Type
`Workflow Summary`

### Video Value
流水线把前七幕的分散判断压缩成可复用的工作模型。

## Scene 09｜玩具仓库：先建立本地历史

### 目的
进入文章的实战，并建立可参照的第一笔提交。

### 叙事作用
实践启动。

### 口播方向
说明在全新的 `git-demo` 中初始化仓库，创建 `calc.py`，暂存并提交初始 `add` 函数；全程不连接远端。

### 视觉方向
终端按顺序出现 `mkdir git-demo`、`git init`、创建文件、`git add` 和初始 `feat:` 提交。

### Scene Type
`Terminal Demo`

### Video Value
终端逐步出现命令和 root commit，给出可以复核的状态变化，而不是只讲抽象流程。

## Scene 10｜玩具仓库：制造改动，让 Claude 读 staged diff

### 目的
用新增 `sub` 函数验证 Claude 确实读取了暂存区。

### 叙事作用
实践验证。

### 口播方向
说明修改 `calc.py` 并暂存，然后进入会话让 Claude 用中文总结暂存区改动；准确说出新增 `sub` 函数就是读取成功的证据。

### 视觉方向
编辑器显示 `sub` 函数从新增行进入 staged 状态，Claude 会话气泡显示“新增了 `sub` 函数”。

### Scene Type
`Editor + Chat Demo`

### Video Value
把“让它看 diff”变成可观察的输入、请求和输出闭环。

## Scene 11｜玩具仓库：照风格 commit，再用 log 验证

### 目的
完成本地链路并验证历史风格一致，同时明确没有碰 push。

### 叙事作用
实践结论。

### 口播方向
让 Claude 参照上一笔提交写中文 message 并提交，再回终端运行 `git log --oneline`，看到两条风格一致的 `feat:` 提交。

### 视觉方向
Claude 给出 `feat: 新增 sub 减法函数`，执行本地 commit；终端列出两条提交，底部明确“未执行 git push”。

### Scene Type
`Terminal Verification`

### Video Value
最终 log 是实际证据，帮助观众把“照风格提交”从建议变成验证结果。

## Scene 12｜小结与下一集预告

### 目的
收束分工，并把系列叙事自然引向下一篇。

### 叙事作用
结尾总结与下一集预告。

### 口播方向
回顾本地可逆操作可以交给 Claude，push 和 force 必须由人守，权限规则是保证；预告下一篇 GitHub Actions 将把协作搬到云端。

### 视觉方向
先显示五项分工总结，再切换到独立的下一集预告卡片，避免和总结字幕叠放。

### Scene Type
`Summary + Next Preview`

### Video Value
总结卡片帮助记忆，最后的预告建立系列连续性，并把下一集作为最后一个视觉事件。

## Gate 1 字段审查

12 个 Scene 均具备目的、叙事作用、口播方向、视觉方向、Scene Type、屏幕重点和 Video Value；场景顺序按认知变化而非文章标题机械排列。Scene 09～11 的实战不引入远端操作，Scene 12 的下一集预告有 Source 依据。
