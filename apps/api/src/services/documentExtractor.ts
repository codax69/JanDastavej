import { ExtractedFieldItem } from '@jandastavej/shared';

export interface ExtractionInput {
  buffer: Buffer;
  mimeType: string;
  docType?: string;
  userConsentedAi?: boolean;
}

export class DocumentExtractor {
  /**
   * Extracts text from document (PDF text stream or OCR for images)
   * and applies deterministic regex/pattern rules for Indian/Gujarati identity & address documents.
   */
  public async extractFields(input: ExtractionInput): Promise<ExtractedFieldItem[]> {
    const rawText = this.extractRawText(input.buffer, input.mimeType);
    return this.applyFieldRules(rawText, input.docType);
  }

  /**
   * Reads textual content from PDF or simulated OCR buffer
   */
  private extractRawText(buffer: Buffer, mimeType: string): string {
    if (mimeType === 'application/pdf') {
      const latin = buffer.toString('latin1');
      // Extract textual streams in PDF
      const streamMatches = latin.match(/\((.*?)\)\s*Tj/g) || [];
      const extractedStream = streamMatches
        .map((m) => m.replace(/^\(/, '').replace(/\)\s*Tj$/, ''))
        .join(' ');

      if (extractedStream.length > 20) {
        return extractedStream;
      }
    }

    // Default string conversion (handles UTF-8 text fixtures or simulated text-embedded image data)
    return buffer.toString('utf-8');
  }

  /**
   * Applies robust rule-based regex patterns for Gujarati & English personal documents
   */
  public applyFieldRules(text: string, docType?: string): ExtractedFieldItem[] {
    const items: ExtractedFieldItem[] = [];
    const added = new Set<string>();

    const add = (item: ExtractedFieldItem) => {
      if (!added.has(item.fieldKey)) {
        added.add(item.fieldKey);
        items.push(item);
      }
    };

    // 1. Full Name
    const gujNameMatch = text.match(/(?:નામ|શ્રી|અરજદારનું નામ|સોગંદ લેનાર)[\s:]+([\u0A80-\u0AFF\s]{4,40})/);
    const engNameMatch = text.match(/(?:Name|Full Name|Applicant Name|Deponent)[\s:]+([A-Za-z\s]{4,40})/i);

    if (gujNameMatch && gujNameMatch[1]?.trim()) {
      add({
        fieldKey: 'fullName',
        value: gujNameMatch[1].trim(),
        confidence: 94,
        isSensitive: false,
      });
    } else if (engNameMatch && engNameMatch[1]?.trim()) {
      add({
        fieldKey: 'fullName',
        value: engNameMatch[1].trim(),
        confidence: 92,
        isSensitive: false,
      });
    }

    // 2. Father's / Husband's Name
    const gujFatherMatch = text.match(/(?:પિતાનું નામ|પતિનું નામ|પિતા\/પતિ)[\s:]+([\u0A80-\u0AFF\s]{4,40})/);
    const engFatherMatch = text.match(/(?:Father's Name|Husband's Name|Father\/Husband|S\/O|W\/O|D\/O)[\s:]+([A-Za-z\s]{4,40})/i);

    if (gujFatherMatch && gujFatherMatch[1]?.trim()) {
      add({
        fieldKey: 'parentSpouseName',
        value: gujFatherMatch[1].trim(),
        confidence: 92,
        isSensitive: false,
      });
    } else if (engFatherMatch && engFatherMatch[1]?.trim()) {
      add({
        fieldKey: 'parentSpouseName',
        value: engFatherMatch[1].trim(),
        confidence: 90,
        isSensitive: false,
      });
    }

    // 3. Age / Date of Birth
    const ageMatch = text.match(/(?:ઉંમર|Age)[\s:]+(\d{1,3})(?:\s*વર્ષ|years)?/i);
    const dobMatch = text.match(/(?:DOB|Date of Birth|જન્મ તારીખ)[\s:]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);

    if (ageMatch && ageMatch[1]) {
      const ageNum = parseInt(ageMatch[1], 10);
      if (ageNum >= 18 && ageNum <= 120) {
        add({
          fieldKey: 'age',
          value: String(ageNum),
          confidence: 95,
          isSensitive: false,
        });
      }
    } else if (dobMatch && dobMatch[1]) {
      // Calculate age from DOB
      const parts = dobMatch[1].split(/[\/\-]/);
      const year = parseInt(parts[2], 10);
      if (year > 1900 && year < 2026) {
        const approxAge = 2026 - year;
        add({
          fieldKey: 'age',
          value: String(approxAge),
          confidence: 88,
          isSensitive: false,
        });
      }
    }

    // 4. Address & Pincode
    const gujAddressMatch = text.match(/(?:સરનામું|રહેઠાણ|રહેવાસી)[\s:]+([\u0A80-\u0AFF0-9,\s\-\.\/]{10,150})/);
    const engAddressMatch = text.match(/(?:Address|Residential Address|Residing at)[\s:]+([A-Za-z0-9,\s\-\.\/]{10,150})/i);

    if (gujAddressMatch && gujAddressMatch[1]?.trim()) {
      add({
        fieldKey: 'address',
        value: gujAddressMatch[1].trim(),
        confidence: 91,
        isSensitive: false,
      });
    } else if (engAddressMatch && engAddressMatch[1]?.trim()) {
      add({
        fieldKey: 'address',
        value: engAddressMatch[1].trim(),
        confidence: 89,
        isSensitive: false,
      });
    }

    const pinMatch = text.match(/\b(38\d{4}|36\d{4}|39\d{4})\b/);
    if (pinMatch && pinMatch[1]) {
      add({
        fieldKey: 'pincode',
        value: pinMatch[1],
        confidence: 98,
        isSensitive: false,
      });
    }

    // 5. Sensitive Identifiers (Aadhaar, PAN, Ration Card)
    // Aadhaar: mask all except last 4 digits (e.g. XXXX-XXXX-1234)
    const aadhaarMatch = text.match(/\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b/);
    if (aadhaarMatch) {
      const last4 = aadhaarMatch[3];
      add({
        fieldKey: 'aadhaarNumber',
        value: `XXXX-XXXX-${last4}`,
        confidence: 96,
        isSensitive: true,
      });
    }

    // PAN: mask first 5 letters (e.g. XXXXX1234A)
    const panMatch = text.match(/\b([A-Z]{5})(\d{4})([A-Z])\b/);
    if (panMatch) {
      add({
        fieldKey: 'panNumber',
        value: `XXXXX${panMatch[2]}${panMatch[3]}`,
        confidence: 96,
        isSensitive: true,
      });
    }

    // Ration Card
    const rationMatch = text.match(/(?:રેશન કાર્ડ|Ration Card)[\s#:]+(\d{10,15})/i);
    if (rationMatch && rationMatch[1]) {
      add({
        fieldKey: 'rationCardNumber',
        value: rationMatch[1],
        confidence: 95,
        isSensitive: true,
      });
    }

    // 6. Default Place & Date if in Gujarat context
    if (text.includes('ગાંધીનગર') || text.toLowerCase().includes('gandhinagar')) {
      add({
        fieldKey: 'place',
        value: 'ગાંધીનગર',
        confidence: 95,
        isSensitive: false,
      });
    }

    return items;
  }
}

export const documentExtractor = new DocumentExtractor();
