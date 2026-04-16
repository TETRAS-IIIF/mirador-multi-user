import { useMemo } from 'react';
import dayjs from 'dayjs';

export const UPDATED_AT = 'updated_at';
export const TITLE = 'title';

interface IUseCurrentPageData {
  currentPage: number;
  sortField: keyof any;
  sortOrder: string;
  items: any[];
  itemsPerPage: number;
  filter: string | null;
  customFilterFunction?: (items: any[]) => any[];
  customSortFunction?: (items: any[]) => any[];
}

export const useCurrentPageData = ({
  currentPage,
  sortField,
  sortOrder,
  items,
  itemsPerPage,
  filter,
  customFilterFunction,
  customSortFunction,
}: IUseCurrentPageData) => {
  return useMemo(() => {
    let filteredItems = items.filter((item) => isInFilter(item, filter));

    if (customFilterFunction) {
      filteredItems = customFilterFunction(filteredItems);
    }

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

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    return {
      currentPageData: filteredAndSortedItems.slice(start, end),
      totalPages,
    };
  }, [
    items,
    sortField,
    sortOrder,
    customFilterFunction,
    customSortFunction,
    currentPage,
    itemsPerPage,
    filter,
  ]);
};

const isInFilter = (item: any, filter: string | null) => {
  if (!filter) return true;

  const normalizedFilter = filter.toLowerCase();
  const normalizedTitle = String(item?.title ?? '').toLowerCase();
  const normalizedDescription = String(item?.description ?? '').toLowerCase();

  return (
    normalizedTitle.includes(normalizedFilter) ||
    normalizedDescription.includes(normalizedFilter)
  );
};

const sortItem = (sortField: keyof any, items: any[], sortOrder: string) => {
  return [...items].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    let comparison = 0;

    if (sortField === UPDATED_AT) {
      const aDate = dayjs.isDayjs(aValue) ? aValue : dayjs(aValue);
      const bDate = dayjs.isDayjs(bValue) ? bValue : dayjs(bValue);
      comparison = aDate.valueOf() - bDate.valueOf();
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};
