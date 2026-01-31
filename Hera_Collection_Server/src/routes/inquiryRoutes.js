import express from 'express';
import { 
  getMySession, 
  sendMessage, 
  getActiveInquiries, 
  adminReply, 
  closeInquiry,
  getInquiryMessages
} from '../controllers/inquiryController.js';
import { protect, protectAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Public/User Routes
 */

// Optional authentication - if logged in, it uses userId, otherwise guest
router.post('/session', (req, res, next) => {
    // Custom logic to allow optional authentication
    // If Auth header exists, use authenticate, else continue
    if (req.headers.authorization) {
        return protect(req, res, next);
    }
    next();
}, getMySession);

router.post('/message', (req, res, next) => {
    if (req.headers.authorization) {
        return protect(req, res, next);
    }
    next();
}, sendMessage);

/**
 * Admin Routes
 */
router.get('/active', protect, protectAdmin, getActiveInquiries);
router.get('/:id/messages', protect, protectAdmin, getInquiryMessages);
router.post('/reply', protect, protectAdmin, adminReply);
router.delete('/:id', protect, protectAdmin, closeInquiry);

export default router;
