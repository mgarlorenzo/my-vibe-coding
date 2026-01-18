import { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Grid,
  TextField,
  Button,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import type { Employee } from '../types/employee';

// ============================================================================
// Types
// ============================================================================

interface EmployeeDetailPanelProps {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave?: (data: Partial<Employee>) => Promise<void>;
  saving?: boolean;
}

interface EditableEmployee {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  startDate: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// ============================================================================
// Country Options
// ============================================================================

const COUNTRY_OPTIONS = [
  'Spain',
  'United Kingdom',
  'France',
  'Germany',
  'Italy',
  'Portugal',
  'Netherlands',
  'Belgium',
  'United States',
  'Canada',
];

// ============================================================================
// Detail Row Components
// ============================================================================

interface DetailRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  const displayValue = value === null || value === undefined ? '-' : String(value);
  return (
    <Grid container spacing={2} sx={{ py: 1 }}>
      <Grid item xs={5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="body2">{displayValue}</Typography>
      </Grid>
    </Grid>
  );
}

interface EditableRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'date' | 'select';
  options?: string[];
  disabled?: boolean;
}

function EditableRow({ label, value, onChange, type = 'text', options, disabled }: EditableRowProps) {
  return (
    <Grid container spacing={2} sx={{ py: 1 }} alignItems="center">
      <Grid item xs={5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid item xs={7}>
        {type === 'select' && options ? (
          <TextField
            select
            fullWidth
            size="small"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <MenuItem value="">-</MenuItem>
            {options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            fullWidth
            size="small"
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            InputLabelProps={type === 'date' ? { shrink: true } : undefined}
          />
        )}
      </Grid>
    </Grid>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EmployeeDetailPanel({
  open,
  onClose,
  employee,
  onSave,
  saving = false,
}: EmployeeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableEmployee>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: '',
    city: '',
    state: '',
    postalCode: '',
    addressLine1: '',
    addressLine2: '',
    startDate: '',
  });

  // Reset edit state when employee changes or panel closes
  useEffect(() => {
    if (employee) {
      setEditData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        country: employee.country || '',
        city: employee.city || '',
        state: employee.state || '',
        postalCode: employee.postalCode || '',
        addressLine1: employee.addressLine1 || '',
        addressLine2: employee.addressLine2 || '',
        startDate: formatDateForInput(employee.startDate),
      });
    }
    setIsEditing(false);
  }, [employee, open]);

  const handleFieldChange = useCallback((field: keyof EditableEmployee, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    if (employee) {
      setEditData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phoneNumber: employee.phoneNumber || '',
        country: employee.country || '',
        city: employee.city || '',
        state: employee.state || '',
        postalCode: employee.postalCode || '',
        addressLine1: employee.addressLine1 || '',
        addressLine2: employee.addressLine2 || '',
        startDate: formatDateForInput(employee.startDate),
      });
    }
    setIsEditing(false);
  }, [employee]);

  const handleSave = useCallback(async () => {
    if (onSave) {
      const dataToSave: Partial<Employee> = {};
      
      // Only include changed fields
      if (editData.firstName !== (employee?.firstName || '')) {
        dataToSave.firstName = editData.firstName || undefined;
      }
      if (editData.lastName !== (employee?.lastName || '')) {
        dataToSave.lastName = editData.lastName || undefined;
      }
      if (editData.email !== (employee?.email || '')) {
        dataToSave.email = editData.email || undefined;
      }
      if (editData.phoneNumber !== (employee?.phoneNumber || '')) {
        dataToSave.phoneNumber = editData.phoneNumber || undefined;
      }
      if (editData.country !== (employee?.country || '')) {
        dataToSave.country = editData.country || undefined;
      }
      if (editData.city !== (employee?.city || '')) {
        dataToSave.city = editData.city || undefined;
      }
      if (editData.state !== (employee?.state || '')) {
        dataToSave.state = editData.state || undefined;
      }
      if (editData.postalCode !== (employee?.postalCode || '')) {
        dataToSave.postalCode = editData.postalCode || undefined;
      }
      if (editData.addressLine1 !== (employee?.addressLine1 || '')) {
        dataToSave.addressLine1 = editData.addressLine1 || undefined;
      }
      if (editData.addressLine2 !== (employee?.addressLine2 || '')) {
        dataToSave.addressLine2 = editData.addressLine2 || undefined;
      }
      if (editData.startDate !== formatDateForInput(employee?.startDate ?? null)) {
        dataToSave.startDate = editData.startDate ? new Date(editData.startDate).toISOString() : undefined;
      }

      if (Object.keys(dataToSave).length > 0) {
        await onSave(dataToSave);
      }
      setIsEditing(false);
    }
  }, [onSave, editData, employee]);

  if (!employee) return null;

  const isTerminated = !!employee.terminationDate;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 480 },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Employee Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!isEditing && onSave && (
              <IconButton onClick={handleEdit} color="primary" title="Edit">
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Employee Header */}
        <Box sx={{ mb: 3 }}>
          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <TextField
                size="small"
                label="First Name"
                value={editData.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                disabled={saving}
              />
              <TextField
                size="small"
                label="Last Name"
                value={editData.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                disabled={saving}
              />
            </Box>
          ) : (
            <Typography variant="h5" fontWeight={600}>
              {employee.firstName} {employee.lastName}
            </Typography>
          )}
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              disabled={saving}
              sx={{ mt: 1 }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {employee.email || 'No email'}
            </Typography>
          )}
          <Box sx={{ mt: 1 }}>
            {isTerminated ? (
              <Chip label="Terminated" color="error" size="small" />
            ) : (
              <Chip label="Active" color="success" size="small" />
            )}
          </Box>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Basic Information
          </Typography>
          <DetailRow label="ID" value={employee.id} />
          <DetailRow label="Company ID" value={employee.companyId} />
          <DetailRow label="Gender" value={employee.gender} />
          <DetailRow label="Nationality" value={employee.nationality} />
          <DetailRow label="Date of Birth" value={formatDate(employee.dateOfBirth)} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Contact Information
          </Typography>
          {isEditing ? (
            <>
              <EditableRow
                label="Phone"
                value={editData.phoneNumber}
                onChange={(v) => handleFieldChange('phoneNumber', v)}
                disabled={saving}
              />
              <EditableRow
                label="Address"
                value={editData.addressLine1}
                onChange={(v) => handleFieldChange('addressLine1', v)}
                disabled={saving}
              />
              <EditableRow
                label="Address 2"
                value={editData.addressLine2}
                onChange={(v) => handleFieldChange('addressLine2', v)}
                disabled={saving}
              />
              <EditableRow
                label="City"
                value={editData.city}
                onChange={(v) => handleFieldChange('city', v)}
                disabled={saving}
              />
              <EditableRow
                label="State"
                value={editData.state}
                onChange={(v) => handleFieldChange('state', v)}
                disabled={saving}
              />
              <EditableRow
                label="Postal Code"
                value={editData.postalCode}
                onChange={(v) => handleFieldChange('postalCode', v)}
                disabled={saving}
              />
              <EditableRow
                label="Country"
                value={editData.country}
                onChange={(v) => handleFieldChange('country', v)}
                type="select"
                options={COUNTRY_OPTIONS}
                disabled={saving}
              />
            </>
          ) : (
            <>
              <DetailRow label="Phone" value={employee.phoneNumber} />
              <DetailRow label="Address" value={employee.addressLine1} />
              {employee.addressLine2 && <DetailRow label="Address 2" value={employee.addressLine2} />}
              <DetailRow label="City" value={employee.city} />
              <DetailRow label="State" value={employee.state} />
              <DetailRow label="Postal Code" value={employee.postalCode} />
              <DetailRow label="Country" value={employee.country} />
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Employment Information
          </Typography>
          {isEditing ? (
            <EditableRow
              label="Start Date"
              value={editData.startDate}
              onChange={(v) => handleFieldChange('startDate', v)}
              type="date"
              disabled={saving}
            />
          ) : (
            <DetailRow label="Start Date" value={formatDate(employee.startDate)} />
          )}
          <DetailRow label="Creation Date" value={formatDate(employee.creationDate)} />
          <DetailRow label="Updated At" value={formatDateTime(employee.updatedAt)} />

          {isTerminated && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }} color="error">
                Termination Information
              </Typography>
              <DetailRow label="Termination Date" value={formatDate(employee.terminationDate)} />
              <DetailRow label="Reason Type" value={employee.terminationReasonType} />
              <DetailRow label="Reason" value={employee.terminationReason} />
              <DetailRow label="Observations" value={employee.terminationObservations} />
              {employee.unterminationDate && (
                <DetailRow label="Untermination Date" value={formatDate(employee.unterminationDate)} />
              )}
            </>
          )}
        </Box>

        {/* Action Buttons */}
        {isEditing && (
          <Box sx={{ pt: 2, display: 'flex', gap: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              disabled={saving}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
              fullWidth
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
