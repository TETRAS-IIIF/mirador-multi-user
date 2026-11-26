import {
  Dispatch,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import Mirador from 'mirador';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './style/mirador.css';
import type IMiradorState from './interface/IState';
import type IState from './interface/IState';
import type { Project } from '../projects/types/types';
import type { User } from '../auth/types/types';
import MMUAdapter from './adapter/MMUAdapter';
import { getMiradorViewer, MiradorMode } from './MiradorUtils.ts';
import { DRAFT_MARKER, getShowDrafts } from '../assistant/draftsState.ts';

export type MiradorViewerHandle = {
  setViewer: () => IState;
  saveProject: () => void;
};

export interface MiradorViewerProps {
  HandleSetIsRunning: () => void;
  language: string;
  miradorState: IMiradorState;
  project: Project;
  saveMiradorState: (state: IMiradorState, title: string) => void;
  setMiradorState: (state: IState) => void;
  setViewer: Dispatch<any>;
  viewer: any;
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

    const hostRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);
    const rid = useId();
    const containerId = useRef(`mirador-${rid.replace(/[:]/g, '-')}`);

    const [instance, setInstance] = useState<any>(undefined);

    useImperativeHandle(
      ref,
      () => ({
        saveProject: () => {
          if (instance?.store) console.log(instance.store.getState());
        },
        setViewer: () => {
          const v: IState = instance.store.getState();
          setViewer(v);
          return v;
        },
      }),
      [instance, setViewer],
    );

    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      if (!hostRef.current) return;

      hostRef.current.id = containerId.current;
      HandleSetIsRunning();

      // init viewer config
      const viewer = getMiradorViewer(
        useEditionPlugins
          ? MiradorMode.WORKSPACE_EDITOR
          : MiradorMode.WORKSPACE_READER,
        containerId.current,
        language,
        { project, user },
      );

      if (!miradorState) {
        saveMiradorState(viewer.store.getState(), project.title);
      } else if (project.id) {
        // we overide existing config with latest database values for annotation adapter, comment template and tags suggestions
        // TODO Why we dont use useEditionPlugins ?
        const cfgWithAdapter = {
          ...miradorState.config,
          annotation: {
            ...miradorState.config.annotation,
            adapter: (canvasId: string) =>
              new MMUAdapter(
                project.id,
                `${canvasId}/annotationPage`,
                user.name,
                { showDrafts: () => getShowDrafts(project.id) },
              ),
            commentTemplates: project.noteTemplate,
            tagsSuggestions: project.tags,
          },
          annotations: {
            ...miradorState.config.annotations,
            draftMarker: DRAFT_MARKER,
          },
          projectId: project.id,
        };
        viewer.store.dispatch(
          Mirador.actions.importMiradorState({
            ...miradorState,
            config: cfgWithAdapter,
          }),
        );
      }

      setInstance(viewer);
      setViewer(viewer);
      setMiradorState(viewer.store.getState());

      const containerElementId = containerId.current;
      return () => {
        initializedRef.current = false;
        try {
          if (viewer?.unmount) viewer.unmount();
        } catch (error) {
          console.error(error);
        }
        const el = document.getElementById(containerElementId);
        if (el) el.replaceChildren();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Mirador is created once per mount; later changes go through its store
    }, []);

    return (
      <div
        ref={hostRef}
        id="mirador"
        style={{ height: '100%', padding: 0, margin: 0, overflow: 'hidden' }}
      />
    );
  },
);

export default MiradorViewer;
