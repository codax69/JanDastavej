import { z } from 'zod';
import { SupportedLanguageSchema } from './common.js';

export const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'date',
  'select',
  'radio',
  'checkbox',
  'number',
]);
export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FieldOptionSchema = z.object({
  value: z.string().min(1).max(100),
  label: z.string().min(1).max(200),
  labelGu: z.string().max(200).optional(),
});
export type FieldOption = z.infer<typeof FieldOptionSchema>;

export const TemplateFieldSchema = z.object({
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Field key must be alphanumeric camelCase starting with a letter'),
  label: z.string().min(1).max(200),
  labelGu: z.string().max(200).optional(),
  type: FieldTypeSchema,
  required: z.boolean().default(true),
  placeholder: z.string().max(200).optional(),
  placeholderGu: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
  helpTextGu: z.string().max(500).optional(),
  maxLength: z.number().int().positive().max(5000).default(500),
  minLength: z.number().int().nonnegative().max(1000).default(0),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(FieldOptionSchema).optional(),
});
export type TemplateField = z.infer<typeof TemplateFieldSchema>;

export const TemplateVersionStatusSchema = z.enum([
  'draft',
  'in_review',
  'approved',
  'published',
  'rejected',
  'retired',
]);
export type TemplateVersionStatus = z.infer<typeof TemplateVersionStatusSchema>;

export const TemplateCategorySchema = z.enum([
  'affidavit',
  'declaration',
  'certificate_support',
  'revenue_service',
  'general',
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const TemplateVersionSchema = z.object({
  _id: z.string().optional(),
  templateId: z.string(),
  version: z.number().int().positive(),
  language: SupportedLanguageSchema,
  fields: z.array(TemplateFieldSchema).min(1, 'At least one field is required'),
  layoutKey: z.string().min(1).max(100),
  sourceReference: z.string().max(500).default('Collector Office, Gandhinagar - Standard Prototype Format'),
  status: TemplateVersionStatusSchema.default('draft'),
  rejectionReason: z.string().max(1000).optional(),
  createdBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  approvedAt: z.string().or(z.date()).optional(),
  publishedAt: z.string().or(z.date()).optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type TemplateVersion = z.infer<typeof TemplateVersionSchema>;

export const TemplateSummarySchema = z.object({
  _id: z.string(),
  slug: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  titleGu: z.string().min(2).max(200),
  description: z.string().max(1000),
  descriptionGu: z.string().max(1000),
  category: TemplateCategorySchema,
  supportedLanguages: z.array(SupportedLanguageSchema).min(1),
  status: z.enum(['active', 'retired']),
  currentPublishedVersionId: z.string().optional(),
  currentVersionNumber: z.number().optional(),
  isDemoOnly: z.boolean().default(true),
  purpose: z.string().max(1000).optional(),
  purposeGu: z.string().max(1000).optional(),
  requiredDocuments: z.array(z.string()).default([]),
  requiredDocumentsGu: z.array(z.string()).default([]),
  nextSteps: z.string().max(1000).optional(),
  nextStepsGu: z.string().max(1000).optional(),
  fieldsCount: z.number().optional(),
  updatedAt: z.string().or(z.date()).optional(),
});
export type TemplateSummary = z.infer<typeof TemplateSummarySchema>;
