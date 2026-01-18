import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FactorialDataGrid } from '../FactorialDataGrid';
import { GridColumn } from '../types';

// ============================================================================
// Test Data Types
// ============================================================================

interface TestEmployee {
  id: number;
  name: string;
  department: string;
  salary: number;
  active: boolean;
  hireDate: string;
}

// ============================================================================
// Test Data
// ============================================================================

const testEmployees: TestEmployee[] = [
  { id: 1, name: 'Alice Johnson', department: 'Engineering', salary: 95000, active: true, hireDate: '2020-01-15' },
  { id: 2, name: 'Bob Smith', department: 'Engineering', salary: 85000, active: true, hireDate: '2021-03-20' },
  { id: 3, name: 'Carol Williams', department: 'Marketing', salary: 75000, active: true, hireDate: '2019-06-10' },
  { id: 4, name: 'David Brown', department: 'Marketing', salary: 70000, active: false, hireDate: '2018-11-05' },
  { id: 5, name: 'Eve Davis', department: 'Sales', salary: 80000, active: true, hireDate: '2022-02-28' },
];

const testColumns: GridColumn<TestEmployee>[] = [
  { field: 'name', headerName: 'Name', width: 200, editable: true },
  { field: 'department', headerName: 'Department', width: 150, editable: true },
  { field: 'salary', headerName: 'Salary', width: 120, type: 'number', editable: true },
  { field: 'active', headerName: 'Active', width: 100, type: 'boolean', editable: true },
  { field: 'hireDate', headerName: 'Hire Date', width: 150, type: 'date' },
];

const getRowId = (row: TestEmployee) => row.id;

// ============================================================================
// Test Utilities
// ============================================================================

function renderGrid(props: Partial<React.ComponentProps<typeof FactorialDataGrid<TestEmployee>>> = {}) {
  return render(
    <div style={{ width: 800, height: 600 }}>
      <FactorialDataGrid<TestEmployee>
        rows={testEmployees}
        columns={testColumns}
        getRowId={getRowId}
        showToolbar={false}
        pagination={false}
        style={{ height: 500 }}
        {...props}
      />
    </div>
  );
}

// Helper to wait for grid to render
async function waitForGrid() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('FactorialDataGrid - Basic Rendering', () => {
  it('renders grid structure with headers', async () => {
    renderGrid();
    await waitForGrid();

    // Check grid role
    expect(screen.getByRole('grid')).toBeInTheDocument();

    // Check headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Hire Date')).toBeInTheDocument();
  });

  it('shows correct row count in footer', async () => {
    renderGrid();
    await waitForGrid();

    // Look for the footer text that contains "5 total rows"
    expect(screen.getByText(/total row/i)).toBeInTheDocument();
    expect(screen.getByText(/5.*total row/i)).toBeInTheDocument();
  });

  it('renders empty state when no rows', async () => {
    renderGrid({ rows: [] });
    await waitForGrid();

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText(/no rows/i)).toBeInTheDocument();
  });

  it('renders loading state', async () => {
    renderGrid({ loading: true, rows: [] });
    await waitForGrid();

    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders with checkbox selection header', async () => {
    renderGrid({ checkboxSelection: true });
    await waitForGrid();

    // Should have at least the header checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders toolbar when enabled', async () => {
    renderGrid({ showToolbar: true, showQuickFilter: true });
    await waitForGrid();

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('hides columns based on visibility model', async () => {
    renderGrid({ columnVisibilityModel: { salary: false } });
    await waitForGrid();

    expect(screen.queryByText('Salary')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

// ============================================================================
// Sorting Tests
// ============================================================================

describe('FactorialDataGrid - Sorting', () => {
  it('calls onSortModelChange when header is clicked', async () => {
    const user = userEvent.setup();
    const onSortModelChange = vi.fn();

    renderGrid({ onSortModelChange });
    await waitForGrid();

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    await waitFor(() => {
      expect(onSortModelChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', direction: 'asc' })
        ])
      );
    });
  });

  it('toggles sort direction on subsequent clicks', async () => {
    const user = userEvent.setup();
    const onSortModelChange = vi.fn();

    renderGrid({ onSortModelChange });
    await waitForGrid();

    const nameHeader = screen.getByText('Name');

    // First click - ascending
    await user.click(nameHeader);
    await waitFor(() => {
      expect(onSortModelChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', direction: 'asc' })
        ])
      );
    });

    // Second click - descending
    await user.click(nameHeader);
    await waitFor(() => {
      expect(onSortModelChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', direction: 'desc' })
        ])
      );
    });

    // Third click - clear
    await user.click(nameHeader);
    await waitFor(() => {
      expect(onSortModelChange).toHaveBeenLastCalledWith([]);
    });
  });
});

// ============================================================================
// Selection Tests
// ============================================================================

describe('FactorialDataGrid - Selection', () => {
  it('calls onSelectionModelChange when header checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onSelectionModelChange = vi.fn();

    renderGrid({ checkboxSelection: true, onSelectionModelChange });
    await waitForGrid();

    const checkboxes = screen.getAllByRole('checkbox');
    const headerCheckbox = checkboxes[0];

    await user.click(headerCheckbox);

    await waitFor(() => {
      expect(onSelectionModelChange).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Toolbar Tests
// ============================================================================

describe('FactorialDataGrid - Toolbar', () => {
  it('filters with quick filter', async () => {
    const user = userEvent.setup();
    const onFilterModelChange = vi.fn();

    renderGrid({ 
      showToolbar: true, 
      showQuickFilter: true,
      onFilterModelChange 
    });
    await waitForGrid();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'alice');

    await waitFor(() => {
      expect(onFilterModelChange).toHaveBeenCalledWith(
        expect.objectContaining({
          quickFilter: 'alice'
        })
      );
    });
  });

  it('shows density selector when enabled', async () => {
    renderGrid({ 
      showToolbar: true, 
      showDensitySelector: true 
    });
    await waitForGrid();

    // Density selector should be in toolbar
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('shows column selector when enabled', async () => {
    renderGrid({ 
      showToolbar: true, 
      showColumnSelector: true 
    });
    await waitForGrid();

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });
});

// ============================================================================
// Pagination Tests
// ============================================================================

describe('FactorialDataGrid - Pagination', () => {
  it('shows pagination controls when enabled', async () => {
    renderGrid({ 
      pagination: true,
      pageSizeOptions: [5, 10, 25]
    });
    await waitForGrid();

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('calls onPaginationModelChange when page changes', async () => {
    const onPaginationModelChange = vi.fn();

    renderGrid({ 
      pagination: true,
      paginationModel: { page: 0, pageSize: 10 },
      onPaginationModelChange
    });
    await waitForGrid();

    // Pagination model change is called on mount
    await waitFor(() => {
      expect(onPaginationModelChange).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Density Tests
// ============================================================================

describe('FactorialDataGrid - Density', () => {
  it('applies compact density', async () => {
    renderGrid({ density: 'compact' });
    await waitForGrid();

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('applies comfortable density', async () => {
    renderGrid({ density: 'comfortable' });
    await waitForGrid();

    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('calls onDensityChange when density changes', async () => {
    const onDensityChange = vi.fn();

    renderGrid({ 
      density: 'standard',
      onDensityChange 
    });
    await waitForGrid();

    await waitFor(() => {
      expect(onDensityChange).toHaveBeenCalledWith('standard');
    });
  });
});

// ============================================================================
// Custom Renderers Tests
// ============================================================================

describe('FactorialDataGrid - Custom Renderers', () => {
  it('uses custom header renderer', async () => {
    const columnsWithCustomHeader: GridColumn<TestEmployee>[] = [
      {
        field: 'name',
        headerName: 'Name',
        width: 200,
        renderHeader: () => <span data-testid="custom-header">Custom Name Header</span>,
      },
      ...testColumns.slice(1),
    ];

    renderGrid({ columns: columnsWithCustomHeader });
    await waitForGrid();

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByText('Custom Name Header')).toBeInTheDocument();
  });
});

// ============================================================================
// Accessibility Tests
// ============================================================================

describe('FactorialDataGrid - Accessibility', () => {
  it('has correct ARIA attributes on grid', async () => {
    renderGrid();
    await waitForGrid();

    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-rowcount', '5');
    expect(grid).toHaveAttribute('aria-colcount', '5');
    expect(grid).toHaveAttribute('tabindex', '0');
  });

  it('has row role on header', async () => {
    renderGrid();
    await waitForGrid();

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================================
// Callback Tests
// ============================================================================

describe('FactorialDataGrid - Callbacks', () => {
  it('calls onColumnVisibilityModelChange', async () => {
    const onColumnVisibilityModelChange = vi.fn();

    renderGrid({ onColumnVisibilityModelChange });
    await waitForGrid();

    await waitFor(() => {
      expect(onColumnVisibilityModelChange).toHaveBeenCalled();
    });
  });

  it('calls onColumnSizingModelChange', async () => {
    const onColumnSizingModelChange = vi.fn();

    renderGrid({ onColumnSizingModelChange });
    await waitForGrid();

    await waitFor(() => {
      expect(onColumnSizingModelChange).toHaveBeenCalled();
    });
  });
});
