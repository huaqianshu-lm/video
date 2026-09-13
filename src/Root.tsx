import {Composition} from 'remotion';
import {TemplateVideo} from './TemplateVideo';
import {DesktopAppVideo} from './videos/07-desktop-app/DesktopAppVideo';
import {videoConfig} from './videos/07-desktop-app/video.config';
import {DesktopVideo} from './videos/desktop/DesktopVideo';
import {videoConfig as desktopVideoConfig} from './videos/desktop/video.config';
import {getTotalDurationFrames} from './lib/timing';

export const Root = () => {
  return (
    <>
      <Composition
        id="video-production-template"
        component={TemplateVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="07-desktop-app"
        component={DesktopAppVideo}
        durationInFrames={getTotalDurationFrames(videoConfig)}
        fps={videoConfig.fps}
        width={videoConfig.width}
        height={videoConfig.height}
      />
      <Composition
        id="desktop"
        component={DesktopVideo}
        durationInFrames={getTotalDurationFrames(desktopVideoConfig)}
        fps={desktopVideoConfig.fps}
        width={desktopVideoConfig.width}
        height={desktopVideoConfig.height}
      />
    </>
  );
};
