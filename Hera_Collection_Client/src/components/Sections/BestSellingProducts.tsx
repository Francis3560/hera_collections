import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag,
  Star,
  Tag,
  Sparkles,
  Heart,
  Palette
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api/product.service";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAddModal } from "@/components/shop/QuickAddModal";

export default function ProductShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [quickAddProduct, setQuickAddProduct] = useState<any | null>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["bestselling-products"],
    queryFn: () => ProductService.getAllProducts({ 
      isPublished: true, 
      sortBy: "purchases", 
      pageSize: 10 // Fetch enough for slider
    })
  });
  
  const products = productsData?.items || [];

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerView(1.2);
      } else if (width < 768) {
        setItemsPerView(2.2);
      } else if (width < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Auto-transition effect
  useEffect(() => {
    if (!isAutoPlaying || products.length === 0) return;

    const playNext = () => {
      if (currentIndex + itemsPerView >= products.length) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    };

    autoPlayRef.current = setInterval(playNext, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, products.length, itemsPerView]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const nextSlide = () => {
    if (currentIndex + itemsPerView < products.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(Math.max(0, products.length - itemsPerView));
    }
  };

  const getTransformValue = () => {
    if (products.length === 0) return "translateX(0%)";
    const itemWidth = 100 / itemsPerView;
    return `translateX(-${currentIndex * itemWidth}%)`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getProductPrice = (product: any) => {
    const basePrice = parseFloat(product.variants?.[0]?.price || "0");
    const activeDiscount = product.discounts?.[0];
    if (activeDiscount) {
      const discountPercentage = parseFloat(activeDiscount.discountPercentage);
      const discountAmount = basePrice * (discountPercentage / 100);
      return basePrice - discountAmount;
    }
    return basePrice;
  };

  const getOriginalPrice = (product: any) => {
    const activeDiscount = product.discounts?.[0];
    if (activeDiscount) {
       return parseFloat(product.variants?.[0]?.price || "0");
    }
    return null; 
  };

  const getProductImage = (product: any, secondary = false) => {
    if (secondary && product.photos?.[1]) {
        return `${API_BASE_URL}${product.photos[1].url}`;
    }
    if (product.photos?.[0]) {
      return `${API_BASE_URL}${product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); // Prevent link navigation
    
    if (product.variants?.length > 1) {
      setQuickAddProduct(product);
      return;
    }

    try {
      const variantId = product.variants?.[0]?.id;
      if (!variantId) {
        toast.error("No variant available");
        return;
      }
      await addToCart(product.id, variantId, 1);
      toast.success(`${product.title} added to bag`);
    } catch (error) {
      toast.error("Failed to add to bag");
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
    e.preventDefault(); // Prevent link navigation
    try {
      if (isInWishlist(product.id)) {
        const wishlistItem = wishlistItems.find((item: any) => item.productId === product.id);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id);
          toast.success("Removed from wishlist");
        }
      } else {
          const variantId = product.variants?.[0]?.id;
        await addToWishlist(product.id, variantId || null);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error("Wishlist update failed");
    }
  };


  if (isLoading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-background transition-colors duration-300">
         <div className="container mx-auto px-4 sm:px-6">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12">
                 <Skeleton className="h-10 w-64 mb-2 sm:mb-0" />
                 <div className="flex gap-2">
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => (
                     <div key={i} className="space-y-4">
                         <Skeleton className="h-64 w-full rounded-xl" />
                         <Skeleton className="h-4 w-3/4" />
                         <Skeleton className="h-4 w-1/2" />
                     </div>
                 ))}
             </div>
         </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-foreground mb-2"
              style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
            >
              Best Selling Products
            </motion.h2>
            
            {/* Breadcrumb style subtitle */}
            <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
              <span className="hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Home</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Shop</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="text-primary dark:text-primary font-medium">Bestsellers</span>
            </div>
          </div>

          {/* Navigation Controls */}
          {products.length > itemsPerView && (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 mt-4 sm:mt-0"
            >
                <button
                onClick={prevSlide}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-secondary hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-full"
                aria-label="Previous products"
                >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors" />
                </button>
                <button
                onClick={nextSlide}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-secondary hover:bg-primary dark:hover:bg-primary transition-all duration-300 rounded-full"
                aria-label="Next products"
                >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors" />
                </button>
            </motion.div>
          )}
        </div>

        {/* Products Carousel */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No bestselling products found.</div>
          ) : (
             <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ 
                  transform: getTransformValue(),
                  transition: isAutoPlaying ? 'transform 0.7s ease-in-out' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {products.map((product: any, index: number) => {
                  const originalPrice = getOriginalPrice(product);
                  const price = getProductPrice(product);
                  const discountPercentage = product.discounts?.[0]?.discountPercentage;
                  const hasDiscount = !!discountPercentage;

                  return (
                    <div
                      key={product.id}
                      className="px-2 sm:px-3 flex-shrink-0"
                      style={{ width: `${100 / itemsPerView}%` }}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative"
                        onMouseEnter={() => setIsHovering(product.id)}
                        onMouseLeave={() => setIsHovering(null)}
                      >
                        <Link
                          to={`/product/${product.slug}`}
                          className="block"
                        >
                          {/* Image Container with Hover Effect */}
                          <div className="relative bg-gray-50 dark:bg-secondary/30 overflow-hidden aspect-square mb-4 rounded-xl border border-transparent hover:border-primary/20 transition-all duration-300">
                            {/* Primary Image */}
                            <div className={`absolute inset-0 transition-opacity duration-500 ${
                              isHovering === product.id && product.photos?.[1] ? 'opacity-0' : 'opacity-100'
                            }`}>
                              <img
                                src={getProductImage(product)}
                                alt={product.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.png'; // Fallback
                                }}
                              />
                            </div>
                            
                            {/* Secondary Image (on hover) */}
                            {product.photos?.[1] && (
                                <div className={`absolute inset-0 transition-opacity duration-500 ${
                                isHovering === product.id ? 'opacity-100' : 'opacity-0'
                                }`}>
                                <img
                                    src={getProductImage(product, true)}
                                    alt={`${product.title} view`}
                                    className="w-full h-full object-cover"
                                />
                                </div>
                            )}
                            
                            {/* Brand Badge */}
                            {product.brand && (
                              <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-foreground text-xs font-bold py-1 px-2.5 rounded shadow-sm">
                                {product.brand}
                              </div>
                            )}
                            
                            {/* Discount Badge */}
                            {hasDiscount && (
                              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold py-1 px-2.5 rounded shadow-sm animate-pulse">
                                -{Math.round(discountPercentage)}%
                              </div>
                            )}
                            
                            {/* Quick Action Button */}
                            <button 
                                onClick={(e) => handleAddToCart(e, product)}
                                className="absolute bottom-3 right-3 w-10 h-10 bg-white dark:bg-background rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-white"
                            >
                              <ShoppingBag className="h-4 w-4" />
                            </button>
                            
                            {/* Wishlist Button */}
                            <button 
                                onClick={(e) => handleToggleWishlist(e, product)}
                                className="absolute bottom-3 left-3 w-10 h-10 bg-white dark:bg-background rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                            >
                              <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? "fill-red-500 text-red-500" : ""}`} />
                            </button>
                          </div>
                          
                          {/* Product Info */}
                          <div className="text-center">
                            {/* Category */}
                            <div className="text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-1">
                              {product.category?.name || "Collection"}
                            </div>
                            
                            {/* Product Name */}
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                              <Link to={`/product/${product.slug}`}>
                                {product.title}
                              </Link>
                            </h3>
                            
                            {/* Variants */}
                            {product.variants?.length > 1 && (
                              <div className="flex flex-col items-center gap-2 mb-3">
                                {getProductColors(product).length > 0 && (
                                  <div className="flex flex-col items-center gap-1.5 ">
                                    <div className="flex justify-center flex-wrap gap-1">
                                      {getProductColors(product).slice(0, 5).map((color) => (
                                        <div 
                                          key={color}
                                          className="group/swatch relative"
                                          title={color}
                                        >
                                          <div 
                                            className="w-3.5 h-3.5 rounded-full border border-border/40 shadow-sm"
                                            style={{ backgroundColor: getColorHex(color) }}
                                          />
                                        </div>
                                      ))}
                                      {getProductColors(product).length > 5 && (
                                        <span className="text-[8px] text-muted-foreground">+{getProductColors(product).length - 5}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {product.variants.slice(0, 3).map((v: any) => (
                                      <div 
                                        key={v.id} 
                                        className="w-4 h-4 rounded-full border border-background dark:border-background bg-secondary/80"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                    {product.variants.length} Options
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Rating */}
                            <div className="flex items-center justify-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(product.rating || 5) 
                                      ? 'text-yellow-400 fill-yellow-400' 
                                      : 'text-gray-300 dark:text-gray-600'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 dark:text-muted-foreground ml-1">
                                ({product.reviewCount || 0})
                              </span>
                            </div>
                            
                            {/* Price */}
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xl font-bold text-gray-900 dark:text-foreground">
                                {formatPrice(price)}
                              </span>
                              {originalPrice && (
                                <span className="text-sm text-gray-500 dark:text-muted-foreground line-through decoration-red-500/50">
                                  {formatPrice(originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
          )}
          
          {/* Auto-play indicator */}
          {products.length > 0 && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                {[...Array(Math.ceil(products.length / itemsPerView))].map((_, index) => (
                <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === Math.floor(currentIndex / itemsPerView)
                        ? 'w-6 bg-primary dark:bg-primary'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                />
                ))}
            </div>
          )}
        </div>

        {/* View All Products Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            to="/collections?sort=popular"
            className="inline-flex items-center gap-2 border-2 border-gray-900 dark:border-gray-700 text-gray-900 dark:text-foreground hover:bg-gray-900 dark:hover:bg-gray-800 hover:text-white dark:hover:text-white font-medium py-3 px-8 rounded-none transition-all duration-300"
          >
            <span>View All Bestsellers</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
      
      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        onAddToCart={addToCart}
      />
    </section>
  );
}