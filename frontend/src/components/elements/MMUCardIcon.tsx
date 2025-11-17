import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CreateIcon from '@mui/icons-material/Create';
import DescriptionIcon from '@mui/icons-material/Description';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import ImageIcon from '@mui/icons-material/Image';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Dayjs } from 'dayjs';
import { Snapshot } from '../../features/projects/types/types.ts';
import {
  MEDIA_TYPES,
  OBJECT_ORIGIN,
  OBJECT_TYPES,
} from '../../utils/mmu_types.ts';

interface IMMUCardProps<T> {
  item: T;
  objectTypes: OBJECT_TYPES;
}

/**
 * MMUCardIcon component displays icons representing the origin and type of MMU item.
 * @constructor
 */
export const MMUCardIcon = <
  T extends {
    created_at: Dayjs;
    id: number;
    mediaTypes?: MEDIA_TYPES;
    origin?: OBJECT_ORIGIN;
    path?: string;
    share?: string;
    shared?: boolean;
    snapshots?: Snapshot[];
    thumbnailUrl?: string;
    title?: string;
    updated_at: Dayjs;
  },
>({
  item,
  objectTypes,
}: IMMUCardProps<T>) => {
  const { t } = useTranslation();

  if (item === undefined) {
    return <></>;
  }

  return (
    <>
      {item.origin === OBJECT_ORIGIN.LINK && item.mediaTypes === undefined && (
        <Tooltip title={t('linkedManifest')}>
          <LinkIcon fontSize="small" />
        </Tooltip>
      )}
      {item.origin === OBJECT_ORIGIN.LINK && item.mediaTypes && (
        <Tooltip title={t('linkedMedia')}>
          <LinkIcon fontSize="small" />
        </Tooltip>
      )}
      {item.origin === OBJECT_ORIGIN.UPLOAD &&
        item.mediaTypes === undefined && (
          <Tooltip title={t('uploadedManifest')}>
            <UploadFileIcon fontSize="small" />
          </Tooltip>
        )}
      {item.origin === OBJECT_ORIGIN.UPLOAD && item.mediaTypes && (
        <Tooltip title={t('uploadedMedia')}>
          <UploadFileIcon fontSize="small" />
        </Tooltip>
      )}
      {item.origin === OBJECT_ORIGIN.CREATE && item.mediaTypes && (
        <Tooltip title={t('createdMedia')}>
          <CreateIcon fontSize="small" />
        </Tooltip>
      )}
      {item.origin === OBJECT_ORIGIN.CREATE &&
        item.mediaTypes === undefined && (
          <Tooltip title={t('createdManifest')}>
            <CreateIcon fontSize="small" />
          </Tooltip>
        )}
      {item.shared && (
        <Tooltip title={t('shared')}>
          <ShareIcon fontSize="small" />
        </Tooltip>
      )}
      s
      {objectTypes === OBJECT_TYPES.MEDIA &&
        item.mediaTypes === MEDIA_TYPES.VIDEO && (
          <Tooltip title={t('Video')}>
            <OndemandVideoIcon />
          </Tooltip>
        )}
      {objectTypes === OBJECT_TYPES.MEDIA &&
        item.mediaTypes === MEDIA_TYPES.IMAGE && (
          <Tooltip title={t('Image')}>
            <ImageIcon />
          </Tooltip>
        )}
      {objectTypes === OBJECT_TYPES.MEDIA &&
        item.mediaTypes === MEDIA_TYPES.OTHER && (
          <Tooltip title={t('other')}>
            <DescriptionIcon />
          </Tooltip>
        )}
    </>
  );
};
