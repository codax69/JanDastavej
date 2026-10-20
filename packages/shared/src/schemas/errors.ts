import { z } from 'zod';

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'SESSION_EXPIRED',
  'RATE_LIMITED',
  'PDF_UNAVAILABLE',
  'INTERNAL_ERROR',
  'CONSENT_REQUIRED',
  'FILE_UNSAFE',
  'FILE_TYPE_NOT_ALLOWED',
  'FILE_TOO_LARGE',
  'QUOTA_EXCEEDED',
  'EXTRACTION_FAILED',
  'DOCUMENT_EXPIRED',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    requestId: z.string().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export class JanDastavejError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, statusCode = 400, fields?: Record<string, string>) {
    super(message);
    this.name = 'JanDastavejError';
    this.code = code;
    this.statusCode = statusCode;
    this.fields = fields;
  }
}
