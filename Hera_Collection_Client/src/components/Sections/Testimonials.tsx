import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Star, 
  StarHalf, 
  Quote, 
  CheckCircle, 
  Sparkles,
  ChevronLeft, 
  ChevronRight,
  ThumbsUp,
  Award,
  Heart
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const customerReviews = [
  {
    id: 1,
    name: "Sofia D.",
    username: "sofia_designs",
    role: "Verified Buyer",
    rating: 5,
    title: "Makes my face feel refreshed!",
    review: "I love this Glow cleanser it really makes my face feel refreshed and isn't too harsh and makes me feel clean and beautiful.",
    date: "2 days ago",
    verified: true,
    likes: 24,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 12,
    badges: ["Top Reviewer", "Style Influencer"]
  },
  {
    id: 2,
    name: "Johan P.",
    username: "johan_explorer",
    role: "Verified Buyer",
    rating: 5,
    title: "Works well for sensitive skin!",
    review: "In my honest review I love this product! It doesn't have a strong scent, just smells clean, absolutely love it very much!",
    date: "1 week ago",
    verified: true,
    likes: 18,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 8,
    badges: ["Frequent Buyer"]
  },
  {
    id: 3,
    name: "Marta A.",
    username: "marta_adventures",
    role: "Verified Buyer",
    rating: 5,
    title: "Face feels squeaky clean!",
    review: "I love this Glow cleanser it really makes my face feel refreshed and isn't too harsh and makes me feel clean and beauty.",
    date: "3 days ago",
    verified: true,
    likes: 31,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 15,
    badges: ["Quality Contributor"]
  },
  {
    id: 4,
    name: "Ngatia K.",
    username: "ngatia_stylist",
    role: "Fashion Designer",
    rating: 4.5,
    title: "Perfect for everyday luxury!",
    review: "As a designer, I appreciate quality craftsmanship. These bags are not just beautiful but incredibly durable. My clients always compliment them!",
    date: "2 weeks ago",
    verified: true,
    likes: 42,
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 6,
    badges: ["Professional User", "Style Expert"]
  },
  {
    id: 5,
    name: "Elvis M.",
    username: "elvis_traveler",
    role: "Verified Buyer",
    rating: 5,
    title: "Best travel companion!",
    review: "The travel bag held up perfectly during my 3-week Europe trip. So much space and still looked stylish everywhere I went!",
    date: "1 month ago",
    verified: true,
    likes: 56,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 3,
    badges: ["Travel Expert"]
  },
  {
    id: 6,
    name: "Ochieng B.",
    username: "ochieng_business",
    role: "Business Executive",
    rating: 5,
    title: "Professional and polished!",
    review: "These bags elevate my professional look. The quality speaks for itself. I've received countless compliments from colleagues.",
    date: "3 weeks ago",
    verified: true,
    likes: 29,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 5,
    badges: ["Corporate Style"]
  },
  {
    id: 7,
    name: "Ricky W.",
    username: "ricky_creative",
    role: "Verified Buyer",
    rating: 4,
    title: "Great value for money!",
    review: "The quality surprised me for the price. It's held up well through daily use. The minimalist design is exactly what I wanted.",
    date: "4 days ago",
    verified: true,
    likes: 15,
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 2,
    badges: ["Value Seeker"]
  },
  {
    id: 8,
    name: "Cate L.",
    username: "cate_luxury",
    role: "Luxury Collector",
    rating: 5,
    title: "Exquisite craftsmanship!",
    review: "I own many luxury bags and this collection stands out. The attention to detail is remarkable. True investment pieces.",
    date: "2 months ago",
    verified: true,
    likes: 67,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400&q=80",
    purchases: 10,
    badges: ["Luxury Expert", "Collector"]
  }
];

export default function CustomerReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [activeReview, setActiveReview] = useState(0);
  const { theme } = useTheme();

  // Responsive items per view
  React.useEffect(() => {
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
    if (currentIndex + itemsPerView < customerReviews.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setCurrentIndex(customerReviews.length - itemsPerView);
    }
  };

  const getTransformValue = () => {
    const itemWidth = 100 / itemsPerView;
    return `translateX(-${currentIndex * itemWidth}%)`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarHalf key="half" className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      );
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      );
    }

    return stars;
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-secondary/10 via-background to-secondary/10 dark:from-secondary/20 dark:via-background dark:to-secondary/20 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary dark:text-primary" />
            <span className="text-sm font-medium text-primary dark:text-primary uppercase tracking-wider">
              Customer Love
            </span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-foreground dark:text-foreground mb-4 tracking-tight">
            What Our <span className="font-medium">Customers Say</span>
          </h2>
          
          <p className="text-base sm:text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust Hera Collections for premium quality and exceptional service
          </p>
        </motion.div>

        {/* Overall Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12 lg:mb-16"
        >
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <span className="text-2xl font-bold text-foreground dark:text-foreground">
                4.9
              </span>
            </div>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Average Rating from 2,847 Reviews
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto">
            {[
              { label: "Verified Buyers", value: "98%" },
              { label: "Would Recommend", value: "96%" },
              { label: "Quality Rating", value: "4.8/5" },
              { label: "Repeat Customers", value: "72%" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Reviews Carousel */}
        <div className="relative mb-12 lg:mb-16">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: getTransformValue() }}
            >
              {customerReviews.map((review) => (
                <div
                  key={review.id}
                  className="px-3 flex-shrink-0"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="h-full"
                  >
                    <div className="bg-card dark:bg-card/95 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-border/20 dark:border-border/30 h-full hover:shadow-xl hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 group">
                      {/* Review Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img
                              src={review.image}
                              alt={review.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-background shadow-lg"
                            />
                            {review.verified && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground dark:text-foreground">
                              {review.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                                {review.role}
                              </span>
                              {review.badges.map((badge, index) => (
                                <span 
                                  key={index}
                                  className="text-xs px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-full"
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Quote className="h-8 w-8 text-primary/20 dark:text-primary/30 group-hover:text-primary/40 transition-colors duration-300" />
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-foreground dark:text-foreground">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>

                      {/* Review Title */}
                      <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-3">
                        {review.title}
                      </h3>

                      {/* Review Text */}
                      <p className="text-muted-foreground dark:text-muted-foreground mb-6 leading-relaxed">
                        {review.review}
                      </p>

                      {/* Review Footer */}
                      <div className="flex items-center justify-between pt-6 border-t border-border/20 dark:border-border/30">
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1.5 text-sm text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.likes}</span>
                          </button>
                          <div className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {review.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs px-2 py-1 bg-secondary/30 dark:bg-secondary/20 rounded">
                            {review.purchases} purchases
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 w-10 h-10 lg:w-12 lg:h-12 bg-background dark:bg-background border border-border dark:border-border/60 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 hover:bg-primary hover:text-white"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 w-10 h-10 lg:w-12 lg:h-12 bg-background dark:bg-background border border-border dark:border-border/60 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 hover:bg-primary hover:text-white"
            aria-label="Next reviews"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}