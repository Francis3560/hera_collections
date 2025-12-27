import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Tags,
  Layers,
  Images,
  ShoppingCart,
  Receipt,
  Users as UsersIcon,
  MonitorCheck,
  Wallet,
  Banknote,
  Boxes,
  AlertTriangle,
  ClipboardList,
  ClipboardCheck,
  ReceiptText,
  FolderTree,
  MessageCircle,
  Send,
  UserCog,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "react-router-dom";


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  badge?: number | string | null;
  children?: NavigationItem[];
  section?: string;
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
    section: "Dashboard Overview",
  },
  {
    name: "Catalog Management",
    icon: Package,
    badge: null,
    section: "Catalog Management",
    children: [
      { name: "Products List", href: "/admin/products", icon: Package },
      { name: "Add New Product", href: "/admin/products/new", icon: PlusCircle },
      { name: "Categories", href: "/admin/categories", icon: Tags },
      { name: "Variants", href: "/admin/variants", icon: Layers },
      { name: "Photos", href: "/admin/photos", icon: Images },
    ],
  },
  {
    name: "Orders & Customers",
    icon: ShoppingCart,
    badge: null,
    section: "Orders & Customers",
    children: [
      { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { name: "Order Items", href: "/admin/order-items", icon: Receipt },
      { name: "Customers", href: "/admin/customers", icon: UsersIcon },
    ],
  },
  {
    name: "POS & Sales",
    icon: MonitorCheck,
    badge: null,
    section: "POS & Sales",
    children: [
      { name: "POS Terminal", href: "/admin/pos", icon: MonitorCheck },
      { name: "Manual Sale", href: "/admin/sales/manual", icon: Wallet },
      { name: "Transactions History", href: "/admin/transactions", icon: Banknote },
    ],
  },
  {
    name: "Inventory",
    icon: Boxes,
    badge: null,
    section: "Inventory",
    children: [
      { name: "Stock Movements", href: "/admin/inventory/movements", icon: Boxes },
      { name: "Stock Alerts", href: "/admin/inventory/alerts", icon: AlertTriangle },
      { name: "Stock Takes", href: "/admin/inventory/stocktakes", icon: ClipboardList },
      { name: "Stock Take Items", href: "/admin/inventory/stocktake-items", icon: ClipboardCheck },
    ],
  },

  // Expenses Module
  {
    name: "Expenses",
    icon: ReceiptText,
    badge: null,
    section: "Expenses",
    children: [
      { name: "All Expenses", href: "/admin/expenses", icon: ReceiptText },
      { name: "Expense Categories", href: "/admin/expenses/categories", icon: FolderTree },
    ],
  },

  // Messaging
  {
    name: "Inbox",
    href: "/admin/messaging/inbox",
    icon: MessageCircle,
    badge: "message",
    section: "Messaging",
  },
  {
    name: "Sent",
    href: "/admin/messaging/sent",
    icon: Send,
    badge: null,
    section: "Messaging",
  },

  // System
  {
    name: "System",
    icon: UserCog,
    badge: null,
    section: "System",
    children: [
      { name: "Users", href: "/admin/users", icon: UserCog },
      { name: "Roles", href: "/admin/system/roles", icon: ShieldCheck },
      { name: "Settings", href: "/admin/system/settings", icon: Settings },
    ],
  },

  // Notifications
  {
    name: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    badge: "notification",
    section: "System",
  },
];

// Group navigation items by section
const groupedNavigation = navigation.reduce((acc, item) => {
  const section = item.section || "Uncategorized";
  if (!acc[section]) {
    acc[section] = [];
  }
  acc[section].push(item);
  return acc;
}, {} as Record<string, NavigationItem[]>);

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Catalog Management",
    "Orders & Customers",
    "POS & Sales",
    "Inventory",
    "Expenses",
    "System",
  ]);
  const location = useLocation();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  // Function to get the actual badge count for each item
  const getBadgeCount = (badge: any): number | null => {
    if (badge === "message") return 5; // Placeholder for message count
   
   
    if (typeof badge === "number") return badge;
    return null;
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative h-full bg-sidebar border-r border-sidebar-border shadow-elegant"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">AdminPanel</span>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center w-full"
            >
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="hover-lift"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-150px)] custom-scrollbar">
        {Object.entries(groupedNavigation).map(([section, items]) => (
          <div key={section} className="space-y-2">
            {!collapsed && section !== "Uncategorized" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-semibold uppercase text-muted-foreground tracking-wider px-3"
              >
                {section}
              </motion.div>
            )}

            <div className="space-y-1">
              {items.map((item) => {
                const badgeCount = getBadgeCount(item.badge);
                const showBadge = badgeCount !== null && badgeCount > 0;
                const isItemActive = isActive(item.href);

                return (
                  <div key={item.name} className="relative">
                    {item.children ? (
                      <div>
                        <Button
                          variant={expandedItems.includes(item.name) ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start hover-lift transition-smooth",
                            collapsed ? "px-2" : "px-3",
                            expandedItems.includes(item.name) && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                          onClick={() => toggleExpanded(item.name)}
                        >
                          <item.icon
                            className={cn("w-4 h-4", collapsed ? "" : "mr-3")}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronRight
                                className={cn(
                                  "w-4 h-4 transition-transform duration-200",
                                  expandedItems.includes(item.name) && "rotate-90"
                                )}
                              />
                            </>
                          )}
                        </Button>

                        <AnimatePresence>
                          {!collapsed && expandedItems.includes(item.name) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-4 mt-1 space-y-1 overflow-hidden border-l border-sidebar-border pl-3"
                            >
                              {item.children.map((child) => (
                                <Button
                                  key={child.name}
                                  variant={isActive(child.href) ? "default" : "ghost"}
                                  size="sm"
                                  asChild
                                  className={cn(
                                    "w-full justify-start hover-lift transition-smooth",
                                    isActive(child.href) &&
                                      "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                                  )}
                                >
                                  <Link to={child.href}>
                                    <child.icon className="w-3 h-3 mr-3" />
                                    {child.name}
                                  </Link>
                                </Button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Button
                        variant={isItemActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start hover-lift transition-smooth",
                          collapsed ? "px-2" : "px-3",
                          isItemActive &&
                            "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                        )}
                        asChild
                      >
                        <Link to={item.href!}>
                          <item.icon
                            className={cn("w-4 h-4", collapsed ? "" : "mr-3")}
                          />
                          {!collapsed && (
                            <>
                              <span className="flex-1 text-left">{item.name}</span>
                              {showBadge && (
                                <Badge
                                  variant={
                                    item.badge === "notification"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className={cn(
                                    "ml-auto",
                                    badgeCount > 0 && "notification-pulse"
                                  )}
                                >
                                  {badgeCount}
                                </Badge>
                              )}
                            </>
                          )}
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {!collapsed && section !== "System" && (
              <Separator className="my-2 bg-sidebar-border" />
            )}
          </div>
        ))}
      </div>

      {/* User Info & Footer */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 p-4 bg-sidebar rounded-lg border border-sidebar-border"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
              AU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">
                Administrator
              </p>
            </div>
          </div>
          <Separator className="my-3 bg-sidebar-border" />
          <div className="text-xs text-muted-foreground text-center">
            Admin Dashboard v2.0 • Ecommerce + POS
          </div>
        </motion.div>
      )}

      {collapsed && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
            AU
          </div>
        </div>
      )}
    </motion.div>
  );
};