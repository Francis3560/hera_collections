import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Link, Outlet } from "react-router-dom";
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
  ChevronRight,
  Edit,
  CheckCircle,
  XCircle,
  LogOut,
} from "lucide-react";

const ProfilePage = () => {
  const { user, userProfile, userStats, isAuthenticated, logout, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      refreshUserProfile();
    }
    setLoading(false);
  }, [isAuthenticated, navigate, refreshUserProfile]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/profile", end: true, icon: UserCircle, label: "Profile Overview" },
    { to: "/profile/orders", icon: Package, label: "My Orders", badge: userStats?.orders },
    { to: "/profile/wishlist", icon: Heart, label: "Wishlist", badge: userStats?.wishlist },
    { to: "/profile/addresses", icon: MapPin, label: "Addresses" },
    { separator: true },
    { to: "/profile/security", icon: Shield, label: "Security & Settings" },
    { to: "/profile/payments", icon: CreditCard, label: "Payment Methods" },
    { to: "/profile/notifications", icon: Bell, label: "Notifications" },
  ];

  if (loading) {
    return <div className="container py-12">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-background/50">
      {/* Profile Hero Section */}
      <div className="bg-secondary/30 border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="h-24 w-24 rounded-full object-cover border-4 border-background shadow-xl"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold border-4 border-background shadow-xl">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                   {user?.isVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{userProfile?.name || user?.name || "User"}</h1>
                <p className="text-muted-foreground font-medium">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge 
                    variant={user?.isVerified ? "default" : "destructive"} 
                    className="rounded-full px-3 py-0.5"
                  >
                    {user?.isVerified ? "Verified Account" : "Unverified"}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full px-3 py-0.5">
                    {user?.role === "ADMIN" ? "Administrator" : "Member"}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground font-medium ml-1">
                    <Calendar className="h-3.5 w-3.5 mr-1" />
                    Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : "Recently"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-xl shadow-sm hover:bg-secondary/50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="space-y-6 sticky top-24">
              <Card className="border-none bg-transparent shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-lg">Account Menu</CardTitle>
                </CardHeader>
                <CardContent className="px-0">
                  <nav className="space-y-1">
                    {navItems.map((item, idx) => {
                      if (item.separator) return <Separator key={idx} className="my-4" />;
                      
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to!}
                          end={item.end}
                          className={({ isActive }) => 
                            `flex items-center justify-between p-3.5 rounded-2xl transition-all duration-200 group ${
                              isActive 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                            }`
                          }
                        >
                          <div className="flex items-center gap-3.5">
                            <item.icon className="h-5 w-5" />
                            <span className="font-semibold">{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                              <Badge variant="secondary" className="ml-1 bg-background/20 text-current hover:bg-background/30">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </NavLink>
                      );
                    })}
                    
                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-300 mt-6"
                      >
                        <div className="flex items-center gap-3.5">
                          <Star className="h-5 w-5 fill-current" />
                          <span className="font-black italic uppercase text-xs tracking-widest">Admin Panel</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main Content Area - Uses Outlet for nested routes */}
          <main className="lg:col-span-3 min-h-[60vh] animate-in fade-in duration-500">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;