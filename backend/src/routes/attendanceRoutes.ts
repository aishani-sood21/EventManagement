import express from 'express';
import { 
    scanQRCode,
    getAttendanceStats,
    getAttendanceList,
    manualAttendanceOverride,
    exportAttendanceCSV
} from '../controllers/attendanceController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';

const router = express.Router();

// QR code scanning
router.post('/scan', authenticateToken, authorizeRoles('organizer'), scanQRCode);

// Attendance stats and list
router.get('/event/:eventId/stats', authenticateToken, authorizeRoles('organizer'), getAttendanceStats);
router.get('/event/:eventId/list', authenticateToken, authorizeRoles('organizer'), getAttendanceList);

// Manual attendance override
router.post('/manual/:registrationId', authenticateToken, authorizeRoles('organizer'), manualAttendanceOverride);

// Export attendance report
router.get('/event/:eventId/export', authenticateToken, authorizeRoles('organizer'), exportAttendanceCSV);

export default router;
