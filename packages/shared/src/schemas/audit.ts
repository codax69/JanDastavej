import { z } from 'zod';

export const AuditActionSchema = z.enum([
  'TEMPLATE_CREATED',
  'TEMPLATE_UPDATED',
  'VERSION_SUBMITTED_FOR_REVIEW',
  'VERSION_APPROVED',
  'VERSION_REJECTED',
  'VERSION_PUBLISHED',
  'VERSION_RETIRED',
  'ADMIN_LOGIN_SUCCESS',
  'ADMIN_LOGIN_FAILED',
  'ADMIN_LOGOUT',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditEventSchema = z.object({
  _id: z.string().optional(),
  actorUserId: z.string().optional(),
  actorEmail: z.string().optional(),
  action: AuditActionSchema,
  entityType: z.enum(['template', 'template_version', 'auth', 'submission', 'system']),
  entityId: z.string(),
  version: z.number().optional(),
  reason: z.string().optional(),
  timestamp: z.string().or(z.date()),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;
