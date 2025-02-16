// mirador.d.ts
declare module "mirador" {
  const Mirador: any;
  export default Mirador;
}

declare module "mirador-annotation-editor" {
  const annotationPlugins: any;
  export default annotationPlugins;
}

declare module "mirador-annotation-editor/src/annotationAdapter/LocalStorageAdapter.js" {
  const LocalStorageAdapter: any;
  export default LocalStorageAdapter;
}

declare module "mirador-annotation-editor/src/index.js" {
  const miradorAnnotationEditor: any;
  export default miradorAnnotationEditor;
}

declare module "mirador-mltools-plugin-mmu/es/index.js" {
  const ManifestListTools: any;
  export default ManifestListTools;
}

//TODO : is currently used in getManifestThumbnail but may be useless
declare module "mirador/dist/es/src/lib/ThumbnailFactory.js" {
  const ThumbnailFactory: any;
  export default ThumbnailFactory;
}
//TODO : is currently used in getManifestThumbnail but may be useless
declare module "mirador/dist/es/src/lib/MiradorManifest.js" {
  const MiradorManifest: any;
  export default MiradorManifest;
}
