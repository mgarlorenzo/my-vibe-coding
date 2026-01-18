import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Button, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import { useSubscription } from '@apollo/client';
import { FactorialDataGrid, GridColumn, SubscriptionEvent } from './FactorialDataGrid';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee, EmployeeFilter, EmployeePaging, EmployeeSorting } from '../types/employee';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { TerminateDialog } from './TerminateDialog';
import { EmployeeDetailPanel } from './EmployeeDetailPanel';
import { EMPLOYEE_CHANGED_SUBSCRIPTION } from '../graphql/queries';

// ============================================================================
// Column Definitions
// ============================================================================

interface ColumnCallbacks {
  onViewDetails: (employee: Employee) => void;
  onTerminate: (employee: Employee) => void;
  onUnterminate: (employee: Employee) => void;
}

export function createColumns(callbacks: ColumnCallbacks): GridColumn<Employee>[] {
  return [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      type: 'number',
      editable: false,
      aggregations: ['count', 'min', 'max'],
    },
    {
      field: 'companyId',
      headerName: 'Company',
      width: 100,
      type: 'number',
      editable: true,
      aggregations: ['count', 'sum', 'avg', 'min', 'max'],
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 150,
      flex: 1,
      type: 'string',
      editable: true,
      aggregations: ['count'],
      validate: (value) => {
        if (!value || String(value).trim() === '') {
          return 'First name is required';
        }
        return null;
      },
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 150,
      flex: 1,
      type: 'string',
      editable: true,
      aggregations: ['count'],
      validate: (value) => {
        if (!value || String(value).trim() === '') {
          return 'Last name is required';
        }
        return null;
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      flex: 1,
      type: 'string',
      editable: true,
      validate: (value) => {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          return 'Invalid email format';
        }
        return null;
      },
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
      type: 'singleSelect',
      editable: true,
      valueOptions: [
        { value: 'Spain', label: 'Spain' },
        { value: 'United Kingdom', label: 'United Kingdom' },
        { value: 'France', label: 'France' },
        { value: 'Germany', label: 'Germany' },
        { value: 'Italy', label: 'Italy' },
        { value: 'Portugal', label: 'Portugal' },
        { value: 'Netherlands', label: 'Netherlands' },
        { value: 'Belgium', label: 'Belgium' },
        { value: 'United States', label: 'United States' },
        { value: 'Canada', label: 'Canada' },
      ],
      aggregations: ['count'],
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 130,
      type: 'date',
      editable: true,
      valueFormatter: (value) => {
        if (!value) return '-';
        try {
          return new Date(value as string).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } catch {
          return '-';
        }
      },
    },
    {
      field: 'terminationDate',
      headerName: 'Status',
      width: 130,
      editable: false,
      renderCell: ({ value }) => {
        if (value) {
          return (
            <Chip
              label="Terminated"
              size="small"
              color="error"
              variant="outlined"
            />
          );
        }
        return (
          <Chip
            label="Active"
            size="small"
            color="success"
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      width: 160,
      editable: false,
      valueFormatter: (value) => {
        if (!value) return '-';
        try {
          return new Date(value as string).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return '-';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      type: 'custom',
      editable: false,
      sortable: false,
      filterable: false,
      disableHiding: true,
      disableReorder: true,
      renderCell: ({ row }) => {
        const isTerminated = !!row.terminationDate;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  callbacks.onViewDetails(row);
                }}
                data-testid={`view-details-${row.id}`}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isTerminated ? (
              <Tooltip title="Reactivate Employee">
                <IconButton
                  size="small"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    callbacks.onUnterminate(row);
                  }}
                  data-testid={`unterminate-${row.id}`}
                >
                  <PersonIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Terminate Employee">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    callbacks.onTerminate(row);
                  }}
                  data-testid={`terminate-${row.id}`}
                >
                  <PersonOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];
}

// ============================================================================
// Main Component
// ============================================================================

export function EmployeeFactorialGrid() {
  // State for dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Query state
  const [filter] = useState<EmployeeFilter>({ includeTerminated: true });
  const [paging] = useState<EmployeePaging>({ offset: 0, limit: 100 });
  const [sorting] = useState<EmployeeSorting>({ field: 'id', direction: 'ASC' });

  // Fetch employees
  const {
    employees,
    loading,
    createEmployee,
    updateEmployee,
    terminateEmployee,
    unterminateEmployee,
    creating,
    updating,
    terminating,
    unterminating,
  } = useEmployees({ filter, paging, sorting });

  // Local state for real-time updates
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);

  // Sync employees from server
  useEffect(() => {
    setLocalEmployees(employees);
  }, [employees]);

  // Subscribe to changes
  useSubscription(EMPLOYEE_CHANGED_SUBSCRIPTION, {
    onData: ({ data }) => {
      console.log('[Subscription] Received event:', data.data?.employeeChanged);
      if (data.data?.employeeChanged) {
        const event = data.data.employeeChanged;
        const subscriptionEvent: SubscriptionEvent<Employee> = {
          type: event.eventType,
          id: event.employee.id,
          row: event.employee,
        };

        setLocalEmployees(prev => {
          switch (subscriptionEvent.type) {
            case 'CREATED':
              // Check if already exists
              if (prev.some(e => e.id === subscriptionEvent.id)) {
                return prev.map(e => e.id === subscriptionEvent.id ? subscriptionEvent.row! : e);
              }
              return [...prev, subscriptionEvent.row!];
            case 'UPDATED':
            case 'UNTERMINATED':
              return prev.map(e => e.id === subscriptionEvent.id ? subscriptionEvent.row! : e);
            case 'TERMINATED':
            case 'DELETED':
              return prev.map(e => e.id === subscriptionEvent.id ? subscriptionEvent.row! : e);
            default:
              console.warn('[Subscription] Unknown event type:', subscriptionEvent.type);
              return prev;
          }
        });
      }
    },
    onError: (error) => {
      console.error('[Subscription] Error:', error);
    },
  });

  // Handle add click
  const handleAddClick = useCallback(() => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setFormDialogOpen(true);
  }, []);

  // Handle row double click to view details
  const handleRowDoubleClick = useCallback((row: Employee) => {
    setSelectedEmployee(row);
    setDetailPanelOpen(true);
  }, []);

  // Handle inline edit
  const handleProcessRowUpdate = useCallback(async (newRow: Employee, oldRow: Employee): Promise<Employee> => {
    try {
      const result = await updateEmployee(oldRow.id, {
        firstName: newRow.firstName ?? undefined,
        lastName: newRow.lastName ?? undefined,
        email: newRow.email ?? undefined,
        country: newRow.country ?? undefined,
        companyId: newRow.companyId,
        startDate: newRow.startDate ?? undefined,
      });
      return result;
    } catch (error) {
      console.error('Failed to update employee:', error);
      throw error;
    }
  }, [updateEmployee]);

  // Handle form submit
  const handleFormSubmit = useCallback(async (data: Partial<Employee>) => {
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        cleanData[key] = value;
      }
    }

    if (isEditing && selectedEmployee) {
      await updateEmployee(selectedEmployee.id, cleanData);
    } else {
      await createEmployee({
        companyId: (cleanData.companyId as number) || 1,
        ...cleanData,
      } as Parameters<typeof createEmployee>[0]);
    }
    setFormDialogOpen(false);
  }, [isEditing, selectedEmployee, createEmployee, updateEmployee]);

  // Handle terminate submit
  const handleTerminateSubmit = useCallback(async (data: {
    terminationReason?: string;
    terminationReasonType?: string;
    terminationObservations?: string;
  }) => {
    if (selectedEmployee) {
      await terminateEmployee(selectedEmployee.id, {
        terminationDate: new Date().toISOString(),
        ...data,
      });
    }
    setTerminateDialogOpen(false);
  }, [selectedEmployee, terminateEmployee]);

  // Handle view details from action button
  const handleViewDetails = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailPanelOpen(true);
  }, []);

  // Handle terminate from action button
  const handleTerminateClick = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setTerminateDialogOpen(true);
  }, []);

  // Handle unterminate from action button
  const handleUnterminateClick = useCallback(async (employee: Employee) => {
    await unterminateEmployee(employee.id, new Date().toISOString());
  }, [unterminateEmployee]);

  // Create columns with action callbacks
  const columns = useMemo(() => createColumns({
    onViewDetails: handleViewDetails,
    onTerminate: handleTerminateClick,
    onUnterminate: handleUnterminateClick,
  }), [handleViewDetails, handleTerminateClick, handleUnterminateClick]);

  // Toolbar actions
  const toolbarActions = useMemo(() => (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={handleAddClick}
      data-testid="add-employee-button"
      sx={{
        textTransform: 'none',
        fontWeight: 600,
      }}
    >
      New Employee
    </Button>
  ), [handleAddClick]);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Employee Management (Factorial Grid)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Using custom FactorialDataGrid with inline editing, grouping, and real-time updates
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <FactorialDataGrid
          rows={localEmployees}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading || creating || updating || terminating || unterminating}
          
          // Enable features
          checkboxSelection
          pagination
          pageSizeOptions={[10, 25, 50, 100]}
          
          // Toolbar
          showToolbar
          showQuickFilter
          showColumnSelector
          showDensitySelector
          showGroupingPanel
          toolbarActions={toolbarActions}
          
          // Inline editing
          processRowUpdate={handleProcessRowUpdate}
          onProcessRowUpdateError={(error, context) => {
            console.error('Edit error:', error, context);
          }}
          
          // Callbacks
          onRowDoubleClick={handleRowDoubleClick}
          
          // Styling
          style={{ height: 'calc(100vh - 250px)' }}
        />
      </Box>

      <EmployeeFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={handleFormSubmit}
        employee={selectedEmployee}
        isEditing={isEditing}
        loading={creating || updating}
      />

      <TerminateDialog
        open={terminateDialogOpen}
        onClose={() => setTerminateDialogOpen(false)}
        onSubmit={handleTerminateSubmit}
        employee={selectedEmployee}
        loading={terminating}
      />

      <EmployeeDetailPanel
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        employee={selectedEmployee}
      />
    </Box>
  );
}
