import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Shield,
  ShieldCheck,
  ArrowRight,
  LogIn,
  Quote
} from 'lucide-react';
import { OrbitProgress } from 'react-loading-indicators';
import Swal from 'sweetalert2';
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


const TOKEN_EXPIRY_TIME = 600; 
const RESEND_COOLDOWN = 60; 
const STORAGE_KEYS = {
  VERIFICATION_START_TIME: 'hera_verification_start_time',
  VERIFICATION_EMAIL: 'hera_pending_verification_email',
  VERIFICATION_CODE: 'hera_verification_code_attempts',
  USER_DATA: 'hera_user'
};

function VerifyEmailCode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { 
    user, 
    pendingVerificationEmail, 
    verifyEmail, 
    resendVerificationEmail,
    verifyEmailPublic,
    setPendingVerificationEmail,
    clearPendingVerification,
    logout,
    isAuthenticated
  } = useAuth();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'initial' | 'verifying' | 'success' | 'failed' | 'expired'>('initial');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(TOKEN_EXPIRY_TIME);
  const [isExpired, setIsExpired] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [isPublicVerification, setIsPublicVerification] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState('Verifying email...');
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
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const resendCooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize verification timer from storage
  const initializeTimer = useCallback(() => {
    const storedStartTime = localStorage.getItem(STORAGE_KEYS.VERIFICATION_START_TIME);
    
    if (storedStartTime) {
      const startTime = parseInt(storedStartTime);
      const currentTime = Math.floor(Date.now() / 1000);
      const elapsedTime = currentTime - startTime;
      const remainingTime = Math.max(0, TOKEN_EXPIRY_TIME - elapsedTime);
      
      setCountdown(remainingTime);
      setIsExpired(remainingTime <= 0);
      
      if (remainingTime <= 0) {
        setStatus('expired');
        setMessage('Verification code has expired. Please request a new one.');
      }
    } else {
      // Start new timer
      const startTime = Math.floor(Date.now() / 1000);
      localStorage.setItem(STORAGE_KEYS.VERIFICATION_START_TIME, startTime.toString());
      setCountdown(TOKEN_EXPIRY_TIME);
    }
  }, []);

  // Check for public verification parameters
  useEffect(() => {
    const urlUserId = searchParams.get('userId');
    const urlCode = searchParams.get('code');
    const urlEmail = searchParams.get('email');

    if (urlUserId && urlCode) {
      setIsPublicVerification(true);
      setUserId(parseInt(urlUserId));
      setCode(urlCode.split(''));
      
      // Auto-verify if we have both userId and code
      setTimeout(() => {
        handlePublicVerify(parseInt(urlUserId), urlCode);
      }, 500);
    } else if (urlEmail) {
      setEmail(urlEmail);
      setPendingVerificationEmail(urlEmail);
      localStorage.setItem(STORAGE_KEYS.VERIFICATION_EMAIL, urlEmail);
    }
  }, [searchParams, setPendingVerificationEmail]);

  // Initialize email and timer
  useEffect(() => {
    const initializeEmail = () => {
      const stateEmail = location.state?.email;
      const pendingEmail = pendingVerificationEmail;
      const userEmail = user?.email;
      const storedEmail = localStorage.getItem(STORAGE_KEYS.VERIFICATION_EMAIL);
      const emailToUse = stateEmail || pendingEmail || userEmail || storedEmail || '';
      
      if (emailToUse) {
        setEmail(emailToUse);
        if (!pendingVerificationEmail && emailToUse !== user?.email) {
          setPendingVerificationEmail(emailToUse);
        }
        if (!storedEmail) {
          localStorage.setItem(STORAGE_KEYS.VERIFICATION_EMAIL, emailToUse);
        }
      }
    };

    initializeEmail();
    initializeTimer();
  }, [location, pendingVerificationEmail, user, setPendingVerificationEmail, initializeTimer]);

  // Auto-redirect if already verified and logged in
  useEffect(() => {
    if (isAuthenticated && user?.isVerified) {
      // If user is already logged in and verified, redirect based on role
      const userRole = user?.role || 'USER';
      const redirectPath = userRole === 'ADMIN' ? '/dashboard' : '/';
      navigate(redirectPath);
    }
  }, [isAuthenticated, user, navigate]);

  // Countdown timer with persistent timing
  useEffect(() => {
    if (isExpired || status === 'success' || isPublicVerification) return;

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current as NodeJS.Timeout);
          setIsExpired(true);
          setStatus('expired');
          setMessage('Verification code has expired. Please request a new one.');
          localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
          return 0;
        }
        const newCountdown = prev - 1;
        
        // Update remaining time in storage for persistence
        const storedStartTime = localStorage.getItem(STORAGE_KEYS.VERIFICATION_START_TIME);
        if (storedStartTime) {
          const startTime = parseInt(storedStartTime);
          const currentTime = Math.floor(Date.now() / 1000);
          const elapsedTime = currentTime - startTime;
          if (elapsedTime >= TOKEN_EXPIRY_TIME) {
            localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
          }
        }
        
        return newCountdown;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isExpired, status, isPublicVerification]);

  // Resend cooldown with persistence
  useEffect(() => {
    const storedResendTime = localStorage.getItem('hera_resend_cooldown');
    if (storedResendTime) {
      const resendTime = parseInt(storedResendTime);
      const currentTime = Math.floor(Date.now() / 1000);
      const remainingCooldown = Math.max(0, resendTime - currentTime);
      
      if (remainingCooldown > 0) {
        setResendCooldown(remainingCooldown);
        setResendDisabled(true);
      }
    }

    if (resendCooldown <= 0) {
      setResendDisabled(false);
      localStorage.removeItem('hera_resend_cooldown');
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current);
      }
      return;
    }

    resendCooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        const newCooldown = Math.max(0, prev - 1);
        if (newCooldown === 0) {
          localStorage.removeItem('hera_resend_cooldown');
        }
        return newCooldown;
      });
    }, 1000);

    return () => {
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current);
      }
    };
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePublicVerify = async (userId: number, code: string) => {
    setIsSubmitting(true);
    setStatus('verifying');

    Swal.fire({
      title: 'Verifying Email',
      text: 'Please wait...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (userId === null) {
        throw new Error('User identification missing.');
      }
      const result = await verifyEmailPublic(userId.toString(), code);

      if (result.success) {
        setStatus('success');
        
        // Clear verification storage
        localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
        localStorage.removeItem(STORAGE_KEYS.VERIFICATION_EMAIL);
        
        const successMessage = 'Email verified successfully! You can now log in.';
        setMessage(successMessage);

        await Swal.fire({
          title: 'Email Verified!',
          html: `
            <div class="text-center">
              <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p class="mb-2 font-semibold">Email Verified Successfully!</p>
              <p class="text-sm text-muted-foreground">
                Your email has been verified. You can now log in to your account.
              </p>
            </div>
          `,
          icon: 'success',
          showConfirmButton: true,
          confirmButtonText: 'Go to Login',
          confirmButtonColor: 'hsl(var(--primary))',
          timer: 3000,
          timerProgressBar: true,
          willClose: () => {
            navigate('/login?verification=success');
          },
        });

        // ALWAYS redirect to login after public verification
        navigate('/login?verification=success');
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error: any) {
      setStatus('failed');
      setMessage(error.message || 'Failed to verify email. Please try again.');
      
      await Swal.fire({
        title: 'Verification Failed',
        text: error.message || 'Invalid verification link.',
        icon: 'error',
        confirmButtonColor: 'hsl(var(--destructive))',
      });
    } finally {
      setIsSubmitting(false);
      Swal.close();
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value !== '' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit !== '') && index === 5) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (e.key === 'Enter' && code.every(digit => digit !== '')) {
      handleSubmit(code.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      inputsRef.current[5]?.focus();
    }
  };

const handleSubmit = async (submittedCode: string | null = null) => {
  const verificationCode = submittedCode || code.join('');
  
  if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
    Swal.fire({
      title: 'Invalid Code',
      text: 'Please enter a valid 6-digit verification code.',
      icon: 'warning',
      confirmButtonColor: 'hsl(var(--primary))',
    });
    return;
  }

  if (isExpired) {
    Swal.fire({
      title: 'Code Expired',
      text: 'This verification code has expired. Please request a new one.',
      icon: 'error',
      confirmButtonColor: 'hsl(var(--destructive))',
    });
    return;
  }

  setIsSubmitting(true);
  setStatus('verifying');

  try {
    // Use PUBLIC verification since user isn't logged in after registration
    const result = await verifyEmailPublic(email, verificationCode);

    if (result.success) {
      setStatus('success');
      
      // Clear verification storage
      localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
      localStorage.removeItem(STORAGE_KEYS.VERIFICATION_EMAIL);
      localStorage.removeItem('hera_resend_cooldown');
      
      // Show success message
      await Swal.fire({
        title: 'Email Verified!',
        html: `
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <p class="mb-2 font-semibold">Registration Complete!</p>
            <p class="text-sm text-muted-foreground">
              Your email has been verified successfully.
            </p>
            <p class="text-xs text-primary mt-2">You can now log in to your account.</p>
          </div>
        `,
        icon: 'success',
        showConfirmButton: true,
        confirmButtonText: 'Go to Login',
        confirmButtonColor: 'hsl(var(--primary))',
        timer: 3000,
        timerProgressBar: true,
        willClose: () => {
          navigate('/login?verification=success&email=' + encodeURIComponent(email));
        },
      });

      // ALWAYS redirect to login after verification
      navigate('/login?verification=success&email=' + encodeURIComponent(email));
      
    } else {
      throw new Error(result.error || "Verification failed");
    }
  } catch (error: any) {
    setStatus('failed');
    setMessage(error.message || 'Failed to verify email. Please try again.');
    setCode(['', '', '', '', '', '']);
    inputsRef.current[0]?.focus();
    
    await Swal.fire({
      title: 'Verification Failed',
      text: error.message || 'Invalid verification code. Please try again.',
      icon: 'error',
      confirmButtonColor: 'hsl(var(--destructive))',
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handleResendCode = async () => {
    if (!email) {
      Swal.fire({
        title: 'Email Required',
        text: 'No email address found. Please try signing up again.',
        icon: 'error',
        confirmButtonColor: 'hsl(var(--destructive))',
      });
      return;
    }

    setIsResending(true);
    setResendDisabled(true);
    
    // Set cooldown end time in storage for persistence
    const cooldownEndTime = Math.floor(Date.now() / 1000) + RESEND_COOLDOWN;
    localStorage.setItem('hera_resend_cooldown', cooldownEndTime.toString());
    setResendCooldown(RESEND_COOLDOWN);

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        // Reset timer with new start time
        const startTime = Math.floor(Date.now() / 1000);
        localStorage.setItem(STORAGE_KEYS.VERIFICATION_START_TIME, startTime.toString());
        
        setCountdown(TOKEN_EXPIRY_TIME);
        setIsExpired(false);
        setStatus('initial');
        setCode(['', '', '', '', '', '']);
        if (inputsRef.current[0]) {
          inputsRef.current[0].focus();
        }
        
        await Swal.fire({
          title: 'Code Resent!',
          html: `
            <div class="text-left">
              <p class="mb-2">A new verification code has been sent to:</p>
              <p class="font-semibold text-primary">${email}</p>
              <p class="text-sm text-muted-foreground mt-2">Please check your inbox (and spam folder).</p>
              <p class="text-xs text-muted-foreground mt-1">The code will expire in 10 minutes.</p>
            </div>
          `,
          icon: 'success',
          confirmButtonColor: 'hsl(var(--primary))',
        });
      } else {
        throw new Error(result.error || 'Failed to resend code');
      }
    } catch (error: any) {
      setResendDisabled(false);
      setResendCooldown(0);
      localStorage.removeItem('hera_resend_cooldown');
      
      await Swal.fire({
        title: 'Resend Failed',
        text: error.message || 'Could not resend verification code. Please try again.',
        icon: 'error',
        confirmButtonColor: 'hsl(var(--destructive))',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    // Clear all verification storage
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_EMAIL);
    localStorage.removeItem('hera_resend_cooldown');
    
    clearPendingVerification();
    navigate('/register');
  };

  const handleGoToLogin = () => {
    // Clear verification storage
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_EMAIL);
    localStorage.removeItem('hera_resend_cooldown');
    
    navigate('/login');
  };

  const handleLogout = () => {
    // Clear verification storage on logout
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_START_TIME);
    localStorage.removeItem(STORAGE_KEYS.VERIFICATION_EMAIL);
    localStorage.removeItem('hera_resend_cooldown');
    
    logout();
    navigate('/login');
  };

  // Auto-resend if requested
  useEffect(() => {
    if (location.state?.resend && email) {
      setTimeout(() => {
        handleResendCode();
      }, 1000);
    }
  }, [location.state?.resend, email]);

  // Auto-focus first input
  useEffect(() => {
    if (location.state?.autoFocus && inputsRef.current[0]) {
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    }
  }, [location.state?.autoFocus]);

  // Clean up storage on component unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (resendCooldownRef.current) {
        clearInterval(resendCooldownRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-background overflow-hidden font-sans">
      <AnimatePresence>
        {(showFullLoader || status === 'verifying') && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center z-[100]">
            <OrbitProgress color="hsl(var(--primary))" size="large" />
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-black mt-8 text-foreground uppercase tracking-tighter"
            >
              {loaderMessage || "Verifying..."}
            </motion.h2>
          </div>
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

      {/* Right Side: Verification Form */}
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
              animate={{ width: "66.66%" }}
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
              {isPublicVerification ? 'Verification' : 'Confirm Identity'}
            </motion.h1>
            <motion.p 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground"
            >
              {isPublicVerification 
                ? 'Complete your account setup.'
                : 'Enter the 6-digit code sent to your email.'
              }
            </motion.p>
            {email && !isPublicVerification && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-2xl">
                <Mail className="h-4 w-4 text-muted-foreground grayscale" />
                <span className="text-sm font-bold text-foreground">
                  {email}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
             {/* Public verification view */}
             {isPublicVerification ? (
              <div className="text-center space-y-6">
                {status === 'success' ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl"
                  >
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-bold text-foreground">Identity Verified</p>
                    <p className="text-muted-foreground mt-2 font-medium">Redirecting you to login...</p>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Please click the button below to verify your email address and activate your Hera account.
                    </p>
                    <Button
                      onClick={() => userId && handlePublicVerify(userId, code.join(''))}
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white"
                      disabled={isSubmitting}
                    >
                       Verify Now
                       <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Countdown Timer */}
                {!isExpired && status !== 'success' && (
                  <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center justify-between mb-3 text-sm font-bold">
                       <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Link Security Window:</span>
                      </div>
                      <span className={countdown < 60 ? 'text-destructive' : 'text-primary'}>
                        {formatTime(countdown)}
                      </span>
                    </div>
                    <Progress 
                      value={(countdown / TOKEN_EXPIRY_TIME) * 100} 
                      className="h-1.5"
                    />
                  </div>
                )}

                {/* Code Input */}
                {!isExpired && status !== 'success' && status !== 'failed' && (
                  <div className="space-y-6">
                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el: HTMLInputElement | null) => {
                            if (el) inputsRef.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="h-16 w-12 sm:w-14 text-center text-3xl font-black rounded-2xl border-2 border-border bg-secondary/5 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none"
                          disabled={isSubmitting}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handleSubmit()}
                      className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300 bg-primary hover:bg-primary/90 text-white"
                      disabled={code.join('').length !== 6 || isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Verify Code"}
                    </Button>
                  </div>
                )}

                {/* Status Messages */}
                {(status === 'expired' || status === 'failed') && (
                  <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-3xl flex flex-col items-center gap-4 text-center animate-in zoom-in duration-300">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <div>
                      <h4 className="font-black text-foreground uppercase tracking-tight">Access Error</h4>
                      <p className="text-sm text-destructive font-medium mt-1">{message}</p>
                    </div>
                  </div>
                )}

                {/* Resend Action */}
                <div className="pt-6 border-t border-border flex flex-col items-center gap-4">
                   <p className="text-muted-foreground font-medium">Didn't receive a code?</p>
                   <Button
                      onClick={handleResendCode}
                      variant="outline"
                      className="h-12 w-full rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5 font-bold gap-3"
                      disabled={resendDisabled || isResending || status === 'success'}
                    >
                      {isResending ? (
                        <OrbitProgress size="small" color="hsl(var(--primary))" />
                      ) : resendDisabled ? (
                        `Wait ${resendCooldown}s`
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Send New Code
                        </>
                      )}
                    </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 py-8 flex flex-col items-center gap-6">
            <Link to="/login" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
            
            {isAuthenticated && (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                disabled={isSubmitting}
              >
                Sign Out
              </Button>
            )}
        </div>
      </motion.div>
    </div>
  );
};


export default VerifyEmailCode;