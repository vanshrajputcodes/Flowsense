import { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { QrCode, Scan, Users, CheckCircle, AlertTriangle, Thermometer, Search, ClipboardList, Camera, CameraOff } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function QRCheckinPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [scanCode, setScanCode] = useState('');
  const [scannedReg, setScannedReg] = useState<any>(null);
  const [healthForm, setHealthForm] = useState({ temperature: '', symptoms: [] as string[], notes: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const SYMPTOM_LIST = ['Fever', 'Cough', 'Cold', 'Body Ache', 'Headache', 'Breathing Difficulty', 'Vomiting', 'Diarrhea'];

  const stopCamera = useCallback(async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch {}
      try { html5QrRef.current.clear(); } catch {}
      html5QrRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    await stopCamera();

    // Request camera permission directly in user gesture context
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found on this device.');
      } else {
        toast.error(`Camera error: ${err?.message}`);
      }
      return;
    }

    // Show the div first, then start scanner
    setIsCameraOn(true);

    // Small delay to ensure DOM element is rendered
    await new Promise(r => setTimeout(r, 100));

    try {
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      // Stop the preview stream before html5-qrcode takes over
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanCode(decodedText);
          toast.success(`QR Scanned: ${decodedText}`);
          stopCamera();
        },
        () => {}
      );
    } catch (err: any) {
      toast.error(`Scanner error: ${err?.message}`);
      setIsCameraOn(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);


  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('checkin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    const [{ data: regs }, { data: scrs }] = await Promise.all([
      supabase.from('event_registrations').select('*').order('created_at', { ascending: false }),
      supabase.from('health_screenings').select('*, event_registrations(full_name, qr_code)').order('created_at', { ascending: false }).limit(50),
    ]);
    if (regs) setRegistrations(regs);
    if (scrs) setScreenings(scrs);
  };

  const handleScan = async () => {
    if (!scanCode.trim()) { toast.error('Enter QR code'); return; }
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('qr_code', scanCode.trim())
      .maybeSingle();
    if (error || !data) {
      toast.error('Invalid QR code - not found');
      setScannedReg(null);
      return;
    }
    if (data.checked_in) {
      toast.warning(`${data.full_name} is already checked in!`);
    }
    setScannedReg(data);
    setHealthForm({ temperature: '', symptoms: [], notes: '' });
  };

  const handleHealthClear = async () => {
    if (!scannedReg) return;
    setIsProcessing(true);
    try {
      const temp = parseFloat(healthForm.temperature) || 0;
      const hasFever = temp > 99.5;
      const isCleared = !hasFever && healthForm.symptoms.length === 0;

      // Create health screening
      await supabase.from('health_screenings').insert({
        registration_id: scannedReg.id,
        temperature: temp || null,
        symptoms: healthForm.symptoms,
        has_fever: hasFever,
        is_cleared: isCleared,
        notes: healthForm.notes || null,
      } as any);

      // Update registration
      await supabase.from('event_registrations').update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        health_cleared: isCleared,
      }).eq('id', scannedReg.id);

      if (isCleared) {
        toast.success(`✅ ${scannedReg.full_name} checked in successfully!`);
      } else {
        toast.warning(`⚠️ ${scannedReg.full_name} flagged - ${hasFever ? 'fever detected' : 'symptoms reported'}`);
      }

      setScannedReg(null);
      setScanCode('');
      fetchData();
    } catch (err: any) {
      toast.error(`Error: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setHealthForm(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const checkedIn = registrations.filter(r => r.checked_in).length;
  const flagged = registrations.filter(r => r.checked_in && !r.health_cleared).length;
  const filtered = registrations.filter(r =>
    r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.qr_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="w-6 h-6 text-primary" />
            QR Check-in & Health Screening
          </h1>
          <p className="text-muted-foreground text-sm">Scan QR codes, verify health, and manage entry</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Registered', value: registrations.length, icon: Users, color: 'text-primary' },
            { label: 'Checked In', value: checkedIn, icon: CheckCircle, color: 'text-safe' },
            { label: 'Pending', value: registrations.length - checkedIn, icon: QrCode, color: 'text-caution' },
            { label: 'Flagged', value: flagged, icon: AlertTriangle, color: 'text-danger' },
          ].map(s => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-8 h-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="scan">
          <TabsList>
            <TabsTrigger value="scan">Scan & Check-in</TabsTrigger>
            <TabsTrigger value="registrations">All Registrations ({registrations.length})</TabsTrigger>
            <TabsTrigger value="screenings">Health Log ({screenings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scan className="w-5 h-5" /> Scan QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera Scanner */}
                  <div className="flex gap-2">
                    <Button
                      variant={isCameraOn ? 'destructive' : 'secondary'}
                      onClick={isCameraOn ? stopCamera : startCamera}
                      className="gap-2"
                    >
                      {isCameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                      {isCameraOn ? 'Stop Camera' : 'Scan with Camera'}
                    </Button>
                  </div>
                  <div id="qr-reader" style={{ display: isCameraOn ? 'block' : 'none', minHeight: isCameraOn ? 300 : 0 }} className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />

                  <div className="flex gap-2">
                    <Input
                      value={scanCode}
                      onChange={e => setScanCode(e.target.value)}
                      placeholder="Enter or scan QR code..."
                      onKeyDown={e => e.key === 'Enter' && handleScan()}
                    />
                    <Button onClick={handleScan} className="gap-2">
                      <Search className="w-4 h-4" /> Verify
                    </Button>
                  </div>

                  {scannedReg && (
                    <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-safe" />
                        <span className="font-bold text-lg">{scannedReg.full_name}</span>
                        {scannedReg.checked_in && <Badge variant="secondary">Already Checked In</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                        <p>📧 {scannedReg.email || 'N/A'}</p>
                        <p>📱 {scannedReg.phone || 'N/A'}</p>
                        <p>🎫 {scannedReg.qr_code}</p>
                        <p>📅 {new Date(scannedReg.created_at).toLocaleDateString()}</p>
                      </div>

                      {!scannedReg.checked_in && (
                        <div className="space-y-3 pt-3 border-t">
                          <h4 className="font-medium flex items-center gap-2">
                            <Thermometer className="w-4 h-4" /> Health Screening
                          </h4>
                          <div>
                            <label className="text-sm">Temperature (°F)</label>
                            <Input
                              type="number"
                              value={healthForm.temperature}
                              onChange={e => setHealthForm(p => ({ ...p, temperature: e.target.value }))}
                              placeholder="98.6"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="text-sm">Symptoms</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {SYMPTOM_LIST.map(s => (
                                <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm">
                                  <Checkbox checked={healthForm.symptoms.includes(s)} onCheckedChange={() => toggleSymptom(s)} />
                                  {s}
                                </label>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleHealthClear} disabled={isProcessing} className="w-full gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {isProcessing ? 'Processing...' : 'Complete Check-in'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Check-in Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-5xl font-bold text-primary">{Math.round((checkedIn / Math.max(1, registrations.length)) * 100)}%</p>
                      <p className="text-muted-foreground mt-1">{checkedIn} / {registrations.length} checked in</p>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${(checkedIn / Math.max(1, registrations.length)) * 100}%` }} />
                    </div>
                    {flagged > 0 && (
                      <div className="p-3 rounded-lg border border-danger/30 bg-danger/5">
                        <p className="text-sm font-medium text-danger flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {flagged} visitor(s) flagged during health screening
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="registrations">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name or QR code..." className="max-w-sm" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filtered.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.email} • {r.phone}</p>
                        <p className="text-xs font-mono text-muted-foreground">QR: {r.qr_code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.checked_in ? (
                          <>
                            <Badge className={r.health_cleared ? 'bg-safe' : 'bg-danger'}>
                              {r.health_cleared ? '✅ Cleared' : '⚠️ Flagged'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{new Date(r.checked_in_at).toLocaleTimeString()}</span>
                          </>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screenings">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> Health Screening Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {screenings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No screenings recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {screenings.map((s: any) => (
                      <div key={s.id} className={`p-3 rounded-lg border ${s.is_cleared ? 'border-safe/30' : 'border-danger/30 bg-danger/5'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{(s as any).event_registrations?.full_name || 'Unknown'}</p>
                            <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>🌡️ {s.temperature ? `${s.temperature}°F` : 'N/A'}</span>
                              {s.has_fever && <span className="text-danger font-medium">FEVER</span>}
                              {(s.symptoms?.length || 0) > 0 && <span>Symptoms: {s.symptoms.join(', ')}</span>}
                            </div>
                          </div>
                          <Badge className={s.is_cleared ? 'bg-safe' : 'bg-danger'}>
                            {s.is_cleared ? 'Cleared' : 'Flagged'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
