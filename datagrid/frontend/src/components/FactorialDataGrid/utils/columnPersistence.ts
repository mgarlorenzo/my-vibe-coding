import { ColumnConfigV1, ColumnVisibilityModel } from '../types';

// ============================================================================
// Constants
// ============================================================================

const CURRENT_VERSION = 1;
const STORAGE_PREFIX = 'factorialDataGrid:columns:';

// ============================================================================
// Types
// ============================================================================

export interface ColumnPersistenceConfig {
  order: string[];
  hidden: string[];
}

export interface AppliedColumnConfig {
  columnOrder: string[];
  columnVisibility: ColumnVisibilityModel;
}

// ============================================================================
// Storage Key Generation
// ============================================================================

/**
 * Generates the localStorage key for a grid's column configuration
 */
export function getStorageKey(storageKey: string): string {
  return `${STORAGE_PREFIX}${storageKey}`;
}

// ============================================================================
// Save Configuration
// ============================================================================

/**
 * Saves column configuration to localStorage with debouncing handled by caller
 */
export function saveColumnConfig(
  storageKey: string,
  config: ColumnPersistenceConfig
): void {
  try {
    const data: ColumnConfigV1 = {
      version: CURRENT_VERSION,
      order: config.order,
      hidden: config.hidden,
    };
    
    const key = getStorageKey(storageKey);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Silently fail if localStorage is not available or quota exceeded
    console.warn('Failed to save column configuration:', error);
  }
}

// ============================================================================
// Load Configuration
// ============================================================================

/**
 * Loads column configuration from localStorage
 * Returns null if no valid configuration exists
 */
export function loadColumnConfig(storageKey: string): ColumnConfigV1 | null {
  try {
    const key = getStorageKey(storageKey);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);
    
    // Validate version
    if (!data || typeof data !== 'object' || data.version !== CURRENT_VERSION) {
      // Invalid or outdated version, clear it
      localStorage.removeItem(key);
      return null;
    }

    // Validate structure
    if (!Array.isArray(data.order) || !Array.isArray(data.hidden)) {
      localStorage.removeItem(key);
      return null;
    }

    return data as ColumnConfigV1;
  } catch (error) {
    // Silently fail if localStorage is not available or data is corrupted
    console.warn('Failed to load column configuration:', error);
    return null;
  }
}

// ============================================================================
// Apply Configuration
// ============================================================================

/**
 * Applies stored configuration to current columns, handling:
 * - Columns that no longer exist (ignored)
 * - New columns not in stored order (added at end)
 * - Visibility validation
 */
export function applyColumnConfig(
  storedConfig: ColumnConfigV1 | null,
  currentColumnFields: string[],
  initialOrder?: string[],
  initialVisibility?: Record<string, boolean>
): AppliedColumnConfig {
  // Start with defaults
  let columnOrder = initialOrder?.length ? [...initialOrder] : [...currentColumnFields];
  let columnVisibility: ColumnVisibilityModel = initialVisibility ? { ...initialVisibility } : {};

  // If no stored config, use initial values
  if (!storedConfig) {
    return { columnOrder, columnVisibility };
  }

  // Create a set of current column fields for quick lookup
  const currentFieldsSet = new Set(currentColumnFields);

  // Filter stored order to only include columns that still exist
  const validStoredOrder = storedConfig.order.filter(field => currentFieldsSet.has(field));

  // Find new columns not in stored order
  const storedOrderSet = new Set(validStoredOrder);
  const newColumns = currentColumnFields.filter(field => !storedOrderSet.has(field));

  // Final order: stored order (filtered) + new columns at end
  columnOrder = [...validStoredOrder, ...newColumns];

  // Apply visibility from stored config
  // Only apply hidden state for columns that still exist
  storedConfig.hidden.forEach(field => {
    if (currentFieldsSet.has(field)) {
      columnVisibility[field] = false;
    }
  });

  // Ensure all columns have a visibility entry (default to visible)
  currentColumnFields.forEach(field => {
    if (columnVisibility[field] === undefined) {
      columnVisibility[field] = true;
    }
  });

  return { columnOrder, columnVisibility };
}

// ============================================================================
// Clear Configuration
// ============================================================================

/**
 * Clears stored column configuration
 */
export function clearColumnConfig(storageKey: string): void {
  try {
    const key = getStorageKey(storageKey);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear column configuration:', error);
  }
}

// ============================================================================
// Debounce Helper
// ============================================================================

/**
 * Creates a debounced save function
 */
export function createDebouncedSave(
  storageKey: string,
  delayMs: number = 200
): (config: ColumnPersistenceConfig) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (config: ColumnPersistenceConfig) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      saveColumnConfig(storageKey, config);
      timeoutId = null;
    }, delayMs);
  };
}

// ============================================================================
// Extract Hidden Fields
// ============================================================================

/**
 * Extracts array of hidden field names from visibility model
 */
export function extractHiddenFields(visibility: ColumnVisibilityModel): string[] {
  return Object.entries(visibility)
    .filter(([, isVisible]) => isVisible === false)
    .map(([field]) => field);
}
