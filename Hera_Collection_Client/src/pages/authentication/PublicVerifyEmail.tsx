import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Shield, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { OrbitProgress } from "react-loading-indicators";

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";

const PublicVerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { userId, code } = useParams();
  const navigate = useNavigate();
  const { verifyEmailPublic } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        
        const userIdToVerify = userId || searchParams.get('userId');
        const codeToVerify = code || searchParams.get('code');
        
        if (!userIdToVerify || !codeToVerify) {
          setError("Invalid verification link. Please check your email for a valid link.");
          setLoading(false);
          return;
        }
        
        const result = await verifyEmailPublic(userIdToVerify, codeToVerify);
        
        if (result.success) {
          setSuccess(true);
          setMessage("Email verified successfully!");
          
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setError(result.error || "Failed to verify email");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during verification");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [userId, code, searchParams, verifyEmailPublic, navigate]);
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
          {loading ? (
             <div className="p-12 text-center space-y-8">
                <div className="flex justify-center">
                   <OrbitProgress color="hsl(var(--primary))" size="large" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Verifying...</h2>
                  <p className="text-muted-foreground font-medium">Please wait while we confirm your identity.</p>
                </div>
             </div>
          ) : (
            <>
              <CardHeader className="text-center pt-12 pb-6 px-8">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, delay: 0.2 }}
                  className={`mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-inner ${
                    success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {success ? <CheckCircle className="h-12 w-12" /> : <XCircle className="h-12 w-12" />}
                </motion.div>
                <CardTitle className="text-3xl font-black tracking-tight mb-3 uppercase">
                  {success ? "Success" : "Auth Failed"}
                </CardTitle>
                <CardDescription className="text-lg font-medium leading-relaxed">
                  {success ? message : error}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6 px-8 pb-12">
                {success ? (
                   <div className="space-y-4">
                      <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
                        <p className="text-sm font-bold text-green-600/80">
                          Redirecting to login...
                        </p>
                      </div>
                      <Button 
                        onClick={() => navigate("/login")} 
                        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all group"
                      >
                        Enter Marketplace
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </Button>
                   </div>
                ) : (
                  <div className="space-y-4">
                    <Button 
                      onClick={() => navigate("/resend-verification")} 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl"
                    >
                      Request New Link
                    </Button>
                    <Button 
                      onClick={() => navigate("/login")} 
                      variant="ghost" 
                      className="w-full h-12 text-muted-foreground hover:text-foreground font-bold"
                    >
                      Back to Login
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default PublicVerifyEmail;