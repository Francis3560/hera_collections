import React from "react";
import { useWishlist } from "@/context/WishlistProvider";
import { useCart } from "@/context/CartProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, MapPin, Plus, CreditCard, Bell, Info } from "lucide-react";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const formatPrice = (price: number | string | null) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price || 0;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0
  }).format(numPrice);
};

export const ProfileWishlist = () => {
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const getProductImage = (item: any) => {
    if (item.product?.photos?.[0]) {
      return `${API_BASE_URL}${item.product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  if (loading) return <div>Loading wishlist...</div>;

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Wishlist</CardTitle>
          <CardDescription>You haven't saved any items yet.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-12">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-6">Explore our collection to find something you love!</p>
          <Button asChild>
            <a href="/collections">Browse Collections</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Wishlist</h2>
        <Badge variant="outline">{items.length} items</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item: any) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={getProductImage(item)} 
                  alt={item.product?.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{item.product?.title}</h4>
                <p className="text-primary font-bold mt-1">
                  {formatPrice(item.variant?.price || item.product?.price)}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      addToCart(item.productId, item.variantId, 1);
                      toast.success("Added to cart");
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const ProfileAddresses = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Shipping Addresses</CardTitle>
            <CardDescription>Manage your delivery locations</CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-12">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-6">No addresses saved yet.</p>
        <Button variant="outline">Learn about delivery zones</Button>
      </CardContent>
    </Card>
  );
};

export const ProfilePayments = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Securely save your payment options</CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-12">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-6">No payment methods saved.</p>
        <div className="flex gap-4">
           {/* Add MPESA badge or something for local context */}
           <Badge className="bg-green-600">MPESA</Badge>
           <Badge variant="outline">Credit Card</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProfileNotifications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Stay updated on your orders and offers</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-12">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">You're all caught up! No new notifications.</p>
      </CardContent>
    </Card>
  );
};
