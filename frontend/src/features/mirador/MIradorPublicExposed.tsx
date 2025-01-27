import { useEffect, useRef, useState } from "react";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./style/mirador.css";
import { Grid } from "@mui/material";
import LocalStorageAdapter from "mirador-annotation-editor/src/annotationAdapter/LocalStorageAdapter.js";
import Mirador from "mirador";

export const MiradorPublicExposed = () => {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [viewer, setViewer] = useState<any>(undefined);

  useEffect(() => {
    const fetchAndSetupMirador = async () => {
      const url = window.location.href;
      let updatedUrl = "";
      const miradorIndex = url.indexOf("/mirador/");
      if (miradorIndex !== -1) {
        const newPath = url.substring(miradorIndex + 8);
        updatedUrl = `${import.meta.env.VITE_CADDY_URL}/${newPath}`;
      }
      try {
        const response = await fetch(updatedUrl, { method: "GET" });
        const miradorWorkspace = await response.json();
        if (viewerRef.current) {
          const config = {
            id: viewerRef.current.id,
            annotation: {
              adapter: (canvasId: any) =>
                new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
              exportLocalStorageAnnotations: false, // display annotation JSON export button
            },
          };

          let loadingMiradorViewer;
          // First displaying of the viewer
          if (!viewer) {
            loadingMiradorViewer = Mirador.viewer(config, []);
          }

          if (loadingMiradorViewer && miradorWorkspace) {
            // Load state only if it is not empty
            loadingMiradorViewer.store.dispatch(
              Mirador.actions.importMiradorState(miradorWorkspace.workspace),
            );
          }
          setViewer(loadingMiradorViewer);
        }
      } catch (error) {
        console.error("Error fetching mirador workspace:", error);
      }
    };

    fetchAndSetupMirador();
  }, []);

  return (
    <Grid item>
      <div ref={viewerRef} id="mirador"></div>
    </Grid>
  );
};
