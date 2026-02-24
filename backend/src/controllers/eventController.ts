import { Request, Response } from 'express';
import Event from '../models/Event';
import User from '../models/User';
import Registration from '../models/Registration';
import { AuthRequest } from '../middleware/authmidlewar';

// Helper function to post to Discord webhook
async function postToDiscord(webhookUrl: string, event: any, organizerName: string) {
    try {
        const embed = {
            title: `🎉 New Event: ${event.name}`,
            description: event.description,
            color: 5814783, // Blue color
            fields: [
                {
                    name: '📅 Event Type',
                    value: event.type,
                    inline: true
                },
                {
                    name: '👥 Eligibility',
                    value: event.eligibility,
                    inline: true
                },
                {
                    name: '📍 Venue',
                    value: event.venue || 'TBA',
                    inline: true
                },
                {
                    name: '🕒 Start Date',
                    value: new Date(event.startDate).toLocaleDateString(),
                    inline: true
                },
                {
                    name: '⏰ Registration Deadline',
                    value: new Date(event.registrationDeadline).toLocaleDateString(),
                    inline: true
                },
                {
                    name: '💰 Registration Fee',
                    value: event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`,
                    inline: true
                }
            ],
            footer: {
                text: `Organized by ${organizerName}`
            },
            timestamp: new Date().toISOString()
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: '🚀 **New Event Published!**',
                embeds: [embed]
            })
        });

        if (!response.ok) {
            console.error('Discord webhook failed:', response.statusText);
        } else {
            console.log('Successfully posted to Discord');
        }
    } catch (err) {
        console.error('Error posting to Discord:', err);
    }
}

// @desc    Create a new event
// @route   POST /api/events
// @access  Organizer Only
export const createEvent = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user || req.user.role !== 'organizer') {
            return res.status(403).json({ message: 'Only organizers can create events' });
        }

        const {
            name, description, type, eligibility, registrationDeadline,
            startDate, endDate, registrationLimit, registrationFee, tags,
            customForm, merchandise, venue, teamSize, status
        } = req.body;

        console.log('Creating event with data:', {
            name,
            type,
            customForm,
            merchandise
        });

        // Validate custom form if provided
        if (customForm && customForm.fields) {
            if (!Array.isArray(customForm.fields)) {
                return res.status(400).json({ message: 'Custom form fields must be an array' });
            }
            console.log('Custom form fields:', customForm.fields);
        }

        // Validate merchandise if provided
        if (type === 'Merchandise' && merchandise) {
            if (!merchandise.variants || !Array.isArray(merchandise.variants) || merchandise.variants.length === 0) {
                return res.status(400).json({ message: 'Merchandise events must have at least one variant' });
            }
        }

        const eventData: any = {
            name,
            description,
            type,
            eligibility,
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            registrationFee: registrationFee || 0,
            tags: tags || [],
            organizerId: req.user.id,
            registeredParticipants: [],
            status: status || 'Draft',
            venue: venue || undefined,
            teamSize: teamSize || undefined
        };

        // Add customForm if it exists and has fields
        if (customForm && customForm.fields && customForm.fields.length > 0) {
            eventData.customForm = customForm;
            console.log('Adding customForm to event:', customForm);
        }

        // Add merchandise if type is Merchandise
        if (type === 'Merchandise' && merchandise) {
            eventData.merchandise = merchandise;
        }

        const newEvent = new Event(eventData);
        await newEvent.save();
        
        console.log('Event created successfully:', newEvent._id);
        console.log('Event customForm:', newEvent.customForm);
        
        // Post to Discord webhook if event is published and organizer has webhook configured
        if (status === 'Published') {
            const organizer = await User.findById(req.user.id);
            if (organizer?.profile?.discordWebhook) {
                const organizerName = organizer.profile.organizerName || 'Organizer';
                postToDiscord(organizer.profile.discordWebhook, newEvent, organizerName);
            }
        }

        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get all events (with personalized ordering for participants)
// @route   GET /api/events
// @access  Public
export const getEvents = async (req: AuthRequest, res: Response) => {
    try {
        let events = await Event.find().populate('organizerId', 'profile.organizerName profile.category');

        // If user is logged in as participant, personalize the order
        if (req.user && req.user.role === 'participant') {
            const user = await User.findById(req.user.id);
            
            if (user && user.profile) {
                const userInterests = user.profile.interests || [];
                const following = user.profile.following?.map((id: any) => id.toString()) || [];

                events = events.sort((a: any, b: any) => {
                    const aOrgId = a.organizerId?._id?.toString();
                    const bOrgId = b.organizerId?._id?.toString();
                    
                    const aFollowed = following.includes(aOrgId) ? 1 : 0;
                    const bFollowed = following.includes(bOrgId) ? 1 : 0;
                    
                    if (aFollowed !== bFollowed) return bFollowed - aFollowed;
                    
                    const aMatch = userInterests.includes(a.organizerId?.profile?.category) ? 1 : 0;
                    const bMatch = userInterests.includes(b.organizerId?.profile?.category) ? 1 : 0;
                    
                    return bMatch - aMatch;
                });
            }
        }

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get Organizer's own events
// @route   GET /api/events/my-events
// @access  Organizer Only
export const getMyEvents = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        if (!req.user) {
             return res.status(401).json({ message: 'Not authenticated' });
        }
        const events = await Event.find({ organizerId: req.user.id });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req: Request, res: Response): Promise<any> => {
    try {
        const event = await Event.findById(req.params.id).populate('organizerId', 'profile.organizerName profile.category profile.contactEmail');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Update event
// @desc    Update event
// @route   PUT /api/events/:id
// @access  Organizer Only (own events)
export const updateEvent = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'You can only update your own events' });
        }

        // Get registration count
        const registrationCount = await Registration.countDocuments({ 
            eventId: req.params.id,
            status: { $in: ['Registered', 'Completed'] }
        });

        const hasRegistrations = registrationCount > 0;

        // Editing Rules Based on Status and Registrations
        if (event.status === 'Draft') {
            // Draft: Free edits, can be published
            // No restrictions
        } else if (event.status === 'Published') {
            // Published: Limited edits
            if (hasRegistrations) {
                // If has registrations, lock certain fields
                const restrictedFields = ['type', 'eligibility', 'customForm'];
                for (const field of restrictedFields) {
                    if (req.body[field] !== undefined && JSON.stringify(req.body[field]) !== JSON.stringify(event[field as keyof typeof event])) {
                        return res.status(400).json({ 
                            message: `Cannot modify ${field} after registrations have been received` 
                        });
                    }
                }
            }
            // Allowed: description update, extend deadline, increase limit, close registrations
        } else if (event.status === 'Ongoing' || event.status === 'Completed') {
            // Ongoing/Completed: No edits except status change (can mark completed or closed)
            const allowedFields = ['status'];
            const attemptedFields = Object.keys(req.body);
            const unauthorizedFields = attemptedFields.filter(f => !allowedFields.includes(f));
            
            if (unauthorizedFields.length > 0) {
                return res.status(400).json({ 
                    message: `Event is ${event.status}. Only status changes allowed. Cannot modify: ${unauthorizedFields.join(', ')}` 
                });
            }
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        // Post to Discord if status changed to Published
        if (req.body.status === 'Published' && event.status !== 'Published') {
            const organizer = await User.findById(req.user?.id);
            if (organizer?.profile?.discordWebhook && updatedEvent) {
                const organizerName = organizer.profile.organizerName || 'Organizer';
                postToDiscord(organizer.profile.discordWebhook, updatedEvent, organizerName);
            }
        }

        res.json(updatedEvent);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Organizer Only (own events)
export const deleteEvent = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'You can only delete your own events' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Search and filter events
// @route   GET /api/events/search
// @access  Public
export const searchEvents = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            query, 
            type, 
            eligibility, 
            startDate, 
            endDate, 
            followedOnly 
        } = req.query;

        let filter: any = {};

        // Text search on event name and organizer name (fuzzy/partial matching)
        if (query) {
            const searchRegex = new RegExp(query as string, 'i');
            
            // Get organizers matching the query
            const matchingOrganizers = await User.find({
                'profile.organizerName': searchRegex
            }).select('_id');
            
            const organizerIds = matchingOrganizers.map(org => org._id);

            filter.$or = [
                { name: searchRegex },
                { organizerId: { $in: organizerIds } }
            ];
        }

        // Filter by event type
        if (type) {
            filter.type = type;
        }

        // Filter by eligibility
        if (eligibility) {
            filter.eligibility = new RegExp(eligibility as string, 'i');
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.startDate = {};
            if (startDate) {
                filter.startDate.$gte = new Date(startDate as string);
            }
            if (endDate) {
                filter.startDate.$lte = new Date(endDate as string);
            }
        }

        // Filter by followed clubs only
        if (followedOnly === 'true' && req.user) {
            const user = await User.findById(req.user.id);
            if (user && user.profile && user.profile.following) {
                filter.organizerId = { $in: user.profile.following };
            } else {
                // No following, return empty array
                return res.json([]);
            }
        }

        const events = await Event.find(filter)
            .populate('organizerId', 'profile.organizerName profile.category')
            .sort({ startDate: 1 });

        res.json(events);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get trending events (Top 5 by registrations in last 24 hours)
// @route   GET /api/events/trending
// @access  Public
export const getTrendingEvents = async (req: Request, res: Response) => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Get registrations from last 24 hours
        const recentRegistrations = await Registration.find({
            registeredAt: { $gte: last24Hours },
            status: { $in: ['Registered', 'Waitlisted'] }
        });

        // Count registrations per event
        const eventCounts: { [key: string]: number } = {};
        recentRegistrations.forEach(reg => {
            const eventId = reg.eventId.toString();
            eventCounts[eventId] = (eventCounts[eventId] || 0) + 1;
        });

        // Sort by count and get top 5
        const topEventIds = Object.entries(eventCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([eventId]) => eventId);

        // Fetch the actual events
        const trendingEvents = await Event.find({
            _id: { $in: topEventIds }
        }).populate('organizerId', 'profile.organizerName profile.category');

        // Sort by the original order
        const sortedEvents = topEventIds.map(id => 
            trendingEvents.find(event => event._id.toString() === id)
        ).filter(Boolean);

        res.json(sortedEvents);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get event registration stats
// @route   GET /api/events/:id/stats
// @access  Public
export const getEventStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const totalRegistrations = await Registration.countDocuments({
            eventId: req.params.id,
            status: { $in: ['Registered', 'Completed'] }
        });

        const waitlisted = await Registration.countDocuments({
            eventId: req.params.id,
            status: 'Waitlisted'
        });

        const availableSpots = event.registrationLimit 
            ? Math.max(0, event.registrationLimit - totalRegistrations)
            : null;

        const isDeadlinePassed = new Date() > new Date(event.registrationDeadline);
        const isLimitReached = event.registrationLimit 
            ? totalRegistrations >= event.registrationLimit 
            : false;

        res.json({
            totalRegistrations,
            waitlisted,
            availableSpots,
            registrationLimit: event.registrationLimit,
            isDeadlinePassed,
            isLimitReached,
            canRegister: !isDeadlinePassed && !isLimitReached
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get Event Analytics for Organizer
// @route   GET /api/events/:id/analytics
// @access  Organizer Only (own events)
export const getEventAnalytics = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizerId.toString() !== req.user?.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get registrations for this event
        const registrations = await Registration.find({ eventId: req.params.id })
            .populate('userId', 'email profile.firstName profile.lastName profile.contactNumber');

        // Calculate stats
        const totalRegistrations = registrations.length;
        const totalRevenue = registrations.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0);
        const attendanceCount = registrations.filter(reg => reg.attended).length;

        // Team completion (for Team events)
        let teamStats = null;
        if (event.type === 'Team') {
            const teams = new Map();
            registrations.forEach(reg => {
                if (reg.teamName) {
                    if (!teams.has(reg.teamName)) {
                        teams.set(reg.teamName, []);
                    }
                    teams.get(reg.teamName).push(reg);
                }
            });
            
            const completeTeams = Array.from(teams.values()).filter(
                members => event.teamSize && members.length === event.teamSize
            ).length;
            
            teamStats = {
                totalTeams: teams.size,
                completeTeams,
                incompleteTeams: teams.size - completeTeams
            };
        }

        res.json({
            eventName: event.name,
            totalRegistrations,
            totalRevenue,
            attendanceCount,
            attendanceRate: totalRegistrations > 0 ? (attendanceCount / totalRegistrations * 100).toFixed(1) : 0,
            teamStats,
            registrationLimit: event.registrationLimit,
            availableSlots: event.registrationLimit ? event.registrationLimit - totalRegistrations : null
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};