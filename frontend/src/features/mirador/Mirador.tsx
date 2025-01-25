import { Dispatch, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Mirador from 'mirador';
import miradorAnnotationEditorVideo
  from 'mirador-annotation-editor-video/src/plugin/MiradorAnnotationEditionVideoPlugin';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import IMiradorState from './interface/IState.ts';
import IState from './interface/IState.ts';
import './style/mirador.css'
import { Project } from '../projects/types/types.ts';
import MMUAdapter from './adapter/MMUAdapter';
import ManifestListTools from 'mirador-mltools-plugin-mmu/es/index.js';

interface MiradorViewerHandle {
  setViewer: () => IState;
  saveProject: () => void;
}

interface MiradorViewerProps {
  HandleSetIsRunning: () => void
  language: string
  miradorState: IMiradorState,
  project: Project
  saveMiradorState: (state: IMiradorState, title: string) => void,
  setMiradorState: (state: IState) => void
  setViewer: Dispatch<any>
  viewer: any
}

const MiradorViewer = forwardRef<MiradorViewerHandle, MiradorViewerProps>((props, ref) => {
  const {
    miradorState,
    saveMiradorState,
    project,
    setMiradorState,
    setViewer,
    HandleSetIsRunning,
    language
  } = props;

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [miradorViewer, setMiradorViewer] = useState<any>(undefined);
  useImperativeHandle(ref, () => ({
    saveProject: () => {
      console.log(miradorViewer.store.getState())
    },
    setViewer: () => {
      const viewer: IState = miradorViewer.store.getState()
      setViewer(viewer);
      return viewer
    },
  }));

  useEffect(() => {
    if (viewerRef.current) {
      HandleSetIsRunning()
      const config = {
        id: viewerRef.current.id,
        annotation: {
          adapter: (canvasId: string) => new MMUAdapter(project.id, `${canvasId}/annotationPage`),
          // adapter: (canvasId : string) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
          exportLocalStorageAnnotations: false,
        },
        workspace: {
          isWorkspaceAddVisible: true,
          removeResourceButton: true,
        },
        language: language,
        projectId: project.id,
      };


      let loadingMiradorViewer;
      // First displaying of the viewer
      if (!miradorViewer) {
        loadingMiradorViewer = Mirador.viewer(config, [
          ...miradorAnnotationEditorVideo, ...ManifestListTools]);
      }
      if (!miradorState) {
        saveMiradorState(loadingMiradorViewer.store.getState(), project.title);
      }


      // Load state only if it is not empty
      if (loadingMiradorViewer && project.id && miradorState) {
        const configWithAdapter = {
          ...miradorState.config,
          annotation: {
            ...miradorState.config.annotation,
            adapter: (canvasId: string) => new MMUAdapter(project.id, `${canvasId}/annotationPage`),
          },
        }
        const miradorStateWithAdapter = {
          ...miradorState,
          config: {
            ...configWithAdapter,
          },
        };
        loadingMiradorViewer.store.dispatch(
          Mirador.actions.importMiradorState(miradorStateWithAdapter),
        );
      }

      setMiradorViewer(loadingMiradorViewer);
      setViewer(loadingMiradorViewer)
      setMiradorState(loadingMiradorViewer.store.getState());
    }
  }, []);


  return (
    <div ref={viewerRef} id="mirador" style={{ height: '100%', padding: 0, margin: 0, overflow: 'hidden' }}></div>
  )
});

export default MiradorViewer;
