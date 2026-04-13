import { useLanguage } from '@/contexts/LanguageContext';
import { Heart } from 'lucide-react';

interface FooterProps {
  minimal?: boolean;
}

export function Footer({ minimal = false }: FooterProps) {
  const { t } = useLanguage();

  if (minimal) {
    return (
      <footer className="py-3 px-4 text-center text-xs text-muted-foreground border-t border-border/50">
        {t('developerCredit')}
      </footer>
    );
  }

  return (
    <footer className="py-6 px-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {new Date().getFullYear()} FlowSense AI</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">{t('tagline')}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-danger fill-danger" />
            <span>by</span>
            <span className="font-medium text-foreground">Vansh Raj Singh</span>
          </div>
          
          <div className="text-xs text-muted-foreground">
            v1.0.0-beta
          </div>
        </div>
      </div>
    </footer>
  );
}
