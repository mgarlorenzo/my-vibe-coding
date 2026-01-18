import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import type { Employee } from '../types/employee';

interface TerminateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    terminationReason?: string;
    terminationReasonType?: string;
    terminationObservations?: string;
  }) => Promise<void>;
  employee: Employee | null;
  loading: boolean;
}

const TERMINATION_TYPES = [
  { value: 'VOLUNTARY', label: 'Voluntary Resignation' },
  { value: 'INVOLUNTARY', label: 'Involuntary Termination' },
  { value: 'RETIREMENT', label: 'Retirement' },
  { value: 'CONTRACT_END', label: 'Contract End' },
  { value: 'MUTUAL_AGREEMENT', label: 'Mutual Agreement' },
  { value: 'OTHER', label: 'Other' },
];

export function TerminateDialog({
  open,
  onClose,
  onSubmit,
  employee,
  loading,
}: TerminateDialogProps) {
  const [formData, setFormData] = useState({
    terminationReason: '',
    terminationReasonType: '',
    terminationObservations: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        terminationReason: '',
        terminationReasonType: '',
        terminationObservations: '',
      });
    }
  }, [open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    await onSubmit(formData);
  };

  if (!employee) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="terminate-dialog"
    >
      <DialogTitle>Terminate Employee</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are about to terminate{' '}
          <strong>
            {employee.firstName} {employee.lastName}
          </strong>
          . This action will mark the employee as inactive.
        </Alert>

        <TextField
          fullWidth
          select
          label="Termination Type"
          value={formData.terminationReasonType}
          onChange={handleChange('terminationReasonType')}
          sx={{ mb: 2 }}
          data-testid="termination-type-input"
        >
          <MenuItem value="">Select a type</MenuItem>
          {TERMINATION_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>
              {type.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Reason"
          value={formData.terminationReason}
          onChange={handleChange('terminationReason')}
          sx={{ mb: 2 }}
          data-testid="termination-reason-input"
        />

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Observations"
          value={formData.terminationObservations}
          onChange={handleChange('terminationObservations')}
          placeholder="Additional notes about the termination..."
          data-testid="termination-observations-input"
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="confirm-terminate-button"
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Termination'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
