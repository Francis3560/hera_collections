import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URL } from '@/utils/axiosClient';
import { getColorValue } from "@/utils/colorPalettes";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onSelectVariant: (product: any, variantId: number) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectVariant
}) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    if (isOpen && product?.variants?.length > 0) {
      // Default to first variant
      setSelectedVariant(product.variants[0]);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const getProductImage = () => {
    if (selectedVariant?.image) {
       return selectedVariant.image.startsWith('http') ? selectedVariant.image : `${API_BASE_URL}${selectedVariant.image}`;
    }
    if (product.photos?.[0]?.url) {
      return `${API_BASE_URL}${product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const selectedPrice = parseFloat(selectedVariant?.price || product.variants?.[0]?.price || 0);
  const discount = product.discounts?.find((d: any) => d.isActive);
  const discountedPrice = discount 
    ? selectedPrice * (1 - parseFloat(discount.discountPercentage) / 100) 
    : selectedPrice;
  const isOutOfStock = selectedVariant?.stock <= 0;

  // Extract unique colors and sizes
  const colors = Array.from(new Set(product.variants.flatMap((v: any) => 
    v.optionValues?.filter((ov: any) => 
      ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
      ov.optionValue?.option?.name?.toLowerCase().includes('colour')
    ).map((ov: any) => ov.optionValue.value)
  )));

  const sizes = Array.from(new Set(product.variants.flatMap((v: any) => 
    v.optionValues?.filter((ov: any) => 
      !ov.optionValue?.option?.name?.toLowerCase().includes('color') && 
      !ov.optionValue?.option?.name?.toLowerCase().includes('colour')
    ).map((ov: any) => ov.optionValue.value)
  )));

  const currentColor = selectedVariant?.optionValues?.find((ov: any) => 
    ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
    ov.optionValue?.option?.name?.toLowerCase().includes('colour')
  )?.optionValue.value;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl bg-white dark:bg-zinc-950 p-0 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px]">
        
        {/* Left Column: Image Gallery */}
        <div className="md:w-1/2 bg-secondary/10 flex flex-col">
            <div className="flex-1 relative bg-white dark:bg-zinc-900 flex items-center justify-center p-6 border-r border-border/50">
                <img 
                    src={getProductImage()} 
                    alt={product.title} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                />
                {discount && (
                  <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {Math.round(discount.discountPercentage)}% OFF
                  </div>
                )}
            </div>
            {/* Thumbnails */}
            <div className="h-24 border-t border-border/50 bg-background p-2 flex gap-2 overflow-x-auto scrollbar-hide">
                 {product.photos?.map((photo: any, idx: number) => (
                     <div key={idx} className="h-full aspect-square rounded-lg overflow-hidden border border-border/50 shrink-0">
                         <img src={`${API_BASE_URL}${photo.url}`} className="h-full w-full object-cover" />
                     </div>
                 ))}
            </div>
        </div>

        {/* Right Column: Details & Selection */}
        <div className="md:w-1/2 p-8 flex flex-col h-full bg-background overflow-hidden">
            <DialogHeader className="mb-6">
                <div className="flex items-center justify-between mb-2">
                   <Badge variant="outline" className="text-primary font-semibold">{product.category?.name || 'Collection'}</Badge>
                   {product.brand && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{product.brand}</span>}
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight">{product.title}</DialogTitle>
                
                <div className="mt-4 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{formatPrice(discountedPrice)}</span>
                        {discount && (
                          <span className="text-lg text-muted-foreground line-through">{formatPrice(selectedPrice)}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "text-xs font-bold uppercase tracking-wider",
                         isOutOfStock ? "text-red-500" : "text-green-600"
                       )}>
                         {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                       </span>
                       {!isOutOfStock && <span className="text-xs text-muted-foreground">({selectedVariant?.stock} units left)</span>}
                    </div>
                </div>
            </DialogHeader>

            <Separator className="mb-6" />

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-8">
                     {/* Colors Selection */}
                     {colors.length > 0 && (
                       <div className="space-y-3">
                         <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                           Color: <span className="text-foreground">{currentColor || "Select"}</span>
                         </label>
                         <div className="flex flex-wrap gap-3">
                           {colors.map((color: any) => {
                             const isSelected = currentColor === color;
                             return (
                               <button
                                 key={color}
                                 onClick={() => {
                                   const firstVariantWithColor = product.variants.find((v: any) => 
                                     v.optionValues?.some((ov: any) => ov.optionValue.value === color)
                                   );
                                   if (firstVariantWithColor) setSelectedVariant(firstVariantWithColor);
                                 }}
                                 className={cn(
                                   "w-10 h-10 rounded-full border-2 transition-all p-0.5 shadow-sm",
                                   isSelected ? "border-primary ring-4 ring-primary/10" : "border-transparent hover:border-gray-300"
                                 )}
                                 title={color}
                               >
                                 <div 
                                   className="w-full h-full rounded-full border border-black/5" 
                                   style={{ backgroundColor: getColorValue(color) }}
                                 />
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     {/* Sizes selection */}
                     {sizes.length > 0 && (
                       <div className="space-y-3">
                         <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">
                           Size: <span className="text-foreground">
                             {selectedVariant?.optionValues?.find((ov: any) => 
                               !ov.optionValue?.option?.name?.toLowerCase().includes('color') && 
                               !ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                             )?.optionValue.value || "Select"}
                           </span>
                         </label>
                         <div className="grid grid-cols-2 gap-3">
                           {sizes.map((size: any) => {
                             const variantForThisSizeAndColor = product.variants.find((v: any) => 
                               v.optionValues?.some((ov: any) => ov.optionValue.value === size) &&
                               (!currentColor || v.optionValues?.some((ov: any) => ov.optionValue.value === currentColor))
                             );

                             const isSelected = selectedVariant?.optionValues?.some((ov: any) => ov.optionValue.value === size);
                             const isAvailable = !!variantForThisSizeAndColor;
                             const vPrice = variantForThisSizeAndColor ? parseFloat(variantForThisSizeAndColor.price) : 0;
                             const vDiscountedPrice = discount ? vPrice * (1 - parseFloat(discount.discountPercentage) / 100) : vPrice;

                             return (
                               <button
                                 key={size}
                                 disabled={!isAvailable}
                                 onClick={() => {
                                   if (variantForThisSizeAndColor) setSelectedVariant(variantForThisSizeAndColor);
                                 }}
                                 className={cn(
                                   "px-4 py-3 border rounded-xl transition-all text-left flex flex-col gap-0.5",
                                   isSelected 
                                     ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 ring-1 ring-primary" 
                                     : isAvailable 
                                       ? "bg-card border-border hover:border-primary/50 hover:bg-accent text-foreground" 
                                       : "bg-muted/50 border-transparent text-muted-foreground cursor-not-allowed opacity-50"
                                 )}
                               >
                                 <span className="text-sm font-bold">{size}</span>
                                 {isAvailable && (
                                   <span className={cn(
                                     "text-[10px] font-medium",
                                     isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                   )}>
                                     {formatPrice(vDiscountedPrice)}
                                   </span>
                                 )}
                               </button>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     {/* SKU & Stock Details */}
                     <div className="pt-4 border-t border-border mt-auto">
                         <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                             <span>SKU: {selectedVariant?.sku || 'N/A'}</span>
                             <span>Stock: {selectedVariant?.stock ?? 0}</span>
                         </div>
                     </div>
                </div>
            </ScrollArea>

            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
                <Button 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1 rounded-xl h-12"
                >
                  Cancel
                </Button>
                <Button 
                    onClick={() => {
                        if (selectedVariant) {
                            onSelectVariant(product, selectedVariant.id);
                            onClose();
                        }
                    }}
                    disabled={!selectedVariant || isOutOfStock}
                    className="flex-[2] rounded-xl h-12 text-base font-bold shadow-lg shadow-primary/20"
                >
                    {isOutOfStock ? 'Out of Stock' : 'Confirm & Add'}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

