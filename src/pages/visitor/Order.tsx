import { useLanguage } from '@/contexts/LanguageContext';
import { VisitorLayout } from '@/layouts/VisitorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Utensils,
  Droplets,
  Package,
  CheckCircle,
  Loader2,
  User,
  Phone,
  MapPin,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  id: string;
  name: string;
  nameHi: string;
  price: number;
  category: 'food' | 'water' | 'other';
  emoji: string;
  description: string;
}

const menuItems: MenuItem[] = [
  // Food
  { id: 'f1', name: 'Puri Bhaji', nameHi: 'पूरी भाजी', price: 50, category: 'food', emoji: '🍛', description: 'Crispy puri with spicy bhaji' },
  { id: 'f2', name: 'Samosa (2 pcs)', nameHi: 'समोसा (2 पीस)', price: 30, category: 'food', emoji: '🥟', description: 'Crispy fried samosa with chutney' },
  { id: 'f3', name: 'Tea / Chai', nameHi: 'चाय', price: 15, category: 'food', emoji: '☕', description: 'Hot masala chai' },
  { id: 'f4', name: 'Poha', nameHi: 'पोहा', price: 40, category: 'food', emoji: '🍚', description: 'Light and tasty poha' },
  { id: 'f5', name: 'Dal Bati', nameHi: 'दाल बाटी', price: 80, category: 'food', emoji: '🫕', description: 'Traditional dal bati churma' },
  { id: 'f6', name: 'Khichdi', nameHi: 'खिचड़ी', price: 60, category: 'food', emoji: '🥘', description: 'Wholesome rice and lentil khichdi' },
  // Water
  { id: 'w1', name: 'Water Bottle 500ml', nameHi: 'पानी बोतल 500ml', price: 20, category: 'water', emoji: '💧', description: 'Sealed mineral water' },
  { id: 'w2', name: 'Water Bottle 1L', nameHi: 'पानी बोतल 1L', price: 30, category: 'water', emoji: '🥤', description: 'Sealed mineral water 1 litre' },
  { id: 'w3', name: 'Juice Pack', nameHi: 'जूस पैक', price: 25, category: 'water', emoji: '🧃', description: 'Assorted fruit juice' },
  { id: 'w4', name: 'Coconut Water', nameHi: 'नारियल पानी', price: 40, category: 'water', emoji: '🥥', description: 'Fresh coconut water' },
  // Other
  { id: 'o1', name: 'Prasad Thali', nameHi: 'प्रसाद थाली', price: 100, category: 'other', emoji: '🌺', description: 'Blessed prasad thali' },
  { id: 'o2', name: 'Agarbatti Pack', nameHi: 'अगरबत्ती पैक', price: 20, category: 'other', emoji: '🪔', description: 'Incense sticks pack' },
  { id: 'o3', name: 'Carry Bag', nameHi: 'कैरी बैग', price: 10, category: 'other', emoji: '🛍️', description: 'Eco-friendly carry bag' },
  { id: 'o4', name: 'Medicine Kit', nameHi: 'दवाई किट', price: 50, category: 'other', emoji: '💊', description: 'Basic first aid / medicine pack' },
];

interface CartItem extends MenuItem {
  qty: number;
}

export default function OrderPage() {
  const { language } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'food' | 'water' | 'other'>('food');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', location: '', notes: '' });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(language === 'hi' ? `${item.nameHi} जोड़ा गया` : `${item.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev
      .map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c)
      .filter((c) => c.qty > 0)
    );
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalAmount = cart.reduce((sum, c) => sum + c.qty * c.price, 0);

  const handlePlaceOrder = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error(language === 'hi' ? 'नाम और फोन नंबर आवश्यक है' : 'Name and phone are required');
      return;
    }
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      toast.error(language === 'hi' ? '10 अंकों का फोन नंबर दर्ज करें' : 'Enter a 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    const items = cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price }));

    const { error } = await supabase.from('orders').insert({
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_location: formData.location,
      notes: formData.notes,
      items,
      total_amount: totalAmount,
      order_type: cart.some((c) => c.category === 'food') ? 'food' : cart.some((c) => c.category === 'water') ? 'water' : 'other',
      status: 'pending',
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(language === 'hi' ? 'ऑर्डर देने में त्रुटि' : 'Error placing order');
      return;
    }

    setOrderSuccess(true);
    setCart([]);
    setFormData({ name: '', phone: '', location: '', notes: '' });
  };

  const categories = [
    { key: 'food' as const, label: language === 'hi' ? 'भोजन' : 'Food', icon: Utensils, emoji: '🍛' },
    { key: 'water' as const, label: language === 'hi' ? 'पानी/पेय' : 'Water & Drinks', icon: Droplets, emoji: '💧' },
    { key: 'other' as const, label: language === 'hi' ? 'अन्य' : 'Other', icon: Package, emoji: '📦' },
  ];

  const filtered = menuItems.filter((m) => m.category === activeCategory);

  if (orderSuccess) {
    return (
      <VisitorLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-safe/10 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-safe" />
          </div>
          <h2 className="text-2xl font-bold">{language === 'hi' ? 'ऑर्डर सफल!' : 'Order Placed!'}</h2>
          <p className="text-muted-foreground max-w-sm">
            {language === 'hi'
              ? 'आपका ऑर्डर प्राप्त हुआ। स्टाफ जल्द ही आपसे संपर्क करेगा।'
              : 'Your order has been received. Our staff will reach you shortly.'}
          </p>
          <Button onClick={() => setOrderSuccess(false)}>
            {language === 'hi' ? 'और ऑर्डर करें' : 'Order More'}
          </Button>
        </div>
      </VisitorLayout>
    );
  }

  return (
    <VisitorLayout>
      <div className="space-y-6 animate-fade-in pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{language === 'hi' ? 'ऑर्डर करें' : 'Order'}</h1>
            <p className="text-muted-foreground text-sm">
              {language === 'hi' ? 'भोजन, पानी और अन्य सामान मंगाएं' : 'Order food, water and more'}
            </p>
          </div>
          {totalItems > 0 && (
            <Button onClick={() => setCartOpen(true)} className="relative gap-2">
              <ShoppingCart className="w-4 h-4" />
              {language === 'hi' ? 'कार्ट' : 'Cart'}
              <Badge className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs bg-danger text-white">
                {totalItems}
              </Badge>
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              variant={activeCategory === cat.key ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setActiveCategory(cat.key)}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const cartItem = cart.find((c) => c.id === item.id);
            return (
              <Card key={item.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-3xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight">
                          {language === 'hi' ? item.nameHi : item.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        <p className="text-primary font-bold mt-1">₹{item.price}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {cartItem ? (
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => updateQty(item.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{cartItem.qty}</span>
                          <Button size="icon" variant="outline" className="w-7 h-7" onClick={() => updateQty(item.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(item)} className="gap-1">
                          <Plus className="w-3 h-3" />
                          {language === 'hi' ? 'जोड़ें' : 'Add'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Floating Cart Bar */}
        {totalItems > 0 && (
          <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40">
            <Button
              className="w-full shadow-2xl py-6 text-base gap-3"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="flex-1 text-left">
                {totalItems} {language === 'hi' ? 'आइटम' : 'item(s)'}
              </span>
              <span>₹{totalAmount} →</span>
            </Button>
          </div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {language === 'hi' ? 'आपकी कार्ट' : 'Your Cart'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {language === 'hi' ? 'कार्ट खाली है' : 'Cart is empty'}
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{language === 'hi' ? item.nameHi : item.name}</p>
                    <p className="text-xs text-primary">₹{item.price} × {item.qty} = ₹{item.price * item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="w-6 h-6" onClick={() => updateQty(item.id, -1)}>
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <Button size="icon" variant="outline" className="w-6 h-6" onClick={() => updateQty(item.id, 1)}>
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-6 h-6 text-danger ml-1" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <>
              <div className="border-t pt-3 flex items-center justify-between font-semibold">
                <span>{language === 'hi' ? 'कुल' : 'Total'}</span>
                <span className="text-primary text-lg">₹{totalAmount}</span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCartOpen(false)}>
                  {language === 'hi' ? 'जारी रखें' : 'Continue'}
                </Button>
                <Button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                  {language === 'hi' ? 'चेकआउट' : 'Checkout'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="flex items-center gap-2"><User className="w-4 h-4" />{language === 'hi' ? 'नाम *' : 'Name *'}</Label>
              <Input
                placeholder={language === 'hi' ? 'आपका नाम' : 'Your name'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2"><Phone className="w-4 h-4" />{language === 'hi' ? 'फोन *' : 'Phone *'}</Label>
              <Input
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                type="tel"
              />
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2"><MapPin className="w-4 h-4" />{language === 'hi' ? 'लोकेशन / स्थान' : 'Location / Where to deliver'}</Label>
              <Input
                placeholder={language === 'hi' ? 'जैसे: गेट 2 के पास, ब्लॉक A' : 'e.g. Near Gate 2, Block A'}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>{language === 'hi' ? 'विशेष टिप्पणी' : 'Special Notes'}</Label>
              <Textarea
                placeholder={language === 'hi' ? 'कोई विशेष आवश्यकता...' : 'Any special requirements...'}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'hi' ? 'कुल आइटम:' : 'Total items:'}</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between font-semibold mt-1">
                <span>{language === 'hi' ? 'कुल राशि:' : 'Total amount:'}</span>
                <span className="text-primary">₹{totalAmount}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              {language === 'hi' ? 'वापस' : 'Back'}
            </Button>
            <Button onClick={handlePlaceOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{language === 'hi' ? 'ऑर्डर हो रहा है...' : 'Placing...'}</>
              ) : (
                language === 'hi' ? 'ऑर्डर दें' : 'Place Order'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VisitorLayout>
  );
}
