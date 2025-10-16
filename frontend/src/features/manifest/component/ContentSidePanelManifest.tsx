import {
  Box,
  Button,
  Grid,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Manifest, ManifestGroupRights } from '../types/types.ts';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { UserGroup } from '../../user-group/types/types.ts';
import { User } from '../../auth/types/types.ts';
import AddLinkIcon from '@mui/icons-material/AddLink';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { DrawerLinkManifest } from './DrawerLinkManifest.tsx';
import { useTranslation } from 'react-i18next';
import { useFetchThumbnails } from '../customHooks/useFetchManifestThumbnails.ts';
import { isValidUrl } from '../../../utils/utils.ts';
import placeholder from '../../../assets/Placeholder.svg';
import { useLinkManifest } from '../hooks/useLinkManifest.ts';

const CustomButton = styled(Button)({
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
});

const StyledImageListItem = styled(ImageListItem)({
  position: 'relative',
  '&:hover .overlayButton': {
    opacity: 1,
  },
});

interface PopUpManifestProps {
  manifests: Manifest[];
  userPersonalGroup: UserGroup;
  user: User;
  fetchManifestForUser: () => void;
}

const caddyUrl = import.meta.env.VITE_CADDY_URL;

export const ContentSidePanelManifest = ({
  manifests,
  userPersonalGroup,
  user,
  fetchManifestForUser,
}: PopUpManifestProps) => {
  const [modalLinkManifestIsOpen, setModalLinkManifestIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { mutateAsync, isPending } = useLinkManifest();
  const itemsPerPage = 6;
  const [manifestFilter, setManifestFilter] = useState<string | null>(null);

  const { t } = useTranslation();

  const isInFilter = (manifest: Manifest) => {
    if (manifestFilter) {
      return manifest.title.includes(manifestFilter);
    } else {
      return true;
    }
  };

  const currentPageData = useMemo(() => {
    const filteredAndSortedItems = [...manifests].filter((manifest) =>
      isInFilter(manifest),
    );
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedItems.slice(start, end);
  }, [currentPage, itemsPerPage, manifests, manifestFilter]);

  const { thumbnailUrls, fetchThumbnails } =
    useFetchThumbnails(currentPageData);

  const totalPages = Math.ceil(manifests.length / itemsPerPage);

  const getManifestURL = (manifest: Manifest) => {
    if (manifest.hash) {
      // Hosted on MMU
      return `${caddyUrl}/${manifest.hash}/${manifest.path}`;
    } else {
      // Linked to MMU
      return manifest.path;
    }
  };

  const handleCopyToClipBoard = async (manifest: Manifest) => {
    const manifestURL = getManifestURL(manifest);

    try {
      await navigator.clipboard.writeText(manifestURL);
      toast.success(t('pathCopiedToClipboard'));
    } catch (error) {
      toast.error(t('pathNotCopiedToClipboard'));
    }
  };

  const handleLinkManifest = useCallback(
    async (path: string) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const manifest = await response.json();

        if (
          !manifest?.['@context'] ||
          !(manifest?.['@id'] || manifest?.id) ||
          manifest?.type !== 'Manifest'
        ) {
          throw new Error('Invalid IIIF manifest structure');
        }

        await mutateAsync({
          url: path,
          rights: ManifestGroupRights.ADMIN,
          idCreator: user.id,
          user_group: userPersonalGroup!,
          path: path,
          title: manifest.label?.en?.[0] ?? t('newManifest'),
        });

        fetchManifestForUser();
        setModalLinkManifestIsOpen(!modalLinkManifestIsOpen);
        toast.success(t('manifestCreated'));
        return;
      } catch (error) {
        toast.error(t('manifestLinkingFailed'));
        return;
      }
    },
    [
      fetchManifestForUser,
      modalLinkManifestIsOpen,
      user.id,
      userPersonalGroup,
      mutateAsync,
      t,
    ],
  );

  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);
  return (
    <>
      <Grid
       
        container
        spacing={1}
        sx={{ padding: '20px' }}
        alignItems="center">
        <Grid>
          <SearchBar label={t('search')} setFilter={setManifestFilter}/>
        </Grid>
        <Grid>
          <Tooltip title={t('linkManifest')}>
            <Button
              variant="contained"
              onClick={() =>
                setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)
              }>
              <AddLinkIcon/>
            </Button>
          </Tooltip>
        </Grid>
      </Grid>
      {currentPageData.length> 0 ? (
        <ImageList
          sx={{ minWidth: 400, padding: 1, width: 400 }}
          cols={2}
          rowHeight={200}>
          {currentPageData.map((manifest, index) => (
            <>
              <StyledImageListItem key={manifest.id}>
                <Box
                  component="img"
                  src={
                    isValidUrl(thumbnailUrls[index])
                      ? `${thumbnailUrls[index]}?w=248&fit=crop&auto=format&dpr=2 2x`
                      : placeholder
                  }
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
                  }}/>
                <ImageListItemBar
                  title={manifest.title}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    color: 'white',
                  }}/>
                <CustomButton
                  className="overlayButton"
                  disableRipple
                  onClick={() => handleCopyToClipBoard(manifest!)}>
                  {t('copyPathToClipboard')}
                </CustomButton>
              </StyledImageListItem>
            </>
          ))}
        </ImageList>
      ) : (
        <Grid
         
          container
          sx={{ minWidth: 400, padding: 1, width: 400, minHeight: 400 }}
          alignItems={'center'}
          justifyContent={'center'}>
          <Typography>{t('noMatchingManifestFilter')}</Typography>
        </Grid>
      )}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}/>
      <Grid>
        <DrawerLinkManifest
          modalCreateManifestIsOpen={modalLinkManifestIsOpen}
          toggleModalManifestCreation={() =>
            setModalLinkManifestIsOpen(!modalLinkManifestIsOpen)
          }
          linkingManifest={handleLinkManifest}
          isPending={isPending}/>
      </Grid>
    </>
  );
};
