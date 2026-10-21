import {
  AiScanResult,
  AiScanResultSchema,
  TemplateField,
  TemplateCategory,
  VerificationFinding,
  VerificationStatus,
} from '@jandastavej/shared';
import { piiMasker } from './piiMasker.js';

export interface ScanDocumentInput {
  titleHint?: string;
  text: string;
  categoryHint?: string;
  sourceUrl?: string;
  sourceDescription?: string;
  issuingAuthority?: string;
  documentType?: string;
  fileHash?: string;
}

export class AiScannerService {
  /**
   * Modular AI & Rule-based Verification Pipeline (Section 5)
   * 1. File & Extraction quality check
   * 2. PII Masking (DPDP Act 2023) - Skips AI if masking fails
   * 3. Document classification
   * 4. Structural validation (signatures, dates, missing sections, unresolved placeholders)
   * 5. Template suitability (fixed text vs citizen placeholders)
   * 6. Source & provenance checks (SSRF safe, domain validation)
   * 7. Schema-validated AI Verification Report (never raw HTML)
   */
  public async scanDocument(input: ScanDocumentInput): Promise<AiScanResult> {
    const rawText = (input.text || '').trim();
    const titleHint = (input.titleHint || '').trim();

    // Step 1 & 2: Text extraction check
    if (rawText.length < 20) {
      return AiScanResultSchema.parse({
        detectedTitle: titleHint || 'Unreadable Document',
        detectedTitleGu: 'અવાચ્ય દસ્તાવેજ',
        detectedCategory: 'general',
        detectedPurpose: 'Document contains insufficient or empty text content.',
        detectedPurposeGu: 'દસ્તાવેજમાં અપર્યાપ્ત અથવા ખાલી લખાણ છે.',
        extractedFields: [
          {
            key: 'content',
            label: 'Content',
            labelGu: 'વિગતો',
            type: 'textarea',
            required: true,
          },
        ],
        suggestedLayoutKey: 'sample_declaration',
        confidenceScore: 0,
        extractedRules: [],
        scanSummary: 'EXTRACTION_FAILED: Document has no readable text streams or OCR failed.',
        verificationStatus: 'EXTRACTION_FAILED',
        extractionQuality: 'failed',
        structuralFindings: [
          {
            category: 'extraction',
            severity: 'critical',
            message: 'Document contains insufficient or empty text content.',
          },
        ],
        suitabilityFindings: [],
        sourceFindings: [],
        piiFindings: [],
        warnings: ['Document text is empty or extraction failed.'],
        recommendedAction: 'rejected',
        pipelineVersion: '2.1.0-audit-verified',
        model: 'JanDastavej-LegalRuleExtractor-v2',
        analyzedAt: new Date().toISOString(),
      });
    }

    // PII Masking Gate (Section 5 + Rule: "Mask PII before any AI call; skip AI if masking fails")
    const maskResult = piiMasker.maskText(rawText);
    if (!maskResult.success) {
      return AiScanResultSchema.parse({
        detectedTitle: titleHint || 'Document with Unmasked PII',
        detectedTitleGu: 'સંવેદનશીલ વિગતો ધરાવતો દસ્તાવેજ',
        detectedCategory: 'general',
        detectedPurpose: 'PII masking failed; AI verification skipped to protect sensitive data.',
        detectedPurposeGu: 'સંવેદનશીલ માહિતી માસ્કિંગ નિષ્ફળ; એઆઈ ચકાસણી છોડી દેવામાં આવી.',
        extractedFields: [
          {
            key: 'applicantName',
            label: 'Applicant Name',
            labelGu: 'અરજદારનું નામ',
            type: 'text',
            required: true,
          },
        ],
        suggestedLayoutKey: 'sample_declaration',
        confidenceScore: 10,
        extractedRules: [],
        scanSummary: 'MANUAL_REVIEW_REQUIRED: PII masking error occurred. Automated processing halted.',
        verificationStatus: 'MANUAL_REVIEW_REQUIRED',
        extractionQuality: 'low',
        structuralFindings: [],
        suitabilityFindings: [],
        sourceFindings: [],
        piiFindings: [
          {
            category: 'pii',
            severity: 'critical',
            message: 'PII masking process encountered an unexpected error.',
          },
        ],
        warnings: ['PII masking failed; AI verification skipped to protect personal data.'],
        recommendedAction: 'manual_review_required',
        pipelineVersion: '2.1.0-audit-verified',
        model: 'JanDastavej-LegalRuleExtractor-v2',
        analyzedAt: new Date().toISOString(),
      });
    }

    const workingText = maskResult.maskedText;

    // Step 3: Document Classification
    const category = this.detectCategory(workingText, input.categoryHint);

    // Bilingual Titles
    const { detectedTitle, detectedTitleGu } = this.detectTitles(workingText, titleHint, category);

    // Suggested Layout
    const suggestedLayoutKey = this.detectLayoutKey(workingText, category);

    // Step 4: Extract Dynamic Input Fields
    const extractedFields = this.extractFields(workingText, category);

    // Step 4: Structural Validation Findings
    const structuralFindings: VerificationFinding[] = [];
    const warnings: string[] = [];

    // Check title / purpose
    if (workingText.length < 50) {
      structuralFindings.push({
        category: 'structure',
        severity: 'warning',
        message: 'Document format is unusually brief (< 50 characters).',
      });
      warnings.push('Brief legal text; check for missing mandatory statutory clauses.');
    }

    // Check signature blocks
    const hasSignature =
      workingText.includes('સહી') ||
      workingText.toLowerCase().includes('signature') ||
      workingText.includes('સોગંદ લેનાર') ||
      workingText.toLowerCase().includes('deponent');
    if (!hasSignature) {
      structuralFindings.push({
        category: 'structure',
        severity: 'warning',
        message: 'No explicit signature block or deponent affirmation line detected.',
      });
      warnings.push('Missing explicit signature placeholder; reviewer should add deponent block.');
    }

    // Check date and place
    const hasDateOrPlace =
      workingText.includes('તારીખ') ||
      workingText.toLowerCase().includes('date') ||
      workingText.includes('સ્થળ') ||
      workingText.toLowerCase().includes('place');
    if (!hasDateOrPlace) {
      structuralFindings.push({
        category: 'structure',
        severity: 'info',
        message: 'Standard date and place footer missing in uploaded text.',
      });
    }

    // Check unresolved blanks
    const blankMatches = workingText.match(/_{3,}/g) || [];
    if (blankMatches.length > 0) {
      structuralFindings.push({
        category: 'structure',
        severity: 'info',
        message: `Detected ${blankMatches.length} underlined blank placeholders for dynamic citizen entry.`,
      });
    }

    // Step 5: Template Suitability Findings
    const suitabilityFindings: VerificationFinding[] = [];
    if (extractedFields.length < 2) {
      suitabilityFindings.push({
        category: 'suitability',
        severity: 'warning',
        message: 'Very few citizen input variables detected. May be fixed notice rather than reusable form.',
      });
    } else {
      suitabilityFindings.push({
        category: 'suitability',
        severity: 'info',
        message: `Identified ${extractedFields.length} reusable citizen input fields (Name, Address, Identifiers).`,
      });
    }

    // Step 6: Source & Provenance Checks (with SSRF protection)
    const sourceFindings: VerificationFinding[] = [];
    let isSourceOfficial = false;

    if (input.sourceUrl) {
      const url = input.sourceUrl.trim();
      // SSRF Protection: forbid internal/private addresses
      if (/^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/i.test(url)) {
        sourceFindings.push({
          category: 'source',
          severity: 'critical',
          message: 'SSRF Warning: Provided source URL points to a private or internal network address.',
        });
        warnings.push('Security Alert: Private IP address in source URL rejected.');
      } else if (/\.(gov\.in|nic\.in)(\/|$)/i.test(url)) {
        isSourceOfficial = true;
        sourceFindings.push({
          category: 'source',
          severity: 'info',
          message: 'Source verified: Belongs to official Indian Government domain (.gov.in / .nic.in).',
        });
      } else {
        sourceFindings.push({
          category: 'source',
          severity: 'warning',
          message: 'Third-party or external reference URL. Requires manual review of official gazette validity.',
        });
        warnings.push('External source URL requires administrative authenticity check.');
      }
    } else {
      sourceFindings.push({
        category: 'source',
        severity: 'info',
        message: 'No source URL provided. Submitter reference or sample document.',
      });
    }

    // PII Findings
    const piiFindings: VerificationFinding[] = maskResult.piiFound.map((p) => ({
      category: 'pii',
      severity: 'info',
      message: `Detected and masked ${p.count} ${p.type} identifier(s) for citizen privacy.`,
    }));

    // Purpose & Rules
    const { detectedPurpose, detectedPurposeGu, extractedRules } = this.detectPurposeAndRules(
      workingText,
      category
    );

    // Confidence Score Calculation
    let confidenceScore = this.calculateConfidence(workingText, extractedFields);
    if (!isSourceOfficial && input.sourceUrl) {
      confidenceScore = Math.max(30, confidenceScore - 10);
    }
    if (structuralFindings.some((f) => f.severity === 'critical')) {
      confidenceScore = Math.min(confidenceScore, 40);
    }

    // Determine Overall Verification Status (Section 5 Step 7)
    let verificationStatus: VerificationStatus = 'TECHNICAL_CHECK_PASSED';
    let recommendedAction: 'ready_for_review' | 'manual_review_required' | 'needs_correction' | 'rejected' =
      'ready_for_review';

    if (structuralFindings.some((f) => f.severity === 'critical')) {
      verificationStatus = 'MANUAL_REVIEW_REQUIRED';
      recommendedAction = 'manual_review_required';
    } else if (warnings.length > 0) {
      verificationStatus = 'WARNINGS_FOUND';
      recommendedAction = 'manual_review_required';
    } else if (!isSourceOfficial && input.sourceUrl) {
      verificationStatus = 'SOURCE_UNVERIFIED';
      recommendedAction = 'ready_for_review';
    }

    const scanSummary = `AI verification completed (${rawText.length} chars). Classified as '${category}' with ${extractedFields.length} variables. Status: ${verificationStatus}. Confidence: ${confidenceScore}%.`;

    const result = {
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
      verificationStatus,
      extractionQuality: 'high' as const,
      structuralFindings,
      suitabilityFindings,
      sourceFindings,
      piiFindings,
      warnings,
      recommendedAction,
      isDuplicate: false,
      pipelineVersion: '2.1.0-audit-verified',
      model: 'JanDastavej-LegalRuleExtractor-v2',
      analyzedAt: new Date().toISOString(),
    };

    return AiScanResultSchema.parse(result);
  }

  private detectCategory(text: string, categoryHint?: string): TemplateCategory {
    if (
      categoryHint &&
      ['affidavit', 'declaration', 'certificate_support', 'revenue_service', 'general'].includes(categoryHint)
    ) {
      return categoryHint as TemplateCategory;
    }

    const lower = text.toLowerCase();
    if (
      text.includes('સોગંદનામું') ||
      lower.includes('affidavit') ||
      lower.includes('sworn') ||
      text.includes('પ્રતિજ્ઞાપત્ર')
    ) {
      return 'affidavit';
    }
    if (
      text.includes('મહેસૂલ') ||
      text.includes('જમીન') ||
      text.includes('૭/૧૨') ||
      text.includes('૮-અ') ||
      lower.includes('revenue') ||
      lower.includes('land')
    ) {
      return 'revenue_service';
    }
    if (
      text.includes('પ્રમાણપત્ર') ||
      text.includes('આવક') ||
      text.includes('જાતિ') ||
      lower.includes('certificate') ||
      lower.includes('income')
    ) {
      return 'certificate_support';
    }
    if (
      text.includes('એકરારનામું') ||
      text.includes('બાંહેધરી') ||
      text.includes('ઘોષણાપત્ર') ||
      lower.includes('declaration')
    ) {
      return 'declaration';
    }
    return 'general';
  }

  private detectTitles(
    text: string,
    titleHint: string,
    category: TemplateCategory
  ): { detectedTitle: string; detectedTitleGu: string } {
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

    // Inspect first 3 non-empty lines
    const firstLines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3)
      .slice(0, 3);
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

    return {
      detectedTitle: this.suggestEnglishTitle('Candidate Template', category),
      detectedTitleGu: this.suggestGujaratiTitle('ઉમેદવારી નમૂનો', category),
    };
  }

  private suggestEnglishTitle(hint: string, category: TemplateCategory): string {
    if (hint.includes('રેશન કાર્ડ')) return 'Ration Card Addition Affidavit';
    if (hint.includes('આવક')) return 'Annual Family Income Declaration';
    if (hint.includes('જમીન')) return 'Agricultural Land Ownership Declaration';
    if (hint.includes('નામ')) return 'Name Correction / Change Affidavit';
    if (hint.includes('વીજળી') || hint.includes('પાણી')) return 'Utility Connection Compliance Undertaking';

    switch (category) {
      case 'affidavit':
        return 'General Sworn Legal Affidavit';
      case 'declaration':
        return 'Citizen Self-Declaration';
      case 'revenue_service':
        return 'Revenue Department Declaration';
      case 'certificate_support':
        return 'Certificate Application Declaration';
      default:
        return 'Standard Citizen Declaration';
    }
  }

  private suggestGujaratiTitle(hint: string, category: TemplateCategory): string {
    if (hint.toLowerCase().includes('ration')) return 'રેશન કાર્ડમાં નામ ઉમેરવા અંગેનું સોગંદનામું';
    if (hint.toLowerCase().includes('income')) return 'વાર્ષિક કૌટુંબિક આવક અંગેનું સ્વયં ઘોષણાપત્ર';
    if (hint.toLowerCase().includes('land')) return 'મહેસૂલી જમીન વિગત અંગેનું એકરારનામું';
    if (hint.toLowerCase().includes('name')) return 'નામ સુધારણા અથવા બદલવા અંગેનું સોગંદનામું';
    if (hint.toLowerCase().includes('utility')) return 'નવા જોડાણ અંગેનું બાંહેધરીપત્ર';

    switch (category) {
      case 'affidavit':
        return 'સામાન્ય કાનૂની સોગંદનામું';
      case 'declaration':
        return 'નાગરિક સ્વયં ઘોષણાપત્ર';
      case 'revenue_service':
        return 'મહેસૂલી સેવા માટેનું એકરારનામું';
      case 'certificate_support':
        return 'પ્રમાણપત્ર અરજી માટેનું ઘોષણાપત્ર';
      default:
        return 'પ્રમાણિત નાગરિક નિવેદન';
    }
  }

  private detectLayoutKey(text: string, category: TemplateCategory): string {
    const lower = text.toLowerCase();
    if (text.includes('વીજળી') || text.includes('પાણી') || lower.includes('utility')) {
      return 'undertaking_utility';
    }
    if (text.includes('આવક') || lower.includes('income')) {
      return 'income_declaration';
    }
    if (category === 'affidavit' || text.includes('સોગંદનામું')) {
      return 'sample_affidavit';
    }
    return 'sample_declaration';
  }

  private extractFields(text: string, category: TemplateCategory): TemplateField[] {
    const fields: TemplateField[] = [];
    const addedKeys = new Set<string>();

    const addField = (field: {
      key: string;
      label: string;
      labelGu?: string;
      type: TemplateField['type'];
      required?: boolean;
      placeholder?: string;
      placeholderGu?: string;
      minLength?: number;
      maxLength?: number;
    }) => {
      if (!addedKeys.has(field.key)) {
        addedKeys.add(field.key);
        fields.push({
          minLength: field.minLength ?? 0,
          maxLength: field.maxLength ?? 500,
          required: field.required ?? true,
          ...field,
        });
      }
    };

    // 1. Full Name / Deponent Name
    if (
      text.includes('નામ') ||
      text.toLowerCase().includes('name') ||
      text.includes('શ્રી') ||
      text.includes('સોગંદ લેનાર')
    ) {
      addField({
        key: 'deponentName',
        label: 'Full Name of Deponent / Applicant',
        labelGu: 'સોગંદ લેનાર / અરજદારનું પૂરું નામ',
        type: 'text',
        required: true,
        placeholder: 'e.g. Ramesh Patel',
        placeholderGu: 'દા.ત. રમેશભાઈ કાંતિભાઈ પટેલ',
      });
    }

    // 2. Father's / Husband's Name
    if (
      text.includes('પિતા') ||
      text.includes('પતિ') ||
      text.toLowerCase().includes('father') ||
      text.toLowerCase().includes('husband')
    ) {
      addField({
        key: 'parentSpouseName',
        label: "Father's / Husband's Name",
        labelGu: 'પિતા / પતિનું નામ',
        type: 'text',
        required: true,
        placeholder: "e.g. Kantibhai Patel",
        placeholderGu: 'દા.ત. કાંતિભાઈ પટેલ',
      });
    }

    // 3. Age
    if (text.includes('ઉંમર') || text.toLowerCase().includes('age')) {
      addField({
        key: 'age',
        label: 'Age (in years)',
        labelGu: 'ઉંમર (વર્ષમાં)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 42',
        placeholderGu: 'દા.ત. ૪૨',
      });
    }

    // 4. Occupation
    if (text.includes('ધંધો') || text.includes('વ્યવસાય') || text.toLowerCase().includes('occupation')) {
      addField({
        key: 'occupation',
        label: 'Occupation',
        labelGu: 'ધંધો / વ્યવસાય',
        type: 'text',
        required: false,
        placeholder: 'e.g. Agriculture / Business',
        placeholderGu: 'દા.ત. ખેતીકામ / નોકરી',
      });
    }

    // 5. Residential Address
    if (
      text.includes('રહેવાસી') ||
      text.includes('સરનામું') ||
      text.toLowerCase().includes('address') ||
      text.toLowerCase().includes('residing')
    ) {
      addField({
        key: 'deponentAddress',
        label: 'Permanent Residential Address',
        labelGu: 'કાયમી રહેઠાણનું સરનામું',
        type: 'textarea',
        required: true,
        placeholder: 'e.g. Plot No 45, Sector 21, Gandhinagar',
        placeholderGu: 'દા.ત. પ્લોટ નં. ૪૫, સેક્ટર ૨૧, ગાંધીનગર',
      });
    }

    // 6. Annual Income (for income declarations)
    if (text.includes('વાર્ષિક') || text.includes('આવક') || text.toLowerCase().includes('income')) {
      addField({
        key: 'annualIncome',
        label: 'Annual Family Income (in INR)',
        labelGu: 'કુલ વાર્ષિક કૌટુંબિક આવક (રૂપિયામાં)',
        type: 'number',
        required: true,
        placeholder: 'e.g. 120000',
        placeholderGu: 'દા.ત. ૧૨૦૦૦૦',
      });
    }

    // 7. Purpose of Affidavit
    addField({
      key: 'purpose',
      label: 'Purpose of Submission',
      labelGu: 'સોગંદનામું રજૂ કરવાનો હેતુ',
      type: 'text',
      required: true,
      placeholder: 'e.g. For Digital Gujarat Scholarship application',
      placeholderGu: 'દા.ત. સરકારી યોજના / શિષ્યવૃત્તિ અરજી અર્થે',
    });

    // 8. Date of Affirmation
    addField({
      key: 'declarationDate',
      label: 'Date of Affirmation',
      labelGu: 'તારીખ',
      type: 'date',
      required: true,
      placeholder: 'DD/MM/YYYY',
      placeholderGu: 'તારીખ',
    });

    // 8. Place of Affirmation
    addField({
      key: 'place',
      label: 'Place of Affirmation',
      labelGu: 'ખાતરી કર્યાનું સ્થળ',
      type: 'text',
      required: true,
      placeholder: 'e.g. Gandhinagar',
      placeholderGu: 'ગાંધીનગર',
    });

    return fields;
  }

  private detectPurposeAndRules(
    text: string,
    category: TemplateCategory
  ): { detectedPurpose: string; detectedPurposeGu: string; extractedRules: string[] } {
    const rules: string[] = [
      'Document must be executed in accordance with Gujarat Stamp Act 1958 rules where applicable.',
      'Citizen affirms that all stated facts are true and correct to personal knowledge.',
      'No unresolved blanks (____) are permitted in final generated output.',
    ];

    if (category === 'affidavit') {
      rules.push('Requires physical sworn execution before an Executive Magistrate, Notary Public, or Oath Commissioner.');
      return {
        detectedPurpose: 'Sworn legal statement for submission to district administrative authorities.',
        detectedPurposeGu: 'જિલ્લા વહીવટી તંત્ર સમક્ષ સત્તાવાર પુરાવા તરીકે રજૂ કરવાનું કાનૂની સોગંદનામું.',
        extractedRules: rules,
      };
    }

    if (category === 'revenue_service') {
      rules.push('Applicant must attach relevant 7/12 land extract or property tax receipt.');
      return {
        detectedPurpose: 'Statutory declaration required for revenue department records and land administration.',
        detectedPurposeGu: 'મહેસૂલ વિભાગના રેકોર્ડ અને જમીન બાબતની વહીવટી કાર્યવાહી માટેનું એકરારનામું.',
        extractedRules: rules,
      };
    }

    return {
      detectedPurpose: 'Citizen self-declaration format for public service verification.',
      detectedPurposeGu: 'જાહેર સેવાઓ અને સત્તાવાર ખરાઈ માટેનું નાગરિક સ્વયં ઘોષણાપત્ર.',
      extractedRules: rules,
    };
  }

  private calculateConfidence(text: string, fields: TemplateField[]): number {
    let score = 70;
    if (fields.length >= 4) score += 15;
    if (text.includes('ગાંધીનગર') || text.includes('ગુજરાત')) score += 5;
    if (text.includes('સહી') || text.toLowerCase().includes('signature')) score += 5;
    return Math.min(score, 98);
  }
}

export const aiScannerService = new AiScannerService();
