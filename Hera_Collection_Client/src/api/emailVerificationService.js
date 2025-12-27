import axiosClient from '../utils/axiosClient';

const emailVerificationService = {
  /**
   * Verify email with verification code (protected route - for logged-in users)
   */
  verifyEmail: (code) => {
    return axiosClient.post('/verification/verify', { code });
  },

  /**
   * Verify email publicly (no auth - for registration verification)
   */
  verifyEmailPublic: (data) => {
    return axiosClient.post('/verification/verify-email', data);
  },

  /**
   * Resend verification email publicly (no auth)
   */
  resendVerificationToEmail: (email) => {
    return axiosClient.post('/verification/resend-verification-public', { email });
  },

  /**
   * Verify email with code and handle response (for logged-in users)
   */
  verifyWithCode: async (code) => {
    try {
      const response = await emailVerificationService.verifyEmail(code);
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Email verified successfully'
      };
    } catch (error) {
      console.error('Error verifying email:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        
        if (error.response.status === 400) {
          if (errorData.message?.includes('already verified')) {
            return {
              success: true,
              error: 'Email is already verified',
              isAlreadyVerified: true
            };
          } else if (errorData.message?.includes('expired')) {
            return {
              success: false,
              error: 'Verification code has expired. Please request a new one.',
              isExpired: true
            };
          }
        }
        
        return {
          success: false,
          error: errorData?.message || 'Failed to verify email',
          status: error.response.status
        };
      }
      
      return {
        success: false,
        error: 'Failed to verify email. Please check your connection.'
      };
    }
  },

  /**
   * Verify email with email and code (for non-logged-in users)
   */
  verifyWithEmailAndCode: async (data) => {
    try {
      const response = await emailVerificationService.verifyEmailPublic(data);
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Email verified successfully'
      };
    } catch (error) {
      console.error('Error verifying email publicly:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        
        if (error.response.status === 400) {
          if (errorData.message?.includes('already verified')) {
            return {
              success: true,
              error: 'Email is already verified',
              isAlreadyVerified: true
            };
          } else if (errorData.message?.includes('expired')) {
            return {
              success: false,
              error: 'Verification code has expired. Please request a new one.',
              isExpired: true
            };
          }
        }
        
        return {
          success: false,
          error: errorData?.message || 'Failed to verify email',
          status: error.response.status
        };
      }
      
      return {
        success: false,
        error: 'Failed to verify email. Please check your connection.'
      };
    }
  },

  /**
   * Resend verification email
   */
  resendVerificationEmail: async (email) => {
    try {
      const response = await emailVerificationService.resendVerificationToEmail(email);
      
      return {
        success: true,
        data: response.data,
        message: response.data?.message || 'Verification email sent successfully'
      };
    } catch (error) {
      console.error('Error resending verification:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        
        if (error.response.status === 429) {
          const retryAfter = errorData?.retryAfter || 60;
          return {
            success: false,
            error: `Please wait ${retryAfter} seconds before requesting another verification email.`,
            retryAfter
          };
        }
        
        return {
          success: false,
          error: errorData?.message || 'Failed to resend verification email',
          status: error.response.status
        };
      }
      
      return {
        success: false,
        error: 'Failed to resend verification email. Please check your connection.'
      };
    }
  }
};

export default emailVerificationService;