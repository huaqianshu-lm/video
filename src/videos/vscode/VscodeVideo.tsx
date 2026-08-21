import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {TimedCaption} from '../../components/TimedCaption';
import {getSceneStartFrame, getTotalDurationFrames, secondsToFrames} from '../../lib/timing';
import type {SceneConfig} from '../../lib/videoTypes';
import {subtitleCues, videoConfig} from './video.config';

const colors = {
  bg: '#080d18',
  panel: '#10192a',
  panelAlt: '#14233a',
  line: '#2c4263',
  text: '#f1f5ff',
  muted: '#9cacc8',
  blue: '#8da9ff',
  green: '#68d5a3',
  red: '#ff7e8d',
  yellow: '#f4ca70',
};

const reveal = (frame: number, seconds: number, startSeconds: number, duration = 18) => {
  const start = secondsToFrames(startSeconds, 30);
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

const Box = ({children, style = {}}: {children: React.ReactNode; style?: React.CSSProperties}) => (
  <div
    style={{
      background: `linear-gradient(180deg, ${colors.panelAlt}, ${colors.panel})`,
      border: `1px solid ${colors.line}`,
      borderRadius: 18,
      boxShadow: '0 18px 40px rgba(0, 0, 0, 0.25)',
      ...style,
    }}
  >
    {children}
  </div>
);

const WindowBar = () => (
  <div
    style={{
      alignItems: 'center',
      background: '#10192b',
      borderBottom: `1px solid ${colors.line}`,
      display: 'flex',
      gap: 8,
      height: 42,
      padding: '0 18px',
    }}
  >
    {[colors.red, colors.yellow, colors.green].map((color) => (
      <span key={color} style={{background: color, borderRadius: 999, height: 10, width: 10}} />
    ))}
  </div>
);

const Tag = ({children, tone = 'muted'}: {children: React.ReactNode; tone?: 'muted' | 'blue' | 'green' | 'red' | 'yellow'}) => {
  const toneColor = {muted: colors.muted, blue: colors.blue, green: colors.green, red: colors.red, yellow: colors.yellow}[tone];
  return (
    <div
      style={{
        background: `${toneColor}18`,
        border: `1px solid ${toneColor}55`,
        borderRadius: 10,
        color: toneColor,
        fontSize: 23,
        padding: '11px 16px',
      }}
    >
      {children}
    </div>
  );
};

const SceneFrame = ({scene, children}: {scene: SceneConfig; children: React.ReactNode}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 18% 0%, #172844 0, transparent 36%), ${colors.bg}`, color: colors.text, fontFamily: '"Noto Sans CJK SC", "PingFang SC", Arial, sans-serif', padding: '60px 82px 130px'}}>
    <div style={{color: colors.blue, fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 18, letterSpacing: 3, marginBottom: 14, textTransform: 'uppercase'}}>
      VS CODE INTEGRATION
    </div>
    <h1 style={{fontSize: 58, lineHeight: 1.16, margin: 0, maxWidth: 1450}}>{scene.headline}</h1>
    <div style={{height: 34}} />
    {children}
  </AbsoluteFill>
);

const ActivityRail = () => (
  <div style={{alignItems: 'center', background: '#0d1524', borderRight: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', gap: 28, paddingTop: 24}}>
    <div style={{color: colors.muted, fontSize: 24}}>▦</div>
    <div style={{color: colors.muted, fontSize: 24}}>⌕</div>
    <div style={{background: `${colors.blue}22`, border: `1px solid ${colors.blue}66`, borderRadius: 8, color: colors.blue, fontSize: 24, padding: '8px 10px'}}>✦</div>
  </div>
);

const Explorer = ({file = 'demo.py'}: {file?: string}) => (
  <div style={{background: '#111b2c', borderRight: `1px solid ${colors.line}`, color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 18, padding: '22px 18px'}}>
    <div style={{color: colors.text, fontFamily: 'inherit', fontSize: 16, letterSpacing: 1.5, marginBottom: 26}}>EXPLORER</div>
    <div style={{color: colors.blue, marginBottom: 18}}>⌄ vscode-claude-demo</div>
    <div style={{background: `${colors.blue}1c`, borderRadius: 6, color: colors.text, padding: '10px 12px'}}>　{file}</div>
  </div>
);

const EditorPane = ({children, file = 'demo.py', headerRight}: {children: React.ReactNode; file?: string; headerRight?: React.ReactNode}) => (
  <div style={{background: '#0d1524', minWidth: 0}}>
    <div style={{alignItems: 'center', background: '#111b2c', borderBottom: `1px solid ${colors.line}`, color: colors.text, display: 'flex', fontFamily: 'ui-monospace, monospace', fontSize: 18, height: 48, justifyContent: 'space-between', padding: '0 22px'}}>
      <span style={{borderBottom: `2px solid ${colors.blue}`, height: '100%', paddingTop: 14}}>{file}</span>
      {headerRight}
    </div>
    {children}
  </div>
);

const Workspace = ({children}: {children: React.ReactNode}) => (
  <Box style={{height: 650, overflow: 'hidden'}}>
    <WindowBar />
    <div style={{display: 'grid', gridTemplateColumns: '58px 230px minmax(0, 1fr)', height: 608}}>
      <ActivityRail />
      <Explorer />
      <div style={{minWidth: 0}}>{children}</div>
    </div>
  </Box>
);

const SparkLocator = ({frame, scene}: {frame: number; scene: SceneConfig}) => {
  const emptyFocus = interpolate(frame, [secondsToFrames(8.11, 30), secondsToFrames(8.45, 30), secondsToFrames(11.74, 30), secondsToFrames(12.08, 30)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const activeFocus = interpolate(frame, [secondsToFrames(18.48, 30), secondsToFrames(18.82, 30), secondsToFrames(22.368, 30), secondsToFrames(22.7, 30)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sparkOpacity = reveal(frame, scene.durationSeconds, 18.48);
  const activePulse = 1 + Math.sin(frame / 4) * 0.04;

  return (
    <div style={{height: 48, minWidth: 220, position: 'relative'}}>
      <div style={{alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', opacity: emptyFocus}}>
        <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 16, position: 'relative'}}>
          入口位置
          <div style={{border: `3px dashed ${colors.red}`, borderRadius: 8, boxShadow: `0 0 12px ${colors.red}66`, inset: -10, position: 'absolute'}} />
        </div>
        <div style={{color: colors.red, fontFamily: 'ui-monospace, monospace', fontSize: 13, marginLeft: 14}}>未出现</div>
      </div>
      <div style={{alignItems: 'center', display: 'flex', height: '100%', justifyContent: 'center', opacity: sparkOpacity, position: 'absolute', inset: 0}}>
        <div style={{color: colors.green, fontFamily: 'ui-monospace, monospace', fontSize: 16, position: 'relative', transform: `scale(${activePulse})`}}>
          ✦ Spark
          <div style={{border: `3px solid ${colors.green}`, borderRadius: 10, boxShadow: `0 0 18px ${colors.green}88`, inset: -10, opacity: activeFocus, position: 'absolute'}} />
        </div>
        <div style={{color: colors.green, fontFamily: 'ui-monospace, monospace', fontSize: 13, marginLeft: 14}}>已出现</div>
      </div>
    </div>
  );
};

const Opening = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  const steps = ['空文件夹', '打开 demo.py', 'Spark 出现'];
  return (
    <SceneFrame scene={scene}>
      <Workspace>
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', height: 608}}>
          <EditorPane headerRight={<SparkLocator frame={frame} scene={scene} />}>
            <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 21, lineHeight: 1.9, padding: '34px 38px'}}>
              <div style={{color: colors.muted}}>// 先打开一个文件</div>
              <div style={{color: colors.red, marginTop: 32, opacity: 1 - reveal(frame, scene.durationSeconds, 6.63)}}>Spark 未出现</div>
              <div style={{marginTop: 42, opacity: reveal(frame, scene.durationSeconds, 18.48), transform: `translateY(${(1 - reveal(frame, scene.durationSeconds, 18.48)) * 12}px)`}}>
                <Tag tone="green">✓ 文件已打开 · 入口出现</Tag>
              </div>
            </div>
            <div style={{borderTop: `1px solid ${colors.line}`, color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 18, marginTop: 250, padding: '18px 28px'}}>
              状态栏　<span style={{color: colors.blue}}>✱ Claude Code</span>　　右上角　<span style={{color: colors.blue}}>Spark</span>
            </div>
            <div style={{display: 'flex', gap: 10, padding: '16px 24px'}}>
              {steps.map((step, index) => <div key={step} style={{opacity: reveal(frame, scene.durationSeconds, [0, 6.63, 18.48][index]), transform: `translateY(${(1 - reveal(frame, scene.durationSeconds, [0, 6.63, 18.48][index])) * 10}px)`}}><Tag tone={index === 2 ? 'green' : 'blue'}>{step}</Tag></div>)}
            </div>
          </EditorPane>
          <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '28px 26px'}}>
            <div style={{color: colors.blue, fontSize: 24, marginBottom: 20}}>Claude Code</div>
            <div style={{color: colors.muted, fontSize: 20, opacity: reveal(frame, scene.durationSeconds, 13.56)}}>等待打开文件</div>
          </div>
        </div>
      </Workspace>
    </SceneFrame>
  );
};

const Compare = ({scene, mode}: {scene: SceneConfig; mode: 'relationship' | 'diff' | 'routes'}) => {
  const frame = useCurrentFrame();
  const left = mode === 'diff' ? ['return "Hello " + name', '文件未修改'] : ['命令和 skills：全部', 'MCP 配置：完整', '! bash · Tab 补全'];
  const right = mode === 'diff' ? ['def greet(name: str) -> str:', 'return f"Hello {name}"', '接受／拒绝'] : ['并排 diff：原生', '选中代码上下文', '命令和 skills：子集'];
  const isDiff = mode === 'diff';
  return (
    <SceneFrame scene={scene}>
      <Workspace>
        {isDiff ? (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', height: 608}}>
            <EditorPane file="demo.py · 原稿">
              <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 20, lineHeight: 2, padding: '34px 32px'}}>
                <div style={{color: colors.muted, marginBottom: 24}}>原稿</div>
                {left.map((item, index) => <div key={item} style={{background: `${colors.red}18`, borderLeft: `3px solid ${colors.red}`, color: colors.text, marginBottom: 14, opacity: reveal(frame, scene.durationSeconds, [0, 5.88][index]), padding: '10px 14px'}}>{item}</div>)}
              </div>
            </EditorPane>
            <EditorPane file="demo.py · 建议改动">
              <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 20, lineHeight: 2, padding: '34px 32px'}}>
                <div style={{color: colors.green, marginBottom: 24}}>建议改动 · Claude Code</div>
                {right.map((item, index) => <div key={item} style={{background: `${index === 2 ? colors.yellow : colors.green}18`, borderLeft: `3px solid ${index === 2 ? colors.yellow : colors.green}`, color: colors.text, marginBottom: 14, opacity: reveal(frame, scene.durationSeconds, [4, 10, 17.95][index]), padding: '10px 14px'}}>{item}</div>)}
              </div>
            </EditorPane>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', height: 608}}>
            <EditorPane file="claude-code">
              <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 19, lineHeight: 2, padding: '34px 32px'}}>
                <div style={{color: colors.blue, fontFamily: 'inherit', fontSize: 24, marginBottom: 24}}>VS Code 扩展</div>
                {['并排 diff：原生', '选中代码上下文', '命令和 skills：子集'].map((item, index) => <div key={item} style={{marginBottom: 14, opacity: reveal(frame, scene.durationSeconds, [0, 10, 17.95][index])}}><Tag tone="blue">{item}</Tag></div>)}
              </div>
            </EditorPane>
            <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '28px 24px'}}>
              <div style={{color: colors.green, fontSize: 24, marginBottom: 24}}>集成终端 CLI</div>
              <div style={{fontFamily: 'ui-monospace, monospace', fontSize: 19, lineHeight: 2}}>
                <div style={{color: colors.muted, marginBottom: 18}}>$ claude</div>
                {left.map((item, index) => <div key={item} style={{color: colors.text, marginBottom: 14, opacity: reveal(frame, scene.durationSeconds, [0, 5.88, 12.75][index])}}>{item}</div>)}
              </div>
              <div style={{borderTop: `1px solid ${colors.line}`, color: colors.blue, fontSize: 20, marginTop: 26, paddingTop: 22, textAlign: 'center'}}>↕ 共享配置 · 可恢复历史</div>
            </div>
          </div>
        )}
      </Workspace>
    </SceneFrame>
  );
};

const Install = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  const checks = ['打开具体文件', '确认版本', 'Developer: Reload Window', '暂时禁用其他 AI 扩展', '信任工作区'];
  return <SceneFrame scene={scene}><div style={{display: 'grid', gap: 30, gridTemplateColumns: '1.1fr .9fr', height: 650}}><Box style={{padding: 30}}><WindowBar /><div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 24, margin: '28px 0 24px', padding: 16}}>Cmd+Shift+X　Claude Code</div><Box style={{background: '#162e33', borderColor: colors.green, padding: 26}}><div style={{fontSize: 32, fontWeight: 700}}>Claude Code for VS Code</div><div style={{color: colors.green, fontSize: 24, marginTop: 16}}>✓ Anthropic · VS Code ≥ 1.98.0</div></Box><div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 20, marginTop: 22}}>vscode:extension/anthropic.claude-code</div></Box><Box style={{display: 'grid', gap: 16, padding: 30}}>{checks.map((check, index) => {const opacity = reveal(frame, scene.durationSeconds, [0, 4.05, 12.34, 21.31, 29.42][index]); return <div key={check} style={{border: `1px solid ${index < 2 ? colors.green : colors.line}`, borderRadius: 12, color: index < 2 ? colors.green : colors.muted, fontSize: 24, opacity, padding: '18px 20px', transform: `translateX(${(1 - opacity) * 18}px)`}}>{index < 2 ? '✓ ' : ''}{check}</div>})}<div style={{color: colors.muted, fontSize: 20}}>活动栏 Spark · ✱ Claude Code · 命令面板</div></Box></div></SceneFrame>;
};

const Context = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  return (
    <SceneFrame scene={scene}>
      <Workspace>
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', height: 608}}>
          <EditorPane>
            <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 20, lineHeight: 1.9, padding: '34px 32px'}}>
              <div style={{color: colors.muted, marginBottom: 24}}>demo.py</div>
              <div style={{background: '#344d82', borderRadius: 6, color: colors.text, padding: '8px 12px', width: 'fit-content'}}>def greet(name):</div>
              <div style={{background: '#344d82', borderRadius: 6, color: colors.text, marginTop: 8, padding: '8px 12px', width: 'fit-content'}}>　return &quot;Hello &quot; + name</div>
              <div style={{color: colors.green, marginTop: 28}}>已选中 2 行</div>
            </div>
          </EditorPane>
          <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '28px 26px'}}>
            <div style={{color: colors.blue, fontSize: 24, marginBottom: 20}}>Claude Code · 提示框</div>
            <div style={{background: '#1a2c49', borderRadius: 10, fontFamily: 'ui-monospace, monospace', fontSize: 20, lineHeight: 2, padding: 22}}>
              <span style={{background: '#344d82', borderRadius: 6, padding: '5px 8px'}}>@auth</span>{' '}
              <span style={{background: '#344d82', borderRadius: 6, padding: '5px 8px'}}>@src/components/</span>
              <br />这段为什么报错？
            </div>
            <div style={{color: colors.green, fontSize: 20, marginTop: 28, opacity: reveal(frame, scene.durationSeconds, 23.18)}}>✓ 已选中 2 行　Option+K／Alt+K</div>
          </div>
        </div>
      </Workspace>
    </SceneFrame>
  );
};

const Plan = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  const modes = ['正常模式 · 每步询问', 'Plan Mode · 先看方案', '自动接受模式 · 直接执行'];
  const lineOpacity = [7.14, 10.1, 13.2].map((startSeconds) => reveal(frame, scene.durationSeconds, startSeconds));
  const annotationOpacity = reveal(frame, scene.durationSeconds, 16.2);
  const approvalOpacity = reveal(frame, scene.durationSeconds, 19.55);

  return (
    <SceneFrame scene={scene}>
      <Box style={{height: 650, overflow: 'hidden'}}>
        <WindowBar />
        <div style={{display: 'grid', gridTemplateColumns: '58px 230px minmax(0, 1fr) 470px', height: 608}}>
          <div style={{alignItems: 'center', background: '#0d1524', borderRight: `1px solid ${colors.line}`, display: 'flex', flexDirection: 'column', gap: 28, paddingTop: 24}}>
            <div style={{color: colors.muted, fontSize: 24}}>▦</div>
            <div style={{color: colors.muted, fontSize: 24}}>⌕</div>
            <div style={{background: `${colors.blue}22`, border: `1px solid ${colors.blue}66`, borderRadius: 8, color: colors.blue, fontSize: 24, padding: '8px 10px'}}>✦</div>
          </div>

          <div style={{background: '#111b2c', borderRight: `1px solid ${colors.line}`, color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 18, padding: '22px 18px'}}>
            <div style={{color: colors.text, fontFamily: 'inherit', fontSize: 16, letterSpacing: 1.5, marginBottom: 26}}>EXPLORER</div>
            <div style={{color: colors.blue, marginBottom: 18}}>⌄ vscode-claude-demo</div>
            <div style={{background: `${colors.blue}1c`, borderRadius: 6, color: colors.text, padding: '10px 12px'}}>　demo.py</div>
          </div>

          <div style={{background: '#0d1524', minWidth: 0}}>
            <div style={{alignItems: 'center', background: '#111b2c', borderBottom: `1px solid ${colors.line}`, color: colors.text, display: 'flex', fontFamily: 'ui-monospace, monospace', fontSize: 18, height: 48, padding: '0 22px'}}>
              <span style={{borderBottom: `2px solid ${colors.blue}`, height: '100%', paddingTop: 14}}>demo.py</span>
            </div>
            <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 19, lineHeight: 1.9, padding: '28px'}}>
              <div><span style={{color: '#5e7191', display: 'inline-block', textAlign: 'right', width: 28}}>1</span>　<span style={{color: colors.blue}}>def</span> <span style={{color: colors.text}}>greet</span>(name):</div>
              <div><span style={{color: '#5e7191', display: 'inline-block', textAlign: 'right', width: 28}}>2</span>　　<span style={{color: colors.blue}}>return</span> <span style={{color: colors.green}}>&quot;Hello &quot;</span> + name</div>
              <div style={{height: 24}} />
              <div><span style={{color: '#5e7191', display: 'inline-block', textAlign: 'right', width: 28}}>3</span>　<span style={{color: colors.muted}}># Claude Code</span></div>
              <div><span style={{color: '#5e7191', display: 'inline-block', textAlign: 'right', width: 28}}>4</span>　<span style={{color: colors.muted}}>等待计划确认后再修改文件</span></div>
            </div>
          </div>

          <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, minWidth: 0, padding: '22px 24px'}}>
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 18}}>
              <div style={{color: colors.text, fontSize: 24, fontWeight: 700}}>Claude Code</div>
              <div style={{color: colors.muted, fontSize: 17}}>✕</div>
            </div>
            <div style={{display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginBottom: 18}}>
              {modes.map((mode, index) => {
                const opacity = reveal(frame, scene.durationSeconds, index * 0.9);
                const active = index === 1;
                return <div key={mode} style={{background: active ? `${colors.blue}22` : '#17243a', border: `1px solid ${active ? colors.blue : colors.line}`, borderRadius: 8, color: active ? colors.blue : colors.muted, fontSize: 14, opacity, padding: '10px 8px', textAlign: 'center'}}>{mode.split(' · ')[0]}</div>;
              })}
            </div>
            <div style={{background: '#1b2b46', border: `1px solid ${colors.blue}66`, borderRadius: 10, color: colors.text, fontSize: 18, lineHeight: 1.55, opacity: reveal(frame, scene.durationSeconds, 4.2), padding: '14px 16px'}}>
              给 <span style={{color: colors.blue}}>demo.py</span> 增加命令行参数支持
            </div>
            <div style={{background: '#0d1524', border: `1px solid ${colors.line}`, borderRadius: 10, fontFamily: 'ui-monospace, monospace', fontSize: 17, lineHeight: 1.8, marginTop: 18, minHeight: 290, opacity: reveal(frame, scene.durationSeconds, 5.7), padding: '18px 20px'}}>
              <div style={{color: colors.blue, marginBottom: 8}}># 执行计划</div>
              <div style={{opacity: lineOpacity[0]}}>1. 读取当前 greet 函数</div>
              <div style={{opacity: lineOpacity[1], position: 'relative'}}>2. 引入 argparse
                <span style={{background: `${colors.yellow}20`, border: `1px solid ${colors.yellow}88`, borderRadius: 8, color: colors.yellow, display: 'block', fontFamily: 'inherit', fontSize: 15, lineHeight: 1.4, marginTop: 8, opacity: annotationOpacity, padding: '8px 10px'}}>这里先确认参数入口</span>
              </div>
              <div style={{marginTop: 10, opacity: lineOpacity[2]}}>3. 运行示例命令</div>
              <div style={{color: colors.yellow, marginTop: 18, opacity: approvalOpacity}}>等待批准</div>
            </div>
          </div>
        </div>
      </Box>
    </SceneFrame>
  );
};

const Steps = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  const steps = [['工作区', 'mkdir vscode-claude-demo', 'demo.py · code .'], ['面板', '打开文件', '已登录'], ['选中', 'greet', '已选中 2 行'], ['diff', 'f-string', '+ 类型注解 · 接受'], ['计划', 'Plan Mode', '命令行参数支持']];
  return (
    <SceneFrame scene={scene}>
      <Workspace>
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 500px', height: 608}}>
          <EditorPane>
            <div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 20, lineHeight: 1.9, padding: '34px 32px'}}>
              <div style={{color: colors.blue, fontSize: 23, marginBottom: 24}}>demo.py</div>
              <div><span style={{color: '#5e7191'}}>1</span>　<span style={{color: colors.blue}}>def</span> greet(name):</div>
              <div><span style={{color: '#5e7191'}}>2</span>　　 <span style={{color: colors.blue}}>return</span> &quot;Hello &quot; + name</div>
              <div style={{borderTop: `1px solid ${colors.line}`, color: colors.muted, marginTop: 32, paddingTop: 24}}>$ code .</div>
              <div style={{color: colors.green, marginTop: 12}}>Claude Code 已登录</div>
            </div>
          </EditorPane>
          <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '24px 24px'}}>
            <div style={{color: colors.blue, fontSize: 23, marginBottom: 18}}>最小练习 · 执行路径</div>
            <div style={{display: 'grid', gap: 10}}>
              {steps.map(([title, line1, line2], index) => {
                const opacity = reveal(frame, scene.durationSeconds, [0, 4.28, 9.34, 15.37, 22.15][index]);
                return <div key={title} style={{background: index === 4 ? `${colors.blue}18` : '#17243a', border: `1px solid ${index === 4 ? colors.blue : colors.line}`, borderRadius: 9, opacity, padding: '13px 16px', transform: `translateX(${(1 - opacity) * 18}px)`}}><div style={{color: colors.blue, fontFamily: 'ui-monospace, monospace', fontSize: 15}}>0{index + 1}　{title}</div><div style={{color: colors.text, fontFamily: 'ui-monospace, monospace', fontSize: 16, marginTop: 7}}>{line1}</div><div style={{color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 15, marginTop: 5}}>{line2}</div></div>;
              })}
            </div>
          </div>
        </div>
      </Workspace>
    </SceneFrame>
  );
};

const Shortcuts = ({scene}: {scene: SceneConfig}) => (
  <SceneFrame scene={scene}>
    <Workspace>
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 470px', height: 608}}>
        <EditorPane>
          <div style={{padding: '30px 32px'}}>
            <div style={{color: colors.blue, fontSize: 23, marginBottom: 22}}>VS Code 扩展 · 快捷键</div>
            <div style={{display: 'grid', gap: 14}}>
              {['Cmd+Esc／Ctrl+Esc　切换焦点', 'Option+K／Alt+K　插入提及', 'Cmd+Shift+T／Ctrl+Shift+T　恢复会话'].map((key) => <Tag key={key} tone="blue">{key}</Tag>)}
            </div>
            <div style={{borderTop: `1px solid ${colors.line}`, color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 18, lineHeight: 1.8, marginTop: 38, paddingTop: 24}}>当前文件　demo.py<br />编辑器获得焦点时可插入引用</div>
          </div>
        </EditorPane>
        <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '28px 24px'}}>
          <div style={{color: colors.blue, fontSize: 23, marginBottom: 20}}>集成终端 CLI</div>
          <div style={{background: '#0d1524', borderRadius: 10, color: colors.muted, fontFamily: 'ui-monospace, monospace', fontSize: 18, lineHeight: 2, padding: '18px 20px'}}>
            <div>$ claude</div>
            <div style={{color: colors.green}}>已连接 VS Code</div>
            <div style={{color: colors.text, marginTop: 10}}>命令、skills、MCP</div>
            <div style={{color: colors.blue}}>/ide　手动连接</div>
          </div>
          <div style={{display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 20}}><Tag tone="blue">文件与 diff</Tag><Tag tone="green">批量命令</Tag><Tag tone="blue">上下文与计划</Tag><Tag tone="green">完整配置</Tag></div>
        </div>
      </div>
    </Workspace>
  </SceneFrame>
);

const Summary = ({scene}: {scene: SceneConfig}) => {
  const frame = useCurrentFrame();
  const teaserStart = Math.round(scene.durationSeconds * 30 * 0.72);
  const teaserOpacity = interpolate(frame, [teaserStart, teaserStart + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <SceneFrame scene={scene}>
      <div style={{opacity: 1 - teaserOpacity}}>
        <Workspace>
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 390px', height: 608}}>
            <EditorPane>
              <div style={{padding: '34px 32px'}}>
                <div style={{color: colors.blue, fontSize: 24, marginBottom: 24}}>VS Code 扩展</div>
                <div style={{display: 'grid', gap: 14}}>{['文件', '上下文', 'diff'].map((item) => <Tag key={item} tone="blue">{item}</Tag>)}</div>
              </div>
            </EditorPane>
            <div style={{background: '#121e31', borderLeft: `1px solid ${colors.line}`, padding: '34px 26px'}}>
              <div style={{color: colors.green, fontSize: 24, marginBottom: 24}}>集成终端 CLI</div>
              <div style={{display: 'grid', gap: 14}}>{['命令', 'skills', 'MCP'].map((item) => <Tag key={item} tone="green">{item}</Tag>)}</div>
              <div style={{color: colors.blue, fontSize: 22, marginTop: 34, textAlign: 'center'}}>⇄ 按任务切换</div>
            </div>
          </div>
        </Workspace>
      </div>
      <AbsoluteFill style={{alignItems: 'center', background: `linear-gradient(135deg, ${colors.panel}, ${colors.panelAlt})`, display: 'flex', justifyContent: 'center', opacity: teaserOpacity, pointerEvents: 'none'}}>
        <div style={{textAlign: 'center'}}><div style={{color: colors.blue, fontSize: 22, letterSpacing: 3}}>下一篇</div><div style={{fontSize: 58, fontWeight: 700, margin: '18px 0'}}>09 · JetBrains 集成</div><div style={{color: colors.muted, fontSize: 28}}>IntelliJ IDEA · PyCharm · Claude Code</div></div>
      </AbsoluteFill>
    </SceneFrame>
  );
};

const renderScene = (scene: SceneConfig) => {
  if (scene.id.includes('spark')) return <Opening scene={scene} />;
  if (scene.id.includes('extension-and-cli')) return <Compare scene={scene} mode="relationship" />;
  if (scene.id.includes('install')) return <Install scene={scene} />;
  if (scene.id.includes('diff')) return <Compare scene={scene} mode="diff" />;
  if (scene.id.includes('context')) return <Context scene={scene} />;
  if (scene.id.includes('plan')) return <Plan scene={scene} />;
  if (scene.id.includes('minimal')) return <Steps scene={scene} />;
  if (scene.id.includes('shortcuts')) return <Shortcuts scene={scene} />;
  return <Summary scene={scene} />;
};

export const VscodeVideo = () => {
  const frame = useCurrentFrame();
  const durationInFrames = getTotalDurationFrames(videoConfig);
  const {fps} = useVideoConfig();

  return (
    <>
      {videoConfig.audioTracks?.map((track) => (
        <Sequence key={track.id ?? track.src} from={secondsToFrames(track.startSeconds ?? 0, fps)} durationInFrames={Math.max(1, Math.ceil(track.durationSeconds * fps))} premountFor={fps * 2}>
          <Audio pauseWhenBuffering src={staticFile(track.src)} />
        </Sequence>
      ))}
      {videoConfig.scenes.map((scene, index) => {
        const from = getSceneStartFrame(videoConfig.scenes, index, fps);
        const durationInFrames = secondsToFrames(scene.durationSeconds, fps);
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={durationInFrames}
            name={scene.id}>{renderScene(scene)}</Sequence>
        );
      })}
      <TimedCaption cues={subtitleCues} bottomMargin={62} />
      <div style={{display: 'none'}}>{frame}/{durationInFrames}</div>
    </>
  );
};
