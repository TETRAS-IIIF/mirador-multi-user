import { Grid, Typography } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import { useCallback, useEffect, useState } from "react";
import { CreateProjectDto, Project, ProjectUser } from "../types/types.ts";
import MiradorViewer from "../../mirador/Mirador.tsx";
import IState from "../../mirador/interface/IState.ts";
import { User } from "../../auth/types/types.ts";
import { ProjectCard } from "./projectCard.tsx";
import { deleteProject } from "../api/deleteProject.ts";
import { getUserAllProjects } from "../api/getUserAllProjects.ts";
import { updateProject } from "../api/updateProject";
import { createProject } from "../api/createProject";
import { FloatingActionButton } from "../../../components/elements/FloatingActionButton.tsx";
import { DrawerCreateProject } from "./DrawerCreateProject.tsx";
import toast from 'react-hot-toast';
import { getAllGroupProjects } from "../../user-group/api/getAllGroupProjects.ts";
import { SearchBar } from "../../../components/elements/SearchBar.tsx";
import { lookingForProject } from "../api/lookingForProject.ts";
import { getUserPersonalGroup } from "../api/getUserPersonalGroup.ts";
import {  UserGroup } from "../../user-group/types/types.ts";


interface AllProjectsProps {
  user: User;
  setSelectedProjectId: (id: number) => void;
  selectedProjectId?: number;
}

const emptyWorkspace: IState = {
  catalog: [],
  companionWindows: {},
  config: {},
  elasticLayout: {},
  layers: {},
  manifests: {},
  viewers: {},
  windows: {},
  workspace: {},

};

export const AllProjects = ({ user, selectedProjectId, setSelectedProjectId }:AllProjectsProps) => {
  const [userProjects, setUserProjects] = useState<ProjectUser[]>([]);
  const [searchedProject, setSearchedProject] = useState<ProjectUser|null>(null);
  const [userPersonalGroup, setUserPersonalGroup] = useState<UserGroup>()

  const [miradorState, setMiradorState] = useState<IState>();

  const [modalCreateProjectIsOpen, setModalCreateProjectIsOpen]= useState(false);

  const fetchProjects = async () => {
    try {
      const userGroups = await getUserAllProjects(user.id);
      const projects = [];
      const projectIds = new Set();
      for (const group of userGroups) {
        const groupProjects = await getAllGroupProjects(group.id);
        for (const groupProject of groupProjects) {
          if (!projectIds.has(groupProject.project.id)) {
            projectIds.add(groupProject.project.id);
            projects.push(groupProject);
          }
        }
        console.log(groupProjects)
      }
      setUserProjects(projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchUserPersonalGroup = async()=>{
    const personalGroup = await getUserPersonalGroup(user.id)
    setUserPersonalGroup(personalGroup)
  }
  useEffect(() => {
    fetchProjects();
    fetchUserPersonalGroup()
  }, [user]);



  const deleteUserProject = useCallback(async (projectId: number) => {
    await deleteProject(projectId);
    const updatedListOfProject = userProjects.filter(function(project) {
      return project.id != projectId;
    });
    console.log(updatedListOfProject);
    setUserProjects(updatedListOfProject);
  },[userProjects]);

  const updateUserProject = useCallback(async (projectUser:ProjectUser, newProjectName:string)=>{
    const updatedProject:ProjectUser = {...projectUser, project: {
        ...projectUser.project,
        name: newProjectName
      }}
    console.log(updatedProject)
    await updateProject({...updatedProject})
    let updatedListOfProject = userProjects.filter(function(p) {
      return p.project.id != projectUser.project.id;
    });
    updatedListOfProject = [updatedProject,...updatedListOfProject]
    setUserProjects(updatedListOfProject);
  },[userProjects])

  const initializeMirador = useCallback((miradorState: IState | undefined, projectId: number) => {
    setSelectedProjectId(projectId);
    setMiradorState(miradorState);
  },[selectedProjectId]);

  const toggleModalProjectCreation = useCallback(()=>{
    setModalCreateProjectIsOpen(!modalCreateProjectIsOpen);
  },[modalCreateProjectIsOpen,setModalCreateProjectIsOpen])

  const InitializeProject = useCallback(async (workspace: IState, projectName: string) => {
    const response = await createProject({
        name: projectName,
        owner: user,
        userWorkspace: workspace
      }
    )
    setUserProjects((prevState) => [...prevState,
      response]
    );
    initializeMirador(undefined, response.id)
    toggleModalProjectCreation()
  },[initializeMirador, toggleModalProjectCreation, user.id])



  const handleSaveProject = useCallback((newProject:ProjectUser)=>{
    setUserProjects(userProjects => [...userProjects, newProject]);

  },[setUserProjects])

  const saveProject = useCallback((state: IState, name: string)=>{
    if (selectedProjectId) {
      const updatedProject = userProjects.find(project => project.id == selectedProjectId);
      updatedProject!.project.userWorkspace = state;
      updatedProject!.project.name = name;
      updateProject(updatedProject!).then(r => {
        console.log(r);
        toast.success("Project saved");
      });
    } else {
      const project:CreateProjectDto = {
        name: name,
        owner: user,
        userWorkspace: state,
      };
      createProject(project).then(r => {
        setSelectedProjectId(r.project.id);
        handleSaveProject( { ...r,
          project:{...project, id:r.project.id}
        });
      });
    }
  },[handleSaveProject, selectedProjectId, user.id, userProjects])

  const getOptionLabel = (option: Project): string => {
    return option.name;
  };

  const handleLookingForProject = async (partialProjectName: string) => {
    console.log('userPersonalGroup',userPersonalGroup)
    const userProjectArray = await lookingForProject(partialProjectName, userPersonalGroup!.id)
    const projectArray = []
    for(const projectUser of userProjectArray){
      projectArray.push(projectUser.project)
    }
    return projectArray;
  }

  const handleSetSearchProject = (project:Project)=>{
    const  searchedProject = userProjects.find(userProject => userProject.project.id === project.id)
    setSearchedProject(searchedProject!)
  }
  console.log('searchedProject',searchedProject)
  return (
    <>
      <Grid container spacing={2} justifyContent="center" flexDirection="column">
        <Grid item container direction="row-reverse" spacing={2} alignItems="center">
          {
            !selectedProjectId &&(
              <Grid item>
                <SearchBar fetchFunction={handleLookingForProject} getOptionLabel={getOptionLabel} setSearchedProject={handleSetSearchProject}/>
              </Grid>
            )
          }
        </Grid>
        <Grid item container spacing={1}>
          {!userProjects.length && (
            <Grid
              container
              justifyContent={"center"}
            >
              <Typography variant="h6" component="h2">No projects yet, start to work when clicking on "New project" button.</Typography>
            </Grid>
          )}
          {!selectedProjectId && !searchedProject && userProjects && (
            <Grid item container spacing={1} flexDirection="column" sx={{marginBottom:"70px"}}>
              {userProjects.map((projectUser) => (
                  <Grid item key={projectUser.project.id} >
                    <ProjectCard
                      ProjectUser={projectUser}
                      initializeMirador={initializeMirador}
                      deleteProject={deleteUserProject}
                      updateUserProject={updateUserProject}
                    />
                  </Grid>
                )
              )}
              <Grid item>
                <FloatingActionButton onClick={toggleModalProjectCreation} content={"New Project"} Icon={<AddIcon />} />
                <div>
                  <DrawerCreateProject
                    InitializeProject={InitializeProject}
                    projectWorkspace={emptyWorkspace}
                    toggleModalProjectCreation={toggleModalProjectCreation}
                    modalCreateProjectIsOpen={modalCreateProjectIsOpen}/>
                </div>
              </Grid>
            </Grid>
          ) }
          {selectedProjectId &&(
            <Grid item xs={12}>
              <MiradorViewer
                miradorState={miradorState!}
                saveMiradorState={saveProject}
                ProjectUser={userProjects.find(projectUser => projectUser.project.id == selectedProjectId)!}
                updateUserProject={updateUserProject}
              />
            </Grid>
          )
          }
          {
            searchedProject && !selectedProjectId &&(
              <Grid item container spacing={1} flexDirection="column" sx={{marginBottom:"70px"}}>
                <Grid item>
                  <ProjectCard
                    ProjectUser={searchedProject}
                    initializeMirador={initializeMirador}
                    deleteProject={deleteUserProject}
                    updateUserProject={updateUserProject}
                  />
                </Grid>
              </Grid>
            )
          }
        </Grid>
      </Grid>
    </>
  );
};
