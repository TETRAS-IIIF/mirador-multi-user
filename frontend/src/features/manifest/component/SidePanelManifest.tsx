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
  Tooltip,
} from '@mui/material';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Manifest, ManifestGroupRights, manifestOrigin } from '../types/types.ts';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { UserGroup } from '../../user-group/types/types.ts';
import { User } from '../../auth/types/types.ts';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { DrawerLinkManifest } from './DrawerLinkManifest.tsx';
import { linkManifest } from '../api/linkManifest.ts';
import { CloseButton } from '../../../components/elements/SideBar/CloseButton.tsx';
import { OpenButton } from '../../../components/elements/SideBar/OpenButton.tsx';
import placeholder from '../../../assets/Placeholder.svg';
import { useTranslation } from 'react-i18next';

const CustomButton = styled(Button)({
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
});

const ToggleButton = styled(IconButton)(({ open }: { open: boolean }) => ({
  position: 'fixed',
  top: 100,
  right: open ? 340 : -60,
  zIndex: 9999,
  transition: 'right 0.3s ease',
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const StyledImageListItem = styled(ImageListItem)({
  position: 'relative',
  '&:hover .overlayButton': {
    opacity: 1,
  },
});


interface PopUpManifestProps {
  manifest: Manifest[];
  children: ReactNode;
  userPersonalGroup: UserGroup
  user: User
  fetchManifestForUser: () => void
  display: boolean
}

const caddyUrl = import.meta.env.VITE_CADDY_URL

export const SidePanelManifest = ({
                                    display,
                                    manifest,
                                    children,
                                    userPersonalGroup,
                                    user,
                                    fetchManifestForUser,
                                  }: PopUpManifestProps) => {
  const [open, setOpen] = useState(false);
  const [searchedManifest, setsearchedManifest] = useState<Manifest | null>(null);
  const [modalLinkManifestIsOpen, setModalLinkManifestIsOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const itemsPerPage = 6;

  const { t } = useTranslation();

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return manifest.slice(start, end);
  }, [currentPage, manifest]);

  const totalPages = Math.ceil(manifest.length / itemsPerPage);

  const toggleDrawer = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleSetSearchManifest = (mediaQuery: Manifest) => {
    if (mediaQuery) {
      const searchedMedia = manifest.find(media => media.id === mediaQuery.id)
      setsearchedManifest(searchedMedia!)
    } else {
      setsearchedManifest(null);
    }
  }

  const HandleLookingForManifest = async (partialString: string) => {
    return manifest.filter((manifest: Manifest) => manifest.title.includes(partialString))
  }

  const getManifestURL = (manifest: Manifest) => {
    if (manifest.hash) {
      // Hosted on MMU
      return `${caddyUrl}/${manifest.hash}/${manifest.path}`;
    } else {
      // Linked to MMU
      return manifest.path;
    }
  }

  const handleCopyToClipBoard = async (manifest: Manifest) => {
    const manifestURL = getManifestURL(manifest);

    try {
      await navigator.clipboard.writeText(manifestURL);
      toast.success(t('pathCopiedToClipboard'));
    } catch (error) {
      toast.error(t('pathNotCopiedToClipboard'));
    }
  };

  const getOptionLabelForManifestSearchBar = (option: Manifest): string => {
    return option.title;
  };

  const handleLinkManifest = useCallback(async (path: string) => {
    const response = await fetch(path, {
      method: 'GET',
    })
    if (response) {
      const manifest = await response.json()
      await linkManifest({
        url: path,
        rights: ManifestGroupRights.ADMIN,
        idCreator: user.id,
        user_group: userPersonalGroup!,
        path: path,
        title: manifest.label.en
          ? manifest.label.en[0]
          : t('newManifest'),
      });
      fetchManifestForUser()
      setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)
      return toast.success(t('manifestLinked'));
    }
    return toast.error(t('manifestLinkingFailed'));

  }, [fetchManifestForUser, modalLinkManifestIsOpen, user.id, userPersonalGroup])

  const fetchThumbnails = useCallback(async () => {
    const urls: string[] = await Promise.all(
      currentPageData.map(async (manifest) => {
        if (manifest.thumbnailUrl) {
          return manifest.thumbnailUrl;
        }

        let manifestUrl = '';
        if (manifest.origin === manifestOrigin.UPLOAD) {
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.title}`; // TODO This must be tested
        } else if (manifest.origin === manifestOrigin.LINK) {
          manifestUrl = manifest.path;
        } else if (manifest.origin === manifestOrigin.CREATE) {
          manifestUrl = `${caddyUrl}/${manifest.hash}/${manifest.path}`;
        } else {
          return placeholder;
        }
        try {
          const manifestResponse = await fetch(manifestUrl);
          const manifestFetched = await manifestResponse.json();
          if (manifestFetched.thumbnail) {
            return manifestFetched.thumbnail['@id'];
          } else if (manifestFetched.items[0].thumbnail[0].id) {
            return manifestFetched.items[0].thumbnail[0].id;
          } else {
            return placeholder;
          }
        } catch (error) {
          console.error('Error fetching manifest:', error);
          return placeholder;
        }
      }),
    );

    setThumbnailUrls(urls);
  }, [currentPageData, caddyUrl]);

  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);

  return (
    <div>
      {display && (
        <ToggleButton
          open={open} onClick={toggleDrawer}>
          {open ? <CloseButton text={t('manifests')} /> : <OpenButton text={t('manifests')} />}
        </ToggleButton>
      )

      }
      {display && (
        <Drawer
          open={open}
          anchor="right"
          variant="persistent"
          sx={{ position: 'relative' }}
          ModalProps={{
            BackdropProps: {
              style: { backgroundColor: 'transparent' },
            },
          }}>
          <Grid item container spacing={1} sx={{ padding: '10px' }} alignItems="center">
            <Grid item>
              <SearchBar fetchFunction={HandleLookingForManifest} getOptionLabel={getOptionLabelForManifestSearchBar}
                         label={t('search')} setSearchedData={handleSetSearchManifest} />
            </Grid>
            <Grid item>
              <Tooltip title={t('linkManifest')}>
                <Button variant="contained" onClick={() => setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)}>
                  <AddLinkIcon />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
          {
            searchedManifest ? (
              <ImageList sx={{ minWidth: 400, padding: 1, width: 400 }} cols={2} rowHeight={200}>
                <StyledImageListItem>
                  <img
                    srcSet={`${searchedManifest.thumbnailUrl}?w=248&fit=crop&auto=format&dpr=2 2x`}
                    src={`${searchedManifest.thumbnailUrl}?w=248&fit=crop&auto=format`}
                    alt={searchedManifest.title}
                    loading="lazy"
                  />
                  <ImageListItemBar
                    title={searchedManifest.title}
                  />
                  <CustomButton
                    className="overlayButton"
                    disableRipple
                    onClick={handleCopyToClipBoard(searchedManifest)}
                  >
                    {t('copyPathToClipboard')}
                  </CustomButton>
                </StyledImageListItem>
              </ImageList>
            ) : (
              <ImageList sx={{ minWidth: 400, padding: 1, width: 400 }} cols={2} rowHeight={200}>
                {currentPageData.map((manifest, index) => (
                  <>
                    <StyledImageListItem key={manifest.id}>
                      <Box
                        component="img"
                        src={`${thumbnailUrls[index]}?w=248&fit=crop&auto=format&dpr=2 2x`}
                        alt={manifest.title}
                        loading="lazy"
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          '@media(min-resolution: 2dppx)': {
                            width: '100%',
                            height: '100%',
                          },
                        }}
                      />
                      <ImageListItemBar
                        title={manifest.title}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          color: 'white',
                        }}
                      />
                      <CustomButton
                        className="overlayButton"
                        disableRipple
                        onClick={() => manifest && handleCopyToClipBoard(manifest)}
                      >
                        {t('copyPathToClipboard')}
                      </CustomButton>
                    </StyledImageListItem>
                  </>
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
          marginRight: open ? '400px' : '0px',
        }}
      >
        {children}
      </Box>
      <Grid>
        <DrawerLinkManifest
          modalCreateManifestIsOpen={modalLinkManifestIsOpen}
          toggleModalManifestCreation={() => setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)}
          linkingManifest={handleLinkManifest}
        />
      </Grid>
    </div>
  );
};
