import express from 'express';
import { 
    createEvent, 
    getEvents, 
    getMyEvents, 
    getEventById, 
    updateEvent, 
    deleteEvent,
    searchEvents,
    getTrendingEvents,
    getEventStats,
    getEventAnalytics
} from '../controllers/eventController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';

const router = express.Router();

// Search and trending must come before /:id to avoid conflict
router.get('/search', authenticateToken, searchEvents);
router.get('/trending', getTrendingEvents);
router.get('/my-events', authenticateToken, authorizeRoles('organizer'), getMyEvents);
router.get('/:id/stats', getEventStats);
router.get('/:id', authenticateToken, getEventById);
router.get('/', authenticateToken, getEvents);
router.post('/', authenticateToken, authorizeRoles('organizer'), createEvent);
router.put('/:id', authenticateToken, authorizeRoles('organizer'), updateEvent);
router.delete('/:id', authenticateToken, authorizeRoles('organizer'), deleteEvent);
router.get('/:id/analytics', authenticateToken, authorizeRoles('organizer'), getEventAnalytics);

export default router;