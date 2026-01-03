import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Filter,
  Loader2,
  Calendar,
  Package,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import stockService from '@/api/stock.service';
import productService from '@/api/product.service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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

const stockActionSchema = z.object({
  variantId: z.string().min(1, 'Please select a variant'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().optional(),
});

const StockMovements = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('add'); // 'add', 'adjust', 'damage'

  const form = useForm({
    resolver: zodResolver(stockActionSchema),
    defaultValues: {
      variantId: '',
      quantity: 1,
      reason: '',
      notes: '',
    }
  });

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data.items || []);
    } catch (error) {
      console.error("Fetch products error:", error);
    }
  };

  const fetchMovements = async (variantId) => {
    if (!variantId) return;
    setLoading(true);
    try {
      const response = await stockService.getMovements(variantId);
      setMovements(response.data || []);
    } catch (error) {
      console.error("Fetch movements error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load movements for this variant.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedVariantId) {
      fetchMovements(selectedVariantId);
    }
  }, [selectedVariantId]);

  const handleActionSubmit = async (values) => {
    try {
      setLoading(true);
      let response;
      const payload = {
        quantity: values.quantity,
        reason: values.reason,
        notes: values.notes
      };

      if (actionType === 'add') {
        response = await stockService.addStock(values.variantId, payload);
      } else if (actionType === 'adjust') {
        response = await stockService.adjustStock(values.variantId, payload);
      } else if (actionType === 'damage') {
        response = await stockService.recordDamage(values.variantId, payload);
      }

      toast({
        title: "Success",
        description: "Stock movement recorded successfully.",
      });
      
      setIsActionModalOpen(false);
      form.reset();
      
      // Refresh current movements if the same variant was updated
      if (values.variantId === selectedVariantId) {
        fetchMovements(selectedVariantId);
      } else {
        setSelectedVariantId(values.variantId);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to record stock movement.",
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setActionType(type);
    setIsActionModalOpen(true);
    if (selectedVariantId) {
      form.setValue('variantId', selectedVariantId.toString());
    }
  };

  const allVariants = products.flatMap(p => 
    (p.variants || []).map(v => ({
      ...v,
      productTitle: p.title,
      fullLabel: `${p.title} - ${Object.values(v.optionMappings || {}).join('/')} (${v.sku})`
    }))
  );

  return (
    <div className="space-y-8 p-6 lg:p-10 pb-20 animate-fade-in max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-3">
          <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest">
            Inventory Tracking
          </Badge>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tight gradient-text leading-tight">
            Stock Movements
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Monitor inflows and outflows, adjust inventory levels, and track every change in your digital warehouse.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <Button 
            onClick={() => openModal('add')} 
            className="btn-primary flex items-center gap-2 px-6 h-14 text-base font-bold shadow-soft"
          >
            <Plus className="h-5 w-5" />
            Add Stock
          </Button>
          <Button 
            onClick={() => openModal('adjust')} 
            variant="outline"
            className="flex items-center gap-2 px-6 h-14 text-base font-bold border-white/20 hover:bg-white/5 rounded-2xl shadow-soft"
          >
            <History className="h-5 w-5" />
            Adjust
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar */}
        <Card className="lg:col-span-1 glass-card border-none shadow-strong">
          <CardHeader>
            <CardTitle className="text-xl font-black">Select Variant</CardTitle>
            <CardDescription className="font-medium">Choose a product to view history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
              <Input placeholder="Search variants..." className="pl-10 bg-background/50 border-white/10" />
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {allVariants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                    selectedVariantId === variant.id 
                    ? 'bg-primary/10 border-primary shadow-soft' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <p className={`font-black text-sm line-clamp-1 ${selectedVariantId === variant.id ? 'text-primary' : ''}`}>
                    {variant.productTitle}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-1 tracking-wider uppercase">
                    {Object.values(variant.optionMappings || {}).join('/') || 'Default'}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <Badge variant="outline" className="text-[10px] py-0 border-white/10">{variant.sku}</Badge>
                    <span className="text-xs font-black text-primary">{variant.stock} in stock</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Movement Table */}
        <Card className="lg:col-span-3 glass-card border-none shadow-strong overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
            <div>
              <CardTitle className="text-2xl font-black">Movement Log</CardTitle>
              {selectedVariantId && (
                <CardDescription className="text-primary font-bold mt-1">
                  History for {allVariants.find(v => v.id === selectedVariantId)?.fullLabel}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-xl border-white/10"><Filter className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="rounded-xl border-white/10"><Calendar className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedVariantId ? (
              <div className="flex flex-col items-center justify-center py-40 text-center gap-4">
                <div className="p-8 rounded-full bg-primary/5 border border-dashed border-primary/20">
                  <Boxes className="h-16 w-16 text-primary/20" />
                </div>
                <h3 className="text-2xl font-black">No Variant Selected</h3>
                <p className="text-muted-foreground font-medium max-w-xs">Select a product variant from the list to view its inventory history and logs.</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="font-bold text-muted-foreground animate-pulse">Retrieving Logs...</p>
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center gap-4">
                <History className="h-16 w-16 text-muted-foreground/20" />
                <h3 className="text-xl font-bold">No Movements Recorded</h3>
                <p className="text-muted-foreground">This variant has no recorded stock movements yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest">Type</TableHead>
                      <TableHead className="py-6 text-xs font-black uppercase tracking-widest">Quantity</TableHead>
                      <TableHead className="py-6 text-xs font-black uppercase tracking-widest">Stock Change</TableHead>
                      <TableHead className="py-6 text-xs font-black uppercase tracking-widest">Reason / Notes</TableHead>
                      <TableHead className="py-6 text-xs font-black uppercase tracking-widest">Date</TableHead>
                      <TableHead className="py-6 text-xs font-black uppercase tracking-widest">By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((move) => {
                      const isPositive = ['ADDITION', 'RETURN', 'CORRECTION'].includes(move.movementType) && move.quantity > 0;
                      return (
                        <TableRow key={move.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="py-6 px-8">
                            <Badge className={`rounded-xl px-3 py-1 font-bold ${
                              isPositive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`} variant="outline">
                              {move.movementType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-2">
                              {isPositive ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
                              <span className={`font-black text-lg ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? '+' : ''}{move.quantity}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 font-bold">
                            <span className="text-muted-foreground">{move.previousStock}</span>
                            <span className="mx-2 text-primary">→</span>
                            <span className="text-foreground">{move.newStock}</span>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex flex-col gap-0.5 max-w-[200px]">
                              <span className="font-bold text-sm line-clamp-1">{move.reason || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1 italic">{move.notes}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 text-sm font-medium">
                            {format(new Date(move.createdAt), 'MMM dd, yyyy')}
                            <br />
                            <span className="text-[10px] text-muted-foreground uppercase">{format(new Date(move.createdAt), 'hh:mm a')}</span>
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black">{move.createdBy?.name?.charAt(0) || 'A'}</div>
                              <span className="text-xs font-bold">{move.createdBy?.name || 'Admin'}</span>
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
        </Card>
      </div>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="glass-card border-none max-w-lg p-0 overflow-hidden shadow-2xl">
          <div className="p-8 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black tracking-tight gradient-text">
                {actionType === 'add' ? 'Add Stock' : actionType === 'adjust' ? 'Adjust Stock' : 'Record Damage'}
              </DialogTitle>
              <DialogDescription className="text-base font-medium">
                Record a new manual stock movement. This will update the variant's current inventory level.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleActionSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="variantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Variant</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 h-14 rounded-2xl border-white/10 group">
                            <SelectValue placeholder="Select a variant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="glass-card max-h-[300px]">
                          {allVariants.map(v => (
                            <SelectItem key={v.id} value={v.id.toString()} className="focus:bg-primary/10">
                              <div className="flex flex-col py-1">
                                <span className="font-bold">{v.productTitle}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{Object.values(v.optionMappings || {}).join('/')} - {v.sku}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                            className="h-14 bg-background/50 rounded-2xl border-white/10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-14 bg-background/50 rounded-2xl border-white/10">
                              <SelectValue placeholder="Reason" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass-card">
                            {actionType === 'add' ? (
                              <>
                                <SelectItem value="RESTOCK">Regular Restock</SelectItem>
                                <SelectItem value="PURCHASE">New Purchase</SelectItem>
                                <SelectItem value="RETURN">Customer Return</SelectItem>
                              </>
                            ) : actionType === 'adjust' ? (
                              <>
                                <SelectItem value="CORRECTION">Correction</SelectItem>
                                <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
                                <SelectItem value="TRANSFER">Warehouse Transfer</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="DAMAGED">Damaged in Transit</SelectItem>
                                <SelectItem value="DEFECTIVE">Manufacturing Defect</SelectItem>
                                <SelectItem value="EXPIRED">Expired Stock</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-14 bg-background/50 rounded-2xl border-white/10" placeholder="e.g. Received by security at gate..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                   <Button type="button" variant="ghost" onClick={() => setIsActionModalOpen(false)} className="flex-1 h-14 rounded-2xl font-bold">Cancel</Button>
                   <Button type="submit" disabled={loading} className="flex-1 btn-primary h-14 rounded-2xl font-bold shadow-soft">
                     {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                     Schedule Movement
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

export default StockMovements;
