import { z } from 'zod';
import { TemplateCategorySchema, TemplateFieldSchema } from './template.js';

export const SubmissionStatusSchema = z.enum([
  'pending_scan',
  'scanned',
  'under_review',
  'approved',
  'rejected',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const AiScanResultSchema = z.object({
  detectedTitle: z.string().min(1).max(200),
  detectedTitleGu: z.string().min(1).max(200),
  detectedCategory: TemplateCategorySchema,
  detectedPurpose: z.string().max(1000).optional(),
  detectedPurposeGu: z.string().max(1000).optional(),
  extractedFields: z.array(TemplateFieldSchema).min(1),
  suggestedLayoutKey: z.string().min(1).max(100),
  confidenceScore: z.number().min(0).max(100),
  extractedRules: z.array(z.string()).default([]),
  scanSummary: z.string().max(2000),
});
export type AiScanResult = z.infer<typeof AiScanResultSchema>;

export const CreateSubmissionRequestSchema = z.object({
  documentTitle: z.string().min(3).max(200),
  documentText: z.string().min(20).max(50000),
  category: TemplateCategorySchema.optional(),
  submitterName: z.string().max(120).optional(),
  submitterEmail: z.string().email().max(120).optional(),
  submitterPhone: z.string().max(20).optional(),
  fileName: z.string().max(255).optional(),
});
export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

export const ApproveSubmissionRequestSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(3).max(200),
  titleGu: z.string().min(3).max(200),
  category: TemplateCategorySchema,
  description: z.string().max(1000).optional(),
  descriptionGu: z.string().max(1000).optional(),
  purpose: z.string().max(1000).optional(),
  purposeGu: z.string().max(1000).optional(),
  fields: z.array(TemplateFieldSchema).min(1),
  layoutKey: z.string().min(1).max(100).default('sample_declaration'),
  requiredDocuments: z.array(z.string()).default([]),
  nextSteps: z.string().max(1000).optional(),
  nextStepsGu: z.string().max(1000).optional(),
});
export type ApproveSubmissionRequest = z.infer<typeof ApproveSubmissionRequestSchema>;
