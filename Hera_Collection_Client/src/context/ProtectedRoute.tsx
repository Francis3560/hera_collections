import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ReactNode, useEffect } from "react";
import { OrbitProgress } from "react-loading-indicators";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: ('USER' | 'ADMIN')[];
  requireVerified?: boolean;
  allowUnverifiedAccess?: boolean;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRoles = [],
  requireVerified = false,
  allowUnverifiedAccess = false,
  adminOnly = false,
  userOnly = false 
}: ProtectedRouteProps) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    isVerified,
    role
  } = useAuth();
  
  const location = useLocation();
  
  // Store redirect path - FIXED: Added proper dependencies
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath !== '/login' && 
        currentPath !== '/register' && 
        currentPath !== '/verify' &&
        currentPath !== '/unauthorized') {
      sessionStorage.setItem('hera_redirect_path', currentPath);
    }
  }, [location.pathname]); // ✅ Only depend on pathname, not entire location object
  
  // Show loading only when AuthContext is loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-backdrop">
        <div className="text-center space-y-4">
          <OrbitProgress 
            color="hsl(var(--primary))" 
            size="medium" 
            text="" 
            textColor=""
          />
          <div>
            <p className="text-sm text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    const redirectPath = location.pathname + location.search;
    const excludedPaths = ['/login', '/register', '/verify', '/unauthorized'];
    
    if (!excludedPaths.some(path => redirectPath.startsWith(path))) {
      sessionStorage.setItem('hera_redirect_path', redirectPath);
    }
    
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role checks - simplified
  if (adminOnly && role !== 'ADMIN') {
    return <Navigate to="/unauthorized" state={{ 
      from: location.pathname,
      reason: 'admin-only',
      currentRole: role,
      requiredRole: 'ADMIN'
    }} replace />;
  }

  if (userOnly && role !== 'USER') {
    return <Navigate to="/unauthorized" state={{ 
      from: location.pathname,
      reason: 'user-only',
      currentRole: role,
      requiredRole: 'USER'
    }} replace />;
  }

  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(role as 'USER' | 'ADMIN');
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" state={{ 
        from: location.pathname,
        reason: 'insufficient-permissions',
        currentRole: role,
        requiredRoles: requiredRoles
      }} replace />;
    }
  }

  if (requireVerified && !isVerified && !allowUnverifiedAccess) {
    return <Navigate to="/verify" state={{ 
      email: user.email,
      from: location.pathname
    }} replace />;
  }

  return <>{children}</>;
};