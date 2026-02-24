import { Response } from 'express';
import Registration from '../models/Registration';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/authmidlewar';

// @desc    Scan QR code and mark attendance
// @route   POST /api/attendance/scan
// @access  Organizer Only
export const scanQRCode = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { qrData, method = 'qr-camera' } = req.body;

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can scan QR codes' });
        }

        if (!qrData) {
            return res.status(400).json({ message: 'QR data is required' });
        }

        // Parse QR data (supports both JSON and legacy pipe-separated format)
        let ticketId: string;
        let eventId: string | undefined;

        try {
            // Try parsing as JSON first (new format)
            const parsedData = JSON.parse(qrData);
            if (parsedData.ticketId && parsedData.type === 'EVENT_TICKET') {
                ticketId = parsedData.ticketId;
                eventId = parsedData.eventId;
            } else {
                return res.status(400).json({ message: 'Invalid QR code format' });
            }
        } catch (jsonError) {
            // If JSON parse fails, try pipe-separated format (legacy)
            try {
                const parts = qrData.split('|');
                if (parts.length >= 2) {
                    eventId = parts[0];
                    ticketId = parts[1];
                } else {
                    // Fallback: treat entire string as ticketId
                    ticketId = qrData;
                }
            } catch (error) {
                return res.status(400).json({ message: 'Invalid QR code format' });
            }
        }

        // Find registration by ticketId
        const registration = await Registration.findOne({ ticketId })
            .populate('eventId')
            .populate('participantId', 'email profile.firstName profile.lastName');

        if (!registration) {
            return res.status(404).json({ 
                message: 'Invalid ticket',
                error: 'TICKET_NOT_FOUND'
            });
        }

        const event = registration.eventId as any;

        // Verify organizer owns this event
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ 
                message: 'You can only scan QR codes for your own events',
                error: 'UNAUTHORIZED_EVENT'
            });
        }

        // Check if ticket is valid (not cancelled, etc.)
        if (registration.status === 'Cancelled' || registration.status === 'Rejected') {
            return res.status(400).json({ 
                message: `Ticket is ${registration.status.toLowerCase()}`,
                error: 'INVALID_STATUS',
                status: registration.status
            });
        }

        // Check if already attended (duplicate scan)
        if (registration.attended) {
            return res.status(400).json({ 
                message: 'Ticket already scanned',
                error: 'DUPLICATE_SCAN',
                attendanceTimestamp: registration.attendanceTimestamp,
                scannedBy: registration.attendanceScannedBy
            });
        }

        // For merchandise events, check payment approval
        if (event.type === 'Merchandise' && registration.paymentStatus !== 'Approved') {
            return res.status(400).json({ 
                message: 'Payment not approved for this merchandise order',
                error: 'PAYMENT_NOT_APPROVED',
                paymentStatus: registration.paymentStatus
            });
        }

        // Mark attendance
        registration.attended = true;
        registration.attendanceTimestamp = new Date();
        registration.attendanceScannedBy = req.user.id;
        registration.attendanceMethod = method as 'qr-camera' | 'qr-upload' | 'manual';
        registration.status = 'Completed';
        registration.updatedAt = new Date();

        await registration.save();

        const participant = registration.participantId as any;
        const participantName = participant?.profile?.firstName 
            ? `${participant.profile.firstName} ${participant.profile.lastName || ''}`
            : participant?.email || 'Unknown';

        return res.json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                ticketId: registration.ticketId,
                participantName,
                participantEmail: participant?.email,
                eventName: event.name,
                attendanceTimestamp: registration.attendanceTimestamp,
                method: registration.attendanceMethod
            }
        });

    } catch (err) {
        console.error('Error scanning QR code:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get attendance stats for an event
// @route   GET /api/attendance/event/:eventId/stats
// @access  Organizer Only
export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Verify event exists and belongs to organizer
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get all registrations for this event
        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'email profile.firstName profile.lastName profile.contactNumber');

        const stats = {
            totalRegistrations: registrations.length,
            attended: registrations.filter(r => r.attended).length,
            notAttended: registrations.filter(r => !r.attended && r.status !== 'Cancelled').length,
            cancelled: registrations.filter(r => r.status === 'Cancelled').length,
            attendanceRate: 0,
            byMethod: {
                qrCamera: registrations.filter(r => r.attendanceMethod === 'qr-camera').length,
                qrUpload: registrations.filter(r => r.attendanceMethod === 'qr-upload').length,
                manual: registrations.filter(r => r.attendanceMethod === 'manual').length
            }
        };

        if (stats.totalRegistrations > 0) {
            stats.attendanceRate = Math.round((stats.attended / stats.totalRegistrations) * 100);
        }

        return res.json(stats);

    } catch (err) {
        console.error('Error getting attendance stats:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get attendance list for an event
// @route   GET /api/attendance/event/:eventId/list
// @access  Organizer Only
export const getAttendanceList = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;
        const { filter = 'all' } = req.query; // all, attended, not-attended

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Verify event exists and belongs to organizer
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Build query based on filter
        let query: any = { eventId };
        if (filter === 'attended') {
            query.attended = true;
        } else if (filter === 'not-attended') {
            query.attended = false;
            query.status = { $ne: 'Cancelled' };
        }

        // Get registrations
        const registrations = await Registration.find(query)
            .populate('participantId', 'email profile.firstName profile.lastName profile.contactNumber')
            .populate('attendanceScannedBy', 'email profile.organizerName')
            .sort({ attendanceTimestamp: -1, registeredAt: -1 });

        const attendanceList = registrations.map(reg => {
            const participant = reg.participantId as any;
            const scannedBy = reg.attendanceScannedBy as any;

            return {
                _id: reg._id,
                ticketId: reg.ticketId,
                participantName: participant?.profile?.firstName 
                    ? `${participant.profile.firstName} ${participant.profile.lastName || ''}`
                    : participant?.email || 'Unknown',
                participantEmail: participant?.email,
                participantContact: participant?.profile?.contactNumber,
                attended: reg.attended,
                attendanceTimestamp: reg.attendanceTimestamp,
                attendanceMethod: reg.attendanceMethod,
                attendanceNotes: reg.attendanceNotes,
                scannedBy: scannedBy?.profile?.organizerName || scannedBy?.email,
                status: reg.status,
                registeredAt: reg.registeredAt
            };
        });

        return res.json({
            event: {
                _id: event._id,
                name: event.name,
                startDate: event.startDate
            },
            attendanceList
        });

    } catch (err) {
        console.error('Error getting attendance list:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Manual attendance override
// @route   POST /api/attendance/manual/:registrationId
// @access  Organizer Only
export const manualAttendanceOverride = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { registrationId } = req.params;
        const { attended, notes } = req.body;

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can override attendance' });
        }

        if (typeof attended !== 'boolean') {
            return res.status(400).json({ message: 'Attended status (boolean) is required' });
        }

        const registration = await Registration.findById(registrationId).populate('eventId');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const event = registration.eventId as any;

        // Verify organizer owns this event
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only modify attendance for your own events' });
        }

        // Update attendance
        const previousStatus = registration.attended;
        registration.attended = attended;
        
        if (attended && !registration.attendanceTimestamp) {
            registration.attendanceTimestamp = new Date();
        }
        
        registration.attendanceScannedBy = req.user.id;
        registration.attendanceMethod = 'manual';
        registration.attendanceNotes = notes || `Manual override by organizer. Previous: ${previousStatus}`;
        registration.updatedAt = new Date();

        if (attended) {
            registration.status = 'Completed';
        }

        await registration.save();

        return res.json({
            success: true,
            message: `Attendance manually ${attended ? 'marked' : 'unmarked'}`,
            registration
        });

    } catch (err) {
        console.error('Error with manual attendance override:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Export attendance report as CSV
// @route   GET /api/attendance/event/:eventId/export
// @access  Organizer Only
export const exportAttendanceCSV = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Verify event exists and belongs to organizer
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get all registrations
        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'email profile.firstName profile.lastName profile.contactNumber')
            .populate('attendanceScannedBy', 'email profile.organizerName')
            .sort({ ticketId: 1 });

        // Generate CSV
        const csvRows = [];
        
        // Header
        csvRows.push([
            'Ticket ID',
            'Participant Name',
            'Email',
            'Contact Number',
            'Registration Date',
            'Attended',
            'Attendance Timestamp',
            'Attendance Method',
            'Scanned By',
            'Status',
            'Notes'
        ].join(','));

        // Data rows
        registrations.forEach(reg => {
            const participant = reg.participantId as any;
            const scannedBy = reg.attendanceScannedBy as any;

            const participantName = participant?.profile?.firstName 
                ? `${participant.profile.firstName} ${participant.profile.lastName || ''}`
                : 'Unknown';

            csvRows.push([
                reg.ticketId,
                `"${participantName}"`,
                participant?.email || '',
                participant?.profile?.contactNumber || '',
                new Date(reg.registeredAt).toLocaleString(),
                reg.attended ? 'Yes' : 'No',
                reg.attendanceTimestamp ? new Date(reg.attendanceTimestamp).toLocaleString() : '',
                reg.attendanceMethod || '',
                scannedBy?.profile?.organizerName || scannedBy?.email || '',
                reg.status,
                `"${reg.attendanceNotes || ''}"`
            ].join(','));
        });

        const csv = csvRows.join('\n');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.csv"`);
        
        return res.send(csv);

    } catch (err) {
        console.error('Error exporting attendance CSV:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};
