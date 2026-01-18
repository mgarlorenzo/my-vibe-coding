import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { Box, Paper } from '@mui/material';
import { useStore } from 'zustand';
import { createGridStore, GridStore } from './core/store';
import { GridProvider } from './hooks/useGridContext';
import { GridHeader } from './components/GridHeader';
import { GridBody } from './components/GridBody';
import { GridToolbar } from './components/GridToolbar';
import { GridFooter } from './components/GridFooter';
import { FieldDefinition } from './components/FilterPanel';
import { 
  buildCsv, 
  downloadCsv, 
  generateCSVFilename, 
  createExportColumns,
  defaultIsColumnExportable,
} from './utils/csvExport';
import {
  loadColumnConfig,
  applyColumnConfig,
  createDebouncedSave,
  extractHiddenFields,
} from './utils/columnPersistence';
import {
  FactorialDataGridProps,
  RowId,
  SubscriptionEvent,
  SortModel,
  ExportScope,
  ColumnVisibilityModel,
  AdvancedFilterField,
} from './types';

// ============================================================================
// Internal Grid Component
// ============================================================================

function FactorialDataGridInternal<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  mode = 'client',
  
  // Pagination
  pagination = true,
  paginationModel: controlledPaginationModel,
  onPaginationModelChange,
  rowCount: controlledRowCount,
  pageSizeOptions = [10, 25, 50, 100],
  
  // Sorting
  sortModel: controlledSortModel,
  onSortModelChange,
  
  // Filtering
  filterModel: controlledFilterModel,
  onFilterModelChange,
  
  // Grouping
  groupingModel: controlledGroupingModel,
  onGroupingModelChange,
  aggregationModel,
  // renderGroupRow - reserved for future custom group row rendering
  
  // Selection
  checkboxSelection = false,
  selectionModel: controlledSelectionModel,
  onSelectionModelChange,
  
  // Column visibility & sizing
  columnVisibilityModel: controlledColumnVisibility,
  onColumnVisibilityModelChange,
  columnSizingModel: controlledColumnSizing,
  onColumnSizingModelChange,
  
  // Inline editing
  // editMode - reserved for row editing mode
  processRowUpdate,
  onProcessRowUpdateError,
  
  // Subscriptions
  subscriptionConfig,
  
  // UI
  density: controlledDensity = 'standard',
  onDensityChange,
  autoHeight = false,
  // rowHeight, headerHeight - reserved for custom row/header heights
  
  // Toolbar
  showToolbar = true,
  showQuickFilter = true,
  showColumnSelector = true,
  showDensitySelector = true,
  showGroupingPanel = true,
  showFilters = true,
  showExport = true,
  toolbarActions,
  
  // Advanced Filters
  showAdvancedFilters = false,
  advancedFilterFields,
  advancedFilterModel: controlledAdvancedFilterModel,
  onAdvancedFilterModelChange,
  
  // Export configuration
  gridName,
  enableExport = true,
  getAllRows,
  mapRowForExport,
  isColumnExportable,
  
  // Column persistence
  storageKey,
  initialColumnVisibility,
  initialColumnOrder,
  
  // Slots
  slots,
  
  // Callbacks
  onRowClick,
  onRowDoubleClick,
  onCellClick,
  onCellDoubleClick,
  
  // Styling
  className,
  style,
  getRowClassName,
  // getCellClassName - reserved for cell-level styling
}: FactorialDataGridProps<T>) {
  // Create store
  const storeRef = useRef<GridStore<T>>();
  if (!storeRef.current) {
    storeRef.current = createGridStore<T>();
  }
  const store = storeRef.current;

  // Get state and actions from store
  const state = useStore(store);
  const {
    setRows,
    setColumns,
    setSortModel,
    setFilterModel,
    setQuickFilter,
    setAdvancedFilterModel,
    setPaginationModel,
    setGroupingModel,
    reorderGroupingFields,
    toggleGroupExpanded,
    expandAllGroups,
    collapseAllGroups,
    setSelectionModel,
    toggleRowSelection,
    selectAll,
    deselectAll,
    setColumnVisibility,
    setColumnWidth,
    startCellEdit,
    updateCellValue,
    setCellState,
    commitCellEdit,
    cancelCellEdit,
    setFocusedCell,
    setDensity,
    setLoading,
    applySubscriptionEvent,
    toggleSort,
  } = state;

  // ============================================================================
  // Column Order State & Persistence
  // ============================================================================

  // Get current column fields
  const currentColumnFields = useMemo(() => 
    columns.map(col => col.field as string),
    [columns]
  );

  // Initialize column order and visibility from localStorage or props
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    if (storageKey) {
      const stored = loadColumnConfig(storageKey);
      const applied = applyColumnConfig(
        stored,
        currentColumnFields,
        initialColumnOrder,
        initialColumnVisibility
      );
      return applied.columnOrder;
    }
    return initialColumnOrder?.length ? initialColumnOrder : currentColumnFields;
  });

  // Track if we've initialized visibility from storage
  const initializedFromStorageRef = useRef(false);

  // Initialize visibility from storage on mount
  useEffect(() => {
    if (storageKey && !initializedFromStorageRef.current) {
      const stored = loadColumnConfig(storageKey);
      const applied = applyColumnConfig(
        stored,
        currentColumnFields,
        initialColumnOrder,
        initialColumnVisibility
      );
      
      // Apply stored visibility
      setColumnVisibility(applied.columnVisibility);
      initializedFromStorageRef.current = true;
    }
  }, [storageKey, currentColumnFields, initialColumnOrder, initialColumnVisibility, setColumnVisibility]);

  // Update column order when columns change (add new columns at end)
  // Use a ref to track the previous column fields to avoid unnecessary updates
  const prevColumnFieldsRef = useRef<string[]>(currentColumnFields);
  
  useEffect(() => {
    const prevFields = prevColumnFieldsRef.current;
    const prevFieldsSet = new Set(prevFields);
    const currentFieldsSet = new Set(currentColumnFields);
    
    // Check if columns actually changed (not just reference)
    const hasNewColumns = currentColumnFields.some(f => !prevFieldsSet.has(f));
    const hasRemovedColumns = prevFields.some(f => !currentFieldsSet.has(f));
    
    if (hasNewColumns || hasRemovedColumns) {
      setColumnOrder(prevOrder => {
        const prevOrderSet = new Set(prevOrder);
        
        // Filter out columns that no longer exist
        const validOrder = prevOrder.filter(field => currentFieldsSet.has(field));
        
        // Add new columns at the end
        const newColumns = currentColumnFields.filter(field => !prevOrderSet.has(field));
        
        if (newColumns.length > 0 || validOrder.length !== prevOrder.length) {
          return [...validOrder, ...newColumns];
        }
        
        return prevOrder;
      });
      
      prevColumnFieldsRef.current = currentColumnFields;
    }
  }, [currentColumnFields]);

  // Create debounced save function
  const debouncedSaveRef = useRef<((config: { order: string[]; hidden: string[] }) => void) | null>(null);
  
  useEffect(() => {
    if (storageKey) {
      debouncedSaveRef.current = createDebouncedSave(storageKey, 200);
    } else {
      debouncedSaveRef.current = null;
    }
  }, [storageKey]);

  // Save to localStorage when order or visibility changes
  useEffect(() => {
    if (debouncedSaveRef.current && initializedFromStorageRef.current) {
      const hidden = extractHiddenFields(state.columnVisibility);
      debouncedSaveRef.current({ order: columnOrder, hidden });
    }
  }, [columnOrder, state.columnVisibility]);

  // Handle column order change
  const handleColumnOrderChange = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
  }, []);

  // Handle column visibility change with persistence
  const handleColumnVisibilityChange = useCallback((model: ColumnVisibilityModel) => {
    setColumnVisibility(model);
  }, [setColumnVisibility]);

  // Sync props to store
  useEffect(() => {
    store.setState({ getRowId });
  }, [store, getRowId]);

  useEffect(() => {
    setRows(rows);
  }, [rows, setRows]);

  useEffect(() => {
    setColumns(columns);
  }, [columns, setColumns]);

  useEffect(() => {
    setLoading(loading);
  }, [loading, setLoading]);

  useEffect(() => {
    if (controlledSortModel) {
      setSortModel(controlledSortModel);
    }
  }, [controlledSortModel, setSortModel]);

  useEffect(() => {
    if (controlledFilterModel) {
      setFilterModel(controlledFilterModel);
    }
  }, [controlledFilterModel, setFilterModel]);

  useEffect(() => {
    if (controlledAdvancedFilterModel) {
      setAdvancedFilterModel(controlledAdvancedFilterModel);
    }
  }, [controlledAdvancedFilterModel, setAdvancedFilterModel]);

  useEffect(() => {
    if (controlledPaginationModel) {
      setPaginationModel(controlledPaginationModel);
    }
  }, [controlledPaginationModel, setPaginationModel]);

  useEffect(() => {
    if (controlledGroupingModel) {
      setGroupingModel(controlledGroupingModel);
    }
  }, [controlledGroupingModel, setGroupingModel]);

  useEffect(() => {
    if (aggregationModel) {
      store.setState({ aggregationModel });
    }
  }, [store, aggregationModel]);

  useEffect(() => {
    if (controlledSelectionModel) {
      setSelectionModel(controlledSelectionModel);
    }
  }, [controlledSelectionModel, setSelectionModel]);

  useEffect(() => {
    if (controlledColumnVisibility) {
      setColumnVisibility(controlledColumnVisibility);
    }
  }, [controlledColumnVisibility, setColumnVisibility]);

  useEffect(() => {
    if (controlledColumnSizing) {
      Object.entries(controlledColumnSizing).forEach(([field, width]) => {
        setColumnWidth(field, width);
      });
    }
  }, [controlledColumnSizing, setColumnWidth]);

  useEffect(() => {
    setDensity(controlledDensity);
  }, [controlledDensity, setDensity]);

  useEffect(() => {
    if (subscriptionConfig?.conflictPolicy) {
      store.setState({ conflictPolicy: subscriptionConfig.conflictPolicy });
    }
  }, [store, subscriptionConfig?.conflictPolicy]);

  // Subscribe to changes
  useEffect(() => {
    if (!subscriptionConfig?.subscribe) return;

    const handleEvent = (event: SubscriptionEvent<T>) => {
      if (subscriptionConfig.applyEvent) {
        const newRows = subscriptionConfig.applyEvent(state.rows, event, getRowId);
        setRows(newRows);
      } else {
        applySubscriptionEvent(event);
      }
    };

    const unsubscribe = subscriptionConfig.subscribe(handleEvent);
    return unsubscribe;
  }, [subscriptionConfig, state.rows, getRowId, setRows, applySubscriptionEvent]);

  // Notify parent of state changes
  useEffect(() => {
    onSortModelChange?.(state.sortModel);
  }, [state.sortModel, onSortModelChange]);

  useEffect(() => {
    onFilterModelChange?.(state.filterModel);
  }, [state.filterModel, onFilterModelChange]);

  useEffect(() => {
    onAdvancedFilterModelChange?.(state.advancedFilterModel);
  }, [state.advancedFilterModel, onAdvancedFilterModelChange]);

  useEffect(() => {
    onPaginationModelChange?.(state.paginationModel);
  }, [state.paginationModel, onPaginationModelChange]);

  useEffect(() => {
    onGroupingModelChange?.(state.groupingModel);
  }, [state.groupingModel, onGroupingModelChange]);

  useEffect(() => {
    onSelectionModelChange?.(state.selectionModel);
  }, [state.selectionModel, onSelectionModelChange]);

  useEffect(() => {
    onColumnVisibilityModelChange?.(state.columnVisibility);
  }, [state.columnVisibility, onColumnVisibilityModelChange]);

  useEffect(() => {
    onColumnSizingModelChange?.(state.columnSizing);
  }, [state.columnSizing, onColumnSizingModelChange]);

  useEffect(() => {
    onDensityChange?.(state.density);
  }, [state.density, onDensityChange]);

  // Visible columns (respecting order)
  const visibleColumns = useMemo(() => {
    // Create a map for quick column lookup
    const columnsByField = new Map(columns.map(col => [col.field as string, col]));
    
    // Build ordered visible columns
    const ordered: typeof columns = [];
    const seen = new Set<string>();
    
    // First, add columns in the specified order
    columnOrder.forEach(field => {
      const col = columnsByField.get(field);
      if (col && state.columnVisibility[field] !== false) {
        ordered.push(col);
        seen.add(field);
      }
    });
    
    // Then add any remaining columns not in the order (shouldn't happen normally)
    columns.forEach(col => {
      const field = col.field as string;
      if (!seen.has(field) && state.columnVisibility[field] !== false) {
        ordered.push(col);
      }
    });
    
    return ordered;
  }, [columns, columnOrder, state.columnVisibility]);

  // Column widths
  const columnWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    visibleColumns.forEach(col => {
      const field = col.field as string;
      widths[field] = state.columnSizing[field] || col.width || 150;
    });
    return widths;
  }, [visibleColumns, state.columnSizing]);

  // Row count
  const totalRowCount = mode === 'server' && controlledRowCount != null
    ? controlledRowCount
    : state.totalRowCount;

  // Selection state
  const allSelected = state.selectionModel.selectAll ||
    (state.processedRows.length > 0 &&
      state.processedRows.every(row => state.selectionModel.selectedIds.has(getRowId(row))));
  const someSelected = state.selectionModel.selectedIds.size > 0 && !allSelected;

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (mode === 'server') {
      const existing = state.sortModel.find(s => s.field === field);
      let newModel: SortModel[];
      if (!existing) {
        newModel = [{ field, direction: 'asc' }];
      } else if (existing.direction === 'asc') {
        newModel = [{ field, direction: 'desc' }];
      } else {
        newModel = [];
      }
      onSortModelChange?.(newModel);
    } else {
      toggleSort(field);
    }
  }, [mode, state.sortModel, toggleSort, onSortModelChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [allSelected, selectAll, deselectAll]);

  // Handle column resize
  const handleColumnResize = useCallback((field: string, width: number) => {
    setColumnWidth(field, width);
  }, [setColumnWidth]);

  // Handle cell edit commit with async processing
  const handleCommit = useCallback(async (rowId: RowId, field: string) => {
    const cellKey = `${rowId}:${field}`;
    const editingCell = state.editingCells.get(cellKey);
    
    if (!editingCell) return;

    if (processRowUpdate) {
      setCellState(rowId, field, 'saving');
      
      try {
        const oldRow = state.rowsById.get(rowId);
        if (!oldRow) throw new Error('Row not found');

        const column = columns.find(c => c.field === field);
        let newRow: T;
        
        if (column?.valueSetter) {
          newRow = column.valueSetter(oldRow, editingCell.value);
        } else {
          newRow = { ...oldRow, [field]: editingCell.value } as T;
        }

        // Validate if validator exists
        if (column?.validate) {
          const error = await column.validate(editingCell.value, newRow);
          if (error) {
            setCellState(rowId, field, 'error', error);
            return;
          }
        }

        const result = await processRowUpdate(newRow, oldRow);
        
        // Update the row with the result
        const newRows = state.rows.map(r => getRowId(r) === rowId ? result : r);
        setRows(newRows);
        
        // Clear editing state
        const newEditingCells = new Map(state.editingCells);
        newEditingCells.delete(cellKey);
        store.setState({ editingCells: newEditingCells });
        
      } catch (error) {
        setCellState(rowId, field, 'error', String(error));
        onProcessRowUpdateError?.(error, { rowId, field });
      }
    } else {
      commitCellEdit(rowId, field);
    }
  }, [
    state.editingCells,
    state.rowsById,
    state.rows,
    columns,
    processRowUpdate,
    setCellState,
    setRows,
    getRowId,
    store,
    commitCellEdit,
    onProcessRowUpdateError,
  ]);

  // Handle cell click
  const handleCellClick = useCallback((rowId: RowId, field: string, event: React.MouseEvent) => {
    setFocusedCell({ rowId, field });
    const row = state.rowsById.get(rowId);
    if (row) {
      const value = (row as Record<string, unknown>)[field];
      onCellClick?.({ row, rowId, field, value }, event);
    }
  }, [setFocusedCell, state.rowsById, onCellClick]);

  // Handle cell double click
  const handleCellDoubleClick = useCallback((rowId: RowId, field: string, event: React.MouseEvent) => {
    const row = state.rowsById.get(rowId);
    if (row) {
      const value = (row as Record<string, unknown>)[field];
      onCellDoubleClick?.({ row, rowId, field, value }, event);
    }
  }, [state.rowsById, onCellDoubleClick]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!state.focusedCell) return;

    const { rowId, field } = state.focusedCell;
    const isEditing = state.editingCells.has(`${rowId}:${field}`);

    if (isEditing) return; // Let the editor handle keys

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        state.moveFocus('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        state.moveFocus('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        state.moveFocus('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        state.moveFocus('right');
        break;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        startCellEdit(rowId, field);
        break;
      case ' ':
        if (checkboxSelection) {
          e.preventDefault();
          toggleRowSelection(rowId);
        }
        break;
    }
  }, [state, startCellEdit, checkboxSelection, toggleRowSelection]);

  // Calculate body height
  const bodyHeight = autoHeight
    ? undefined
    : typeof style?.height === 'number'
      ? style.height - (showToolbar ? 64 : 0) - 52 - 52 // toolbar + header + footer
      : 400;

  // Derive filter fields from first row (all fields, not just columns)
  const filterFields = useMemo<FieldDefinition[]>(() => {
    if (rows.length === 0) return [];
    
    const firstRow = rows[0] as Record<string, unknown>;
    const fields: FieldDefinition[] = [];
    
    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
      
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.includes('-'))) {
        type = 'date';
      }
      
      // Find column header name if exists, otherwise use field name
      const column = columns.find(c => c.field === key);
      const label = column?.headerName || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      
      fields.push({ field: key, label, type });
    });
    
    return fields;
  }, [rows, columns]);

  // Auto-generate advanced filter fields from VISIBLE columns only
  // Use provided advancedFilterFields if available, otherwise generate from visible columns
  const computedAdvancedFilterFields = useMemo<AdvancedFilterField[]>(() => {
    // If user provided explicit fields, use those
    if (advancedFilterFields && advancedFilterFields.length > 0) {
      return advancedFilterFields;
    }
    
    // Otherwise, auto-generate from visible columns
    if (rows.length === 0 || visibleColumns.length === 0) return [];
    
    const firstRow = rows[0] as Record<string, unknown>;
    const fields: AdvancedFilterField[] = [];
    
    // Only include fields that correspond to visible columns
    visibleColumns.forEach(column => {
      const key = column.field as string;
      
      // Skip custom/action columns that don't have real data
      if (column.type === 'custom' || key === 'actions') return;
      
      const value = firstRow[key];
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';
      
      // Use column type if defined, otherwise infer from value
      if (column.type === 'number') {
        type = 'number';
      } else if (column.type === 'boolean') {
        type = 'boolean';
      } else if (column.type === 'date' || column.type === 'datetime') {
        type = 'date';
      } else if (value !== undefined) {
        // Infer type from value
        if (typeof value === 'number') {
          type = 'number';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (value instanceof Date) {
          type = 'date';
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          type = 'date';
        }
      }
      
      fields.push({ 
        field: key, 
        label: column.headerName || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'), 
        type 
      });
    });
    
    return fields;
  }, [rows, visibleColumns, advancedFilterFields]);

  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Determine which columns are exportable
  const exportableColumns = useMemo(() => {
    const checkExportable = isColumnExportable || defaultIsColumnExportable;
    return visibleColumns.filter(col => checkExportable(col));
  }, [visibleColumns, isColumnExportable]);

  // Create export column configurations
  const exportColumns = useMemo(() => {
    return createExportColumns(exportableColumns, isColumnExportable || defaultIsColumnExportable);
  }, [exportableColumns, isColumnExportable]);

  // Get selected rows
  const selectedRows = useMemo(() => {
    return rows.filter(row => state.selectionModel.selectedIds.has(getRowId(row)));
  }, [rows, state.selectionModel.selectedIds, getRowId]);

  // Handle CSV export with scope
  const handleExportWithScope = useCallback(async (scope: ExportScope) => {
    setExportLoading(true);
    setExportError(null);

    try {
      let rowsToExport: T[];

      switch (scope.type) {
        case 'selected':
          rowsToExport = selectedRows;
          break;
        case 'filtered':
          rowsToExport = state.processedRows;
          break;
        case 'all':
          // Use getAllRows if provided (for server mode), otherwise use props.rows
          if (getAllRows) {
            const allRows = await getAllRows();
            rowsToExport = allRows;
          } else {
            rowsToExport = rows;
          }
          break;
        default:
          rowsToExport = state.processedRows;
      }

      // Apply mapRowForExport if provided
      const mappedRows = mapRowForExport 
        ? rowsToExport.map(row => mapRowForExport(row) as T)
        : rowsToExport;

      // Build CSV
      const csvContent = buildCsv({
        rows: mappedRows,
        columns: exportColumns,
      });

      // Generate filename
      const filename = generateCSVFilename(gridName || 'export');

      // Download
      downloadCsv(csvContent, filename);

    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExportLoading(false);
    }
  }, [selectedRows, state.processedRows, rows, getAllRows, mapRowForExport, exportColumns, gridName]);

  return (
    <Paper
      className={className}
      style={style}
      data-testid="factorial-data-grid"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0,
        height: autoHeight ? 'auto' : style?.height || '100%',
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="grid"
      aria-rowcount={totalRowCount}
      aria-colcount={visibleColumns.length}
    >
      {/* Toolbar */}
      {showToolbar && (
        slots?.toolbar ? (
          <slots.toolbar
            columns={columns}
            density={state.density}
            onDensityChange={setDensity}
            quickFilter={state.filterModel.quickFilter || ''}
            onQuickFilterChange={setQuickFilter}
            columnVisibility={state.columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            groupingFields={state.groupingModel.fields}
            onGroupingFieldsChange={reorderGroupingFields}
          />
        ) : (
          <GridToolbar
            columns={columns}
            showQuickFilter={showQuickFilter}
            quickFilter={state.filterModel.quickFilter || ''}
            onQuickFilterChange={setQuickFilter}
            showColumnSelector={showColumnSelector}
            columnVisibility={state.columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            columnOrder={columnOrder}
            onColumnOrderChange={handleColumnOrderChange}
            showDensitySelector={showDensitySelector}
            density={state.density}
            onDensityChange={setDensity}
            showGroupingPanel={showGroupingPanel}
            groupingFields={state.groupingModel.fields}
            onGroupingFieldsChange={reorderGroupingFields}
            onExpandAll={expandAllGroups}
            onCollapseAll={collapseAllGroups}
            showFilters={showFilters}
            filterFields={filterFields}
            filterModel={state.filterModel}
            onFilterModelChange={setFilterModel}
            showAdvancedFilters={showAdvancedFilters}
            advancedFilterFields={computedAdvancedFilterFields}
            advancedFilterModel={state.advancedFilterModel}
            onAdvancedFilterModelChange={setAdvancedFilterModel}
            rows={rows}
            showExport={showExport && enableExport}
            onExportWithScope={handleExportWithScope}
            selectedCount={state.selectionModel.selectedIds.size}
            filteredCount={state.processedRows.length}
            totalCount={rows.length}
            exportLoading={exportLoading}
            exportError={exportError}
            actions={toolbarActions}
          />
        )
      )}

      {/* Header */}
      <GridHeader
        columns={visibleColumns}
        sortModel={state.sortModel}
        onSort={handleSort}
        checkboxSelection={checkboxSelection}
        allSelected={allSelected}
        someSelected={someSelected}
        onSelectAll={handleSelectAll}
        density={state.density}
        columnWidths={columnWidths}
        onColumnResize={handleColumnResize}
      />

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {state.loading && state.flattenedNodes.length === 0 ? (
          slots?.loadingOverlay ? <slots.loadingOverlay /> : null
        ) : state.flattenedNodes.length === 0 ? (
          slots?.noRowsOverlay ? <slots.noRowsOverlay /> : null
        ) : null}
        
        <GridBody
          nodes={state.flattenedNodes}
          columns={visibleColumns}
          columnWidths={columnWidths}
          getRowId={getRowId}
          density={state.density}
          checkboxSelection={checkboxSelection}
          selectionModel={state.selectionModel}
          editingCells={state.editingCells}
          focusedCell={state.focusedCell}
          loading={state.loading}
          page={mode === 'client' ? state.paginationModel.page : undefined}
          pageSize={mode === 'client' && pagination ? state.paginationModel.pageSize : undefined}
          onToggleSelection={toggleRowSelection}
          onToggleGroupExpanded={toggleGroupExpanded}
          onStartEdit={startCellEdit}
          onUpdateValue={updateCellValue}
          onCommit={handleCommit}
          onCancel={cancelCellEdit}
          onCellClick={handleCellClick}
          onCellDoubleClick={handleCellDoubleClick}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          getRowClassName={getRowClassName}
          height={bodyHeight}
        />
      </Box>

      {/* Footer */}
      {slots?.footer ? (
        <slots.footer
          rowCount={totalRowCount}
          selectedCount={state.selectionModel.selectedIds.size}
          page={state.paginationModel.page}
          pageSize={state.paginationModel.pageSize}
          onPageChange={state.setPage}
          onPageSizeChange={state.setPageSize}
        />
      ) : (
        <GridFooter
          rowCount={totalRowCount}
          selectedCount={state.selectionModel.selectedIds.size}
          page={state.paginationModel.page}
          pageSize={state.paginationModel.pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={state.setPage}
          onPageSizeChange={state.setPageSize}
          showPagination={pagination}
        />
      )}
    </Paper>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export function FactorialDataGrid<T>(props: FactorialDataGridProps<T>) {
  return (
    <GridProvider<T>>
      <FactorialDataGridInternal {...props} />
    </GridProvider>
  );
}

export default FactorialDataGrid;
