import express from 'express';
import {
    getAllOrganizers,
    createOrganizer,
    updateOrganizerStatus,
    deleteOrganizer,
    getAdminStats,
    resetOrganizerPassword
} from '../controllers/adminController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';

const router = express.Router();

// All routes require admin authentication
router.get('/stats', authenticateToken, authorizeRoles('admin'), getAdminStats);
router.get('/organizers', authenticateToken, authorizeRoles('admin'), getAllOrganizers);
router.post('/organizers', authenticateToken, authorizeRoles('admin'), createOrganizer);
router.put('/organizers/:id/status', authenticateToken, authorizeRoles('admin'), updateOrganizerStatus);
router.post('/organizers/:id/reset-password', authenticateToken, authorizeRoles('admin'), resetOrganizerPassword);
router.delete('/organizers/:id', authenticateToken, authorizeRoles('admin'), deleteOrganizer);

export default router;
