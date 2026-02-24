import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { 
    getClientIP, 
    trackRegistration, 
    trackFailedAttempt,
    trackSuccessfulLogin,
    verifyRecaptcha 
} from '../middleware/rateLimiter';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// @desc    Register a new participant
// @route   POST /api/auth/register
export const registerParticipant = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, firstName, lastName, contactNumber, type, rollNumber, recaptchaToken } = req.body;
        const ipAddress = getClientIP(req);
        const userAgent = req.headers['user-agent'];

        // 1. Verify reCAPTCHA (only once — duplicate block removed)
        if (recaptchaToken) {
            const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
            if (!isValidCaptcha) {
                await trackRegistration(ipAddress, email, false, userAgent);
                return res.status(400).json({ message: 'reCAPTCHA verification failed' });
            }
        }

        // 2. Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            await trackRegistration(ipAddress, email, false, userAgent);
            return res.status(400).json({ message: 'User already exists' });
        }

        // 3. IIIT Validation
        if (type === 'IIIT') {
            const allowedDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
            if (!allowedDomains.some(domain => email.endsWith(domain))) {
                await trackRegistration(ipAddress, email, false, userAgent);
                return res.status(400).json({ message: 'IIIT students must use an @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in email' });
            }
            if (!rollNumber) {
                await trackRegistration(ipAddress, email, false, userAgent);
                return res.status(400).json({ message: 'Roll number required for IIIT students' });
            }
        }

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 5. Create User
        const newUser = new User({
            email,
            passwordHash,
            role: 'participant',
            profile: {
                firstName,
                lastName,
                contactNumber,
                type,
                rollNumber,
                interests: [],
                following: []
            }
        });

        await newUser.save();
        await trackRegistration(ipAddress, email, true, userAgent);

        res.status(201).json({ message: 'Participant registered successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Login user (Admin, Organizer, Participant)
// @route   POST /api/auth/login

export const loginUser = async (req: Request, res: Response): Promise<any> => {
    console.log("Hello world");
    try {
        const { email, password, recaptchaToken } = req.body;
        const ipAddress = getClientIP(req);
        const userAgent = req.headers['user-agent'];

        // 1. Verify reCAPTCHA
        if (recaptchaToken) {
            const isValidCaptcha = await verifyRecaptcha(recaptchaToken);
            if (!isValidCaptcha) {
                // Fire-and-forget — don't await so tracking can't block the response
                trackFailedAttempt(ipAddress, email, userAgent).catch(console.error);
                return res.status(400).json({ message: 'reCAPTCHA verification failed' });
            }
        }

        // 2. Find user
        const user = await User.findOne({ email });
        if (!user) {
            trackFailedAttempt(ipAddress, email, userAgent).catch(console.error);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 3. Compare password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            trackFailedAttempt(ipAddress, email, userAgent).catch(console.error);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // 4. Sign JWT first — never let tracking block the response
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // 5. Send response immediately
        res.json({ token, user: { id: user._id, email: user.email, role: user.role } });

        // 6. Track successful login in background AFTER response is already sent
        trackSuccessfulLogin(ipAddress, email, userAgent).catch(console.error);

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Create Organizer (Admin Only)
// @route   POST /api/auth/create-organizer
export const createOrganizer = async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, organizerName, category, contactEmail, description } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newOrganizer = new User({
            email,
            passwordHash,
            role: 'organizer',
            profile: {
                organizerName,
                category,
                contactEmail,
                description
            }
        });

        await newOrganizer.save();
        res.status(201).json({ message: 'Organizer created successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};