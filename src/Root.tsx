import {Composition} from 'remotion';
import {TemplateVideo} from './TemplateVideo';
import {MotionCapabilityDemo, MotionTransitionDemo, motionDemoDuration, motionTransitionDemoDuration} from './scenes/MotionCapabilityDemo';

export const Root = () => {
  return (
    <>
      <Composition id="motion-components-template" component={MotionCapabilityDemo}
        durationInFrames={motionDemoDuration} fps={30} width={1920} height={1080} />
      <Composition id="motion-transition-template" component={MotionTransitionDemo}
        durationInFrames={motionTransitionDemoDuration} fps={30} width={1920} height={1080} />
      <Composition
        id="video-production-template"
        component={TemplateVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
