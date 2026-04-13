import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCircle } from 'lucide-react';

interface TokenCalledOverlayProps {
  tokenNumber: number;
  onAcknowledge: () => void;
}

export function TokenCalledOverlay({ tokenNumber, onAcknowledge }: TokenCalledOverlayProps) {
  const { language } = useLanguage();

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-sm border-primary animate-pulse-glow bg-background text-center">
        <CardContent className="pt-8 pb-6 space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
            <Bell className="w-10 h-10 text-primary" />
          </div>

          <div>
            <p className="text-lg text-muted-foreground mb-2">
              {language === 'hi' ? 'आपका टोकन बुलाया गया!' : 'Your Token is Called!'}
            </p>
            <p className="text-6xl font-bold text-primary">#{tokenNumber}</p>
          </div>

          <p className="text-muted-foreground">
            {language === 'hi'
              ? 'कृपया तुरंत काउंटर पर आएं'
              : 'Please proceed to the counter immediately'}
          </p>

          <Button
            size="lg"
            className="w-full gap-2 text-lg py-6"
            onClick={onAcknowledge}
          >
            <CheckCircle className="w-5 h-5" />
            {language === 'hi' ? 'समझ गए' : 'Got it!'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
