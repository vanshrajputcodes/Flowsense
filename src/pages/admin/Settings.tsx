import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePresentation, PresentationLayout } from '@/contexts/PresentationContext';
import { useDemo } from '@/contexts/DemoContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Mail,
  Smartphone,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Play,
  ChevronDown,
  ArrowRight,
  LayoutGrid,
  Maximize2,
  Film,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const layoutOptions: { id: PresentationLayout; title: string; desc: string; icon: typeof LayoutGrid }[] = [
  { id: 'command-center', title: 'Command Center', desc: 'All modules live in one grid', icon: LayoutGrid },
  { id: 'spotlight', title: 'Module Spotlight', desc: 'One module fullscreen at a time', icon: Maximize2 },
  { id: 'storyteller', title: 'Storyteller', desc: 'Auto-rotates through all modules', icon: Film },
];

export default function SettingsPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const pres = usePresentation();
  const demo = useDemo();
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState({ pres: true, demo: true, reset: true });
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    sosAlarmSound: true,
    autoRefresh: true,
    darkMode: true,
    bilingualAlerts: true,
  });

  const handleSave = () => {
    toast.success(language === 'hi' ? 'सेटिंग्स सहेजी गईं' : 'Settings saved successfully');
  };

  const handleReset = () => {
    pres.resetAll();
    demo.resetAll();
    toast.success('All presentation settings reset to defaults');
  };

  const handleKioskToggle = (checked: boolean) => {
    pres.setKioskMode(checked);
    if (checked) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'hi' ? 'सेटिंग्स' : 'Settings'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'hi' ? 'सिस्टम कॉन्फ़िगरेशन प्रबंधित करें' : 'Manage system configuration'}
          </p>
        </div>

        {/* System Status */}
        <Card className="glass-card border-safe/30 bg-safe/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-safe/20">
                  <Activity className="w-6 h-6 text-safe" />
                </div>
                <div>
                  <h3 className="font-semibold">{language === 'hi' ? 'सिस्टम स्थिति' : 'System Status'}</h3>
                  <p className="text-sm text-muted-foreground">{language === 'hi' ? 'सभी सेवाएं चालू हैं' : 'All services operational'}</p>
                </div>
              </div>
              <Badge className="bg-safe text-safe-foreground">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {language === 'hi' ? 'ऑनलाइन' : 'Online'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Profile Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
            </CardTitle>
            <CardDescription>{language === 'hi' ? 'आपकी खाता जानकारी' : 'Your account information'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{language === 'hi' ? 'ईमेल' : 'Email'}</Label>
                <Input value={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>{language === 'hi' ? 'भूमिका' : 'Role'}</Label>
                <Input value="Administrator" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-caution" />
              {language === 'hi' ? 'सूचनाएं' : 'Notifications'}
            </CardTitle>
            <CardDescription>{language === 'hi' ? 'अलर्ट और सूचना सेटिंग्स' : 'Alert and notification settings'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ToggleRow
              icon={<Mail className="w-5 h-5 text-muted-foreground" />}
              title={language === 'hi' ? 'ईमेल सूचनाएं' : 'Email Notifications'}
              desc={language === 'hi' ? 'महत्वपूर्ण अलर्ट ईमेल प्राप्त करें' : 'Receive email for important alerts'}
              checked={localSettings.emailNotifications}
              onCheckedChange={(v) => setLocalSettings(s => ({ ...s, emailNotifications: v }))}
            />
            <Separator />
            <ToggleRow
              icon={<Smartphone className="w-5 h-5 text-muted-foreground" />}
              title={language === 'hi' ? 'SMS अलर्ट' : 'SMS Alerts'}
              desc={language === 'hi' ? 'आपातकालीन SMS अलर्ट' : 'Emergency SMS alerts'}
              checked={localSettings.smsAlerts}
              onCheckedChange={(v) => setLocalSettings(s => ({ ...s, smsAlerts: v }))}
            />
            <Separator />
            <ToggleRow
              icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
              title={language === 'hi' ? 'SOS अलार्म ध्वनि' : 'SOS Alarm Sound'}
              desc={language === 'hi' ? 'SOS अनुरोधों के लिए ऑडियो अलर्ट' : 'Audio alerts for SOS requests'}
              checked={localSettings.sosAlarmSound}
              onCheckedChange={(v) => setLocalSettings(s => ({ ...s, sosAlarmSound: v }))}
            />
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {language === 'hi' ? 'सिस्टम प्राथमिकताएं' : 'System Preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ToggleRow
              icon={<Database className="w-5 h-5 text-muted-foreground" />}
              title={language === 'hi' ? 'ऑटो रीफ्रेश' : 'Auto Refresh'}
              desc={language === 'hi' ? 'डैशबोर्ड को स्वचालित रूप से अपडेट करें' : 'Automatically update dashboard'}
              checked={localSettings.autoRefresh}
              onCheckedChange={(v) => setLocalSettings(s => ({ ...s, autoRefresh: v }))}
            />
            <Separator />
            <ToggleRow
              icon={<Globe className="w-5 h-5 text-muted-foreground" />}
              title={language === 'hi' ? 'द्विभाषी अलर्ट' : 'Bilingual Alerts'}
              desc={language === 'hi' ? 'हिंदी और अंग्रेजी दोनों में अलर्ट भेजें' : 'Send alerts in Hindi and English'}
              checked={localSettings.bilingualAlerts}
              onCheckedChange={(v) => setLocalSettings(s => ({ ...s, bilingualAlerts: v }))}
            />
          </CardContent>
        </Card>

        {/* ========= PRESENTATION MODE ========= */}
        <Collapsible open={settingsOpen.pres} onOpenChange={(v) => setSettingsOpen(s => ({ ...s, pres: v }))}>
          <Card className="glass-card rounded-xl border">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Presentation Mode</CardTitle>
                        <Badge className="bg-safe/20 text-safe border-safe/30 text-xs">New</Badge>
                      </div>
                      <CardDescription>Show the full system on a single screen — no extra devices needed</CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", settingsOpen.pres && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {/* Layout Picker */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Layout</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {layoutOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = pres.layout === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => pres.setLayout(opt.id)}
                          className={cn(
                            "p-4 rounded-lg border-2 text-left transition-all",
                            selected
                              ? "border-safe bg-safe/10"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <Icon className={cn("w-6 h-6 mb-2", selected ? "text-safe" : "text-muted-foreground")} />
                          <p className="font-medium text-sm">{opt.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Button */}
                <Button
                  className="w-full bg-safe hover:bg-safe/90 text-safe-foreground"
                  size="lg"
                  onClick={() => navigate('/admin/presentation')}
                >
                  Launch Presentation <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Separator />

                {/* Toggles */}
                <ToggleRow
                  title="Auto-rotate modules"
                  desc="Cycles through modules in Storyteller mode"
                  checked={pres.autoRotate}
                  onCheckedChange={pres.setAutoRotate}
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Rotation interval</p>
                    <p className="text-xs text-muted-foreground">Time between module switches</p>
                  </div>
                  <Select
                    value={String(pres.rotationInterval)}
                    onValueChange={(v) => pres.setRotationInterval(Number(v))}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 seconds</SelectItem>
                      <SelectItem value="15000">15 seconds</SelectItem>
                      <SelectItem value="30000">30 seconds</SelectItem>
                      <SelectItem value="60000">60 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <ToggleRow
                  title="Show module name overlay"
                  desc="Displays the module name as a label during presentation"
                  checked={pres.showModuleLabel}
                  onCheckedChange={pres.setShowModuleLabel}
                />
                <Separator />
                <ToggleRow
                  title="Kiosk / fullscreen mode"
                  desc="Hides browser chrome — press Esc to exit"
                  checked={pres.kioskMode}
                  onCheckedChange={handleKioskToggle}
                />
                <Separator />
                <ToggleRow
                  title="QR code overlay"
                  desc="Show scannable QR so audience can open visitor view on phone"
                  checked={pres.showQR}
                  onCheckedChange={pres.setShowQR}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ========= DEMO DATA ========= */}
        <Collapsible open={settingsOpen.demo} onOpenChange={(v) => setSettingsOpen(s => ({ ...s, demo: v }))}>
          <Card className="glass-card rounded-xl border">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Play className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Demo Data</CardTitle>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Beta</Badge>
                      </div>
                      <CardDescription>Inject simulated activity so the system looks live</CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", settingsOpen.demo && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                <ToggleRow
                  title="Enable demo mode"
                  desc="Replaces real data with realistic simulated events"
                  checked={demo.demoMode}
                  onCheckedChange={demo.setDemoMode}
                />
                <Separator />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ToggleRow
                        title="Auto-trigger threats"
                        desc="Simulated threat alerts fire every 10–30 seconds"
                        checked={demo.autoThreats}
                        onCheckedChange={demo.setAutoThreats}
                        disabled={!demo.demoMode}
                      />
                    </div>
                  </TooltipTrigger>
                  {!demo.demoMode && <TooltipContent>Enable demo mode first</TooltipContent>}
                </Tooltip>
                <Separator />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ToggleRow
                        title="Auto-trigger SOS"
                        desc="Simulated SOS events with siren sound"
                        checked={demo.autoSOS}
                        onCheckedChange={demo.setAutoSOS}
                        disabled={!demo.demoMode}
                      />
                    </div>
                  </TooltipTrigger>
                  {!demo.demoMode && <TooltipContent>Enable demo mode first</TooltipContent>}
                </Tooltip>
                <Separator />
                <ToggleRow
                  title="Voice announcements"
                  desc="Web Speech API reads out alerts and queue tokens"
                  checked={demo.voiceEnabled}
                  onCheckedChange={demo.setVoiceEnabled}
                />
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Simulation speed</p>
                    <p className="text-xs text-muted-foreground">Scale all demo animation timers</p>
                  </div>
                  <Select
                    value={String(demo.speed)}
                    onValueChange={(v) => demo.setSpeed(Number(v) as 0.5 | 1 | 2 | 3)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5× Slow</SelectItem>
                      <SelectItem value="1">1× Normal</SelectItem>
                      <SelectItem value="2">2× Fast</SelectItem>
                      <SelectItem value="3">3× Fastest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* ========= RESET ========= */}
        <Collapsible open={settingsOpen.reset} onOpenChange={(v) => setSettingsOpen(s => ({ ...s, reset: v }))}>
          <Card className="glass-card rounded-xl border">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <div className="text-left">
                      <CardTitle className="text-lg">Reset</CardTitle>
                      <CardDescription>Clear presentation and demo state</CardDescription>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", settingsOpen.reset && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Reset all presentation settings</p>
                    <p className="text-xs text-muted-foreground">Clears layout choice, demo config, and all localStorage state</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset settings?</AlertDialogTitle>
                        <AlertDialogDescription>This will turn off demo mode and reset all presentation options.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* System Info */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">{language === 'hi' ? 'सिस्टम जानकारी' : 'System Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{language === 'hi' ? 'संस्करण' : 'Version'}</span>
                <span className="font-mono">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{language === 'hi' ? 'बिल्ड' : 'Build'}</span>
                <span className="font-mono">2026.01.31</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{language === 'hi' ? 'वातावरण' : 'Environment'}</span>
                <span className="font-mono">Production</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{language === 'hi' ? 'डेवलपर' : 'Developer'}</span>
                <span>Vansh Raj Singh</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            {language === 'hi' ? 'सेटिंग्स सहेजें' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function ToggleRow({ icon, title, desc, checked, onCheckedChange, disabled }: {
  icon?: React.ReactNode;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between", disabled && "opacity-50")}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
