# 31 · settings.json：用户级 / 项目级配置 · Narration Script

## Scene 01｜写对了，为什么还是没生效

你有没有遇到过这种情况：字段名没写错，JSON 也完全合法，可配置就是不生效。比如 `defaultMode: "auto"`，写在项目设置里就可能被直接忽略。后来你把它挪到用户级，马上就生效了。这个坑说明，`settings.json` 最难的从来不是怎么写，而是写在哪一层。

## Scene 02｜CLAUDE.md 和 settings.json，各管一套

先把两个容易混淆的文件分开。`CLAUDE.md` 管的是给 Claude 看的自然语言规矩，比如项目约定和工作方式。`settings.json` 管的是机器行为开关，比如权限、默认模型、环境变量、Hook 和状态栏。一个更像项目说明书，一个更像电闸盒，别把它们当成同一种配置。

## Scene 03｜三个楼层，跟着谁走

`settings.json` 常规有三个作用域。用户级文件在 `~/.claude/settings.json`，跟着你走，影响所有项目。项目级文件在 `.claude/settings.json`，跟着仓库走，供所有协作者共享。本地级文件在 `.claude/settings.local.json`，只影响你在当前仓库的配置，而且会被自动加入 gitignore。判断时只问一句：这条设置应该跟着我走，还是跟着项目走？

## Scene 04｜谁压谁：单值的优先级堆栈

如果多层设置写了同一个单值，优先级从高到低是：Managed、命令行参数、本地级、项目级、用户级。越具体、越临时的设置越靠上，越全局的设置越像兜底。比如用户级默认模型，可能被项目级或本地级模型覆盖。开头那个 `defaultMode: "auto"` 还有一个特殊限制：放在项目级和本地级会被忽略，必须放在用户级。

## Scene 05｜数组不是覆盖，而是合并

但“高层覆盖低层”不是所有字段都适用。权限里的 `allow` 和 `deny` 这类数组，会跨层连接并去重。用户级允许 `Bash(npm run *)`，项目级允许 `Bash(git diff *)`，最后两条都会生效。记住这两个分水岭：`model` 这样的单值看覆盖，权限数组看合并。

## Scene 06｜五个高频字段，放回正确楼层

日常最常碰到的字段，可以先记住五个。`model` 是默认模型，个人偏好放用户级，项目统一可以放项目级。`permissions` 管工具和命令准入，团队安全底线通常放项目级。`env` 给会话和子进程注入环境变量，`hooks` 在固定时机自动执行动作，`statusLine` 自定义底部状态栏，通常是个人偏好。文件开头加上 `$schema`，编辑器还能帮你自动补全和校验。

## Scene 07｜settings.json 不是唯一的配置文件

还有一个边界要记住：不是所有配置都住在 `settings.json`。`~/.claude.json` 主要保存登录会话、用户或本地作用域的 MCP、项目信任状态和缓存。像 `autoConnectIde`、`teammateDefaultModel` 这样的少数字段，就不该写进 `settings.json`。另外，`/config` 只是少数固定开关的编辑界面，并不是完整的配置文件视图。

## Scene 08｜改完什么时候生效，用什么确认

改完设置后，大多数键会热加载，`permissions` 和 `hooks` 保存后就能生效。但 `model` 和 `outputStyle` 是启动时读取的例外，前者可以重启或用 `/model` 现切，后者需要重启或 `/clear` 后重建。最关键的确认方法是 `/status`，看里面的 `Setting sources`，它会告诉你当前会话实际读到了哪些设置源。

## Scene 09｜不生效时，先查哪一格

所以配置没反应时，先别急着重写 JSON。完全没反应，先看 `/status` 里有没有那一层。`model` 改了不变，先考虑是不是需要重启。`defaultMode: "auto"` 不起作用，检查是不是放在项目或本地层。写了 `deny` 仍然能执行，检查其他层是不是还有合并进来的 `allow`。某个字段怎么都写不进来，再想想它是不是应该属于 `~/.claude.json`。

## Scene 10｜两层配置，跑通一次验证闭环

接下来用一个最小练习把链路跑通。先创建 `settings-demo`，在项目级配置里允许 `npm run test`、拒绝 `curl`，再在本地级配置里额外允许 `git status`。用 `git status --short` 看见项目级文件、看不见被自动忽略的本地级文件。进入 Claude Code 后用 `/status` 看两层是否加载，再用 `/permissions` 看三条规则是否同时存在。这里验证的是配置链路，不是执行这些命令本身。

## Scene 11｜分层配置，下一篇见

这一篇只需要记住六个答案：`CLAUDE.md` 和 `settings.json` 分工不同；设置有用户、项目、本地三个层级；单值按优先级覆盖；数组跨层合并；常用字段要放对作用域；最后用 `/status` 确认来源。配置不生效时，先查楼层，再查生效时机和文件边界。下一篇是 32「输出样式（Output Styles）」，继续看 `outputStyle` 如何改变 Claude 的表达方式。

