import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  RowId,
  SortModel,
  FilterModel,
  PaginationModel,
  GroupingModel,
  AggregationModel,
  SelectionModel,
  ColumnVisibilityModel,
  ColumnSizingModel,
  EditingCell,
  Density,
  GridColumn,
  TreeNode,
  GroupNode,
  RowNode,
  CellState,
  SubscriptionEvent,
  ConflictPolicy,
  AdvancedFilterModel,
} from '../types';

// ============================================================================
// Store State Interface
// ============================================================================

export interface GridState<T> {
  // Source data
  rows: T[];
  rowsById: Map<RowId, T>;
  getRowId: (row: T) => RowId;
  
  // Columns
  columns: GridColumn<T>[];
  columnVisibility: ColumnVisibilityModel;
  columnSizing: ColumnSizingModel;
  
  // Query state
  sortModel: SortModel[];
  filterModel: FilterModel;
  advancedFilterModel: AdvancedFilterModel;
  paginationModel: PaginationModel;
  
  // Grouping
  groupingModel: GroupingModel;
  aggregationModel: AggregationModel;
  
  // Processed data
  processedRows: T[];
  treeNodes: TreeNode<T>[];
  flattenedNodes: TreeNode<T>[];
  totalRowCount: number;
  
  // Selection
  selectionModel: SelectionModel;
  
  // Editing
  editingCells: Map<string, EditingCell>; // key: `${rowId}:${field}`
  
  // UI state
  density: Density;
  loading: boolean;
  focusedCell: { rowId: RowId; field: string } | null;
  
  // Subscription state
  conflictPolicy: ConflictPolicy;
  pendingConflicts: Map<RowId, SubscriptionEvent<T>>;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

export interface GridActions<T> {
  // Data actions
  setRows: (rows: T[]) => void;
  updateRow: (rowId: RowId, updates: Partial<T>) => void;
  addRow: (row: T) => void;
  removeRow: (rowId: RowId) => void;
  
  // Column actions
  setColumns: (columns: GridColumn<T>[]) => void;
  setColumnVisibility: (model: ColumnVisibilityModel) => void;
  toggleColumnVisibility: (field: string) => void;
  setColumnWidth: (field: string, width: number) => void;
  
  // Sort actions
  setSortModel: (model: SortModel[]) => void;
  toggleSort: (field: string) => void;
  
  // Filter actions
  setFilterModel: (model: FilterModel) => void;
  setQuickFilter: (value: string) => void;
  setAdvancedFilterModel: (model: AdvancedFilterModel) => void;
  
  // Pagination actions
  setPaginationModel: (model: PaginationModel) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  
  // Grouping actions
  setGroupingModel: (model: GroupingModel) => void;
  addGroupingField: (field: string) => void;
  removeGroupingField: (field: string) => void;
  reorderGroupingFields: (fields: string[]) => void;
  toggleGroupExpanded: (groupId: string) => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  
  // Selection actions
  setSelectionModel: (model: SelectionModel) => void;
  selectRow: (rowId: RowId) => void;
  deselectRow: (rowId: RowId) => void;
  toggleRowSelection: (rowId: RowId) => void;
  selectAll: () => void;
  deselectAll: () => void;
  
  // Editing actions
  startCellEdit: (rowId: RowId, field: string) => void;
  updateCellValue: (rowId: RowId, field: string, value: unknown) => void;
  setCellState: (rowId: RowId, field: string, state: CellState, error?: string) => void;
  commitCellEdit: (rowId: RowId, field: string) => void;
  cancelCellEdit: (rowId: RowId, field: string) => void;
  
  // Focus actions
  setFocusedCell: (cell: { rowId: RowId; field: string } | null) => void;
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // UI actions
  setDensity: (density: Density) => void;
  setLoading: (loading: boolean) => void;
  
  // Subscription actions
  applySubscriptionEvent: (event: SubscriptionEvent<T>) => void;
  resolveConflict: (rowId: RowId, resolution: 'local' | 'remote') => void;
  
  // Internal actions
  reprocessData: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCellKey(rowId: RowId, field: string): string {
  return `${rowId}:${field}`;
}

function getColumnValue<T>(row: T, column: GridColumn<T>): unknown {
  if (column.valueGetter) {
    return column.valueGetter(row);
  }
  return (row as Record<string, unknown>)[column.field as string];
}

function getRowFieldValue<T>(row: T, field: string, columns: GridColumn<T>[]): unknown {
  // First check if there's a column with a valueGetter
  const column = columns.find(c => c.field === field);
  if (column?.valueGetter) {
    return column.valueGetter(row);
  }
  // Otherwise, get the value directly from the row
  return (row as Record<string, unknown>)[field];
}

function getValueKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return '__empty__';
  return String(value);
}

function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  return null;
}

function normalizeToStartOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function normalizeToEndOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function applyAdvancedFilters<T>(rows: T[], advancedFilterModel: AdvancedFilterModel, columns: GridColumn<T>[]): T[] {
  // Value filters (string/number/boolean)
  const activeValueFilters = Object.entries(advancedFilterModel.filters).filter(
    ([, values]) => values.size > 0
  );
  
  // Date filters
  const activeDateFilters = advancedFilterModel.dateFilters 
    ? Object.entries(advancedFilterModel.dateFilters).filter(([, dateFilter]) => {
        if (dateFilter.mode === 'exact' && dateFilter.date) return true;
        if (dateFilter.mode === 'range' && (dateFilter.startDate || dateFilter.endDate)) return true;
        return false;
      })
    : [];
  
  if (activeValueFilters.length === 0 && activeDateFilters.length === 0) return rows;
  
  return rows.filter(row => {
    // All value filters must pass (AND logic)
    const valueFiltersPass = activeValueFilters.every(([field, selectedValues]) => {
      const value = getRowFieldValue(row, field, columns);
      const valueKey = getValueKey(value);
      return selectedValues.has(valueKey);
    });
    
    if (!valueFiltersPass) return false;
    
    // All date filters must pass (AND logic)
    const dateFiltersPass = activeDateFilters.every(([field, dateFilter]) => {
      const rawValue = getRowFieldValue(row, field, columns);
      const rowDate = parseDate(rawValue);
      
      // If row has no date, it doesn't match
      if (!rowDate) return false;
      
      const normalizedRowDate = normalizeToStartOfDay(rowDate);
      
      if (dateFilter.mode === 'exact' && dateFilter.date) {
        const filterDate = normalizeToStartOfDay(dateFilter.date);
        return normalizedRowDate.getTime() === filterDate.getTime();
      }
      
      if (dateFilter.mode === 'range') {
        const startDate = dateFilter.startDate ? normalizeToStartOfDay(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? normalizeToEndOfDay(dateFilter.endDate) : null;
        
        if (startDate && normalizedRowDate < startDate) return false;
        if (endDate && rowDate > endDate) return false;
        
        return true;
      }
      
      return true;
    });
    
    return dateFiltersPass;
  });
}

function applyFilters<T>(rows: T[], filterModel: FilterModel, columns: GridColumn<T>[]): T[] {
  let filtered = rows;
  
  // Apply quick filter - search across ALL row fields, not just columns
  if (filterModel.quickFilter) {
    const searchTerm = filterModel.quickFilter.toLowerCase();
    filtered = filtered.filter(row => {
      // Search in all row properties
      const rowObj = row as Record<string, unknown>;
      return Object.keys(rowObj).some(key => {
        const value = rowObj[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTerm);
      });
    });
  }
  
  // Apply filter items - can filter by ANY row field
  if (filterModel.items.length > 0) {
    filtered = filtered.filter(row => {
      const results = filterModel.items.map(item => {
        // Get value from row - works for any field, not just columns
        const value = getRowFieldValue(row, item.field, columns);
        
        switch (item.operator) {
          case 'equals':
          case 'eq':
            return value === item.value || String(value) === String(item.value);
          case 'neq':
            return value !== item.value && String(value) !== String(item.value);
          case 'contains':
            return String(value ?? '').toLowerCase().includes(String(item.value ?? '').toLowerCase());
          case 'startsWith':
            return String(value ?? '').toLowerCase().startsWith(String(item.value ?? '').toLowerCase());
          case 'endsWith':
            return String(value ?? '').toLowerCase().endsWith(String(item.value ?? '').toLowerCase());
          case 'gt':
            return Number(value) > Number(item.value);
          case 'gte':
            return Number(value) >= Number(item.value);
          case 'lt':
            return Number(value) < Number(item.value);
          case 'lte':
            return Number(value) <= Number(item.value);
          case 'isEmpty':
            return value == null || value === '';
          case 'isNotEmpty':
            return value != null && value !== '';
          case 'is':
            // For boolean values
            if (typeof item.value === 'boolean') {
              return value === item.value;
            }
            // Handle string 'true'/'false'
            if (item.value === 'true') return value === true;
            if (item.value === 'false') return value === false;
            return value === item.value;
          default:
            return true;
        }
      });
      
      return filterModel.linkOperator === 'or'
        ? results.some(r => r)
        : results.every(r => r);
    });
  }
  
  return filtered;
}

function applySorting<T>(rows: T[], sortModel: SortModel[], columns: GridColumn<T>[]): T[] {
  if (sortModel.length === 0) return rows;
  
  return [...rows].sort((a, b) => {
    for (const sort of sortModel) {
      const column = columns.find(c => c.field === sort.field);
      if (!column) continue;
      
      const aValue = getColumnValue(a, column);
      const bValue = getColumnValue(b, column);
      
      let comparison = 0;
      
      if (aValue == null && bValue == null) comparison = 0;
      else if (aValue == null) comparison = 1;
      else if (bValue == null) comparison = -1;
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

function calculateAggregation(values: unknown[], type: string): number {
  const numericValues = values
    .filter(v => v != null && !isNaN(Number(v)))
    .map(v => Number(v));
  
  switch (type) {
    case 'count':
      return values.length;
    case 'sum':
      return numericValues.reduce((acc, v) => acc + v, 0);
    case 'avg':
      return numericValues.length > 0
        ? numericValues.reduce((acc, v) => acc + v, 0) / numericValues.length
        : 0;
    case 'min':
      return numericValues.length > 0 ? Math.min(...numericValues) : 0;
    case 'max':
      return numericValues.length > 0 ? Math.max(...numericValues) : 0;
    default:
      return 0;
  }
}

function buildGroupTree<T>(
  rows: T[],
  groupingFields: string[],
  columns: GridColumn<T>[],
  aggregationModel: AggregationModel,
  expandedGroups: Record<string, boolean>,
  getRowId: (row: T) => RowId,
  depth: number = 0,
  parentKey: string = ''
): TreeNode<T>[] {
  if (groupingFields.length === 0) {
    return rows.map(row => ({
      type: 'row' as const,
      id: getRowId(row),
      row,
      depth,
    }));
  }
  
  const [currentField, ...remainingFields] = groupingFields;
  const column = columns.find(c => c.field === currentField);
  
  // Group rows by current field
  const groups = new Map<unknown, T[]>();
  rows.forEach(row => {
    const value = column ? getColumnValue(row, column) : (row as Record<string, unknown>)[currentField];
    const existing = groups.get(value) || [];
    existing.push(row);
    groups.set(value, existing);
  });
  
  // Build group nodes
  const result: TreeNode<T>[] = [];
  
  groups.forEach((groupRows, value) => {
    const groupId = parentKey ? `${parentKey}|${currentField}:${value}` : `${currentField}:${value}`;
    const isExpanded = expandedGroups[groupId] ?? true;
    
    // Calculate aggregations
    const aggregations: Record<string, Record<string, number>> = {};
    columns.forEach(col => {
      const aggTypes = aggregationModel[col.field as string] || col.aggregations || [];
      if (aggTypes.length > 0) {
        const values = groupRows.map(row => getColumnValue(row, col));
        aggregations[col.field as string] = {};
        aggTypes.forEach(aggType => {
          aggregations[col.field as string][aggType] = calculateAggregation(values, aggType);
        });
      }
    });
    
    const children = isExpanded
      ? buildGroupTree(groupRows, remainingFields, columns, aggregationModel, expandedGroups, getRowId, depth + 1, groupId)
      : [];
    
    const groupNode: GroupNode<T> = {
      type: 'group',
      id: groupId,
      field: currentField,
      value,
      depth,
      childCount: groupRows.length,
      isExpanded,
      aggregations,
      children,
    };
    
    result.push(groupNode);
  });
  
  return result;
}

function flattenTree<T>(nodes: TreeNode<T>[]): TreeNode<T>[] {
  const result: TreeNode<T>[] = [];
  
  function traverse(node: TreeNode<T>) {
    result.push(node);
    if (node.type === 'group' && node.isExpanded) {
      node.children.forEach(traverse);
    }
  }
  
  nodes.forEach(traverse);
  return result;
}

// ============================================================================
// Store Factory
// ============================================================================

export function createGridStore<T>() {
  return create<GridState<T> & GridActions<T>>()(
    subscribeWithSelector((set, get) => ({
      // Initial state
      rows: [],
      rowsById: new Map(),
      getRowId: (row: T) => (row as Record<string, unknown>).id as RowId,
      columns: [],
      columnVisibility: {},
      columnSizing: {},
      sortModel: [],
      filterModel: { items: [], quickFilter: '' },
      advancedFilterModel: { filters: {} },
      paginationModel: { page: 0, pageSize: 25 },
      groupingModel: { fields: [], expanded: {} },
      aggregationModel: {},
      processedRows: [],
      treeNodes: [],
      flattenedNodes: [],
      totalRowCount: 0,
      selectionModel: { selectedIds: new Set(), selectAll: false },
      editingCells: new Map(),
      density: 'standard',
      loading: false,
      focusedCell: null,
      conflictPolicy: 'preferLocalEdits',
      pendingConflicts: new Map(),
      
      // Data actions
      setRows: (rows) => {
        const { getRowId } = get();
        const rowsById = new Map(rows.map(row => [getRowId(row), row]));
        set({ rows, rowsById });
        get().reprocessData();
      },
      
      updateRow: (rowId, updates) => {
        const { rows, getRowId } = get();
        const newRows = rows.map(row => 
          getRowId(row) === rowId ? { ...row, ...updates } : row
        );
        get().setRows(newRows);
      },
      
      addRow: (row) => {
        const { rows } = get();
        get().setRows([...rows, row]);
      },
      
      removeRow: (rowId) => {
        const { rows, getRowId } = get();
        get().setRows(rows.filter(row => getRowId(row) !== rowId));
      },
      
      // Column actions
      setColumns: (columns) => {
        set({ columns });
        get().reprocessData();
      },
      
      setColumnVisibility: (model) => set({ columnVisibility: model }),
      
      toggleColumnVisibility: (field) => {
        const { columnVisibility } = get();
        set({
          columnVisibility: {
            ...columnVisibility,
            [field]: !columnVisibility[field],
          },
        });
      },
      
      setColumnWidth: (field, width) => {
        const { columnSizing } = get();
        set({
          columnSizing: {
            ...columnSizing,
            [field]: width,
          },
        });
      },
      
      // Sort actions
      setSortModel: (model) => {
        set({ sortModel: model });
        get().reprocessData();
      },
      
      toggleSort: (field) => {
        const { sortModel } = get();
        const existing = sortModel.find(s => s.field === field);
        
        let newModel: SortModel[];
        if (!existing) {
          newModel = [{ field, direction: 'asc' }];
        } else if (existing.direction === 'asc') {
          newModel = [{ field, direction: 'desc' }];
        } else {
          newModel = [];
        }
        
        get().setSortModel(newModel);
      },
      
      // Filter actions
      setFilterModel: (model) => {
        set({ filterModel: model, paginationModel: { ...get().paginationModel, page: 0 } });
        get().reprocessData();
      },
      
      setQuickFilter: (value) => {
        const { filterModel } = get();
        get().setFilterModel({ ...filterModel, quickFilter: value });
      },
      
      setAdvancedFilterModel: (model) => {
        set({ advancedFilterModel: model, paginationModel: { ...get().paginationModel, page: 0 } });
        get().reprocessData();
      },
      
      // Pagination actions
      setPaginationModel: (model) => set({ paginationModel: model }),
      setPage: (page) => set({ paginationModel: { ...get().paginationModel, page } }),
      setPageSize: (pageSize) => set({ paginationModel: { ...get().paginationModel, pageSize, page: 0 } }),
      
      // Grouping actions
      setGroupingModel: (model) => {
        set({ groupingModel: model });
        get().reprocessData();
      },
      
      addGroupingField: (field) => {
        const { groupingModel } = get();
        if (!groupingModel.fields.includes(field)) {
          get().setGroupingModel({
            ...groupingModel,
            fields: [...groupingModel.fields, field],
          });
        }
      },
      
      removeGroupingField: (field) => {
        const { groupingModel } = get();
        get().setGroupingModel({
          ...groupingModel,
          fields: groupingModel.fields.filter(f => f !== field),
        });
      },
      
      reorderGroupingFields: (fields) => {
        const { groupingModel } = get();
        get().setGroupingModel({ ...groupingModel, fields });
      },
      
      toggleGroupExpanded: (groupId) => {
        const { groupingModel } = get();
        const isExpanded = groupingModel.expanded[groupId] ?? true;
        set({
          groupingModel: {
            ...groupingModel,
            expanded: { ...groupingModel.expanded, [groupId]: !isExpanded },
          },
        });
        get().reprocessData();
      },
      
      expandAllGroups: () => {
        const { groupingModel, treeNodes } = get();
        const expanded: Record<string, boolean> = {};
        
        function collectGroupIds(nodes: TreeNode<T>[]) {
          nodes.forEach(node => {
            if (node.type === 'group') {
              expanded[node.id] = true;
              collectGroupIds(node.children);
            }
          });
        }
        collectGroupIds(treeNodes);
        
        set({ groupingModel: { ...groupingModel, expanded } });
        get().reprocessData();
      },
      
      collapseAllGroups: () => {
        const { groupingModel, treeNodes } = get();
        const expanded: Record<string, boolean> = {};
        
        function collectGroupIds(nodes: TreeNode<T>[]) {
          nodes.forEach(node => {
            if (node.type === 'group') {
              expanded[node.id] = false;
              collectGroupIds(node.children);
            }
          });
        }
        collectGroupIds(treeNodes);
        
        set({ groupingModel: { ...groupingModel, expanded } });
        get().reprocessData();
      },
      
      // Selection actions
      setSelectionModel: (model) => set({ selectionModel: model }),
      
      selectRow: (rowId) => {
        const { selectionModel } = get();
        const newSelectedIds = new Set(selectionModel.selectedIds);
        newSelectedIds.add(rowId);
        set({ selectionModel: { ...selectionModel, selectedIds: newSelectedIds } });
      },
      
      deselectRow: (rowId) => {
        const { selectionModel } = get();
        const newSelectedIds = new Set(selectionModel.selectedIds);
        newSelectedIds.delete(rowId);
        set({ selectionModel: { ...selectionModel, selectedIds: newSelectedIds, selectAll: false } });
      },
      
      toggleRowSelection: (rowId) => {
        const { selectionModel } = get();
        if (selectionModel.selectedIds.has(rowId)) {
          get().deselectRow(rowId);
        } else {
          get().selectRow(rowId);
        }
      },
      
      selectAll: () => {
        const { processedRows, getRowId } = get();
        const selectedIds = new Set(processedRows.map(row => getRowId(row)));
        set({ selectionModel: { selectedIds, selectAll: true } });
      },
      
      deselectAll: () => {
        set({ selectionModel: { selectedIds: new Set(), selectAll: false } });
      },
      
      // Editing actions
      startCellEdit: (rowId, field) => {
        const { editingCells, rowsById, columns } = get();
        const row = rowsById.get(rowId);
        if (!row) return;
        
        const column = columns.find(c => c.field === field);
        if (!column) return;
        
        // Check if column is editable
        const isEditable = typeof column.editable === 'function'
          ? column.editable(row)
          : column.editable === true;
        
        if (!isEditable) return;
        
        const value = getColumnValue(row, column);
        const key = getCellKey(rowId, field);
        
        const newEditingCells = new Map(editingCells);
        newEditingCells.set(key, {
          rowId,
          field,
          value,
          originalValue: value,
          state: 'editing',
        });
        
        set({ editingCells: newEditingCells, focusedCell: { rowId, field } });
      },
      
      updateCellValue: (rowId, field, value) => {
        const { editingCells } = get();
        const key = getCellKey(rowId, field);
        const cell = editingCells.get(key);
        
        if (cell) {
          const newEditingCells = new Map(editingCells);
          newEditingCells.set(key, { ...cell, value });
          set({ editingCells: newEditingCells });
        }
      },
      
      setCellState: (rowId, field, state, error) => {
        const { editingCells } = get();
        const key = getCellKey(rowId, field);
        const cell = editingCells.get(key);
        
        if (cell) {
          const newEditingCells = new Map(editingCells);
          newEditingCells.set(key, { ...cell, state, error });
          set({ editingCells: newEditingCells });
        }
      },
      
      commitCellEdit: (rowId, field) => {
        const { editingCells, rowsById, columns } = get();
        const key = getCellKey(rowId, field);
        const cell = editingCells.get(key);
        
        if (!cell) return;
        
        const row = rowsById.get(rowId);
        const column = columns.find(c => c.field === field);
        
        if (row && column) {
          let newRow: T;
          if (column.valueSetter) {
            newRow = column.valueSetter(row, cell.value);
          } else {
            newRow = { ...row, [field]: cell.value } as T;
          }
          get().updateRow(rowId, newRow);
        }
        
        const newEditingCells = new Map(editingCells);
        newEditingCells.delete(key);
        set({ editingCells: newEditingCells });
      },
      
      cancelCellEdit: (rowId, field) => {
        const { editingCells } = get();
        const key = getCellKey(rowId, field);
        
        const newEditingCells = new Map(editingCells);
        newEditingCells.delete(key);
        set({ editingCells: newEditingCells });
      },
      
      // Focus actions
      setFocusedCell: (cell) => set({ focusedCell: cell }),
      
      moveFocus: (direction) => {
        const { focusedCell, flattenedNodes, columns, columnVisibility, getRowId } = get();
        if (!focusedCell) return;
        
        const visibleColumns = columns.filter(c => columnVisibility[c.field as string] !== false);
        const rowNodes = flattenedNodes.filter(n => n.type === 'row') as RowNode<T>[];
        
        const currentRowIndex = rowNodes.findIndex(n => n.id === focusedCell.rowId);
        const currentColIndex = visibleColumns.findIndex(c => c.field === focusedCell.field);
        
        if (currentRowIndex === -1 || currentColIndex === -1) return;
        
        let newRowIndex = currentRowIndex;
        let newColIndex = currentColIndex;
        
        switch (direction) {
          case 'up':
            newRowIndex = Math.max(0, currentRowIndex - 1);
            break;
          case 'down':
            newRowIndex = Math.min(rowNodes.length - 1, currentRowIndex + 1);
            break;
          case 'left':
            newColIndex = Math.max(0, currentColIndex - 1);
            break;
          case 'right':
            newColIndex = Math.min(visibleColumns.length - 1, currentColIndex + 1);
            break;
        }
        
        const newRow = rowNodes[newRowIndex];
        const newCol = visibleColumns[newColIndex];
        
        if (newRow && newCol) {
          set({ focusedCell: { rowId: getRowId(newRow.row), field: newCol.field as string } });
        }
      },
      
      // UI actions
      setDensity: (density) => set({ density }),
      setLoading: (loading) => set({ loading }),
      
      // Subscription actions
      applySubscriptionEvent: (event) => {
        const { rows, getRowId, editingCells, conflictPolicy, pendingConflicts } = get();
        
        // Check for conflicts with editing cells
        const editingRowKeys = Array.from(editingCells.keys())
          .filter(key => key.startsWith(`${event.id}:`));
        
        if (editingRowKeys.length > 0 && event.type === 'UPDATED') {
          if (conflictPolicy === 'preferLocalEdits') {
            // Don't apply remote changes to cells being edited
            const patch = event.patch || event.row;
            if (patch) {
              const filteredPatch: Partial<T> = {};
              Object.keys(patch as object).forEach(field => {
                const key = getCellKey(event.id, field);
                if (!editingCells.has(key)) {
                  (filteredPatch as Record<string, unknown>)[field] = (patch as Record<string, unknown>)[field];
                }
              });
              if (Object.keys(filteredPatch).length > 0) {
                get().updateRow(event.id, filteredPatch);
              }
            }
            return;
          } else if (conflictPolicy === 'prompt') {
            // Store conflict for user resolution
            const newConflicts = new Map(pendingConflicts);
            newConflicts.set(event.id, event);
            set({ pendingConflicts: newConflicts });
            return;
          }
          // preferRemote: fall through to apply
        }
        
        switch (event.type) {
          case 'CREATED':
          case 'UPSERT':
            if (event.row) {
              const existingIndex = rows.findIndex(r => getRowId(r) === event.id);
              if (existingIndex >= 0) {
                get().updateRow(event.id, event.row);
              } else {
                get().addRow(event.row);
              }
            }
            break;
            
          case 'UPDATED':
            if (event.row) {
              get().updateRow(event.id, event.row);
            } else if (event.patch) {
              get().updateRow(event.id, event.patch);
            }
            break;
            
          case 'DELETED':
          case 'TERMINATED':
            get().removeRow(event.id);
            break;
        }
      },
      
      resolveConflict: (rowId, resolution) => {
        const { pendingConflicts } = get();
        const conflict = pendingConflicts.get(rowId);
        
        if (!conflict) return;
        
        const newConflicts = new Map(pendingConflicts);
        newConflicts.delete(rowId);
        set({ pendingConflicts: newConflicts });
        
        if (resolution === 'remote') {
          // Cancel local edits and apply remote
          const { editingCells } = get();
          const newEditingCells = new Map(editingCells);
          
          Array.from(editingCells.keys())
            .filter(key => key.startsWith(`${rowId}:`))
            .forEach(key => newEditingCells.delete(key));
          
          set({ editingCells: newEditingCells });
          
          if (conflict.row) {
            get().updateRow(rowId, conflict.row);
          } else if (conflict.patch) {
            get().updateRow(rowId, conflict.patch);
          }
        }
        // If 'local', we just remove the conflict and keep local edits
      },
      
      // Internal actions
      reprocessData: () => {
        const {
          rows,
          columns,
          sortModel,
          filterModel,
          advancedFilterModel,
          groupingModel,
          aggregationModel,
          getRowId,
        } = get();
        
        // Apply filters
        let processed = applyFilters(rows, filterModel, columns);
        
        // Apply advanced filters
        processed = applyAdvancedFilters(processed, advancedFilterModel, columns);
        
        // Apply sorting
        processed = applySorting(processed, sortModel, columns);
        
        // Build tree if grouping
        let treeNodes: TreeNode<T>[];
        if (groupingModel.fields.length > 0) {
          treeNodes = buildGroupTree(
            processed,
            groupingModel.fields,
            columns,
            aggregationModel,
            groupingModel.expanded,
            getRowId
          );
        } else {
          treeNodes = processed.map(row => ({
            type: 'row' as const,
            id: getRowId(row),
            row,
            depth: 0,
          }));
        }
        
        // Flatten for rendering
        const flattenedNodes = flattenTree(treeNodes);
        
        set({
          processedRows: processed,
          treeNodes,
          flattenedNodes,
          totalRowCount: processed.length,
        });
      },
    }))
  );
}

export type GridStore<T> = ReturnType<typeof createGridStore<T>>;
