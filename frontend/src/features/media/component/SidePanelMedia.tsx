import {
  Box,
  Button,
  Drawer,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  styled,
  Tab,
  Tabs,
  Tooltip
} from '@mui/material';
import { ChangeEvent, ReactNode, SyntheticEvent, useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Media, MediaTypes } from '../types/types.ts';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { lookingForMedias } from '../api/lookingForMedias.ts';
import { UserGroup } from '../../user-group/types/types.ts';
import { createMedia } from '../api/createMedia.ts';
import { User } from '../../auth/types/types.ts';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { DrawerLinkMedia } from './DrawerLinkMedia.tsx';
import { createMediaLink } from '../api/createMediaWithLink.ts';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { CloseButton } from '../../../components/elements/SideBar/CloseButton.tsx';
import { OpenButton } from '../../../components/elements/SideBar/OpenButton.tsx';
import { a11yProps } from '../../../components/elements/SideBar/allyProps.tsx';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';

const CustomImageItem = styled(ImageListItem)({
  position: 'relative',
  '&:hover img': {
    opacity: 0.4
  },
  '&:hover .overlayButton': {
    opacity: 1
  }
});

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
});

const CustomButton = styled(Button)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease'
});

const ToggleButton = styled(IconButton)(({ open }: { open: boolean }) => ({
  position: 'fixed',
  top: 80,
  right: open ? 450 : -50,
  zIndex: 9999,
  transition: 'right 0.3s ease',
  '&:hover': {
    backgroundColor: 'transparent'
  }
}));

const handleCopyToClipBoard = async (path: string) => {
  try {
    await navigator.clipboard.writeText(path);
    toast.success('Path copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy path');
  }
};


interface PopUpMediaProps {
  medias: Media[];
  children: ReactNode;
  userPersonalGroup: UserGroup;
  user: User;
  fetchMediaForUser: () => void;
  display: boolean;
  open: boolean;
  setOpen: () => void;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

export const SidePanelMedia = ({
                                 display,
                                 medias,
                                 children,
                                 userPersonalGroup,
                                 user,
                                 fetchMediaForUser,
                                 open,
                                 setOpen
                               }: PopUpMediaProps) => {
  const [searchedMedia, setSearchedMedia] = useState<Media | null>(null);
  const [modalLinkMediaIsOpen, setModalLinkMediaIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  // const [mediasTags, setMediasTags] = useState<Tag[]>([]);
  // const [tagFilter ,setTagFilter] = useState<Tag|null>(null);
  // const [showAllTags, setShowAllTags] = useState(false);
  const itemsPerPage = 9;


  // const handleShowAllTags = () => {
  //   setShowAllTags(!showAllTags);
  // };

  // useEffect(() => {
  //   const fetchTags = async () => {
  //     const allTags = await Promise.all(
  //       medias.map((media) =>
  //         getTagsForObject(media.id).then(tags => ({ mediaId: media.id, tags }))
  //       )
  //     );
  //     console.log('allTags', allTags);
  //
  //     const tagsWithMedia = allTags.flatMap(({ mediaId, tags }) =>
  //       tags.map((tagObj: { tag: Tag; }) => ({
  //         id: tagObj.tag.id,
  //         title: tagObj.tag.title,
  //         mediaId
  //       }))
  //     );
  //
  //     const tagMap = new Map();
  //     tagsWithMedia.forEach(({ id, title, mediaId }) => {
  //       if (!tagMap.has(id)) {
  //         tagMap.set(id, { id, title, objectsTaggedId: [mediaId] });
  //       } else {
  //         tagMap.get(id).objectsTaggedId.push(mediaId);
  //       }
  //     });
  //
  //     const uniqueTagsWithMedia = Array.from(tagMap.values());
  //     setMediasTags(uniqueTagsWithMedia);
  //   };
  //
  //   fetchTags();
  // }, [medias]);

  // const currentPageData = useMemo(() => {
  //   const filteredMedias = tagFilter?.objectsTaggedId
  //     ? medias.filter(media => tagFilter.objectsTaggedId!.includes(media.id))
  //     : medias;
  //
  //   const start = (currentPage - 1) * itemsPerPage;
  //   const end = start + itemsPerPage;
  //   return filteredMedias.slice(start, end);
  // }, [currentPage, itemsPerPage, medias, tagFilter]);

  const filteredMedias = useMemo(() => {
    if (tabValue === 1) {
      return medias.filter(media => media.mediaTypes === MediaTypes.VIDEO);
    } else if (tabValue === 2) {
      return medias.filter(media => media.mediaTypes === MediaTypes.IMAGE);
    }
    return medias;
  }, [tabValue, medias]);

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredMedias.slice(start, end);
  }, [currentPage, filteredMedias]);

  const totalPages = Math.ceil(medias.length / itemsPerPage);

  const toggleDrawer = () => {
    setOpen();
  };

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handleCreateMedia = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      await createMedia({
        idCreator: user.id,
        user_group: userPersonalGroup!,
        file: event.target.files[0]
      });
      fetchMediaForUser();
    }
  }, [fetchMediaForUser, user.id, userPersonalGroup, medias]);

  const handleSetSearchMedia = (mediaQuery: Media) => {
    if (mediaQuery?.description) {
      const searchedMedia = medias.find(media => media.id === mediaQuery.id);
      return setSearchedMedia(searchedMedia!);
    } else {
      setSearchedMedia(null);
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-upload')!.click();
  };

  const HandleLookingForMedia = async (partialString: string) => {
    return await lookingForMedias(partialString, userPersonalGroup.id);
  };

  const getOptionLabelForMediaSearchBar = (option: Media): string => {
    return option.title;
  };

  const createMediaWithLink = async (link: string) => {
    try {
      await createMediaLink({ url: link, idCreator: user.id, user_group: userPersonalGroup });
      fetchMediaForUser();
    } catch (error) {
      console.error('Error fetching the image:', error);
    }
  };

  // const handleFilterByTag = (tag:Tag)=>{
  //   return setTagFilter(tag)
  // }

  return (
    <div>
      {display && (
        <ToggleButton
          open={open} onClick={toggleDrawer}>
          {open ? <CloseButton text="Medias" /> : <OpenButton text="Medias" />}
        </ToggleButton>
      )

      }
      {display && (

        <Drawer
          open={open}
          anchor="right"
          variant="persistent"
          sx={{ position: 'relative', zIndex: 9998 }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: 'transparent' }
            }
          }}>
          <Grid item container spacing={1} sx={{ padding: '10px' }} alignItems="center">
            <Grid item>
              <SearchBar fetchFunction={HandleLookingForMedia} getOptionLabel={getOptionLabelForMediaSearchBar}
                         label={'Search Media'} setSearchedData={handleSetSearchMedia} />
            </Grid>
            <Grid item>
              <VisuallyHiddenInput
                id="file-upload"
                type="file"
                onChange={handleCreateMedia}
              />
              <Tooltip title="Upload Media">
                <Button onClick={handleButtonClick} variant="contained"> <UploadFileIcon /></Button>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Link Media">
                <Button variant="contained" onClick={() => setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)}>
                  <AddLinkIcon />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
          {/*<Grid item container spacing={2} sx={{padding:'0 0 0 20px', maxWidth:500}}>*/}
          {/*  {*/}
          {/*    tagFilter &&(*/}
          {/*      <Grid item>*/}
          {/*        <Chip color="error" label={"remove tag"} onClick={()=>setTagFilter(null)} />*/}
          {/*      </Grid>*/}
          {/*    )*/}
          {/*  }*/}
          {/*    {mediasTags.slice(0, showAllTags ? mediasTags.length : 3).map((tag) => (*/}
          {/*      <Grid item key={tag.id}>*/}
          {/*        <TagChip*/}
          {/*          tag={tag}*/}
          {/*          onClick={() => handleFilterByTag(tag)}*/}
          {/*          color={tagFilter?.id === tag.id ? "primary" : "default"}*/}
          {/*        />*/}
          {/*      </Grid>*/}
          {/*    ))}*/}
          {/*    {!showAllTags && mediasTags.length > 1 && (*/}
          {/*      <Grid item>*/}
          {/*        <TagChip tag={{ title: '...', id: -1 }} onClick={handleShowAllTags} color="default" />*/}
          {/*      </Grid>*/}
          {/*    )}*/}
          {/*  {showAllTags && mediasTags.length > 1 && (*/}
          {/*      <Grid item>*/}
          {/*        <TagChip tag={{ title: 'x', id: -1 }} onClick={handleShowAllTags} color="error" />*/}
          {/*      </Grid>*/}
          {/*    )}*/}
          {/*</Grid>*/}
          <Tabs value={tabValue} onChange={handleChangeTab} aria-label="basic tabs example">
            <Tab label="All" {...a11yProps(0)} />
            <Tab label="Videos" {...a11yProps(1)} />
            <Tab label="Images" {...a11yProps(2)} />
          </Tabs>
          {
            searchedMedia && (
              <ImageList sx={{ minWidth: 500, maxWidth: 500, padding: 1, width: 500 }} cols={3} rowHeight={164}>
                <CustomImageItem key={searchedMedia.path}>
                  <Box
                    component="img"
                    src={`${caddyUrl}/${searchedMedia.hash}/thumbnail.webp`}
                    alt={searchedMedia.title}
                    loading="lazy"
                    sx={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      '@media(min-resolution: 2dppx)': {
                        width: 150 * 2,
                        height: 150 * 2
                      }
                    }}
                  />
                  <CustomButton
                    className="overlayButton"
                    disableRipple
                    onClick={searchedMedia.path ? () => handleCopyToClipBoard(`${caddyUrl}/${searchedMedia.hash}/${searchedMedia.path}`) : () => handleCopyToClipBoard(`${searchedMedia.url}`)}
                  >
                    Copy URL to clipboard
                  </CustomButton>
                </CustomImageItem>
              </ImageList>
            )
          }
          {searchedMedia === null && (
            <ImageList sx={{ minWidth: 500, padding: 1, width: 500 }} cols={3} rowHeight={164}>
              {currentPageData.map((media) => (
                <CustomImageItem key={media.hash} sx={{ position: 'relative', width: 150, height: 150 }}>
                  <Box
                    component="img"
                    src={`${caddyUrl}/${media.hash}/thumbnail.webp`}
                    alt={media.title}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      '@media(min-resolution: 2dppx)': {
                        width: '100%',
                        height: '100%'
                      }
                    }}
                  />
                  <ImageListItemBar
                    title={media.title}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      color: 'white'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {media.mediaTypes === MediaTypes.VIDEO ? <OndemandVideoIcon /> : <ImageIcon />}
                  </Box>
                  <CustomButton
                    className="overlayButton"
                    disableRipple
                    onClick={media.path ? () => handleCopyToClipBoard(`${caddyUrl}/${media.hash}/${media.path}`) : () => handleCopyToClipBoard(`${media.url}`)}
                  >
                    Copy path to clipboard
                  </CustomButton>
                </CustomImageItem>
              ))}
            </ImageList>
          )
          }
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </Drawer>
      )
      }
      <Box
        sx={{
          flexGrow: 1,
          padding: 2,
          transition: 'margin 0.3s ease',
          marginRight: open ? '500px' : '0px'
        }}>
        {children}
      </Box>
      <Grid>
        <DrawerLinkMedia
          toggleModalMediaCreation={() => setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)}
          CreateMediaWithLink={createMediaWithLink}
          modalCreateMediaIsOpen={modalLinkMediaIsOpen}
        />
      </Grid>
    </div>
  );
};
