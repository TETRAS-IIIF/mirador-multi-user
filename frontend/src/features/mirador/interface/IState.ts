//TODO: define proper interface for Workspace

export default interface IState {
  store?: {
    getState: () => any;
  };
  catalog: any[];
  companionWindows: {};
  config: {
    annotation: {};
  };
  elasticLayout: {};
  layers: {};
  manifests: {};
  viewers: {};
  windows: {};
  workspace: {};
}
