import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define minimal interfaces to avoid full type file dependency issues for now
interface ProductVariant {
  id: number;
  sku: string;
  price: string;
  stock: number;
  isActive: boolean;
}

interface Product {
  id: number;
  title: string;
  price?: string; // Sometimes price is on product, sometimes on variants
  photos: { url: string; isPrimary: boolean }[];
  category?: { name: string };
  variants: ProductVariant[];
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product, variantId?: number) => void;
}

import { API_BASE_URL } from '@/utils/axiosClient';
import { Package } from 'lucide-react';

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const primaryPhoto = product.photos?.find(p => p.isPrimary)?.url || product.photos?.[0]?.url;
  const imageUrl = primaryPhoto ? `${API_BASE_URL}${primaryPhoto}` : null;
  
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Determine display price
  const displayPrice = hasVariants 
    ? product.variants[0].price 
    : (product.price || '0.00');

  const stock = hasVariants
    ? product.variants.reduce((acc, v) => acc + v.stock, 0)
    : 0; // Assuming simple products might track stock on product level, but schema showed variants usually hold stock. 
         // If no variants, and no stock on product (schema check needed), we might assume unlimited or 0.
         // Schema: Product doesn't have stock field! ProductVariant has stock. 
         // So a product MUST have variants to have stock? 
         // Actually, schema line 166-214 for Product has NO stock field.
         // Schema line 285 ProductVariant HAS stock.
         // So all stock is in variants.
         
  const isOutOfStock = stock <= 0;

  const handleAdd = () => {
    if (isOutOfStock) return;
    
    if (hasVariants) {
      if (product.variants.length === 1) {
        onAdd(product, product.variants[0].id);
      } else {
        // Todo: Open variant selector
        // For now, just add the first one to keep it simple, or user handles logic
        // Ideally pass back to parent to open modal
        onAdd(product); // Parent handles selection logic if multiple variants
      }
    }
  };

  return (
    <Card className={cn("h-full flex flex-col overflow-hidden transition-all hover:shadow-md", isOutOfStock && "opacity-60")}>
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.title} 
            className="object-cover w-full h-full transition-transform hover:scale-105"
            onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x300?text=Product'; }}
          />
        ) : (
           <div className="h-full w-full flex items-center justify-center bg-primary/5">
             <Package className="h-12 w-12 text-primary/30" />
           </div>
        )}
        {!isOutOfStock && hasVariants && (
           <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
             {product.variants.length} Variants
           </Badge>
        )}
        {isOutOfStock && (
           <Badge variant="destructive" className="absolute top-2 right-2">
             Out of Stock
           </Badge>
        )}
      </div>
      
      <CardContent className="p-3 flex-1">
        <div className="text-xs text-muted-foreground mb-1">{product.category?.name || 'Uncategorized'}</div>
        <h3 className="font-medium leading-tight line-clamp-2 mb-2" title={product.title}>{product.title}</h3>
        <div className="font-bold text-lg text-primary">
          KES {Number(displayPrice).toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Stock: {stock}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0">
        <Button 
          variant="default" 
          className="w-full" 
          size="sm" 
          onClick={handleAdd}
          disabled={isOutOfStock}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
};
