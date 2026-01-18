import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import type { Employee } from '../types/employee';

interface EmployeeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  employee: Employee | null;
  isEditing: boolean;
  loading: boolean;
}

const COUNTRIES = [
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

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export function EmployeeFormDialog({
  open,
  onClose,
  onSubmit,
  employee,
  isEditing,
  loading,
}: EmployeeFormDialogProps) {
  const [formData, setFormData] = useState({
    companyId: 1,
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    phoneNumber: '',
    city: '',
    state: '',
    postalCode: '',
    addressLine1: '',
    nationality: '',
    gender: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee && isEditing) {
      setFormData({
        companyId: employee.companyId,
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        country: employee.country || '',
        phoneNumber: employee.phoneNumber || '',
        city: employee.city || '',
        state: employee.state || '',
        postalCode: employee.postalCode || '',
        addressLine1: employee.addressLine1 || '',
        nationality: employee.nationality || '',
        gender: employee.gender || '',
      });
    } else {
      setFormData({
        companyId: 1,
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        phoneNumber: '',
        city: '',
        state: '',
        postalCode: '',
        addressLine1: '',
        nationality: '',
        gender: '',
      });
    }
    setErrors({});
  }, [employee, isEditing, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const submitData: Partial<Employee> = {
      companyId: formData.companyId,
    };

    // Only include non-empty fields
    if (formData.firstName) submitData.firstName = formData.firstName;
    if (formData.lastName) submitData.lastName = formData.lastName;
    if (formData.email) submitData.email = formData.email;
    if (formData.country) submitData.country = formData.country;
    if (formData.phoneNumber) submitData.phoneNumber = formData.phoneNumber;
    if (formData.city) submitData.city = formData.city;
    if (formData.state) submitData.state = formData.state;
    if (formData.postalCode) submitData.postalCode = formData.postalCode;
    if (formData.addressLine1) submitData.addressLine1 = formData.addressLine1;
    if (formData.nationality) submitData.nationality = formData.nationality;
    if (formData.gender) submitData.gender = formData.gender;

    await onSubmit(submitData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid="employee-form-dialog"
    >
      <DialogTitle>
        {isEditing ? 'Edit Employee' : 'Create New Employee'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
              data-testid="first-name-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
              data-testid="last-name-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              data-testid="email-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange('phoneNumber')}
              data-testid="phone-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Country"
              value={formData.country}
              onChange={handleChange('country')}
              data-testid="country-input"
            >
              <MenuItem value="">Select a country</MenuItem>
              {COUNTRIES.map((country) => (
                <MenuItem key={country} value={country}>
                  {country}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nationality"
              value={formData.nationality}
              onChange={handleChange('nationality')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Gender"
              value={formData.gender}
              onChange={handleChange('gender')}
            >
              <MenuItem value="">Select gender</MenuItem>
              {GENDERS.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company ID"
              type="number"
              value={formData.companyId}
              onChange={handleChange('companyId')}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.addressLine1}
              onChange={handleChange('addressLine1')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="City"
              value={formData.city}
              onChange={handleChange('city')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="State/Province"
              value={formData.state}
              onChange={handleChange('state')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Postal Code"
              value={formData.postalCode}
              onChange={handleChange('postalCode')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          data-testid="submit-employee-button"
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : isEditing ? (
            'Save Changes'
          ) : (
            'Create Employee'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
