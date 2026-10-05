import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ArrivalPulse, MotionCamera, MotionWindow, PathMotion, PathReveal, ProgressRing,
  ShapeMorph, SpringAssembly, SpringTransform, SvgFocusTransfer, SvgStateChange} from '../components/ContinuousMotion';
import {MotionTransition, transitionDuration} from '../components/MotionTransition';
import {motionProgress, pathPoint, springProgress} from '../lib/motion';

// Generic capability fixture; its text and estimated timeline are documented in MOTION-COMPONENTS.md.
const accent = '#39d7c2';
const incoming = 'M340 480 C470 260 800 260 960 480';
const outgoing = 'M960 480 C1440 240 2100 240 2580 480';
const square = 'M-52 -82 H52 Q82 -82 82 -52 V52 Q82 82 52 82 H-52 Q-82 82 -82 52 V-52 Q-82 -82 -52 -82 Z';
const wide = 'M-222 -115 H222 Q252 -115 252 -85 V85 Q252 115 222 115 H-222 Q-252 115 -252 85 V-85 Q-252 -115 -222 -115 Z';
export const motionDemoDuration = 1200;

export const MotionCapabilityDemo = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = (start: number, duration: number) => motionProgress(frame, {startFrame: start * fps, durationFrames: duration * fps});
  const task = frame < 32 * fps ? pathPoint(incoming, p(2.5, 3.5)) : pathPoint(outgoing, p(32, 4.9));
  const merge = p(13.4, 1.4);
  const spread = springProgress(frame, fps, {startFrame: 8.6 * fps, durationFrames: 1.8 * fps}) * (1 - merge);
  const inspection = p(24.3, 1.3) * (1 - p(29.4, 1.5));
  const zoom = p(24.4, 1.5) * (1 - p(29.2, 1.8));
  const overview = p(8.2, 1.5) * (1 - p(14, 1.6));
  const opening = p(1.2, 1.1);
  const emphasis = p(21.2, 0.4) * (1 - p(23.1, 0.5));
  const window = (start: number, end: number, children: ReactNode) => (
    <MotionWindow startFrame={start * fps} endFrame={end * fps}>{children}</MotionWindow>
  );
  const doneGlyph = <path d="M-35 0L-8 28L40-28" fill="none" stroke="#b6ffe2" strokeWidth={9}
    strokeLinecap="round" strokeLinejoin="round" />;
  const taskGlyph = <path d="M-30-27H30 M-30 0H30 M-30 27H10" fill="none" stroke={accent}
    strokeWidth={6} strokeLinecap="round" />;

  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, #10303a, #071017 65%)'}}>
    <svg viewBox="0 0 1920 1080" style={{width: '100%', height: '100%', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <defs><pattern id="motion-demo-grid" width={60} height={60} patternUnits="userSpaceOnUse">
        <path d="M60 0H0V60" fill="none" stroke="#36525b" strokeOpacity={0.16} />
      </pattern></defs>
      <MotionCamera pose={{x: 960 + (task.x - 960) * 0.87, y: 480, scale: 1 - 0.12 * overview + 0.8 * zoom}}>
        <rect x={-1600} y={-600} width={6500} height={2400} fill="url(#motion-demo-grid)" />
        <g opacity={p(1.5, 0.8)}>
          <path d="M100 780H3000 M100 820H3000" stroke="#29444e" strokeWidth={2} />
          {window(1.5, 8, <g opacity={1 - p(7.2, 0.8)}>
            <circle cx={340} cy={480} r={95} fill="#0d2530" stroke="#466772" strokeWidth={2} />
            <text x={340} y={650} fill="#9bb0bd" textAnchor="middle" fontSize={30}>输入</text>
          </g>)}
          <g opacity={1 - 0.65 * p(30.5, 2)}>
            <circle cx={960} cy={480} r={122} fill="none" stroke={accent} strokeWidth={2} strokeDasharray="4 12" />
            <text x={960} y={670} fill="#9bb0bd" textAnchor="middle" fontSize={30}>处理端</text>
          </g>
          {window(2.4, 8, <g opacity={1 - p(7.2, 0.8)}>
            <PathReveal d={incoming} startFrame={2.5 * fps} durationFrames={3.5 * fps} color={accent} />
          </g>)}
        </g>
        {window(32, 40, <g opacity={p(32, 0.5)}>
          <path d={outgoing} fill="none" stroke="#294c52" strokeWidth={4} />
          <PathReveal d={outgoing} startFrame={32 * fps} durationFrames={4.9 * fps} color={accent} />
          <circle cx={2580} cy={480} r={145} fill="#0c292b" fillOpacity={0.6} stroke="#4f8f7b" strokeWidth={2} strokeDasharray="8 12" />
          {window(32, 37.5, <text x={2580} y={700} textAnchor="middle" fontSize={30} fill="#9bb0bd" opacity={1 - p(37, 0.5)}>交付端</text>)}
        </g>)}
        <g transform="translate(960 480)"><ArrivalPulse startFrame={6 * fps} durationFrames={1.4 * fps} radius={100} color={accent} /></g>
        {window(9.1, 14.8, <g opacity={p(9.1, 0.7) * (1 - merge)} fill="none" stroke={accent} strokeWidth={3}>
          {[[-380, 80], [0, -240], [380, 80]].map(([dx, dy], i) => <path key={i}
            d={`M960 480 Q${960 + dx * spread / 2} ${480 + dy * spread} ${960 + dx * spread} ${480 + dy * spread}`} />)}
        </g>)}
        {window(9.3, 14.6, <g opacity={p(9.3, 0.4) * (1 - p(14.1, 0.5))}>
          <SpringAssembly origin={{x: 960, y: 480}}
            expand={{startFrame: 8.6 * fps, durationFrames: 1.8 * fps}}
            merge={{startFrame: 13.4 * fps, durationFrames: 1.4 * fps}} staggerFrames={0.14 * fps}
            items={[[-380, 80], [0, -240], [380, 80]].map(([x, y], i) => ({id: String(i), offset: {x, y}, children: <>
              <rect x={-78} y={-58} width={156} height={116} rx={22} fill="#112d38" stroke={['#6bbed4', '#a79aff', accent][i]} strokeWidth={3} />
              <path d={['M-28-18H28 M-28 0H14 M-28 18H22', 'M-26 0H26 M0-26V26', 'M-25 0L-7 18L28-19'][i]}
                fill="none" stroke={['#6bbed4', '#a79aff', accent][i]} strokeWidth={5} strokeLinecap="round" />
              <text y={106} textAnchor="middle" fontSize={30} fill="#c3e7ef" opacity={1 - p(13.3, 0.4)}>{['输入', '处理', '输出'][i]}</text>
            </>}))} />
        </g>)}
        {window(1.6, 40, <PathMotion d={frame < 32 * fps ? incoming : outgoing}
          startFrame={(frame < 32 * fps ? 2.5 : 32) * fps} durationFrames={(frame < 32 * fps ? 3.5 : 4.9) * fps}>
          <g opacity={p(1.6, 0.7)} transform={`scale(${1 - 0.42 * Math.max(0, Math.min(1, spread))})`}>
            <ShapeMorph from={frame >= 29.4 * fps ? wide : square}
              to={frame >= 29.4 * fps ? square : wide}
              startFrame={(frame >= 29.4 * fps ? 29.4 : 24.3) * fps} durationFrames={1.5 * fps}
              fill={frame >= 21 * fps ? '#123f38' : '#112d38'} stroke={accent} />
            <g opacity={(1 - Math.max(0, Math.min(1, spread))) * (1 - inspection)}>
              <SvgStateChange before={taskGlyph} after={doneGlyph} startFrame={21 * fps} durationFrames={0.8 * fps} />
            </g>
            {window(16, 21.8, <g opacity={p(16, 0.6) * (1 - p(21, 0.8))}>
              <ProgressRing startFrame={16.7 * fps} durationFrames={4.1 * fps} radius={108} color={accent} />
            </g>)}
            <text y={155} textAnchor="middle" fontSize={30} fill="#f4f9fb"
              opacity={(1 - Math.max(0, Math.min(1, spread))) * (1 - emphasis) * (1 - zoom) * (1 - p(37, 0.5))}>
              {frame >= 21 * fps ? '完成' : frame >= 16 * fps ? `处理中 ${Math.round(p(16.7, 4.1) * 100)}%` : '任务'}
            </text>
          </g>
        </PathMotion>)}
        {window(25, 29.9, <g opacity={p(25, 0.7) * (1 - p(29.4, 0.5))}>
          <path d="M840 480H930 M990 480H1080" stroke="#526970" strokeWidth={3} />
          {[810, 960, 1110].map((x, i) => <g key={x}>
            <circle cx={x} cy={480} r={22} fill={['#6bbed4', '#a79aff', accent][i]} />
            <text x={x} y={540} fontSize={23} textAnchor="middle" fill="#c3e7ef">{['输入', '处理', '输出'][i]}</text>
          </g>)}
          <SvgFocusTransfer from={{x: frame >= 28.1 * fps ? 960 : 810, y: 480}}
            to={{x: frame >= 28.1 * fps ? 1110 : 960, y: 480}}
            startFrame={(frame >= 28.1 * fps ? 28.1 : 26.5) * fps} durationFrames={0.65 * fps} color="#f4f9fb" />
        </g>)}
        {window(21.2, 23.6, <g opacity={emphasis}>
          <SpringTransform from={{x: 70, y: 0, scale: 1}} to={{x: 0, y: 0, scale: 1}} startFrame={21.2 * fps} durationFrames={0.65 * fps}>
            <path d="M1080 480H1140" stroke={accent} strokeWidth={3} />
            <text x={1180} y={499} fontSize={58} fontWeight={750} fill="#b6ffe2">处理完成</text>
          </SpringTransform>
        </g>)}
        <g transform="translate(2580 480)"><ArrivalPulse startFrame={36.9 * fps} durationFrames={1.4 * fps} radius={120} color={accent} /></g>
        {window(37, 40, <g opacity={p(37, 0.7)}>
          <SpringTransform from={{x: 0, y: 26, scale: 1}} to={{x: 0, y: 0, scale: 1}} startFrame={37 * fps} durationFrames={0.8 * fps}>
            <text x={2580} y={705} textAnchor="middle" fontSize={52} fontWeight={750} fill="#b6ffe2">任务已交付</text>
          </SpringTransform>
          <path d="M2770 440L2790 460L2830 420" fill="none" stroke="#b6ffe2" strokeWidth={7} strokeLinecap="round" />
          <text x={2800} y={515} textAnchor="middle" fontSize={30} fill="#b6ffe2">已就绪</text>
        </g>)}
      </MotionCamera>
      {window(0, 2.2, <g opacity={1 - p(1.6, 0.6)} transform={`translate(${960 - 620 * opening} ${470 + 155 * opening}) scale(${1 - 0.6 * opening})`}>
        <text textAnchor="middle" fontSize={84} fontWeight={800} letterSpacing={4} fill="#f4f9fb">一个任务的旅程</text>
      </g>)}
    </svg>
  </AbsoluteFill>;
};

const TransitionView = ({detail}: {detail: boolean}) => <AbsoluteFill style={{background: '#071017', alignItems: 'center', justifyContent: 'center'}}>
  <svg viewBox="0 0 1920 1080" style={{width: '100%', height: '100%'}}>
    <g transform={detail ? 'translate(960 480) scale(1.8)' : 'translate(960 480)'}>
      <rect x={-120} y={-100} width={240} height={200} rx={30} fill="#123f38" stroke={accent} strokeWidth={4} />
      {detail ? <g>{[-65, 0, 65].map(x => <circle key={x} cx={x} r={12} fill={accent} />)}</g>
        : <path d="M-35 0L-8 28L40-28" fill="none" stroke="#b6ffe2" strokeWidth={9} />}
    </g>
  </svg>
</AbsoluteFill>;

export const motionTransitionDemoDuration = transitionDuration(120, 120, 30);
export const MotionTransitionDemo = () => <MotionTransition before={<TransitionView detail={false} />}
  after={<TransitionView detail />} beforeFrames={120} afterFrames={120} overlapFrames={30}
  presentation="wipe" timing="spring" />;
