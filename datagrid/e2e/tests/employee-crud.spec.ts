import { test, expect } from '@playwright/test';

test.describe('Employee Management CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the data grid to load
    await expect(page.getByTestId('employee-data-grid')).toBeVisible({ timeout: 30000 });
    // Wait for data to load (at least one row should be visible)
    await expect(page.locator('.MuiDataGrid-row').first()).toBeVisible({ timeout: 30000 });
  });

  test('should display the employee list', async ({ page }) => {
    // Check that the title is visible
    await expect(page.getByText('Employee Management')).toBeVisible();
    
    // Check that the data grid is visible
    await expect(page.getByTestId('employee-data-grid')).toBeVisible();
    
    // Check that there are employees in the list (seed data)
    const rows = page.locator('.MuiDataGrid-row');
    await expect(rows.first()).toBeVisible();
    
    // Verify column headers
    await expect(page.getByRole('columnheader', { name: 'ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'First Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Last Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
  });

  test('should create a new employee', async ({ page }) => {
    // Click the add employee button
    await page.getByTestId('add-employee-button').click();
    
    // Wait for the dialog to open
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    // Fill in the form
    const timestamp = Date.now();
    const firstName = `Test${timestamp}`;
    const lastName = `User${timestamp}`;
    const email = `test.user.${timestamp}@example.com`;
    
    await page.getByTestId('first-name-input').locator('input').fill(firstName);
    await page.getByTestId('last-name-input').locator('input').fill(lastName);
    await page.getByTestId('email-input').locator('input').fill(email);
    
    // Submit the form
    await page.getByTestId('submit-employee-button').click();
    
    // Wait for the dialog to close
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify the new employee appears in the list
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(lastName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('should edit an existing employee', async ({ page }) => {
    // First, create an employee to edit
    await page.getByTestId('add-employee-button').click();
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    const timestamp = Date.now();
    const originalFirstName = `Edit${timestamp}`;
    const originalLastName = `Test${timestamp}`;
    
    await page.getByTestId('first-name-input').locator('input').fill(originalFirstName);
    await page.getByTestId('last-name-input').locator('input').fill(originalLastName);
    await page.getByTestId('submit-employee-button').click();
    
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(originalFirstName)).toBeVisible({ timeout: 10000 });
    
    // Find the row with our employee and click edit
    const row = page.locator('.MuiDataGrid-row', { hasText: originalFirstName });
    await row.locator('[data-testid^="edit-employee-"]').click();
    
    // Wait for the edit dialog to open
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    // Update the last name
    const updatedLastName = `Updated${timestamp}`;
    await page.getByTestId('last-name-input').locator('input').clear();
    await page.getByTestId('last-name-input').locator('input').fill(updatedLastName);
    
    // Submit the form
    await page.getByTestId('submit-employee-button').click();
    
    // Wait for the dialog to close
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify the updated name appears
    await expect(page.getByText(updatedLastName)).toBeVisible({ timeout: 10000 });
  });

  test('should terminate an employee', async ({ page }) => {
    // First, create an employee to terminate
    await page.getByTestId('add-employee-button').click();
    await expect(page.getByTestId('employee-form-dialog')).toBeVisible();
    
    const timestamp = Date.now();
    const firstName = `Terminate${timestamp}`;
    const lastName = `Test${timestamp}`;
    
    await page.getByTestId('first-name-input').locator('input').fill(firstName);
    await page.getByTestId('last-name-input').locator('input').fill(lastName);
    await page.getByTestId('submit-employee-button').click();
    
    await expect(page.getByTestId('employee-form-dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(firstName)).toBeVisible({ timeout: 10000 });
    
    // Find the row with our employee and click terminate
    const row = page.locator('.MuiDataGrid-row', { hasText: firstName });
    await row.locator('[data-testid^="terminate-employee-"]').click();
    
    // Wait for the terminate dialog to open
    await expect(page.getByTestId('terminate-dialog')).toBeVisible();
    
    // Fill in termination details
    await page.getByTestId('termination-reason-input').locator('input').fill('Test termination');
    
    // Confirm termination
    await page.getByTestId('confirm-terminate-button').click();
    
    // Wait for the dialog to close
    await expect(page.getByTestId('terminate-dialog')).not.toBeVisible({ timeout: 10000 });
    
    // Verify the employee now shows as terminated (has a termination date chip)
    const terminatedRow = page.locator('.MuiDataGrid-row', { hasText: firstName });
    await expect(terminatedRow.locator('.MuiChip-colorError')).toBeVisible({ timeout: 10000 });
  });

  test('should filter employees using quick filter', async ({ page }) => {
    // Type in the quick filter
    await page.locator('.MuiDataGrid-toolbarQuickFilter input').fill('Maria');
    
    // Wait for the filter to apply
    await page.waitForTimeout(500);
    
    // Verify that Maria is visible
    await expect(page.getByText('Maria')).toBeVisible();
    
    // Clear the filter
    await page.locator('.MuiDataGrid-toolbarQuickFilter input').clear();
    
    // Wait for the filter to clear
    await page.waitForTimeout(500);
  });

  test('should paginate through employees', async ({ page }) => {
    // Check that pagination controls are visible
    const pagination = page.locator('.MuiTablePagination-root');
    await expect(pagination).toBeVisible();
    
    // Check that we can see the total count
    await expect(pagination.locator('.MuiTablePagination-displayedRows')).toBeVisible();
  });

  test('should sort employees by column', async ({ page }) => {
    // Click on the First Name column header to sort
    await page.getByRole('columnheader', { name: 'First Name' }).click();
    
    // Wait for the sort to apply
    await page.waitForTimeout(500);
    
    // Click again to reverse sort
    await page.getByRole('columnheader', { name: 'First Name' }).click();
    
    // Wait for the sort to apply
    await page.waitForTimeout(500);
    
    // Verify the grid is still visible and has data
    await expect(page.locator('.MuiDataGrid-row').first()).toBeVisible();
  });
});
