import { z } from 'zod';
import { SupportedLanguageSchema } from './common.js';

export const AnswerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);
export type AnswerValue = z.infer<typeof AnswerValueSchema>;

export const GenerationAnswersSchema = z.record(z.string(), AnswerValueSchema);
export type GenerationAnswers = z.infer<typeof GenerationAnswersSchema>;

export const ValidateAnswersRequestSchema = z.object({
  templateVersionId: z.string().min(1, 'templateVersionId is required'),
  answers: GenerationAnswersSchema,
  language: SupportedLanguageSchema.default('gu'),
});
export type ValidateAnswersRequest = z.infer<typeof ValidateAnswersRequestSchema>;

export const CreatePreviewRequestSchema = z.object({
  templateVersionId: z.string().min(1, 'templateVersionId is required'),
  answers: GenerationAnswersSchema,
  language: SupportedLanguageSchema.default('gu'),
});
export type CreatePreviewRequest = z.infer<typeof CreatePreviewRequestSchema>;

export const PreviewResponseSchema = z.object({
  sessionId: z.string(),
  templateTitle: z.string(),
  language: SupportedLanguageSchema,
  previewHtml: z.string(),
  expiresAt: z.string(),
  isDemoOnly: z.boolean().default(true),
});
export type PreviewResponse = z.infer<typeof PreviewResponseSchema>;

export const CreatePdfRequestSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  disclaimerAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the legal disclaimer before downloading or printing the document' }),
  }),
});
export type CreatePdfRequest = z.infer<typeof CreatePdfRequestSchema>;

export const GenerationSessionSchema = z.object({
  _id: z.string().optional(),
  templateVersionId: z.string(),
  templateSlug: z.string(),
  answers: GenerationAnswersSchema,
  language: SupportedLanguageSchema,
  previewHtml: z.string(),
  createdAt: z.string().or(z.date()),
  expiresAt: z.string().or(z.date()),
  status: z.enum(['active', 'expired', 'completed']).default('active'),
});
export type GenerationSession = z.infer<typeof GenerationSessionSchema>;
