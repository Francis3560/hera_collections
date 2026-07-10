import express from 'express';
import {
  registerController,
  loginController,
  refreshTokenController,
  getAllUsersController,
  getCurrentUserController,
  deleteUserController,
  updateUserController,
  createUserController,
  getUserByIdController,
  userHeartbeatController,
  googleRegistrationController,
  googleLoginController,
  sendUserEmailController,
  logoutController
} from '../controllers/authController.js';

import {
  getCurrentUserProfileController,
  updateCurrentUserProfileController,
  deleteCurrentUserAccountController,
  getUserActivityController,
  getUserStatsController,
} from '../controllers/profileController.js';

import {
  requestPasswordResetController,
  validateResetTokenController,
  resetPasswordController,
  changePasswordController,
} from '../controllers/passwordResetController.js';

import { protect, protectAdmin, protectUserVerified } from '../middlewares/authMiddleware.js';
import { autoRefreshToken } from '../utils/tokenUtils.js';
import { authLimiter, passwordResetLimiter } from '../middlewares/rateLimiter.js';
import { verifyCsrf } from '../middlewares/csrf.middleware.js';

const router = express.Router();
router.post('/signup', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/google-registration', authLimiter, googleRegistrationController);
router.post('/google-login', authLimiter, googleLoginController);
// Cookie-only auth (no Bearer header) — the only endpoint that genuinely needs
// the double-submit CSRF check, since everything else requires a Bearer token
// a cross-site request can't forge.
router.post('/refresh-token', verifyCsrf, refreshTokenController);
router.post('/password/request-reset', passwordResetLimiter, requestPasswordResetController);
router.get('/password/validate-reset/:token', validateResetTokenController);
router.post('/password/reset', passwordResetLimiter, resetPasswordController);
router.use(protect);
router.post('/logout', logoutController);
router.get('/profile', getCurrentUserProfileController);
router.put('/profile', updateCurrentUserProfileController);
router.delete('/profile', deleteCurrentUserAccountController);
router.get('/profile/activity', getUserActivityController);
router.get('/profile/stats', getUserStatsController);
router.post('/password/change', passwordResetLimiter, changePasswordController);
router.get('/', protectAdmin, getAllUsersController);
router.get('/:id', protectAdmin, getUserByIdController);
router.post('/', protectAdmin, createUserController);
router.put('/:id', protectAdmin, updateUserController);
router.delete('/:id', protectAdmin, deleteUserController);
router.post('/:id/email', protectAdmin, sendUserEmailController);
router.get('/me', getCurrentUserController);
router.post('/heartbeat', userHeartbeatController);
router.use(autoRefreshToken);

export default router;