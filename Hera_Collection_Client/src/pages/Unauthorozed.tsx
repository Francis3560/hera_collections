import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, Home, Shield, Lock } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get reason from location state
  const state = location.state as any;
  const reason = state?.reason || 'unknown';
  const from = state?.from || '/';
  const requiredRole = state?.requiredRole || state?.requiredRoles || null;
  const currentRole = state?.currentRole || 'guest';

  const getErrorMessage = () => {
    switch (reason) {
      case 'admin-only':
        return 'This area is restricted to administrators only.';
      case 'user-only':
        return 'This area is for regular users only.';
      case 'insufficient-permissions':
        return `Your account (${currentRole}) doesn't have the required permissions.`;
      case 'not-verified':
        return 'Please verify your email address to access this page.';
      default:
        return 'You don\'t have permission to access this page.';
    }
  };

  // Helper function to format required roles
  const formatRequiredRoles = () => {
    if (!requiredRole) return null;
    
    // Handle both string and array cases
    if (Array.isArray(requiredRole)) {
      return requiredRole.join(' or ');
    }
    
    // If it's a string, just return it
    return requiredRole;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop p-4">
      <Card className="w-full max-w-md border-border shadow-strong">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Access Restricted
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Unauthorized Access
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground mb-2 font-medium">
              {getErrorMessage()}
            </p>
            
            {requiredRole && (
              <div className="bg-muted/20 p-3 rounded-lg mt-3">
                <p className="text-sm text-muted-foreground">
                  Required role: <span className="font-semibold text-primary">
                    {formatRequiredRoles()}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Your role: <span className="font-semibold">{currentRole}</span>
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/10 p-4 rounded-lg border border-border">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What you can do:
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Contact an administrator if you need access</li>
              <li>• Verify your email address if prompted</li>
              <li>• Log out and log in with an authorized account</li>
              <li>• Return to the previous page</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="secondary"
              className="gap-2"
            >
              Go to Login
            </Button>

            <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
              <p>
                Need help? <Link to="/contact" className="text-primary hover:underline">Contact support</Link>
              </p>
              <p className="text-xs mt-1">
                Attempted to access: <code className="bg-muted px-1 rounded">{from}</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;