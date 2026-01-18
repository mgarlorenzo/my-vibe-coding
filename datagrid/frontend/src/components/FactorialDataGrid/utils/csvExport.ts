/**
 * CSV Export Utility for FactorialDataGrid
 * 
 * Exports grid data to CSV format with proper escaping and formatting.
 * Generic implementation that works with any dataset.
 */

import { GridColumn, ExportColumnConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface CSVExportOptions {
  /** Column headers to include in the export */
  headers: { field: string; label: string }[];
  /** Whether to include headers in the output (default: true) */
  includeHeaders?: boolean;
  /** Delimiter character (default: ',') */
  delimiter?: string;
  /** Filename without extension (default: 'export') */
  filename?: string;
}

export interface BuildCsvOptions<T> {
  /** Rows to export */
  rows: T[];
  /** Column configurations for export */
  columns: ExportColumnConfig[];
  /** Delimiter character (default: ',') */
  delimiter?: string;
  /** Whether to include headers (default: true) */
  includeHeaders?: boolean;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Doubles any existing quotes
 */
export function escapeCSVValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Check if value needs escaping
  const needsEscaping = stringValue.includes(',') || 
                        stringValue.includes('"') || 
                        stringValue.includes('\n') ||
                        stringValue.includes('\r');
  
  if (needsEscaping) {
    // Double any existing quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Builds a CSV string from rows and column configurations
 * Pure function - no side effects
 */
export function buildCsv<T>(options: BuildCsvOptions<T>): string {
  const { rows, columns, delimiter = ',', includeHeaders = true } = options;
  
  const lines: string[] = [];
  
  // Add header row
  if (includeHeaders) {
    const headerLine = columns
      .map(col => escapeCSVValue(col.headerName))
      .join(delimiter);
    lines.push(headerLine);
  }
  
  // Add data rows
  rows.forEach(row => {
    const values = columns.map(col => {
      const value = col.getValue(row);
      return escapeCSVValue(value);
    });
    lines.push(values.join(delimiter));
  });
  
  return lines.join('\n');
}

/**
 * Generates a timestamped filename for CSV export
 * Format: {prefix}_YYYY-MM-DD_HHmm.csv
 */
export function generateCSVFilename(prefix: string = 'export'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${prefix}_${year}-${month}-${day}_${hours}${minutes}.csv`;
}

/**
 * Downloads a CSV string as a file
 * Includes UTF-8 BOM for Excel compatibility
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Create blob with BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

// ============================================================================
// Column Processing
// ============================================================================

/**
 * Checks if a value is a simple string (not a ReactNode)
 */
function isSimpleValue(value: unknown): value is string | number | boolean | null | undefined {
  if (value == null) return true;
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean';
}

/**
 * Default function to determine if a column should be exported
 * Excludes columns with type 'custom' that have renderCell but no valueGetter
 * (these are typically action columns)
 */
export function defaultIsColumnExportable<T>(column: GridColumn<T>): boolean {
  // Exclude columns explicitly marked as non-exportable via type
  if (column.type === 'custom' && column.renderCell && !column.valueGetter) {
    return false;
  }
  
  // Exclude columns with field 'actions' (common convention)
  if (column.field === 'actions' || column.field === '__actions__') {
    return false;
  }
  
  return true;
}

/**
 * Creates export column configurations from grid columns
 * Handles valueGetter and valueFormatter appropriately
 */
export function createExportColumns<T>(
  columns: GridColumn<T>[],
  isExportable: (column: GridColumn<T>) => boolean = defaultIsColumnExportable
): ExportColumnConfig[] {
  return columns
    .filter(isExportable)
    .map(column => ({
      field: column.field as string,
      headerName: column.headerName,
      getValue: (row: unknown) => {
        const typedRow = row as T;
        
        // Use valueGetter if available
        if (column.valueGetter) {
          return column.valueGetter(typedRow);
        }
        
        // Get raw value from row
        const rawValue = (typedRow as Record<string, unknown>)[column.field as string];
        
        // Try valueFormatter only if it returns a simple value
        if (column.valueFormatter) {
          const formatted = column.valueFormatter(rawValue, typedRow);
          // Only use formatted value if it's a simple type (not ReactNode)
          if (isSimpleValue(formatted)) {
            return formatted;
          }
        }
        
        return rawValue;
      },
    }));
}

// ============================================================================
// Legacy API (for backward compatibility)
// ============================================================================

/**
 * Generates a CSV string from rows and column definitions
 * @deprecated Use buildCsv instead
 */
export function generateCSV<T>(
  rows: T[],
  options: CSVExportOptions
): string {
  const { headers, includeHeaders = true, delimiter = ',' } = options;
  
  const columns: ExportColumnConfig[] = headers.map(h => ({
    field: h.field,
    headerName: h.label,
    getValue: (row: unknown) => (row as Record<string, unknown>)[h.field],
  }));
  
  return buildCsv({ rows, columns, delimiter, includeHeaders });
}

/**
 * Downloads a CSV string as a file
 * @deprecated Use downloadCsv instead
 */
export function downloadCSV(csvContent: string, filename: string): void {
  downloadCsv(csvContent, filename);
}

/**
 * Exports rows to CSV and triggers download
 * @deprecated Use buildCsv + downloadCsv instead
 */
export function exportToCSV<T>(
  rows: T[],
  options: CSVExportOptions
): void {
  const csvContent = generateCSV(rows, options);
  const filename = options.filename 
    ? `${options.filename}.csv`
    : generateCSVFilename('export');
  
  downloadCsv(csvContent, filename);
}
