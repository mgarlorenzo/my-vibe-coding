import React, { useCallback } from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
// DragIndicatorIcon - reserved for column reordering
import { GridColumn, SortModel, Density } from '../types';

// ============================================================================
// Types
// ============================================================================

interface GridHeaderProps<T> {
  columns: GridColumn<T>[];
  sortModel: SortModel[];
  onSort: (field: string) => void;
  checkboxSelection?: boolean;
  allSelected?: boolean;
  someSelected?: boolean;
  onSelectAll?: () => void;
  density: Density;
  columnWidths: Record<string, number>;
  onColumnResize?: (field: string, width: number) => void;
}

interface HeaderCellProps<T> {
  column: GridColumn<T>;
  sortDirection?: 'asc' | 'desc';
  onSort: () => void;
  width: number;
  density: Density;
  onResize?: (width: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DENSITY_HEIGHTS: Record<Density, number> = {
  compact: 36,
  standard: 48,
  comfortable: 56,
};

// ============================================================================
// Header Cell Component
// ============================================================================

function HeaderCell<T>({
  column,
  sortDirection,
  onSort,
  width,
  density,
  onResize,
}: HeaderCellProps<T>) {
  const isSortable = column.sortable !== false;
  const isResizable = column.resizable !== false;
  
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!onResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = width;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(column.minWidth || 50, startWidth + delta);
      const maxWidth = column.maxWidth || 500;
      onResize(Math.min(newWidth, maxWidth));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [width, column.minWidth, column.maxWidth, onResize]);

  // Custom header renderer
  if (column.renderHeader) {
    return (
      <Box
        sx={{
          width,
          minWidth: column.minWidth || 50,
          height: DENSITY_HEIGHTS[density],
          display: 'flex',
          alignItems: 'center',
          px: 1,
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {column.renderHeader({
          column,
          sortDirection,
          onSort,
        })}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width,
        minWidth: column.minWidth || 50,
        height: DENSITY_HEIGHTS[density],
        display: 'flex',
        alignItems: 'center',
        px: 1,
        borderRight: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        flexShrink: 0,
        cursor: isSortable ? 'pointer' : 'default',
        userSelect: 'none',
        '&:hover': isSortable ? {
          backgroundColor: 'action.hover',
        } : {},
      }}
      onClick={isSortable ? onSort : undefined}
    >
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: column.headerAlign || column.align || 'left',
        }}
      >
        {column.headerName}
      </Typography>
      
      {sortDirection && (
        <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
          {sortDirection === 'asc' ? (
            <ArrowUpwardIcon fontSize="small" />
          ) : (
            <ArrowDownwardIcon fontSize="small" />
          )}
        </Box>
      )}
      
      {isResizable && (
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            cursor: 'col-resize',
            '&:hover': {
              backgroundColor: 'primary.main',
              opacity: 0.3,
            },
          }}
          onMouseDown={handleResizeStart}
        />
      )}
    </Box>
  );
}

// ============================================================================
// Grid Header Component
// ============================================================================

export function GridHeader<T>({
  columns,
  sortModel,
  onSort,
  checkboxSelection,
  allSelected,
  someSelected,
  onSelectAll,
  density,
  columnWidths,
  onColumnResize,
}: GridHeaderProps<T>) {
  const getSortDirection = (field: string) => {
    const sort = sortModel.find(s => s.field === field);
    return sort?.direction;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '2px solid',
        borderColor: 'divider',
        backgroundColor: 'grey.100',
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
      role="row"
    >
      {checkboxSelection && (
        <Box
          sx={{
            width: 48,
            minWidth: 48,
            height: DENSITY_HEIGHTS[density],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: '1px solid',
            borderColor: 'divider',
            flexShrink: 0,
          }}
          role="columnheader"
        >
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={onSelectAll}
            size="small"
          />
        </Box>
      )}
      
      {columns.map((column) => {
        const field = column.field as string;
        const width = columnWidths[field] || column.width || 150;
        
        return (
          <HeaderCell
            key={field}
            column={column}
            sortDirection={getSortDirection(field)}
            onSort={() => onSort(field)}
            width={width}
            density={density}
            onResize={onColumnResize ? (w) => onColumnResize(field, w) : undefined}
          />
        );
      })}
    </Box>
  );
}
