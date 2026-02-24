import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockedIP extends Document {
  ipAddress: string;
  reason: string;
  blockedAt: Date;
  blockedUntil?: Date;
  failedAttempts: number;
  permanent: boolean;
}

const BlockedIPSchema: Schema = new Schema({
  ipAddress: { type: String, required: true, unique: true, index: true },
  reason: { type: String, required: true },
  blockedAt: { type: Date, default: Date.now },
  blockedUntil: { type: Date },
  failedAttempts: { type: Number, default: 0 },
  permanent: { type: Boolean, default: false }
});

export default mongoose.model<IBlockedIP>('BlockedIP', BlockedIPSchema);
