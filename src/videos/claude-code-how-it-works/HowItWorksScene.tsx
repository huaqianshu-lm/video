import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import type {SceneConfig, StepListSceneConfig, SummarySceneConfig, TerminalSceneConfig} from '../../lib/videoTypes';
import {colors, SceneContainer} from '../../components/SceneContainer';

export type SceneCueFrames = {start: number; end: number};
type Props = {scene: SceneConfig; cueFrames: SceneCueFrames[]};

const fade = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const cueStart = (cueFrames: SceneCueFrames[], index: number, fallback: number) => cueFrames[index]?.start ?? fallback;
const cueEnd = (cueFrames: SceneCueFrames[], index: number, fallback: number) => cueFrames[index]?.end ?? fallback;
const cueReveal = (frame: number, cueFrames: SceneCueFrames[], index: number, fallback: number, fadeFrames = 12) => {
  const start = cueStart(cueFrames, index, fallback);
  return fade(frame, start, start + fadeFrames);
};
const Panel = ({children, active = false, style = {}}: {children: ReactNode; active?: boolean; style?: CSSProperties}) => (
  <div style={{background: active ? 'rgba(24, 39, 68, 0.96)' : 'rgba(17, 27, 47, 0.94)', border: `1px solid ${active ? colors.accent : colors.line}`, borderRadius: 22, boxShadow: active ? '0 0 36px rgba(142, 169, 255, 0.16)' : 'none', ...style}}>{children}</div>
);

const Pill = ({children, tone = colors.accent}: {children: ReactNode; tone?: string}) => (
  <span style={{border: `1px solid ${tone}`, borderRadius: 999, color: tone, display: 'inline-block', fontSize: 20, fontWeight: 750, padding: '9px 15px'}}>{children}</span>
);

const Header = ({scene, eyebrow}: {scene: SceneConfig; eyebrow: string}) => (
  <>
    <div style={{color: colors.accent, fontSize: 21, fontWeight: 800, letterSpacing: 4, marginBottom: 13}}>{eyebrow}</div>
    <div style={{fontSize: 58, fontWeight: 860, letterSpacing: -2, lineHeight: 1.12}}>{scene.headline}</div>
  </>
);

const Layout = ({scene, eyebrow, children}: {scene: SceneConfig; eyebrow: string; children: ReactNode}) => {
  const frame = useCurrentFrame();
  return <SceneContainer><div style={{height: '100%', opacity: fade(frame, 0, 18)}}><Header scene={scene} eyebrow={eyebrow} />{children}</div></SceneContainer>;
};

const TerminalPanel = ({lines, duration, startFrames, activeIndex}: {lines: string[]; duration: number; startFrames?: number[]; activeIndex?: number}) => {
  const frame = useCurrentFrame();
  const revealStarts = startFrames ?? lines.map((_, index) => 22 + index * Math.max(10, (duration - 110) / Math.max(1, lines.length)));
  return <Panel style={{overflow: 'hidden'}}>
    <div style={{background: 'rgba(255,255,255,0.06)', borderBottom: `1px solid ${colors.line}`, color: colors.muted, fontSize: 20, padding: '15px 20px'}}>claude-code · project</div>
    <div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 24, lineHeight: 1.65, minHeight: 300, padding: '24px 26px'}}>{lines.map((line, index) => {
      const opacity = fade(frame, revealStarts[index] ?? 22, (revealStarts[index] ?? 22) + 16);
      return <div key={`${line}-${index}`} style={{color: activeIndex === index ? colors.text : index >= lines.length - 1 ? '#86efac' : colors.muted, opacity, transform: `translateX(${(1 - opacity) * -14}px)`}}>{line}</div>;
    })}</div>
  </Panel>;
};

const Scene01 = ({scene, cueFrames}: {scene: Extract<SceneConfig, {type: 'opening'}>; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lines = ['$ pytest', 'TypeError: validateEmail() returned undefined', '$ open src/validateEmail.ts', '- function validateEmail(input) {', '+ return isValid(input)', 'Tests passed ✓'];
  const details = scene.cardDetails ?? [];
  const lineCues = [3, 4, 4, 5, 5, 6];
  const detailCues = [3, 4, 5, 5];
  return <Layout scene={scene} eyebrow="Scene 01 · Opening"><div style={{display: 'grid', gap: 22, gridTemplateColumns: '1.15fr 0.85fr', marginTop: 38}}><TerminalPanel lines={lines} duration={scene.durationSeconds * fps} startFrames={lineCues.map((index, lineIndex) => cueStart(cueFrames, index, 140 + lineIndex * 35))} /><Panel style={{padding: 24}}><div style={{color: colors.muted, fontSize: 21, marginBottom: 18}}>项目动作轨迹</div><div style={{display: 'grid', gap: 13}}>{details.map((item, index) => {const start = cueStart(cueFrames, detailCues[index] ?? 5, 25 + index * 26); const active = frame >= start; return <div key={item.title} style={{background: active ? 'rgba(107,221,170,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? '#6bddaa' : colors.line}`, borderRadius: 14, color: active ? colors.text : colors.muted, fontSize: 23, opacity: fade(frame, start, start + 16), padding: '14px 16px'}}>{item.title}</div>;})}</div><div style={{marginTop: 20, opacity: cueReveal(frame, cueFrames, 7, 390)}}><Pill tone="#6bddaa">连续验证</Pill></div></Panel></div></Layout>;
};

const Scene02 = ({scene, cueFrames}: {scene: Extract<SceneConfig, {type: 'comparison'}>; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const columns = scene.columns ?? [scene.left, scene.right];
  return <Layout scene={scene} eyebrow="Scene 02 · Difference"><div style={{display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr', margin: '42px auto 0', maxWidth: 1400}}>{columns.map((column, columnIndex) => {const active = columnIndex === 1; return <Panel key={column.title} active={active} style={{minHeight: 370, padding: 28, textAlign: 'center'}}><div style={{color: active ? colors.accent : colors.muted, fontSize: 30, fontWeight: 850}}>{column.title}</div><div style={{color: active ? colors.accent : colors.muted, fontSize: 35, fontWeight: 800, marginTop: 55}}>{active ? '读 · 改 · 跑 · 验证' : '只返回文字'}</div><div style={{color: colors.muted, fontSize: 23, marginTop: 28}}>{active ? '目标 → 项目动作 → 结果' : '问题 → 回复'}</div>{active && <div style={{display: 'flex', gap: 10, justifyContent: 'center', marginTop: 35}}>{column.items.map((item, index) => <Pill key={item} tone={cueReveal(frame, cueFrames, 2 + Math.min(index, 3), 160 + index * 18) > 0.5 ? colors.accent : colors.muted}>{item}</Pill>)}</div>}</Panel>;})}</div><div style={{fontSize: 31, fontWeight: 850, marginTop: 34, opacity: cueReveal(frame, cueFrames, 4, 300), textAlign: 'center'}}>为什么？</div><div style={{color: colors.muted, fontSize: 23, marginTop: 18, opacity: cueReveal(frame, cueFrames, 5, 380), textAlign: 'center'}}>答案是一套固定的工作机制</div></Layout>;
};

const Scene03 = ({scene, cueFrames}: {scene: Extract<SceneConfig, {type: 'comparison'}>; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const columns = scene.columns ?? [];
  const activeIndex = columns.reduce((last, _, index) => frame >= cueStart(cueFrames, 2 + index, 90 + index * 90) ? index : last, -1);
  return (
    <Layout scene={scene} eyebrow="Scene 03 · Agent Loop">
      <div style={{display: 'grid', gap: 24, gridTemplateColumns: 'repeat(3, 1fr)', margin: '56px auto 0', maxWidth: 1350}}>
        {columns.map((column, index) => {
          const active = index <= activeIndex;
          return (
            <div key={column.title} style={{position: 'relative'}}>
              <Panel active={active} style={{padding: '32px 20px', textAlign: 'center'}}>
                <div style={{color: active ? colors.text : colors.muted, fontSize: 35, fontWeight: 850}}>{column.title}</div>
                <div style={{color: colors.muted, fontSize: 24, marginTop: 14}}>{column.items[0]}</div>
              </Panel>
              {index < columns.length - 1 ? (
                <div style={{color: colors.accent, fontSize: 38, position: 'absolute', right: -28, top: 34, opacity: cueReveal(frame, cueFrames, 2 + index, 90 + index * 90)}}>→</div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 38, margin: '48px auto 0', opacity: cueReveal(frame, cueFrames, 8, 330), textAlign: 'center'}}>↺　结果不对？再来一圈</div>
      <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, opacity: cueReveal(frame, cueFrames, 9, 500)}}><Pill>agentic loop</Pill><Pill tone={colors.muted}>循环轮数由任务复杂度决定</Pill></div>
    </Layout>
  );
};

const Scene04 = ({scene, cueFrames}: {scene: StepListSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const eventCues = [1, 1, 2, 3, 3, 4];
  const activeIndex = scene.steps.reduce((last, _, index) => frame >= cueStart(cueFrames, eventCues[index], 24 + index * 80) ? index : last, -1);
  return (
    <Layout scene={scene} eyebrow="Scene 04 · Workflow">
      <div style={{display: 'grid', gap: 10, gridTemplateColumns: 'repeat(6, 1fr)', margin: '66px auto 0', maxWidth: 1500}}>
        {scene.steps.map((step, index) => {
          const start = cueStart(cueFrames, eventCues[index], 24 + index * 80);
          const opacity = fade(frame, start, start + 16);
          const active = index <= activeIndex;
          const scale = active && index === activeIndex ? 1.04 : 1;
          const label = index === 0 || index === 1 || index === 5 ? '执行' : index === 2 ? '搜索' : '文件';
          return (
            <Panel key={step} active={active} style={{minHeight: 130, opacity, padding: '18px 8px', textAlign: 'center', transform: `scale(${scale})`}}>
              <div style={{color: colors.accent, fontSize: 18, fontWeight: 800, marginBottom: 16}}>{label}</div>
              <div style={{color: active ? colors.text : colors.muted, fontSize: 23, fontWeight: 750}}>{step}</div>
            </Panel>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 42, opacity: cueReveal(frame, cueFrames, 5, 300)}}><Pill>模型：想</Pill><Pill tone="#6bddaa">工具：做 / 看</Pill></div>
    </Layout>
  );
};

const Scene05 = ({scene, cueFrames}: {scene: TerminalSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progressStart = cueStart(cueFrames, 1, 105);
  const stopFrame = cueEnd(cueFrames, 2, Math.round(scene.durationSeconds * fps * 0.78));
  const cancelFrame = cueEnd(cueFrames, 2, stopFrame + 18);
  const progress = interpolate(frame, [progressStart, stopFrame], [16, 70], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const count = Math.min(5, Math.max(1, Math.floor(interpolate(frame, [progressStart, stopFrame], [1, 5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))));
  return <Layout scene={scene} eyebrow="Scene 05 · Interrupt"><Panel style={{margin: '54px auto 0', maxWidth: 1050, padding: 42, textAlign: 'center'}}><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 31}}>正在修改 {count} 个文件…</div><div style={{background: '#263553', borderRadius: 999, height: 18, marginTop: 30, overflow: 'hidden'}}><div style={{background: frame >= stopFrame ? '#ff7f8c' : 'linear-gradient(90deg,#8ea9ff,#6bddaa)', height: '100%', width: `${progress}%`}} /></div><div style={{marginTop: 28, opacity: cueReveal(frame, cueFrames, 2, stopFrame - 12)}}><Pill tone="#ff7f8c">Esc</Pill></div><div style={{color: '#ff7f8c', fontSize: 27, marginTop: 20, opacity: fade(frame, cancelFrame, cancelFrame + 16)}}>Tool call cancelled</div></Panel></Layout>;
};

const Scene06 = ({scene, cueFrames}: {scene: TerminalSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const queuedFrame = cueStart(cueFrames, 1, Math.round(scene.durationSeconds * fps * 0.35));
  const operationFrame = cueStart(cueFrames, 2, 16);
  const doneFrame = cueStart(cueFrames, 3, Math.round(scene.durationSeconds * fps * 0.73));
  const width = interpolate(frame, [operationFrame, doneFrame], [20, 88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <Layout scene={scene} eyebrow="Scene 06 · Queued Instruction"><Panel style={{margin: '50px auto 0', maxWidth: 1120, padding: 34}}><div style={{color: colors.muted, fontSize: 23}}>当前操作继续中</div><div style={{background: '#263553', borderRadius: 999, height: 18, marginTop: 14, overflow: 'hidden'}}><div style={{background: 'linear-gradient(90deg,#8ea9ff,#6bddaa)', height: '100%', width: `${width}%`}} /></div><div style={{border: `1px dashed ${queuedFrame <= frame && frame < doneFrame ? '#f2ca76' : '#6bddaa'}`, borderRadius: 15, color: queuedFrame <= frame && frame < doneFrame ? '#f2ca76' : '#6bddaa', fontSize: 26, marginTop: 25, padding: '17px 20px'}}>{frame >= doneFrame ? '已读取：只改 validateEmail' : '待读取：只改 validateEmail'}</div></Panel><div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 38}}><span style={{opacity: cueReveal(frame, cueFrames, 4, 300)}}><Pill>迭代</Pill></span><span style={{opacity: cueReveal(frame, cueFrames, 5, 330)}}><Pill>观察</Pill></span><span style={{opacity: cueReveal(frame, cueFrames, 6, 360)}}><Pill tone="#6bddaa">纠正</Pill></span><span style={{opacity: cueReveal(frame, cueFrames, 7, 390)}}><Pill tone={colors.muted}>一次性完美提示 ✕</Pill></span></div></Layout>;
};

const Scene07 = ({scene, cueFrames}: {scene: StepListSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const descriptions = ['读 · 改 · 新建', '找文件 · 找内容', '命令 · 测试 · git', '网页 · 文档 · 报错', '定义 · 引用 · 需插件'];
  const eventCues = [4, 5, 6, 7, 8];
  return <Layout scene={scene} eyebrow="Scene 07 · Tools"><div style={{background: 'rgba(16,26,45,0.96)', border: `1px solid ${colors.line}`, borderRadius: 24, display: 'grid', gap: 14, gridTemplateColumns: 'repeat(3, 1fr)', margin: '42px auto 0', maxWidth: 1200, padding: 24}}>{scene.steps.map((step, index) => {const opacity = cueReveal(frame, cueFrames, eventCues[index], 24 + index * 80); return <Panel key={step} style={{minHeight: 120, opacity, padding: 18, transform: `translateY(${(1 - opacity) * 20}px)`}}><div style={{color: index === 4 ? '#f2ca76' : colors.text, fontSize: 25, fontWeight: 820}}>{step}</div><div style={{color: colors.muted, fontSize: 19, marginTop: 13}}>{descriptions[index]}</div></Panel>;})}</div><div style={{color: colors.muted, fontSize: 23, marginTop: 28, opacity: cueReveal(frame, cueFrames, 1, 120), textAlign: 'center'}}>没有工具，只能回文字；有工具，才能真正动手</div></Layout>;
};

const Scene08 = ({scene, cueFrames}: {scene: TerminalSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const lineCues = [2, 3, 3, 4, 4, 5];
  const lineStarts = lineCues.map((index, lineIndex) => cueStart(cueFrames, index, 24 + lineIndex * 70));
  const activeIndex = lineStarts.reduce((last, start, index) => frame >= start ? index : last, -1);
  const categories = ['执行', '执行', '搜索', '文件', '文件', '执行'];
  return <Layout scene={scene} eyebrow="Scene 08 · Tool Selection"><div style={{display: 'grid', gap: 22, gridTemplateColumns: '1fr 260px', marginTop: 44}}><TerminalPanel lines={scene.output} duration={scene.durationSeconds * 30} startFrames={lineStarts} activeIndex={activeIndex} /><Panel active style={{padding: 26}}><div style={{color: colors.muted, fontSize: 21}}>当前工具类别</div><div style={{color: colors.accent, fontSize: 34, fontWeight: 850, marginTop: 34}}>{categories[Math.max(0, activeIndex)]}</div><div style={{color: '#6bddaa', fontSize: 24, marginTop: 24, opacity: cueReveal(frame, cueFrames, 9, 470)}}>验证完成 ✓</div></Panel></div></Layout>;
};

const Scene09 = ({scene, cueFrames}: {scene: Extract<SceneConfig, {type: 'comparison'}>; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const column = scene.columns?.[0] ?? scene.left!;
  const itemCues = [3, 4, 4, 5, 5];
  return <Layout scene={scene} eyebrow="Scene 09 · Workspace Scope"><Panel style={{margin: '42px auto 0', maxWidth: 1250, padding: 30, textAlign: 'center'}}><div style={{fontSize: 30, fontWeight: 850}}>当前工作目录</div><div style={{display: 'grid', gap: 12, gridTemplateColumns: 'repeat(5, 1fr)', marginTop: 25}}>{column.items.map((item, index) => <div key={item} style={{background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.line}`, borderRadius: 13, color: colors.text, fontSize: 21, opacity: cueReveal(frame, cueFrames, itemCues[index], 25 + index * 14), padding: '18px 8px'}}>{item}</div>)}</div><div style={{border: `1px dashed #5c4967`, borderRadius: 13, color: colors.muted, fontSize: 22, margin: '26px auto 0', maxWidth: 720, opacity: cueReveal(frame, cueFrames, 7, 100), padding: 14}}>硬盘其他位置　·　需要权限　·　不是整个硬盘</div></Panel><div style={{color: colors.accent, fontSize: 27, marginTop: 26, opacity: cueReveal(frame, cueFrames, 8, 400), textAlign: 'center'}}>能跨文件协调，不等于无边界读取</div></Layout>;
};

const Scene10 = ({scene, cueFrames}: {scene: Extract<SceneConfig, {type: 'comparison'}>; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const labels = ['Permission mode', 'Plan Mode', 'Checkpoint', '外部副作用'];
  const descriptions = ['会话自主权', '先读、先搜、先计划', '恢复本地编辑', '不会自动回滚'];
  const labelCues = [5, 6, 1, 3];
  return <Layout scene={scene} eyebrow="Scene 10 · Safety Layers"><div style={{display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, 1fr)', margin: '48px auto 0', maxWidth: 1400}}>{labels.map((label, index) => <Panel key={label} active={index === 1 || index === 2} style={{minHeight: 150, opacity: cueReveal(frame, cueFrames, labelCues[index], 25 + index * 22), padding: 22, textAlign: 'center'}}><div style={{color: index === 1 ? '#f2ca76' : index === 2 ? '#6bddaa' : index === 3 ? '#ff7f8c' : colors.accent, fontSize: 23, fontWeight: 820}}>{label}</div><div style={{color: colors.muted, fontSize: 19, marginTop: 14}}>{descriptions[index]}</div></Panel>)}</div><div style={{display: 'flex', gap: 14, justifyContent: 'center', marginTop: 38}}><span style={{opacity: cueReveal(frame, cueFrames, 8, 500)}}><Pill tone="#f2ca76">批准</Pill></span><span style={{opacity: cueReveal(frame, cueFrames, 9, 550)}}><Pill>执行</Pill></span><span style={{opacity: cueReveal(frame, cueFrames, 9, 600)}}><Pill tone="#6bddaa">存档</Pill></span></div></Layout>;
};

const Scene11 = ({scene, cueFrames}: {scene: TerminalSceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const lines = [scene.command, ...scene.output];
  const lineCues = [0, 1, 1, 3, 4, 5, 6];
  return <Layout scene={scene} eyebrow="Scene 11 · Plan Mode Demo"><Panel style={{margin: '42px auto 0', maxWidth: 1120, overflow: 'hidden'}}><div style={{background: 'rgba(255,255,255,0.06)', borderBottom: `1px solid ${colors.line}`, color: colors.accent, fontSize: 22, padding: '16px 22px'}}>Plan Mode · cc-demo</div><div style={{fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 25, lineHeight: 1.7, minHeight: 360, padding: '26px 30px'}}>{lines.map((line, index) => {const opacity = cueReveal(frame, cueFrames, lineCues[index], 24 + index * 70); return <div key={`${line}-${index}`} style={{color: index >= 2 ? colors.accent : colors.text, opacity}}>{line}</div>;})}</div></Panel><div style={{color: '#f2ca76', fontSize: 27, marginTop: 24, opacity: cueReveal(frame, cueFrames, 6, 430), textAlign: 'center'}}>文件区保持空白，直到你批准</div></Layout>;
};

const Scene12 = ({scene, cueFrames}: {scene: SummarySceneConfig; cueFrames: SceneCueFrames[]}) => {
  const frame = useCurrentFrame();
  const cardCues = [1, 2, 3, 4];
  const teaserStart = cueStart(cueFrames, 10, Math.round(scene.durationSeconds * 30 * 0.78));
  return <Layout scene={scene} eyebrow="Scene 12 · Closing"><div style={{display: 'flex', gap: 12, justifyContent: 'center', margin: '46px auto 0', maxWidth: 1400}}>{['Tests passed ✓', '改成减法', 'Tests failed', '回到“想”'].map((item, index) => <div key={item} style={{alignItems: 'center', display: 'flex', gap: 12, opacity: cueReveal(frame, cueFrames, cardCues[index], 20 + index * 25)}}><Panel active={index === 3} style={{color: index === 0 ? '#6bddaa' : index === 2 ? '#ff7f8c' : colors.text, fontSize: 25, fontWeight: 800, padding: '18px 20px', whiteSpace: 'nowrap'}}>{item}</Panel>{index < 3 && <span style={{color: colors.accent, fontSize: 30}}>{index === 2 ? '↺' : '→'}</span>}</div>)}</div>{scene.teaser && <Panel active style={{margin: '62px auto 0', maxWidth: 930, opacity: fade(frame, teaserStart, teaserStart + 22), padding: '24px 34px', textAlign: 'center'}}><div style={{color: colors.accent, fontSize: 34, fontWeight: 860}}>{scene.teaser.title}</div><div style={{color: colors.text, fontSize: 23, marginTop: 12}}>{scene.teaser.description}</div></Panel>}</Layout>;
};

export const HowItWorksScene = ({scene, cueFrames}: Props) => {
  switch (scene.id) {
    case 'scene-01-continuous-fix': return <Scene01 scene={scene as Extract<SceneConfig, {type: 'opening'}>} cueFrames={cueFrames} />;
    case 'scene-02-chat-vs-project': return <Scene02 scene={scene as Extract<SceneConfig, {type: 'comparison'}>} cueFrames={cueFrames} />;
    case 'scene-03-agent-loop': return <Scene03 scene={scene as Extract<SceneConfig, {type: 'comparison'}>} cueFrames={cueFrames} />;
    case 'scene-04-repair-workflow': return <Scene04 scene={scene as StepListSceneConfig} cueFrames={cueFrames} />;
    case 'scene-05-esc-stop': return <Scene05 scene={scene as TerminalSceneConfig} cueFrames={cueFrames} />;
    case 'scene-06-queued-instruction': return <Scene06 scene={scene as TerminalSceneConfig} cueFrames={cueFrames} />;
    case 'scene-07-toolbox': return <Scene07 scene={scene as StepListSceneConfig} cueFrames={cueFrames} />;
    case 'scene-08-tool-selection': return <Scene08 scene={scene as TerminalSceneConfig} cueFrames={cueFrames} />;
    case 'scene-09-workspace-scope': return <Scene09 scene={scene as Extract<SceneConfig, {type: 'comparison'}>} cueFrames={cueFrames} />;
    case 'scene-10-safety-gates': return <Scene10 scene={scene as Extract<SceneConfig, {type: 'comparison'}>} cueFrames={cueFrames} />;
    case 'scene-11-plan-mode-demo': return <Scene11 scene={scene as TerminalSceneConfig} cueFrames={cueFrames} />;
    case 'scene-12-loop-recap': return <Scene12 scene={scene as SummarySceneConfig} cueFrames={cueFrames} />;
    default: return null;
  }
};
