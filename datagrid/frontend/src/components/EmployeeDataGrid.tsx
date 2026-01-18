import { useState, useCallback, useMemo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridActionsCellItem,
  GridRowParams,
  GridSortModel,
  GridFilterModel,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarColumnsButton,
  GridPaginationModel,
} from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Tooltip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useEmployees } from '../hooks/useEmployees';
import type { Employee, EmployeeFilter, EmployeePaging, EmployeeSorting, CreateEmployeeInput, UpdateEmployeeInput } from '../types/employee';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { TerminateDialog } from './TerminateDialog';
import { EmployeeDetailPanel } from './EmployeeDetailPanel';

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '-';
  }
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

interface CustomToolbarProps {
  onAddClick: () => void;
}

function CustomToolbar({ onAddClick }: CustomToolbarProps) {
  return (
    <GridToolbarContainer sx={{ p: 2, gap: 2, borderBottom: '1px solid #e0e0e0' }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddClick}
        data-testid="add-employee-button"
        sx={{
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        New Employee
      </Button>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter
        sx={{
          '& .MuiInputBase-root': {
            borderRadius: 2,
          },
        }}
      />
      <GridToolbarColumnsButton />
    </GridToolbarContainer>
  );
}

export function EmployeeDataGrid() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'id', sort: 'asc' },
  ]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [],
  });
  const [includeTerminated] = useState(true);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const filter: EmployeeFilter = useMemo(() => ({
    searchTerm: filterModel.quickFilterValues?.join(' ') || undefined,
    includeTerminated,
  }), [filterModel.quickFilterValues, includeTerminated]);

  const paging: EmployeePaging = useMemo(() => ({
    offset: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
  }), [paginationModel]);

  const sorting: EmployeeSorting = useMemo(() => ({
    field: sortModel[0]?.field || 'id',
    direction: (sortModel[0]?.sort?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
  }), [sortModel]);

  const {
    employees,
    totalCount,
    loading,
    createEmployee,
    updateEmployee,
    terminateEmployee,
    unterminateEmployee,
    creating,
    updating,
    terminating,
  } = useEmployees({ filter, paging, sorting });

  const handleAddClick = useCallback(() => {
    setSelectedEmployee(null);
    setIsEditing(false);
    setFormDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditing(true);
    setFormDialogOpen(true);
  }, []);

  const handleTerminateClick = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setTerminateDialogOpen(true);
  }, []);

  const handleUnterminateClick = useCallback(async (employee: Employee) => {
    await unterminateEmployee(employee.id);
  }, [unterminateEmployee]);

  const handleViewClick = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setDetailPanelOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data: Partial<Employee>) => {
    // Convert null values to undefined for the input types
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        cleanData[key] = value;
      }
    }
    
    if (isEditing && selectedEmployee) {
      await updateEmployee(selectedEmployee.id, cleanData as UpdateEmployeeInput);
    } else {
      await createEmployee({
        companyId: (cleanData.companyId as number) || 1,
        ...cleanData,
      } as CreateEmployeeInput);
    }
    setFormDialogOpen(false);
  }, [isEditing, selectedEmployee, createEmployee, updateEmployee]);

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

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      type: 'number',
    },
    {
      field: 'companyId',
      headerName: 'Company',
      width: 100,
      type: 'number',
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      width: 150,
      flex: 1,
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      width: 150,
      flex: 1,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 220,
      flex: 1,
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 120,
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 130,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'terminationDate',
      headerName: 'Termination',
      width: 130,
      renderCell: (params) => {
        if (params.value) {
          return (
            <Chip
              label={formatDate(params.value)}
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
      valueFormatter: (params) => formatDateTime(params.value),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params: GridRowParams<Employee>) => {
        const employee = params.row;
        const isTerminated = !!employee.terminationDate;

        return [
          <GridActionsCellItem
            key="view"
            icon={
              <Tooltip title="View Details">
                <VisibilityIcon />
              </Tooltip>
            }
            label="View"
            onClick={() => handleViewClick(employee)}
          />,
          <GridActionsCellItem
            key="edit"
            icon={
              <Tooltip title="Edit">
                <EditIcon />
              </Tooltip>
            }
            label="Edit"
            onClick={() => handleEditClick(employee)}
            data-testid={`edit-employee-${employee.id}`}
          />,
          isTerminated ? (
            <GridActionsCellItem
              key="unterminate"
              icon={
                <Tooltip title="Reactivate">
                  <PersonIcon color="success" />
                </Tooltip>
              }
              label="Reactivate"
              onClick={() => handleUnterminateClick(employee)}
            />
          ) : (
            <GridActionsCellItem
              key="terminate"
              icon={
                <Tooltip title="Terminate">
                  <PersonOffIcon color="error" />
                </Tooltip>
              }
              label="Terminate"
              onClick={() => handleTerminateClick(employee)}
              data-testid={`terminate-employee-${employee.id}`}
            />
          ),
        ];
      },
    },
  ], [handleViewClick, handleEditClick, handleTerminateClick, handleUnterminateClick]);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Employee Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your organization's employees
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <DataGrid
          rows={employees}
          columns={columns}
          loading={loading || creating || updating || terminating}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          pageSizeOptions={[10, 25, 50, 100]}
          rowCount={totalCount}
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          disableRowSelectionOnClick
          slots={{
            toolbar: CustomToolbar,
          }}
          slotProps={{
            toolbar: {
              onAddClick: handleAddClick,
            } as CustomToolbarProps,
          }}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#fafafa',
            },
          }}
          getRowId={(row) => row.id}
          data-testid="employee-data-grid"
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
