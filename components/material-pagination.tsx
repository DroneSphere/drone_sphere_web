import React from 'react';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

interface MaterialPaginationProps {
  currentPage: number;
  total: number;
  onChange: (page: number) => void;
}

const MaterialPagination: React.FC<MaterialPaginationProps> = ({
  currentPage,
  total,
  onChange,
}) => {
  return (
    <Stack className='mt-2' spacing={2} alignItems="flex-end">
      <Pagination
        count={total}
        page={currentPage}
        onChange={(_, page) => onChange(page)}
        color="primary"
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            fontSize: '1rem',
            minWidth: 32,
            height: 32,
          },
        }}
      />
      <div className='mt-1'>
        共{total}页
      </div>
    </Stack>
  );
};

export default MaterialPagination;