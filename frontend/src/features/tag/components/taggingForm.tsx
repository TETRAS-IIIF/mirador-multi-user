import { Accordion, AccordionDetails, AccordionSummary, Grid, Paper, Typography, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreSharp';
import { SearchBar } from '../../../components/elements/SearchBar.tsx';
import { lookingForTags } from '../api/lookingForTags.ts';
import { Manifest } from '../../manifest/types/types.ts';
import { tagging } from '../api/tagging.ts';
import { useEffect, useState } from 'react';
import { ObjectTypes, Tag, Tagging } from '../type.ts';
import { getTagsForObject } from '../api/getTagsForObject.ts';
import { removeTag } from '../api/RemoveTag.ts';
import { TagChip } from './TagChip.tsx';

interface ITaggingFormProps {
  object: { id: number };
  objectTypes: ObjectTypes;
}

export const TaggingForm = ({ object, objectTypes }: ITaggingFormProps) => {
  const [selectedTag, setSelectedTag] = useState<Tag>();
  const [userInput, setUserInput] = useState('');
  const [tags, setTags] = useState<Tagging[]>([]);
  const HandleLookingForTags = async (partialString: string) => {
    return await lookingForTags(partialString);
  };

  const HandleGetTags = async () => {
    const taggingsForObject = await getTagsForObject(object.id);
    setTags(taggingsForObject);
  };

  useEffect(() => {
    HandleGetTags();
  }, []);

  const getOptionLabelForTags = (option: Manifest): string => {
    return option.title;
  };

  const handleAddTag = async () => {
    if (selectedTag) {
      await tagging(selectedTag.title, object.id);
    }
    if (!selectedTag) {
      await tagging(userInput, object.id);
    }
    HandleGetTags();
  };

  const handleSetSelectedTag = (selectedTag: Tag) => {
    setSelectedTag(selectedTag);
  };

  const handleRemoveTag = async (tagTitle: string) => {
    await removeTag(tagTitle, objectTypes, object.id);
    HandleGetTags();
  };

  return (
    <Accordion
      component={Paper}
      elevation={1}
      sx={{ minHeight: '55px', width: '100%' }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="metadata-content"
        id="metadata-header"
      >
        <Typography variant="h6">Tagging</Typography>
      </AccordionSummary>
      <AccordionDetails style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <form
          style={{ width: '100%', marginBottom: '10px' }}
          onSubmit={() => console.log('taggingFormSubmit')}
        >
          <Grid item>
            <SearchBar
              setUserInput={setUserInput}
              label={'Tagging'}
              handleAdd={handleAddTag}
              getOptionLabel={getOptionLabelForTags}
              fetchFunction={HandleLookingForTags}
              actionButtonLabel={'ADD'}
              setSearchedData={handleSetSelectedTag}
            />
          </Grid>
        </form>
        <Grid container spacing={2}>
          {tags.map((tagging) => (
            <Grid key={tagging.tagId} item>
              <TagChip tag={tagging.tag} handleRemoveTag={handleRemoveTag} />
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};
