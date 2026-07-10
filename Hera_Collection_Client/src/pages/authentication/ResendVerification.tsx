import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";
import { 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  ArrowLeft,
  Quote,
  RefreshCw 
} from "lucide-react";
import { OrbitProgress } from "react-loading-indicators";

const SLIDES = [
  {
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771784615/Ekalale_Backpack_2_1_glnfr0.jpg",
    quote: "It's the fact that they make out time to teach and walk me through the process of being a better entrepreneur.",
  },
  {
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771784681/Nyathii_Baby_Bag_Brown_1_blxhpj.png",
    quote: "Hera has completely transformed how I source luxury pieces for my collection. The quality is unmatched.",
  },
  {
    image: "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771785863/Naitore_Handbag_2_cukq0s.jpg",
    quote: "The attention to detail and personalized service makes every purchase a world-class experience.",
  }
];

const ResendVerification = () => {
  const navigate = useNavigate();
  const { resendVerificationEmail, pendingVerificationEmail, user } = useAuth();
  
  const [email, setEmail] = useState(pendingVerificationEmail || user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Theme detection
  const { theme } = useTheme();
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setActualTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const listener = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      setActualTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  const currentThemeLogo = actualTheme === 'dark' ? darkLogo : lightLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        setSuccess(true);
        // Start cooldown timer
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.error);
        if (result.retryAfter) {
          setCooldown(result.retryAfter);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden font-sans">
      {/* Left Side: Visual / Marketing (Hidden on mobile) */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[42%] p-6 bg-secondary/10 overflow-hidden"
      >
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <img 
                src={SLIDES[currentSlide].image} 
                alt="Hera Collection Exclusive"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Top Logo Overlay */}
          <div className="absolute top-10 left-10 z-20">
            <Link to="/" className="flex items-center group">
              <div className="h-12 w-32 flex items-center transition-transform duration-300 group-hover:scale-105">
                <img 
                  src={darkLogo} 
                  alt="Hera Collections" 
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-12 left-10 right-10 z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <h2 className="text-xl font-black text-white leading-tight">
                  {SLIDES[currentSlide].quote}
                </h2>
              </motion.div>
            </AnimatePresence>

            {/* Pagination Dots */}
            <div className="flex gap-2 mt-8">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === i ? "w-8 bg-primary" : "w-2 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side: Resend Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[58%] h-screen flex flex-col items-center bg-background overflow-y-auto custom-scrollbar pt-12 pb-8 px-6 md:px-12 lg:px-20 relative"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8">
           <Link to="/" className="flex items-center">
            <div className="h-12 w-32 flex items-center">
              <img 
                src={currentThemeLogo} 
                alt="Hera Collections" 
                className="h-full w-full object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="w-full max-w-[480px] mt-auto mb-auto">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-secondary mb-12 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "50%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-primary"
            />
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          {/* Header */}
          <div className="mb-10">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-foreground mb-3"
            >
              Request Access
            </motion.h1>
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Missing your code? We'll send a fresh one right over.
            </motion.p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-3xl p-8 text-center"
                >
                  <div className="mx-auto w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tighter">Code Sent</h3>
                  <p className="text-muted-foreground font-medium mb-8 text-lg">
                    A new verification link has been delivered to <span className="text-foreground font-bold">{email}</span>.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate('/verify')}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl"
                    >
                      Enter Code
                    </Button>
                    <Button
                      onClick={() => navigate('/login')}
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground font-bold"
                    >
                      Back to Login
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} 
                  className="space-y-6"
                >
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive animate-in fade-in zoom-in duration-300">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="text-sm font-bold">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground/70 font-semibold ml-1">Email Address</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-14 pl-12 rounded-2xl border-border bg-secondary/5 transition-all focus:ring-primary/20 focus:border-primary"
                        required
                        disabled={loading || cooldown > 0}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white" 
                    disabled={loading || cooldown > 0}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                         <OrbitProgress color="#FFFFFF" size="small" />
                         <span>Delivering...</span>
                      </div>
                    ) : cooldown > 0 ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Available in {cooldown}s</span>
                      </div>
                    ) : (
                      "Send Verification Code"
                    )}
                  </Button>

                  <div className="text-center pt-6 border-t border-border">
                    <p className="text-muted-foreground">
                      Found your code?{" "}
                      <Link to="/verify" className="text-primary font-black hover:underline underline-offset-4">
                        Verify here
                      </Link>
                    </p>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-auto py-8">
            <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResendVerification;