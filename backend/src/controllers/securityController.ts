import { Request, Response } from 'express';
import SecurityLog from '../models/SecurityLog';
import BlockedIP from '../models/BlockedIP';

// @desc    Get security logs (Admin only)
// @route   GET /api/security/logs
export const getSecurityLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { page = 1, limit = 50, action, ipAddress } = req.query;
        
        const query: any = {};
        if (action) query.action = action;
        if (ipAddress) query.ipAddress = ipAddress;
        
        const logs = await SecurityLog.find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
        
        const total = await SecurityLog.countDocuments(query);
        
        res.json({
            logs,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            total
        });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get blocked IPs (Admin only)
// @route   GET /api/security/blocked-ips
export const getBlockedIPs = async (req: Request, res: Response): Promise<any> => {
    try {
        const blockedIPs = await BlockedIP.find().sort({ blockedAt: -1 });
        res.json(blockedIPs);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Unblock an IP (Admin only)
// @route   DELETE /api/security/blocked-ips/:ipAddress
export const unblockIP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { ipAddress } = req.params;
        
        await BlockedIP.deleteOne({ ipAddress });
        
        res.json({ message: 'IP unblocked successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Manually block an IP (Admin only)
// @route   POST /api/security/block-ip
export const blockIP = async (req: Request, res: Response): Promise<any> => {
    try {
        const { ipAddress, reason, permanent, durationHours } = req.body;
        
        const blockedUntil = permanent 
            ? undefined 
            : new Date(Date.now() + (durationHours || 24) * 60 * 60 * 1000);
        
        await BlockedIP.findOneAndUpdate(
            { ipAddress },
            {
                ipAddress,
                reason: reason || 'Manually blocked by admin',
                blockedAt: new Date(),
                blockedUntil,
                permanent: permanent || false,
                failedAttempts: 0
            },
            { upsert: true, new: true }
        );
        
        res.json({ message: 'IP blocked successfully' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};

// @desc    Get security statistics (Admin only)
// @route   GET /api/security/stats
export const getSecurityStats = async (req: Request, res: Response): Promise<any> => {
    try {
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const stats = {
            totalBlocked: await BlockedIP.countDocuments(),
            failedLoginsLast24h: await SecurityLog.countDocuments({
                action: 'login_failure',
                timestamp: { $gte: last24Hours }
            }),
            failedLoginsLast7d: await SecurityLog.countDocuments({
                action: 'login_failure',
                timestamp: { $gte: last7Days }
            }),
            successfulLoginsLast24h: await SecurityLog.countDocuments({
                action: 'login_success',
                timestamp: { $gte: last24Hours }
            }),
            registrationsLast24h: await SecurityLog.countDocuments({
                action: 'registration_success',
                timestamp: { $gte: last24Hours }
            }),
            blockedAttemptsLast24h: await SecurityLog.countDocuments({
                action: 'blocked',
                timestamp: { $gte: last24Hours }
            })
        };
        
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
};
