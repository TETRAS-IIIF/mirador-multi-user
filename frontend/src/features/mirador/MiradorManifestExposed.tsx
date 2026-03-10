import { useEffect, useRef, useState } from 'react';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './style/mirador.css';
import { Grid } from '@mui/material';
import Mirador from 'mirador';
import {
  getDefaultMiradorManifestConfig,
  getPlugins,
  MiradorMode,
} from './MiradorUtils';

export const MiradorManifestExposed = () => {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<any>(undefined);

  const loadMirador = (manifestURL: string) => {
    if (viewerRef.current) {
      let loadingMiradorViewer;

      // First displaying of the viewer
      if (!viewer) {
        loadingMiradorViewer = Mirador.viewer(
          getDefaultMiradorManifestConfig(viewerRef.current.id, manifestURL),
          [...getPlugins(MiradorMode.READER)],
        );
      }
      setViewer(loadingMiradorViewer);
    }
  };

  useEffect(() => {
    const url = window.location.href;
    const miradorIndex = url.indexOf('/manifest/');
    if (miradorIndex !== -1) {
      const urlSuffix = url.substring(miradorIndex + 10); // 10 is the length of '/manifest/'

      // TODO This code is a temporary solution
      // This code must be improved also than AllManifests.tsx
      if (urlSuffix.startsWith('https')) {
        // In this case it's a manifest linked to MMU
        loadMirador(urlSuffix);
      } else {
        // In this case it's a manifest hosted on MMU (created or uplaoded)
        const manifestURL = `${import.meta.env.VITE_CADDY_URL}/${urlSuffix}`;
        loadMirador(manifestURL);
      }
    }
  }, []);

  return (
    <Grid>
      <div ref={viewerRef} id="mirador"></div>
    </Grid>
  );
};
