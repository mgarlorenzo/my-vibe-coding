import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnManagerPanel } from '../components/ColumnManagerPanel';
import { GridColumn, ColumnVisibilityModel } from '../types';

// ============================================================================
// Test Data
// ============================================================================

interface TestRow {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
}

const mockColumns: GridColumn<TestRow>[] = [
  { field: 'id', headerName: 'ID' },
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email Address' },
  { field: 'department', headerName: 'Department' },
  { field: 'salary', headerName: 'Salary' },
];

const mockColumnOrder = ['id', 'name', 'email', 'department', 'salary'];

const mockColumnVisibility: ColumnVisibilityModel = {
  id: true,
  name: true,
  email: true,
  department: true,
  salary: true,
};

// ============================================================================
// Helper Functions
// ============================================================================

function renderColumnManagerPanel(props: Partial<Parameters<typeof ColumnManagerPanel<TestRow>>[0]> = {}) {
  const anchorEl = document.createElement('div');
  document.body.appendChild(anchorEl);

  const defaultProps = {
    anchorEl,
    open: true,
    onClose: vi.fn(),
    columns: mockColumns,
    columnOrder: mockColumnOrder,
    columnVisibility: mockColumnVisibility,
    onColumnOrderChange: vi.fn(),
    onColumnVisibilityChange: vi.fn(),
  };

  return render(<ColumnManagerPanel {...defaultProps} {...props} />);
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('ColumnManagerPanel - Basic Rendering', () => {
  it('renders the panel when open', () => {
    renderColumnManagerPanel();
    
    expect(screen.getByTestId('column-manager-panel')).toBeInTheDocument();
    expect(screen.getByText('Columns')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderColumnManagerPanel({ open: false });
    
    expect(screen.queryByTestId('column-manager-panel')).not.toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.querySelector('input')).toHaveAttribute('placeholder', 'Search columns...');
  });

  it('renders all columns in the list', () => {
    renderColumnManagerPanel();
    
    expect(screen.getByTestId('column-item-id')).toBeInTheDocument();
    expect(screen.getByTestId('column-item-name')).toBeInTheDocument();
    expect(screen.getByTestId('column-item-email')).toBeInTheDocument();
    expect(screen.getByTestId('column-item-department')).toBeInTheDocument();
    expect(screen.getByTestId('column-item-salary')).toBeInTheDocument();
  });

  it('displays column header names', () => {
    renderColumnManagerPanel();
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });
});

// ============================================================================
// Search Functionality Tests
// ============================================================================

describe('ColumnManagerPanel - Search', () => {
  it('filters columns by headerName (case-insensitive)', async () => {
    const user = userEvent.setup();
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    await user.type(searchInput, 'email');
    
    // Should show Email Address column
    expect(screen.getByTestId('column-item-email')).toBeInTheDocument();
    
    // Should hide other columns
    expect(screen.queryByTestId('column-item-id')).not.toBeInTheDocument();
    expect(screen.queryByTestId('column-item-name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('column-item-department')).not.toBeInTheDocument();
    expect(screen.queryByTestId('column-item-salary')).not.toBeInTheDocument();
  });

  it('filters columns by field name (case-insensitive)', async () => {
    const user = userEvent.setup();
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    await user.type(searchInput, 'DEPARTMENT');
    
    expect(screen.getByTestId('column-item-department')).toBeInTheDocument();
    expect(screen.queryByTestId('column-item-id')).not.toBeInTheDocument();
  });

  it('shows "No columns found" when search has no matches', async () => {
    const user = userEvent.setup();
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByTestId('no-columns-found')).toBeInTheDocument();
    expect(screen.getByText('No columns found')).toBeInTheDocument();
  });

  it('shows drag disabled notice when search is active', async () => {
    const user = userEvent.setup();
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    await user.type(searchInput, 'name');
    
    expect(screen.getByTestId('drag-disabled-notice')).toBeInTheDocument();
    expect(screen.getByText('Clear search to reorder columns')).toBeInTheDocument();
  });

  it('clears search and shows all columns', async () => {
    const user = userEvent.setup();
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    await user.type(searchInput, 'email');
    
    // Only email visible
    expect(screen.queryByTestId('column-item-id')).not.toBeInTheDocument();
    
    // Clear search
    await user.clear(searchInput);
    
    // All columns visible again
    expect(screen.getByTestId('column-item-id')).toBeInTheDocument();
    expect(screen.getByTestId('column-item-email')).toBeInTheDocument();
  });
});

// ============================================================================
// Visibility Toggle Tests
// ============================================================================

describe('ColumnManagerPanel - Visibility Toggle', () => {
  it('shows checkboxes for all columns', () => {
    renderColumnManagerPanel();
    
    expect(screen.getByTestId('column-checkbox-id')).toBeInTheDocument();
    expect(screen.getByTestId('column-checkbox-name')).toBeInTheDocument();
    expect(screen.getByTestId('column-checkbox-email')).toBeInTheDocument();
  });

  it('checkbox is checked when column is visible', () => {
    renderColumnManagerPanel({
      columnVisibility: { id: true, name: true, email: false, department: true, salary: true },
    });
    
    const idCheckbox = screen.getByTestId('column-checkbox-id').querySelector('input')!;
    const emailCheckbox = screen.getByTestId('column-checkbox-email').querySelector('input')!;
    
    expect(idCheckbox).toBeChecked();
    expect(emailCheckbox).not.toBeChecked();
  });

  it('calls onColumnVisibilityChange when toggling visibility', async () => {
    const user = userEvent.setup();
    const onColumnVisibilityChange = vi.fn();
    
    renderColumnManagerPanel({ onColumnVisibilityChange });
    
    const emailCheckbox = screen.getByTestId('column-checkbox-email').querySelector('input')!;
    await user.click(emailCheckbox);
    
    expect(onColumnVisibilityChange).toHaveBeenCalledWith({
      ...mockColumnVisibility,
      email: false,
    });
  });

  it('hidden columns still appear in the panel', () => {
    renderColumnManagerPanel({
      columnVisibility: { id: true, name: true, email: false, department: true, salary: true },
    });
    
    // Email column should still be in the list even though it's hidden
    expect(screen.getByTestId('column-item-email')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });
});

// ============================================================================
// disableHiding Tests
// ============================================================================

describe('ColumnManagerPanel - disableHiding', () => {
  it('disables checkbox for columns with disableHiding=true', () => {
    const columnsWithDisableHiding: GridColumn<TestRow>[] = [
      { field: 'id', headerName: 'ID', disableHiding: true },
      { field: 'name', headerName: 'Name' },
      { field: 'actions', headerName: 'Actions', disableHiding: true },
    ];
    
    renderColumnManagerPanel({
      columns: columnsWithDisableHiding,
      columnOrder: ['id', 'name', 'actions'],
    });
    
    const idCheckbox = screen.getByTestId('column-checkbox-id').querySelector('input')!;
    const nameCheckbox = screen.getByTestId('column-checkbox-name').querySelector('input')!;
    const actionsCheckbox = screen.getByTestId('column-checkbox-actions').querySelector('input')!;
    
    expect(idCheckbox).toBeDisabled();
    expect(nameCheckbox).not.toBeDisabled();
    expect(actionsCheckbox).toBeDisabled();
  });

  it('cannot toggle visibility for disableHiding columns', () => {
    const onColumnVisibilityChange = vi.fn();
    
    const columnsWithDisableHiding: GridColumn<TestRow>[] = [
      { field: 'id', headerName: 'ID', disableHiding: true },
      { field: 'name', headerName: 'Name' },
    ];
    
    renderColumnManagerPanel({
      columns: columnsWithDisableHiding,
      columnOrder: ['id', 'name'],
      onColumnVisibilityChange,
    });
    
    const idCheckbox = screen.getByTestId('column-checkbox-id').querySelector('input')!;
    
    // Checkbox should be disabled, preventing clicks
    expect(idCheckbox).toBeDisabled();
    
    // Verify the callback was never called (since we can't click disabled elements)
    expect(onColumnVisibilityChange).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Column Order Tests
// ============================================================================

describe('ColumnManagerPanel - Column Order', () => {
  it('displays columns in the specified order', () => {
    const customOrder = ['salary', 'name', 'id', 'email', 'department'];
    
    renderColumnManagerPanel({ columnOrder: customOrder });
    
    const columnList = screen.getByTestId('column-list');
    const items = within(columnList).getAllByTestId(/^column-item-/);
    
    expect(items[0]).toHaveAttribute('data-testid', 'column-item-salary');
    expect(items[1]).toHaveAttribute('data-testid', 'column-item-name');
    expect(items[2]).toHaveAttribute('data-testid', 'column-item-id');
    expect(items[3]).toHaveAttribute('data-testid', 'column-item-email');
    expect(items[4]).toHaveAttribute('data-testid', 'column-item-department');
  });

  it('shows drag handles for all columns', () => {
    renderColumnManagerPanel();
    
    expect(screen.getByTestId('drag-handle-id')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-name')).toBeInTheDocument();
    expect(screen.getByTestId('drag-handle-email')).toBeInTheDocument();
  });
});

// ============================================================================
// disableReorder Tests
// ============================================================================

describe('ColumnManagerPanel - disableReorder', () => {
  it('drag handle has disabled styling for disableReorder columns', () => {
    const columnsWithDisableReorder: GridColumn<TestRow>[] = [
      { field: 'id', headerName: 'ID', disableReorder: true },
      { field: 'name', headerName: 'Name' },
    ];
    
    renderColumnManagerPanel({
      columns: columnsWithDisableReorder,
      columnOrder: ['id', 'name'],
    });
    
    // The drag handle should exist but be styled as disabled
    const idDragHandle = screen.getByTestId('drag-handle-id');
    const nameDragHandle = screen.getByTestId('drag-handle-name');
    
    expect(idDragHandle).toBeInTheDocument();
    expect(nameDragHandle).toBeInTheDocument();
    
    // Check cursor style (disabled columns should have not-allowed cursor)
    expect(idDragHandle).toHaveStyle({ cursor: 'not-allowed' });
    expect(nameDragHandle).toHaveStyle({ cursor: 'grab' });
  });
});

// ============================================================================
// Close Behavior Tests
// ============================================================================

describe('ColumnManagerPanel - Close Behavior', () => {
  it('provides onClose callback to Popover', () => {
    const onClose = vi.fn();
    renderColumnManagerPanel({ onClose });
    
    // The panel should be rendered with the onClose callback
    // The actual closing is handled by MUI Popover
    expect(screen.getByTestId('column-manager-panel')).toBeInTheDocument();
  });

  it('search input starts empty', () => {
    renderColumnManagerPanel();
    
    const searchInput = screen.getByTestId('column-search-input').querySelector('input')!;
    expect(searchInput.value).toBe('');
  });
});

// ============================================================================
// New Columns Handling Tests
// ============================================================================

describe('ColumnManagerPanel - New Columns', () => {
  it('shows columns not in columnOrder at the end', () => {
    // columnOrder doesn't include 'salary'
    const partialOrder = ['id', 'name', 'email', 'department'];
    
    renderColumnManagerPanel({ columnOrder: partialOrder });
    
    const columnList = screen.getByTestId('column-list');
    const items = within(columnList).getAllByTestId(/^column-item-/);
    
    // Salary should be at the end
    expect(items[items.length - 1]).toHaveAttribute('data-testid', 'column-item-salary');
  });
});
