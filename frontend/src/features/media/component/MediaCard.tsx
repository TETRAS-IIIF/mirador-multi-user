import { Media } from '../types/types.ts';
import MMUCard from '../../../components/elements/MMUCard.tsx';
import { ObjectTypes } from '../../tag/type.ts';
import { ModalButton } from '../../../components/elements/ModalButton.tsx';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { ListItem } from '../../../components/types.ts';
import { Dispatch, SetStateAction } from 'react';
import { ProjectGroup } from '../../projects/types/types.ts';
import { LinkUserGroup } from '../../user-group/types/types.ts';
import { useTranslation } from 'react-i18next';

interface IMediaCardProps {
  media: Media;
  handleGrantAccess: (itemId: number) => Promise<void>,
  HandleCopyToClipBoard: (string: string) => void,
  HandleOpenModal: (id: number) => void,
  HandleDeleteMedia: (itemId: number) => void,
  getAllMediaGroups: (itemId: number) => Promise<any>,
  getOptionLabel: (option: any, searchInput: string) => string,
  listOfGroup: ListItem[],
  openModalMediaId: number | null,
  handleRemoveAccessToMedia: (itemId: number, accessItemId: number) => Promise<void>,
  handleLookingForUserGroups: (partialString: string) => Promise<any[]> | any[],
  setGroupList: Dispatch<SetStateAction<ProjectGroup[]>>,
  setUserToAdd: Dispatch<SetStateAction<LinkUserGroup | null>>,
  caddyUrl: string,
  HandleUpdateMedia: (item: Media) => void,
  handleChangeRights: (itemList: ListItem, eventValue: string, itemId: number, owner: any) => Promise<void>,
  getGroupByOption: (option: any) => string,
}

export const MediaCard = (
  {
    media,
    handleGrantAccess,
    HandleCopyToClipBoard,
    HandleOpenModal,
    HandleDeleteMedia,
    getAllMediaGroups,
    getOptionLabel,
    listOfGroup,
    openModalMediaId,
    handleRemoveAccessToMedia,
    handleLookingForUserGroups,
    setGroupList,
    setUserToAdd,
    caddyUrl,
    HandleUpdateMedia,
    handleChangeRights,
    getGroupByOption
  }: IMediaCardProps) => {
  const { t } = useTranslation();

  return (
    <MMUCard
      objectTypes={ObjectTypes.MEDIA}
      AddAccessListItemFunction={handleGrantAccess}
      DefaultButton={
        <ModalButton
          tooltipButton={t('tooltipMediaLink')}
          onClickFunction={media.path ? () => HandleCopyToClipBoard(`${caddyUrl}/${media.hash}/${media.path}`) : () => HandleCopyToClipBoard(media.url)}
          disabled={false}
          icon={<ContentCopyIcon />}
        />
      }
      EditorButton={
        <ModalButton
          tooltipButton={t('editMedia')}
          onClickFunction={() => HandleOpenModal(media.id)}
          icon={<ModeEditIcon />}
          disabled={false}
        />
      }
      HandleOpenModal={() => HandleOpenModal(media.id)}
      ReaderButton={
        <ModalButton
          tooltipButton={t('openProjectTooltip')}
          onClickFunction={() => console.log('You\'re not allowed to do this')}
          icon={<ModeEditIcon />}
          disabled={true}
        />
      }
      deleteItem={() => HandleDeleteMedia(media.id)}
      description={media.description}
      getAccessToItem={getAllMediaGroups}
      getOptionLabel={getOptionLabel}
      id={media.id}
      item={media}
      itemLabel={media.title}
      listOfItem={listOfGroup}
      metadata={media.metadata}
      openModal={openModalMediaId === media.id}
      removeAccessListItemFunction={handleRemoveAccessToMedia}
      rights={media.rights}
      searchBarLabel={t('search')}
      searchModalEditItem={handleLookingForUserGroups}
      setItemList={setGroupList}
      setItemToAdd={setUserToAdd}
      thumbnailUrl={`${caddyUrl}/${media.hash}/thumbnail.webp`}
      updateItem={HandleUpdateMedia}
      handleSelectorChange={handleChangeRights}
      getGroupByOption={getGroupByOption}
    />
  );
};
