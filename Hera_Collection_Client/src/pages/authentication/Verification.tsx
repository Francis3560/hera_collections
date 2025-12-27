import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
  ShieldCheck,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { OrbitProgress } from 'react-loading-indicators';
import Swal from 'sweetalert2';

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
      const result = await verifyEmailPublic(userId, code);

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

  // Full page loader
  if (showFullLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop p-4">
        <div className="text-center space-y-6">
          <OrbitProgress 
            color="hsl(var(--primary))" 
            size="large" 
            text="" 
            textColor=""
          />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
              {loaderMessage}
            </h2>
            <p className="text-muted-foreground">
              Please wait while we complete the verification process...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Regular verification loader
  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop p-4">
        <div className="text-center space-y-6">
          <OrbitProgress 
            color="hsl(var(--primary))" 
            size="large" 
            text="" 
            textColor=""
          />
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
              Verifying Email
            </h2>
            <p className="text-muted-foreground">
              Please wait while we verify your email address...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop p-4">
      {/* Back button */}
      <div className="absolute top-6 left-6 flex gap-2">
        <Button
          variant="ghost"
          onClick={handleBackToSignup}
          className="gap-2"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Signup
        </Button>
        
        {isAuthenticated && (
          <Button
            variant="outline"
            onClick={handleLogout}
            size="sm"
            disabled={isSubmitting}
          >
            Logout
          </Button>
        )}
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
            {isPublicVerification ? 'Email Verification' : 'Verify Your Email'}
          </h1>
          <p className="text-muted-foreground">
            {isPublicVerification 
              ? 'Verifying your email address...'
              : 'Enter the 6-digit code sent to your email address'
            }
          </p>
          {email && !isPublicVerification && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-full">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Sent to: <span className="font-medium text-foreground">{email}</span>
              </span>
            </div>
          )}
        </div>

        <Card className="border border-border/50 shadow-strong backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-4">
            <CardTitle>
              {isPublicVerification ? 'Email Verification Link' : 'Email Verification'}
            </CardTitle>
            <CardDescription>
              {status === 'expired' 
                ? 'Your verification code has expired'
                : isPublicVerification
                ? 'Click below to verify your email'
                : `Enter the code below to verify your email`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Public verification view */}
            {isPublicVerification ? (
              <div className="text-center space-y-4">
                {status === 'success' ? (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">
                      Email verified successfully! Redirecting to login...
                    </AlertDescription>
                  </Alert>
                ) : status === 'failed' ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {message || 'Verification failed. Please try again.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <p className="text-muted-foreground">
                      Click the button below to verify your email address.
                    </p>
                    <Button
                      onClick={() => userId && handlePublicVerify(userId, code.join(''))}
                      className="w-full h-12 gradient-primary hover:shadow-glow"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        <>
                          Verify Email
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Status indicator for logged-in users */}
                {isAuthenticated && user && (
                  <div className="p-3 bg-muted/10 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm">
                          Status: <span className="font-medium">
                            {user.isVerified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {isAuthenticated ? 'Logged In' : 'Not Logged In'}
                      </span>
                    </div>
                    {!user.isVerified && (
                      <p className="text-xs text-muted-foreground mt-2">
                        You need to verify your email to access all features
                      </p>
                    )}
                  </div>
                )}

                {/* Countdown Timer */}
                {!isExpired && status !== 'success' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Code expires in:</span>
                      </div>
                      <span className={`font-semibold ${countdown < 60 ? 'text-destructive' : 'text-primary'}`}>
                        {formatTime(countdown)}
                      </span>
                    </div>
                    <Progress 
                      value={(countdown / TOKEN_EXPIRY_TIME) * 100} 
                      className="h-2"
                    />
                    {countdown < 60 && (
                      <p className="text-xs text-destructive text-center">
                        Hurry! Code will expire soon
                      </p>
                    )}
                  </div>
                )}

                {/* Code Input */}
                {!isExpired && status !== 'success' && status !== 'failed' && (
                  <div className="space-y-4">
                    <Label htmlFor="code-input" className="text-center block">
                      6-Digit Verification Code
                    </Label>
                    
                    <div className="flex justify-center gap-2" onPaste={handlePaste}>
                      {code.map((digit, index) => (
                        <Input
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
                          className="h-14 w-14 text-center text-2xl font-bold"
                          disabled={isSubmitting}
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                    
                    <div className="text-center space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Paste the entire code or type each digit
                      </p>
                      {code.join('').length === 6 && (
                        <p className="text-xs text-green-600 animate-in fade-in">
                          All digits entered. Press Enter or click Verify.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {(status === 'expired' || status === 'failed') && (
                  <Alert variant="destructive" className="animate-in fade-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {message}
                    </AlertDescription>
                  </Alert>
                )}

                {status === 'success' && (
                  <Alert className="animate-in fade-in bg-green-500/10 border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-500">
                      {message || 'Email verified successfully! You can now log in.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  {!isExpired && status !== 'success' && (
                    <Button
                      onClick={() => handleSubmit()}
                      className="w-full h-12 gradient-primary hover:shadow-glow transition-smooth"
                      disabled={code.join('').length !== 6 || isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                          <span>Verifying...</span>
                        </div>
                      ) : (
                        'Verify Email'
                      )}
                    </Button>
                  )}

                  {status === 'success' && (
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full h-12 gradient-primary hover:shadow-glow transition-smooth"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Go to Login
                    </Button>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleResendCode}
                      variant="outline"
                      className="flex-1 gap-2"
                      disabled={resendDisabled || isResending || status === 'success'}
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : resendDisabled ? (
                        `Resend (${resendCooldown}s)`
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Resend Code
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleGoToLogin}
                      variant="ghost"
                      className="flex-1"
                    >
                      Go to Login
                    </Button>
                  </div>
                </div>

                {/* Help Text */}
                <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/50 space-y-2">
                  <p>
                    Didn't receive the code? Check your spam folder or{' '}
                    <Button
                      variant="link"
                      onClick={handleResendCode}
                      className="h-auto p-0"
                      disabled={resendDisabled || isResending}
                    >
                      click here to resend
                    </Button>
                  </p>
                  <p>
                    Already verified?{' '}
                    <Button
                      variant="link"
                      onClick={handleGoToLogin}
                      className="h-auto p-0"
                    >
                      Go to Login
                    </Button>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>Hera Collection © {new Date().getFullYear()}</p>
          <p>Email verification required for account security</p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailCode;