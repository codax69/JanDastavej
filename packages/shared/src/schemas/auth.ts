import { z } from 'zod';

export const UserRoleSchema = z.enum([
  'admin',
  'template_admin',
  'approver',
  'staff',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: UserRoleSchema,
});
export type AuthUser = z.infer<typeof AuthUserSchema>;
