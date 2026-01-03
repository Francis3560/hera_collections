import express from 'express';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';
import { 
  startMpesaPayment, 
  mpesaCallback, 
  checkPaymentStatus,
  getPaymentIntents,
  retryPayment
} from '../controllers/paymentController.js';
import {
  validatePaymentRequest,
  validateMpesaCallback,
  validatePaymentStatus,
  validatePaymentIntentsQuery,
  validateRetryPayment
} from '../validators/paymentValidators.js';

const router = express.Router();
router.post('/mpesa/callback', validateMpesaCallback, mpesaCallback);
router.use(protect);

router.post('/mpesa/start', validatePaymentRequest, startMpesaPayment);
router.get('/status/:checkoutId', validatePaymentStatus, checkPaymentStatus);
router.post('/retry/:paymentIntentId', validateRetryPayment, retryPayment);
router.get('/admin/intents', protectAdmin, validatePaymentIntentsQuery, getPaymentIntents);

export default router;