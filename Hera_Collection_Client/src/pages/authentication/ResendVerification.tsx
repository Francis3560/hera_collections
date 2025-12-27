import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";

const ResendVerification = () => {
  const navigate = useNavigate();
  const { resendVerificationEmail, pendingVerificationEmail, user } = useAuth();
  
  const [email, setEmail] = useState(pendingVerificationEmail || user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.success) {
        setSuccess(true);
        // Start cooldown timer
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.error);
        if (result.retryAfter) {
          setCooldown(result.retryAfter);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-2xl">Resend Verification Email</CardTitle>
          <CardDescription>
            Enter your email to receive a new verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4 text-center">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Verification email sent successfully! Please check your inbox.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => navigate('/verify')} className="w-full">
                  Enter Verification Code
                </Button>
                <Button 
                  onClick={() => navigate('/login')} 
                  variant="outline" 
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
              {cooldown > 0 && (
                <p className="text-sm text-muted-foreground">
                  You can request another email in {cooldown} seconds
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading || cooldown > 0}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || cooldown > 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : cooldown > 0 ? (
                  `Resend available in ${cooldown}s`
                ) : (
                  "Send Verification Email"
                )}
              </Button>

              <div className="text-center space-y-2">
                <Button 
                  type="button" 
                  variant="link" 
                  onClick={() => navigate('/login')}
                  className="text-sm"
                >
                  Back to Login
                </Button>
                <p className="text-xs text-muted-foreground">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResendVerification;