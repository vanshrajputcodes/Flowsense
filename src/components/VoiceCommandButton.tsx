import { useLanguage } from '@/contexts/LanguageContext';
import { useVoiceCommand } from '@/hooks/useVoiceCommand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mic, MicOff, Volume2, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function VoiceCommandButton() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isListening, result, error, startListening, stopListening, clearResult } = useVoiceCommand(language as 'en' | 'hi');

  const handleOpen = () => {
    setOpen(true);
    clearResult();
  };

  const handleClose = () => {
    stopListening();
    setOpen(false);
    clearResult();
  };

  // Auto-navigate based on action
  const handleActionClick = () => {
    if (!result) return;
    if (result.action === 'order_food' || result.action === 'order_water') {
      navigate('/order');
      handleClose();
    } else if (result.action === 'queue_status') {
      navigate('/queue');
      handleClose();
    } else if (result.action === 'nearest_washroom') {
      navigate('/facilities');
      handleClose();
    } else if (result.action === 'find_exit') {
      navigate('/map');
      handleClose();
    }
  };

  const getActionLabel = () => {
    if (!result) return null;
    const labels: Record<string, { en: string; hi: string }> = {
      order_food: { en: 'Go to Order page', hi: 'ऑर्डर पृष्ठ पर जाएं' },
      order_water: { en: 'Go to Order page', hi: 'ऑर्डर पृष्ठ पर जाएं' },
      queue_status: { en: 'Go to Queue page', hi: 'कतार पृष्ठ पर जाएं' },
      nearest_washroom: { en: 'Go to Facilities', hi: 'सुविधाएं देखें' },
      find_exit: { en: 'Open Map', hi: 'मानचित्र खोलें' },
    };
    return labels[result.action] ?? null;
  };

  const actionLabel = getActionLabel();

  return (
    <>
      {/* Floating voice button */}
      <Button
        variant="outline"
        size="icon"
        className="relative w-10 h-10 rounded-full border-primary/50 hover:bg-primary/10"
        onClick={handleOpen}
        title={language === 'hi' ? 'वॉयस कमांड' : 'Voice Command'}
      >
        <Mic className="w-4 h-4 text-primary" />
      </Button>

      {/* Voice Command Dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              {language === 'hi' ? 'वॉयस कमांड' : 'Voice Command'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {/* Mic Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg',
                isListening
                  ? 'bg-danger animate-pulse scale-110 text-white'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              )}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <p className="text-sm text-muted-foreground text-center">
              {isListening
                ? (language === 'hi' ? 'सुन रहा हूं...' : 'Listening...')
                : (language === 'hi' ? 'बोलने के लिए दबाएं' : 'Tap to speak')}
            </p>

            {/* Example commands */}
            {!isListening && !result && (
              <div className="w-full space-y-1.5">
                <p className="text-xs text-muted-foreground text-center font-medium uppercase tracking-wide">
                  {language === 'hi' ? 'उदाहरण' : 'Try saying'}
                </p>
                {[
                  { en: '"Nearest washroom"', hi: '"शौचालय कहाँ है"' },
                  { en: '"Crowd status"', hi: '"भीड़ कितनी है"' },
                  { en: '"Order food"', hi: '"खाना मंगाओ"' },
                  { en: '"Emergency help"', hi: '"मदद करो"' },
                ].map((ex, i) => (
                  <div key={i} className="text-xs text-center text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    {language === 'hi' ? ex.hi : ex.en}
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <Card className="w-full border-danger/30 bg-danger/5">
                <CardContent className="p-3 text-sm text-danger">{error}</CardContent>
              </Card>
            )}

            {/* Result */}
            {result && (
              <Card className="w-full border-primary/30 bg-primary/5">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'hi' ? 'आपने कहा:' : 'You said:'} <em>{result.transcript}</em>
                      </p>
                      <p className="text-sm font-medium">
                        {language === 'hi' ? result.responseHi : result.response}
                      </p>
                    </div>
                  </div>
                  {actionLabel && (
                    <Button size="sm" className="w-full" onClick={handleActionClick}>
                      {language === 'hi' ? actionLabel.hi : actionLabel.en}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
