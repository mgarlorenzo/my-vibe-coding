import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Popover,
  TextField,
  Checkbox,
  Typography,
  InputAdornment,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GridColumn, ColumnVisibilityModel } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ColumnManagerPanelProps<T> {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  columns: GridColumn<T>[];
  columnOrder: string[];
  columnVisibility: ColumnVisibilityModel;
  onColumnOrderChange: (order: string[]) => void;
  onColumnVisibilityChange: (model: ColumnVisibilityModel) => void;
}

interface SortableColumnItemProps {
  id: string;
  label: string;
  isVisible: boolean;
  disableHiding: boolean;
  disableReorder: boolean;
  isDragDisabled: boolean;
  onToggleVisibility: () => void;
}

// ============================================================================
// Sortable Column Item
// ============================================================================

function SortableColumnItem({
  id,
  label,
  isVisible,
  disableHiding,
  disableReorder,
  isDragDisabled,
  onToggleVisibility,
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: disableReorder || isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const canDrag = !disableReorder && !isDragDisabled;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      data-testid={`column-item-${id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        py: 0.75,
        px: 1,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Drag handle */}
      <Box
        {...(canDrag ? { ...attributes, ...listeners } : {})}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: canDrag ? 'grab' : 'not-allowed',
          color: canDrag ? 'text.secondary' : 'action.disabled',
          mr: 0.5,
        }}
        data-testid={`drag-handle-${id}`}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>

      {/* Checkbox */}
      <Checkbox
        checked={isVisible}
        disabled={disableHiding}
        onChange={onToggleVisibility}
        size="small"
        data-testid={`column-checkbox-${id}`}
        sx={{ p: 0.5 }}
      />

      {/* Label */}
      <Typography
        variant="body2"
        sx={{
          ml: 1,
          flex: 1,
          color: disableHiding ? 'text.secondary' : 'text.primary',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ============================================================================
// Column Manager Panel
// ============================================================================

export function ColumnManagerPanel<T>({
  anchorEl,
  open,
  onClose,
  columns,
  columnOrder,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
}: ColumnManagerPanelProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create a map of columns by field for quick lookup
  const columnsByField = useMemo(() => {
    const map = new Map<string, GridColumn<T>>();
    columns.forEach(col => map.set(col.field as string, col));
    return map;
  }, [columns]);

  // Get ordered columns based on columnOrder
  const orderedColumns = useMemo(() => {
    // Start with columns in the specified order
    const ordered: GridColumn<T>[] = [];
    const seen = new Set<string>();

    // Add columns in order
    columnOrder.forEach(field => {
      const col = columnsByField.get(field);
      if (col) {
        ordered.push(col);
        seen.add(field);
      }
    });

    // Add any remaining columns not in the order (new columns)
    columns.forEach(col => {
      const field = col.field as string;
      if (!seen.has(field)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [columns, columnOrder, columnsByField]);

  // Filter columns by search query
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) {
      return orderedColumns;
    }

    const query = searchQuery.toLowerCase().trim();
    return orderedColumns.filter(col => {
      const field = (col.field as string).toLowerCase();
      const headerName = col.headerName.toLowerCase();
      return field.includes(query) || headerName.includes(query);
    });
  }, [orderedColumns, searchQuery]);

  // Check if drag is disabled (when search is active)
  const isDragDisabled = searchQuery.trim().length > 0;

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeField = active.id as string;
      const overField = over.id as string;

      // Find indices in the full ordered list
      const oldIndex = orderedColumns.findIndex(col => col.field === activeField);
      const newIndex = orderedColumns.findIndex(col => col.field === overField);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(
          orderedColumns.map(col => col.field as string),
          oldIndex,
          newIndex
        );
        onColumnOrderChange(newOrder);
      }
    }
  }, [orderedColumns, onColumnOrderChange]);

  // Handle visibility toggle
  const handleToggleVisibility = useCallback((field: string) => {
    const currentVisibility = columnVisibility[field] !== false;
    onColumnVisibilityChange({
      ...columnVisibility,
      [field]: !currentVisibility,
    });
  }, [columnVisibility, onColumnVisibilityChange]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Reset search when closing
  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      data-testid="column-manager-panel"
      slotProps={{
        paper: {
          sx: {
            width: 280,
            maxHeight: 400,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Columns
        </Typography>
        
        {/* Search input */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search columns..."
          value={searchQuery}
          onChange={handleSearchChange}
          data-testid="column-search-input"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Drag disabled notice */}
      {isDragDisabled && (
        <Alert severity="info" sx={{ mx: 2, mt: 1, py: 0.5 }} data-testid="drag-disabled-notice">
          <Typography variant="caption">
            Clear search to reorder columns
          </Typography>
        </Alert>
      )}

      {/* Column list */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 1,
        }}
        data-testid="column-list"
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredColumns.map(col => col.field as string)}
            strategy={verticalListSortingStrategy}
          >
            {filteredColumns.map(column => {
              const field = column.field as string;
              const isVisible = columnVisibility[field] !== false;
              const disableHiding = column.disableHiding === true;
              const disableReorder = column.disableReorder === true;

              return (
                <SortableColumnItem
                  key={field}
                  id={field}
                  label={column.headerName}
                  isVisible={isVisible}
                  disableHiding={disableHiding}
                  disableReorder={disableReorder}
                  isDragDisabled={isDragDisabled}
                  onToggleVisibility={() => handleToggleVisibility(field)}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        {/* No results */}
        {filteredColumns.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 2 }}
            data-testid="no-columns-found"
          >
            No columns found
          </Typography>
        )}
      </Box>
    </Popover>
  );
}
