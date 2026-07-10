import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Shield,
  Key,
  Quote,
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";

const HERO_IMAGE = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop"; 

import userService from '@/api/UserService.js'; 

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

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(
      /[!@#$%^&*]/,
      "Password must contain at least one special character (!@#$%^&*)"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL path
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseType, setResponseType] = useState<'success' | 'error'>('success');
  const [responseTitle, setResponseTitle] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
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

  const password = form.watch("password");

  const passwordChecks = {
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    letter: /[a-zA-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setTokenLoading(false);
      setTokenValid(false);
      setError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token]);

  const validateToken = async (token: string) => {
    try {
      const response = await userService.validateResetToken(token);
      if (response.data.success) {
        setTokenValid(true);
        // Set email if returned from backend
        if (response.data.email) {
          setEmail(response.data.email);
        }
      } else {
        setTokenValid(false);
        setError('This reset link has expired or is invalid. Please request a new password reset.');
      }
    } catch (err: any) {
      setTokenValid(false);
      setError(err.response?.data?.message || 'Failed to validate reset token');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsSubmitting(true);
    setShowFullLoader(true);
    setLoaderMessage('Resetting your password...');
    setError('');

    const loadingSteps = [
      { message: "Validating new password...", duration: 800 },
      { message: "Securely updating your password...", duration: 1200 },
      { message: "Finalizing reset...", duration: 1000 },
    ];

    try {
      for (const step of loadingSteps) {
        setLoaderMessage(step.message);
        await new Promise(resolve => setTimeout(resolve, step.duration));
      }

      const response = await userService.resetPassword(
        token,
        values.password,
        values.confirmPassword
      );

      if (response.data.success) {
        setLoaderMessage('Password reset successful!');
        await new Promise(resolve => setTimeout(resolve, 800));

        setSuccess(true);
        setResponseType('success');
        setResponseTitle('Password Reset!');
        setResponseMessage('Your password has been reset successfully. You can now log in with your new password.');
        setShowResponseModal(true);
        toast({
          title: "Password Reset Successful",
          description: "You can now log in with your new password.",
          variant: "default",
          duration: 5000,
        });
        setTimeout(() => {
          setShowFullLoader(false);
          navigate('/login', { 
            state: { 
              passwordResetSuccess: true,
              email: email 
            } 
          });
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setShowFullLoader(false);
      setIsSubmitting(false);
      
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Failed to reset password';
      
      setError(errorMessage);
      setResponseType('error');
      setResponseTitle('Reset Failed');
      setResponseMessage(errorMessage);
      setShowResponseModal(true);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      });
    }
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FullPageLoader message="Validating reset link..." />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-xl shadow-strong p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Invalid Reset Link</h1>
            <p className="text-muted-foreground mb-6">
              {error || 'This password reset link has expired or is invalid.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate('/forgot-password')}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Left Side: Visual / Support (Hidden on mobile) */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[45%] relative bg-muted overflow-hidden"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <img 
          src={HERO_IMAGE} 
          alt="Hera Collection Luxury"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Top Logo Overlay */}
        <div className="absolute top-12 left-12 z-20">
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

        {/* Bottom Testimonial Overlay */}
        <div className="absolute bottom-20 left-12 right-12 z-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl"
          >
            <Quote className="h-10 w-10 text-primary mb-6 opacity-50" />
            <p className="text-xl text-white font-medium leading-relaxed mb-6">
              "Security is our top priority. Your new password will be encrypted using industry-standard protocols to ensure your collections remain private."
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 border border-primary/50" />
              <div>
                <h4 className="text-white font-bold">Hera Security</h4>
                <p className="text-white/60 text-sm italic">Trusted Shield</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side: Reset Password Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[55%] flex flex-col justify-center items-center px-6 md:px-12 lg:px-20 relative bg-background"
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

        <div className="w-full max-w-[440px] py-12">
          {/* Form Header */}
          <div className="mb-10">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-foreground mb-3"
            >
              Secure Reset
            </motion.h1>
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Choose a strong password to protect your account.
            </motion.p>
             {email && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-2xl">
                <span className="text-sm font-bold text-muted-foreground grayscale">
                  For: <span className="text-foreground">{email}</span>
                </span>
              </div>
            )}
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
                  <h3 className="text-2xl font-black text-foreground mb-4 uppercase tracking-tighter">Success!</h3>
                  <p className="text-muted-foreground font-medium mb-8 text-lg">
                    Your password has been updated securely. Redirecting you to sign in...
                  </p>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/70 font-semibold">New Password</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Min. 8 characters"
                                  className="h-14 pl-12 pr-12 rounded-2xl border-border bg-secondary/5 transition-all focus:ring-primary/20 focus:border-primary"
                                  disabled={isSubmitting}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                              </div>
                            </FormControl>
                             {/* Password Strength Indicator */}
                            {password && (
                              <div className="mt-4 space-y-3 p-4 bg-muted/30 rounded-2xl">
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex gap-1">
                                  {[1, 2, 3, 4].map((step) => {
                                    const score = Object.values(passwordChecks).filter(Boolean).length;
                                    const active = score >= step;
                                    return (
                                      <div 
                                        key={step}
                                        className={`h-full flex-1 rounded-full transition-all duration-500 ${
                                          active 
                                            ? score <= 2 ? 'bg-orange-500' : 'bg-primary' 
                                            : 'bg-muted'
                                        }`} 
                                      />
                                    );
                                  })}
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                   {Object.entries(passwordChecks).map(([key, isValid]) => (
                                    <div key={key} className={`flex items-center gap-2 text-xs font-bold ${isValid ? "text-foreground" : "text-muted-foreground/50"}`}>
                                      <div className={`h-1.5 w-1.5 rounded-full ${isValid ? 'bg-primary' : 'bg-muted'}`} />
                                      {key === "length" && "8+ characters"}
                                      {key === "number" && "Numbers"}
                                      {key === "letter" && "Letters"}
                                      {key === "special" && "Symbols"}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/70 font-semibold">Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Must match exactly"
                                  className="h-14 pl-12 pr-12 rounded-2xl border-border bg-secondary/5 transition-all focus:ring-primary/20 focus:border-primary"
                                  disabled={isSubmitting}
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
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
                        {isSubmitting ? "Resetting..." : "Update Password"}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto py-8">
            <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Cancel & Return to Login
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


export default ResetPassword;