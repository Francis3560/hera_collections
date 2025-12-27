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
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const LOADER_DELAY = 2000; // 2 seconds loader

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
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/verify', { 
                state: { 
                  email: result.user?.email,
                  autoFocus: true,
                  fromGoogle: true
                } 
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
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
        if (result.requiresVerification || (result.user && !result.user.isVerified)) {
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
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/verify', { 
                state: { 
                  email: values.email,
                  autoFocus: true 
                } 
              });
            } else if (result.dismiss === Swal.DismissReason.cancel) {
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
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/verify', { 
              state: { 
                email: emailToUse,
                autoFocus: true 
              } 
            });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-backdrop p-4">
      {/* Full page loader with role info */}
      {showFullLoader && (
        <FullPageLoader 
          message={loaderMessage} 
          role={userRole}
        />
      )}

      {/* Loading overlay for form submission */}
      {isSubmitting && !showFullLoader && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <OrbitProgress 
              color="hsl(var(--primary))" 
              size="large" 
              text="" 
              textColor=""
            />
            <div>
              <p className="text-lg font-medium text-foreground">
                Logging you in...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Checking your account details
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Form Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to your Hera Collection account
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl shadow-strong p-6">
          {/* Verification Success Alert */}
          {showVerificationSuccess && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20 animate-in fade-in">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Email verified successfully!</span>
                  <span className="text-sm">You can now log in to your account.</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {loginError && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {loginError}
              </AlertDescription>
            </Alert>
          )}

          {/* Resend Verification Prompt */}
          {showResendVerification && (
            <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/20 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                <div className="flex flex-col gap-2">
                  <span>Email verification required.</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResendVerification}
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                    >
                      Resend Verification Email
                    </Button>
                    <Button
                      onClick={() => {
                        setShowResendVerification(false);
                        setLoginError('');
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        className="h-11"
                        disabled={authLoading || isSubmitting || showFullLoader}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="h-11 pr-12"
                          disabled={authLoading || isSubmitting || showFullLoader}
                          autoComplete="current-password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={authLoading || isSubmitting || showFullLoader}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={authLoading || isSubmitting || showFullLoader}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={handleForgotPassword}
                  disabled={authLoading || isSubmitting || showFullLoader}
                >
                  Forgot password?
                </Button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gradient-primary hover:shadow-glow transition-smooth mt-2"
                disabled={authLoading || isSubmitting || showFullLoader || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login */}
          <div className="w-full">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  theme="filled_blue"
                  width="100%"
                  useOneTap
                  disabled={isGoogleLoading || showFullLoader}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 flex items-center justify-center gap-3"
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

          {/* Sign up link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Don't have an account?
            </p>
            <Button
              onClick={handleSignup}
              variant="outline"
              className="w-full"
              disabled={showFullLoader}
            >
              Create new account
            </Button>
          </div>
        </div>
        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Hera Collection © {new Date().getFullYear()}</p>
          <p className="mt-1">Secure login with role-based access control</p>
        </div>
      </div>
    </div>
  );
}

export default LoginWithGoogleProvider;