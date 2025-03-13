import {
  Button,
  Grid,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import SaveIcon from "@mui/icons-material/Save";
import { ItemList } from "./ItemList.tsx";
import { MMUModal } from "./modal.tsx";
import { ModalConfirmDelete } from "../../features/projects/components/ModalConfirmDelete.tsx";
import { ItemsRights } from "../../features/user-group/types/types.ts";
import { ListItem } from "../types.ts";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  MediaGroupRights,
  mediaOrigin,
} from "../../features/media/types/types.ts";
import {
  ManifestGroupRights,
  manifestOrigin,
} from "../../features/manifest/types/types.ts";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { ObjectTypes } from "../../features/tag/type.ts";
import { a11yProps } from "./SideBar/allyProps.tsx";
import { CustomTabPanel } from "./CustomTabPanel.tsx";
import { MetadataForm } from "../../features/metadata/components/metadataForm.tsx";
import { getMetadataFormat } from "../../features/metadata/api/getMetadataFormat.ts";
import { useUser } from "../../utils/auth.tsx";
import { createMetadataForItem } from "../../features/metadata/api/createMetadataForItem.ts";
import { gettingMetadataForObject } from "../../features/metadata/api/gettingMetadataForObject.ts";
import { labelMetadata } from "../../features/metadata/types/types.ts";
import { uploadMetadataFormat } from "../../features/metadata/api/uploadMetadataFormat.ts";
import toast from "react-hot-toast";
import { JsonEditor } from "json-edit-react";
import { fetchManifest } from "../../features/manifest/api/fetchManifest.ts";
import { updateManifestJson } from "../../features/manifest/api/updateManifestJson.ts";
import { Selector } from "../Selector.tsx";
import { useTranslation } from "react-i18next";
import { NoteTemplate } from "./CustomizationEditModal/NoteTemplate.tsx";
import { Project, Template } from "../../features/projects/types/types.ts";
import { TagMaker } from "./TagsFactory/TagMaker.tsx";

interface ModalItemProps<T, G> {
  item: T;
  itemLabel: string;
  updateItem?: (newItem: T) => void;
  deleteItem?: (itemId: number) => void;
  duplicateItem?: (itemId: number) => void;
  handleDeleteAccessListItem: (itemId: number) => void;
  searchModalEditItem?: (partialString: string) => Promise<any[]> | any[];
  getOptionLabel?: (option: G, searchInput: string) => string;
  handleSelectorChange: (
    listItem: ListItem,
  ) => (event: SelectChangeEvent) => Promise<void>;
  fetchData: () => Promise<void>;
  listOfItem?: ListItem[];
  setItemToAdd?: Dispatch<SetStateAction<G | null>>;
  handleAddAccessListItem: () => void;
  setSearchInput: Dispatch<SetStateAction<string>>;
  searchInput: string;
  rights: ItemsRights | MediaGroupRights | ManifestGroupRights;
  searchBarLabel: string;
  description: string;
  HandleOpenModalEdit: () => void;
  thumbnailUrl?: string | null;
  metadata?: Record<string, string>;
  isGroups?: boolean;
  objectTypes?: ObjectTypes;
  getGroupByOption?: (option: any) => string;
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
  [key: string]: string; // Abstracts all possible key-value pairs where keys are strings and values are strings
};

type MetadataArray = MetadataFormat[];

export const MMUModalEdit = <
  T extends {
    title: string;
    id: number;
    origin?: manifestOrigin | mediaOrigin;
    created_at: Dayjs;
    snapShotHash?: string;
    hash?: string;
    path?: string;
    userWorkspace?: Record<string, string>;
    rights?: ItemsRights;
    noteTemplate?: Template[];
    tags?: string[];
  },
  G extends { title: string },
>({
  itemLabel,
  setItemToAdd,
  item,
  updateItem,
  deleteItem,
  searchModalEditItem,
  getOptionLabel,
  handleSelectorChange,
  fetchData,
  listOfItem,
  handleAddAccessListItem,
  setSearchInput,
  searchInput,
  rights,
  searchBarLabel,
  handleDeleteAccessListItem,
  description,
  HandleOpenModalEdit,
  thumbnailUrl,
  metadata,
  isGroups,
  getGroupByOption,
  duplicateItem,
  objectTypes,
}: ModalItemProps<T, G>) => {
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

  const [updatedTemplateList, setUpdatedTemplateList] = useState<
    Template[] | undefined
  >(item.noteTemplate ? item.noteTemplate : undefined);

  const user = useUser();
  const { t } = useTranslation();

  const handeUpdateMetadata = (updateData: any) => {
    setSelectedMetadataData(updateData);
  };

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
      labelsObject[item.term.toLowerCase()] = "";
    });

    return labelsObject;
  }

  const handleUpdateItem = async () => {
    let itemToUpdate = {
      ...(item as T),
      description: newItemDescription,
      thumbnailUrl: newItemThumbnailUrl,
      title: newItemTitle,
    };
    if (updatedTemplateList) {
      itemToUpdate = {
        ...itemToUpdate,
        noteTemplate: updatedTemplateList,
      };
    }
    if (
      objectTypes !== ObjectTypes.GROUP &&
      objectTypes &&
      selectedMetadataFormat?.title
    ) {
      await createMetadataForItem(
        objectTypes!,
        item.id,
        selectedMetadataFormat!.title,
        selectedMetadataData,
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
      console.error("Failed to fetch metadata formats", error);
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
      console.error("Failed to fetch metadata formats", error);
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

  const handleGetOtpionLabel = (option: G) => {
    return getOptionLabel ? getOptionLabel(option, searchInput) : "";
  };
  const handleSearchModalEditItem = (query: string) => {
    return searchModalEditItem
      ? searchModalEditItem(query)
      : ([""] as unknown as Promise<string[]>);
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
              (item: labelMetadata) => item.term === "metadataFormatLabel",
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
                toast.error(t("errorMetadataAlreadyExist"));
              }
              await fetchMetadataFormat();
            } else {
              throw new Error("Label field not found in metadata");
            }
          } catch (error) {
            console.error("Failed to parse JSON metadata", error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUpdateAdvancedEditMetadata = async (data: any) => {
    // We can edit manifest or project userworkspace

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
      // Update project userworkspace
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

  const handleUpdateTemplate = async () => {
    if (updateItem) {
      updateItem({
        ...item,
        noteTemplate: updatedTemplateList,
      });
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

  function isValidUrl(string: string) {
    const pattern =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
    return pattern.test(string);
  }

  return (
    <Grid container>
      <Tabs value={tabValue} onChange={handleChangeTab} aria-label="basic tabs">
        <Tab label={t("general")} {...a11yProps(0)} />
        <Tab
          label={objectTypes != ObjectTypes.GROUP ? t("share") : t("members")}
          {...a11yProps(2)}
        />
        {objectTypes !== ObjectTypes.GROUP && (
          <Tab label={t("metadata")} {...a11yProps(1)} />
        )}
        {(objectTypes === ObjectTypes.PROJECT ||
          (objectTypes === ObjectTypes.MANIFEST &&
            item.origin !== manifestOrigin.LINK)) && (
          <Tab label={t("advancedEdit")} {...a11yProps(3)} />
        )}
        {objectTypes === ObjectTypes.PROJECT && (
          <Tab label={t("templates")} {...a11yProps(4)} />
        )}
        {objectTypes === ObjectTypes.PROJECT && (
          <Tab label={t("tags")} {...a11yProps(5)} />
        )}
      </Tabs>
      <Grid item container flexDirection="column">
        <CustomTabPanel value={tabValue} index={0}>
          <Grid
            container
            item
            sx={{
              minHeight: "55px",
              height: "400px",
              overflowY: "auto",
            }}
          >
            <Grid
              item
              sx={{ minHeight: "50px", width: "100%", marginTop: "10px" }}
              container
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <TextField
                type="text"
                label={t("title")}
                onChange={handleChangeTitle}
                variant="outlined"
                defaultValue={itemLabel}
                fullWidth
              />
            </Grid>
            <Grid
              item
              sx={{ minHeight: "50px", width: "100%" }}
              container
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <TextField
                type="text"
                label={t("description")}
                onChange={handleChangeDescription}
                variant="outlined"
                defaultValue={description}
                multiline
                fullWidth
              />
            </Grid>
            <Grid
              item
              sx={{ minHeight: "50px", width: "100%" }}
              container
              justifyContent="flex-end"
              alignItems="center"
            >
              <TextField
                type="text"
                label={t("creator")}
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
              item
              sx={{ minHeight: "50px", width: "100%" }}
              container
              justifyContent="flex-start"
              alignItems="center"
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  disabled
                  label={t("createdAt")}
                  onChange={(newValue) => setNewItemDate(newValue)}
                  value={newItemDate}
                />
              </LocalizationProvider>
            </Grid>
            <Grid
              item
              sx={{ minHeight: "50px", width: "100%" }}
              container
              justifyContent="flex-end"
              alignItems="center"
            >
              <TextField
                type="text"
                label={t("thumbnailUrl")}
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
                item
                sx={{
                  minHeight: "55px",
                  height: "400px",
                  overflowY: "auto",
                }}
              >
                <ItemList
                  item={item}
                  objectTypes={objectTypes!}
                  snapShotHash={item.snapShotHash ? item.snapShotHash : ""}
                  handleAddAccessListItem={handleAddAccessListItem}
                  setItemToAdd={setItemToAdd}
                  items={listOfItem}
                  handleSearchModalEditItem={handleSearchModalEditItem}
                  removeItem={handleDeleteAccessListItem}
                  searchBarLabel={searchBarLabel}
                  setSearchInput={setSearchInput}
                  handleGetOptionLabel={handleGetOtpionLabel}
                  getGroupByOption={getGroupByOption}
                >
                  {(accessListItem) => (
                    <Selector
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
              item
              sx={{
                minHeight: "55px",
                height: "400px",
                overflowY: "auto",
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
                item
                sx={{
                  minHeight: "55px",
                  height: "400px",
                  overflowY: "auto",
                }}
              >
                <JsonEditor
                  data={jsonElementToEditInAdvancedEditor}
                  onUpdate={handleUpdateAdvancedEditMetadata}
                />
              </Grid>
            </CustomTabPanel>
          )}
        <CustomTabPanel value={tabValue} index={4}>
          <Grid
            container
            item
            spacing={1}
            flexDirection="column"
            sx={{
              minHeight: "55px",
              height: "600px",
              overflowY: "auto",
            }}
          >
            <Grid item sx={{ height: "100%" }}>
              <NoteTemplate
                project={item as unknown as Project}
                handleUpdateTemplate={handleUpdateTemplate}
                setUpdatedTemplateList={setUpdatedTemplateList}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        <CustomTabPanel value={tabValue} index={5}>
          <Grid
            container
            item
            spacing={1}
            flexDirection="column"
            sx={{
              minHeight: "55px",
              height: "400px",
              overflowY: "auto",
            }}
          >
            <Grid item sx={{ height: "100%" }}>
              <TagMaker
                project={item as unknown as Project}
                handleUpdateTags={handleUpdateTags}
              />
            </Grid>
          </Grid>
        </CustomTabPanel>
        {(rights === ItemsRights.ADMIN || rights === ItemsRights.EDITOR) && (
          <Grid
            item
            container
            justifyContent="space-between"
            alignItems="center"
            flexDirection="row"
          >
            <Grid item container xs={5} spacing={3}>
              <Grid item>
                {rights === ItemsRights.ADMIN && tabValue === 0 && (
                  <Tooltip title={t("deleteItem")}>
                    <Button
                      color="error"
                      onClick={handleConfirmDeleteItemModal}
                      variant="contained"
                    >
                      {t("delete")}
                    </Button>
                  </Tooltip>
                )}
              </Grid>
              <Grid item>
                {(rights === ItemsRights.ADMIN ||
                  rights === ItemsRights.EDITOR) &&
                  tabValue === 0 &&
                  duplicateItem && (
                    <Tooltip title={t("duplicate")}>
                      <Button
                        color="primary"
                        onClick={handleDuplicateModal}
                        variant="contained"
                      >
                        {t("duplicateMAJ")}
                      </Button>
                    </Tooltip>
                  )}
              </Grid>
            </Grid>
            <Grid
              item
              container
              justifyContent="flex-end"
              flexDirection="row"
              alignItems="center"
              spacing={2}
              sx={{ width: "auto", marginTop: "1px" }}
            >
              <Grid item>
                <Button
                  variant="contained"
                  type="button"
                  onClick={HandleOpenModalEdit}
                >
                  <CancelIcon />
                  {t("cancel")}
                </Button>
              </Grid>

              <Grid item>
                <Button
                  variant="contained"
                  type="submit"
                  onClick={handleSubmit}
                >
                  <SaveIcon />
                  {t("saveMAJ")}
                </Button>
              </Grid>
            </Grid>
            <MMUModal
              width={400}
              openModal={openDeleteModal}
              setOpenModal={handleConfirmDeleteItemModal}
            >
              <ModalConfirmDelete
                deleteItem={deleteItem}
                itemId={item.id}
                content={t("deleteConfirmation", {
                  itemName: itemLabel,
                })}
                buttonLabel={t("deleteDefinitely")}
              />
            </MMUModal>
            <MMUModal
              width={400}
              openModal={openDuplicateModal}
              setOpenModal={handleConfirmDuplicateItem}
            >
              <Grid>
                <Typography>
                  {" "}
                  {t("areYouSureDuplicate")} <b>{itemLabel}</b> ?
                </Typography>
                <Button onClick={() => confirmDuplicate(item.id)}>
                  {t("yes")}
                </Button>
                <Button
                  onClick={() => setOpenDuplicateModal(!openDuplicateModal)}
                >
                  {t("no")}
                </Button>
              </Grid>
            </MMUModal>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
