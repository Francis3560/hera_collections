import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from "lucide-react";
import { API_BASE_URL } from "@/utils/axiosClient.ts";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, cartCount } = useCart();

  const getProductImage = (item: any) => {
    if (item.product?.photos?.[0]) {
      return `${API_BASE_URL}${item.product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculatedTotal = items.reduce((sum: number, item: any) => {
    const price = parseFloat(item.variant?.price || "0");
    return sum + (price * item.quantity);
  }, 0);

  const displayTotal = calculatedTotal || total; // Fallback to context total if local matches

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Looks like you haven't added anything to your cart yet. Explore our collection and find something beautiful.
          </p>
          <Button asChild className="rounded-full px-8 py-6 text-lg">
            <Link to="/collections">Start Shopping</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/5">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-light mb-10">Shopping <span className="font-semibold">Cart</span></h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item: any) => (
              <div key={item.id} className="bg-background rounded-3xl p-6 shadow-sm border border-border/40 flex flex-col sm:flex-row gap-6 items-center transition-all hover:shadow-md">
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-secondary/20 flex-shrink-0">
                  <img 
                    src={getProductImage(item)} 
                    alt={item.product?.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/200x200?text=Product';
                    }}
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold mb-1">{item.product?.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {item.variant?.sku}
                    {item.variant?.optionValues?.map((ov: any) => (
                      <span key={ov.id} className="ml-2 px-2 py-0.5 bg-secondary rounded text-xs">
                        {ov.optionValue.value}
                      </span>
                    ))}
                  </p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <div className="flex items-center border border-border rounded-full p-1 bg-secondary/10">
                      <button 
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-background rounded-full transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                          item.quantity >= (item.variant?.stock || 0)
                            ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-50" 
                            : "hover:bg-background"
                        }`}
                        disabled={item.quantity >= (item.variant?.stock || 0)}
                        title={item.quantity >= (item.variant?.stock || 0) ? "Max stock reached" : "Increase quantity"}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 transition-colors p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(parseFloat(item.variant?.price || "0") * item.quantity)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(parseFloat(item.variant?.price || "0"))} each
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-3xl p-8 shadow-xl border border-border/40 sticky top-32">
              <h2 className="text-2xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatPrice(displayTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-3xl font-bold text-primary">{formatPrice(displayTotal)}</span>
                </div>
              </div>
              
              <Button asChild className="w-full py-8 rounded-full text-lg shadow-lg hover:shadow-xl transition-all gap-2 group">
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <div className="mt-6 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#2eb135]/10 text-[#2eb135] rounded-lg font-bold border border-[#2eb135]/20">
                  <div className="w-2 h-2 bg-[#2eb135] rounded-full animate-pulse" />
                  M-PESA
                </div>
                <span>Secure Mobile Payment</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
