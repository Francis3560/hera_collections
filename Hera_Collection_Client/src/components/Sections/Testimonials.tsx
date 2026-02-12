import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Quote
} from "lucide-react";

const customerReviews = [
  {
    id: 1,
    name: "Nicky K.",
    review: "The travel bag held up perfectly during my 3-week Europe trip. So much space and still looked stylish everywhere I went",
    verified: true,
    rating: 5,
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1770893379/Profile2_tt5qaj.jpg",
  },
  {
    id: 2,
    name: "Franklin O.",
    review: "As a designer, I appreciate quality craftsmanship. These bags are not just beautiful but incredibly durable.",
    verified: true,
    rating: 5,
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1770893378/Profile_itsigl.jpg",
  },
  {
    id: 3,
    name: "Elvis M.",
    review: "I own many luxury bags and this collection stands out. The attention to detail is remarkable. True investment pieces.",
    verified: true,
    rating: 5,
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1770893550/Profile_3_lbybwh.jpg",
  },
  {
    id: 4,
    name: "Ngatia K.",
    review: "As a designer, I appreciate quality craftsmanship. These bags are not just beautiful but incredibly durable.",
    verified: true,
    rating: 5,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
  },
  {
    id: 5,
    name: "Elvis M.",
    review: "The travel bag held up perfectly during my 3-week Europe trip. So much space and still looked stylish everywhere I went!",
    verified: true,
    rating: 5,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
  },
  {
    id: 6,
    name: "Ochieng B.",
    review: "Everything about this brand screams quality. From the packaging to the product itself. Highly recommended!",
    verified: true,
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80",
  }
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(1);
      else if (width < 1024) setItemsPerView(2);
      else setItemsPerView(3);
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      // If we are at the end (showing the last 'itemsPerView' items), loop back to 0
      if (prev >= customerReviews.length - itemsPerView) return 0;
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      if (prev === 0) return customerReviews.length - itemsPerView;
      return prev - 1;
    });
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/5 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Simple Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-light tracking-tight text-foreground"
          >
            What our <span className="font-medium text-primary">Customers</span> Say
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto font-light"
          >
            Real stories from our community of style enthusiasts
          </motion.p>
        </div>

        {/* Carousel Container */}
        <div className="relative max-w-7xl mx-auto group">
          
          {/* Controls */}
          <div className="absolute inset-y-0 left-0 -ml-4 md:-ml-12 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={prevSlide}
              className="bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-border hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-0 -mr-4 md:-mr-12 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={nextSlide}
              className="bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-border hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Wrapper */}
          <div className="overflow-hidden">
             <motion.div 
                className="flex"
                animate={{ x: `-${currentIndex * (100 / itemsPerView)}%` }}
                transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.8 }}
             >
                {customerReviews.map((review) => (
                    <div 
                        key={review.id}
                        className="px-4 flex-shrink-0"
                        style={{ width: `${100 / itemsPerView}%` }}
                    >
                        <div className="bg-card dark:bg-card/40 h-full p-8 rounded-3xl border border-border/50 flex flex-col items-center text-center hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                             
                             {/* Rating */}
                             <div className="flex gap-1 mb-6">
                                {[...Array(review.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500" />
                                ))}
                             </div>

                             {/* Review Text */}
                             <div className="relative mb-8 flex-grow">
                               <Quote className="w-8 h-8 text-primary/10 absolute -top-4 -left-2" />
                               <p className="text-foreground/80 text-lg leading-relaxed italic z-10 relative">
                                 "{review.review}"
                               </p>
                             </div>

                             {/* Divider */}
                             <div className="w-12 h-px bg-border mb-6"></div>

                             {/* User Info */}
                             <div className="flex items-center gap-4">
                                <img 
                                    src={review.image} 
                                    alt={review.name}
                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-background shadow-sm"
                                />
                                <div className="text-left">
                                    <div className="font-semibold text-foreground text-sm">{review.name}</div>
                                    {review.verified && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Verified</span>
                                        </div>
                                    )}
                                </div>
                             </div>
                        </div>
                    </div>
                ))}
             </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
}