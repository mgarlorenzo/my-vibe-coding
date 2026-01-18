import { ReactNode } from 'react';

// ============================================================================
// Core Types
// ============================================================================

export type RowId = string | number;

export type SortDirection = 'asc' | 'desc';

export type Density = 'compact' | 'standard' | 'comfortable';

export type GridMode = 'client' | 'server';

export type CellState = 'pristine' | 'editing' | 'saving' | 'error' | 'conflict';

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export type ColumnType = 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'singleSelect' | 'custom';

export type ConflictPolicy = 'preferLocalEdits' | 'preferRemote' | 'prompt';

export type SubscriptionEventType = 'CREATED' | 'UPDATED' | 'DELETED' | 'TERMINATED' | 'UNTERMINATED' | 'UPSERT';

// ============================================================================
// Column Definition
// ============================================================================

export interface GridColumn<T> {
  field: keyof T | string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  type?: ColumnType;
  editable?: boolean | ((row: T) => boolean);
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  hideable?: boolean;
  hidden?: boolean;
  /** Prevents this column from being hidden via Column Manager (e.g., Actions column) */
  disableHiding?: boolean;
  /** Prevents this column from being reordered via Column Manager */
  disableReorder?: boolean;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  
  // Value transformations
  valueGetter?: (row: T) => unknown;
  valueSetter?: (row: T, value: unknown) => T;
  valueFormatter?: (value: unknown, row: T) => ReactNode;
  valueParser?: (value: unknown) => unknown;
  
  // Custom renderers
  renderCell?: (params: CellRenderParams<T>) => ReactNode;
  renderEditCell?: (params: EditCellRenderParams<T>) => ReactNode;
  renderHeader?: (params: HeaderRenderParams<T>) => ReactNode;
  
  // Aggregations for grouping
  aggregations?: AggregationType[];
  
  // For singleSelect type
  valueOptions?: Array<{ value: unknown; label: string }> | ((row: T) => Array<{ value: unknown; label: string }>);
  
  // Validation
  validate?: (value: unknown, row: T) => string | null | Promise<string | null>;
}

export interface CellRenderParams<T> {
  row: T;
  rowId: RowId;
  field: string;
  value: unknown;
  column: GridColumn<T>;
  isEditing: boolean;
  cellState: CellState;
}

export interface EditCellRenderParams<T> {
  row: T;
  rowId: RowId;
  field: string;
  value: unknown;
  column: GridColumn<T>;
  onChange: (value: unknown) => void;
  onCommit: () => void;
  onCancel: () => void;
  error?: string;
}

export interface HeaderRenderParams<T> {
  column: GridColumn<T>;
  sortDirection?: SortDirection;
  onSort: () => void;
}

// ============================================================================
// Sorting, Filtering, Paging
// ============================================================================

export interface SortModel {
  field: string;
  direction: SortDirection;
}

export interface FilterItem {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'isEmpty' | 'isNotEmpty' | 'eq' | 'neq' | 'is';
  value?: unknown;
}

export interface FilterModel {
  items: FilterItem[];
  quickFilter?: string;
  linkOperator?: 'and' | 'or';
}

// ============================================================================
// Advanced Filter Types
// ============================================================================

export interface AdvancedFilterField {
  field: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

/** Date filter can be exact date or range */
export type DateFilterMode = 'exact' | 'range';

export interface DateFilter {
  mode: DateFilterMode;
  /** For exact mode: the specific date */
  date?: Date | null;
  /** For range mode: start date */
  startDate?: Date | null;
  /** For range mode: end date */
  endDate?: Date | null;
}

export interface AdvancedFilterModel {
  /** Map of field -> selected values (for string/number/boolean fields) */
  filters: Record<string, Set<string>>;
  /** Map of field -> date filter (for date fields) */
  dateFilters?: Record<string, DateFilter>;
}

export interface PaginationModel {
  page: number;
  pageSize: number;
}

export interface QueryState {
  pagination: PaginationModel;
  sort: SortModel[];
  filter: FilterModel;
}

// ============================================================================
// Grouping
// ============================================================================

export interface GroupingModel {
  fields: string[];
  expanded: Record<string, boolean>;
}

export interface AggregationModel {
  [field: string]: AggregationType[];
}

export interface GroupNode<T> {
  type: 'group';
  id: string;
  field: string;
  value: unknown;
  depth: number;
  childCount: number;
  isExpanded: boolean;
  aggregations: Record<string, Record<AggregationType, number>>;
  children: Array<GroupNode<T> | RowNode<T>>;
}

export interface RowNode<T> {
  type: 'row';
  id: RowId;
  row: T;
  depth: number;
}

export type TreeNode<T> = GroupNode<T> | RowNode<T>;

export interface FlattenedNode<T> {
  node: TreeNode<T>;
  index: number;
}

// ============================================================================
// Editing
// ============================================================================

export interface EditingCell {
  rowId: RowId;
  field: string;
  value: unknown;
  originalValue: unknown;
  state: CellState;
  error?: string;
}

export interface EditingRow {
  rowId: RowId;
  values: Record<string, unknown>;
  originalRow: unknown;
  state: CellState;
  errors: Record<string, string>;
}

// ============================================================================
// Subscriptions
// ============================================================================

export interface SubscriptionEvent<T> {
  type: SubscriptionEventType;
  id: RowId;
  row?: T;
  patch?: Partial<T>;
  updatedAt?: string;
  version?: number;
}

export interface SubscriptionConfig<T> {
  subscribe: (handler: (event: SubscriptionEvent<T>) => void) => () => void;
  applyEvent?: (rows: T[], event: SubscriptionEvent<T>, getRowId: (row: T) => RowId) => T[];
  conflictPolicy?: ConflictPolicy;
  debounceMs?: number;
}

// ============================================================================
// Selection
// ============================================================================

export interface SelectionModel {
  selectedIds: Set<RowId>;
  selectAll: boolean;
}

// ============================================================================
// Column Visibility & Sizing
// ============================================================================

export interface ColumnVisibilityModel {
  [field: string]: boolean;
}

export interface ColumnSizingModel {
  [field: string]: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportScope = 
  | { type: 'selected' }
  | { type: 'all' }
  | { type: 'filtered' };

// ============================================================================
// Column Persistence Types
// ============================================================================

/** Version 1 of column configuration for localStorage persistence */
export interface ColumnConfigV1 {
  version: 1;
  /** Ordered array of column field names */
  order: string[];
  /** Array of hidden column field names */
  hidden: string[];
}

export interface ExportColumnConfig {
  field: string;
  headerName: string;
  getValue: (row: unknown) => unknown;
}

// ============================================================================
// Main Props
// ============================================================================

export interface FactorialDataGridProps<T> {
  // Data
  rows: T[];
  columns: GridColumn<T>[];
  getRowId: (row: T) => RowId;
  loading?: boolean;
  
  // Mode
  mode?: GridMode;
  
  // Pagination
  pagination?: boolean;
  paginationModel?: PaginationModel;
  onPaginationModelChange?: (model: PaginationModel) => void;
  rowCount?: number; // For server mode
  pageSizeOptions?: number[];
  
  // Sorting
  sortModel?: SortModel[];
  onSortModelChange?: (model: SortModel[]) => void;
  
  // Filtering
  filterModel?: FilterModel;
  onFilterModelChange?: (model: FilterModel) => void;
  
  // Grouping
  groupingModel?: GroupingModel;
  onGroupingModelChange?: (model: GroupingModel) => void;
  aggregationModel?: AggregationModel;
  renderGroupRow?: (params: GroupRowRenderParams<T>) => ReactNode;
  
  // Selection
  checkboxSelection?: boolean;
  selectionModel?: SelectionModel;
  onSelectionModelChange?: (model: SelectionModel) => void;
  
  // Column visibility & sizing
  columnVisibilityModel?: ColumnVisibilityModel;
  onColumnVisibilityModelChange?: (model: ColumnVisibilityModel) => void;
  columnSizingModel?: ColumnSizingModel;
  onColumnSizingModelChange?: (model: ColumnSizingModel) => void;
  
  // Inline editing
  editMode?: 'cell' | 'row';
  processRowUpdate?: (newRow: T, oldRow: T) => Promise<T>;
  onProcessRowUpdateError?: (error: unknown, context: { rowId: RowId; field?: string }) => void;
  
  // Subscriptions
  subscriptionConfig?: SubscriptionConfig<T>;
  
  // UI
  density?: Density;
  onDensityChange?: (density: Density) => void;
  autoHeight?: boolean;
  rowHeight?: number | ((row: T) => number);
  headerHeight?: number;
  
  // Toolbar
  showToolbar?: boolean;
  showQuickFilter?: boolean;
  showColumnSelector?: boolean;
  showDensitySelector?: boolean;
  showGroupingPanel?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  toolbarActions?: ReactNode;
  
  // Advanced Filters
  /** Show advanced multi-select filter panel instead of legacy filters */
  showAdvancedFilters?: boolean;
  /** Fields available for advanced filtering */
  advancedFilterFields?: AdvancedFilterField[];
  /** Controlled advanced filter model */
  advancedFilterModel?: AdvancedFilterModel;
  /** Callback when advanced filter model changes */
  onAdvancedFilterModelChange?: (model: AdvancedFilterModel) => void;
  
  // Export configuration
  /** Name used for export filename (e.g., "employees" -> employees_2024-01-15_1430.csv) */
  gridName?: string;
  /** Enable/disable export feature (default: true) */
  enableExport?: boolean;
  /** For server mode: function to fetch all rows for "All rows" export */
  getAllRows?: () => Promise<T[]> | T[];
  /** Transform row data before export */
  mapRowForExport?: (row: T) => Record<string, unknown> | T;
  /** Determine if a column should be included in export (default: excludes 'actions' type) */
  isColumnExportable?: (column: GridColumn<T>) => boolean;
  
  // Column persistence
  /** Key for localStorage persistence of column order/visibility. If not provided, persistence is disabled. */
  storageKey?: string;
  /** Initial column visibility (overridden by localStorage if storageKey is set) */
  initialColumnVisibility?: Record<string, boolean>;
  /** Initial column order as array of field names (overridden by localStorage if storageKey is set) */
  initialColumnOrder?: string[];
  
  // Slots for customization
  slots?: {
    toolbar?: React.ComponentType<ToolbarSlotProps<T>>;
    noRowsOverlay?: React.ComponentType;
    loadingOverlay?: React.ComponentType;
    footer?: React.ComponentType<FooterSlotProps>;
  };
  
  // Callbacks
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  onCellClick?: (params: CellClickParams<T>, event: React.MouseEvent) => void;
  onCellDoubleClick?: (params: CellClickParams<T>, event: React.MouseEvent) => void;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  getRowClassName?: (row: T) => string;
  getCellClassName?: (params: CellRenderParams<T>) => string;
}

export interface GroupRowRenderParams<T> {
  group: GroupNode<T>;
  toggleExpand: () => void;
}

export interface ToolbarSlotProps<T> {
  columns: GridColumn<T>[];
  density: Density;
  onDensityChange: (density: Density) => void;
  quickFilter: string;
  onQuickFilterChange: (value: string) => void;
  columnVisibility: ColumnVisibilityModel;
  onColumnVisibilityChange: (model: ColumnVisibilityModel) => void;
  groupingFields: string[];
  onGroupingFieldsChange: (fields: string[]) => void;
}

export interface FooterSlotProps {
  rowCount: number;
  selectedCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export interface CellClickParams<T> {
  row: T;
  rowId: RowId;
  field: string;
  value: unknown;
}
