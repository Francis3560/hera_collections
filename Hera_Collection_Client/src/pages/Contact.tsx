import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  MessageSquare, 
  Clock, 
  Globe, 
  Shield, 
  Star,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Instagram
} from "lucide-react";
import { FaTiktok } from "react-icons/fa";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import emailService from "@/api/email.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { LiveChat } from "@/components/chat/LiveChat";
import WhatsAppChat from "@/components/chat/WhatsAppChat";

const Contact = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (user) {
      setContactForm(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await emailService.sendContactEmail(contactForm);
      toast.success("Message sent successfully!", {
        description: "We'll get back to you as soon as possible."
      });
      setContactForm(prev => ({ ...prev, subject: "", message: "" }));
    } catch (error: any) {
      toast.error(error.message || "Failed to send message", {
        description: "Please try again later or contact us directly."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { number: "Fast", label: "Nairobi Delivery", icon: MapPin },
    { number: "100%", label: "Safe Handling", icon: Shield },
    { number: "4.9/5", label: "Client Rating", icon: Star },
    { number: "Online", label: "Always Available", icon: Clock }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      value: "admin@heracollections.com",
      description: "Expect a response within 24 hours.",
      color: "from-amber-500 to-orange-500"
    },
    {
      icon: Phone,
      title: "Call Us",
      value: "+254 718 577 608 / +254 707 064 827",
      description: "Mon-Sat, 8am to 6pm EAT.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      value: "Available Online",
      description: "Instant help when you need it.",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-secondary/30 flex items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm text-primary px-4 py-2 rounded-full mb-6"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-widest">Get In Touch</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight uppercase tracking-tighter"
            >
              Let's Start a <span className="text-primary">Conversation</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="text-xl text-muted-foreground font-medium mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Whether you have questions about our latest collection, need assistance with an order, or want to discuss a custom design—we're here to help you redefine your style.
            </motion.p>
          </motion.div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      </section>

      {/* Main Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Contact Info & Details */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6 uppercase tracking-tight">
                  Reach Out To Us
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Choose the most convenient way to connect with our team. We're committed to providing the same level of excellence in our support as we do in our craftsmanship.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {contactMethods.map((method, index) => (
                    <Card key={method.title} className="border-border/50 bg-secondary/5 hover:bg-secondary/10 transition-colors shadow-soft">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${method.color} text-white shadow-lg mb-4`}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-foreground uppercase tracking-wider text-sm mb-1">{method.title}</h3>
                        <p className="font-medium text-foreground mb-1">{method.value}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Social Media Links */}
              <div className="pt-8 border-t border-border/50">
                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-6">Follow Our Journey</h3>
                <div className="flex gap-4">
                  {[
                    { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/heracollections._?igsh=ejAyMmhzcmZyaGo4&utm_source=qr" },
                    { icon: FaTiktok, label: "TikTok", href: "https://www.tiktok.com/@heracollections0?_r=1&_t=ZS-940TaAozWfY" }
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <Card className="border-none bg-secondary/5 dark:bg-secondary/20 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 sm:p-12">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2">Send a Message</h3>
                    <p className="text-muted-foreground">Fill out the form below and we'll be in touch.</p>
                  </div>
                  
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest opacity-70">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          className="bg-background/50 border-2 border-border/80 hover:border-primary-accent/50 focus:border-primary-accent transition-all duration-300 rounded-2xl h-14 shadow-sm"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest opacity-70">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          className="bg-background/50 border-2 border-border/80 hover:border-primary-accent/50 focus:border-primary-accent transition-all duration-300 rounded-2xl h-14 shadow-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest opacity-70">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Project Inquiry"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="bg-background/50 border-2 border-border/80 hover:border-primary-accent/50 focus:border-primary-accent transition-all duration-300 rounded-2xl h-14 shadow-sm"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest opacity-70">Your message</Label>
                      <Textarea
                        id="message"
                        placeholder="How can we help you?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        className="bg-background/50 border-2 border-border/80 hover:border-primary-accent/50 focus:border-primary-accent transition-all duration-300 rounded-2xl min-h-[160px] shadow-sm resize-none"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary-dark transition-all duration-300 shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-secondary/10">
        <div className="container mx-auto px-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 group hover:bg-primary hover:text-white transition-all duration-500">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-3xl font-black text-foreground mb-2">
                  {stat.number}
                </div>
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-8 uppercase tracking-tighter">
              Ready to Upgrade <br /> Your Everyday?
            </h2>
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90 font-medium">
              Join thousands of style-conscious individuals who choose Hera Collections for quality and elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 h-16 rounded-2xl px-12 text-lg font-bold shadow-2xl">
                <a href="/collections">Shop Now <ArrowRight className="ml-2 h-5 w-5" /></a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <LiveChat />
      <WhatsAppChat />
    </div>
  );
};

export default Contact;
