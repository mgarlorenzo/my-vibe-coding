/**
 * Guardrail Tests for FactorialDataGrid
 * 
 * These tests ensure that critical features are not accidentally disabled
 * or removed from the HomePage implementation.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Guardrail: Toolbar Must Be Enabled
// ============================================================================

describe('Guardrails - HomePage Configuration', () => {
  const homePagePath = path.resolve(__dirname, '../../../pages/HomePage.tsx');
  
  it('GUARDRAIL: showToolbar must NOT be set to false in HomePage', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    // Check that showToolbar={false} is NOT present
    const hasToolbarDisabled = /showToolbar\s*=\s*\{?\s*false\s*\}?/.test(content);
    
    expect(hasToolbarDisabled).toBe(false);
    
    // Additionally verify that showToolbar is either:
    // 1. Set to true explicitly, OR
    // 2. Not set at all (defaults to true)
    const hasToolbarEnabled = /showToolbar\s*[=:]?\s*\{?\s*true\s*\}?/.test(content) ||
                              /showToolbar(?!\s*=\s*\{?\s*false)/.test(content);
    
    // The toolbar should be enabled (either explicitly or by default)
    expect(hasToolbarEnabled || !content.includes('showToolbar={false}')).toBe(true);
  });

  it('GUARDRAIL: FactorialDataGrid must be used in HomePage', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    // Check that FactorialDataGrid is imported
    const hasImport = /import.*FactorialDataGrid.*from/.test(content);
    expect(hasImport).toBe(true);
    
    // Check that FactorialDataGrid is used in JSX
    const hasUsage = /<FactorialDataGrid/.test(content);
    expect(hasUsage).toBe(true);
  });

  it('GUARDRAIL: showQuickFilter must NOT be set to false', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    const hasQuickFilterDisabled = /showQuickFilter\s*=\s*\{?\s*false\s*\}?/.test(content);
    expect(hasQuickFilterDisabled).toBe(false);
  });

  it('GUARDRAIL: showGroupingPanel must NOT be set to false', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    const hasGroupingDisabled = /showGroupingPanel\s*=\s*\{?\s*false\s*\}?/.test(content);
    expect(hasGroupingDisabled).toBe(false);
  });

  it('GUARDRAIL: showColumnSelector must NOT be set to false', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    const hasColumnSelectorDisabled = /showColumnSelector\s*=\s*\{?\s*false\s*\}?/.test(content);
    expect(hasColumnSelectorDisabled).toBe(false);
  });

  it('GUARDRAIL: showDensitySelector must NOT be set to false', () => {
    const content = fs.readFileSync(homePagePath, 'utf-8');
    
    const hasDensitySelectorDisabled = /showDensitySelector\s*=\s*\{?\s*false\s*\}?/.test(content);
    expect(hasDensitySelectorDisabled).toBe(false);
  });
});

// ============================================================================
// Guardrail: Required data-testid Attributes
// ============================================================================

describe('Guardrails - Required Test IDs', () => {
  it('GUARDRAIL: FactorialDataGrid must have data-testid', () => {
    const gridPath = path.resolve(__dirname, '../FactorialDataGrid.tsx');
    const content = fs.readFileSync(gridPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']factorial-data-grid["']/.test(content);
    expect(hasTestId).toBe(true);
  });

  it('GUARDRAIL: GridToolbar must have data-testid', () => {
    const toolbarPath = path.resolve(__dirname, '../components/GridToolbar.tsx');
    const content = fs.readFileSync(toolbarPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']grid-toolbar["']/.test(content);
    expect(hasTestId).toBe(true);
  });

  it('GUARDRAIL: QuickSearch must have data-testid', () => {
    const toolbarPath = path.resolve(__dirname, '../components/GridToolbar.tsx');
    const content = fs.readFileSync(toolbarPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']quick-search["']/.test(content);
    expect(hasTestId).toBe(true);
  });

  it('GUARDRAIL: Group By button must have data-testid', () => {
    const toolbarPath = path.resolve(__dirname, '../components/GridToolbar.tsx');
    const content = fs.readFileSync(toolbarPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']group-by-button["']/.test(content);
    expect(hasTestId).toBe(true);
  });

  it('GUARDRAIL: Filters button must have data-testid', () => {
    const filterPanelPath = path.resolve(__dirname, '../components/FilterPanel.tsx');
    const content = fs.readFileSync(filterPanelPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']filters-button["']/.test(content);
    expect(hasTestId).toBe(true);
  });

  it('GUARDRAIL: Export CSV button must have data-testid', () => {
    const toolbarPath = path.resolve(__dirname, '../components/GridToolbar.tsx');
    const content = fs.readFileSync(toolbarPath, 'utf-8');
    
    const hasTestId = /data-testid\s*=\s*["']export-csv-button["']/.test(content);
    expect(hasTestId).toBe(true);
  });
});

// ============================================================================
// Guardrail: Filter Functionality
// ============================================================================

describe('Guardrails - Filter Implementation', () => {
  it('GUARDRAIL: Store must support filtering by any row field', () => {
    const storePath = path.resolve(__dirname, '../core/store.ts');
    const content = fs.readFileSync(storePath, 'utf-8');
    
    // Check that the store can filter by any field, not just columns
    // This is indicated by accessing row properties directly
    const hasDirectRowAccess = /row\s*as\s*Record<string,\s*unknown>/.test(content) ||
                               /\(row\s*as\s*Record/.test(content);
    expect(hasDirectRowAccess).toBe(true);
  });

  it('GUARDRAIL: FilterPanel must be integrated in GridToolbar', () => {
    const toolbarPath = path.resolve(__dirname, '../components/GridToolbar.tsx');
    const content = fs.readFileSync(toolbarPath, 'utf-8');
    
    // Check that FilterPanel is imported
    const hasImport = /import.*FilterPanel.*from/.test(content);
    expect(hasImport).toBe(true);
    
    // Check that FilterPanel is used
    const hasUsage = /<FilterPanel/.test(content);
    expect(hasUsage).toBe(true);
  });
});

// ============================================================================
// Guardrail: CSV Export
// ============================================================================

describe('Guardrails - CSV Export Implementation', () => {
  it('GUARDRAIL: CSV export utility must exist', () => {
    const csvExportPath = path.resolve(__dirname, '../utils/csvExport.ts');
    const exists = fs.existsSync(csvExportPath);
    expect(exists).toBe(true);
  });

  it('GUARDRAIL: CSV export must handle special characters', () => {
    const csvExportPath = path.resolve(__dirname, '../utils/csvExport.ts');
    const content = fs.readFileSync(csvExportPath, 'utf-8');
    
    // Check for quote escaping logic
    const hasQuoteEscaping = /replace\s*\(\s*\/"\//g.test(content) ||
                             /""/.test(content);
    expect(hasQuoteEscaping).toBe(true);
  });

  it('GUARDRAIL: CSV export must be integrated in FactorialDataGrid', () => {
    const gridPath = path.resolve(__dirname, '../FactorialDataGrid.tsx');
    const content = fs.readFileSync(gridPath, 'utf-8');
    
    // Check that CSV export functions are imported from csvExport utility
    const hasImport = content.includes('from \'./utils/csvExport\'') || 
                      content.includes('from "./utils/csvExport"');
    expect(hasImport).toBe(true);
    
    // Check that buildCsv or downloadCsv is used
    const usesCsvFunctions = content.includes('buildCsv') || content.includes('downloadCsv');
    expect(usesCsvFunctions).toBe(true);
  });
});
