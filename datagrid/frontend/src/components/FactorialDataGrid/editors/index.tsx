import React, { useRef, useEffect, useState, KeyboardEvent } from 'react';
import {
  TextField,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  FormHelperText,
  Box,
} from '@mui/material';
import { EditCellRenderParams, GridColumn } from '../types';

// ============================================================================
// Base Editor Props
// ============================================================================

interface BaseEditorProps<T> {
  params: EditCellRenderParams<T>;
  autoFocus?: boolean;
}

// ============================================================================
// Text Editor
// ============================================================================

export function TextEditor<T>({ params, autoFocus = true }: BaseEditorProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, onChange, onCommit, onCancel, error } = params;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      onCommit();
    }
  };

  return (
    <TextField
      inputRef={inputRef}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
      error={!!error}
      helperText={error}
      size="small"
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': {
          fontSize: 'inherit',
          height: '100%',
        },
        '& .MuiInputBase-input': {
          padding: '4px 8px',
        },
      }}
    />
  );
}

// ============================================================================
// Number Editor
// ============================================================================

export function NumberEditor<T>({ params, autoFocus = true }: BaseEditorProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, onChange, onCommit, onCancel, error } = params;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      onCommit();
    }
  };

  return (
    <TextField
      inputRef={inputRef}
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
      error={!!error}
      helperText={error}
      size="small"
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiInputBase-root': {
          fontSize: 'inherit',
          height: '100%',
        },
        '& .MuiInputBase-input': {
          padding: '4px 8px',
        },
      }}
    />
  );
}

// ============================================================================
// Date Editor
// ============================================================================

export function DateEditor<T>({ params, autoFocus = true }: BaseEditorProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, onChange, onCommit, onCancel, error } = params;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      onCommit();
    }
  };

  // Format date for input
  const formatDateForInput = (val: unknown): string => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return '';
  };

  return (
    <TextField
      inputRef={inputRef}
      type="date"
      value={formatDateForInput(value)}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
      error={!!error}
      helperText={error}
      size="small"
      fullWidth
      variant="outlined"
      InputLabelProps={{ shrink: true }}
      sx={{
        '& .MuiInputBase-root': {
          fontSize: 'inherit',
          height: '100%',
        },
        '& .MuiInputBase-input': {
          padding: '4px 8px',
        },
      }}
    />
  );
}

// ============================================================================
// DateTime Editor
// ============================================================================

export function DateTimeEditor<T>({ params, autoFocus = true }: BaseEditorProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { value, onChange, onCommit, onCancel, error } = params;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    } else if (e.key === 'Tab') {
      onCommit();
    }
  };

  // Format datetime for input
  const formatDateTimeForInput = (val: unknown): string => {
    if (!val) return '';
    if (val instanceof Date) {
      return val.toISOString().slice(0, 16);
    }
    if (typeof val === 'string') {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 16);
      }
    }
    return '';
  };

  return (
    <TextField
      inputRef={inputRef}
      type="datetime-local"
      value={formatDateTimeForInput(value)}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
      onKeyDown={handleKeyDown}
      onBlur={onCommit}
      error={!!error}
      helperText={error}
      size="small"
      fullWidth
      variant="outlined"
      InputLabelProps={{ shrink: true }}
      sx={{
        '& .MuiInputBase-root': {
          fontSize: 'inherit',
          height: '100%',
        },
        '& .MuiInputBase-input': {
          padding: '4px 8px',
        },
      }}
    />
  );
}

// ============================================================================
// Boolean Editor
// ============================================================================

export function BooleanEditor<T>({ params }: BaseEditorProps<T>) {
  const { value, onChange, onCommit, error } = params;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
    // Auto-commit for boolean
    setTimeout(onCommit, 0);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', px: 1 }}>
      <Checkbox
        checked={!!value}
        onChange={handleChange}
        size="small"
      />
      {error && (
        <FormHelperText error>{error}</FormHelperText>
      )}
    </Box>
  );
}

// ============================================================================
// Select Editor
// ============================================================================

interface SelectEditorProps<T> extends BaseEditorProps<T> {
  options: Array<{ value: unknown; label: string }>;
}

export function SelectEditor<T>({ params, options, autoFocus = true }: SelectEditorProps<T>) {
  const { value, onChange, onCommit, onCancel, error } = params;
  const [open, setOpen] = useState(autoFocus);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleChange = (newValue: unknown) => {
    onChange(newValue);
    setTimeout(onCommit, 0);
  };

  return (
    <FormControl fullWidth size="small" error={!!error}>
      <Select
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          onCommit();
        }}
        autoFocus={autoFocus}
        sx={{
          fontSize: 'inherit',
          '& .MuiSelect-select': {
            padding: '4px 8px',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem key={String(option.value)} value={option.value as string}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

// ============================================================================
// Editor Factory
// ============================================================================

export function getDefaultEditor<T>(column: GridColumn<T>) {
  switch (column.type) {
    case 'number':
      return NumberEditor;
    case 'date':
      return DateEditor;
    case 'datetime':
      return DateTimeEditor;
    case 'boolean':
      return BooleanEditor;
    case 'singleSelect':
      // SelectEditor requires options, handled separately in renderEditor
      return TextEditor;
    case 'string':
    default:
      return TextEditor;
  }
}

export function renderEditor<T>(
  params: EditCellRenderParams<T>,
  column: GridColumn<T>
): React.ReactNode {
  // Use custom editor if provided
  if (column.renderEditCell) {
    return column.renderEditCell(params);
  }

  // Handle singleSelect type
  if (column.type === 'singleSelect') {
    const options = typeof column.valueOptions === 'function'
      ? column.valueOptions(params.row)
      : column.valueOptions || [];
    return <SelectEditor params={params} options={options} />;
  }

  // Use default editor based on type
  const Editor = getDefaultEditor(column);
  return <Editor params={params} />;
}
