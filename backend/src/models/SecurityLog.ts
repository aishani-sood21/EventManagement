import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityLog extends Document {
  ipAddress: string;
  action: 'login_attempt' | 'login_success' | 'login_failure' | 'registration_attempt' | 'registration_success' | 'blocked';
  email?: string;
  timestamp: Date;
  userAgent?: string;
  success: boolean;
  reason?: string;
}

const SecurityLogSchema: Schema = new Schema({
  ipAddress: { type: String, required: true, index: true },
  action: { 
    type: String, 
    required: true,
    enum: ['login_attempt', 'login_success', 'login_failure', 'registration_attempt', 'registration_success', 'blocked']
  },
  email: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  userAgent: { type: String },
  success: { type: Boolean, required: true },
  reason: { type: String }
});

// Create compound index for efficient querying
SecurityLogSchema.index({ ipAddress: 1, timestamp: -1 });
SecurityLogSchema.index({ email: 1, timestamp: -1 });

export default mongoose.model<ISecurityLog>('SecurityLog', SecurityLogSchema);
