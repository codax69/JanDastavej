import { describe, it, expect } from 'vitest';
import { TemplateFieldSchema, TemplateVersionSchema } from './template.js';
import { ApiErrorResponseSchema } from './errors.js';

describe('Template Schemas', () => {
  it('validates a valid field', () => {
    const validField = {
      key: 'fullName',
      label: 'પૂર્ણ નામ',
      type: 'text',
      required: true,
      maxLength: 120,
    };
    const parsed = TemplateFieldSchema.safeParse(validField);
    expect(parsed.success).toBe(true);
  });

  it('rejects field with invalid key starting with number or with spaces', () => {
    const invalidField = {
      key: '1fullName',
      label: 'Invalid Key',
      type: 'text',
    };
    const parsed = TemplateFieldSchema.safeParse(invalidField);
    expect(parsed.success).toBe(false);
  });

  it('validates a complete template version', () => {
    const version = {
      templateId: 'tpl-1',
      version: 1,
      language: 'gu',
      fields: [
        { key: 'fullName', label: 'પૂર્ણ નામ', type: 'text', required: true },
        { key: 'address', label: 'સરનામું', type: 'textarea', required: true },
        { key: 'declarationDate', label: 'તારીખ', type: 'date', required: true },
      ],
      layoutKey: 'sample_declaration',
      sourceReference: 'Collector Office, Gandhinagar - Standard Format',
      status: 'published',
    };
    const parsed = TemplateVersionSchema.safeParse(version);
    expect(parsed.success).toBe(true);
  });

  it('validates error response envelope', () => {
    const errorEnvelope = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please correct the highlighted fields.',
        fields: {
          fullName: 'This field is required.',
        },
        requestId: 'req-1234',
      },
    };
    const parsed = ApiErrorResponseSchema.safeParse(errorEnvelope);
    expect(parsed.success).toBe(true);
  });
});
