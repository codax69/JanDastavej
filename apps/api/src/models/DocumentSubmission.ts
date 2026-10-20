import mongoose, { Schema, Document, Types } from 'mongoose';
import { AiScanResult } from '@jandastavej/shared';

export interface IDocumentSubmission extends Document {
  documentTitle: string;
  documentText: string;
  category?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  fileName?: string;
  fileSize?: number;
  status: 'pending_scan' | 'scanned' | 'under_review' | 'approved' | 'rejected';
  aiScanResult?: AiScanResult;
  adminNotes?: string;
  rejectionReason?: string;
  createdTemplateId?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSubmissionSchema = new Schema<IDocumentSubmission>(
  {
    documentTitle: { type: String, required: true, trim: true },
    documentText: { type: String, required: true },
    category: { type: String },
    submitterName: { type: String, trim: true },
    submitterEmail: { type: String, trim: true, lowercase: true },
    submitterPhone: { type: String, trim: true },
    fileName: { type: String },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ['pending_scan', 'scanned', 'under_review', 'approved', 'rejected'],
      default: 'pending_scan',
      index: true,
      required: true,
    },
    aiScanResult: { type: Schema.Types.Mixed },
    adminNotes: { type: String },
    rejectionReason: { type: String },
    createdTemplateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const DocumentSubmissionModel =
  mongoose.models.DocumentSubmission ||
  mongoose.model<IDocumentSubmission>('DocumentSubmission', DocumentSubmissionSchema);
