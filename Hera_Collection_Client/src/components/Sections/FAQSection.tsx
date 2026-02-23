import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What materials are Hera bags made from?",
    answer: "We use faux premium leather and high-quality velvet materials designed for elegance and long-lasting use.",
    category: "Products"
  },
  {
    question: "Are the colors exactly as shown?",
    answer: "We aim for accuracy, but slight variations may occur due to lighting and screen settings.",
    category: "Products"
  },
  {
    question: "Will sold-out items be restocked?",
    answer: "Some designs are restocked. Contact us to confirm availability. Custom bags are also available. Contact us for more info.",
    category: "Products"
  },
  {
    question: "Do you deliver countrywide?",
    answer: "Yes, we deliver across Kenya.",
    category: "Delivery"
  },
  {
    question: "How long does delivery take?",
    answer: "Nairobi: 4-7 business days\nOutside Nairobi: 6-7 business days",
    category: "Delivery"
  },
  {
    question: "Do you offer same-day delivery?",
    answer: "Available within Nairobi for early orders. Please confirm before placing your order.",
    category: "Delivery"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept M-Pesa, Visa, and Mastercard which are the secure payment options available at checkout.",
    category: "Payment"
  },
  {
    question: "Is payment required before delivery?",
    answer: "Yes. Orders are processed once payment is confirmed.",
    category: "Payment"
  },
  {
    question: "Can I exchange a product?",
    answer: "No. Kindly check on the Refunds and Exchange Policy for more info.",
    category: "Returns & Exchanges"
  },
  {
    question: "What if I receive a defective item?",
    answer: "Contact us within 24 hours with photos, and we’ll resolve it promptly.",
    category: "Returns & Exchanges"
  },
  {
    question: "How do I care for my Hera bag?",
    answer: "Check the Care Instructions listed on the site.",
    category: "Care"
  }
];

export default function FAQSection() {
  const [visibleCount, setVisibleCount] = useState(4);

  const handleToggleFAQs = () => {
    if (visibleCount >= faqs.length) {
      setVisibleCount(4);
    } else {
      setVisibleCount(prev => Math.min(prev + 4, faqs.length));
    }
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 -z-10"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/50 rounded-full blur-3xl -ml-48 -mb-48 -z-10"></div>

      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
             <HelpCircle className="w-4 h-4" />
             <span className="text-sm font-bold uppercase tracking-widest">Help Center</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6 tracking-tighter">
            Frequently Asked <span className="text-primary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about our products, delivery, and services. Can't find the answer you're looking for? Reach out to our team.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           viewport={{ once: true }}
        >
          <div className="bg-card border border-border/50 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.slice(0, visibleCount).map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-secondary/20 dark:bg-secondary/10 border border-border/50 rounded-2xl px-6 data-[state=open]:bg-secondary/40 dark:data-[state=open]:bg-secondary/20 transition-all duration-300"
                >
                  <AccordionTrigger className="text-left font-bold text-foreground hover:no-underline py-5 group">
                    <span className="text-[15px] sm:text-base pr-4 flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-primary/50 group-data-[state=open]:bg-primary transition-colors"></span>
                       {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-1 text-muted-foreground whitespace-pre-line leading-relaxed text-[15px] pl-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <motion.div layout className="mt-8 flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleToggleFAQs}
                className="rounded-full px-8 py-6 h-auto text-[15px] font-bold bg-transparent border-primary/20 hover:bg-primary/10 hover:border-primary/50 text-foreground transition-all group"
              >
                {visibleCount >= faqs.length ? (
                  <>
                    Show Less <ChevronUp className="ml-2 h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                  </>
                ) : (
                  <>
                    View More FAQs <ChevronDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
