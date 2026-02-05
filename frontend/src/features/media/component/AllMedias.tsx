import {
  Box,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChangeEvent,
  Dispatch,
  ReactNode,
  SetStateAction,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createMedia } from '../api/createMedia.ts';
import { User } from '../../auth/types/types.ts';
import { LinkUserGroup, UserGroup } from '../../user-group/types/types.ts';
import { Media } from '../types/types.ts';
import toast from 'react-hot-toast';
import { deleteMedia } from '../api/deleteMedia.ts';
import { updateMedia } from '../api/updateMedia.ts';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { lookingForUserGroups } from '../../user-group/api/lookingForUserGroups.ts';
import { addMediaToGroup } from '../api/AddMediaToGroup.ts';
import { ListItem } from '../../../components/types.ts';
import { ProjectGroup } from '../../projects/types/types.ts';
import { removeAccessToMedia } from '../api/removeAccessToMedia.ts';
import { updateAccessToMedia } from '../api/updateAccessToMedia.ts';
import SpeedDialTooltipOpen from '../../../components/elements/SpeedDial.tsx';
import AddLinkIcon from '@mui/icons-material/AddLink';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { DrawerLinkMedia } from './DrawerLinkMedia.tsx';
import { PaginationControls } from '../../../components/elements/Pagination.tsx';
import { a11yProps } from '../../../components/elements/SideBar/allyProps.tsx';
import { MediaCard } from './MediaCard.tsx';
import { useTranslation } from 'react-i18next';
import { SortItemSelector } from '../../../components/elements/sortItemSelector.tsx';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { removeMediaFromList } from '../api/removeManifestFromList.ts';
import { MediaFooter } from '../../../../customAssets/MediaFooter.tsx';
import {
  caddyUrl,
  getSettingValue,
  isFileSizeOverLimit,
  isValidFileForUpload,
  SettingKeys,
} from '../../../utils/utils.ts';
import {
  TITLE,
  UPDATED_AT,
  useCurrentPageData,
} from '../../../utils/customHooks/filterHook.ts';
import { useCreateMediaLink } from '../hooks/useCreateMediaLink.ts';
import { useAdminSettings } from '../../../utils/customHooks/useAdminSettings.ts';
import { getAccessToMedia } from '../api/getAccessToMedia.ts';
import { VisuallyHiddenInput } from './VisuallyHiddenInput.tsx';
import {
  ITEM_RIGHTS,
  MEDIA_TYPES,
  MEDIA_TYPES_TABS,
  USER_GROUP_TYPES,
} from '../../../utils/mmu_types.ts';
import { reuploadMedia } from '../api/reuploadMedia.ts';

interface IAllMediasProps {
  user: User;
  userPersonalGroup: UserGroup;
  medias: Media[];
  fetchMediaForUser: () => void;
  setMedias: Dispatch<SetStateAction<Media[]>>;
}

export const AllMedias = ({
  user,
  userPersonalGroup,
  medias,
  fetchMediaForUser,
  setMedias,
}: IAllMediasProps) => {
  const [openModalMediaId, setOpenModalMediaId] = useState<number | null>(null);
  const [userGroupsSearch, setUserGroupSearch] = useState<LinkUserGroup[]>([]);
  const [userToAdd, setUserToAdd] = useState<LinkUserGroup | null>(null);
  const [groupList, setGroupList] = useState<ProjectGroup[]>([]);
  const [mediaFilter, setMediaFilter] = useState<string | null>(null);
  const [modalLinkMediaIsOpen, setModalLinkMediaIsOpen] = useState(false);
  const [mediaTabShown, setMediaTabShown] = useState(MEDIA_TYPES_TABS.ALL);
  const [sortField, setSortField] = useState<keyof Media>(UPDATED_AT);
  const [sortOrder, setSortOrder] = useState('desc');
  const { mutateAsync, isPending } = useCreateMediaLink();
  const { data: settings } = useAdminSettings();
  const [thumbRefreshKey, setThumbRefreshKey] = useState(0);

  const [MAX_UPLOAD_SIZE] = useState<number | undefined>(
    Number(getSettingValue(SettingKeys.MAX_UPLOAD_SIZE, settings)),
  );

  const { t } = useTranslation();

  useEffect(() => {
    fetchMediaForUser();
  }, []);

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setMediaTabShown(newValue);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filterByMediaType = (medias: Media[]) => {
    if (mediaTabShown === MEDIA_TYPES_TABS.VIDEO) {
      return medias.filter((media) => media.mediaTypes === MEDIA_TYPES.VIDEO);
    } else if (mediaTabShown === MEDIA_TYPES_TABS.IMAGE) {
      return medias.filter((media) => media.mediaTypes === MEDIA_TYPES.IMAGE);
    } else if (mediaTabShown === MEDIA_TYPES_TABS.OTHER) {
      return medias.filter((media) => media.mediaTypes === MEDIA_TYPES.OTHER);
    } else if (mediaTabShown === MEDIA_TYPES_TABS.ALL) {
      return medias;
    }
    return [];
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
      if (mediaTabShown === MEDIA_TYPES_TABS.VIDEO) {
        return media.mediaTypes === MEDIA_TYPES.VIDEO;
      } else if (mediaTabShown === MEDIA_TYPES_TABS.IMAGE) {
        return media.mediaTypes === MEDIA_TYPES.IMAGE;
      } else if (mediaTabShown === MEDIA_TYPES_TABS.OTHER) {
        return media.mediaTypes === MEDIA_TYPES.OTHER;
      }
      return true;
    }).length / itemsPerPage,
  );
  const handleCreateMedia = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      if (!isValidFileForUpload(file)) {
        toast.error(t('unsupportedMedia'));
        return;
      }
      if (isFileSizeOverLimit(file, MAX_UPLOAD_SIZE!)) {
        toast.error(
          t('fileTooLarge', {
            maxSize: MAX_UPLOAD_SIZE,
          }),
        );
        return;
      }
      // Proceed with media creation
      await createMedia(
        {
          idCreator: user.id,
          user_group: userPersonalGroup!,
          file: file,
        },
        t,
      );

      fetchMediaForUser();
    },
    [fetchMediaForUser, medias],
  );

  const HandleCopyToClipBoard = async (path: string) => {
    await navigator.clipboard.writeText(path);
    toast.success(t('successCopy'));
  };

  const HandleOpenModal = useCallback(
    (mediaId: number) => {
      setOpenModalMediaId(openModalMediaId === mediaId ? null : mediaId);
    },
    [setOpenModalMediaId, openModalMediaId],
  );

  const HandleDeleteMedia = useCallback(
    async (mediaId: number) => {
      await deleteMedia(mediaId);
      const updatedListOfMedias = medias.filter(function (media) {
        return media.id != mediaId;
      });
      setMedias(updatedListOfMedias);
    },
    [medias, setMedias],
  );

  const HandleUpdateMedia = useCallback(
    async (mediaToUpdate: Media) => {
      const updatedListOfMedias = medias.filter(function (media) {
        return media.id != mediaToUpdate.id;
      });
      updatedListOfMedias.push(mediaToUpdate);
      setMedias(updatedListOfMedias);
      fetchMediaForUser();
    },
    [medias, setMedias],
  );

  const handleGrantAccess = async (mediaId: number) => {
    if (userToAdd == null) {
      toast.error(t('toastSelectItem'));
    }
    const linkUserGroupToAdd = userGroupsSearch.find(
      (linkUserGroup) => linkUserGroup.user_group.id === userToAdd!.id,
    );
    await addMediaToGroup(mediaId, linkUserGroupToAdd!.user_group.id);
  };

  const getOptionLabel = (option: UserGroup): string => {
    return option.title;
  };
  const listOfGroup: ListItem[] = useMemo(() => {
    return groupList.map((projectGroup) => ({
      id: projectGroup.user_group.id,
      title: projectGroup.user_group.title,
      rights: projectGroup.rights,
      type: projectGroup.user_group.type,
      personalOwnerGroupId: projectGroup.user_group.ownerId,
    }));
  }, [groupList]);

  const handleLookingForUserGroups = async (
    partialString: string,
  ): Promise<UserGroup[]> => {
    if (partialString.length > 0) {
      const linkUserGroups: LinkUserGroup[] =
        await lookingForUserGroups(partialString);
      const uniqueUserGroups: UserGroup[] = linkUserGroups
        .map((linkUserGroup) => linkUserGroup.user_group)
        .filter(
          (group, index, self) =>
            index === self.findIndex((g) => g.id === group.id),
        );
      setUserGroupSearch(linkUserGroups);
      return uniqueUserGroups;
    } else {
      setUserGroupSearch([]);
      return [];
    }
  };

  const handleRemoveAccessToMedia = async (
    mediaId: number,
    userGroupId: number,
  ) => {
    await removeAccessToMedia(mediaId, userGroupId);
    fetchMediaForUser();
  };
  const handleChangeRights = async (
    group: ListItem,
    eventValue: string,
    mediaId: number,
  ) => {
    const newRights = await updateAccessToMedia(
      mediaId,
      group.id,
      eventValue as ITEM_RIGHTS,
    );

    if (newRights.error) {
      toast.error(t('not_allowed_to_modify_rights'));
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-upload')!.click();
  };

  const actions = [
    {
      icon: (<UploadFileIcon />) as ReactNode,
      name: t('actionsDial.upload'),
      onClick: () => {
        handleButtonClick();
      },
    },
    {
      icon: (<AddLinkIcon />) as ReactNode,
      name: t('actionsDial.link'),
      onClick: () => {
        setModalLinkMediaIsOpen(!modalLinkMediaIsOpen);
      },
    },
  ];
  const createMediaWithLink = async (link: string) => {
    await mutateAsync(
      {
        url: link,
        idCreator: user.id,
        user_group: userPersonalGroup,
      },
      {
        onSuccess: (data) => {
          toast.success(t('media_created'));
          fetchMediaForUser();
          HandleOpenModal(data.id);
        },
        onError: (error) => {
          toast.error(`${t('media_creation_failed')} : ${t(error.message)}`);
        },
      },
    );
  };

  const getGroupByOption = (option: UserGroup): string => {
    if (option.type === USER_GROUP_TYPES.MULTI_USER) {
      return 'Groups';
    } else {
      return 'Users';
    }
  };

  const handleReplaceItem = async (
    file: File,
    itemId: number,
    itemName: string,
    hash: string,
  ) => {
    try {
      const result = await reuploadMedia(file, itemId, itemName, hash);

      if (!result.ok) {
        toast.error(t('unmatchingExtensionError'));
        return;
      }

      toast.success(t('mediaReplaced'));
      setThumbRefreshKey((k) => k + 1);
    } catch {
      toast.error(t('uploadFailed'));
    }
    return fetchMediaForUser();
  };

  const handleRemoveMediaFromList = async (
    mediaId: number,
    share: string | undefined,
  ) => {
    if (share) {
      return toast.error(t('share-media-error-message'));
    } else {
      await removeMediaFromList(mediaId);
      toast.success(t('removedMediaFromList'));
      return fetchMediaForUser();
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Grid container flexDirection="column" spacing={1}>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#dcdcdc',
            paddingBottom: '10px',
          }}
        >
          <Grid>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={mediaTabShown}
                onChange={handleChangeTab}
                aria-label="basic tabs"
              >
                <Tab label={t('All')} {...a11yProps(0)} />
                <Tab label={t('Videos')} {...a11yProps(1)} />
                <Tab label={t('Images')} {...a11yProps(2)} />
                <Tab label={t('other')} {...a11yProps(3)} />
              </Tabs>
            </Box>
          </Grid>
          <Grid>
            <VisuallyHiddenInput
              id="file-upload"
              type="file"
              onChange={handleCreateMedia}
            />
          </Grid>
          <Grid
            container
            spacing={2}
            sx={{ width: 'auto', paddingTop: 1, paddingBottom: 1 }}
            alignItems="center"
            justifyContent="flex-end"
          >
            <Grid>
              <SearchBar setFilter={setMediaFilter} label={t('filterMedia')} />
            </Grid>
            <Grid>
              <SortItemSelector<Media>
                sortField={sortField}
                setSortField={setSortField}
                fields={[TITLE, UPDATED_AT]}
              />
            </Grid>
            <Grid>
              <Tooltip title={t(sortOrder === 'asc' ? 'sortAsc' : 'sortDesc')}>
                <IconButton onClick={toggleSortOrder}>
                  {sortOrder === 'asc' ? (
                    <ArrowDropUpIcon />
                  ) : (
                    <ArrowDropDownIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Grid>
        {!medias.length && (
          <Grid container justifyContent={'center'}>
            <Typography variant="h6" component="h2">
              {t('noMediaYet')}
            </Typography>
          </Grid>
        )}
        <Grid
          container
          spacing={1}
          flexDirection="column"
          sx={{ marginBottom: '70px' }}
        >
          <Grid container spacing={1} direction="column">
            {medias.length > 0 &&
              (currentPageData.length > 0 ? (
                currentPageData.map((media: Media) => (
                  <Grid key={media.id}>
                    <MediaCard
                      media={{
                        ...media,
                        thumbnailUrl: media.thumbnailUrl
                          ? media.thumbnailUrl
                          : media.hash && media.mediaTypes === MEDIA_TYPES.IMAGE
                            ? `${caddyUrl}/${media.hash}/thumbnail.webp`
                            : undefined,
                      }}
                      thumbnailRefreshKey={thumbRefreshKey}
                      ownerId={media.idCreator}
                      getAccessToMedia={getAccessToMedia}
                      getOptionLabel={getOptionLabel}
                      getGroupByOption={getGroupByOption}
                      HandleOpenModal={HandleOpenModal}
                      HandleDeleteMedia={HandleDeleteMedia}
                      handleGrantAccess={handleGrantAccess}
                      HandleCopyToClipBoard={HandleCopyToClipBoard}
                      handleReplaceItem={handleReplaceItem}
                      HandleUpdateMedia={HandleUpdateMedia}
                      caddyUrl={caddyUrl}
                      handleChangeRights={handleChangeRights}
                      handleLookingForUserGroups={handleLookingForUserGroups}
                      handleRemoveAccessToMedia={handleRemoveAccessToMedia}
                      openModalMediaId={openModalMediaId}
                      listOfGroup={listOfGroup}
                      setGroupList={setGroupList}
                      setUserToAdd={setUserToAdd}
                      handleRemoveMediaFromList={handleRemoveMediaFromList}
                    />
                  </Grid>
                ))
              ) : (
                <Grid container justifyContent="center" alignItems="center">
                  <Typography variant="h6" component="h2">
                    {t('noMatchingMediaFilter')}
                  </Typography>
                </Grid>
              ))}
          </Grid>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </Grid>
        <Grid>
          <DrawerLinkMedia
            isPending={isPending}
            toggleModalMediaCreation={() =>
              setModalLinkMediaIsOpen(!modalLinkMediaIsOpen)
            }
            CreateMediaWithLink={createMediaWithLink}
            modalCreateMediaIsOpen={modalLinkMediaIsOpen}
          />
        </Grid>
        <Grid
          sx={{ position: 'fixed', right: '10px', bottom: '3px', zIndex: 999 }}
        >
          <SpeedDialTooltipOpen actions={actions} />
        </Grid>
      </Grid>
      <Grid width={'100%'} height={'100%'}>
        <MediaFooter />
      </Grid>
    </Box>
  );
};
