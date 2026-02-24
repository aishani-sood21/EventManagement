import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description: string;
  type: 'Normal' | 'Merchandise' | 'Team';
  status: 'Draft' | 'Published' | 'Ongoing' | 'Completed' | 'Closed';
  eligibility: string;
  registrationDeadline: Date;
  startDate: Date;
  endDate: Date;
  registrationLimit?: number;
  registrationFee?: number;
  organizerId: mongoose.Types.ObjectId;
  teamSize?: number;
  tags: string[];
  venue?: string;
  registrationsClosed?: boolean;


  customForm? :{
    fields: {
        fieldName: string;
        fieldType: 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file' | 'textarea';
        required: boolean;
        options?: string[]; // For dropdown or checkbox types
        label: string;
        placeholder?: string;
    }[]
  };

  merchandise?: {
    variants: {
        size?: string;
        color?: string;
        variantName: string;
        stock: number;
        price: number;
    }[]
    
  };
  registeredParticipants: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;  


}

const EventSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['Normal', 'Merchandise', 'Team'], required: true },
    status: { type: String, enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'], default: 'Draft' },
    eligibility: { type: String, required: true },
    registrationDeadline: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationLimit: { type: Number },
    registrationFee: { type: Number, default: 0 },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamSize: { type: Number },
    tags: [{ type: String }],
    venue: { type: String },
    registrationsClosed: { type: Boolean, default: false },
    
    customForm: {
        fields: [{
            fieldName: { type: String },
            fieldType: { 
                type: String, 
                enum: ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'file', 'dropdown', 'date']
            },
            label: { type: String },
            placeholder: { type: String },
            required: { type: Boolean, default: false },
            options: [{ type: String }]
        }]
    },
    
    merchandise: {
        variants: [{
            size: { type: String },
            color: { type: String },
            variantName: { type: String, required: true },
            stock: { type: Number, required: true },
            price: { type: Number, required: true }
        }],
        purchaseLimit: { type: Number, default: 1 }
    },
    
    registeredParticipants: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);