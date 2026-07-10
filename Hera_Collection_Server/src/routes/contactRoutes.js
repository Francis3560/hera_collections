import express from 'express';
import { handleContactForm } from '../controllers/contactController.js';
import { validateContactForm } from '../validators/contactValidators.js';
import { contactFormLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Send a contact email
 * @access  Public
 */
router.post('/', contactFormLimiter, validateContactForm, handleContactForm);

export default router;
