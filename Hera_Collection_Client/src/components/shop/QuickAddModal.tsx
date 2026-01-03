import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { API_BASE_URL } from '@/utils/axiosClient';
import { ShoppingBag, X, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onAddToCart: (productId: number, variantId: number, quantity: number) => Promise<void>;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  product,
  onAddToCart
}) => {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const handleAddClick = async () => {
    if (!selectedVariant) return;
    setIsAdding(true);
    try {
      await onAddToCart(product.id, selectedVariant.id, 1);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdding(false);
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(Number(price));
  };

  const getVariantName = (variant: any) => {
    if (variant.optionValues && variant.optionValues.length > 0) {
      return variant.optionValues
        .map((ov: any) => ov.optionValue.value)
        .join(' / ');
    }
    return variant.sku || 'Default Variant';
  };

  const getVariantImage = (variant: any) => {
    if (variant.image) {
      return variant.image.startsWith('http') ? variant.image : `${API_BASE_URL}${variant.image}`;
    }
    if (product.photos?.[0]?.url) {
      return `${API_BASE_URL}${product.photos[0].url}`;
    }
    return '/placeholder-product.png';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden bg-background border-none shadow-2xl rounded-3xl">
        <div className="relative">
          {/* Header Image / Pattern Area */}
          <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/10 dark:to-background flex items-center px-8 relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
             <div className="z-10">
                <Badge variant="outline" className="mb-2 border-primary/20 text-primary bg-primary/5">Quick Add</Badge>
                <DialogTitle className="text-2xl font-bold tracking-tight">{product.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground line-clamp-1">
                   Select a preferred variation to add to your bag
                </DialogDescription>
             </div>
             
             <DialogClose className="absolute right-4 top-4 p-2 rounded-full hover:bg-background/50 transition-colors z-20">
                <X className="h-5 w-5" />
             </DialogClose>
          </div>

          <div className="p-6">
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-3">
                {product.variants?.map((variant: any) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOutOfStock = variant.stock <= 0;
                  const name = getVariantName(variant);

                  return (
                    <motion.div
                      key={variant.id}
                      whileHover={!isOutOfStock ? { scale: 1.01 } : {}}
                      whileTap={!isOutOfStock ? { scale: 0.99 } : {}}
                      onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                      className={`
                        group relative flex items-center gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer
                        ${isSelected 
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-secondary/30'}
                        ${isOutOfStock ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                      `}
                    >
                      {/* Selection Indicator */}
                      <div className={`
                        absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-8 rounded-full transition-all
                        ${isSelected ? 'bg-primary scale-x-100' : 'bg-transparent scale-x-0'}
                      `} />

                      {/* Variant Thumbnail */}
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-border/20">
                         <img 
                            src={getVariantImage(variant)} 
                            alt={name} 
                            className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                         />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-bold text-sm truncate">{name}</h4>
                            <span className="font-black text-primary text-sm whitespace-nowrap ml-2">
                               {formatPrice(variant.price)}
                            </span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                               SKU: {variant.sku}
                            </span>
                            {isOutOfStock ? (
                               <Badge variant="destructive" className="h-4 px-1.5 text-[8px] uppercase tracking-tighter">Out of Stock</Badge>
                            ) : (
                               <span className="text-[10px] text-[#2eb135] font-medium">
                                  {variant.stock} in stock
                               </span>
                            )}
                         </div>
                      </div>

                      {/* Check icon */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 ml-2"
                          >
                             <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-8 flex gap-3">
               <Button 
                variant="secondary" 
                className="flex-1 rounded-2xl h-12 font-bold"
                onClick={onClose}
               >
                 Cancel
               </Button>
               <Button 
                className="flex-[2] rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 gap-2"
                disabled={!selectedVariant || isAdding}
                onClick={handleAddClick}
               >
                 {isAdding ? (
                   <span className="flex items-center gap-2">
                     <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     Adding...
                   </span>
                 ) : (
                   <>
                     <ShoppingBag className="h-5 w-5" />
                     Add to Bag
                   </>
                 )}
               </Button>
            </div>
            
            <p className="text-[10px] text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
               <Info className="h-3 w-3" />
               Premium delivery available on all variations
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
