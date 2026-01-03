import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle2, 
  XCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  Search,
  ArrowRight,
  Filter,
  History,
  Package,
  Clock,
  Trash2,
  CheckCheck,
  MoreVertical,
  Settings2,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import stockService from '@/api/stock.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StockAlerts = () => {
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeData, historyData, statsData] = await Promise.all([
        stockService.getActiveAlerts(),
        stockService.getAlertHistory({ limit: 50 }),
        stockService.getAlertStats(),
      ]);
      
      setActiveAlerts(activeData.data || []);
      setHistory(historyData.data || []);
      setStats(statsData.data || null);
    } catch (error) {
      console.error("Fetch alerts error:", error);
      toast.error("Failed to load stock alerts data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (variantId) => {
    try {
      await stockService.resolveAlert(variantId);
      toast.success("Alert resolved successfully.");
      fetchData();
    } catch (error) {
      toast.error("Failed to resolve alert.");
    }
  };

  const handleDisable = async (variantId) => {
    try {
      await stockService.disableAlert(variantId);
      toast.success("Alert monitoring disabled.");
      fetchData();
    } catch (error) {
      toast.error("Failed to disable alert.");
    }
  };

  const filteredItems = useMemo(() => {
    const list = activeTab === 'active' ? activeAlerts : history;
    return list.filter(item => {
      const searchTarget = `${item.variant?.product?.title} ${item.variant?.sku} ${item.variant?.product?.category?.name || ''}`.toLowerCase();
      return searchTarget.includes(searchQuery.toLowerCase());
    });
  }, [activeAlerts, history, activeTab, searchQuery]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-amber-600">
            Stock Monitoring
          </h1>
          <p className="text-muted-foreground">
            Manage inventory health and resolve critical low-stock alerts.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="hover-lift"
            onClick={fetchData}
          >
            <Bell className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-primary/10"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-4 rounded-xl border border-border/50">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground focus:outline-none">
              <Filter className="w-4 h-4" /> Navigation
            </h3>
            
            <div className="space-y-1">
              {[
                { id: 'active', label: 'Active Alerts', icon: AlertTriangle, count: activeAlerts.length, color: 'text-red-500' },
                { id: 'history', label: 'Resolution History', icon: History, count: stats?.summary?.resolvedAlerts || 0, color: 'text-green-500' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                    activeTab === item.id 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("w-4 h-4", activeTab !== item.id && item.color)} />
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

          {/* Quick Stats Sidebar */}
          <div className="glass-card p-4 rounded-xl border border-border/50 space-y-4">
             <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="w-4 h-4" /> Snapshot
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-red-500/70 uppercase">Critical</p>
                  <p className="text-xl font-black text-red-500">{stats?.summary?.activeAlerts || 0}</p>
               </div>
               <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-green-500/70 uppercase">Healed</p>
                  <p className="text-xl font-black text-green-500">{stats?.summary?.resolvedAlerts || 0}</p>
               </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
               <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs font-bold text-primary italic">Resolution Rate</p>
               </div>
               <h4 className="text-2xl font-black mb-2">{stats?.summary?.resolutionRate?.toFixed(1) || 0}%</h4>
               <Progress value={stats?.summary?.resolutionRate || 0} className="h-1.5" />
            </div>
          </div>

          {/* AI Helper Card */}
          <div className="glass-card p-6 rounded-xl border border-border/50 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden group">
             <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="font-semibold mb-1 italic">Under Threshold</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {stats?.summary?.productsBelowThreshold || 0} items are currently trending towards stockout.
                </p>
                <Button variant="link" className="p-0 h-auto text-xs mt-3 text-amber-600 group-hover:gap-2 transition-all">
                  Run Optimization <ArrowRight className="w-3 h-3" />
                </Button>
             </div>
             <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Package className="w-24 h-24 rotate-12" />
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by product name, SKU or category..." 
              className="pl-10 h-11 glass-card border-border/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="glass-card rounded-xl border border-border/50 overflow-hidden shadow-strong min-h-[500px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-[500px] text-center"
                >
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Analyzing Inventory...</p>
                </motion.div>
              ) : filteredItems.length > 0 ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="divide-y divide-border/50"
                >
                  {filteredItems.map((item) => {
                    const stockPercentage = Math.min((item.variant?.stock / (item.threshold || 5)) * 100, 100);
                    const isCritical = item.variant?.stock <= 2;
                    
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "group p-5 flex gap-5 hover:bg-primary/5 transition-all relative overflow-hidden",
                          activeTab === 'active' && !item.isResolved && "bg-red-500/[0.01]"
                        )}
                      >
                        {activeTab === 'active' && !item.isResolved && (
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1", isCritical ? "bg-red-600" : "bg-amber-500")} />
                        )}
                        
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-inner",
                          activeTab === 'active' 
                            ? (isCritical ? "text-red-600 bg-red-500/10" : "text-amber-600 bg-amber-500/10")
                            : "text-green-600 bg-green-500/10"
                        )}>
                          {activeTab === 'active' ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                               <h4 className="font-bold text-lg leading-none truncate">
                                {item.variant?.product?.title}
                               </h4>
                               <Badge variant="outline" className="text-[9px] uppercase tracking-tighter h-4 px-1">
                                 {item.variant?.sku}
                               </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 italic">
                               {(() => {
                                 const date = new Date(item.createdAt);
                                 return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                               })()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                             <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                   <span className={isCritical ? "text-red-600" : "text-amber-600"}>Current Stock: {item.variant?.stock}</span>
                                   <span className="text-muted-foreground">Threshold: {item.threshold}</span>
                                </div>
                                <Progress 
                                  value={stockPercentage} 
                                  className="h-2" 
                                  indicatorClassName={cn(isCritical ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.3)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]")}
                                />
                             </div>
                             
                             <div className="flex items-center justify-end gap-2 pr-2">
                                {activeTab === 'active' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-9 rounded-xl border-green-500/20 text-green-600 hover:bg-green-500/10 gap-2 font-bold"
                                      onClick={() => handleResolve(item.variantId)}
                                    >
                                      <CheckCheck className="w-4 h-4" /> Resolve
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                        <DropdownMenuItem onClick={() => handleDisable(item.variantId)} className="text-red-600 focus:text-red-700 focus:bg-red-500/10">
                                          <XCircle className="w-4 h-4 mr-2" /> Disable Monitoring
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2">
                                          <Package className="w-4 h-4" /> Restock Items
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                                {activeTab === 'history' && (
                                   <div className="text-right">
                                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Resolved by</p>
                                      <p className="text-xs font-black">{item.resolvedBy?.name || 'System'}</p>
                                   </div>
                                )}
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
                  <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6 border border-dashed border-muted-foreground/20">
                    <Inbox className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Crystal Clear</h3>
                  <p className="text-muted-foreground max-w-sm mb-6 text-sm">
                    {activeTab === 'active' 
                      ? "Your inventory is standing strong. No critical alerts requiring attention at the moment."
                      : "The resolution log is currently empty. Start healing the inventory to see history."
                    }
                  </p>
                  <Button 
                    variant="outline" 
                    className="rounded-xl px-10 border-primary/20 hover:bg-primary/5 transition-all font-bold"
                    onClick={() => {
                        setSearchQuery('');
                    }}
                  >
                    Refresh Scan
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

export default StockAlerts;
