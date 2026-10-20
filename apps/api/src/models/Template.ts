import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITemplate extends Document {
  slug: string;
  title: string;
  titleGu: string;
  description: string;
  descriptionGu: string;
  category: 'affidavit' | 'declaration' | 'certificate_support' | 'revenue_service' | 'general';
  supportedLanguages: Array<'gu' | 'en'>;
  status: 'active' | 'retired';
  currentPublishedVersionId?: Types.ObjectId;
  currentVersionNumber?: number;
  isDemoOnly: boolean;
  purpose?: string;
  purposeGu?: string;
  requiredDocuments: string[];
  requiredDocumentsGu: string[];
  nextSteps?: string;
  nextStepsGu?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true },
    titleGu: { type: String, required: true },
    description: { type: String, required: true },
    descriptionGu: { type: String, required: true },
    category: {
      type: String,
      enum: ['affidavit', 'declaration', 'certificate_support', 'revenue_service', 'general'],
      required: true,
      index: true,
    },
    supportedLanguages: {
      type: [String],
      enum: ['gu', 'en'],
      default: ['gu', 'en'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'retired'],
      default: 'active',
      index: true,
      required: true,
    },
    currentPublishedVersionId: { type: Schema.Types.ObjectId, ref: 'TemplateVersion' },
    currentVersionNumber: { type: Number, default: 1 },
    isDemoOnly: { type: Boolean, default: true },
    purpose: { type: String },
    purposeGu: { type: String },
    requiredDocuments: { type: [String], default: [] },
    requiredDocumentsGu: { type: [String], default: [] },
    nextSteps: { type: String },
    nextStepsGu: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const TemplateModel = mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
