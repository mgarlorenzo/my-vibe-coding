import React, { useCallback, useMemo } from 'react';
import { Box, Checkbox, CircularProgress, Tooltip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import { GridColumn, RowId, CellState, Density, EditCellRenderParams } from '../types';
import { renderEditor } from '../editors';

// ============================================================================
// Types
// ============================================================================

interface GridCellProps<T> {
  row: T;
  rowId: RowId;
  column: GridColumn<T>;
  width: number;
  density: Density;
  isEditing: boolean;
  editValue?: unknown;
  cellState: CellState;
  error?: string;
  isFocused: boolean;
  isSelected: boolean;
  onStartEdit: () => void;
  onUpdateValue: (value: unknown) => void;
  onCommit: () => void;
  onCancel: () => void;
  onClick?: (event: React.MouseEvent) => void;
  onDoubleClick?: (event: React.MouseEvent) => void;
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
// Helper Functions
// ============================================================================

function getColumnValue<T>(row: T, column: GridColumn<T>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }
  return (row as Record<string, unknown>)[column.field as string];
}

function formatValue<T>(value: unknown, row: T, column: GridColumn<T>): React.ReactNode {
  if (column.valueFormatter) {
    return column.valueFormatter(value, row);
  }
  
  if (value == null) {
    return '';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  
  if (column.type === 'date' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }
  
  if (column.type === 'datetime' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  }
  
  return String(value);
}

// ============================================================================
// Grid Cell Component
// ============================================================================

export function GridCell<T>({
  row,
  rowId,
  column,
  width,
  density,
  isEditing,
  editValue,
  cellState,
  error,
  isFocused,
  // isSelected - reserved for row selection styling
  onStartEdit,
  onUpdateValue,
  onCommit,
  onCancel,
  onClick,
  onDoubleClick,
}: GridCellProps<T>) {
  const value = useMemo(() => getColumnValue(row, column), [row, column]);
  const displayValue = useMemo(() => formatValue(value, row, column), [value, row, column]);
  
  const isEditable = useMemo(() => {
    if (typeof column.editable === 'function') {
      return column.editable(row);
    }
    return column.editable === true;
  }, [column, row]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // Stop propagation to prevent row's double-click from firing
    if (isEditable && !isEditing) {
      e.stopPropagation();
      onStartEdit();
    }
    onDoubleClick?.(e);
  }, [isEditable, isEditing, onStartEdit, onDoubleClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isEditing && isEditable) {
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        onStartEdit();
      }
    }
  }, [isEditing, isEditable, onStartEdit]);

  // Render custom cell if provided
  if (!isEditing && column.renderCell) {
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
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: isFocused ? 'action.selected' : 'transparent',
          outline: isFocused ? '2px solid' : 'none',
          outlineColor: 'primary.main',
          outlineOffset: -2,
        }}
        onClick={onClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={isFocused ? 0 : -1}
        role="gridcell"
      >
        {column.renderCell({
          row,
          rowId,
          field: column.field as string,
          value,
          column,
          isEditing,
          cellState,
        })}
      </Box>
    );
  }

  // Render editing state
  if (isEditing) {
    const editParams: EditCellRenderParams<T> = {
      row,
      rowId,
      field: column.field as string,
      value: editValue,
      column,
      onChange: onUpdateValue,
      onCommit,
      onCancel,
      error,
    };

    return (
      <Box
        sx={{
          width,
          minWidth: column.minWidth || 50,
          height: DENSITY_HEIGHTS[density],
          display: 'flex',
          alignItems: 'center',
          borderRight: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          backgroundColor: 'background.paper',
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: -2,
          zIndex: 1,
        }}
        role="gridcell"
      >
        {renderEditor(editParams, column)}
      </Box>
    );
  }

  // Render normal cell
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
        flexShrink: 0,
        overflow: 'hidden',
        backgroundColor: isFocused ? 'action.selected' : 'transparent',
        outline: isFocused ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        outlineOffset: -2,
        cursor: isEditable ? 'text' : 'default',
        position: 'relative',
      }}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isFocused ? 0 : -1}
      role="gridcell"
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: column.align || 'left',
        }}
      >
        {displayValue}
      </Box>
      
      {/* State indicators */}
      {cellState === 'saving' && (
        <CircularProgress size={16} sx={{ ml: 0.5 }} />
      )}
      
      {cellState === 'error' && error && (
        <Tooltip title={error}>
          <ErrorOutlineIcon color="error" fontSize="small" sx={{ ml: 0.5 }} />
        </Tooltip>
      )}
      
      {cellState === 'conflict' && (
        <Tooltip title="Conflict with remote changes">
          <SyncProblemIcon color="warning" fontSize="small" sx={{ ml: 0.5 }} />
        </Tooltip>
      )}
    </Box>
  );
}

// ============================================================================
// Checkbox Cell Component
// ============================================================================

interface CheckboxCellProps {
  isSelected: boolean;
  onToggle: () => void;
  density: Density;
}

export function CheckboxCell({ isSelected, onToggle, density }: CheckboxCellProps) {
  return (
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
      role="gridcell"
    >
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        size="small"
        onClick={(e) => e.stopPropagation()}
      />
    </Box>
  );
}
