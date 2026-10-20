import { z } from 'zod';

export const SupportedLanguageSchema = z.enum(['gu', 'en']);
export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>;

export const MongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
