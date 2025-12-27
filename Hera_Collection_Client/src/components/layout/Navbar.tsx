"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Monitor,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Globe,
  Shield,
  Building,
  CreditCard,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";

import { formatDistanceToNow } from "date-fns";

interface NavbarProps {
  title?: string;
  onMenuClick?: () => void;
  showSearch?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = "Dashboard",
  onMenuClick,
  showSearch = true,
}) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");


  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return ShoppingCart;
      case "stock":
        return Package;
      case "alert":
        return AlertCircle;
      case "success":
        return CheckCircle;
      case "user":
        return Users;
      default:
        return Bell;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "order":
        return "text-blue-500 bg-blue-500/10";
      case "stock":
        return "text-amber-500 bg-amber-500/10";
      case "alert":
        return "text-red-500 bg-red-500/10";
      case "success":
        return "text-green-500 bg-green-500/10";
      case "user":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  // Quick actions
  const quickActions = [
    { label: "New Order", icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Add Product", icon: Package, color: "bg-green-500" },
    { label: "Reports", icon: TrendingUp, color: "bg-purple-500" },
    { label: "Support", icon: Users, color: "bg-amber-500" },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-40 h-16 border-b border-border glass shadow-soft",
        "bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Page Title */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block h-6 w-1 rounded-full gradient-primary"></div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex border-primary/20 bg-primary/5 text-primary"
            >
              Admin
            </Badge>
          </div>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-2xl mx-4 hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, products, customers..."
                className="pl-10 w-full bg-background/50 backdrop-blur-sm border-border/50 focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  ×
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2 mr-2">
            {quickActions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-8 px-3 gap-2 hover-lift"
              >
                <action.icon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </div>

          {/* Mobile Search */}
          {showSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden hover-lift"
              onClick={() => {
                // Implement mobile search modal
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover-lift h-9 w-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 glass-card border-border/50"
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className={cn(
                    "cursor-pointer",
                    theme === "light" && "bg-primary/10 text-primary"
                  )}
                >
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className={cn(
                    "cursor-pointer",
                    theme === "dark" && "bg-primary/10 text-primary"
                  )}
                >
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("system")}
                  className={cn(
                    "cursor-pointer",
                    theme === "system" && "bg-primary/10 text-primary"
                  )}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="relative hover-lift h-9 w-9"
              >
                <Bell className="h-4 w-4" />
          
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 p-0 glass-card border-border/50 shadow-strong"
              align="end"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground">
                  </p>
                </div>
          
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b px-0">
                  <TabsTrigger
                    value="all"
                    className="rounded-none data-[state=active]:shadow-none"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="rounded-none data-[state=active]:shadow-none"
                  >
                    Unread
                  </TabsTrigger>
                  <TabsTrigger
                    value="system"
                    className="rounded-none data-[state=active]:shadow-none"
                  >
                    System
                  </TabsTrigger>
                </TabsList>
            
              </Tabs>

              <div className="p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm h-9"
                  onClick={() => {
                    // Navigate to notifications page
                  }}
                >
                  View all notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Help */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover-lift h-9 w-9">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 glass-card">
              <DropdownMenuLabel className="text-xs font-semibold">
                Help & Support
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <UserCog className="mr-2 h-4 w-4" />
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Globe className="mr-2 h-4 w-4" />
                Community
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full hover-lift p-0"
              >
                <Avatar className="h-9 w-9 border-2 border-primary/10">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 glass-card border-border/50"
              align="end"
              forceMount
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage
                      src={user?.avatar}
                      alt={user?.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-primary mt-1 font-medium">
                      Administrator
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer px-2 py-2">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-2 py-2">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                  <Badge className="ml-auto" variant="outline">
                    New
                  </Badge>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-2 py-2">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security</span>
                </DropdownMenuItem>
              </div>

              <Separator />

              <div className="p-2">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">
                  Business
                </DropdownMenuLabel>
                <DropdownMenuItem className="cursor-pointer px-2 py-2">
                  <Building className="mr-2 h-4 w-4" />
                  <span>Store Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer px-2 py-2">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
              </div>

              <Separator />

              <div className="p-2">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer px-2 py-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>

              <Separator />

              <div className="p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last login:</span>
                  <span className="font-medium">Today, 10:30 AM</span>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
};