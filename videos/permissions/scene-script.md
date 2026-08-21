# 权限配置：放多松、收多紧，你说了算

## Scene 01｜同一个危险模式，为什么结论相反？

- `sceneId`：permissions-01
- `title`：同一个危险模式，为什么结论相反？
- `purpose`：用隔离容器与生产机器的环境反差制造权限悬念。
- `narrativeRole`：问题开场。
- `narrationIntent`：说明权限没有脱离环境的绝对对错，同一个危险模式在可重建容器和真实代码机器上的风险完全不同。
- `visualIntent`：左右展示同一个 `--dangerously-skip-permissions`，左侧为可重建隔离容器，右侧为公司生产代码，并让风险颜色发生反转。
- `visualType`：Comparison + Risk Boundary
- `keyOnScreenText`：`隔离容器`、`生产代码机器`、`--dangerously-skip-permissions`
- `videoValue`：用同一开关在两个环境中的相反结果，把“环境决定权限松紧”变成直觉冲突。

## Scene 02｜权限系统在管哪些动作？

- `sceneId`：permissions-02
- `title`：权限系统在管哪些动作？
- `purpose`：建立只读、Bash、文件修改三类操作的默认审批差异。
- `narrativeRole`：概念建立。
- `narrationIntent`：解释只读默认放行，执行命令和修改文件默认需要批准，并区分软提示与程序硬规则。
- `visualIntent`：把三类操作接入同一组审批闸门，最后将 `CLAUDE.md` 标为提示层、权限规则标为强制层。
- `visualType`：Concept Diagram + UI Simulation
- `keyOnScreenText`：`只读`、`Bash 命令`、`文件修改`、`需要批准`、`权限规则强制执行`
- `videoValue`：让观众看见“权限系统管动作”而不是把权限误解为一句提示词。

## Scene 03｜六种模式是一条自主度光谱

- `sceneId`：permissions-03
- `title`：六种模式是一条自主度光谱
- `purpose`：用一张光谱压缩呈现六种权限模式及其适用边界。
- `narrativeRole`：核心知识展开。
- `narrationIntent`：解释 `default`、`acceptEdits`、`plan`、`auto`、`dontAsk`、`bypassPermissions` 从低自主度到高自主度的差异。
- `visualIntent`：六张模式卡沿绿到红的光谱排列，每张只展示免问能力和关键风险。
- `visualType`：Spectrum + Comparison
- `keyOnScreenText`：`default`、`acceptEdits`、`plan`、`auto`、`dontAsk`、`bypassPermissions`
- `videoValue`：用位置、颜色和状态差异替代一张静态长表，帮助观众形成模式选择的整体地图。

## Scene 04｜Shift+Tab 怎么切，其他模式怎么进？

- `sceneId`：permissions-04
- `title`：Shift+Tab 怎么切，其他模式怎么进？
- `purpose`：说明默认循环、启动参数和 `settings.json` 的 `defaultMode` 三种进入方式。
- `narrativeRole`：操作落地。
- `narrationIntent`：说明 `Shift+Tab` 默认循环三档，其他模式可由启动参数进入，默认模式可写入 `defaultMode`。
- `visualIntent`：先让状态栏在三档之间循环，再分流到 `--permission-mode plan` 和配置卡。
- `visualType`：Process + UI Simulation
- `keyOnScreenText`：`Shift+Tab`、`default → acceptEdits → plan`、`--permission-mode plan`、`defaultMode`
- `videoValue`：把抽象模式名称转成观众可以马上执行的切换路径。

## Scene 05｜allow、ask、deny：权限的精细开关

- `sceneId`：permissions-05
- `title`：allow、ask、deny：权限的精细开关
- `purpose`：解释三种规则的行为、优先级和匹配粒度。
- `narrativeRole`：精细控制。
- `narrationIntent`：说明放行、询问、拒绝三种动作，以及 `deny → ask → allow` 的优先级和通配符空格差异。
- `visualIntent`：将同一条命令经过规则匹配管线，展示 `Bash(npm run *)` 与 `Bash(ls *)` 的精确范围。
- `visualType`：Rule Pipeline + Terminal Demo
- `keyOnScreenText`：`allow`、`ask`、`deny`、`deny → ask → allow`、`Bash(ls *)`
- `videoValue`：用线路和匹配结果说明规则如何从粗略模式下沉到单个工具或命令。

## Scene 06｜deny 不是铁壁，沙箱补上绕道

- `sceneId`：permissions-06
- `title`：deny 不是铁壁，沙箱补上绕道
- `purpose`：展示内置文件工具 deny 对 Bash 子进程绕道读写的边界。
- `narrativeRole`：风险转折。
- `narrationIntent`：解释 `Read` / `Edit` deny 不能阻止 Python 或 Node 子进程访问敏感路径，真正要锁死路径需要叠加沙箱。
- `visualIntent`：让 `Read(./.env)` 的内置入口被挡住，再显示脚本从 Bash 侧绕行，最后由沙箱封住整个路径。
- `visualType`：Security Boundary + Process
- `keyOnScreenText`：`Read(./.env)`、`Python / Node 子进程`、`绕道读写`、`沙箱`
- `videoValue`：演示单层规则的防护范围和补防方式，避免观众把 deny 当作 OS 级铁壁。

## Scene 07｜玩具放松，生产收紧

- `sceneId`：permissions-07
- `title`：玩具放松，生产收紧
- `purpose`：将环境判断落成两套 `settings.json` 模板，并划出危险模式红线。
- `narrativeRole`：策略选择与风险收束。
- `narrationIntent`：说明玩具项目可用 `acceptEdits` 提速，生产项目以 `default` 把关；危险模式只在隔离环境考虑。
- `visualIntent`：左右展示两套配置卡，右侧加上本机和生产机禁用危险模式的红线。
- `visualType`：Comparison + Configuration
- `keyOnScreenText`：`acceptEdits`、`default`、`Bash(rm -rf *)`、`Bash(git push *)`、`仅隔离环境`
- `videoValue`：用可复制的配置差异证明“权限设置应随项目风险变化”。

## Scene 08｜五分钟验证：deny 拦住，allow 放行

- `sceneId`：permissions-08
- `title`：五分钟验证：deny 拦住，allow 放行
- `purpose`：把配置语法转成可观察的规则加载和行为反馈。
- `narrativeRole`：实践验证。
- `narrationIntent`：带观众经过创建目录、写入配置、查看 `/permissions`、验证 `git push` 被拒和 `git status` 放行的链路。
- `visualIntent`：用终端时间线逐步点亮 `.claude/settings.json`、规则界面、deny 反馈和 allow 反馈。
- `visualType`：Terminal Demo + Process
- `keyOnScreenText`：`perm-demo/.claude/settings.json`、`/permissions`、`git push`、`被拒绝`、`git status`、`不弹批准提示`
- `videoValue`：展示规则真正改变行为的证据，让观众能复现而不是只记配置字段。

## Scene 09｜权限是环境匹配的行为边界

- `sceneId`：permissions-09
- `title`：权限是环境匹配的行为边界
- `purpose`：收束模式、规则、沙箱和环境选择四条主线。
- `narrativeRole`：总结。
- `narrationIntent`：回顾模式控制询问频率、规则控制具体动作、沙箱补足进程边界，并再次强调危险模式的隔离条件。
- `visualIntent`：把环境卡、模式滑杆、规则管线和沙箱盾牌收束成一条“匹配环境 → 设定边界 → 验证反馈”的路线。
- `visualType`：Summary Diagram
- `keyOnScreenText`：`匹配环境`、`设定边界`、`验证反馈`、`权限松紧由你决定`
- `videoValue`：将分散的配置知识压成可复用的判断框架。

## Scene 10｜下一篇：安全与风险边界

- `sceneId`：permissions-10
- `title`：下一篇：安全与风险边界
- `purpose`：以当前文章明确给出的下一集标题和问题作为最后视觉事件。
- `narrativeRole`：系列预告。
- `narrationIntent`：说明本篇讲的是权限配置，下一篇继续追问是否应该信任 AI 接触代码和系统。
- `visualIntent`：从“权限怎么配”转向“什么时候该收、什么时候能放”，只显示源文档已明确给出的下一集标题和主题问题。
- `visualType`：Next Episode Card
- `keyOnScreenText`：`21「安全与风险边界」`、`什么时候该收，什么时候能放？`
- `videoValue`：为系列建立下一步认知悬念，并明确本篇内容边界。

## Gate 1 内部审查结论

- 10 个 Scene 按观众认知过程重排，未机械复制文章章节。
- 每个 Scene 只承担一个主要认知任务，并填写了全部必需字段。
- 关键命令和配置只在内容表达中出现，没有被当作本次任务指令执行。
- 下一集仅引用当前文章末尾的标题和主题问题，未读取下一篇文章。

