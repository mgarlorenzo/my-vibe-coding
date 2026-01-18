import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSubscription } from '@apollo/client';
import { FactorialDataGrid, SubscriptionEvent } from '../components/FactorialDataGrid';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee, EmployeeFilter, EmployeePaging, EmployeeSorting } from '../types/employee';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { TerminateDialog } from '../components/TerminateDialog';
import { EmployeeDetailPanel } from '../components/EmployeeDetailPanel';
import { EMPLOYEE_CHANGED_SUBSCRIPTION } from '../graphql/queries';
import { tokens } from '../theme';
import { createColumns } from '../components/EmployeeFactorialGrid';

// ============================================================================
// Toolbar Actions Component
// ============================================================================

interface ToolbarActionsProps {
  onAddClick: () => void;
}

function ToolbarActions({ onAddClick }: ToolbarActionsProps) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5 }}>
      <Button
        variant="contained"
        color="error"
        startIcon={<AddIcon />}
        onClick={onAddClick}
        data-testid="add-employee-button"
      >
        New Employee
      </Button>
    </Box>
  );
}

// ============================================================================
// HomePage Component
// ============================================================================

export function HomePage() {
  // State for dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Query state
  const [filter] = useState<EmployeeFilter>({ includeTerminated: true });
  const [paging] = useState<EmployeePaging>({ offset: 0, limit: 10000 });
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
  const { data: subscriptionData, error: subscriptionError } = useSubscription(EMPLOYEE_CHANGED_SUBSCRIPTION, {
    onData: ({ data }) => {
      console.log('[Subscription] Raw data received:', data);
      if (data.data?.employeeChanged) {
        const event = data.data.employeeChanged;
        console.log('[Subscription] Event:', event.eventType, 'Employee ID:', event.employee.id);
        const subscriptionEvent: SubscriptionEvent<Employee> = {
          type: event.eventType,
          id: event.employee.id,
          row: event.employee,
        };

        setLocalEmployees(prev => {
          console.log('[Subscription] Updating localEmployees, current count:', prev.length);
          switch (subscriptionEvent.type) {
            case 'CREATED':
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

  // Log subscription status
  useEffect(() => {
    if (subscriptionError) {
      console.error('[Subscription] Connection error:', subscriptionError);
    }
    if (subscriptionData) {
      console.log('[Subscription] Data updated:', subscriptionData);
    }
  }, [subscriptionData, subscriptionError]);

  // Handle add click
  const handleAddClick = useCallback(() => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setFormDialogOpen(true);
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

  // Handle save from detail panel
  const handleDetailPanelSave = useCallback(async (data: Partial<Employee>) => {
    if (selectedEmployee) {
      // Convert null values to undefined for the API
      const cleanData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          cleanData[key] = value;
        }
      }
      const result = await updateEmployee(selectedEmployee.id, cleanData);
      setSelectedEmployee(result);
    }
  }, [selectedEmployee, updateEmployee]);

  // Create columns with action callbacks
  const columns = useMemo(() => createColumns({
    onViewDetails: handleViewDetails,
    onTerminate: handleTerminateClick,
    onUnterminate: handleUnterminateClick,
  }), [handleViewDetails, handleTerminateClick, handleUnterminateClick]);

  // Toolbar actions
  const toolbarActions = useMemo(() => (
    <ToolbarActions onAddClick={handleAddClick} />
  ), [handleAddClick]);

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.bg.surface,
        border: `1px solid ${tokens.border.subtle}`,
        borderRadius: `${tokens.radius.md}px`,
        boxShadow: tokens.shadow.sm,
        overflow: 'hidden',
      }}
    >
        {/* Grid with full toolbar */}
        <FactorialDataGrid
          rows={localEmployees}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading || creating || updating || terminating || unterminating}
          
          // Enable features
          checkboxSelection
          pagination
          pageSizeOptions={[10, 25, 50, 100]}
          
          // Toolbar with all features
          showToolbar
          showQuickFilter
          showColumnSelector
          showDensitySelector
          showGroupingPanel
          showExport
          showAdvancedFilters
          toolbarActions={toolbarActions}
          
          // Export configuration
          gridName="employees"
          
          // Column persistence
          storageKey="organisation_people_grid_v2"
        
        // Inline editing
        processRowUpdate={handleProcessRowUpdate}
        onProcessRowUpdateError={(error, context) => {
          console.error('Edit error:', error, context);
        }}
      />

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
        onSave={handleDetailPanelSave}
        saving={updating}
      />
    </Box>
  );
}

export default HomePage;
