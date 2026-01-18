import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { GridColumn, RowId, Density, EditingCell } from '../types';
import { GridCell, CheckboxCell } from './GridCell';

// ============================================================================
// Types
// ============================================================================

interface GridRowProps<T> {
  row: T;
  rowId: RowId;
  columns: GridColumn<T>[];
  columnWidths: Record<string, number>;
  density: Density;
  isSelected: boolean;
  checkboxSelection?: boolean;
  editingCells: Map<string, EditingCell>;
  focusedCell: { rowId: RowId; field: string } | null;
  onToggleSelection: () => void;
  onStartEdit: (field: string) => void;
  onUpdateValue: (field: string, value: unknown) => void;
  onCommit: (field: string) => void;
  onCancel: (field: string) => void;
  onCellClick?: (field: string, event: React.MouseEvent) => void;
  onCellDoubleClick?: (field: string, event: React.MouseEvent) => void;
  onRowClick?: (event: React.MouseEvent) => void;
  onRowDoubleClick?: (event: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
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
// Grid Row Component
// ============================================================================

export function GridRow<T>({
  row,
  rowId,
  columns,
  columnWidths,
  density,
  isSelected,
  checkboxSelection,
  editingCells,
  focusedCell,
  onToggleSelection,
  onStartEdit,
  onUpdateValue,
  onCommit,
  onCancel,
  onCellClick,
  onCellDoubleClick,
  onRowClick,
  onRowDoubleClick,
  style,
  className,
}: GridRowProps<T>) {
  const getCellKey = useCallback((field: string) => `${rowId}:${field}`, [rowId]);

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
        '&:hover': {
          backgroundColor: isSelected ? 'action.selected' : 'action.hover',
        },
        minHeight: DENSITY_HEIGHTS[density],
      }}
      style={style}
      className={className}
      onClick={onRowClick}
      onDoubleClick={onRowDoubleClick}
      role="row"
      aria-selected={isSelected}
    >
      {checkboxSelection && (
        <CheckboxCell
          isSelected={isSelected}
          onToggle={onToggleSelection}
          density={density}
        />
      )}
      
      {columns.map((column) => {
        const field = column.field as string;
        const cellKey = getCellKey(field);
        const editingCell = editingCells.get(cellKey);
        const isEditing = !!editingCell;
        const isFocused = focusedCell?.rowId === rowId && focusedCell?.field === field;
        const width = columnWidths[field] || column.width || 150;

        return (
          <GridCell
            key={field}
            row={row}
            rowId={rowId}
            column={column}
            width={width}
            density={density}
            isEditing={isEditing}
            editValue={editingCell?.value}
            cellState={editingCell?.state || 'pristine'}
            error={editingCell?.error}
            isFocused={isFocused}
            isSelected={isSelected}
            onStartEdit={() => onStartEdit(field)}
            onUpdateValue={(value) => onUpdateValue(field, value)}
            onCommit={() => onCommit(field)}
            onCancel={() => onCancel(field)}
            onClick={onCellClick ? (e) => onCellClick(field, e) : undefined}
            onDoubleClick={onCellDoubleClick ? (e) => onCellDoubleClick(field, e) : undefined}
          />
        );
      })}
    </Box>
  );
}
