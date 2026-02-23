import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Loader2, MessageSquare } from "lucide-react";
import emailService from "@/api/email.service";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ContactModalProps {
  children: React.ReactNode;
  defaultSubject?: string;
  defaultMessage?: string;
}

export function ContactModal({ children, defaultSubject = "", defaultMessage = "" }: ContactModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: defaultSubject,
    message: defaultMessage
  });

  useEffect(() => {
    if (user) {
      setContactForm(prev => ({
        ...prev,
        name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  useEffect(() => {
    if (open) {
      setContactForm(prev => ({ ...prev, subject: defaultSubject, message: defaultMessage }));
    }
  }, [open, defaultSubject, defaultMessage]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await emailService.sendContactEmail(contactForm);
      toast.success("Request sent successfully!", {
        description: "Our team will get back to you as soon as possible."
      });
      setContactForm(prev => ({ ...prev, subject: defaultSubject, message: defaultMessage }));
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send request", {
        description: "Please try again later or contact us directly."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden p-8 sm:p-10">
        <DialogHeader className="mb-2 text-left space-y-2">
          <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Get in touch
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Fill out the form below and our team will be in touch shortly to assist you.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleContactSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Your Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className="bg-secondary/30 focus:bg-background border-2 border-border/80 focus:border-primary-accent transition-all duration-300 rounded-xl h-12 shadow-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className="bg-secondary/30 focus:bg-background border-2 border-border/80 focus:border-primary-accent transition-all duration-300 rounded-xl h-12 shadow-sm"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Subject</Label>
            <Input
              id="subject"
              placeholder="Subject"
              value={contactForm.subject}
              onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
              className="bg-secondary/30 focus:bg-background border-2 border-border/80 focus:border-primary-accent transition-all duration-300 rounded-xl h-12 shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Your message / specifications</Label>
            <Textarea
              id="message"
              placeholder="Tell us what you need..."
              value={contactForm.message}
              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
              className="bg-secondary/30 focus:bg-background border-2 border-border/80 focus:border-primary-accent transition-all duration-300 rounded-xl min-h-[120px] shadow-sm resize-none"
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-md font-bold bg-primary hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
