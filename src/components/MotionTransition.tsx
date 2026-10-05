import type {ReactNode} from 'react';
import {linearTiming, springTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';

/** Local two-view transition. Durations include the overlap; do not shift an audio timeline. */
export const MotionTransition = ({before, after, beforeFrames, afterFrames, overlapFrames,
  presentation = 'fade', timing = 'linear'}: {
  before: ReactNode; after: ReactNode; beforeFrames: number; afterFrames: number;
  overlapFrames: number; presentation?: 'fade' | 'wipe'; timing?: 'linear' | 'spring';
}) => {
  transitionDuration(beforeFrames, afterFrames, overlapFrames);
  const transitionTiming = timing === 'spring' ? springTiming({durationInFrames: overlapFrames, config: {damping: 200}})
    : linearTiming({durationInFrames: overlapFrames});
  return <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={beforeFrames}>{before}</TransitionSeries.Sequence>
    {presentation === 'wipe'
      ? <TransitionSeries.Transition presentation={wipe()} timing={transitionTiming} />
      : <TransitionSeries.Transition presentation={fade()} timing={transitionTiming} />}
    <TransitionSeries.Sequence durationInFrames={afterFrames}>{after}</TransitionSeries.Sequence>
  </TransitionSeries>;
};

export const transitionDuration = (beforeFrames: number, afterFrames: number, overlapFrames: number) => {
  if (![beforeFrames, afterFrames, overlapFrames].every(n => Number.isInteger(n) && n > 0)
    || overlapFrames >= Math.min(beforeFrames, afterFrames)) {
    throw new Error('转场帧数须为正整数，重叠须小于前后视图长度');
  }
  return beforeFrames + afterFrames - overlapFrames;
};
