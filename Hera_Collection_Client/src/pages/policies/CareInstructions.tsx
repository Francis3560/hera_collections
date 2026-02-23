import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { LiveChat } from "@/components/chat/LiveChat";

export default function CareInstructions() {
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
               Care Instructions
             </h1>
             <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
               <Link to="/" className="hover:text-primary transition-colors">Home</Link>
               <ChevronRight className="h-3 w-3" />
               <span className="text-foreground">Care Instructions</span>
             </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-primary prose-a:text-primary hover:prose-a:text-primary-accent">
            <h2 className="text-primary">FAUX LEATHER</h2>
            
            <h3 className="text-primary">Key Care Instructions:</h3>
            <ul>
               <li><strong>Cleaning:</strong> Mix mild soap with warm water and use a soft, damp cloth to clean. For tough spots, use gentle, circular motions. Regularly wipe them with a damp microfiber cloth and mild soap, avoiding harsh chemicals, bleach, or over-soaking.</li>
               <li><strong>Maintenance:</strong> Use a dedicated vinyl or leather conditioner every few months to prevent the material from drying out and cracking.</li>
               <li><strong>Storage:</strong> Store in a cool, dry place, ideally inside a breathable dust bag to avoid mildew.</li>
               <li><strong>Protection:</strong> Avoid exposing the bag to extreme sunlight or heat, which can cause cracking and peeling.</li>
               <li><strong>Shape Maintenance:</strong> Stuff the bag with tissue paper or bubble wrap when not in use to keep its structure.</li>
            </ul>

            <h3 className="text-primary">What to Avoid:</h3>
            <ul>
               <li>Never use abrasive cleaners, alcohol, or bleach.</li>
               <li>Do not machine wash or submerge the bag in water.</li>
               <li>Do not dry with high heat (e.g., hair dryer).</li>
            </ul>

            <hr className="my-12 border-border/50" />

            <h2 className="text-primary">VELVET MATERIAL</h2>
            
            <h3 className="text-primary">Key Care Guidelines:</h3>
            <ul>
               <li><strong>Preventive Care:</strong> Regularly use a soft-bristled brush to remove dust and lift the nap, keeping the velvet looking plush.</li>
               <li><strong>Spot Cleaning (Best Method):</strong> Immediately blot stains with a clean cloth, white towel, or paper towel to absorb spills. Use a mixture of cold water and mild dish soap to gently dab at the stain, avoiding heavy scrubbing.</li>
            </ul>

            <h3 className="text-primary">Washing Machine Instructions:</h3>
            <ul>
               <li><strong>Use a Mesh Bag:</strong> Always place the bag inside a mesh, zippered laundry bag to protect it from snags and friction.</li>
               <li><strong>Cold Water & Gentle Cycle:</strong> Use the gentlest cycle with cold water.</li>
               <li><strong>Mild Detergent:</strong> Use a small amount of mild or delicate detergent.</li>
               <li><strong>Drying:</strong> Never put velvet in a dryer. Air dry the bag in a cool, ventilated place away from direct sunlight to prevent fading.</li>
               <li><strong>Removing Wrinkles:</strong> Use a handheld steamer to remove creases. Avoid using a direct iron, as it will flatten and damage the velvet pile.</li>
               <li><strong>Storage:</strong> Store in a cool, dry place, ideally in a breathable dust bag to keep it safe from dust and prevent crushing.</li>
            </ul>

            <h3 className="text-primary">Specific Tips for Velvet Bags:</h3>
            <ul>
               <li><strong>Brush Post-Cleaning:</strong> Once the bag is completely dry, use a soft velvet brush to lift the fibres and restore the texture.</li>
               <li><strong>Avoid Over-saturation:</strong> When spot-cleaning, do not allow the fabric to get too wet, as this can affect the texture.</li>
               <li><strong>For Embroidered Bags:</strong> Use extra caution, perhaps opting for hand washing, as machine cycles may affect the embroidery.</li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
      <LiveChat />
    </div>
  );
}
