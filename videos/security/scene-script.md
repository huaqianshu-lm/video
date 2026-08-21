# 安全与风险边界：到底该不该信任 AI 碰你的代码

## Scene 01｜你在信任谁？

- `sceneId`：security-01
- `title`：你在信任谁？
- `purpose`：建立程序边界、隔离机制和用户判断组成的三层安全模型。
- `narrativeRole`：问题开场与概念地基。
- `narrationIntent`：用安全带、气囊、限速解释三层防护，并点明权限规则由程序强制执行，不是模型自觉。
- `visualIntent`：三层防护从内到外出现，权限闸门锁住工具动作，用户判断停在最后一层。
- `visualType`：Concept Diagram + Security Model
- `keyOnScreenText`：`程序强制`、`内置保护与隔离`、`你的判断`
- `videoValue`：把抽象的“安全责任”变成三层可观察的防护结构。

## Scene 02｜README 里藏着一封写给 AI 的诈骗邮件

- `sceneId`：security-02
- `title`：README 里藏着一封写给 AI 的诈骗邮件
- `purpose`：用恶意 README 指令展示提示注入如何把内容伪装成用户命令。
- `narrativeRole`：核心风险引入。
- `narrationIntent`：解释不可信文件、issue、网页或依赖注释中的文字可能诱导 AI 读取 SSH 私钥并外传。
- `visualIntent`：展示 README 注释中的伪装指令从“总结项目”跳转到读取 `~/.ssh/id_rsa` 和外传地址的路径。
- `visualType`：Prompt Injection Demo + Data Exfiltration
- `keyOnScreenText`：`README.md`、`忽略你之前的所有规则`、`~/.ssh/id_rsa`、`evil.example.com`
- `videoValue`：让观众看见提示注入不是抽象术语，而是数据到外部地址的具体危险路径。

## Scene 03｜危险命令会经过几道拦截？

- `sceneId`：security-03
- `title`：危险命令会经过几道拦截？
- `purpose`：展示官方针对提示注入设计的多道拦截，并把最终批准责任交还给用户。
- `narrativeRole`：风险解释与防护展开。
- `narrationIntent`：说明命令黑名单、上下文感知分析、网络批准、隔离上下文和命令注入检测各自承担什么作用。
- `visualIntent`：让同一条 `curl` 外传路径依次撞上多个闸门，最后停在“批准前审查”。
- `visualType`：Security Pipeline + Process
- `keyOnScreenText`：`命令黑名单`、`上下文分析`、`网络请求批准`、`隔离上下文`、`批准前审查`
- `videoValue`：用连续状态变化说明“有拦截”不等于“可以无脑批准”。

## Scene 04｜deny 挡住明枪，挡不住暗箭

- `sceneId`：security-04
- `title`：deny 挡住明枪，挡不住暗箭
- `purpose`：解释工具层 `deny` 对直接读取有效，但对 Python／Node 子进程绕道无效。
- `narrativeRole`：关键反转。
- `narrationIntent`：说明 `Read(./.env)` 只能管 Claude 的内置文件工具，Bash 启动的脚本可能直接打开敏感文件。
- `visualIntent`：左侧直接读取被红色闸门拦住，右侧 Python／Node 从 Bash 绕过闸门触达 `.env`。
- `visualType`：Security Boundary + Process
- `keyOnScreenText`：`Read(./.env)`、`Bash`、`Python / Node`、`绕道读取`、`deny 有盲区`
- `videoValue`：展示单层权限规则的真实覆盖范围，避免观众把 `deny` 误解成 OS 级铁壁。

## Scene 05｜沙箱不是 deny 的同义词

- `sceneId`：security-05
- `title`：沙箱不是 deny 的同义词
- `purpose`：建立工具层软约束与 OS 级硬隔离的差异，并说明沙箱的边界。
- `narrativeRole`：防护机制建立。
- `narrationIntent`：解释沙箱如何限制 Bash 子进程、文件路径和网络，同时提醒默认仍可能读取 SSH／AWS 凭证，且管不到内置文件工具、MCP 和 Hook。
- `visualIntent`：把 `deny` 画成内圈闸门，把沙箱画成包住进程的外墙，再标出它覆盖与不覆盖的对象。
- `visualType`：Comparison + OS Isolation Diagram
- `keyOnScreenText`：`工具层`、`OS 级`、`Bash 子进程`、`denyRead`、`MCP / Hook 不在墙内`
- `videoValue`：把“软约束”和“硬隔离”的边界变成可见的空间关系。

## Scene 06｜信任越低，隔离越要往外加

- `sceneId`：security-06
- `title`：信任越低，隔离越要往外加
- `purpose`：展示从权限规则到 VM／网页版云端的五层防护梯，并把信任度与隔离强度关联起来。
- `narrativeRole`：风险选择与策略转折。
- `narrationIntent`：解释自己写的代码、知名开源和完全陌生仓库分别适合什么隔离层，危险模式只能在容器、VM 或 sandbox runtime 内考虑。
- `visualIntent`：五层防护从内到外展开，陌生仓库沿着阶梯移动到容器或 VM，完全不可信内容不落到本机。
- `visualType`：Trust Gradient + Layered Isolation
- `keyOnScreenText`：`权限规则`、`内置断路器`、`Bash 沙箱`、`容器`、`VM / 网页版云端`
- `videoValue`：用层级和移动表达“越不可信，越不能在本机裸跑”。

## Scene 07｜官方写死的几条底线

- `sceneId`：security-07
- `title`：官方写死的几条底线
- `purpose`：集中展示不需要用户额外配置的内置断路器，以及它们不能替代判断的边界。
- `narrativeRole`：安全底线回收。
- `narrationIntent`：说明删根目录仍提示、root／sudo 禁止危险模式、`curl`／`wget` 默认拦截、未知命令故障关闭和 `auto` 分类器。
- `visualIntent`：用保险丝卡片依次亮起，危险命令在“fail-closed”闸门前停止，最后仍留下用户批准入口。
- `visualType`：Circuit Breaker + Rule Status
- `keyOnScreenText`：`rm -rf /`、`rm -rf ~`、`root / sudo`、`curl / wget`、`fail-closed`、`auto`
- `videoValue`：让观众知道系统有硬底线，但不会因此误以为可以完全无人值守。

## Scene 08｜三分钟验证：绕道读密钥，沙箱能不能挡住？

- `sceneId`：security-08
- `title`：三分钟验证：绕道读密钥，沙箱能不能挡住？
- `purpose`：用原文练习验证 `deny` 和沙箱的前后差异。
- `narrativeRole`：实践证明。
- `narrationIntent`：带观众经过假 `.env`、直接 `Read` 被拒、Python 子进程绕道、沙箱 `denyRead` 补防四个关键结果。
- `visualIntent`：终端时间线逐步点亮配置和结果，同一条 Python 读取命令在未开沙箱时可绕道，在沙箱后显示 OS 级阻断。
- `visualType`：Terminal Demo + Before／After
- `keyOnScreenText`：`sandbox-demo`、`Read(./.env)`、`python3`、`denyRead`、`被 OS 拦截`
- `videoValue`：用可观察的前后反馈证明深度防御，而不是只记住配置名。

## Scene 09｜安全自保清单：按信任程度对号入座

- `sceneId`：security-09
- `title`：安全自保清单：按信任程度对号入座
- `purpose`：把全篇原则压缩成日常本机、真实敏感数据和陌生代码三档动作。
- `narrativeRole`：行动收束。
- `narrationIntent`：说明日常开发要 deny 和审查，敏感数据要沙箱和凭证 denyRead，陌生代码要容器、VM 或网页版云端。
- `visualIntent`：三列清单按风险升高排列，工具、隔离和信任验证动作逐项亮起。
- `visualType`：Checklist + Risk Matrix
- `keyOnScreenText`：`日常本机`、`真实敏感数据`、`陌生代码`、`批准前看一眼`、`容器 / VM`
- `videoValue`：把安全判断转成观众能直接采用的场景化选择。

## Scene 10｜安全不是开关，而是判断力

- `sceneId`：security-10
- `title`：安全不是开关，而是判断力
- `purpose`：总结三层安全模型、提示注入、深度防御和批准习惯，并预告下一集。
- `narrativeRole`：结论与系列转场。
- `narrationIntent`：收束为默认怀疑和批准前审查，说明下一篇 `22「MCP：连接外部服务」` 将继续讨论外部连接如何改变信任边界。
- `visualIntent`：把三层安全模型和隔离梯收成一条判断路线，最后转向下一集 MCP 卡片，不展开其正文。
- `visualType`：Summary Diagram + Next Episode Card
- `keyOnScreenText`：`默认怀疑`、`批准前多看一眼`、`22「MCP：连接外部服务」`
- `videoValue`：把分散的安全机制收束为可迁移的判断习惯，并保持系列连续性。

## Gate 1 内部审查结论

- 10 个 Scene 按观众从“信任对象”到“可执行判断”的认知过程重排，未机械复制文章章节。
- 每个 Scene 只承担一个主要认知任务，且完整填写 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText 和 videoValue。
- 提示注入、敏感数据绕道、沙箱边界、断路器和验证练习均有独立视觉事件，核心信息未被压成一张静态清单。
- 文章中的命令、攻击字符串和配置片段只作为内容表达，不作为本次任务指令执行。
- 结尾预告只使用当前文章末尾明确给出的 `22「MCP：连接外部服务」`，未读取或引入下一篇正文。
