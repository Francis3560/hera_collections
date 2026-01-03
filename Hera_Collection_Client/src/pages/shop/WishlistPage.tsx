import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/context/WishlistProvider";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function WishlistPage() {
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const getProductImage = (item: any) => {
    if (item.product?.photos?.[0]) {
      return `${API_BASE_URL}${item.product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  const formatPrice = (price: number | string | null) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price || 0;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(numPrice);
  };

  const handleAddToCart = async (item: any) => {
    try {
        await addToCart(item.productId, item.variantId, 1);
        toast.success("Added to cart");
    } catch (error) {
        toast.error("Failed to add to cart");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Guest Wishlist</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Please sign in to see your saved items and sync them across your devices.
          </p>
          <div className="flex gap-4">
            <Button asChild className="rounded-full px-8">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full px-8">
              <Link to="/collections">Browse Shop</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
     return (
        <div className="min-h-screen flex flex-col">
          <Header />
            <main className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </main>
          <Footer />
        </div>
     )
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
            <Heart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Save items you love here for later. Start exploring our collection to find your favorites.
          </p>
          <Button asChild className="rounded-full px-8 py-6 text-lg">
            <Link to="/collections">Explore Collections</Link>
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
        <h1 className="text-4xl font-light mb-10">My <span className="font-semibold">Wishlist</span></h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item: any) => (
              <div key={item.id} className="bg-background rounded-3xl overflow-hidden shadow-sm border border-border/40 hover:shadow-xl transition-all duration-300 group flex flex-col">
                <div className="relative aspect-square overflow-hidden bg-secondary/20 rounded-2xl m-4">
                  <img 
                    src={getProductImage(item)} 
                    alt={item.product?.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/200x200?text=Product';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                     <button 
                        onClick={() => removeFromWishlist(item.id)}
                        className="bg-background/80 backdrop-blur-md p-2 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                  {item.product?.category && (
                    <Badge variant="secondary" className="absolute top-3 left-3 bg-background/80 backdrop-blur-md">
                        {item.product.category.name}
                    </Badge>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-1 line-clamp-1">{item.product?.title}</h3>
                  <div className="text-muted-foreground text-sm mb-4 flex-1">
                     <p className="line-clamp-2">{item.product?.description}</p>
                     {item.variant && (
                        <p className="mt-2 text-xs">Variant: {item.variant.sku}</p>
                     )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <span className="text-xl font-bold text-primary">
                        {formatPrice(item.variant?.price || item.product?.price)}
                    </span>
                    <Button 
                        size="sm" 
                        className="rounded-full gap-2 hover:px-6 transition-all"
                        onClick={() => handleAddToCart(item)}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
