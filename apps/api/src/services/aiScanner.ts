import { AiScanResult, TemplateField, TemplateCategory } from '@jandastavej/shared';

export interface ScanDocumentInput {
  titleHint?: string;
  text: string;
  categoryHint?: string;
}

export class AiScannerService {
  /**
   * Scans a submitted document format (Gujarati / English legal text)
   * and extracts structured metadata, detected category, bilingual titles, and form fields.
   */
  public async scanDocument(input: ScanDocumentInput): Promise<AiScanResult> {
    const rawText = input.text.trim();
    const titleHint = (input.titleHint || '').trim();

    // 1. Detect Category
    const category = this.detectCategory(rawText, input.categoryHint);

    // 2. Detect Bilingual Titles
    const { detectedTitle, detectedTitleGu } = this.detectTitles(rawText, titleHint, category);

    // 3. Detect Layout Key
    const suggestedLayoutKey = this.detectLayoutKey(rawText, category);

    // 4. Extract Dynamic Input Fields
    const extractedFields = this.extractFields(rawText, category);

    // 5. Detect Purpose & Rules
    const { detectedPurpose, detectedPurposeGu, extractedRules } = this.detectPurposeAndRules(rawText, category);

    // 6. Calculate Confidence Score
    const confidenceScore = this.calculateConfidence(rawText, extractedFields);

    const scanSummary = `AI scanned ${rawText.length} characters of legal document format. Identified ${extractedFields.length} dynamic citizen variables with ${confidenceScore}% confidence under '${category}' classification. Ready for administrative verification and publication.`;

    return {
      detectedTitle,
      detectedTitleGu,
      detectedCategory: category,
      detectedPurpose,
      detectedPurposeGu,
      extractedFields,
      suggestedLayoutKey,
      confidenceScore,
      extractedRules,
      scanSummary,
    };
  }

  private detectCategory(text: string, categoryHint?: string): TemplateCategory {
    if (categoryHint && ['affidavit', 'declaration', 'certificate_support', 'revenue_service', 'general'].includes(categoryHint)) {
      return categoryHint as TemplateCategory;
    }

    const lower = text.toLowerCase();
    if (text.includes('સોગંદનામું') || lower.includes('affidavit') || lower.includes('sworn') || text.includes('પ્રતિજ્ઞાપત્ર')) {
      return 'affidavit';
    }
    if (text.includes('મહેસૂલ') || text.includes('જમીન') || text.includes('૭/૧૨') || text.includes('૮-અ') || lower.includes('revenue') || lower.includes('land')) {
      return 'revenue_service';
    }
    if (text.includes('પ્રમાણપત્ર') || text.includes('આવક') || text.includes('જાતિ') || lower.includes('certificate') || lower.includes('income')) {
      return 'certificate_support';
    }
    if (text.includes('એકરારનામું') || text.includes('બાંહેધરી') || text.includes('ઘોષણાપત્ર') || lower.includes('declaration')) {
      return 'declaration';
    }
    return 'general';
  }

  private detectTitles(text: string, titleHint: string, category: TemplateCategory): { detectedTitle: string; detectedTitleGu: string } {
    if (titleHint) {
      if (/[\u0A80-\u0AFF]/.test(titleHint)) {
        return {
          detectedTitle: this.suggestEnglishTitle(titleHint, category),
          detectedTitleGu: titleHint,
        };
      } else {
        return {
          detectedTitle: titleHint,
          detectedTitleGu: this.suggestGujaratiTitle(titleHint, category),
        };
      }
    }

    // Inspect first 3 lines
    const firstLines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3).slice(0, 3);
    const candidate = firstLines[0] || '';

    if (candidate.length > 5 && candidate.length < 100) {
      if (/[\u0A80-\u0AFF]/.test(candidate)) {
        return {
          detectedTitle: this.suggestEnglishTitle(candidate, category),
          detectedTitleGu: candidate,
        };
      } else {
        return {
          detectedTitle: candidate,
          detectedTitleGu: this.suggestGujaratiTitle(candidate, category),
        };
      }
    }

    if (category === 'affidavit') {
      return {
        detectedTitle: 'General Sworn Legal Affidavit',
        detectedTitleGu: 'સામાન્ય સત્તાવાર સોગંદનામું',
      };
    } else if (category === 'revenue_service') {
      return {
        detectedTitle: 'Revenue & Land Verification Declaration',
        detectedTitleGu: 'મહેસૂલી જમીન ખરાઈ અંગેનું એકરારનામું',
      };
    } else if (category === 'certificate_support') {
      return {
        detectedTitle: 'Supporting Declaration for Certificate Issuance',
        detectedTitleGu: 'પ્રમાણપત્ર પ્રાપ્તિ અર્થેનું સમર્થન એકરારનામું',
      };
    }

    return {
      detectedTitle: 'Self Declaration / Undertaking Form',
      detectedTitleGu: 'સ્વયં ઘોષણાપત્ર / બાંહેધરી પત્રક',
    };
  }

  private suggestEnglishTitle(guTitle: string, category: TemplateCategory): string {
    if (guTitle.includes('રેશન કાર્ડ')) return 'Ration Card Member Declaration';
    if (guTitle.includes('આવક')) return 'Income Verification Declaration';
    if (guTitle.includes('સરનામું') || guTitle.includes('રહેઠાણ')) return 'Residential Address Declaration';
    if (guTitle.includes('જમીન')) return 'Agricultural Land Ownership Declaration';
    if (category === 'affidavit') return 'General Legal Sworn Affidavit';
    return 'Self Declaration & Undertaking';
  }

  private suggestGujaratiTitle(enTitle: string, category: TemplateCategory): string {
    const lower = enTitle.toLowerCase();
    if (lower.includes('ration')) return 'રેશન કાર્ડ અંગેનું એકરારનામું';
    if (lower.includes('income')) return 'વાર્ષિક આવક અંગેનું સોગંદનામું / એકરારનામું';
    if (lower.includes('address') || lower.includes('residence')) return 'રહેઠાણ અંગેનું સ્વયં ઘોષણાપત્ર';
    if (lower.includes('land')) return 'જમીન વિગત અંગેનું એકરારનામું';
    if (category === 'affidavit') return 'સામાન્ય સત્તાવાર સોગંદનામું';
    return 'સ્વયં ઘોષણાપત્ર / બાંહેધરી પત્રક';
  }

  private detectLayoutKey(text: string, category: TemplateCategory): string {
    if (category === 'affidavit') return 'sample_affidavit';
    if (text.includes('સરનામું') && (text.includes('ભાડે') || text.includes('માલિકી') || text.includes('residing'))) {
      return 'sample_address_declaration';
    }
    return 'sample_declaration';
  }

  private extractFields(text: string, category: TemplateCategory): TemplateField[] {
    const fields: TemplateField[] = [];
    const addedKeys = new Set<string>();

    const addField = (field: Partial<TemplateField> & Pick<TemplateField, 'key' | 'label' | 'type'>) => {
      if (!addedKeys.has(field.key)) {
        addedKeys.add(field.key);
        fields.push({
          key: field.key,
          label: field.label,
          labelGu: field.labelGu,
          type: field.type,
          required: field.required !== false,
          placeholder: field.placeholder,
          placeholderGu: field.placeholderGu,
          helpText: field.helpText,
          helpTextGu: field.helpTextGu,
          minLength: field.minLength ?? 0,
          maxLength: field.maxLength ?? 500,
          min: field.min,
          max: field.max,
          options: field.options,
        });
      }
    };

    // 1. Mandatory Core Identity Fields
    if (category === 'affidavit') {
      addField({
        key: 'deponentName',
        label: 'Deponent Full Name',
        labelGu: 'સોગંદ લેનારનું પૂરું નામ',
        type: 'text',
        required: true,
        placeholder: 'e.g. Ramanlal Chaturbhai Shah',
        placeholderGu: 'દા.ત. રમણલાલ ચતુરભાઈ શાહ',
        maxLength: 120,
      });
      addField({
        key: 'parentSpouseName',
        label: "Father's / Husband's Name",
        labelGu: 'પિતા / પતિનું નામ',
        type: 'text',
        required: true,
        placeholder: 'e.g. Chaturbhai Shah',
        placeholderGu: 'દા.ત. ચતુરભાઈ શાહ',
        maxLength: 120,
      });
      addField({
        key: 'deponentAge',
        label: 'Age (in Years)',
        labelGu: 'ઉંમર (વર્ષમાં)',
        type: 'number',
        required: true,
        min: 18,
        max: 120,
      });
    } else {
      addField({
        key: 'fullName',
        label: 'Applicant Full Name',
        labelGu: 'અરજદારનું પૂરું નામ',
        type: 'text',
        required: true,
        placeholder: 'e.g. Ramanlal Chaturbhai Shah',
        placeholderGu: 'દા.ત. રમણલાલ ચતુરભાઈ શાહ',
        maxLength: 120,
      });
      addField({
        key: 'parentSpouseName',
        label: "Father's / Husband's Name",
        labelGu: 'પિતા / પતિનું નામ',
        type: 'text',
        required: true,
        placeholder: 'e.g. Chaturbhai Shah',
        placeholderGu: 'દા.ત. ચતુરભાઈ શાહ',
        maxLength: 120,
      });
      addField({
        key: 'age',
        label: 'Age (in Years)',
        labelGu: 'ઉંમર (વર્ષમાં)',
        type: 'number',
        required: true,
        min: 18,
        max: 120,
      });
    }

    // 2. Occupation
    addField({
      key: 'occupation',
      label: 'Occupation / Profession',
      labelGu: 'ધંધો / વ્યવસાય',
      type: 'text',
      required: true,
      placeholder: 'e.g. Business / Agriculture / Service',
      placeholderGu: 'દા.ત. વેપાર / ખેતી / નોકરી',
      maxLength: 80,
    });

    // 3. Address
    addField({
      key: 'address',
      label: 'Residential Address',
      labelGu: 'રહેઠાણનું સરનામું',
      type: 'textarea',
      required: true,
      placeholder: 'Full address with Taluka and District',
      placeholderGu: 'તાલુકા અને જિલ્લા સાથેનું સંપૂર્ણ સરનામું',
      maxLength: 500,
    });

    // 4. Contextual Fields Detected in Text
    const lower = text.toLowerCase();

    // Aadhaar
    if (text.includes('આધાર') || lower.includes('aadhaar')) {
      addField({
        key: 'aadhaarNumber',
        label: 'Aadhaar Number (Last 4 Digits or Masked)',
        labelGu: 'આધાર કાર્ડ નંબર',
        type: 'text',
        required: false,
        placeholder: 'e.g. XXXX-XXXX-1234',
        maxLength: 16,
      });
    }

    // Ration Card
    if (text.includes('રેશન કાર્ડ') || lower.includes('ration card')) {
      addField({
        key: 'rationCardNumber',
        label: 'Ration Card Number',
        labelGu: 'રેશન કાર્ડ નંબર',
        type: 'text',
        required: true,
        placeholder: 'e.g. 072501234567',
        maxLength: 30,
      });
    }

    // Annual Income
    if (text.includes('આવક') || lower.includes('income')) {
      addField({
        key: 'annualIncome',
        label: 'Annual Family Income (₹)',
        labelGu: 'વાર્ષિક કૌટુંબિક આવક (રૂ.)',
        type: 'number',
        required: true,
        min: 0,
        max: 100000000,
      });
    }

    // Land / Survey Number
    if (text.includes('સર્વે') || text.includes('જમીન') || lower.includes('survey') || lower.includes('land')) {
      addField({
        key: 'surveyNumber',
        label: 'Survey / Block Number',
        labelGu: 'સર્વે / બ્લોક નંબર',
        type: 'text',
        required: true,
        placeholder: 'e.g. Survey No. 142/1',
        maxLength: 100,
      });
    }

    // Matter / Purpose Statement
    if (category === 'affidavit') {
      addField({
        key: 'matterStated',
        label: 'Facts & Statements Affirmed (Deposition Details)',
        labelGu: 'સોગંદપૂર્વકનું નિવેદન / હકીકત',
        type: 'textarea',
        required: true,
        placeholder: 'State the precise factual matter sworn in this affidavit',
        placeholderGu: 'સોગંદનામામાં રજૂ કરવાની ચોક્કસ હકીકતો અહીં લખો',
        maxLength: 2000,
      });
    } else {
      addField({
        key: 'declarationPurpose',
        label: 'Purpose of Declaration',
        labelGu: 'એકરારનો વિગતવાર હેતુ',
        type: 'textarea',
        required: true,
        placeholder: 'Describe why this declaration is being submitted',
        placeholderGu: 'આ ઘોષણાપત્ર કયા હેતુ માટે રજૂ કરવાનું છે તેની વિગત',
        maxLength: 1000,
      });
    }

    // 5. Standard Date & Place
    addField({
      key: 'declarationDate',
      label: 'Date of Declaration',
      labelGu: 'તારીખ',
      type: 'date',
      required: true,
    });

    addField({
      key: 'place',
      label: 'Place',
      labelGu: 'સ્થળ',
      type: 'text',
      required: true,
      placeholder: 'Gandhinagar',
      placeholderGu: 'ગાંધીનગર',
      maxLength: 80,
    });

    return fields;
  }

  private detectPurposeAndRules(
    text: string,
    category: TemplateCategory
  ): { detectedPurpose: string; detectedPurposeGu: string; extractedRules: string[] } {
    const rules: string[] = [
      'Document generated using Gandhinagar Collector Office standardized layout format.',
      'Citizen must verify all entered details before signing before designated administrative authority.',
      'False declarations are liable for penal action under relevant provisions of law.',
    ];

    if (category === 'affidavit') {
      return {
        detectedPurpose: 'Sworn affidavit for official verification before administrative magistrate or notary public.',
        detectedPurposeGu: 'સક્ષમ મેજિસ્ટ્રેટશ્રી અથવા નોટરી સમક્ષ સત્તાવાર રજૂ કરવા અંગેનું સોગંદનામું.',
        extractedRules: rules,
      };
    }

    if (category === 'revenue_service') {
      return {
        detectedPurpose: 'Official declaration for agricultural, land record, or revenue department verification.',
        detectedPurposeGu: 'જમીન વિગતો અને મહેસૂલી રેકર્ડ ખરાઈ માટેનું સત્તાવાર એકરારનામું.',
        extractedRules: rules,
      };
    }

    return {
      detectedPurpose: 'Self-declaration for public services under Citizen Charter (JanDastavej Standard Format).',
      detectedPurposeGu: 'નાગરિક અધિકાર પત્ર અંતર્ગત વિવિધ સરકારી સેવાઓ માટે રજૂ કરવાનું સ્વયં ઘોષણાપત્ર.',
      extractedRules: rules,
    };
  }

  private calculateConfidence(text: string, fields: TemplateField[]): number {
    let score = 75;
    if (text.length > 100) score += 5;
    if (text.length > 300) score += 5;
    if (/[\u0A80-\u0AFF]/.test(text)) score += 5; // Gujarati script verified
    if (fields.length >= 5) score += 5;
    return Math.min(score, 96);
  }
}

export const aiScannerService = new AiScannerService();
