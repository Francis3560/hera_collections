import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URL } from '@/utils/axiosClient';

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
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Select Style for <span className="text-primary">{product.title}</span>
          </DialogTitle>
          <DialogDescription>
            Choose a specific variation to add to your cart.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4 pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.variants?.map((variant: any) => {
              // Construct variant name from option values if available
              // Structure: variant.optionValues[].optionValue.value (and .option.name)
              let variantName = variant.sku;
              if (variant.optionValues && variant.optionValues.length > 0) {
                 variantName = variant.optionValues
                    .map((ov: any) => `${ov.optionValue?.option?.name}: ${ov.optionValue?.value}`)
                    .join(', ');
              }

              const isOutOfStock = variant.stock <= 0;
              const photoUrl = variant.image 
                  ? (variant.image.startsWith('http') ? variant.image : `${API_BASE_URL}${variant.image}`)
                  : (product.photos?.[0]?.url ? `${API_BASE_URL}${product.photos[0].url}` : null);


              return (
                <div 
                  key={variant.id} 
                  className={`
                    relative flex flex-colborder rounded-xl p-3 gap-3 transition-all border
                    ${isOutOfStock ? 'opacity-60 bg-muted/50' : 'hover:border-primary hover:shadow-md bg-card'}
                  `}
                >
                  <div className="flex gap-4">
                      {/* Image Thumbnail */}
                      <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted border">
                        {photoUrl ? (
                            <img src={photoUrl} alt={variantName} className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                        )}
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 flex flex-col justify-between">
                         <div>
                            <h4 className="font-semibold text-sm line-clamp-2" title={variantName}>
                                {variantName}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">SKU: {variant.sku}</p>
                         </div>
                         
                         <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-primary">KES {Number(variant.price).toLocaleString()}</span>
                         </div>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t mt-1">
                      <Badge variant={isOutOfStock ? "destructive" : "outline"} className="text-[10px]">
                          {isOutOfStock ? 'Out of Stock' : `${variant.stock} Available`}
                      </Badge>
                      
                      <Button 
                        size="sm" 
                        disabled={isOutOfStock}
                        onClick={() => {
                            onSelectVariant(product, variant.id);
                            onClose();
                        }}
                      >
                        Select
                      </Button>
                  </div>

                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
