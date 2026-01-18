import { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Typography,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import DensityLargeIcon from '@mui/icons-material/DensityLarge';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ClearIcon from '@mui/icons-material/Clear';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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
import { GridColumn, Density, ColumnVisibilityModel, FilterModel, ExportScope } from '../types';
import { FilterPanel, FieldDefinition } from './FilterPanel';
import { AdvancedFilterPanel, AdvancedFilterField, AdvancedFilterModel } from './AdvancedFilterPanel';
import { ExportDialog } from './ExportDialog';
import { ColumnManagerPanel } from './ColumnManagerPanel';

// ============================================================================
// Types
// ============================================================================

interface GridToolbarProps<T> {
  columns: GridColumn<T>[];
  
  // Quick filter
  showQuickFilter?: boolean;
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
  
  // Column visibility and order
  showColumnSelector?: boolean;
  columnVisibility: ColumnVisibilityModel;
  onColumnVisibilityChange: (model: ColumnVisibilityModel) => void;
  columnOrder: string[];
  onColumnOrderChange: (order: string[]) => void;
  
  // Density
  showDensitySelector?: boolean;
  density: Density;
  onDensityChange: (density: Density) => void;
  
  // Grouping
  showGroupingPanel?: boolean;
  groupingFields: string[];
  onGroupingFieldsChange: (fields: string[]) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  
  // Filters (legacy)
  showFilters?: boolean;
  filterFields?: FieldDefinition[];
  filterModel?: FilterModel;
  onFilterModelChange?: (model: FilterModel) => void;
  
  // Advanced Filters
  showAdvancedFilters?: boolean;
  advancedFilterFields?: AdvancedFilterField[];
  advancedFilterModel?: AdvancedFilterModel;
  onAdvancedFilterModelChange?: (model: AdvancedFilterModel) => void;
  rows?: T[];
  
  // Export
  showExport?: boolean;
  onExportCSV?: () => void;
  /** New export dialog props */
  onExportWithScope?: (scope: ExportScope) => void;
  selectedCount?: number;
  filteredCount?: number;
  totalCount?: number;
  exportLoading?: boolean;
  exportError?: string | null;
  
  // Custom actions
  actions?: React.ReactNode;
}

// ============================================================================
// Sortable Grouping Chip
// ============================================================================

interface SortableGroupChipProps {
  id: string;
  label: string;
  onRemove: () => void;
}

function SortableGroupChip({ id, label, onRemove }: SortableGroupChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Chip
      ref={setNodeRef}
      style={style}
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DragIndicatorIcon
            fontSize="small"
            sx={{ mr: 0.5, cursor: 'grab' }}
            {...attributes}
            {...listeners}
          />
          {label}
        </Box>
      }
      onDelete={onRemove}
      size="small"
      sx={{ mr: 1 }}
    />
  );
}

// ============================================================================
// Grid Toolbar Component
// ============================================================================

export function GridToolbar<T>({
  columns,
  showQuickFilter = true,
  quickFilter,
  onQuickFilterChange,
  showColumnSelector = true,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  showDensitySelector = true,
  density,
  onDensityChange,
  showGroupingPanel = true,
  groupingFields,
  onGroupingFieldsChange,
  onExpandAll,
  onCollapseAll,
  showFilters = true,
  filterFields = [],
  filterModel = { items: [], quickFilter: '' },
  onFilterModelChange,
  showExport = true,
  onExportCSV,
  onExportWithScope,
  selectedCount = 0,
  filteredCount = 0,
  totalCount = 0,
  exportLoading = false,
  exportError = null,
  actions,
  // Advanced Filters
  showAdvancedFilters = false,
  advancedFilterFields = [],
  advancedFilterModel = { filters: {} },
  onAdvancedFilterModelChange,
  rows = [],
}: GridToolbarProps<T>) {
  const [columnPanelAnchor, setColumnPanelAnchor] = useState<null | HTMLElement>(null);
  const [densityMenuAnchor, setDensityMenuAnchor] = useState<null | HTMLElement>(null);
  const [groupingMenuAnchor, setGroupingMenuAnchor] = useState<null | HTMLElement>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleOpenExportDialog = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleCloseExportDialog = useCallback(() => {
    setExportDialogOpen(false);
  }, []);

  const handleExport = useCallback((scope: ExportScope) => {
    if (onExportWithScope) {
      onExportWithScope(scope);
      setExportDialogOpen(false);
    }
  }, [onExportWithScope]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = groupingFields.indexOf(active.id as string);
      const newIndex = groupingFields.indexOf(over.id as string);
      onGroupingFieldsChange(arrayMove(groupingFields, oldIndex, newIndex));
    }
  };

  const handleOpenColumnPanel = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setColumnPanelAnchor(e.currentTarget);
  }, []);

  const handleCloseColumnPanel = useCallback(() => {
    setColumnPanelAnchor(null);
  }, []);

  const handleAddGrouping = (field: string) => {
    if (!groupingFields.includes(field)) {
      onGroupingFieldsChange([...groupingFields, field]);
    }
    setGroupingMenuAnchor(null);
  };

  const handleRemoveGrouping = (field: string) => {
    onGroupingFieldsChange(groupingFields.filter(f => f !== field));
  };

  const availableGroupingColumns = columns.filter(
    col => !groupingFields.includes(col.field as string) && col.type !== 'custom'
  );

  const getDensityIcon = () => {
    switch (density) {
      case 'compact':
        return <DensitySmallIcon />;
      case 'comfortable':
        return <DensityLargeIcon />;
      default:
        return <DensityMediumIcon />;
    }
  };

  return (
    <Box
      data-testid="grid-toolbar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
      }}
    >
      {/* Custom actions */}
      {actions}
      
      {/* Advanced Filters */}
      {showAdvancedFilters && advancedFilterFields.length > 0 && onAdvancedFilterModelChange && (
        <AdvancedFilterPanel
          fields={advancedFilterFields}
          rows={rows}
          filterModel={advancedFilterModel}
          onFilterModelChange={onAdvancedFilterModelChange}
        />
      )}
      
      {/* Legacy Filters */}
      {showFilters && !showAdvancedFilters && filterFields.length > 0 && onFilterModelChange && (
        <FilterPanel
          fields={filterFields}
          filterModel={filterModel}
          onFilterModelChange={onFilterModelChange}
        />
      )}
      
      {/* Export CSV */}
      {showExport && (onExportWithScope || onExportCSV) && (
        <>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={onExportWithScope ? handleOpenExportDialog : onExportCSV}
            data-testid="export-csv-button"
          >
            Export
          </Button>
          
          {onExportWithScope && (
            <ExportDialog
              open={exportDialogOpen}
              onClose={handleCloseExportDialog}
              onExport={handleExport}
              selectedCount={selectedCount}
              filteredCount={filteredCount}
              totalCount={totalCount}
              loading={exportLoading}
              error={exportError}
            />
          )}
        </>
      )}
      
      {/* Grouping chips */}
      {showGroupingPanel && groupingFields.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Grouped by:
          </Typography>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupingFields}
              strategy={verticalListSortingStrategy}
            >
              {groupingFields.map(field => {
                const column = columns.find(c => c.field === field);
                return (
                  <SortableGroupChip
                    key={field}
                    id={field}
                    label={column?.headerName || field}
                    onRemove={() => handleRemoveGrouping(field)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
          
          {onExpandAll && (
            <Tooltip title="Expand all">
              <IconButton size="small" onClick={onExpandAll}>
                <UnfoldMoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {onCollapseAll && (
            <Tooltip title="Collapse all">
              <IconButton size="small" onClick={onCollapseAll}>
                <UnfoldLessIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      
      <Box sx={{ flex: 1 }} />
      
      {/* Quick filter */}
      {showQuickFilter && (
        <TextField
          size="small"
          placeholder="Search..."
          value={quickFilter}
          onChange={(e) => onQuickFilterChange(e.target.value)}
          data-testid="quick-search"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: quickFilter && (
              <IconButton size="small" onClick={() => onQuickFilterChange('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
      )}
      
      {/* Grouping button */}
      {showGroupingPanel && (
        <>
          <Tooltip title="Group by">
            <IconButton 
              onClick={(e) => setGroupingMenuAnchor(e.currentTarget)}
              data-testid="group-by-button"
            >
              <GroupWorkIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={groupingMenuAnchor}
            open={Boolean(groupingMenuAnchor)}
            onClose={() => setGroupingMenuAnchor(null)}
          >
            {availableGroupingColumns.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  No columns available
                </Typography>
              </MenuItem>
            ) : (
              availableGroupingColumns.map(column => (
                <MenuItem
                  key={column.field as string}
                  onClick={() => handleAddGrouping(column.field as string)}
                >
                  {column.headerName}
                </MenuItem>
              ))
            )}
          </Menu>
        </>
      )}
      
      {/* Column visibility */}
      {showColumnSelector && (
        <>
          <Tooltip title="Columns">
            <IconButton 
              onClick={handleOpenColumnPanel}
              data-testid="columns-button"
            >
              <ViewColumnIcon />
            </IconButton>
          </Tooltip>
          <ColumnManagerPanel
            anchorEl={columnPanelAnchor}
            open={Boolean(columnPanelAnchor)}
            onClose={handleCloseColumnPanel}
            columns={columns}
            columnOrder={columnOrder}
            columnVisibility={columnVisibility}
            onColumnOrderChange={onColumnOrderChange}
            onColumnVisibilityChange={onColumnVisibilityChange}
          />
        </>
      )}
      
      {/* Density selector */}
      {showDensitySelector && (
        <>
          <Tooltip title="Density">
            <IconButton onClick={(e) => setDensityMenuAnchor(e.currentTarget)}>
              {getDensityIcon()}
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={densityMenuAnchor}
            open={Boolean(densityMenuAnchor)}
            onClose={() => setDensityMenuAnchor(null)}
          >
            <MenuItem
              selected={density === 'compact'}
              onClick={() => {
                onDensityChange('compact');
                setDensityMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <DensitySmallIcon />
              </ListItemIcon>
              <ListItemText primary="Compact" />
            </MenuItem>
            <MenuItem
              selected={density === 'standard'}
              onClick={() => {
                onDensityChange('standard');
                setDensityMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <DensityMediumIcon />
              </ListItemIcon>
              <ListItemText primary="Standard" />
            </MenuItem>
            <MenuItem
              selected={density === 'comfortable'}
              onClick={() => {
                onDensityChange('comfortable');
                setDensityMenuAnchor(null);
              }}
            >
              <ListItemIcon>
                <DensityLargeIcon />
              </ListItemIcon>
              <ListItemText primary="Comfortable" />
            </MenuItem>
          </Menu>
        </>
      )}
    </Box>
  );
}
