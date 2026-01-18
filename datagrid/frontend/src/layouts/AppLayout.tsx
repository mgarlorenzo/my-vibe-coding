import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';
import { tokens } from '../theme';

// ============================================================================
// Sidebar Item Component
// ============================================================================

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, path, active, onClick }: SidebarItemProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <ListItemButton
      onClick={handleClick}
      sx={{
        height: 40,
        borderRadius: '12px',
        px: 1.5,
        mb: 0.5,
        position: 'relative',
        backgroundColor: active ? tokens.state.active : 'transparent',
        '&:hover': {
          backgroundColor: active ? tokens.state.active : tokens.state.hover,
        },
        // Active indicator
        '&::before': active ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 3,
          height: 20,
          backgroundColor: tokens.primary[600],
          borderRadius: '0 2px 2px 0',
        } : {},
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: 32,
          color: active ? tokens.primary[600] : tokens.text.secondary,
          '& .MuiSvgIcon-root': {
            fontSize: 18,
          },
        }}
      >
        {icon}
      </ListItemIcon>
      <ListItemText
        primary={label}
        primaryTypographyProps={{
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 500,
          color: active ? tokens.text.primary : tokens.text.secondary,
        }}
      />
    </ListItemButton>
  );
}

// ============================================================================
// Sidebar Section Component
// ============================================================================

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          px: 1.5,
          py: 1,
          display: 'block',
          fontSize: '12px',
          lineHeight: '18px',
          fontWeight: 600,
          color: tokens.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </Typography>
      <List disablePadding>
        {children}
      </List>
    </Box>
  );
}

// ============================================================================
// Sidebar Component
// ============================================================================

function Sidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Box
      component="aside"
      sx={{
        width: 280,
        flexShrink: 0,
        backgroundColor: tokens.bg.sidebar,
        borderRight: `1px solid ${tokens.border.subtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Workspace Header */}
      <Box
        sx={{
          height: 44,
          px: 1.5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${tokens.border.subtle}`,
        }}
      >
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '8px',
            backgroundColor: tokens.primary[600],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
          }}
        >
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>
            F
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: '14px',
            lineHeight: '20px',
            fontWeight: 600,
            color: tokens.text.primary,
          }}
        >
          Factorial
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
        <SidebarSection title="Company">
          <SidebarItem
            icon={<HomeIcon />}
            label="Home"
            path="/"
            active={currentPath === '/'}
          />
          <SidebarItem
            icon={<PeopleIcon />}
            label="Employees"
            path="/employees"
            active={currentPath === '/employees'}
          />
          <SidebarItem
            icon={<BusinessIcon />}
            label="Departments"
            active={false}
          />
          <SidebarItem
            icon={<FolderIcon />}
            label="Documents"
            active={false}
          />
        </SidebarSection>

        <Divider sx={{ my: 2 }} />

        <SidebarSection title="Settings">
          <SidebarItem
            icon={<SettingsIcon />}
            label="Settings"
            active={false}
          />
        </SidebarSection>
      </Box>
    </Box>
  );
}

// ============================================================================
// Topbar Component
// ============================================================================

interface TopbarProps {
  title: string;
}

function Topbar({ title }: TopbarProps) {
  return (
    <Box
      component="header"
      sx={{
        height: 56,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: tokens.bg.page,
        borderBottom: `1px solid ${tokens.border.subtle}`,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: '20px',
          lineHeight: '28px',
          fontWeight: 600,
          color: tokens.text.primary,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

// ============================================================================
// AppLayout Component
// ============================================================================

export function AppLayout() {
  const location = useLocation();
  
  // Determine page title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Organisation';
      case '/employees':
        return 'Employees';
      default:
        return 'Organisation';
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: tokens.bg.page,
          overflow: 'hidden',
        }}
      >
        {/* Topbar */}
        <Topbar title={getPageTitle()} />

        {/* Content Area */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
