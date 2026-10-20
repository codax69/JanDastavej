import { z } from 'zod';

export const OtpRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(5, 'Enter a valid email or 10-digit mobile number')
    .max(120),
});
export type OtpRequest = z.infer<typeof OtpRequestSchema>;

export const OtpVerifySchema = z.object({
  identifier: z.string().trim().min(5).max(120),
  otp: z.string().trim().length(6, 'OTP must be 6 digits'),
});
export type OtpVerify = z.infer<typeof OtpVerifySchema>;

export const ConsentScopeSchema = z.enum(['process', 'keep', 'ai_assist']);
export type ConsentScope = z.infer<typeof ConsentScopeSchema>;

export const ConsentRecordSchema = z.object({
  scope: ConsentScopeSchema,
  granted: z.boolean(),
  noticeVersion: z.string().default('2026.1'),
  createdAt: z.string().or(z.date()).optional(),
  revokedAt: z.string().or(z.date()).optional(),
});
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

export const UpdateConsentsRequestSchema = z.object({
  consents: z.array(
    z.object({
      scope: ConsentScopeSchema,
      granted: z.boolean(),
    })
  ).min(1),
  noticeVersion: z.string().default('2026.1'),
});
export type UpdateConsentsRequest = z.infer<typeof UpdateConsentsRequestSchema>;

export const DocumentTypeSchema = z.enum([
  'id_proof',
  'address_proof',
  'previous_affidavit',
  'certificate',
  'other',
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const ExtractedFieldItemSchema = z.object({
  fieldKey: z.string().min(1).max(100),
  value: z.string().max(2000),
  confidence: z.number().min(0).max(100),
  sourcePage: z.number().int().positive().optional(),
  bbox: z.array(z.number()).length(4).optional(),
  isSensitive: z.boolean().default(false),
});
export type ExtractedFieldItem = z.infer<typeof ExtractedFieldItemSchema>;

export const ApplyExtractionRequestSchema = z.object({
  userDocumentId: z.string().optional(),
  confirmedFields: z.record(z.string(), z.any()),
});
export type ApplyExtractionRequest = z.infer<typeof ApplyExtractionRequestSchema>;
