import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

import { useTheme } from "@/components/ThemeProvider";

const heroSlides = [
  {
    id: 1,
    lightBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769464029/Hera_Hero_len3pf.png",
    darkBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769464029/Hera_Hero_B_uol1cn.png",
    title: "PROFESSIONAL LOOK",
    subtitle: "Executive Excellence",
    description: "Premium professional bags for modern leaders. Precision-crafted for excellence.",
    cta: "EXPLORE COLLECTION",
    bgColor: "from-gray-800/20 to-gray-600/20"
  },
  {
    id: 2,
    lightBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769465243/7_yxmssx.png",
    darkBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769465244/8_tmqduj.png",
    title: "EXECUTIVE ELEGANCE",
    subtitle: "Luxury & Function",
    description: "Handcrafted leather bags built for corporate life. Make a statement without saying a word.",
    cta: "EXPLORE COLLECTION",
    bgColor: "from-blue-600/20 to-purple-600/20"
  },
  {
    id: 3,
    lightBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769467638/Hera_Hero_B_jsm0uf.png",
    darkBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769467637/Hera_Hero_W_kalxmy.png",
    title: "LUXURIOUS BRAND",
    subtitle: "Smart Organization",
    description: "Intelligent design meets elegant aesthetics. Your perfect partner for travel and daily commutes.",
    cta: "EXPLORE COLLECTION",
    bgColor: "from-green-600/20 to-teal-600/20"
  },
  {
    id: 4,
    lightBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769375593/3_f5csiv.png",
    darkBackground: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769375591/4_g4hcer.png",
    title: "SUSTAINABLE LUXURY",
    subtitle: "Ethical Style",
    description: "Eco-friendly materials, ethical production. Redefining premium accessories.",
    cta: "EXPLORE COLLECTION",
    bgColor: "from-amber-600/20 to-orange-600/20"
  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentBackground = isDark ? heroSlides[currentSlide].darkBackground : heroSlides[currentSlide].lightBackground;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentSlide, isAutoPlaying]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const textVariants = {
    initial: { y: 50, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut" as any
      }
    },
    exit: {
      y: -50,
      opacity: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-neutral-950">
      {/* Background Images Carousel */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSlide}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.5 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${heroSlides[currentSlide].bgColor} opacity-90 z-10`} />
              <img
                src={currentBackground}
                alt={`Hero Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover object-center hidden md:block"
              />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-white space-y-8 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`subtitle-${currentSlide}`}
                  variants={textVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Subtitle */}
                  <motion.p 
                    className="text-primary md:text-lg lg:text-xl font-light tracking-widest uppercase text-primary-accent"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>

                  {/* Main Title */}
                  <motion.h1 
                    className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight px-4 md:px-0"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>

                  {/* Description */}
                  <motion.p 
                    className="text-lg lg:text-xl font-light leading-relaxed text-white/90 max-w-lg mx-auto lg:mx-0 px-4 md:px-0"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.7 }}
                  >
                    {heroSlides[currentSlide].description}
                  </motion.p>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.7 }}
                    className="flex justify-center lg:justify-start"
                  >
                      <Link to="/collections">
                      <Button 
                        size="lg"
                        className="bg-primary hover:bg-primary-dark text-white px-10 py-7 text-lg font-bold rounded-2xl border-none shadow-lg hover:shadow-primary/40 transition-all duration-500 hover:scale-110 active:scale-95 group overflow-hidden relative"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {heroSlides[currentSlide].cta}
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <ChevronRight className="w-5 h-5" />
                          </motion.span>
                        </span>
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Image Placeholder - You can add additional images here if needed */}
            <div className="hidden lg:block">
              {/* Additional image content can go here */}
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators - Minimal */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-30 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? "bg-primary-accent w-6" 
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 z-10" />
    </section>
  );
}