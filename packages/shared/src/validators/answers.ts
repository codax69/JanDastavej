import { TemplateField } from '../schemas/template.js';
import { GenerationAnswers } from '../schemas/generation.js';
import { SupportedLanguage } from '../schemas/common.js';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedAnswers: Record<string, any>;
}

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateAndSanitizeAnswers(
  fields: TemplateField[],
  answers: GenerationAnswers,
  language: SupportedLanguage = 'gu',
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitizedAnswers: Record<string, any> = {};

  const msgRequired = language === 'gu' ? 'આ માહિતી ભરવી આવશ્યક છે.' : 'This field is required.';
  const msgInvalidDate = language === 'gu' ? 'કૃપા કરીને માન્ય તારીખ પસંદ કરો.' : 'Please enter a valid date.';
  const msgInvalidNumber = language === 'gu' ? 'કૃપા કરીને માન્ય સંખ્યા દાખલ કરો.' : 'Please enter a valid number.';
  const msgOptionInvalid = language === 'gu' ? 'કૃપા કરીને આપેલા વિકલ્પોમાંથી પસંદ કરો.' : 'Please select a valid option.';

  for (const field of fields) {
    const rawVal = answers[field.key];
    const isMissing = rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0);

    if (field.required && isMissing) {
      errors[field.key] = msgRequired;
      continue;
    }

    if (isMissing) {
      sanitizedAnswers[field.key] = '';
      continue;
    }

    switch (field.type) {
      case 'text':
      case 'textarea': {
        const strVal = String(rawVal).trim();
        if (field.required && strVal.length === 0) {
          errors[field.key] = msgRequired;
        } else if (field.minLength && strVal.length < field.minLength) {
          errors[field.key] = language === 'gu'
            ? `ઓછામાં ઓછા ${field.minLength} અક્ષરો જરૂરી છે.`
            : `Minimum ${field.minLength} characters required.`;
        } else if (field.maxLength && strVal.length > field.maxLength) {
          errors[field.key] = language === 'gu'
            ? `વધુમાં વધુ ${field.maxLength} અક્ષરો માન્ય છે.`
            : `Maximum ${field.maxLength} characters allowed.`;
        } else {
          // Escaped to guarantee no raw HTML or script tags pass through
          sanitizedAnswers[field.key] = escapeHtml(strVal);
        }
        break;
      }

      case 'date': {
        const strVal = String(rawVal).trim();
        const dateObj = new Date(strVal);
        if (isNaN(dateObj.getTime())) {
          errors[field.key] = msgInvalidDate;
        } else {
          sanitizedAnswers[field.key] = strVal;
        }
        break;
      }

      case 'number': {
        const numVal = Number(rawVal);
        if (isNaN(numVal)) {
          errors[field.key] = msgInvalidNumber;
        } else if (field.min !== undefined && numVal < field.min) {
          errors[field.key] = language === 'gu'
            ? `મૂલ્ય ${field.min} થી ઓછું ન હોઈ શકે.`
            : `Value must be at least ${field.min}.`;
        } else if (field.max !== undefined && numVal > field.max) {
          errors[field.key] = language === 'gu'
            ? `મૂલ્ય ${field.max} થી વધુ ન હોઈ શકે.`
            : `Value cannot exceed ${field.max}.`;
        } else {
          sanitizedAnswers[field.key] = numVal;
        }
        break;
      }

      case 'select':
      case 'radio': {
        const strVal = String(rawVal);
        const validOptions = (field.options || []).map((o) => o.value);
        if (validOptions.length > 0 && !validOptions.includes(strVal)) {
          errors[field.key] = msgOptionInvalid;
        } else {
          sanitizedAnswers[field.key] = escapeHtml(strVal);
        }
        break;
      }

      case 'checkbox': {
        if (typeof rawVal === 'boolean') {
          if (field.required && !rawVal) {
            errors[field.key] = msgRequired;
          } else {
            sanitizedAnswers[field.key] = rawVal;
          }
        } else if (Array.isArray(rawVal)) {
          sanitizedAnswers[field.key] = rawVal.map((v) => escapeHtml(String(v)));
        } else {
          sanitizedAnswers[field.key] = Boolean(rawVal);
        }
        break;
      }

      default:
        sanitizedAnswers[field.key] = escapeHtml(String(rawVal));
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedAnswers,
  };
}
