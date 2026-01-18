import { createContext, useContext, useRef, ReactNode } from 'react';
import { useStore } from 'zustand';
import { createGridStore, GridStore, GridState, GridActions } from '../core/store';

// ============================================================================
// Context
// ============================================================================

const GridContext = createContext<GridStore<unknown> | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface GridProviderProps {
  children: ReactNode;
}

export function GridProvider<T>({ children }: GridProviderProps) {
  const storeRef = useRef<GridStore<T>>();
  
  if (!storeRef.current) {
    storeRef.current = createGridStore<T>();
  }
  
  return (
    <GridContext.Provider value={storeRef.current as GridStore<unknown>}>
      {children}
    </GridContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useGridStore<T>(): GridStore<T> {
  const store = useContext(GridContext);
  if (!store) {
    throw new Error('useGridStore must be used within a GridProvider');
  }
  return store as GridStore<T>;
}

export function useGridState<T, U>(selector: (state: GridState<T> & GridActions<T>) => U): U {
  const store = useGridStore<T>();
  return useStore(store, selector);
}

// Convenience hooks for common state slices
export function useRows<T>() {
  return useGridState<T, T[]>(state => state.rows);
}

export function useColumns<T>() {
  return useGridState<T, GridState<T>['columns']>(state => state.columns);
}

export function useFlattenedNodes<T>() {
  return useGridState<T, GridState<T>['flattenedNodes']>(state => state.flattenedNodes);
}

export function useSortModel<T>() {
  return useGridState<T, GridState<T>['sortModel']>(state => state.sortModel);
}

export function useFilterModel<T>() {
  return useGridState<T, GridState<T>['filterModel']>(state => state.filterModel);
}

export function usePaginationModel<T>() {
  return useGridState<T, GridState<T>['paginationModel']>(state => state.paginationModel);
}

export function useGroupingModel<T>() {
  return useGridState<T, GridState<T>['groupingModel']>(state => state.groupingModel);
}

export function useSelectionModel<T>() {
  return useGridState<T, GridState<T>['selectionModel']>(state => state.selectionModel);
}

export function useEditingCells<T>() {
  return useGridState<T, GridState<T>['editingCells']>(state => state.editingCells);
}

export function useDensity<T>() {
  return useGridState<T, GridState<T>['density']>(state => state.density);
}

export function useLoading<T>() {
  return useGridState<T, GridState<T>['loading']>(state => state.loading);
}

export function useFocusedCell<T>() {
  return useGridState<T, GridState<T>['focusedCell']>(state => state.focusedCell);
}

export function useColumnVisibility<T>() {
  return useGridState<T, GridState<T>['columnVisibility']>(state => state.columnVisibility);
}

export function useTotalRowCount<T>() {
  return useGridState<T, GridState<T>['totalRowCount']>(state => state.totalRowCount);
}

// Action hooks
export function useGridActions<T>() {
  const store = useGridStore<T>();
  return useStore(store, state => ({
    setRows: state.setRows,
    updateRow: state.updateRow,
    addRow: state.addRow,
    removeRow: state.removeRow,
    setColumns: state.setColumns,
    setColumnVisibility: state.setColumnVisibility,
    toggleColumnVisibility: state.toggleColumnVisibility,
    setColumnWidth: state.setColumnWidth,
    setSortModel: state.setSortModel,
    toggleSort: state.toggleSort,
    setFilterModel: state.setFilterModel,
    setQuickFilter: state.setQuickFilter,
    setPaginationModel: state.setPaginationModel,
    setPage: state.setPage,
    setPageSize: state.setPageSize,
    setGroupingModel: state.setGroupingModel,
    addGroupingField: state.addGroupingField,
    removeGroupingField: state.removeGroupingField,
    reorderGroupingFields: state.reorderGroupingFields,
    toggleGroupExpanded: state.toggleGroupExpanded,
    expandAllGroups: state.expandAllGroups,
    collapseAllGroups: state.collapseAllGroups,
    setSelectionModel: state.setSelectionModel,
    selectRow: state.selectRow,
    deselectRow: state.deselectRow,
    toggleRowSelection: state.toggleRowSelection,
    selectAll: state.selectAll,
    deselectAll: state.deselectAll,
    startCellEdit: state.startCellEdit,
    updateCellValue: state.updateCellValue,
    setCellState: state.setCellState,
    commitCellEdit: state.commitCellEdit,
    cancelCellEdit: state.cancelCellEdit,
    setFocusedCell: state.setFocusedCell,
    moveFocus: state.moveFocus,
    setDensity: state.setDensity,
    setLoading: state.setLoading,
    applySubscriptionEvent: state.applySubscriptionEvent,
    resolveConflict: state.resolveConflict,
  }));
}
