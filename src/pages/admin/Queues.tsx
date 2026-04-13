import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRealtimeQueues } from '@/hooks/useRealtime';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users,
  Clock,
  Plus,
  Play,
  Pause,
  XCircle,
  RefreshCw,
  ChevronRight,
  UserCheck,
  Bell,
  Settings,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QueueToken {
  id: string;
  token_number: number;
  status: string;
  phone: string | null;
  is_priority: boolean;
  created_at: string;
  called_at: string | null;
  estimated_wait_time: number | null;
}

export default function QueuesPage() {
  const { language } = useLanguage();
  const { queues, isLoading } = useRealtimeQueues();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newQueueDialogOpen, setNewQueueDialogOpen] = useState(false);
  const [newQueue, setNewQueue] = useState({
    name: '',
    name_hi: '',
    max_capacity: 500,
    avg_service_time: 120,
  });

  // Fetch tokens for selected queue
  useEffect(() => {
    if (selectedQueue) {
      fetchTokens(selectedQueue);
    }
  }, [selectedQueue]);

  const fetchTokens = async (queueId: string) => {
    setTokensLoading(true);
    const { data, error } = await supabase
      .from('queue_tokens')
      .select('*')
      .eq('queue_id', queueId)
      .in('status', ['waiting', 'called'])
      .order('is_priority', { ascending: false })
      .order('token_number', { ascending: true })
      .limit(50);

    if (!error && data) {
      setTokens(data);
    }
    setTokensLoading(false);
  };

  const handleCreateQueue = async () => {
    if (!newQueue.name) {
      toast.error(language === 'hi' ? 'नाम आवश्यक है' : 'Name is required');
      return;
    }

    setIsCreating(true);
    const { error } = await supabase.from('queues').insert({
      name: newQueue.name,
      name_hi: newQueue.name_hi || null,
      max_capacity: newQueue.max_capacity,
      avg_service_time: newQueue.avg_service_time,
      status: 'active',
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'hi' ? 'कतार बनाई गई' : 'Queue created');
      setNewQueueDialogOpen(false);
      setNewQueue({ name: '', name_hi: '', max_capacity: 500, avg_service_time: 120 });
    }
    setIsCreating(false);
  };

  const handleQueueAction = async (queueId: string, action: 'pause' | 'resume' | 'close') => {
    setIsUpdating(true);
    const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
    
    const { error } = await supabase
      .from('queues')
      .update({ status: newStatus })
      .eq('id', queueId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        language === 'hi' 
          ? `कतार ${action === 'pause' ? 'रोकी गई' : action === 'resume' ? 'फिर से शुरू' : 'बंद'}` 
          : `Queue ${action}d`
      );
    }
    setIsUpdating(false);
  };

  const handleCallNext = async (queueId: string) => {
    setIsUpdating(true);
    
    // Find next waiting token
    const { data: nextToken, error: fetchError } = await supabase
      .from('queue_tokens')
      .select('*')
      .eq('queue_id', queueId)
      .eq('status', 'waiting')
      .order('is_priority', { ascending: false })
      .order('token_number', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchError || !nextToken) {
      toast.info(language === 'hi' ? 'कोई टोकन प्रतीक्षा में नहीं' : 'No tokens waiting');
      setIsUpdating(false);
      return;
    }

    // Update token status
    const { error: updateError } = await supabase
      .from('queue_tokens')
      .update({ 
        status: 'called',
        called_at: new Date().toISOString()
      })
      .eq('id', nextToken.id);

    // Update queue's current token
    await supabase
      .from('queues')
      .update({ current_token: nextToken.token_number })
      .eq('id', queueId);

    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success(
        language === 'hi' 
          ? `टोकन #${nextToken.token_number} को बुलाया गया` 
          : `Called Token #${nextToken.token_number}`
      );
      fetchTokens(queueId);
    }
    setIsUpdating(false);
  };

  const handleMarkServed = async (tokenId: string, tokenNumber: number) => {
    const { error } = await supabase
      .from('queue_tokens')
      .update({ 
        status: 'served',
        served_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        language === 'hi' 
          ? `टोकन #${tokenNumber} सेवा पूर्ण` 
          : `Token #${tokenNumber} served`
      );
      if (selectedQueue) fetchTokens(selectedQueue);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-safe/20 text-safe border-safe/30">{language === 'hi' ? 'सक्रिय' : 'Active'}</Badge>;
      case 'paused':
        return <Badge className="bg-caution/20 text-caution border-caution/30">{language === 'hi' ? 'रुकी' : 'Paused'}</Badge>;
      case 'closed':
        return <Badge className="bg-muted text-muted-foreground">{language === 'hi' ? 'बंद' : 'Closed'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedQueueData = queues.find(q => q.id === selectedQueue);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'hi' ? 'कतार प्रबंधन' : 'Queue Management'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'hi' ? 'वर्चुअल कतारों का प्रबंधन करें' : 'Manage virtual queues'}
            </p>
          </div>
          
          <Dialog open={newQueueDialogOpen} onOpenChange={setNewQueueDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {language === 'hi' ? 'नई कतार' : 'New Queue'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === 'hi' ? 'नई कतार बनाएं' : 'Create New Queue'}</DialogTitle>
                <DialogDescription>
                  {language === 'hi' ? 'कतार का विवरण दर्ज करें' : 'Enter queue details'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'नाम (अंग्रेज़ी)' : 'Name (English)'}</Label>
                  <Input
                    value={newQueue.name}
                    onChange={(e) => setNewQueue({ ...newQueue, name: e.target.value })}
                    placeholder="Entry Queue A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'hi' ? 'नाम (हिंदी)' : 'Name (Hindi)'}</Label>
                  <Input
                    value={newQueue.name_hi}
                    onChange={(e) => setNewQueue({ ...newQueue, name_hi: e.target.value })}
                    placeholder="प्रवेश कतार A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'अधिकतम क्षमता' : 'Max Capacity'}</Label>
                    <Input
                      type="number"
                      value={newQueue.max_capacity}
                      onChange={(e) => setNewQueue({ ...newQueue, max_capacity: parseInt(e.target.value) || 500 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'hi' ? 'औसत सेवा समय (सेकंड)' : 'Avg Service Time (sec)'}</Label>
                    <Input
                      type="number"
                      value={newQueue.avg_service_time}
                      onChange={(e) => setNewQueue({ ...newQueue, avg_service_time: parseInt(e.target.value) || 120 })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewQueueDialogOpen(false)}>
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </Button>
                <Button onClick={handleCreateQueue} disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {language === 'hi' ? 'बनाएं' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Queue List & Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Queue List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {language === 'hi' ? 'कतारें' : 'Queues'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : queues.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {language === 'hi' ? 'कोई कतार नहीं' : 'No queues yet'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {queues.map((queue) => (
                      <div
                        key={queue.id}
                        onClick={() => setSelectedQueue(queue.id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedQueue === queue.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {language === 'hi' ? (queue.name_hi || queue.name) : queue.name}
                          </span>
                          {getStatusBadge(queue.status)}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {queue.current_token}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            ~{Math.round((queue.avg_service_time || 120) / 60)} min
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Queue Details */}
          <div className="lg:col-span-2">
            {selectedQueue && selectedQueueData ? (
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {language === 'hi' ? (selectedQueueData.name_hi || selectedQueueData.name) : selectedQueueData.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {language === 'hi' ? 'वर्तमान टोकन:' : 'Current Token:'} #{selectedQueueData.current_token}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {selectedQueueData.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(selectedQueue, 'pause')}
                          disabled={isUpdating}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          {language === 'hi' ? 'रोकें' : 'Pause'}
                        </Button>
                      ) : selectedQueueData.status === 'paused' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQueueAction(selectedQueue, 'resume')}
                          disabled={isUpdating}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {language === 'hi' ? 'शुरू करें' : 'Resume'}
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleQueueAction(selectedQueue, 'close')}
                        disabled={isUpdating || selectedQueueData.status === 'closed'}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {language === 'hi' ? 'बंद करें' : 'Close'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Call Next Button */}
                  <Button
                    size="lg"
                    className="w-full gap-2 text-lg py-6"
                    onClick={() => handleCallNext(selectedQueue)}
                    disabled={isUpdating || selectedQueueData.status !== 'active'}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                    {language === 'hi' ? 'अगला बुलाएं' : 'Call Next'}
                  </Button>

                  {/* Token List */}
                  <div>
                    <h3 className="font-medium mb-3 flex items-center justify-between">
                      <span>{language === 'hi' ? 'प्रतीक्षा में' : 'Waiting Tokens'}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchTokens(selectedQueue)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </h3>
                    
                    {tokensLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : tokens.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">
                        {language === 'hi' ? 'कोई टोकन प्रतीक्षा में नहीं' : 'No tokens waiting'}
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>{language === 'hi' ? 'स्थिति' : 'Status'}</TableHead>
                            <TableHead>{language === 'hi' ? 'फ़ोन' : 'Phone'}</TableHead>
                            <TableHead>{language === 'hi' ? 'प्रतीक्षा' : 'Waiting'}</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tokens.map((token) => (
                            <TableRow key={token.id}>
                              <TableCell className="font-bold">
                                {token.is_priority && '⭐ '}#{token.token_number}
                              </TableCell>
                              <TableCell>
                                <Badge variant={token.status === 'called' ? 'default' : 'outline'}>
                                  {token.status === 'called' 
                                    ? (language === 'hi' ? 'बुलाया गया' : 'Called')
                                    : (language === 'hi' ? 'प्रतीक्षा' : 'Waiting')}
                                </Badge>
                              </TableCell>
                              <TableCell>{token.phone || '-'}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell>
                                {token.status === 'called' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkServed(token.id, token.token_number)}
                                  >
                                    <UserCheck className="w-4 h-4 mr-1" />
                                    {language === 'hi' ? 'सेवित' : 'Served'}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {language === 'hi' 
                      ? 'विवरण देखने के लिए एक कतार चुनें' 
                      : 'Select a queue to view details'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}