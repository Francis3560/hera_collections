import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  RefreshCcw,
  Loader2,
  FileText,
  BarChart2,
  Save,
  Download,
  Sigma,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  History,
  Info,
  ChevronRight,
  MoreVertical,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import stockService from '@/api/stock.service';
import productService from '@/api/product.service';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { generateStockTakePDF } from '@/utils/pdfExport';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StockTakeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stockTake, setStockTake] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Local state for items being added/counted
  const [countedItems, setCountedItems] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stResponse, pResponse] = await Promise.all([
        stockService.getStockTakeById(id),
        productService.getAllProducts()
      ]);
      setStockTake(stResponse.data);
      setProducts(pResponse.items || []);
      
      // Initialize counted items from existing stock take items
      if (stResponse.data.items && stResponse.data.items.length > 0) {
        setCountedItems(stResponse.data.items.map(item => ({
          variantId: item.variantId,
          sku: item.variant?.sku,
          productTitle: item.variant?.product?.title,
          options: Object.values(item.variant?.optionMappings || {}).join('/'),
          expectedStock: item.systemQuantity,
          countedStock: item.countedQuantity || 0,
          price: Number(item.variant?.price || 0),
          notes: item.notes || '',
          id: item.id,
          category: item.variant?.product?.category?.name || 'Uncategorized'
        })));
      }
    } catch (error) {
      console.error("Fetch detail error:", error);
      toast.error(error.response?.data?.message || "Failed to load audit details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStart = async () => {
    try {
      setLoading(true);
      await stockService.startStockTake(id);
      toast.success("Inventory state frozen. You can now begin counting.");
      fetchData();
    } catch (error) {
      toast.error("Failed to start audit.");
      setLoading(false);
    }
  };

  const handleComplete = async (autoAdjust = true) => {
    try {
      setSaving(true);
      await stockService.completeStockTake(id, { autoAdjust });
      toast.success("Audit finalized. Inventory reconciled.");
      setIsFinishing(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete audit.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItemCount = (variantId, count) => {
    setCountedItems(prev => prev.map(item => 
      item.variantId === variantId ? { ...item, countedStock: parseInt(count) || 0 } : item
    ));
  };

  const handleSaveItems = async () => {
    try {
      setSaving(true);
      const itemsToUpdate = countedItems.map(item => ({
        variantId: item.variantId,
        countedQuantity: item.countedStock,
        notes: item.notes
      }));
      await stockService.addStockTakeItems(id, itemsToUpdate);
      toast.success("Audit progress synchronized.");
      fetchData();
    } catch (error) {
      toast.error("Failed to save progress.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const itemsForPDF = countedItems.map(item => ({
        variant: {
          product: { title: item.productTitle },
          sku: item.sku
        },
        systemQuantity: item.expectedStock,
        countedQuantity: item.countedStock,
        notes: item.notes
      }));
      generateStockTakePDF(stockTake, itemsForPDF);
      toast.success("Report exported successfully.");
    } catch (error) {
      toast.error("Failed to generate PDF.");
    }
  };

  const addVariantToAudit = (variant) => {
    if (countedItems.some(i => i.variantId === variant.id)) {
      toast.info("Item already in audit list.");
      return;
    }
    
    setCountedItems(prev => [...prev, {
      variantId: variant.id,
      sku: variant.sku,
      productTitle: variant.productTitle,
      options: Object.values(variant.optionMappings || {}).join('/'),
      expectedStock: variant.stock,
      countedStock: 0,
      price: Number(variant.price || 0),
      notes: '',
      category: variant.product?.category?.name || 'Uncategorized'
    }]);
  };

  const allVariants = useMemo(() => {
    return products.flatMap(p => 
      (p.variants || []).map(v => ({
        ...v,
        productTitle: p.title
      }))
    ).filter(v => 
      v.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Enhanced Metrics
  const metrics = useMemo(() => {
    let totalSystemValue = 0;
    let totalCountedValue = 0;
    let shrinkageValue = 0;
    let surplusValue = 0;
    let matchedItems = 0;

    countedItems.forEach(item => {
      const sysVal = item.expectedStock * item.price;
      const countVal = item.countedStock * item.price;
      totalSystemValue += sysVal;
      totalCountedValue += countVal;

      if (item.countedStock === item.expectedStock) matchedItems++;
      if (item.countedStock < item.expectedStock) shrinkageValue += (item.expectedStock - item.countedStock) * item.price;
      if (item.countedStock > item.expectedStock) surplusValue += (item.countedStock - item.expectedStock) * item.price;
    });

    const netDiscrepancy = totalCountedValue - totalSystemValue;
    const accuracyRate = countedItems.length > 0 ? (matchedItems / countedItems.length) * 100 : 100;

    return {
      totalSystemValue,
      totalCountedValue,
      shrinkageValue,
      surplusValue,
      netDiscrepancy,
      accuracyRate,
      matchedItems
    };
  }, [countedItems]);

  if (loading && !stockTake) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase opacity-50">Auditing Digital Vault...</p>
      </div>
    );
  }

  const isEditable = stockTake?.status === 'PENDING' || stockTake?.status === 'IN_PROGRESS';

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-24">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/admin/inventory/stocktakes')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Session Vault
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">
              {stockTake?.title}
            </h1>
            <Badge className={cn(
              "rounded-xl px-4 h-8 font-black border-none",
              stockTake?.status === 'COMPLETED' ? 'bg-green-500 text-white' : 
              stockTake?.status === 'IN_PROGRESS' ? 'bg-blue-500 text-white' : 
              'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
            )}>
              {stockTake?.status}
            </Badge>
          </div>
          <p className="text-muted-foreground font-medium text-sm">
             Session ID: <span className="font-bold text-foreground">#ST-{id.toString().padStart(6, '0')}</span> • 
             Created <span className="font-bold text-foreground">{format(new Date(stockTake?.createdAt), 'PPP')}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stockTake?.status === 'PENDING' && (
            <Button onClick={handleStart} className="h-14 px-8 rounded-2xl btn-primary font-black text-lg shadow-elegant">
              <Play className="w-5 h-5 mr-2" /> Start Live Count
            </Button>
          )}
          
          {stockTake?.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[1.5rem] border border-white/5">
               <Button variant="ghost" onClick={handleSaveItems} disabled={saving} className="h-12 px-6 rounded-xl font-black gap-2">
                 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Force Sync
               </Button>
               <Button 
                 onClick={() => setIsFinishing(true)} 
                 className="h-12 px-8 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-500/20"
               >
                 <CheckCircle className="w-4 h-4 mr-2" /> Finalize Audit
               </Button>
            </div>
          )}

          {stockTake?.status === 'COMPLETED' && (
             <Button onClick={handleExportPDF} className="h-14 px-8 rounded-2xl bg-primary text-white font-black shadow-elegant">
               <Download className="w-5 h-5 mr-2" /> Download Report
             </Button>
          )}
        </div>
      </div>

      {/* Reconciliation Dashboard Context */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
         {[
           { 
             label: 'Accuracy Rate', 
             value: `${metrics.accuracyRate.toFixed(1)}%`, 
             desc: `${metrics.matchedItems} of ${countedItems.length} items correct`,
             icon: Percent,
             color: metrics.accuracyRate > 95 ? 'text-green-500' : 'text-amber-500',
             bg: 'bg-primary/5'
           },
           { 
             label: 'Net Variance', 
             value: `KES ${metrics.netDiscrepancy.toLocaleString()}`, 
             desc: metrics.netDiscrepancy < 0 ? 'Total Value Deficit' : 'Total Value Surplus',
             icon: Sigma,
             color: metrics.netDiscrepancy < 0 ? 'text-red-500' : 'text-green-500',
             bg: 'bg-white/5'
           },
           { 
             label: 'Shrinkage (Loss)', 
             value: `KES ${metrics.shrinkageValue.toLocaleString()}`, 
             desc: 'Value of missing inventory',
             icon: TrendingDown,
             color: 'text-red-500',
             bg: 'bg-red-500/5'
           },
           { 
             label: 'Surplus (Gain)', 
             value: `KES ${metrics.surplusValue.toLocaleString()}`, 
             desc: 'Unrecorded inventory found',
             icon: TrendingUp,
             color: 'text-green-500',
             bg: 'bg-green-500/5'
           }
         ].map((stat, i) => (
           <Card key={i} className={cn("glass-card border-none shadow-soft overflow-hidden group", stat.bg)}>
             <CardContent className="p-6">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                      <h3 className={cn("text-3xl font-black italic tracking-tighter", stat.color)}>{stat.value}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{stat.desc}</p>
                   </div>
                   <div className="p-3 rounded-xl bg-background/50 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                   </div>
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Counting Terminal */}
        <Card className="xl:col-span-2 glass-card border-none shadow-strong bg-white/5 backdrop-blur-3xl rounded-[2rem] overflow-hidden flex flex-col min-h-[600px]">
           <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <CardTitle className="text-2xl font-black italic uppercase">Counting Terminal</CardTitle>
                    <CardDescription className="font-medium">Enter actual physical quantities to recalculate system health.</CardDescription>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-10 px-4 rounded-xl bg-background/50 border border-white/10 flex items-center gap-3">
                       <Sigma className="w-4 h-4 text-primary" />
                       <span className="text-xs font-black uppercase tracking-widest">System: {metrics.totalSystemValue.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </CardHeader>
           
           <CardContent className="p-0 flex-1 flex flex-col">
              {countedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-32 text-center gap-6">
                   <div className="w-24 h-24 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                      <Package className="w-10 h-10 text-white/10" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase">No items in session</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Use the catalog sidebar to add items for verification.</p>
                   </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                   <Table>
                      <TableHeader className="bg-white/[0.05]">
                         <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest">Product Details</TableHead>
                            <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">On Book</TableHead>
                            <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">On Hand</TableHead>
                            <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest text-center">Variance</TableHead>
                            <TableHead className="py-6 text-[10px] font-black uppercase tracking-widest">Context/Notes</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countedItems.map((item) => {
                          const variance = item.countedStock - item.expectedStock;
                          const hasDiscrepancy = variance !== 0;
                          
                          return (
                            <TableRow 
                              key={item.variantId} 
                              className={cn(
                                "border-white/5 transition-all group relative",
                                hasDiscrepancy ? "bg-red-500/[0.02] hover:bg-red-500/[0.05]" : "hover:bg-white/[0.03]"
                              )}
                            >
                              <TableCell className="py-6 px-8 relative">
                                 {hasDiscrepancy && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />}
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-primary/50 transition-colors shrink-0">
                                       <Package className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                       <h4 className="font-black text-sm uppercase truncate group-hover:text-primary transition-colors italic leading-none mb-1">{item.productTitle}</h4>
                                       <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-[8px] font-black uppercase px-1 h-4 bg-background/50">{item.sku}</Badge>
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{item.options}</span>
                                       </div>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="py-6 text-center text-sm font-black text-muted-foreground">
                                 {item.expectedStock}
                              </TableCell>
                              <TableCell className="py-6">
                                 <div className="flex justify-center">
                                    <Input 
                                      type="number"
                                      value={item.countedStock}
                                      onChange={(e) => handleUpdateItemCount(item.variantId, e.target.value)}
                                      disabled={!isEditable}
                                      className={cn(
                                        "w-20 h-10 text-center font-black rounded-lg border-white/10 bg-background/50 focus:bg-background transition-all",
                                        hasDiscrepancy && "border-red-500/50 text-red-500"
                                      )}
                                    />
                                 </div>
                              </TableCell>
                              <TableCell className="py-6 text-center">
                                 <Badge className={cn(
                                   "rounded-xl px-3 font-black italic",
                                   variance === 0 ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                   variance < 0 ? "bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                                   "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                 )}>
                                   {variance > 0 ? '+' : ''}{variance}
                                 </Badge>
                                 {hasDiscrepancy && (
                                   <p className="text-[8px] font-black mt-1 uppercase opacity-40">
                                      {variance < 0 ? 'Deficit' : 'Surplus'} KES {(Math.abs(variance) * item.price).toLocaleString()}
                                   </p>
                                 )}
                              </TableCell>
                              <TableCell className="py-6 px-8">
                                 <div className="flex items-center gap-2">
                                    <Input 
                                      placeholder="Note reason..."
                                      value={item.notes}
                                      onChange={(e) => {
                                         const val = e.target.value;
                                         setCountedItems(prev => prev.map(i => i.variantId === item.variantId ? { ...i, notes: val } : i));
                                      }}
                                      disabled={!isEditable}
                                      className="h-10 text-xs bg-transparent border-white/5 focus:border-primary/30 rounded-lg min-w-[150px]"
                                    />
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                             <MoreVertical className="w-4 h-4" />
                                          </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-48 rounded-xl font-bold">
                                          <DropdownMenuItem className="gap-2">
                                             <History className="w-4 h-4" /> Movement History
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="gap-2 text-red-500 focus:text-red-500">
                                             <XCircle className="w-4 h-4" /> Remove from Audit
                                          </DropdownMenuItem>
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                   </Table>
                </div>
              )}
           </CardContent>
           
           {isEditable && countedItems.length > 0 && (
             <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Snapshot Coverage</span>
                      <div className="flex items-center gap-3">
                         <Progress value={metrics.accuracyRate} className="w-32 h-1.5" />
                         <span className="text-xs font-black">{metrics.accuracyRate.toFixed(0)}% Match</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3">
                   <Button variant="ghost" className="rounded-xl font-black px-6" onClick={() => navigate('/admin/inventory/stocktakes')}>Abort Session</Button>
                   <Button onClick={handleSaveItems} disabled={saving} className="btn-primary rounded-xl font-black px-8 h-12 shadow-elegant">
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Sync Progress
                   </Button>
                </div>
             </div>
           )}
        </Card>

        {/* Catalog Sidebar */}
        <div className="space-y-6">
           <Card className="glass-card border-none shadow-strong bg-white/5 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 border-b border-white/5">
                 <CardTitle className="text-lg font-black italic uppercase">Vault Catalog</CardTitle>
                 <CardDescription>Insert SKUs into current Session</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="SKU, Name, Category..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 bg-background/50 border-white/10 rounded-xl focus:bg-background"
                    />
                 </div>
                 <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 pt-2">
                    {allVariants.slice(0, 15).map(v => (
                       <button 
                         key={v.id}
                         onClick={() => addVariantToAudit(v)}
                         disabled={!isEditable}
                         className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group text-left relative overflow-hidden"
                       >
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative z-10 flex-1 min-w-0">
                             <h5 className="font-black text-xs uppercase truncate group-hover:text-primary transition-colors italic leading-none mb-1">{v.productTitle}</h5>
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[7px] font-black h-3 px-1">{v.sku}</Badge>
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">{Object.values(v.optionMappings || {}).join('/') || 'Default'}</span>
                             </div>
                          </div>
                          <div className="relative z-10 text-right shrink-0 ml-2">
                             <p className="text-[10px] font-black leading-none">{v.stock}</p>
                             <p className="text-[7px] font-bold text-muted-foreground uppercase">In Stock</p>
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all pr-1">
                             <Plus className="w-4 h-4 text-primary" />
                          </div>
                       </button>
                    ))}
                    {allVariants.length === 0 && (
                      <div className="py-20 text-center opacity-40">
                        <Search className="w-10 h-10 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase">No results found</p>
                      </div>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Insights Card */}
           <Card className="glass-card border-none shadow-strong bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-[2rem]">
              <div className="space-y-4">
                 <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <BarChart2 className="w-5 h-5" />
                 </div>
                 <h4 className="text-xl font-black italic">Reconciliation AI</h4>
                 <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    Based on current counting patterns, we've identified <span className="text-primary font-black uppercase text-[10px]">potential shrinkage</span> across '{stockTake?.title}'. Match rate is trending at {metrics.accuracyRate.toFixed(1)}%.
                 </p>
                 <div className="pt-2">
                    <Button variant="link" className="p-0 h-auto text-[10px] font-black text-primary gap-2 hover:gap-3 transition-all">
                       VIEW DETAILED ANALYTICS <ArrowLeft className="w-3 h-3 rotate-180" />
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isFinishing} onOpenChange={setIsFinishing}>
         <DialogContent className="glass-card border-none max-w-lg p-0 overflow-hidden shadow-2xl">
            <div className="p-10 space-y-8">
               <DialogHeader className="space-y-4">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-inner">
                     <AlertTriangle className="h-8 w-8" />
                  </div>
                  <div>
                    <DialogTitle className="text-4xl font-black italic tracking-tight gradient-text">Commit Reconciliation</DialogTitle>
                    <DialogDescription className="text-base font-medium mt-2 leading-relaxed">
                       Finalizing this audit will permanently update the system stock to match your physical counts. 
                       <span className="block mt-2 font-black text-foreground">Net Value Impact: <span className={cn(metrics.netDiscrepancy < 0 ? 'text-red-500' : 'text-green-500')}>KES {metrics.netDiscrepancy.toLocaleString()}</span></span>
                    </DialogDescription>
                  </div>
               </DialogHeader>

               <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span>Items Adjusted</span>
                        <span>{countedItems.filter(i => i.countedStock !== i.expectedStock).length} Units</span>
                     </div>
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span>Matched Perfectly</span>
                        <span className="text-green-500">{metrics.matchedItems} Units</span>
                     </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                     <Info className="w-5 h-5 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold leading-relaxed uppercase tracking-widest">This action will create permanent 'CORRECTION' records in your stock movement history for all discrepancies.</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-6">
                  <Button variant="ghost" onClick={() => setIsFinishing(false)} className="h-16 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/5">Discard</Button>
                  <Button 
                    onClick={() => handleComplete(true)} 
                    disabled={saving}
                    className="h-16 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-xs shadow-elegant"
                  >
                     {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                     Authorize Sync
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockTakeDetail;
