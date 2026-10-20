import { SupportedLanguage } from '../schemas/common.js';
import { escapeHtml } from '../validators/answers.js';

export interface DocumentRenderOptions {
  layoutKey: string;
  language: SupportedLanguage;
  answers: Record<string, any>;
  isDemoOnly?: boolean;
}

export function renderDocumentHtml(options: DocumentRenderOptions): string {
  const { layoutKey, language, answers, isDemoOnly = true } = options;

  const demoNotice = isDemoOnly
    ? language === 'gu'
      ? '*** માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી (DEMO ONLY — NOT FOR OFFICIAL USE) ***'
      : '*** DEMO ONLY — NOT FOR OFFICIAL USE ***'
    : '';

  let bodyContent = '';

  switch (layoutKey) {
    case 'sample_declaration': {
      if (language === 'gu') {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">કલેક્ટર કચેરી, ગાંધીનગર</div>
            <div class="doc-title">સ્વ-ઘોષણાપત્ર</div>
            <div class="doc-subtitle">(સરકારી અને વહીવટી કામગીરી અર્થે અરજદારનું એકરારનામું)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              હું નીચે સહી કરનાર <strong>${escapeHtml(String(answers.fullName || ''))}</strong>, 
              પિતા/પતિનું નામ: <strong>${escapeHtml(String(answers.parentSpouseName || ''))}</strong>, 
              ઉંમર આશરે <strong>${escapeHtml(String(answers.age || ''))}</strong> વર્ષ, 
              વ્યવસાય: <strong>${escapeHtml(String(answers.occupation || ''))}</strong>, 
              હાલ રહેવાસી: <strong>${escapeHtml(String(answers.address || ''))}</strong>, 
              આથી સત્યતાપૂર્વક નીચે મુજબ જાહેર કરું છું કે:
            </p>

            <div class="doc-statement-box">
              <p><strong>ઘોષણાની વિગત / નિવેદન:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.declarationPurpose || ''))}</p>
            </div>

            <p class="doc-paragraph">
              ઉપર જણાવેલ તમામ વિગતો મારી વ્યક્તિગત જાણ અને માન્યતા મુજબ સાચી અને ખરી છે. તેમાં કોઈપણ હકીકત છુપાવેલ નથી. જો ભવિષ્યમાં આ વિગતો ખોટી કે અધૂરી જણાશે તો ભારતીય કાયદા અનુસાર મારી સામે થનાર તમામ કાનૂની કાર્યવાહી માટે હું વ્યક્તિગત રીતે સંપૂર્ણ જવાબદાર રહીશ.
            </p>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>તારીખ:</strong> ${escapeHtml(String(answers.declarationDate || ''))}</p>
              <p><strong>સ્થળ:</strong> ${escapeHtml(String(answers.place || 'ગાંધીનગર'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>અરજદારની સહી</strong></p>
              <p>(${escapeHtml(String(answers.fullName || ''))})</p>
            </div>
          </div>
        `;
      } else {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">COLLECTOR OFFICE, GANDHINAGAR</div>
            <div class="doc-title">SELF-DECLARATION FORM</div>
            <div class="doc-subtitle">(Citizen declaration for administrative and verification purposes)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              I, the undersigned, <strong>${escapeHtml(String(answers.fullName || ''))}</strong>, 
              Son / Daughter / Wife of <strong>${escapeHtml(String(answers.parentSpouseName || ''))}</strong>, 
              aged about <strong>${escapeHtml(String(answers.age || ''))}</strong> years, 
              Occupation: <strong>${escapeHtml(String(answers.occupation || ''))}</strong>, 
              residing at <strong>${escapeHtml(String(answers.address || ''))}</strong>, 
              do hereby solemnly state and declare as under:
            </p>

            <div class="doc-statement-box">
              <p><strong>Statement of Facts / Declaration:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.declarationPurpose || ''))}</p>
            </div>

            <p class="doc-paragraph">
              I hereby declare that all the statements made above are true, complete, and correct to the best of my personal knowledge and belief. No material facts have been concealed. If any detail is found to be false or incorrect at any stage, I shall be personally liable for legal action under applicable laws.
            </p>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>Date:</strong> ${escapeHtml(String(answers.declarationDate || ''))}</p>
              <p><strong>Place:</strong> ${escapeHtml(String(answers.place || 'Gandhinagar'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>Signature of Applicant</strong></p>
              <p>(${escapeHtml(String(answers.fullName || ''))})</p>
            </div>
          </div>
        `;
      }
      break;
    }

    case 'sample_affidavit': {
      if (language === 'gu') {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">કલેક્ટર કચેરી, ગાંધીનગર</div>
            <div class="doc-title">પ્રતિજ્ઞાપત્ર (સોગંદનામું)</div>
            <div class="doc-subtitle">(કાર્યપાલક મેજિસ્ટ્રેટ / નોટરી પબ્લિક સમક્ષ રજૂ કરવા અંગે)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              હું સોગંદ લેનાર <strong>${escapeHtml(String(answers.deponentName || ''))}</strong>, 
              ઉંમર આશરે <strong>${escapeHtml(String(answers.deponentAge || ''))}</strong> વર્ષ, 
              રહેવાસી: <strong>${escapeHtml(String(answers.deponentAddress || ''))}</strong>, 
              આથી ગંભીરતાપૂર્વક અને ઇશ્વરના નામે પ્રતિજ્ઞા લઈ જાહેર કરું છું કે:
            </p>

            <div class="doc-statement-box">
              <p><strong>સોગંદ પરનું વિગતવાર નિવેદન:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.matterStated || ''))}</p>
            </div>

            <div class="doc-verification">
              <p class="font-bold"><strong>ચકાસણી (Verification):</strong></p>
              <p class="doc-paragraph">
                હું ઉપરોક્ત સોગંદ લેનાર આથી પ્રમાણિત કરું છું કે આ પ્રતિજ્ઞાપત્રમાં લખાયેલી તમામ હકીકતો મારી અંગત માહિતી મુજબ સાચી છે. તેનો કોઈ પણ ભાગ ખોટો નથી અને મહત્વની બાબત છુપાવવામાં આવેલ નથી.
              </p>
            </div>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>તારીખ:</strong> ${escapeHtml(String(answers.affidavitDate || ''))}</p>
              <p><strong>સ્થળ:</strong> ${escapeHtml(String(answers.place || 'ગાંધીનગર'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>સોગંદ લેનારની સહી (Deponent)</strong></p>
              <p>(${escapeHtml(String(answers.deponentName || ''))})</p>
            </div>
          </div>
        `;
      } else {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">COLLECTOR OFFICE, GANDHINAGAR</div>
            <div class="doc-title">AFFIDAVIT ON OATH</div>
            <div class="doc-subtitle">(Before Executive Magistrate / Notary Public)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              I, the deponent <strong>${escapeHtml(String(answers.deponentName || ''))}</strong>, 
              aged about <strong>${escapeHtml(String(answers.deponentAge || ''))}</strong> years, 
              residing at <strong>${escapeHtml(String(answers.deponentAddress || ''))}</strong>, 
              do hereby solemnly affirm and state on oath as under:
            </p>

            <div class="doc-statement-box">
              <p><strong>Statement of Facts:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.matterStated || ''))}</p>
            </div>

            <div class="doc-verification">
              <p><strong>Verification:</strong></p>
              <p class="doc-paragraph">
                Verified at Gandhinagar on this day that the contents of the above affidavit are true and correct to the best of my knowledge and belief, and nothing material has been concealed therein.
              </p>
            </div>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>Date:</strong> ${escapeHtml(String(answers.affidavitDate || ''))}</p>
              <p><strong>Place:</strong> ${escapeHtml(String(answers.place || 'Gandhinagar'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>Signature of Deponent</strong></p>
              <p>(${escapeHtml(String(answers.deponentName || ''))})</p>
            </div>
          </div>
        `;
      }
      break;
    }

    case 'sample_address_declaration': {
      const premisesLabel =
        answers.premisesType === 'rented'
          ? language === 'gu' ? 'ભાડાનું મકાન' : 'Rented'
          : answers.premisesType === 'parental'
          ? language === 'gu' ? 'વાલી/વારસાગત' : 'Parental'
          : language === 'gu' ? 'પોતાની માલિકીનું' : 'Self-owned';

      if (language === 'gu') {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">કલેક્ટર કચેરી, ગાંધીનગર</div>
            <div class="doc-title">સરનામા પુરાવા અંગેનું એકરારનામું</div>
            <div class="doc-subtitle">(સ્થાનિક રહેઠાણ ચકાસણી હેતુ)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              હું અરજદાર <strong>${escapeHtml(String(answers.applicantName || ''))}</strong>, 
              આથી ખાતરીપૂર્વક એકરાર કરું છું કે હું નીચે જણાવેલ સરનામે છેલ્લા 
              <strong>${escapeHtml(String(answers.residingSinceYears || ''))}</strong> વર્ષોથી કાયમી વસવાટ કરું છું:
            </p>

            <div class="doc-statement-box">
              <p><strong>વર્તમાન રહેઠાણનું સરનામું:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.currentAddress || ''))}</p>
              <p class="mt-2"><strong>મકાન માલિકીનો પ્રકાર:</strong> ${premisesLabel}</p>
            </div>

            <p class="doc-paragraph">
              ઉપરોક્ત સરનામું સાચું છે અને તેના સમર્થનમાં હું જરૂરી આધાર પુરાવા (લાઈટ બિલ / વેરા પહોંચ) રજૂ કરું છું. આ માહિતી ખોટી સાબિત થશે તો મારી સામે કાનૂની કાર્યવાહી કરવા સરકાર મુક્ત રહેશે.
            </p>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>તારીખ:</strong> ${escapeHtml(String(answers.declarationDate || ''))}</p>
              <p><strong>સ્થળ:</strong> ${escapeHtml(String(answers.place || 'ગાંધીનગર'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>અરજદારની સહી</strong></p>
              <p>(${escapeHtml(String(answers.applicantName || ''))})</p>
            </div>
          </div>
        `;
      } else {
        bodyContent = `
          <div class="doc-header">
            <div class="doc-authority">COLLECTOR OFFICE, GANDHINAGAR</div>
            <div class="doc-title">ADDRESS VERIFICATION DECLARATION</div>
            <div class="doc-subtitle">(For Local Residential Verification)</div>
          </div>

          <div class="doc-body">
            <p class="doc-paragraph">
              I, the applicant <strong>${escapeHtml(String(answers.applicantName || ''))}</strong>, 
              do hereby solemnly declare that I have been continuously residing at the following address for the last 
              <strong>${escapeHtml(String(answers.residingSinceYears || ''))}</strong> years:
            </p>

            <div class="doc-statement-box">
              <p><strong>Current Residential Address:</strong></p>
              <p class="doc-statement-text">${escapeHtml(String(answers.currentAddress || ''))}</p>
              <p class="mt-2"><strong>Ownership Status:</strong> ${premisesLabel}</p>
            </div>

            <p class="doc-paragraph">
              The above details are true and supported by valid utility bills / house tax receipts. If any information is found incorrect, I shall be subject to legal proceedings.
            </p>
          </div>

          <div class="doc-footer">
            <div class="doc-meta-left">
              <p><strong>Date:</strong> ${escapeHtml(String(answers.declarationDate || ''))}</p>
              <p><strong>Place:</strong> ${escapeHtml(String(answers.place || 'Gandhinagar'))}</p>
            </div>
            <div class="doc-meta-right">
              <div class="signature-line"></div>
              <p><strong>Signature of Applicant</strong></p>
              <p>(${escapeHtml(String(answers.applicantName || ''))})</p>
            </div>
          </div>
        `;
      }
      break;
    }

    default: {
      bodyContent = `
        <div class="doc-header">
          <div class="doc-authority">COLLECTOR OFFICE, GANDHINAGAR</div>
          <div class="doc-title">DECLARATION DOCUMENT</div>
        </div>
        <div class="doc-body">
          <p>Document content generated successfully.</p>
        </div>
      `;
    }
  }

  return `
    <div class="document-page">
      ${demoNotice ? `<div class="doc-watermark">${demoNotice}</div>` : ''}
      <div class="doc-content">
        ${bodyContent}
      </div>
      <div class="doc-footnote">
        <span>JanDastavej PS000221 · Collector Office, Gandhinagar</span>
        <span>${isDemoOnly ? 'Demo only — not for official use' : 'Authorized Draft'}</span>
      </div>
    </div>
  `;
}

export function getDocumentStyles(): string {
  return `
    .document-page {
      box-sizing: border-box;
      width: 100%;
      max-width: 210mm;
      min-height: 297mm;
      padding: 25mm 20mm 20mm 20mm;
      margin: 0 auto;
      background: #FFFFFF;
      color: #1B1F24;
      font-family: 'Noto Sans Gujarati', 'Noto Sans', system-ui, -apple-system, sans-serif;
      font-size: 14pt;
      line-height: 1.8;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .doc-watermark {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      color: #9A6200;
      background: #FFF4DB;
      border: 1px dashed #C9741A;
      padding: 6px 12px;
      margin-bottom: 20px;
      border-radius: 4px;
    }

    .doc-header {
      text-align: center;
      margin-bottom: 28px;
      border-bottom: 2px solid #1F3A5F;
      padding-bottom: 16px;
    }

    .doc-authority {
      font-size: 13pt;
      font-weight: 700;
      color: #1F3A5F;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .doc-title {
      font-size: 18pt;
      font-weight: 800;
      color: #1B1F24;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .doc-subtitle {
      font-size: 11pt;
      color: #5B6470;
      font-style: italic;
    }

    .doc-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .doc-paragraph {
      text-align: justify;
      margin: 0;
      text-indent: 2em;
    }

    .doc-statement-box {
      border: 1px solid #D9DCE1;
      background: #FAF9F6;
      border-radius: 4px;
      padding: 14px 18px;
      margin: 12px 0;
    }

    .doc-statement-text {
      white-space: pre-wrap;
      margin-top: 6px;
      line-height: 1.7;
    }

    .doc-verification {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid #D9DCE1;
    }

    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
      padding-top: 20px;
    }

    .doc-meta-left {
      font-size: 12pt;
      line-height: 1.6;
    }

    .doc-meta-right {
      text-align: center;
      min-width: 180px;
    }

    .signature-line {
      border-top: 1px solid #1B1F24;
      margin-bottom: 8px;
      width: 180px;
    }

    .doc-footnote {
      margin-top: 30px;
      border-top: 1px solid #EFEEEA;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9pt;
      color: #5B6470;
    }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        background: #FFFFFF !important;
      }
      .document-page {
        padding: 20mm;
        min-height: 297mm;
        max-width: 210mm;
      }
    }
  `;
}
