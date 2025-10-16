// src/mirador.d.ts — ambient declarations, no imports/exports at top level.

declare module 'mirador' {
  const _default: any;
  export default _default;
}

declare module 'mirador/*' {
  const _default: any;
  export default _default;
}

declare module 'mirador-annotation-editor' {
  export const miradorAnnotationPlugin: any;
  export const externalStorageAnnotationPlugin: any;
  export const canvasAnnotationsPlugin: any;
  export const annotationCreationCompanionWindowPlugin: any;
  export const windowSideBarButtonsPlugin: any;
  const annotationPlugins: any[]; // default export
  export default annotationPlugins;
}
declare module 'mirador-annotation-editor/*' {
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

declare module 'mirador/dist/*' {
  const _default: any;
  export default _default;
}
