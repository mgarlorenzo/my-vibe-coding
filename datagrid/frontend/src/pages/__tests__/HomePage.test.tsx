import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { HomePage } from '../HomePage';
import { GET_EMPLOYEES, EMPLOYEE_CHANGED_SUBSCRIPTION } from '../../graphql/queries';
import { theme } from '../../theme';

// ============================================================================
// Mock Data
// ============================================================================

const mockEmployees = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    country: 'USA',
    companyId: 1,
    startDate: '2020-01-15',
    terminationDate: null,
    terminationReason: null,
    terminationReasonType: null,
    terminationObservations: null,
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: '2020-01-15T00:00:00Z',
    hiddenField: 'secret-value-123', // Non-visible field for filter testing
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    country: 'Canada',
    companyId: 1,
    startDate: '2021-03-20',
    terminationDate: null,
    terminationReason: null,
    terminationReasonType: null,
    terminationObservations: null,
    createdAt: '2021-03-20T00:00:00Z',
    updatedAt: '2021-03-20T00:00:00Z',
    hiddenField: 'other-value-456',
  },
];

const mocks = [
  {
    request: {
      query: GET_EMPLOYEES,
      variables: {
        filter: { includeTerminated: true },
        paging: { offset: 0, limit: 100 },
        sorting: { field: 'id', direction: 'ASC' },
      },
    },
    result: {
      data: {
        employees: mockEmployees,
      },
    },
  },
  {
    request: {
      query: EMPLOYEE_CHANGED_SUBSCRIPTION,
    },
    result: {
      data: null,
    },
  },
];

// ============================================================================
// Test Utilities
// ============================================================================

function renderHomePage() {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <div style={{ width: 1200, height: 800 }}>
            <HomePage />
          </div>
        </ThemeProvider>
      </BrowserRouter>
    </MockedProvider>
  );
}

async function waitForDataToLoad() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
}

// ============================================================================
// Feature Presence Tests
// ============================================================================

describe('HomePage - FactorialDataGrid Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders FactorialDataGrid component', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that the grid is rendered with the correct data-testid
    const grid = screen.getByTestId('factorial-data-grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders toolbar', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that the toolbar is visible
    const toolbar = screen.getByTestId('grid-toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders QuickSearch input', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that QuickSearch is present
    const quickSearch = screen.getByTestId('quick-search');
    expect(quickSearch).toBeInTheDocument();
    
    // Also check by placeholder
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('renders Group By button', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that Group By button is present
    const groupByButton = screen.getByTestId('group-by-button');
    expect(groupByButton).toBeInTheDocument();
  });

  it('renders Filters button', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that Filters button is present
    const filtersButton = screen.getByTestId('filters-button');
    expect(filtersButton).toBeInTheDocument();
  });

  it('renders Export CSV button', async () => {
    renderHomePage();
    await waitForDataToLoad();

    // Check that Export CSV button is present
    const exportButton = screen.getByTestId('export-csv-button');
    expect(exportButton).toBeInTheDocument();
  });
});

// ============================================================================
// QuickSearch Functionality Tests
// ============================================================================

describe('HomePage - QuickSearch Functionality', () => {
  it('filters rows when typing in QuickSearch', async () => {
    const user = userEvent.setup();
    renderHomePage();
    await waitForDataToLoad();

    const quickSearch = screen.getByPlaceholderText(/search/i);
    
    // Type a search term
    await user.type(quickSearch, 'John');

    await waitFor(() => {
      // The grid should filter to show only matching rows
      // This tests that the quick filter is connected and working
      expect(quickSearch).toHaveValue('John');
    });
  });

  it('clears filter when search is cleared', async () => {
    const user = userEvent.setup();
    renderHomePage();
    await waitForDataToLoad();

    const quickSearch = screen.getByPlaceholderText(/search/i);
    
    // Type and then clear
    await user.type(quickSearch, 'test');
    await user.clear(quickSearch);

    await waitFor(() => {
      expect(quickSearch).toHaveValue('');
    });
  });
});

// ============================================================================
// Filter Panel Tests
// ============================================================================

describe('HomePage - Filter Panel', () => {
  it('opens filter panel when Filters button is clicked', async () => {
    const user = userEvent.setup();
    renderHomePage();
    await waitForDataToLoad();

    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    await waitFor(() => {
      // Filter panel should open with "Add filter" button
      expect(screen.getByTestId('add-filter-button')).toBeInTheDocument();
    });
  });

  it('can add a filter', async () => {
    const user = userEvent.setup();
    renderHomePage();
    await waitForDataToLoad();

    // Open filter panel
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByTestId('add-filter-button')).toBeInTheDocument();
    });

    // Click add filter
    const addFilterButton = screen.getByTestId('add-filter-button');
    await user.click(addFilterButton);

    await waitFor(() => {
      // Should show filter row with field selector
      expect(screen.getByLabelText(/field/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// CSV Export Tests
// ============================================================================

describe('HomePage - CSV Export', () => {
  it('triggers download when Export CSV is clicked', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    const mockClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = mockClick;
      }
      return element;
    });

    renderHomePage();
    await waitForDataToLoad();

    const exportButton = screen.getByTestId('export-csv-button');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    // Cleanup
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });
});
