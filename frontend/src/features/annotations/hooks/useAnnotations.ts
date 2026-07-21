import { useEffect, useState } from 'react';
import { Project } from '../../projects/types/types';
import { User } from '../../auth/types/types';
import { getAllAnnotationsForProject } from '../api/gettingAllAnnotationPageForProject';

export const useAnnotations = (userProjects: Project[], user: User | null) => {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return { annotations, setAnnotations, loading };
};
