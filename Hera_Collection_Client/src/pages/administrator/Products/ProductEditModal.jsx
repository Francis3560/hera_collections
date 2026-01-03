import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Upload, 
  X, 
  ShieldCheck, 
  Tag, 
  Info, 
  DollarSign, 
  Package, 
  Image as ImageIcon,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/axiosClient';
import productService from '@/api/product.service';
import CategoryService from '@/api/categories.service';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  price: z.coerce.number().optional(), // Price handles by variants usually
  sku: z.string().optional(),
  quantity: z.coerce.number().optional(), // Stock handled by variants
  categoryId: z.string().optional(),
  brand: z.string().optional(),
});

const ProductEditModal = ({ isOpen, onClose, product, onUpdateSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  
  // Image handling
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [removedPhotoUrls, setRemovedPhotoUrls] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  // Variant management state
  const [options, setOptions] = useState([]);
  const [variants, setVariants] = useState([]);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      brand: '',
    },
  });

  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        title: product.title || '',
        description: product.description || '',
        categoryId: product.categoryId?.toString() || '',
        brand: product.brand || '',
      });
      setExistingPhotos(product.photos || []);
      setRemovedPhotoUrls([]);
      setNewImages([]);
      setNewImagePreviews([]);

      // Map existing options
      if (product.options && product.options.length > 0) {
        setOptions(product.options.map(opt => ({
          name: opt.name,
          values: opt.values.map(v => v.value)
        })));
      } else {
        setOptions([{ name: '', values: [''] }]);
      }

      // Map existing variants
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants.map(v => ({
          id: v.id,
          sku: v.sku || '',
          price: v.price || '',
          costPrice: v.costPrice || '',
          stock: v.stock || 0,
          isActive: v.isActive,
          optionMappings: v.optionValues?.reduce((acc, ov) => {
            if (ov.optionValue?.option?.name) {
              acc[ov.optionValue.option.name] = ov.optionValue.value;
            }
            return acc;
          }, {}) || {}
        })));
      }

      fetchCategories();
    }
  }, [product, isOpen, form]);

  // Generate variants logic (only for NEW combinations)
  useEffect(() => {
    const validOptions = options.filter(opt => opt.name && opt.values.some(v => v.trim()));
    if (validOptions.length === 0) return;

    const combinations = validOptions.reduce((acc, opt) => {
      const values = opt.values.filter(v => v.trim());
      if (acc.length === 0) return values.map(v => ({ [opt.name]: v }));
      
      const newAcc = [];
      acc.forEach(combo => {
        values.forEach(val => {
          newAcc.push({ ...combo, [opt.name]: val });
        });
      });
      return newAcc;
    }, []);

    setVariants(prev => {
      return combinations.map(combo => {
        // Check if this combination already exists in prev
        const existing = prev.find(v => 
          Object.entries(combo).every(([key, value]) => v.optionMappings[key] === value)
        );
        if (existing) return existing;

        return {
          optionMappings: combo,
          sku: '',
          price: '',
          costPrice: '',
          stock: 0,
          isActive: true
        };
      });
    });
  }, [options]);

  const addOption = () => setOptions([...options, { name: '', values: [''] }]);
  const removeOption = (index) => setOptions(options.filter((_, i) => i !== index));
  const updateOptionName = (index, name) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    setOptions(newOptions);
  };
  const addOptionValue = (index) => {
    const newOptions = [...options];
    newOptions[index].values.push('');
    setOptions(newOptions);
  };
  const removeOptionValue = (optIndex, valIndex) => {
    const newOptions = [...options];
    newOptions[optIndex].values = newOptions[optIndex].values.filter((_, i) => i !== valIndex);
    setOptions(newOptions);
  };
  const updateOptionValue = (optIndex, valIndex, value) => {
    const newOptions = [...options];
    newOptions[optIndex].values[valIndex] = value;
    setOptions(newOptions);
  };

  const updateVariantDetails = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setNewImages((prev) => [...prev, ...files]);
      setNewImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeExistingPhoto = (photoUrl) => {
    setExistingPhotos((prev) => prev.filter((p) => p.url !== photoUrl));
    setRemovedPhotoUrls((prev) => [...prev, photoUrl]);
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const fetchCategories = async () => {
    setIsFetchingCategories(true);
    try {
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsFetchingCategories(false);
    }
  };

  const onSubmit = async (data) => {
    if (!product) return;
    setLoading(true);
    try {
const payload = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        brand: data.brand,
        removeImageUrls: removedPhotoUrls,
        // Explicitly stringify options/variants to ensure they are treated as JSON strings by the service logic (which double stringifies?) 
        // Wait, service logic checks typeof value === 'object'.
        // If I pass an array, service stringifies it.
        // If the backend says "must be an array", it received a string.
        options: options.map(opt => ({
          name: opt.name,
          values: opt.values.filter(v => v.trim())
        })),
        variants: variants.map(v => ({
          ...v,
          price: parseFloat(v.price),
          costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
          stock: parseInt(v.stock) || 0,
        })),
      };

      await productService.updateProduct(product.id, payload, newImages);
      
      toast({
        title: "Product Updated 🎉",
        description: "Your changes have been synchronized successfully.",
      });
      
      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error("Update product error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1100px] w-[95vw] p-0 overflow-hidden border-none glass-card shadow-strong animate-scale-in max-h-[90vh]">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-8 pb-0">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tight gradient-text">Update Product</DialogTitle>
                  <DialogDescription className="text-base font-medium">Refine your premium catalog item's identity and variants.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 px-8 py-6">
            <Form {...form}>
              <form id="product-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    {/* Basic Info */}
                    <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden">
                      <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" /> Core Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Title</FormLabel>
                              <FormControl><Input placeholder="Product Name" {...field} className="bg-background/50 border-white/10 h-10 rounded-xl" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Description</FormLabel>
                              <FormControl><Textarea placeholder="Product narrative..." className="bg-background/50 border-white/10 rounded-xl min-h-[100px] resize-none" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Classification</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger className="bg-background/50 border-white/10 h-10 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger></FormControl>
                                            <SelectContent className="glass-card">
                                                {categories.map((cat) => <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="brand"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-black uppercase tracking-wider opacity-70">Brand</FormLabel>
                                        <FormControl><Input placeholder="Brand" {...field} className="bg-background/50 border-white/10 h-10 rounded-xl" /></FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Options Builder */}
                    <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Tag className="h-4 w-4 text-primary" /> Product Options
                            </CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-8 rounded-lg border-white/10 px-3">
                                <Plus className="h-3 w-3 mr-1" /> Add
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {options.map((opt, optIndex) => (
                                <div key={optIndex} className="p-4 rounded-xl border border-dashed border-white/10 bg-white/5 space-y-3">
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            placeholder="Option Name" 
                                            value={opt.name} 
                                            onChange={(e) => updateOptionName(optIndex, e.target.value)}
                                            className="max-w-[180px] h-9"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optIndex)} className="text-destructive h-8 w-8 hover:bg-destructive/10">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {opt.values.map((val, valIndex) => (
                                            <div key={valIndex} className="flex items-center gap-1 group">
                                                <Input 
                                                    placeholder="Value" 
                                                    value={val} 
                                                    onChange={(e) => updateOptionValue(optIndex, valIndex, e.target.value)}
                                                    className="h-8 text-xs max-w-[90px] bg-background/50"
                                                />
                                                <button type="button" onClick={() => removeOptionValue(optIndex, valIndex)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="ghost" size="sm" onClick={() => addOptionValue(optIndex)} className="h-8 px-2 text-primary font-bold text-xs">
                                            + Value
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Variants List */}
                    {variants.length > 0 && (
                        <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden">
                            <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" /> Inventory & Pricing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-black/20">
                                            <TableRow className="border-white/5">
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Variant</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">SKU</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Price</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase tracking-widest">Stock</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {variants.map((v, i) => (
                                                <TableRow key={i} className={`border-white/5 ${!v.isActive ? 'opacity-40 grayscale' : ''}`}>
                                                    <TableCell className="font-bold py-4 text-xs">
                                                        {Object.values(v.optionMappings).join(' / ')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            placeholder="SKU" 
                                                            value={v.sku} 
                                                            onChange={(e) => updateVariantDetails(i, 'sku', e.target.value)}
                                                            className="h-8 text-xs bg-background/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number" 
                                                            placeholder="0.00" 
                                                            value={v.price} 
                                                            onChange={(e) => updateVariantDetails(i, 'price', e.target.value)}
                                                            className="h-8 text-xs bg-background/50"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            type="number" 
                                                            placeholder="0" 
                                                            value={v.stock} 
                                                            onChange={(e) => updateVariantDetails(i, 'stock', e.target.value)}
                                                            className="h-8 text-xs bg-background/50"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                  </div>

                  {/* Right Column: Media */}
                  <div className="lg:col-span-1 space-y-8">
                    <Card className="bg-white/5 border-white/10 shadow-soft overflow-hidden h-full">
                        <CardHeader className="pb-4 bg-primary/5 border-b border-white/5">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-primary" /> Visual Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="grid grid-cols-2 gap-3">
                                {existingPhotos.map((photo) => (
                                    <div key={photo.url} className="relative aspect-square rounded-xl overflow-hidden border border-white/5 group bg-muted">
                                        <img src={`${API_BASE_URL}${photo.url}`} className="h-full w-full object-cover" alt="Product" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeExistingPhoto(photo.url)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                {newImagePreviews.map((src, index) => (
                                    <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-primary/30 ring-2 ring-primary/10 group bg-muted">
                                        <img src={src} className="h-full w-full object-cover" alt="New upload" />
                                        <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-white/10 hover:border-primary/30 hover:bg-primary/5 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all group">
                                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all" />
                                    <span className="text-[10px] font-black uppercase text-muted-foreground mt-2">Add Photo</span>
                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                  </div>
                </div>
              </form>
            </Form>
          </ScrollArea>

          {/* Footer */}
          <div className="p-8 pt-6 border-t border-white/5 bg-black/20">
            <DialogFooter className="flex-row sm:justify-end gap-3 items-center">
              <Button type="button" variant="ghost" onClick={onClose} className="h-12 rounded-xl px-8 font-black text-xs uppercase tracking-widest border-white/10 hover:bg-white/5">Discard</Button>
              <Button form="product-edit-form" type="submit" disabled={loading} className="h-12 rounded-xl px-12 btn-primary font-black text-xs uppercase tracking-widest shadow-glow min-w-[180px]">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sync Changes"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditModal;
