import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { Loader2, Shield, User } from 'lucide-react';

type LoginType = 'select' | 'user' | 'admin';

export default function LoginPage() {
  const { signIn, isAdmin } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<LoginType>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }
      
      // Check if trying to login as admin but user is not admin
      if (loginType === 'admin') {
        // We need to wait a bit for the isAdmin state to update
        // Check admin role directly from database
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: session } = await supabase.auth.getSession();
        
        if (session?.session?.user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (!roleData) {
            toast.error(
              language === 'hi' 
                ? 'आपके पास व्यवस्थापक पहुंच नहीं है' 
                : 'You do not have admin access'
            );
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
        }
        
        toast.success(language === 'hi' ? 'व्यवस्थापक के रूप में लॉगिन!' : 'Logged in as Admin!');
        navigate('/admin');
      } else {
        toast.success(language === 'hi' ? 'सफलतापूर्वक लॉगिन!' : 'Logged in successfully!');
        navigate('/');
      }
    } catch (err) {
      toast.error(language === 'hi' ? 'कुछ गलत हो गया' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setLoginType('select');
    setEmail('');
    setPassword('');
  };

  // Role selection screen
  if (loginType === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-md glass-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <CardTitle className="text-2xl">
              {language === 'hi' ? 'लॉगिन करें' : 'Login'}
            </CardTitle>
            <CardDescription>
              {language === 'hi'
                ? 'आप कैसे लॉगिन करना चाहते हैं?'
                : 'How would you like to login?'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => setLoginType('user')}
            >
              <User className="w-6 h-6" />
              <div>
                <p className="font-semibold">
                  {language === 'hi' ? 'विज़िटर / उपयोगकर्ता' : 'Visitor / User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' ? 'कतार और सुविधाओं तक पहुंचें' : 'Access queues and facilities'}
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-20 flex flex-col gap-2 border-primary/50 hover:border-primary"
              onClick={() => setLoginType('admin')}
            >
              <Shield className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-primary">
                  {language === 'hi' ? 'व्यवस्थापक' : 'Administrator'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'hi' ? 'डैशबोर्ड और प्रबंधन' : 'Dashboard and management'}
                </p>
              </div>
            </Button>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground">
              {language === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
              <Link to="/signup" className="text-primary hover:underline">
                {t('signUp')}
              </Link>
            </div>

            <div className="text-center">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← {language === 'hi' ? 'विज़िटर ऐप पर वापस जाएं' : 'Back to Visitor App'}
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {loginType === 'admin' ? (
              <>
                <Shield className="w-6 h-6 text-primary" />
                {language === 'hi' ? 'व्यवस्थापक लॉगिन' : 'Admin Login'}
              </>
            ) : (
              <>
                <User className="w-6 h-6" />
                {language === 'hi' ? 'उपयोगकर्ता लॉगिन' : 'User Login'}
              </>
            )}
          </CardTitle>
          <CardDescription>
            {language === 'hi'
              ? 'अपने क्रेडेंशियल्स के साथ साइन इन करें'
              : 'Sign in with your credentials'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="link"
              className="px-0 text-sm"
            >
              {t('forgotPassword')}
            </Button>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'hi' ? 'साइन इन हो रहा है...' : 'Signing in...'}
                </>
              ) : (
                t('login')
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleBack}
            >
              ← {language === 'hi' ? 'वापस जाएं' : 'Go Back'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {language === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
              <Link to="/signup" className="text-primary hover:underline">
                {t('signUp')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
