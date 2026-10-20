import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITemplateVersion extends Document {
  templateId: Types.ObjectId;
  version: number;
  language: 'gu' | 'en';
  fields: any[];
  layoutKey: string;
  sourceReference: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'rejected' | 'retired';
  rejectionReason?: string;
  createdBy?: Types.ObjectId;
  reviewedBy?: Types.ObjectId;
  approvedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateVersionSchema = new Schema<ITemplateVersion>(
  {
    templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true, index: true },
    version: { type: Number, required: true },
    language: { type: String, enum: ['gu', 'en'], required: true },
    fields: { type: [Schema.Types.Mixed] as any, required: true },
    layoutKey: { type: String, required: true },
    sourceReference: { type: String, default: 'Collector Office, Gandhinagar - Standard Prototype Format' },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published', 'rejected', 'retired'],
      default: 'draft',
      index: true,
      required: true,
    },
    rejectionReason: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

TemplateVersionSchema.index({ templateId: 1, version: 1, language: 1 }, { unique: true });

export const TemplateVersionModel =
  mongoose.models.TemplateVersion || mongoose.model<ITemplateVersion>('TemplateVersion', TemplateVersionSchema);
