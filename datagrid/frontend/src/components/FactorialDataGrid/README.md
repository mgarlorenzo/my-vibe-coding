# FactorialDataGrid

A feature-rich data grid component for React with filtering, grouping, sorting, CSV export, and real-time updates.

## Features

- **Filtering**: Quick search and advanced multi-field filters
- **Grouping**: Group rows by any column with drag-and-drop reordering
- **Sorting**: Click column headers to sort
- **CSV Export**: Export filtered/sorted data to CSV
- **Inline Editing**: Edit cells directly in the grid
- **Real-time Updates**: WebSocket subscription support
- **Pagination**: Client-side and server-side pagination
- **Column Management**: Show/hide columns, resize, reorder

## Basic Usage

```tsx
import { FactorialDataGrid } from './components/FactorialDataGrid';

const columns = [
  { field: 'name', headerName: 'Name', width: 200, editable: true },
  { field: 'email', headerName: 'Email', width: 250 },
  { field: 'department', headerName: 'Department', width: 150 },
  { field: 'salary', headerName: 'Salary', type: 'number', width: 120 },
];

function MyComponent() {
  return (
    <FactorialDataGrid
      rows={employees}
      columns={columns}
      getRowId={(row) => row.id}
      showToolbar
      showQuickFilter
      showFilters
      showExport
      showGroupingPanel
      pagination
    />
  );
}
```

## Toolbar Features

### Quick Search

The quick search input filters rows across ALL fields (including non-visible fields).

```tsx
<FactorialDataGrid
  showToolbar
  showQuickFilter  // Enable quick search
  // ...
/>
```

### Filters

The Filters button opens a panel where users can create advanced filters.

**Supported Operators by Type:**

| Type | Operators |
|------|-----------|
| String | contains, equals, startsWith, endsWith, isEmpty, isNotEmpty |
| Number | = (eq), != (neq), >, >=, <, <=, isEmpty, isNotEmpty |
| Date | = (eq), != (neq), >, >=, <, <=, isEmpty, isNotEmpty |
| Boolean | is, isEmpty |

**Key Feature**: Filters can be applied to ANY row field, not just visible columns. This allows filtering by hidden data fields.

```tsx
<FactorialDataGrid
  showToolbar
  showFilters  // Enable filters button (default: true)
  // ...
/>
```

### Grouping

Group rows by one or more columns with aggregations.

```tsx
<FactorialDataGrid
  showToolbar
  showGroupingPanel  // Enable group by button
  aggregationModel={{
    salary: ['sum', 'avg', 'count'],
    age: ['min', 'max', 'avg'],
  }}
  // ...
/>
```

**Grouping Features:**
- Click "Group by" button to select grouping columns
- Drag and drop chips to reorder grouping hierarchy
- Expand/Collapse all groups with toolbar buttons
- Aggregations displayed on group rows

### Column Manager

The Columns button opens a panel where users can manage column visibility and order.

**Features:**
- **Search**: Filter columns by name (headerName or field) - case-insensitive
- **Visibility**: Toggle column visibility with checkboxes
- **Reorder**: Drag-and-drop columns to change their order
- **Persistence**: Save configuration to localStorage (when `storageKey` is provided)

```tsx
<FactorialDataGrid
  showToolbar
  showColumnSelector  // Enable columns button (default: true)
  storageKey="my_grid"  // Enable localStorage persistence
  
  // Optional: Initial configuration (overridden by localStorage if storageKey is set)
  initialColumnVisibility={{ email: false }}
  initialColumnOrder={['name', 'email', 'department']}
/>
```

**Column Props for Column Manager:**

| Prop | Type | Description |
|------|------|-------------|
| `disableHiding` | boolean | Prevents column from being hidden (e.g., Actions column) |
| `disableReorder` | boolean | Prevents column from being reordered |

```tsx
const columns = [
  { field: 'name', headerName: 'Name' },
  { field: 'email', headerName: 'Email' },
  { 
    field: 'actions', 
    headerName: 'Actions',
    disableHiding: true,   // Cannot be hidden
    disableReorder: true,  // Cannot be reordered
  },
];
```

**localStorage Persistence:**
- Storage key format: `factorialDataGrid:columns:{storageKey}`
- Versioned schema (v1) for future compatibility
- Handles schema changes gracefully:
  - New columns are added at the end
  - Removed columns are ignored
- Debounced saves (200ms) to avoid excessive writes

**Column Manager Test IDs:**

| Test ID | Element |
|---------|---------|
| `columns-button` | Button to open Column Manager |
| `column-manager-panel` | The panel popover |
| `column-search-input` | Search input |
| `column-list` | Column list container |
| `column-item-{field}` | Each column row |
| `column-checkbox-{field}` | Visibility checkbox |
| `drag-handle-{field}` | Drag handle |
| `drag-disabled-notice` | Notice shown when search is active |
| `no-columns-found` | Message when search has no results |

### CSV Export

The Export button opens a dialog with three export options:

1. **Selected rows** - Export only rows selected via checkbox (disabled if no selection)
2. **All rows (matching current filters)** - Export filtered/sorted rows
3. **All rows (ignoring filters)** - Export the complete dataset

```tsx
<FactorialDataGrid
  showToolbar
  showExport        // Enable export button (default: true)
  enableExport      // Enable/disable export feature (default: true)
  gridName="employees"  // Used for filename: employees_2024-01-15_1430.csv
  
  // Optional: For server mode, provide function to fetch all rows
  getAllRows={async () => await fetchAllEmployees()}
  
  // Optional: Transform rows before export
  mapRowForExport={(row) => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
  })}
  
  // Optional: Custom column export filter
  isColumnExportable={(column) => column.field !== 'secret'}
/>
```

**Export Features:**
- **Export Dialog** with clear options and row count summary
- **Selected rows** option (requires checkbox selection)
- **Filtered rows** respects current filters, quick search, and sorting
- **All rows** exports complete dataset (uses `getAllRows` prop for server mode)
- Exports **visible columns only** (excludes Actions columns)
- Proper **CSV escaping** for commas, quotes, and newlines
- **UTF-8 BOM** for Excel compatibility
- Filename format: `{gridName}_YYYY-MM-DD_HHmm.csv`

**Export Dialog Test IDs:**
| Test ID | Element |
|---------|---------|
| `export-dialog` | Export dialog container |
| `export-scope-selected` | "Selected rows" radio option |
| `export-scope-filtered` | "Filtered rows" radio option |
| `export-scope-all` | "All rows" radio option |
| `export-confirm-button` | "Export CSV" button |
| `export-cancel-button` | "Cancel" button |
| `export-row-count` | Row count summary |

## Props Reference

### Toolbar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showToolbar` | boolean | true | Show/hide the entire toolbar |
| `showQuickFilter` | boolean | true | Show/hide quick search input |
| `showFilters` | boolean | true | Show/hide the Filters button |
| `showExport` | boolean | true | Show/hide the Export button |
| `showGroupingPanel` | boolean | true | Show/hide the Group By button |
| `showColumnSelector` | boolean | true | Show/hide column visibility selector |
| `showDensitySelector` | boolean | true | Show/hide density selector |
| `toolbarActions` | ReactNode | - | Custom actions to render in toolbar |

### Export Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gridName` | string | 'export' | Name used for export filename |
| `enableExport` | boolean | true | Enable/disable export feature |
| `getAllRows` | () => Promise<T[]> \| T[] | - | Function to fetch all rows (for server mode) |
| `mapRowForExport` | (row: T) => Record<string, unknown> | - | Transform row data before export |
| `isColumnExportable` | (column: GridColumn<T>) => boolean | - | Custom filter for exportable columns |

### Column Manager Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `storageKey` | string | - | Key for localStorage persistence. If not provided, persistence is disabled |
| `initialColumnVisibility` | Record<string, boolean> | - | Initial column visibility (overridden by localStorage) |
| `initialColumnOrder` | string[] | - | Initial column order as array of field names (overridden by localStorage) |

### Data Props

| Prop | Type | Description |
|------|------|-------------|
| `rows` | T[] | Array of row data |
| `columns` | GridColumn<T>[] | Column definitions |
| `getRowId` | (row: T) => RowId | Function to get unique row ID |
| `loading` | boolean | Show loading state |

### Filter Props

| Prop | Type | Description |
|------|------|-------------|
| `filterModel` | FilterModel | Controlled filter state |
| `onFilterModelChange` | (model: FilterModel) => void | Filter change callback |

### Grouping Props

| Prop | Type | Description |
|------|------|-------------|
| `groupingModel` | GroupingModel | Controlled grouping state |
| `onGroupingModelChange` | (model: GroupingModel) => void | Grouping change callback |
| `aggregationModel` | AggregationModel | Aggregation configuration |

## Test IDs for E2E Testing

The component includes `data-testid` attributes for reliable E2E testing:

| Test ID | Element |
|---------|---------|
| `factorial-data-grid` | Root grid container |
| `grid-toolbar` | Toolbar container |
| `quick-search` | Quick search input field |
| `group-by-button` | Group by button |
| `filters-button` | Filters button |
| `columns-button` | Columns button (opens Column Manager) |
| `column-manager-panel` | Column Manager panel |
| `column-search-input` | Column search input |
| `column-item-{field}` | Column row in manager |
| `column-checkbox-{field}` | Column visibility checkbox |
| `drag-handle-{field}` | Column drag handle |
| `export-csv-button` | Export button (opens dialog) |
| `export-dialog` | Export dialog container |
| `export-scope-selected` | "Selected rows" radio option |
| `export-scope-filtered` | "Filtered rows" radio option |
| `export-scope-all` | "All rows" radio option |
| `export-confirm-button` | "Export CSV" confirm button |
| `export-cancel-button` | Cancel button |
| `add-filter-button` | Add filter button (inside filter panel) |

**Example Playwright Test:**

```typescript
import { test, expect } from '@playwright/test';

test('grid features are present', async ({ page }) => {
  await page.goto('/');
  
  // Verify grid is rendered
  await expect(page.getByTestId('factorial-data-grid')).toBeVisible();
  
  // Verify toolbar features
  await expect(page.getByTestId('grid-toolbar')).toBeVisible();
  await expect(page.getByTestId('quick-search')).toBeVisible();
  await expect(page.getByTestId('filters-button')).toBeVisible();
  await expect(page.getByTestId('export-csv-button')).toBeVisible();
  await expect(page.getByTestId('group-by-button')).toBeVisible();
});

test('can filter data', async ({ page }) => {
  await page.goto('/');
  
  // Use quick search
  await page.getByTestId('quick-search').fill('John');
  
  // Open filters panel
  await page.getByTestId('filters-button').click();
  await page.getByTestId('add-filter-button').click();
  
  // Add a filter...
});

test('can export to CSV', async ({ page }) => {
  await page.goto('/');
  
  // Open export dialog
  await page.getByTestId('export-csv-button').click();
  await expect(page.getByTestId('export-dialog')).toBeVisible();
  
  // Select "All rows (matching current filters)"
  await page.getByTestId('export-scope-filtered').click();
  
  // Start download
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-confirm-button').click();
  const download = await downloadPromise;
  
  // Verify filename format
  expect(download.suggestedFilename()).toMatch(/employees_\d{4}-\d{2}-\d{2}_\d{4}\.csv/);
});

test('can export selected rows', async ({ page }) => {
  await page.goto('/');
  
  // Select some rows via checkbox
  await page.locator('[data-testid="row-checkbox"]').first().click();
  await page.locator('[data-testid="row-checkbox"]').nth(1).click();
  
  // Open export dialog
  await page.getByTestId('export-csv-button').click();
  
  // "Selected rows" should now be enabled
  const selectedOption = page.getByTestId('export-scope-selected');
  await expect(selectedOption).not.toBeDisabled();
  
  // Select and export
  await selectedOption.click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-confirm-button').click();
  const download = await downloadPromise;
  
  // Verify download
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
```

## Filter Model Structure

```typescript
interface FilterModel {
  items: FilterItem[];
  quickFilter?: string;
  linkOperator?: 'and' | 'or';  // Default: 'and'
}

interface FilterItem {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 
            'gt' | 'gte' | 'lt' | 'lte' | 
            'eq' | 'neq' | 'is' |
            'isEmpty' | 'isNotEmpty';
  value?: unknown;
}
```

## Guardrail Tests

The codebase includes guardrail tests to prevent accidental removal of critical features:

- `showToolbar` must not be set to `false` in HomePage
- `showQuickFilter` must not be set to `false`
- `showGroupingPanel` must not be set to `false`
- Required `data-testid` attributes must be present

Run guardrail tests:

```bash
npm test -- --run src/components/FactorialDataGrid/__tests__/guardrails.test.ts
```
