import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {CSSProperties, ReactNode} from 'react';
import {SeriesCover} from '../../components/SeriesCover';
import {TimedCaption} from '../../components/TimedCaption';
import {getContentStartFrame, getSceneStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import {codexBackground, codexGridBackground, codexPalette} from '../../styles/codex';
import {videoConfig} from './video.config';
import subtitleManifest from './generated/subtitle-manifest.json';
import timelineManifest from './generated/timeline-manifest.json';

const colors = codexPalette;
const font = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif';
const mono = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';

type Style = CSSProperties;

const panelStyle: Style = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)',
};

const fade = (frame: number, start: number, length = 18) => interpolateValue(frame, start, start + length, 0, 1);
const slide = (frame: number, start: number, distance = 18) => interpolateValue(frame, start, start + 18, distance, 0);
const interpolateValue = (frame: number, inputStart: number, inputEnd: number, outputStart: number, outputEnd: number) => {
  if (frame <= inputStart) return outputStart;
  if (frame >= inputEnd) return outputEnd;
  return outputStart + ((frame - inputStart) / Math.max(1, inputEnd - inputStart)) * (outputEnd - outputStart);
};
const seconds = (value: number) => secondsToFrames(value, videoConfig.fps);

const sceneCueFrames = Object.fromEntries(subtitleManifest.scenes.map((scene) => {
  const timing = timelineManifest.scenes.find((item) => item.sceneId === scene.sceneId);
  const frames = timing
    ? scene.segments.flatMap((segment) => {
      const segmentTiming = timing.segments.find((item) => item.segmentId === segment.segmentId);
      return segmentTiming ? segment.cues.map((cue) => secondsToFrames(segmentTiming.offset + cue.start, videoConfig.fps)) : [];
    })
    : [];
  return [scene.sceneId, frames];
})) as Record<string, number[]>;

const sceneSegmentFrames = Object.fromEntries(timelineManifest.scenes.map((scene) => [
  scene.sceneId,
  scene.segments.map((segment) => secondsToFrames(segment.offset, videoConfig.fps)),
])) as Record<string, number[]>;

const revealFrame = (sceneId: string, cueIndex: number, fallback: number) => sceneCueFrames[sceneId]?.[cueIndex] ?? fallback;
const segmentFrame = (sceneId: string, segmentIndex: number, fallback: number) => sceneSegmentFrames[sceneId]?.[segmentIndex] ?? fallback;

const Panel = ({children, style}: {children: ReactNode; style?: Style}) => (
  <div style={{...panelStyle, ...style}}>{children}</div>
);

const Pill = ({children, tone = colors.accent, style}: {children: ReactNode; tone?: string; style?: Style}) => (
  <div style={{alignItems: 'center', background: 'rgba(255,255,255,.035)', border: `1px solid ${tone}66`, borderRadius: 999, color: tone, display: 'inline-flex', fontFamily: font, fontSize: 19, gap: 9, padding: '8px 13px', ...style}}>
    <span style={{background: tone, borderRadius: 99, boxShadow: `0 0 13px ${tone}`, display: 'inline-block', height: 8, width: 8}} />
    {children}
  </div>
);

const Arrow = ({tone = colors.accent, direction = '→'}: {tone?: string; direction?: string}) => (
  <div style={{color: tone, fontFamily: mono, fontSize: 34, fontWeight: 700, textAlign: 'center'}}>{direction}</div>
);

const Step = ({index, children, tone = colors.accent, active = true, style}: {index: string; children: ReactNode; tone?: string; active?: boolean; style?: Style}) => (
  <div style={{alignItems: 'center', background: 'rgba(255,255,255,.025)', border: `1px solid ${active ? `${tone}66` : colors.line}`, borderRadius: 12, color: colors.text, display: 'flex', fontSize: 24, gap: 13, minHeight: 58, padding: '10px 14px', ...style}}>
    <span style={{alignItems: 'center', background: `${tone}20`, borderRadius: 9, color: tone, display: 'inline-flex', fontFamily: mono, fontSize: 18, fontWeight: 800, height: 30, justifyContent: 'center', width: 30}}>{index}</span>
    {children}
  </div>
);

const SceneFrame = ({number, label, title, lede, children}: {number: string; label: string; title: string; lede: string; children: ReactNode}) => (
  <AbsoluteFill style={{background: codexBackground, color: colors.text, fontFamily: font, overflow: 'hidden'}}>
    <div style={{backgroundImage: codexGridBackground, backgroundSize: '42px 42px', inset: 0, opacity: .22, position: 'absolute'}} />
    <div style={{bottom: 185, left: 92, position: 'absolute', right: 92, top: 82}}>
      <div style={{color: colors.accent, fontSize: 20, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase'}}>{`SCENE ${number} · ${label}`}</div>
      <h1 style={{fontSize: 56, letterSpacing: -2.5, lineHeight: 1.08, margin: '12px 0 7px', maxWidth: 1320}}>{title}</h1>
      <div style={{color: colors.muted, fontSize: 23, lineHeight: 1.45}}>{lede}</div>
      <div style={{bottom: 0, left: 0, position: 'absolute', right: 0, top: 172}}>{children}</div>
    </div>
  </AbsoluteFill>
);

const ContextBlocks = ({large, frame, starts}: {large: boolean; frame: number; starts: number[]}) => {
  const blocks = large ? ['项目文件', '历史会话', '规则', '更多工作'] : ['短文件', '短会话'];
  return <div style={{display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)', marginTop: 14}}>{blocks.map((block, index) => {
    const start = starts[index] ?? starts[starts.length - 1] ?? 0;
    return <div key={block} style={{background: large ? 'rgba(242,184,91,.12)' : 'rgba(57,215,194,.11)', border: `1px solid ${large ? `${colors.warning}55` : `${colors.accent}55`}`, borderRadius: 8, color: large ? colors.warning : colors.accent, fontFamily: mono, fontSize: 17, opacity: fade(frame, start), padding: '10px 8px', transform: `translateY(${slide(frame, start, 10)}px)`}}>{block}</div>;
  })}</div>;
};

const Scene01 = () => {
  const frame = useCurrentFrame();
  const entryStart = revealFrame('01', 0, 0);
  const leftContextStarts = [revealFrame('01', 2, seconds(4.2)), revealFrame('01', 2, seconds(4.2)) + seconds(.45)];
  const rightContextStarts = [revealFrame('01', 5, seconds(8)), revealFrame('01', 7, seconds(10.4)), revealFrame('01', 8, seconds(11.8)), revealFrame('01', 8, seconds(11.8) + seconds(.45))];
  const barStart = revealFrame('01', 9, seconds(17.5));
  const conclusionStart = revealFrame('01', 10, seconds(19.3));
  return <SceneFrame number="01" label="Opening" title="同样一条消息，为什么消耗不同？" lede="消息条数相同，真正进入处理的上下文可能完全不同。">
    <div style={{display: 'grid', gap: 28, gridTemplateColumns: '1fr 1fr', height: 'calc(100% - 80px)'}}>
      {[{tone: colors.accent, title: '小脚本', details: '少量上下文', large: false, contextStarts: leftContextStarts, fill: '28%'}, {tone: colors.warning, title: '大型项目＋长会话＋规则', details: '更多上下文', large: true, contextStarts: rightContextStarts, fill: '78%'}].map((path) => <Panel key={path.title} style={{borderColor: `${path.tone}66`, opacity: fade(frame, entryStart), padding: 26, transform: `translateY(${slide(frame, entryStart)}px)`}}>
        <div style={{display: 'grid', gap: 18, height: '100%', gridTemplateRows: 'auto auto 1fr auto auto'}}>
          <Pill tone={path.tone}>同一条消息</Pill>
          <Step index="1" tone={path.tone}>消息入口 <span style={{color: colors.muted, fontSize: 18}}>相同</span></Step>
          <div style={{alignSelf: 'center', ...panelStyle, borderColor: `${path.tone}55`, padding: 22}}><div style={{color: colors.muted, fontSize: 18, letterSpacing: 1}}>{path.title}</div><div style={{color: path.tone, fontSize: 34, fontWeight: 800, marginTop: 12}}>{path.details}</div><ContextBlocks large={path.large} frame={frame} starts={path.contextStarts} /></div>
          <div style={{color: path.tone, fontFamily: mono, fontSize: 17, opacity: fade(frame, barStart)}}>实际用量 · {path.large ? '更快消耗' : '少量处理'}</div>
          <div style={{background: '#263946', borderRadius: 99, height: 10, overflow: 'hidden'}}><div style={{background: path.tone, height: '100%', transform: `scaleX(${interpolateValue(frame, barStart, barStart + seconds(path.large ? 1.2 : 1.8), 0, 1)})`, transformOrigin: 'left', width: path.fill}} /></div>
        </div>
      </Panel>)}
    </div>
    <div style={{bottom: 0, color: colors.text, fontSize: 28, fontWeight: 800, left: 0, opacity: fade(frame, conclusionStart), position: 'absolute', right: 0, textAlign: 'center'}}>消息条数 ≠ 实际用量</div>
  </SceneFrame>;
};

const Scene02 = () => {
  const frame = useCurrentFrame();
  const starts = [revealFrame('02', 0, seconds(.5)), revealFrame('02', 3, seconds(2)), revealFrame('02', 4, seconds(4))];
  const contextStarts = [revealFrame('02', 7, starts[2] + seconds(1)), revealFrame('02', 7, starts[2] + seconds(1.4)) + seconds(.35), revealFrame('02', 7, starts[2] + seconds(1.8)) + seconds(.7)];
  return <SceneFrame number="02" label="Layers" title="工具、模型与 token 不是一回事" lede="从入口到处理，再到计量，三层关系要分开看。">
    <div style={{alignItems: 'stretch', display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr 1.18fr', height: '100%'}}>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', opacity: fade(frame, starts[0]), padding: 28, transform: `translateY(${slide(frame, starts[0])}px)`}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>入口层</div><div style={{...panelStyle, padding: 24}}><div style={{color: colors.accent, fontSize: 34, fontWeight: 800}}>工具入口</div><div style={{color: colors.muted, fontSize: 20, marginTop: 8}}>Codex</div></div><Arrow /><Pill>发起任务</Pill></Panel>
      <Panel style={{borderColor: `${colors.accent}66`, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', opacity: fade(frame, starts[1]), padding: 28, transform: `translateY(${slide(frame, starts[1])}px)`}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>处理层</div><div style={{...panelStyle, padding: 24}}><div style={{fontSize: 34, fontWeight: 800}}>模型处理</div><div style={{color: colors.muted, fontSize: 20, marginTop: 8}}>理解请求与上下文</div></div><Arrow /><Pill>生成结果</Pill></Panel>
      <Panel style={{borderColor: `${colors.web}66`, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center', opacity: fade(frame, starts[2]), padding: 28, transform: `translateY(${slide(frame, starts[2])}px)`}}><div style={{color: colors.web, fontFamily: mono, fontSize: 17}}>计量层</div><div style={{...panelStyle, display: 'grid', gap: 10, padding: 20}}>{['输入 token', '输出 token', '上下文'].map((item, index) => <div key={item} style={{background: `${colors.web}12`, border: `1px solid ${colors.web}55`, borderRadius: 9, color: colors.text, fontSize: 27, fontWeight: 750, opacity: fade(frame, starts[2] + index * 15), padding: '12px 15px'}}>{item}</div>)}</div><div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>{['长文件', '历史会话', '规则'].map((item, index) => <Pill key={item} tone={colors.web} style={{fontSize: 16, opacity: fade(frame, contextStarts[index])}}>{item}</Pill>)}</div></Panel>
    </div>
  </SceneFrame>;
};

const Scene03 = () => {
  const frame = useCurrentFrame();
  const stepStarts = [revealFrame('03', 1, seconds(.5)), revealFrame('03', 2, seconds(2)), revealFrame('03', 3, seconds(3.6)), revealFrame('03', 5, seconds(5.2))];
  const creditStart = revealFrame('03', 6, seconds(15.8));
  return <SceneFrame number="03" label="Subscription Path" title="ChatGPT 订阅这条账" lede="先沿订阅路径看固定月费、规则和滚动限额的关系。">
    <div style={{display: 'grid', gap: 32, gridTemplateColumns: '1fr 1fr', height: '100%'}}>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 9, justifyContent: 'center', padding: 28}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17, marginBottom: 5}}>订阅路径</div>{['ChatGPT 订阅', '固定月费', '订阅用量规则', '滚动限额'].map((item, index) => <div key={item} style={{opacity: fade(frame, stepStarts[index]), transform: `translateY(${slide(frame, stepStarts[index])}px)`}}><Step index={String(index + 1)} tone={index === 3 ? colors.warning : colors.accent}>{item}</Step>{index < 3 ? <Arrow tone={index === 2 ? colors.warning : colors.accent} direction="↓" /> : null}</div>)}</Panel>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', padding: 28}}><div style={{color: colors.muted, fontFamily: mono, fontSize: 17}}>限额后的分支</div><div style={{...panelStyle, background: 'rgba(71,48,17,.23)', borderColor: `${colors.warning}77`, display: 'grid', gap: 16, minHeight: 250, placeItems: 'center', textAlign: 'center'}}><Pill tone={colors.warning}>达到限额</Pill><div style={{background: colors.warning, boxShadow: `0 0 18px ${colors.warning}88`, height: 3, width: '70%'}} /><div style={{color: colors.warning, fontSize: 40, fontWeight: 800, opacity: fade(frame, creditStart)}}>积分</div><div style={{color: colors.muted, fontSize: 20, opacity: fade(frame, creditStart)}}>留在订阅账本内</div></div><Pill tone={colors.accent} style={{alignSelf: 'center', opacity: fade(frame, creditStart + seconds(1))}}>不接入 API 账单</Pill></Panel>
    </div>
  </SceneFrame>;
};

const Scene04 = () => {
  const frame = useCurrentFrame();
  const subscriptionStart = revealFrame('04', 7, seconds(16.2));
  const boundaryStart = revealFrame('04', 6, seconds(14.8));
  const apiItemStarts = [revealFrame('04', 1, seconds(2.4)), revealFrame('04', 3, seconds(6)), revealFrame('04', 4, seconds(8.2))];
  return (
    <SceneFrame number="04" label="Two Ledgers" title="API key 这条账：两套账" lede="程序化调用从 API key 出发，走向独立的 Platform 账单。">
      <div style={{alignItems: 'stretch', display: 'grid', gap: 22, gridTemplateColumns: '1fr .72fr 1.15fr', height: '100%'}}>
        <Panel style={{display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center', opacity: fade(frame, subscriptionStart), padding: 26, transform: `translateY(${slide(frame, subscriptionStart)}px)`}}>
          <div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>订阅账本</div>
          <Step index="1">ChatGPT 订阅</Step>
          <Step index="2">ChatGPT 积分</Step>
          <Pill>订阅路径</Pill>
        </Panel>
        <Panel style={{background: 'rgba(71,48,17,.23)', borderColor: `${colors.warning}77`, display: 'grid', minHeight: 280, opacity: fade(frame, boundaryStart), placeItems: 'center', padding: 22, textAlign: 'center', transform: `translateY(${slide(frame, boundaryStart)}px)`}}>
          <Pill tone={colors.warning}>两套账</Pill>
          <div style={{background: colors.warning, boxShadow: `0 0 18px ${colors.warning}88`, height: 3, width: '70%'}} />
          <div style={{fontSize: 34, fontWeight: 800}}>不混算</div>
          <div style={{color: colors.muted, fontSize: 18}}>边界保持独立</div>
        </Panel>
        <Panel style={{borderColor: `${colors.web}66`, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center', padding: 26}}>
          <div style={{color: colors.web, fontFamily: mono, fontSize: 17}}>API 账本</div>
          {['程序或脚本', 'API key', '输入／输出 token'].map((item, index) => {
            const start = apiItemStarts[index];
            return (
              <div key={item} style={{opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}>
                <Step index={String(index + 1)} tone={colors.web}>{item}</Step>
              </div>
            );
          })}
          <Pill tone={colors.web} style={{opacity: fade(frame, revealFrame('04', 8, seconds(11)))}}>Platform 账单</Pill>
        </Panel>
      </div>
    </SceneFrame>
  );
};

const Scene05 = () => {
  const frame = useCurrentFrame();
  const cards = [{title: 'Plus', label: '个人', detail: '个人开发者', tone: colors.accent, tag: '基础使用'}, {title: 'Pro', label: '重度个人', detail: '高频使用', tone: colors.cli, tag: '使用强度'}, {title: 'Business', label: '团队', detail: '团队协作', tone: colors.web, tag: '协作管理'}, {title: 'Enterprise & Edu', label: '组织', detail: '组织级部署', tone: colors.ide, tag: '安全管理'}];
  const cardStarts = [3, 4, 6, 8].map((cueIndex, index) => revealFrame('05', cueIndex, seconds(.7 + index * .8)));
  const supportStart = revealFrame('05', 18, seconds(20));
  return <SceneFrame number="05" label="Use Cases" title="套餐先按使用场景分层" lede="先判断谁在用、怎么协作，再核对支持范围。">
    <div style={{display: 'grid', gap: 18, gridTemplateColumns: 'repeat(4, 1fr)', height: '74%'}}>{cards.map((card, index) => <Panel key={card.title} style={{borderColor: `${card.tone}66`, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center', opacity: fade(frame, cardStarts[index]), padding: 23, transform: `translateY(${slide(frame, cardStarts[index])}px)`}}><div style={{color: card.tone, fontFamily: mono, fontSize: 17}}>{card.label}</div><div style={{fontSize: card.title.length > 10 ? 28 : 40, fontWeight: 800, lineHeight: 1.15}}>{card.title}</div><div style={{color: colors.muted, fontSize: 20}}>{card.detail}</div><Pill tone={card.tone} style={{alignSelf: 'flex-start', fontSize: 16}}>{card.tag}</Pill></Panel>)}</div>
    <Pill tone={colors.warning} style={{bottom: 6, fontSize: 17, opacity: fade(frame, supportStart), position: 'absolute', right: 0}}>支持范围待核对</Pill>
  </SceneFrame>;
};

const Scene06 = () => {
  const frame = useCurrentFrame();
  const windowStart = revealFrame('06', 3, seconds(1));
  const blocks = [{name: '小脚本', width: 100, tone: colors.accent}, {name: '大型项目', width: 185, tone: colors.cli}, {name: '长会话', width: 230, tone: colors.warning}];
  const blockStarts = [4, 5, 6].map((cueIndex, index) => revealFrame('06', cueIndex, seconds(2 + index * 1.1)));
  const limitStart = revealFrame('06', 8, seconds(20));
  const creditStart = revealFrame('06', 9, seconds(22));
  const outletStart = revealFrame('06', 11, seconds(27));
  return <SceneFrame number="06" label="Rolling Window" title="滚动窗口与任务复杂度" lede="限额是随时间移动的资源，任务越复杂，窗口内消耗越快。">
    <div style={{display: 'grid', gap: 30, gridTemplateColumns: '1.08fr .92fr', height: '100%'}}>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center', padding: 28}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>订阅用量</div><div style={{...panelStyle, padding: 22}}><div style={{color: colors.accent, fontSize: 34, fontWeight: 800}}>5 小时滚动窗口</div><div style={{color: colors.muted, fontSize: 19, marginTop: 8}}>窗口持续向右移动，不是每日清零</div><div style={{background: '#263946', borderRadius: 99, height: 8, marginTop: 25, overflow: 'hidden', position: 'relative'}}><div style={{background: colors.accent, height: '100%', left: `${interpolateValue(frame, windowStart, windowStart + seconds(4), 0, 62)}%`, position: 'absolute', width: '38%'}} /></div></div><div style={{display: 'grid', gap: 10}}>{blocks.map((block, index) => <div key={block.name} style={{alignItems: 'center', display: 'flex', gap: 12, opacity: fade(frame, blockStarts[index]), transform: `translateX(${slide(frame, blockStarts[index], 20)}px)`}}><div style={{background: `${block.tone}18`, border: `1px solid ${block.tone}66`, borderRadius: 10, color: block.tone, fontSize: 22, padding: '13px 15px', width: block.width}}>{block.name}</div><span style={{color: colors.muted, fontFamily: mono, fontSize: 17}}>{index === 0 ? '少量消耗' : index === 1 ? '更快占用' : '持续累积'}</span></div>)}</div></Panel>
      <Panel style={{borderColor: `${colors.warning}77`, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center', padding: 28}}><div style={{color: colors.warning, fontFamily: mono, fontSize: 17}}>窗口右端</div><div style={{...panelStyle, background: 'rgba(71,48,17,.23)', borderColor: `${colors.warning}77`, display: 'grid', gap: 14, minHeight: 220, opacity: fade(frame, limitStart), placeItems: 'center', textAlign: 'center'}}><Pill tone={colors.warning}>达到限额</Pill><div style={{color: colors.warning, fontSize: 38, fontWeight: 800, opacity: fade(frame, creditStart)}}>积分</div><div style={{color: colors.muted, fontSize: 18, opacity: fade(frame, creditStart)}}>从订阅账本向下分出</div></div><Panel style={{borderColor: `${colors.web}66`, opacity: fade(frame, outletStart)}}><div style={{color: colors.web, fontFamily: mono, fontSize: 17}}>独立出口</div><div style={{color: colors.web, fontSize: 26, fontWeight: 800, marginTop: 10}}>积分 ≠ API 账单</div></Panel></Panel>
    </div>
  </SceneFrame>;
};

const Scene07 = () => {
  const frame = useCurrentFrame();
  const steps = [{title: '缩小输入范围', from: '模糊请求', to: '文件／函数'}, {title: '压缩固定上下文', from: '巨型规则', to: '分层规则'}, {title: '按需连接工具', from: '全挂工具', to: '按需连接'}, {title: '匹配模型与任务', from: '全程强模型', to: '任务匹配'}];
  const stepStarts = [3, 6, 8, 10].map((cueIndex, index) => revealFrame('07', cueIndex, seconds(.7 + index * 1.2)));
  const newStart = revealFrame('07', 13, seconds(28));
  const cleanupStart = revealFrame('07', 14, seconds(30));
  const summaryStart = revealFrame('07', 15, seconds(33));
  return <SceneFrame number="07" label="Context Control" title="升级前先控制上下文" lede="先减少无效输入，再决定是否需要更高的用量空间。">
    <div style={{display: 'grid', gap: 28, gridTemplateColumns: '1.18fr .82fr', height: '100%'}}>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', padding: 25}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17, marginBottom: 5}}>从大而杂到短而准</div>{steps.map((step, index) => {const start = stepStarts[index]; return <div key={step.title} style={{opacity: fade(frame, start), transform: `translateY(${slide(frame, start)}px)`}}><Step index={String(index + 1)}>{step.title}<span style={{color: colors.muted, fontSize: 17, marginLeft: 'auto'}}>{step.from} → {step.to}</span></Step></div>;})}</Panel>
      <Panel style={{background: '#03080c', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 0, overflow: 'hidden'}}><div style={{background: '#0b151d', borderBottom: `1px solid ${colors.line}`, color: colors.muted, fontFamily: mono, fontSize: 17, padding: '13px 18px'}}>workspace / context</div><div style={{color: colors.muted, fontFamily: mono, fontSize: 19, lineHeight: 2, padding: 22}}><div><span style={{color: colors.danger}}>before</span>　huge-context / old-session</div><div><span style={{color: colors.cli}}>after </span>　focused-file / needed-tool</div><div style={{height: 15}} /><div style={{color: colors.text, fontSize: 30, opacity: fade(frame, newStart)}}><span style={{color: colors.accent}}>$</span> /new</div><div style={{color: colors.accent, opacity: fade(frame, cleanupStart)}}>✓ 无关会话已清理</div><Pill style={{fontSize: 17, marginTop: 16, opacity: fade(frame, summaryStart)}}>短而准</Pill></div></Panel>
    </div>
  </SceneFrame>;
};

const Scene08 = () => {
  const frame = useCurrentFrame();
  const status = [
    ['/status', '查看', colors.accent],
    ['/model', '调整', colors.warning],
    ['/new', '清理', colors.accent],
    ['任务结果', '复盘', colors.cli],
  ] as const;
  const terminalStarts = [2, 4, 6].map((cueIndex, index) => revealFrame('08', cueIndex, seconds(.8 + index * 2)));
  const statusStarts = [0, 2, 4, 7].map((cueIndex, index) => revealFrame('08', cueIndex, seconds(1.2 + index * 1.3)));
  const outletStart = revealFrame('08', 8, seconds(18));
  return <SceneFrame number="08" label="Usage Loop" title="查看、调整、清理、复盘" lede="四个可执行动作，把用量管理变成一个终端闭环。">
    <div style={{display: 'grid', gap: 30, gridTemplateColumns: '1.08fr .92fr', height: '100%'}}>
      <Panel style={{background: '#03080c', overflow: 'hidden', padding: 0}}><div style={{background: '#0b151d', borderBottom: `1px solid ${colors.line}`, color: colors.muted, fontFamily: mono, fontSize: 17, padding: '13px 18px'}}>Codex / current task</div><div style={{fontFamily: mono, fontSize: 21, lineHeight: 1.9, padding: 25}}>{[['/status', 'context 68% · approval on request', colors.accent], ['/model', 'model → task-matched', colors.warning], ['/new', 'unrelated session removed', colors.cli]].map(([command, result, tone], index) => {const start = terminalStarts[index]; return <div key={command} style={{marginBottom: 17, opacity: fade(frame, start), transform: `translateX(${slide(frame, start, 16)}px)`}}><div style={{color: colors.text}}><span style={{color: colors.accent}}>$</span> {command}</div><div style={{color: tone, fontSize: 18}}>{result}</div></div>;})}</div></Panel>
      <Panel style={{display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center', padding: 28}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>用量管理闭环</div>{status.map(([command, label, tone], index) => <div key={command} style={{alignItems: 'center', borderBottom: `1px solid ${colors.line}`, display: 'flex', justifyContent: 'space-between', opacity: fade(frame, statusStarts[index]), padding: '14px 3px'}}><span style={{color: tone, fontFamily: mono, fontSize: 21}}>{command}</span><span style={{color: colors.text, fontSize: 22}}>{label}</span></div>)}<Panel style={{marginTop: 12, opacity: fade(frame, outletStart)}}><Pill style={{fontSize: 17}}>订阅用量面板</Pill><Pill tone={colors.web} style={{fontSize: 17, marginTop: 10}}>API Platform 账单</Pill></Panel></Panel>
    </div>
  </SceneFrame>;
};

const Scene09 = () => {
  const frame = useCurrentFrame();
  const questions = [['01', '登录路径', '订阅额度 or API 按量计费'], ['02', '任务类型', '交互 or 程序化'], ['03', '上下文规模', '小脚本 or 大项目'], ['04', '用量观察位置', '面板 or Platform']];
  const questionStarts = [1, 2, 3, 4].map((cueIndex, index) => revealFrame('09', cueIndex, seconds(1.2 + index * 1.1)));
  const teaserStart = segmentFrame('09', 2, seconds(24.816));
  const mapOpacity = interpolateValue(frame, teaserStart - seconds(2), teaserStart, 1, 0);
  return <SceneFrame number="09" label="Summary" title="先识别付费路径，再进入模型接入" lede="四个问题先把账本和用量路径放回正确位置。">
    <div style={{height: '100%', opacity: mapOpacity}}><div style={{display: 'flex', gap: 18, justifyContent: 'center', marginBottom: 22}}><Pill>ChatGPT 订阅</Pill><Arrow tone={colors.warning} /><Pill tone={colors.web}>API 账本</Pill></div><div style={{display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, 1fr)'}}>{questions.map(([number, title, detail], index) => <Panel key={number} style={{borderColor: `${colors.accent}55`, minHeight: 150, opacity: fade(frame, questionStarts[index]), padding: 20, textAlign: 'center', transform: `translateY(${slide(frame, questionStarts[index])}px)`}}><div style={{color: colors.accent, fontFamily: mono, fontSize: 17}}>{number}</div><div style={{fontSize: 25, fontWeight: 800, marginTop: 12}}>{title}</div><div style={{color: colors.muted, fontSize: 16, marginTop: 9}}>{detail}</div></Panel>)}</div></div>
    <Panel style={{background: 'linear-gradient(90deg, rgba(173,136,255,.13), rgba(93,168,255,.08))', borderColor: `${colors.ide}88`, bottom: 2, left: '50%', opacity: fade(frame, teaserStart), padding: '23px 36px', position: 'absolute', textAlign: 'center', transform: `translate(-50%, ${slide(frame, teaserStart)}px)`, width: 860}}><div style={{color: colors.ide, fontFamily: mono, fontSize: 18, letterSpacing: 4}}>下一集</div><div style={{fontSize: 34, fontWeight: 800, marginTop: 10}}>接入 DeepSeek 等国产模型</div><div style={{color: colors.muted, fontSize: 18, marginTop: 8}}>模型接入 · API 配置 · 调用路径</div></Panel>
  </SceneFrame>;
};

const renderScene = (sceneId: string) => {
  switch (sceneId) {
    case 'scene-01': return <Scene01 />;
    case 'scene-02': return <Scene02 />;
    case 'scene-03': return <Scene03 />;
    case 'scene-04': return <Scene04 />;
    case 'scene-05': return <Scene05 />;
    case 'scene-06': return <Scene06 />;
    case 'scene-07': return <Scene07 />;
    case 'scene-08': return <Scene08 />;
    case 'scene-09': return <Scene09 />;
    default: return null;
  }
};

export const PricingVideo = () => {
  const frame = useCurrentFrame();
  const contentStartFrame = getContentStartFrame(videoConfig);
  const durationInFrames = getTotalDurationFrames(videoConfig);

  return <>
    {videoConfig.series?.coverSrc ? <Sequence from={0} durationInFrames={contentStartFrame} name={`Series Cover · ${videoConfig.series.id}`}><SeriesCover src={videoConfig.series.coverSrc} /></Sequence> : null}
    {videoConfig.audioTracks?.map((track) => <Sequence key={track.id ?? track.src} from={contentStartFrame + secondsToFrames(track.startSeconds ?? 0, videoConfig.fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * videoConfig.fps))} name={`Audio ${track.id ?? track.src}`} premountFor={videoConfig.fps * 2}><Audio pauseWhenBuffering src={staticFile(track.src)} /></Sequence>) ?? null}
    {videoConfig.scenes.map((scene, index) => {
      const from = getSceneStartFrame(videoConfig.scenes, index, videoConfig.fps);
      return <Sequence key={scene.id} from={contentStartFrame + from} durationInFrames={secondsToFrames(scene.durationSeconds, videoConfig.fps)} name={scene.id}>{renderScene(scene.id)}</Sequence>;
    })}
    {videoConfig.subtitleCues ? <Sequence from={contentStartFrame} name="Subtitles"><TimedCaption bottomMargin={34} cues={videoConfig.subtitleCues} /></Sequence> : null}
    <div style={{display: 'none'}} data-current-frame={frame} data-duration-frames={durationInFrames} />
  </>;
};
