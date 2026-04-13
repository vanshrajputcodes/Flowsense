import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  RefreshCw,
  User,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_location: string | null;
  notes: string | null;
  items: OrderItem[];
  total_amount: number | null;
  order_type: string;
  status: string;
  created_at: string;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-caution/10 text-caution border-caution/30' },
  preparing: { label: 'Preparing', icon: Package, className: 'bg-primary/10 text-primary border-primary/30' },
  delivering: { label: 'Delivering', icon: Truck, className: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-safe/10 text-safe border-safe/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-danger/10 text-danger border-danger/30' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, delivering: 0, delivered: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const typed = data.map((o) => ({
        ...o,
        items: Array.isArray(o.items) ? (o.items as unknown as OrderItem[]) : [],
      }));
      setOrders(typed);
      setStats({
        total: typed.length,
        pending: typed.filter((o) => o.status === 'pending').length,
        delivering: typed.filter((o) => o.status === 'delivering').length,
        delivered: typed.filter((o) => o.status === 'delivered').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      toast.error('Error updating order status');
    } else {
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    }
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-primary" />
              Orders
            </h1>
            <p className="text-muted-foreground text-sm">Manage visitor food and item orders</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.total, icon: ShoppingBag, color: 'text-primary' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-caution' },
            { label: 'Delivering', value: stats.delivering, icon: Truck, color: 'text-blue-500' },
            { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-safe' },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Filter:</span>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="delivering">Delivering</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-32" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = config.icon;
              return (
                <Card key={order.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Order Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={config.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {order.order_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'dd MMM, hh:mm a')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span className="text-foreground font-medium">{order.customer_name}</span>
                          </div>
                          {order.customer_phone && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{order.customer_phone}</span>
                            </div>
                          )}
                          {order.customer_location && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{order.customer_location}</span>
                            </div>
                          )}
                        </div>

                        {/* Items */}
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {item.name} × {item.qty}
                            </Badge>
                          ))}
                        </div>

                        {order.notes && (
                          <p className="text-xs text-muted-foreground italic">📝 {order.notes}</p>
                        )}
                      </div>

                      {/* Amount + Status Update */}
                      <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-2">
                        <p className="text-xl font-bold text-primary">₹{order.total_amount}</p>
                        <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="delivering">Delivering</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
