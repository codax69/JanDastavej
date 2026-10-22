import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIssueReport extends Document {
  templateId?: Types.ObjectId;
  templateSlug: string;
  issueType:
    | 'outdated_format'
    | 'incorrect_wording'
    | 'legal_change'
    | 'broken_placeholder'
    | 'incorrect_legal_text'
    | 'missing_fields'
    | 'formatting_error'
    | 'other';
  description: string;
  reporterName?: string;
  reporterEmail?: string;
  sourceProofUrl?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IssueReportSchema = new Schema<IIssueReport>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', index: true },
    templateSlug: { type: String, required: true, index: true },
    issueType: {
      type: String,
      enum: [
        'outdated_format',
        'incorrect_wording',
        'legal_change',
        'broken_placeholder',
        'incorrect_legal_text',
        'missing_fields',
        'formatting_error',
        'other',
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    reporterName: { type: String, trim: true },
    reporterEmail: { type: String, trim: true, lowercase: true },
    sourceProofUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
      required: true,
    },
    adminNotes: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const IssueReportModel =
  mongoose.models.IssueReport || mongoose.model<IIssueReport>('IssueReport', IssueReportSchema);
