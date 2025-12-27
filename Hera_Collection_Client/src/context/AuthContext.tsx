import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import userService from "../api/UserService.js";
import emailVerificationService from "../api/emailVerificationService.js";
import { setAuthData, clearAuthData } from "../utils/axiosClient.js";

interface User {
  id: number;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  isVerified?: boolean;
  status?: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY';
  phone?: string;
  provider?: 'EMAIL' | 'GOOGLE';
  picture?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfile extends User {
  _count?: {
    orders: number;
    products: number;
    reviews: number;
    wishlistItems: number;
  };
}

interface UserStats {
  orders: number;
  products: number;
  reviews: number;
  wishlist: number;
  totalSpent: number;
  lastOrder: {
    date: string;
    amount: number;
    orderNumber: string;
  } | null;
  joined: string;
}

interface ActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: number;
  oldValue: string;
  newValue: string;
  createdAt: string;
  metadata: string;
}

interface PaginatedActivity {
  activities: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AuthContextType {
  // State
  user: User | null;
  userProfile: UserProfile | null;
  userStats: UserStats | null;
  userActivity: ActivityLog[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isVerified: boolean;
  role: 'USER' | 'ADMIN' | null;
  pendingVerificationEmail: string | null;
  
  // Auth Methods
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    verificationRequired?: boolean;
  }>;
  googleLogin: (token: string) => Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    verificationRequired?: boolean;
  }>;
  register: (userData: any) => Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    requiresVerification?: boolean;
  }>;
  registerWithGoogle: (token: string) => Promise<{ 
    success: boolean; 
    user?: User; 
    error?: string;
    requiresVerification?: boolean;
  }>;
  logout: () => void;
  
  // Verification Methods
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmailPublic: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  setPendingVerificationEmail: (email: string) => void;
  clearPendingVerification: () => void;
  
  // Profile Management Methods
  getProfile: () => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  updateProfile: (profileData: Partial<User>) => Promise<{ success: boolean; profile?: UserProfile; error?: string }>;
  deleteAccount: (password: string, confirm: boolean) => Promise<{ success: boolean; error?: string }>;
  
  // Password Management Methods
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  validateResetToken: (token: string) => Promise<{ success: boolean; user?: { id: number; email: string; name: string }; error?: string }>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Activity & Stats Methods
  getActivity: (page?: number, limit?: number) => Promise<{ success: boolean; activity?: PaginatedActivity; error?: string }>;
  getStats: () => Promise<{ success: boolean; stats?: UserStats; error?: string }>;
  
  // Utility Methods
  refreshUserProfile: () => Promise<void>;
  clearError: () => void;
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
  validatePhone: (phone: string) => boolean;
  isAdmin: () => boolean;
  isRegularUser: () => boolean;
  
  // Preferences Methods
  updatePreferences: (preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
    timezone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("hera_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userActivity, setUserActivity] = useState<ActivityLog[]>([]);
  
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(() => {
    return localStorage.getItem("hera_pending_verification_email") || null;
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Memoize functions to prevent re-renders
  const savePendingVerificationEmail = useCallback((email: string) => {
    setPendingVerificationEmail(email);
    localStorage.setItem("hera_pending_verification_email", email);
  }, []);

  const clearPendingVerification = useCallback(() => {
    setPendingVerificationEmail(null);
    localStorage.removeItem("hera_pending_verification_email");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ Fixed: Added proper dependency
  useEffect(() => {
    if (user?.email && pendingVerificationEmail === user.email) {
      clearPendingVerification();
    }
  }, [user, pendingVerificationEmail, clearPendingVerification]);

  // ✅ Initialize user session on mount
  useEffect(() => {
    const initializeSession = async () => {
      if (userService.isAuthenticated()) {
        try {
          const userData = await userService.initializeSession();
          if (userData) {
            setUser(userData);
            // Load profile data
            await refreshUserProfile();
          }
        } catch (error) {
          console.error('Session initialization failed:', error);
        }
      }
    };

    initializeSession();

    // Set up auth event listeners
    const handleLogout = () => {
      setUser(null);
      setUserProfile(null);
      setUserStats(null);
      setUserActivity([]);
      clearPendingVerification();
      navigate('/login');
    };

    const handleEmailNotVerified = (event: CustomEvent) => {
      if (user?.email) {
        savePendingVerificationEmail(user.email);
        navigate('/verify-email');
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:email-not-verified', handleEmailNotVerified as EventListener);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:email-not-verified', handleEmailNotVerified as EventListener);
    };
  }, [navigate, savePendingVerificationEmail, clearPendingVerification]);

  // === PROFILE MANAGEMENT ===
  const getProfile = useCallback(async () => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.getCurrentUserProfile();
      const profile = response.data.user;
      setUserProfile(profile);
      
      // Update user with latest data
      if (user) {
        const updatedUser = { ...user, ...profile };
        setUser(updatedUser);
        localStorage.setItem("hera_user", JSON.stringify(updatedUser));
      }
      
      return { success: true, profile };
    } catch (err: any) {
      let errorMsg = "Failed to load profile";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.updateCurrentUserProfile(profileData);
      const updatedProfile = response.data.user;
      
      setUserProfile(updatedProfile);
      
      // Update user state
      if (user) {
        const updatedUser = { ...user, ...updatedProfile };
        setUser(updatedUser);
        localStorage.setItem("hera_user", JSON.stringify(updatedUser));
      }
      
      return { success: true, profile: updatedProfile };
    } catch (err: any) {
      let errorMsg = "Failed to update profile";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data.message || "Invalid data provided";
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  const deleteAccount = useCallback(async (password: string, confirm: boolean) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.deleteCurrentUserAccount(password, confirm);
      
      // Clear all auth data
      clearAuthData();
      setUser(null);
      setUserProfile(null);
      setUserStats(null);
      setUserActivity([]);
      clearPendingVerification();
      
      navigate('/login');
      
      return { success: true };
    } catch (err: any) {
      let errorMsg = "Failed to delete account";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data.message || "Invalid credentials";
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [navigate, clearPendingVerification]);

  // === PASSWORD MANAGEMENT ===
  const requestPasswordReset = useCallback(async (email: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.requestPasswordReset(email);
      
      if (response.data.success) {
        return { success: true };
      } else {
        throw new Error(response.data.message || "Failed to send reset email");
      }
    } catch (err: any) {
      let errorMsg = "Failed to request password reset";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const validateResetToken = useCallback(async (token: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.validateResetToken(token);
      
      if (response.data.success) {
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.data.message || "Invalid reset token");
      }
    } catch (err: any) {
      let errorMsg = "Invalid or expired reset token";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const resetPassword = useCallback(async (token: string, password: string, confirmPassword: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.resetPassword(token, password, confirmPassword);
      
      if (response.data.success) {
        return { success: true };
      } else {
        throw new Error(response.data.message || "Failed to reset password");
      }
    } catch (err: any) {
      let errorMsg = "Failed to reset password";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data.message || "Invalid password format";
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.changePassword(currentPassword, newPassword, confirmNewPassword);
      
      if (response.data.success) {
        // Update local storage with new token if provided
        const newToken = response.headers['x-new-access-token'];
        if (newToken && user) {
          setAuthData(newToken, user);
        }
        
        return { success: true };
      } else {
        throw new Error(response.data.message || "Failed to change password");
      }
    } catch (err: any) {
      let errorMsg = "Failed to change password";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data.message || "Invalid current password";
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  // === ACTIVITY & STATS ===
  const getActivity = useCallback(async (page: number = 1, limit: number = 20) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.getUserActivity(page, limit);
      const activityData = response.data;
      
      setUserActivity(activityData.activities);
      
      return { success: true, activity: activityData };
    } catch (err: any) {
      let errorMsg = "Failed to load activity";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  const getStats = useCallback(async () => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.getUserStats();
      const stats = response.data.stats;
      
      setUserStats(stats);
      
      return { success: true, stats };
    } catch (err: any) {
      let errorMsg = "Failed to load statistics";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [clearError]);

  // === REGISTER ===
  const register = useCallback(async (userData: any) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.register(userData);
      const { user: newUser, requiresVerification } = response.data;
      
      if (requiresVerification && newUser?.email) {
        savePendingVerificationEmail(newUser.email);
      }
      
      return { 
        success: true, 
        user: newUser,
        requiresVerification: requiresVerification || false
      };
    } catch (err: any) {
      let errorMsg = "Registration failed. Please try again.";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.status === 409) {
        errorMsg = "User with this email already exists";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [savePendingVerificationEmail, clearError]);

  // === REGISTER WITH GOOGLE ===
  const registerWithGoogle = useCallback(async (token: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.googleRegistration({ token });
      const { user: userData, requiresVerification } = response.data;
      
      if (requiresVerification && userData?.email) {
        savePendingVerificationEmail(userData.email);
      }
      
      return { 
        success: true, 
        user: userData,
        requiresVerification: requiresVerification || false
      };
    } catch (err: any) {
      let errorMsg = "Google registration failed. Please try again.";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [savePendingVerificationEmail, clearError]);

  // === LOGIN ===
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.login({ email, password });
      const { accessToken: token, user: userData, verificationRequired } = response.data;
      
      setAuthData(token, userData);
      setUser(userData);
      
      // Start session management
      userService.initializeSession();
      
      if (pendingVerificationEmail === userData.email) {
        clearPendingVerification();
      }
      
      return { 
        success: true, 
        user: userData,
        verificationRequired: verificationRequired || false
      };
    } catch (err: any) {
      let errorMsg = "Login failed. Please try again.";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 403 && err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        errorMsg = "Please verify your email first";
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [pendingVerificationEmail, clearPendingVerification, clearError]);

  // === GOOGLE LOGIN ===
  const googleLogin = useCallback(async (token: string) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.googleLogin({ token });
      const { accessToken: authToken, user: userData, verificationRequired } = response.data;
      
      setAuthData(authToken, userData);
      setUser(userData);
      
      // Start session management
      userService.initializeSession();
      
      if (pendingVerificationEmail === userData.email) {
        clearPendingVerification();
      }
      
      return { 
        success: true, 
        user: userData,
        verificationRequired: verificationRequired || false
      };
    } catch (err: any) {
      let errorMsg = "Google login failed. Please try again.";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMsg = "User not found. Please sign up first.";
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [pendingVerificationEmail, clearPendingVerification, clearError]);

  // === VERIFY EMAIL ===
  const verifyEmail = useCallback(async (code: string) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await emailVerificationService.verifyWithCode(code);

      if (result.success) {
        if (user) {
          const updatedUser = { ...user, isVerified: true };
          setUser(updatedUser);
          localStorage.setItem("hera_user", JSON.stringify(updatedUser));
          
          // Update user status to ONLINE
          userService.sendHeartbeat().catch(console.error);
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || "Email verification failed");
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [user, clearError]);

  // === VERIFY EMAIL PUBLIC ===
  const verifyEmailPublic = useCallback(async (email: string, code: string) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await emailVerificationService.verifyWithEmailAndCode({ email, code });

      if (result.success) {
        if (pendingVerificationEmail === email) {
          clearPendingVerification();
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || "Email verification failed");
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [pendingVerificationEmail, clearPendingVerification, clearError]);

  // === RESEND VERIFICATION EMAIL ===
  const resendVerificationEmail = useCallback(async (email: string) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await emailVerificationService.resendVerificationEmail(email);

      if (result.success) {
        savePendingVerificationEmail(email);
        return { success: true };
      } else {
        throw new Error(result.error || "Failed to resend verification email");
      }
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [savePendingVerificationEmail, clearError]);

  // === LOGOUT ===
  const logout = useCallback(() => {
    userService.stopAllIntervals();
    clearAuthData();
    setUser(null);
    setUserProfile(null);
    setUserStats(null);
    setUserActivity([]);
    clearPendingVerification();
    clearError();
    navigate("/login");
  }, [navigate, clearPendingVerification, clearError]);

  // === UTILITY METHODS ===
  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { success, profile } = await getProfile();
      if (success && profile) {
        const updatedUser = { ...user, ...profile };
        setUser(updatedUser);
        localStorage.setItem("hera_user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [user, getProfile]);

  const validatePassword = useCallback((password: string) => {
    return userService.validatePassword(password);
  }, []);

  const validatePhone = useCallback((phone: string) => {
    return userService.validatePhone(phone);
  }, []);

  const isAdmin = useCallback(() => {
    return userService.isAdmin();
  }, []);

  const isRegularUser = useCallback(() => {
    return userService.isRegularUser();
  }, []);

  // === PREFERENCES METHODS ===
  const updatePreferences = useCallback(async (preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
    timezone?: string;
  }) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await userService.updateUserPreferences(preferences);
      
      if (response.data.success) {
        // Update user profile with new preferences
        await refreshUserProfile();
        return { success: true };
      } else {
        throw new Error(response.data.message || "Failed to update preferences");
      }
    } catch (err: any) {
      let errorMsg = "Failed to update preferences";
      
      if (err.code === 'ERR_NETWORK') {
        errorMsg = "Network Error: Cannot connect to server.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [refreshUserProfile, clearError]);

  // ✅ Memoize the entire context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // State
    user,
    userProfile,
    userStats,
    userActivity,
    loading,
    error,
    isAuthenticated: !!user,
    isVerified: user?.isVerified || false,
    role: user?.role || null,
    pendingVerificationEmail,
    
    // Auth Methods
    login,
    googleLogin,
    register,
    registerWithGoogle,
    logout,
    
    // Verification Methods
    verifyEmail,
    verifyEmailPublic,
    resendVerificationEmail,
    setPendingVerificationEmail: savePendingVerificationEmail,
    clearPendingVerification,
    
    // Profile Management Methods
    getProfile,
    updateProfile,
    deleteAccount,
    
    // Password Management Methods
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    changePassword,
    
    // Activity & Stats Methods
    getActivity,
    getStats,
    
    // Utility Methods
    refreshUserProfile,
    clearError,
    validatePassword,
    validatePhone,
    isAdmin,
    isRegularUser,
    
    // Preferences Methods
    updatePreferences,
  }), [
    // State Dependencies
    user,
    userProfile,
    userStats,
    userActivity,
    loading,
    error,
    pendingVerificationEmail,
    
    // Auth Dependencies
    login,
    googleLogin,
    register,
    registerWithGoogle,
    logout,
    
    // Verification Dependencies
    verifyEmail,
    verifyEmailPublic,
    resendVerificationEmail,
    savePendingVerificationEmail,
    clearPendingVerification,
    
    // Profile Dependencies
    getProfile,
    updateProfile,
    deleteAccount,
    
    // Password Dependencies
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    changePassword,
    
    // Activity Dependencies
    getActivity,
    getStats,
    
    // Utility Dependencies
    refreshUserProfile,
    clearError,
    validatePassword,
    validatePhone,
    isAdmin,
    isRegularUser,
    
    // Preferences Dependencies
    updatePreferences,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};