import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { OrbitProgress } from "react-loading-indicators";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

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
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
    .regex(/^\+2547\d{8}$/, "Phone must be in format +2547XXXXXXXX"),
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

  const handlePhoneNumberChange = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('+')) {
      if (!cleaned.startsWith('+2547')) {
        if (cleaned.startsWith('+254')) {
          cleaned = '+2547' + cleaned.slice(4);
        } else {
          cleaned = '+2547' + cleaned.slice(1);
        }
      }
      if (cleaned.length > 13) {
        cleaned = cleaned.slice(0, 13);
      }
    } else {
      cleaned = '+2547' + cleaned;
      if (cleaned.length > 13) {
        cleaned = cleaned.slice(0, 13);
      }
    }
    
    form.setValue('phone_number', cleaned, { shouldValidate: true });
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
            verificationRequired: result.verificationRequired || true,
            verificationSent: result.verificationSent || true,
            fromGoogle: true,
            isVerified: result.isVerified || false
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-backdrop p-4">
      {/* Full page loader */}
      {showFullPageLoader && <FullPageLoader message={loaderMessage} />}

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground">
            Join Hera Collection with your details
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-card border border-border rounded-xl shadow-strong p-6">
          {/* Email verification reminder */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-500">
                <strong>Email verification required:</strong> You'll need to verify your email before accessing all features.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        className="h-11"
                        disabled={isSubmitting || isGoogleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        disabled={isSubmitting || isGoogleLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll send a verification code to this email
                    </p>
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+2547XXXXXXXX"
                        className="h-11"
                        disabled={isSubmitting || isGoogleLoading}
                        value={field.value}
                        onChange={(e) => handlePhoneNumberChange(e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value && !value.match(/^\+2547\d{8}$/)) {
                            form.setError('phone_number', {
                              type: 'manual',
                              message: 'Phone must be in format +2547XXXXXXXX'
                            });
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: +2547 followed by 8 digits (e.g., +254712345678)
                    </p>
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
                          placeholder="Create a secure password"
                          className="h-11 pr-12"
                          disabled={isSubmitting || isGoogleLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isSubmitting || isGoogleLoading}
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

              {/* Terms and Conditions */}
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting || isGoogleLoading}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gradient-primary hover:shadow-glow transition-smooth mt-2"
                disabled={isSubmitting || isGoogleLoading || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <OrbitProgress color="#FFFFFF" size="small" text="" textColor="" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <>
                    Create Account
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

          {/* Google Signup */}
          <div className="w-full">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  size="large"
                  text="signup_with"
                  shape="rectangular"
                  theme="filled_blue"
                  width="100%"
                  useOneTap
                  disabled={isSubmitting || isGoogleLoading}
                />
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 flex items-center justify-center gap-3"
                onClick={() => {
                  alert('Google Signup Not Configured');
                }}
                disabled={isSubmitting || isGoogleLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </Button>
            )}
          </div>

          {/* Already have account link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary-dark hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Hera Collection © {new Date().getFullYear()}</p>
          <p className="mt-1">Email verification required for account security</p>
        </div>
      </div>
    </div>
  );
}

export default SignupWithGoogleProvider;