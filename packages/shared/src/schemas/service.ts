import { z } from 'zod';
import { SupportedLanguageSchema } from './common.js';

export const ServiceCategorySchema = z.enum([
  'revenue',
  'social_welfare',
  'civil_supplies',
  'urban_development',
  'legal_affairs',
  'general_administration',
]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const ServiceDocumentRequirementSchema = z.object({
  templateSlug: z.string().min(1),
  templateTitle: z.string().min(1),
  templateTitleGu: z.string().min(1),
  isMandatory: z.boolean().default(true),
  condition: z.string().optional(),
  conditionGu: z.string().optional(),
  notes: z.string().optional(),
  notesGu: z.string().optional(),
  category: z.string().default('declaration'),
});
export type ServiceDocumentRequirement = z.infer<typeof ServiceDocumentRequirementSchema>;

export const SupportingDocumentRequirementSchema = z.object({
  name: z.string().min(1),
  nameGu: z.string().min(1),
  isMandatory: z.boolean().default(true),
  description: z.string().optional(),
  descriptionGu: z.string().optional(),
});
export type SupportingDocumentRequirement = z.infer<typeof SupportingDocumentRequirementSchema>;

export const ServiceSummarySchema = z.object({
  _id: z.string(),
  slug: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  titleGu: z.string().min(2).max(200),
  department: z.string().min(2).max(200),
  departmentGu: z.string().min(2).max(200),
  category: ServiceCategorySchema,
  jurisdiction: z.string().default('Gujarat - District Gandhinagar'),
  effectiveDate: z.string().default('2024-04-01'),
  verificationStatus: z.enum(['verified_sample', 'official_format', 'under_review']).default('verified_sample'),
  sourceReference: z.string().default('Collector Office, Gandhinagar - Citizen Charter'),
  description: z.string().max(1000),
  descriptionGu: z.string().max(1000),
  purpose: z.string().max(1000).optional(),
  purposeGu: z.string().max(1000).optional(),
  requiredDocumentCount: z.number().default(0),
  status: z.enum(['active', 'retired']).default('active'),
  isDemoOnly: z.boolean().default(true),
  updatedAt: z.string().or(z.date()).optional(),
});
export type ServiceSummary = z.infer<typeof ServiceSummarySchema>;

export const ServiceDetailSchema = ServiceSummarySchema.extend({
  steps: z.array(z.string()).default([]),
  stepsGu: z.array(z.string()).default([]),
  requiredTemplates: z.array(ServiceDocumentRequirementSchema).default([]),
  supportingDocuments: z.array(SupportingDocumentRequirementSchema).default([]),
});
export type ServiceDetail = z.infer<typeof ServiceDetailSchema>;

export const CreateServiceBundleRequestSchema = z.object({
  serviceSlug: z.string().min(1),
  language: SupportedLanguageSchema,
  answers: z.record(z.any()),
  selectedTemplateSlugs: z.array(z.string()).min(1, 'Select at least one document to generate'),
});
export type CreateServiceBundleRequest = z.infer<typeof CreateServiceBundleRequestSchema>;
