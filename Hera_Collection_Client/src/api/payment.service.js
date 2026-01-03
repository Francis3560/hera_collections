import axiosClient from '../utils/axiosClient';

class PaymentService {
  async startMpesaPayment(paymentData) {
    const response = await axiosClient.post('/payments/mpesa/start', paymentData);
    return response.data;
  }

  async checkPaymentStatus(checkoutId) {
    const response = await axiosClient.get(`/payments/status/${checkoutId}`);
    return response.data;
  }

  async retryPayment(paymentIntentId) {
    const response = await axiosClient.post(`/payments/retry/${paymentIntentId}`);
    return response.data;
  }
}

export default new PaymentService();
