import express from 'express';
// 👇 Ensure createOrganizer is in this list
import { registerParticipant, loginUser, createOrganizer } from '../controllers/authController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';
import { 
    checkBlockedIP, 
    loginRateLimiter, 
    registrationRateLimiter, 
    authSpeedLimiter 
} from '../middleware/rateLimiter';

const router = express.Router();

router.post(
    '/register', 
    checkBlockedIP, 
    registrationRateLimiter, 
    authSpeedLimiter, 
    registerParticipant
);

router.post(
    '/login', 
    checkBlockedIP, 
    loginRateLimiter, 
    authSpeedLimiter, 
    loginUser
);

// Protected Admin Route
router.post(
    '/create-organizer', 
    authenticateToken, 
    authorizeRoles('admin'), 
    createOrganizer
);

export default router;