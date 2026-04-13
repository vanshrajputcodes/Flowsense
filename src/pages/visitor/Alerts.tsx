import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealtimeAlerts } from '@/hooks/useRealtime';
import {
  AlertTriangle,
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Radio,
  Wifi,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  info: {
    icon: Info,
    bgClass: 'bg-primary/10',
    iconClass: 'text-primary',
    borderClass: 'border-l-primary',
    badgeClass: 'bg-primary/10 text-primary',
    label: 'Info',
    labelHi: 'सूचना',
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-caution/10',
    iconClass: 'text-caution',
    borderClass: 'border-l-caution',
    badgeClass: 'bg-caution/10 text-caution',
    label: 'Warning',
    labelHi: 'चेतावनी',
  },
  critical: {
    icon: AlertTriangle,
    bgClass: 'bg-danger/10',
    iconClass: 'text-danger',
    borderClass: 'border-l-danger',
    badgeClass: 'bg-danger/10 text-danger',
    label: 'Critical',
    labelHi: 'गंभीर',
  },
  emergency: {
    icon: Radio,
    bgClass: 'bg-critical/10',
    iconClass: 'text-critical',
    borderClass: 'border-l-critical',
    badgeClass: 'bg-critical/10 text-critical animate-pulse',
    label: 'Emergency',
    labelHi: 'आपातकाल',
  },
};

export default function AlertsPage() {
  const { language, t } = useLanguage();
  const { alerts, isLoading } = useRealtimeAlerts(false);
  const [newAlertId, setNewAlertId] = useState<string | null>(null);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved' || a.status === 'expired');

  // Flash effect for new alerts
  useEffect(() => {
    if (activeAlerts.length > 0) {
      const latestAlert = activeAlerts[0];
      const createdAt = new Date(latestAlert.created_at).getTime();
      const now = Date.now();
      // If alert is less than 10 seconds old, flash it
      if (now - createdAt < 10000) {
        setNewAlertId(latestAlert.id);
        const timer = setTimeout(() => setNewAlertId(null), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [activeAlerts]);

  return (
    <VisitorLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('alerts')}</h1>
            <p className="text-muted-foreground">
              {language === 'hi'
                ? 'महत्वपूर्ण सूचनाएं और अलर्ट'
                : 'Important notifications and alerts'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-safe">
              <Wifi className="w-3 h-3" />
              <span>{language === 'hi' ? 'लाइव' : 'Live'}</span>
            </div>
          </div>
        </div>

        {/* Active Alerts Count */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
          <div className="p-3 rounded-full bg-primary/10">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{activeAlerts.length}</p>
            <p className="text-sm text-muted-foreground">
              {language === 'hi' ? 'सक्रिय अलर्ट' : 'Active Alerts'}
            </p>
          </div>
          {activeAlerts.some((a) => a.severity === 'emergency' || a.severity === 'critical') && (
            <div className="ml-auto">
              <Badge className="bg-danger/20 text-danger animate-pulse">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {language === 'hi' ? 'तत्काल ध्यान दें' : 'Attention Required'}
              </Badge>
            </div>
          )}
        </div>

        {/* Active Alerts */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              {language === 'hi' ? 'सक्रिय अलर्ट' : 'Active Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <RefreshCw className="w-8 h-8 text-primary mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
                </p>
              </div>
            ) : activeAlerts.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle className="w-12 h-12 text-safe mx-auto mb-3" />
                <p className="text-lg font-medium">{t('noAlerts')}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'hi'
                    ? 'सब कुछ सामान्य है'
                    : 'Everything is running smoothly'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const config = severityConfig[alert.severity];
                  const Icon = config.icon;
                  const isNew = alert.id === newAlertId;

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${config.bgClass} ${config.borderClass} transition-all duration-300 ${
                        isNew ? 'ring-2 ring-primary animate-pulse' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${config.bgClass}`}>
                          <Icon className={`w-5 h-5 ${config.iconClass}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">
                              {language === 'hi' && alert.title_hi
                                ? alert.title_hi
                                : alert.title}
                            </h3>
                            <Badge className={config.badgeClass}>
                              {language === 'hi' ? config.labelHi : config.label}
                            </Badge>
                            {isNew && (
                              <Badge className="bg-primary text-primary-foreground text-xs">
                                {language === 'hi' ? 'नया' : 'New'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {language === 'hi' && alert.message_hi
                              ? alert.message_hi
                              : alert.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(alert.created_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <Card className="glass-card opacity-75">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-safe" />
                {language === 'hi' ? 'हल किए गए अलर्ट' : 'Resolved Alerts'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resolvedAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-safe" />
                      <span className="text-sm">
                        {language === 'hi' && alert.title_hi
                          ? alert.title_hi
                          : alert.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </VisitorLayout>
  );
}
