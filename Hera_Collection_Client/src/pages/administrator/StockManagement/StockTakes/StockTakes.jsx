import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Calendar, 
  Play, 
  CheckCircle, 
  XCircle, 
  ChevronRight,
  Filter,
  Loader2,
  Clock,
  ExternalLink,
  Users,
  TrendingDown,
  Sigma,
  ShieldCheck,
  AlertTriangle,
  LayoutGrid,
  List,
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import stockService from '@/api/stock.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const stockTakeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
});

const StockTakes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stockTakes, setStockTakes] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(stockTakeSchema),
    defaultValues: {
      title: '',
      description: '',
    }
  });

  const fetchStockTakes = async () => {
    setLoading(true);
    try {
      const response = await stockService.getAllStockTakes();
      setStockTakes(response.data || []);
    } catch (error) {
      console.error("Fetch stock takes error:", error);
      toast.error("Failed to load stock audit sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockTakes();
  }, []);

  const handleCreateSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await stockService.createStockTake(values);
      toast.success("Audit session initiated successfully.");
      setIsCreateModalOpen(false);
      form.reset();
      fetchStockTakes();
      navigate(`/admin/inventory/stocktakes/${response.data.id}`);
    } catch (error) {
       toast.error(error.response?.data?.message || "Failed to initiate audit.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStockTakes = useMemo(() => {
    return stockTakes.filter(st => {
      const matchesSearch = searchQuery === '' || 
        st.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || st.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [stockTakes, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const active = stockTakes.filter(st => st.status === 'IN_PROGRESS').length;
    const completed = stockTakes.filter(st => st.status === 'COMPLETED').length;
    const avgAccuracy = completed > 0 
      ? stockTakes.filter(st => st.status === 'COMPLETED').reduce((acc, st) => acc + (st.summary?.accuracyRate || 0), 0) / completed
      : 0;

    return { active, completed, avgAccuracy };
  }, [stockTakes]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-24">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest italic">
            Physical Inventory Audit
          </Badge>
          <h2 className="text-5xl lg:text-7xl font-black tracking-tight gradient-text leading-tight uppercase italic tracking-tighter">
            Digital Records vs Reality
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Conduct precision counting sessions, identify shrinkage, and reconcile your inventory with the absolute source of truth.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="btn-primary h-20 px-10 rounded-3xl text-xl font-black group shadow-elegant italic"
          >
            <Plus className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-500" />
            New Audit Session
          </Button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Active Sessions', value: stats.active, icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
           { label: 'Completed Audits', value: stats.completed, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
           { label: 'Avg Accuracy', value: `${stats.avgAccuracy.toFixed(1)}%`, icon: Sigma, color: 'text-primary', bg: 'bg-primary/10' },
         ].map((stat, i) => (
           <Card key={i} className="glass-card border-none shadow-soft overflow-hidden group border border-white/5">
             <CardContent className="p-8">
                <div className="flex justify-between items-center">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                      <h3 className="text-5xl font-black italic tracking-tighter">{stat.value}</h3>
                   </div>
                   <div className={cn("p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500", stat.bg, stat.color)}>
                      <stat.icon className="w-8 h-8" />
                   </div>
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-2xl">
         <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search sessions by identifier, description or creator..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-16 bg-background/50 border-white/5 focus:bg-background rounded-2xl text-lg font-medium shadow-inner"
            />
         </div>
         <div className="flex gap-2">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "h-16 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                  statusFilter === status ? "bg-primary text-white shadow-lg" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
         </div>
      </div>

      {/* Audit Result Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
           {loading ? (
             <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                <p className="font-black uppercase tracking-[0.3em] text-xs text-muted-foreground animate-pulse">Synchronizing Session Vault...</p>
             </div>
           ) : filteredStockTakes.length === 0 ? (
             <div className="col-span-full py-40 flex flex-col items-center justify-center gap-8 text-center">
                <div className="w-32 h-32 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                   <ClipboardList className="w-14 h-14 text-white/10" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-3xl font-black uppercase italic">No session found</h3>
                   <p className="text-muted-foreground font-medium max-w-sm">Initiate a new audit session to start reconciling your inventory reality.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="btn-primary h-16 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-elegant">
                   Initiate First Session
                </Button>
             </div>
           ) : filteredStockTakes.map((st) => (
             <motion.div
               key={st.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               layout
             >
                <Card 
                  onClick={() => navigate(`/admin/inventory/stocktakes/${st.id}`)}
                  className="glass-card border-none shadow-strong bg-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] group hover:bg-primary/[0.03] transition-all cursor-pointer border border-white/5 relative overflow-hidden"
                >
                   <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                   
                   <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <div className="flex items-center gap-3 mb-1">
                               <Badge className={cn(
                                 "rounded-lg px-2 text-[8px] font-black uppercase h-5",
                                 st.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                                 st.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                               )}>
                                 {st.status}
                               </Badge>
                               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                 <Calendar className="w-3 h-3" /> {format(new Date(st.createdAt), 'MMM dd, yyyy')}
                               </span>
                            </div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">{st.title}</h3>
                         </div>
                         <div className="h-12 w-12 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ChevronRight className="w-6 h-6" />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-4 rounded-2xl space-y-3">
                            <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                               <span>Coverage</span>
                               <span className="text-foreground">{st.summary?.accuracyRate?.toFixed(0) || 0}% Accuracy</span>
                            </div>
                            <Progress value={st.summary?.accuracyRate || 0} className="h-1.5" />
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl flex flex-col justify-between">
                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Reconciliation Impact</p>
                            <p className={cn(
                              "text-xl font-black italic",
                              st.status === 'COMPLETED' ? (st.summary?.accuracyRate >= 98 ? 'text-green-500' : 'text-red-500') : 'text-foreground'
                            )}>
                               KES {st.discrepancyValue || '0.00'}
                            </p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/5 pt-6">
                         <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                               {[1, 2, 3].map(i => (
                                 <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-800 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                 </div>
                               ))}
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase italic underline decoration-primary decoration-2 underline-offset-4">
                               {st.createdBy?.name || 'System Auditor'}
                            </span>
                         </div>
                         <Button variant="link" className="text-xs font-black uppercase tracking-widest text-primary gap-2 hover:gap-3 transition-all p-0 h-auto">
                            ENTER SESSION VAULT <ArrowRight className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>
                </Card>
             </motion.div>
           ))}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass-card border-none max-w-xl p-0 overflow-hidden shadow-2xl">
           <div className="p-12 space-y-10 relative">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 <ClipboardList className="w-40 h-40 rotate-12" />
              </div>
              
              <DialogHeader className="space-y-4">
                 <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <LayoutGrid className="h-8 w-8" />
                 </div>
                 <div>
                    <DialogTitle className="text-4xl font-black italic tracking-tight gradient-text">Initiate Audit Session</DialogTitle>
                    <DialogDescription className="text-base font-medium mt-2 leading-relaxed max-w-md">
                       Establish a new digital-to-reality verification session. You'll be able to freeze current snapshots and reconcile counts.
                    </DialogDescription>
                 </div>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-6">
                   <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase tracking-widest mb-3 block opacity-50">Audit Descriptor</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Q4 Luxury Retail Audit - 2026" className="h-16 bg-background/50 border-white/5 rounded-2xl focus:bg-white/10 transition-all font-bold italic text-lg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                   />
                   <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase tracking-widest mb-3 block opacity-50">Strategic Notes (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Scope, warehouse zone, or personnel instructions..." className="h-16 bg-background/50 border-white/5 rounded-2xl focus:bg-white/10 transition-all" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                   />
                   
                   <div className="grid grid-cols-2 gap-4 pt-10">
                      <Button type="button" variant="ghost" className="h-16 rounded-3xl font-black uppercase tracking-widest text-xs border border-white/5 hover:bg-white/5" onClick={() => setIsCreateModalOpen(false)}>Abort Initiation</Button>
                      <Button type="submit" disabled={loading} className="btn-primary h-16 rounded-3xl font-black uppercase tracking-widest text-xs shadow-elegant">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        Begin Digital Snapshot
                      </Button>
                   </div>
                </form>
              </Form>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTakes;
