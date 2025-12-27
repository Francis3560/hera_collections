import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Registration from "./pages/authentication/SignUp";
import { GoogleOAuthProvider } from '@react-oauth/google';
import NotFound from "./pages/NotFound";
import { AuthProvider } from './context/AuthContext';
import VerifyEmailCode from './pages/authentication/Verification';
import SignIn from "./pages/authentication/Login";
import Unauthorized from "./pages/Unauthorozed"; 
import ProfilePage from "./pages/authentication/ProfilePage";
import ProfileOverview from "./pages/authentication/ProfileOverview";
import { ProtectedRoute } from "./context/ProtectedRoute";
import { AdminLayout } from "./components/layout/AdminLayout";
import ResendVerification from "./pages/authentication/ResendVerification";
import ForgotPassword from "./pages/authentication/ForgotPassword";
import ResetPassword from "./pages/authentication/ResetPassword";
import SecurityPage from "./pages/authentication/SecurityPage";
import UsersManagement from "./pages/administrator/UserManagement/UsersPage";
import DashboardPage from "./pages/administrator/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="hera-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
              <Routes>
                {/* Public routes - NO ProtectedRoute */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<SignIn />} /> 
                <Route path="/register" element={<Registration />} /> 

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                
                {/* Verification routes */}
                <Route path="/verify" element={<VerifyEmailCode />} />
                <Route path="/verify-email" element={<VerifyEmailCode />} />
                <Route path="/resend-verification" element={<ResendVerification />} />

                {/* Profile routes - nested with sidebar layout */}
                <Route path="/profile" element={
                  <ProtectedRoute requireVerified>
                    <ProfilePage />
                  </ProtectedRoute>
                }>
                  <Route index element={<ProfileOverview />} />
                  <Route path="security" element={
                    <ProtectedRoute requireVerified>
                      <SecurityPage />
                    </ProtectedRoute>
                  } />
                  {/* You can add more profile sub-routes here in the future:
                  <Route path="edit" element={<ProfileEdit />} />
                  <Route path="orders" element={<ProfileOrders />} />
                  <Route path="settings" element={<ProfileSettings />} />
                  */}
                </Route>
                
                {/* Admin routes - nested within AdminLayout */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly requireVerified>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard as default/root admin route */}
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="users" element={<UsersManagement />} />
                  
                  {/* You can add more admin routes here in the future:
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  */}
                </Route>
                
                {/* Redirect old /dashboard route to /admin/dashboard for backward compatibility */}
                <Route path="/dashboard" element={
                  <Navigate to="/admin/dashboard" replace />
                } />
                
                <Route path="/unauthorized" element={<Unauthorized />} />
                
                {/* Catch all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </GoogleOAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;