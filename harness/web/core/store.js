const defaultState = {
  route: { name: "projects", slug: null },
  projects: [],
  series: [],
  selectedSlugs: [],
  activeProjectSlug: null,
  activeProjectWorkspace: null,
  requestState: {},
};

function cloneState(state) {
  return {
    ...state,
    route: { ...state.route },
    selectedSlugs: [...state.selectedSlugs],
    requestState: { ...state.requestState },
  };
}

export function createStore(initialState = {}) {
  let state = cloneState({ ...defaultState, ...initialState });
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(update) {
    const next = typeof update === "function" ? update(state) : update;
    state = cloneState({ ...state, ...next });
    for (const listener of listeners) listener(state);
    return state;
  }

  return {
    getState,
    setState,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      return setState(defaultState);
    },
  };
}

export const appStore = createStore();
