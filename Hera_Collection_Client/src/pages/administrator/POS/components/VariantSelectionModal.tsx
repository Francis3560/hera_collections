import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URL } from '@/utils/axiosClient';
import { getColorValue } from "@/utils/colorPalettes";

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any; // Using any for flexibility with backend structure
  onSelectVariant: (product: any, variantId: number) => void;
}

export const VariantSelectionModal: React.FC<VariantSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  onSelectVariant
}) => {
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null);

  React.useEffect(() => {
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

  const selectedPrice = selectedVariant?.price || product.variants?.[0]?.price || 0;
  const isOutOfStock = selectedVariant?.stock <= 0;

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
            </div>
            {/* Thumbnails (optional, just showing filtered variants images for now if we wanted, or just static main image) */}
            <div className="h-20 border-t border-border/50 bg-background p-2 flex gap-2 overflow-x-auto">
                 {product.photos?.map((photo: any, idx: number) => (
                     <div key={idx} className="h-full aspect-square rounded-md overflow-hidden border border-border/50 shrink-0">
                         <img src={`${API_BASE_URL}${photo.url}`} className="h-full w-full object-cover" />
                     </div>
                 ))}
            </div>
        </div>

        {/* Right Column: Details & Selection */}
        <div className="md:w-1/2 p-6 flex flex-col h-full bg-background">
            <DialogHeader className="mb-6">
                <Badge variant="outline" className="w-fit mb-2 text-muted-foreground">{product.category?.name || 'Product'}</Badge>
                <DialogTitle className="text-2xl font-bold">{product.title}</DialogTitle>
                <div className="flex flex-col mt-2">
                    <div className="flex items-baseline gap-2">
                        {product.discounts && product.discounts.length > 0 ? (
                           (() => {
                              const discount = product.discounts[0];
                              const original = Number(selectedPrice);
                              const discounted = original - (original * discount.discountPercentage / 100);
                              return (
                                <>
                                   <span className="text-sm text-muted-foreground line-through">KES {original.toLocaleString()}</span>
                                   <span className="text-2xl font-bold text-red-500">KES {discounted.toLocaleString()}</span>
                                   <Badge variant="destructive" className="ml-2">{discount.discountPercentage}% OFF</Badge>
                                </>
                              );
                           })()
                        ) : (
                           <span className="text-2xl font-bold text-primary">KES {Number(selectedPrice).toLocaleString()}</span>
                        )}
                    </div>
                    {selectedVariant && (
                        <span className="text-sm text-muted-foreground mt-1">
                            Stock: <span className={isOutOfStock ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                                {isOutOfStock ? 'Out of Stock' : `${selectedVariant.stock} Available`}
                            </span>
                        </span>
                    )}
                </div>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4 -mr-4">
                <div className="space-y-6">
                     {/* SKU Display */}
                     {selectedVariant && (
                         <div className="p-3 bg-secondary/20 rounded-lg text-sm flex justify-between">
                             <span className="text-muted-foreground">SKU</span>
                             <span className="font-mono font-medium">{selectedVariant.sku}</span>
                         </div>
                     )}

                     {/* Variant Selector */}
                     <div>
                        <label className="text-sm font-medium mb-3 block">Select Option</label>
                        <div className="flex flex-wrap gap-2">
                            {product.variants?.map((variant: any) => (
                                <button
                                    key={variant.id}
                                    onClick={() => setSelectedVariant(variant)}
                                    className={`px-3 py-2 border rounded-lg text-sm transition-all flex items-center gap-2 ${
                                        selectedVariant?.id === variant.id 
                                        ? 'border-primary bg-primary/5 text-primary font-medium ring-1 ring-primary' 
                                        : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    {/* Content similar to ProductDetailsPage */}
                                    <div className="flex items-center gap-1.5">
                                        {variant.optionValues?.map((ov: any, idx: number) => {
                                            const isColor = ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
                                                            ov.optionValue?.option?.name?.toLowerCase().includes('colour');
                                            return (
                                                <div key={idx} className="flex items-center gap-1.5">
                                                    {isColor && (
                                                        <div 
                                                            className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" 
                                                            style={{ backgroundColor: getColorValue(ov.optionValue.value) }}
                                                        />
                                                    )}
                                                    <span>{ov.optionValue.value}</span>
                                                    {idx < variant.optionValues.length - 1 && <span className="opacity-50">/</span>}
                                                </div>
                                            );
                                        })}
                                        {(!variant.optionValues || variant.optionValues.length === 0) && (
                                            <span>{variant.sku || `Var ${variant.id}`}</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                     </div>
                </div>
            </ScrollArea>

            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={() => {
                        if (selectedVariant) {
                            onSelectVariant(product, selectedVariant.id);
                            onClose();
                        }
                    }}
                    disabled={!selectedVariant || isOutOfStock}
                    className="w-full sm:w-auto"
                >
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
