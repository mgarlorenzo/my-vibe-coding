
import {
  Box,
  TablePagination,
  Typography,
} from '@mui/material';

// ============================================================================
// Types
// ============================================================================

interface GridFooterProps {
  rowCount: number;
  selectedCount: number;
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPagination?: boolean;
}

// ============================================================================
// Grid Footer Component
// ============================================================================

export function GridFooter({
  rowCount,
  selectedCount,
  page,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  showPagination = true,
}: GridFooterProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 1,
        backgroundColor: 'grey.50',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {selectedCount > 0 && (
          <Typography variant="body2" color="text.secondary">
            {selectedCount} row{selectedCount !== 1 ? 's' : ''} selected
          </Typography>
        )}
        
        <Typography variant="body2" color="text.secondary">
          {rowCount} total row{rowCount !== 1 ? 's' : ''}
        </Typography>
      </Box>
      
      {showPagination && (
        <TablePagination
          component="div"
          count={rowCount}
          page={page}
          onPageChange={(_, newPage) => onPageChange(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          rowsPerPageOptions={pageSizeOptions}
          sx={{
            '& .MuiTablePagination-toolbar': {
              minHeight: 'auto',
            },
          }}
        />
      )}
    </Box>
  );
}
