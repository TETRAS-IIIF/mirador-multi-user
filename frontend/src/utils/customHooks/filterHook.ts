import { useMemo } from "react";
import { Item } from "../types";

interface IUseCurrentPageData {
  currentPage: number;
  sortField: keyof Item;
  sortOrder: string;
  items: Item[];
  itemsPerPage: number;
  filter: string | null;
}

export const useCurrentPageData = ({
  currentPage,
  sortField,
  sortOrder,
  items,
  itemsPerPage,
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
  }, [currentPage, sortField, sortOrder, items, itemsPerPage, filter]);
};

const isInFilter = (item: Item, filter: string | null) => {
  if (filter) {
    return item.title.includes(filter);
  } else {
    return true;
  }
};
