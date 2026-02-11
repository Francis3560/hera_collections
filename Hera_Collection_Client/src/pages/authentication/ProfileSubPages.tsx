import React from "react";
import { useWishlist } from "@/context/WishlistProvider";
import { useCart } from "@/context/CartProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingCart, MapPin, Plus, CreditCard, Bell, Info, Package, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotifications,
    loading 
  } = useNotifications();

  if (loading && notifications.length === 0) {
    return (
      <Card className="border-none shadow-sm animate-pulse">
        <CardHeader>
          <div className="h-7 w-48 bg-muted rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4 p-4 border rounded-xl">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-muted rounded"></div>
                <div className="h-3 w-3/4 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "order": return Package;
      case "stock": return Info;
      case "success": return CheckCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (isRead: boolean) => {
    return isRead 
      ? "bg-secondary/50 text-muted-foreground" 
      : "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden rounded-[2rem]">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Activity Notifications</CardTitle>
              <CardDescription className="text-lg mt-1">Stay updated with your orders and account activity</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full px-5 py-5 font-semibold text-primary hover:bg-primary/5 border-primary/20"
                  onClick={() => markAllAsRead()}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-8 bg-secondary/30 p-1 rounded-2xl w-fit">
             <Button variant="ghost" size="sm" className="rounded-xl px-6 py-4 font-bold bg-background shadow-sm">All</Button>
             <Button variant="ghost" size="sm" className="rounded-xl px-6 py-4 font-semibold text-muted-foreground">Unread</Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-8 pt-4">
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                return (
                  <div 
                    key={notif.id}
                    className={cn(
                      "group flex items-start gap-4 p-5 rounded-3xl border transition-all duration-300",
                      notif.isRead 
                        ? "bg-secondary/10 border-transparent opacity-75" 
                        : "bg-primary/5 border-primary/10 shadow-lg shadow-primary/5"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                      getNotificationColor(notif.isRead)
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn("text-lg font-bold tracking-tight", !notif.isRead && "text-primary")}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1 text-base leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4">
                        {!notif.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-4 text-xs font-bold text-primary hover:bg-primary/10 rounded-full"
                            onClick={() => markAsRead(notif.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-4 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteNotifications(notif.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    
                    {!notif.isRead && (
                      <div className="h-3 w-3 rounded-full bg-primary mt-3 shrink-0 animate-pulse shadow-[0_0_10px_rgba(205,127,50,0.5)]" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-24 w-24 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
                <Bell className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground text-lg max-w-sm">
                We'll notify you here about order updates, security alerts, and special offers.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Help Card */}
      <Card className="border-none bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] p-8">
        <div className="flex gap-6 items-center">
          <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <Info className="h-8 w-8" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Manage Communication Settings</h4>
            <p className="text-muted-foreground">You can customize how you receive notifications in your security settings.</p>
            <Button variant="link" className="p-0 h-auto text-primary font-bold mt-2" asChild>
              <a href="/profile/security">Updates Settings →</a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
