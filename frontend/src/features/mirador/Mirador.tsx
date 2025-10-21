// MiradorViewer.tsx
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
import ManifestListTools from 'mirador-mltools-plugin-mmu';
import annotationPlugins from 'mirador-annotation-editor';

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

      const baseConfig = {
        id: containerId.current,
        tags: project.tags,
        annotation: {
          adapter: (canvasId: string) =>
            new MMUAdapter(project.id, `${canvasId}/annotationPage`, user.name),
          exportLocalStorageAnnotations: false,
          commentTemplates: project.noteTemplate ?? [],
          tagsSuggestions: project.tags ?? [],
        },
        annotations: { htmlSanitizationRuleSet: 'liberal' },
        workspace: { isWorkspaceAddVisible: true, removeResourceButton: true },
        language,
        projectId: project.id,
        themes: {
          light: {
            typography: { formSectionTitle: { color: 'rgb(25, 103, 210);' } },
          },
          dark: {
            typography: { formSectionTitle: { color: 'rgb(25, 103, 210);' } },
          },
        },
      };

      const plugins = useEditionPlugins
        ? [...ManifestListTools, annotationPlugins]
        : undefined;
      const viewer = plugins
        ? Mirador.viewer(baseConfig, plugins)
        : Mirador.viewer(baseConfig);

      if (!miradorState) {
        saveMiradorState(viewer.store.getState(), project.title);
      } else if (project.id) {
        const cfgWithAdapter = {
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

      return () => {
        initializedRef.current = false;
        try {
          if (viewer?.unmount) viewer.unmount();
        } catch (error) {
          console.error(error);
        }
        const el = document.getElementById(containerId.current);
        if (el) el.replaceChildren();
      };
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
