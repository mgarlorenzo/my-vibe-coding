import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStorageKey,
  saveColumnConfig,
  loadColumnConfig,
  applyColumnConfig,
  clearColumnConfig,
  createDebouncedSave,
  extractHiddenFields,
} from '../utils/columnPersistence';
import { ColumnConfigV1 } from '../types';

// ============================================================================
// Mock localStorage
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================================================
// Setup & Teardown
// ============================================================================

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// ============================================================================
// getStorageKey Tests
// ============================================================================

describe('getStorageKey', () => {
  it('generates correct storage key with prefix', () => {
    expect(getStorageKey('my_grid')).toBe('factorialDataGrid:columns:my_grid');
    expect(getStorageKey('organisation_people_grid')).toBe('factorialDataGrid:columns:organisation_people_grid');
  });
});

// ============================================================================
// saveColumnConfig Tests
// ============================================================================

describe('saveColumnConfig', () => {
  it('saves configuration with version 1', () => {
    saveColumnConfig('test_grid', {
      order: ['id', 'name', 'email'],
      hidden: ['email'],
    });

    const stored = JSON.parse(localStorageMock.getItem('factorialDataGrid:columns:test_grid')!);
    expect(stored).toEqual({
      version: 1,
      order: ['id', 'name', 'email'],
      hidden: ['email'],
    });
  });

  it('overwrites existing configuration', () => {
    saveColumnConfig('test_grid', {
      order: ['id', 'name'],
      hidden: [],
    });

    saveColumnConfig('test_grid', {
      order: ['name', 'id', 'email'],
      hidden: ['id'],
    });

    const stored = JSON.parse(localStorageMock.getItem('factorialDataGrid:columns:test_grid')!);
    expect(stored.order).toEqual(['name', 'id', 'email']);
    expect(stored.hidden).toEqual(['id']);
  });

  it('handles localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceeded');
    });

    // Should not throw
    expect(() => {
      saveColumnConfig('test_grid', { order: ['id'], hidden: [] });
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// loadColumnConfig Tests
// ============================================================================

describe('loadColumnConfig', () => {
  it('returns null when no config exists', () => {
    expect(loadColumnConfig('nonexistent')).toBeNull();
  });

  it('loads valid configuration', () => {
    const config: ColumnConfigV1 = {
      version: 1,
      order: ['id', 'name', 'email'],
      hidden: ['email'],
    };
    localStorageMock.setItem('factorialDataGrid:columns:test_grid', JSON.stringify(config));

    const loaded = loadColumnConfig('test_grid');
    expect(loaded).toEqual(config);
  });

  it('returns null and clears invalid version', () => {
    const invalidConfig = {
      version: 2, // Wrong version
      order: ['id'],
      hidden: [],
    };
    localStorageMock.setItem('factorialDataGrid:columns:test_grid', JSON.stringify(invalidConfig));

    const loaded = loadColumnConfig('test_grid');
    expect(loaded).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('factorialDataGrid:columns:test_grid');
  });

  it('returns null and clears malformed data', () => {
    localStorageMock.setItem('factorialDataGrid:columns:test_grid', 'not json');

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loaded = loadColumnConfig('test_grid');
    expect(loaded).toBeNull();
    consoleSpy.mockRestore();
  });

  it('returns null and clears config with missing order array', () => {
    const invalidConfig = {
      version: 1,
      hidden: [],
    };
    localStorageMock.setItem('factorialDataGrid:columns:test_grid', JSON.stringify(invalidConfig));

    const loaded = loadColumnConfig('test_grid');
    expect(loaded).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });

  it('returns null and clears config with missing hidden array', () => {
    const invalidConfig = {
      version: 1,
      order: ['id'],
    };
    localStorageMock.setItem('factorialDataGrid:columns:test_grid', JSON.stringify(invalidConfig));

    const loaded = loadColumnConfig('test_grid');
    expect(loaded).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalled();
  });
});

// ============================================================================
// applyColumnConfig Tests
// ============================================================================

describe('applyColumnConfig', () => {
  const currentFields = ['id', 'name', 'email', 'department'];

  it('returns defaults when no stored config', () => {
    const result = applyColumnConfig(null, currentFields);

    expect(result.columnOrder).toEqual(currentFields);
    expect(result.columnVisibility).toEqual({});
  });

  it('uses initialOrder when no stored config', () => {
    const initialOrder = ['email', 'name', 'id', 'department'];
    const result = applyColumnConfig(null, currentFields, initialOrder);

    expect(result.columnOrder).toEqual(initialOrder);
  });

  it('uses initialVisibility when no stored config', () => {
    const initialVisibility = { email: false, department: false };
    const result = applyColumnConfig(null, currentFields, undefined, initialVisibility);

    expect(result.columnVisibility).toEqual(initialVisibility);
  });

  it('applies stored order', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['department', 'email', 'name', 'id'],
      hidden: [],
    };

    const result = applyColumnConfig(storedConfig, currentFields);
    expect(result.columnOrder).toEqual(['department', 'email', 'name', 'id']);
  });

  it('applies stored hidden columns', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['id', 'name', 'email', 'department'],
      hidden: ['email', 'department'],
    };

    const result = applyColumnConfig(storedConfig, currentFields);
    expect(result.columnVisibility.email).toBe(false);
    expect(result.columnVisibility.department).toBe(false);
    expect(result.columnVisibility.id).toBe(true);
    expect(result.columnVisibility.name).toBe(true);
  });

  it('ignores columns that no longer exist in stored order', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['id', 'removed_column', 'name', 'email', 'department'],
      hidden: [],
    };

    const result = applyColumnConfig(storedConfig, currentFields);
    expect(result.columnOrder).toEqual(['id', 'name', 'email', 'department']);
    expect(result.columnOrder).not.toContain('removed_column');
  });

  it('ignores hidden columns that no longer exist', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['id', 'name', 'email', 'department'],
      hidden: ['removed_column', 'email'],
    };

    const result = applyColumnConfig(storedConfig, currentFields);
    expect(result.columnVisibility.email).toBe(false);
    expect(result.columnVisibility).not.toHaveProperty('removed_column');
  });

  it('adds new columns at the end', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['id', 'name'],
      hidden: [],
    };

    // Current fields have more columns than stored
    const result = applyColumnConfig(storedConfig, currentFields);
    expect(result.columnOrder).toEqual(['id', 'name', 'email', 'department']);
  });

  it('handles completely new schema (all columns new)', () => {
    const storedConfig: ColumnConfigV1 = {
      version: 1,
      order: ['old1', 'old2', 'old3'],
      hidden: ['old2'],
    };

    const result = applyColumnConfig(storedConfig, currentFields);
    // All stored columns are gone, so we get current fields in order
    expect(result.columnOrder).toEqual(currentFields);
  });
});

// ============================================================================
// clearColumnConfig Tests
// ============================================================================

describe('clearColumnConfig', () => {
  it('removes configuration from localStorage', () => {
    saveColumnConfig('test_grid', { order: ['id'], hidden: [] });
    expect(loadColumnConfig('test_grid')).not.toBeNull();

    clearColumnConfig('test_grid');
    expect(loadColumnConfig('test_grid')).toBeNull();
  });

  it('handles errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });

    expect(() => clearColumnConfig('test_grid')).not.toThrow();
    consoleSpy.mockRestore();
  });
});

// ============================================================================
// createDebouncedSave Tests
// ============================================================================

describe('createDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces save calls', () => {
    const debouncedSave = createDebouncedSave('test_grid', 200);

    debouncedSave({ order: ['id'], hidden: [] });
    debouncedSave({ order: ['id', 'name'], hidden: [] });
    debouncedSave({ order: ['id', 'name', 'email'], hidden: ['email'] });

    // Nothing saved yet
    expect(loadColumnConfig('test_grid')).toBeNull();

    // Advance time
    vi.advanceTimersByTime(200);

    // Only the last call should be saved
    const saved = loadColumnConfig('test_grid');
    expect(saved?.order).toEqual(['id', 'name', 'email']);
    expect(saved?.hidden).toEqual(['email']);
  });

  it('uses default delay of 200ms', () => {
    const debouncedSave = createDebouncedSave('test_grid');

    debouncedSave({ order: ['id'], hidden: [] });

    vi.advanceTimersByTime(199);
    expect(loadColumnConfig('test_grid')).toBeNull();

    vi.advanceTimersByTime(1);
    expect(loadColumnConfig('test_grid')).not.toBeNull();
  });

  it('resets timer on each call', () => {
    const debouncedSave = createDebouncedSave('test_grid', 100);

    debouncedSave({ order: ['a'], hidden: [] });
    vi.advanceTimersByTime(50);

    debouncedSave({ order: ['b'], hidden: [] });
    vi.advanceTimersByTime(50);

    // Still not saved (timer was reset)
    expect(loadColumnConfig('test_grid')).toBeNull();

    vi.advanceTimersByTime(50);

    // Now saved with 'b'
    const saved = loadColumnConfig('test_grid');
    expect(saved?.order).toEqual(['b']);
  });
});

// ============================================================================
// extractHiddenFields Tests
// ============================================================================

describe('extractHiddenFields', () => {
  it('returns empty array when all visible', () => {
    const visibility = { id: true, name: true, email: true };
    expect(extractHiddenFields(visibility)).toEqual([]);
  });

  it('returns hidden field names', () => {
    const visibility = { id: true, name: false, email: true, department: false };
    const hidden = extractHiddenFields(visibility);
    
    expect(hidden).toContain('name');
    expect(hidden).toContain('department');
    expect(hidden).not.toContain('id');
    expect(hidden).not.toContain('email');
  });

  it('handles empty visibility model', () => {
    expect(extractHiddenFields({})).toEqual([]);
  });

  it('treats undefined as visible', () => {
    const visibility = { id: true, name: undefined as unknown as boolean };
    expect(extractHiddenFields(visibility)).toEqual([]);
  });
});
