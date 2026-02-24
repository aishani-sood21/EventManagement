import { Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authmidlewar';

// @desc    Get all clubs/organizers
// @route   GET /api/admin/organizers
// @access  Admin Only
export const getAllOrganizers = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const organizers = await User.find({ role: 'organizer' })
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        
        console.log('🏢 Found organizers:', organizers.length);
        console.log('📋 Organizers data:', JSON.stringify(organizers, null, 2));
        
        res.json(organizers);
    } catch (err) {
        console.error('❌ Error fetching organizers:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Create new club/organizer account
// @route   POST /api/admin/organizers
// @access  Admin Only
export const createOrganizer = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { organizerName, category, description, contactEmail } = req.body;

        // Generate email from organizer name in @iiit.ac.in domain
        // Remove spaces, special chars, convert to lowercase
        const sanitizedName = organizerName.toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove special chars and spaces
            .substring(0, 20); // Limit length
        
        // Add random suffix to ensure uniqueness
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const generatedEmail = `${sanitizedName}.${randomSuffix}@iiit.ac.in`;

        // Check if email already exists (unlikely with random suffix)
        const existingUser = await User.findOne({ email: generatedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email collision. Please try again.' });
        }

        // Auto-generate secure password (16 characters)
        const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(generatedPassword, salt);

        // Create organizer
        const newOrganizer = new User({
            email: generatedEmail,
            passwordHash,
            role: 'organizer',
            status: 'active',
            profile: {
                organizerName,
                category,
                description,
                contactEmail: contactEmail || generatedEmail
            }
        });

        await newOrganizer.save();

        console.log('✅ Created new organizer:', {
            id: newOrganizer._id,
            email: generatedEmail,
            organizerName
        });

        // Return credentials (admin will share these)
        res.status(201).json({
            message: 'Organizer created successfully',
            credentials: {
                email: generatedEmail,
                password: generatedPassword
            },
            organizer: {
                _id: newOrganizer._id,
                email: newOrganizer.email,
                profile: newOrganizer.profile,
                status: newOrganizer.status
            }
        });
    } catch (err) {
        console.error('❌ Error creating organizer:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Update organizer status (disable/enable)
// @route   PUT /api/admin/organizers/:id/status
// @access  Admin Only
export const updateOrganizerStatus = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'disabled', 'archived'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const organizer = await User.findOne({ _id: id, role: 'organizer' });
        
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        organizer.status = status;
        await organizer.save();

        res.json({ message: `Organizer ${status}`, organizer });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Delete organizer (permanent)
// @route   DELETE /api/admin/organizers/:id
// @access  Admin Only
export const deleteOrganizer = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const organizer = await User.findOne({ _id: id, role: 'organizer' });
        
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // Check if organizer has any events
        const Event = require('../models/Event').default;
        const eventCount = await Event.countDocuments({ organizerId: id });
        
        if (eventCount > 0) {
            return res.status(400).json({ 
                message: `Cannot delete organizer with ${eventCount} event(s). Archive instead or delete events first.` 
            });
        }

        await User.findByIdAndDelete(id);
        res.json({ message: 'Organizer deleted permanently' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin Only
export const getAdminStats = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const Event = require('../models/Event').default;
        const Registration = require('../models/Registration').default;

        const [
            totalOrganizers,
            activeOrganizers,
            disabledOrganizers,
            totalParticipants,
            totalEvents,
            draftEvents,
            publishedEvents,
            totalRegistrations,
            totalRevenue
        ] = await Promise.all([
            User.countDocuments({ role: 'organizer' }),
            User.countDocuments({ role: 'organizer', status: 'active' }),
            User.countDocuments({ role: 'organizer', status: 'disabled' }),
            User.countDocuments({ role: 'participant' }),
            Event.countDocuments(),
            Event.countDocuments({ status: 'Draft' }),
            Event.countDocuments({ status: 'Published' }),
            Registration.countDocuments({ status: { $in: ['Registered', 'Completed'] } }),
            Registration.aggregate([
                { $match: { status: { $in: ['Registered', 'Completed'] } } },
                { $group: { _id: null, total: { $sum: '$amountPaid' } } }
            ])
        ]);

        res.json({
            organizers: {
                total: totalOrganizers,
                active: activeOrganizers,
                disabled: disabledOrganizers
            },
            participants: totalParticipants,
            events: {
                total: totalEvents,
                draft: draftEvents,
                published: publishedEvents
            },
            registrations: totalRegistrations,
            revenue: totalRevenue[0]?.total || 0
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Reset organizer password
// @route   POST /api/admin/organizers/:id/reset-password
// @access  Admin Only
export const resetOrganizerPassword = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const organizer = await User.findOne({ _id: id, role: 'organizer' });
        
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // Generate new password
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        organizer.passwordHash = await bcrypt.hash(newPassword, salt);
        
        await organizer.save();

        res.json({
            message: 'Password reset successfully',
            credentials: {
                email: organizer.email,
                password: newPassword
            }
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};
