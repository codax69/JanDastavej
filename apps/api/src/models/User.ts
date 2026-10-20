import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'template_admin' | 'approver' | 'staff';
  status: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'template_admin', 'approver', 'staff'],
      default: 'staff',
      required: true,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', required: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
