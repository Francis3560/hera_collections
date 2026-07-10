import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartProvider';
import { WishlistProvider } from './context/WishlistProvider';
import { ProtectedRoute } from "./context/ProtectedRoute";
import { PageLoader } from "@/components/shared/PageLoader";

// All page/layout components are lazy-loaded so each route ships as its own
// chunk instead of one monolithic bundle containing admin/POS/reporting code
// that most visitors never touch.
const Index = lazy(() => import("./pages/Index"));
const Registration = lazy(() => import("./pages/authentication/SignUp"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VerifyEmailCode = lazy(() => import('./pages/authentication/Verification'));
const SignIn = lazy(() => import("./pages/authentication/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorozed"));
const ProfilePage = lazy(() => import("./pages/authentication/ProfilePage"));
const ProfileOverview = lazy(() => import("./pages/authentication/ProfileOverview"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout").then(m => ({ default: m.AdminLayout })));
const ResendVerification = lazy(() => import("./pages/authentication/ResendVerification"));
const ForgotPassword = lazy(() => import("./pages/authentication/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/authentication/ResetPassword"));
const SecurityPage = lazy(() => import("./pages/authentication/SecurityPage"));
const UsersManagement = lazy(() => import("./pages/administrator/UserManagement/UsersPage"));
const DashboardPage = lazy(() => import("./pages/administrator/Dashboard"));
const CreateProduct = lazy(() => import("./pages/administrator/Products/CreateProduct"));
const CategoryModule = lazy(() => import("./pages/administrator/CategoryModule/CategoryModule"));
const SubCategoryModule = lazy(() => import("./pages/administrator/CategoryModule/SubCategoryModule"));
const ProductsDisplay = lazy(() => import("./pages/administrator/Products/ProductsDisplay"));
const ExpenseCategoryModule = lazy(() => import("./pages/administrator/ExpenseCategoryModule/ExpenseCategoryModule"));
const Expenses = lazy(() => import("./pages/administrator/Expenses/Expenses"));
const StockMovements = lazy(() => import("./pages/administrator/StockManagement/StockMovements/StockMovements"));
const StockAlerts = lazy(() => import("./pages/administrator/StockManagement/StockAlerts/StockAlerts"));
const StockTakes = lazy(() => import("./pages/administrator/StockManagement/StockTakes/StockTakes"));
const StockTakeDetail = lazy(() => import("./pages/administrator/StockManagement/StockTakes/StockTakeDetail"));
const StockTakeItems = lazy(() => import("./pages/administrator/StockManagement/StockTakes/StockTakeItems"));
const PosTerminal = lazy(() => import("./pages/administrator/POS/PosTerminal"));
const TransactionHistory = lazy(() => import("./pages/administrator/POS/TransactionHistory"));
const OrdersList = lazy(() => import("./pages/administrator/Orders/OrdersList"));
const OrderDetails = lazy(() => import("./pages/administrator/Orders/OrderDetails"));
const CustomersList = lazy(() => import("./pages/administrator/Orders/CustomersList"));
const OrderItemsList = lazy(() => import("./pages/administrator/Orders/OrderItemsList"));
const NotificationsPage = lazy(() => import("./pages/administrator/Notifications/NotificationsPage"));
const DiscountList = lazy(() => import("./pages/administrator/Discounts/DiscountList"));
const DiscountForm = lazy(() => import("./pages/administrator/Discounts/DiscountForm"));
const UserOrders = lazy(() => import("./pages/authentication/UserOrders"));
const CartPage = lazy(() => import("./pages/shop/CartPage"));
const CheckoutPage = lazy(() => import("./pages/shop/CheckoutPage"));
const OrderTrackingPage = lazy(() => import("./pages/shop/OrderTrackingPage"));
const WishlistPage = lazy(() => import("./pages/shop/WishlistPage"));
const ProductDetailsPage = lazy(() => import("./pages/shop/ProductDetailsPage"));
const CollectionsPage = lazy(() => import("./pages/shop/CollectionsPage"));
const CollectionPage = lazy(() => import("./pages/shop/CollectionPage"));
const ThankYouPage = lazy(() => import("./pages/shop/ThankYouPage"));
const ShippingFeesPage = lazy(() => import("./pages/administrator/Shipping/ShippingFeesPage"));
const About = lazy(() => import("./pages/About"));
const InquiryDashboard = lazy(() => import("./pages/admin/InquiryDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const CorporateOrders = lazy(() => import("./pages/CorporateOrders"));
const CustomOrders = lazy(() => import("./pages/CustomOrders"));
const TermsOfService = lazy(() => import("./pages/policies/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/policies/RefundPolicy"));
const ShippingPolicy = lazy(() => import("./pages/policies/ShippingPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/policies/PrivacyPolicy"));
const CareInstructions = lazy(() => import("./pages/policies/CareInstructions"));
const ProfileWishlist = lazy(() => import("./pages/authentication/ProfileSubPages").then(m => ({ default: m.ProfileWishlist })));
const ProfileAddresses = lazy(() => import("./pages/authentication/ProfileSubPages").then(m => ({ default: m.ProfileAddresses })));
const ProfilePayments = lazy(() => import("./pages/authentication/ProfileSubPages").then(m => ({ default: m.ProfilePayments })));
const ProfileNotifications = lazy(() => import("./pages/authentication/ProfileSubPages").then(m => ({ default: m.ProfileNotifications })));


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
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                  {/* Public routes - NO ProtectedRoute */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<SignIn />} />
                  <Route path="/register" element={<Registration />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/corporate-orders" element={<CorporateOrders />} />
                  <Route path="/custom-orders" element={<CustomOrders />} />

                  {/* Policies */}
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/refund-policy" element={<RefundPolicy />} />
                  <Route path="/shipping-policy" element={<ShippingPolicy />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/care-instructions" element={<CareInstructions />} />


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
                    <Route path="wishlist" element={<ProfileWishlist />} />
                    <Route path="addresses" element={<ProfileAddresses />} />
                    <Route path="payments" element={<ProfilePayments />} />
                    <Route path="notifications" element={<ProfileNotifications />} />
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
                    <Route path="subcategories" element={<SubCategoryModule />} />
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
                    <Route path="shipping-fees" element={<ShippingFeesPage />} />
                    <Route path="customers" element={<CustomersList />} />

                    {/* POS & Sales */}
                    <Route path="pos" element={<PosTerminal />} />
                    <Route path="sales/manual" element={<PosTerminal />} />
                    <Route path="transactions" element={<TransactionHistory />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="messaging/inbox" element={<InquiryDashboard />} />
                  </Route>

                  {/* Redirect old /dashboard route to /admin/dashboard for backward compatibility */}
                  <Route path="/dashboard" element={
                    <Navigate to="/admin/dashboard" replace />
                  } />

                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Catch all */}
                  <Route path="*" element={<NotFound />} />
                    </Routes>
                    </Suspense>
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
