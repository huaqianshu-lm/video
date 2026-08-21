# Scene Script｜Claude Code 反模式

## 全片基线

- 画幅：16:9 横屏，按 1920 × 1080 构图。
- Scene 数量：11。
- 核心视觉语言：深色工作台、蓝色结构线、红色反模式、绿色替换动作。
- 屏幕文字原则：只展示症状、术语、动作和结果；不把整段文章或口播复制到画面。
- 系列结尾：Scene 11 的最后一个视觉事件是第 51 篇「FAQ／Troubleshooting」预告。

## Scene 01｜好工具也能被用废

- sceneId：`anti-patterns-01`
- title：好工具也能被用废
- purpose：建立反常识问题，改变「不好用就是工具不行」的归因。
- narrativeRole：Opening Hook
- narrationIntent：说明大量问题来自用法反模式，而不是高级功能不足。
- visualIntent：用同一工具在两种使用方式下呈现「顺畅」与「越用越糟」的差异。
- visualType：Comparison / Opening
- keyOnScreenText：`Good tool`、`Wrong usage`、`Feels worse`、`反模式`
- videoValue：状态对比能在一幕内建立「工具相同、用法不同、结果不同」的直觉。

## Scene 02｜七个坑会互相喂养

- sceneId：`anti-patterns-02`
- title：七个坑会互相喂养
- purpose：让观众看到七个反模式之间的恶性循环，建立整条视频的地图。
- narrativeRole：Problem Map
- narrationIntent：解释需求宽、上下文满、错误增加、拒绝验证和进一步裸奔如何连成循环，并指出拆需求、清上下文、给验证、收范围是破局点。
- visualIntent：将七个反模式节点围成环，右下角显示四个破局动作。
- visualType：Concept Diagram / Process
- keyOnScreenText：`7 anti-patterns`、`Context full`、`More errors`、`Break the loop`
- videoValue：循环和断点比线性口述更快表达相互放大的关系。

## Scene 03｜一句话塞一大堆需求

- sceneId：`anti-patterns-03`
- title：一句话塞一大堆需求
- purpose：识别最常见的输入反模式，建立「一次一条主线」的第一条替换原则。
- narrativeRole：Pattern 01
- narrationIntent：解释多条需求混在一起会让边界和主线模糊；小任务可直做，大任务先 Plan Mode。
- visualIntent：左侧展示四个混杂任务，右侧只保留 OAuth 主线并加入 Plan。
- visualType：Comparison / Task Planning
- keyOnScreenText：`OAuth`、`Bug`、`Button`、`Tests`、`One mainline`、`Plan first`
- videoValue：堆叠与拆分的动态差异能直接展示「范围失控」如何被收窄。

## Scene 04｜不写或全塞进 CLAUDE.md

- sceneId：`anti-patterns-04`
- title：CLAUDE.md 是便签，不是百科全书
- purpose：区分「完全没有常驻规则」和「把所有知识常驻化」两个极端。
- narrativeRole：Pattern 02
- narrationIntent：说明规则太少会让用户反复交代，规则太多会淹没真正重要的约束；只保留删掉就会导致错误的内容。
- visualIntent：左右两张规则卡分别展示 Empty 与 Bloated，随后收束为 Keep what prevents mistakes。
- visualType：Comparison / UI Simulation
- keyOnScreenText：`No CLAUDE.md`、`Bloated`、`Commands`、`Tests`、`Keep what prevents mistakes`
- videoValue：长度和重点的视觉对比比抽象解释更容易形成取舍标准。

## Scene 05｜一个会话从早开到晚

- sceneId：`anti-patterns-05`
- title：一个会话从早开到晚
- purpose：让观众理解厨房水槽会话和反复纠正污染。
- narrativeRole：Pattern 03
- narrationIntent：说明无关话题和失败版本会占满上下文；任务换用 `/clear`，同一任务过长用 `/compact`，纠正两次以上要重开。
- visualIntent：展示上下文从多个无关话题堆满，到执行 Clear／Compact 后恢复干净。
- visualType：State Change / Process
- keyOnScreenText：`Bug fix`、`GIL?`、`Deploy`、`/clear`、`/compact`、`Clean context`
- videoValue：堆满与清空是时间和状态变化，静态列表无法同样直观地表达污染。

## Scene 06｜把它当搜索引擎，而且说啥信啥

- sceneId：`anti-patterns-06`
- title：看着对，不等于真的对
- purpose：建立对版本、冷门 API 和未读文档的核验意识。
- narrativeRole：Pattern 04
- narrationIntent：说明模型可能基于过期记忆或不确定内容给出听起来专业的答案；实时信息要查真实来源，产出要运行或索要证据。
- visualIntent：左侧显示 plausible answer 直接进入代码，右侧显示 Official docs／Run check 后才变成 verified。
- visualType：Comparison / Verification
- keyOnScreenText：`Looks right`、`Unknown API`、`Official docs`、`Run check`、`Verified`
- videoValue：错误答案经过核验闸门后才进入项目，能把「信任」转成可见流程。

## Scene 07｜不给它能自己验证的办法

- sceneId：`anti-patterns-07`
- title：让它显示证据，而不是声称完成
- purpose：把「看着完成」和「可验收完成」区分开。
- narrativeRole：Pattern 05
- narrationIntent：解释没有测试、构建或截图对比时，所有边界错误都会等用户发现；修报错要解决根因，不要抑制错误。
- visualIntent：左侧显示 Done?／Looks done，右侧循环 Execute → Check → Evidence，并展示失败后修复。
- visualType：Process / Terminal Simulation
- keyOnScreenText：`Looks done`、`Test cases`、`Root cause`、`Evidence`、`✓ verified`
- videoValue：验证循环必须通过状态变化来表达，观众才能看到「完成」从声明变成证据。

## Scene 08｜无脑开启 bypassPermissions

- sceneId：`anti-patterns-08`
- title：省确认，不等于省风险
- purpose：说明工作机裸奔会移除权限确认和提示注入防护。
- narrativeRole：Pattern 06
- narrationIntent：对比 `acceptEdits`、`auto` 和隔离环境中的 `bypassPermissions`，强调工作机不应无脑裸奔。
- visualIntent：展示三档权限边界，只有隔离容器中的 bypassPermissions 被标记为可接受。
- visualType：Comparison / Security Boundary
- keyOnScreenText：`acceptEdits`、`auto`、`bypassPermissions`、`Work machine`、`Isolated VM`
- videoValue：安全边界和被移除的闸门需要画面分层，单靠口播容易把模式混为一谈。

## Scene 09｜调查一下，却不给范围

- sceneId：`anti-patterns-09`
- title：调查任务也要有边界
- purpose：识别无限探索造成的上下文灌爆，并给出范围收窄或 Subagent 隔离两条路。
- narrativeRole：Pattern 07
- narrationIntent：说明不限定目录和问题会读取大量文件；知道位置就指定范围，不知道位置或只要结论就派 Subagent 返回摘要。
- visualIntent：左侧展示整个仓库文件涌入主窗口，右侧分成 src/auth/ 范围调查和 Subagent 隔离调查。
- visualType：Comparison / Concept Diagram
- keyOnScreenText：`Whole repo?`、`Context overflow`、`src/auth/`、`Subagent`、`Summary`
- videoValue：把原始资料流向主窗口与隔离窗口的差异画出来，能直接解释上下文成本。

## Scene 10｜反面操作体检

- sceneId：`anti-patterns-10`
- title：把某人的一天逐条体检
- purpose：把七个概念映射回真实操作，训练观众从行为识别反模式。
- narrativeRole：Practice
- narrationIntent：快速复述七条反面操作，再按编号给出替换动作，强调这是一套可重复的诊断方法。
- visualIntent：左侧显示七条行为，右侧逐条打上 Pattern 编号并换成正确动作。
- visualType：Process / Diagnostic Board
- keyOnScreenText：`7 behaviors`、`#1` 至 `#7`、`Diagnose`、`Replace`
- videoValue：逐条标注和替换形成可视化练习，比总结定义更接近真实使用场景。

## Scene 11｜七条速查与下一篇预告

- sceneId：`anti-patterns-11`
- title：把反模式雷达装进日常操作
- purpose：压缩七个反模式的替换动作，并完成系列承接。
- narrativeRole：Summary / Next Episode Teaser
- narrationIntent：回顾拆需求、写精规则、清上下文、查证据、给验证、保安全、限范围；最后预告第 51 篇 FAQ／Troubleshooting。
- visualIntent：先让七条速查依次点亮，最后收起为一张雷达卡，并将「下一篇：FAQ／Troubleshooting」作为最后视觉事件。
- visualType：Summary / Teaser Card
- keyOnScreenText：`拆需求`、`写精规则`、`清上下文`、`查证据`、`给验证`、`保安全`、`限范围`、`下一篇：FAQ／Troubleshooting`
- videoValue：速查卡适合停留和回看，最后预告卡形成清晰的系列结束点。

## Gate 1 内部审查

- 11 个 Scene 的认知任务互不重复，且覆盖开场、七个反模式、练习和总结：通过。
- 每个 Scene 已明确 sceneId、title、purpose、narrativeRole、narrationIntent、visualIntent、visualType、keyOnScreenText、videoValue：通过。
- 叙事顺序遵循问题归因 → 恶性循环 → 七张症状卡 → 综合体检 → 速查和预告：通过。
- 视觉事件不只是文章章节标题，已加入对比、流程、状态变化和隔离关系：通过。
- Scene 11 的下一篇预告为最后一个视觉事件：通过。

结论：Gate 1 通过。

