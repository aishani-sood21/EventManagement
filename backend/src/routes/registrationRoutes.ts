import express from 'express';
import { 
    registerForEvent, 
    getMyRegistrations, 
    getRegistrationByTicket,
    cancelRegistration,
    getEventRegistrations,
    uploadPaymentProof,
    getPendingPayments,
    approveOrRejectPayment,
    getPaymentProofSignedUrl
} from '../controllers/registrationController';
import { authenticateToken, authorizeRoles } from '../middleware/authmidlewar';

const router = express.Router();

router.post('/', authenticateToken, authorizeRoles('participant'), registerForEvent);
router.get('/my-registrations', authenticateToken, authorizeRoles('participant'), getMyRegistrations);
router.get('/ticket/:ticketId', authenticateToken, getRegistrationByTicket);
router.put('/:id/cancel', authenticateToken, authorizeRoles('participant'), cancelRegistration);
router.get('/event/:eventId', authenticateToken, authorizeRoles('organizer'), getEventRegistrations);

// Merchandise payment routes
router.post('/:id/payment-proof', authenticateToken, authorizeRoles('participant'), uploadPaymentProof);
router.get('/:id/payment-proof-url', authenticateToken, getPaymentProofSignedUrl); // Get secure signed URL
router.get('/event/:eventId/pending-payments', authenticateToken, authorizeRoles('organizer'), getPendingPayments);
router.post('/:id/approve-payment', authenticateToken, authorizeRoles('organizer'), approveOrRejectPayment);

export default router;