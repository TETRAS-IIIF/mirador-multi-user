import { miradorImageToolsPlugin } from 'mirador-image-tools';
import ManifestListTools from 'mirador-mltools-plugin-mmu';
import editorPlugins from 'mirador-annotation-editor';
import MMUAdapter from './adapter/MMUAdapter';
import { Project } from 'features/projects/types/types';
import { User } from 'features/auth/export';
import Mirador from 'mirador';

function getViewPlugins() {
  return [miradorImageToolsPlugin];
}

function getEditionPlugins() {
  return [...editorPlugins, ManifestListTools, miradorImageToolsPlugin];
}

export function getPlugins(mode: MiradorMode) {
  if (mode === MiradorMode.EDITOR) {
    return getEditionPlugins();
  }
  return getViewPlugins();
}

export enum MiradorMode {
  MANIFEST = 'manifest',
  SNAPSHOT = 'snapshot',
  WORKSPACE_EDITOR = 'workspace_editor',
  WORKSPACE_READER = 'workspace_reader',
}

/**
 * Get the default Mirador config to show a manifest from a project snapshot
 * @param refId the id of the div hosting the Mirador viewer
 */
export function getDefaultMiradorSnapshotConfig(refId: string) {
  return {
    id: refId,
    annotation: {
      exportLocalStorageAnnotations: false, // display annotation JSON export button
    },
    annotations: {
      htmlSanitizationRuleSet: 'liberal',
    },
  };
}

/**
 * Get the default Mirador config to show a manifest from a project snapshot
 * Design to be used with READER mode plugins
 * @param refId the id of the div hosting the Mirador viewer
 * @param manifestURL url of the manifest to display in the viewer
 */
export function getDefaultMiradorManifestConfig(
  refId: string,
  manifestURL: string,
) {
  return {
    id: refId,
    catalog: [
      {
        manifestId: manifestURL,
      },
    ],
    windows: [
      {
        imageToolsEnabled: true,
        imageToolsOpen: true,
        manifestId: manifestURL,
      },
    ],
    annotations: {
      htmlSanitizationRuleSet: 'liberal',
    },
  };
}

// TODO not perfect to use username and not userid
export function getDefaultMiradorWorkspaceConfig(
  refId: string,
  language: string,
  project: Project,
  userName: string,
) {
  return {
    id: refId,
    tags: project.tags,
    annotation: {
      adapter: (canvasId: string) =>
        new MMUAdapter(project.id, `${canvasId}/annotationPage`, userName),
      exportLocalStorageAnnotations: false,
      commentTemplates: project.noteTemplate ?? [],
      tagsSuggestions: project.tags ?? [],
    },
    annotations: { htmlSanitizationRuleSet: 'liberal' },
    workspace: { isWorkspaceAddVisible: true, removeResourceButton: true },
    language,
    projectId: project.id,
  };
}

export type MiradorViewerAdditionalProps = {
  project?: Project;
  user?: User;
  manifestURL?: string;
};

/**
 * Get a Mirador viewer instance with the right config and plugins according to the mode
 * @param mode
 * @param containerId
 * @param language
 * @param params
 */
export function getMiradorViewer(
  mode: MiradorMode,
  containerId: string,
  language: string,
  params: MiradorViewerAdditionalProps | undefined,
): any {
  switch (mode) {
    case MiradorMode.MANIFEST:
      return Mirador.viewer(
        getDefaultMiradorManifestConfig(containerId, params!.manifestURL!),
        [...getViewPlugins()],
      );
    case MiradorMode.SNAPSHOT:
      return Mirador.viewer(getDefaultMiradorSnapshotConfig(containerId), [
        ...getViewPlugins(),
      ]);
    case MiradorMode.WORKSPACE_EDITOR:
      return Mirador.viewer(
        getDefaultMiradorWorkspaceConfig(
          containerId,
          language,
          params!.project!,
          params!.user!.name,
        ),
        getEditionPlugins(),
      );
    case MiradorMode.WORKSPACE_READER:
      return Mirador.viewer(
        getDefaultMiradorWorkspaceConfig(
          containerId,
          language,
          params!.project!,
          params!.user!.name,
        ),
        getViewPlugins(),
      );
    default:
      throw new Error(`Unknown Mirador mode: ${mode}`);
  }
}
