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
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartProvider';
import { WishlistProvider } from './context/WishlistProvider';
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
import CreateProduct from "./pages/administrator/Products/CreateProduct";
import CategoryModule from "./pages/administrator/CategoryModule/CategoryModule";
import ProductsDisplay from "./pages/administrator/Products/ProductsDisplay";
import ExpenseCategoryModule from "./pages/administrator/ExpenseCategoryModule/ExpenseCategoryModule";
import Expenses from "./pages/administrator/Expenses/Expenses";
import StockMovements from "./pages/administrator/StockManagement/StockMovements/StockMovements";
import StockAlerts from "./pages/administrator/StockManagement/StockAlerts/StockAlerts";
import StockTakes from "./pages/administrator/StockManagement/StockTakes/StockTakes";
import StockTakeDetail from "./pages/administrator/StockManagement/StockTakes/StockTakeDetail";
import StockTakeItems from "./pages/administrator/StockManagement/StockTakes/StockTakeItems";
import PosTerminal from "./pages/administrator/POS/PosTerminal";
import TransactionHistory from "./pages/administrator/POS/TransactionHistory";
import OrdersList from "./pages/administrator/Orders/OrdersList";
import OrderDetails from "./pages/administrator/Orders/OrderDetails";
import CustomersList from "./pages/administrator/Orders/CustomersList";
import OrderItemsList from "./pages/administrator/Orders/OrderItemsList";
import NotificationsPage from "./pages/administrator/Notifications/NotificationsPage";
import DiscountList from "./pages/administrator/Discounts/DiscountList";
import DiscountForm from "./pages/administrator/Discounts/DiscountForm";
import UserOrders from "./pages/authentication/UserOrders";
import CartPage from "./pages/shop/CartPage";
import CheckoutPage from "./pages/shop/CheckoutPage";
import OrderTrackingPage from "./pages/shop/OrderTrackingPage";
import WishlistPage from "./pages/shop/WishlistPage";
import ProductDetailsPage from "./pages/shop/ProductDetailsPage";
import CollectionsPage from "./pages/shop/CollectionsPage";
import CollectionPage from "./pages/shop/CollectionPage";
import ThankYouPage from "./pages/shop/ThankYouPage";

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
              <NotificationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Routes>
                  {/* Public routes - NO ProtectedRoute */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<SignIn />} /> 
                  <Route path="/register" element={<Registration />} /> 

                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  
                  {/* Shop routes */}
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/product/:slug" element={<ProductDetailsPage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/collections/:slug" element={<CollectionPage />} />
                  <Route path="/checkout" element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/thank-you" element={<ThankYouPage />} />
                  <Route path="/order-tracking/:orderNumber" element={<OrderTrackingPage />} />
                  
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
                    <Route path="orders" element={<UserOrders />} />
                    <Route path="security" element={
                      <ProtectedRoute requireVerified>
                        <SecurityPage />
                      </ProtectedRoute>
                    } />
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
                    <Route path="products" element={<ProductsDisplay />} />
                    <Route path="addproducts" element={<CreateProduct />} />
                    <Route path="categories" element={<CategoryModule />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="discounts" element={<DiscountList />} />
                    <Route path="discounts/new" element={<DiscountForm />} />
                    <Route path="discounts/:id" element={<DiscountForm />} />
                    <Route path="expenses-categories" element={<ExpenseCategoryModule />} />
                    
                    {/* Stock Management */}
                    <Route path="inventory/movements" element={<StockMovements />} />
                    <Route path="inventory/alerts" element={<StockAlerts />} />
                    <Route path="inventory/stocktakes" element={<StockTakes />} />
                    <Route path="inventory/stocktakes/:id" element={<StockTakeDetail />} />
                    <Route path="inventory/stocktake-items" element={<StockTakeItems />} />

                    {/* Order Management */}
                    <Route path="orders" element={<OrdersList />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="order-items" element={<OrderItemsList />} />
                    <Route path="customers" element={<CustomersList />} />

                    {/* POS & Sales */}
                    <Route path="pos" element={<PosTerminal />} />
                    <Route path="sales/manual" element={<PosTerminal />} />
                    <Route path="transactions" element={<TransactionHistory />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                  </Route>
                  
                  {/* Redirect old /dashboard route to /admin/dashboard for backward compatibility */}
                  <Route path="/dashboard" element={
                    <Navigate to="/admin/dashboard" replace />
                  } />
                  
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                  {/* Catch all */}
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                  </WishlistProvider>
                </CartProvider>
              </NotificationProvider>
            </AuthProvider>
          </GoogleOAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;