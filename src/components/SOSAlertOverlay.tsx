import { useSOSListener } from '@/hooks/useSOSListener';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  X,
  MessageCircle,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function SOSAlertOverlay() {
  const { language } = useLanguage();
  const { newSOSAlert, respondToSOS, dismissAlert, activeSOSRequests } = useSOSListener();

  const handleRespond = async () => {
    if (!newSOSAlert) return;
    
    const success = await respondToSOS(newSOSAlert.id);
    if (success) {
      toast.success(
        language === 'hi'
          ? 'SOS का जवाब दे दिया गया'
          : 'SOS has been responded to'
      );
    }
  };

  if (!newSOSAlert) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md border-danger animate-pulse-glow bg-background">
        <CardHeader className="bg-danger/10 border-b border-danger/30">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              {language === 'hi' ? '🚨 SOS अलर्ट!' : '🚨 SOS ALERT!'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={dismissAlert}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <Badge variant="destructive" className="text-lg px-4 py-1 mb-4">
              {newSOSAlert.token_number}
            </Badge>
          </div>

          <div className="space-y-3">
            {newSOSAlert.sender_name && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <User className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'नाम' : 'Name'}
                  </p>
                  <p className="font-medium">{(newSOSAlert as any).sender_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi' ? 'स्थान' : 'Location'}
                </p>
                <p className="font-medium">
                  {newSOSAlert.location || (language === 'hi' ? 'अज्ञात' : 'Unknown')}
                </p>
                {(newSOSAlert as any).latitude && (newSOSAlert as any).longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${(newSOSAlert as any).latitude},${(newSOSAlert as any).longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    📍 {language === 'hi' ? 'Google Maps में खोलें' : 'Open in Google Maps'}
                  </a>
                )}
              </div>
            </div>

            {newSOSAlert.phone && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'फ़ोन' : 'Phone'}
                  </p>
                  <p className="font-medium">{newSOSAlert.phone}</p>
                </div>
              </div>
            )}

            {newSOSAlert.message && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <MessageCircle className="w-5 h-5 text-caution mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'संदेश' : 'Message'}
                  </p>
                  <p className="font-medium">{newSOSAlert.message}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(newSOSAlert.created_at), { addSuffix: true })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={dismissAlert}
            >
              {language === 'hi' ? 'बाद में' : 'Later'}
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={handleRespond}
            >
              <CheckCircle className="w-4 h-4" />
              {language === 'hi' ? 'जवाब दें' : 'Respond'}
            </Button>
          </div>

          {activeSOSRequests.length > 1 && (
            <p className="text-center text-sm text-muted-foreground">
              +{activeSOSRequests.length - 1} {language === 'hi' ? 'और SOS अनुरोध' : 'more SOS requests'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
