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
  Sparkles
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Tote from '@/components/Images/tote.jpg'
import BackPack from '@/components/Images/BackPack.png'
import Travel from '@/components/Images/Travel.png'
import LaptopSleeves from '@/components/Images/LaptopSleeves.png'
import Custom from '@/components/Images/Custom.png'
import Messenger from '@/components/Images/Messenger.png'
import Sling from '@/components/Images/Sling.png'

const featuredProducts = [
  {
    id: 1,
    name: "Premium Leather Tote",
    category: "Tote Bags",
    image: Tote,
    price: 2299.00,
    originalPrice: 3399.00,
    discount: 25,
    rating: 4.8,
    reviewCount: 128,
    tags: ["Bestseller", "Limited Edition"],
    description: "Handcrafted Italian leather with gold-tone hardware",
    features: ["Water-resistant", "Detachable strap", "Multiple pockets"],
    badge: "Trending",
    badgeColor: "bg-gradient-to-r from-orange-500 to-pink-500",
    href: "/product/premium-leather-tote"
  },
  {
    id: 2,
    name: "Urban Explorer Backpack",
    category: "Backpacks",
    image: BackPack,
    price: 2189.00,
    originalPrice: null,
    rating: 4.9,
    reviewCount: 89,
    tags: ["New Arrival", "Waterproof"],
    description: "Perfect for daily commute with laptop compartment",
    features: ["Laptop sleeve", "USB charging port", "Anti-theft pocket"],
    badge: "New",
    badgeColor: "bg-gradient-to-r from-green-500 to-emerald-500",
    href: "/product/urban-explorer-backpack"
  },
  {
    id: 3,
    name: "Globetrotter Travel Bag",
    category: "Travel Bags",
    image: Travel,
    price: 2459.00,
    originalPrice: 3599.00,
    discount: 30,
    rating: 4.7,
    reviewCount: 203,
    tags: ["Sale", "Premium"],
    description: "Expandable luggage for week-long trips",
    features: ["TSA lock", "4 spinner wheels", "10-year warranty"],
    badge: "Sale",
    badgeColor: "bg-gradient-to-r from-red-500 to-rose-500",
    href: "/product/globetrotter-travel-bag"
  },
  {
    id: 4,
    name: "Slim Laptop Sleeve",
    category: "Laptop Sleeves",
    image: LaptopSleeves,
    price: 1179.00,
    originalPrice: 1999.00,
    discount: 20,
    rating: 4.6,
    reviewCount: 167,
    tags: ["Lightweight", "Slim Fit"],
    description: "Ultra-slim protective sleeve for 13-15 inch laptops",
    features: ["Memory foam padding", "Water-resistant", "Slim profile"],
    badge: "Popular",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
    href: "/product/slim-laptop-sleeve"
  },
  {
    id: 5,
    name: "Custom Monogram Bag",
    category: "Custom Bags",
    image: Custom,
    price: 3349.00,
    originalPrice: null,
    rating: 5.0,
    reviewCount: 42,
    tags: ["Customizable", "Handmade"],
    description: "Personalized with your initials, made to order",
    features: ["Free monogram", "3 color options", "2-week delivery"],
    badge: "Custom",
    badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
    href: "/product/custom-monogram-bag"
  },
  {
    id: 6,
    name: "Vintage Messenger",
    category: "Messenger Bags",
    image: Messenger,
    price: 2229.00,
    originalPrice: 3289.00,
    discount: 21,
    rating: 4.5,
    reviewCount: 94,
    tags: ["Vintage Style", "Leather"],
    description: "Classic messenger bag with distressed leather finish",
    features: ["Adjustable strap", "Multiple compartments", "Aged brass hardware"],
    badge: "Classic",
    badgeColor: "bg-gradient-to-r from-amber-500 to-yellow-500",
    href: "/product/vintage-messenger"
  },
  {
    id: 7,
    name: "Compact Sling Bag",
    category: "Sling Bags",
    image: Sling,
    price: 2129.00,
    originalPrice: 3159.00,
    discount: 19,
    rating: 4.4,
    reviewCount: 76,
    tags: ["Compact", "Crossbody"],
    description: "Minimalist sling perfect for essentials and travel",
    features: ["RFID blocking", "Quick-access pocket", "Water-resistant"],
    badge: "Compact",
    badgeColor: "bg-gradient-to-r from-slate-500 to-gray-500",
    href: "/product/compact-sling-bag"
  },
  {
    id: 8,
    name: "Luxury Traveler's Set",
    category: "Travel Bags",
    image: Travel,
    price: 2799.00,
    originalPrice: 3999.00,
    discount: 20,
    rating: 4.9,
    reviewCount: 56,
    tags: ["Luxury", "Gift Set"],
    description: "Complete travel set with matching pieces",
    features: ["3-piece set", "Premium materials", "Lifetime warranty"],
    badge: "Luxury",
    badgeColor: "bg-gradient-to-r from-gold-500 to-yellow-300",
    href: "/product/luxury-traveler-set"
  }
];

export default function FeaturedProducts() {
  const { theme } = useTheme();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<number | null>(null);

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(price);
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

  const itemVariants = {
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
          {['All Products', 'Bestsellers', 'New Arrivals', 'On Sale', 'Luxury'].map((filter, index) => (
            <button
              key={filter}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                index === 0 
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
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              className="group relative"
            >
              <div className="bg-card dark:bg-card/95 rounded-2xl sm:rounded-3xl overflow-hidden border border-border/20 dark:border-border/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/20 dark:hover:border-primary/30 h-full flex flex-col">
                {/* Product Image Container */}
                <div className="relative overflow-hidden">
                  {/* Badge */}
                  {product.badge && (
                    <div className={`absolute top-4 left-4 z-10 ${product.badgeColor} text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-lg`}>
                      {product.badge}
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  {product.discount && (
                    <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold py-1.5 px-2.5 rounded-full shadow-lg">
                      -{product.discount}%
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-14 z-10 w-8 h-8 bg-background/90 dark:bg-background/80 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110"
                    aria-label="Add to wishlist"
                  >
                    <Heart 
                      className={`h-4 w-4 transition-colors duration-300 ${
                        wishlist.includes(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground group-hover:text-primary'
                      }`}
                    />
                  </button>
                  
                  {/* Quick View Button */}
                  <button
                    onClick={() => setQuickViewProduct(product.id)}
                    className="absolute bottom-4 right-4 z-10 w-8 h-8 bg-background/90 dark:bg-background/80 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    aria-label="Quick view"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </button>
                  
                  {/* Product Image */}
                  <div className="aspect-square relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Add to Cart Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <button className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground font-medium py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2">
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
                      {product.category}
                    </span>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-semibold text-foreground dark:text-foreground">
                        {product.rating}
                      </span>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    </div>
                  </div>
                  
                  {/* Product Name */}
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground dark:text-foreground mb-2 line-clamp-1 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                    <Link to={product.href} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4 flex-1 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2.5 py-1 bg-secondary/30 dark:bg-secondary/20 text-foreground/70 dark:text-foreground/70 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Features */}
                  <div className="hidden sm:block mb-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>{product.features[0]}</span>
                    </div>
                  </div>
                  
                  {/* Price and Action */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30 dark:border-border/40">
                    <div>
                      {/* Current Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-bold text-foreground dark:text-foreground">
                          {formatPrice(product.price)}
                        </span>
                        
                        {/* Original Price */}
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground dark:text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                
                    </div>
                    
                    {/* Quick Action Button */}
                    <button className="w-10 h-10 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-110">
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
      </div>
    </section>
  );
}