import React, { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Fuse from 'fuse.js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkIcon from '@mui/icons-material/Work';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { Project } from '../../projects/types/types.ts';
import { User } from '../../auth/types/types.ts';
import { getAllAnnotationsForProject } from '../api/gettingAllAnnotationPageForProject.ts';
import JSZip from 'jszip';

interface AnnotationsContentProps {
  userProjects: Project[];
  user: User | null;
}

const getAnnotationId = (anno: any, index: number): string =>
  anno.id ? String(anno.id) : String(index);

const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!text) return null;
  if (!highlight.trim()) return <>{text}</>;

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ backgroundColor: '#fff59d', padding: 0 }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

export function AnnotationsContent({
  userProjects,
  user,
}: AnnotationsContentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAnnotations = async () => {
      if (!userProjects || userProjects.length === 0 || !user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        let allAccumulatedAnnotations: any[] = [];

        for (const project of userProjects) {
          const projectAnnotationPages = await getAllAnnotationsForProject(
            project.id,
            user.id,
          );

          if (Array.isArray(projectAnnotationPages)) {
            projectAnnotationPages.forEach((page: any) => {
              if (page.content && Array.isArray(page.content.items)) {
                const itemsWithProject = page.content.items.map(
                  (item: any) => ({
                    ...item,
                    projectId: project.id,
                    projectName: project.title,
                  }),
                );
                allAccumulatedAnnotations = [
                  ...allAccumulatedAnnotations,
                  ...itemsWithProject,
                ];
              }
            });
          }
        }

        setAnnotations(allAccumulatedAnnotations);
      } catch (error) {
        console.error('Erreur lors de la récupération des annotations', error);
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnotations();
  }, [userProjects, user]);

  const creatorOptions = useMemo(
    () => [...new Set(annotations.map((a) => a.creator).filter(Boolean))],
    [annotations],
  );

  const projectOptions = useMemo(
    () => [
      ...new Set(
        annotations.map((a) => a.projectName || a.projectId).filter(Boolean),
      ),
    ],
    [annotations],
  );

  const tagOptions = useMemo(() => {
    const tags = new Set<string>();
    annotations.forEach((a) => {
      const body = Array.isArray(a.body) ? a.body : [a.body];
      body
        .filter((b: any) => b?.purpose === 'tagging')
        .forEach((b: any) => {
          if (b.value) tags.add(b.value);
        });
    });
    return [...tags];
  }, [annotations]);

  const canvasIdOptions = useMemo(
    () => [
      ...new Set(
        annotations
          .map((a) => {
            const target = Array.isArray(a.target) ? a.target[0] : a.target;
            return typeof target === 'string'
              ? target.split('#')[0]
              : target?.source?.split('#')[0];
          })
          .filter(Boolean),
      ),
    ],
    [annotations],
  );

  const activeFilterCount = [
    selectedProjects.length > 0,
    selectedCreators.length > 0,
    selectedTags.length > 0,
    selectedCanvasIds.length > 0,
    dateFrom !== null,
    dateTo !== null,
  ].filter(Boolean).length;

  const filteredAnnotations = useMemo(() => {
    let result = annotations;

    if (selectedProjects.length > 0) {
      result = result.filter((a) =>
        selectedProjects.includes(a.projectName || a.projectId),
      );
    }

    if (selectedCreators.length > 0) {
      result = result.filter((a) => selectedCreators.includes(a.creator));
    }

    if (selectedTags.length > 0) {
      result = result.filter((a) => {
        const body = Array.isArray(a.body) ? a.body : [a.body];
        const annotationTags = body
          .filter((b: any) => b?.purpose === 'tagging')
          .map((b: any) => b.value);
        return selectedTags.some((tag) => annotationTags.includes(tag));
      });
    }

    if (selectedCanvasIds.length > 0) {
      result = result.filter((a) => {
        const target = Array.isArray(a.target) ? a.target[0] : a.target;
        const canvasId =
          typeof target === 'string'
            ? target.split('#')[0]
            : target?.source?.split('#')[0];
        return selectedCanvasIds.includes(canvasId);
      });
    }

    if (dateFrom) {
      result = result.filter((a) => {
        if (!a.creationDate) return false;
        return dayjs(a.creationDate).isAfter(dateFrom.subtract(1, 'day'));
      });
    }

    if (dateTo) {
      result = result.filter((a) => {
        if (!a.creationDate) return false;
        return dayjs(a.creationDate).isBefore(dateTo.add(1, 'day'));
      });
    }

    if (!searchQuery) return result;

    const fuse = new Fuse(result, {
      keys: [
        'projectName',
        'creator',
        'motivation',
        'body.value',
        'body.purpose',
      ],
      threshold: 0.3,
      ignoreLocation: true,
      includeScore: true,
    });

    return fuse.search(searchQuery).map((r) => r.item);
  }, [
    annotations,
    searchQuery,
    selectedProjects,
    selectedCreators,
    selectedTags,
    selectedCanvasIds,
    dateFrom,
    dateTo,
  ]);

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

  const handleBulkDownload = async () => {
    const selectedAnnotations = filteredAnnotations.filter((a, i) =>
      selected.has(getAnnotationId(a, i)),
    );

    const zip = new JSZip();

    selectedAnnotations.forEach((anno, i) => {
      const filename = `annotation_${i + 1}.json`;
      zip.file(filename, JSON.stringify(anno, null, 2));
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations_${dayjs().format('YYYY-MM-DD')}.zip`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const handleBulkDelete = () => {
    // TODO: call delete API for each selected annotation
    setAnnotations((prev) =>
      prev.filter((a, i) => !selected.has(a.id ?? String(i))),
    );
    setSelected(new Set());
  };

  const resetFilters = () => {
    setSelectedProjects([]);
    setSelectedCreators([]);
    setSelectedTags([]);
    setSelectedCanvasIds([]);
    setDateFrom(null);
    setDateTo(null);
  };

  const highlightHTML = (htmlContent: string, highlight: string) => {
    if (!highlight.trim()) return htmlContent;
    const regex = new RegExp(`(?![^<]*>)(${highlight})`, 'gi');
    return htmlContent.replace(
      regex,
      '<mark style="background-color: #fff59d; padding: 0;">$1</mark>',
    );
  };

  const renderHtmlItem = (item: any, index: number) => {
    let content = '';
    if (typeof item === 'string') {
      content = item;
    } else if (item?.value) {
      content = item.value;
    } else {
      return (
        <span key={index}>
          <HighlightText
            text={item?.purpose || JSON.stringify(item)}
            highlight={searchQuery}
          />
        </span>
      );
    }
    const highlightedContent = highlightHTML(content, searchQuery);
    return (
      <Box
        key={index}
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
        sx={{
          '& p': { margin: 0 },
          '& img': { maxWidth: '100%', height: 'auto' },
        }}
      />
    );
  };

  const renderContent = (body: any) => {
    if (!body) return 'N/A';
    const bodyArray = Array.isArray(body) ? body : [body];
    const contentItems = bodyArray.filter((b: any) => b?.purpose !== 'tagging');
    if (contentItems.length === 0) return 'N/A';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {contentItems.map((b, i) => (
          <React.Fragment key={i}>
            {renderHtmlItem(b, i)}
            {i < contentItems.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </React.Fragment>
        ))}
      </Box>
    );
  };

  const renderTags = (body: any) => {
    if (!body) return null;
    const bodyArray = Array.isArray(body) ? body : [body];
    const tagItems = bodyArray.filter((b: any) => b?.purpose === 'tagging');
    if (tagItems.length === 0)
      return (
        <Typography variant="body2" color="text.secondary">
          -
        </Typography>
      );
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {tagItems.map((tag, i) => (
          <Chip
            key={i}
            label={
              <HighlightText
                text={tag.value || tag.id || 'Tag'}
                highlight={searchQuery}
              />
            }
            size="small"
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
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
      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              label={t('annotations.search')}
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: 300 }}
            />
            {activeFilterCount > 0 && (
              <Chip
                label={`${activeFilterCount} ${t('annotations.activeFilters')}`}
                onDelete={resetFilters}
                color="primary"
                size="small"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Autocomplete
              multiple
              options={projectOptions}
              value={selectedProjects}
              onChange={(_, v) => setSelectedProjects(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('annotations.filterByProject')}
                  size="small"
                />
              )}
              sx={{ minWidth: 200 }}
            />
            <Autocomplete
              multiple
              options={creatorOptions}
              value={selectedCreators}
              onChange={(_, v) => setSelectedCreators(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('annotations.filterByCreator')}
                  size="small"
                />
              )}
              sx={{ minWidth: 200 }}
            />
            <Autocomplete
              multiple
              options={tagOptions}
              value={selectedTags}
              onChange={(_, v) => setSelectedTags(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('annotations.filterByTag')}
                  size="small"
                />
              )}
              sx={{ minWidth: 200 }}
            />
            <Autocomplete
              multiple
              options={canvasIdOptions}
              value={selectedCanvasIds}
              onChange={(_, v) => setSelectedCanvasIds(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('annotations.filterByCanvasId')}
                  size="small"
                />
              )}
              sx={{ minWidth: 200 }}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label={t('annotations.filterDateFrom')}
                value={dateFrom}
                onChange={(v) => setDateFrom(v)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label={t('annotations.filterDateTo')}
                value={dateTo}
                onChange={(v) => setDateTo(v)}
                slotProps={{ textField: { size: 'small' } }}
              />
            </LocalizationProvider>
          </Box>

          {/* Bulk action toolbar */}
          {selected.size > 0 && (
            <Toolbar
              sx={{
                bgcolor: 'primary.lighter',
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'space-between',
                minHeight: '48px !important',
                px: 2,
              }}
            >
              <Typography variant="subtitle1">
                {selected.size} {t('annotations.selected')}
              </Typography>
              <Box>
                <Tooltip title={t('annotations.downloadSelected')}>
                  <IconButton onClick={handleBulkDownload} color="primary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('annotations.deleteSelected')}>
                  <IconButton onClick={handleBulkDelete} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          )}
        </Box>
      </Paper>

      {/* Tableau des annotations */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>{t('annotations.project')}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>
                {t('annotations.date')}
              </TableCell>
              <TableCell>{t('annotations.creator')}</TableCell>
              <TableCell>{t('annotations.motivation')}</TableCell>
              <TableCell sx={{ width: '40%' }}>
                {t('annotations.content')}
              </TableCell>
              <TableCell sx={{ width: '20%' }}>
                {t('annotations.tags')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredAnnotations.length > 0 ? (
              filteredAnnotations.map((anno, index) => {
                const id = getAnnotationId(anno, index);
                return (
                  <TableRow
                    key={id}
                    selected={selected.has(id)}
                    onClick={() => toggleSelect(id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.has(id)}
                        onChange={() => toggleSelect(id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <HighlightText
                        text={anno.projectName || anno.projectId}
                        highlight={searchQuery}
                      />
                    </TableCell>
                    <TableCell>{anno.creationDate || 'N/A'}</TableCell>
                    <TableCell>
                      <HighlightText
                        text={anno.creator || t('annotations.unknown')}
                        highlight={searchQuery}
                      />
                    </TableCell>
                    <TableCell>
                      <HighlightText
                        text={anno.motivation}
                        highlight={searchQuery}
                      />
                    </TableCell>
                    <TableCell>{renderContent(anno.body)}</TableCell>
                    <TableCell>{renderTags(anno.body)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {t('annotations.noAnnotations')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <SpeedDial
        ariaLabel="Actions"
        icon={<SpeedDialIcon />}
        direction="left"
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1300,
        }}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={action.onClick}
            slotProps={{
              tooltip: {
                title: action.name,
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}
