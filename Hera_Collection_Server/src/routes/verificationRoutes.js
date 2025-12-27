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

const router = express.Router();

router.post('/verify-email', verifyEmailPublicController);
router.post('/resend-verification-public', resendVerificationPublicController);
router.post('/verify-unified', verifyEmailUnifiedController);
router.post('/send-verification', protect, sendVerificationController);
router.post('/verify', protect, verifyEmailController);
router.post('/resend-verification', protect, resendVerificationController);
router.get('/check-verification', protect, checkVerificationController);
router.post('/post-verify', protect, postVerificationController);

export default router;