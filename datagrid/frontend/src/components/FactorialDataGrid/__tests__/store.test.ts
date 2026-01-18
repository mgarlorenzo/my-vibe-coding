import { describe, it, expect } from 'vitest';
import { createGridStore } from '../core/store';
import { GridColumn, SubscriptionEvent } from '../types';

// ============================================================================
// Test Data Types
// ============================================================================

interface TestEmployee {
  id: number;
  name: string;
  department: string;
  salary: number;
  active: boolean;
}

// ============================================================================
// Test Data
// ============================================================================

const testEmployees: TestEmployee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000, active: true },
  { id: 2, name: 'Bob Smith', department: 'Engineering', salary: 85000, active: true },
  { id: 3, name: 'Carol Williams', department: 'Marketing', salary: 75000, active: true },
  { id: 4, name: 'David Brown', department: 'Marketing', salary: 70000, active: false },
  { id: 5, name: 'Eve Davis', department: 'Sales', salary: 80000, active: true },
];

const testColumns: GridColumn<TestEmployee>[] = [
  { field: 'name', headerName: 'Name', width: 200, editable: true },
  { field: 'department', headerName: 'Department', width: 150, editable: true },
  { field: 'salary', headerName: 'Salary', width: 120, type: 'number', editable: true },
  { field: 'active', headerName: 'Active', width: 100, type: 'boolean', editable: true },
];

const getRowId = (row: TestEmployee) => row.id;

// ============================================================================
// Store Tests
// ============================================================================

describe('GridStore - Data Management', () => {
  it('initializes with empty state', () => {
    const store = createGridStore<TestEmployee>();
    const state = store.getState();

    expect(state.rows).toEqual([]);
    expect(state.columns).toEqual([]);
    expect(state.processedRows).toEqual([]);
  });

  it('sets rows and creates rowsById map', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const state = store.getState();
    expect(state.rows).toEqual(testEmployees);
    expect(state.rowsById.size).toBe(5);
    expect(state.rowsById.get(1)).toEqual(testEmployees[0]);
  });

  it('updates a single row', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().updateRow(1, { name: 'Alice Updated' });

    const state = store.getState();
    expect(state.rowsById.get(1)?.name).toBe('Alice Updated');
  });

  it('adds a new row', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const newEmployee = { id: 6, name: 'Frank Wilson', department: 'HR', salary: 65000, active: true };
    store.getState().addRow(newEmployee);

    const state = store.getState();
    expect(state.rows.length).toBe(6);
    expect(state.rowsById.get(6)).toEqual(newEmployee);
  });

  it('removes a row', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().removeRow(1);

    const state = store.getState();
    expect(state.rows.length).toBe(4);
    expect(state.rowsById.has(1)).toBe(false);
  });
});

describe('GridStore - Sorting', () => {
  it('sorts rows ascending by name', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setSortModel([{ field: 'name', direction: 'asc' }]);

    const state = store.getState();
    expect(state.processedRows[0].name).toBe('Alice Johnson');
    expect(state.processedRows[1].name).toBe('Bob Smith');
    expect(state.processedRows[2].name).toBe('Carol Williams');
  });

  it('sorts rows descending by salary', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setSortModel([{ field: 'salary', direction: 'desc' }]);

    const state = store.getState();
    expect(state.processedRows[0].salary).toBe(95000);
    expect(state.processedRows[1].salary).toBe(85000);
    expect(state.processedRows[2].salary).toBe(80000);
  });

  it('toggles sort direction', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    // First toggle - ascending
    store.getState().toggleSort('name');
    expect(store.getState().sortModel).toEqual([{ field: 'name', direction: 'asc' }]);

    // Second toggle - descending
    store.getState().toggleSort('name');
    expect(store.getState().sortModel).toEqual([{ field: 'name', direction: 'desc' }]);

    // Third toggle - clear
    store.getState().toggleSort('name');
    expect(store.getState().sortModel).toEqual([]);
  });
});

describe('GridStore - Filtering', () => {
  it('filters rows with quick filter', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setQuickFilter('alice');

    const state = store.getState();
    expect(state.processedRows.length).toBe(1);
    expect(state.processedRows[0].name).toBe('Alice Johnson');
  });

  it('filters rows by department', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setFilterModel({
      items: [{ field: 'department', operator: 'equals', value: 'Engineering' }],
    });

    const state = store.getState();
    expect(state.processedRows.length).toBe(2);
    expect(state.processedRows.every(r => r.department === 'Engineering')).toBe(true);
  });

  it('filters with multiple conditions (AND)', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setFilterModel({
      items: [
        { field: 'department', operator: 'equals', value: 'Engineering' },
        { field: 'salary', operator: 'gt', value: 90000 },
      ],
      linkOperator: 'and',
    });

    const state = store.getState();
    expect(state.processedRows.length).toBe(1);
    expect(state.processedRows[0].name).toBe('Alice Johnson');
  });

  it('filters with multiple conditions (OR)', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setFilterModel({
      items: [
        { field: 'department', operator: 'equals', value: 'Sales' },
        { field: 'salary', operator: 'gt', value: 90000 },
      ],
      linkOperator: 'or',
    });

    const state = store.getState();
    expect(state.processedRows.length).toBe(2); // Alice (salary > 90k) and Eve (Sales)
  });
});

describe('GridStore - Grouping', () => {
  it('groups rows by department', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setGroupingModel({ fields: ['department'], expanded: {} });

    const state = store.getState();
    expect(state.treeNodes.length).toBe(3); // Engineering, Marketing, Sales

    const engineeringGroup = state.treeNodes.find(n => n.type === 'group' && n.value === 'Engineering');
    expect(engineeringGroup).toBeDefined();
    expect(engineeringGroup?.type === 'group' && engineeringGroup.childCount).toBe(2);
  });

  it('expands and collapses groups', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setGroupingModel({ 
      fields: ['department'], 
      expanded: { 'department:Engineering': true } 
    });

    // Initially Engineering is expanded
    let state = store.getState();
    const initialFlatCount = state.flattenedNodes.length;

    // Collapse Engineering
    store.getState().toggleGroupExpanded('department:Engineering');

    state = store.getState();
    expect(state.flattenedNodes.length).toBeLessThan(initialFlatCount);
  });

  it('calculates aggregations for groups', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);
    store.setState({ aggregationModel: { salary: ['sum', 'avg', 'count'] } });

    store.getState().setGroupingModel({ fields: ['department'], expanded: {} });

    const state = store.getState();
    const engineeringGroup = state.treeNodes.find(
      n => n.type === 'group' && n.value === 'Engineering'
    );

    expect(engineeringGroup?.type === 'group').toBe(true);
    if (engineeringGroup?.type === 'group') {
      expect(engineeringGroup.aggregations.salary.sum).toBe(180000); // 95000 + 85000
      expect(engineeringGroup.aggregations.salary.avg).toBe(90000);
      expect(engineeringGroup.aggregations.salary.count).toBe(2);
    }
  });

  it('supports nested grouping', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().setGroupingModel({ 
      fields: ['department', 'active'], 
      expanded: { 
        'department:Engineering': true,
        'department:Marketing': true,
      } 
    });

    const state = store.getState();
    
    // Find Engineering group
    const engineeringGroup = state.treeNodes.find(
      n => n.type === 'group' && n.value === 'Engineering'
    );
    
    expect(engineeringGroup?.type === 'group').toBe(true);
    if (engineeringGroup?.type === 'group') {
      // Engineering has 2 employees, both active, so 1 subgroup
      expect(engineeringGroup.children.length).toBe(1);
      expect(engineeringGroup.children[0].type).toBe('group');
    }
  });
});

describe('GridStore - Selection', () => {
  it('selects a single row', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setRows(testEmployees);

    store.getState().selectRow(1);

    const state = store.getState();
    expect(state.selectionModel.selectedIds.has(1)).toBe(true);
    expect(state.selectionModel.selectedIds.size).toBe(1);
  });

  it('deselects a row', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setRows(testEmployees);

    store.getState().selectRow(1);
    store.getState().deselectRow(1);

    const state = store.getState();
    expect(state.selectionModel.selectedIds.has(1)).toBe(false);
  });

  it('toggles row selection', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setRows(testEmployees);

    store.getState().toggleRowSelection(1);
    expect(store.getState().selectionModel.selectedIds.has(1)).toBe(true);

    store.getState().toggleRowSelection(1);
    expect(store.getState().selectionModel.selectedIds.has(1)).toBe(false);
  });

  it('selects all rows', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().selectAll();

    const state = store.getState();
    expect(state.selectionModel.selectedIds.size).toBe(5);
    expect(state.selectionModel.selectAll).toBe(true);
  });

  it('deselects all rows', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().selectAll();
    store.getState().deselectAll();

    const state = store.getState();
    expect(state.selectionModel.selectedIds.size).toBe(0);
    expect(state.selectionModel.selectAll).toBe(false);
  });
});

describe('GridStore - Editing', () => {
  it('starts cell editing', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().startCellEdit(1, 'name');

    const state = store.getState();
    const editingCell = state.editingCells.get('1:name');
    expect(editingCell).toBeDefined();
    expect(editingCell?.value).toBe('Alice Johnson');
    expect(editingCell?.originalValue).toBe('Alice Johnson');
    expect(editingCell?.state).toBe('editing');
  });

  it('updates cell value during editing', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().startCellEdit(1, 'name');
    store.getState().updateCellValue(1, 'name', 'Alice Updated');

    const state = store.getState();
    const editingCell = state.editingCells.get('1:name');
    expect(editingCell?.value).toBe('Alice Updated');
    expect(editingCell?.originalValue).toBe('Alice Johnson');
  });

  it('commits cell edit', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().startCellEdit(1, 'name');
    store.getState().updateCellValue(1, 'name', 'Alice Updated');
    store.getState().commitCellEdit(1, 'name');

    const state = store.getState();
    expect(state.editingCells.has('1:name')).toBe(false);
    expect(state.rowsById.get(1)?.name).toBe('Alice Updated');
  });

  it('cancels cell edit', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().startCellEdit(1, 'name');
    store.getState().updateCellValue(1, 'name', 'Alice Updated');
    store.getState().cancelCellEdit(1, 'name');

    const state = store.getState();
    expect(state.editingCells.has('1:name')).toBe(false);
    expect(state.rowsById.get(1)?.name).toBe('Alice Johnson'); // Original value
  });

  it('sets cell state to error', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    store.getState().startCellEdit(1, 'name');
    store.getState().setCellState(1, 'name', 'error', 'Save failed');

    const state = store.getState();
    const editingCell = state.editingCells.get('1:name');
    expect(editingCell?.state).toBe('error');
    expect(editingCell?.error).toBe('Save failed');
  });
});

describe('GridStore - Subscriptions', () => {
  it('applies CREATED subscription event', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const event: SubscriptionEvent<TestEmployee> = {
      type: 'CREATED',
      id: 6,
      row: { id: 6, name: 'Frank Wilson', department: 'HR', salary: 65000, active: true },
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    expect(state.rows.length).toBe(6);
    expect(state.rowsById.get(6)?.name).toBe('Frank Wilson');
  });

  it('applies UPDATED subscription event', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const event: SubscriptionEvent<TestEmployee> = {
      type: 'UPDATED',
      id: 1,
      row: { ...testEmployees[0], name: 'Alice Updated' },
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    expect(state.rowsById.get(1)?.name).toBe('Alice Updated');
  });

  it('applies UPDATED subscription event with patch', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const event: SubscriptionEvent<TestEmployee> = {
      type: 'UPDATED',
      id: 1,
      patch: { salary: 100000 },
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    expect(state.rowsById.get(1)?.salary).toBe(100000);
    expect(state.rowsById.get(1)?.name).toBe('Alice Johnson'); // Unchanged
  });

  it('applies DELETED subscription event', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const event: SubscriptionEvent<TestEmployee> = {
      type: 'DELETED',
      id: 1,
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    expect(state.rows.length).toBe(4);
    expect(state.rowsById.has(1)).toBe(false);
  });

  it('applies TERMINATED subscription event', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    const event: SubscriptionEvent<TestEmployee> = {
      type: 'TERMINATED',
      id: 1,
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    expect(state.rows.length).toBe(4);
    expect(state.rowsById.has(1)).toBe(false);
  });

  it('respects preferLocalEdits conflict policy', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId, conflictPolicy: 'preferLocalEdits' });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    // Start editing
    store.getState().startCellEdit(1, 'name');
    store.getState().updateCellValue(1, 'name', 'Local Edit');

    // Remote update arrives
    const event: SubscriptionEvent<TestEmployee> = {
      type: 'UPDATED',
      id: 1,
      patch: { name: 'Remote Update' },
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    // Local edit should be preserved
    const editingCell = state.editingCells.get('1:name');
    expect(editingCell?.value).toBe('Local Edit');
  });

  it('applies remote update with preferRemote conflict policy', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId, conflictPolicy: 'preferRemote' });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);

    // Start editing
    store.getState().startCellEdit(1, 'name');
    store.getState().updateCellValue(1, 'name', 'Local Edit');

    // Remote update arrives
    const event: SubscriptionEvent<TestEmployee> = {
      type: 'UPDATED',
      id: 1,
      row: { ...testEmployees[0], name: 'Remote Update' },
    };

    store.getState().applySubscriptionEvent(event);

    const state = store.getState();
    // Remote update should be applied
    expect(state.rowsById.get(1)?.name).toBe('Remote Update');
  });
});

describe('GridStore - Pagination', () => {
  it('sets pagination model', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setPaginationModel({ page: 2, pageSize: 10 });

    const state = store.getState();
    expect(state.paginationModel.page).toBe(2);
    expect(state.paginationModel.pageSize).toBe(10);
  });

  it('sets page', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setPage(3);

    const state = store.getState();
    expect(state.paginationModel.page).toBe(3);
  });

  it('sets page size and resets page to 0', () => {
    const store = createGridStore<TestEmployee>();
    store.getState().setPage(5);

    store.getState().setPageSize(50);

    const state = store.getState();
    expect(state.paginationModel.pageSize).toBe(50);
    expect(state.paginationModel.page).toBe(0);
  });
});

describe('GridStore - Column Visibility', () => {
  it('sets column visibility model', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setColumnVisibility({ salary: false, active: false });

    const state = store.getState();
    expect(state.columnVisibility.salary).toBe(false);
    expect(state.columnVisibility.active).toBe(false);
  });

  it('toggles column visibility', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().toggleColumnVisibility('salary');
    expect(store.getState().columnVisibility.salary).toBe(true);

    store.getState().toggleColumnVisibility('salary');
    expect(store.getState().columnVisibility.salary).toBe(false);
  });
});

describe('GridStore - Column Sizing', () => {
  it('sets column width', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setColumnWidth('name', 300);

    const state = store.getState();
    expect(state.columnSizing.name).toBe(300);
  });
});

describe('GridStore - Density', () => {
  it('sets density', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setDensity('compact');
    expect(store.getState().density).toBe('compact');

    store.getState().setDensity('comfortable');
    expect(store.getState().density).toBe('comfortable');
  });
});

describe('GridStore - Focus Navigation', () => {
  it('sets focused cell', () => {
    const store = createGridStore<TestEmployee>();

    store.getState().setFocusedCell({ rowId: 1, field: 'name' });

    const state = store.getState();
    expect(state.focusedCell).toEqual({ rowId: 1, field: 'name' });
  });

  it('moves focus up', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);
    store.getState().setFocusedCell({ rowId: 2, field: 'name' });

    store.getState().moveFocus('up');

    const state = store.getState();
    expect(state.focusedCell?.rowId).toBe(1);
  });

  it('moves focus down', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);
    store.getState().setFocusedCell({ rowId: 1, field: 'name' });

    store.getState().moveFocus('down');

    const state = store.getState();
    expect(state.focusedCell?.rowId).toBe(2);
  });

  it('moves focus left', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);
    store.getState().setFocusedCell({ rowId: 1, field: 'department' });

    store.getState().moveFocus('left');

    const state = store.getState();
    expect(state.focusedCell?.field).toBe('name');
  });

  it('moves focus right', () => {
    const store = createGridStore<TestEmployee>();
    store.setState({ getRowId });
    store.getState().setColumns(testColumns);
    store.getState().setRows(testEmployees);
    store.getState().setFocusedCell({ rowId: 1, field: 'name' });

    store.getState().moveFocus('right');

    const state = store.getState();
    expect(state.focusedCell?.field).toBe('department');
  });
});
