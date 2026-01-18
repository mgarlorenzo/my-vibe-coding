import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeCSVValue,
  buildCsv,
  generateCSVFilename,
  downloadCsv,
  createExportColumns,
  defaultIsColumnExportable,
} from '../utils/csvExport';
import { GridColumn, ExportColumnConfig } from '../types';

// ============================================================================
// escapeCSVValue Tests
// ============================================================================

describe('escapeCSVValue', () => {
  it('returns empty string for null', () => {
    expect(escapeCSVValue(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(escapeCSVValue(undefined)).toBe('');
  });

  it('returns string as-is when no special characters', () => {
    expect(escapeCSVValue('Hello World')).toBe('Hello World');
  });

  it('returns number as string', () => {
    expect(escapeCSVValue(42)).toBe('42');
    expect(escapeCSVValue(3.14)).toBe('3.14');
  });

  it('returns boolean as string', () => {
    expect(escapeCSVValue(true)).toBe('true');
    expect(escapeCSVValue(false)).toBe('false');
  });

  it('wraps value with comma in quotes', () => {
    expect(escapeCSVValue('Hello, World')).toBe('"Hello, World"');
  });

  it('wraps value with newline in quotes', () => {
    expect(escapeCSVValue('Hello\nWorld')).toBe('"Hello\nWorld"');
  });

  it('wraps value with carriage return in quotes', () => {
    expect(escapeCSVValue('Hello\rWorld')).toBe('"Hello\rWorld"');
  });

  it('escapes quotes by doubling them', () => {
    expect(escapeCSVValue('Say "Hello"')).toBe('"Say ""Hello"""');
  });

  it('handles value with multiple special characters', () => {
    expect(escapeCSVValue('Hello, "World"\nHow are you?')).toBe('"Hello, ""World""\nHow are you?"');
  });
});

// ============================================================================
// buildCsv Tests
// ============================================================================

describe('buildCsv', () => {
  const testColumns: ExportColumnConfig[] = [
    { field: 'name', headerName: 'Name', getValue: (row: any) => row.name },
    { field: 'email', headerName: 'Email', getValue: (row: any) => row.email },
    { field: 'age', headerName: 'Age', getValue: (row: any) => row.age },
  ];

  const testRows = [
    { name: 'John Doe', email: 'john@example.com', age: 30 },
    { name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  ];

  it('generates CSV with headers by default', () => {
    const csv = buildCsv({ rows: testRows, columns: testColumns });
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Name,Email,Age');
    expect(lines[1]).toBe('John Doe,john@example.com,30');
    expect(lines[2]).toBe('Jane Smith,jane@example.com,25');
  });

  it('generates CSV without headers when includeHeaders is false', () => {
    const csv = buildCsv({ rows: testRows, columns: testColumns, includeHeaders: false });
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('John Doe,john@example.com,30');
    expect(lines[1]).toBe('Jane Smith,jane@example.com,25');
    expect(lines.length).toBe(2);
  });

  it('uses custom delimiter', () => {
    const csv = buildCsv({ rows: testRows, columns: testColumns, delimiter: ';' });
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('Name;Email;Age');
    expect(lines[1]).toBe('John Doe;john@example.com;30');
  });

  it('handles empty rows array', () => {
    const csv = buildCsv({ rows: [], columns: testColumns });
    
    expect(csv).toBe('Name,Email,Age');
  });

  it('handles rows with special characters', () => {
    const rowsWithSpecialChars = [
      { name: 'John, Jr.', email: 'john@example.com', age: 30 },
      { name: 'Jane "The Great" Smith', email: 'jane@example.com', age: 25 },
    ];
    
    const csv = buildCsv({ rows: rowsWithSpecialChars, columns: testColumns });
    const lines = csv.split('\n');
    
    expect(lines[1]).toBe('"John, Jr.",john@example.com,30');
    expect(lines[2]).toBe('"Jane ""The Great"" Smith",jane@example.com,25');
  });

  it('handles null and undefined values', () => {
    const rowsWithNulls = [
      { name: 'John', email: null, age: undefined },
    ];
    
    const csv = buildCsv({ rows: rowsWithNulls, columns: testColumns });
    const lines = csv.split('\n');
    
    expect(lines[1]).toBe('John,,');
  });

  it('uses getValue function from columns', () => {
    const columnsWithGetter: ExportColumnConfig[] = [
      { 
        field: 'fullName', 
        headerName: 'Full Name', 
        getValue: (row: any) => `${row.firstName} ${row.lastName}` 
      },
    ];
    
    const rows = [{ firstName: 'John', lastName: 'Doe' }];
    const csv = buildCsv({ rows, columns: columnsWithGetter });
    const lines = csv.split('\n');
    
    expect(lines[1]).toBe('John Doe');
  });
});

// ============================================================================
// generateCSVFilename Tests
// ============================================================================

describe('generateCSVFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('generates filename with default prefix', () => {
    vi.setSystemTime(new Date('2024-03-15T14:30:00'));
    
    const filename = generateCSVFilename();
    
    expect(filename).toBe('export_2024-03-15_1430.csv');
  });

  it('generates filename with custom prefix', () => {
    vi.setSystemTime(new Date('2024-03-15T14:30:00'));
    
    const filename = generateCSVFilename('employees');
    
    expect(filename).toBe('employees_2024-03-15_1430.csv');
  });

  it('pads single digit months and days', () => {
    vi.setSystemTime(new Date('2024-01-05T09:05:00'));
    
    const filename = generateCSVFilename('test');
    
    expect(filename).toBe('test_2024-01-05_0905.csv');
  });
});

// ============================================================================
// downloadCsv Tests
// ============================================================================

describe('downloadCsv', () => {
  const mockCreateObjectURL = vi.fn((_blob: Blob) => 'blob:mock-url');
  const mockRevokeObjectURL = vi.fn((_url: string) => {});
  const mockClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL methods
    (global.URL.createObjectURL as unknown) = mockCreateObjectURL;
    (global.URL.revokeObjectURL as unknown) = mockRevokeObjectURL;

    // Mock document methods
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    
    // Mock createElement to return a mock anchor
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          setAttribute: vi.fn(),
          click: mockClick,
          style: {},
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates blob with UTF-8 BOM', () => {
    downloadCsv('test,data', 'test.csv');
    
    expect(mockCreateObjectURL).toHaveBeenCalled();
    const blobArg = mockCreateObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
  });

  it('creates download link and clicks it', () => {
    downloadCsv('test,data', 'test.csv');
    
    expect(mockClick).toHaveBeenCalled();
  });

  it('appends and removes link from document', () => {
    downloadCsv('test,data', 'test.csv');
    
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('revokes object URL after download', () => {
    downloadCsv('test,data', 'test.csv');
    
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

// ============================================================================
// defaultIsColumnExportable Tests
// ============================================================================

describe('defaultIsColumnExportable', () => {
  it('returns true for regular columns', () => {
    const column: GridColumn<any> = {
      field: 'name',
      headerName: 'Name',
    };
    
    expect(defaultIsColumnExportable(column)).toBe(true);
  });

  it('returns false for custom columns with renderCell but no valueGetter', () => {
    const column: GridColumn<any> = {
      field: 'custom',
      headerName: 'Custom',
      type: 'custom',
      renderCell: () => null,
    };
    
    expect(defaultIsColumnExportable(column)).toBe(false);
  });

  it('returns true for custom columns with valueGetter', () => {
    const column: GridColumn<any> = {
      field: 'custom',
      headerName: 'Custom',
      type: 'custom',
      renderCell: () => null,
      valueGetter: (row) => row.value,
    };
    
    expect(defaultIsColumnExportable(column)).toBe(true);
  });

  it('returns false for actions column', () => {
    const column: GridColumn<any> = {
      field: 'actions',
      headerName: 'Actions',
    };
    
    expect(defaultIsColumnExportable(column)).toBe(false);
  });

  it('returns false for __actions__ column', () => {
    const column: GridColumn<any> = {
      field: '__actions__',
      headerName: 'Actions',
    };
    
    expect(defaultIsColumnExportable(column)).toBe(false);
  });
});

// ============================================================================
// createExportColumns Tests
// ============================================================================

describe('createExportColumns', () => {
  it('creates export columns from grid columns', () => {
    const gridColumns: GridColumn<any>[] = [
      { field: 'name', headerName: 'Name' },
      { field: 'email', headerName: 'Email' },
    ];
    
    const exportColumns = createExportColumns(gridColumns);
    
    expect(exportColumns).toHaveLength(2);
    expect(exportColumns[0].field).toBe('name');
    expect(exportColumns[0].headerName).toBe('Name');
    expect(exportColumns[1].field).toBe('email');
    expect(exportColumns[1].headerName).toBe('Email');
  });

  it('filters out non-exportable columns', () => {
    const gridColumns: GridColumn<any>[] = [
      { field: 'name', headerName: 'Name' },
      { field: 'actions', headerName: 'Actions' },
    ];
    
    const exportColumns = createExportColumns(gridColumns);
    
    expect(exportColumns).toHaveLength(1);
    expect(exportColumns[0].field).toBe('name');
  });

  it('uses valueGetter when available', () => {
    const gridColumns: GridColumn<any>[] = [
      { 
        field: 'fullName', 
        headerName: 'Full Name',
        valueGetter: (row) => `${row.first} ${row.last}`,
      },
    ];
    
    const exportColumns = createExportColumns(gridColumns);
    const row = { first: 'John', last: 'Doe' };
    
    expect(exportColumns[0].getValue(row)).toBe('John Doe');
  });

  it('uses raw value when no valueGetter', () => {
    const gridColumns: GridColumn<any>[] = [
      { field: 'name', headerName: 'Name' },
    ];
    
    const exportColumns = createExportColumns(gridColumns);
    const row = { name: 'John Doe' };
    
    expect(exportColumns[0].getValue(row)).toBe('John Doe');
  });

  it('uses custom isExportable function', () => {
    const gridColumns: GridColumn<any>[] = [
      { field: 'name', headerName: 'Name' },
      { field: 'secret', headerName: 'Secret' },
    ];
    
    const isExportable = (col: GridColumn<any>) => col.field !== 'secret';
    const exportColumns = createExportColumns(gridColumns, isExportable);
    
    expect(exportColumns).toHaveLength(1);
    expect(exportColumns[0].field).toBe('name');
  });
});
