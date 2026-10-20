import { describe, it, expect } from 'vitest';
import { validateAndSanitizeAnswers, escapeHtml } from './answers.js';
import { TemplateField } from '../schemas/template.js';

describe('validateAndSanitizeAnswers', () => {
  const fields: TemplateField[] = [
    {
      key: 'fullName',
      label: 'Full Name',
      labelGu: 'પૂર્ણ નામ',
      type: 'text',
      required: true,
      minLength: 3,
      maxLength: 120,
    },
    {
      key: 'age',
      label: 'Age',
      type: 'number',
      required: true,
      min: 18,
      max: 120,
      minLength: 0,
      maxLength: 500,
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      minLength: 0,
      maxLength: 500,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    },
    {
      key: 'remarks',
      label: 'Remarks',
      type: 'textarea',
      required: false,
      minLength: 0,
      maxLength: 500,
    },
  ];

  it('fails when required fields are missing', () => {
    const result = validateAndSanitizeAnswers(fields, {}, 'en');
    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBe('This field is required.');
    expect(result.errors.age).toBe('This field is required.');
    expect(result.errors.gender).toBe('This field is required.');
  });

  it('returns Gujarati error messages when language is gu', () => {
    const result = validateAndSanitizeAnswers(fields, {}, 'gu');
    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBe('આ માહિતી ભરવી આવશ્યક છે.');
  });

  it('escapes HTML tags to prevent XSS and template injection', () => {
    const answers = {
      fullName: '<script>alert("hacked")</script>',
      age: 25,
      gender: 'male',
      remarks: '<b>Test</b> & "quotes"',
    };
    const result = validateAndSanitizeAnswers(fields, answers, 'en');
    expect(result.isValid).toBe(true);
    expect(result.sanitizedAnswers.fullName).toBe('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
    expect(result.sanitizedAnswers.remarks).toBe('&lt;b&gt;Test&lt;/b&gt; &amp; &quot;quotes&quot;');
  });

  it('validates number bounds', () => {
    const answersTooYoung = {
      fullName: 'John Doe',
      age: 16,
      gender: 'male',
    };
    const result = validateAndSanitizeAnswers(fields, answersTooYoung, 'en');
    expect(result.isValid).toBe(false);
    expect(result.errors.age).toBe('Value must be at least 18.');
  });

  it('validates select options strictly', () => {
    const answersInvalidOption = {
      fullName: 'John Doe',
      age: 30,
      gender: 'unknown_option',
    };
    const result = validateAndSanitizeAnswers(fields, answersInvalidOption, 'en');
    expect(result.isValid).toBe(false);
    expect(result.errors.gender).toBe('Please select a valid option.');
  });
});
