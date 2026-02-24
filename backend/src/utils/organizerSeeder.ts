import User from '../models/User';
import bcrypt from 'bcryptjs';

const sampleOrganizers = [
    {
        email: 'artsoc@iiit.ac.in',
        organizerName: 'ArtSoc',
        category: 'Arts',
        description: 'IIIT Art Society - Promoting creativity through various art forms including painting, sculpting, and digital art.',
        password: 'artsoc123'
    },
    {
        email: 'robotics@iiit.ac.in',
        organizerName: 'Robotics Club',
        category: 'Technical',
        description: 'IIIT Robotics Club - Building the future with innovative robotics projects and competitions.',
        password: 'robotics123'
    },
    {
        email: 'literati@iiit.ac.in',
        organizerName: 'Literati',
        category: 'Literature',
        description: 'IIIT Literary Society - Celebrating the written word through poetry, prose, and creative writing.',
        password: 'literati123'
    },
    {
        email: 'dance@iiit.ac.in',
        organizerName: 'Dance Society',
        category: 'Cultural',
        description: 'IIIT Dance Society - Expressing rhythm and culture through various dance forms.',
        password: 'dance123'
    },
    {
        email: 'music@iiit.ac.in',
        organizerName: 'Music Club',
        category: 'Cultural',
        description: 'IIIT Music Club - Creating harmony through instrumental and vocal performances.',
        password: 'music123'
    },
    {
        email: 'coding@iiit.ac.in',
        organizerName: 'Coding Club',
        category: 'Technical',
        description: 'IIIT Coding Club - Mastering algorithms, data structures, and competitive programming.',
        password: 'coding123'
    }
];

export const seedOrganizers = async () => {
    try {
        let seededCount = 0;
        let existingCount = 0;

        for (const org of sampleOrganizers) {
            const existingOrganizer = await User.findOne({ email: org.email });
            
            if (!existingOrganizer) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(org.password, salt);

                const newOrganizer = new User({
                    email: org.email,
                    passwordHash: passwordHash,
                    role: 'organizer',
                    status: 'active',
                    profile: {
                        organizerName: org.organizerName,
                        category: org.category,
                        description: org.description,
                        contactEmail: org.email
                    }
                });

                await newOrganizer.save();
                seededCount++;
                console.log(`  ✓ Created organizer: ${org.organizerName}`);
            } else {
                existingCount++;
            }
        }

        if (seededCount > 0) {
            console.log(`🏢 ${seededCount} Sample Organizers Created Successfully`);
        }
        if (existingCount > 0) {
            console.log(`✅ ${existingCount} Organizers Already Exist`);
        }
    } catch (error) {
        console.error('❌ Organizer Seeding Failed:', error);
    }
};
