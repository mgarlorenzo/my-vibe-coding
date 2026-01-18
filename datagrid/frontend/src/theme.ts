import { createTheme } from '@mui/material/styles';

// ============================================================================
// Design Tokens
// ============================================================================

export const tokens = {
  // Neutrales
  bg: {
    page: '#F7F8FA',
    sidebar: '#F2F4F7',
    surface: '#FFFFFF',
  },
  border: {
    subtle: '#E4E7EC',
    strong: '#D0D5DD',
  },
  // Texto
  text: {
    primary: '#101828',
    secondary: '#475467',
    muted: '#667085',
  },
  // Estados
  state: {
    hover: '#EAECF0',
    active: '#E0E7FF',
    focusRing: '#84CAFF',
  },
  // Primary
  primary: {
    600: '#2563EB',
    700: '#1D4ED8',
  },
  // Danger
  danger: {
    600: '#D92D20',
    700: '#B42318',
    bgSoft: '#FEE4E2',
  },
  // Chips
  success: {
    bgSoft: '#ECFDF3',
    fg: '#027A48',
  },
  warning: {
    bgSoft: '#FFFAEB',
    fg: '#B54708',
  },
  error: {
    bgSoft: '#FEE4E2',
    fg: '#B42318',
  },
  // Spacing scale
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  // Radii
  radius: {
    sm: 8,
    md: 12,
    pill: 999,
  },
  // Shadow
  shadow: {
    sm: '0 1px 2px rgba(16,24,40,0.06)',
  },
} as const;

// ============================================================================
// MUI Theme
// ============================================================================

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.primary[600],
      dark: tokens.primary[700],
    },
    error: {
      main: tokens.danger[600],
      dark: tokens.danger[700],
    },
    success: {
      main: tokens.success.fg,
      light: tokens.success.bgSoft,
    },
    warning: {
      main: tokens.warning.fg,
      light: tokens.warning.bgSoft,
    },
    background: {
      default: tokens.bg.page,
      paper: tokens.bg.surface,
    },
    text: {
      primary: tokens.text.primary,
      secondary: tokens.text.secondary,
    },
    divider: tokens.border.subtle,
    action: {
      hover: tokens.state.hover,
      selected: tokens.state.active,
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 14,
    h1: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    h2: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    h3: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    h4: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    h5: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 600,
    },
    h6: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    body2: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 600,
    },
    caption: {
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 400,
    },
    button: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bg.page,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          height: 36,
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
          lineHeight: '20px',
          padding: '8px 14px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: tokens.border.strong,
          color: tokens.text.primary,
          '&:hover': {
            borderColor: tokens.border.strong,
            backgroundColor: tokens.state.hover,
          },
        },
        containedPrimary: {
          backgroundColor: tokens.primary[600],
          '&:hover': {
            backgroundColor: tokens.primary[700],
          },
        },
        containedError: {
          backgroundColor: tokens.danger[600],
          '&:hover': {
            backgroundColor: tokens.danger[700],
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: tokens.state.hover,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.border.subtle,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.pill,
          fontSize: '12px',
          lineHeight: '18px',
          fontWeight: 500,
          height: 24,
        },
        colorSuccess: {
          backgroundColor: tokens.success.bgSoft,
          color: tokens.success.fg,
        },
        colorWarning: {
          backgroundColor: tokens.warning.bgSoft,
          color: tokens.warning.fg,
        },
        colorError: {
          backgroundColor: tokens.error.bgSoft,
          color: tokens.error.fg,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          boxShadow: tokens.shadow.sm,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: tokens.radius.md,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontSize: '12px',
            lineHeight: '18px',
            fontWeight: 600,
            color: tokens.text.secondary,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.radius.sm,
            '& fieldset': {
              borderColor: tokens.border.strong,
            },
            '&:hover fieldset': {
              borderColor: tokens.border.strong,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.primary[600],
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.sm,
        },
      },
    },
  },
});

export default theme;
