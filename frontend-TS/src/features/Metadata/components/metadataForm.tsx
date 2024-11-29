import {
  Box, CircularProgress, Divider, FormControl,
  Grid, InputLabel, MenuItem,
  Paper, Select, SelectChangeEvent
} from "@mui/material";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import MetadataField from "./metadataField.tsx";
import { useUser } from "../../../utils/auth.tsx";
import { labelMetadata, MetadataFormat } from "../types/types.ts";
import { uploadMetadataFormat } from "../api/uploadMetadataFormat.ts";
import { createMetadataForItem } from "../api/createMetadataForItem.ts";
import { ObjectTypes } from "../../tag/type.ts";

interface MetadataFormProps<T> {
  setMetadataFormData: (data: any) => void;
  metadataFormData:MetadataArray
  item:T
  metadataFormats:MetadataFormat[]
  loading: boolean
  fetchMetadataFormat:()=>void;
  selectedMetadataFormat:MetadataFormat | undefined;
  setSelectedMetadataFormat:(newFormat: MetadataFormat | undefined)=>void;
  objectTypes: ObjectTypes;
  handleFetchMetadataForObject:()=>void;
}

interface IMetadataField {
  label: string;
  [key: string]: any;
}

type MetadataFields = {
  [key: string]: string;
};

type MetadataItem = {
  metadata: MetadataFields;
  metadataFormatTitle: string;
};

type MetadataArray = MetadataItem[];

export const MetadataForm = <T extends { id:number },>({handleFetchMetadataForObject,objectTypes,setSelectedMetadataFormat,selectedMetadataFormat,fetchMetadataFormat,loading,metadataFormats,metadataFormData, setMetadataFormData, item }: MetadataFormProps<T>) => {
  const user = useUser();
  const [generatingFields, setGeneratingFields] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleInputChange = useCallback((term: string, value: string | null | undefined) => {
    setMetadataFormData((prevMetadata: { [x: string]: string }) => {
      const newValue = value ?? '';
      if (prevMetadata[term] === newValue) return prevMetadata;
      return { ...prevMetadata, [term]: newValue };
    });
  }, []);

  const doesItemContainMetadataField = (fieldTerm: string): boolean => {
    return Object.keys(item).some(itemKey => itemKey.toLowerCase() === fieldTerm.toLowerCase());
  };

  const initializeMetadata = async (selectedFormatTitle : string) => {
    if (!selectedFormatTitle) return;
    const selectedFormat = metadataFormats.find(format => format.title === selectedFormatTitle);
    if(!selectedFormat) return;
    console.log('metadataFormData',metadataFormData);
    const check = metadataFormData.find((data)=> data.metadataFormatTitle === selectedFormatTitle)
    if(check) {
      console.log('checkNULL ')
      return
    }

    console.log('metadataFormData',metadataFormData)
    console.log('selectedMetadataFormat',selectedMetadataFormat)
    console.log('selectedFormat')
    console.log('INIIIIIIIIIIIIIIIIT')

    const metadataFields: Record<string, string> = {};
    selectedFormat.metadata.forEach((field : IMetadataField) => {
      metadataFields[field.label] = "";
    });
    await createMetadataForItem( objectTypes ,item.id, selectedFormat!.title,{...metadataFields}  );
    handleFetchMetadataForObject()
    return {
      metadata: metadataFields,
      metadataFormatTitle: selectedFormat.title,
    }
  };



  const handleFormatChange = async (event: SelectChangeEvent) => {
    setGeneratingFields(true);
    const selectedFormatTitle = event.target.value;
    console.log('selectedFormatTitle',selectedFormatTitle)
    if (selectedFormatTitle === "upload") {
      setSelectedMetadataFormat(undefined)
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }
    console.log('passcheck')
    const selectedFormat = metadataFormats.find(format => format.title === selectedFormatTitle);
    console.log('selectedFormat',selectedFormat)
    const init = initializeMetadata(selectedFormatTitle!)
    console.log('init', init)
    setSelectedMetadataFormat(selectedFormat || undefined);
    console.log('pass')
    setTimeout(() => {
      setGeneratingFields(false);
    }, 300);
  };

  const shouldDisplayField = (field:any): boolean => {
    if (field.term.toLowerCase() === 'date' && 'created_at' in item) return false;
    if (field.term.toLowerCase() === 'creator' && 'ownerId' in item) return false;
    return !doesItemContainMetadataField(field.term);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const metadata = JSON.parse(e.target.result as string);
            const labelIndex = metadata.findIndex((item:labelMetadata) => item.term === "metadataFormatLabel");

            if (labelIndex !== -1) {
              const label = metadata[labelIndex].label;
              const updatedMetadata = metadata.filter((_:any, index:number) => index !== labelIndex);
              await uploadMetadataFormat(label, updatedMetadata, user.data!.id);
              fetchMetadataFormat();
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

  useEffect(() => {},[selectedMetadataFormat])

  console.log('selectedMetadataFormat',selectedMetadataFormat)
  return (
    <>
      {loading ? (
        <Grid container alignItems='center' justifyContent="center">
          <CircularProgress/>
        </Grid>
      ) : (
        <Paper
          elevation={1}
          sx={{
            minHeight: '55px',
            height: '400px',
            overflowY: 'auto',
            width: '100%',
          }}
        >
          <Box sx={{ minWidth: 120, paddingTop: 2, paddingBottom: 2 }}>
            <FormControl sx={{ width: "90%" }}>
              <InputLabel id="metadata-format-label">Format</InputLabel>
              <Select
                labelId="metadata-format-label"
                value={selectedMetadataFormat ? selectedMetadataFormat.title : ""}
                label="Format"
                onChange={handleFormatChange}
              >
                {metadataFormats.map((metadataFormat) => (
                  <MenuItem divider={true} key={metadataFormat.id} value={metadataFormat.title}>
                    {metadataFormat.title}
                  </MenuItem>
                ))}
                <MenuItem value="upload">
                  ...Upload metadata with JSON
                </MenuItem>
              </Select>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileChange}
                accept="application/json"
              />
            </FormControl>
            <Divider sx={{ paddingBottom: 2 }} />
          </Box>
          {
            metadataFormData && selectedMetadataFormat ?(
              <form style={{ width: "100%" }}>
                <>
                  {generatingFields ? (
                    <Grid container alignItems="center" justifyContent="center">
                      <CircularProgress />
                    </Grid>
                  ) : (
                    <Grid container spacing={2}>
                      {selectedMetadataFormat &&
                        selectedMetadataFormat.metadata
                          .filter(shouldDisplayField)
                          .map((field) => (
                            <MetadataField
                              key={field.term}
                              field={field}
                              value={metadataFormData[field.term] || ""}
                              handleInputChange={handleInputChange}
                            />
                          ))}
                    </Grid>
                  )}

                </>
                <Grid
                  container
                  justifyContent="flex-end"
                  spacing={2}
                  style={{ marginTop: "16px" }}
                >
                </Grid>
              </form>
            ): null
          }
        </Paper>
      )}
    </>
  );
};
