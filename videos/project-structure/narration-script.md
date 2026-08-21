# Project Structure 视频化 · 第四步：Narration Script

## Scene 01｜.claude/ 不是“别管它”

你是不是也遇到过这种问题：权限为什么没生效，队友为什么没有我写的命令？这些高级玩法，最后都会落到 .claude/ 里的文件和目录上。更麻烦的是，我还踩过一个坑：把含数据库密码的配置写进共享的 settings.json，跟着 git push 推了出去。一个文件放错地方，可能就不只是配置问题了。

## Scene 02｜Claude Code 有两个家

先记住最重要的一条：Claude Code 的配置分两摊。一摊是项目里的 ./.claude/，像公司的项目档案柜，跟着仓库走，给协作者共享；另一摊是主目录里的 ~/.claude/，像你自己的工位抽屉，跟着你走，换个项目也继续生效。

## Scene 03｜打开项目级 .claude/

项目级 .claude/ 里，放的是这个项目要共同使用的结构。你会看到团队配置、个人配置覆盖、命令、规则、技能和子代理；项目根目录旁边还可能有团队共享的 .mcp.json。先把这棵树看全，后面才知道每个文件该归谁管。

## Scene 04｜用户级目录如何跟着你走

用户级目录里也有 commands、rules、skills、agents、CLAUDE.md 和 settings.json 这些“同名双胞胎”，区别是它们影响你的所有项目。这里还保存应用状态、项目会话记录和自动记忆。它不是某一个仓库的配置，而是你的个人范围。

## Scene 05｜文件职责分组

可以把这些文件先分成四类：CLAUDE.md 和 rules 是给 Claude 看的指导，settings.json 是权限、hooks 和模型等配置，commands、skills、agents 是扩展能力，.mcp.json 负责团队共享的 MCP 服务器。至于带 local 的文件，更接近个人覆盖，不要把它们当成团队标准。

## Scene 06｜Git 边界与泄密风险

团队要共享的 CLAUDE.md、settings.json、commands、rules、skills 和 agents，可以提交进 Git。settings.local.json、CLAUDE.local.md 不应该提交，任何密钥、token 和密码更是红线。真正需要秘密时，用环境变量引用，也不要把明文写进配置文件。

## Scene 07｜配置冲突听谁的

配置冲突时，文章给出的优先级是 Managed、命令行参数、Local、Project，最后才是 User。但还要分清设置类型：model 这样的标量值，会由更具体的配置覆盖；permissions.allow 这样的数组，则会跨作用域合并。优先级相同，不代表行为相同。

## Scene 08｜四条只读命令看清现场

不用先改配置，先做只读检查。用 ls -a ~/.claude 看用户级目录，用 ls -a .claude 看项目级目录，再用 git check-ignore .claude/settings.local.json 验证个人配置是否被忽略，需要时再查看 CLAUDE.md。如果当前目录还不是 Git 仓库，最后这条检查会直接报错。

## Scene 09｜两棵树的判断法

所以，看到一个 Claude Code 配置文件时，先问它在哪棵树里，再判断它归项目还是归个人、是否需要共享、该不该进 Git，最后再按优先级排查冲突。记住这条判断链，你就不再是“别管它”，而是知道该怎么管。下一篇，我们继续看交互界面与快捷键。

