import express from 'express';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import { 
  startMpesaPayment, 
  mpesaCallback, 
  checkPaymentStatus,
  getPaymentIntents,
  retryPayment,
  getPaystackConfig,
  paystackWebhook
} from '../controllers/paymentController.js';
import {
  validatePaymentRequest,
  validateMpesaCallback,
  validatePaymentStatus,
  validatePaymentIntentsQuery,
  validateRetryPayment
} from '../validators/paymentValidators.js';
import { paymentCallbackLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();
router.post('/mpesa/callback', paymentCallbackLimiter, validateMpesaCallback, mpesaCallback);
router.post('/paystack/webhook', paymentCallbackLimiter, paystackWebhook);

// Public route to get paystack config if needed? 
// Or protect it? If it's for checkout, maybe protect it.
router.get('/paystack/config', getPaystackConfig);

router.use(protect);

router.post('/mpesa/start', validatePaymentRequest, startMpesaPayment);

router.get('/status/:checkoutId', validatePaymentStatus, checkPaymentStatus);
router.post('/retry/:paymentIntentId', validateRetryPayment, retryPayment);
router.get('/admin/intents', protectAdmin, validatePaymentIntentsQuery, getPaymentIntents);

export default router;