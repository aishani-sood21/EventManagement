import { Response } from 'express';
import Registration from '../models/Registration';
import Event from '../models/Event';
import { AuthRequest } from '../middleware/authmidlewar';
import { sendTicketEmail, sendMerchandiseEmail } from '../services/emailServices';
import { generateQRCode, generateTicketQRData } from '../utils/qrcodeGenerator';
import User from '../models/User';
import { uploadToGCS, deleteFromGCS, checkGCSConnection, getSignedUrl } from '../config/googleCloudStorage';


// @desc    Register for an event
// @route   POST /api/registrations
// @access  Participant Only
export const registerForEvent = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId, teamName, customFormData, merchandiseSelection } = req.body;

        if (!req.user || req.user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can register for events' });
        }

        // Check if event exists
        const event = await Event.findById(eventId).populate('organizerId');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check if already registered
        const existingReg = await Registration.findOne({
            participantId: req.user.id,
            eventId: eventId
        });

        if (existingReg) {
            return res.status(400).json({ message: 'Already registered for this event' });
        }

        // Check registration limit
        const currentRegistrations = await Registration.countDocuments({
            eventId: eventId,
            status: { $in: ['Registered', 'Completed'] }
        });

        let status: 'Registered' | 'Waitlisted' = 'Registered';
        if (event.registrationLimit && currentRegistrations >= event.registrationLimit) {
            status = 'Waitlisted';
        }

        // For merchandise, check stock but DON'T decrement yet (will decrement on payment approval)
        if (event.type === 'Merchandise' && merchandiseSelection && merchandiseSelection.length > 0) {
            for (const item of merchandiseSelection) {
                const variant = event.merchandise?.variants.find((v: any) => 
                    v._id.toString() === item.variantId
                );
                
                if (!variant) {
                    return res.status(400).json({ 
                        message: `Variant not found: ${item.variantId}` 
                    });
                }
                
                if (variant.stock < item.quantity) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for ${variant.variantName}. Available: ${variant.stock}` 
                    });
                }
            }
            
            // Note: Stock will be decremented when payment is approved
            // NOT at registration time for merchandise orders
        }

        // Create registration
        const registration = new Registration({
            participantId: req.user.id,
            userId: req.user.id,
            eventId,
            status,
            teamName,
            customFormData,
            merchandiseSelection
        });

        await registration.save();

        // Generate QR code only for non-merchandise events
        // For merchandise, QR will be generated after payment approval
        if (event.type !== 'Merchandise') {
            const qrData = generateTicketQRData(
                registration.ticketId,
                eventId.toString(),
                req.user.id
            );
            const qrCodeDataUrl = await generateQRCode(qrData);
            registration.qrCode = qrCodeDataUrl;
            await registration.save();
        }

        // Add to event's registered participants
        event.registeredParticipants.push(req.user.id as any);
        await event.save();

        // Get participant details
        const participant = await User.findById(req.user.id);
        const participantName = participant?.profile?.firstName 
            ? `${participant.profile.firstName} ${participant.profile.lastName || ''}`
            : participant?.email || 'Participant';

        // Send email only for non-merchandise events
        // For merchandise, email will be sent after payment approval
        if (event.type !== 'Merchandise') {
            try {
                await sendTicketEmail(
                    participant?.email || '',
                    participantName,
                    event.name,
                    event.startDate,
                    registration.ticketId,
                    eventId.toString(),
                    req.user.id
                );
                
                registration.emailSent = true;
                await registration.save();
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue even if email fails
            }
        }

        const populatedReg = await Registration.findById(registration._id)
            .populate('eventId', 'name type startDate endDate')
            .populate('participantId', 'email profile.firstName profile.lastName');

        res.status(201).json(populatedReg);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};
// @desc    Get participant's registrations (My Events)
// @route   GET /api/registrations/my-registrations
// @access  Participant Only
export const getMyRegistrations = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const registrations = await Registration.find({ participantId: req.user.id })
            .populate({
                path: 'eventId',
                populate: {
                    path: 'organizerId',
                    select: 'profile.organizerName email'
                }
            })
            .sort({ registeredAt: -1 });

        // Format the response to include organizer name properly
        const formattedRegistrations = registrations.map(reg => {
            const regObj: any = reg.toObject();
            if (regObj.eventId && regObj.eventId.organizerId) {
                regObj.eventId.organizerName = regObj.eventId.organizerId.profile?.organizerName || 
                                               regObj.eventId.organizerId.email || 
                                               'Unknown Organizer';
            }
            return regObj;
        });

        res.json(formattedRegistrations);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get single registration by ticket ID
// @route   GET /api/registrations/ticket/:ticketId
// @access  Participant Only (own tickets)
export const getRegistrationByTicket = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const registration = await Registration.findOne({ ticketId: req.params.ticketId })
            .populate('eventId')
            .populate('participantId', 'email profile.firstName profile.lastName');

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.participantId._id.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(registration);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Cancel registration
// @route   PUT /api/registrations/:id/cancel
// @access  Participant Only
export const cancelRegistration = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        if (registration.participantId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        registration.status = 'Cancelled';
        registration.updatedAt = new Date();
        await registration.save();

        res.json(registration);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get all registrations for a specific event (Organizer only)
// @route   GET /api/registrations/event/:eventId
// @access  Organizer Only
export const getEventRegistrations = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;
        
        // Verify event exists and belongs to organizer
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        if (event.organizerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const registrations = await Registration.find({ eventId })
            .populate('userId', 'email profile.firstName profile.lastName profile.contactNumber')
            .populate('participantId', 'email profile.firstName profile.lastName profile.contactNumber')
            .sort({ registrationDate: -1 });
        
        res.json(registrations);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Upload payment proof for merchandise order
// @route   POST /api/registrations/:id/payment-proof
// @access  Participant Only
export const uploadPaymentProof = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { paymentProof } = req.body; // base64 image

        if (!req.user || req.user.role !== 'participant') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const registration = await Registration.findById(id).populate('eventId');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check if user owns this registration
        if (registration.participantId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this registration' });
        }

        // Check if it's a merchandise event
        const event = registration.eventId as any;
        if (event.type !== 'Merchandise') {
            return res.status(400).json({ message: 'Payment proof only applicable for merchandise orders' });
        }

        // Try to upload to Google Cloud Storage
        let paymentProofUrl = paymentProof;
        
        try {
            // Check if GCS is configured
            const isGCSConfigured = await checkGCSConnection();
            
            if (isGCSConfigured && paymentProof) {
                // Delete old payment proof if exists
                if (registration.paymentProof && registration.paymentProof.includes('storage.googleapis.com')) {
                    await deleteFromGCS(registration.paymentProof);
                }

                // Upload new payment proof to GCS
                const filename = `payment-${registration._id}-${Date.now()}.jpg`;
                paymentProofUrl = await uploadToGCS(paymentProof, filename);
                console.log('✅ Payment proof uploaded to GCS:', paymentProofUrl);
            } else {
                console.log('⚠️ GCS not configured, storing base64 in database');
                paymentProofUrl = paymentProof; // Fallback to base64
            }
        } catch (gcsError) {
            console.error('GCS upload failed, using base64 fallback:', gcsError);
            paymentProofUrl = paymentProof; // Fallback to base64
        }

        // Update registration with payment proof URL or base64
        registration.paymentProof = paymentProofUrl;
        registration.paymentStatus = 'Pending';
        await registration.save();

        res.json({ 
            message: 'Payment proof uploaded successfully. Waiting for organizer approval.',
            registration 
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get signed URL for payment proof image (secure access)
// @route   GET /api/registrations/:id/payment-proof-url
// @access  Participant (own registration) or Organizer (their events)
export const getPaymentProofSignedUrl = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const registration = await Registration.findById(id).populate('eventId');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const event = registration.eventId as any;

        // Authorization: participant can view their own payment proof, organizer can view for their events
        const isParticipant = req.user.role === 'participant' && registration.participantId.toString() === req.user.id;
        const isOrganizer = req.user.role === 'organizer' && event.organizerId.toString() === req.user.id;

        if (!isParticipant && !isOrganizer) {
            return res.status(403).json({ message: 'Not authorized to view this payment proof' });
        }

        if (!registration.paymentProof) {
            return res.status(404).json({ message: 'No payment proof uploaded' });
        }

        // If stored in GCS (starts with gs://), generate signed URL
        if (registration.paymentProof.startsWith('gs://')) {
            try {
                const signedUrl = await getSignedUrl(registration.paymentProof, 15); // Valid for 15 minutes
                return res.json({ 
                    url: signedUrl,
                    expiresIn: '15 minutes',
                    type: 'signed-url'
                });
            } catch (error) {
                console.error('Error generating signed URL:', error);
                return res.status(500).json({ message: 'Failed to generate secure access URL' });
            }
        } else {
            // Fallback: base64 data stored directly in database
            return res.json({ 
                url: registration.paymentProof,
                type: 'base64'
            });
        }
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get pending payment approvals for an event (Organizer only)
// @route   GET /api/registrations/event/:eventId/pending-payments
// @access  Organizer Only
export const getPendingPayments = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { eventId } = req.params;

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view payments for this event' });
        }

        const pendingPayments = await Registration.find({
            eventId,
            paymentStatus: { $in: ['Pending', 'Approved', 'Rejected'] },
            paymentProof: { $exists: true, $ne: null }
        })
            .populate('userId', 'email profile.firstName profile.lastName profile.contactNumber')
            .populate('participantId', 'email profile.firstName profile.lastName profile.contactNumber')
            .sort({ registrationDate: -1 });

        res.json(pendingPayments);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Approve or reject payment
// @route   POST /api/registrations/:id/approve-payment
// @access  Organizer Only
export const approveOrRejectPayment = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { action, remarks } = req.body; // action: 'approve' or 'reject'

        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const registration = await Registration.findById(id).populate('eventId');
        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        const event = registration.eventId as any;
        
        // Check if organizer owns this event
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (action === 'approve') {
            // Generate QR code and send email
            const qrData = generateTicketQRData(
                registration.ticketId,
                event.name,
                registration.participantId.toString()
            );
            const qrCode = await generateQRCode(qrData);
            
            registration.paymentStatus = 'Approved';
            registration.paymentApprovedAt = new Date();
            registration.paymentApprovedBy = req.user.id as any;
            registration.qrCode = qrCode;
            registration.status = 'Completed';

            await registration.save();

            // Populate user data for email
            const populatedReg = await Registration.findById(id)
                .populate('participantId', 'email profile.firstName profile.lastName')
                .populate('eventId');

            // Send email with QR code (wrap in try-catch to not fail if email service unavailable)
            const participant = populatedReg?.participantId as any;
            if (participant && participant.email) {
                try {
                    // Calculate total amount
                    let totalAmount = 0;
                    const items = registration.merchandiseSelection?.map(item => {
                        const variant = event.merchandise?.variants.find((v: any) => v._id.toString() === item.variantId);
                        const itemTotal = variant ? variant.price * item.quantity : 0;
                        totalAmount += itemTotal;
                        return {
                            variantName: variant?.variantName || 'Unknown',
                            quantity: item.quantity,
                            price: variant?.price || 0
                        };
                    }) || [];

                    await sendMerchandiseEmail(
                        participant.email,
                        participant.profile?.firstName || 'Participant',
                        event.name,
                        registration.ticketId,
                        event._id.toString(),
                        participant._id.toString(),
                        items,
                        totalAmount
                    );
                    registration.emailSent = true;
                    await registration.save();
                } catch (emailError) {
                    console.error('Email sending failed, but approval continues:', emailError);
                    // Don't fail the whole approval if email fails
                }
            }

            // Decrement stock for approved merchandise
            if (registration.merchandiseSelection && registration.merchandiseSelection.length > 0) {
                for (const item of registration.merchandiseSelection) {
                    const variantIndex = event.merchandise.variants.findIndex(
                        (v: any) => v._id.toString() === item.variantId
                    );
                    if (variantIndex !== -1) {
                        event.merchandise.variants[variantIndex].stock -= item.quantity;
                    }
                }
                await event.save();
            }

            res.json({ message: 'Payment approved, QR code generated and email sent', registration });
        } else if (action === 'reject') {
            registration.paymentStatus = 'Rejected';
            registration.paymentRemarks = remarks || 'Payment verification failed';
            registration.status = 'Rejected';
            await registration.save();

            res.json({ message: 'Payment rejected', registration });
        } else {
            return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject"' });
        }
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};
