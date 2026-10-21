export interface PiiMaskResult {
  maskedText: string;
  piiFound: Array<{ type: string; count: number }>;
  success: boolean;
  error?: string;
}

export class PiiMasker {
  /**
   * Masks Personally Identifiable Information (PII) before passing text to any AI model or external API.
   * Conforms to Digital Personal Data Protection (DPDP) Act 2023 principles of data minimization.
   */
  public maskText(text: string): PiiMaskResult {
    try {
      if (!text || typeof text !== 'string') {
        return { maskedText: '', piiFound: [], success: true };
      }

      let masked = text;
      const findings: Record<string, number> = {};

      const recordFinding = (type: string) => {
        findings[type] = (findings[type] || 0) + 1;
      };

      // 1. Aadhaar Number (12 digits with spaces or hyphens)
      // e.g. 1234 5678 9012 or 1234-5678-9012
      masked = masked.replace(/\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/g, (_match, _p1, _p2, p3) => {
        recordFinding('aadhaar');
        return `XXXX-XXXX-${p3}`;
      });

      // 2. PAN Number (5 letters, 4 digits, 1 letter)
      // e.g. ABCDE1234F
      masked = masked.replace(/\b([A-Z]{5})(\d{4})([A-Z])\b/g, (_match, _p1, p2, p3) => {
        recordFinding('pan');
        return `XXXXX${p2}${p3}`;
      });

      // 3. Indian Phone Numbers (10 digits starting with 6-9, with optional +91 prefix)
      masked = masked.replace(/(?:\+91[\s-]?)?\b([6-9]\d{4})[\s-]?(\d{5})\b/g, (_match, _p1, _p2) => {
        recordFinding('phone');
        return '+91-XXXXX-XXXXX';
      });

      // 4. Email Addresses
      masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, () => {
        recordFinding('email');
        return '[MASKED_EMAIL]';
      });

      // 5. Voter ID / EPIC (3 uppercase letters followed by 7 digits)
      masked = masked.replace(/\b([A-Z]{3})(\d{7})\b/g, () => {
        recordFinding('voter_id');
        return 'XXX-XXXXXXX';
      });

      // 6. Passport Numbers
      masked = masked.replace(/\b([A-PR-WYa-pr-wy][1-9]\d\s?\d{4}[1-9])\b/g, () => {
        recordFinding('passport');
        return '[MASKED_PASSPORT]';
      });

      const piiFound = Object.entries(findings).map(([type, count]) => ({ type, count }));

      return {
        maskedText: masked,
        piiFound,
        success: true,
      };
    } catch (err: any) {
      return {
        maskedText: text,
        piiFound: [],
        success: false,
        error: err?.message || 'PII masking failed',
      };
    }
  }
}

export const piiMasker = new PiiMasker();
