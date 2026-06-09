import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { Project } from '../types/types';
import IState from '../../mirador/interface/IState';
import { isProjectLocked } from '../api/Project/isProjectLocked';
import { handleLock } from '../api/Project/handleLock';
import { getUserNameWithId } from '../../auth/api/getUserNameWithId';

const SELF_LOCK = -1;

interface UseOpenProjectParams {
  setSelectedProjectId: (id: number) => void;
  handleSetMiradorState: (state: IState | undefined) => void;
}

export const useOpenProject = ({
  setSelectedProjectId,
  handleSetMiradorState,
}: UseOpenProjectParams) => {
  const { t } = useTranslation();

  const [openModalConfirmReopenProject, setOpenModalConfirmReopenProject] =
    useState(false);
  const [pendingProject, setPendingProject] = useState<Project | null>(null);
  const [pendingMiradorState, setPendingMiradorState] = useState<
    IState | undefined
  >(undefined);

  const openProject = useCallback(
    async (
      project: Project,
      miradorState?: IState,
      forced: boolean = false,
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

      setSelectedProjectId(project.id);
      handleSetMiradorState(miradorState);
    },
    [setSelectedProjectId, handleSetMiradorState, t],
  );

  const confirmForceOpen = useCallback(async () => {
    if (!pendingProject) return;
    await openProject(pendingProject, pendingMiradorState, true);
    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
  }, [pendingProject, pendingMiradorState, openProject]);

  const cancelForceOpen = useCallback(() => {
    setOpenModalConfirmReopenProject(false);
    setPendingProject(null);
    setPendingMiradorState(undefined);
  }, []);

  return {
    openProject,
    openModalConfirmReopenProject,
    setOpenModalConfirmReopenProject,
    confirmForceOpen,
    cancelForceOpen,
  };
};
