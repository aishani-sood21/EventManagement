import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'participant' | 'organizer' | 'admin';
  status?: 'active' | 'disabled' | 'archived';
  profile: {
    // Participant specific
    firstName?: string;
    lastName?: string;
    contactNumber?: string;
    collegeName?: string; // College/Organization Name
    type?: 'IIIT' | 'Non-IIIT';
    rollNumber?: string; // If IIIT student
    interests?: string[];
    following?: mongoose.Types.ObjectId[]; // Clubs/Organizers followed
    
    // Organizer specific
    organizerName?: string;
    category?: string;
    description?: string;
    contactEmail?: string;
    discordWebhook?: string;
  };
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['participant', 'organizer', 'admin'], required: true },
  status: { type: String, enum: ['active', 'disabled', 'archived'], default: 'active' },
  profile: {
    firstName: { type: String },
    lastName: { type: String },
    contactNumber: { type: String },
    collegeName: { type: String },
    type: { type: String, enum: ['IIIT', 'Non-IIIT'] },
    rollNumber: { type: String },
    interests: [{ type: String }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    organizerName: { type: String },
    category: { type: String },
    description: { type: String },
    contactEmail: { type: String },
    discordWebhook: { type: String }
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);