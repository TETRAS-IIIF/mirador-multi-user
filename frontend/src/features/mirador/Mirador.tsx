import {
  Dispatch,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Mirador from 'mirador';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import IMiradorState from './interface/IState.ts';
import IState from './interface/IState.ts';
import './style/mirador.css';
import { Project } from '../projects/types/types.ts';
import MMUAdapter from './adapter/MMUAdapter';
import ManifestListTools from 'mirador-mltools-plugin-mmu';
import { User } from '../auth/types/types.ts';
import annotationPlugins from 'mirador-annotation-editor';

interface MiradorViewerHandle {
  setViewer: () => IState;
  saveProject: () => void;
}

interface MiradorViewerProps {
  HandleSetIsRunning: () => void;
  language: string;
  miradorState: IMiradorState;
  project: Project;
  saveMiradorState: (state: IMiradorState, title: string) => void;
  setMiradorState: (state: IState) => void;
  setViewer: Dispatch<any>;
  viewer: any;
  // Mirador use Plugin that allow to change state of Mirador
  useEditionPlugins: boolean;
  user: User;
}

const MiradorViewer = forwardRef<MiradorViewerHandle, MiradorViewerProps>(
  (props, ref) => {
    const {
      miradorState,
      saveMiradorState,
      project,
      setMiradorState,
      setViewer,
      HandleSetIsRunning,
      language,
      useEditionPlugins,
      user,
    } = props;

    const viewerRef = useRef<HTMLDivElement | null>(null);
    const [miradorViewer, setMiradorViewer] = useState<any>(undefined);
    useImperativeHandle(ref, () => ({
      saveProject: () => {
        console.log(miradorViewer.store.getState());
      },
      setViewer: () => {
        const viewer: IState = miradorViewer.store.getState();
        setViewer(viewer);
        return viewer;
      },
    }));

    useEffect(() => {
      if (viewerRef.current) {
        HandleSetIsRunning();
        const config = {
          id: viewerRef.current.id,
          tags: project.tags,
          annotation: {
            adapter: (canvasId: string) =>
              new MMUAdapter(
                project.id,
                `${canvasId}/annotationPage`,
                user.name,
              ),
            // adapter: (canvasId : string) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`),
            exportLocalStorageAnnotations: false,
            commentTemplates: project.noteTemplate ?? [],
            tagsSuggestions: project.tags ?? [],
          },
          annotations: {
            htmlSanitizationRuleSet: 'liberal',
          },
          workspace: {
            isWorkspaceAddVisible: true,
            removeResourceButton: true,
          },
          language: language,
          projectId: project.id,
          themes: {
            light: {
              typography: {
                formSectionTitle: {
                  color: 'rgb(25, 103, 210);',
                },
              },
            },
            dark: {
              typography: {
                formSectionTitle: {
                  color: 'rgb(25, 103, 210);',
                },
              },
            },
          },
        };

        let loadingMiradorViewer;
        // First displaying of the viewer
        if (!miradorViewer) {
          console.debug(annotationPlugins);
          console.debug(ManifestListTools);
          if (useEditionPlugins) {
            loadingMiradorViewer = Mirador.viewer(config, [
              ...ManifestListTools,
            ]);
          } else {
            loadingMiradorViewer = Mirador.viewer(config);
          }
        }
        if (!miradorState) {
          saveMiradorState(
            loadingMiradorViewer.store.getState(),
            project.title,
          );
        }

        // Load state only if it is not empty
        if (loadingMiradorViewer && project.id && miradorState) {
          const configWithAdapter = {
            ...miradorState.config,
            annotation: {
              ...miradorState.config.annotation,
              adapter: (canvasId: string) =>
                new MMUAdapter(
                  project.id,
                  `${canvasId}/annotationPage`,
                  user.name,
                ),
              commentTemplates: project.noteTemplate,
              tagsSuggestions: project.tags,
            },
          };
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
        setViewer(loadingMiradorViewer);
        setMiradorState(loadingMiradorViewer.store.getState());
      }
    }, []);

    return (
      <div
        ref={viewerRef}
        id="mirador"
        style={{ height: '100%', padding: 0, margin: 0, overflow: 'hidden' }}
      ></div>
    );
  },
);

export default MiradorViewer;
