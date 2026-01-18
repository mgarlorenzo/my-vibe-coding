import React, { useRef, useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  TreeNode,
  RowNode,
  GroupNode,
  GridColumn,
  RowId,
  Density,
  EditingCell,
  SelectionModel,
} from '../types';
import { GridRow } from './GridRow';
import { GridGroupRow } from './GridGroupRow';

// ============================================================================
// Types
// ============================================================================

interface GridBodyProps<T> {
  nodes: TreeNode<T>[];
  columns: GridColumn<T>[];
  columnWidths: Record<string, number>;
  getRowId: (row: T) => RowId;
  density: Density;
  checkboxSelection?: boolean;
  selectionModel: SelectionModel;
  editingCells: Map<string, EditingCell>;
  focusedCell: { rowId: RowId; field: string } | null;
  loading?: boolean;
  
  // Pagination (for client mode)
  page?: number;
  pageSize?: number;
  
  // Callbacks
  onToggleSelection: (rowId: RowId) => void;
  onToggleGroupExpanded: (groupId: string) => void;
  onStartEdit: (rowId: RowId, field: string) => void;
  onUpdateValue: (rowId: RowId, field: string, value: unknown) => void;
  onCommit: (rowId: RowId, field: string) => void;
  onCancel: (rowId: RowId, field: string) => void;
  onCellClick?: (rowId: RowId, field: string, event: React.MouseEvent) => void;
  onCellDoubleClick?: (rowId: RowId, field: string, event: React.MouseEvent) => void;
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  
  // Styling
  getRowClassName?: (row: T) => string;
  
  // Container height
  height?: number | string;
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
// Grid Body Component
// ============================================================================

export function GridBody<T>({
  nodes,
  columns,
  columnWidths,
  // getRowId is used in renderNode callback
  density,
  checkboxSelection,
  selectionModel,
  editingCells,
  focusedCell,
  loading,
  page = 0,
  pageSize,
  onToggleSelection,
  onToggleGroupExpanded,
  onStartEdit,
  onUpdateValue,
  onCommit,
  onCancel,
  onCellClick,
  onCellDoubleClick,
  onRowClick,
  onRowDoubleClick,
  getRowClassName,
  height = 400,
}: GridBodyProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowHeight = DENSITY_HEIGHTS[density];

  // Apply pagination if in client mode
  const paginatedNodes = useMemo(() => {
    if (pageSize == null) return nodes;
    const start = page * pageSize;
    const end = start + pageSize;
    return nodes.slice(start, end);
  }, [nodes, page, pageSize]);

  // Virtual list
  const virtualizer = useVirtualizer({
    count: paginatedNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Render a single node (row or group)
  const renderNode = useCallback((node: TreeNode<T>, style: React.CSSProperties) => {
    if (node.type === 'group') {
      const groupNode = node as GroupNode<T>;
      return (
        <GridGroupRow
          key={groupNode.id}
          group={groupNode}
          columns={columns}
          columnWidths={columnWidths}
          density={density}
          checkboxSelection={checkboxSelection}
          onToggleExpand={() => onToggleGroupExpanded(groupNode.id)}
          style={style}
        />
      );
    }

    const rowNode = node as RowNode<T>;
    const rowId = rowNode.id;
    const row = rowNode.row;
    const isSelected = selectionModel.selectedIds.has(rowId);

    return (
      <GridRow
        key={String(rowId)}
        row={row}
        rowId={rowId}
        columns={columns}
        columnWidths={columnWidths}
        density={density}
        isSelected={isSelected}
        checkboxSelection={checkboxSelection}
        editingCells={editingCells}
        focusedCell={focusedCell}
        onToggleSelection={() => onToggleSelection(rowId)}
        onStartEdit={(field) => onStartEdit(rowId, field)}
        onUpdateValue={(field, value) => onUpdateValue(rowId, field, value)}
        onCommit={(field) => onCommit(rowId, field)}
        onCancel={(field) => onCancel(rowId, field)}
        onCellClick={onCellClick ? (field, e) => onCellClick(rowId, field, e) : undefined}
        onCellDoubleClick={onCellDoubleClick ? (field, e) => onCellDoubleClick(rowId, field, e) : undefined}
        onRowClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
        onRowDoubleClick={onRowDoubleClick ? (e) => onRowDoubleClick(row, e) : undefined}
        style={{
          ...style,
          paddingLeft: rowNode.depth * 24,
        }}
        className={getRowClassName?.(row)}
      />
    );
  }, [
    columns,
    columnWidths,
    density,
    checkboxSelection,
    selectionModel,
    editingCells,
    focusedCell,
    onToggleSelection,
    onToggleGroupExpanded,
    onStartEdit,
    onUpdateValue,
    onCommit,
    onCancel,
    onCellClick,
    onCellDoubleClick,
    onRowClick,
    onRowDoubleClick,
    getRowClassName,
  ]);

  // Loading overlay
  if (loading && paginatedNodes.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (paginatedNodes.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No rows to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={parentRef}
      sx={{
        height: height || '100%',
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        position: 'relative',
      }}
      role="rowgroup"
    >
      {/* Loading overlay for refresh */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      <Box
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const node = paginatedNodes[virtualItem.index];
          
          return (
            <Box
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderNode(node, {})}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
