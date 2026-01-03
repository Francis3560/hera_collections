import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Package } from 'lucide-react';
import { API_BASE_URL } from '@/utils/axiosClient';

interface CartItem {
  id: number;
  productId: number;
  variantId?: number;
  quantity: number;
  variantName?: string;
  product: {
    title: string;
    photos: { url: string; isPrimary: boolean }[];
  };
  variant?: {
    price: string;
    sku: string;
  };
}

interface Cart {
  id?: number;
  items: CartItem[];
  subtotal: number;
}

interface CartSidebarProps {
  cart: Cart | null;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  loading?: boolean;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onCheckout,
  loading 
}) => {
  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const tax = 0; // Backend handles tax if configured, for now assuming included or 0
  const total = subtotal + tax;

  if (!cart || items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-l bg-white dark:bg-zinc-950">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingCart className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="font-semibold text-lg mb-1">Cart is Empty</h3>
        <p className="text-sm">Select products from the catalog to start a sale.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          <h2 className="font-bold text-lg">Current Sale</h2>
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
            {items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearCart} disabled={loading} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {items.map((item) => {
             const price = Number(item.variant?.price || 0);
             const itemTotal = price * item.quantity;
             const photoUrl = item.product.photos?.[0]?.url;
             const fullPhotoUrl = photoUrl ? `${API_BASE_URL}${photoUrl}` : null;

             return (
               <div key={item.id} className="flex gap-3">
                 <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 border flex items-center justify-center">
                   {fullPhotoUrl ? (
                     <img src={fullPhotoUrl} alt={item.product.title} className="w-full h-full object-cover" />
                   ) : (
                     <Package className="w-8 h-8 text-muted-foreground/50" />
                   )}
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col justify-between">
                   <div>
                     <h4 className="font-medium text-sm line-clamp-1" title={item.product.title}>{item.product.title}</h4>
                     <p className="text-xs text-muted-foreground">
                        {item.variantName || item.variant?.sku || 'Default'}
                     </p>
                   </div>
                   <div className="flex items-center justify-between mt-1">
                     <p className="font-semibold text-sm">KES {price.toLocaleString()}</p>
                     
                     <div className="flex items-center gap-1">
                       <Button 
                         variant="outline" 
                         size="icon" 
                         className="h-6 w-6" 
                         onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                         disabled={loading}
                       >
                         <Minus className="w-3 h-3" />
                       </Button>
                       <span className="text-sm w-6 text-center">{item.quantity}</span>
                       <Button 
                         variant="outline" 
                         size="icon" 
                         className="h-6 w-6" 
                         onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                         disabled={loading}
                       >
                         <Plus className="w-3 h-3" />
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             );
          })}
        </div>
      </ScrollArea>

      {/* Footer / Totals */}
      <div className="p-4 bg-muted/30 border-t space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>KES {tax.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg text-primary">
             <span>Total</span>
             <span>KES {total.toLocaleString()}</span>
          </div>
        </div>
        
        <Button 
          size="lg" 
          className="w-full gap-2" 
          onClick={onCheckout}
          disabled={loading}
        >
          <CreditCard className="w-5 h-5" />
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};
