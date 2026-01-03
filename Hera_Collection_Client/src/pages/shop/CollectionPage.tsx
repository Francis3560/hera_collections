import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import CategoryService from "@/api/categories.service";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { ShoppingBag, Eye, Heart, Filter, ChevronRight, SlidersHorizontal, Palette } from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuickAddModal } from "@/components/shop/QuickAddModal";

export default function CollectionPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();
  const [sortBy, setSortBy] = useState("newest");
  const [quickAddProduct, setQuickAddProduct] = useState<any | null>(null);

  const { data: category, isLoading, error } = useQuery({
    queryKey: ["category", slug],
    queryFn: () => CategoryService.getCategoryBySlug(slug!),
    enabled: !!slug
  });

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.variants?.length > 1) {
       setQuickAddProduct(product);
       return;
    }

    const defaultVariant = product.variants?.[0];
    if (!defaultVariant) {
      toast.error("Product has no variants available");
      navigate(`/product/${product.slug}`);
      return;
    }

    try {
      await addToCart(product.id, defaultVariant.id, 1);
      toast.success("Added to cart");
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const getProductColors = (product: any) => {
    const colors = new Set<string>();
    product.variants?.forEach((variant: any) => {
      variant.optionValues?.forEach((ov: any) => {
        if (ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
            ov.optionValue?.option?.name?.toLowerCase().includes('colour')) {
          colors.add(ov.optionValue.value);
        }
      });
    });
    return Array.from(colors);
  };

  const getColorHex = (colorName: string) => {
    const colorMap: Record<string, string> = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Red': '#EF4444',
      'Blue': '#3B82F6',
      'Green': '#10B981',
      'Yellow': '#F59E0B',
      'Pink': '#EC4899',
      'Purple': '#8B5CF6',
      'Gray': '#6B7280',
      'Grey': '#6B7280',
      'Brown': '#78350F',
      'Orange': '#F97316',
      'Tan': '#D2B48C',
      'Beige': '#F5F5DC',
      'Gold': '#FFD700',
      'Silver': '#C0C0C0',
      'Navy': '#000080',
      'Burgundy': '#800020'
    };
    return colorMap[colorName] || colorName;
  };

  const handleToggleWishlist = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isInWishlist(product.id)) {
        const wishlistItem = wishlistItems.find((item: any) => item.productId === product.id);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id);
          toast.success("Removed from wishlist");
        }
      } else {
        await addToWishlist(product.id, product.variants?.[0]?.id || null);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const getProductImage = (product: any) => {
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

  const calculateDiscountedPrice = (product: any) => {
    const basePrice = parseFloat(product.variants?.[0]?.price || "0");
    const activeDiscount = product.discounts?.find((d: any) => d.isActive);
    if (activeDiscount) {
      return basePrice * (1 - parseFloat(activeDiscount.discountPercentage) / 100);
    }
    return basePrice;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-48 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-3xl font-bold mb-4">Collection Not Found</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            The collection you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const products = category.products || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Collection Hero / Banner */}
        <div className="relative h-[300px] sm:h-[400px] overflow-hidden">
          <img 
            src={category.coverPhoto ? `${API_BASE_URL}${category.coverPhoto}` : "/placeholder-category.jpg"} 
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-6">
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
               <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 uppercase tracking-tighter">
                 {category.name}
               </h1>
               {category.description && (
                 <p className="text-lg text-white/90 font-medium max-w-2xl mx-auto hidden sm:block">
                   {category.description}
                 </p>
               )}
            </div>
          </div>
          {/* Breadcrumbs on banner */}
          <div className="absolute bottom-6 left-6 hidden sm:flex items-center text-sm text-white/80">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link to="/collections" className="hover:text-white transition-colors">Collections</Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="font-medium text-white">{category.name}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 py-4 border-y border-border/50">
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Showing <span className="text-foreground">{products.length}</span> products
                </span>
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative group flex-1 sm:flex-none">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-48 bg-secondary/30 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
             </div>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">This collection is currently empty. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {products.map((product: any) => {
                const discountedPrice = calculateDiscountedPrice(product);
                const originalPrice = parseFloat(product.variants?.[0]?.price || "0");
                const hasDiscount = discountedPrice < originalPrice;
                const hasMultipleVariants = product.variants && product.variants.length > 1;

                return (
                  <Link 
                    to={`/product/${product.slug}`} 
                    key={product.id}
                    className="group"
                  >
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary/20 border border-border/10 mb-4 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/5">
                      {/* Product Image */}
                      <img 
                        src={getProductImage(product)} 
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-lg animate-pulse">
                          {Math.round(product.discounts[0].discountPercentage)}% OFF
                        </div>
                      )}

                      {/* Multiple Variants Indicator */}
                      {hasMultipleVariants && (
                        <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-black/80 backdrop-blur-md border border-border/20 py-1 px-2 rounded-lg text-[10px] font-semibold text-primary">
                          {product.variants.length} Variants
                        </div>
                      )}

                      {/* Action Buttons Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 sm:gap-4 p-4">
                        <button 
                          onClick={(e) => handleToggleWishlist(e, product)}
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isInWishlist(product.id) 
                              ? 'bg-red-500 text-white' 
                              : 'bg-white/90 dark:bg-black/90 text-foreground hover:bg-primary hover:text-white'
                          }`}
                        >
                          <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                        </button>
                        
                        <button 
                          onClick={(e) => handleAddToCart(e, product)}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 dark:bg-black/90 text-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300"
                        >
                          <ShoppingBag className="h-5 w-5" />
                        </button>

                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 dark:bg-black/90 text-foreground hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300">
                          <Eye className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 sm:space-y-2 px-1">
                      <div className="flex items-center justify-between">
                         {product.brand && (
                           <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">{product.brand}</span>
                         )}
                         <div className="flex text-yellow-400">
                             <Star className="h-3 w-3 fill-current" />
                             <span className="text-[10px] ml-1 text-muted-foreground font-medium">{product.rating || 5.0}</span>
                         </div>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-lg font-bold text-foreground">
                          {formatPrice(discountedPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs sm:text-sm text-muted-foreground line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                      
                      {/* Variant Selection UI (Prompt) */}
                      {hasMultipleVariants && (
                        <div className="pt-2">
                            {getProductColors(product).length > 0 && (
                              <div className="flex flex-col gap-1.5 mb-2">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Palette className="h-2.5 w-2.5" />
                                  Available in
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {getProductColors(product).slice(0, 4).map((color) => (
                                    <div 
                                      key={color}
                                      className="w-3 h-3 rounded-full border border-border/40"
                                      style={{ backgroundColor: getColorHex(color) }}
                                      title={color}
                                    />
                                  ))}
                                  {getProductColors(product).length > 4 && (
                                    <span className="text-[8px] text-muted-foreground">+{getProductColors(product).length - 4}</span>
                                  )}
                                </div>
                              </div>
                            )}
                            <span className="text-[10px] text-primary font-medium flex items-center gap-1">
                                <Filter className="h-3 w-3" /> {product.variants.length} Options available
                            </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        onAddToCart={addToCart}
      />
    </div>
  );
}

// Reuse Star icon or import it if needed
function Star({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
    </svg>
  );
}
