import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Loader2, Phone, MapPin, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SOSButtonProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function SOSButton({ variant = 'default', className }: SOSButtonProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenNumber, setTokenNumber] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ name: '', location: '' });
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-detect GPS location when dialog opens
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        
        // Try reverse geocoding via free API
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': language === 'hi' ? 'hi' : 'en' } }
          );
          const data = await res.json();
          if (data.display_name) {
            setLocation(data.display_name.split(',').slice(0, 3).join(', '));
          } else {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch {
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        toast.error(language === 'hi' ? 'स्थान प्राप्त नहीं हो सका' : 'Could not get your location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    detectLocation();
  };

  const validateForm = () => {
    const newErrors = { name: '', location: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = language === 'hi' ? 'नाम आवश्यक है' : 'Name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = language === 'hi' ? 'नाम कम से कम 2 अक्षर का होना चाहिए' : 'Name must be at least 2 characters';
      isValid = false;
    }

    if (!location.trim()) {
      newErrors.location = language === 'hi' ? 'स्थान आवश्यक है' : 'Location is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSOS = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('send-sos', {
        body: {
          name: name.trim(),
          phone: phone.trim() || null,
          location: location.trim(),
          message: message.trim() || (language === 'hi' ? 'आपातकालीन सहायता चाहिए' : 'Emergency assistance needed'),
          latitude: gpsCoords?.lat || null,
          longitude: gpsCoords?.lng || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setTokenNumber(response.data.token_number);
      setIsSuccess(true);
      
      toast.success(
        language === 'hi'
          ? `SOS भेजा गया! टोकन: ${response.data.token_number}`
          : `SOS sent! Token: ${response.data.token_number}`
      );
    } catch (error) {
      console.error('SOS error:', error);
      toast.error(
        language === 'hi'
          ? 'SOS भेजने में विफल। कृपया पुनः प्रयास करें।'
          : 'Failed to send SOS. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setTokenNumber(null);
    setName('');
    setPhone('');
    setLocation('');
    setMessage('');
    setErrors({ name: '', location: '' });
    setGpsCoords(null);
  };

  return (
    <>
      <Button
        variant="destructive"
        size={variant === 'compact' ? 'sm' : 'default'}
        className={cn(
          'gap-1.5 glow-danger animate-pulse hover:animate-none',
          className
        )}
        onClick={handleOpenDialog}
      >
        <AlertTriangle className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
        {language === 'hi' ? 'SOS' : 'SOS'}
      </Button>

      <Dialog open={isOpen} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-md">
          {!isSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-danger">
                  <AlertTriangle className="w-6 h-6" />
                  {language === 'hi' ? 'आपातकालीन SOS' : 'Emergency SOS'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'hi'
                    ? 'यह अलर्ट तुरंत सुरक्षा टीम को भेजा जाएगा। कृपया अपनी जानकारी दें।'
                    : 'This alert will be sent immediately to the security team. Please provide your details.'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sos-name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {language === 'hi' ? 'आपका नाम *' : 'Your Name *'}
                  </Label>
                  <Input
                    id="sos-name"
                    placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sos-phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {language === 'hi' ? 'फ़ोन नंबर (वैकल्पिक)' : 'Phone Number (Optional)'}
                  </Label>
                  <Input
                    id="sos-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(value);
                    }}
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sos-location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {language === 'hi' ? 'आपका स्थान *' : 'Your Location *'}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="h-6 text-xs gap-1"
                    >
                      {isLocating ? (
                        <><Loader2 className="w-3 h-3 animate-spin" />{language === 'hi' ? 'खोज रहा है...' : 'Detecting...'}</>
                      ) : (
                        <><MapPin className="w-3 h-3" />{language === 'hi' ? 'GPS से खोजें' : 'Detect GPS'}</>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="sos-location"
                    placeholder={language === 'hi' ? 'जैसे: मुख्य प्रवेश द्वार के पास, इवेंट एरिया' : 'e.g., Near Main Entry Gate, Event Area'}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={errors.location ? 'border-destructive' : ''}
                    maxLength={200}
                  />
                  {gpsCoords && (
                    <p className="text-xs text-muted-foreground">
                      📍 GPS: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                    </p>
                  )}
                  {errors.location && (
                    <p className="text-sm text-destructive">{errors.location}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sos-message">
                    {language === 'hi' ? 'आपातकाल का विवरण (वैकल्पिक)' : 'Emergency Details (Optional)'}
                  </Label>
                  <Textarea
                    id="sos-message"
                    placeholder={
                      language === 'hi'
                        ? 'क्या हुआ है?'
                        : 'What happened?'
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={resetDialog}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSOS}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'hi' ? 'भेज रहा है...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      {language === 'hi' ? 'SOS भेजें' : 'Send SOS'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-safe">
                  <CheckCircle2 className="w-6 h-6" />
                  {language === 'hi' ? 'SOS भेजा गया!' : 'SOS Sent!'}
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-safe/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-safe" />
                </div>
                
                <div>
                  <p className="text-muted-foreground mb-2">
                    {language === 'hi' ? 'आपका टोकन नंबर:' : 'Your Token Number:'}
                  </p>
                  <p className="text-3xl font-bold text-primary">{tokenNumber}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {language === 'hi'
                    ? 'सुरक्षा टीम को सूचित कर दिया गया है। कृपया अपनी जगह पर रहें, मदद जल्द ही पहुंचेगी।'
                    : 'Security team has been notified. Please stay at your location, help will arrive soon.'}
                </p>
              </div>

              <DialogFooter>
                <Button onClick={resetDialog} className="w-full">
                  {language === 'hi' ? 'बंद करें' : 'Close'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
