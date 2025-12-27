import React, { useState, useEffect } from "react";
import { useNavigate, Link, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Package,
  Heart,
  MapPin,
  Settings,
  Shield,
  CreditCard,
  Bell,
  Calendar,
  Star,
  Gift,
  ChevronRight,
  Edit,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

const ProfilePage = () => {
  const { user, userProfile, userStats, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
    setLoading(false);
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return <div className="container py-12">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Profile Hero Section */}
      <div className="bg-gradient-to-r from-primary-accent/10 to-cta/10 border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-primary-accent to-cta flex items-center justify-center text-white text-3xl font-bold">
                {user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.name || "User"}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={user?.isVerified ? "default" : "secondary"} 
                    className="gap-1"
                  >
                    {user?.isVerified ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Unverified
                      </>
                    )}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    {user?.role === "ADMIN" ? "👑 Admin" : "👤 Member"}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(user?.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate("/profile/edit")}
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>My Account</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <nav className="space-y-1">
                <Link
                  to="/profile"
                  end
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-4 w-4" />
                    <span>Profile Overview</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Separator />
                
                <Link
                  to="/profile/orders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4" />
                    <span>My Orders</span>
                    {userStats?.orders > 0 && (
                      <Badge>{userStats.orders}</Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/profile/wishlist"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4" />
                    <span>Wishlist</span>
                    {userStats?.wishlist > 0 && (
                      <Badge>{userStats.wishlist}</Badge>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/profile/addresses"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4" />
                    <span>Addresses</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Separator />
                
                <Link
                  to="/profile/security"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/profile/security"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/profile/payments"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment Methods</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to="/profile/notifications"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                {user?.role === "ADMIN" && (
                  <>
                    <Separator />
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-cta/10 text-cta transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                )}
              </nav>
            </CardContent>
          </Card>

          {/* Main Content Area - Uses Outlet for nested routes */}
          <div className="lg:col-span-3">
            <Outlet /> {/* This renders ProfileOverview when on /profile */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;