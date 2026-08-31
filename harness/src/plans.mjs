import { STAGE_DEFINITIONS, STAGES, getWorkflowDefinition } from "./stages.mjs";
import { resolveStyleId } from "./styles.mjs";

function commandFor(command, slug, stage = null) {
  const suffix = stage ? ` ${stage}` : "";
  return `node harness/src/cli.mjs ${command} ${slug}${suffix}`;
}

export function buildProjectPlan(project, targetOverride = null) {
  const { config, state } = project;
  const workflow = getWorkflowDefinition(config.workflow);
  if (!workflow) {
    throw new Error(`Unknown workflow: ${config.workflow}`);
  }

  const target = targetOverride ?? config.target;
  const targetIndex = STAGES.indexOf(target);
  if (targetIndex < 0) {
    throw new Error(`Unknown target stage: ${target}`);
  }

  const stages = STAGES.slice(0, targetIndex + 1).map((stage) => {
    const definition = STAGE_DEFINITIONS[stage];
    const item = state.stages[stage];
    const inScope = STAGES.indexOf(stage) <= targetIndex;
    return {
      stage,
      order: definition.order,
      status: item.status,
      objective: definition.contract.objective,
      executor: definition.contract.executor,
      requiresApproval: definition.requiresApproval,
      requiresAdapter: definition.requiresAdapter,
      fallbackStage: definition.contract.fallbackStage,
      nextStage: definition.nextStage,
      inScope,
      commands: {
        validate: commandFor("validate", state.slug, stage),
        execute: commandFor("run", state.slug, stage),
      },
    };
  });

  return {
    schemaVersion: 1,
    kind: "video-stage-plan",
    harnessVersion: config.harnessVersion,
    project: {
      slug: state.slug,
      workflow: config.workflow,
      workflowVersion: config.workflowVersion,
      style: resolveStyleId(config, state.slug),
      configuredTarget: config.target,
      currentStage: state.currentStage,
    },
    target: {
      stage: target,
      order: targetIndex,
      overridden: targetOverride !== null,
    },
    stages,
    commands: {
      next: commandFor("next", state.slug),
      context: commandFor("context", state.slug),
    },
  };
}
