import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  InputAdornment,
  IconButton,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedFilterField {
  field: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

/** Date filter can be exact date or range */
export type DateFilterMode = 'exact' | 'range';

export interface DateFilter {
  mode: DateFilterMode;
  /** For exact mode: the specific date */
  date?: Date | null;
  /** For range mode: start date */
  startDate?: Date | null;
  /** For range mode: end date */
  endDate?: Date | null;
}

export interface AdvancedFilterModel {
  /** Map of field -> selected values (for string/number/boolean fields) */
  filters: Record<string, Set<string>>;
  /** Map of field -> date filter (for date fields) */
  dateFilters?: Record<string, DateFilter>;
}

interface AdvancedFilterPanelProps<T> {
  fields: AdvancedFilterField[];
  rows: T[];
  filterModel: AdvancedFilterModel;
  onFilterModelChange: (model: AdvancedFilterModel) => void;
  getRowValue?: (row: T, field: string) => unknown;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '(Empty)';
  if (value === '') return '(Empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getValueKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return '__empty__';
  return String(value);
}

// ============================================================================
// Date Filter Selector Component
// ============================================================================

interface DateFilterSelectorProps {
  field: AdvancedFilterField;
  dateFilter: DateFilter | undefined;
  onDateFilterChange: (filter: DateFilter | undefined) => void;
}

function DateFilterSelector({ field, dateFilter, onDateFilterChange }: DateFilterSelectorProps) {
  const mode = dateFilter?.mode || 'exact';
  
  const handleModeChange = useCallback((_: React.MouseEvent<HTMLElement>, newMode: DateFilterMode | null) => {
    if (newMode) {
      onDateFilterChange({
        mode: newMode,
        date: newMode === 'exact' ? dateFilter?.date : undefined,
        startDate: newMode === 'range' ? dateFilter?.startDate : undefined,
        endDate: newMode === 'range' ? dateFilter?.endDate : undefined,
      });
    }
  }, [dateFilter, onDateFilterChange]);

  const handleExactDateChange = useCallback((date: Date | null) => {
    if (date) {
      onDateFilterChange({
        mode: 'exact',
        date,
      });
    } else {
      onDateFilterChange(undefined);
    }
  }, [onDateFilterChange]);

  const handleStartDateChange = useCallback((date: Date | null) => {
    onDateFilterChange({
      mode: 'range',
      startDate: date,
      endDate: dateFilter?.endDate,
    });
  }, [dateFilter?.endDate, onDateFilterChange]);

  const handleEndDateChange = useCallback((date: Date | null) => {
    onDateFilterChange({
      mode: 'range',
      startDate: dateFilter?.startDate,
      endDate: date,
    });
  }, [dateFilter?.startDate, onDateFilterChange]);

  const handleClear = useCallback(() => {
    onDateFilterChange(undefined);
  }, [onDateFilterChange]);

  const hasFilter = dateFilter && (
    (dateFilter.mode === 'exact' && dateFilter.date) ||
    (dateFilter.mode === 'range' && (dateFilter.startDate || dateFilter.endDate))
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: 300, p: 2 }}>
        {/* Mode Toggle */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Filter mode
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            size="small"
            fullWidth
          >
            <ToggleButton value="exact" data-testid={`date-mode-exact-${field.field}`}>
              <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5 }} />
              Exact Date
            </ToggleButton>
            <ToggleButton value="range" data-testid={`date-mode-range-${field.field}`}>
              <DateRangeIcon fontSize="small" sx={{ mr: 0.5 }} />
              Date Range
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Date Pickers */}
        {mode === 'exact' ? (
          <Box>
            <DatePicker
              label="Select date"
              value={dateFilter?.date || null}
              onChange={handleExactDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <DatePicker
              label="From"
              value={dateFilter?.startDate || null}
              onChange={handleStartDateChange}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="To"
              value={dateFilter?.endDate || null}
              onChange={handleEndDateChange}
              minDate={dateFilter?.startDate || undefined}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
            />
          </Box>
        )}

        {/* Clear Button */}
        {hasFilter && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              color="error"
              onClick={handleClear}
              startIcon={<ClearIcon />}
              data-testid={`date-filter-clear-${field.field}`}
            >
              Clear
            </Button>
          </Box>
        )}

        {/* Filter Summary */}
        {hasFilter && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {mode === 'exact' && dateFilter?.date && (
                <>Filtering: {dateFilter.date.toLocaleDateString()}</>
              )}
              {mode === 'range' && (
                <>
                  Filtering: {dateFilter?.startDate?.toLocaleDateString() || 'Any'} 
                  {' → '}
                  {dateFilter?.endDate?.toLocaleDateString() || 'Any'}
                </>
              )}
            </Typography>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}

// ============================================================================
// Value Selector Component with Infinite Scroll
// ============================================================================

const PAGE_SIZE = 20; // Number of items to load per page

interface ValueSelectorProps {
  field: AdvancedFilterField;
  uniqueValues: Array<{ key: string; display: string; count: number }>;
  selectedValues: Set<string>;
  onSelectionChange: (values: Set<string>) => void;
}

function ValueSelector({ field, uniqueValues, selectedValues, onSelectionChange }: ValueSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter values based on search query
  const filteredValues = useMemo(() => {
    if (!searchQuery.trim()) return uniqueValues;
    const query = searchQuery.toLowerCase();
    return uniqueValues.filter(v => v.display.toLowerCase().includes(query));
  }, [uniqueValues, searchQuery]);

  // Get currently displayed values (paginated)
  const displayedValues = useMemo(() => {
    return filteredValues.slice(0, displayedCount);
  }, [filteredValues, displayedCount]);

  const hasMore = displayedCount < filteredValues.length;

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayedCount(PAGE_SIZE);
  }, [searchQuery]);

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    if (!loadMoreElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate a small delay for smooth UX
          setTimeout(() => {
            setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, filteredValues.length));
            setIsLoadingMore(false);
          }, 150);
        }
      },
      {
        root: listRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, filteredValues.length]);

  const handleToggle = useCallback((key: string) => {
    const newSelection = new Set(selectedValues);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    onSelectionChange(newSelection);
  }, [selectedValues, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    // Select all filtered values, not just displayed ones
    const allKeys = new Set(filteredValues.map(v => v.key));
    onSelectionChange(allKeys);
  }, [filteredValues, onSelectionChange]);

  const handleClearAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const allSelected = filteredValues.length > 0 && filteredValues.every(v => selectedValues.has(v.key));

  // Count how many of the filtered values are selected
  const selectedInFilteredCount = useMemo(() => {
    return filteredValues.filter(v => selectedValues.has(v.key)).length;
  }, [filteredValues, selectedValues]);

  return (
    <Box sx={{ width: 300 }}>
      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={`Search ${field.label}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          data-testid={`filter-search-${field.field}`}
        />
      </Box>

      {/* Select All / Clear */}
      <Box sx={{ px: 1.5, py: 1, display: 'flex', gap: 1, justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            onClick={handleSelectAll}
            disabled={allSelected || filteredValues.length === 0}
            data-testid={`filter-select-all-${field.field}`}
          >
            Select All
          </Button>
          <Button
            size="small"
            onClick={handleClearAll}
            disabled={selectedValues.size === 0}
            color="error"
            data-testid={`filter-clear-${field.field}`}
          >
            Clear
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          {filteredValues.length} values
        </Typography>
      </Box>

      {/* Values List with Infinite Scroll */}
      <List
        ref={listRef}
        dense
        sx={{
          maxHeight: 300,
          overflow: 'auto',
          '& .MuiListItemButton-root': {
            py: 0.5,
          },
        }}
        data-testid={`filter-values-${field.field}`}
      >
        {filteredValues.length === 0 ? (
          <ListItem>
            <ListItemText
              primary={searchQuery ? "No matching values" : "No values available"}
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
        ) : (
          <>
            {displayedValues.map(({ key, display, count }) => (
              <ListItemButton
                key={key}
                onClick={() => handleToggle(key)}
                dense
                data-testid={`filter-value-${field.field}-${key}`}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Checkbox
                    edge="start"
                    checked={selectedValues.has(key)}
                    tabIndex={-1}
                    disableRipple
                    size="small"
                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={display}
                  secondary={`${count} items`}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItemButton>
            ))}
            
            {/* Load More Trigger / Loading Indicator */}
            {hasMore && (
              <Box
                ref={loadMoreRef}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 2,
                }}
              >
                {isLoadingMore ? (
                  <CircularProgress size={20} />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Scroll for more...
                  </Typography>
                )}
              </Box>
            )}

            {/* Skeleton placeholders while loading */}
            {isLoadingMore && (
              <>
                {[...Array(3)].map((_, i) => (
                  <ListItem key={`skeleton-${i}`} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Skeleton variant="rectangular" width={18} height={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Skeleton width="60%" />}
                      secondary={<Skeleton width="30%" />}
                    />
                  </ListItem>
                ))}
              </>
            )}
          </>
        )}
      </List>

      {/* Selection Summary */}
      {selectedValues.size > 0 && (
        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            {selectedInFilteredCount} of {filteredValues.length} selected
            {searchQuery && selectedValues.size !== selectedInFilteredCount && (
              <> ({selectedValues.size} total)</>
            )}
          </Typography>
        </Box>
      )}

      {/* Progress indicator showing loaded items */}
      {filteredValues.length > PAGE_SIZE && (
        <Box sx={{ px: 1.5, py: 0.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {Math.min(displayedCount, filteredValues.length)} of {filteredValues.length}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AdvancedFilterPanel<T>({
  fields,
  rows,
  filterModel,
  onFilterModelChange,
  getRowValue,
}: AdvancedFilterPanelProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedField, setSelectedField] = useState<string>(fields[0]?.field || '');

  const open = Boolean(anchorEl);

  // Calculate unique values for each field
  const uniqueValuesByField = useMemo(() => {
    const result: Record<string, Array<{ key: string; display: string; count: number }>> = {};

    fields.forEach(field => {
      const valueCounts = new Map<string, { display: string; count: number }>();

      rows.forEach(row => {
        const rawValue = getRowValue 
          ? getRowValue(row, field.field)
          : (row as Record<string, unknown>)[field.field];
        
        const key = getValueKey(rawValue);
        const display = formatValue(rawValue);

        if (valueCounts.has(key)) {
          valueCounts.get(key)!.count++;
        } else {
          valueCounts.set(key, { display, count: 1 });
        }
      });

      // Sort by display value, but put (Empty) at the end
      const sorted = Array.from(valueCounts.entries())
        .map(([key, { display, count }]) => ({ key, display, count }))
        .sort((a, b) => {
          if (a.key === '__empty__') return 1;
          if (b.key === '__empty__') return -1;
          return a.display.localeCompare(b.display);
        });

      result[field.field] = sorted;
    });

    return result;
  }, [fields, rows, getRowValue]);

  // Count total active filters (including date filters)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    Object.values(filterModel.filters).forEach(values => {
      if (values.size > 0) count++;
    });
    // Count date filters
    if (filterModel.dateFilters) {
      Object.values(filterModel.dateFilters).forEach(dateFilter => {
        if (dateFilter.mode === 'exact' && dateFilter.date) count++;
        else if (dateFilter.mode === 'range' && (dateFilter.startDate || dateFilter.endDate)) count++;
      });
    }
    return count;
  }, [filterModel]);

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleFieldChange = useCallback((field: string) => {
    setSelectedField(field);
  }, []);

  const handleSelectionChange = useCallback((field: string, values: Set<string>) => {
    const newFilters = { ...filterModel.filters };
    if (values.size === 0) {
      delete newFilters[field];
    } else {
      newFilters[field] = values;
    }
    onFilterModelChange({ filters: newFilters });
  }, [filterModel, onFilterModelChange]);

  const handleClearAll = useCallback(() => {
    onFilterModelChange({ filters: {}, dateFilters: {} });
  }, [onFilterModelChange]);

  // Handle date filter change
  const handleDateFilterChange = useCallback((field: string, dateFilter: DateFilter | undefined) => {
    const newDateFilters = { ...filterModel.dateFilters };
    if (dateFilter) {
      newDateFilters[field] = dateFilter;
    } else {
      delete newDateFilters[field];
    }
    onFilterModelChange({ ...filterModel, dateFilters: newDateFilters });
  }, [filterModel, onFilterModelChange]);

  const currentField = fields.find(f => f.field === selectedField);
  const currentUniqueValues = uniqueValuesByField[selectedField] || [];
  const currentSelectedValues = filterModel.filters[selectedField] || new Set<string>();

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={
          <Badge badgeContent={activeFiltersCount} color="primary" max={99}>
            <FilterListIcon />
          </Badge>
        }
        onClick={handleOpen}
        data-testid="advanced-filters-button"
      >
        Filters
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        data-testid="advanced-filter-panel"
      >
        <Box sx={{ display: 'flex', minWidth: 500 }}>
          {/* Field Selector */}
          <Box
            sx={{
              width: 180,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Filter by
              </Typography>
            </Box>
            <List dense sx={{ py: 0 }}>
              {fields.map(field => {
                const hasValueFilter = filterModel.filters[field.field]?.size > 0;
                const filterCount = filterModel.filters[field.field]?.size || 0;
                
                // Check for date filter
                const dateFilter = filterModel.dateFilters?.[field.field];
                const hasDateFilter = dateFilter && (
                  (dateFilter.mode === 'exact' && dateFilter.date) ||
                  (dateFilter.mode === 'range' && (dateFilter.startDate || dateFilter.endDate))
                );
                
                const hasFilter = hasValueFilter || hasDateFilter;
                
                return (
                  <ListItemButton
                    key={field.field}
                    selected={selectedField === field.field}
                    onClick={() => handleFieldChange(field.field)}
                    data-testid={`filter-field-${field.field}`}
                  >
                    <ListItemText
                      primary={field.label}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: hasFilter ? 600 : 400,
                      }}
                    />
                    {hasValueFilter && (
                      <Chip
                        label={filterCount}
                        size="small"
                        color="primary"
                        sx={{ height: 20, minWidth: 20, fontSize: '0.7rem' }}
                      />
                    )}
                    {hasDateFilter && (
                      <CalendarTodayIcon 
                        fontSize="small" 
                        color="primary" 
                        sx={{ ml: 0.5 }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>

          {/* Value Selector */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                p: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {currentField?.label || 'Select a field'}
              </Typography>
              {activeFiltersCount > 0 && (
                <Button
                  size="small"
                  color="error"
                  onClick={handleClearAll}
                  data-testid="filter-clear-all"
                >
                  Clear All Filters
                </Button>
              )}
            </Box>

            {currentField && currentField.type === 'date' ? (
              <DateFilterSelector
                field={currentField}
                dateFilter={filterModel.dateFilters?.[selectedField]}
                onDateFilterChange={(filter) => handleDateFilterChange(selectedField, filter)}
              />
            ) : currentField && (
              <ValueSelector
                field={currentField}
                uniqueValues={currentUniqueValues}
                selectedValues={currentSelectedValues}
                onSelectionChange={(values) => handleSelectionChange(selectedField, values)}
              />
            )}
          </Box>
        </Box>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'primary.50',
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Active filters:
            </Typography>
            {fields.map(field => {
              const values = filterModel.filters[field.field];
              const dateFilter = filterModel.dateFilters?.[field.field];
              
              // Value filter chip
              if (values && values.size > 0) {
                return (
                  <Chip
                    key={field.field}
                    label={`${field.label}: ${values.size}`}
                    size="small"
                    onDelete={() => handleSelectionChange(field.field, new Set())}
                    data-testid={`active-filter-chip-${field.field}`}
                  />
                );
              }
              
              // Date filter chip
              if (dateFilter) {
                const hasDateFilter = (dateFilter.mode === 'exact' && dateFilter.date) ||
                  (dateFilter.mode === 'range' && (dateFilter.startDate || dateFilter.endDate));
                
                if (hasDateFilter) {
                  let label = field.label + ': ';
                  if (dateFilter.mode === 'exact' && dateFilter.date) {
                    label += dateFilter.date.toLocaleDateString();
                  } else if (dateFilter.mode === 'range') {
                    const start = dateFilter.startDate?.toLocaleDateString() || '...';
                    const end = dateFilter.endDate?.toLocaleDateString() || '...';
                    label += `${start} → ${end}`;
                  }
                  
                  return (
                    <Chip
                      key={field.field}
                      label={label}
                      size="small"
                      icon={<CalendarTodayIcon fontSize="small" />}
                      onDelete={() => handleDateFilterChange(field.field, undefined)}
                      data-testid={`active-date-filter-chip-${field.field}`}
                    />
                  );
                }
              }
              
              return null;
            })}
          </Box>
        )}
      </Popover>
    </>
  );
}

export default AdvancedFilterPanel;
