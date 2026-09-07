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
import {ClaudeCodeFirstRunVideo} from './videos/claude-code-first-run/ClaudeCodeFirstRunVideo';
import {videoConfig as claudeCodeFirstRunConfig} from './videos/claude-code-first-run/video.config';
import {ClaudeCodeHowItWorksVideo} from './videos/claude-code-how-it-works/ClaudeCodeHowItWorksVideo';
import {videoConfig as claudeCodeHowItWorksConfig} from './videos/claude-code-how-it-works/video.config';
import {VscodeVideo} from './videos/vscode/VscodeVideo';
import {videoConfig as vscodeConfig} from './videos/vscode/video.config';
import {WhatIsCodexVideo} from './videos/01-what-is-codex/WhatIsCodexVideo';
import {videoConfig as whatIsCodexConfig} from './videos/01-what-is-codex/video.config';
import {CoreConceptsVideo} from './videos/02-core-concepts/CoreConceptsVideo';
import {videoConfig as coreConceptsConfig} from './videos/02-core-concepts/video.config';
import {ProjectInitVideo} from './videos/project-init/ProjectInitVideo';
import {videoConfig as projectInitConfig} from './videos/project-init/video.config';
import {InstallVideo} from './videos/03-install/InstallVideo';
import {videoConfig as installConfig} from './videos/03-install/video.config';
import {PricingVideo} from './videos/04-pricing/PricingVideo';
import {videoConfig as pricingConfig} from './videos/04-pricing/video.config';
import {ThirdPartyModelsVideo} from './videos/05-third-party-models/ThirdPartyModelsVideo';
import {videoConfig as thirdPartyModelsConfig} from './videos/05-third-party-models/video.config';

export const Root = () => {
  return (
    <>
      <Composition
        id={whatIsCodexConfig.slug}
        component={WhatIsCodexVideo}
        durationInFrames={getTotalDurationFrames(whatIsCodexConfig)}
        fps={whatIsCodexConfig.fps}
        width={whatIsCodexConfig.width}
        height={whatIsCodexConfig.height}
      />
      <Composition
        id={claudeCodeApiConfig.slug}
        component={ClaudeCodeApiConfigVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeApiConfig)}
        fps={claudeCodeApiConfig.fps}
        width={claudeCodeApiConfig.width}
        height={claudeCodeApiConfig.height}
      />
      <Composition
        id={claudeCodeFirstRunConfig.slug}
        component={ClaudeCodeFirstRunVideo}
        durationInFrames={getTotalDurationFrames(claudeCodeFirstRunConfig)}
        fps={claudeCodeFirstRunConfig.fps}
        width={claudeCodeFirstRunConfig.width}
        height={claudeCodeFirstRunConfig.height}
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
      <Composition
        id={vscodeConfig.slug}
        component={VscodeVideo}
        durationInFrames={getTotalDurationFrames(vscodeConfig)}
        fps={vscodeConfig.fps}
        width={vscodeConfig.width}
        height={vscodeConfig.height}
      />
      <Composition
        id={coreConceptsConfig.slug}
        component={CoreConceptsVideo}
        durationInFrames={getTotalDurationFrames(coreConceptsConfig)}
        fps={coreConceptsConfig.fps}
        width={coreConceptsConfig.width}
        height={coreConceptsConfig.height}
      />
      <Composition
        id={projectInitConfig.slug}
        component={ProjectInitVideo}
        durationInFrames={getTotalDurationFrames(projectInitConfig)}
        fps={projectInitConfig.fps}
        width={projectInitConfig.width}
        height={projectInitConfig.height}
      />
      <Composition
        id={installConfig.slug}
        component={InstallVideo}
        durationInFrames={getTotalDurationFrames(installConfig)}
        fps={installConfig.fps}
        width={installConfig.width}
        height={installConfig.height}
      />
      <Composition
        id={pricingConfig.slug}
        component={PricingVideo}
        durationInFrames={getTotalDurationFrames(pricingConfig)}
        fps={pricingConfig.fps}
        width={pricingConfig.width}
        height={pricingConfig.height}
      />
      <Composition
        id={thirdPartyModelsConfig.slug}
        component={ThirdPartyModelsVideo}
        durationInFrames={getTotalDurationFrames(thirdPartyModelsConfig)}
        fps={thirdPartyModelsConfig.fps}
        width={thirdPartyModelsConfig.width}
        height={thirdPartyModelsConfig.height}
      />
    </>
  );
};
