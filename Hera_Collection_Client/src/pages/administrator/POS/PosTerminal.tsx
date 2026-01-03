import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { VariantSelectionModal } from './components/VariantSelectionModal';
import posService from '@/api/pos.service';
import productService from '@/api/product.service';
import { useToast } from '@/components/ui/use-toast';
import { debounce } from 'lodash'; // Assume lodash is available or I'll implement simple debounce if not
import Swal from 'sweetalert2';

const PosTerminal = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadCart();
  }, []);

  // Search logic
  const loadProducts = async (search = '') => {
    setLoadingProducts(true);
    try {
      // Map frontend params to backend API params
      const params: any = { 
        pageSize: 50,  // Backend expects 'pageSize', not 'limit'
        page: 1
      }; 
      
      if (search) params.q = search; // Backend expects 'q'
      if (selectedCategory) params.categoryId = selectedCategory; // Backend expects 'categoryId'
      
      const res = await productService.getAllProducts(params);
      // The backend returns { items: [], page: ... }, so we need res.items or res.data.items depending on service wrapper
      // Service wrapper simply returns response.data. 
      // Based on USER log: { items: [...], total: ... }
      // So res is that object. We need res.items.
      setProducts(res.items || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoadingProducts(false);
    }
  };
  
  // Debounced search
  // Using useCallback to create a stable debounce function
  const debouncedSearch = useCallback(
    debounce((term) => loadProducts(term), 500),
    [selectedCategory] // Re-create if category changes
  );

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };
  
  useEffect(() => {
     // Reload products when category changes
     loadProducts(searchTerm);
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await productService.getAllCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Cart Logic
  const loadCart = async () => {
    try {
      const res = await posService.getCart();
      setCart(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (product, variantId) => {
    // If product has multiple variants and no variantId is provided, open selector
    if (!variantId && product.variants && product.variants.length > 1) {
       setSelectedProductForVariant(product);
       return;
    }

    // Determine variant and check stock
    let variant;
    let effectiveVariantId = variantId;

    if (effectiveVariantId) {
        variant = product.variants.find((v: any) => v.id === effectiveVariantId);
    } else if (product.variants && product.variants.length > 0) {
        // Fallback to first variant if simple product or single variant
        variant = product.variants[0];
        effectiveVariantId = variant.id;
    }

    if (variant) {
        const stock = variant.stock || 0;
        const cartItem = cart?.items?.find((item: any) => item.variantId === effectiveVariantId);
        const currentQty = cartItem ? cartItem.quantity : 0;
        
        if (currentQty + 1 > stock) {
            toast({ 
                title: 'Stock Limit Reached', 
                description: `Only ${stock} items available in stock.`, 
                variant: 'destructive' 
            });
            return;
        }
    }

    setLoadingCart(true);
    try {
      await posService.addToCart(product.id, effectiveVariantId, 1);
      await loadCart();
      toast({ title: 'Success', description: 'Item added to cart' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to add item', variant: 'destructive' });
    } finally {
      setLoadingCart(false);
    }
  };

  const handleUpdateQuantity = async (itemId, qty) => {
    // Check stock limit for increase
    const item = cart?.items?.find((i: any) => i.id === itemId);
    if (item && qty > item.quantity) {
         let stock = item.variant?.stock;
         
         // If stock not present on cart item, try finding in current products list
         if (stock === undefined && products.length > 0) {
             const prod: any = products.find((p: any) => p.id === item.productId);
             if (prod) {
                 const v = prod.variants?.find((v: any) => v.id === item.variantId);
                 if (v) stock = v.stock;
             }
         }

         if (stock !== undefined && qty > stock) {
             toast({ 
                 title: 'Stock Limit Reached', 
                 description: `Cannot add more. Only ${stock} items available.`, 
                 variant: 'destructive' 
             });
             return;
         }
    }

    setLoadingCart(true);
    try {
      if (qty <= 0) {
        await posService.removeCartItem(itemId);
      } else {
        await posService.updateCartItem(itemId, qty);
      }
      await loadCart();
    } catch (error: any) {
       toast({ title: 'Error', description: error.response?.data?.message || 'Update failed', variant: 'destructive' });
    } finally {
       setLoadingCart(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
     // Re-using simplified logic in updateQuantity(0) but explicit call here
     setLoadingCart(true);
     try {
       await posService.removeCartItem(itemId);
       await loadCart();
     } catch (error) {
       console.error(error);
     } finally {
       setLoadingCart(false);
     }
  };

  const handleClearCart = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, clear it!'
    });

    if (!result.isConfirmed) return;
    
    setLoadingCart(true);
    try {
      await posService.clearCart();
      await loadCart();
      Swal.fire(
        'Cleared!',
        'Your cart has been cleared.',
        'success'
      );
    } catch (error) {
       console.error(error);
       toast({ title: 'Error', description: 'Failed to clear cart', variant: 'destructive' });
    } finally {
      setLoadingCart(false);
    }
  };

  const handleCheckout = async (data) => {
    try {
      const order = await posService.checkout(data);
      toast({ title: 'Sale Completed', description: `Order ${order.orderNumber} created successfully.` });
      await loadCart(); // Should be empty now
      setIsCheckoutOpen(false);
    } catch (error) {
       console.error(error);
       toast({ title: 'Checkout Failed', description: 'Could not complete transaction', variant: 'destructive' });
       throw error; // Re-throw for modal to handle
    }
  };

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-gray-50 dark:bg-zinc-900">
      
      {/* Search & Grid Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header/Filter Bar */}
        <div className="p-4 bg-white dark:bg-zinc-950 border-b space-y-4">
           <div className="flex gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search products..." 
                   className="pl-9" 
                   value={searchTerm}
                   onChange={handleSearchChange}
                 />
              </div>
              <Button variant="outline" size="icon" onClick={() => loadProducts(searchTerm)}>
                 <RotateCcw className="h-4 w-4" />
              </Button>
           </div>
           
           {/* Categories */}
           <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <Badge 
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(null)}
              >
                All Items
              </Badge>
              {categories.map((cat: any) => (
                <Badge
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Badge>
              ))}
           </div>
        </div>
        
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
           {loadingProducts ? (
              <div className="flex items-center justify-center h-full">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
           ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {products.map((product: any) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAdd={handleAddToCart} 
                    />
                 ))}
                 {products.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                       No products found.
                    </div>
                 )}
              </div>
           )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[350px] lg:w-[400px] flex-shrink-0 shadow-xl z-20">
         <CartSidebar 
           cart={cart}
           onUpdateQuantity={handleUpdateQuantity}
           onRemoveItem={handleRemoveItem} // Should be separate in logic if needed, but for now quantity 0 works
           onClearCart={handleClearCart}
           loading={loadingCart}
           onCheckout={() => setIsCheckoutOpen(true)}
         />
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)}
        total={cart?.subtotal || 0}
        items={cart?.items || []}
        onConfirm={handleCheckout}
        onPaymentSuccess={async () => {
          await posService.clearCart();
          await loadCart();
          setIsCheckoutOpen(false);
        }}
      />

      <VariantSelectionModal 
        isOpen={!!selectedProductForVariant}
        onClose={() => setSelectedProductForVariant(null)}
        product={selectedProductForVariant}
        onSelectVariant={(product, variantId) => handleAddToCart(product, variantId)}
      />

    </div>
  );
};

export default PosTerminal;
