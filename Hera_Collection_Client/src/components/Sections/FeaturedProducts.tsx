import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Star, 
  Heart, 
  ShoppingBag, 
  Eye, 
  Tag, 
  Zap,
  TrendingUp,
  Shield,
  Sparkles,
  Palette
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api/product.service";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { toast } from "sonner";
import { QuickAddModal } from "@/components/shop/QuickAddModal";

export default function FeaturedProducts() {
  const { theme } = useTheme();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();
  const [activeFilter, setActiveFilter] = useState("All Products");
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [quickAddProduct, setQuickAddProduct] = useState<any | null>(null);

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ["featured-products", activeFilter],
    queryFn: () => {
      const params: any = { isPublished: true, pageSize: 8 };
      if (activeFilter === "Bestsellers") {
        params.sortBy = "purchases";
      } else if (activeFilter === "New Arrivals") {
        params.sortBy = "createdAt";
        params.sortOrder = "desc";
      } else if (activeFilter === "On Sale") {
        params.hasDiscount = true;
      }
      return ProductService.getAllProducts(params);
    }
  });

  const products = productsData?.items || [];

  const handleAddToCart = async (product: any) => {
    if (product.variants?.length > 1) {
      setQuickAddProduct(product);
      return;
    }

    try {
      // Use first variant by default
      const variantId = product.variants?.[0]?.id;
      if (!variantId) {
        toast.error("No variant available for this product");
        return;
      }
      await addToCart(product.id, variantId, 1);
      toast.success(`${product.title} added to bag`);
    } catch (error) {
      toast.error("Failed to add to bag");
    }
  };

  const handleToggleWishlist = async (product: any) => {
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

  const getProductImage = (product: any) => {
    if (product.photos?.[0]) {
      return `${API_BASE_URL}${product.photos[0].url}`;
    }
    return "/placeholder-product.png";
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="h-10 w-48 bg-secondary animate-pulse rounded-lg mb-8 mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-secondary animate-pulse rounded-3xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-secondary/10 dark:from-background dark:to-secondary/5 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-50px" }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary dark:text-primary" />
            <span className="text-sm font-medium text-primary dark:text-primary uppercase tracking-wider">
              Premium Selection
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground dark:text-foreground mb-4 tracking-tight">
            <span className="font-medium">Featured</span> Products
          </h2>
          
          <p className="text-base sm:text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto px-4">
            Discover our handpicked collection of premium bags, crafted with exceptional quality and timeless design
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 lg:mb-12 px-2"
        >
          {['All Products', 'Bestsellers', 'New Arrivals', 'On Sale', 'Luxury'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                activeFilter === filter 
                  ? 'bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground shadow-lg' 
                  : 'bg-secondary/50 dark:bg-secondary/30 text-foreground/80 dark:text-foreground/80 hover:bg-primary/10 dark:hover:bg-primary/20'
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
        >
          {products.map((product: any) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="group relative"
            >
              <div className="bg-card dark:bg-card/95 rounded-2xl sm:rounded-3xl overflow-hidden border border-border/20 dark:border-border/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/20 dark:hover:border-primary/30 h-full flex flex-col">
                {/* Product Image Container */}
                <div className="relative overflow-hidden">
                  {/* Badge */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                    {product.brand && (
                      <div className={`bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg`}>
                        {product.brand}
                      </div>
                    )}
                    {product.discounts?.[0] && (
                       <div className="bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg animate-pulse">
                         {Math.round(product.discounts[0].discountPercentage)}% OFF
                       </div>
                    )}
                  </div>
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={() => handleToggleWishlist(product)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-background/90 dark:bg-background/80 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                    aria-label="Add to wishlist"
                  >
                    <Heart 
                      className={`h-4 w-4 transition-colors duration-300 ${
                        isInWishlist(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground group-hover:text-primary'
                      }`}
                    />
                  </button>
                  
                  {/* Quick View Button */}
                  <button
                    onClick={() => setQuickViewProduct(product)}
                    className="absolute bottom-4 right-4 z-10 w-8 h-8 bg-background/90 dark:bg-background/80 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    aria-label="Quick view"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </button>
                  
                  {/* Product Image */}
                  <div className="aspect-square relative">
                    <img
                      src={getProductImage(product)}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/600x600?text=Product'; 
                      }}
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Add to Cart Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground font-medium py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Product Info */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  {/* Category */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground font-medium uppercase tracking-wider">
                      {product.category?.name || "Uncategorized"}
                    </span>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold text-foreground dark:text-foreground">
                        {product.rating || "5.0"}
                      </span>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        ({product.reviewCount || 0})
                      </span>
                    </div>
                  </div>
                  
                  {/* Product Name */}
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground mb-2 line-clamp-1 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                    <Link to={`/product/${product.slug}`} className="hover:underline">
                      {product.title}
                    </Link>
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 flex-1 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Variants */}
                  {product.variants?.length > 1 && (
                    <div className="mb-4">
                      {getProductColors(product).length > 0 && (
                        <div className="flex flex-col gap-2 mb-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                            <Palette className="h-3 w-3" />
                            Available in
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {getProductColors(product).map((color) => (
                              <div 
                                key={color}
                                className="group/swatch relative"
                              >
                                <div 
                                  className="w-5 h-5 rounded-full border border-border/50 shadow-sm transition-transform hover:scale-125 cursor-help"
                                  style={{ backgroundColor: getColorHex(color) }}
                                />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-background border text-[8px] rounded opacity-0 group-hover/swatch:opacity-100 transition-opacity whitespace-nowrap z-20">
                                   {color}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {product.variants.slice(0, 4).map((v: any, i: number) => (
                            <div 
                              key={v.id} 
                              className="w-5 h-5 rounded-full border-2 border-background dark:border-background flex items-center justify-center bg-secondary/80 text-[8px] font-bold"
                              title={v.sku}
                            >
                               {i === 3 && product.variants.length > 4 ? `+${product.variants.length - 3}` : ""}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          {product.variants.length} Options
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Price and Action */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30 dark:border-border/40">
                    <div>
                      {/* Current Price */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">
                            {formatPrice(getProductPrice(product))}
                          </span>
                          {getOriginalPrice(product) && (
                            <span className="text-sm text-muted-foreground line-through decoration-red-500/50">
                              {formatPrice(getOriginalPrice(product)!)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Action Button */}
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mt-12 sm:mt-16 lg:mt-20 text-center"
        >
          <h3 className="text-2xl sm:text-3xl font-light text-foreground dark:text-foreground mb-4">
            Can't Find What You're Looking For?
          </h3>
          <p className="text-base text-muted-foreground dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore our complete collection or contact our style consultants for personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/collections"
              className="inline-flex items-center justify-center gap-2 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground font-medium py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              Browse All Collections
              <TrendingUp className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-secondary dark:bg-secondary text-foreground dark:text-foreground font-medium py-3 px-8 rounded-full border border-border dark:border-border/60 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              Get Personal Styling
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        {/* Quick Add Modal */}
        <QuickAddModal 
          isOpen={!!quickAddProduct}
          onClose={() => setQuickAddProduct(null)}
          product={quickAddProduct}
          onAddToCart={addToCart}
        />
      </div>
    </section>
  );
}