import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const PublicVerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { userId, code } = useParams();
  const navigate = useNavigate();
  const { verifyEmailPublic } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        
        const userIdToVerify = userId || searchParams.get('userId');
        const codeToVerify = code || searchParams.get('code');
        
        if (!userIdToVerify || !codeToVerify) {
          setError("Invalid verification link. Please check your email for a valid link.");
          setLoading(false);
          return;
        }
        
        const result = await verifyEmailPublic(parseInt(userIdToVerify), codeToVerify);
        
        if (result.success) {
          setSuccess(true);
          setMessage(result.message || "Email verified successfully!");
          
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        } else {
          setError(result.error || "Failed to verify email");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred during verification");
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [userId, code, searchParams, verifyEmailPublic, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifying Email</CardTitle>
            <CardDescription>Please wait while we verify your email address...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {success ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Email Verified!</CardTitle>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl">Verification Failed</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {success ? (
            <>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to login page...
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => navigate("/login")} className="w-full">
                  Go to Login
                </Button>
                <Button 
                  onClick={() => navigate("/resend-verification")} 
                  variant="outline" 
                  className="w-full"
                >
                  Request New Verification Email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicVerifyEmail;