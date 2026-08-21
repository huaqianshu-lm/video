# 31 · settings.json：用户级 / 项目级配置 · Scene Script

## Scene 01｜写对了，为什么还是没生效

- **sceneId**：`settings-json-01`
- **title**：写对了，为什么还是没生效
- **purpose**：用 `defaultMode: "auto"` 在项目级被忽略的案例建立问题钩子。
- **narrativeRole**：问题钩子／认知转折。
- **narrationIntent**：说明语法合法不等于配置有效，真正的错误可能是写错作用域。
- **visualIntent**：同一行配置先放进 Project 层显示“ignored”，移动到 User 层后显示“active”。
- **visualType**：配置失败演示／状态变化。
- **keyOnScreenText**：`defaultMode: "auto"`、`Project settings`、`ignored`、`User settings`、`active`
- **videoValue**：配置在不同楼层产生相反结果的移动过程，能快速建立本片核心问题。

## Scene 02｜CLAUDE.md 和 settings.json，各管一套

- **sceneId**：`settings-json-02`
- **title**：CLAUDE.md 和 settings.json，各管一套
- **purpose**：分清自然语言规矩与机器行为开关。
- **narrativeRole**：概念分工。
- **narrationIntent**：解释 `CLAUDE.md` 管“记住什么”，`settings.json` 管“怎么干活”。
- **visualIntent**：左侧档案柜放项目约定，右侧电闸盒切换权限、模型、Hook 和状态栏开关。
- **visualType**：双窗口概念对比。
- **keyOnScreenText**：`CLAUDE.md`、`自然语言规矩`、`settings.json`、`机器行为开关`、`permissions`、`model`、`hooks`
- **videoValue**：两种文件的职责通过内容流向和开关状态空间化，避免只靠口播定义。

## Scene 03｜三个楼层，跟着谁走

- **sceneId**：`settings-json-03`
- **title**：三个楼层，跟着谁走
- **purpose**：建立用户级、项目级、本地级的路径、范围和 git 边界。
- **narrativeRole**：框架建立。
- **narrationIntent**：说明跨项目个人偏好、团队共享配置和当前仓库私人覆盖各自该放哪里。
- **visualIntent**：三层楼依次亮起，文件路径、影响对象和 git 状态标签同步出现。
- **visualType**：作用域分层图／文件路径图。
- **keyOnScreenText**：`~/.claude/settings.json`、`.claude/settings.json`、`.claude/settings.local.json`、`所有项目`、`团队共享`、`自动 gitignored`
- **videoValue**：范围和版本控制边界需要通过空间层级和标签同时呈现，才能形成放置判断。

## Scene 04｜谁压谁：单值的优先级堆栈

- **sceneId**：`settings-json-04`
- **title**：谁压谁：单值的优先级堆栈
- **purpose**：建立 Managed、命令行、本地、项目、用户的单值覆盖顺序。
- **narrativeRole**：规则建立。
- **narrationIntent**：解释越具体、越临时的层级优先级越高，用户级只是全局兜底。
- **visualIntent**：五层纸片从上到下叠放，`model` 值从用户级向上被本地级或命令行覆盖。
- **visualType**：优先级堆栈／覆盖演示。
- **keyOnScreenText**：`Managed`、`CLI`、`Local`、`Project`、`User`、`高 → 低`、`单值覆盖`
- **videoValue**：覆盖关系通过堆叠和替换表现，比静态优先级表更容易建立“谁压谁”的直觉。

## Scene 05｜数组不是覆盖，而是合并

- **sceneId**：`settings-json-05`
- **title**：数组不是覆盖，而是合并
- **purpose**：表现 `permissions.allow`／`deny` 跨层连接并去重的例外。
- **narrativeRole**：反直觉转折。
- **narrationIntent**：区分单值字段和数组字段，强调项目级数组不会把用户级规则整组抹掉。
- **visualIntent**：用户级 `Bash(npm run *)` 与项目级 `Bash(git diff *)` 两张卡沿合流轨道进入同一个 allow 列表。
- **visualType**：数组合并流程／规则对比。
- **keyOnScreenText**：`model`、`defaultMode`、`permissions.allow`、`连接 + 去重`、`Bash(npm run *)`、`Bash(git diff *)`
- **videoValue**：两条规则的合流过程是本片最重要的反直觉关系，必须用动态路径和最终列表证明。

## Scene 06｜五个高频字段，放回正确楼层

- **sceneId**：`settings-json-06`
- **title**：五个高频字段，放回正确楼层
- **purpose**：把常用字段的用途和常见作用域压缩成可查的视觉模型。
- **narrativeRole**：知识落地。
- **narrationIntent**：依次解释 `model`、`permissions`、`env`、`hooks`、`statusLine`，并说明个人偏好与团队底线的放置差异。
- **visualIntent**：五张字段卡按“默认模型、控权、环境、自动动作、状态栏”依次连到 User 或 Project；`$schema` 作为校验灯亮起。
- **visualType**：字段定位卡／作用域映射。
- **keyOnScreenText**：`model`、`permissions`、`env`、`hooks`、`statusLine`、`$schema`、`User`、`Project`
- **videoValue**：字段与作用域的连线能把用途、归属和团队／个人判断同时呈现。

## Scene 07｜settings.json 不是唯一的配置文件

- **sceneId**：`settings-json-07`
- **title**：settings.json 不是唯一的配置文件
- **purpose**：澄清 `settings.json`、`~/.claude.json` 和 `/config` 的边界。
- **narrativeRole**：边界澄清。
- **narrationIntent**：说明行为开关写入 `settings.json`，会话状态、MCP、信任和缓存等幕后数据在 `~/.claude.json`，`/config` 也不是完整文件视图。
- **visualIntent**：字段卡分流到两个文件抽屉，`/config` 面板只显示主题和详细输出等少数开关。
- **visualType**：文件归属分流／界面边界对比。
- **keyOnScreenText**：`settings.json`、`~/.claude.json`、`autoConnectIde`、`teammateDefaultModel`、`/config`、`不是完整视图`
- **videoValue**：字段从错误抽屉被导向正确文件的过程，能避免把所有配置都塞进一个 JSON 的误解。

## Scene 08｜改完什么时候生效，用什么确认

- **sceneId**：`settings-json-08`
- **title**：改完什么时候生效，用什么确认
- **purpose**：建立编辑、生效和验证的时间链路。
- **narrativeRole**：验证方法。
- **narrationIntent**：区分 `permissions`、`hooks` 的热加载与 `model`、`outputStyle` 的重启例外，并引出 `/status` 的 `Setting sources`。
- **visualIntent**：设置文件变化沿时间线进入会话；热加载节点直接亮起，`model` 节点标记重启或 `/model`，最后落到 `/status`。
- **visualType**：生效时间线／验证面板。
- **keyOnScreenText**：`热加载`、`model`、`outputStyle`、`重启`、`/model`、`/status`、`Setting sources`
- **videoValue**：生效时机和来源确认是时间与状态关系，只有动画时间线能让排查顺序变得直观。

## Scene 09｜不生效时，先查哪一格

- **sceneId**：`settings-json-09`
- **title**：不生效时，先查哪一格
- **purpose**：把常见现象映射到路径、重启、层级、数组合并和文件归属。
- **narrativeRole**：问题诊断。
- **narrationIntent**：说明不要先怀疑语法，依次查看 `Setting sources`、生效时机、作用域、跨层权限和 `~/.claude.json` 边界。
- **visualIntent**：排查表逐行亮起，每条现象沿箭头指向对应检查动作。
- **visualType**：诊断表／路径高亮。
- **keyOnScreenText**：`改完没反应`、`model 改了不变`、`defaultMode: "auto"`、`deny`、`~/.claude.json`、`先查层级`
- **videoValue**：从症状到检查动作的映射是一个决策过程，比复述排查表更有可操作性。

## Scene 10｜两层配置，跑通一次验证闭环

- **sceneId**：`settings-json-10`
- **title**：两层配置，跑通一次验证闭环
- **purpose**：用源文练习把项目级、本地级、git 忽略和会话验证串起来。
- **narrativeRole**：实战验证。
- **narrationIntent**：依次讲解 `settings-demo` 的两份配置、预期 git 差异、`/status` 和 `/permissions` 的验证结果。
- **visualIntent**：项目目录生成两份配置，`git status --short` 隐藏本地文件，进入会话后两个验证面板分别显示来源和合并规则。
- **visualType**：配置实战／验证流程。
- **keyOnScreenText**：`settings-demo`、`.claude/settings.json`、`.claude/settings.local.json`、`git status --short`、`/status`、`/permissions`
- **videoValue**：文件创建、忽略、加载和规则合并的连续状态变化，能把抽象规则变成可复用动作。

## Scene 11｜分层配置，下一篇见

- **sceneId**：`settings-json-11`
- **title**：分层配置，下一篇见
- **purpose**：收束本篇的六个答案，并保留源文已有的系列预告。
- **narrativeRole**：总结／下一集预告。
- **narrationIntent**：回顾分工、三层、优先级、数组合并、常用字段和 `/status`，最后念出第 32 篇标题。
- **visualIntent**：六个答案汇聚为“写对楼层 → 看懂合并 → /status 验证”，随后最后一个视觉事件展示 32「输出样式（Output Styles）」。
- **visualType**：总结路径／预告卡片。
- **keyOnScreenText**：`CLAUDE.md vs settings.json`、`用户 / 项目 / 本地`、`单值覆盖`、`数组合并`、`/status`、`32「输出样式（Output Styles）」`
- **videoValue**：汇聚路径和预告卡片需要停留时间，才能完成记忆收束并读完系列信息。

## Gate 1 内部检查

- [x] Scene 01—11 的 `sceneId` 唯一，叙事顺序与 `video-narrative.md` 对齐。
- [x] 每幕均包含 `purpose`、`narrativeRole`、`narrationIntent`、`visualIntent`、`visualType`、`keyOnScreenText` 和 `videoValue`。
- [x] 所有关键事实、字段、路径、命令、预期结果和下一篇预告均来自 `source.md`。
- [x] Scene 10 只展示源文练习流程，不执行其中命令。
- [x] Scene 11 的下一篇预告是最后一个视觉事件，未引入下一篇文章内容。

