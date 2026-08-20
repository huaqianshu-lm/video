import {Composition} from 'remotion';
import {getTotalDurationFrames} from './lib/timing';
import {ClaudeCodeApiConfigVideo} from './videos/claude-code-api-config/ClaudeCodeApiConfigVideo';
import {videoConfig as claudeCodeApiConfig} from './videos/claude-code-api-config/video.config';
import {ClaudeCodeInstallVideo} from './videos/claude-code-install/ClaudeCodeInstallVideo';
import {videoConfig as claudeCodeInstallConfig} from './videos/claude-code-install/video.config';
import {ClaudeCodeThirdPartyModelsVideo} from './videos/claude-code-third-party-models/ClaudeCodeThirdPartyModelsVideo';
import {videoConfig as claudeCodeThirdPartyModelsConfig} from './videos/claude-code-third-party-models/video.config';
import {ClaudeCodeCodingPlanVideo} from './videos/claude-code-coding-plan/ClaudeCodeCodingPlanVideo';
import {videoConfig as claudeCodeCodingPlanConfig} from './videos/claude-code-coding-plan/video.config';
import {ClaudeCodeWhatIsVideo} from './videos/claude-code-what-is/ClaudeCodeWhatIsVideo';
import {ClaudeCodeWhatIsVideo14} from './videos/claude-code-what-is/ClaudeCodeWhatIsVideo14';
import {videoConfig} from './videos/claude-code-what-is/video.config';
import {getVideo14TotalDurationFrames, video14Config} from './videos/claude-code-what-is/video14.config';
import {ClaudeCodeHowItWorksVideo} from './videos/claude-code-how-it-works/ClaudeCodeHowItWorksVideo';
import {videoConfig as claudeCodeHowItWorksConfig} from './videos/claude-code-how-it-works/video.config';

export const Root = () => {
  return (
    <>
      <Composition
        id={claudeCodeApiConfig.slug}
        component={ClaudeCodeApiConfigVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeApiConfig)}
        fps={claudeCodeApiConfig.fps}
        width={claudeCodeApiConfig.width}
        height={claudeCodeApiConfig.height}
      />
      <Composition
        id={claudeCodeInstallConfig.slug}
        component={ClaudeCodeInstallVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeInstallConfig)}
        fps={claudeCodeInstallConfig.fps}
        width={claudeCodeInstallConfig.width}
        height={claudeCodeInstallConfig.height}
      />
      <Composition
        id={claudeCodeThirdPartyModelsConfig.slug}
        component={ClaudeCodeThirdPartyModelsVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeThirdPartyModelsConfig)}
        fps={claudeCodeThirdPartyModelsConfig.fps}
        width={claudeCodeThirdPartyModelsConfig.width}
        height={claudeCodeThirdPartyModelsConfig.height}
      />
      <Composition
        id={claudeCodeCodingPlanConfig.slug}
        component={ClaudeCodeCodingPlanVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeCodingPlanConfig)}
        fps={claudeCodeCodingPlanConfig.fps}
        width={claudeCodeCodingPlanConfig.width}
        height={claudeCodeCodingPlanConfig.height}
      />
      <Composition
        id={`${videoConfig.slug}-legacy`}
        component={ClaudeCodeWhatIsVideo}
        durationInFrames={getTotalDurationFrames(videoConfig)}
        fps={videoConfig.fps}
        width={videoConfig.width}
        height={videoConfig.height}
      />
      <Composition
        id={video14Config.slug}
        component={ClaudeCodeWhatIsVideo14}
        durationInFrames={getVideo14TotalDurationFrames()}
        fps={video14Config.fps}
        width={video14Config.width}
        height={video14Config.height}
      />
      <Composition
        id={claudeCodeHowItWorksConfig.slug}
        component={ClaudeCodeHowItWorksVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeHowItWorksConfig)}
        fps={claudeCodeHowItWorksConfig.fps}
        width={claudeCodeHowItWorksConfig.width}
        height={claudeCodeHowItWorksConfig.height}
      />
    </>
  );
};
