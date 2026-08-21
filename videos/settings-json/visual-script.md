# 31 · settings.json：用户级 / 项目级配置 · Visual Script

## 全局视觉原则

### 1. 用“配置流转”代替字段罗列

每幕优先展示文件、配置卡、作用域、会话和验证结果之间的移动与状态变化。字段只作为视觉锚点，不把全文口播做成字幕墙。

### 2. 声音解释规则，画面证明关系

口播解释为什么放在某层、什么时候生效以及如何排查；画面用楼层、堆栈、合流、分流和时间线证明这些关系。

### 3. 颜色承担稳定语义

蓝色表示用户级／个人默认，紫色表示项目级／共享范围，黄色表示规则或警告，绿色表示已加载／已生效，红色只表示被拒绝或无效状态。

### 4. 横屏教程感和安全区

原型按 1920 × 1080、16:9 构图设计。主标题控制在 1—2 行，内容区域给路径、面板和流程留空间；底部说明和字幕预留安全区，最后预告卡片不与底部控件叠放。

### 5. 画面文字语义归属

所有路径、字段、命令、状态和按钮文案都来自当前 `source.md` 或本目录生产资料。`settings-demo`、`defaultMode: "auto"`、`Setting sources`、`Output Styles` 等可逐项回溯；不使用其他视频的业务语义。

## 逐 Scene 视觉设计

### Scene 01｜写对了，为什么还是没生效

- **视觉目标**：让观众先看到“语法正确但放错层”的问题。
- **画面结构**：中央为 `defaultMode: "auto"` 配置卡，下方是 Project 与 User 两个文件抽屉。
- **视觉动作**：配置卡先落入 Project，红色 `ignored` 亮起；卡片沿箭头移动到 User，状态变为绿色 `active`。
- **口播互补**：声音说明原因，画面只呈现作用域移动和状态变化。
- **屏幕文字**：`defaultMode: "auto"`、`Project settings`、`ignored`、`User settings`、`active`。
- **Visual Type**：配置失败演示／状态变化。

### Scene 02｜CLAUDE.md 和 settings.json，各管一套

- **视觉目标**：建立“规矩”和“机器开关”的分工直觉。
- **画面结构**：左侧档案柜卡片列出 `CLAUDE.md` 和自然语言约定；右侧电闸盒列出 `permissions`、`model`、`hooks`、`statusLine`。
- **视觉动作**：左侧纸张进入“背景”，右侧开关逐个切换，两个区域之间不合并内容。
- **口播互补**：声音解释概念类比，画面证明两类输入的形态不同。
- **屏幕文字**：`CLAUDE.md`、`自然语言规矩`、`settings.json`、`机器行为开关`、`permissions`、`model`、`hooks`。
- **Visual Type**：双窗口概念对比。

### Scene 03｜三个楼层，跟着谁走

- **视觉目标**：让路径、影响范围和 git 边界同时可扫读。
- **画面结构**：三层楼从下到上为 User、Project、Local；每层放对应路径、影响对象和版本控制标签。
- **视觉动作**：先亮起用户级“所有项目”，再亮起项目级“团队共享”，最后本地级显示“自动 gitignored”。
- **口播互补**：声音给判断口诀，画面把“跟着我走／跟着项目走”变成空间位置。
- **屏幕文字**：`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`所有项目`、`团队共享`、`自动 gitignored`。
- **Visual Type**：作用域分层图／文件路径图。

### Scene 04｜谁压谁：单值的优先级堆栈

- **视觉目标**：建立单值由高层覆盖低层的顺序。
- **画面结构**：五层堆栈标出 `Managed`、`CLI`、`Local`、`Project`、`User`，右侧显示 `model` 值。
- **视觉动作**：每升高一层，新的 `model` 标签覆盖下方值；`defaultMode: "auto"` 卡片在 Project 层被红框标记为“项目／本地忽略”。
- **口播互补**：声音解释优先级含义，画面演示覆盖，不重复讲完整表格。
- **屏幕文字**：`Managed`、`CLI`、`Local`、`Project`、`User`、`高 → 低`、`单值覆盖`、`defaultMode: "auto"`。
- **Visual Type**：优先级堆栈／覆盖演示。

### Scene 05｜数组不是覆盖，而是合并

- **视觉目标**：制造单值规则与数组规则的清晰反差。
- **画面结构**：左侧展示 `model` 的覆盖箭头，右侧展示两张权限数组卡进入同一个列表。
- **视觉动作**：`Bash(npm run *)` 与 `Bash(git diff *)` 合流，重复项只保留一次，最终列表同时显示两条规则。
- **口播互补**：声音解释“连接并去重”，画面证明没有任何一条规则被抹掉。
- **屏幕文字**：`model`、`permissions.allow`、`连接 + 去重`、`Bash(npm run *)`、`Bash(git diff *)`。
- **Visual Type**：数组合并流程／规则对比。

### Scene 06｜五个高频字段，放回正确楼层

- **视觉目标**：让常用字段形成最小可查的定位图。
- **画面结构**：五张字段卡沿中轴依次展开，左侧标记用途，右侧连接 User 或 Project；上方浮出 `$schema` 校验标记。
- **视觉动作**：`model` 和 `statusLine` 连接 User，`permissions` 和团队 `hooks` 连接 Project，`env` 根据“全局／项目专属”分出两条路径。
- **口播互补**：声音解释放置判断，画面承担字段与作用域的对应。
- **屏幕文字**：`model`、`permissions`、`env`、`hooks`、`statusLine`、`$schema`、`User`、`Project`。
- **Visual Type**：字段定位卡／作用域映射。

### Scene 07｜settings.json 不是唯一的配置文件

- **视觉目标**：避免观众把所有配置都塞入同一个文件。
- **画面结构**：中央为配置分流器，左抽屉是 `settings.json`，右抽屉是 `~/.claude.json`，下方是缩小的 `/config` 面板。
- **视觉动作**：`permissions`、`model` 进入左抽屉；`autoConnectIde`、`teammateDefaultModel` 和会话／MCP／缓存标签进入右抽屉；`/config` 只亮起主题和详细输出。
- **口播互补**：声音解释文件职责和界限，画面用错误归属被重新分流表现。
- **屏幕文字**：`settings.json`、`~/.claude.json`、`autoConnectIde`、`teammateDefaultModel`、`/config`、`不是完整视图`。
- **Visual Type**：文件归属分流／界面边界对比。

### Scene 08｜改完什么时候生效，用什么确认

- **视觉目标**：把设置修改后的确认顺序做成时间线。
- **画面结构**：左侧设置文件，时间线依次经过“保存”“会话加载”“Setting sources”；热加载和重启例外在不同节点分支。
- **视觉动作**：`permissions`、`hooks` 直接抵达绿色生效；`model` 停在“重启／`/model`”；`outputStyle` 停在“重启／`/clear`”；最后 `/status` 面板显示来源。
- **口播互补**：声音解释例外，画面让不同生效路径同时可见。
- **屏幕文字**：`热加载`、`model`、`outputStyle`、`重启`、`/model`、`/clear`、`/status`、`Setting sources`。
- **Visual Type**：生效时间线／验证面板。

### Scene 09｜不生效时，先查哪一格

- **视觉目标**：把排查从“重写 JSON”转成有顺序的诊断路径。
- **画面结构**：五行诊断表：现象、不要先怀疑、先查什么；左侧一条扫描线逐行移动。
- **视觉动作**：当前行高亮后，箭头指向 `/status`、重启、用户级、数组合并或 `~/.claude.json`。
- **口播互补**：声音讲排查策略，画面呈现症状与行动的映射。
- **屏幕文字**：`改完没反应`、`model 改了不变`、`defaultMode: "auto"`、`deny`、`~/.claude.json`、`先查层级`。
- **Visual Type**：诊断表／路径高亮。

### Scene 10｜两层配置，跑通一次验证闭环

- **视觉目标**：把知识落到一个完整但不执行的配置演示。
- **画面结构**：左侧 `settings-demo` 文件树，中间两个 JSON 窗口，右侧分成 `/status` 和 `/permissions` 验证面板。
- **视觉动作**：项目级配置显示 allow／deny，本地级配置显示额外 allow；`git status --short` 隐藏本地级文件；会话面板随后显示两层来源和三条合并规则。
- **口播互补**：声音解释预期结果，画面展示状态变化；命令作为教程文字，不触发执行。
- **屏幕文字**：`settings-demo`、`.claude/settings.json`、`.claude/settings.local.json`、`git status --short`、`/status`、`/permissions`、`Bash(npm run test *)`、`Bash(curl *)`、`Bash(git status *)`。
- **Visual Type**：配置实战／验证流程。

### Scene 11｜分层配置，下一篇见

- **视觉目标**：收束本篇规则，并完成系列预告。
- **画面结构**：六个节点汇聚到一张“配置验证”卡，预告卡片位于中央偏上，底部保留字幕和控件安全区。
- **视觉动作**：`CLAUDE.md vs settings.json`、三层、单值覆盖、数组合并、常用字段、`/status` 依次汇入；最后才出现下一篇预告卡。
- **口播互补**：声音给六点总结，画面用汇聚路径建立记忆。
- **屏幕文字**：`CLAUDE.md vs settings.json`、`用户 / 项目 / 本地`、`单值覆盖`、`数组合并`、`/status`、`32「输出样式（Output Styles）」`。
- **Visual Type**：总结路径／预告卡片。

## 全片视觉类型、组件和动画标准

### 视觉类型

- 配置失败演示：Scene 01
- 双窗口概念对比：Scene 02、Scene 07
- 作用域分层图：Scene 03
- 优先级堆栈：Scene 04
- 数组合并流程：Scene 05
- 字段定位卡：Scene 06
- 生效时间线：Scene 08
- 诊断表：Scene 09
- 配置实战流程：Scene 10
- 总结／预告卡：Scene 11

### 基础组件

- `ScopeLayer`：用户、项目、本地三层作用域。
- `ConfigCard`：字段、路径和作用域标签。
- `PriorityStack`：Managed 到 User 的覆盖堆栈。
- `MergeTrack`：数组规则连接、去重和最终列表。
- `FileDrawer`：`settings.json` 与 `~/.claude.json` 文件归属。
- `Timeline`：热加载、重启和验证节点。
- `DiagnosticTable`：现象到检查动作的映射。
- `TerminalPanel`：仅模拟源文命令和预期输出，不执行命令。
- `SubtitleSafeArea`：原型底部字幕和控制区的安全边界。

### 动画标准

- 一级信息动画：配置卡移动、作用域亮起、优先级覆盖、数组合流、文件分流、时间线推进、诊断行扫描、验证状态变绿。
- 二级注意力动画：当前层高亮、错误状态红框、`Setting sources` 聚焦、预告卡延迟出现。
- 三级装饰动画：只保留轻微背景光和面板淡入，不使用无意义粒子、旋转或快速弹跳。
- 所有延迟都服务于“哪一层、哪一条规则、哪个验证节点”的理解；删除后若不影响信息，则不保留。

## Gate 2 内部审查结果

- [x] 11 个 Scene 在 Scene Script、Narration Script、Visual Script 与 Prototype 中保持同序同义。
- [x] `narration-script.md` 的 Scene 正文只含实际口播，不含视觉说明、制作备注或 Gate 清单。
- [x] 视觉与口播分工明确：口播解释规则，画面展示配置移动、覆盖、合并、分流和验证。
- [x] 所有屏幕文字均可追溯到当前源文或本目录生产资料；未带入其他视频的业务语义。
- [x] Scene 11 的预告是最后一个视觉事件，并避开底部字幕与预览控件安全区。
- [x] Prototype 不包含 TTS、`tts-script.json`、音频、字幕时间轴、Remotion 或渲染逻辑。

## 下一步

完成本原型后停止本次任务。只有用户后续确认视觉方向，才进入下一阶段；按当前请求不生成 TTS 或 Remotion 资料。

