import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog, ExportDialogProps } from '../components/ExportDialog';

// ============================================================================
// Test Setup
// ============================================================================

const defaultProps: ExportDialogProps = {
  open: true,
  onClose: vi.fn(),
  onExport: vi.fn(),
  selectedCount: 0,
  filteredCount: 10,
  totalCount: 100,
};

function renderDialog(props: Partial<ExportDialogProps> = {}) {
  return render(<ExportDialog {...defaultProps} {...props} />);
}

// ============================================================================
// Basic Rendering Tests
// ============================================================================

describe('ExportDialog - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    renderDialog();
    
    expect(screen.getByTestId('export-dialog')).toBeInTheDocument();
    expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    expect(screen.getByText('What would you like to export?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderDialog({ open: false });
    
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument();
  });

  it('renders all three export scope options', () => {
    renderDialog();
    
    expect(screen.getByTestId('export-scope-selected')).toBeInTheDocument();
    expect(screen.getByTestId('export-scope-filtered')).toBeInTheDocument();
    expect(screen.getByTestId('export-scope-all')).toBeInTheDocument();
  });

  it('renders Cancel and Export CSV buttons', () => {
    renderDialog();
    
    expect(screen.getByTestId('export-cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('export-confirm-button')).toBeInTheDocument();
  });

  it('renders export summary', () => {
    renderDialog();
    
    expect(screen.getByTestId('export-summary')).toBeInTheDocument();
    expect(screen.getByTestId('export-row-count')).toBeInTheDocument();
  });
});

// ============================================================================
// Selected Rows Option Tests
// ============================================================================

describe('ExportDialog - Selected Rows Option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables "Selected rows" when no rows are selected', () => {
    renderDialog({ selectedCount: 0 });
    
    const selectedRadio = screen.getByTestId('export-scope-selected');
    expect(selectedRadio).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Select at least one row to export selected rows.')).toBeInTheDocument();
  });

  it('enables "Selected rows" when rows are selected', () => {
    renderDialog({ selectedCount: 5 });
    
    const selectedRadio = screen.getByTestId('export-scope-selected');
    expect(selectedRadio).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('5 rows selected')).toBeInTheDocument();
  });

  it('shows singular "row" when only 1 row selected', () => {
    renderDialog({ selectedCount: 1 });
    
    expect(screen.getByText('1 row selected')).toBeInTheDocument();
  });

  it('disables Export button when selected scope chosen but no selection', async () => {
    renderDialog({ selectedCount: 0 });
    
    // The selected option should be disabled (aria-disabled)
    const selectedRadio = screen.getByTestId('export-scope-selected');
    expect(selectedRadio).toHaveAttribute('aria-disabled', 'true');
    
    // Export button should be enabled because filtered is selected by default
    const exportButton = screen.getByTestId('export-confirm-button');
    expect(exportButton).not.toBeDisabled();
  });
});

// ============================================================================
// Filtered Rows Option Tests
// ============================================================================

describe('ExportDialog - Filtered Rows Option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows filtered count', () => {
    renderDialog({ filteredCount: 25 });
    
    expect(screen.getByText('25 rows matching current filters and sorting')).toBeInTheDocument();
  });

  it('shows singular "row" when only 1 filtered row', () => {
    renderDialog({ filteredCount: 1 });
    
    expect(screen.getByText('1 row matching current filters and sorting')).toBeInTheDocument();
  });

  it('is selected by default', () => {
    renderDialog();
    
    // Check that the filtered radio input is checked
    const filteredRadio = screen.getByTestId('export-scope-filtered');
    const input = filteredRadio.querySelector('input');
    expect(input).toBeChecked();
  });
});

// ============================================================================
// All Rows Option Tests
// ============================================================================

describe('ExportDialog - All Rows Option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows total count', () => {
    renderDialog({ totalCount: 500 });
    
    expect(screen.getByText('500 rows total in dataset')).toBeInTheDocument();
  });

  it('shows singular "row" when only 1 total row', () => {
    renderDialog({ totalCount: 1 });
    
    expect(screen.getByText('1 row total in dataset')).toBeInTheDocument();
  });
});

// ============================================================================
// Export Summary Tests
// ============================================================================

describe('ExportDialog - Export Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows filtered count in summary by default', () => {
    renderDialog({ filteredCount: 15 });
    
    expect(screen.getByTestId('export-row-count')).toHaveTextContent('15 rows will be exported');
  });

  it('updates summary when selecting "All rows"', async () => {
    const user = userEvent.setup();
    renderDialog({ filteredCount: 15, totalCount: 100 });
    
    const allRadio = screen.getByTestId('export-scope-all');
    await user.click(allRadio);
    
    await waitFor(() => {
      expect(screen.getByTestId('export-row-count')).toHaveTextContent('100 rows will be exported');
    });
  });

  it('updates summary when selecting "Selected rows"', async () => {
    const user = userEvent.setup();
    renderDialog({ selectedCount: 3, filteredCount: 15, totalCount: 100 });
    
    const selectedRadio = screen.getByTestId('export-scope-selected');
    await user.click(selectedRadio);
    
    await waitFor(() => {
      expect(screen.getByTestId('export-row-count')).toHaveTextContent('3 rows will be exported');
    });
  });
});

// ============================================================================
// Button Actions Tests
// ============================================================================

describe('ExportDialog - Button Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onClose });
    
    await user.click(screen.getByTestId('export-cancel-button'));
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onExport with filtered scope by default', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport });
    
    await user.click(screen.getByTestId('export-confirm-button'));
    
    expect(onExport).toHaveBeenCalledWith({ type: 'filtered' });
  });

  it('calls onExport with selected scope when selected', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport, selectedCount: 5 });
    
    await user.click(screen.getByTestId('export-scope-selected'));
    await user.click(screen.getByTestId('export-confirm-button'));
    
    expect(onExport).toHaveBeenCalledWith({ type: 'selected' });
  });

  it('calls onExport with all scope when selected', async () => {
    const user = userEvent.setup();
    const onExport = vi.fn();
    renderDialog({ onExport });
    
    await user.click(screen.getByTestId('export-scope-all'));
    await user.click(screen.getByTestId('export-confirm-button'));
    
    expect(onExport).toHaveBeenCalledWith({ type: 'all' });
  });
});

// ============================================================================
// Loading State Tests
// ============================================================================

describe('ExportDialog - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when loading', () => {
    renderDialog({ loading: true });
    
    const exportButton = screen.getByTestId('export-confirm-button');
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveTextContent('Exporting...');
  });

  it('disables Export button when loading', () => {
    renderDialog({ loading: true });
    
    expect(screen.getByTestId('export-confirm-button')).toBeDisabled();
  });
});

// ============================================================================
// Error State Tests
// ============================================================================

describe('ExportDialog - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error message when error is provided', () => {
    renderDialog({ error: 'Export failed: Network error' });
    
    expect(screen.getByTestId('export-error')).toBeInTheDocument();
    expect(screen.getByText('Export failed: Network error')).toBeInTheDocument();
  });

  it('does not show error when error is null', () => {
    renderDialog({ error: null });
    
    expect(screen.queryByTestId('export-error')).not.toBeInTheDocument();
  });
});
