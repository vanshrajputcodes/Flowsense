import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SimulationToggle } from '@/components/SimulationToggle';
import { SOSAlertOverlay } from '@/components/SOSAlertOverlay';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  Activity,
  Shield,
  ShoppingBag,
  Camera,
  UserCog,
  MapPin,
  Megaphone,
  Zap,
  Baby,
  QrCode,
  Monitor,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', icon: LayoutDashboard, labelKey: 'overview' as const, label: 'Overview' },
  { path: '/admin/analytics', icon: BarChart3, labelKey: 'analytics' as const, label: 'Analytics' },
  { path: '/admin/queues', icon: Users, labelKey: 'queue' as const, label: 'Queues' },
  { path: '/admin/alerts', icon: Bell, labelKey: 'alerts' as const, label: 'Alerts' },
  { path: '/admin/orders', icon: ShoppingBag, labelKey: 'overview' as const, label: 'Orders' },
  { path: '/admin/cctv', icon: Camera, labelKey: 'overview' as const, label: 'AI CCTV' },
  { path: '/admin/threat-logs', icon: Shield, labelKey: 'overview' as const, label: 'Threat Logs' },
  { path: '/admin/pa-system', icon: Megaphone, labelKey: 'overview' as const, label: 'PA System' },
  { path: '/admin/digital-twin', icon: Zap, labelKey: 'overview' as const, label: 'Digital Twin' },
  { path: '/admin/lost-child', icon: Baby, labelKey: 'overview' as const, label: 'Lost Child' },
  { path: '/admin/qr-checkin', icon: QrCode, labelKey: 'overview' as const, label: 'QR Check-in' },
  
  { path: '/admin/map-editor', icon: MapPin, labelKey: 'map' as const, label: 'Map Editor' },
  { path: '/admin/users', icon: UserCog, labelKey: 'overview' as const, label: 'Users' },
  { path: '/admin/settings', icon: Settings, labelKey: 'settings' as const, label: 'Settings' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* SOS Alert Overlay */}
      <SOSAlertOverlay />
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col',
          'bg-sidebar border-r border-sidebar-border',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
            <Link to="/admin">
              <Logo size="sm" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground"
          >
            {sidebarCollapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            const button = (
              <Link key={item.path} to={item.path} className="block">
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full',
                    sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3',
                    isActive && 'bg-sidebar-accent text-sidebar-primary'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Button>
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* System Health Indicator */}
        <div className={cn(
          'px-4 py-3 border-t border-sidebar-border',
          sidebarCollapsed && 'px-2'
        )}>
          <div className={cn(
            'flex items-center gap-2',
            sidebarCollapsed && 'justify-center'
          )}>
            <div className="relative">
              <Activity className="w-4 h-4 text-safe" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-safe rounded-full animate-ping" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xs text-muted-foreground">
                {t('systemHealth')}: Online
              </span>
            )}
          </div>
        </div>

        {/* User & Logout */}
        <div className={cn(
          'px-4 py-4 border-t border-sidebar-border',
          sidebarCollapsed && 'px-2'
        )}>
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className={cn(
              'w-full text-muted-foreground hover:text-foreground',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3'
            )}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 glass border-b border-border/50">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">
              {navItems.find((item) =>
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              )?.label ?? t('dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <SimulationToggle compact />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <Footer minimal />
      </div>
    </div>
  );
}
