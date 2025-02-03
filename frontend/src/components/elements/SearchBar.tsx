import { Autocomplete, Button, Grid, TextField } from "@mui/material";
import { useDebounceCallback } from "usehooks-ts";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

interface IUsersSearchBarProps<T> {
  handleAdd?: () => void;
  setSelectedData?: Dispatch<SetStateAction<string | null>>;
  setSearchedData?: any;
  fetchFunction?: (partialString: string) => Promise<any[]> | any[];
  getOptionLabel?: (option: any) => string;
  setSearchInput?: (value: string) => void;
  actionButtonLabel?: string;
  label: string;
  setFilter?: (filteredArray: any[]) => void;
  handleFiltered?: (partialString: string) => T[];
  setUserInput?: (input: string) => void;
  groupByOption?: (option: any) => string;
}

export const SearchBar = <T extends { title: string }>({
  setUserInput,
  handleFiltered,
  setFilter,
  label,
  getOptionLabel,
  setSearchedData,
  setSelectedData,
  fetchFunction,
  handleAdd,
  setSearchInput,
  actionButtonLabel,
  groupByOption,
}: IUsersSearchBarProps<T>) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>("");

  const handleFetchData = async (partialDataName: string) => {
    try {
      if (fetchFunction) {
        const data = await fetchFunction(partialDataName);
        if (data) {
          setSuggestions(data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const debouncedFetch = useDebounceCallback(async (value: string) => {
    await handleFetchData(value);
  }, 500);

  const handleInputChange = async (_event: SyntheticEvent, value: string) => {
    setSearchValue(value);

    if (!value) {
      setSuggestions([]);
      if (setFilter) setFilter([]);
    }
    if (setUserInput) setUserInput(value);
    if (handleFiltered) {
      const filteredItems = handleFiltered(value);
      setSuggestions(filteredItems.map((item) => item.title));
      if (setFilter) setFilter(filteredItems); // Update filter
    }
    if (setSearchInput) setSearchInput(value);
    if (setSelectedData && fetchFunction) {
      fetchFunction(value);
    }
    if (value && fetchFunction) {
      await debouncedFetch(value);
    }
  };

  const handleTextFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);

    if (setUserInput) setUserInput(value);
    if (setSearchInput) setSearchInput(value);

    if (handleFiltered) {
      const filteredItems = handleFiltered(value);
      setSuggestions(filteredItems.map((item) => item.title));
      if (setFilter) setFilter(filteredItems); // Update filter dynamically
    }

    if (!value && setFilter) setFilter([]);
  };

  const handleChange = (_event: SyntheticEvent, value: string | null) => {
    if (setSelectedData) {
      setSelectedData(value);
    } else if (setSearchedData) {
      setSearchedData(value);
    }
  };

  return (
    <Grid container flexDirection="column" spacing={1}>
      <Grid container spacing={2} alignItems="center">
        {fetchFunction ? (
          <Grid item>
            <Autocomplete
              disablePortal
              onInputChange={handleInputChange}
              sx={{ width: "250px" }}
              onChange={handleChange}
              id="combo-box-demo"
              options={suggestions}
              clearOnBlur={false}
              renderInput={(params) => <TextField {...params} label={label} />}
              getOptionLabel={getOptionLabel}
              groupBy={groupByOption}
              noOptionsText={t("noOptions")}
            />
          </Grid>
        ) : (
          <Grid item>
            <TextField
              label={label}
              variant="outlined"
              value={searchValue}
              onChange={handleTextFieldChange}
              sx={{ width: "250px" }}
              InputProps={{ type: "search" }}
            />
          </Grid>
        )}
        {actionButtonLabel && (
          <Grid item>
            <Button variant="contained" onClick={handleAdd}>
              {actionButtonLabel}
            </Button>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};
