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
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-backdrop p-4">
      {/* Response Modal */}
      <ResponseModal
        type={responseType}
        title={responseTitle}
        message={responseMessage}
        isVisible={showResponseModal}
        onClose={() => setShowResponseModal(false)}
      />

      {/* Full page loader */}
      {showFullLoader && (
        <FullPageLoader 
          message={loaderMessage} 
        />
      )}

      <div className="w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>

        {/* Form Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Create a new password for your account
          </p>
          {email && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full">
              <span className="text-sm text-muted-foreground">
                For: <span className="font-medium">{email}</span>
              </span>
            </div>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl shadow-strong p-6">
          {/* Information Alert */}
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-500">
              Create a strong password with at least 8 characters, including numbers and special characters.
            </AlertDescription>
          </Alert>

          {error && !success && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Password Reset Successful!</h3>
                <p className="text-muted-foreground mb-4">
                  Your password has been reset successfully. You will be redirected to login.
                </p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* New Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            className="h-11 pr-12"
                            disabled={isSubmitting || showFullLoader}
                            autoComplete="new-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isSubmitting || showFullLoader}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      
                      {/* Password Strength Indicator */}
                      {password && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-sm font-medium">
                            Password Strength
                          </Label>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Object.values(passwordChecks).filter(Boolean).length * 25}%`,
                                background: `linear-gradient(90deg, 
                                  ${passwordChecks.length ? 'hsl(var(--destructive))' : 'transparent'} 0%,
                                  ${passwordChecks.number ? 'hsl(var(--warning))' : 'transparent'} 33%,
                                  ${passwordChecks.letter ? 'hsl(var(--info))' : 'transparent'} 66%,
                                  ${passwordChecks.special ? 'hsl(var(--success))' : 'transparent'} 100%
                                )`,
                              }}
                            />
                          </div>
                          
                          {/* Password Requirements */}
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                            {Object.entries(passwordChecks).map(([key, isValid]) => (
                              <div
                                key={key}
                                className={`flex items-center gap-2 ${
                                  isValid ? "text-green-600" : "text-muted-foreground"
                                }`}
                              >
                                <div className={`h-2 w-2 rounded-full ${isValid ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span>
                                  {key === "length" && "8+ characters"}
                                  {key === "number" && "Contains number"}
                                  {key === "letter" && "Contains letter"}
                                  {key === "special" && "Special character"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Confirm New Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            className="h-11 pr-12"
                            disabled={isSubmitting || showFullLoader}
                            autoComplete="new-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={isSubmitting || showFullLoader}
                          >
                            {showConfirmPassword ? (
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold gradient-primary hover:shadow-glow transition-smooth mt-2"
                  disabled={isSubmitting || showFullLoader || !form.formState.isValid}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    <>
                      Reset Password
                      <Key className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Additional Links */}
          {!success && (
            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
                >
                  Log in here
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Hera Collection © {new Date().getFullYear()}</p>
          <p className="mt-1">Secure password reset system</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;