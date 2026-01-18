// Main component
export { FactorialDataGrid, default } from './FactorialDataGrid';

// Types
export type {
  RowId,
  SortDirection,
  Density,
  GridMode,
  CellState,
  AggregationType,
  ColumnType,
  ConflictPolicy,
  SubscriptionEventType,
  GridColumn,
  CellRenderParams,
  EditCellRenderParams,
  HeaderRenderParams,
  SortModel,
  FilterItem,
  FilterModel,
  AdvancedFilterField,
  AdvancedFilterModel,
  DateFilter,
  DateFilterMode,
  PaginationModel,
  QueryState,
  GroupingModel,
  AggregationModel,
  GroupNode,
  RowNode,
  TreeNode,
  FlattenedNode,
  EditingCell,
  EditingRow,
  SubscriptionEvent,
  SubscriptionConfig,
  SelectionModel,
  ColumnVisibilityModel,
  ColumnSizingModel,
  FactorialDataGridProps,
  GroupRowRenderParams,
  ToolbarSlotProps,
  FooterSlotProps,
  CellClickParams,
  ColumnConfigV1,
} from './types';

// Hooks
export {
  GridProvider,
  useGridStore,
  useGridState,
  useRows,
  useColumns,
  useFlattenedNodes,
  useSortModel,
  useFilterModel,
  usePaginationModel,
  useGroupingModel,
  useSelectionModel,
  useEditingCells,
  useDensity,
  useLoading,
  useFocusedCell,
  useColumnVisibility,
  useTotalRowCount,
  useGridActions,
} from './hooks/useGridContext';

// Store
export { createGridStore } from './core/store';
export type { GridState, GridActions, GridStore } from './core/store';

// Components (for advanced customization)
export { GridHeader } from './components/GridHeader';
export { GridBody } from './components/GridBody';
export { GridRow } from './components/GridRow';
export { GridCell, CheckboxCell } from './components/GridCell';
export { GridGroupRow } from './components/GridGroupRow';
export { GridToolbar } from './components/GridToolbar';
export { GridFooter } from './components/GridFooter';

// Editors
export {
  TextEditor,
  NumberEditor,
  DateEditor,
  DateTimeEditor,
  BooleanEditor,
  SelectEditor,
  getDefaultEditor,
  renderEditor,
} from './editors';

// Utilities
export { defaultApplyEvent } from './utils/subscriptionUtils';
export {
  loadColumnConfig,
  saveColumnConfig,
  clearColumnConfig,
  applyColumnConfig,
  extractHiddenFields,
} from './utils/columnPersistence';

// Components (Column Manager)
export { ColumnManagerPanel } from './components/ColumnManagerPanel';

// Components (Advanced Filter)
export { AdvancedFilterPanel } from './components/AdvancedFilterPanel';
