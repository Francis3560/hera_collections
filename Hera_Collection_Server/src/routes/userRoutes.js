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
  sendUserEmailController
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

const router = express.Router();
router.post('/signup', registerController);
router.post('/login', loginController);
router.post('/google-registration', googleRegistrationController);
router.post('/google-login', googleLoginController);
router.post('/refresh-token', refreshTokenController);
router.post('/password/request-reset', requestPasswordResetController);
router.get('/password/validate-reset/:token', validateResetTokenController);
router.post('/password/reset', resetPasswordController);
router.use(protect);
router.get('/profile', getCurrentUserProfileController);
router.put('/profile', updateCurrentUserProfileController);
router.delete('/profile', deleteCurrentUserAccountController);
router.get('/profile/activity', getUserActivityController);
router.get('/profile/stats', getUserStatsController);
router.post('/password/change', changePasswordController);
router.get('/', protectAdmin, getAllUsersController);
router.get('/users/:id', protectAdmin, getUserByIdController);
router.post('/', protectAdmin, createUserController);
router.put('/users/:id', protectAdmin, updateUserController);
router.delete('/users/:id', protectAdmin, deleteUserController);
router.post('/users/:id/email', protectAdmin, sendUserEmailController);
router.get('/me', getCurrentUserController);
router.post('/heartbeat', userHeartbeatController);
router.use(autoRefreshToken);

export default router;