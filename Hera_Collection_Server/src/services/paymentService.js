// services/paymentService.js
import axios from 'axios';
import { config } from '../configs/config.js';

const { mpesa } = config;

/**
 * Generate an OAuth token from Safaricom MPESA API
 */
async function getAccessToken() {
  const auth = Buffer.from(`${mpesa.consumerKey}:${mpesa.consumerSecret}`).toString('base64');

  try {
    console.log('Fetching MPESA access token from:', `${mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`);
    const response = await axios.get(
      `${mpesa.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: { 
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000, // Increased to 20 seconds
      }
    );
    
    if (!response.data.access_token) {
      throw new Error('No access token in response');
    }
    
    return response.data.access_token;
    
  } catch (err) {
    console.error('Failed to fetch MPESA access token:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });
    
    // Throw more specific error
    if (err.response?.status === 401) {
      throw new Error('MPESA API credentials are invalid');
    } else if (err.code === 'ECONNREFUSED') {
      throw new Error('MPESA API is unreachable');
    } else if (err.code === 'ETIMEDOUT') {
      throw new Error('MPESA API request timed out');
    }
    
    throw new Error('MPESA authentication failed');
  }
}

/**
 * Validates and normalizes a Kenyan phone number
 * @param {string} phone - Raw phone number
 * @returns {string} Normalized phone number (254XXXXXXXXX)
 */
export function normalizePhoneNumber(phone) {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Kenyan number
  if (!/^(?:254|0)?([17][0-9]{8})$/.test(cleaned)) {
    throw new Error('Invalid Kenyan phone number format');
  }
  
  // Convert to 254 format
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254')) {
    // Assume it's missing country code but starts with 7
    if ((cleaned.startsWith('7') || cleaned.startsWith('1')) && cleaned.length === 9) {
      cleaned = '254' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Initiates an MPESA STK Push request
 * @param {Object} options
 * @param {number} options.amount - Amount to charge
 * @param {string} options.phone - Customer phone number
 * @param {string} [options.accountReference] - Account reference
 * @param {string} [options.transactionDesc] - Transaction description
 * @returns {Promise<Object>} MPESA API response
 */
export async function initiateStkPush({ amount, phone, accountReference, transactionDesc }) {
  try {
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    
    // Get access token
    const token = await getAccessToken();
    
    // Generate timestamp and password
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const password = Buffer.from(`${mpesa.shortCode}${mpesa.passkey}${timestamp}`).toString('base64');
    
    // Prepare request payload
    const requestPayload = {
      BusinessShortCode: mpesa.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Round to nearest whole number
      PartyA: normalizedPhone,
      PartyB: mpesa.shortCode,
      PhoneNumber: normalizedPhone,
      CallBackURL: mpesa.callbackUrl,
      AccountReference: accountReference || 'VizX Global',
      TransactionDesc: transactionDesc || 'VizX Global Purchase',
    };
    
    console.log('Initiating MPESA STK Push:', {
      amount,
      phone: normalizedPhone,
      accountReference,
      businessShortCode: mpesa.shortCode,
      timestamp
    });
    
    // Make API request
    const response = await axios.post(
      `${mpesa.baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestPayload,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000, // 15 second timeout
      }
    );
    
    const responseData = response.data;
    
    // Log the response for debugging
    console.log('MPESA STK Push response:', {
      responseCode: responseData.ResponseCode,
      responseDescription: responseData.ResponseDescription,
      checkoutRequestId: responseData.CheckoutRequestID,
      merchantRequestId: responseData.MerchantRequestID,
      customerMessage: responseData.CustomerMessage
    });
    
    return responseData;
    
  } catch (err) {
    console.error('MPESA STK Push error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method
      }
    });
    
    // Throw user-friendly error messages
    if (err.response?.data) {
      const errorData = err.response.data;
      
      if (errorData.errorCode === '500.001.1001') {
        throw new Error('Invalid phone number format');
      } else if (errorData.errorCode === '400.002.02') {
        throw new Error('Invalid amount. Amount must be between 1 and 150,000');
      } else if (errorData.errorMessage) {
        throw new Error(`MPESA error: ${errorData.errorMessage}`);
      }
    }
    
    if (err.message.includes('phone number')) {
      throw err; // Re-throw phone validation errors
    }
    
    throw new Error('Failed to initiate payment request. Please try again.');
  }
}

/**
 * Query MPESA transaction status
 * @param {string} checkoutRequestId - The checkout request ID
 * @returns {Promise<Object>} Transaction status
 */
export async function queryTransactionStatus(checkoutRequestId) {
  try {
    if (!checkoutRequestId) {
      throw new Error('Checkout request ID is required');
    }
    
    const token = await getAccessToken();
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(
      now.getMinutes()
    ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    const password = Buffer.from(`${mpesa.shortCode}${mpesa.passkey}${timestamp}`).toString('base64');
    
    const requestPayload = {
      BusinessShortCode: mpesa.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };
    
    const response = await axios.post(
      `${mpesa.baseUrl}/mpesa/stkpushquery/v1/query`,
      requestPayload,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
      }
    );
    
    return response.data;
    
  } catch (err) {
    console.error('Query transaction status error:', err.message || err);
    throw new Error('Failed to query transaction status');
  }
}

/**
 * Get payment statistics
 * @returns {Promise<Object>} Payment statistics
 */
export async function getPaymentStats() {
  const [
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    totalRevenue,
    todayRevenue
  ] = await Promise.all([
    prisma.paymentIntent.count(),
    prisma.paymentIntent.count({ where: { status: 'SUCCESS' } }),
    prisma.paymentIntent.count({ where: { status: 'FAILED' } }),
    prisma.paymentIntent.count({ where: { status: 'PENDING' } }),
    prisma.paymentIntent.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true }
    }),
    prisma.paymentIntent.aggregate({
      where: { 
        status: 'SUCCESS',
        createdAt: { 
          gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      },
      _sum: { amount: true }
    })
  ]);
  
  return {
    totals: {
      payments: totalPayments,
      revenue: Number(totalRevenue._sum.amount) || 0,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0
    },
    status: {
      success: successfulPayments,
      failed: failedPayments,
      pending: pendingPayments
    },
    today: {
      revenue: Number(todayRevenue._sum.amount) || 0
    }
  };
}