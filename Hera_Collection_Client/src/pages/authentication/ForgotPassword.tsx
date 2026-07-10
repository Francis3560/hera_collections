import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  Shield,
  Lock,
  Key,
  CheckCircle,
  Quote,
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";

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

import userService from '@/api/UserService.js'; 

// Full page loader component
const FullPageLoader = ({ message = "Processing..." }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center space-y-6">
      <OrbitProgress 
        color="#32cd32" 
        size="medium" 
        text="" 
        textColor=""
      />
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
          {message}
        </h2>
        <p className="text-muted-foreground">
          Please wait while we process your request...
        </p>
      </div>
    </div>
  </div>
);

// Response Modal Component
const ResponseModal = ({ 
  type, 
  title, 
  message, 
  isVisible, 
  onClose 
}: { 
  type: 'success' | 'error';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}) => {
  if (!isVisible) return null;

  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' 
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30';
  
  const textColor = type === 'success' 
    ? 'text-green-700 dark:text-green-300' 
    : 'text-red-700 dark:text-red-300';

  return (
    <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
      <div className={`rounded-lg border p-4 shadow-lg ${bgColor} max-w-sm`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-full p-1 ${type === 'success' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-semibold ${textColor}`}>{title}</h3>
            <p className={`text-sm mt-1 ${type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <AlertCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Zod schema for validation
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'success' | 'error'>('success');
  const [responseTitle, setResponseTitle] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

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

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    setShowFullLoader(true);
    setLoaderMessage('Sending reset password email...');
    setError('');
    setSuccess(false);

    const loadingSteps = [
      { message: "Validating your email...", duration: 800 },
      { message: "Checking account status...", duration: 1000 },
      { message: "Sending reset email...", duration: 1200 },
    ];

    try {
      // Show loading steps
      for (const step of loadingSteps) {
        setLoaderMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      // Use UserService to send reset password email
      const response = await userService.requestPasswordReset(values.email);

      if (response.data.success) {
        setLoaderMessage('Reset email sent successfully!');
        await new Promise(resolve => setTimeout(resolve, 800));

        setSuccess(true);
        
        // Show response modal
        setResponseType('success');
        setResponseTitle('Check Your Email');
        setResponseMessage('We\'ve sent a password reset link to your email address.');
        setShowResponseModal(true);

        // Show toast
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for the password reset link.",
          variant: "default",
          duration: 5000,
        });

        // Navigate after delay
        setTimeout(() => {
          setShowFullLoader(false);
          navigate('/login', { 
            state: { 
              resetEmailSent: true,
              email: values.email 
            } 
          });
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      setShowFullLoader(false);
      setIsSubmitting(false);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to send password reset email';
      
      setError(errorMessage);
      
      // Show response modal
      setResponseType('error');
      setResponseTitle('Reset Failed');
      setResponseMessage(errorMessage);
      setShowResponseModal(true);

      // Show toast
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden font-sans">
      <AnimatePresence>
        {showFullLoader && <FullPageLoader message={loaderMessage} />}
      </AnimatePresence>

       {/* Response Modal */}
      <ResponseModal
        type={responseType}
        title={responseTitle}
        message={responseMessage}
        isVisible={showResponseModal}
        onClose={() => setShowResponseModal(false)}
      />

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

      {/* Right Side: Forgot Password Form */}
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
              animate={{ width: "100%" }}
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
          {/* Form Header */}
          <div className="mb-10">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-foreground mb-3"
            >
              Account Recovery
            </motion.h1>
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Enter the email associated with your account.
            </motion.p>
          </div>

          {/* Form Area or Success Area */}
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
                  <h3 className="text-2xl font-black text-foreground mb-4 font-sans uppercase tracking-tighter">Check Your Email</h3>
                  <p className="text-muted-foreground font-medium mb-8">
                    We've sent a recovery link to <span className="text-foreground font-bold">{form.getValues('email')}</span>. 
                    Please follow the instructions in the email.
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold"
                    >
                      Back to Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        setSuccess(false);
                        form.reset();
                      }}
                      variant="ghost"
                      className="w-full text-muted-foreground hover:text-foreground font-bold"
                    >
                      Try another email
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/70 font-semibold">Verification Email</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  placeholder="name@company.com"
                                  className="h-14 pl-12 rounded-2xl border-border bg-secondary/5 transition-all focus:ring-primary/20 focus:border-primary"
                                  disabled={isSubmitting}
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white"
                        disabled={isSubmitting || !form.formState.isValid}
                      >
                        {isSubmitting ? "Sending..." : "Send Recovery Link"}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <div className="text-center pt-6 border-t border-border">
                <p className="text-muted-foreground">
                  Remembered your password?{" "}
                  <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-auto py-8">
            <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {isSubmitting && !showFullLoader && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-[100]">
           <OrbitProgress color="hsl(var(--primary))" size="large" />
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
