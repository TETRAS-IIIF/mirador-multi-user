import { useEffect, useState } from 'react';

const ROW_HEIGHT = 200;
const VERTICAL_OFFSET = 170;

export const useItemsPerPage = (cols: number) => {
  const [itemsPerPage, setItemsPerPage] = useState(cols * 2);

  useEffect(() => {
    const compute = () => {
      const windowHeight = window.innerHeight;
      const availableHeight = Math.max(0, windowHeight - VERTICAL_OFFSET);
      const rows = Math.max(1, Math.floor(availableHeight / ROW_HEIGHT));
      setItemsPerPage(rows * cols);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [cols]);

  return itemsPerPage;
};
