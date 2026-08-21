# Scene Script｜开发配置：把 Claude 干活的工作环境调顺

## Scene 01｜别再靠一只手按着 `Ctrl+C`

- **sceneId**：`dev-config-01`
- **title**：别再靠一只手按着 `Ctrl+C`
- **purpose**：让观众代入接手私有仓库后的不安，建立“默认环境需要调整”的问题。
- **narrativeRole**：Opening／Problem Hook
- **narrationIntent**：说明人工盯每条命令既累又低效，隔离环境才是更稳定的方向。
- **visualIntent**：展示主机上的私有仓库、SSH 密钥、npm 凭据和持续监控，再把风险收进隔离框。
- **visualType**：`OpeningScene / Risk-to-Isolation Transition`
- **keyOnScreenText**：`客户私有仓库`、`SSH 密钥`、`npm 凭据`、`一下午人工监控`、`隔离环境`
- **videoValue**：风险从散落在主机上的对象变成动态边界，只有视频能同时展示“看不见的风险”和“隔离后的变化”。

## Scene 02｜开发配置其实只管五件事

- **sceneId**：`dev-config-02`
- **title**：开发配置其实只管五件事
- **purpose**：建立全片分类框架，帮助观众把困扰映射到正确的配置。
- **narrativeRole**：Framework
- **narrationIntent**：解释隔离、网络、终端、模型和验证分别回答什么问题，并强调先分类再调整。
- **visualIntent**：用工作台展示“隔到哪儿干、门窗通到哪、桌椅顺不顺、派谁来干、改完怎么验”。
- **visualType**：`ConceptScene / Five-Part Workbench`
- **keyOnScreenText**：`隔离`、`网络`、`终端`、`模型`、`验证`
- **videoValue**：五个配置维度同时出现并接到不同困扰，能建立比文章列表更快的空间记忆。

## Scene 03｜沙箱给 Bash 圈一块试车场

- **sceneId**：`dev-config-03`
- **title**：沙箱给 Bash 圈一块试车场
- **purpose**：解释沙箱如何在减少权限提示和控制边界之间取得中间解。
- **narrativeRole**：Core Concept
- **narrationIntent**：说明 `/sandbox`、自动允许、操作系统边界和当前工作目录写入的关系。
- **visualIntent**：展示命令从主机终端进入“沙箱边界”，在允许范围内直接运行，跨出网络域时出现询问。
- **visualType**：`TerminalScene / Sandbox Boundary`
- **keyOnScreenText**：`/sandbox`、`自动允许`、`当前工作目录`、`新网络域：需要批准`
- **videoValue**：边界的“圈内自动、跨界询问”是状态变化，静态文字难以直觉表达。

## Scene 04｜沙箱不是整台 Claude 的防护罩

- **sceneId**：`dev-config-04`
- **title**：沙箱不是整台 Claude 的防护罩
- **purpose**：补上沙箱只管 Bash 的关键限制，避免观众误以为所有工具都已隔离。
- **narrativeRole**：Boundary Turn
- **narrationIntent**：明确 Bash 受沙箱约束，而 Read／Edit、WebFetch、MCP server 和 Hook 仍在主机运行；需要更完整隔离时升级到容器或虚拟机。
- **visualIntent**：左右分层展示“沙箱内 Bash”和“主机上的其他动作”，容器作为下一步出口出现。
- **visualType**：`ComparisonScene / Scope Boundary`
- **keyOnScreenText**：`Bash：在沙箱内`、`Read / Edit`、`WebFetch`、`MCP`、`Hook：仍在主机`
- **videoValue**：同一 Claude Code 的不同动作落在不同边界中，分层动画比口头限定更不容易误解。

## Scene 05｜devcontainer 是一间团队共用的工作间

- **sceneId**：`dev-config-05`
- **title**：devcontainer 是一间团队共用的工作间
- **purpose**：说明 devcontainer 解决环境不一致和无人值守问题，并展示基本启用路径。
- **narrativeRole**：Expanded Isolation
- **narrationIntent**：解释 Docker、`.devcontainer/devcontainer.json`、Claude Code Feature、容器内命令和本地文件结果之间的关系。
- **visualIntent**：展示配置文件进入 Docker 容器，命令在容器执行，修改结果仍出现在本地仓库；同时提示不要挂载主机密钥。
- **visualType**：`ProcessScene / Devcontainer Setup`
- **keyOnScreenText**：`.devcontainer/devcontainer.json`、`Docker`、`Claude Code Feature`、`命令在容器`、`改动落本地`、`不要挂载 SSH 密钥`
- **videoValue**：容器的“执行位置”和“结果位置”不同，流程动画能同时证明一致环境和本地结果。

## Scene 06｜代码越不熟，隔离就越往右

- **sceneId**：`dev-config-06`
- **title**：代码越不熟，隔离就越往右
- **purpose**：给出隔离方式的选择标准，而不是让观众记住单一推荐。
- **narrativeRole**：Decision Rule
- **narrationIntent**：对比不开隔离、自带沙箱、devcontainer、容器／虚拟机和网页版的范围、成本与适用场景。
- **visualIntent**：让隔离梯度从左到右变强，分别标注个人日常、团队一致／无人值守和完全不信任代码。
- **visualType**：`ComparisonScene / Isolation Gradient`
- **keyOnScreenText**：`不开隔离`、`/sandbox`、`devcontainer`、`容器 / VM`、`Claude Code on the web`
- **videoValue**：隔离强度、配置成本和信任程度的三维关系适合用连续位置和标签呈现。

## Scene 07｜连不上，先查网络三段链路

- **sceneId**：`dev-config-07`
- **title**：连不上，先查网络三段链路
- **purpose**：把网络故障拆成代理、证书和防火墙白名单，避免错误地去调沙箱或模型。
- **narrativeRole**：Connectivity Fix
- **narrationIntent**：说明 `HTTPS_PROXY`／`HTTP_PROXY`／`NO_PROXY`、`NODE_EXTRA_CA_CERTS` 和核心域名的职责，强调不支持 SOCKS。
- **visualIntent**：模拟 Claude Code 经过代理总机、CA 安检章和域名门禁到达服务；第三方提供商走自己的地址。
- **visualType**：`ProcessScene / Network Route`
- **keyOnScreenText**：`HTTPS_PROXY`、`NO_PROXY`、`NODE_EXTRA_CA_CERTS`、`api.anthropic.com`、`不支持 SOCKS`
- **videoValue**：网络问题的三个故障点可以被逐段点亮，帮助观众定位而不是盲目堆配置。

## Scene 08｜终端只调三样：换行、通知、主题

- **sceneId**：`dev-config-08`
- **title**：终端只调三样：换行、通知、主题
- **purpose**：提供个人使用中最值得调整的三个低成本选项。
- **narrativeRole**：Ergonomics
- **narrationIntent**：给出 `Shift+Enter`、`/terminal-setup`、`Ctrl+J` 的选择，以及 `terminal_bell` 和 `/theme` 的用途边界。
- **visualIntent**：三张终端卡片分别从“提交还是换行”“完成是否提醒”“明暗主题”切换到解决状态。
- **visualType**：`UISimulation / Terminal Preferences`
- **keyOnScreenText**：`Shift+Enter`、`/terminal-setup`、`Ctrl+J`、`terminal_bell`、`/theme`
- **videoValue**：键位、通知和主题的前后状态适合做快速交互式切换，画面不必重复整段说明。

## Scene 09｜模型像排班：硬活派 Opus，日常用 Sonnet

- **sceneId**：`dev-config-09`
- **title**：模型像排班：硬活派 Opus，日常用 Sonnet
- **purpose**：建立模型能力、任务难度和成本之间的直觉关系。
- **narrativeRole**：Capability and Cost
- **narrationIntent**：说明 `opus`、`sonnet`、`haiku`、`opusplan` 的定位和别名会跟随提供商推荐版本更新。
- **visualIntent**：把复杂推理、日常编程、简单任务和规划／执行分配给不同模型卡片。
- **visualType**：`ComparisonScene / Model Dispatch`
- **keyOnScreenText**：`opus`、`sonnet`、`haiku`、`opusplan`、`复杂推理`、`日常编程`、`简单任务`
- **videoValue**：模型不是静态列表，而是随任务流动的排班关系，动画分派能直观表达能力／成本取舍。

## Scene 10｜同一个模型，也能调“用多少脑子”

- **sceneId**：`dev-config-10`
- **title**：同一个模型，也能调“用多少脑子”
- **purpose**：补充 effort 和团队可选模型限制，完成模型配置的成本控制层。
- **narrativeRole**：Optimization
- **narrationIntent**：解释 `low` 到 `max` 的 effort 方向、`ultrathink` 的单轮用途、`/effort`／`effortLevel` 的固定方式，以及 `availableModels` 的团队约束。
- **visualIntent**：用思考深度旋钮和白名单锁把“单轮加深”和“团队限选”并列展示。
- **visualType**：`ConceptScene / Effort and Budget Controls`
- **keyOnScreenText**：`low`、`medium`、`high`、`xhigh`、`max`、`ultrathink`、`/effort`、`availableModels`
- **videoValue**：同模型不同 effort 和团队模型白名单是两个层级的控制，分屏能清楚区分临时与长期。

## Scene 11｜改配置之后，回头验它真的生效

- **sceneId**：`dev-config-11`
- **title**：改配置之后，回头验它真的生效
- **purpose**：把文章的动手部分压缩为一条可跟随的验证链路。
- **narrativeRole**：Hands-on Proof
- **narrationIntent**：按顺序说明 `/sandbox`、创建 `sandbox-test.txt`、`/status`、`/model haiku`、再次 `/status`，以及可选的 `settings.json` 固化。
- **visualIntent**：用终端状态流展示沙箱面板、测试文件出现、模型从原值变为 Haiku，再落到项目设置。
- **visualType**：`TerminalScene / Verification Flow`
- **keyOnScreenText**：`/sandbox`、`sandbox-test.txt`、`/status`、`/model haiku`、`model: Haiku`、`settings.json`
- **videoValue**：前后状态和实际文件结果共同证明配置生效，避免把“输入命令”误认为“完成配置”。

## Scene 12｜把工作环境调顺，再进入下一种输入方式

- **sceneId**：`dev-config-12`
- **title**：把工作环境调顺，再进入下一种输入方式
- **purpose**：回收五类配置的价值，并完成系列下一集预告。
- **narrativeRole**：Summary and Next Episode
- **narrationIntent**：总结安全、连通、手感和成本四个收益，强调配置改完要验证，并预告“47 Voice 语音模式”。
- **visualIntent**：五类配置汇聚成“工作环境调顺”，最后切换到预告卡。
- **visualType**：`SummaryScene / Preview Card`
- **keyOnScreenText**：`隔离`、`网络`、`终端`、`模型`、`验证`、`工作环境调顺`、`下一篇：47 Voice 语音模式`
- **videoValue**：关键词收束和下一集主题形成系列记忆点，预告卡是最后一个明确视觉事件。

## Gate 1 内部审查

- [x] 12 个 Scene 各自只有一个主要认知任务。
- [x] 每个 Scene 均包含 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText 和 videoValue。
- [x] Scene 顺序覆盖 Source 的核心信息，同时按观众判断路径重新组织。
- [x] Scene 04 明确保留沙箱只管 Bash 的边界，Scene 05／06 承担升级和选择逻辑。
- [x] Scene 11 把改配置和验结果串成视频特有的状态流程，Scene 12 保留下一集预告。

Gate 1 Scene Script 结论：通过。
