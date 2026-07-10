import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { OrbitProgress } from "react-loading-indicators";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import 'react-phone-number-input/style.css';
import '@/components/ui/phone-input.css';
import PhoneInput from 'react-phone-number-input';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Quote,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

const darkLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/Hera-logo-white_zauldy.png";
const lightLogo = "https://res.cloudinary.com/fffb5ery/image/upload/v1783675392/HERA-logo-black_up39qn.png";

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


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const signupSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  phone_number: z
    .string()
    .min(10, "Phone number is too short")
    .max(15, "Phone number is too long"),
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
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

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

// Wrapper component to provide GoogleOAuthProvider
function SignupWithGoogleProvider() {
  if (!GOOGLE_CLIENT_ID) {
    return <Signup />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Signup />
    </GoogleOAuthProvider>
  );
}

function Signup() {
  const navigate = useNavigate();
  const { register, registerWithGoogle } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Creating your account...");
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

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone_number: "",
      password: "",
      terms: false,
    },
    mode: "onChange",
  });

  const password = form.watch("password");

  // Password validation checks
  const passwordChecks = {
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    letter: /[a-zA-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  // Handle Phone Number Change
  const handlePhoneNumberChange = (value: string | undefined) => {
    form.setValue('phone_number', value || "", { shouldValidate: true });
  };

const handleGoogleSuccess = async (credentialResponse: any) => {
  setIsGoogleLoading(true);
  setShowFullPageLoader(true);
  setLoaderMessage("Setting up your Google account...");
  
  try {
    const id_token = credentialResponse.credential;
    const result = await registerWithGoogle(id_token);

    if (result.success) {
      setLoaderMessage("Registration successful! Redirecting to verification...");

      setTimeout(() => {
        navigate("/verify", { 
          state: { 
            email: result.user?.email,
            autoFocus: true,
            requiresVerification: true,
            verificationRequired: (result as any).verificationRequired || true,
            verificationSent: (result as any).verificationSent || true,
            fromGoogle: true,
            isVerified: (result as any).isVerified || false
          } 
        });
      }, 1000);
    } else {
      throw new Error(result.error || "Google registration failed");
    }
  } catch (err: any) {
    setShowFullPageLoader(false);
    setIsGoogleLoading(false);
    
    alert(`Google Signup Failed: ${err.message || 'Please try again or use email signup.'}`);
  }
};

  const handleGoogleFailure = () => {
    // Minimal error handling for Google cancellation
    console.log("Google signup cancelled");
  };

const onSubmit = async (values: any) => {
  const { terms, ...userData } = values;
  setIsSubmitting(true);
  setShowFullPageLoader(true);
  setLoaderMessage("Creating your account...");

  try {
    const result = await register(userData);

    if (result.success) {
      setLoaderMessage("Registration successful! Redirecting to verification...");
      
      // Save email for verification
      localStorage.setItem('hera_pending_verification_email', values.email);
      
      setTimeout(() => {
        navigate("/verify", { 
          state: { 
            email: values.email,
            autoFocus: true,
            fromRegistration: true
          } 
        });
      }, 1000);
    } else {
      throw new Error(result.error || "Registration failed");
    }
  } catch (err: any) {
    setShowFullPageLoader(false);
    setIsSubmitting(false);
    
    let errorTitle = 'Registration Failed';
    let errorMessage = err.message;
    
    if (err.message.includes('already exists')) {
      errorTitle = 'Email Already Registered';
      errorMessage = 'This email is already associated with an account. Please log in or use a different email.';
    }
    
    alert(`${errorTitle}: ${errorMessage}`);
  }
};


  return (
    <div className="min-h-screen flex bg-background overflow-hidden font-sans">
      <AnimatePresence>
        {showFullPageLoader && <FullPageLoader message={loaderMessage} />}
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

      {/* Right Side: Signup Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[58%] h-screen flex flex-col items-center bg-background overflow-y-auto custom-scrollbar pt-12 pb-8 px-6 md:px-12 lg:px-20 relative"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden w-full max-w-[480px] mb-12">
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
              animate={{ width: "33.33%" }}
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
          <div className="mb-10 text-left">
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black tracking-tight text-foreground mb-3"
            >
              Create a Hera Account
            </motion.h1>
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              Start your premium shopping journey here.
            </motion.p>
          </div>

          {/* Form Area */}
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                   <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/70 font-semibold">
                          Full Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                           <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              placeholder="John Doe"
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
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground/70 font-semibold">
                          Phone Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                           <div className="relative group">
                            <PhoneInput
                              placeholder="Enter phone number"
                              defaultCountry="KE"
                              international
                              withCountryCallingCode
                              className="h-14 flex items-center rounded-lg border border-border bg-background transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary px-4 shadow-sm"
                              disabled={isSubmitting}
                              value={field.value}
                              onChange={handlePhoneNumberChange}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 font-semibold">
                        Email Address <span className="text-red-500">*</span>
                      </FormLabel>
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
                      <FormLabel className="text-foreground/70 font-semibold">
                        Create Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
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

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5 rounded-md border-2 border-primary/50 bg-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-medium text-muted-foreground">
                        I agree to the <Link to="/terms-of-service" className="text-primary font-bold hover:underline">Terms of Use</Link> and <Link to="/privacy-policy" className="text-primary font-bold hover:underline">Privacy Policy</Link>
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? "Creating your account..." : "Continue with Email"}
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

            {/* Social Signup */}
            <div className="flex justify-center">
               {GOOGLE_CLIENT_ID && (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleFailure}
                    size="large"
                    width="480"
                    theme="outline"
                    shape="pill"
                  />
                )}
            </div>

            <p className="text-center mt-10 text-muted-foreground">
              Already have a Hera account?{" "}
              <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">
                Sign in
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
      {isSubmitting && !showFullPageLoader && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-[100]">
           <OrbitProgress color="hsl(var(--primary))" size="large" />
        </div>
      )}
    </div>
  );
}

export default SignupWithGoogleProvider;