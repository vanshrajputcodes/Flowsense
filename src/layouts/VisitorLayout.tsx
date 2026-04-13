import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { Footer } from '@/components/Footer';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SOSButton } from '@/components/SOSButton';
import { VoiceCommandButton } from '@/components/VoiceCommandButton';
import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  Map,
  Building2,
  Bell,
  Menu,
  LogIn,
  UserPlus,
  LogOut,
  Settings,
  ShoppingCart,
  QrCode,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface VisitorLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, labelKey: 'home' as const, label: { en: 'Home', hi: 'होम' } },
  { path: '/queue', icon: Users, labelKey: 'queue' as const, label: { en: 'Queue', hi: 'कतार' } },
  { path: '/register', icon: QrCode, labelKey: 'home' as const, label: { en: 'Register', hi: 'रजिस्टर' } },
  { path: '/order', icon: ShoppingCart, labelKey: 'home' as const, label: { en: 'Order', hi: 'ऑर्डर' } },
  { path: '/map', icon: Map, labelKey: 'map' as const, label: { en: 'Map', hi: 'मानचित्र' } },
  { path: '/facilities', icon: Building2, labelKey: 'facilities' as const, label: { en: 'Facilities', hi: 'सुविधाएं' } },
  { path: '/alerts', icon: Bell, labelKey: 'alerts' as const, label: { en: 'Alerts', hi: 'अलर्ट' } },
];

export function VisitorLayout({ children }: VisitorLayoutProps) {
  const { language, t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo size="sm" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="sm"
                      className={cn(
                        'gap-2',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {language === 'hi' ? item.label.hi : item.label.en}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
              
              {/* Auth Buttons */}
              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Settings className="w-4 h-4" />
                        {language === 'hi' ? 'व्यवस्थापक' : 'Admin'}
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <LogIn className="w-4 h-4" />
                      {language === 'hi' ? 'लॉगिन' : 'Login'}
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="default" size="sm" className="gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      {language === 'hi' ? 'साइनअप' : 'Sign Up'}
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Voice Command Button */}
              <VoiceCommandButton />

              {/* SOS Button */}
              <SOSButton variant="compact" className="hidden md:flex" />

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    {navItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Button
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                              'w-full justify-start gap-3',
                              isActive && 'bg-primary/10 text-primary'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            {language === 'hi' ? item.label.hi : item.label.en}
                          </Button>
                        </Link>
                      );
                    })}
                    
                    {/* Auth Section in Mobile Menu */}
                    <div className="pt-4 border-t space-y-2">
                      {user ? (
                        <>
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                              <Button variant="outline" className="w-full gap-2">
                                <Settings className="w-5 h-5" />
                                {language === 'hi' ? 'व्यवस्थापक पैनल' : 'Admin Panel'}
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            className="w-full gap-2"
                            onClick={() => {
                              signOut();
                              setMobileMenuOpen(false);
                            }}
                          >
                            <LogOut className="w-5 h-5" />
                            {language === 'hi' ? 'लॉगआउट' : 'Logout'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="outline" className="w-full gap-2">
                              <LogIn className="w-5 h-5" />
                              {language === 'hi' ? 'लॉगिन' : 'Login'}
                            </Button>
                          </Link>
                          <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                            <Button className="w-full gap-2">
                              <UserPlus className="w-5 h-5" />
                              {language === 'hi' ? 'साइनअप' : 'Sign Up'}
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <SOSButton className="w-full" />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="grid grid-cols-6 gap-0.5 p-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium leading-tight text-center">
                  {language === 'hi' ? item.label.hi : item.label.en}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-20" />

      {/* Footer - Desktop only */}
      <div className="hidden md:block">
        <Footer minimal />
      </div>
    </div>
  );
}
