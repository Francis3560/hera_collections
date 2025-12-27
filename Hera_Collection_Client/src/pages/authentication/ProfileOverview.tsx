import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const { userProfile, userStats } = useAuth();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {userProfile?.name || "User"}!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">Quick Profile Overview</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Email:</p>
                  <p className="font-medium">{userProfile?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Member since:</p>
                  <p className="font-medium">
                    {new Date(userProfile?.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Account type:</p>
                  <Badge variant="outline" className="mt-1">
                    {userProfile?.role === "ADMIN" ? "Administrator" : "Regular User"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <UpdateProfileModal />
                <ChangePasswordModal />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{userStats?.orders || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">
                  ${userStats?.totalSpent?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wishlist Items</p>
                <p className="text-2xl font-bold">{userStats?.wishlist || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviews</p>
                <p className="text-2xl font-bold">{userStats?.reviews || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Profile Details</span>
            <UpdateProfileModal 
              trigger={
                <Button variant="ghost" size="sm" className="gap-2">
                  Edit
                </Button>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                <p className="text-lg">{userProfile?.name || "Not set"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                <p className="text-lg">{userProfile?.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                <p className="text-lg">{userProfile?.phone || "Not set"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                <p className="text-lg">{userProfile?.location || "Not set"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Bio</h4>
                <p className="text-lg">{userProfile?.bio || "Not set"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date of Birth</h4>
                <p className="text-lg">
                  {userProfile?.dateOfBirth 
                    ? new Date(userProfile.dateOfBirth).toLocaleDateString() 
                    : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Order #ORD-12345 placed</p>
                <p className="text-sm text-muted-foreground">2 days ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Review submitted</p>
                <p className="text-sm text-muted-foreground">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileOverview;