import User from '../models/User';
import bcrypt from 'bcryptjs';

export const seedAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@felicity.iiit.ac.in';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(adminPassword, salt);

            const newAdmin = new User({
                email: adminEmail,
                passwordHash: passwordHash,
                role: 'admin',
                profile: {
                    firstName: 'System',
                    lastName: 'Admin'
                }
            });

            await newAdmin.save();
            console.log('👑 Admin Account Created Successfully');
        } else {
            console.log('✅ Admin Account Already Exists');
        }
    } catch (error) {
        console.error('❌ Admin Seeding Failed:', error);
    }
};