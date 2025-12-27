import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

import Hero1 from "@/components/Images/Hero1.png";
import Hero2 from "@/components/Images/Hero2.png";
import Hero3 from "@/components/Images/Heroo3.png";
import Hero4 from "@/components/Images/Hero4.png";

const heroSlides = [
  {
    id: 1,
    background: Hero1,
    title: "ELEVATE YOUR CORPORATE PRESENCE",
    subtitle: "Executive Excellence",
    description: "Discover our premium collection of professional bags designed for the modern business leader. Crafted with precision and sophistication.",
    cta: "EXPLORE COLLECTION",

  },
  {
    id: 2,
    background: Hero2,
    title: "MASTERFUL CRAFTSMANSHIP",
    subtitle: "Luxury Meets Functionality",
    description: "Experience unparalleled quality with our handcrafted leather bags, built to withstand the demands of corporate life while making a statement.",
    cta: "EXPLORE COLLECTION",

  },
  {
    id: 3,
    background: Hero3,
    title: "DESIGNED FOR PROFESSIONALS",
    subtitle: "Smart Organization",
    description: "Innovative compartments and intelligent design meet elegant aesthetics. Your perfect companion for meetings, travel, and daily commutes.",
    cta: "EXPLORE COLLECTION",
  
  },
  {
    id: 4,
    background: Hero4,
    title: "SUSTAINABLE LUXURY",
    subtitle: "Ethical Elegance",
    description: "Commitment to sustainability without compromising on style. Our eco-friendly materials and ethical production redefine corporate accessories.",
    cta: "EXPLORE COLLECTION",

  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
        ease: "easeOut"
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
    <section className="relative h-screen w-full overflow-hidden">
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
              src={heroSlides[currentSlide].background}
              alt={`Hero Slide ${currentSlide + 1}`}
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-white space-y-8 max-w-2xl">
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
                    className="text-lg lg:text-xl font-light tracking-widest uppercase text-primary-accent"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.p>

                  {/* Main Title */}
                  <motion.h1 
                    className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight tracking-tight"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>

                  {/* Description */}
                  <motion.p 
                    className="text-lg lg:text-xl font-light leading-relaxed text-white/90 max-w-lg"
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
                  >
                    <Button 
                      size="lg"
                      className="bg-primary hover:bg-primary-accent/90 text-primary-accent-foreground px-8 py-6 text-lg font-semibold rounded-none border-2 border-transparent hover:border-primary-accent/20 transition-all duration-300 hover:scale-105"
                    >
                      {heroSlides[currentSlide].cta}
                    </Button>
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
      <div className="absolute bottom-8 right-8 z-30 flex space-x-2">
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