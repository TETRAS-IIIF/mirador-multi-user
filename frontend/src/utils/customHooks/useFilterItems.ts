import { useMemo } from 'react';
import dayjs from 'dayjs';

export const UPDATED_AT = 'updated_at';
export const TITLE = 'title';

interface IUseFilterItems {
  sortField: keyof any;
  sortOrder: string;
  items: any[];
  filter: string | null;
  customSortFunction?: (items: any[]) => any[];
}

export const useFilterItems = ({
  sortField,
  sortOrder,
  items,
  filter,
  customSortFunction,
}: IUseFilterItems) => {
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

    return filteredAndSortedItems;
  }, [items, sortField, sortOrder, customSortFunction, filter]);
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
