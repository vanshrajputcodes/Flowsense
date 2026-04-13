import { useState, useRef } from 'react';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, CheckCircle, Loader2, Download, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';

export default function RegisterPage() {
  const { language } = useLanguage();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [regData, setRegData] = useState<any>(null);

  const generateQR = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'FS-';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleRegister = async () => {
    if (!form.full_name.trim()) {
      toast.error(language === 'hi' ? 'नाम आवश्यक है' : 'Name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const code = generateQR();
      const { data, error } = await supabase.from('event_registrations').insert({
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        qr_code: code,
      }).select().single();

      if (error) throw error;
      setQrCode(code);
      setRegData(data);
      toast.success(language === 'hi' ? 'पंजीकरण सफल!' : 'Registration successful!');
    } catch (err: any) {
      toast.error(`Failed: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement('a');
      a.download = `QR-${qrCode}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <VisitorLayout>
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            {language === 'hi' ? 'इवेंट पंजीकरण' : 'Event Registration'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'hi' ? 'पहले रजिस्टर करें, QR कोड मिलेगा — गेट पर दिखाएं' : 'Register to get your QR code for entry'}
          </p>
        </div>

        {!qrCode ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {language === 'hi' ? 'विवरण भरें' : 'Fill Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</label>
                <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder={language === 'hi' ? 'अपना नाम' : 'Your full name'} />
              </div>
              <div>
                <label className="text-sm font-medium">{language === 'hi' ? 'ईमेल' : 'Email'}</label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium">{language === 'hi' ? 'फ़ोन नंबर' : 'Phone Number'}</label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91..." />
              </div>
              <Button onClick={handleRegister} disabled={isSubmitting} className="w-full gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                {isSubmitting ? (language === 'hi' ? 'रजिस्टर हो रहा है...' : 'Registering...') : (language === 'hi' ? 'रजिस्टर करें' : 'Register & Get QR')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-safe">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-bold">{language === 'hi' ? 'पंजीकरण सफल!' : 'Registration Successful!'}</span>
              </div>

              <div className="p-4 bg-white rounded-xl inline-block" ref={qrRef}>
                <QRCodeSVG value={qrCode} size={200} level="H" includeMargin />
              </div>

              <div className="space-y-1">
                <p className="font-mono text-xl font-bold tracking-wider">{qrCode}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi' ? 'यह कोड गेट पर दिखाएं' : 'Show this code at the entry gate'}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border text-left text-sm space-y-1">
                <p><strong>{language === 'hi' ? 'नाम' : 'Name'}:</strong> {regData?.full_name}</p>
                {regData?.email && <p><strong>{language === 'hi' ? 'ईमेल' : 'Email'}:</strong> {regData.email}</p>}
                {regData?.phone && <p><strong>{language === 'hi' ? 'फ़ोन' : 'Phone'}:</strong> {regData.phone}</p>}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleDownloadQR}>
                  <Download className="w-4 h-4" /> {language === 'hi' ? 'QR डाउनलोड करें' : 'Download QR'}
                </Button>
                <Button className="flex-1 gap-2" onClick={() => { setQrCode(null); setForm({ full_name: '', email: '', phone: '' }); }}>
                  <UserPlus className="w-4 h-4" /> {language === 'hi' ? 'नया पंजीकरण' : 'New Registration'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VisitorLayout>
  );
}
