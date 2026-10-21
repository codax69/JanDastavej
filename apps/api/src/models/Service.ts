import mongoose, { Schema, Document, Types } from 'mongoose';
import { ServiceCategory } from '@jandastavej/shared';

export interface IServiceDocumentRequirement {
  templateSlug: string;
  templateTitle: string;
  templateTitleGu: string;
  isMandatory: boolean;
  condition?: string;
  conditionGu?: string;
  notes?: string;
  notesGu?: string;
  category: string;
}

export interface ISupportingDocumentRequirement {
  name: string;
  nameGu: string;
  isMandatory: boolean;
  description?: string;
  descriptionGu?: string;
}

export interface IService extends Document {
  slug: string;
  title: string;
  titleGu: string;
  department: string;
  departmentGu: string;
  category: ServiceCategory;
  jurisdiction: string;
  effectiveDate: string;
  verificationStatus: 'verified_sample' | 'official_format' | 'under_review';
  sourceReference: string;
  description: string;
  descriptionGu: string;
  purpose?: string;
  purposeGu?: string;
  steps: string[];
  stepsGu: string[];
  requiredTemplates: IServiceDocumentRequirement[];
  supportingDocuments: ISupportingDocumentRequirement[];
  status: 'active' | 'retired';
  isDemoOnly: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceDocumentRequirementSchema = new Schema<IServiceDocumentRequirement>(
  {
    templateSlug: { type: String, required: true },
    templateTitle: { type: String, required: true },
    templateTitleGu: { type: String, required: true },
    isMandatory: { type: Boolean, default: true },
    condition: { type: String },
    conditionGu: { type: String },
    notes: { type: String },
    notesGu: { type: String },
    category: { type: String, default: 'declaration' },
  },
  { _id: false }
);

const SupportingDocumentRequirementSchema = new Schema<ISupportingDocumentRequirement>(
  {
    name: { type: String, required: true },
    nameGu: { type: String, required: true },
    isMandatory: { type: Boolean, default: true },
    description: { type: String },
    descriptionGu: { type: String },
  },
  { _id: false }
);

const ServiceSchema = new Schema<IService>(
  {
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true },
    titleGu: { type: String, required: true },
    department: { type: String, required: true, index: true },
    departmentGu: { type: String, required: true },
    category: {
      type: String,
      enum: ['revenue', 'social_welfare', 'civil_supplies', 'urban_development', 'legal_affairs', 'general_administration'],
      required: true,
      index: true,
    },
    jurisdiction: { type: String, default: 'Gujarat - District Gandhinagar' },
    effectiveDate: { type: String, default: '2024-04-01' },
    verificationStatus: {
      type: String,
      enum: ['verified_sample', 'official_format', 'under_review'],
      default: 'verified_sample',
      index: true,
    },
    sourceReference: { type: String, default: 'Collector Office, Gandhinagar - Citizen Charter' },
    description: { type: String, required: true },
    descriptionGu: { type: String, required: true },
    purpose: { type: String },
    purposeGu: { type: String },
    steps: { type: [String], default: [] },
    stepsGu: { type: [String], default: [] },
    requiredTemplates: { type: [ServiceDocumentRequirementSchema], default: [] },
    supportingDocuments: { type: [SupportingDocumentRequirementSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'retired'],
      default: 'active',
      index: true,
    },
    isDemoOnly: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

ServiceSchema.index({ title: 'text', titleGu: 'text', description: 'text', descriptionGu: 'text' });

export const ServiceModel = mongoose.model<IService>('Service', ServiceSchema);
