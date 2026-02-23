import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { LiveChat } from "@/components/chat/LiveChat";

export default function RefundPolicy() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      
      <main className="flex-1 overflow-x-hidden">
        {/* Banner */}
        <section className="relative h-[200px] bg-secondary/30 flex items-center justify-center overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5" />
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center gap-4">
             <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-2">
               Refund Policy
             </h1>
             <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
               <Link to="/" className="hover:text-primary transition-colors">Home</Link>
               <ChevronRight className="h-3 w-3" />
               <span className="text-foreground">Refund Policy</span>
             </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary-accent">
            <h3 className="text-primary">Returns.</h3>
            <p>Goods once sold can not be returned.</p>

            <h3>Damages and issues</h3>
            <p>Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right. If not reported within 24 hrs of delivery, the return will not be considered. If the damage/issues was on our part, we will assess the situation and determine the best course of action.</p>
 
            <h3>Exchanges</h3>
            <p>We do not offer exchanges on sold goods since our products are custom based.</p>
          </div>
        </section>
      </main>

      <Footer />
      <LiveChat />
    </div>
  );
}
