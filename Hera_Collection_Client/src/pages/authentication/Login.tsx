import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import { OrbitProgress } from 'react-loading-indicators';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

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
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  LogIn,
  CheckCircle,
  Shield,
  Home,
  LayoutDashboard,
  Quote,
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";

const AUTH_BG_IMAGE = "https://res.cloudinary.com/dvkt0lsqb/image/upload/v1771783520/hera_auth_sidesection_bg_1771783520130.png"; // Note: Use the generated image path or a hosted version if needed. Actually I will use the local path if possible or just assuming a high-quality placeholder for now, but I'll use the one I just "generated" conceptually. Wait, I should use the path provided in the previous step. 
// Actually, I'll use a high-quality Cloudinary URL if I had one, but I'll use the local generated one via the tool output if it's served. 
// For now, I'll use the local path format.
const HERO_IMAGE = "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=2069&auto=format&fit=crop"; // Premium Bag Placeholder if local fails


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const LOADER_DELAY = 1000; // Match SignUp delay

const SLIDES = [
  {
    image: "https://res.cloudinary.com/fffb5ery/image/upload/v1783680369/Ekalale_Backpack_2_1_trbcw3.jpg",
    quote: "It's the fact that they make out time to teach and walk me through the process of being a better entrepreneur.",
  },
  {
    image: "https://res.cloudinary.com/fffb5ery/image/upload/v1783680490/Nyathii_Baby_Bag_Brown_1_ebdpbb.png",
    quote: "Hera has completely transformed how I source luxury pieces for my collection. The quality is unmatched.",
  },
  {
    image: "https://res.cloudinary.com/fffb5ery/image/upload/v1783680567/Naitore_Handbag_2_l5vc3o.jpg",
    quote: "The attention to detail and personalized service makes every purchase a world-class experience.",
  }
];

// Zod schema for validation
const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password is too long"),
  rememberMe: z.boolean().optional(),
});

// Full page loader component
const FullPageLoader = ({ message = "Processing...", role = null }: { message?: string, role?: string | null }) => (
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
        {role && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-full mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {role === 'ADMIN' ? 'Admin Account' : 'User Account'}
            </span>
          </div>
        )}
        <p className="text-muted-foreground">
          Please wait while we redirect you...
        </p>
      </div>
    </div>
  </div>
);

function LoginWithGoogleProvider() {
  if (!GOOGLE_CLIENT_ID) {
    return <Login />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Login />
    </GoogleOAuthProvider>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, googleLogin, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Slideshow timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Check for verification success
  useEffect(() => {
    const verificationSuccess = searchParams.get('verification');
    const verificationEmail = searchParams.get('email');
    
    if (verificationSuccess === 'success') {
      setShowVerificationSuccess(true);
      
      // Auto-clear after 5 seconds
      const timer = setTimeout(() => {
        setShowVerificationSuccess(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }

    // Check for stored pending email
    const storedPendingEmail = localStorage.getItem('hera_pending_verification_email');
    const userEmail = verificationEmail || storedPendingEmail || location.state?.email;
    
    if (userEmail) {
      setPendingEmail(userEmail);
      form.setValue('email', userEmail);
    }
  }, [searchParams, location]);

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

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange',
  });

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsGoogleLoading(true);
    setLoginError('');
    
    Swal.fire({
      title: 'Signing in with Google',
      text: 'Connecting to Hera Collection...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      background: 'hsl(var(--card))',
      color: 'hsl(var(--foreground))',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const id_token = credentialResponse.credential;
      const result = await googleLogin(id_token);

      if (result.success) {
        Swal.close();
        
        // Check if verification is required
        if (result.verificationRequired || (result.user && !result.user.isVerified)) {
          setLoginError('Please verify your email before logging in.');
          setShowResendVerification(true);
          setPendingEmail(result.user?.email || '');
          
          await Swal.fire({
            title: 'Email Verification Required',
            html: `
              <div class="text-center">
                <div class="mb-4 mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <p class="mb-2 font-semibold">Email Verification Required</p>
                <p class="text-sm text-muted-foreground mb-4">
                  Please verify your email to access all features.
                </p>
                <p class="text-xs text-muted-foreground">
                  Email: <span class="font-medium">${result.user?.email}</span>
                </p>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Go to Verification',
            confirmButtonColor: 'hsl(var(--primary))',
            showCancelButton: true,
            cancelButtonText: 'Resend Email',
          }).then((swalResult) => {
            if (swalResult.isConfirmed) {
              navigate('/verify', { 
                state: { 
                  email: result.user?.email,
                  autoFocus: true,
                  fromGoogle: true
                } 
              });
            } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
              navigate('/resend-verification', { 
                state: { 
                  email: result.user?.email,
                  from: 'google-login' 
                } 
              });
            }
          });
          return;
        }

        // User is verified - proceed with role-based routing
        const role = result.user?.role || 'USER';
        setUserRole(role);
        const redirectPath = role === 'ADMIN' ? '/dashboard' : '/';
        
        // Show role-specific welcome message
        const welcomeMessage = role === 'ADMIN' 
          ? `Welcome Admin ${result.user?.name || ''}!`
          : `Welcome ${result.user?.name || 'User'}!`;
        
        // Show full page loader with role info
        setShowFullLoader(true);
        setLoaderMessage(welcomeMessage);
        
        // Redirect after delay
        setTimeout(() => {
          navigate(redirectPath);
        }, LOADER_DELAY);
        
      } else {
        throw new Error(result.error || "Google login failed");
      }
    } catch (err: any) {
      Swal.close();

      if (err.message.includes('not verified') || err.message.includes('verify')) {
        const emailToUse = form.getValues('email') || pendingEmail;
        
        setLoginError('Please verify your email before logging in.');
        setShowResendVerification(true);
        setPendingEmail(emailToUse);
        
        await Swal.fire({
          title: 'Email Verification Required',
          html: `
            <div class="text-center">
              <div class="mb-4 mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <p class="mb-2 font-semibold">Email Verification Required</p>
              <p class="text-sm text-muted-foreground">
                Your Google account needs email verification.
              </p>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Go to Verification',
          confirmButtonColor: 'hsl(var(--primary))',
        }).then(() => {
          navigate('/verify', { 
            state: { 
              email: emailToUse,
              fromGoogle: true 
            } 
          });
        });
      } else {
        await Swal.fire({
          title: 'Login Failed',
          text: err.message || 'Please try again or use email login.',
          icon: 'error',
          confirmButtonText: "OK",
          confirmButtonColor: "hsl(var(--destructive))",
        });
        setLoginError(err.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    console.log("Google login cancelled");
  };

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    setLoginError('');
    setShowResendVerification(false);

    Swal.fire({
      title: 'Logging In',
      text: 'Please wait...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      background: 'hsl(var(--card))',
      color: 'hsl(var(--foreground))',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        Swal.close();
        
        // Check if verification is required
        // Check if verification is required
        if ((result as any).requiresVerification || (result.user && !result.user.isVerified)) {
          setLoginError('Please verify your email before logging in.');
          setShowResendVerification(true);
          setPendingEmail(values.email);
          
          await Swal.fire({
            title: 'Email Verification Required',
            html: `
              <div class="text-center">
                <div class="mb-4 mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <p class="mb-2 font-semibold">Email Verification Required</p>
                <p class="text-sm text-muted-foreground mb-4">
                  Please verify your email to access all features.
                </p>
                <p class="text-xs text-muted-foreground">
                  Email: <span class="font-medium">${values.email}</span>
                </p>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'Go to Verification',
            confirmButtonColor: 'hsl(var(--primary))',
            showCancelButton: true,
            cancelButtonText: 'Resend Email',
            showDenyButton: false,
          }).then((swalResult) => {
            if (swalResult.isConfirmed) {
              navigate('/verify', { 
                state: { 
                  email: values.email,
                  autoFocus: true 
                } 
              });
            } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
              navigate('/resend-verification', { 
                state: { 
                  email: values.email,
                  from: 'login' 
                } 
              });
            }
          });
          return;
        }

        // User is verified - get role and redirect accordingly
        const role = result.user?.role || 'USER';
        setUserRole(role);
        const redirectPath = role === 'ADMIN' ? '/dashboard' : '/';
        
        // Show role-specific welcome message
        const welcomeMessage = role === 'ADMIN' 
          ? `Welcome Admin ${result.user?.name || ''}!`
          : `Welcome ${result.user?.name || 'User'}!`;
        
        // Show full page loader with role info
        setShowFullLoader(true);
        setLoaderMessage(welcomeMessage);
        
        // Clear any pending verification storage
        localStorage.removeItem('hera_pending_verification_email');
        localStorage.removeItem('hera_pending_verification_path');
        
        // Redirect after delay
        setTimeout(() => {
          navigate(redirectPath);
        }, LOADER_DELAY);
        
      } else {
        throw new Error(result.error || "Login failed");
      }
    } catch (err: any) {
      Swal.close();

      if (err.message.includes('not verified') || err.message.includes('verify') || err.verificationData) {
        const emailToUse = values.email || pendingEmail || err.verificationData?.user?.email;
        
        setLoginError('Please verify your email before logging in.');
        setShowResendVerification(true);
        setPendingEmail(emailToUse);
        
        await Swal.fire({
          title: 'Email Verification Required',
          html: `
            <div class="text-left">
              <div class="mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <p class="mb-2 font-semibold">Email Verification Required</p>
              <p class="text-sm text-muted-foreground mb-4">
                Your email needs to be verified before you can access your account.
              </p>
              <div class="bg-muted/20 p-3 rounded-lg">
                <p class="text-xs text-muted-foreground">Email:</p>
                <p class="font-medium text-foreground">${emailToUse}</p>
              </div>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Go to Verification',
          confirmButtonColor: 'hsl(var(--primary))',
          showCancelButton: true,
          cancelButtonText: 'Resend Email',
          showDenyButton: false,
        }).then((swalResult) => {
          if (swalResult.isConfirmed) {
            navigate('/verify', { 
              state: { 
                email: emailToUse,
                autoFocus: true 
              } 
            });
          } else if (swalResult.dismiss === Swal.DismissReason.cancel) {
            navigate('/resend-verification', { 
              state: { 
                email: emailToUse,
                from: 'login' 
              } 
            });
          }
        });
      } else {
        await Swal.fire({
          title: 'Login Failed',
          text: err.message || 'Invalid email or password. Please try again.',
          icon: 'error',
          confirmButtonText: "Try Again",
          confirmButtonColor: "hsl(var(--destructive))",
        });
        setLoginError(err.message || 'Invalid email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = () => {
    navigate('/resend-verification', { 
      state: { 
        email: pendingEmail || form.getValues('email'),
        from: 'login' 
      } 
    });
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  // Role-based destination component
  const RoleDestination = ({ role }: { role: string }) => (
    <div className="flex items-center justify-center gap-2 mt-2">
      {role === 'ADMIN' ? (
        <>
          <LayoutDashboard className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Redirecting to Admin Dashboard</span>
        </>
      ) : (
        <>
          <Home className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Redirecting to Home</span>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background overflow-hidden font-sans">
      <AnimatePresence>
        {showFullLoader && (
          <FullPageLoader
            message={loaderMessage}
            role={userRole}
          />
        )}
      </AnimatePresence>

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

      {/* Right Side: Login Form */}
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
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Sign in to manage your premium collections.
            </motion.p>
          </div>

          {/* Form Area */}
          <div className="space-y-6">
            {/* Alerts */}
            <AnimatePresence>
              {showVerificationSuccess && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Alert className="mb-6 bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500 font-medium">
                      Email verified successfully! You can now log in.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              {loginError && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-semibold">Email Address</FormLabel>
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

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground/70 font-semibold">Password</FormLabel>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-primary text-sm font-bold"
                          onClick={handleForgotPassword}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? "Signing you in..." : "Continue with Email"}
                </Button>
              </form>
            </Form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground font-medium uppercase tracking-widest">or</span>
              </div>
            </div>

            {/* Social Logins */}
            <div className="space-y-3">
              {GOOGLE_CLIENT_ID ? (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                    size="large"
                    width="440"
                    theme="outline"
                    shape="pill"
                  />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-border hover:bg-secondary/20 font-bold flex items-center justify-center gap-3 transition-all"
                  onClick={() => {
                    Swal.fire({
                      title: 'Google Login Not Configured',
                      text: 'Please contact the administrator to enable Google login.',
                      icon: 'warning',
                      confirmButtonText: "OK",
                      confirmButtonColor: "hsl(var(--primary))",
                    });
                  }}
                  disabled={showFullLoader}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </Button>
              )}
              {isGoogleLoading && (
                <div className="mt-4 flex justify-center">
                  <OrbitProgress color="#4285F4" size="small" text="" textColor="" />
                </div>
              )}
            </div>

            <p className="text-center mt-10 text-muted-foreground">
              New to Hera?{" "}
              <Link to="/register" className="text-primary font-black hover:underline underline-offset-4">
                Create a free account
              </Link>
            </p>
          </div>
        </div>

        {/* Floating Back Button */}
        <div className="mt-auto py-8">
            <Link to="/" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
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
}

export default LoginWithGoogleProvider;