# 公共动效组件与官方能力

规范以 `VIDEO-PRODUCTION-RULES.md` 第 8.4／8.5／9.1～9.5 节为准。本文说明实际代码入口、使用方法和验证边界。

## 依赖与入口

- 当前安装版本：`remotion`、`@remotion/paths`、`@remotion/transitions` 均为 `4.0.496`；两个新增官方包在 package.json 中固定版本，并记录在 package-lock.json。后续使用 `npm ci` 恢复这一锁定基线。
- 核心包提供 `spring`、`interpolate`、`Easing` 和帧驱动；路径包用于描边、路径采样和变形；转场包用于有理由的视角切换。
- `src/lib/motion.ts`：共享时间求值、官方弹簧、路径采样、可见区间和镜头变换。
- `src/components/ContinuousMotion.tsx`：在同一 SVG 世界坐标系内组织动作。SVG 的 `<g>` 包装器不能直接用来包 HTML；HTML 场景仍可复用 `SemanticMotion.tsx` 或用时间求值函数驱动 CSS 属性。
- `src/components/MotionTransition.tsx`：官方转场封装及总时长计算。
- `src/scenes/MotionCapabilityDemo.tsx`：通用能力样片，在受跟踪 Root 中注册，不对应任何具体视频项目。

## 连续空间组件

| 组件／函数 | 输入与效果 | 使用注意 |
|---|---|---|
| `MotionWindow` | `startFrame`、`endFrame`、完整元素组；仅在区间内输出 | 区间为左闭右开；底线、箭头、标签与光效一起放入，区间外整组不输出。 |
| `MotionCamera` | `pose` 世界焦点及缩放、`viewport` 画布落点 | 默认落点为 `(960,480)`；镜头参数按共同时间计算，不能每幕重置。 |
| `SpringTransform` | 起止位置／缩放、时间区间与可选弹簧配置 | 使用官方 `spring`；开始前为初态、完成后为终态；显示时机另由 MotionWindow 控制。 |
| `SpringAssembly` | 中心、带稳定 ID 的子元素及偏移、展开／合并时间、错峰帧数 | 从一个主体展开，错峰落位，再收回主体；不自动创建子元素业务文案或连线。 |
| `PathReveal` | SVG 路径、时间和描边颜色 | 调用官方 `evolvePath`，只揭示路径；不能替代对象传递。 |
| `PathMotion`／`pathPoint` | 路径、时间／进度 | 调用 `getLength`／`getPointAtLength`；子元素原点在路径采样点，默认保留方向，完成后停在终点。 |
| `ShapeMorph` | 起止 SVG 形状及时间 | 调用官方 `interpolatePath`；提供可对应的轮廓，实际检查中间形态。 |
| `SvgStateChange` | 旧状态、新状态和时间 | SVG 同区状态交接，终态移除旧内容；不包含形状变形和外层生命周期。 |
| `SvgFocusTransfer` | 起止焦点中心及时间、颜色 | 76×76 的模板焦点框；阅读区和配角降权仍由场景设计。 |
| `ProgressRing` | 时间、半径、颜色 | 按事件进度描画圆环；显示／退出由外层区间控制。 |
| `ArrivalPulse` | 到达帧、持续帧、半径、颜色 | 到达后一次扩散反馈，内部控制生命周期，结束即移除。 |

现有 `SemanticMotion.tsx` 保持原有 API 和行为。新增组件不批量替换历史场景，已完成视频保持永久只读。

### 路径与相关元素一起进入

使用路径组件前，先按 `VIDEO-PRODUCTION-RULES.md` 9.1 的「代码执行与路径表达」三条判断是否需要路径；该节是选型依据。以下示例仅说明区间控制与组件组合，不是代码执行的默认视觉方案。

```tsx
import {MotionWindow, PathReveal, PathMotion} from '../components/ContinuousMotion';

const d = 'M100 400 C350 100 700 100 900 400';
// start / duration / end 必须由当前视频已经校验的事件时间绑定解析。
<svg viewBox="0 0 1920 1080">
  <MotionWindow startFrame={start} endFrame={end}>
    <path d={d} fill="none" stroke="#294c52" strokeWidth={4} />
    <PathReveal d={d} startFrame={start} durationFrames={duration} color="#39d7c2" />
    <PathMotion d={d} startFrame={start} durationFrames={duration}>
      <circle r={24} fill="#39d7c2" />
    </PathMotion>
    {/* 目标节点、标签和箭头也放进同一组。 */}
  </MotionWindow>
</svg>
```

`startFrame` 等帧值与组件的 `useCurrentFrame()` 属于同一坐标系；若在 Sequence 内使用，要从全片事件帧减去该 Sequence 起始帧。持久空间优先在共同父级维护。正式 narrated 视频使用 Cue／Segment／Timeline，宣传片使用 Visual Timeline；组件不自行猜测音频或读取具体视频文件。

同一句字幕包含多个动作时，命名 `visualBindings.source` 可携带 `offsetFrames`，从该 Cue 起始帧精确推进到真实 TTS WordBoundary。该值须由当前音频的词边界生成，并保留词边界证据；不得按字数、设计秒数或固定间隔猜测。`createVisualTiming` 与 Harness 对齐校验共同拒绝负值、非整数和越出来源区间的偏移；省略该字段时仍从来源起始帧开始。

此契约涉及本地视觉绑定生产者、公共时间解析和 Harness 对齐消费者；单条与批量复用同一解析器，旧 Cue／Segment 绑定保留原行为。当前视频的词边界证据和实际音画验收保存在本地，通用改动通过类型检查和既有时间／对齐回归核对；实际跨视频验收待完成。

## 官方转场

`MotionTransition` 输入前后视图、各自长度和重叠帧数，可选择 `fade`／`wipe` 及 `linear`／`spring` 时间函数。总帧数通过 `transitionDuration(beforeFrames, afterFrames, overlapFrames)` 返回：

```text
总帧数 = 前视图帧数 + 后视图帧数 − 重叠帧数
```

两段各 120 帧，重叠 30 帧时，总长度为 210 帧。需要嵌入既有时间轴时先核对区间长度、事件和音画映射；不能用转场悄悄缩短正式视频。连续空间中的主体移动或运镜直接使用共同空间，只有更换证据／视角时才选择转场。

## Studio 样片

```bash
npm run preview:motion
```

该命令使用 `src/index.ts` 的通用 Composition 入口，不扫描具体视频或生成具体视频输入包。生产视频的 Studio 入口继续按既有独立输入包规则使用。

| Composition ID | 长度 | 用途 |
|---|---|---|
| `motion-components-template` | 1200 帧，40 秒 | 复现本地 HTML 动作参考的持续主体／空间：标题让位、路径传递、展开合并、处理完成、放大检查、镜头跟随交付。 |
| `motion-transition-template` | 210 帧，7 秒 | 同一对象由完成视图切到细节视图，演示官方 wipe 与 springTiming，不插入连续空间样片。 |

能力样片的估算时间与测试文案依据本轮确认的本地参考 `local/motion-lab/visual-script.md`：使用「一个任务的旅程」「输入」「处理端」「处理」「输出」「任务」「处理中」「完成」「处理完成」「交付端」「任务已交付」「已就绪」。这些是通用能力演示资料，不作为后续视频的默认业务文案。样片不生成 TTS／字幕／音频，不注册 Workflow、不推进人工 Gate。

40 秒样片的关键可见区间：标题 0～2.2 秒；主体 1.6～40 秒；输入节点 1.5～8 秒、输入路径 2.4～8 秒，二者在 7.2～8 秒淡出，8 秒起整组移除；展开部件 9.3～14.6 秒；处理环 16～21.8 秒；完成结论 21.2～23.6 秒；细节 25～29.9 秒；交付底线、路径、节点 32～40 秒；交付反馈 37 秒后。处理端继续承载展开、处理及检查任务，空间网格与主体延续，不保留已经结束且没有后续用途的输入轨迹。最后一段的轨迹及节点在 32 秒前整组不输出。原型的近似弹簧和贝塞尔参数采样已由官方弹簧及弧长采样替代，具体速度与回弹观感须在 Studio 复核。

## 验收与当前边界

- AC-1 [MUST] 两项官方依赖与当前 Remotion 版本匹配，实际由公共组件导入使用。
- AC-2 [MUST] 路径移动／描边、弹簧展开／合并、状态／形状变化、焦点与镜头、到达反馈及官方转场均有可复用代码和样片调用。
- AC-3 [MUST] 完整元素组按目标帧区间输出，回放／跳帧不依赖播放历史；持续主体和镜头不按片段重置。
- AC-4 [MUST] 通用 Studio 入口编译可用；原有 SemanticMotion API、具体视频和 Gate 记录保持原有行为。
- AC-5 [MUST] 在 Studio 实际检查动作、标题、交界、提前显示及残留；未观看时明确保留待验收，不以类型／编译通过代替画面质量。

类型及入口编译检查只能验证代码接入。实际动态观感和另一条新视频的完整制作验证仍需人工执行；MotionWindow 是程序层的区间控制，不等于 Harness 已有全视频自动可见性识别。没有完成实际观看和跨视频验证前，不声明方法已固化。

官方参考：[帧驱动动画](https://www.remotion.dev/docs/animating-properties)、[spring](https://www.remotion.dev/docs/spring)、[路径采样](https://www.remotion.dev/docs/paths/get-point-at-length)、[路径描画](https://www.remotion.dev/docs/paths/evolve-path)、[TransitionSeries](https://www.remotion.dev/docs/transitions/transitionseries)。API 按当前安装版本使用。
