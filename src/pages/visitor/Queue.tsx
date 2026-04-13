import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TokenCalledOverlay } from '@/components/TokenCalledOverlay';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Clock,
  Ticket,
  AlertCircle,
  CheckCircle,
  Star,
  Loader2,
  User,
  Phone,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTokenNotification } from '@/hooks/useTokenNotification';

interface Queue {
  id: string;
  name: string;
  name_hi: string | null;
  current_token: number;
  avg_service_time: number | null;
  status: string;
  max_capacity: number | null;
}

export default function QueuePage() {
  const { language, t } = useLanguage();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const [isLoadingQueues, setIsLoadingQueues] = useState(true);
  const [joiningQueue, setJoiningQueue] = useState<string | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [formErrors, setFormErrors] = useState({ name: '', phone: '' });
  
  const { userToken, isTokenCalled, joinQueue, leaveQueue, acknowledgeCall } = useTokenNotification();

  // Fetch queues and waiting counts
  useEffect(() => {
    const fetchQueues = async () => {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (!error && data) {
        setQueues(data);
        
        // Fetch waiting counts for each queue
        const counts: Record<string, number> = {};
        for (const queue of data) {
          const { count } = await supabase
            .from('queue_tokens')
            .select('*', { count: 'exact', head: true })
            .eq('queue_id', queue.id)
            .eq('status', 'waiting');
          counts[queue.id] = count || 0;
        }
        setWaitingCounts(counts);
      }
      setIsLoadingQueues(false);
    };

    fetchQueues();

    // Subscribe to queue updates
    const channel = supabase
      .channel('queues-visitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues' },
        () => fetchQueues()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const validateForm = () => {
    const errors = { name: '', phone: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = language === 'hi' ? 'नाम आवश्यक है' : 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = language === 'hi' ? 'नाम कम से कम 2 अक्षर का होना चाहिए' : 'Name must be at least 2 characters';
      isValid = false;
    } else if (formData.name.trim().length > 100) {
      errors.name = language === 'hi' ? 'नाम 100 अक्षरों से कम होना चाहिए' : 'Name must be less than 100 characters';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      errors.phone = language === 'hi' ? 'फोन नंबर आवश्यक है' : 'Phone number is required';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      errors.phone = language === 'hi' ? 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleJoinQueue = async () => {
    if (!selectedQueueId) return;
    
    if (!validateForm()) return;

    if (userToken) {
      toast.error(
        language === 'hi'
          ? 'आप पहले से ही एक कतार में हैं'
          : 'You are already in a queue'
      );
      return;
    }

    setJoiningQueue(selectedQueueId);
    const token = await joinQueue(selectedQueueId, formData.name, formData.phone);
    
    if (token) {
      toast.success(
        language === 'hi'
          ? `टोकन #${token.token_number} सफलतापूर्वक जारी किया गया!`
          : `Token #${token.token_number} issued successfully!`
      );
      
      // Update waiting count
      setWaitingCounts((prev) => ({
        ...prev,
        [selectedQueueId]: (prev[selectedQueueId] || 0) + 1,
      }));
      
      // Close dialog and reset form
      setSelectedQueueId(null);
      setFormData({ name: '', phone: '' });
    }
    setJoiningQueue(null);
  };

  const handleLeaveQueue = async () => {
    if (!userToken) return;
    
    const queueId = userToken.queue_id;
    await leaveQueue();
    
    toast.info(
      language === 'hi'
        ? 'आपने कतार छोड़ दी है'
        : 'You have left the queue'
    );
    
    // Update waiting count
    setWaitingCounts((prev) => ({
      ...prev,
      [queueId]: Math.max(0, (prev[queueId] || 0) - 1),
    }));
  };

  const openJoinDialog = (queueId: string) => {
    if (userToken) {
      toast.error(
        language === 'hi'
          ? 'आप पहले से ही एक कतार में हैं'
          : 'You are already in a queue'
      );
      return;
    }
    setSelectedQueueId(queueId);
    setFormErrors({ name: '', phone: '' });
  };

  const activeQueue = userToken
    ? queues.find((q) => q.id === userToken.queue_id)
    : null;

  const getPositionAhead = () => {
    if (!userToken || !activeQueue) return 0;
    return Math.max(0, userToken.token_number - activeQueue.current_token - 1);
  };

  // Get stored name from localStorage
  const getStoredName = () => {
    try {
      return localStorage.getItem('mela_queue_name') || '';
    } catch {
      return '';
    }
  };

  return (
    <VisitorLayout>
      {/* Token Called Overlay */}
      {isTokenCalled && userToken && (
        <TokenCalledOverlay
          tokenNumber={userToken.token_number}
          onAcknowledge={acknowledgeCall}
        />
      )}

      {/* Join Queue Dialog */}
      <Dialog open={!!selectedQueueId} onOpenChange={(open) => !open && setSelectedQueueId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'hi' ? 'कतार में शामिल हों' : 'Join Queue'}
            </DialogTitle>
            <DialogDescription>
              {language === 'hi' 
                ? 'अपना नाम और फोन नंबर दर्ज करें'
                : 'Enter your name and phone number to get a token'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
              </Label>
              <Input
                id="name"
                placeholder={language === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your full name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'border-destructive' : ''}
                maxLength={100}
              />
              {formErrors.name && (
                <p className="text-sm text-destructive">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: value });
                }}
                className={formErrors.phone ? 'border-destructive' : ''}
                maxLength={10}
              />
              {formErrors.phone && (
                <p className="text-sm text-destructive">{formErrors.phone}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQueueId(null)}>
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button onClick={handleJoinQueue} disabled={joiningQueue === selectedQueueId}>
              {joiningQueue === selectedQueueId ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'hi' ? 'जुड़ रहा है...' : 'Joining...'}
                </span>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  {language === 'hi' ? 'टोकन लें' : 'Get Token'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">{t('queue')}</h1>
          <p className="text-muted-foreground">
            {language === 'hi'
              ? 'वर्चुअल टोकन लें और लंबी कतारों से बचें'
              : 'Get a virtual token and avoid long queues'}
          </p>
        </div>

        {/* Active Token Card */}
        {userToken && activeQueue && (
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  {t('yourToken')}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={userToken.status === 'called' 
                    ? 'text-safe border-safe animate-pulse' 
                    : 'text-primary border-primary'
                  }
                >
                  {userToken.status === 'called' 
                    ? (language === 'hi' ? '🔔 बुलाया गया!' : '🔔 Called!')
                    : (language === 'hi' ? 'प्रतीक्षा में' : 'Waiting')
                  }
                </Badge>
              </div>
              <CardDescription>
                {language === 'hi' ? (activeQueue.name_hi || activeQueue.name) : activeQueue.name}
                {getStoredName() && (
                  <span className="ml-2 text-foreground">• {getStoredName()}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary">
                    #{userToken.token_number}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {language === 'hi' ? 'आपका टोकन' : 'Your Token'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {getPositionAhead()} {t('peopleAhead')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      ~{userToken.estimated_wait_time || Math.ceil(getPositionAhead() * 2)} {t('minutes')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>{t('currentToken')}: #{activeQueue.current_token}</span>
                  <span>#{userToken.token_number}</span>
                </div>
                <Progress
                  value={
                    getPositionAhead() > 0
                      ? ((userToken.token_number - activeQueue.current_token - getPositionAhead()) /
                          (userToken.token_number - activeQueue.current_token)) *
                        100
                      : 100
                  }
                  className="h-2"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleLeaveQueue}
                disabled={userToken.status === 'called'}
              >
                {t('leaveQueue')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No Token Info */}
        {!userToken && (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium">{t('noActiveToken')}</p>
              <p className="text-sm text-muted-foreground">
                {language === 'hi'
                  ? 'नीचे से एक कतार चुनें'
                  : 'Select a queue below to join'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Available Queues */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {language === 'hi' ? 'उपलब्ध कतारें' : 'Available Queues'}
          </h2>
          
          {isLoadingQueues ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-40" />
                </Card>
              ))}
            </div>
          ) : queues.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'hi' ? 'कोई सक्रिय कतार नहीं' : 'No active queues'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {queues.map((queue) => {
                const waitingCount = waitingCounts[queue.id] || 0;
                const avgWaitTime = Math.ceil((waitingCount * (queue.avg_service_time || 120)) / 60);
                
                return (
                  <Card
                    key={queue.id}
                    className={`glass-card transition-all hover:shadow-lg ${
                      userToken?.queue_id === queue.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {language === 'hi' ? (queue.name_hi || queue.name) : queue.name}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-safe" />
                            <span className="text-xs text-muted-foreground">
                              {language === 'hi' ? 'सक्रिय' : 'Active'}
                            </span>
                          </div>
                        </div>
                        {queue.name.toLowerCase().includes('vip') && (
                          <Badge className="bg-caution/10 text-caution border-caution/20">
                            <Star className="w-3 h-3 mr-1" />
                            VIP
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-bold">{queue.current_token}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {language === 'hi' ? 'वर्तमान' : 'Current'}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-bold">{waitingCount}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {language === 'hi' ? 'प्रतीक्षा' : 'Waiting'}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-lg font-bold">{avgWaitTime}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {language === 'hi' ? 'मिनट' : 'Min'}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        disabled={!!userToken}
                        onClick={() => openJoinDialog(queue.id)}
                      >
                        {userToken?.queue_id === queue.id ? (
                          language === 'hi' ? 'आप इस कतार में हैं' : 'You are in this queue'
                        ) : (
                          t('joinQueue')
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </VisitorLayout>
  );
}
