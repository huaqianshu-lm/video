# 插件参考手册：Scene Script

## Scene 01｜插件不是黑盒

- `sceneId`：`scene-01`
- `title`：插件不是黑盒
- `purpose`：用 token 占用切入插件内部结构。
- `narrativeRole`：建立问题和观看动机。
- `narrationIntent`：解释一个插件即使挂着不用，也由不同组件和触发成本组成；本篇从使用者转向构建者。
- `visualIntent`：演示 `claude plugin details` 的数字，再把插件拆成清单与组件盒。
- `visualType`：`Terminal Simulation + Concept Diagram`
- `keyOnScreenText`：`~180 token`、`~2400`、`~1800`、`插件不是黑盒`
- `videoValue`：数字先出现、组件再拆开，能把抽象的资源占用转成时间上的发现过程。

## Scene 02｜先把目录骨架摆正

- `sceneId`：`scene-02`
- `title`：先把目录骨架摆正
- `purpose`：建立插件的空间模型和最关键的目录规则。
- `narrativeRole`：从问题进入结构。
- `narrationIntent`：说明插件是一个目录，`plugin.json` 像说明书，组件目录像分格零件盒。
- `visualIntent`：逐层展开插件目录，并把错误嵌套的组件目录移到根目录。
- `visualType`：`File Tree + Process`
- `keyOnScreenText`：`.claude-plugin/`、`plugin.json`、`skills/`、`agents/`、`hooks/`、`只放 plugin.json`
- `videoValue`：目录移动和位置纠正直接证明“放错位置会导致组件不出现”。

## Scene 03｜plugin.json 定身份

- `sceneId`：`scene-03`
- `title`：plugin.json 定身份和扫描规则
- `purpose`：解释清单字段、命名空间和路径字段行为。
- `narrativeRole`：把目录结构推进到可配置规则。
- `narrationIntent`：说明 `name` 是写入清单时唯一必填字段，并解释元数据和路径字段；重点讲清替换与追加。
- `visualIntent`：填写 `name` 生成命名空间，再让 `agents`／`commands` 替换默认目录、`skills` 追加默认目录。
- `visualType`：`JSON Simulation + Rule Comparison`
- `keyOnScreenText`：`name`、`my-plugin:hello`、`替换默认`、`追加默认`
- `videoValue`：字段值变化和扫描结果变化能把容易混淆的路径行为演示出来。

## Scene 04｜七类组件装进同一个盒子

- `sceneId`：`scene-04`
- `title`：插件能装哪些组件
- `purpose`：建立七类组件的整体地图。
- `narrativeRole`：从清单规则转向插件能力边界。
- `narrationIntent`：快速说明 skill、command、agent、hook、MCP、LSP、monitor 的位置和作用。
- `visualIntent`：以插件为中心，七个组件分格进入，并显示各自标准位置。
- `visualType`：`Component Map + Connection Diagram`
- `keyOnScreenText`：`Skills`、`Commands`、`Agents`、`Hooks`、`MCP`、`LSP`、`Monitors`
- `videoValue`：组件逐个归位，比一次展示静态列表更能建立“插件是组合包”的直觉。

## Scene 05｜能力也有安全边界

- `sceneId`：`scene-05`
- `title`：组件不是没有边界
- `purpose`：保留 agent 安全限制和 monitor 实验性限制。
- `narrativeRole`：在能力扩展后加入必要的边界判断。
- `narrationIntent`：解释插件 agent 不支持 `hooks`、`mcpServers`、`permissionMode`，并说明 monitor 的实验性和版本要求。
- `visualIntent`：从 agent 卡片中划掉三个受限字段，同时给 monitor 加上实验性状态和 `v2.1.105+` 标签。
- `visualType`：`UI Simulation + Constraint Visualization`
- `keyOnScreenText`：`hooks ✕`、`mcpServers ✕`、`permissionMode ✕`、`Experimental`、`v2.1.105+`
- `videoValue`：字段被拒绝、状态被标记，是对安全与稳定性边界的直接证明。

## Scene 06｜路径变量让插件可迁移

- `sceneId`：`scene-06`
- `title`：不要把插件路径写死
- `purpose`：解释 ROOT、DATA 和 PROJECT_DIR 的职责。
- `narrativeRole`：从组件构造推进到跨机器运行的工程约束。
- `narrationIntent`：说明安装缓存目录会变化，插件自带文件用 `ROOT`，持久状态用 `DATA`，项目文件用 `PROJECT_DIR`，且不能引用插件目录外的文件。
- `visualIntent`：先让写死的绝对路径在另一台机器上断开，再用三个变量连接到正确位置。
- `visualType`：`Path Diagram + Error-to-Fix`
- `keyOnScreenText`：`${CLAUDE_PLUGIN_ROOT}`、`${CLAUDE_PLUGIN_DATA}`、`${CLAUDE_PROJECT_DIR}`、`不要写死`
- `videoValue`：路径断裂与变量修复是只有动态画面才能清楚表达的迁移问题。

## Scene 07｜从零造一个能跑的插件

- `sceneId`：`scene-07`
- `title`：初始化、加载、调用
- `purpose`：展示最小插件的本地开发闭环前半段。
- `narrativeRole`：把规则落到可执行的第一步。
- `narrationIntent`：带观众使用 `claude plugin init my-greeter --with skills`，确认骨架，写入带 `$ARGUMENTS` 的 hello skill，并用 `--plugin-dir` 加载。
- `visualIntent`：终端命令依次出现，目录和 skill 文件随操作生成。
- `visualType`：`Terminal Simulation + File Creation`
- `keyOnScreenText`：`my-greeter`、`claude plugin init`、`--with skills`、`--plugin-dir`
- `videoValue`：连续命令和生成结果让“构造”变成可复用动作，而不是抽象建议。

## Scene 08｜调用和热重载

- `sceneId`：`scene-08`
- `title`：调用 skill，再用 reload 验证
- `purpose`：完成本地开发内循环。
- `narrativeRole`：证明刚造出的插件真的能运行和迭代。
- `narrationIntent`：说明命名空间调用 `/my-greeter:hello Walter`，修改 skill 后用 `/reload-plugins` 重新加载；不同组件的生效时机可能不同。
- `visualIntent`：从命名空间调用得到 greeting，再修改 skill，重载后展示变化。
- `visualType`：`Terminal Simulation + State Change`
- `keyOnScreenText`：`/my-greeter:hello Walter`、`/reload-plugins`、`改动已生效`
- `videoValue`：前后两次输出的变化直接证明本地迭代闭环。

## Scene 09｜建市场时分清两个 source

- `sceneId`：`scene-09`
- `title`：市场源不等于插件源
- `purpose`：解释 marketplace 的核心文件和两个 source 概念。
- `narrativeRole`：从本地开发走向团队和社区分发。
- `narrationIntent`：说明 `.claude-plugin/marketplace.json` 记录市场目录，插件条目的 `source` 记录插件本体来源，两者可以不同，并展示 validate。
- `visualIntent`：用商场目录与商品供货地的两条连接表示 source，再让 validate 标记通过。
- `visualType`：`Connection Diagram + Validation UI`
- `keyOnScreenText`：`marketplace.json`、`marketplace source`、`plugin source`、`claude plugin validate`
- `videoValue`：两条不同连接能避免观众把“目录从哪来”和“插件从哪来”混成一个地址。

## Scene 10｜三条分发路和两个发布坑

- `sceneId`：`scene-10`
- `title`：自用、开发、发布，路要选对
- `purpose`：比较三种分发方式，并呈现 version 与 dependencies 的发布风险。
- `narrativeRole`：完成从开发到发布的决策收束。
- `narrationIntent`：说明 skills 目录插件适合自用，`--plugin-dir` 适合开发，marketplace 适合共享；再解释 version 必须递增和 dependencies 的作用。
- `visualIntent`：三条路线分流后，version 卡片显示“版本不变、缓存不更新”，dependencies 卡片连接依赖插件。
- `visualType`：`Decision Diagram + Version Flow`
- `keyOnScreenText`：`自用`、`开发`、`团队／社区`、`version`、`dependencies`、`缓存未更新`
- `videoValue`：路线选择、版本变化和依赖连接分别表现不同决策，避免把发布规则压成一张表。

## Scene 11｜从会用到会造、会发

- `sceneId`：`scene-11`
- `title`：把插件当成可交付的配置包
- `purpose`：总结完整模型并预告下一集。
- `narrativeRole`：完成认知闭环，连接系列下一集。
- `narrationIntent`：总结目录、清单、组件、路径、开发和发布链路；预告下一集将把前面零件串成一条完整实战路径。
- `visualIntent`：把说明书、组件盒、开发循环、市场和依赖收束成一个可交付包，并显示下一集主题。
- `visualType`：`Summary Diagram + Preview Card`
- `keyOnScreenText`：`会造`、`会测`、`会发`、`下一集：实战入门`
- `videoValue`：所有前面状态回收到一个包中，再明确系列下一步，形成可记忆的终点。

