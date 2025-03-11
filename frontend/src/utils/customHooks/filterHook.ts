import { useMemo } from "react";
import dayjs from "dayjs";

interface IUseCurrentPageData {
  currentPage: number;
  sortField: keyof any;
  sortOrder: string;
  items: any[];
  itemsPerPage: number;
  filter: string | null;
  customSortFunction?: (items: any[]) => any[];
}

export const useCurrentPageData = ({
  currentPage,
  sortField,
  sortOrder,
  items,
  itemsPerPage,
  filter,
  customSortFunction,
}: IUseCurrentPageData) => {
  return useMemo(() => {
    let filteredItems = items.filter((item) => isInFilter(item, filter));
    if (customSortFunction) {
      filteredItems = customSortFunction(filteredItems);
    }

    const filteredAndSortedItems = sortItem(
      sortField,
      filteredItems,
      sortOrder,
    );

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedItems.slice(start, end);
  }, [
    items,
    sortField,
    sortOrder,
    customSortFunction,
    currentPage,
    itemsPerPage,
    filter,
  ]);
};

const isInFilter = (item: any, filter: string | null) => {
  if (filter) {
    return item.title.toLowerCase().includes(filter.toLowerCase());
  } else {
    return true;
  }
};

const sortItem = (sortField: keyof any, items: any[], sortOrder: string) => {
  return [...items].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    let comparison = 0;

    if (sortField === "updated_at") {
      const aDate = dayjs.isDayjs(aValue) ? aValue : dayjs(aValue);
      const bDate = dayjs.isDayjs(bValue) ? bValue : dayjs(bValue);
      comparison = aDate.valueOf() - bDate.valueOf();
    } else if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });
};
