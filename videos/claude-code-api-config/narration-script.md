# Claude Code API 配置视频化 · 第四步：Narration Script

> 目标：基于 Scene Script 生成完整口播。
> 口播要服务视频叙事，而不是把原文重新念一遍。

---

## Scene 01｜登录了，为什么还会产生 API 费用？

你明明已经通过 `/login` 登录了 Max，为什么 API 账单还在持续增加？

问题可能不在登录，而在环境里还留着一个优先级更高的 API key。

登录进去，不等于当前用对了身份。

---

## Scene 02｜先判断：订阅还是 API key？

先别急着复制命令，先判断自己属于哪种使用场景。

个人日常的交互式开发，优先用订阅登录。

要嵌进脚本、CI，或者按团队用量结算，才考虑 API key。

它们不是同一套账，也不是同一种使用方式。

---

## Scene 03｜订阅登录：`claude` 到浏览器授权

如果你是个人订阅用户，装好 Claude Code 后直接运行 `claude`。

首次启动会打开浏览器，登录 Claude.ai，完成授权后回到终端。

如果浏览器没有自动打开，可以复制链接。

在远程环境里，也可能需要把登录代码粘贴回终端。

需要换账号时，先使用 `/logout`。

---

## Scene 04｜API key：Console、环境变量、批准

需要 API key 时，先在 Claude Console 创建密钥。

再把它配置到 `ANTHROPIC_API_KEY`，启动 Claude Code 后批准一次。

注意，密钥本身就是钱。

不要写进代码，不要提交 Git，也不要贴进可分享的文件。

画面里的 key 只能是占位符，不能使用真实密钥。

---

## Scene 05｜两条身份可以同时存在

真正容易出问题的地方在这里：订阅凭证和 API key 可以同时存在。

你可能已经登录了订阅，但环境变量里仍然有 API key。

接下来决定实际身份的，就不是你的主观选择，而是凭证的优先级。

---

## Scene 06｜六层身份验证优先级栈

源文档给出的身份优先级，从高到低共有六层。

最上面是云提供商。

接下来依次是 `ANTHROPIC_AUTH_TOKEN`、`ANTHROPIC_API_KEY`、`apiKeyHelper` 和 `CLAUDE_CODE_OAUTH_TOKEN`。

最后才是 `/login` 的订阅凭证。

Claude Code 会从上往下检查，跳过空层，停在第一个有值的层。

越靠上的凭证，越可能覆盖下面的凭证。

---

## Scene 07｜为什么 API key 会盖过订阅？

回到开场那个案例。

上面的几层大多为空，但第三层 `ANTHROPIC_API_KEY` 有值，所以扫描到这里就停下来了。

底部的订阅凭证虽然仍然存在，却没有成为实际使用的身份。

这就是为什么 Max 已经登录，账单却还是走 API。

---

## Scene 08｜切回订阅：先清理，再复查

想切回订阅，就先清掉覆盖订阅的环境变量：`unset ANTHROPIC_API_KEY`。

这一步不是重新登录，而是移除更高优先级的覆盖源。

然后重新进入 Claude Code，用 `/status` 查看实际身份。

交互模式里，也可以在 `/config` 关闭“使用自定义 API 密钥”的开关。

清理之后一定要复查，不要只凭命令执行成功就下结论。

---

## Scene 09｜CLI、Desktop、Web：入口边界不同

还要注意入口边界。

源文档区分了 CLI、Desktop 和 Web。

终端 CLI 会读取相关环境变量。

Desktop 和远程会话只认 OAuth。

Claude Code on the Web 使用订阅凭证。

不要把一个入口的配置方式直接套到另一个入口，然后再把“不生效”误判成配置失败。

---

## Scene 10｜身份确认后，再选择模型

身份确认之后，还有一个独立问题：让它用哪个模型。

可以把 Opus 看成处理复杂问题的资深工程师。

Sonnet 是日常主力。

Haiku 适合简单快速的任务。

常用别名包括 `default`、`opus`、`sonnet`、`haiku`、`best` 和 `opusplan`。

身份决定用谁的额度，模型决定让谁来干活。

---

## Scene 11｜模型配置也有自己的优先级

模型也不是只在一个地方设置。

源文档给出的优先级是：会话内的 `/model` 最高。

其次是 `claude --model`、环境变量 `ANTHROPIC_MODEL`，最后是 `settings.json`。

所以，身份优先级和模型优先级要分别理解。

前者回答“用谁的额度”，后者回答“实际运行哪个模型”。

---

## Scene 12｜用 `/status` 验收：不要凭感觉判断

最后实际检查一次。

进入 `claude`，用 `/status` 查看当前账户、身份和模型。

用 `/model` 查看或切换模型。

退出后检查 `ANTHROPIC_API_KEY`，必要时执行 `unset`，再回到 Claude Code 用 `/status` 复查。

你能说清楚当前用的是订阅还是 API key，运行的是哪个模型，这篇的核心目标就完成了。

下一条视频会继续解决一个自然延伸的问题。

既然请求可以通过不同身份发送，能不能把 Claude Code 接到第三方或国产模型？

线索是 `ANTHROPIC_BASE_URL` 改变请求发到哪里，而不是改变用哪个模型。
