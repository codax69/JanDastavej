import mongoose, { Schema, Document, Types } from 'mongoose';
import { AiScanResult, SubmissionStatus } from '@jandastavej/shared';

export interface IStatusHistoryItem {
  status: SubmissionStatus;
  timestamp: Date;
  changedBy?: Types.ObjectId;
  note?: string;
}

export interface IDocumentSubmission extends Document {
  documentTitle: string;
  documentText: string;
  category?: string;
  submitterUserId?: Types.ObjectId;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  fileName?: string;
  fileSize?: number;
  fileHash?: string;
  fileMimeType?: string;
  fileStorageKey?: string;
  intendedServiceOrPurpose?: string;
  jurisdiction?: string;
  state?: string;
  language?: string;
  sourceUrl?: string;
  sourceDescription?: string;
  issuingAuthority?: string;
  effectiveDate?: string;
  documentType?: 'official_template' | 'sample_template' | 'reference_document' | 'supporting_evidence';
  additionalNotes?: string;
  correctionNotes?: string;
  resubmissionCount: number;
  status: SubmissionStatus;
  statusHistory: IStatusHistoryItem[];
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
    category: { type: String, index: true },
    submitterUserId: { type: Schema.Types.ObjectId, ref: 'CitizenUser', index: true },
    submitterName: { type: String, trim: true },
    submitterEmail: { type: String, trim: true, lowercase: true, index: true },
    submitterPhone: { type: String, trim: true },
    fileName: { type: String },
    fileSize: { type: Number },
    fileHash: { type: String, index: true },
    fileMimeType: { type: String },
    fileStorageKey: { type: String },
    intendedServiceOrPurpose: { type: String },
    jurisdiction: { type: String, default: 'Gujarat (District: Gandhinagar)' },
    state: { type: String, default: 'Gujarat' },
    language: { type: String, default: 'gu' },
    sourceUrl: { type: String },
    sourceDescription: { type: String },
    issuingAuthority: { type: String },
    effectiveDate: { type: String },
    documentType: {
      type: String,
      enum: ['official_template', 'sample_template', 'reference_document', 'supporting_evidence'],
      default: 'sample_template',
    },
    additionalNotes: { type: String },
    correctionNotes: { type: String },
    resubmissionCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'processing',
        'ai_review_ready',
        'human_review',
        'approved',
        'published',
        'needs_correction',
        'rejected',
        'withdrawn',
        'archived',
        'superseded',
        'scan_failed',
        'extraction_failed',
        'pending_scan',
        'scanned',
        'under_review',
      ],
      default: 'submitted',
      index: true,
      required: true,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
      },
    ],
    aiScanResult: { type: Schema.Types.Mixed },
    adminNotes: { type: String },
    rejectionReason: { type: String },
    createdTemplateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

DocumentSubmissionSchema.index({ submitterUserId: 1, createdAt: -1 });
DocumentSubmissionSchema.index({ status: 1, createdAt: -1 });

export const DocumentSubmissionModel =
  mongoose.models.DocumentSubmission ||
  mongoose.model<IDocumentSubmission>('DocumentSubmission', DocumentSubmissionSchema);
