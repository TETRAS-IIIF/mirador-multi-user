import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import Fuse from 'fuse.js';
import { Project } from '../../projects/types/types.ts';
import { User } from '../../auth/types/types.ts';
import { getAllAnnotationsForProject } from '../api/gettingAllAnnotationPageForProject.ts';

interface AnnotationsContentProps {
  userProjects: Project[];
  user: User | null;
}

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
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const filteredAnnotations = useMemo(() => {
    if (!searchQuery) return annotations;

    const fuse = new Fuse(annotations, {
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

    return fuse.search(searchQuery).map((result) => result.item);
  }, [annotations, searchQuery]);

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
            {i < contentItems.length - 1 && (
              <hr
                style={{
                  width: '100%',
                  border: '0.5px solid #eee',
                  margin: '4px 0',
                }}
              />
            )}
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

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Annotations</Typography>
        <TextField
          label="Rechercher..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Projet</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Date</TableCell>
              <TableCell>Créateur</TableCell>
              <TableCell>Motivation</TableCell>
              <TableCell sx={{ width: '40%' }}>Contenu</TableCell>
              <TableCell sx={{ width: '20%' }}>Tags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredAnnotations.length > 0 ? (
              filteredAnnotations.map((anno, index) => (
                <TableRow key={anno.id || index}>
                  <TableCell>
                    <HighlightText
                      text={anno.projectName || anno.projectId}
                      highlight={searchQuery}
                    />
                  </TableCell>
                  <TableCell>{anno.creationDate || 'N/A'}</TableCell>
                  <TableCell>
                    <HighlightText
                      text={anno.creator || 'Inconnu'}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Aucune annotation trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
