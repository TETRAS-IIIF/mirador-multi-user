import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Project } from '../types/types';
import IState from '../../mirador/interface/IState';
import { isProjectLocked } from '../api/Project/isProjectLocked';
import { handleLock } from '../api/Project/handleLock';
import { getUserNameWithId } from '../../auth/api/getUserNameWithId';
import { getSettingValue, SettingKeys } from '../../../utils/utils.ts';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';

const SELF_LOCK = -1;

interface UseOpenProjectParams {
  setSelectedProjectId: (id: number) => void;
  handleSetMiradorState: (state: IState | undefined) => void;
}

const applyTargetCanvas = (
  miradorState: IState | undefined,
  targetCanvasId?: string,
): IState | undefined => {
  if (!targetCanvasId || !miradorState?.windows) return miradorState;

  const windows = { ...miradorState.windows };
  const firstWindowId = Object.keys(windows)[0];
  if (!firstWindowId) return miradorState;

  windows[firstWindowId] = {
    ...windows[firstWindowId],
    canvasId: targetCanvasId,
  };
  return { ...miradorState, windows };
};

export const useOpenProject = ({
  setSelectedProjectId,
  handleSetMiradorState,
}: UseOpenProjectParams) => {
  const { t } = useTranslation();

  const { data: settings } = useAdminSettings();
  const projectLock =
    getSettingValue(SettingKeys.DISABLE_PROJECT_LOCK, settings) === 'false';

  const [openModalConfirmReopenProject, setOpenModalConfirmReopenProject] =
    useState(false);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const [pendingMiradorState, setPendingMiradorState] = useState<
    IState | undefined
  >(undefined);
  const [pendingTargetCanvasId, setPendingTargetCanvasId] = useState<
    string | undefined
  >(undefined);

  const openProject = useCallback(
    async (
      project: Project,
      miradorState?: IState,
      forced: boolean = !projectLock,
      targetCanvasId?: string,
    ) => {
      try {
        if (!forced) {
          const lockStatus = await isProjectLocked(project.id);

          // Locked by someone else
          if (typeof lockStatus === 'number' && lockStatus !== SELF_LOCK) {
            const userName = await getUserNameWithId(lockStatus);
            toast.error(t('errorProjectAlreadyOpen') + userName);
            return;
          }

          // Locked by current user → ask for confirmation
          if (lockStatus === SELF_LOCK) {
            setPendingProject(project);
            setPendingMiradorState(miradorState);
            setPendingTargetCanvasId(targetCanvasId);
            setOpenModalConfirmReopenProject(true);
            return;
          }
        }

        await handleLock({ projectId: project.id, lock: true });
      } catch (error) {
        console.error(error);
        toast.error(String(error));
        return;
      }

      const stateToLoad = applyTargetCanvas(miradorState, targetCanvasId);
      setSelectedProjectId(project.id);
      handleSetMiradorState(stateToLoad);
    },
    [setSelectedProjectId, handleSetMiradorState, t, projectLock],
  );

  const confirmForceOpen = useCallback(async () => {
    if (!pendingProject) return;
    await openProject(
      pendingProject,
      pendingMiradorState,
      true,
      pendingTargetCanvasId,
    );
    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
    setPendingTargetCanvasId(undefined);
  }, [pendingProject, pendingMiradorState, pendingTargetCanvasId, openProject]);

  const cancelForceOpen = useCallback(() => {
    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
    setPendingTargetCanvasId(undefined);
  }, []);

  return {
    openProject,
    openModalConfirmReopenProject,
    setOpenModalConfirmReopenProject,
    confirmForceOpen,
    cancelForceOpen,
  };
};
