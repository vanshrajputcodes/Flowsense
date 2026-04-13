import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  MapPin,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Zap,
  Shield,
} from 'lucide-react';

// Simulated real-time data
const mockZones = [
  { id: 1, name: 'Main Entry Gate', nameHi: 'मुख्य प्रवेश द्वार', status: 'green' as const, occupancy: 45 },
  { id: 2, name: 'Event Area', nameHi: 'इवेंट क्षेत्र', status: 'yellow' as const, occupancy: 72 },
  { id: 3, name: 'Food Plaza', nameHi: 'फूड प्लाज़ा', status: 'red' as const, occupancy: 89 },
  { id: 4, name: 'Visitor Parking', nameHi: 'विज़िटर पार्किंग', status: 'green' as const, occupancy: 35 },
];

const mockQueues = [
  { id: 1, name: 'Entry Queue A', wait: 15, people: 45 },
  { id: 2, name: 'Entry Queue B', wait: 8, people: 23 },
];

export default function VisitorHome() {
  const { language, t } = useLanguage();

  return (
    <VisitorLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-primary-foreground">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">
              {language === 'hi' ? 'नमस्ते! 🙏' : 'Welcome! 🙏'}
            </h1>
            <p className="text-primary-foreground/80 mb-4">
              {language === 'hi'
                ? 'फ्लोसेंस AI के साथ अपनी यात्रा को सुरक्षित और आरामदायक बनाएं'
                : 'Make your visit safe and comfortable with FlowSense AI'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/queue">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Users className="w-4 h-4" />
                  {t('joinQueue')}
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="secondary" size="sm" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('map')}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-safe/10">
                  <Shield className="w-5 h-5 text-safe" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3/4</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'सुरक्षित क्षेत्र' : 'Safe Zones'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">~12</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'मिनट प्रतीक्षा' : 'Min Wait'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-caution/10">
                  <TrendingUp className="w-5 h-5 text-caution" />
                </div>
                <div>
                  <p className="text-2xl font-bold">68%</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'क्षमता' : 'Capacity'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-danger/10">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'hi' ? 'अलर्ट' : 'Alerts'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone Status */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('zones')}</CardTitle>
              <Link to="/map">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t('viewAll')}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={zone.status} showLabel={false} size="sm" pulse={zone.status === 'red'} />
                    <span className="font-medium">
                      {language === 'hi' ? zone.nameHi : zone.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {zone.occupancy}%
                    </span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          zone.status === 'green'
                            ? 'bg-safe'
                            : zone.status === 'yellow'
                            ? 'bg-caution'
                            : 'bg-danger'
                        }`}
                        style={{ width: `${zone.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Queues */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('activeQueues')}</CardTitle>
              <Link to="/queue">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  {t('viewAll')}
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {mockQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-medium">{queue.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {queue.people} {language === 'hi' ? 'लोग' : 'people'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      ~{queue.wait} {language === 'hi' ? 'मि.' : 'min'}
                    </p>
                    <Link to="/queue">
                      <Button size="sm" className="mt-1 gap-1">
                        <Zap className="w-3 h-3" />
                        {t('joinQueue')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </VisitorLayout>
  );
}
