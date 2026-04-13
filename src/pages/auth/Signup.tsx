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
import { Loader2, User } from 'lucide-react';

export default function SignupPage() {
  const { signUp } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(
        language === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords do not match'
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(
          language === 'hi'
            ? 'खाता बनाया गया! कृपया अपना ईमेल सत्यापित करें।'
            : 'Account created! Please verify your email.'
        );
        navigate('/login');
      }
    } catch (err) {
      toast.error(language === 'hi' ? 'कुछ गलत हो गया' : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

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
            <User className="w-6 h-6" />
            {language === 'hi' ? 'उपयोगकर्ता खाता बनाएं' : 'Create User Account'}
          </CardTitle>
          <CardDescription>
            {language === 'hi'
              ? 'विज़िटर के रूप में पंजीकरण करें'
              : 'Register as a visitor'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {language === 'hi' 
                ? '⚠️ यह केवल उपयोगकर्ता खाता बनाता है। व्यवस्थापक खाते के लिए अधिकृत व्यवस्थापक से संपर्क करें।'
                : '⚠️ This creates a user account only. Contact an authorized administrator for admin access.'}
            </p>
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'hi' ? 'खाता बना रहा है...' : 'Creating account...'}
                </>
              ) : (
                t('signUp')
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('login')}
              </Link>
            </div>

            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← {language === 'hi' ? 'विज़िटर ऐप पर वापस जाएं' : 'Back to Visitor App'}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
