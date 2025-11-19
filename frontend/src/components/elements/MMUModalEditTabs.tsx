import { Tab, Tabs, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { a11yProps } from './SideBar/allyProps';
import { OBJECT_ORIGIN, OBJECT_TYPES } from 'utils/mmu_types';

interface MMUModalEditTabsProps {
  editableJsonElement: boolean;
  handleChangeTab: (event: React.SyntheticEvent, newValue: number) => void;
  objectOrigin: string;
  objectType: string;
  tabValue: number;
}

export function MMUModalEditTabs({
  editableJsonElement,
  handleChangeTab,
  objectOrigin,
  objectType,
  tabValue,
}: MMUModalEditTabsProps) {
  const { t } = useTranslation();
  return (
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
              {objectType != OBJECT_TYPES.GROUP ? t('share') : t('members')}
            </span>
          </Tooltip>
        }
        {...a11yProps(2)}
      />

      {objectType !== OBJECT_TYPES.GROUP && (
        <Tab
          label={
            <Tooltip title={t('tab_metadata_desc')}>
              <span>{t('metadata')}</span>
            </Tooltip>
          }
          {...a11yProps(1)}
        />
      )}

      {(objectType === OBJECT_TYPES.PROJECT ||
        (objectType === OBJECT_TYPES.MANIFEST &&
          objectOrigin !== OBJECT_ORIGIN.LINK)) &&
        !editableJsonElement && (
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

      {(objectType === OBJECT_TYPES.PROJECT ||
        (objectType === OBJECT_TYPES.MANIFEST &&
          objectOrigin !== OBJECT_ORIGIN.LINK)) &&
        editableJsonElement && (
          <Tab
            label={
              <Tooltip title={t('tab_advanced_desc')}>
                <span>{t('advancedEdit')}</span>
              </Tooltip>
            }
            {...a11yProps(3)}
            disabled={!editableJsonElement}
          />
        )}

      {objectType === OBJECT_TYPES.PROJECT && (
        <Tab
          label={
            <Tooltip title={t('tab_template_desc')}>
              <span>{t('template')}</span>
            </Tooltip>
          }
          {...a11yProps(4)}
        />
      )}

      {objectType === OBJECT_TYPES.PROJECT && (
        <Tab
          label={
            <Tooltip title={t('tab_tags_desc')}>
              <span>{t('tags')}</span>
            </Tooltip>
          }
          {...a11yProps(5)}
        />
      )}

      {objectType === OBJECT_TYPES.PROJECT && (
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
  );
}
