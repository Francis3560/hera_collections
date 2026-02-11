import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { useQuery } from "@tanstack/react-query"; 
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Menu,
  X,
  User,
  Heart,
  ShoppingCart,
  ChevronDown,
  Package,
  LogOut,
  Sparkles,
  UserCircle,
  Shield,
  Bell,
  Package2,
  Clock,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import Logo from '@/components/Images/HeraCollection Logo.jpg';
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import CategoryService from "@/api/categories.service";
import DiscountService from "@/api/discount.service";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Collections", href: "/collections" },
  { name: "About Us", href: "/about" },
];

export default function Header() {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    isVerified, 
    role, 
    logout,
    userStats
  } = useAuth();
  
  const { items: cartItems, cartCount, total: cartTotal, removeItem } = useCart();
  const { wishlistCount } = useWishlist();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
  } = useNotifications();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories-tree"],
    queryFn: () => CategoryService.getAllCategories({ tree: 'true' })
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ["active-discounts"],
    queryFn: DiscountService.getAllDiscounts
  });

  const activeDiscount = React.useMemo(() => {
    if (!discounts || discounts.length === 0) return null;
    const validDiscounts = discounts.filter((d: any) => d.isActive !== false);
    if (validDiscounts.length === 0) return null;
    return validDiscounts.sort((a: any, b: any) => 
      (b.percentage || b.discountPercentage || 0) - (a.percentage || a.discountPercentage || 0)
    )[0];
  }, [discounts]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getProductImage = (item: any) => {
    if (item.product?.photos?.[0]?.url) {
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

  const calculatedTotal = cartItems.reduce((sum: number, item: any) => {
    const price = item.price !== undefined ? parseFloat(item.price) : parseFloat(item.variant?.price || "0");
    return sum + (price * item.quantity);
  }, 0);

  const displayTotal = calculatedTotal || cartTotal;

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order": return Package;
      case "stock": return Package2;
      case "alert": return Shield;
      case "success": return CheckCircle;
      case "user": return User;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order": return "text-blue-500 bg-blue-500/10";
      case "stock": return "text-amber-500 bg-amber-500/10";
      case "alert": return "text-red-500 bg-red-500/10";
      case "success": return "text-green-500 bg-green-500/10";
      case "user": return "text-purple-500 bg-purple-500/10";
      default: return "text-primary bg-primary/10";
    }
  };

  return (
    <>
      {activeDiscount && (
        <div className="bg-primary text-primary-foreground py-3 px-4 text-sm text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 animate-pulse">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">
              {activeDiscount.name || "Flash Sales"} - {Math.round(activeDiscount.percentage || activeDiscount.discountPercentage)}% off for grabs!
            </span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer"></div>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/95 dark:bg-background/95 backdrop-blur-xl shadow-xl border-b border-border dark:border-border/80" 
            : "bg-background dark:bg-background border-b border-border/20 dark:border-border/40"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex-shrink-0 group transition-transform duration-300 hover:scale-105">
              <div className="h-16 w-16 flex items-center">
                <img
                  src={Logo}
                  alt="Hera Collections - Premium Bags & Accessories"
                  className="h-full w-full object-contain transition-all duration-300 rounded-full group-hover:brightness-110"
                />
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                if (item.name === "Collections") {
                  return (
                    <DropdownMenu key={item.name}>
                      <DropdownMenuTrigger className="relative px-6 py-2 text-foreground/90 dark:text-foreground/80 hover:text-primary-accent dark:hover:text-primary-accent font-medium transition-all duration-300 group flex items-center gap-1 focus:outline-none">
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                        <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-4/5 group-hover:left-1/10"></div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[600px] p-6 glass-card border-border/50 grid grid-cols-2 gap-8 shadow-2xl">
                        {categories?.length > 0 ? (
                          categories.map((cat: any) => (
                            <div key={cat.id} className="space-y-4">
                              <Link 
                                to={`/collections?category=${cat.slug}`} 
                                className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm hover:translate-x-1 transition-transform"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <Sparkles className="h-4 w-4" />
                                {cat.name}
                              </Link>
                              
                              <div className="flex flex-col space-y-2 ml-6 border-l border-border/50 pl-4">
                                {cat.subCategories?.length > 0 ? (
                                  cat.subCategories.map((sub: any) => (
                                    <Link
                                      key={sub.id}
                                      to={`/collections?subcategory=${sub.slug}`}
                                      className="text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {sub.name}
                                    </Link>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 italic font-normal">No styles yet</span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-muted-foreground text-sm italic">No collections available.</div>
                        )}
                        <DropdownMenuSeparator className="col-span-2 my-2 opacity-50" />
                        <div className="col-span-2 flex justify-center">
                          <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full px-6" asChild>
                            <Link to="/collections">View Full Catalog</Link>
                          </Button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return (
                  <Link key={item.name} to={item.href} className="relative px-6 py-2 text-foreground/90 dark:text-foreground/80 hover:text-primary-accent dark:hover:text-primary-accent font-medium transition-all duration-300 group">
                    {item.name}
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-4/5 group-hover:left-1/10"></div>
                  </Link>
                );
              })}
              <Link to="/contact" className="relative px-6 py-2 text-foreground/90 dark:text-foreground/80 hover:text-primary-accent dark:hover:text-primary-accent font-medium transition-all duration-300 group">
                Contact Us
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-4/5 group-hover:left-1/10"></div>
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <div className="relative">
                {isSearchOpen ? (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-background dark:bg-background border border-border dark:border-border/60 rounded-full shadow-lg p-1 z-50">
                    <Input
                      type="search"
                      placeholder="Search luxury bags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-54 pr-10 border-0 focus:ring-0 rounded-full bg-transparent"
                      autoFocus
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8" onClick={() => setIsSearchOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300" onClick={() => setIsSearchOpen(true)}>
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-12 px-3 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300 gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials()}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium truncate max-w-24">{user?.name?.split(" ")[0] || "User"}</div>
                        <div className="text-xs text-muted-foreground">{role === "ADMIN" ? "Admin" : "Member"}</div>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-4 shadow-2xl border border-border dark:border-border/60 bg-background/95 dark:bg-background/95 backdrop-blur-xl rounded-2xl space-y-2">
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-secondary/30 dark:bg-secondary/20 mb-2">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white font-bold text-lg">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{user?.name || "User"}</p>
                        <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={isVerified ? "default" : "secondary"} className="text-xs">{isVerified ? "✓ Verified" : "Unverified"}</Badge>
                          <Badge variant="outline" className="text-xs">{role === "ADMIN" ? "👑 Admin" : "👤 Member"}</Badge>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="p-3 rounded-lg cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-3">
                        <UserCircle className="h-4 w-4 text-primary-accent" />
                        <div>
                          <div className="font-medium">My Profile</div>
                          <div className="text-xs text-muted-foreground">View and edit your profile</div>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    {role === "ADMIN" && (
                      <DropdownMenuItem asChild className="p-3 rounded-lg cursor-pointer">
                        <Link to="/admin/dashboard" className="flex items-center gap-3">
                          <Sparkles className="h-4 w-4 text-cta" />
                          <div>
                            <div className="font-medium text-cta">Admin Dashboard</div>
                            <div className="text-xs text-muted-foreground">Manage store and users</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="p-3 rounded-lg text-destructive cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" className="hidden sm:flex items-center gap-2 px-6 py-2 text-foreground/90 rounded-full font-medium" asChild>
                  <Link to="/login"><User className="h-4 w-4" />Login</Link>
                </Button>
              )}

              {isAuthenticated && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full relative group">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0 shadow-2xl border border-border bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden" align="end">
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                      <h3 className="font-semibold text-foreground">Notifications</h3>
                      {unreadCount > 0 && <Button variant="ghost" size="sm" className="text-xs h-8 text-primary" onClick={() => markAllAsRead()}>Mark all read</Button>}
                    </div>
                    <ScrollArea className="h-[350px]">
                      {notifications?.length > 0 ? (
                        <div className="divide-y divide-border/50">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={cn(
                                "flex gap-3 p-4 hover:bg-secondary/50 cursor-pointer relative", 
                                !notif.isRead && "bg-primary-accent/5"
                              )} 
                              onClick={() => { 
                                if (!notif.isRead) markAsRead(notif.id); 
                                navigate("/profile/notifications");
                              }}
                            >
                              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0", getNotificationColor(notif.type.toLowerCase()))}>
                                {React.createElement(getNotificationIcon(notif.type.toLowerCase()), { className: "h-4 w-4" })}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-1">{notif.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[350px] text-center p-6">
                          <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                          <p className="text-sm font-medium">No notifications</p>
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}

              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full relative group" asChild>
                <Link to="/wishlist">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent">{wishlistCount}</Badge>}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full relative group">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent">{cartCount}</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-6 shadow-2xl border border-border bg-background/95 backdrop-blur-xl rounded-2xl">
                  <h3 className="font-semibold text-xl mb-6 flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Your Cart</h3>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">Your cart is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {cartItems.map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 rounded-xl bg-secondary/30 group/item">
                            <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={getProductImage(item)} alt={item.product?.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{item.product?.title}</p>
                              <p className="text-sm text-muted-foreground">{formatPrice(parseFloat(item.price || item.variant?.price || "0"))} × {item.quantity}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-500 opacity-0 group-hover/item:opacity-100">Remove</Button>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border/50 mt-6 pt-6">
                        <div className="flex justify-between items-center mb-6 text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-primary-accent">{formatPrice(displayTotal)}</span>
                        </div>
                        <div className="flex space-x-3">
                          <Button variant="outline" className="flex-1 rounded-full" asChild><Link to="/cart">View Cart</Link></Button>
                          <Button className="flex-1 bg-gradient-to-r from-cta to-primary-accent rounded-full" asChild><Link to="/checkout">Checkout</Link></Button>
                        </div>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-12 w-12 rounded-full"><Menu className="h-6 w-6" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-background/95 backdrop-blur-xl p-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-6 border-b border-border">
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)}><img src={Logo} alt="Logo" className="h-8 w-32 object-contain" /></Link>
                      <SheetClose asChild><Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button></SheetClose>
                    </div>
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                      {navigationItems.map((item) => (
                        <Link key={item.name} to={item.href} className="block px-3 py-4 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>{item.name}</Link>
                      ))}
                      <Link to="/contact" className="block px-3 py-4 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
