import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
    participantId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    ticketId: string;
    status: 'Registered' | 'Waitlisted' | 'Completed' | 'Cancelled' | 'Rejected';
    teamName?: string;
    customFormData?: any;
    merchandiseSelection?: {
        variantId: string;
        quantity: number;
    }[];
    // Merchandise payment fields
    paymentProof?: string; // URL or base64 of uploaded image
    paymentStatus?: 'Pending' | 'Approved' | 'Rejected';
    paymentRemarks?: string; // Admin/Organizer remarks for rejection
    paymentApprovedAt?: Date;
    paymentApprovedBy?: mongoose.Types.ObjectId;
    qrCode?: string;
    emailSent?: boolean;
    amountPaid?: number;
    attended?: boolean;
    attendanceTimestamp?: Date;
    attendanceScannedBy?: mongoose.Types.ObjectId; // Organizer who scanned
    attendanceMethod?: 'qr-camera' | 'qr-upload' | 'manual'; // How attendance was marked
    attendanceNotes?: string; // For manual overrides
    registrationDate: Date;
    registeredAt: Date;
    updatedAt: Date;
}

const RegistrationSchema: Schema = new Schema({
    participantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketId: { type: String, unique: true },
    status: { 
        type: String, 
        enum: ['Registered', 'Waitlisted', 'Completed', 'Cancelled', 'Rejected'],
        default: 'Registered'
    },
    teamName: { type: String },
    customFormData: { type: Schema.Types.Mixed },
    merchandiseSelection: [{
        variantId: { type: String },
        quantity: { type: Number }
    }],
    paymentProof: { type: String },
    paymentStatus: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Rejected']
        // No default - should be undefined until payment proof is uploaded
    },
    paymentRemarks: { type: String },
    paymentApprovedAt: { type: Date },
    paymentApprovedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    qrCode: { type: String },
    emailSent: { type: Boolean, default: false },
    amountPaid: { type: Number, default: 0 },
    attended: { type: Boolean, default: false },
    attendanceTimestamp: { type: Date },
    attendanceScannedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attendanceMethod: { 
        type: String, 
        enum: ['qr-camera', 'qr-upload', 'manual']
    },
    attendanceNotes: { type: String },
    registrationDate: { type: Date, default: Date.now },
    registeredAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Generate unique ticket ID before validation
RegistrationSchema.pre('validate', function() {
    if (this.isNew && !this.ticketId) {
        this.ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }
});

export default mongoose.model<IRegistration>('Registration', RegistrationSchema);