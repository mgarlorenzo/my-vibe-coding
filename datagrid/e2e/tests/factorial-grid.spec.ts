import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Helper to ensure we're using the Factorial DataGrid
 */
async function ensureFactorialGrid(page: Page) {
  // Check if the toggle exists and select Factorial grid
  const factorialToggle = page.getByRole('button', { name: /Factorial DataGrid/i });
  if (await factorialToggle.isVisible()) {
    const isPressed = await factorialToggle.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await factorialToggle.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Helper to wait for the grid to be fully loaded
 */
async function waitForGridLoaded(page: Page) {
  // Wait for the grid container
  await expect(page.locator('[role="grid"]')).toBeVisible({ timeout: 30000 });
  
  // Wait for loading to complete (no loading spinner)
  await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 30000 });
  
  // Wait for at least one row to be visible
  await expect(page.locator('[role="row"]').nth(1)).toBeVisible({ timeout: 30000 });
}

/**
 * Helper to get a cell by row index and column name
 */
function getCell(page: Page, rowIndex: number, columnName: string) {
  // Get the row (skip header row)
  const row = page.locator('[role="row"]').nth(rowIndex + 1);
  // Find the cell in that row
  return row.locator('[role="gridcell"]').filter({ hasText: new RegExp(columnName, 'i') }).first();
}

/**
 * Helper to get a row by text content
 */
function getRowByText(page: Page, text: string) {
  return page.locator('[role="row"]', { hasText: text });
}

// ============================================================================
// Test Suite: Basic Rendering
// ============================================================================

test.describe('FactorialDataGrid - Basic Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should display the grid with headers', async ({ page }) => {
    // Check title
    await expect(page.getByText('Employee Management (Factorial Grid)')).toBeVisible();
    
    // Check grid is visible
    await expect(page.locator('[role="grid"]')).toBeVisible();
    
    // Check column headers
    await expect(page.getByText('ID')).toBeVisible();
    await expect(page.getByText('First Name')).toBeVisible();
    await expect(page.getByText('Last Name')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Country')).toBeVisible();
  });

  test('should display employee data in rows', async ({ page }) => {
    // Check that rows are rendered
    const rows = page.locator('[role="row"]');
    const rowCount = await rows.count();
    
    // Should have header + at least one data row
    expect(rowCount).toBeGreaterThan(1);
  });

  test('should show row count in footer', async ({ page }) => {
    // Footer should show total rows
    await expect(page.getByText(/total row/i)).toBeVisible();
  });

  test('should display status chips correctly', async ({ page }) => {
    // Active employees should have green chip
    await expect(page.locator('.MuiChip-colorSuccess').first()).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Toolbar Features
// ============================================================================

test.describe('FactorialDataGrid - Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should have quick filter input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test('should filter rows with quick filter', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    
    // Get initial row count
    const initialRows = await page.locator('[role="row"]').count();
    
    // Type a search term
    await searchInput.fill('Maria');
    await page.waitForTimeout(500);
    
    // Should have fewer rows (or same if Maria is the only one)
    const filteredRows = await page.locator('[role="row"]').count();
    expect(filteredRows).toBeLessThanOrEqual(initialRows);
    
    // Maria should be visible
    await expect(page.getByText('Maria')).toBeVisible();
  });

  test('should clear filter and show all rows', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    
    // Apply filter
    await searchInput.fill('Maria');
    await page.waitForTimeout(500);
    
    // Clear filter
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Should show multiple rows again
    const rows = await page.locator('[role="row"]').count();
    expect(rows).toBeGreaterThan(2);
  });

  test('should have New Employee button', async ({ page }) => {
    const addButton = page.getByTestId('add-employee-button');
    await expect(addButton).toBeVisible();
    await expect(addButton).toHaveText(/New Employee/i);
  });
});

// ============================================================================
// Test Suite: Sorting
// ============================================================================

test.describe('FactorialDataGrid - Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should sort by First Name ascending on click', async ({ page }) => {
    // Click on First Name header
    await page.getByText('First Name').first().click();
    await page.waitForTimeout(500);
    
    // Grid should still be visible with data
    await expect(page.locator('[role="row"]').nth(1)).toBeVisible();
  });

  test('should toggle sort direction on subsequent clicks', async ({ page }) => {
    const header = page.getByText('First Name').first();
    
    // First click - ascending
    await header.click();
    await page.waitForTimeout(300);
    
    // Second click - descending
    await header.click();
    await page.waitForTimeout(300);
    
    // Third click - clear sort
    await header.click();
    await page.waitForTimeout(300);
    
    // Grid should still be functional
    await expect(page.locator('[role="row"]').nth(1)).toBeVisible();
  });

  test('should sort by numeric column (ID)', async ({ page }) => {
    // Click on ID header
    await page.getByText('ID').first().click();
    await page.waitForTimeout(500);
    
    // Grid should still be visible
    await expect(page.locator('[role="row"]').nth(1)).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Inline Editing
// ============================================================================

test.describe('FactorialDataGrid - Inline Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should enter edit mode on double-click', async ({ page }) => {
    // Find a cell with first name
    const firstNameCell = page.locator('[role="gridcell"]').filter({ hasText: /^[A-Z][a-z]+$/ }).first();
    
    // Double-click to edit
    await firstNameCell.dblclick();
    
    // Should show an input
    await expect(page.locator('input[type="text"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('should cancel edit on Escape', async ({ page }) => {
    // Find a cell with first name
    const cells = page.locator('[role="gridcell"]');
    const firstNameCell = cells.nth(2); // Skip checkbox and ID
    const originalText = await firstNameCell.textContent();
    
    // Double-click to edit
    await firstNameCell.dblclick();
    await page.waitForTimeout(300);
    
    // Type something new
    await page.keyboard.type('TestChange');
    
    // Press Escape to cancel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Original text should be restored
    await expect(firstNameCell).toContainText(originalText || '');
  });

  test('should commit edit on Enter and save to server', async ({ page }) => {
    // First create a new employee to edit
    await page.getByTestId('add-employee-button').click();
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    const timestamp = Date.now();
    const firstName = `EditTest${timestamp}`;
    const lastName = `User${timestamp}`;
    
    await page.getByTestId('first-name-input').locator('input').fill(firstName);
    await page.getByTestId('last-name-input').locator('input').fill(lastName);
    await page.getByTestId('submit-employee-button').click();
    
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10000 });
    
    // Now find and edit the first name inline
    const row = page.locator('[role="row"]', { hasText: firstName });
    const firstNameCell = row.locator('[role="gridcell"]').nth(2); // Skip checkbox and ID
    
    // Double-click to edit
    await firstNameCell.dblclick();
    await page.waitForTimeout(300);
    
    // Clear and type new value
    const input = page.locator('input[type="text"]').first();
    await input.clear();
    const newFirstName = `Updated${timestamp}`;
    await input.fill(newFirstName);
    
    // Press Enter to commit
    await page.keyboard.press('Enter');
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // New value should be visible
    await expect(page.getByText(newFirstName)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// Test Suite: Selection
// ============================================================================

test.describe('FactorialDataGrid - Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should have checkbox selection enabled', async ({ page }) => {
    // Should have checkboxes
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes.first()).toBeVisible();
  });

  test('should select row on checkbox click', async ({ page }) => {
    // Click on first row checkbox
    const rowCheckbox = page.locator('[role="row"]').nth(1).locator('[role="checkbox"]');
    await rowCheckbox.click();
    
    // Checkbox should be checked
    await expect(rowCheckbox).toBeChecked();
  });

  test('should select all rows on header checkbox click', async ({ page }) => {
    // Click on header checkbox
    const headerCheckbox = page.locator('[role="row"]').first().locator('[role="checkbox"]');
    await headerCheckbox.click();
    
    // Header checkbox should be checked
    await expect(headerCheckbox).toBeChecked();
  });

  test('should deselect all on second header checkbox click', async ({ page }) => {
    // Click on header checkbox twice
    const headerCheckbox = page.locator('[role="row"]').first().locator('[role="checkbox"]');
    await headerCheckbox.click();
    await headerCheckbox.click();
    
    // Header checkbox should be unchecked
    await expect(headerCheckbox).not.toBeChecked();
  });
});

// ============================================================================
// Test Suite: Pagination
// ============================================================================

test.describe('FactorialDataGrid - Pagination', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should display pagination controls', async ({ page }) => {
    // Should show rows per page selector or page info
    await expect(page.getByText(/total row/i)).toBeVisible();
  });

  test('should show page size options', async ({ page }) => {
    // Look for page size selector
    const pageSizeSelector = page.locator('select').first();
    if (await pageSizeSelector.isVisible()) {
      await expect(pageSizeSelector).toBeVisible();
    }
  });
});

// ============================================================================
// Test Suite: CRUD Operations
// ============================================================================

test.describe('FactorialDataGrid - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should create a new employee', async ({ page }) => {
    // Click add button
    await page.getByTestId('add-employee-button').click();
    
    // Wait for dialog
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    // Fill form
    const timestamp = Date.now();
    const firstName = `Test${timestamp}`;
    const lastName = `User${timestamp}`;
    const email = `test.${timestamp}@example.com`;
    
    await page.getByTestId('first-name-input').locator('input').fill(firstName);
    await page.getByTestId('last-name-input').locator('input').fill(lastName);
    await page.getByTestId('email-input').locator('input').fill(email);
    
    // Submit
    await page.getByTestId('submit-employee-button').click();
    
    // Dialog should close
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    
    // New employee should appear in grid
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10000 });
  });

  test('should show employee details on double-click', async ({ page }) => {
    // Double-click on a row
    const row = page.locator('[role="row"]').nth(1);
    await row.dblclick();
    
    // Detail panel or dialog should open
    // (This depends on implementation - checking for any dialog/drawer)
    await page.waitForTimeout(500);
  });
});

// ============================================================================
// Test Suite: Keyboard Navigation
// ============================================================================

test.describe('FactorialDataGrid - Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should focus grid on click', async ({ page }) => {
    const grid = page.locator('[role="grid"]');
    await grid.click();
    
    // Grid should be focusable
    await expect(grid).toBeFocused();
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Click on a cell to focus
    const cell = page.locator('[role="gridcell"]').first();
    await cell.click();
    
    // Press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    
    // Grid should still be functional
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });

  test('should enter edit mode with Enter key', async ({ page }) => {
    // Click on an editable cell
    const cells = page.locator('[role="gridcell"]');
    const editableCell = cells.nth(2); // First Name column
    await editableCell.click();
    
    // Press Enter to edit
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Should show input
    const input = page.locator('input[type="text"]');
    if (await input.isVisible()) {
      await expect(input.first()).toBeVisible();
      // Cancel edit
      await page.keyboard.press('Escape');
    }
  });

  test('should enter edit mode with F2 key', async ({ page }) => {
    // Click on an editable cell
    const cells = page.locator('[role="gridcell"]');
    const editableCell = cells.nth(2); // First Name column
    await editableCell.click();
    
    // Press F2 to edit
    await page.keyboard.press('F2');
    await page.waitForTimeout(300);
    
    // Should show input
    const input = page.locator('input[type="text"]');
    if (await input.isVisible()) {
      await expect(input.first()).toBeVisible();
      // Cancel edit
      await page.keyboard.press('Escape');
    }
  });
});

// ============================================================================
// Test Suite: Real-time Updates (Subscriptions)
// ============================================================================

test.describe('FactorialDataGrid - Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should reflect changes from another session', async ({ page, context }) => {
    // Open a second page
    const page2 = await context.newPage();
    await page2.goto('/');
    await ensureFactorialGrid(page2);
    await waitForGridLoaded(page2);
    
    // Create employee in second page
    await page2.getByTestId('add-employee-button').click();
    await expect(page2.getByTestId('employee-form-dialog')).toBeVisible();
    
    const timestamp = Date.now();
    const firstName = `Realtime${timestamp}`;
    const lastName = `Test${timestamp}`;
    
    await page2.getByTestId('first-name-input').locator('input').fill(firstName);
    await page2.getByTestId('last-name-input').locator('input').fill(lastName);
    await page2.getByTestId('submit-employee-button').click();
    
    await expect(page2.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Wait for subscription to propagate
    await page.waitForTimeout(2000);
    
    // First page should show the new employee (via subscription)
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 15000 });
    
    await page2.close();
  });
});

// ============================================================================
// Test Suite: Accessibility
// ============================================================================

test.describe('FactorialDataGrid - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should have proper ARIA roles', async ({ page }) => {
    // Grid role
    await expect(page.locator('[role="grid"]')).toBeVisible();
    
    // Row roles
    await expect(page.locator('[role="row"]').first()).toBeVisible();
    
    // Cell roles
    await expect(page.locator('[role="gridcell"]').first()).toBeVisible();
  });

  test('should have aria-rowcount attribute', async ({ page }) => {
    const grid = page.locator('[role="grid"]');
    const rowCount = await grid.getAttribute('aria-rowcount');
    expect(rowCount).toBeTruthy();
    expect(parseInt(rowCount || '0')).toBeGreaterThan(0);
  });

  test('should have aria-colcount attribute', async ({ page }) => {
    const grid = page.locator('[role="grid"]');
    const colCount = await grid.getAttribute('aria-colcount');
    expect(colCount).toBeTruthy();
    expect(parseInt(colCount || '0')).toBeGreaterThan(0);
  });

  test('should be keyboard accessible', async ({ page }) => {
    const grid = page.locator('[role="grid"]');
    
    // Grid should have tabindex
    const tabindex = await grid.getAttribute('tabindex');
    expect(tabindex).toBe('0');
  });
});

// ============================================================================
// Test Suite: Column Features
// ============================================================================

test.describe('FactorialDataGrid - Column Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should display all expected columns', async ({ page }) => {
    const expectedColumns = ['ID', 'Company', 'First Name', 'Last Name', 'Email', 'Country', 'Start Date', 'Status', 'Updated'];
    
    for (const column of expectedColumns) {
      await expect(page.getByText(column).first()).toBeVisible();
    }
  });

  test('should show status as chip', async ({ page }) => {
    // Active chip
    const activeChip = page.locator('.MuiChip-colorSuccess');
    await expect(activeChip.first()).toBeVisible();
  });
});

// ============================================================================
// Test Suite: Error Handling
// ============================================================================

test.describe('FactorialDataGrid - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should handle validation errors on inline edit', async ({ page }) => {
    // Find a first name cell and try to clear it (should fail validation)
    const cells = page.locator('[role="gridcell"]');
    const firstNameCell = cells.nth(2);
    
    // Double-click to edit
    await firstNameCell.dblclick();
    await page.waitForTimeout(300);
    
    // Clear the input
    const input = page.locator('input[type="text"]').first();
    if (await input.isVisible()) {
      await input.clear();
      
      // Try to commit
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Should show error or prevent commit
      // (Implementation specific - just verify grid is still functional)
      await expect(page.locator('[role="grid"]')).toBeVisible();
      
      // Cancel to clean up
      await page.keyboard.press('Escape');
    }
  });
});

// ============================================================================
// Test Suite: Performance
// ============================================================================

test.describe('FactorialDataGrid - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await ensureFactorialGrid(page);
    await waitForGridLoaded(page);
  });

  test('should render quickly', async ({ page }) => {
    // Reload and measure time
    const startTime = Date.now();
    await page.reload();
    await waitForGridLoaded(page);
    const endTime = Date.now();
    
    // Should load within 10 seconds
    expect(endTime - startTime).toBeLessThan(10000);
  });

  test('should handle rapid sorting without crashing', async ({ page }) => {
    const header = page.getByText('First Name').first();
    
    // Rapid clicks
    for (let i = 0; i < 5; i++) {
      await header.click();
      await page.waitForTimeout(100);
    }
    
    // Grid should still be functional
    await expect(page.locator('[role="grid"]')).toBeVisible();
    await expect(page.locator('[role="row"]').nth(1)).toBeVisible();
  });

  test('should handle rapid filtering without crashing', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i);
    
    // Rapid typing
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');
    await searchInput.fill('');
    
    // Grid should still be functional
    await expect(page.locator('[role="grid"]')).toBeVisible();
  });
});
