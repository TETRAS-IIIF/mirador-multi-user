import { Button, Grid, SelectChangeEvent, Tab, Tabs, TextField, Tooltip, Typography, } from '@mui/material';
import { ChangeEvent, Dispatch, SetStateAction, SyntheticEvent, useCallback, useEffect, useState, } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import { ItemList } from './ItemList.tsx';
import { MMUModal } from './modal.tsx';
import { ModalConfirmDelete } from '../../features/projects/components/ModalConfirmDelete.tsx';
import { ItemsRights } from '../../features/user-group/types/types.ts';
import { ListItem } from '../types.ts';
import CancelIcon from '@mui/icons-material/Cancel';
import { MediaGroupRights, mediaOrigin, } from '../../features/media/types/types.ts';
import { ManifestGroupRights, manifestOrigin, } from '../../features/manifest/types/types.ts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { ObjectTypes } from '../../features/tag/type.ts';
import { a11yProps } from './SideBar/allyProps.tsx';
import { CustomTabPanel } from './CustomTabPanel.tsx';
import { MetadataForm } from '../../features/metadata/components/metadataForm.tsx';
import { getMetadataFormat } from '../../features/metadata/api/getMetadataFormat.ts';
import { useUser } from '../../utils/auth.tsx';
import { createMetadataForItem } from '../../features/metadata/api/createMetadataForItem.ts';
import { gettingMetadataForObject } from '../../features/metadata/api/gettingMetadataForObject.ts';
import { labelMetadata } from '../../features/metadata/types/types.ts';
import { uploadMetadataFormat } from '../../features/metadata/api/uploadMetadataFormat.ts';
import toast from 'react-hot-toast';
import { fetchManifest } from '../../features/manifest/api/fetchManifest.ts';
import { updateManifestJson } from '../../features/manifest/api/updateManifestJson.ts';
import { Selector } from '../Selector.tsx';
import { useTranslation } from 'react-i18next';
import { NoteTemplate } from './CustomizationEditModal/NoteTemplate.tsx';
import { Project, Snapshot, Template, } from '../../features/projects/types/types.ts';
import { TagMaker } from './TagsFactory/TagMaker.tsx';

import { SnapshotFactory } from './SnapshotFactory.tsx';
import { isValidUrl } from '../../utils/utils.ts';
import JsonEditorWithControls from './jsonAvancedEditor.tsx';

interface ModalItemProps<T> {
  HandleOpenModalEdit: () => void;
  deleteItem?: (itemId: number) => void;
  description: string;
  duplicateItem?: (itemId: number) => void;
  fetchData: () => Promise<void>;
  getOptionLabel?: (option: { title: string }, searchInput: string) => string;
  handleAddAccessListItem: () => void;
  handleCreateSnapshot?: (projectId: number) => void;
  handleDeleteAccessListItem: (itemId: number) => void;
  handleDeleteSnapshot?: (snapshotId: number, projectId: number) => void;
  handleSelectorChange: (
    listItem: ListItem,
  ) => (event: SelectChangeEvent) => Promise<void>;
  getGroupByOption?: (option: any) => string;
  isGroups?: boolean;
  item: T;
  itemLabel: string;
  listOfItem?: ListItem[];
  metadata?: Record<string, string>;
  objectTypes?: ObjectTypes;
  ownerId: number;
  rights: ItemsRights | MediaGroupRights | ManifestGroupRights;
  searchBarLabel: string;
  searchInput: string;
  searchModalEditItem?: (partialString: string) => Promise<any[]> | any[];
  setItemToAdd?: Dispatch<SetStateAction<{ title: string } | null>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  thumbnailUrl?: string | null;
  updateItem?: (newItem: T) => void;
  fetchItems?: () => void;
}

type MetadataFormat = {
  id: number;
  title: string;
  creatorId: number;
  metadata: MetadataFormatField[];
};

type MetadataFormatField = {
  term: string;
  label: string;
  uri: string;
  definition: string;
  comment?: string;
};
type MetadataFields = {
  [key: string]: string;
};

type MetadataArray = MetadataFormat[];

export const MMUModalEdit = <
  T extends {
    created_at: Dayjs;
    hash?: string;
    id: number;
    noteTemplate?: Template[];
    origin?: manifestOrigin | mediaOrigin;
    ownerId?: number;
    path?: string;
    personalOwnerGroupId?: number;
    rights?: ItemsRights;
    snapshots?: Snapshot[];
    tags?: string[];
    title?: string;
    userWorkspace?: Record<string, string>;
  },
>({
  HandleOpenModalEdit,
  deleteItem,
  description,
  duplicateItem,
  fetchData,
  getGroupByOption,
  getOptionLabel,
  handleAddAccessListItem,
  handleDeleteAccessListItem,
  handleSelectorChange,
  isGroups,
  item,
  itemLabel,
  listOfItem,
  metadata,
  objectTypes,
  ownerId,
  rights,
  searchBarLabel,
  searchInput,
  searchModalEditItem,
  setItemToAdd,
  setSearchInput,
  thumbnailUrl,
  updateItem,
  fetchItems,
}: ModalItemProps<T>) => {
  const [newItemTitle, setNewItemTitle] = useState(itemLabel);
  const [newItemDescription, setNewItemDescription] = useState(description);
  const [newItemThumbnailUrl, setNewItemThumbnailUrl] = useState(thumbnailUrl);
  const [newItemDate, setNewItemDate] = useState<Dayjs | null>(
    dayjs(item.created_at),
  );
  const [newItemMetadataCreator, setNewItemMetadataCreator] = useState(
    metadata?.creator ? metadata.creator : null,
  );
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDuplicateModal, setOpenDuplicateModal] = useState(false);
  const [metadataFormData, setMetadataFormData] = useState<MetadataArray>();
  const [selectedMetadataData, setSelectedMetadataData] =
    useState<MetadataFields>();
  const [tabValue, setTabValue] = useState(0);
  const [metadataFormats, setMetadataFormats] = useState<MetadataFormat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMetadataFormat, setSelectedMetadataFormat] = useState<
    MetadataFormat | undefined
  >();
  const [
    jsonElementToEditInAdvancedEditor,
    setJsonElementToEditInAdvancedEditor,
  ] = useState<Record<string, string> | undefined>();
  const user = useUser();
  const { t } = useTranslation();

  const handeUpdateMetadata = (updateData: any) => {
    setSelectedMetadataData(updateData);
  };

  const [templates, setTemplates] = useState<Template[]>(
    item.noteTemplate ? item.noteTemplate : [],
  );

  const handleSetSelectedMetadataFormat = (
    newFormat: MetadataFormat | undefined,
  ) => {
    setSelectedMetadataFormat(newFormat!);
    const matchingMetadata = metadataFormData!.find(
      (data) => data.title === newFormat!.title,
    );

    if (matchingMetadata) {
      const { metadata } = matchingMetadata;
      if (metadataFormData) {
        const newData = metadataFormData.find(
          (formData) => formData.metadata == metadata,
        );
        if (newData) {
          const metadata = newData.metadata as unknown as Record<
            string,
            string
          >;

          const transformedMetadata: MetadataFields = Object.keys(
            metadata,
          ).reduce((acc, key) => {
            acc[key] = metadata[key]; // Copy the value
            return acc;
          }, {} as MetadataFields);
          setSelectedMetadataData(transformedMetadata);
        }
      }
    }
    if (!matchingMetadata) {
      const labels = extractLabelsFromMetadata(newFormat!);
      setSelectedMetadataData(labels);
    }
  };

  function extractLabelsFromMetadata(selectedMetadataFormat: {
    metadata: MetadataFormatField[];
  }): Record<string, string> {
    const labelsObject: Record<string, string> = {};
    selectedMetadataFormat.metadata.forEach((item) => {
      labelsObject[item.term.toLowerCase()] = '';
    });

    return labelsObject;
  }

  const handleUpdateItem = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rights, ...dataUpdated } = item;
    const itemToUpdate = {
      ...(dataUpdated as T),
      description: newItemDescription,
      thumbnailUrl: newItemThumbnailUrl,
      title: newItemTitle,
      templates: templates,
    };
    if (
      objectTypes !== ObjectTypes.GROUP &&
      objectTypes &&
      selectedMetadataFormat?.title
    ) {
      await createMetadataForItem(
        objectTypes!,
        dataUpdated.id,
        selectedMetadataFormat!.title,
        selectedMetadataData,
        dataUpdated.ownerId!,
      );
    }
    if (updateItem) {
      updateItem(itemToUpdate);
    }
  };

  const fetchMetadataFormat = useCallback(async () => {
    setLoading(true);
    try {
      const metadataFormat = await getMetadataFormat(user.data!.id);
      setMetadataFormats(metadataFormat);
      setSelectedMetadataFormat(metadataFormat[0]);
    } catch (error) {
      console.error('Failed to fetch metadata formats', error);
    } finally {
      setLoading(false);
    }
  }, [user.data]);

  const handleFetchMetadataForObject = async () => {
    try {
      if (selectedMetadataFormat !== null) {
        const objectMetadata = await gettingMetadataForObject(
          item.id,
          objectTypes!,
        );
        setMetadataFormData(objectMetadata);
        if (objectMetadata.length < 1) {
          const metadataFormat = await getMetadataFormat(user.data!.id);
          const labels = extractLabelsFromMetadata(metadataFormat[0]);
          setSelectedMetadataData(labels);
        } else {
          setSelectedMetadataData(objectMetadata[0].metadata);
        }
      }
    } catch (error) {
      console.error('Failed to fetch metadata formats', error);
    }
  };

  const handleChangeTitle = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItemTitle(e.target.value);
  };

  const handleChangeThumbnailUrl = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItemThumbnailUrl(e.target.value);
  };

  const handleChangeCreator = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItemMetadataCreator(e.target.value);
  };

  const handleChangeDescription = (e: ChangeEvent<HTMLInputElement>) => {
    setNewItemDescription(e.target.value);
  };

  const handleConfirmDeleteItemModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  };
  const handleConfirmDuplicateItem = () => {
    setOpenDuplicateModal(!openDuplicateModal);
  };

  const handleDuplicateModal = () => {
    setOpenDuplicateModal(!openDuplicateModal);
  };
  const handleFetchManifest = async () => {
    try {
      const manifest = await fetchManifest(item.hash!, item.path!);
      setJsonElementToEditInAdvancedEditor(manifest);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchMetadataFormat();
    handleFetchMetadataForObject();
    if (objectTypes === ObjectTypes.MANIFEST) {
      handleFetchManifest();
    }
    if (objectTypes === ObjectTypes.PROJECT) {
      if (item.userWorkspace) {
        setJsonElementToEditInAdvancedEditor(item.userWorkspace);
      }
    }
  }, []);

  const handleGetOtpionLabel = (option: { title: string }) => {
    return getOptionLabel ? getOptionLabel(option, searchInput) : '';
  };
  const handleSearchModalEditItem = (query: string) => {
    return searchModalEditItem
      ? searchModalEditItem(query)
      : ([''] as unknown as Promise<string[]>);
  };

  const handleSubmit = () => {
    handleUpdateItem();
    HandleOpenModalEdit();
  };

  const confirmDuplicate = (itemId: number) => {
    if (duplicateItem) {
      duplicateItem(itemId);
      setOpenDuplicateModal(!openDuplicateModal);
    }
  };

  const handleChangeTab = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const metadata = JSON.parse(e.target.result as string);
            const labelIndex = metadata.findIndex(
              (item: labelMetadata) => item.term === 'metadataFormatLabel',
            );
            if (labelIndex !== -1) {
              const label = metadata[labelIndex].label;
              const updatedMetadata = metadata.filter(
                (_: any, index: number) => index !== labelIndex,
              );
              const upload = await uploadMetadataFormat(
                label,
                updatedMetadata,
                user.data!.id,
              );
              if (upload.statusCode === 409) {
                toast.error(t('errorMetadataAlreadyExist'));
              }
              await fetchMetadataFormat();
            } else {
              throw new Error('Label field not found in metadata');
            }
          } catch (error) {
            console.error('Failed to parse JSON metadata', error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUpdateAdvancedEditMetadata = async (data: any) => {
    if (objectTypes === ObjectTypes.MANIFEST) {
      const newManifest = {
        manifestId: item.id,
        json: data.newData,
        origin: item.origin! as manifestOrigin,
        path: item.path!,
        hash: item.hash!,
      };
      await updateManifestJson(newManifest);
    }
    if (objectTypes === ObjectTypes.PROJECT && item.userWorkspace) {
      if (updateItem) {
        updateItem(
          {
            ...item,
            userWorkspace: data.newData,
          }!,
        );
      }
    }
  };

  const handleUpdateTemplates = async (updatedTemplates: Template[]) => {
    if (updateItem) {
      updateItem({
        ...item,
        noteTemplate: updatedTemplates,
      });
      // Not ideal to have this setState here, but we need to trigger the refresh
      // The best will be updateItem triggering refresh
      setTemplates(updatedTemplates);
    }
  };

  const handleUpdateTags = async (updatedTagList: string[]) => {
    if (updateItem) {
      updateItem({
        ...item,
        tags: updatedTagList,
      });
    }
  };

  const deleteContent =
    objectTypes === ObjectTypes.MANIFEST
      ? t('deleteConfirmationManifest')
      : objectTypes === ObjectTypes.MEDIA
        ? t('deleteConfirmationMedia')
        : t('deleteConfirmation', { itemName: itemLabel });

  return (
    <Grid
      container
      sx={{
        height: '70vh',
      }}
    >
      <Tabs
        value={tabValue}
        onChange={handleChangeTab}
        aria-label="basic tabs"
        sx={{ height: '50px' }}
      >
        <Tab
          label={
            <Tooltip title={t('tab_general_desc')}>
              <span>{t('general')}</span>
            </Tooltip>
          }
          {...a11yProps(0)}
        />

        <Tab
          label={
            <Tooltip title={t('tab_share_desc')}>
              <span>
                {objectTypes != ObjectTypes.GROUP ? t('share') : t('members')}
              </span>
            </Tooltip>
          }
          {...a11yProps(2)}
        />

        {objectTypes !== ObjectTypes.GROUP && (
          <Tab
            label={
              <Tooltip title={t('tab_metadata_desc')}>
                <span>{t('metadata')}</span>
              </Tooltip>
            }
            {...a11yProps(1)}
          />
        )}

        {(objectTypes === ObjectTypes.PROJECT ||
          (objectTypes === ObjectTypes.MANIFEST &&
            item.origin !== manifestOrigin.LINK)) &&
          !jsonElementToEditInAdvancedEditor && (
            <Tab
              label={
                <Tooltip title={t('advanced_edit_disabled')}>
                  <span>{t('advancedEdit')}</span>
                </Tooltip>
              }
              {...a11yProps(3)}
              disabled
            />
          )}

        {(objectTypes === ObjectTypes.PROJECT ||
          (objectTypes === ObjectTypes.MANIFEST &&
            item.origin !== manifestOrigin.LINK)) &&
          jsonElementToEditInAdvancedEditor && (
            <Tab
              label={
                <Tooltip title={t('tab_advanced_desc')}>
                  <span>{t('advancedEdit')}</span>
                </Tooltip>
              }
              {...a11yProps(3)}
              disabled={!jsonElementToEditInAdvancedEditor}
            />
          )}

        {objectTypes === ObjectTypes.PROJECT && (
          <Tab
            label={
              <Tooltip title={t('tab_template_desc')}>
                <span>{t('template')}</span>
              </Tooltip>
            }
            {...a11yProps(4)}
          />
        )}

        {objectTypes === ObjectTypes.PROJECT && (
          <Tab
            label={
              <Tooltip title={t('tab_tags_desc')}>
                <span>{t('tags')}</span>
              </Tooltip>
            }
            {...a11yProps(5)}
          />
        )}

        {objectTypes === ObjectTypes.PROJECT && (
          <Tab
            label={
              <Tooltip title={t('tab_snapshots_desc')}>
                <span>{t('snapshots')}</span>
              </Tooltip>
            }
            {...a11yProps(6)}
          />
        )}
      </Tabs>
      <Grid
        container
        flexDirection="column"
        justifyContent="space-between"
        sx={{ height: '90%', width: '100%' }}
      >
        <CustomTabPanel value={tabValue} index={0}>
          <Grid
            container
            spacing={2}
            sx={{
              overflowY: 'auto',
            }}
          >
            <Grid
              sx={{
                width: '100%',
                marginTop: '10px',
              }}
              container
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <TextField
                slotProps={{
                  htmlInput: { maxLength: 255 },
                }}
                type="text"
                label={t('title')}
                onChange={handleChangeTitle}
                variant="outlined"
                defaultValue={itemLabel}
                fullWidth
              />
            </Grid>
            <Grid
              sx={{ minHeight: '50px', width: '100%' }}
              container
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <TextField
                slotProps={{
                  htmlInput: { maxLength: 255 },
                }}
                type="text"
                label={t('description')}
                onChange={handleChangeDescription}
                variant="outlined"
                defaultValue={description}
                multiline
                fullWidth
              />
            </Grid>
            <Grid
              sx={{ minHeight: '50px', width: '100%' }}
              container
              justifyContent="flex-end"
              alignItems="center"
            >
              <TextField
                slotProps={{
                  htmlInput: { maxLength: 255 },
                }}
                type="text"
                label={t('creator')}
                onChange={handleChangeCreator}
                variant="outlined"
                defaultValue={
                  newItemMetadataCreator
                    ? newItemMetadataCreator
                    : user.data?.name
                }
                multiline
                fullWidth
                disabled
              />
            </Grid>
            <Grid
              sx={{ minHeight: '50px', width: '100%' }}
              container
              justifyContent="flex-start"
              alignItems="center"
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  disabled
                  label={t('createdAt')}
                  onChange={(newValue) => setNewItemDate(newValue)}
                  value={newItemDate}
                />
              </LocalizationProvider>
            </Grid>
            <Grid
              sx={{ minHeight: '50px', width: '100%' }}
              container
              justifyContent="flex-end"
              alignItems="center"
            >
              <TextField
                type="text"
                label={t('thumbnailUrl')}
                slotProps={{
                  htmlInput: { maxLength: 255 },
                }}
                onChange={handleChangeThumbnailUrl}
                variant="outlined"
                defaultValue={
                  thumbnailUrl && isValidUrl(thumbnailUrl)
                    ? thumbnailUrl
                    : undefined
                }
                multiline
                fullWidth
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        {rights !== ItemsRights.READER &&
          listOfItem &&
          setItemToAdd &&
          getOptionLabel !== undefined && (
            <CustomTabPanel value={tabValue} index={1}>
              <Grid
                container
                sx={{
                  height: '100%',
                  overflowY: 'auto',
                }}
              >
                <ItemList
                  getGroupByOption={getGroupByOption}
                  handleAddAccessListItem={handleAddAccessListItem}
                  handleGetOptionLabel={handleGetOtpionLabel}
                  handleSearchModalEditItem={handleSearchModalEditItem}
                  item={item}
                  items={listOfItem}
                  objectTypes={objectTypes!}
                  ownerId={ownerId}
                  removeItem={handleDeleteAccessListItem}
                  searchBarLabel={searchBarLabel}
                  setItemToAdd={setItemToAdd}
                  setSearchInput={setSearchInput}
                >
                  {(accessListItem) => (
                    <Selector
                      rights={
                        item.rights === ItemsRights.EDITOR
                          ? [ItemsRights.READER, ItemsRights.EDITOR]
                          : Object.values(ItemsRights)
                      }
                      value={accessListItem.rights!}
                      onChange={handleSelectorChange(accessListItem)}
                    />
                  )}
                </ItemList>
              </Grid>
            </CustomTabPanel>
          )}
        {!isGroups && (
          <CustomTabPanel value={tabValue} index={2}>
            <Grid
              container
              sx={{
                overflowY: 'auto',
                height: '100%',
                width: '100%',
              }}
            >
              <MetadataForm
                selectedMetadataData={selectedMetadataData}
                item={item}
                handleSetMetadataFormData={handeUpdateMetadata}
                metadataFormats={metadataFormats}
                loading={loading}
                selectedMetadataFormat={selectedMetadataFormat}
                setSelectedMetadataFormat={handleSetSelectedMetadataFormat}
                handleFileChange={handleFileChange}
              />
            </Grid>
          </CustomTabPanel>
        )}
        {jsonElementToEditInAdvancedEditor &&
          item.origin !== manifestOrigin.LINK && (
            <CustomTabPanel value={tabValue} index={3}>
              <Grid
                container
                sx={{
                  minHeight: '55px',
                  height: '100%',
                  overflowY: 'auto',
                }}
              >
                <JsonEditorWithControls
                  initialData={jsonElementToEditInAdvancedEditor}
                  onUpdate={handleUpdateAdvancedEditMetadata}
                />
              </Grid>
            </CustomTabPanel>
          )}
        <CustomTabPanel value={tabValue} index={4}>
          <Grid
            container
            spacing={1}
            flexDirection="column"
            sx={{
              minHeight: '55px',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Grid sx={{ height: '100%' }}>
              <NoteTemplate
                templates={templates}
                setTemplates={handleUpdateTemplates}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={5}>
          <Grid
            container
            sx={{
              minHeight: '55px',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Grid sx={{ height: '100%' }}>
              <TagMaker
                project={item as unknown as Project}
                handleUpdateTags={handleUpdateTags}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        <CustomTabPanel index={6} value={tabValue}>
          <Grid
            container
            sx={{
              minHeight: '55px',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            <Grid container sx={{ width: '100%', height: '100%' }}>
              <SnapshotFactory
                fetchItems={fetchItems!}
                objectTypes={objectTypes!}
                item={item}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        {(rights === ItemsRights.ADMIN || rights === ItemsRights.EDITOR) && (
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            flexDirection="row"
            sx={{ height: '20px', padding: 0, margin: 0 }}
          >
            <Grid container flexDirection="row" spacing={1} columns={4}>
              <Grid>
                {rights === ItemsRights.ADMIN && tabValue === 0 && (
                  <Tooltip
                    title={t('deleteObject', {
                      object: t(`objectNames.${objectTypes}`),
                    })}
                  >
                    <Button
                      color="error"
                      onClick={handleConfirmDeleteItemModal}
                      variant="contained"
                    >
                      {t('delete')}
                    </Button>
                  </Tooltip>
                )}
              </Grid>
              <Grid>
                {(rights === ItemsRights.ADMIN ||
                  rights === ItemsRights.EDITOR) &&
                  tabValue === 0 &&
                  duplicateItem && (
                    <Tooltip title={t('duplicate')}>
                      <Button
                        color="primary"
                        onClick={handleDuplicateModal}
                        variant="contained"
                      >
                        {t('duplicateMAJ')}
                      </Button>
                    </Tooltip>
                  )}
              </Grid>
            </Grid>
            <Grid
              container
              flexDirection="row"
              alignItems="center"
              justifyContent="flex-end"
              spacing={1}
              columns={6}
            >
              <Grid>
                <Button
                  variant="contained"
                  type="button"
                  onClick={HandleOpenModalEdit}
                >
                  <CancelIcon />
                  {t('cancel')}
                </Button>
              </Grid>
              <Grid>
                <Button
                  variant="contained"
                  type="submit"
                  onClick={handleSubmit}
                >
                  <SaveIcon />
                  {t('saveMAJ')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
      {openDeleteModal && (
        <MMUModal
          width={400}
          openModal={openDeleteModal}
          setOpenModal={handleConfirmDeleteItemModal}
        >
          <ModalConfirmDelete
            deleteItem={deleteItem}
            itemId={item.id}
            content={deleteContent}
            buttonLabel={t('deleteDefinitely')}
          />
        </MMUModal>
      )}
      {openDuplicateModal && (
        <MMUModal
          width={400}
          openModal={openDuplicateModal}
          setOpenModal={handleConfirmDuplicateItem}
        >
          <Grid>
            <Typography>
              {t('areYouSureDuplicate')} <b>{itemLabel}</b> ?
            </Typography>
            <Button onClick={() => confirmDuplicate(item.id)}>
              {t('yes')}
            </Button>
            <Button onClick={() => setOpenDuplicateModal(!openDuplicateModal)}>
              {t('no')}
            </Button>
          </Grid>
        </MMUModal>
      )}
    </Grid>
  );
};
