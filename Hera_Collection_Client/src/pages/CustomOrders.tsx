import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, 
  Palette, 
  Gem, 
  Sparkles,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LiveChat } from "@/components/chat/LiveChat";
import WhatsAppChat from "@/components/chat/WhatsAppChat";
import { TypeAnimation } from "react-type-animation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { HiOutlineMailOpen } from "react-icons/hi";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { ImSpinner2 } from "react-icons/im";
import emailService from "@/api/email.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Specialized Inquiry Modal Component
const InquiryForm = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await emailService.sendContactEmail({
        ...formData,
        subject: "Custom Order Quote Request"
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData(prev => ({ ...prev, message: "" }));
      }, 5000);
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto overflow-hidden rounded-[2.5rem] border border-border bg-card/30 shadow-2xl">
      <div className="flex flex-col lg:flex-row min-h-[550px]">
        {/* Left Side: Visual & Introduction */}
        <div className="w-full lg:w-5/12 bg-muted/20 p-10 flex flex-col items-center justify-center text-center lg:text-left border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-[100px] -z-10" />
          
          <div className="space-y-8 relative z-10 w-full max-w-sm">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
                Got a custom order in <br />
                <span className="text-primary italic font-normal">mind?</span>
              </h2>
              <p className="text-sm font-normal text-muted-foreground italic">
                From bespoke Guitor Bags to bespoke luxury pieces.
              </p>
            </div>

            <div className="flex flex-col gap-8 items-center lg:items-start">
              <div className="relative group">
                <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <img
                  src="https://res.cloudinary.com/fffb5ery/image/upload/v1783681036/20260304_1233_Contemplating_Custom_Bag_Order_remix_01kjx8ss8jehas87s1nfh19s76_xafd3h.png"
                  alt="Custom Order Illustration"
                  className="w-[280px] relative opacity-95 transition-all duration-500 hover:scale-105"
                />
              </div>

              <div className="h-20 flex items-center justify-center lg:justify-start w-full">
                <TypeAnimation
                  sequence={[
                    "Tailored to your craftsmanship...",
                    1500,
                    "Share your specifications...",
                    1500,
                    "Let's create together.",
                    1500,
                    "Your vision, our expertise.",
                    1500,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="text-base font-normal text-primary/80 italic tracking-wide"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 p-8 md:p-14 self-center bg-background/50 backdrop-blur-sm">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-16"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <AiOutlineCheckCircle className="text-primary text-6xl animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-medium text-foreground">Request sent!</h3>
                <p className="text-muted-foreground font-normal max-w-xs mx-auto">
                  Our master craftsmen will review your specifications and reach out shortly.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSuccess(false)}
                className="rounded-full px-8 hover:bg-primary hover:text-white transition-colors"
              >
                Send another inquiry
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <HiOutlineMailOpen className="text-2xl" />
                  </div>
                  <h3 className="text-2xl font-medium text-foreground">Share your vision</h3>
                </div>
                <p className="text-sm text-muted-foreground font-normal max-w-md">
                  Fill in your details below and tell us about the custom piece you want us to create for you.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="iq-name" className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] pl-1">Full Name</Label>
                  <Input
                    id="iq-name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="h-14 bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl transition-all"
                    required
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="iq-email" className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] pl-1">Email Address</Label>
                  <Input
                    id="iq-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="h-14 bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="iq-message" className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] pl-1">specifications & request</Label>
                <Textarea
                  id="iq-message"
                  placeholder="Tell us about the size, type, and specific craftsmanship you require..."
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="bg-muted/20 border-border/50 focus:border-primary focus:ring-primary/10 rounded-2xl min-h-[180px] resize-none p-5 text-base"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto h-16 px-12 bg-primary hover:bg-primary-dark text-white font-medium rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <ImSpinner2 className="animate-spin text-xl" />
                    Sending Inquiry...
                  </>
                ) : (
                  <>
                    <span className="text-lg">Send Custom Request</span>
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomOrders = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const values = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Bespoke Designs",
      description: "Work with us to create a design that fits your exact stylistic preferences."
    },
    {
      icon: <Scissors className="w-6 h-6" />,
      title: "Tailored Craftsmanship",
      description: "Meticulous attention to detail and precision cutting to match your requirements."
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: "Premium Materials",
      description: "Choose from a curated selection of fine, durable materials and hardware."
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Personalization",
      description: "Add a personalized monogram or choose unique color combinations."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      <Header />
      
      <main className="flex-1">
        {/* Simple Hero Section */}
        <section className="relative h-[250px] sm:h-[300px] flex items-center justify-center overflow-hidden bg-muted/5">
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
               <h1 className="text-4xl sm:text-6xl font-semibold text-foreground uppercase tracking-tight leading-none">
                 Custom <span className="text-primary italic font-normal">Orders</span>
               </h1>
               <div className="h-px w-24 bg-primary/30 mx-auto" />
               <p className="text-base text-muted-foreground font-normal max-w-lg mx-auto italic">
             From Guitar Bags to Drumstick Bags, bring out your creative self through us <span className="text-primary italic font-normal">Reach out for a custom bag design. Let’s create together !</span>
               </p>
            </motion.div>
          </div>
        </section>

        {/* Features & Form Section */}
        <section className="py-24 bg-background border-t border-border/40">
          <div className="container mx-auto px-4">
            {/* Direct Inquiry Form Section */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-16"
            >
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <h3 className="text-3xl sm:text-4xl font-medium tracking-tight">Got a dream custom quote in mind?</h3>
                <p className="text-muted-foreground font-normal italic">
                  Complete the inquiry form below and let's start crafting your masterpiece.
                </p>
              </div>
              
              <InquiryForm />
            </motion.div>
          </div>
                      {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-muted/5 border border-border/50 p-8 rounded-3xl hover:border-primary transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {v.icon}
                  </div>
                  <h4 className="text-lg font-medium mb-3">{v.title}</h4>
                  <p className="text-muted-foreground text-sm font-normal leading-relaxed">{v.description}</p>
                </motion.div>
              ))}
            </div>

        </section>

        {/* Decorative divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent opacity-30" />
      </main>

      <Footer />
      <LiveChat />
      <WhatsAppChat />
    </div>
  );
};

export default CustomOrders;

