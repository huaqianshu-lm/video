# 权限配置：放多松、收多紧，你说了算

## Scene 01｜同一个危险模式，为什么结论相反？

你怎么敢开 `--dangerously-skip-permissions`？如果 Claude Code 在隔离容器里操作，删了也只是一次性环境，重建就好。可一旦回到装着真实团队代码的本机，这个模式就像一颗定时炸弹。权限没有脱离环境的绝对对错，先看你在哪用。

## Scene 02｜权限系统在管哪些动作？

Claude Code 默认像一个先问后动的实习生。读文件和搜索通常直接放行，但执行 Bash 命令、修改文件，都会先问你。更重要的是，权限不是靠一句“不要执行 git push”来约束模型。`CLAUDE.md` 只能影响它想做什么，真正能拦截操作的，是 Claude Code 强制执行的权限规则。

## Scene 03｜六种模式是一条自主度光谱

权限模式控制的，是 Claude 在动手前要暂停问你的频率。`default` 只放行只读，`acceptEdits` 让文件编辑和常见文件系统操作免问，`plan` 只研究和出方案，`auto` 用后台分类器检查越界操作，`dontAsk` 只接受预先批准的工具，而 `bypassPermissions` 会跳过所有检查。自主度越高，越要确认自己处在可承受的环境里。

## Scene 04｜Shift+Tab 怎么切，其他模式怎么进？

会话里最常用的切换方式是 `Shift+Tab`。默认它会在 `default`、`acceptEdits` 和 `plan` 三档之间循环，状态栏会告诉你当前模式。需要固定一次启动的模式，可以使用 `--permission-mode`。想让每次启动都有默认值，可以在 `settings.json` 里写 `defaultMode`。`auto`、`bypassPermissions` 和 `dontAsk` 的进入方式，则不完全跟默认循环一样。

## Scene 05｜allow、ask、deny：权限的精细开关

模式是粗调，`allow`、`ask` 和 `deny` 才是精调。`allow` 自动放行，`ask` 把决定权交还给你，`deny` 直接拦截，而且匹配优先级是 `deny`、`ask`、`allow`。规则既可以匹配整个工具，也可以精确到一条 Bash 命令、一个文件路径或一个域名。通配符后面的空格也有意义，`Bash(ls *)` 和 `Bash(ls*)` 的范围并不一样。

## Scene 06｜deny 不是铁壁，沙箱补上绕道

这里有个容易误判的边界。你可以用 `Read(./.env)` 拦住 Claude 的内置读取，但如果它通过 Bash 启动 Python 或 Node 脚本，脚本仍可能绕道打开这个文件。要阻止所有进程访问敏感路径，单层 deny 不够，还需要叠加沙箱，形成更深一层的防御。

## Scene 07｜玩具放松，生产收紧

玩具或个人小项目，改坏了可以重建，可以用 `acceptEdits` 提速，再 deny `rm -rf` 和 `git push`。生产或公司项目，则更适合用 `default` 把关，只放行低风险的查看命令，把危险命令和敏感文件直接拒绝。至于 `--dangerously-skip-permissions`，只在隔离容器、虚拟机或一次性环境里考虑，本机和生产代码机器不要开。

## Scene 08｜五分钟验证：deny 拦住，allow 放行

你可以用一个玩具项目亲手验证。先创建 `perm-demo/.claude`，写入 `settings.json`，启动 Claude，再运行 `/permissions` 查看规则是否加载。接着请求执行 `git push origin main`，它应该直接被拒绝，不执行，也不弹批准提示。再请求查看 `git status`，它应该不弹批准提示就执行。这样你验证的不是配置长相，而是权限规则真的改变了行为。

## Scene 09｜权限是环境匹配的行为边界

把整篇内容收成一句判断：先看环境能承受多大的自主度，再选权限模式；用 `allow`、`ask`、`deny` 精确控制工具、命令和路径；敏感文件还要考虑沙箱。权限不是一味放松，也不是一味收紧，而是让 Claude 在合适的边界里工作。

## Scene 10｜下一篇：安全与风险边界

这一篇讲的是权限怎么配置，但更上层的问题还在后面：到底该不该信任 AI 去碰你的代码和系统？下一篇，21「安全与风险边界」，我们继续聊什么时候该收，什么时候能放。

