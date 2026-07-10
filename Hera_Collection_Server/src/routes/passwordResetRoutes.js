import express from 'express';
import {
  requestPasswordResetController,
  validateResetTokenController,
  resetPasswordController,
} from '../controllers/passwordResetController.js';
import { passwordResetLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/request', passwordResetLimiter, requestPasswordResetController);
router.get('/validate/:token', validateResetTokenController);
router.post('/reset', passwordResetLimiter, resetPasswordController);

export default router;