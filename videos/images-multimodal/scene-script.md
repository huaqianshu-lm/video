# Claude Code 图片与多模态 · Scene Script

## Scene 01｜给它看，比跟它讲快

- **sceneId**：`images-multimodal-01`
- **title**：给它看，比跟它讲快
- **purpose**：用设计稿截图到 CSS 和页面结果的前后变化建立图片输入的效率直觉。
- **narrativeRole**：Opening Hook／制造问题
- **narrationIntent**：说明过去要逐项描述间距、字号、圆角和颜色，现在可以直接把 PNG 交给 Claude 并要求生成 CSS。
- **visualIntent**：让设计稿缩略图进入 Claude 工作台，随后出现 CSS 和“几乎一样”的浏览器页面。
- **visualType**：`Before/After Comparison + UI Simulation`
- **keyOnScreenText**：`设计稿 PNG`、`生成 CSS`、`高完成度起点`
- **videoValue**：前后状态变化直接展示“给它看”的效率差距，避免开场停留在功能定义。

## Scene 02｜先看描述成本，再决定上不上图

- **sceneId**：`images-multimodal-02`
- **title**：先看描述成本，再决定上不上图
- **purpose**：建立“文字描述不清楚或繁琐时使用图像”的通用判断标准。
- **narrativeRole**：Frame／建立判断规则
- **narrationIntent**：用一句判断标准串起页面错位、报错弹窗和设计稿三类适合上图的场景。
- **visualIntent**：一个分流仪表盘把“打字足够”和“直接给图”分开，三种现场依次落入图片路径。
- **visualType**：`Decision Diagram + Scenario Cards`
- **keyOnScreenText**：`描述起来比截图还累？`、`直接给图`、`页面错位`、`报错弹窗`、`设计稿`
- **videoValue**：让观众获得可迁移的选择标准，而不是只记住几个例子。

## Scene 03｜三种方法，结果都是让它看见

- **sceneId**：`images-multimodal-03`
- **title**：拖、贴、给路径
- **purpose**：总览把图片交给 Claude Code 的三种输入方式。
- **narrativeRole**：Method Map／展示操作地图
- **narrationIntent**：说明拖进窗口、复制后 `ctrl+v`、直接给图片路径三种方式任选其一。
- **visualIntent**：三条入口从不同方向汇入同一个 `[Image #1]` 图片上下文节点。
- **visualType**：`Process + Connection Diagram`
- **keyOnScreenText**：`拖进窗口`、`ctrl+v`、`图片路径`、`[Image #1]`
- **videoValue**：并行入口和汇合节点能快速建立方法全貌，避免观众把三种方法当成三套不同能力。

## Scene 04｜拖进终端，最直觉

- **sceneId**：`images-multimodal-04`
- **title**：把图片直接拖进窗口
- **purpose**：具体演示最容易上手的拖拽方式。
- **narrativeRole**：Method／降低第一次操作门槛
- **narrationIntent**：用文件管理器把图片拖进正在运行的 Claude Code 终端，强调像拖文件到聊天框一样直觉。
- **visualIntent**：图片文件从文件管理器移动到终端输入区，落下后显示图片占位标记。
- **visualType**：`UI Simulation + Task Execution`
- **keyOnScreenText**：`error-screenshot.png`、`拖入 Claude Code`、`[Image #1]`
- **videoValue**：动作本身比文字解释更能让新手理解“拖到哪里、成功后看什么”。

## Scene 05｜Mac 粘贴图片，要按 ctrl+v

- **sceneId**：`images-multimodal-05`
- **title**：Mac 的关键坑：ctrl+v，不是 cmd+v
- **purpose**：突出全文最容易踩错的快捷键细节。
- **narrativeRole**：Friction／制造记忆点
- **narrationIntent**：说明复制图片后 Mac 也用 `ctrl+v`；`cmd+v` 在多数终端可能粘成路径文本，导致图片没有进入。
- **visualIntent**：键盘对照中 `ctrl+v` 让 `[Image #1]` 成功出现，`cmd+v` 走向乱码路径文本和失败状态。
- **visualType**：`Keyboard Comparison + Error State`
- **keyOnScreenText**：`Mac：ctrl+v`、`不要默认 cmd+v`、`图片已挂上`、`路径文本`
- **videoValue**：错误路径的可见后果让快捷键规则成为可回忆的操作经验，而不是一条孤立提示。

## Scene 06｜路径、多图和图片引用

- **sceneId**：`images-multimodal-06`
- **title**：图片已存好，就直接给路径
- **purpose**：展示脚本和已存图片的路径输入，以及多图引用的核对方式。
- **narrativeRole**：Method／扩展操作范围
- **narrationIntent**：说明路径适合脚本或深层目录，多张图片可以放在同一条提示中，Claude 用 `[Image #N]` 指代并可点击打开。
- **visualIntent**：提示框中出现两条图片路径，回复分别引用 `[Image #1]` 和 `[Image #2]`，点击后打开对应预览。
- **visualType**：`Prompt + Multi-image Reference`
- **keyOnScreenText**：`Analyze this image: /path/to/image.png`、`[Image #1]`、`[Image #2]`、`Cmd+Click`
- **videoValue**：把路径、多图和引用串成一次可核对的交互，展示图片输入不止适合鼠标拖拽。

## Scene 07｜截图就是报错和 UI 的现场

- **sceneId**：`images-multimodal-07`
- **title**：贴报错截图，直接给它现场
- **purpose**：展示图片最直接的诊断用途：错误和 UI 问题。
- **narrativeRole**：Use Case／证明“看见现场”的价值
- **narrationIntent**：解释截图保留图标、颜色、排版和错位等文字难以完整传达的上下文，Claude 可以据此分析原因。
- **visualIntent**：错误弹窗和向右偏移的按钮截图进入提示，右侧标出 `What's causing it?` 与 UI 描述请求。
- **visualType**：`Screenshot Diagnosis + UI Simulation`
- **keyOnScreenText**：`Here's a screenshot of the error.`、`What's causing it?`、`Describe the UI elements`
- **videoValue**：画面能同时呈现颜色、布局和错误位置，证明“截图是现场照片”而非装饰图片。

## Scene 08｜设计稿截图，先得到八成稿

- **sceneId**：`images-multimodal-08`
- **title**：从设计稿到能跑的代码
- **purpose**：展示图片如何减少设计到代码之间的体力工作，并建立合理预期。
- **narrativeRole**：Use Case／展示高价值结果
- **narrationIntent**：说明可以要求生成 CSS 或推断 HTML 结构，结果是高完成度起点，最后一两成仍需要人工微调。
- **visualIntent**：设计稿截图与 CSS、HTML 结构和浏览器组件并列，最后出现“八成稿 → 人工微调”。
- **visualType**：`Design-to-Code Demo + Before/After`
- **keyOnScreenText**：`照着这张设计稿生成对应的 CSS`、`What HTML structure would recreate this component?`、`八成稿`
- **videoValue**：前后对照能把“省掉体力活”具体化，也避免把结果夸大成像素级复刻。

## Scene 09｜图表、schema、架构图：读懂关系

- **sceneId**：`images-multimodal-09`
- **title**：结构关系，用图更容易讲清
- **purpose**：展示图片输入从界面现场扩展到结构性图像。
- **narrativeRole**：Use Case／拓展认知边界
- **narrationIntent**：说明架构图、数据库 schema 和图表适合让 Claude 先读出模块、连接和数据流，再协助修改或审查。
- **visualIntent**：一张架构图被扫描，模块连线被高亮，随后出现 schema 修改问题和“problematic elements?”审查请求。
- **visualType**：`Code Exploration + Connection Diagram`
- **keyOnScreenText**：`database schema`、`How should we modify it?`、`Are there any problematic elements?`
- **videoValue**：连线和分层是文字难以高效表达的关系，动态高亮能建立“先读结构，再做判断”的直觉。

## Scene 10｜三步跑通第一次喂图

- **sceneId**：`images-multimodal-10`
- **title**：三步跑通：喂图 → 提问 → 看懂
- **purpose**：把前面的能力压缩为一次不依赖项目的可执行练习。
- **narrativeRole**：Action／推动观众尝试
- **narrationIntent**：依次说明准备 PNG／JPG、在任意目录启动 `claude`、给图并请求中文描述；准确描述即代表链路跑通。
- **visualIntent**：终端三步状态依次完成，最后在回复中出现对图片内容的准确描述和通过标记。
- **visualType**：`Terminal Demo + Checklist`
- **keyOnScreenText**：`1．准备图片`、`2．claude`、`3．描述这张图`、`Image understood`
- **videoValue**：步骤和结果状态让观众知道如何开始，以及什么现象可以证明操作成功。

## Scene 11｜一图胜千言，变成选择标准

- **sceneId**：`images-multimodal-11`
- **title**：什么时候该上图？描述比截图还累的时候
- **purpose**：总结输入方式、三大用途和判断标准，并完成系列承接。
- **narrativeRole**：Summary + Series Bridge／总结与承接
- **narrationIntent**：复述“拖、贴、给路径”“报错／设计稿／结构图”和“描述比截图还累就上图”，最后承接把图片作为更多真实任务的上下文。
- **visualIntent**：三栏速查卡收束后，单独升起“系列承接：让图片成为任务上下文”的预告卡并停留。
- **visualType**：`Summary Card + Preview`
- **keyOnScreenText**：`怎么喂：拖／ctrl+v／路径`、`能干嘛：现场／还原／读结构`、`描述比截图还累 → 上图`、`让图片成为任务上下文`
- **videoValue**：把分散的操作细节压缩成可复用决策卡，同时给系列留下清晰的认知延伸。
