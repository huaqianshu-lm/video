import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, SceneContainer} from '../../../components/SceneContainer';
import {MockWindow, StatusChip, VisualCard} from '../../../components/VisualPrimitives';
import {segmentFrame} from '../sceneTiming';

type TaskExecutionSceneProps = {
  durationInFrames: number;
};

type FileChangeProps = {
  file: string;
  progress: number;
  status: 'Modified' | 'Created';
};

const reveal = (frame: number, start: number, end = start + 16) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const clampFrame = (frame: number, delay: number) => Math.max(0, frame - delay);

const FileChange = ({file, progress, status}: FileChangeProps) => {
  const isCreated = status === 'Created';
  const tone = isCreated ? '#a78bfa' : colors.accent;

  return (
    <div
      style={{
        alignItems: 'center',
        background: `${tone}12`,
        border: `1px solid ${tone}72`,
        borderRadius: 14,
        display: 'flex',
        justifyContent: 'space-between',
        minHeight: 56,
        opacity: progress,
        padding: '12px 16px',
        transform: `translateX(${(1 - progress) * -22}px)`,
      }}
    >
      <div style={{alignItems: 'center', display: 'flex', gap: 12, minWidth: 0}}>
        <span style={{color: tone, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 20, fontWeight: 900}}>
          {isCreated ? '+' : '±'}
        </span>
        <span style={{color: colors.text, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 21, fontWeight: 760}}>{file}</span>
      </div>
      <span style={{color: tone, fontSize: 15, fontWeight: 820, letterSpacing: 0.6}}>{status}</span>
    </div>
  );
};

export const TaskExecutionScene = ({durationInFrames}: TaskExecutionSceneProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const taskProgress = reveal(frame, segmentFrame('08', '08-01'), segmentFrame('08', '08-01') + 20);
  const fileStarts = [segmentFrame('08', '08-04'), segmentFrame('08', '08-07'), segmentFrame('08', '08-08')];
  const testCommandProgress = reveal(frame, segmentFrame('08', '08-12'), segmentFrame('08', '08-12') + 18);
  const testRunningProgress = reveal(frame, segmentFrame('08', '08-13'), segmentFrame('08', '08-13') + 16);
  const testCompleteProgress = reveal(frame, segmentFrame('08', '08-14'), segmentFrame('08', '08-14') + 18);
  const diffProgress = reveal(frame, segmentFrame('08', '08-14', 0.45), segmentFrame('08', '08-14', 0.45) + 16);
  const finalStart = segmentFrame('08', '08-15');
  const finalProgress = reveal(frame, finalStart, finalStart + 18);
  const finalScale = spring({
    fps,
    frame: clampFrame(frame, finalStart),
    config: {damping: 18, mass: 0.72, stiffness: 126},
  });
  const workspaceOpacity = interpolate(finalProgress, [0, 1], [1, 0.18]);
  const workspaceScale = interpolate(finalProgress, [0, 1], [1, 0.95]);

  const changes: Array<{file: string; status: 'Modified' | 'Created'}> = [
    {file: 'auth.ts', status: 'Modified'},
    {file: 'login.ts', status: 'Modified'},
    {file: 'auth.test.ts', status: 'Created'},
  ];

  return (
    <SceneContainer>
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          height: '100%',
          paddingBottom: 62,
          position: 'relative',
        }}
      >
        <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
          <div>
            <div style={{color: colors.accent, fontSize: 24, fontWeight: 800, letterSpacing: 2.4, marginBottom: 10, textTransform: 'uppercase'}}>
              Scene 08 · Task Execution Demo
            </div>
            <div style={{fontSize: 52, fontWeight: 880, letterSpacing: -1.5}}>第二层能力：真正动手</div>
          </div>
          <StatusChip active={testCompleteProgress > 0.5} tone="success">
            {testCompleteProgress > 0.5 ? 'task verified' : 'task in progress'}
          </StatusChip>
        </div>

        <div
          style={{
            display: 'grid',
            flex: 1,
            gap: 24,
            gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)',
            minHeight: 0,
            opacity: workspaceOpacity,
            transform: `scale(${workspaceScale})`,
          }}
        >
          <VisualCard
            active={taskProgress > 0.6}
            style={{background: 'rgba(8, 15, 29, 0.95)', display: 'flex', flexDirection: 'column', minHeight: 0, opacity: taskProgress, padding: '28px 30px', transform: `translateY(${(1 - taskProgress) * 18}px)`}}
          >
            <div style={{alignItems: 'center', display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{color: colors.muted, fontSize: 17, fontWeight: 800, letterSpacing: 1.6}}>ASSIGNED TASK</div>
                <div style={{fontSize: 34, fontWeight: 900, marginTop: 10}}>Refactor auth module</div>
              </div>
              <StatusChip active={testCompleteProgress > 0.5} tone="success" style={{fontSize: 16, padding: '7px 10px'}}>
                {testCompleteProgress > 0.5 ? 'Done' : 'Todo'}
              </StatusChip>
            </div>

            <div style={{borderTop: `1px solid ${colors.line}`, margin: '24px 0 18px'}} />
            <div style={{color: colors.muted, fontSize: 17, fontWeight: 760, marginBottom: 12}}>CHANGES APPLIED</div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 11}}>
              {changes.map((change, index) => (
                <FileChange key={change.file} {...change} progress={reveal(frame, fileStarts[index], fileStarts[index] + 16)} />
              ))}
            </div>

            <div style={{background: 'rgba(134, 239, 172, 0.08)', border: '1px solid rgba(134, 239, 172, 0.3)', borderRadius: 14, color: '#bbf7d0', fontSize: 17, fontWeight: 720, lineHeight: 1.45, marginTop: 'auto', opacity: testCompleteProgress, padding: '13px 15px'}}>
              跨文件修改与测试补齐，作为同一个连续任务完成。
            </div>
          </VisualCard>

          <MockWindow
            title="terminal · auth-module"
            style={{display: 'flex', flexDirection: 'column', minHeight: 0, opacity: taskProgress, transform: `translateY(${(1 - taskProgress) * 18}px)`}}
            bodyStyle={{display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, padding: '24px 28px'}}
          >
            <div style={{color: colors.muted, fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 18, lineHeight: 1.7}}>
              <div style={{color: colors.text, opacity: testCommandProgress}}><span style={{color: '#86efac'}}>$</span> npm test</div>
              <div style={{marginTop: 14, opacity: testRunningProgress}}>
                <span style={{color: colors.accent}}>●</span> Running auth module tests...
              </div>
              <div style={{color: '#86efac', fontSize: 24, fontWeight: 820, marginTop: 18, opacity: testCompleteProgress, transform: `translateY(${(1 - testCompleteProgress) * 8}px)`}}>
                ✓ 24 passed
              </div>
              <div style={{borderTop: `1px solid ${colors.line}`, margin: '24px 0 18px', opacity: diffProgress}} />
              <div style={{color: colors.text, opacity: diffProgress}}><span style={{color: '#86efac'}}>$</span> git diff</div>
              <div style={{color: '#86efac', marginTop: 13, opacity: diffProgress}}>+ split auth validation from login flow</div>
              <div style={{color: '#86efac', opacity: diffProgress}}>+ add regression coverage</div>
            </div>

            <div style={{alignItems: 'center', background: testCompleteProgress > 0.5 ? 'rgba(134, 239, 172, 0.1)' : 'rgba(125, 211, 252, 0.08)', border: `1px solid ${testCompleteProgress > 0.5 ? 'rgba(134, 239, 172, 0.5)' : 'rgba(125, 211, 252, 0.35)'}`, borderRadius: 14, display: 'flex', gap: 12, marginTop: 'auto', opacity: testRunningProgress, padding: '14px 16px'}}>
              <span style={{color: testCompleteProgress > 0.5 ? '#86efac' : colors.accent, fontSize: 22}}>{testCompleteProgress > 0.5 ? '✓' : '◌'}</span>
              <span style={{color: colors.text, fontSize: 18, fontWeight: 760}}>{testCompleteProgress > 0.5 ? 'Verification complete' : 'Validating changes'}</span>
            </div>
          </MockWindow>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(7, 11, 23, 0.98)',
            border: '1px solid rgba(134, 239, 172, 0.62)',
            borderRadius: 24,
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.52), 0 0 42px rgba(134, 239, 172, 0.13)',
            display: 'grid',
            gap: 38,
            gridTemplateColumns: '240px minmax(0, 1fr)',
            left: '50%',
            minHeight: 202,
            opacity: finalProgress,
            padding: '30px 46px',
            position: 'absolute',
            top: '55%',
            transform: `translate(-50%, -50%) scale(${0.92 + finalScale * 0.08})`,
            width: 1080,
            zIndex: 5,
          }}
        >
          <div style={{borderRight: `1px solid ${colors.line}`, paddingRight: 38, textAlign: 'center'}}>
            <div style={{color: '#86efac', fontSize: 18, fontWeight: 820, letterSpacing: 2}}>第二层能力</div>
            <div style={{fontSize: 46, fontWeight: 920, marginTop: 10}}>执行</div>
          </div>
          <div>
            <div style={{color: colors.muted, fontSize: 23, fontWeight: 720}}>不只给出“应该怎么改”</div>
            <div style={{fontSize: 39, fontWeight: 920, marginTop: 10}}>把一个连续任务推进到可验证的结果</div>
            <div style={{color: '#86efac', fontSize: 22, fontWeight: 760, marginTop: 10}}>Todo → Done</div>
          </div>
        </div>
      </div>
    </SceneContainer>
  );
};
