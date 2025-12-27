import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Truck,
  CreditCard,
  ArrowUp,
  Heart,
  Sparkles,
  ChevronRight,
  Send,
  CheckCircle,
  MessageCircle,
  Award,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from '@/components/Images/HeraCollection Logo.jpg';
import { motion } from "framer-motion";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Simulate subscription
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
      setEmail("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Pre-footer CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="h-10 w-10 text-primary dark:text-primary mx-auto mb-4" />
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground dark:text-foreground mb-4">
              Join the Hera Collections Family
            </h3>
            <p className="text-base text-muted-foreground dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive offers, style tips, and first access to new collections
            </p>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-full border-2 focus:border-primary"
                  required
                />
              </div>
              <Button 
                type="submit"
                className="bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground hover:bg-primary-dark dark:hover:bg-primary-dark rounded-full px-8 transition-all duration-300 hover:scale-105"
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Subscribed!
                  </>
                ) : (
                  <>
                    Subscribe
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy
            </p>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-background dark:bg-background border-t border-border dark:border-border/40">
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <Link to="/" className="inline-block">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16">
                      <img
                        src={Logo}
                        alt="Hera Collections - Premium Bags & Accessories"
                        className="h-full w-full object-contain rounded-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground dark:text-foreground">
                        Hera Collections
                      </h2>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Premium Bags & Accessories
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
              
              <p className="text-muted-foreground dark:text-muted-foreground mb-6 max-w-md">
                Crafting timeless luxury since 2015. We create premium bags that blend exceptional 
                craftsmanship with sustainable practices for the modern individual.
              </p>
              
              {/* Social Media */}
              <div className="mb-6">
                <h4 className="font-semibold text-foreground dark:text-foreground mb-3">
                  Connect With Us
                </h4>
                <div className="flex items-center gap-3">
                  {[
                    { icon: Instagram, label: "Instagram", href: "#" },
                    { icon: Facebook, label: "Facebook", href: "#" },
                    { icon: Twitter, label: "Twitter", href: "#" },
                    { icon: Youtube, label: "YouTube", href: "#" }
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-full bg-secondary dark:bg-secondary/30 flex items-center justify-center text-foreground/70 dark:text-foreground/70 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary dark:text-primary" />
                  <span className="text-foreground/80 dark:text-foreground/80">
                   +254-718577608 / +254-707064827
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary dark:text-primary" />
                  <span className="text-foreground/80 dark:text-foreground/80">
                    info@heracollections.com
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary dark:text-primary mt-1" />
                  <span className="text-foreground/80 dark:text-foreground/80">
                   Nairobi
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground dark:text-foreground text-lg mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Home", href: "/" },
                  { name: "New Arrivals", href: "/collections/new" },
                  { name: "Best Sellers", href: "/collections/best-sellers" },
                  { name: "Sale", href: "/collections/sale" },
                  { name: "Custom Orders", href: "/custom" },
                  { name: "Gift Cards", href: "/gift-cards" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Collections */}
            <div>
              <h3 className="font-semibold text-foreground dark:text-foreground text-lg mb-4">
                Collections
              </h3>
              <ul className="space-y-3">
                {[
                  "Tote Bags",
                  "Backpacks",
                  "Travel Bags",
                  "Messenger Bags",
                  "Sling Bags",
                  "Laptop Sleeves",
                  "Pouches",
                  "Custom Designs",
                ].map((collection) => (
                  <li key={collection}>
                    <Link
                      to={`/collections/${collection.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {collection}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Service */}
            <div>
              <h3 className="font-semibold text-foreground dark:text-foreground text-lg mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                {[
                  { name: "Contact Us", href: "/contact" },
                  { name: "FAQs", href: "/faq" },
                  { name: "Shipping Info", href: "/shipping" },
                  { name: "Returns & Exchanges", href: "/returns" },
                  { name: "Size Guide", href: "/size-guide" },
                  { name: "Care Instructions", href: "/care" },
                  { name: "Track Order", href: "/track-order" },
                  { name: "Privacy Policy", href: "/privacy" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-border dark:border-border/40">
            {[
              { icon: Shield, title: "Secure Payment", desc: "256-bit SSL encryption" },
              { icon: Truck, title: "Free Shipping", desc: "On orders over KES 7500" },
              { icon: Award, title: "Premium Quality", desc: "" },
              { icon: Globe, title: "Delivery within Nairobi", desc: "" },
            ].map((badge, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <badge.icon className="h-6 w-6 text-primary dark:text-primary" />
                </div>
                <h4 className="font-semibold text-foreground dark:text-foreground mb-1">
                  {badge.title}
                </h4>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {badge.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-8 pt-8 border-t border-border dark:border-border/40">
            <h4 className="text-center font-semibold text-foreground dark:text-foreground mb-4">
              We Accept
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {["MPESA", "Bank", "Cah",].map((method) => (
                <div 
                  key={method}
                  className="px-4 py-2 bg-secondary/30 dark:bg-secondary/20 rounded-lg text-sm text-foreground/70 dark:text-foreground/70"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-secondary/20 dark:bg-secondary/10 border-t border-border dark:border-border/40">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  © {new Date().getFullYear()} Hera Collections. All rights reserved.
                </p>
              </div>
              
              <div className="flex items-center gap-6">
                <Link 
                  to="/terms" 
                  className="text-sm text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
                <Link 
                  to="/privacy" 
                  className="text-sm text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  to="/cookies" 
                  className="text-sm text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors"
                >
                  Cookie Policy
                </Link>
              </div>
              
              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground hover:text-primary dark:hover:text-primary transition-colors"
              >
                Back to top
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Made with <Heart className="h-3 w-3 inline text-red-500 fill-red-500" /> by Hera Collections Team
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Live chat support"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
      </button>
    </>
  );
}