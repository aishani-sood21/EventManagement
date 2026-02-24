// filepath: /home/aishani-sood/Desktop/Spring25/DASS/Assignment 1/202512345/backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes';
import {seedAdmin} from './utils/adminSeeder';
import {seedOrganizers} from './utils/organizerSeeder';
import eventRoutes from './routes/eventRoutes';
import userRoutes from './routes/userRoutes';
import registrationRoutes from './routes/registrationRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import adminRoutes from './routes/adminRoutes';
import securityRoutes from './routes/securityRoutes';

console.log('registrationRoutes:', registrationRoutes);
console.log('typeof registrationRoutes:', typeof registrationRoutes);   

// Load environment variables

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());



app.use(helmet());
app.use(morgan('dev'));

app.use(morgan('dev'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/user', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/security', securityRoutes);
// Database Connection
// Note: If you don't have MongoDB installed locally, this might fail unless you use a cloud string.
const MONGO_URI = process.env.MONGO_URI as string;

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Seed Admin User (always check/create admin)
    await seedAdmin();
    
    // Seed Sample Organizers - Only run if SEED_ORGANIZERS env variable is set to 'true'
    // To seed organizers, set SEED_ORGANIZERS=true in your .env file or run manually
    if (process.env.SEED_ORGANIZERS === 'true') {
      await seedOrganizers();
      console.log('ℹ️  To prevent seeding on every restart, remove SEED_ORGANIZERS=true from .env');
    }

    // Start Server

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });