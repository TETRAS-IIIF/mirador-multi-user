//TODO: define proper interface for Workspace

interface IWindow {
  canvasId?: string;
  [key: string]: any;
}

export default interface IState {
  store?: {
    getState: () => any;
  };
  catalog: any[];
  companionWindows: Record<string, any>;
  config: {
    annotation: Record<string, any>;
  };
  elasticLayout: Record<string, any>;
  layers: Record<string, any>;
  manifests: Record<string, any>;
  viewers: Record<string, any>;
  windows: Record<string, IWindow>;
  workspace: Record<string, any>;
}
