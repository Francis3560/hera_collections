import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Trash2, 
  CheckCheck, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Package,
  CreditCard,
  Clock,
  MoreVertical,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const getNotificationIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('order')) return Package;
  if (t.includes('stock')) return AlertCircle;
  if (t.includes('payment')) return CreditCard;
  return Bell;
};

const getNotificationColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('order')) return 'text-blue-500 bg-blue-500/10';
  if (t.includes('stock')) return 'text-amber-500 bg-amber-500/10';
  if (t.includes('payment')) return 'text-green-500 bg-green-500/10';
  return 'text-primary bg-primary/10';
};

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotifications, 
    loading 
  } = useNotifications();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (activeTab === 'unread') return !n.isRead;
      if (activeTab === 'orders') return n.type.toLowerCase().includes('order');
      if (activeTab === 'stock') return n.type.toLowerCase().includes('stock');
      if (activeTab === 'payments') return n.type.toLowerCase().includes('payment');
      
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleAction = (notif: any) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with the latest activities from your store.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="hover-lift"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
                const ids = filteredNotifications.map(n => n.id);
                if (ids.length > 0) deleteNotifications(ids);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Filtered
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filters/stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 rounded-xl border border-border/50">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Notifications', icon: Bell, count: notifications.length },
                { id: 'unread', label: 'Unread', icon: Clock, count: unreadCount },
                { id: 'orders', label: 'Orders', icon: Package, count: notifications.filter(n => n.type.includes('ORDER')).length },
                { id: 'stock', label: 'Inventory', icon: AlertCircle, count: notifications.filter(n => n.type.includes('STOCK')).length },
                { id: 'payments', label: 'Payments', icon: CreditCard, count: notifications.filter(n => n.type.includes('PAYMENT')).length },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                    activeTab === item.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.count > 0 && (
                    <Badge 
                      variant={activeTab === item.id ? "secondary" : "outline"}
                      className={cn(activeTab === item.id && "bg-primary-foreground/20 border-none")}
                    >
                      {item.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5 text-primary" />
             </div>
             <h4 className="font-semibold mb-1">Stay Notified</h4>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Real-time alerts keep you informed about new orders, stock levels, and more.
             </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search notifications..." 
              className="pl-10 h-11 glass-card border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-strong min-h-[500px]">
            <AnimatePresence mode="wait">
              {filteredNotifications.length > 0 ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="divide-y divide-border/50"
                >
                  {filteredNotifications.map((n) => {
                    const Icon = getNotificationIcon(n.type);
                    const colorClass = getNotificationColor(n.type);
                    
                    return (
                      <div 
                        key={n.id}
                        className={cn(
                          "group p-4 flex gap-4 hover:bg-primary/5 transition-all cursor-pointer relative",
                          !n.isRead && "bg-primary/[0.02]"
                        )}
                        onClick={() => handleAction(n)}
                      >
                        {!n.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}
                        
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", colorClass)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={cn("font-medium text-lg leading-none", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                              {n.title}
                            </h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                               {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {n.message}
                          </p>
                          
                          <div className="flex items-center gap-3">
                            {n.link && (
                              <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10 px-0">
                                View Details <ArrowRight className="w-3 h-3 ml-2" />
                              </Button>
                            )}
                            
                            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.isRead && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(n.id);
                                  }}
                                  title="Mark as read"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotifications(n.id);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                   key="empty"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col items-center justify-center h-[500px] p-12 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Bell className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No notifications found</h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    We couldn't find any notifications matching your current filters or search query.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                        setActiveTab('all');
                        setSearchQuery('');
                    }}
                  >
                    Reset all filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
