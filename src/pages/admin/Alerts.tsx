import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmergencyAlerts } from '@/hooks/useEmergencyAlerts';
import { useRealtimeAlerts, useRealtimeZones } from '@/hooks/useRealtime';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Bell,
  Radio,
  Send,
  CheckCircle,
  Clock,
  MapPin,
  Megaphone,
  Zap,
  Shield,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  info: { color: 'bg-primary/20 text-primary', label: 'Info', icon: Bell },
  warning: { color: 'bg-caution/20 text-caution', label: 'Warning', icon: AlertTriangle },
  critical: { color: 'bg-danger/20 text-danger', label: 'Critical', icon: Zap },
  emergency: { color: 'bg-critical/20 text-critical animate-pulse', label: 'Emergency', icon: Radio },
};

export default function AdminAlertsPage() {
  const { language, t } = useLanguage();
  const { broadcastAlert, resolveAlert, isLoading, emergencyTemplates } = useEmergencyAlerts();
  const { alerts, isLoading: alertsLoading } = useRealtimeAlerts(false);
  const { zones } = useRealtimeZones();

  const [formData, setFormData] = useState({
    title: '',
    title_hi: '',
    message: '',
    message_hi: '',
    severity: 'info' as 'info' | 'warning' | 'critical' | 'emergency',
    zone_ids: [] as string[],
    expires_in_minutes: 60,
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' || a.status === 'expired');

  const handleTemplateSelect = (templateId: string) => {
    const template = emergencyTemplates.find((t) => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        title_hi: template.title_hi,
        message: template.message,
        message_hi: template.message_hi,
        severity: template.severity,
      });
      setSelectedTemplate(templateId);
    }
  };

  const handleBroadcast = async () => {
    if (!formData.title || !formData.message) return;
    
    await broadcastAlert({
      title: formData.title,
      title_hi: formData.title_hi || undefined,
      message: formData.message,
      message_hi: formData.message_hi || undefined,
      severity: formData.severity,
      zone_ids: formData.zone_ids.length > 0 ? formData.zone_ids : undefined,
      expires_in_minutes: formData.expires_in_minutes,
    });

    // Reset form
    setFormData({
      title: '',
      title_hi: '',
      message: '',
      message_hi: '',
      severity: 'info',
      zone_ids: [],
      expires_in_minutes: 60,
    });
    setSelectedTemplate(null);
    setConfirmDialogOpen(false);
  };

  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary" />
            {language === 'hi' ? 'अलर्ट प्रसारण केंद्र' : 'Alert Broadcast Center'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'hi'
              ? 'आपातकालीन अलर्ट और सार्वजनिक सूचनाएं प्रसारित करें'
              : 'Broadcast emergency alerts and public announcements'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Broadcast Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {language === 'hi' ? 'नया अलर्ट बनाएं' : 'Create New Alert'}
              </CardTitle>
              <CardDescription>
                {language === 'hi'
                  ? 'सभी आगंतुकों को तुरंत सूचित करें'
                  : 'Notify all visitors instantly'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Templates */}
              <div>
                <Label className="mb-2 block">
                  {language === 'hi' ? 'त्वरित टेम्पलेट' : 'Quick Templates'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {emergencyTemplates.map((template) => {
                    const config = severityConfig[template.severity];
                    return (
                      <Button
                        key={template.id}
                        variant={selectedTemplate === template.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTemplateSelect(template.id)}
                        className={selectedTemplate === template.id ? '' : config.color}
                      >
                        {language === 'hi' ? template.title_hi : template.title}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Severity */}
              <div>
                <Label>{language === 'hi' ? 'गंभीरता स्तर' : 'Severity Level'}</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({ ...formData, severity: v as typeof formData.severity })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(severityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${config.color}`}>
                            <config.icon className="w-3 h-3" />
                          </div>
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title (English)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Alert title..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>शीर्षक (Hindi)</Label>
                  <Input
                    value={formData.title_hi}
                    onChange={(e) => setFormData({ ...formData, title_hi: e.target.value })}
                    placeholder="अलर्ट शीर्षक..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Message (English)</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Alert message..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>संदेश (Hindi)</Label>
                  <Textarea
                    value={formData.message_hi}
                    onChange={(e) => setFormData({ ...formData, message_hi: e.target.value })}
                    placeholder="अलर्ट संदेश..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* Zone Selection */}
              <div>
                <Label className="mb-2 block">
                  {language === 'hi' ? 'लक्षित क्षेत्र' : 'Target Zones'} ({language === 'hi' ? 'वैकल्पिक' : 'optional'})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {zones.map((zone) => (
                    <Button
                      key={zone.id}
                      variant={formData.zone_ids.includes(zone.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          zone_ids: formData.zone_ids.includes(zone.id)
                            ? formData.zone_ids.filter((id) => id !== zone.id)
                            : [...formData.zone_ids, zone.id],
                        });
                      }}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {zone.name}
                    </Button>
                  ))}
                </div>
                {formData.zone_ids.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'hi' ? 'कोई नहीं चुना = सभी क्षेत्र' : 'None selected = All zones'}
                  </p>
                )}
              </div>

              {/* Expiration */}
              <div>
                <Label>{language === 'hi' ? 'समाप्ति समय' : 'Expires In'}</Label>
                <Select
                  value={formData.expires_in_minutes.toString()}
                  onValueChange={(v) => setFormData({ ...formData, expires_in_minutes: parseInt(v) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="360">6 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Broadcast Button */}
              <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={!formData.title || !formData.message || isLoading}
                    variant={formData.severity === 'emergency' ? 'destructive' : 'default'}
                  >
                    <Radio className={`w-4 h-4 mr-2 ${formData.severity === 'emergency' ? 'animate-pulse' : ''}`} />
                    {language === 'hi' ? 'अलर्ट प्रसारित करें' : 'Broadcast Alert'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {formData.severity === 'emergency' && <AlertTriangle className="w-5 h-5 text-critical" />}
                      {language === 'hi' ? 'प्रसारण की पुष्टि करें' : 'Confirm Broadcast'}
                    </DialogTitle>
                    <DialogDescription>
                      {language === 'hi'
                        ? 'यह अलर्ट सभी आगंतुकों को तुरंत भेजा जाएगा।'
                        : 'This alert will be sent to all visitors immediately.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={severityConfig[formData.severity].color}>
                        {severityConfig[formData.severity].label}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{formData.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{formData.message}</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                      {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                    </Button>
                    <Button
                      variant={formData.severity === 'emergency' ? 'destructive' : 'default'}
                      onClick={handleBroadcast}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="animate-pulse">{language === 'hi' ? 'भेज रहे हैं...' : 'Sending...'}</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {language === 'hi' ? 'पुष्टि करें और भेजें' : 'Confirm & Send'}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  {language === 'hi' ? 'सक्रिय अलर्ट' : 'Active Alerts'}
                </span>
                <Badge variant="secondary">{activeAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="py-8 text-center">
                  <Shield className="w-12 h-12 text-safe mx-auto mb-3" />
                  <p className="font-medium">{language === 'hi' ? 'कोई सक्रिय अलर्ट नहीं' : 'No Active Alerts'}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'hi' ? 'सब कुछ सामान्य है' : 'Everything is running smoothly'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeAlerts.map((alert) => {
                    const config = severityConfig[alert.severity];
                    const Icon = config.icon;
                    return (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border-l-4 ${config.color.replace('text-', 'border-l-')}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm">
                                {language === 'hi' && alert.title_hi ? alert.title_hi : alert.title}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {language === 'hi' && alert.message_hi ? alert.message_hi : alert.message}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResolve(alert.id)}
                            disabled={isLoading}
                            className="shrink-0"
                          >
                            <CheckCircle className="w-4 h-4 text-safe" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card className="glass-card opacity-80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="w-5 h-5 text-safe" />
                {language === 'hi' ? 'हल किए गए अलर्ट' : 'Resolved Alerts'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {resolvedAlerts.slice(0, 6).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-safe shrink-0" />
                      <span className="text-sm truncate">{alert.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {alert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
