import express from 'express';
import { updatePreferences, getUserProfile, getOrganizers, updateUserProfile, changePassword, getOrganizerDetails } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';


const router = express.Router();

router.put('/preferences', authenticateToken, updatePreferences);
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.put('/password', authenticateToken, changePassword);
router.get('/organizers', authenticateToken, getOrganizers);
router.get('/organizers/:id', authenticateToken, getOrganizerDetails);

export default router;