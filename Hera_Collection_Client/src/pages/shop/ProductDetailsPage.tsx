import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Star, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Heart, 
  Share2, 
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import ProductService from "@/api/product.service";
import { API_BASE_URL } from "@/utils/axiosClient.ts";
import { useCart } from "@/context/CartProvider";
import { getColorValue } from "@/utils/colorPalettes";
import { useWishlist } from "@/context/WishlistProvider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

export default function ProductDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();
  
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product by slug
  const { data: productData, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => ProductService.getProductBySlug(slug!),
    enabled: !!slug
  });

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const product = productData?.data || productData;


  // Set default variant when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const next = prev + delta;
      const maxStock = selectedVariant?.stock ?? 0;
      return Math.min(Math.max(1, next), Math.max(1, maxStock));
    });
  };

  // Adjust quantity if it exceeds variant stock when variant changes
  useEffect(() => {
    if (selectedVariant && selectedVariant.stock > 0 && quantity > selectedVariant.stock) {
      setQuantity(selectedVariant.stock);
    } else if (selectedVariant && selectedVariant.stock <= 0) {
      setQuantity(1);
    }
  }, [selectedVariant, selectedVariant?.stock]);

  const allImages = product?.photos || [];
  const currentColorAttribute = selectedVariant?.optionValues?.find((ov: any) => 
    ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
    ov.optionValue?.option?.name?.toLowerCase().includes('colour')
  )?.optionValue.value;

  // Filter images based on selected color
  const displayedImages = allImages.filter((img: any) => {
    if (!currentColorAttribute) return true;
    // If image is associated with THIS color
    if (img.altText === `Color:${currentColorAttribute}`) return true;
    // Also show general images that aren't associated with ANY color
    if (!img.altText || !img.altText.startsWith('Color:')) return true;
    return false;
  });

  // Reset image index if it's out of bounds of displayed images
  useEffect(() => {
    if (activeImageIndex >= displayedImages.length && displayedImages.length > 0) {
      setActiveImageIndex(0);
    }
  }, [displayedImages.length, activeImageIndex]);

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    
    if (selectedVariant.stock <= 0) {
      toast.error("This variant is currently out of stock");
      return;
    }

    try {
      await addToCart(product.id, selectedVariant.id, quantity, product, selectedVariant);
      toast.success("Added to cart");
    } catch (err) {
      toast.error("Failed to add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (isInWishlist(product.id)) {
        const wishlistItem = wishlistItems.find((item: any) => item.productId === product.id);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id);
          toast.success("Removed from wishlist");
        }
      } else {
        await addToWishlist(product.id, selectedVariant?.id || null);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };

  const getProductPrice = () => {
    if (!selectedVariant) return 0;
    const basePrice = parseFloat(selectedVariant.price);
    
    // Check for active discounts
    const activeDiscount = product.discounts?.find((d: any) => d.isActive);
    if (activeDiscount) {
      const discountPercentage = parseFloat(activeDiscount.discountPercentage);
      return basePrice * (1 - discountPercentage / 100);
    }
    return basePrice;
  };

  const getOriginalPrice = () => {
    if (!selectedVariant) return null;
    const activeDiscount = product.discounts?.find((d: any) => d.isActive);
    return activeDiscount ? parseFloat(selectedVariant.price) : null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="aspect-square rounded-xl" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-1/3" />
                </div>
            </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
            <Button onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }


  const discount = product.discounts?.find((d: any) => d.isActive);

  // Group variants by options (Simplified for now assuming single dimension or flat list)
  // If your variants are complex (Color AND Size), you'd need logic to filter compatible options.
  // For now, let's list variants as buttons.

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-muted-foreground mb-8 overflow-x-auto whitespace-nowrap">
          <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/')}>Home</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="cursor-pointer hover:text-primary" onClick={() => navigate('/shop')}>Shop</span>
          <ChevronRight className="h-4 w-4 mx-2" />
          {product.category && (
            <>
                <Link 
                  to={`/collections?category=${product.category.slug}`}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                    {product.category.name}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
            </>
          )}
          {product.subCategory && (
            <>
                <Link 
                  to={`/collections?subcategory=${product.subCategory.slug}`}
                  className="cursor-pointer hover:text-primary transition-colors"
                >
                    {product.subCategory.name}
                </Link>
                <ChevronRight className="h-4 w-4 mx-2" />
            </>
          )}
          <span className="font-medium text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-secondary/20 rounded-2xl overflow-hidden border border-border relative group cursor-zoom-in">
              {discount && (
                <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                  {Math.round(discount.discountPercentage)}% OFF
                </div>
              )}
              {displayedImages.length > 0 ? (
                <img 
                  src={`${API_BASE_URL}${displayedImages[activeImageIndex]?.url}`} 
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
              )}
            </div>
            
            {/* Thumbnails */}
            {displayedImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {displayedImages.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img 
                      src={`${API_BASE_URL}${img.url}`} 
                      alt={`View ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2">
               {product.brand && (
                   <span className="text-sm font-semibold text-primary uppercase tracking-wider">{product.brand}</span>
               )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((s) => (
                  <Star 
                    key={s} 
                    className={`h-4 w-4 ${s <= (product.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                  />
                ))}
                <span className="text-sm text-muted-foreground ml-2">({product.reviewCount || 5} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              {selectedVariant?.stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">In Stock</span>
              ) : (
                <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              )}
            </div>

            <div className="flex items-end gap-3 mb-8">
              <span className="text-4xl font-bold text-foreground">
                {formatPrice(getProductPrice())}
              </span>
              {getOriginalPrice() && (
                <span className="text-xl text-muted-foreground line-through mb-1">
                  {formatPrice(getOriginalPrice()!)}
                </span>
              )}
            </div>

            <div className="space-y-6 mb-8">
                {/* Enhanced Variant Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-6">
                    {/* Colors Selection */}
                    {Array.from(new Set(product.variants.flatMap((v: any) => 
                      v.optionValues?.filter((ov: any) => 
                        ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
                        ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                      ).map((ov: any) => ov.optionValue.value)
                    ))).length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Color: <span className="text-foreground">{
                              selectedVariant?.optionValues?.find((ov: any) => 
                                ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
                                ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                              )?.optionValue.value || "Select"
                            }</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(product.variants.flatMap((v: any) => 
                            v.optionValues?.filter((ov: any) => 
                              ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
                              ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                            ).map((ov: any) => ov.optionValue.value)
                          ))).map((color: any) => {
                            const isSelected = selectedVariant?.optionValues?.some((ov: any) => ov.optionValue.value === color);
                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  // Find the first variant that has this color
                                  const firstVariantWithColor = product.variants.find((v: any) => 
                                    v.optionValues?.some((ov: any) => ov.optionValue.value === color)
                                  );
                                  if (firstVariantWithColor) setSelectedVariant(firstVariantWithColor);
                                }}
                                className={cn(
                                  "w-10 h-10 rounded-full border-2 transition-all p-1 flex items-center justify-center",
                                  isSelected 
                                    ? "border-primary ring-4 ring-primary/10 scale-110 z-10" 
                                    : "border-border hover:border-primary/40"
                                )}
                                title={color}
                              >
                                <div 
                                  className="w-full h-full rounded-full border border-black/5 flex items-center justify-center" 
                                  style={{ backgroundColor: getColorValue(color) }}
                                >
                                  {isSelected && (
                                    <Check className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sizes selection */}
                    {Array.from(new Set(product.variants.flatMap((v: any) => 
                      v.optionValues?.filter((ov: any) => 
                        !ov.optionValue?.option?.name?.toLowerCase().includes('color') && 
                        !ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                      ).map((ov: any) => ov.optionValue.value)
                    ))).length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Size: <span className="text-foreground">{
                              selectedVariant?.optionValues?.find((ov: any) => 
                                !ov.optionValue?.option?.name?.toLowerCase().includes('color') && 
                                !ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                              )?.optionValue.value || "Select"
                            }</span>
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {/* Get all unique sizes available for the currently selected color if possible */}
                          {Array.from(new Set(product.variants.flatMap((v: any) => 
                            v.optionValues?.filter((ov: any) => 
                              !ov.optionValue?.option?.name?.toLowerCase().includes('color') && 
                              !ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                            ).map((ov: any) => ov.optionValue.value)
                          ))).map((size: any) => {
                            // Find if this size is available for the current color
                            const currentColor = selectedVariant?.optionValues?.find((ov: any) => 
                              ov.optionValue?.option?.name?.toLowerCase().includes('color') || 
                              ov.optionValue?.option?.name?.toLowerCase().includes('colour')
                            )?.optionValue.value;
                            
                            const variantForThisSizeAndColor = product.variants.find((v: any) => 
                              v.optionValues?.some((ov: any) => ov.optionValue.value === size) &&
                              (!currentColor || v.optionValues?.some((ov: any) => ov.optionValue.value === currentColor))
                            );

                            const isSelected = selectedVariant?.optionValues?.some((ov: any) => ov.optionValue.value === size);
                            const isAvailable = !!variantForThisSizeAndColor;

                            return (
                              <button
                                key={size}
                                disabled={!isAvailable}
                                onClick={() => {
                                  if (variantForThisSizeAndColor) setSelectedVariant(variantForThisSizeAndColor);
                                }}
                                className={cn(
                                  "min-w-[3rem] px-4 py-2 border rounded-xl text-sm font-semibold transition-all relative group",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                    : isAvailable 
                                      ? "bg-muted/30 border-transparent hover:bg-muted/50 text-foreground" 
                                      : "bg-muted/10 border-transparent text-muted-foreground cursor-not-allowed opacity-50"
                                )}
                              >
                                {size}
                                {variantForThisSizeAndColor && (
                                  <span className="block text-[10px] opacity-70">
                                    {formatPrice(parseFloat(variantForThisSizeAndColor.price))}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

               {/* Quantity Selector */}
               <div>
                  <label className="text-sm font-medium mb-3 block">Quantity</label>
                  <div className="flex items-center w-32 border rounded-lg bg-card">
                      <button 
                        onClick={() => handleQuantityChange(-1)} 
                        className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded-l-lg transition-colors disabled:opacity-30"
                        disabled={quantity <= 1 || (selectedVariant && selectedVariant.stock <= 0)}
                      >
                          <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex-1 text-center font-medium">{quantity}</div>
                      <button 
                         onClick={() => handleQuantityChange(1)} 
                         className="w-10 h-10 flex items-center justify-center hover:bg-accent rounded-r-lg transition-colors disabled:opacity-30"
                         disabled={quantity >= (selectedVariant?.stock ?? 0) || (selectedVariant && selectedVariant.stock <= 0)}
                      >
                          <Plus className="h-4 w-4" />
                      </button>
                  </div>
               </div>
            </div>

            <div className="flex gap-4 mb-8">
               <Button 
                 size="lg" 
                 className="flex-1 gap-2 text-lg h-14 rounded-full"
                 onClick={handleAddToCart}
                 disabled={!selectedVariant || selectedVariant.stock <= 0}
               >
                 <ShoppingBag className="h-5 w-5" />
                 {selectedVariant?.stock <= 0 ? "Out of Stock" : "Add to Cart"}
               </Button>
               <Button 
                 size="lg" 
                 variant="outline" 
                 className="w-14 h-14 rounded-full p-0"
                 onClick={handleToggleWishlist}
               >
                 <Heart className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
               </Button>
            </div>

            {/* Features / Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Truck className="h-5 w-5" />
                    </div>
                    <div className="text-sm">
                        <div className="font-semibold">Free Delivery</div>
                        <div className="text-muted-foreground text-xs">Orders over KES 5,500</div>
                    </div>
                </div>
            </div>

            {/* Tabs for Description/Details/Reviews */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                    value="description" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                    Description
                </TabsTrigger>
                <TabsTrigger 
                    value="reviews" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                    Reviews (0)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="pt-6">
                 <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                    {product.description?.split('\n').map((line: string, i: number) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <br key={i} />;
                        
                        // Check if it's a list item
                        if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                            return (
                                <li key={i} className="flex items-start gap-2 mb-2 ml-4">
                                    <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    <span>{trimmedLine.substring(1).trim()}</span>
                                </li>
                            );
                        }

                        // Check if it's a title (like "Key Features")
                        if (trimmedLine.toLowerCase() === "key features" || (trimmedLine.length < 50 && trimmedLine.endsWith(':'))) {
                            return <h3 key={i} className="text-lg font-bold text-foreground mt-6 mb-3">{trimmedLine}</h3>;
                        }

                        // Check if it starts with a number (like "1. Product Title")
                        if (/^\d+\./.test(trimmedLine)) {
                            return <h2 key={i} className="text-xl font-bold text-foreground mb-4">{trimmedLine}</h2>;
                        }

                        return <p key={i} className="mb-4 leading-relaxed">{trimmedLine}</p>;
                    })}
                 </div>
              </TabsContent>
              <TabsContent value="reviews" className="pt-6">
                 <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-xl">
                    <p>No reviews yet.</p>
                 </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
