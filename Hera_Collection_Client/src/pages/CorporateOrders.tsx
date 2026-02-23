import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Building, 
  Package, 
  Award,
  ChevronRight,
  Phone
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiveChat } from "@/components/chat/LiveChat";
import { ContactModal } from "@/components/ContactModal";

const CorporateOrders = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const values = [
    {
      icon: <Building className="w-6 h-6" />,
      title: "Corporate Gifting",
      description: "Show appreciation to employees and clients with premium, high-quality bags."
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: "Bulk Ordering",
      description: "Seamless processing and discounts for high-volume orders."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Custom Branding",
      description: "Add your corporate logo or brand colors to our bags for a personalized touch."
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "Event Merchandise",
      description: "Stand out at conferences and events with elegant, branded accessories."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      
      <main className="flex-1 overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative h-[250px] sm:h-[300px] bg-secondary/30 flex items-center justify-center overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10" />
          
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
               <h1 className="text-4xl sm:text-6xl font-black text-foreground uppercase tracking-tighter mb-2 leading-none">
                 Corporate Orders
               </h1>
               <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                 <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                 <ChevronRight className="h-3 w-3" />
                 <span className="text-foreground">Corporate Orders</span>
               </div>
               <p className="text-base text-muted-foreground font-medium max-w-lg mx-auto">
                 Elevate your brand with premium custom-branded accessories for your team, clients, and events.
               </p>
            </motion.div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-24 relative overflow-hidden bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-[0.3em]">Our Services</h2>
              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">Why choose Hera for business?</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you need elegant corporate gifts or branded merchandise, Hera Collections offers tailored solutions to suit your corporate standards.
              </p>
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
            
            <div className="mt-16 text-center">
               <ContactModal defaultSubject="Corporate Orders Inquiry" defaultMessage="Hi Hera Collections, I am a business representative and would like to learn more about your bulk order capabilities and B2B pricing structure for our corporate gifting/event needs.">
                 <Button className="rounded-full px-8 py-6 h-auto text-base font-bold shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <Phone className="mr-2 h-5 w-5" />
                    Contact Our B2B Team
                 </Button>
               </ContactModal>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LiveChat />
    </div>
  );
};

export default CorporateOrders;
