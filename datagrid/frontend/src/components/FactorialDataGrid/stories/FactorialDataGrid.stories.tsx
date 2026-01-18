import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback, useEffect } from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { FactorialDataGrid } from '../FactorialDataGrid';
import { GridColumn } from '../types';

// ============================================================================
// Sample Data Types
// ============================================================================

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  salary: number;
  startDate: string;
  active: boolean;
  country: string;
}

// ============================================================================
// Sample Data
// ============================================================================

const sampleEmployees: Employee[] = [
  { id: 1, firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', department: 'Engineering', salary: 95000, startDate: '2020-01-15', active: true, country: 'USA' },
  { id: 2, firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', department: 'Engineering', salary: 85000, startDate: '2021-03-20', active: true, country: 'USA' },
  { id: 3, firstName: 'Carol', lastName: 'Williams', email: 'carol@example.com', department: 'Marketing', salary: 75000, startDate: '2019-06-10', active: true, country: 'UK' },
  { id: 4, firstName: 'David', lastName: 'Brown', email: 'david@example.com', department: 'Marketing', salary: 70000, startDate: '2018-11-05', active: false, country: 'UK' },
  { id: 5, firstName: 'Eve', lastName: 'Davis', email: 'eve@example.com', department: 'Sales', salary: 80000, startDate: '2022-02-28', active: true, country: 'Germany' },
  { id: 6, firstName: 'Frank', lastName: 'Miller', email: 'frank@example.com', department: 'Sales', salary: 72000, startDate: '2021-07-15', active: true, country: 'France' },
  { id: 7, firstName: 'Grace', lastName: 'Wilson', email: 'grace@example.com', department: 'HR', salary: 68000, startDate: '2020-09-01', active: true, country: 'Spain' },
  { id: 8, firstName: 'Henry', lastName: 'Moore', email: 'henry@example.com', department: 'HR', salary: 65000, startDate: '2019-04-22', active: true, country: 'Italy' },
  { id: 9, firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@example.com', department: 'Engineering', salary: 92000, startDate: '2021-01-10', active: true, country: 'USA' },
  { id: 10, firstName: 'Jack', lastName: 'Anderson', email: 'jack@example.com', department: 'Engineering', salary: 88000, startDate: '2020-08-15', active: false, country: 'Canada' },
  { id: 11, firstName: 'Karen', lastName: 'Thomas', email: 'karen@example.com', department: 'Finance', salary: 78000, startDate: '2019-12-01', active: true, country: 'USA' },
  { id: 12, firstName: 'Leo', lastName: 'Jackson', email: 'leo@example.com', department: 'Finance', salary: 82000, startDate: '2020-05-20', active: true, country: 'UK' },
];

// ============================================================================
// Column Definitions
// ============================================================================

const basicColumns: GridColumn<Employee>[] = [
  { field: 'id', headerName: 'ID', width: 70, type: 'number' },
  { field: 'firstName', headerName: 'First Name', width: 130, editable: true },
  { field: 'lastName', headerName: 'Last Name', width: 130, editable: true },
  { field: 'email', headerName: 'Email', width: 200, editable: true },
  { field: 'department', headerName: 'Department', width: 120 },
  { field: 'salary', headerName: 'Salary', width: 100, type: 'number', editable: true },
];

const fullColumns: GridColumn<Employee>[] = [
  { field: 'id', headerName: 'ID', width: 70, type: 'number' },
  { field: 'firstName', headerName: 'First Name', width: 130, editable: true },
  { field: 'lastName', headerName: 'Last Name', width: 130, editable: true },
  { field: 'email', headerName: 'Email', width: 200, editable: true },
  { 
    field: 'department', 
    headerName: 'Department', 
    width: 120,
    editable: true,
    type: 'singleSelect',
    valueOptions: [
      { value: 'Engineering', label: 'Engineering' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'Sales', label: 'Sales' },
      { value: 'HR', label: 'HR' },
      { value: 'Finance', label: 'Finance' },
    ],
    aggregations: ['count'],
  },
  { 
    field: 'salary', 
    headerName: 'Salary', 
    width: 120, 
    type: 'number', 
    editable: true,
    valueFormatter: (value) => `$${Number(value).toLocaleString()}`,
    aggregations: ['sum', 'avg', 'min', 'max'],
  },
  { 
    field: 'startDate', 
    headerName: 'Start Date', 
    width: 120, 
    type: 'date',
    editable: true,
    valueFormatter: (value) => new Date(value as string).toLocaleDateString(),
  },
  { 
    field: 'active', 
    headerName: 'Status', 
    width: 100,
    renderCell: ({ value }) => (
      <Chip 
        label={value ? 'Active' : 'Inactive'} 
        color={value ? 'success' : 'error'} 
        size="small" 
        variant="outlined"
      />
    ),
  },
  { 
    field: 'country', 
    headerName: 'Country', 
    width: 100,
    aggregations: ['count'],
  },
];

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof FactorialDataGrid<Employee>> = {
  title: 'Components/FactorialDataGrid',
  component: FactorialDataGrid,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# FactorialDataGrid

A custom data grid component built from scratch with the following features:

- **Virtualized rendering** for handling large datasets efficiently
- **Inline cell editing** with validation support
- **Sorting** by clicking column headers
- **Filtering** with quick filter and column filters
- **Grouping** with drag & drop reordering and aggregations
- **Selection** with checkbox support
- **Keyboard navigation** for accessibility
- **Real-time updates** via GraphQL subscriptions
- **Customizable** with custom cell renderers and editors
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    density: {
      control: 'select',
      options: ['compact', 'standard', 'comfortable'],
      description: 'Row density',
    },
    checkboxSelection: {
      control: 'boolean',
      description: 'Enable checkbox selection',
    },
    pagination: {
      control: 'boolean',
      description: 'Enable pagination',
    },
    showToolbar: {
      control: 'boolean',
      description: 'Show toolbar',
    },
    showQuickFilter: {
      control: 'boolean',
      description: 'Show quick filter in toolbar',
    },
    showColumnSelector: {
      control: 'boolean',
      description: 'Show column selector in toolbar',
    },
    showDensitySelector: {
      control: 'boolean',
      description: 'Show density selector in toolbar',
    },
    showGroupingPanel: {
      control: 'boolean',
      description: 'Show grouping panel in toolbar',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FactorialDataGrid<Employee>>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Basic usage with minimal configuration
 */
export const Basic: Story = {
  args: {
    rows: sampleEmployees,
    columns: basicColumns,
    getRowId: (row) => row.id,
    showToolbar: false,
    pagination: false,
  },
  render: (args) => (
    <Box sx={{ height: 500 }}>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Full-featured grid with all options enabled
 */
export const FullFeatured: Story = {
  args: {
    rows: sampleEmployees,
    columns: fullColumns,
    getRowId: (row) => row.id,
    checkboxSelection: true,
    pagination: true,
    pageSizeOptions: [5, 10, 25],
    showToolbar: true,
    showQuickFilter: true,
    showColumnSelector: true,
    showDensitySelector: true,
    showGroupingPanel: true,
    density: 'standard',
  },
  render: (args) => (
    <Box sx={{ height: 600 }}>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Inline editing with processRowUpdate callback
 */
export const InlineEditing: Story = {
  render: () => {
    const [rows, setRows] = useState(sampleEmployees);
    const [lastEdit, setLastEdit] = useState<string | null>(null);

    const handleProcessRowUpdate = useCallback(async (newRow: Employee, oldRow: Employee) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRows(prev => prev.map(row => row.id === newRow.id ? newRow : row));
      setLastEdit(`Updated ${oldRow.firstName} ${oldRow.lastName}`);
      
      return newRow;
    }, []);

    return (
      <Box sx={{ height: 600 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Double-click on a cell to edit. Press Enter to save, Escape to cancel.
          {lastEdit && <strong> Last edit: {lastEdit}</strong>}
        </Typography>
        <FactorialDataGrid
          rows={rows}
          columns={fullColumns}
          getRowId={(row) => row.id}
          processRowUpdate={handleProcessRowUpdate}
          showToolbar
          showQuickFilter
        />
      </Box>
    );
  },
};

/**
 * Grouping by a single field with aggregations
 */
export const GroupBySingleField: Story = {
  args: {
    rows: sampleEmployees,
    columns: fullColumns,
    getRowId: (row) => row.id,
    showToolbar: true,
    showGroupingPanel: true,
    groupingModel: {
      fields: ['department'],
      expanded: {
        'department:Engineering': true,
        'department:Marketing': true,
        'department:Sales': true,
        'department:HR': true,
        'department:Finance': true,
      },
    },
    aggregationModel: {
      salary: ['sum', 'avg'],
    },
  },
  render: (args) => (
    <Box sx={{ height: 600 }}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Rows are grouped by Department. Each group shows salary aggregations (sum and average).
      </Typography>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Nested grouping by multiple fields
 */
export const GroupByMultipleFields: Story = {
  args: {
    rows: sampleEmployees,
    columns: fullColumns,
    getRowId: (row) => row.id,
    showToolbar: true,
    showGroupingPanel: true,
    groupingModel: {
      fields: ['department', 'country'],
      expanded: {
        'department:Engineering': true,
        'department:Marketing': true,
      },
    },
    aggregationModel: {
      salary: ['sum', 'count'],
    },
  },
  render: (args) => (
    <Box sx={{ height: 600 }}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Rows are grouped by Department, then by Country. Drag chips in the toolbar to reorder grouping.
      </Typography>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Real-time subscription updates simulation
 */
export const SubscriptionUpdates: Story = {
  render: () => {
    const [rows, setRows] = useState(sampleEmployees);
    const [events, setEvents] = useState<string[]>([]);

    // Simulate subscription events
    useEffect(() => {
      const interval = setInterval(() => {
        const eventTypes = ['UPDATED', 'CREATED'] as const;
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        if (eventType === 'UPDATED') {
          const randomIndex = Math.floor(Math.random() * rows.length);
          const employee = rows[randomIndex];
          const newSalary = employee.salary + Math.floor(Math.random() * 5000) - 2500;
          
          setRows(prev => prev.map((row, i) => 
            i === randomIndex ? { ...row, salary: Math.max(50000, newSalary) } : row
          ));
          setEvents(prev => [`UPDATED: ${employee.firstName}'s salary changed to $${newSalary.toLocaleString()}`, ...prev.slice(0, 4)]);
        } else {
          const newId = Math.max(...rows.map(r => r.id)) + 1;
          const newEmployee: Employee = {
            id: newId,
            firstName: `New${newId}`,
            lastName: 'Employee',
            email: `new${newId}@example.com`,
            department: ['Engineering', 'Marketing', 'Sales'][Math.floor(Math.random() * 3)],
            salary: 60000 + Math.floor(Math.random() * 30000),
            startDate: new Date().toISOString().split('T')[0],
            active: true,
            country: 'USA',
          };
          setRows(prev => [...prev, newEmployee]);
          setEvents(prev => [`CREATED: ${newEmployee.firstName} ${newEmployee.lastName} joined`, ...prev.slice(0, 4)]);
        }
      }, 3000);

      return () => clearInterval(interval);
    }, [rows]);

    return (
      <Box sx={{ height: 600 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            Simulating real-time updates every 3 seconds:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {events.map((event, i) => (
              <Chip key={i} label={event} size="small" color={event.startsWith('CREATED') ? 'success' : 'info'} />
            ))}
          </Box>
        </Box>
        <FactorialDataGrid
          rows={rows}
          columns={fullColumns}
          getRowId={(row) => row.id}
          showToolbar
          showQuickFilter
          checkboxSelection
        />
      </Box>
    );
  },
};

/**
 * Server-side mode simulation
 */
export const ServerMode: Story = {
  render: () => {
    const [rows, setRows] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [sortModel, setSortModel] = useState<{ field: string; direction: 'asc' | 'desc' }[]>([]);

    // Simulate server fetch
    useEffect(() => {
      setLoading(true);
      
      const timer = setTimeout(() => {
        let data = [...sampleEmployees];
        
        // Apply sorting
        if (sortModel.length > 0) {
          const { field, direction } = sortModel[0];
          data.sort((a, b) => {
            const aVal = a[field as keyof Employee];
            const bVal = b[field as keyof Employee];
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return direction === 'desc' ? -cmp : cmp;
          });
        }
        
        // Apply pagination
        const start = page * pageSize;
        const paginatedData = data.slice(start, start + pageSize);
        
        setRows(paginatedData);
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }, [page, pageSize, sortModel]);

    return (
      <Box sx={{ height: 500 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Server-side pagination and sorting. Data is fetched on each page/sort change.
        </Typography>
        <FactorialDataGrid
          rows={rows}
          columns={basicColumns}
          getRowId={(row) => row.id}
          loading={loading}
          mode="server"
          pagination
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          rowCount={sampleEmployees.length}
          pageSizeOptions={[5, 10]}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          showToolbar
        />
      </Box>
    );
  },
};

/**
 * Different density options
 */
export const DensityOptions: Story = {
  render: () => {
    const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard');

    return (
      <Box sx={{ height: 500 }}>
        <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
          <Button 
            variant={density === 'compact' ? 'contained' : 'outlined'} 
            onClick={() => setDensity('compact')}
            size="small"
          >
            Compact
          </Button>
          <Button 
            variant={density === 'standard' ? 'contained' : 'outlined'} 
            onClick={() => setDensity('standard')}
            size="small"
          >
            Standard
          </Button>
          <Button 
            variant={density === 'comfortable' ? 'contained' : 'outlined'} 
            onClick={() => setDensity('comfortable')}
            size="small"
          >
            Comfortable
          </Button>
        </Box>
        <FactorialDataGrid
          rows={sampleEmployees}
          columns={basicColumns}
          getRowId={(row) => row.id}
          density={density}
          showToolbar={false}
        />
      </Box>
    );
  },
};

/**
 * Custom cell renderers
 */
export const CustomRenderers: Story = {
  render: () => {
    const columnsWithCustomRenderers: GridColumn<Employee>[] = [
      { field: 'id', headerName: 'ID', width: 70 },
      { 
        field: 'firstName', 
        headerName: 'Name', 
        width: 200,
        renderCell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {row.firstName[0]}{row.lastName[0]}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {row.firstName} {row.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.email}
              </Typography>
            </Box>
          </Box>
        ),
      },
      { 
        field: 'department', 
        headerName: 'Department', 
        width: 130,
        renderCell: ({ value }) => (
          <Chip 
            label={value as string} 
            size="small" 
            color={
              value === 'Engineering' ? 'primary' :
              value === 'Marketing' ? 'secondary' :
              value === 'Sales' ? 'success' :
              value === 'HR' ? 'warning' : 'default'
            }
          />
        ),
      },
      { 
        field: 'salary', 
        headerName: 'Salary', 
        width: 150,
        renderCell: ({ value }) => {
          const salary = value as number;
          const color = salary >= 90000 ? 'success.main' : salary >= 75000 ? 'warning.main' : 'text.primary';
          return (
            <Typography variant="body2" sx={{ color, fontWeight: 600 }}>
              ${salary.toLocaleString()}
            </Typography>
          );
        },
      },
      { 
        field: 'active', 
        headerName: 'Status', 
        width: 100,
        renderCell: ({ value }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: value ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2">
              {value ? 'Active' : 'Inactive'}
            </Typography>
          </Box>
        ),
      },
    ];

    return (
      <Box sx={{ height: 500 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Custom cell renderers for enhanced visual presentation.
        </Typography>
        <FactorialDataGrid
          rows={sampleEmployees}
          columns={columnsWithCustomRenderers}
          getRowId={(row) => row.id}
          showToolbar
          showQuickFilter
        />
      </Box>
    );
  },
};

/**
 * Empty state
 */
export const EmptyState: Story = {
  args: {
    rows: [],
    columns: basicColumns,
    getRowId: (row) => row.id,
    showToolbar: true,
  },
  render: (args) => (
    <Box sx={{ height: 400 }}>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Loading state
 */
export const LoadingState: Story = {
  args: {
    rows: [],
    columns: basicColumns,
    getRowId: (row) => row.id,
    loading: true,
    showToolbar: true,
  },
  render: (args) => (
    <Box sx={{ height: 400 }}>
      <FactorialDataGrid {...args} />
    </Box>
  ),
};

/**
 * Large dataset with virtualization
 */
export const LargeDataset: Story = {
  render: () => {
    // Generate 1000 rows
    const largeDataset: Employee[] = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      firstName: `First${i + 1}`,
      lastName: `Last${i + 1}`,
      email: `employee${i + 1}@example.com`,
      department: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'][i % 5],
      salary: 50000 + Math.floor(Math.random() * 50000),
      startDate: new Date(2018 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      active: Math.random() > 0.2,
      country: ['USA', 'UK', 'Germany', 'France', 'Spain'][i % 5],
    }));

    return (
      <Box sx={{ height: 600 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          1,000 rows with virtualized rendering. Scroll to see smooth performance.
        </Typography>
        <FactorialDataGrid
          rows={largeDataset}
          columns={fullColumns}
          getRowId={(row) => row.id}
          showToolbar
          showQuickFilter
          pagination
          pageSizeOptions={[25, 50, 100]}
        />
      </Box>
    );
  },
};

/**
 * With toolbar actions
 */
export const WithToolbarActions: Story = {
  render: () => {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    const toolbarActions = (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" color="primary" size="small">
          Add Employee
        </Button>
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          disabled={selectedIds.size === 0}
        >
          Delete ({selectedIds.size})
        </Button>
        <Button variant="outlined" size="small">
          Export
        </Button>
      </Box>
    );

    return (
      <Box sx={{ height: 500 }}>
        <FactorialDataGrid
          rows={sampleEmployees}
          columns={basicColumns}
          getRowId={(row) => row.id}
          checkboxSelection
          showToolbar
          showQuickFilter
          toolbarActions={toolbarActions}
          onSelectionModelChange={(model) => setSelectedIds(model.selectedIds as Set<number>)}
        />
      </Box>
    );
  },
};
