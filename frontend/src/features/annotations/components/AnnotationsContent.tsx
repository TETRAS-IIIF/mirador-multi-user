import { useCallback, useMemo, useState } from 'react';
import { Box, SpeedDial, SpeedDialAction, SpeedDialIcon } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

import { Project } from '../../projects/types/types';
import { User } from '../../auth/types/types';
import IState from '../../mirador/interface/IState';
import { deleteAnnotationPage } from '../../mirador/api/deleteAnnotationPage';
import { ITEM_RIGHTS } from '../../../utils/mmu_types';

import { useAnnotations } from '../hooks/useAnnotations';
import {
  Annotation,
  useAnnotationFilters,
} from '../hooks/useAnnotationFilters';
import { useOpenProject } from '../../projects/hooks/useOpenProject';
import { AnnotationFilters } from './AnnotationFilters';
import { BulkActionToolbar } from './BulkActionToolbar';
import { AnnotationTable } from './AnnotationTable';
import { MMUModal } from '../../../components/elements/modal';
import { ModalProjectAlreadyOpenByUser } from '../../projects/components/ModalProjectAlreadyOpenByUser';
import {
  downloadAnnotationsAsZip,
  getAnnotationId,
  getAnnotationPageId,
} from '../annotationUtils.ts';

interface AnnotationsContentProps {
  userProjects: Project[];
  user: User | null;
  setSelectedProjectId: (id: number) => void;
  handleSetMiradorState: (state: IState | undefined) => void;
}

export function AnnotationsContent({
  userProjects,
  user,
  setSelectedProjectId,
  handleSetMiradorState,
}: AnnotationsContentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { annotations, setAnnotations, loading } = useAnnotations(
    userProjects,
    user,
  );
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const {
    openProject,
    openModalConfirmReopenProject,
    setOpenModalConfirmReopenProject,
    confirmForceOpen,
    cancelForceOpen,
  } = useOpenProject({
    setSelectedProjectId,
    handleSetMiradorState,
  });

  const {
    searchQuery,
    setSearchQuery,
    selectedProjects,
    setSelectedProjects,
    selectedCreators,
    setSelectedCreators,
    selectedTags,
    setSelectedTags,
    selectedCanvasIds,
    setSelectedCanvasIds,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    activeFilterCount,
    filteredAnnotations,
    resetFilters,
    creatorOptions,
    projectOptions,
    tagOptions,
    canvasIdOptions,
  } = useAnnotationFilters(annotations);

  const allFilteredIds = useMemo(
    () => filteredAnnotations.map((a, i) => getAnnotationId(a, i)),
    [filteredAnnotations],
  );

  const isAllSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));

  const isIndeterminate =
    allFilteredIds.some((id) => selected.has(id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allFilteredIds));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleProjectClick = useCallback(
    (projectId: string | number, canvasId?: string) => {
      const project = userProjects.find(
        (p) => String(p.id) === String(projectId),
      );
      if (!project) {
        toast.error(t('annotations.errors.projectNotFound'));
        return;
      }
      openProject(project, project.userWorkspace, false, canvasId);
    },
    [userProjects, openProject, t],
  );

  const handleBulkDelete = async () => {
    const selectedAnnotations = filteredAnnotations.filter((a, i) =>
      selected.has(getAnnotationId(a, i)),
    );

    for (const anno of selectedAnnotations) {
      const project = userProjects.find((p) => p.id === anno.projectId);

      if (!project) {
        toast.error(t('annotations.errors.projectNotFound'));
        continue;
      }

      if (
        project.rights !== ITEM_RIGHTS.ADMIN &&
        project.rights !== ITEM_RIGHTS.EDITOR
      ) {
        toast.error(
          t('annotations.errors.noPermission', { projectName: project.title }),
        );
        continue;
      }

      try {
        const annotationPageId = getAnnotationPageId(anno);

        if (!annotationPageId) {
          toast.error(t('annotations.errors.noAnnotationPageId'));
          continue;
        }

        await deleteAnnotationPage(annotationPageId, Number(anno.projectId));
        setAnnotations((prev) => prev.filter((a) => a.id !== anno.id));
      } catch (error) {
        toast.error(t('annotations.errors.deleteFailed'));
        console.error(error);
      }
    }

    setSelected(new Set());
  };

  const handleBulkDownload = async () => {
    const selectedAnnotations = filteredAnnotations.filter((a, i) =>
      selected.has(getAnnotationId(a, i)),
    );
    await downloadAnnotationsAsZip(selectedAnnotations);
  };

  const handleAnnotationUpdated = (id: string, updated: Annotation) => {
    setAnnotations((prev) =>
      prev.map((a, i) => (getAnnotationId(a, i) === id ? updated : a)),
    );
  };

  const speedDialActions = [
    {
      icon: <WorkIcon />,
      name: t('annotations.chooseProject'),
      onClick: () => navigate('/projects'),
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        flexGrow: 1,
        minWidth: 0,
        p: 2,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.default',
          pb: 1,
        }}
      >
        <AnnotationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilterCount={activeFilterCount}
          onResetFilters={resetFilters}
          projectOptions={projectOptions}
          selectedProjects={selectedProjects}
          onProjectsChange={setSelectedProjects}
          creatorOptions={creatorOptions}
          selectedCreators={selectedCreators}
          onCreatorsChange={setSelectedCreators}
          tagOptions={tagOptions}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          canvasIdOptions={canvasIdOptions}
          selectedCanvasIds={selectedCanvasIds}
          onCanvasIdsChange={setSelectedCanvasIds}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
      </Box>

      <BulkActionToolbar
        selectedCount={selected.size}
        onDownload={handleBulkDownload}
        onDelete={handleBulkDelete}
      />

      <AnnotationTable
        annotations={filteredAnnotations}
        loading={loading}
        selected={selected}
        searchQuery={searchQuery}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        onToggleSelectAll={toggleSelectAll}
        onToggleSelect={toggleSelect}
        onProjectClick={handleProjectClick}
        userProjects={userProjects}
        onAnnotationUpdated={handleAnnotationUpdated}
      />

      <SpeedDial
        ariaLabel="Actions"
        icon={<SpeedDialIcon />}
        direction="left"
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1300 }}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={action.onClick}
            slotProps={{ tooltip: { title: action.name } }}
          />
        ))}
      </SpeedDial>

      {openModalConfirmReopenProject && (
        <MMUModal
          openModal={openModalConfirmReopenProject}
          setOpenModal={setOpenModalConfirmReopenProject}
          width={400}
        >
          <ModalProjectAlreadyOpenByUser
            onConfirm={confirmForceOpen}
            onCancel={cancelForceOpen}
          />
        </MMUModal>
      )}
    </Box>
  );
}
