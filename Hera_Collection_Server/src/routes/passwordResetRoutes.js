import express from 'express';
import {
  requestPasswordResetController,
  validateResetTokenController,
  resetPasswordController,
} from '../controllers/passwordResetController.js';

const router = express.Router();

router.post('/request', requestPasswordResetController);
router.get('/validate/:token', validateResetTokenController);
router.post('/reset', resetPasswordController);

export default router;