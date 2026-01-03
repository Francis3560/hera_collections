import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const isExplicitlyPublic = 
      config.url?.includes('/users/signup') ||
      config.url?.includes('/users/login') ||
      config.url?.includes('/users/google-') ||
      config.url?.includes('/refresh-token') ||
      config.url?.includes('/users/refresh-token') ||
      (config.url?.includes('/verification/verify-email') && config.method === 'post') ||
      (config.url?.includes('/verification/resend-verification-public') && config.method === 'post') ||
      (config.url?.includes('/password/request-reset') && config.method === 'post') ||
      (config.url?.includes('/password/validate-reset/') && config.method === 'get') ||
      (config.url?.includes('/password/reset') && config.method === 'post');
    
    if (!isExplicitlyPublic) {
      const token = localStorage.getItem('hera_accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Add auto-refresh header if set
    if (config.headers['X-Auto-Refresh']) {
      config.headers['X-Auto-Refresh'] = 'true';
    }
    
    // Add device info headers
    if (typeof window !== 'undefined') {
      config.headers['X-Platform'] = window.navigator.platform;
      config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (window.screen) {
        config.headers['X-Screen-Resolution'] = `${window.screen.width}x${window.screen.height}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosClient.interceptors.response.use(
  (response) => {
    const newAccessToken = response.headers['x-new-access-token'];
    if (newAccessToken) {
      localStorage.setItem('hera_accessToken', newAccessToken);
      const expiryTime = Date.now() + 30 * 60 * 1000;
      localStorage.setItem('hera_token_expiry', expiryTime.toString());
      axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
  
    if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:email-not-verified', {
          detail: error.response.data
        }));
      }
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/api/users/refresh-token`, {}, {
          withCredentials: true
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('hera_accessToken', accessToken);
        // Update token expiry (30 minutes from now)
        const expiryTime = Date.now() + 30 * 60 * 1000;
        localStorage.setItem('hera_token_expiry', expiryTime.toString());
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        isRefreshing = false;
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('hera_accessToken');
        localStorage.removeItem('hera_user');
        localStorage.removeItem('hera_token_expiry');
        
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const setAuthData = (accessToken, user) => {
  if (accessToken) {
    localStorage.setItem('hera_accessToken', accessToken);
    const expiryTime = Date.now() + 30 * 60 * 1000;
    localStorage.setItem('hera_token_expiry', expiryTime.toString());
    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }
  if (user) {
    localStorage.setItem('hera_user', JSON.stringify(user));
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('hera_accessToken');
  localStorage.removeItem('hera_user');
  localStorage.removeItem('hera_token_expiry');
  delete axiosClient.defaults.headers.common['Authorization'];
};

export const isTokenExpired = () => {
  const expiryTime = localStorage.getItem('hera_token_expiry');
  if (!expiryTime) return true;
  return Date.now() > parseInt(expiryTime);
};

export const getTokenExpiryTime = () => {
  const expiryTime = localStorage.getItem('hera_token_expiry');
  return expiryTime ? parseInt(expiryTime) : null;
};

export default axiosClient;