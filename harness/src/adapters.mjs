export function createMockAdapter({ failOnce = false } = {}) {
  let shouldFail = failOnce;
  const calls = [];

  return {
    calls,
    run({ stage, project }) {
      calls.push({ stage, slug: project.state.slug });
      if (shouldFail) {
        shouldFail = false;
        throw new Error(`Mock adapter failure for ${stage}`);
      }
      return {
        outputs: [{ kind: "mock", stage, slug: project.state.slug }],
      };
    },
  };
}
