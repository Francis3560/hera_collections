import axiosClient from '../utils/axiosClient';

class UserService {
  constructor() {
    this.heartbeatInterval = null;
    this.autoRefreshInterval = null;
    this.isRefreshingToken = false;
  }

  register = (userData) => {
    return axiosClient.post('/users/signup', userData);
  };

  login = (credentials) => {
    return axiosClient.post('/users/login', credentials);
  };

  googleRegistration = (googleData) => {
    return axiosClient.post('/users/google-registration', googleData);
  };

  googleLogin = (googleData) => {
    return axiosClient.post('/users/google-login', googleData);
  };

  refreshToken = () => {
    return axiosClient.post('/users/refresh-token');
  };

  logout = () => {
    this.stopAllIntervals();
    localStorage.removeItem('hera_accessToken');
    localStorage.removeItem('hera_user');
    localStorage.removeItem('hera_refreshTime');
    sessionStorage.removeItem('pending_verification_redirect');
    return Promise.resolve();
  };
  getCurrentUserProfile = () => {
    return axiosClient.get('/users/profile');
  };

  updateCurrentUserProfile = (profileData) => {
    return axiosClient.put('/users/profile', profileData);
  };

  deleteCurrentUserAccount = (password, confirm) => {
    return axiosClient.delete('/users/profile', {
      data: { password, confirm }
    });
  };

  getUserActivity = (page = 1, limit = 20) => {
    return axiosClient.get('/users/profile/activity', {
      params: { page, limit }
    });
  };

  getUserStats = () => {
    return axiosClient.get('/users/profile/stats');
  };
  requestPasswordReset = (email) => {
    return axiosClient.post('/users/password/request-reset', { email });
  };

  validateResetToken = (token) => {
    return axiosClient.get(`/users/password/validate-reset/${token}`);
  };

  resetPassword = (token, password, confirmPassword) => {
    return axiosClient.post('/users/password/reset', {
      token,
      password,
      confirmPassword
    });
  };

  changePassword = (currentPassword, newPassword, confirmNewPassword) => {
    return axiosClient.post('/users/password/change', {
      currentPassword,
      newPassword,
      confirmNewPassword
    });
  };

  getAllUsers = () => {
    return axiosClient.get('/users');
  };

  getUserById = (userId) => {
    return axiosClient.get(`/users/${userId}`);
  };

  createUser = (userData) => {
    return axiosClient.post('/users', userData);
  };

  updateUser = (userId, userData) => {
    return axiosClient.put(`/users/${userId}`, userData);
  };

  deleteUser = (userId) => {
    return axiosClient.delete(`/users/${userId}`);
  };

  getCurrentUser = () => {
    return axiosClient.get('/users/me');
  };


  sendHeartbeat = () => {
    const user = this.getStoredUser();
    if (!user || !user.id) {
      return Promise.reject(new Error('No user found for heartbeat'));
    }
    return axiosClient.post('/users/heartbeat', { userId: user.id });
  };

  setAuthData = (accessToken, userData) => {
    if (accessToken) {
      localStorage.setItem('hera_accessToken', accessToken);
      const expiryTime = Date.now() + 30 * 60 * 1000;
      localStorage.setItem('hera_token_expiry', expiryTime.toString());
    }
    if (userData) {
      localStorage.setItem('hera_user', JSON.stringify(userData));
    }
  };

  clearAuthData = () => {
    localStorage.removeItem('hera_accessToken');
    localStorage.removeItem('hera_user');
    localStorage.removeItem('hera_token_expiry');
    localStorage.removeItem('hera_refreshTime');
  };

  getStoredUser = () => {
    const userStr = localStorage.getItem('hera_user');
    return userStr ? JSON.parse(userStr) : null;
  };

  getAccessToken = () => {
    return localStorage.getItem('hera_accessToken');
  };

  isAuthenticated = () => {
    return !!this.getAccessToken();
  };
  isUserVerified = () => {
    const user = this.getStoredUser();
    return user?.isVerified || false;
  };

  needsVerification = () => {
    const user = this.getStoredUser();
    return user && !user.isVerified;
  };

  startAutoRefresh = () => {
    this.stopAutoRefresh();
    
    this.autoRefreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, 30000); 
    
    setTimeout(() => this.checkAndRefreshToken(), 1000);
  };

  stopAutoRefresh = () => {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  };

  checkAndRefreshToken = async () => {
    if (this.isRefreshingToken) return;
    
    const token = this.getAccessToken();
    if (!token) return;
    
    const expiryTime = localStorage.getItem('hera_token_expiry');
    if (!expiryTime) return;
    
    const timeToExpiry = parseInt(expiryTime) - Date.now();
    
    if (timeToExpiry < 5 * 60 * 1000 && timeToExpiry > 0) {
      await this.refreshTokenSilently();
    }
  };

  refreshTokenSilently = async () => {
    if (this.isRefreshingToken) return;
    
    this.isRefreshingToken = true;
    try {
      axiosClient.defaults.headers.common['X-Auto-Refresh'] = 'true';
      
      const response = await this.refreshToken();
      if (response.data.accessToken) {
        this.setAuthData(response.data.accessToken, this.getStoredUser());
        console.log('Token auto-refreshed successfully');
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);

    } finally {
      this.isRefreshingToken = false;
      delete axiosClient.defaults.headers.common['X-Auto-Refresh'];
    }
  };
  startHeartbeatInterval = (interval = 30000) => {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.sendHeartbeat().catch(error => {
      console.error('Initial heartbeat failed:', error);
    });
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isAuthenticated()) {
        this.sendHeartbeat().catch(error => {
          console.error('Heartbeat failed:', error);
          
          if (error.response?.status === 401) {
      
            this.refreshTokenSilently().catch(() => {
           
              this.stopAllIntervals();
              this.logout();
              window.dispatchEvent(new Event('auth:logout'));
            });
          } else if (error.response?.status === 403 && error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            console.log('Heartbeat: Email not verified');
          } else if (error.response?.status === 404) {
            this.stopAllIntervals();
            this.logout();
            window.dispatchEvent(new Event('auth:logout'));
          }
        });
      } else {
        this.stopHeartbeatInterval();
      }
    }, interval);
  };

  stopHeartbeatInterval = () => {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  };

  stopAllIntervals = () => {
    this.stopHeartbeatInterval();
    this.stopAutoRefresh();
  };


  handleVerificationRedirect = (fromPath) => {
    if (fromPath && 
        !fromPath.includes('/verify-email') && 
        !fromPath.includes('/login') && 
        !fromPath.includes('/signup')) {
      sessionStorage.setItem('pending_verification_redirect', fromPath);
    }
  };

  getPendingRedirect = () => {
    const path = sessionStorage.getItem('pending_verification_redirect');
    sessionStorage.removeItem('pending_verification_redirect');
    return path || '/dashboard';
  };

  getUserRole = () => {
    const user = this.getStoredUser();
    return user?.role || null;
  };

  isAdmin = () => {
    return this.getUserRole() === 'ADMIN';
  };

  isRegularUser = () => {
    return this.getUserRole() === 'USER';
  };

  updateUserPreferences = (preferences) => {
    return this.updateCurrentUserProfile({
      emailNotifications: preferences.emailNotifications,
      smsNotifications: preferences.smsNotifications,
      marketingEmails: preferences.marketingEmails,
      language: preferences.language,
      timezone: preferences.timezone
    });
  };

  initializeSession = () => {
    if (this.isAuthenticated()) {
      // Start both intervals
      this.startHeartbeatInterval();
      this.startAutoRefresh();
      
      // Verify user status on initialization
      return this.getCurrentUserProfile()
        .then(response => {
          const user = response.data.user;
          this.setAuthData(this.getAccessToken(), user);
          return user;
        })
        .catch(error => {
          console.error('Session initialization failed:', error);
          if (error.response?.status === 401) {
            this.logout();
            window.dispatchEvent(new Event('auth:logout'));
          }
          return null;
        });
    }
    return Promise.resolve(null);
  };

  // ==================== VALIDATION HELPERS ====================
  validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters`);
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  validatePhone = (phone) => {
    const pattern = /^(\+254|254)7\d{8}$/;
    return pattern.test(phone);
  };

  // ==================== EXPORT USER DATA ====================
  exportUserData = async () => {
    try {
      const [profile, activity, stats] = await Promise.all([
        this.getCurrentUserProfile(),
        this.getUserActivity(1, 100),
        this.getUserStats()
      ]);
      
      return {
        profile: profile.data.user,
        activity: activity.data.activities,
        stats: stats.data.stats,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  };

  // ==================== MFA (FUTURE) ====================
  enableTwoFactor = () => {
    // To be implemented when MFA is added
    return Promise.reject(new Error('MFA not yet implemented'));
  };

  disableTwoFactor = () => {
    // To be implemented when MFA is added
    return Promise.reject(new Error('MFA not yet implemented'));
  };
}

const userService = new UserService();

// Global initialization
if (typeof window !== 'undefined') {
  // Initialize session on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      userService.initializeSession();
    }, 1000);
  });
  
  // Clear intervals when page is hidden (tab switched)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      userService.stopHeartbeatInterval();
    } else {
      if (userService.isAuthenticated()) {
        userService.startHeartbeatInterval();
        userService.startAutoRefresh();
      }
    }
  });
}

export default userService;