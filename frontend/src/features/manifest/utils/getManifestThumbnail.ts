import ThumbnailFactory from "mirador/dist/es/src/lib/ThumbnailFactory.js";
import MiradorManifest from "mirador/dist/es/src/lib/MiradorManifest.js";

export const getManifestThumbnail = (resource: any): any | undefined => {
  //TODO : Fix logic to return thumbnail when getThumbnail is null
  const thumbnail = resource.getThumbnail();

  if (thumbnail) {
    return thumbnail;
  }

  if (resource.isCollection()) {
    const firstManifest = resource.getManifests()[0];
    if (firstManifest) return getManifestThumbnail(firstManifest);

    return undefined;
  }

  if (resource.isManifest()) {
    const miradorManifest = new MiradorManifest(resource.__jsonld);
    const canvases = miradorManifest.manifest.items; // Canvases or sequences are here

    if (canvases) {
      const image = ThumbnailFactory.getPreferredImage(canvases[0]);
      if (image) return getManifestThumbnail(image);
    }

    return undefined;
  }

  if (resource.isCanvas()) {
    const image = ThumbnailFactory.getPreferredImage(resource);
    if (image) return getManifestThumbnail(image);

    return undefined;
  }

  if (resource.getType() === "image") {
    return resource;
  }
};
