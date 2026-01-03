import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  Search, 
  Package, 
  ExternalLink, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Scan,
  LayoutGrid,
  ChevronRight,
  MousePointer2,
  History,
  Box,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stockService from '@/api/stock.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const StockTakeItems = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeAudit, setActiveAudit] = useState(null);

  useEffect(() => {
    const fetchActiveAudit = async () => {
      try {
        const response = await stockService.getAllStockTakes({ status: 'IN_PROGRESS', limit: 1 });
        if (response.data && response.data.length > 0) {
          setActiveAudit(response.data[0]);
        }
      } catch (error) {
        console.error("Fetch active audit error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveAudit();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Scanner Hub...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-6">
        <div className="space-y-4">
          <Badge variant="outline" className="px-5 py-2 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest italic rounded-full">
            Real-time Replication
          </Badge>
          <h2 className="text-6xl lg:text-8xl font-black tracking-tight gradient-text leading-tight uppercase italic tracking-tighter">
            Audit Hub
          </h2>
          <p className="text-muted-foreground text-xl max-w-2xl font-medium leading-relaxed">
            The central terminal for high-velocity precision counting. Bridge the gap between physical items and digital records.
          </p>
        </div>
        
        <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
           <Fingerprint className="w-8 h-8 opacity-20" />
           <p className="text-[10px] font-black uppercase tracking-widest max-w-[120px] leading-tight">Secure Multi-User Counting Enabled</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Status Portal */}
        <div className="xl:col-span-2">
           {!activeAudit ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="glass-card bg-white/5 border-none shadow-strong p-16 rounded-[3rem] text-center space-y-8 relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 w-24 h-24 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-red-500/10 transition-all duration-700">
                   <AlertCircle className="w-10 h-10 text-white/20 group-hover:text-red-500 transition-colors" />
                </div>
                <div className="relative z-10 space-y-3">
                   <h3 className="text-4xl font-black italic uppercase tracking-tighter">No Active Stream detected</h3>
                   <p className="text-muted-foreground text-lg font-medium max-w-sm mx-auto">
                      All audit sessions are currently parked. Initiate a new session to begin the real-time reconciliation process.
                   </p>
                </div>
                <Button 
                  onClick={() => navigate('/admin/inventory/stocktakes')} 
                  className="relative z-10 btn-primary h-20 px-12 rounded-[2rem] text-xl font-black shadow-elegant group italic"
                >
                   Go to Session Vault
                   <ChevronRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
             </motion.div>
           ) : (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-card bg-white/5 border-none shadow-strong p-10 rounded-[3rem] relative overflow-hidden group border border-white/5"
             >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-10 mb-10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-4">
                         <Badge className="bg-blue-500 text-white font-black px-4 h-7 text-[10px] italic animate-pulse rounded-lg border-none">LIVE NOW</Badge>
                         <h4 className="text-3xl font-black italic tracking-tighter uppercase">{activeAudit.title}</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                         <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-primary" /> {activeAudit._count?.items || 0} Batches</span>
                         <span className="flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Started today</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-5xl font-black italic tracking-tighter text-primary">{( (activeAudit.itemsCounted / (activeAudit.totalItems || 1)) * 100).toFixed(0)}%</span>
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Session Progress</span>
                   </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 group-hover:border-primary/20 transition-all flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                         <Box className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                         <h5 className="font-black italic text-xl uppercase leading-none">Counting Portal</h5>
                         <p className="text-xs text-muted-foreground font-medium leading-relaxed">Enter manual counts or scan barcodes through the optimized mobile-first terminal interface.</p>
                      </div>
                      <Button 
                         onClick={() => navigate(`/admin/inventory/stocktakes/${activeAudit.id}`)}
                         className="w-full h-16 rounded-2xl btn-primary font-black text-xs uppercase tracking-widest mt-2 group shadow-elegant"
                      >
                         Launch Terminal
                         <MousePointer2 className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
                      </Button>
                   </div>
                   
                   <div className="p-8 rounded-[2rem] bg-black/40 border border-white/5 opacity-50 relative overflow-hidden flex flex-col justify-center items-center text-center gap-4">
                      <Scan className="w-12 h-12 text-muted-foreground animate-pulse" />
                      <div className="space-y-1">
                         <h5 className="font-black italic text-xl uppercase text-muted-foreground">Rapid Scanner</h5>
                         <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Waiting for stream...</p>
                      </div>
                      <Badge variant="outline" className="text-[8px] border-white/20 font-black tracking-widest h-6 px-4 rounded-full">DETECTING PERIPHERALS</Badge>
                   </div>
                </div>
             </motion.div>
           )}
        </div>

        {/* Support Sidebar */}
        <div className="space-y-6">
           <Card className="glass-card border-none shadow-soft p-8 rounded-[2rem] bg-white/5 backdrop-blur-3xl space-y-8 border border-white/5">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">Audit Protocol</h3>
              
              <div className="space-y-8">
                 {[
                   { title: 'Data Locking', desc: 'Real-time stock snapshots are frozen upon initiation to prevent sales-count drift.', icon: Package },
                   { title: 'Reconciliation', desc: 'Financial impacts are auto-calculated based on cost discrepancy vs market value.', icon: Sigma },
                   { title: 'Multi-User Sync', desc: 'Auditors can count simultaneously from different zones with instant sync.', icon: CheckCircle2 },
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                         <item.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 pt-1">
                         <h4 className="text-xs font-black uppercase italic tracking-wider leading-none">{item.title}</h4>
                         <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>

           <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex flex-col gap-4 group cursor-help">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                 <Scan className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-black italic leading-none">Need assistance?</h4>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed tracking-wider opacity-60">
                 Connect your wireless scanner via Bluetooth to enable 3,000 counts per hour performance.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StockTakeItems;
