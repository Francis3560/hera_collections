import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Upload, X, ShieldCheck, Tag, Info, DollarSign, Package, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import productService from '@/api/product.service';
import CategoryService from '@/api/categories.service';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Schema validation
const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
});

const CreateProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);

  useEffect(() => {
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

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You must be logged in to create products.",
        });
        navigate('/login');
      } else if (user?.role !== 'ADMIN') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have permission to access this page.",
        });
        navigate('/'); // Redirect to home or dashboard
      }
    }
  }, [isAuthenticated, user, authLoading, navigate, toast]);

  const form = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: undefined,
      brand: '',
    },
  });

  // Variant management state
  const [options, setOptions] = useState([{ name: '', values: [''] }]);
  const [variants, setVariants] = useState([]);

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated or not admin (and effect hasn't redirected yet), return null or spinner
  if (!isAuthenticated || user?.role !== 'ADMIN') {
      return null; 
  }

  // Generate variants from options
  useEffect(() => {
    const validOptions = options.filter(opt => opt.name && opt.values.some(v => v.trim()));
    if (validOptions.length === 0) {
      setVariants([]);
      return;
    }

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

    setVariants(combinations.map(combo => ({
      optionMappings: combo,
      sku: '',
      price: '',
      costPrice: '',
      stock: 0,
    })));
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
      setImages((prev) => [...prev, ...files]);
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data) => {
    if (variants.length === 0) {
      toast({ variant: "destructive", title: "Missing Variants", description: "Please define at least one option and value." });
      return;
    }

    const invalidVariant = variants.find(v => !v.sku || !v.price);
    if (invalidVariant) {
      toast({ variant: "destructive", title: "Invalid Variants", description: "All variants must have a SKU and Price." });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
        brand: data.brand,
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

      await productService.createProduct(payload, images);

      toast({
        title: "Success! 🎉",
        description: "Product with variants has been created successfully.",
        className: "bg-green-500 text-white border-none",
      });
      
      setTimeout(() => navigate('/admin/products'), 1000);
    } catch (error) {
      console.error("Create product error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to create product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight gradient-text mb-2">Create Product</h1>
                <p className="text-muted-foreground">Add a new item to your premium collection.</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin/products')} className="gap-2 hover-lift">
                <X className="h-4 w-4" /> Cancel
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Product Details */}
            <div className="lg:col-span-2 space-y-8">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        
                        <Card className="glass-card border-none shadow-elegant">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Info className="h-5 w-5 text-primary" />
                                    Basic Information
                                </CardTitle>
                                <CardDescription>
                                    Essential details about the product.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Luxury Leather Tote" {...field} className="bg-background/50 focus:bg-background transition-all" />
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
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Describe the product features, material, and care instructions..." 
                                                    className="resize-none min-h-[120px] bg-background/50 focus:bg-background transition-all" 
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Options Builder */}
                        <Card className="glass-card border-none shadow-elegant">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Tag className="h-5 w-5 text-primary" /> Product Options
                                </CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addOption} className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Option
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {options.map((opt, optIndex) => (
                                    <div key={optIndex} className="p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <Input 
                                                placeholder="Option Name (e.g. Color)" 
                                                value={opt.name} 
                                                onChange={(e) => updateOptionName(optIndex, e.target.value)}
                                                className="max-w-[200px]"
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(optIndex)} className="text-destructive">
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
                                                        className="h-8 text-sm max-w-[100px]"
                                                    />
                                                    <button type="button" onClick={() => removeOptionValue(optIndex, valIndex)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="ghost" size="sm" onClick={() => addOptionValue(optIndex)} className="h-8 px-2 text-primary font-bold">
                                                + Value
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Variants Management */}
                        {variants.length > 0 && (
                            <Card className="glass-card border-none shadow-elegant overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Package className="h-5 w-5 text-primary" /> Variants ({variants.length})
                                    </CardTitle>
                                    <CardDescription>Assign SKU, Price, and Stock for each variant.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="w-[200px]">Variant</TableHead>
                                                    <TableHead>SKU</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Stock</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {variants.map((v, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell className="font-bold py-4">
                                                            {Object.values(v.optionMappings).join(' / ')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                placeholder="SKU" 
                                                                value={v.sku} 
                                                                onChange={(e) => updateVariantDetails(i, 'sku', e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="0.00" 
                                                                value={v.price} 
                                                                onChange={(e) => updateVariantDetails(i, 'price', e.target.value)}
                                                                className="h-9"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input 
                                                                type="number" 
                                                                placeholder="0" 
                                                                value={v.stock} 
                                                                onChange={(e) => updateVariantDetails(i, 'stock', e.target.value)}
                                                                className="h-9"
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

                        <Card className="glass-card border-none shadow-elegant">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Tag className="h-5 w-5 text-primary" /> Categorization
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="categoryId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-background/50"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                                                    <SelectContent>
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
                                                <FormLabel>Brand</FormLabel>
                                                <FormControl><Input placeholder="Brand Name" {...field} className="bg-background/50" /></FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="flex justify-end gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={() => navigate('/admin/products')}>
                                Discard
                            </Button>
                            <Button type="submit" disabled={isLoading} className="btn-primary min-w-[150px]">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Create Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                 </Form>
            </div>

            {/* Right Column: Media Upload */}
            <div className="lg:col-span-1 space-y-8">
                 <Card className="glass-card border-none shadow-elegant h-fit sticky top-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Package className="h-5 w-5 text-primary" />
                            Product Media
                        </CardTitle>
                        <CardDescription>
                            Upload high-quality images.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm ring-1 ring-border">
                                    <img src={src} alt={`Preview ${index}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            
                             <label className="border-2 border-dashed border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer transition-all group">
                                <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors mb-2">
                                     <Upload className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-xs text-muted-foreground font-medium text-center px-2">Click to Upload</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple 
                                    className="hidden" 
                                    onChange={handleImageChange}
                                />
                            </label>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex gap-3 items-start text-sm text-blue-600 dark:text-blue-300">
                             <Info className="h-5 w-5 shrink-0 mt-0.5" />
                             <p>
                                 Supported formats: JPG, PNG, WEBP. <br/>
                                 Max file size: 5MB per image.
                             </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProduct;
