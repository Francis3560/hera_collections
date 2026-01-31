import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Heart,
  Star,
  ShoppingBag,
  DollarSign,
} from "lucide-react";
import UpdateProfileModal from "./UpdateProfileModal";
import ChangePasswordModal from "./ChangePasswordModal";


const ProfileOverview = () => {
  const navigate = useNavigate();
  const { userProfile, userStats, userActivity, getActivity } = useAuth();

  React.useEffect(() => {
    getActivity(1, 5);
  }, [getActivity]);

  const formatActivityDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md overflow-hidden bg-gradient-to-br from-background to-secondary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Welcome back, {userProfile?.name?.split(' ')[0] || "User"}!</CardTitle>
          <CardDescription>Here's what's happening with your account today.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account Summary</h3>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-sm text-muted-foreground">Email Status</span>
                  <Badge variant={userProfile?.isVerified ? "default" : "destructive"} className="text-[10px] font-bold uppercase">
                    {userProfile?.isVerified ? "Verified" : "Action Required"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-bold">
                    {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <UpdateProfileModal />
                <ChangePasswordModal />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: userStats?.orders || 0, icon: ShoppingBag, color: "blue" },
          { label: "Total Spent", value: `KES ${userStats?.totalSpent?.toLocaleString() || "0"}`, icon: DollarSign, color: "green" },
          { label: "Wishlist", value: userStats?.wishlist || 0, icon: Heart, color: "pink" },
          { label: "Reviews", value: userStats?.reviews || 0, icon: Star, color: "yellow" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">{stat.label}</p>
                  <p className="text-2xl font-black mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-${stat.color}-500/10`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            <UpdateProfileModal 
              trigger={
                <Button variant="outline" size="sm" className="rounded-full px-4">
                  Update
                </Button>
              }
            />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Full Name</span>
                <p className="font-semibold">{userProfile?.name || "Not set"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</span>
                <p className="font-semibold">{userProfile?.phone || "Not linked"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Primary Location</span>
                <p className="font-semibold">{userProfile?.location || "Global"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Birth Date</span>
                <p className="font-semibold">
                  {userProfile?.dateOfBirth 
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' }) 
                    : "Hidden/Not set"}
                </p>
              </div>
            </div>
            {userProfile?.bio && (
              <div className="pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Short Bio</span>
                <p className="text-sm italic text-muted-foreground leading-relaxed">"{userProfile.bio}"</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {userActivity && userActivity.length > 0 ? (
                userActivity.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-none">{activity.action}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                        {formatActivityDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-secondary/20 rounded-2xl">
                   <p className="text-xs font-medium text-muted-foreground">No recent activity found.</p>
                </div>
              )}
            </div>
            {userActivity && userActivity.length > 4 && (
              <Button variant="ghost" className="w-full mt-4 text-xs font-bold" onClick={() => navigate('/profile/activity')}>
                View Entire Log
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileOverview;