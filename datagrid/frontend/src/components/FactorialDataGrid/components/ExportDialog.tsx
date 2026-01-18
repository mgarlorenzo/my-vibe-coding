import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { ExportScope } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (scope: ExportScope) => void;
  
  // Row counts for display
  selectedCount: number;
  filteredCount: number;
  totalCount: number;
  
  // Loading state for async getAllRows
  loading?: boolean;
  error?: string | null;
}

type ExportScopeType = 'selected' | 'all' | 'filtered';

// ============================================================================
// Export Dialog Component
// ============================================================================

export function ExportDialog({
  open,
  onClose,
  onExport,
  selectedCount,
  filteredCount,
  totalCount,
  loading = false,
  error = null,
}: ExportDialogProps) {
  const [selectedScope, setSelectedScope] = useState<ExportScopeType>('filtered');
  
  // Reset to filtered when dialog opens if no selection
  useEffect(() => {
    if (open) {
      if (selectedCount === 0 && selectedScope === 'selected') {
        setSelectedScope('filtered');
      }
    }
  }, [open, selectedCount, selectedScope]);

  const handleScopeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedScope(event.target.value as ExportScopeType);
  }, []);

  const handleExport = useCallback(() => {
    onExport({ type: selectedScope });
  }, [onExport, selectedScope]);

  const isSelectedDisabled = selectedCount === 0;
  const isExportDisabled = loading || (selectedScope === 'selected' && selectedCount === 0);

  // Determine which count to show based on selection
  const getExportRowCount = (): number => {
    switch (selectedScope) {
      case 'selected':
        return selectedCount;
      case 'filtered':
        return filteredCount;
      case 'all':
        return totalCount;
      default:
        return 0;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="export-dialog-title"
      data-testid="export-dialog"
    >
      <DialogTitle id="export-dialog-title">
        Export to CSV
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} data-testid="export-error">
            {error}
          </Alert>
        )}
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          What would you like to export?
        </Typography>
        
        <RadioGroup
          value={selectedScope}
          onChange={handleScopeChange}
          aria-label="Export scope"
          data-testid="export-scope-radio-group"
        >
          {/* Selected rows option */}
          <FormControlLabel
            value="selected"
            control={<Radio data-testid="export-scope-selected" />}
            label={
              <Box>
                <Typography
                  component="span"
                  color={isSelectedDisabled ? 'text.disabled' : 'text.primary'}
                >
                  Selected rows
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {isSelectedDisabled
                    ? 'Select at least one row to export selected rows.'
                    : `${selectedCount} row${selectedCount !== 1 ? 's' : ''} selected`}
                </Typography>
              </Box>
            }
            disabled={isSelectedDisabled}
            sx={{ alignItems: 'flex-start', mb: 1 }}
          />
          
          {/* Filtered rows option */}
          <FormControlLabel
            value="filtered"
            control={<Radio data-testid="export-scope-filtered" />}
            label={
              <Box>
                <Typography component="span">
                  All rows (matching current filters)
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {filteredCount} row{filteredCount !== 1 ? 's' : ''} matching current filters and sorting
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 1 }}
          />
          
          {/* All rows option */}
          <FormControlLabel
            value="all"
            control={<Radio data-testid="export-scope-all" />}
            label={
              <Box>
                <Typography component="span">
                  All rows (ignoring filters)
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {totalCount} row{totalCount !== 1 ? 's' : ''} total in dataset
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </RadioGroup>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Summary */}
        <Box
          sx={{
            bgcolor: 'action.hover',
            borderRadius: 1,
            p: 2,
          }}
          data-testid="export-summary"
        >
          <Typography variant="body2" color="text.secondary">
            Export summary
          </Typography>
          <Typography variant="h6" data-testid="export-row-count">
            {getExportRowCount()} row{getExportRowCount() !== 1 ? 's' : ''} will be exported
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visible columns will be included in the export
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          data-testid="export-cancel-button"
        >
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}
          disabled={isExportDisabled}
          data-testid="export-confirm-button"
        >
          {loading ? 'Exporting...' : 'Export CSV'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ExportDialog;
