import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Select,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Chip,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FilterItem, FilterModel } from '../types';

// ============================================================================
// Types
// ============================================================================

export type FilterOperator = 
  // String operators
  | 'contains' 
  | 'equals' 
  | 'startsWith' 
  | 'endsWith' 
  | 'isEmpty' 
  | 'isNotEmpty'
  // Number/Date operators
  | 'eq'
  | 'neq'
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte'
  // Boolean operators
  | 'is';

export interface FieldDefinition {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

interface FilterPanelProps {
  fields: FieldDefinition[];
  filterModel: FilterModel;
  onFilterModelChange: (model: FilterModel) => void;
}

// ============================================================================
// Operator Labels
// ============================================================================

const STRING_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'contains' },
  { value: 'equals', label: 'equals' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];

const BOOLEAN_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'is', label: 'is' },
  { value: 'isEmpty', label: 'is empty' },
];

function getOperatorsForType(type: string): { value: FilterOperator; label: string }[] {
  switch (type) {
    case 'number':
    case 'date':
      return NUMBER_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
}

// ============================================================================
// Filter Row Component
// ============================================================================

interface FilterRowProps {
  filter: FilterItem;
  index: number;
  fields: FieldDefinition[];
  onUpdate: (index: number, filter: FilterItem) => void;
  onRemove: (index: number) => void;
}

function FilterRow({ filter, index, fields, onUpdate, onRemove }: FilterRowProps) {
  const selectedField = fields.find(f => f.field === filter.field);
  const operators = selectedField ? getOperatorsForType(selectedField.type) : STRING_OPERATORS;
  const needsValue = !['isEmpty', 'isNotEmpty'].includes(filter.operator);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
      {/* Field selector */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Field</InputLabel>
        <Select
          value={filter.field}
          label="Field"
          onChange={(e) => onUpdate(index, { ...filter, field: e.target.value })}
        >
          {fields.map(f => (
            <MenuItem key={f.field} value={f.field}>
              {f.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Operator selector */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Operator</InputLabel>
        <Select
          value={filter.operator}
          label="Operator"
          onChange={(e) => onUpdate(index, { ...filter, operator: e.target.value as FilterItem['operator'] })}
        >
          {operators.map(op => (
            <MenuItem key={op.value} value={op.value}>
              {op.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Value input */}
      {needsValue && (
        <TextField
          size="small"
          placeholder="Value"
          value={filter.value ?? ''}
          onChange={(e) => onUpdate(index, { ...filter, value: e.target.value })}
          sx={{ minWidth: 150 }}
        />
      )}

      {/* Remove button */}
      <IconButton size="small" onClick={() => onRemove(index)} color="error">
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}

// ============================================================================
// Filter Panel Component
// ============================================================================

export function FilterPanel({ fields, filterModel, onFilterModelChange }: FilterPanelProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAddFilter = () => {
    const newFilter: FilterItem = {
      field: fields[0]?.field || '',
      operator: 'contains',
      value: '',
    };
    onFilterModelChange({
      ...filterModel,
      items: [...filterModel.items, newFilter],
    });
  };

  const handleUpdateFilter = (index: number, filter: FilterItem) => {
    const newItems = [...filterModel.items];
    newItems[index] = filter;
    onFilterModelChange({
      ...filterModel,
      items: newItems,
    });
  };

  const handleRemoveFilter = (index: number) => {
    onFilterModelChange({
      ...filterModel,
      items: filterModel.items.filter((_, i) => i !== index),
    });
  };

  const handleClearAll = () => {
    onFilterModelChange({
      ...filterModel,
      items: [],
    });
    setAnchorEl(null);
  };

  const activeFiltersCount = filterModel.items.length;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FilterListIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        data-testid="filters-button"
        sx={{
          position: 'relative',
        }}
      >
        Filters
        {activeFiltersCount > 0 && (
          <Chip
            label={activeFiltersCount}
            size="small"
            color="primary"
            sx={{
              ml: 1,
              height: 20,
              minWidth: 20,
              fontSize: '0.75rem',
            }}
          />
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { minWidth: 500, maxWidth: 600, p: 2 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Button size="small" onClick={handleClearAll} color="error">
              Clear all
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {filterModel.items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No filters applied. Click "Add filter" to create one.
          </Typography>
        ) : (
          <Box sx={{ mb: 2 }}>
            {filterModel.items.map((filter, index) => (
              <FilterRow
                key={index}
                filter={filter}
                index={index}
                fields={fields}
                onUpdate={handleUpdateFilter}
                onRemove={handleRemoveFilter}
              />
            ))}
          </Box>
        )}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddFilter}
          size="small"
          data-testid="add-filter-button"
        >
          Add filter
        </Button>
      </Menu>
    </>
  );
}

export default FilterPanel;
