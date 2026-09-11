import {Composition} from 'remotion';
import {TemplateVideo} from './TemplateVideo';

export const Root = () => {
  return (
    <Composition
      id="video-production-template"
      component={TemplateVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
