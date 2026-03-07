import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api/product.service";
import CategoryService from "@/api/categories.service";
import SubCategoryService from "@/api/subcategory.service";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { 
  ShoppingBag, 
  Eye, 
  Heart, 
  Filter, 
  ChevronRight, 
  Search,
  LayoutGrid,
  List,
  X,
  Star,
  ChevronDown
} from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { useWishlist } from "@/context/WishlistProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuickAddModal } from "@/components/shop/QuickAddModal";
import { motion, AnimatePresence } from "framer-motion";
import { LiveChat } from "@/components/chat/LiveChat";
import WhatsAppChat from "@/components/chat/WhatsAppChat";

export default function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState<any | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Search & Filter state from URL
  const activeCategory = searchParams.get("category") || "all";
  const activeSubCategory = searchParams.get("subcategory") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const searchQuery = searchParams.get("search") || "";
  const hasDiscount = searchParams.get("discounted") === "true";

  // Scroll to top when filters change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, activeSubCategory, sortBy, searchQuery]);

  // Fetch Categories with tree structure (this is now our primary source of truth for IDs)
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["all-categories-tree"],
    queryFn: () => CategoryService.getAllCategories({ tree: 'true' })
  });

  // Fetch Subcategories (keeping as fallback or for other uses if any)
  const { data: subCategoriesList = [] } = useQuery<any[]>({
    queryKey: ["all-subcategories"],
    queryFn: () => SubCategoryService.getAllSubCategories()
  });

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", activeCategory, activeSubCategory, sortBy, searchQuery, hasDiscount],
    queryFn: async () => {
      const params: any = {
        isPublished: true,
        pageSize: 50
      };

      // Resolve IDs from slugs
      if (activeCategory !== "all") {
        const cat = categories.find((c: any) => c.slug === activeCategory);
        if (cat) params.categoryId = cat.id;
      }

      if (activeSubCategory !== "all") {
        let subId = null;
        // Try to find in categories tree
        for (const cat of categories) {
          const found = cat.subCategories?.find((s: any) => s.slug === activeSubCategory);
          if (found) { subId = found.id; break; }
        }
        // Fallback to flat list
        if (!subId) {
          const sub = subCategoriesList.find((s: any) => s.slug === activeSubCategory);
          if (sub) subId = sub.id;
        }
        if (subId) params.subCategoryId = subId;
      }

      if (searchQuery) params.q = searchQuery;
      if (hasDiscount) params.hasDiscount = true;
      
      // Sort handling
      if (sortBy === "price-low") {
        params.sortBy = "price";
        params.sortOrder = "asc";
      } else if (sortBy === "price-high") {
        params.sortBy = "price";
        params.sortOrder = "desc";
      } else if (sortBy === "newest") {
        params.sortBy = "createdAt";
        params.sortOrder = "desc";
      } else if (sortBy === "popular") {
        params.sortBy = "purchases";
        params.sortOrder = "desc";
      }
      
      return ProductService.getAllProducts(params);
    },
    // We want this to be enabled as long as we have the slugs, 
    // even if categories are still loading (it will re-run once categories load and IDs are found)
    enabled: true
  });

  const products = (productsData as any)?.items || [];

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
      return;
    }

    try {
      await addToCart(product.id, defaultVariant.id, 1);
      toast.success("Added to cart");
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (isInWishlist(product.id)) {
        const wishlistItem = (wishlistItems as any[]).find((item: any) => item.productId === product.id);
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

  const handleCategoryClick = (catSlug: string) => {
    if (catSlug === "all") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("category");
      nextParams.delete("subcategory");
      setSearchParams(nextParams);
      setIsFilterOpen(false);
      setExpandedCategory(null);
    } else {
      // Just toggle the dropdown without navigating
      setExpandedCategory(expandedCategory === catSlug ? null : catSlug);
    }
  };

  const handleSubCategoryClick = (catSlug: string, subSlug: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("category", catSlug);
    nextParams.set("subcategory", subSlug);
    setSearchParams(nextParams);
    setIsFilterOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getProductImage = (product: any) => {
    if (product.photos?.[0]?.url) {
      return `${API_BASE_URL}${product.photos[0].url}`;
    }
    return "/placeholder-product.png";
  };

  const calculateDiscountedPrice = (product: any) => {
    const basePrice = parseFloat(product.variants?.[0]?.price || "0");
    const activeDiscount = product.discounts?.find((d: any) => d.isActive);
    if (activeDiscount) {
      return basePrice * (1 - parseFloat(activeDiscount.discountPercentage) / 100);
    }
    return basePrice;
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
      'Black': '#000000', 'White': '#FFFFFF', 'Red': '#EF4444', 
      'Blue': '#3B82F6', 'Green': '#10B981', 'Yellow': '#F59E0B', 
      'Pink': '#EC4899', 'Purple': '#8B5CF6', 'Gray': '#6B7280', 
      'Grey': '#6B7280', 'Brown': '#78350F', 'Orange': '#F97316', 
      'Tan': '#D2B48C', 'Beige': '#F5F5DC', 'Gold': '#FFD700', 
      'Silver': '#C0C0C0', 'Navy': '#000080', 'Burgundy': '#800020'
    };
    return colorMap[colorName] || colorName;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      
      <main className="flex-1">
        {/* Banner */}
        <div className="relative h-[250px] sm:h-[300px] bg-secondary/30 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 text-center px-4"
          >
            <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter mb-4">
              {(() => {
                if (activeSubCategory !== "all") {
                  let foundSub = null;
                  for (const cat of categories) {
                    const sub = cat.subCategories?.find((s: any) => s.slug === activeSubCategory);
                    if (sub) { foundSub = sub; break; }
                  }
                  return foundSub?.name || activeSubCategory.replace("-", " ");
                }
                if (activeCategory !== "all") {
                  const cat = categories.find((c: any) => c.slug === activeCategory);
                  return cat?.name || activeCategory.replace("-", " ");
                }
                return "The Collections";
              })()}
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground uppercase tracking-widest">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-bold">Shop</span>
            </div>
          </motion.div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Mobile Filters Trigger */}
            <div className="lg:hidden flex items-center justify-between mb-4">
               <Button 
                 variant="outline" 
                 className="flex items-center gap-2 rounded-full"
                 onClick={() => setIsFilterOpen(true)}
               >
                 <Filter className="h-4 w-4" /> Filters
               </Button>
               <div className="flex items-center gap-2">
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => setViewMode("grid")}
                   className={viewMode === "grid" ? "text-primary bg-primary/10" : ""}
                 >
                   <LayoutGrid className="h-4 w-4" />
                 </Button>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   onClick={() => setViewMode("list")}
                   className={viewMode === "list" ? "text-primary bg-primary/10" : ""}
                 >
                   <List className="h-4 w-4" />
                 </Button>
               </div>
            </div>

            {/* Sidebar Filters (Desktop) */}
            <aside className="hidden lg:block w-64 flex-shrink-0 space-y-8">
              {/* Search */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-widest">Search</h3>
                <div className="relative">
                  <Input 
                    placeholder="Find your bag..." 
                    value={searchQuery}
                    onChange={(e) => {
                      const nextParams = new URLSearchParams(searchParams);
                      if (e.target.value) nextParams.set("search", e.target.value);
                      else nextParams.delete("search");
                      setSearchParams(nextParams);
                    }}
                    className="rounded-xl border-none bg-secondary/30 focus-visible:ring-primary/20"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center justify-between">
                  Collections
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{categories.length}</span>
                </h3>
                <div className="flex flex-col gap-1">

                  {categories.map((cat: any) => {
                    const isAnySubActive = cat.subCategories?.some((s: any) => s.slug === activeSubCategory);
                    const isExpanded = expandedCategory === cat.slug || (isAnySubActive && expandedCategory === null);
                    const isActive = activeCategory === cat.slug;
                    
                    return (
                      <div key={cat.id} className="space-y-1">
                        <button 
                          onClick={() => handleCategoryClick(cat.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                            isActive 
                              ? "bg-primary/10 text-primary font-bold shadow-sm" 
                              : "hover:bg-secondary/50 text-muted-foreground"
                          }`}
                        >
                          <span className="truncate">{cat.name}</span>
                          {cat.subCategories?.length > 0 && (
                            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="ml-4 flex flex-col gap-1 border-l border-border/50 pl-3 py-1">
                            <button
                              onClick={() => {
                                const nextParams = new URLSearchParams(searchParams);
                                nextParams.set("category", cat.slug);
                                nextParams.delete("subcategory");
                                setSearchParams(nextParams);
                                setIsFilterOpen(false);
                              }}
                              className={`text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                                activeCategory === cat.slug && activeSubCategory === "all"
                                  ? "text-primary font-bold bg-primary/5"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                              }`}
                            >
                              All {cat.name}
                            </button>
                            {cat.subCategories?.map((sub: any) => (
                              <button
                                key={sub.id}
                                onClick={() => handleSubCategoryClick(cat.slug, sub.slug)}
                                className={`text-left px-3 py-1.5 rounded-md text-sm transition-all ${
                                  activeSubCategory === sub.slug
                                    ? "text-primary font-bold bg-primary/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 py-4 border-b border-border/50">
                 <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground font-medium">
                      <span className="text-foreground font-bold">{products.length}</span> Results Found
                    </p>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1 px-3 py-1">
                        "{searchQuery}"
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            const nextParams = new URLSearchParams(searchParams);
                            nextParams.delete("search");
                            setSearchParams(nextParams);
                          }} 
                        />
                      </Badge>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative group">
                      <select 
                        value={sortBy}
                        onChange={(e) => {
                          const nextParams = new URLSearchParams(searchParams);
                          nextParams.set("sort", e.target.value);
                          setSearchParams(nextParams);
                        }}
                        className="w-full sm:w-44 bg-secondary/30 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10"
                      >
                        <option value="newest">Latest Arrival</option>
                        <option value="popular">Bestselling</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                    
                    <div className="hidden lg:flex items-center bg-secondary/30 rounded-xl p-1">
                       <button 
                         onClick={() => setViewMode("grid")}
                         className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
                       >
                         <LayoutGrid className="h-4 w-4" />
                       </button>
                       <button 
                         onClick={() => setViewMode("list")}
                         className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}
                       >
                         <List className="h-4 w-4" />
                       </button>
                    </div>
                 </div>
              </div>

              {/* Product Area */}
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="aspect-[4/5] rounded-[2rem] w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-2xl font-bold">No treasures found</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any products matching your current filters. Try adjusting your search or explore other collections.
                  </p>
                  <Button variant="outline" onClick={() => handleCategoryClick("all")} className="rounded-xl">Clear All Filters</Button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-8">
                  {products.map((product: any) => {
                    const discountedPrice = calculateDiscountedPrice(product);
                    const originalPrice = parseFloat(product.variants?.[0]?.price || "0");
                    const hasDiscount = discountedPrice < originalPrice;
                    
                    return (
                      <motion.div 
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group"
                      >
                         <div className="relative aspect-[4/5] bg-secondary/20 rounded-[2rem] overflow-hidden border border-border/10 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 group-hover:-translate-y-2">
                            <Link to={`/product/${product.slug}`} className="block h-full">
                              <img 
                                src={getProductImage(product)} 
                                alt={product.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                            </Link>

                            {/* Badge */}
                            {hasDiscount && (
                              <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                                -{Math.round(product.discounts[0].discountPercentage)}%
                              </div>
                            )}

                            {/* Action Overlay */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3">
                               <button 
                                 onClick={(e) => handleToggleWishlist(e, product)}
                                 className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                                   isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-primary hover:text-white'
                                 }`}
                               >
                                 <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                               </button>
                               <button 
                                 onClick={(e) => handleAddToCart(e, product)}
                                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                               >
                                 <ShoppingBag className="h-5 w-5" />
                               </button>
                               <Link 
                                 to={`/product/${product.slug}`}
                                 className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-black hover:bg-primary hover:text-white flex items-center justify-center transition-all"
                               >
                                 <Eye className="h-5 w-5" />
                               </Link>
                            </div>
                         </div>

                         <div className="mt-5 space-y-2 px-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                              <span>{product.category?.name || "Bag"}</span>
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                <span>{product.rating || "5.0"}</span>
                              </div>
                            </div>
                            <h3 className="font-bold text-sm sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                              <Link to={`/product/${product.slug}`}>{product.title}</Link>
                            </h3>
                            <div className="flex items-center gap-3">
                               <span className="text-base sm:text-xl font-black">{formatPrice(discountedPrice)}</span>
                               {hasDiscount && (
                                 <span className="text-xs sm:text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
                               )}
                            </div>
                            
                            {/* Color options prompt */}
                            {getProductColors(product).length > 0 && (
                              <div className="flex gap-1 pt-2">
                                {getProductColors(product).slice(0, 4).map(c => (
                                  <div key={c} className="w-3 h-3 rounded-full border border-border/40" style={{ backgroundColor: getColorHex(c) }} title={c} />
                                ))}
                                {getProductColors(product).length > 4 && <span className="text-[8px] text-muted-foreground">+ more</span>}
                              </div>
                            )}
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="flex flex-col gap-6">
                  {products.map((product: any) => {
                    const discountedPrice = calculateDiscountedPrice(product);
                    const originalPrice = parseFloat(product.variants?.[0]?.price || "0");
                    const hasDiscount = discountedPrice < originalPrice;

                    return (
                      <motion.div 
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex flex-col sm:flex-row gap-6 p-4 rounded-3xl bg-secondary/10 border border-border/10 hover:border-primary/20 transition-all"
                      >
                         <Link to={`/product/${product.slug}`} className="w-full sm:w-48 aspect-square rounded-2xl overflow-hidden shrink-0">
                            <img 
                              src={getProductImage(product)} 
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                         </Link>
                         <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-start">
                               <div>
                                  <span className="text-[10px] font-bold text-primary uppercase">{product.category?.name}</span>
                                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{product.title}</h3>
                               </div>
                               <div className="text-right">
                                  <p className="text-2xl font-black">{formatPrice(discountedPrice)}</p>
                                  {hasDiscount && <p className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</p>}
                               </div>
                            </div>
                            <p className="text-muted-foreground text-sm flex-1 mt-4 line-clamp-3">{product.description}</p>
                            <div className="mt-6 flex flex-wrap gap-4 items-center">
                               <Button onClick={(e) => handleAddToCart(e, product)} className="rounded-full gap-2">
                                 <ShoppingBag className="h-4 w-4" /> Add to Bag
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 onClick={(e) => handleToggleWishlist(e, product)}
                                 className={isInWishlist(product.id) ? "text-red-500" : ""}
                               >
                                 <Heart className={isInWishlist(product.id) ? "fill-current" : ""} />
                               </Button>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer Filter */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-background z-[101] shadow-2xl p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8 text-foreground">
                <h2 className="text-xl font-bold">Filters</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}><X /></Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 text-foreground">
                <div className="space-y-4">
                   <h3 className="font-bold">Search</h3>
                   <div className="relative">
                    <Input 
                      placeholder="I'm looking for..." 
                      value={searchQuery}
                      onChange={(e) => {
                        const nextParams = new URLSearchParams(searchParams);
                        if (e.target.value) nextParams.set("search", e.target.value);
                        else nextParams.delete("search");
                        setSearchParams(nextParams);
                      }}
                      className="bg-secondary/30 border-none rounded-xl"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="font-bold">Collections</h3>
                   <div className="flex flex-col gap-2">

                     {categories.map((cat: any) => {
                       const isAnySubActive = cat.subCategories?.some((s: any) => s.slug === activeSubCategory);
                       const isExpanded = expandedCategory === cat.slug || (isAnySubActive && expandedCategory === null);
                       const isActive = activeCategory === cat.slug;

                       return (
                         <div key={cat.id} className="w-full space-y-1">
                           <button 
                             onClick={() => handleCategoryClick(cat.slug)}
                             className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                               isActive ? "bg-primary/20 text-primary shadow-lg" : "bg-secondary text-muted-foreground"
                             }`}
                           >
                             {cat.name}
                             {cat.subCategories?.length > 0 && (
                               <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                             )}
                           </button>
                           
                           {isExpanded && (
                             <div className="ml-6 border-l-2 border-primary/20 flex flex-col gap-1 py-1">
                                <button 
                                  onClick={() => {
                                    const nextParams = new URLSearchParams(searchParams);
                                    nextParams.set("category", cat.slug);
                                    nextParams.delete("subcategory");
                                    setSearchParams(nextParams);
                                    setIsFilterOpen(false);
                                  }}
                                  className={`text-left px-4 py-2 rounded-lg text-xs transition-all ${
                                    activeCategory === cat.slug && activeSubCategory === "all"
                                      ? "text-primary font-black"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  All {cat.name}
                                </button>
                                {cat.subCategories?.map((sub: any) => (
                                 <button
                                   key={sub.id}
                                   onClick={() => handleSubCategoryClick(cat.slug, sub.slug)}
                                   className={`text-left px-4 py-2 rounded-lg text-xs transition-all ${
                                     activeSubCategory === sub.slug
                                       ? "text-primary font-black"
                                       : "text-muted-foreground"
                                   }`}
                                 >
                                   {sub.name}
                                 </button>
                               ))}
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                 <Button className="w-full rounded-2xl h-12" onClick={() => setIsFilterOpen(false)}>Show Results</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
      <QuickAddModal 
        isOpen={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        onAddToCart={addToCart}
      />
      <LiveChat />
      <WhatsAppChat />
    </div>
  );
}
