import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  Leaf, 
  Sparkles, 
  Star,
  ChevronRight,
  Target,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiveChat } from "@/components/chat/LiveChat";
import WhatsAppChat from "@/components/chat/WhatsAppChat";

const About = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Style Meets Functionality",
      description: "We believe fashion should work for you. Our designs transition seamlessly from the boardroom to a weekend getaway."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Quality & Durability",
      description: "Crafted with premium materials and thoughtful design to ensure your favorite accessories last for years to come."
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Reliable Convenience",
      description: "Experience the ease of online shopping with dependable delivery services across Kenya and beyond."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Affordable Elegance",
      description: "Redefining luxury by making sophisticated, high-end designs accessible without compromising on quality."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      
      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section - Matching CollectionsPage styling */}
        <section className="relative h-[250px] sm:h-[300px] bg-secondary/30 flex items-center justify-center overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10" />
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center gap-4">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
               <h1 className="text-4xl sm:text-6xl font-black text-foreground uppercase tracking-tighter mb-2 leading-none">
                 Our Story
               </h1>
               <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                 <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                 <ChevronRight className="h-3 w-3" />
                 <span className="text-foreground">About Hera</span>
               </div>
               <p className="text-base text-muted-foreground font-medium max-w-lg mx-auto">
                 Hera Collections is a Kenyan online fashion brand specializing in stylish, functional, and high-quality accessories for the modern individual.
               </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-24 sm:py-32 relative overflow-hidden bg-background">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 relative">
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
                <motion.div 
                  whileInView={{ opacity: 1, scale: 1 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  viewport={{ once: true }}
                  className="relative rounded-[2rem] overflow-hidden border border-border/50 bg-secondary/20 aspect-video flex items-center justify-center p-12"
                >
                  <img 
                    src="https://res.cloudinary.com/dvkt0lsqb/image/upload/v1769772723/DSC03037-removebg-preview_s0pa5d.png" 
                    alt="Premium Craftsmanship"
                    className="max-h-full object-contain filter brightness-90 hover:brightness-110 transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent opacity-40" />
                </motion.div>
              </div>

              <div className="lg:w-1/2 space-y-8">
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Our Essence</h2>
                  <h3 className="text-4xl sm:text-5xl font-bold text-foreground leading-[1.1]">Luxury that moves <br /> with your life.</h3>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Founded in Kenya, Hera Collections was born out of a simple need: accessories that didn't just look good, but worked hard too. For the young professional balancing meetings, the traveler chasing horizons, and the student mastering the everyday—we create pieces that reflect your ambition.
                </p>

                <div className="grid grid-cols-2 gap-8 pt-4">
                   <div className="space-y-2">
                      <div className="text-3xl font-bold text-foreground">100%</div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-primary">Authentic Design</div>
                   </div>
                   <div className="space-y-2">
                      <div className="text-3xl font-bold text-foreground">24/7</div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest text-primary">Reliable Support</div>
                   </div>
                </div>

                <div className="pt-8">
                   <Button asChild className="rounded-full px-8 py-6 h-auto text-base font-bold group">
                      <Link to="/collections">
                        Explore Our Collections
                        <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                   </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Grid */}
        <section className="py-24 bg-secondary/10 dark:bg-secondary/5 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Our Pillars</h2>
              <h3 className="text-4xl sm:text-5xl font-bold text-foreground">What defines Hera.</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card border border-border/50 p-8 rounded-3xl hover:border-primary/50 transition-all group hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {v.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{v.title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Lifestyle Banner / CTA Section - Adaptive to Themes */}
        <section className="py-24 sm:py-32 relative bg-secondary/20 dark:bg-[#0a0a0a] overflow-hidden text-center transition-colors duration-300">
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
           <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto space-y-12">

                 
                  <div className="space-y-6">
                    <h3 className="text-4xl sm:text-6xl font-bold text-foreground dark:text-white  tracking-tighter">Ready to redefine <br className="hidden sm:block" /> your Everyday?</h3>
                    <p className="text-lg text-muted-foreground dark:text-white/60 max-w-xl mx-auto font-medium">
                       Join thousands of style-conscious Kenyans who haven't just bought a bag, but upgraded their lifestyle with Hera Collections.
                    </p>
                  </div>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button asChild size="lg" className="rounded-full px-12 py-7 h-auto text-lg font-bold">
                       <Link to="/collections">Shop with Confidence</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full px-12 py-7 h-auto text-lg font-bold border-primary/20 hover:bg-primary/5">
                       <Link to="/contact">Talk to Us</Link>
                    </Button>
                 </div>

                 <div className="pt-8 flex items-center justify-center gap-8 opacity-60 dark:opacity-40">
                    <div className="flex items-center gap-2 text-foreground dark:text-white font-bold uppercase tracking-widest text-[10px]">
                       <Heart className="h-4 w-4 text-red-500" />
                       Nairobi Made
                    </div>
                    <div className="flex items-center gap-2 text-foreground dark:text-white font-bold uppercase tracking-widest text-[10px]">
                       <Star className="h-4 w-4 text-amber-500" />
                       Hera Trusted
                    </div>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
      <LiveChat />
      <WhatsAppChat />
    </div>
  );
};

// Internal Badge replacement Component for UI cohesion
const Badge = ({ children, className, variant = "default" }: any) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
    variant === "outline" ? "border border-input bg-background" : "bg-primary text-primary-foreground"
  } ${className}`}>
    {children}
  </span>
);

export default About;
