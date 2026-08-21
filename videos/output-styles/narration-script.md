# Narration Script｜Output Styles

## Scene 01｜默认工程师，不等于所有角色

你让 Claude Code 帮你改简历，它却满脑子想着拆函数、加测试。问题不一定出在项目资料，而可能是它默认被调成了软件工程师。把“请你换个说话方式”塞进 CLAUDE.md，往往时灵时不灵。真正该找的开关，是 output style。

## Scene 02｜改的是方式，不是知识

先记住这一句：output styles 改变的是 Claude 的响应方式，而不是 Claude 知道什么。它动的是系统提示里的角色、语气和输出格式。项目知识还是原来的知识，只是同一个主持人换了一档节目。你想让它每轮都用同一种格式回应，或者让它暂时扮演写作助手，就该考虑 output style。

## Scene 03｜四档内置样式怎么选

默认的 Default，适合绝大多数软件工程，埋头干活、该验证就验证。Proactive 更敢自己做常规决定，少确认、偏行动。Explanatory 会边干边插入 Insights，帮你理解实现和代码库模式。Learning 则在讲解之外留下 TODO，让你亲手完成关键几行。Explanatory 和 Learning 本来就会产出更长的响应，所以按需打开，用完切回 Default。

## Scene 04｜切换入口已经变了

这里有个版本坑：独立的 `/output-style` 命令在 v2.1.73 弃用，v2.1.91 移除。现在有两条正路。第一条，在 `/config` 菜单里选择输出样式。第二条，直接在设置里写 `outputStyle` 字段。旧教程里的命令不要再照抄。

## Scene 05｜切完为什么没变化

还有一个容易误判的地方。输出样式属于系统提示，Claude 在会话开始时读取一次。你刚在菜单里改完，当前对话不一定立刻变化。用 `/clear` 清掉当前会话，或者开启新会话，让系统提示重新组装，新样式才会真正生效。

## Scene 06｜自定义样式就是一个 Markdown 文件

内置样式不够用时，一个 Markdown 文件就能定义自己的样式。文件由 frontmatter 和正文说明组成。文件名默认就是样式名，`name` 可以覆盖它，`description` 会出现在选择器里。用户级目录可以跨项目使用，项目级目录可以随项目共享，托管策略级则由组织统一下发。切换时，去 `/config` 里选择它。

## Scene 07｜`keep-coding-instructions` 的二分题

最容易按错的是 `keep-coding-instructions`。判断只问一句：这样式 Claude 还编程吗？如果只是换表达方式，编程照旧，就设为 true，保留限定范围和验证这些工程指令。如果它根本不做软件工程，就省略这个字段，让默认的 false 移除工程指令。按反了，角色和工作方式就会跑偏。

## Scene 08｜样式如何进入系统提示

底层机制可以看成一次组装。会话开始时，系统提示先带上该有的内容，再把 output style 的说明拼到末尾。对话进行中，它还会反复提醒 Claude 遵守这套说明，所以每个回应都会受到影响。自定义样式默认会拿掉内置工程指令，只有 keep 为 true 才保留。样式说明会增加输入 token，prompt caching 会降低后续成本，而 Explanatory 和 Learning 的长响应主要增加输出 token。

## Scene 09｜五种工具，各管一个抽屉

把几个容易混的工具分开看。output style 管每轮回应的角色、语气和格式。CLAUDE.md 管项目背景、约定和代码库资料。`--append-system-prompt` 只给某一次调用临时追加指令。Subagent 用独立的系统提示、模型和工具处理专注任务。Skill 则在调用时或相关时加载可复用工作流。想改的是方式、内容、一次性任务、独立助手还是按需流程，抽屉不要放错。

## Scene 10｜实操：建文件并选择样式

我们用一个先画图再解释的样式跑一遍。先在用户级目录创建 `diagrams-first.md`，frontmatter 写上名称、描述和 `keep-coding-instructions: true`，正文要求解释代码、架构或数据流时先给 Mermaid 图。然后打开 `/config`，在输出样式菜单里选择 `Diagrams first`。能看到名称和描述，就说明文件被识别了。

## Scene 11｜实操：`/clear` 后验证差异

选好以后先输入 `/clear`。接着问：“解释一下用户登录的请求是怎么从前端走到数据库的。”如果样式生效，回答会先出现请求路径的 Mermaid 图，再出现文字解释。你还可以切回 Default，清理会话，再问同一个问题；图在前、文字在后和只给文字的差别，就是回应方式真的被改变了。

## Scene 12｜换方式，不换知识；下一篇 Hooks

这篇只需要记住六点：output style 改怎么回应，不改知道什么；四档内置样式按任务选择；切换走 `/config` 或 `outputStyle`，改完用 `/clear`；自定义样式就是 Markdown 文件；是否保留工程指令看它还不还编程；CLAUDE.md 装项目内容，output style 装回应方式。下一篇是 33“钩子（Hooks）”，继续看怎样让动作在事件触发时自动发生。

