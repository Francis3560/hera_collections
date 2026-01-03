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
  Settings,
  UserCircle,
  CreditCard,
  HelpCircle,
  Shield,
  Bell,
  Package2,
  MapPin,
  Star,
  Gift,
  Calendar,
  CheckCircle,
  Clock,
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

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "Collections", href: "/collections" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const navigate = useNavigate();
  const { 
    user, 
    isAuthenticated, 
    isVerified, 
    role, 
    logout,
    userStats,
    userProfile 
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
    queryKey: ["categories"],
    queryFn: CategoryService.getAllCategories
  });

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
    const price = parseFloat(item.variant?.price || "0");
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
      {/* Premium Promotional Bar - Theme aware */}
      <div className="bg-primary text-primary-foreground py-3 px-4 text-sm text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 animate-pulse">
          <Sparkles className="h-4 w-4" />
          <span className="font-semibold">Flash Sales - 5% off for grabs!</span>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer"></div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-background/95 dark:bg-background/95 backdrop-blur-xl shadow-xl border-b border-border dark:border-border/80" 
            : "bg-background dark:bg-background border-b border-border/20 dark:border-border/40"
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex-shrink-0 group transition-transform duration-300 hover:scale-105"
            >
              <div className="h-16 w-16 flex items-center">
                <img
                  src={Logo}
                  alt="Hera Collections - Premium Bags & Accessories"
                  className="h-full w-full object-contain transition-all duration-300 rounded-full group-hover:brightness-110"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
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
                      <DropdownMenuContent className="w-56 glass-card border-border/50">
                        {categories?.map((cat: any) => (
                           <DropdownMenuItem key={cat.id} asChild>
                              <Link to={`/collections/${cat.slug}`} className="w-full cursor-pointer uppercase tracking-wider text-[10px] font-bold py-2">
                                {cat.name}
                              </Link>
                           </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="relative px-6 py-2 text-foreground/90 dark:text-foreground/80 hover:text-primary-accent dark:hover:text-primary-accent font-medium transition-all duration-300 group"
                  >
                    {item.name}
                    <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-primary-accent transition-all duration-300 group-hover:w-4/5 group-hover:left-1/10"></div>
                  </Link>
                );
              })}
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Search Bar */}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Search"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Account */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-12 px-3 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300 gap-2"
                      aria-label="Account"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials()}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium truncate max-w-24">
                          {user?.name?.split(" ")[0] || "User"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {role === "ADMIN" ? "Admin" : "Member"}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-80 p-4 shadow-2xl border border-border dark:border-border/60 bg-background/95 dark:bg-background/95 backdrop-blur-xl rounded-2xl space-y-2"
                  >
                    {/* User Profile Header */}
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-secondary/30 dark:bg-secondary/20 mb-2">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white font-bold text-lg">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={isVerified ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {isVerified ? "✓ Verified" : "Unverified"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {role === "ADMIN" ? "👑 Admin" : "👤 Member"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground px-2 py-1">
                      {getUserGreeting()}, {user?.name?.split(" ")[0] || "there"}!
                    </div>

                    <DropdownMenuSeparator />

                    {/* Quick Stats */}
                    {userStats && (
                      <div className="grid grid-cols-3 gap-2 p-2 bg-secondary/20 dark:bg-secondary/10 rounded-lg">
                        <div className="text-center">
                          <div className="font-bold text-lg text-primary-accent">
                            {userStats.orders || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-cta">
                            ${userStats.totalSpent?.toFixed(0) || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Spent</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg text-primary">
                            {userStats.wishlist || 0}
                          </div>
                          <div className="text-xs text-muted-foreground">Wishlist</div>
                        </div>
                      </div>
                    )}

                    <DropdownMenuSeparator />

                    {/* Profile Section */}
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
                      My Profile
                    </DropdownMenuLabel>
                    
                    <DropdownMenuItem asChild className="p-3 rounded-lg cursor-pointer">
                      <Link to="/profile" className="flex items-center gap-3">
                        <UserCircle className="h-4 w-4 text-primary-accent" />
                        <div>
                          <div className="font-medium">My Profile</div>
                          <div className="text-xs text-muted-foreground">
                            View and edit your profile
                          </div>
                        </div>
                      </Link>
                    </DropdownMenuItem>

                    {/* Admin Section */}
                    {role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
                          Admin Panel
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild className="p-3 rounded-lg cursor-pointer">
                          <Link to="/admin/dashboard" className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-cta" />
                            <div>
                              <div className="font-medium text-cta">Admin Dashboard</div>
                              <div className="text-xs text-muted-foreground">
                                Manage store and users
                              </div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />

                    {/* Logout */}
                    <DropdownMenuItem 
                      className="p-3 rounded-lg text-destructive hover:text-destructive dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Sign Out</div>
                          <div className="text-xs text-muted-foreground">
                            Logout from all devices
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-2 px-6 py-2 text-foreground/90 dark:text-foreground/80 hover:text-primary-accent dark:hover:text-primary-accent hover:bg-primary-accent/5 dark:hover:bg-primary-accent/10 rounded-full transition-all duration-300 font-medium"
                  asChild
                >
                  <Link to="/login">
                    <User className="h-4 w-4" />
                    Login
                  </Link>
                </Button>
              )}

              {/* Notifications */}
              {isAuthenticated && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300 relative group"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                      {unreadCount > 0 && (
                        <Badge
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent text-cta-foreground border-2 border-background dark:border-background shadow-lg"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-96 p-0 shadow-2xl border border-border dark:border-border/60 bg-background/95 dark:bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden"
                    align="end"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-border/50">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          Notifications
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          You have {unreadCount} unread messages
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => markAllAsRead()}
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>

                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border/50 px-0 bg-transparent">
                        <TabsTrigger
                          value="all"
                          className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="unread"
                          className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                        >
                          Unread
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="m-0">
                        <ScrollArea className="h-[350px]">
                          {notifications?.length > 0 ? (
                            <div className="divide-y divide-border/50">
                              {notifications.map((notif) => (
                                <div 
                                  key={notif.id}
                                  className={cn(
                                    "flex gap-3 p-4 hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-colors cursor-pointer relative",
                                    !notif.isRead && "bg-primary-accent/5"
                                  )}
                                  onClick={() => {
                                    if (!notif.isRead) markAsRead(notif.id);
                                    if (notif.link) navigate(notif.link);
                                  }}
                                >
                                  {!notif.isRead && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-accent rounded-full" />
                                  )}
                                  <div className={cn(
                                    "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                                    getNotificationColor(notif.type.toLowerCase().includes('stock') ? 'stock' : 
                                                       notif.type.toLowerCase().includes('order') ? 'order' : 
                                                       notif.type.toLowerCase().includes('payment') ? 'success' : 'alert')
                                  )}>
                                    {React.createElement(getNotificationIcon(
                                      notif.type.toLowerCase().includes('stock') ? 'stock' : 
                                      notif.type.toLowerCase().includes('order') ? 'order' : 
                                      notif.type.toLowerCase().includes('payment') ? 'success' : 'alert'
                                    ), { className: "h-4 w-4" })}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground line-clamp-1">
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                      {notif.message}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-[350px] text-center p-6">
                              <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                              <p className="text-sm font-medium text-foreground">No notifications</p>
                              <p className="text-xs text-muted-foreground">We'll notify you when something important happens.</p>
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                      
                      <TabsContent value="unread" className="m-0">
                          <ScrollArea className="h-[350px]">
                            {notifications?.filter(n => !n.isRead).length > 0 ? (
                              <div className="divide-y divide-border/50">
                                {notifications.filter(n => !n.isRead).map((notif) => (
                                  <div 
                                    key={notif.id}
                                    className="flex gap-3 p-4 hover:bg-secondary/50 dark:hover:bg-secondary/30 transition-colors cursor-pointer relative bg-primary-accent/5"
                                    onClick={() => {
                                      markAsRead(notif.id);
                                      if (notif.link) navigate(notif.link);
                                    }}
                                  >
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-accent rounded-full" />
                                    <div className={cn(
                                      "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0",
                                      getNotificationColor(notif.type.toLowerCase().includes('stock') ? 'stock' : 
                                                         notif.type.toLowerCase().includes('order') ? 'order' : 
                                                         notif.type.toLowerCase().includes('payment') ? 'success' : 'alert')
                                    )}>
                                      {React.createElement(getNotificationIcon(
                                        notif.type.toLowerCase().includes('stock') ? 'stock' : 
                                        notif.type.toLowerCase().includes('order') ? 'order' : 
                                        notif.type.toLowerCase().includes('payment') ? 'success' : 'alert'
                                      ), { className: "h-4 w-4" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground line-clamp-1">
                                        {notif.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {notif.message}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[350px] text-center p-6">
                                    <CheckCircle className="h-12 w-12 text-green-500/30 mb-3" />
                                    <p className="text-sm font-medium text-foreground">All caught up!</p>
                                    <p className="text-xs text-muted-foreground">No unread notifications.</p>
                                </div>
                            )}
                          </ScrollArea>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="p-2 border-t border-border/50">
                        <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-sm h-9 hover:bg-secondary/50"
                        asChild
                        >
                            <Link to="/profile/notifications">View all notifications</Link>
                        </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300 relative group"
                aria-label="Wishlist"
                asChild
              >
                <Link to="/wishlist">
                  <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  {wishlistCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent text-cta-foreground border-2 border-background dark:border-background shadow-lg"
                    >
                      {wishlistCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Cart */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300 relative group"
                    aria-label="Shopping cart"
                  >
                    <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                    {cartCount > 0 && (
                      <Badge
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-cta to-primary-accent text-cta-foreground border-2 border-background dark:border-background shadow-lg"
                      >
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-96 p-0 shadow-2xl border border-border dark:border-border/60 bg-background/95 dark:bg-background/95 backdrop-blur-xl rounded-2xl overflow-hidden"
                >
                  <div className="p-6">
                    <h3 className="font-semibold text-xl mb-6 text-foreground dark:text-foreground flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Your Cart
                    </h3>
                    
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-16 w-16 text-muted-foreground/50 dark:text-muted-foreground/70 mx-auto mb-4" />
                        <p className="text-muted-foreground dark:text-muted-foreground">Your cart is empty</p>
                        <Button 
                          className="mt-4 bg-primary-accent text-primary-accent-foreground hover:bg-primary-accent/90 rounded-full"
                          asChild
                        >
                          <Link to="/collections">Start Shopping</Link>
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                          {cartItems.map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-4 p-3 rounded-xl bg-secondary/30 dark:bg-secondary/20 hover:bg-secondary/50 dark:hover:bg-secondary/40 transition-all duration-200 group/item">
                              <div className="h-14 w-14 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={getProductImage(item)} 
                                  alt={item.product?.title}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-foreground dark:text-foreground">{item.product?.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.variant?.sku}
                                </p>
                                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                                  {formatPrice(parseFloat(item.variant?.price || "0"))} × {item.quantity}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="text-sm font-semibold text-primary-accent dark:text-primary-accent">
                                  {formatPrice(parseFloat(item.variant?.price || "0") * item.quantity)}
                                </div>
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="text-xs text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t border-border/50 dark:border-border/60 mt-6 pt-6">
                          <div className="flex justify-between items-center mb-6 text-lg">
                            <span className="font-semibold text-foreground dark:text-foreground">Total:</span>
                            <span className="font-bold text-primary-accent dark:text-primary-accent">{formatPrice(displayTotal)}</span>
                          </div>
                          <div className="flex space-x-3">
                            <Button 
                              variant="outline" 
                              className="flex-1 rounded-full border-2 hover:bg-secondary/50 dark:hover:bg-secondary/40 transition-all duration-300"
                              asChild
                            >
                              <Link to="/cart">View Cart</Link>
                            </Button>
                            <Button 
                              className="flex-1 bg-gradient-to-r from-cta to-primary-accent text-cta-foreground hover:from-cta/90 hover:to-primary-accent/90 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                              asChild
                            >
                              <Link to="/checkout">Checkout</Link>
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden h-12 w-12 rounded-full bg-secondary/50 dark:bg-secondary/30 hover:bg-primary-accent/10 dark:hover:bg-primary-accent/20 text-foreground/70 dark:text-foreground/60 hover:text-primary-accent dark:hover:text-primary-accent transition-all duration-300"
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 sm:w-96 bg-background/95 dark:bg-background/95 backdrop-blur-xl border-l border-border dark:border-border/60 p-0"
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border dark:border-border/60">
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <div className="h-8 w-32 flex items-center">
                          <img
                            src={Logo}
                            alt="Hera Collections"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </Link>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <X className="h-5 w-5" />
                        </Button>
                      </SheetClose>
                    </div>

                    {/* User Info in Mobile Menu */}
                    {isAuthenticated && (
                      <div className="p-6 border-b border-border dark:border-border/60">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white font-bold text-lg">
                            {getUserInitials()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {user?.name || "User"}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge 
                            variant={isVerified ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {isVerified ? "✓ Verified" : "Unverified"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {role === "ADMIN" ? "👑 Admin" : "👤 Member"}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {/* Mobile Navigation */}
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                      {navigationItems.map((item) => {
                        if (item.name === "Collections") {
                          return (
                            <div key={item.name} className="space-y-2">
                              <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">
                                {item.name}
                              </p>
                              {categories?.map((cat: any) => (
                                <Link
                                  key={cat.id}
                                  to={`/collections/${cat.slug}`}
                                  className="block px-6 py-3 text-foreground dark:text-foreground hover:text-primary-accent dark:hover:text-primary-accent hover:bg-primary-accent/5 dark:hover:bg-primary-accent/10 rounded-xl transition-all duration-200 font-medium text-sm"
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="block px-3 py-4 text-foreground dark:text-foreground hover:text-primary-accent dark:hover:text-primary-accent hover:bg-primary-accent/5 dark:hover:bg-primary-accent/10 rounded-xl transition-all duration-200 font-medium text-lg"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Profile Links in Mobile Menu */}
                    {isAuthenticated && (
                      <div className="p-6 border-t border-border dark:border-border/60">
                        <div className="space-y-2">
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-3 py-3 text-foreground hover:text-primary-accent hover:bg-primary-accent/5 rounded-xl transition-all duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <UserCircle className="h-5 w-5" />
                            My Profile
                          </Link>
                          <Link
                            to="/profile/orders"
                            className="flex items-center gap-3 px-3 py-3 text-foreground hover:text-primary-accent hover:bg-primary-accent/5 rounded-xl transition-all duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Package2 className="h-5 w-5" />
                            Orders
                            {userStats?.orders > 0 && (
                              <Badge className="ml-auto">{userStats.orders}</Badge>
                            )}
                          </Link>
                          <Link
                            to="/profile/wishlist"
                            className="flex items-center gap-3 px-3 py-3 text-foreground hover:text-primary-accent hover:bg-primary-accent/5 rounded-xl transition-all duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Heart className="h-5 w-5" />
                            Wishlist
                            {userStats?.wishlist > 0 && (
                              <Badge className="ml-auto">{userStats.wishlist}</Badge>
                            )}
                          </Link>
                          {role === "ADMIN" && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-3 py-3 text-cta hover:text-cta/90 hover:bg-cta/5 rounded-xl transition-all duration-200"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <Sparkles className="h-5 w-5" />
                              Admin Dashboard
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Theme Toggle in Mobile Menu */}
                    <div className="px-6 py-4 border-t border-border dark:border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground dark:text-muted-foreground">Theme</span>
                        <ThemeToggle />
                      </div>
                    </div>

                    {/* Mobile Auth Actions */}
                    <div className="p-6 border-t border-border dark:border-border/60 space-y-4">
                      {!isAuthenticated ? (
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            className="flex-1 rounded-full"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link to="/login">Login</Link>
                          </Button>
                          <Button 
                            className="flex-1 bg-gradient-to-r from-cta to-primary-accent text-cta-foreground hover:from-cta/90 hover:to-primary-accent/90 rounded-full"
                            asChild
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Link to="/register">Sign Up</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Button
                            variant="outline"
                            className="w-full rounded-full"
                            onClick={handleLogout}
                          >
                            Sign Out
                          </Button>
                        </div>
                      )}
                    </div>
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