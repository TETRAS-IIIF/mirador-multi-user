import { useMemo } from "react";
import { Item } from "../../types";
import { Item } from "../../features/manifest/types/types.ts";

interface IUseCurrentPageData {
  currentPage: number;
  sortField: string;
  sortOrder: string;
  items: Item[];
  itemsPerPage: number;
  deps: any[];
  filter: string;
}

export const useCurrentPageData = ({
  currentPage,
  sortField,
  sortOrder,
  items,
  itemsPerPage,
  deps,
  filter,
}: IUseCurrentPageData) => {
  return useMemo(() => {
    const filteredAndSortedItems = [...items]
      .filter((item) => isInFilter(item, filter))
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        let comparison = 0;

        if (sortField === "created_at") {
          const aDate = typeof aValue === "string" ? new Date(aValue) : aValue;
          const bDate = typeof bValue === "string" ? new Date(bValue) : bValue;
          comparison = aDate.getTime() - bDate.getTime();
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedItems.slice(start, end);
  }, deps);
};

const isInFilter = (item: Item, filter: string) => {
  if (filter) {
    return item.title.includes(filter);
  } else {
    return true;
  }
};
