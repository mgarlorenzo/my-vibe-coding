import React from 'react';
import { Box, IconButton, Typography, Chip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { GroupNode, Density, AggregationType, GridColumn } from '../types';

// ============================================================================
// Types
// ============================================================================

interface GridGroupRowProps<T> {
  group: GroupNode<T>;
  columns: GridColumn<T>[];
  columnWidths: Record<string, number>;
  density: Density;
  checkboxSelection?: boolean;
  onToggleExpand: () => void;
  style?: React.CSSProperties;
}

// ============================================================================
// Constants
// ============================================================================

const DENSITY_HEIGHTS: Record<Density, number> = {
  compact: 36,
  standard: 48,
  comfortable: 56,
};

const INDENT_WIDTH = 24;

// ============================================================================
// Helper Functions
// ============================================================================

function formatAggregation(value: number, type: AggregationType): string {
  switch (type) {
    case 'count':
      return `Count: ${value}`;
    case 'sum':
      return `Sum: ${value.toLocaleString()}`;
    case 'avg':
      return `Avg: ${value.toFixed(2)}`;
    case 'min':
      return `Min: ${value.toLocaleString()}`;
    case 'max':
      return `Max: ${value.toLocaleString()}`;
    default:
      return `${type}: ${value}`;
  }
}

// ============================================================================
// Grid Group Row Component
// ============================================================================

export function GridGroupRow<T>({
  group,
  columns,
  // columnWidths - reserved for future column-aligned aggregations
  density,
  checkboxSelection,
  onToggleExpand,
  style,
}: GridGroupRowProps<T>) {
  const indent = group.depth * INDENT_WIDTH;
  const column = columns.find(c => c.field === group.field);
  const fieldLabel = column?.headerName || group.field;
  
  // Format the group value
  const formatGroupValue = (value: unknown): string => {
    if (value == null) return '(Empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  // Get aggregations to display
  const aggregationChips: React.ReactNode[] = [];
  Object.entries(group.aggregations).forEach(([field, aggs]) => {
    const col = columns.find(c => c.field === field);
    const fieldName = col?.headerName || field;
    
    Object.entries(aggs).forEach(([type, value]) => {
      aggregationChips.push(
        <Chip
          key={`${field}-${type}`}
          label={`${fieldName}: ${formatAggregation(value, type as AggregationType)}`}
          size="small"
          variant="outlined"
          sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
        />
      );
    });
  });

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'grey.50',
        minHeight: DENSITY_HEIGHTS[density],
        pl: checkboxSelection ? `${48 + indent}px` : `${indent}px`,
        pr: 2,
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'grey.100',
        },
      }}
      style={style}
      onClick={onToggleExpand}
      role="row"
      aria-expanded={group.isExpanded}
    >
      <IconButton
        size="small"
        sx={{ mr: 1 }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
      >
        {group.isExpanded ? (
          <ExpandMoreIcon fontSize="small" />
        ) : (
          <ChevronRightIcon fontSize="small" />
        )}
      </IconButton>
      
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          mr: 1,
        }}
      >
        {fieldLabel}:
      </Typography>
      
      <Typography
        variant="body2"
        sx={{ mr: 1 }}
      >
        {formatGroupValue(group.value)}
      </Typography>
      
      <Chip
        label={`${group.childCount} ${group.childCount === 1 ? 'item' : 'items'}`}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ height: 20, fontSize: '0.75rem' }}
      />
      
      <Box sx={{ flex: 1 }} />
      
      {aggregationChips}
    </Box>
  );
}
