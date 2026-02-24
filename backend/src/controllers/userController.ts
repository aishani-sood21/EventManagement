import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/authmidlewar';

// @desc    Update Participant Preferences (Interests & Following)
// @route   PUT /api/user/preferences
export const updatePreferences = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { interests, following } = req.body;

        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can set preferences' });
        }

        // Update interests (array of strings like "Technical", "Cultural", etc.)
        if (interests !== undefined) {
            user.profile.interests = interests;
        }

        // Update following (array of organizer IDs)
        if (following !== undefined) {
            user.profile.following = following;
        }

        await user.save();
        res.json({ message: 'Preferences updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get Current User Profile
// @route   GET /api/user/profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = await User.findById(req.user?.id)
            .select('-passwordHash')
            .populate('profile.following', 'profile.organizerName');
        
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get All Organizers (for follow selection)
// @route   GET /api/user/organizers
export const getOrganizers = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const organizers = await User.find({ role: 'organizer' })
            .select('_id profile.organizerName profile.category profile.description');
        
        res.json(organizers);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};


// @desc    Update User Profile (Personal Info for Participant or Organizer)
// @route   PUT /api/user/profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'participant') {
            // Participant fields
            const { firstName, lastName, contactNumber, collegeName } = req.body;
            if (firstName !== undefined) user.profile.firstName = firstName;
            if (lastName !== undefined) user.profile.lastName = lastName;
            if (contactNumber !== undefined) user.profile.contactNumber = contactNumber;
            if (collegeName !== undefined) user.profile.collegeName = collegeName;
        } else if (user.role === 'organizer') {
            // Organizer fields
            const { organizerName, category, description, contactEmail, discordWebhook } = req.body;
            if (organizerName !== undefined) user.profile.organizerName = organizerName;
            if (category !== undefined) user.profile.category = category;
            if (description !== undefined) user.profile.description = description;
            if (contactEmail !== undefined) user.profile.contactEmail = contactEmail;
            if (discordWebhook !== undefined) user.profile.discordWebhook = discordWebhook;
        }

        await user.save();
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Change Password
// @route   PUT /api/user/password
export const changePassword = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new passwords are required' });
        }

        const user = await User.findById(req.user?.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify current password
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get Organizer Details with Events
// @route   GET /api/user/organizers/:id
export const getOrganizerDetails = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        
        const organizer = await User.findOne({ _id: id, role: 'organizer' })
            .select('-passwordHash');
        
        if (!organizer) {
            return res.status(404).json({ message: 'Organizer not found' });
        }

        // Get organizer's events
        const Event = require('../models/Event').default;
        const now = new Date();
        
        const upcomingEvents = await Event.find({ 
            organizer: id,
            startDateTime: { $gte: now }
        }).sort({ startDateTime: 1 });
        
        const pastEvents = await Event.find({ 
            organizer: id,
            startDateTime: { $lt: now }
        }).sort({ startDateTime: -1 }).limit(10);

        res.json({
            organizer,
            upcomingEvents,
            pastEvents
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};