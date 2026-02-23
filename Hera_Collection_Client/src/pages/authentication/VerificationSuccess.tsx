import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useState, useEffect } from "react";

const darkLogo = "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771745508/Hera-logo-white_kep2fm.png";
const lightLogo = "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771745617/HERA-logo-black_o0ulzi.png";

const VerificationSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const redirectPath = sessionStorage.getItem('pending_verification_redirect') || '/dashboard';
      sessionStorage.removeItem('pending_verification_redirect');
      navigate(redirectPath);
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Logo Container */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 z-10"
      >
        <Link to="/" className="flex items-center group">
          <div className="h-16 w-48 flex items-center transition-transform duration-300 group-hover:scale-105">
            <img 
              src={currentThemeLogo} 
              alt="Hera Collections" 
              className="h-full w-full object-contain"
            />
          </div>
        </Link>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pt-12 pb-6 px-8">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-green-500/10 text-green-500 shadow-inner"
            >
              <CheckCircle className="h-12 w-12" />
            </motion.div>
            <CardTitle className="text-3xl font-black tracking-tight mb-3 uppercase">Verification Success</CardTitle>
            <CardDescription className="text-lg font-medium leading-relaxed">
              Your identity has been confirmed. You now have full access to the Hera ecosystem.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-8 px-8 pb-12">
            <div className="p-4 bg-secondary/50 rounded-2xl border border-border/50">
              <p className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Redirecting to dashboard in 5 seconds...
              </p>
            </div>
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all group"
              >
                Enter Dashboard Now
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="ghost" 
                className="w-full h-12 text-muted-foreground hover:text-foreground font-bold"
              >
                Back to Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerificationSuccess;