# skill-creator 视频化 · 第五步：Visual Script

## 全局视觉原则

### 1. 画面不能只是重复口播

声音解释“为什么触发失败、description 如何修复、两条验证路径如何判断”，画面负责展示输入、匹配、目录、状态和结果。画面不把每句口播做成大段字幕卡。

### 2. 视觉承担“证明”和“演示”

- 用请求卡和路径分支证明“文件存在不等于被调用”。
- 用关键词扫描证明 `description` 如何把用户语言连接到 Skill。
- 用目录树证明 `SKILL.md`、参考资料和脚本的职责边界。
- 用双路径汇合证明自动触发和直接调用分别检查了不同层次。
- 用目录压缩成 `.skill` 文件证明创建到分发的闭环。

### 3. 一个 Scene 只表达一个视觉中心

全片只保留一个暗色工作台，Scene 之间只替换中心画面。每一幕的主视觉中心依次是：未命中、向导提问、循环轨道、目录分层、描述匹配、故障分支、范围对比、实战生成、双路径验证、打包预告。

### 4. 少做“页面”，多做“过程”

面板只是承载过程状态：输入框出现文字、扫描线命中、节点亮起、文件树展开、分支回溯、文件打包。避免做成十张静态说明页。

### 5. 屏幕文字保持语义归属

画面中只使用当前 `skill-creator` 文章及本片前置资料中已有的术语、路径、文件名、触发词和下一篇预告。参考视频的 `baoyu-diagram`、`explain-casual`、`Claude Code` 代理循环等业务文案不进入本片。

### 6. 横屏构图与安全区

- 按 1920 × 1080、16:9 横屏构图设计。
- 标题控制在 1～2 行，主体面板放在中部安全区。
- 底部保留字幕安全区，原型中的说明条不与主体卡片重叠。
- 代码和路径采用等宽字体，字号不小于 14px；核心标题不小于 30px。
- 单个 Scene 的主要卡片不超过 4 个，避免信息密度过高。

## Scene 01｜文件写出来了，为什么还是没被调用？

### 视觉目标

让观众一眼看见“文件存在”和“自动调用”之间的断层。

### 主要画面

左侧为文件编辑器：

```text
commit-helper/
└── SKILL.md
    description: Commit message helper
```

右侧为会话流：

```text
用户：帮我提交
系统：通用 commit 建议
状态：未命中 Skill
```

中间的连接线先变灰，再从 `description` 节点断开；“未命中 Skill”以黄色警示显示。

### 动画

1. 文件树和 `SKILL.md` 先出现，表示文件确实存在。
2. 用户输入从左下滑入。
3. 匹配线尝试连接 `Commit message helper`，随后断开。
4. 通用路径卡片亮起，右下角出现“问题可能不在安装”。

### 屏幕文字

`SKILL.md`、`Commit message helper`、`帮我提交`、`未命中 Skill`。

### Visual Type

Before／After Process + Trigger Failure。

## Scene 02｜`skill-creator` 是造 Skill 的向导

### 视觉目标

把“从空白文件开始”切换成“先回答四个问题”的向导直觉。

### 主要画面

中心是一个深色向导面板，标题为 `skill-creator · Capture Intent`。四张问题卡依次排列：

1. `能干什么？`
2. `何时触发？`
3. `输出什么？`
4. `要不要测试？`

右侧形成一张“创建计划”卡，列出 `name`、`description`、`测试 prompts`。

### 动画

问题卡按 1～4 依次从模糊变清晰；每回答一张，右侧创建计划多出一行。最后四条线汇入 `Ready to build` 状态。

### 屏幕文字

`skill-creator`、`Capture Intent`、`能干什么？`、`何时触发？`、`输出什么？`、`要不要测试？`、`Ready to build`。

### Visual Type

Concept Diagram／Process。

## Scene 03｜从意图到可分发 Skill 的七步循环

### 视觉目标

展示七步生产循环，并让“评估 → 修改 → 再测试”成为最明显的回环。

### 主要画面

横向轨道放置七个节点：

```text
Capture Intent → 写初稿 → 建测试 → 跑一遍 + 评估
       ↑                         ↓
       └────── 按反馈改 ←────────┘
                         → 优化 description → 打包
```

节点下方用小标签标明结果：`name / description`、`2～3 个 prompt`、`输出 + 触发`、`.skill`。

### 动画

蓝色进度点从第一节点移动到第四节点；到评估时分叉，一条线进入“按反馈改”，回到“建测试”，另一条线进入“优化 description”，最后进入 `.skill` 打包卡。

### 屏幕文字

`Capture Intent`、`写初稿`、`建测试`、`跑一遍 + 评估`、`按反馈改`、`优化 description`、`打包`、`.skill`。

### Visual Type

Process／Task Routing。

## Scene 04｜正文、参考资料和脚本各放在该放的位置

### 视觉目标

用目录展开表现“短正文、按需参考、可执行脚本”的分工。

### 主要画面

左侧文件树：

```text
my-skill/
├── SKILL.md
├── reference.md
├── examples.md
└── scripts/
    └── helper.py
```

右侧三个职责面板：

- `主要说明` → `SKILL.md`
- `按需读取` → `reference.md / examples.md`
- `执行脚本` → `scripts/helper.py`

底部显示一个上下文计量条，标记 `SKILL.md < 500 行`。

### 动画

文件树从根目录向下展开；每个文件被点亮后，连线到对应职责面板。计量条从“过载”回落到“精简”，不显示具体 token 数字。

### 屏幕文字

`my-skill/`、`SKILL.md`、`reference.md`、`examples.md`、`scripts/helper.py`、`主要说明`、`按需读取`、`执行脚本`、`SKILL.md < 500 行`。

### Visual Type

Code Exploration／Folder Exploration。

## Scene 05｜`description` 是自动触发的总开关

### 视觉目标

让描述从“只说是什么”变成“能做什么 + 什么时候使用 + 用户原话”，并展示命中变化。

### 主要画面

左右对比两张描述卡：

左卡：

```text
Commit message helper
只说是什么
```

右卡：

```text
把暂存的改动总结成符合团队规范的 commit message。
用户说“帮我提交”“写个 commit”“生成提交信息”时使用。
```

下方是一个用户输入扫描区，依次出现三个触发词，右卡被绿色连线命中。

### 动画

左卡扫描后显示灰色 `no match`；右卡替换进入，触发词逐个变成紫色高亮，`commit-skill` 节点被点亮。

### 屏幕文字

`只说是什么`、`能做什么 + 什么时候使用`、`帮我提交`、`写个 commit`、`生成提交信息`、`match`。

### Visual Type

Comparison／Trigger Flow。

## Scene 06｜自动不触发时，先查 `description`

### 视觉目标

用两条测试路径区分“自动触发层”和“Skill 正文执行层”。

### 主要画面

左路卡片：

```text
自动触发
我改了啥？
未命中
```

右路卡片：

```text
直接调用
/summarize-changes
成功加载 SKILL.md
```

两路底部汇入诊断卡：`关键词不足 → 补充真实触发词 → 重新测试`。

### 动画

两个输入同时进入匹配器；左路在 `description` 处停住，右路直接绕过匹配器进入 `SKILL.md`。诊断箭头从左路回指 `description`，再循环到“重新测试”。

### 屏幕文字

`自动触发：未命中`、`/summarize-changes：成功`、`关键词不足`、`补充真实触发词`、`重新测试`。

### Visual Type

Troubleshooting Flow／Two-path Comparison。

## Scene 07｜个人习惯还是项目规矩？

### 视觉目标

把目录选择从路径记忆转成“跟着人走／跟着项目走”的判断。

### 主要画面

左右两个相同尺寸的文件树：

左侧：

```text
~/.claude/skills/<skill-name>/
└── SKILL.md
个人 · 跨项目
```

右侧：

```text
.claude/skills/<skill-name>/
└── SKILL.md
项目 · 团队共享
```

右下角追加 Git 状态 `提交 Git`，底部警示条显示 `先检查外部 Skill`。

### 动画

个人卡片沿多个项目小节点移动；项目卡片沿仓库线进入 Git 节点。最后信任警示从底部淡入，停留一拍。

### 屏幕文字

`~/.claude/skills/<skill-name>/`、`.claude/skills/<skill-name>/`、`个人 · 跨项目`、`项目 · 团队共享`、`提交 Git`、`先检查外部 Skill`。

### Visual Type

Scope Comparison／Repository Flow。

## Scene 08｜从意图开始造 `summarize-changes`

### 视觉目标

把一个最小 Skill 从用户意图逐项落成目录、触发词和输出规则。

### 主要画面

左侧为意图卡：

```text
目标：总结未提交改动
触发：我改了啥？
输出：2～3 条要点
```

右侧为终端／文件面板：

```text
summarize-changes/
└── SKILL.md
    description: 我改了啥／总结一下我的改动
    output: 2～3 条要点
```

底部以灰色代码标记显示 ``!`git diff HEAD` ``，旁边标签为 `动态上下文注入示例`。

### 动画

目标、触发、输出三项依次从左侧拖入 `SKILL.md`；目录生成后，动态上下文标记最后出现，保持灰色，明确它是示例而不是本原型执行动作。

### 屏幕文字

`summarize-changes`、`总结未提交改动`、`我改了啥？`、`2～3 条要点`、`SKILL.md`、``!`git diff HEAD` ``、`动态上下文注入示例`。

### Visual Type

Task Execution／Terminal Demo。

## Scene 09｜自动调用和直接调用，汇入同一个结果

### 视觉目标

展示双路径验证，并在一个结果节点中说明不同失败组合意味着什么。

### 主要画面

左路：

```text
我改了啥？
→ 自动触发
→ summarize-changes
```

右路：

```text
/summarize-changes
→ 直接调用
→ summarize-changes
```

两路汇入绿色结果面板：`2～3 条改动要点`。底部放一个三格诊断条：`A+B 成功`、`A 失败+B 成功`、`A+B 失败`。

### 动画

左右输入交替进入，先后点亮同一个 Skill 节点，再合并到结果面板。诊断条依次亮起，第二格突出“优化 description”，第三格突出“检查路径和正文”。

### 屏幕文字

`我改了啥？`、`/summarize-changes`、`自动触发`、`直接调用`、`同一份 SKILL.md`、`2～3 条改动要点`、`A 失败 + B 成功：优化 description`。

### Visual Type

Dual-path Verification／Decision Diagram。

## Scene 10｜造得对、叫得动、验得过，最后才能发出去

### 视觉目标

将创建、触发、验证和分发压缩成可记忆的闭环，并把下一篇预告作为最后一个视觉事件。

### 主要画面

左侧完整目录：`SKILL.md`、`references/`、`scripts/`；中间有压缩动画，右侧生成单个文件：`summarize-changes.skill`。

下方四个总结节点：`意图` → `description` → `测试` → `迭代`。打包完成后，主画面切换为预告卡：

```text
下一篇
29「Agent teams 智能体团队」
```

### 动画

目录文件向中心收拢形成 `.skill` 文件；四个总结节点按顺序亮起。最后其他节点降低对比度，预告卡居中淡入并停留 2～3 秒。

### 屏幕文字

`SKILL.md`、`references/`、`scripts/`、`summarize-changes.skill`、`意图`、`description`、`测试`、`迭代`、`29「Agent teams 智能体团队」`。

### Visual Type

Summary Flow／Preview Card。

## 全片视觉类型、组件与动画标准

### 视觉类型

- `Trigger Failure`：Scene 01，用断开的匹配线表达未命中。
- `Concept Diagram`：Scene 02，用问题卡汇聚向导计划。
- `Process`：Scene 03，用有回环的轨道表达生产循环。
- `Code Exploration`：Scene 04，用文件树和职责连线表达结构。
- `Comparison`：Scene 05、07，用前后描述和范围并列表达差异。
- `Troubleshooting Flow`：Scene 06，用分支结果定位问题。
- `Task Execution`：Scene 08，用目标到文件的落地过程表达实战。
- `Dual-path Verification`：Scene 09，用双入口汇合验证。
- `Summary Flow／Preview Card`：Scene 10，用压缩与停留完成收束。

### 基础组件

- `Stage`：16:9 深色工作台，带轻微径向光和细边框。
- `Panel`：承载文件树、会话流、终端和诊断状态。
- `Node`：流程节点，默认蓝色边框，完成状态变为绿色。
- `Path`：输入、匹配、加载、输出之间的连接线。
- `Tree`：等宽字体文件树，目录蓝色、文件紫色。
- `Status`：`未命中` 使用黄色，`成功` 使用绿色，`待检查` 使用紫色。
- `Preview Card`：只在 Scene 10 使用，承载下一篇预告。
- `Caption`：幕内底部短句，用于提示当前视觉事件，不承担完整口播。

### 动画标准

- 信息动画优先：节点亮起、文件展开、路径连接、结果汇合。
- 注意力动画其次：扫描线、断线、回环箭头和颜色变化只服务于当前认知重点。
- 装饰动画最少：仅保留轻微呼吸光，不使用复杂粒子、3D 或花哨转场。
- 单次状态切换约 300～600ms，重要结果至少停留 1.2 秒。
- Scene 03 的回环必须完整可见，Scene 09 的两路必须明确汇合，Scene 10 的预告必须有约 2～3 秒停留。
- 所有交互按钮和进度提示只属于静态原型，不属于未来正式 Composition 的画面内容。

## Gate 2 视觉与文字内部检查

- [x] 10 个 Scene 与 Scene Script、Narration Script 一一对应，顺序和主要认知任务一致。
- [x] 每幕的画面都承担演示、证明、对比或状态变化，不是口播文字的整段复制。
- [x] 所有标题、标签、路径、文件名、状态、命令示例和预告均可追溯到本片 `source.md` 或前置生产资料。
- [x] 文章中的命令和动态上下文语法只以示例文字显示，不在原型中执行任何外部操作。
- [x] 未使用其他视频中的业务名词、固定文案或状态文字。
- [x] 横屏构图保留标题区、主体区和底部字幕安全区，Scene 10 预告卡与字幕区域分离。
- [x] 预览导航、进度提示和说明条明确属于 HTML 原型外壳，不进入最终视频画面范围。

## 下一步

制作 `visual-prototype.html`，以 10 个 Scene 验证横屏构图、信息密度、状态变化、控件和预告停留；原型检查完成后停止，不进入 TTS 或 Remotion。
