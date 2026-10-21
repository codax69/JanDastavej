import { z } from 'zod';
import { TemplateCategorySchema, TemplateFieldSchema } from './template.js';
import { SupportedLanguageSchema } from './common.js';

export const SubmissionStatusSchema = z.enum([
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
  // Backward compatibility aliases
  'pending_scan',
  'scanned',
  'under_review',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const VerificationStatusSchema = z.enum([
  'TECHNICAL_CHECK_PASSED',
  'WARNINGS_FOUND',
  'SOURCE_UNVERIFIED',
  'EXTRACTION_FAILED',
  'SCAN_FAILED',
  'MANUAL_REVIEW_REQUIRED',
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const VerificationFindingSchema = z.object({
  id: z.string().optional(),
  category: z.string(), // 'structure' | 'pii' | 'source' | 'suitability' | 'security'
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  pageNumber: z.number().int().positive().optional(),
  fieldKey: z.string().optional(),
});
export type VerificationFinding = z.infer<typeof VerificationFindingSchema>;

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
  // Enhanced Section 5 Verification Report fields
  verificationStatus: VerificationStatusSchema.default('TECHNICAL_CHECK_PASSED'),
  extractionQuality: z.enum(['high', 'medium', 'low', 'failed']).default('high'),
  structuralFindings: z.array(VerificationFindingSchema).default([]),
  suitabilityFindings: z.array(VerificationFindingSchema).default([]),
  sourceFindings: z.array(VerificationFindingSchema).default([]),
  piiFindings: z.array(VerificationFindingSchema).default([]),
  warnings: z.array(z.string()).default([]),
  recommendedAction: z.enum([
    'ready_for_review',
    'manual_review_required',
    'needs_correction',
    'rejected',
  ]).default('ready_for_review'),
  isDuplicate: z.boolean().default(false),
  duplicateMatchedSlug: z.string().optional(),
  pipelineVersion: z.string().default('2.1.0-audit-verified'),
  model: z.string().default('JanDastavej-LegalRuleExtractor-v2'),
  analyzedAt: z.string().optional(),
});
export type AiScanResult = z.infer<typeof AiScanResultSchema>;

export const CreateSubmissionRequestSchema = z.object({
  documentTitle: z.string().min(3).max(200),
  documentText: z.string().min(1).max(50000),
  category: TemplateCategorySchema.optional(),
  submitterName: z.string().max(120).optional(),
  submitterEmail: z.string().email().max(120).optional(),
  submitterPhone: z.string().max(20).optional(),
  fileName: z.string().max(255).optional(),
  // Extended metadata required by Section 4
  intendedServiceOrPurpose: z.string().max(1000).optional(),
  jurisdiction: z.string().max(100).default('Gujarat (District: Gandhinagar)'),
  state: z.string().max(50).default('Gujarat'),
  language: SupportedLanguageSchema.default('gu'),
  sourceUrl: z.string().url().max(500).optional().or(z.literal('')),
  sourceDescription: z.string().max(1000).optional(),
  issuingAuthority: z.string().max(200).optional(),
  effectiveDate: z.string().max(50).optional(),
  documentType: z.enum([
    'official_template',
    'sample_template',
    'reference_document',
    'supporting_evidence',
  ]).default('sample_template'),
  additionalNotes: z.string().max(2000).optional(),
});
export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

export const RequestCorrectionRequestSchema = z.object({
  notes: z.string().min(5).max(2000),
});
export type RequestCorrectionRequest = z.infer<typeof RequestCorrectionRequestSchema>;

export const ResubmitSubmissionRequestSchema = z.object({
  documentTitle: z.string().min(3).max(200).optional(),
  documentText: z.string().min(20).max(50000),
  additionalNotes: z.string().max(2000).optional(),
});
export type ResubmitSubmissionRequest = z.infer<typeof ResubmitSubmissionRequestSchema>;

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
  publishImmediately: z.boolean().default(true),
});
export type ApproveSubmissionRequest = z.infer<typeof ApproveSubmissionRequestSchema>;

export const CreateIssueReportRequestSchema = z.object({
  templateSlug: z.string().min(2).max(100),
  issueType: z.enum([
    'outdated_format',
    'incorrect_legal_text',
    'missing_fields',
    'formatting_error',
    'other',
  ]),
  description: z.string().min(10).max(2000),
  reporterName: z.string().max(100).optional(),
  reporterEmail: z.string().email().max(120).optional(),
});
export type CreateIssueReportRequest = z.infer<typeof CreateIssueReportRequestSchema>;
