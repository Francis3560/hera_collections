import { useState } from 'react';
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
} from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

  const form = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

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
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
            Forgot Password
          </h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl shadow-strong p-6">
          {/* Information Alert */}
          <Alert className="mb-6 bg-blue-500/10 border-blue-500/20">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-500">
              We'll send you a secure link to reset your password. The link will expire in 1 hour.
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
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-muted-foreground mb-4">
                  We've sent a password reset link to your email address.
                </p>
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                >
                  Back to Login
                </Button>
                <Button
                  onClick={() => {
                    setSuccess(false);
                    form.reset();
                  }}
                >
                  Try Another Email
                </Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
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
                          disabled={isSubmitting || showFullLoader}
                          autoComplete="email"
                          {...field}
                        />
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
                      <span>Sending Reset Link...</span>
                    </div>
                  ) : (
                    <>
                      Send Reset Link
                      <Key className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <Separator className="my-6" />

          {/* Additional Links */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
              disabled={isSubmitting || showFullLoader}
            >
              Back to Login
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
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

export default ForgotPassword;