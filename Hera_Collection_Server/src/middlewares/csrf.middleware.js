import crypto from 'crypto';
import { config } from '../configs/config.js';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function setCsrfCookie(res, token) {
  res.cookie(config.cookies.csrfName, token, config.cookies.csrfOptions);
}

// Double-submit cookie check for the cookie-authenticated endpoints
// (refresh-token, logout). Everything else in this app authenticates via a
// Bearer header, which a cross-site request can't forge, so this only needs
// to guard the handful of routes that rely on the browser auto-attaching a
// cookie.
export function verifyCsrf(req, res, next) {
  const cookieToken = req.cookies?.[config.cookies.csrfName];
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token',
      code: 'CSRF_INVALID',
    });
  }

  next();
}
