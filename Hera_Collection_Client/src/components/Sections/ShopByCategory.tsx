import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Tote from '@/components/Images/tote.jpg'
import BackPack from '@/components/Images/BackPack.png'
import Travel from '@/components/Images/Travel.png'
import LaptopSleeves from '@/components/Images/LaptopSleeves.png'
import Custom from '@/components/Images/Custom.png'
import Messenger from '@/components/Images/Messenger.png'
import Sling from '@/components/Images/Sling.png'

const categories = [
  {
    id: 1,
    name: "Tote Bags",
    image: Tote,
    href: "/collections/tote-bags",
    description: "Stylish & Spacious"
  },
  {
    id: 2,
    name: "Backpacks",
    image: BackPack,
    href: "/collections/backpacks",
    description: "Comfort & Function"
  },
  {
    id: 3,
    name: "Travel Bags",
    image: Travel,
    href: "/collections/travel-bags",
    description: "Adventure Ready"
  },
  {
    id: 4,
    name: "Laptop Sleeves",
    image: LaptopSleeves,
    href: "/collections/laptop-sleeves",
    description: "Tech Protection"
  },
  {
    id: 5,
    name: "Custom Bags",
    image: Custom,
    href: "/collections/custom-bags",
    description: "Personalized"
  },
  {
    id: 6,
    name: "Messenger Bags",
    image: Messenger,
    href: "/collections/messenger-bags",
    description: "Urban Style"
  },
  {
    id: 7,
    name: "Sling Bags",
    image: Sling,
    href: "/collections/sling-bags",
    description: "Compact & Trendy"
  }
];

export default function ShopByCategory() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) { // Mobile
        setItemsPerView(1.5); // Show 1.5 items for better UX
      } else if (width < 768) { // Tablet
        setItemsPerView(2.5);
      } else if (width < 1024) { // Small desktop
        setItemsPerView(3);
      } else { // Desktop
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    if (currentIndex + itemsPerView < categories.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(Math.max(0, categories.length - itemsPerView));
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch/Drag handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragDistance(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = dragStartX - currentX;
    setDragDistance(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50; // Minimum drag distance to trigger slide
    if (dragDistance > threshold) {
      nextSlide();
    } else if (dragDistance < -threshold) {
      prevSlide();
    }
    setDragDistance(0);
  };

  // Mouse drag handling for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDistance(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = dragStartX - currentX;
    setDragDistance(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50;
    if (dragDistance > threshold) {
      nextSlide();
    } else if (dragDistance < -threshold) {
      prevSlide();
    }
    setDragDistance(0);
  };

  const getTransformValue = () => {
    // Calculate item width based on items per view
    const itemWidth = 100 / itemsPerView;
    const transform = `translateX(calc(-${currentIndex * itemWidth}% + ${dragDistance * 0.5}px))`;
    
    return {
      transform,
      transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  // Dots for mobile navigation
  const totalDots = Math.ceil(categories.length / itemsPerView);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-background dark:bg-background transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-10 md:mb-12 px-2">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="hidden sm:block">
              <Sparkles className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground dark:text-foreground tracking-wide uppercase text-center sm:text-left"
              style={{ 
                fontFamily: "'Helvetica Neue', Arial, sans-serif", 
                letterSpacing: '0.05em'
              }}
            >
              Shop By <span className="text-primary dark:text-primary font-medium">Categories</span>
            </motion.h2>
          </div>

          {/* Desktop Navigation Buttons */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="hidden md:flex items-center space-x-3"
          >
            <button
              onClick={prevSlide}
              className="w-10 h-10 flex items-center justify-center bg-primary dark:bg-primary hover:bg-primary-dark dark:hover:bg-primary-dark active:scale-95 transition-all duration-300 rounded-full shadow-soft hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Previous categories"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5 text-primary-foreground dark:text-primary-foreground" />
            </button>
            <button
              onClick={nextSlide}
              className="w-10 h-10 flex items-center justify-center bg-primary dark:bg-primary hover:bg-primary-dark dark:hover:bg-primary-dark active:scale-95 transition-all duration-300 rounded-full shadow-soft hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Next categories"
              disabled={currentIndex + itemsPerView >= categories.length}
            >
              <ChevronRight className="h-5 w-5 text-primary-foreground dark:text-primary-foreground" />
            </button>
          </motion.div>

          {/* Mobile Navigation Dots */}
          <div className="md:hidden flex items-center space-x-2">
            {Array.from({ length: totalDots }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index * itemsPerView)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === Math.floor(currentIndex / itemsPerView)
                    ? 'bg-primary dark:bg-primary w-6'
                    : 'bg-muted-foreground/30 dark:bg-muted-foreground/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="relative">
          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex items-center justify-between mb-6 px-2">
            <button
              onClick={prevSlide}
              className="w-12 h-12 flex items-center justify-center bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 active:scale-95 transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Previous categories"
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5 text-primary dark:text-primary" />
            </button>
            <span className="text-sm text-muted-foreground dark:text-muted-foreground">
              {Math.min(currentIndex + 1, categories.length)} / {categories.length}
            </span>
            <button
              onClick={nextSlide}
              className="w-12 h-12 flex items-center justify-center bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 active:scale-95 transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Next categories"
              disabled={currentIndex + itemsPerView >= categories.length}
            >
              <ChevronRight className="h-5 w-5 text-primary dark:text-primary" />
            </button>
          </div>

          {/* Carousel Container */}
          <div className="relative overflow-hidden px-2 sm:px-0">
            <motion.div
              ref={scrollContainerRef}
              className="flex"
              style={getTransformValue()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              role="region"
              aria-label="Product categories carousel"
              aria-live="polite"
            >
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="flex-shrink-0 px-2 sm:px-3"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="group relative h-full"
                  >
                    <Link
                      to={category.href}
                      className="block h-full"
                      aria-label={`Browse ${category.name} collection`}
                    >
                      {/* Image Container */}
                      <div className="relative bg-secondary/20 dark:bg-secondary/10 overflow-hidden aspect-square rounded-xl sm:rounded-2xl border border-border/10 dark:border-border/20 transition-all duration-300 group-hover:border-primary/30 dark:group-hover:border-primary/50">
                        {/* Image */}
                        <div className="relative w-full h-full">
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading={index < 4 ? "eager" : "lazy"}
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          />
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/60" />
                        </div>
                        
                        {/* Category Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5">
                          <div className="flex flex-col">
                            {/* Category Name */}
                            <div className="bg-primary dark:bg-primary py-2 px-4 rounded-lg sm:rounded-xl w-max mb-2 shadow-lg">
                              <h3
                                className="text-sm sm:text-base md:text-lg font-medium text-primary-foreground dark:text-primary-foreground text-center uppercase tracking-wider sm:tracking-widest"
                                style={{ fontFamily: "'Open Sans', ui-sans-serif, system-ui, sans-serif" }}
                              >
                                {category.name}
                              </h3>
                            </div>
                            
                            {/* Description (Desktop only) */}
                            <p className="hidden sm:block text-xs md:text-sm text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-1">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        
                        {/* Mobile Indicator */}
                        <div className="absolute top-3 right-3 sm:hidden">
                          <div className="w-8 h-8 rounded-full bg-background/80 dark:bg-background/80 flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-primary dark:text-primary" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Quick View Button (Desktop only) */}
                    <div className="hidden sm:block absolute top-4 right-4 z-10">
                      <button
                        className="bg-background/90 dark:bg-background/90 text-primary dark:text-primary text-xs font-medium py-1.5 px-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-primary-foreground shadow-md"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Quick view functionality can be added here
                        }}
                      >
                        Quick View
                      </button>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* View All Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, margin: "-50px" }}
          className="mt-10 sm:mt-12 text-center"
        >
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 bg-primary dark:bg-primary hover:bg-primary-dark dark:hover:bg-primary-dark text-primary-foreground dark:text-primary-foreground font-medium py-3 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <span>View All Categories</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}