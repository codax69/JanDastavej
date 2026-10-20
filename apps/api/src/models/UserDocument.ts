import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUserDocument extends Document {
  userId: Types.ObjectId;
  docType: 'id_proof' | 'address_proof' | 'previous_affidavit' | 'certificate' | 'other';
  originalName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  pageCount: number;
  fileHash: string;
  status: 'uploaded' | 'scanning' | 'ready' | 'scan_failed' | 'deleted';
  kept: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserDocumentSchema = new Schema<IUserDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'CitizenUser', required: true, index: true },
    docType: {
      type: String,
      enum: ['id_proof', 'address_proof', 'previous_affidavit', 'certificate', 'other'],
      required: true,
      index: true,
    },
    originalName: { type: String, required: true },
    storageKey: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    pageCount: { type: Number, default: 1 },
    fileHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'scanning', 'ready', 'scan_failed', 'deleted'],
      default: 'uploaded',
      index: true,
    },
    kept: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes
UserDocumentSchema.index({ userId: 1, createdAt: -1 });
UserDocumentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const UserDocumentModel =
  mongoose.models.UserDocument || mongoose.model<IUserDocument>('UserDocument', UserDocumentSchema);
