const viewer = () => ({
  store: {
    dispatch: () => undefined,
    getState: () => ({}),
  },
  unmount: () => undefined,
});

const actions = {
  importMiradorState: (state: unknown) => state,
};

const Mirador = {
  viewer,
  actions,
};

export { viewer, actions };
export default Mirador;

