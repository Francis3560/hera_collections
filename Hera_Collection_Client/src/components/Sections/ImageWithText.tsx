import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Leaf, 
  Shield, 
  Award, 
  Target, 
  Sparkles,
  ChevronRight,
  CheckCircle,
  Globe,
  Heart,
  Zap
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import Hero1 from "@/components/Images/ImageWithText.png";

export default function BagPhilosophy() {
  const { theme } = useTheme();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const textVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const imageVariants = {
    hidden: { x: 50, opacity: 0, scale: 0.95 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 25,
        delay: 0.3
      }
    }
  };

  const featureVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        type: "spring",
        stiffness: 150
      }
    })
  };

  const statsVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.8 + i * 0.15,
        type: "spring",
        stiffness: 200
      }
    })
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-secondary/5 to-background dark:from-background dark:via-secondary/10 dark:to-background overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16"
        >
          {/* Left Column - Image with Floating Elements */}
          <motion.div 
            variants={imageVariants}
            className="lg:w-1/2 relative"
          >
            {/* Main Image Container */}
            <div className="relative">
              <motion.div 
                variants={statsVariants}
                custom={1}
                className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 bg-white dark:bg-background shadow-2xl rounded-2xl p-4 sm:p-5 w-32 sm:w-40 border border-border/20 dark:border-border/30"
              >
       
              </motion.div>

              {/* Main Image */}
              <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl group">
                <div className="aspect-[4/5] sm:aspect-[3/4] relative">
                  <img
                    src={Hero1}
                    alt="Premium Luxury Bag Collection - Hera Collections"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Floating Tag */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, type: "spring" }}
                  viewport={{ once: true }}
                  className="absolute top-6 right-6 bg-gradient-to-r from-primary to-primary-light text-primary-foreground px-4 py-2 rounded-full shadow-xl"
                >
                  <span className="text-sm font-semibold">Since 2022</span>
                </motion.div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -z-10 top-8 -right-8 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-3xl blur-xl" />
              <div className="absolute -z-10 -bottom-8 -left-8 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-3xl blur-xl" />
            </div>
          </motion.div>

          {/* Right Column - Content */}
          <motion.div 
            variants={containerVariants}
            className="lg:w-1/2"
          >
            {/* Badge */}
            <motion.div 
              variants={textVariants}
              className="inline-flex items-center gap-2 mb-6"
            >
              <Sparkles className="h-5 w-5 text-primary dark:text-primary" />
              <span className="text-sm font-medium text-primary dark:text-primary uppercase tracking-wider">
                Our Philosophy
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h2 
              variants={textVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-light text-foreground dark:text-foreground mb-6 tracking-tight"
              style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif" }}
            >
              <span className="block">Redefining Luxury</span>
              <span className="block font-medium">Through Craftsmanship</span>
            </motion.h2>

            {/* Description */}
            <motion.p 
              variants={textVariants}
              className="text-lg sm:text-xl text-muted-foreground dark:text-muted-foreground mb-8 leading-relaxed"
            >
              We sustainably and ethically source premium materials to create timeless bags that 
              blend <span className="text-primary dark:text-primary font-medium">elegance with durability</span>. 
              Each piece tells a story of exceptional craftsmanship and conscious luxury.
            </motion.p>

            {/* Features Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10"
            >
              {[
                {
                  icon: Shield,
                  title: "Ethical Sourcing",
                  description: "Premium materials from certified sustainable suppliers",
                  color: "text-blue-500"
                },
                {
                  icon: Target,
                  title: "Artisan Crafted",
                  description: "Handcrafted by master artisans with decades of experience",
                  color: "text-amber-500"
                },
                {
                  icon: Globe,
                  title: "Carbon Neutral",
                  description: "Offsetting 100% of our carbon footprint since 2022",
                  color: "text-green-500"
                },
                {
                  icon: Heart,
                  title: "Lifetime Care",
                  description: "Complimentary cleaning and restoration services",
                  color: "text-pink-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  variants={featureVariants}
                  custom={index}
                  className="bg-card dark:bg-card/80 rounded-xl p-5 border border-border/20 dark:border-border/30 hover:border-primary/30 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-white to-secondary dark:from-background dark:to-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground dark:text-foreground mb-2 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Key Benefits */}
            <motion.div 
              variants={textVariants}
              className="mb-10"
            >
              <h3 className="text-xl font-semibold text-foreground dark:text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary dark:text-primary" />
                Our Commitment to Excellence
              </h3>
              <div className="space-y-3">
                {[
                  "Every stitch tells a story - crafted with precision and passion",
                  "Materials selected for both beauty and longevity",
                  "Timeless designs that transcend seasonal trends",
                  "Sustainable practices at every stage of production"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary dark:text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/90 dark:text-foreground/90">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              variants={containerVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/about"
                className="inline-flex items-center justify-center gap-3 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground font-medium py-3.5 px-8 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                <span>Discover Our Story</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                to="/collections"
                className="inline-flex items-center justify-center gap-3 bg-secondary dark:bg-secondary text-foreground dark:text-foreground font-medium py-3.5 px-8 rounded-full border border-border dark:border-border/60 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                <span>Shop Collections</span>
                <Sparkles className="h-4 w-4" />
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              viewport={{ once: true }}
              className="mt-10 pt-10 border-t border-border/20 dark:border-border/30"
            >
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                Trusted by leading brands and fashion influencers worldwide
              </p>
              <div className="flex flex-wrap items-center gap-6">
                {["VOGUE", "ELLE", "FORBES", "GQ", "VOGUE BUSINESS"].map((brand, index) => (
                  <div key={brand} className="text-sm font-medium text-foreground/60 dark:text-foreground/60 hover:text-primary dark:hover:text-primary transition-colors duration-300">
                    {brand}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/80 to-transparent dark:from-background/80 dark:to-transparent pointer-events-none" />
    </section>
  );
}