import express from 'express';
import { 
  sendVerificationController,
  verifyEmailController,
  resendVerificationController,
  checkVerificationController,
  postVerificationController,
  verifyEmailPublicController,
  resendVerificationPublicController,
  verifyEmailUnifiedController
} from '../controllers/verificationController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { verificationLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Rate limited: these guard a 6-digit verification code (900,000 combinations,
// 10 min expiry) and a resend action that could otherwise be used to spam mail.
router.post('/verify-email', verificationLimiter, verifyEmailPublicController);
router.post('/resend-verification-public', verificationLimiter, resendVerificationPublicController);
router.post('/verify-unified', verificationLimiter, verifyEmailUnifiedController);
router.post('/send-verification', protect, verificationLimiter, sendVerificationController);
router.post('/verify', protect, verificationLimiter, verifyEmailController);
router.post('/resend-verification', protect, verificationLimiter, resendVerificationController);
router.get('/check-verification', protect, checkVerificationController);
router.post('/post-verify', protect, postVerificationController);

export default router;