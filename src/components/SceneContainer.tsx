import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';

const background =
  'radial-gradient(circle at 50% 22%, rgba(93, 135, 255, 0.24), transparent 34%), linear-gradient(160deg, #060711 0%, #0c1020 54%, #020307 100%)';

export const colors = {
  accent: '#7dd3fc',
  accentStrong: '#a78bfa',
  card: 'rgba(255, 255, 255, 0.075)',
  cardStrong: 'rgba(125, 211, 252, 0.16)',
  line: 'rgba(255, 255, 255, 0.16)',
  muted: 'rgba(255, 255, 255, 0.68)',
  text: '#f8fafc',
};

type SceneContainerProps = {
  children: ReactNode;
};

export const SceneContainer = ({children}: SceneContainerProps) => {
  return (
    <AbsoluteFill
      style={{
        background,
        color: colors.text,
        fontFamily:
          'Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          bottom: 180,
          left: 92,
          position: 'absolute',
          right: 92,
          top: 120,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
