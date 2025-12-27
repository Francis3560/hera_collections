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
  Heart
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Tote from '@/components/Images/tote.jpg'
import BackPack from '@/components/Images/BackPack.png'
import Travel from '@/components/Images/Travel.png'
import LaptopSleeves from '@/components/Images/LaptopSleeves.png'
import Custom from '@/components/Images/Custom.png'
import Messenger from '@/components/Images/Messenger.png'
import Sling from '@/components/Images/Sling.png'

const productImages = [
  { id: 1, primary: Tote, secondary: BackPack },
  { id: 2, primary: BackPack, secondary: Travel },
  { id: 3, primary: Travel, secondary: LaptopSleeves },
  { id: 4, primary: LaptopSleeves, secondary: Custom },
  { id: 5, primary: Custom, secondary: Messenger },
  { id: 6, primary: Messenger, secondary: Sling },
  { id: 7, primary: Sling, secondary: Tote },
];

const featuredProducts = [
  {
    id: 1,
    name: "Premium Leather Tote",
    category: "Tote Bags",
    price: 2750.00,
    originalPrice: null,
    discount: 30,
    rating: 4.5,
    badge: "Save 30%",
    href: "/product/tote"
  },
  {
    id: 2,
    name: "Urban Explorer Backpack",
    category: "Backpacks",
    price: 2500.00,
    originalPrice: null,
    rating: 4.7,
    href: "/product/backpack"
  },
  {
    id: 3,
    name: "Globetrotter Travel Bag",
    category: "Travel Bags",
    price: 3000.00,
    originalPrice: 60.00,
    discount: 50,
    rating: 4.8,
    badge: "50% OFF",
    href: "/product/travel"
  },
  {
    id: 4,
    name: "Slim Laptop Sleeve",
    category: "Laptop Sleeves",
    price: 2500.00,
    originalPrice: null,
    rating: 4.6,
    href: "/product/laptop-sleeve"
  },
  {
    id: 5,
    name: "Custom Monogram Bag",
    category: "Custom Bags",
    price: 2999.00,
    originalPrice: null,
    rating: 4.9,
    badge: "Premium",
    href: "/product/custom-bag"
  },
  {
    id: 6,
    name: "Vintage Messenger",
    category: "Messenger Bags",
    price: 3790.00,
    originalPrice: null,
    rating: 4.4,
    href: "/product/messager-bag"
  },
  {
    id: 7,
    name: "Compact Sling Bag",
    category: "Sling Bags",
    price: 1500.00,
    originalPrice: 60.00,
    discount: 17,
    rating: 4.7,
    badge: "Sale",
    href: "/product/sling"
  },
  {
    id: 8,
    name: "Luxury Traveler's Set",
    category: "Travel Bags",
    price: 50.99,
    originalPrice: null,
    rating: 4.3,
    href: "/product/travel-bag"
  }
];

export default function ProductShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState<number | null>(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();

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
    if (!isAutoPlaying) return;

    const playNext = () => {
      if (currentIndex + itemsPerView >= featuredProducts.length) {
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    };

    autoPlayRef.current = setInterval(playNext, 4000); // Change every 4 seconds

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [currentIndex, isAutoPlaying, featuredProducts.length, itemsPerView]);

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
    if (currentIndex + itemsPerView < featuredProducts.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(Math.max(0, featuredProducts.length - itemsPerView));
    }
  };

  const getTransformValue = () => {
    const itemWidth = 100 / itemsPerView;
    return `translateX(-${currentIndex * itemWidth}%)`;
  };

 const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2
  }).format(price);
};
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white dark:bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header - Exact match from image */}
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
              Featured Products
            </motion.h2>
            
            {/* Breadcrumb style subtitle */}
            <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
              <span className="hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Home</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="hover:text-primary dark:hover:text-primary transition-colors cursor-pointer">Shop</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="text-primary dark:text-primary font-medium">Featured</span>
            </div>
          </div>

          {/* Navigation Controls */}
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
        </div>

        {/* Products Carousel */}
        <div 
          className="relative overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ 
              transform: getTransformValue(),
              transition: isAutoPlaying ? 'transform 0.7s ease-in-out' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {featuredProducts.map((product, index) => {
              const imagePair = productImages[index % productImages.length];
              
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
                      to={product.href}
                      className="block"
                    >
                      {/* Image Container with Hover Effect */}
                      <div className="relative bg-gray-50 dark:bg-secondary/30 overflow-hidden aspect-square mb-4">
                        {/* Primary Image */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${
                          isHovering === product.id ? 'opacity-0' : 'opacity-100'
                        }`}>
                          <img
                            src={imagePair.primary}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Secondary Image (on hover) */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${
                          isHovering === product.id ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <img
                            src={imagePair.secondary}
                            alt={`${product.name} alternative view`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Badge */}
                        {product.badge && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold py-1 px-2.5 rounded">
                            {product.badge}
                          </div>
                        )}
                        
                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="absolute top-3 right-3 bg-gray-900 text-white text-xs font-bold py-1 px-2.5 rounded">
                            -{product.discount}%
                          </div>
                        )}
                        
                        {/* Quick Action Button */}
                        <button className="absolute bottom-3 right-3 w-10 h-10 bg-white dark:bg-background rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                          <ShoppingBag className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                        
                        {/* Wishlist Button */}
                        <button className="absolute bottom-3 left-3 w-10 h-10 bg-white dark:bg-background rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                          <Heart className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                      
                      {/* Product Info */}
                      <div className="text-center">
                        {/* Category */}
                        <div className="text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wider mb-1">
                          {product.category}
                        </div>
                        
                        {/* Product Name */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2 line-clamp-1">
                          {product.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center justify-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 dark:text-muted-foreground ml-1">
                            ({product.rating})
                          </span>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-bold text-gray-900 dark:text-foreground">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 dark:text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
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
          
          {/* Auto-play indicator */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
            {[...Array(Math.ceil(featuredProducts.length / itemsPerView))].map((_, index) => (
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
            to="/shop"
            className="inline-flex items-center gap-2 border-2 border-gray-900 dark:border-gray-700 text-gray-900 dark:text-foreground hover:bg-gray-900 dark:hover:bg-gray-800 hover:text-white dark:hover:text-white font-medium py-3 px-8 rounded-none transition-all duration-300"
          >
            <span>View All Products</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}