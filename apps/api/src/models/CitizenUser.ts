import mongoose, { Schema, Document } from 'mongoose';

export interface ICitizenUser extends Document {
  identifier: string; // Email or 10-digit mobile number
  identifierType: 'email' | 'phone';
  name?: string;
  otpHash?: string;
  otpExpiresAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CitizenUserSchema = new Schema<ICitizenUser>(
  {
    identifier: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    identifierType: { type: String, enum: ['email', 'phone'], required: true },
    name: { type: String, trim: true },
    otpHash: { type: String },
    otpExpiresAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const CitizenUserModel =
  mongoose.models.CitizenUser || mongoose.model<ICitizenUser>('CitizenUser', CitizenUserSchema);
