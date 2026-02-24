import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import BlockedIP from '../models/BlockedIP';
import SecurityLog from '../models/SecurityLog';

// ─── Timeout wrapper ────────────────────────────────────────────────────────
// Wraps any promise with a hard timeout so a slow/hung DB call can never
// block the HTTP response. All tracking functions use this.
const withTimeout = <T>(promise: Promise<T>, ms = 3000): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`DB operation timed out after ${ms}ms`)), ms)
    )
  ]);
// ────────────────────────────────────────────────────────────────────────────

// Helper function to get client IP
export const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

// Middleware to check if IP is blocked
export const checkBlockedIP = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  console.log('checkBlockedIP', req.method, req.originalUrl);
  // Allow preflight OPTIONS requests to pass
  if (req.method === 'OPTIONS') return next();
  
  try {
    const ipAddress = getClientIP(req);
    
    const blockedIP = await BlockedIP.findOne({ ipAddress }).maxTimeMS(2000).lean();
    
    if (blockedIP) {
      if (!blockedIP.permanent && blockedIP.blockedUntil && new Date() > blockedIP.blockedUntil) {
        await BlockedIP.deleteOne({ ipAddress }).maxTimeMS(2000);
        return next();
      }
      
      // Fire-and-forget — don't let logging block the response
      withTimeout(SecurityLog.create({
        ipAddress,
        action: 'blocked',
        timestamp: new Date(),
        userAgent: req.headers['user-agent'],
        success: false,
        reason: blockedIP.reason
      })).catch(console.error);
      
      return res.status(403).json({ 
        message: 'Access denied. Your IP has been blocked due to suspicious activity.',
        reason: blockedIP.reason,
        blockedUntil: blockedIP.blockedUntil
      });
    }
    
    next();
  } catch (error) {
    // If the blocked-IP check itself times out or errors, don't block the user
    console.error('Error checking blocked IP:', error);
    next();
  }
};

// Rate limiter for login attempts (5 attempts per 15 minutes)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    console.log('loginRateLimiter', req.method, req.originalUrl);
    return req.method === 'OPTIONS';
  },
  handler: async (req: Request, res: Response) => {
    const ipAddress = getClientIP(req);
    
    // Fire-and-forget logging
    withTimeout(SecurityLog.create({
      ipAddress,
      action: 'login_attempt',
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      success: false,
      reason: 'Rate limit exceeded'
    })).catch(console.error);
    
    res.status(429).json({
      message: 'Too many login attempts from this IP, please try again after 15 minutes'
    });
  }
});

// Rate limiter for registration (3 registrations per hour)
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    console.log('registrationRateLimiter', req.method, req.originalUrl);
    return req.method === 'OPTIONS';
  },
  handler: async (req: Request, res: Response) => {
    const ipAddress = getClientIP(req);
    
    withTimeout(SecurityLog.create({
      ipAddress,
      action: 'registration_attempt',
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      success: false,
      reason: 'Rate limit exceeded'
    })).catch(console.error);
    
    res.status(429).json({
      message: 'Too many registration attempts from this IP, please try again after an hour'
    });
  }
});

// Speed limiter to slow down repeated requests
export const authSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500,
  skip: (req: Request) => {
    console.log('authSpeedLimiter', req.method, req.originalUrl);
    return req.method === 'OPTIONS';
  },
});

// Track failed login attempts and block IP if suspicious
export const trackFailedAttempt = async (ipAddress: string, email: string, userAgent?: string) => {
  try {
    // Log failed attempt — with timeout so it can't hang
    await withTimeout(SecurityLog.create({
      ipAddress,
      action: 'login_failure',
      email,
      timestamp: new Date(),
      userAgent,
      success: false
    }));
    
    // Count recent failures — with timeout
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentFailures = await withTimeout(
      SecurityLog.countDocuments({
        ipAddress,
        action: 'login_failure',
        timestamp: { $gte: thirtyMinutesAgo }
      })
    );
    
    // Block IP if more than 10 failed attempts in 30 minutes
    if (recentFailures >= 10) {
      const blockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
      
      await withTimeout(
        BlockedIP.findOneAndUpdate(
          { ipAddress },
          {
            ipAddress,
            reason: 'Multiple failed login attempts',
            blockedAt: new Date(),
            blockedUntil,
            failedAttempts: recentFailures,
            permanent: false
          },
          { upsert: true, new: true }
        )
      );
      
      console.log(`IP ${ipAddress} blocked due to ${recentFailures} failed login attempts`);
    }
  } catch (error) {
    // Swallow — tracking must never crash or hang the auth flow
    console.error('Error tracking failed attempt:', error);
  }
};

// Track successful login
export const trackSuccessfulLogin = async (ipAddress: string, email: string, userAgent?: string) => {
  try {
    await withTimeout(SecurityLog.create({
      ipAddress,
      action: 'login_success',
      email,
      timestamp: new Date(),
      userAgent,
      success: true
    }));
  } catch (error) {
    console.error('Error tracking successful login:', error);
  }
};

// Track registration attempt
export const trackRegistration = async (ipAddress: string, email: string, success: boolean, userAgent?: string) => {
  try {
    await withTimeout(SecurityLog.create({
      ipAddress,
      action: success ? 'registration_success' : 'registration_attempt',
      email,
      timestamp: new Date(),
      userAgent,
      success
    }));
  } catch (error) {
    console.error('Error tracking registration:', error);
  }
};

// Verify reCAPTCHA token
export const verifyRecaptcha = async (token: string): Promise<boolean> => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) return true; // Dev bypass

    const axios = require('axios');
    
    // Use URLSearchParams - this forces Axios to use 'application/x-www-form-urlencoded'
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const response = await withTimeout<any>(
      axios.post('https://www.google.com/recaptcha/api/siteverify', formData),
      5000
    );

    // LOG THIS to see the actual error code from Google in your terminal
    console.log("Google Verification Result:", response.data);

    return response.data.success === true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
};