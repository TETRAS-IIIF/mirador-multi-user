// src/mirador.d.ts — ambient declarations, no imports/exports at top level.

declare module 'mirador' {
  const _default: any;
  export default _default;
  // Named exports used by MMU (actions, selectors, OSD references).
  export const addCompanionWindow: (
    windowId: string,
    payload: Record<string, unknown>,
  ) => unknown;
  export const hoverAnnotation: (
    windowId: string,
    annotationIds: string[],
  ) => unknown;
  export const selectAnnotation: (
    windowId: string,
    annotationId: string,
  ) => unknown;
  export const receiveAnnotation: (
    targetId: string,
    annotationId: string,
    annotationJson: unknown,
  ) => unknown;
  export const setCanvas: (windowId: string, canvasId: string) => unknown;
  export const getConfig: (state: unknown) => Record<string, unknown>;
  export const getVisibleCanvasIds: (
    state: unknown,
    props: { windowId: string },
  ) => string[];
  export const OSDReferences: {
    get: (windowId: string) => { current?: unknown } | undefined;
  };
}

declare module 'mirador/*' {
  const _default: any;
  export default _default;
}

declare module 'mirador-mltools-plugin-mmu' {
  const _default: any;
  export default _default;
}
declare module 'mirador-mltools-plugin-mmu/*' {
  const _default: any;
  export default _default;
}

declare module 'mirador-image-tools/*' {
  const _default: any;
  export default _default;
}

declare module 'mirador/dist/*' {
  const _default: any;
  export default _default;
}
