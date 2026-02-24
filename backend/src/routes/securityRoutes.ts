import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';
import {
    getSecurityLogs,
    getBlockedIPs,
    unblockIP,
    blockIP,
    getSecurityStats
} from '../controllers/securityController';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, authorizeRoles('admin'));

router.get('/logs', getSecurityLogs);
router.get('/blocked-ips', getBlockedIPs);
router.delete('/blocked-ips/:ipAddress', unblockIP);
router.post('/block-ip', blockIP);
router.get('/stats', getSecurityStats);

export default router;
