import {
  requireWorkflowDefinition,
  workflowStageDefinitions,
  workflowStages,
} from "./workflows/registry.mjs";
import { resolveStyleId } from "./styles.mjs";

function commandFor(command, slug, stage = null) {
  const suffix = stage ? ` ${stage}` : "";
  return `node harness/src/cli.mjs ${command} ${slug}${suffix}`;
}

export function buildProjectPlan(project, targetOverride = null) {
  const { config, state } = project;
  const workflow = requireWorkflowDefinition(config);
  const stagesForWorkflow = workflowStages(project);
  const definitionsForWorkflow = workflowStageDefinitions(project);

  const target = targetOverride ?? config.target;
  const targetIndex = stagesForWorkflow.indexOf(target);
  if (targetIndex < 0) {
    throw new Error(`Unknown target stage: ${target}`);
  }

  const stages = stagesForWorkflow.slice(0, targetIndex + 1).map((stage) => {
    const definition = definitionsForWorkflow[stage];
    const item = state.stages[stage];
    const inScope = stagesForWorkflow.indexOf(stage) <= targetIndex;
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
      workflow: config.workflow ?? workflow.id,
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
