import { Button, Grid, ImageList, styled, Tab, Tabs, Tooltip, Typography, } from '@mui/material';
import { ChangeEvent, SyntheticEvent, useCallback, useEffect, useState, } from 'react';
import toast from 'react-hot-toast';
import { Media, MediaTypes } from '../types/types.ts';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { UserGroup } from '../../user-group/types/types.ts';
import { createMedia } from '../api/createMedia.ts';
import { User } from '../../auth/types/types.ts';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { createMediaLink } from '../api/createMediaWithLink.ts';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { a11yProps } from '../../../components/elements/SideBar/allyProps.tsx';
import { useTranslation } from 'react-i18next';
import { useCurrentPageData } from '../../../utils/customHooks/filterHook.ts';
import { MediaImageBox } from './MediaImageBox.tsx';
import { DrawerLinkMedia } from './DrawerLinkMedia.tsx';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface PopUpMediaProps {
  medias: Media[];
  userPersonalGroup: UserGroup;
  user: User;
  fetchMediaForUser: () => void;
  open: boolean;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

const MEDIA_TYPES_TABS = {
  ALL: 0,
  VIDEO: 1,
  IMAGE: 2,
  OTHER: 3,
};

export const ContentSidePanelMedia = ({
  medias,
  userPersonalGroup,
  user,
  fetchMediaForUser,
  open,
}: PopUpMediaProps) => {
  const [modalLinkMediaIsOpen, setModalLinkMediaIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mediaTabShown, setMediaTabShown] = useState(MEDIA_TYPES_TABS.ALL);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);
  const [sortField] = useState<keyof Media>('title');
  const [sortOrder] = useState('asc');
  const itemsPerPage = 6;
  const { t } = useTranslation();
  const handleCopyToClipBoard = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.success(t('pathCopiedToClipboard'));
    } catch (error) {
      toast.error(t('pathNotCopiedToClipboard'));
    }
  };

  useEffect(() => {
    fetchMediaForUser();
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mediaTabShown, mediaFilter]);

  const filterByMediaType = (medias: Media[]) => {
    switch (mediaTabShown) {
      case MEDIA_TYPES_TABS.VIDEO:
        return medias.filter((media) => media.mediaTypes === MediaTypes.VIDEO);
      case MEDIA_TYPES_TABS.IMAGE:
        return medias.filter((media) => media.mediaTypes === MediaTypes.IMAGE);
      case MEDIA_TYPES_TABS.OTHER:
        return medias.filter((media) => media.mediaTypes === MediaTypes.OTHER);
      default:
        return medias;
    }
  };

  const currentPageData = useCurrentPageData({
    currentPage,
    sortField,
    sortOrder,
    items: medias,
    itemsPerPage,
    filter: mediaFilter,
    customSortFunction: filterByMediaType,
  });

  const totalPages = Math.ceil(
    medias.filter((media) => {
      if (mediaTabShown === 1) {
        return media.mediaTypes === MediaTypes.VIDEO;
      } else if (mediaTabShown === 2) {
        return media.mediaTypes === MediaTypes.IMAGE;
      } else if (mediaTabShown === 3) {
        return media.mediaTypes === MediaTypes.OTHER;
      }
      return true;
    }).length / itemsPerPage,
  );

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setMediaTabShown(newValue);
    setCurrentPage(1);
  };

  const handleCreateMedia = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        await createMedia(
          {
            idCreator: user.id,
            user_group: userPersonalGroup!,
            file: event.target.files[0],
          },
          t,
        );
        fetchMediaForUser();
      }
    },
    [fetchMediaForUser, user.id, userPersonalGroup, medias],
  );

  const createMediaWithLink = async (link: string) => {
    try {
      await createMediaLink({
        url: link,
        idCreator: user.id,
        user_group: userPersonalGroup,
      });
      fetchMediaForUser();
    } catch (error) {
      console.error('Error fetching the image:', error);
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-upload')!.click();
  };
  let mediaContent;

  if (medias.length === 0) {
    mediaContent = (
      <Grid container justifyContent="center">
        <Typography variant="h6" component="h2">
          {t('noMediaYet')}
        </Typography>
      </Grid>
    );
  } else if (currentPageData.length > 0) {
    mediaContent = (
      <ImageList
        sx={{ minWidth: 400, padding: 1, width: 400 }}
        cols={2}
        rowHeight={200}
      >
        {currentPageData.map((media) => (
          <MediaImageBox
            key={media.id}
            media={media}
            caddyUrl={caddyUrl}
            handleCopyToClipBoard={handleCopyToClipBoard}
          />
        ))}
      </ImageList>
    );
  } else {
    mediaContent = (
      <Grid item container justifyContent="center" alignItems="center">
        <Typography variant="h6" component="h2">
          {t('noMatchingMediaFilter')}
        </Typography>
      </Grid>
    );
  }
  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ padding: '20px' }}
        alignItems="center"
        flexDirection="row"
      >
        <Grid item>
          <SearchBar label={t('search')} setFilter={setMediaFilter} />
        </Grid>
        <Grid item>
          <Grid container direction="column" spacing={1}>
            <Grid item>
              <Tooltip title="Upload Media">
                <Button onClick={handleButtonClick} variant="contained">
                  <UploadFileIcon />
                </Button>
              </Tooltip>
            </Grid>
            <Grid item>
              <Tooltip title="Link Media">
                <Button
                  variant="contained"
                  onClick={() => setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)}
                >
                  <AddLinkIcon />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Tabs value={mediaTabShown} onChange={handleChangeTab} aria-label="tabs">
        <Tab label={t('All')} {...a11yProps(0)} />
        <Tab label={t('Videos')} {...a11yProps(1)} />
        <Tab label={t('Images')} {...a11yProps(2)} />
        <Tab label={t('other')} {...a11yProps(3)} />
      </Tabs>
      {!medias.length && (
        <Grid container justifyContent={'center'}>
          <Typography variant="h6" component="h2">
            {t('noMediaYet')}
          </Typography>
        </Grid>
      )}
      {mediaContent}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <Grid item>
        <VisuallyHiddenInput
          id="file-upload"
          type="file"
          onChange={handleCreateMedia}
        />
      </Grid>
      <Grid>
        <DrawerLinkMedia
          isPending={false}
          toggleModalMediaCreation={() =>
            setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)
          }
          CreateMediaWithLink={createMediaWithLink}
          modalCreateMediaIsOpen={modalLinkMediaIsOpen}
        />
      </Grid>
    </>
  );
};
