import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import discountService from '@/api/discount.service';
import productService from '@/api/product.service';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function DiscountForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name: '',
      description: '',
      discountPercentage: '',
      startDate: '',
      endDate: '',
      isActive: true,
    }
  });

  // Fetch Discount Data if Edit Mode
  const { data: discountData, isLoading: isLoadingDiscount } = useQuery({
    queryKey: ['discount', id],
    queryFn: () => discountService.getDiscount(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (discountData && discountData.data) {
      const d = discountData.data;
      setValue('name', d.name);
      setValue('description', d.description);
      setValue('discountPercentage', d.discountPercentage);
      // Format dates for input type="date" (YYYY-MM-DD)
      setValue('startDate', d.startDate ? new Date(d.startDate).toISOString().split('T')[0] : '');
      setValue('endDate', d.endDate ? new Date(d.endDate).toISOString().split('T')[0] : '');
      setValue('isActive', d.isActive);
      
      if (d.products) {
        setSelectedProductIds(d.products.map((p: any) => p.id));
      }
    }
  }, [discountData, setValue]);

  // Fetch Products with Debounced Search
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-select', debouncedSearchTerm],
    queryFn: () => {
      const params: any = { pageSize: 50 };
      // Only search if term length is >= 3
      if (debouncedSearchTerm.length >= 3) {
        params.q = debouncedSearchTerm;
      }
      return productService.getAllProducts(params);
    },
    // Keep previous data while fetching new to avoid flickering
    placeholderData: (previousData) => previousData,
  });

  const products = productsData?.items || productsData?.data?.items || [];
  
  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        discountPercentage: parseFloat(data.discountPercentage),
        productIds: selectedProductIds,
      };
      return isEditMode 
        ? discountService.updateDiscount(id!, payload)
        : discountService.createDiscount(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success(isEditMode ? 'Discount updated' : 'Discount created');
      navigate('/admin/discounts');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save discount');
    }
  });

  const onSubmit = (data: any) => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to apply the discount.");
      return;
    }
    mutation.mutate(data);
  };

  const handleProductToggle = (productId: number) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  if (isEditMode && isLoadingDiscount) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/discounts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{isEditMode ? 'Edit Discount' : 'Create New Discount'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discount Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input id="name" {...register('name', { required: 'Name is required' })} placeholder="e.g. Summer Sale 2026" />
                  {errors.name && <span className="text-red-500 text-sm">{errors.name.message as string}</span>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" {...register('description')} placeholder="Internal notes or description..." />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage (%)</Label>
                    <div className="relative">
                        <Input 
                            id="discountPercentage" 
                            type="number" 
                            step="0.01" 
                            min="0" 
                            max="100" 
                            {...register('discountPercentage', { required: 'Percentage is required', min: 0, max: 100 })} 
                            className="pr-8"
                        />
                        <span className="absolute right-3 top-2.5 text-muted-foreground font-bold">%</span>
                    </div>
                    {errors.discountPercentage && <span className="text-red-500 text-sm">{errors.discountPercentage.message as string}</span>}
                  </div>
                  
                  <div className="flex items-end pb-2">
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id="isActive" 
                            checked={true} // Default visual, controlled by update below
                            onCheckedChange={(checked) => setValue('isActive', checked)}
                            {...register('isActive')}
                        />
                        <Label htmlFor="isActive">Active Status</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="startDate">Start Date</Label>
                     <Input id="startDate" type="date" {...register('startDate', { required: 'Start date is required' })} />
                     {errors.startDate && <span className="text-red-500 text-sm">{errors.startDate.message as string}</span>}
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="endDate">End Date</Label>
                     <Input id="endDate" type="date" {...register('endDate', { required: 'End date is required' })} />
                     {errors.endDate && <span className="text-red-500 text-sm">{errors.endDate.message as string}</span>}
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
               <Button type="button" variant="outline" onClick={() => navigate('/admin/discounts')}>Cancel</Button>
               <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update Discount' : 'Create Discount'}
               </Button>
            </div>
          </div>

          <div className="lg:col-span-1">
             <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Select Products</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-[400px]">
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name (min 3 chars)..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
                        <span>{selectedProductIds.length} selected</span>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-0 text-primary"
                            onClick={() => setSelectedProductIds([])}
                        >
                            Clear all
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 h-[400px] border rounded-md p-2">
                        {isLoadingProducts ? (
                            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                        ) : (
                            <div className="space-y-2">
                                {products.map((product: any) => (
                                    <div key={product.id} className="flex items-start space-x-2 p-2 hover:bg-accent rounded-md transition-colors">
                                        <Checkbox 
                                            id={`prod-${product.id}`} 
                                            checked={selectedProductIds.includes(product.id)}
                                            onCheckedChange={() => handleProductToggle(product.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                            <Label 
                                                htmlFor={`prod-${product.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {product.title}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {product.variants?.length || 0} variants
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-4">
                                        {searchTerm.length >= 3 ? "No products found matching query." : "Type 3+ characters to search."}
                                    </p>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
             </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
