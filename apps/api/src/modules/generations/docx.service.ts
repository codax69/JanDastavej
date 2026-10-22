import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';

interface DocxGenerationOptions {
  layoutKey: string;
  language: string;
  answers: Record<string, any>;
  isDemoOnly?: boolean;
  title?: string;
}

export async function generateDocumentDocx(options: DocxGenerationOptions): Promise<Buffer> {
  const { layoutKey, language, answers, isDemoOnly = true } = options;

  const demoNoticeText = isDemoOnly
    ? language === 'gu'
      ? '*** માત્ર ડેમો હેતુ માટે — સત્તાવાર ઉપયોગ માટે નથી (DEMO ONLY — NOT FOR OFFICIAL USE) ***'
      : '*** DEMO ONLY — NOT FOR OFFICIAL USE ***'
    : '';

  const paragraphs: Paragraph[] = [];

  // 1. Watermark/Demo Header Notice
  if (demoNoticeText) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: demoNoticeText,
            bold: true,
            size: 20,
            color: 'C9741A',
          }),
        ],
      })
    );
  }

  // 2. Document Title and Authority
  let authorityText = language === 'gu' ? 'કલેક્ટર કચેરી, ગાંધીનગર' : 'COLLECTOR OFFICE, GANDHINAGAR';
  let titleText = language === 'gu' ? 'સ્વ-ઘોષણાપત્ર' : 'SELF-DECLARATION FORM';
  let subtitleText =
    language === 'gu'
      ? '(સરકારી અને વહીવટી કામગીરી અર્થે અરજદારનું એકરારનામું)'
      : '(Citizen declaration for administrative and verification purposes)';

  if (layoutKey === 'sample_affidavit') {
    titleText = language === 'gu' ? 'પ્રતિજ્ઞાપત્ર (સોગંદનામું)' : 'AFFIDAVIT ON OATH';
    subtitleText =
      language === 'gu'
        ? '(કાર્યપાલક મેજિસ્ટ્રેટ / નોટરી પબ્લિક સમક્ષ રજૂ કરવા અંગે)'
        : '(Sworn affidavit before Executive Magistrate / Notary Public)';
  } else if (layoutKey === 'sample_address_declaration') {
    titleText = language === 'gu' ? 'સરનામા પુરાવા અંગેનું એકરારનામું' : 'ADDRESS VERIFICATION DECLARATION';
    subtitleText = language === 'gu' ? '(સ્થાનિક રહેઠાણ ચકાસણી હેતુ)' : '(For Local Residential Verification)';
  } else if (layoutKey === 'undertaking_utility') {
    authorityText =
      language === 'gu'
        ? 'ગાંધીનગર મહાનગરપાલિકા / સરકારી ઉપયોગિતા સેવા'
        : 'GANDHINAGAR MUNICIPAL CORPORATION / UTILITY SERVICES';
    titleText = language === 'gu' ? 'બાંહેધરીપત્ર (અંડરટેકિંગ)' : 'UNDERTAKING FORM';
    subtitleText =
      language === 'gu'
        ? '(નવા નળ / વીજળી જોડાણ અથવા સરકારી યોજના માટે બાંહેધરી)'
        : '(Undertaking for Utility Connection / Municipal Services)';
  } else if (layoutKey === 'income_declaration') {
    authorityText =
      language === 'gu'
        ? 'કલેક્ટર કચેરી, ગાંધીનગર (મહેસૂલ વિભાગ)'
        : 'COLLECTOR OFFICE, GANDHINAGAR (REVENUE DEPARTMENT)';
    titleText = language === 'gu' ? 'કુટુંબની વાર્ષિક આવક અંગેનું સ્વ-ઘોષણાપત્ર' : 'ANNUAL FAMILY INCOME DECLARATION';
    subtitleText =
      language === 'gu'
        ? '(આવકના દાખલા મેળવવા અર્થે અરજદારનું એકરારનામું)'
        : '(Citizen declaration for Income Certificate issuance)';
  }

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: authorityText,
          bold: true,
          size: 24,
          color: '1F3A5F',
        }),
      ],
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: titleText,
          bold: true,
          size: 32,
          color: '1B1F24',
        }),
      ],
    })
  );

  if (subtitleText) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },
        children: [
          new TextRun({
            text: subtitleText,
            italics: true,
            size: 20,
            color: '5B6470',
          }),
        ],
      })
    );
  }

  // 3. Body Content depending on layoutKey
  const nameVal = answers.fullName || answers.deponentName || answers.applicantName || '';
  const parentVal = answers.parentSpouseName || answers.fatherName || '';
  const ageVal = answers.age || answers.deponentAge || '';
  const occVal = answers.occupation || '';
  const addrVal = answers.address || answers.deponentAddress || answers.currentAddress || '';
  const dateVal = answers.declarationDate || answers.affidavitDate || answers.date || '';
  const placeVal = answers.place || (language === 'gu' ? 'ગાંધીનગર' : 'Gandhinagar');
  const statementVal = answers.declarationPurpose || answers.matterStated || answers.undertakingPurpose || '';

  if (layoutKey === 'sample_declaration') {
    if (language === 'gu') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'હું નીચે સહી કરનાર ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: ', પિતા/પતિનું નામ: ' }),
            new TextRun({ text: String(parentVal), bold: true }),
            new TextRun({ text: `, ઉંમર આશરે ${ageVal} વર્ષ, વ્યવસાય: ` }),
            new TextRun({ text: String(occVal), bold: true }),
            new TextRun({ text: ', હાલ રહેવાસી: ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', આથી સત્યતાપૂર્વક નીચે મુજબ જાહેર કરું છું કે:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'ઘોષણાની વિગત / નિવેદન:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [new TextRun({ text: String(statementVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'ઉપર જણાવેલ તમામ વિગતો મારી વ્યક્તિગત જાણ અને માન્યતા મુજબ સાચી અને ખરી છે. તેમાં કોઈપણ હકીકત છુપાવેલ નથી. જો ભવિષ્યમાં આ વિગતો ખોટી કે અધૂરી જણાશે તો ભારતીય કાયદા અનુસાર મારી સામે થનાર તમામ કાનૂની કાર્યવાહી માટે હું વ્યક્તિગત રીતે સંપૂર્ણ જવાબદાર રહીશ.',
            }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'I, the undersigned, ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: ', Son / Daughter / Wife of ' }),
            new TextRun({ text: String(parentVal), bold: true }),
            new TextRun({ text: `, aged about ${ageVal} years, Occupation: ` }),
            new TextRun({ text: String(occVal), bold: true }),
            new TextRun({ text: ', residing at ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', do hereby solemnly state and declare as under:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'Statement of Facts / Declaration:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [new TextRun({ text: String(statementVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'I hereby declare that all the statements made above are true, complete, and correct to the best of my personal knowledge and belief. No material facts have been concealed. If any detail is found to be false or incorrect at any stage, I shall be personally liable for legal action under applicable laws.',
            }),
          ],
        })
      );
    }
  } else if (layoutKey === 'sample_affidavit') {
    if (language === 'gu') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'હું સોગંદ લેનાર ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, ઉંમર આશરે ${ageVal} વર્ષ, રહેવાસી: ` }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', આથી પવિત્ર પ્રતિજ્ઞા પર એકરાર કરી જણાવું છું કે:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'સોગંદ પરની વિગતવાર હકીકત:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [new TextRun({ text: String(statementVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'સત્યશોધન (વેરિફિકેશન): હું સોગંદ લેનાર આથી ખાતરી આપું છું કે ઉપર જણાવેલ તમામ વિગતો સત્ય છે અને મેં કોઈ પણ વિગત છુપાવેલ નથી. સહી કરી આ સોગંદનામું ગાંધીનગર ખાતે રજૂ કરું છું.',
            }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'I, the deponent ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, aged about ${ageVal} years, residing at ` }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', do hereby take oath and state as follows:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'Statement of Facts on Oath:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [new TextRun({ text: String(statementVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'Verification: Verified at Gandhinagar that the contents of this affidavit are true and correct to my personal knowledge and belief. No material facts have been suppressed.',
            }),
          ],
        })
      );
    }
  } else if (layoutKey === 'sample_address_declaration') {
    const years = answers.residingSinceYears != null && answers.residingSinceYears !== '' ? String(answers.residingSinceYears) : '';
    const premises =
      answers.premisesType === 'rented'
        ? (language === 'gu' ? 'ભાડાનું મકાન' : 'Rented')
        : answers.premisesType === 'parental'
        ? (language === 'gu' ? 'વાલી/વારસાગત' : 'Parental')
        : (language === 'gu' ? 'પોતાની માલિકીનું' : 'Self-owned');
    if (language === 'gu') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'હું અરજદાર ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, આથી ખાતરીપૂર્વક એકરાર કરું છું કે હું નીચે જણાવેલ સરનામે છેલ્લા ${years} વર્ષોથી વસવાટ કરું છું:` }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: `રહેઠાણનું સરનામું: ${addrVal}`, bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: `મકાન માલિકીનો પ્રકાર: ${premises}` })],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'I, the applicant ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, do hereby declare that I have been continuously residing at the following address for the last ${years} years:` }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: `Residential Address: ${addrVal}`, bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: `Premises Ownership: ${premises}` })],
        })
      );
    }
  } else if (layoutKey === 'income_declaration') {
    const incomeVal = answers.annualIncome || answers.incomeAmount || '';
    const sourceVal = answers.incomeSource || answers.occupation || (language === 'gu' ? 'ખેતી / છૂટક મજૂરી / વ્યાપાર' : 'Agriculture / Daily Wages / Small Business');
    if (language === 'gu') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'હું નીચે સહી કરનાર અરજદાર ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, ઉંમર આશરે ${ageVal} વર્ષ, ધંધો/વ્યવસાય: ` }),
            new TextRun({ text: String(occVal), bold: true }),
            new TextRun({ text: ', રહેવાસી: ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', આથી સત્યનિષ્ઠાપૂર્વક જાહેર કરું છું કે:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'વાર્ષિક આવકની વિગત:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: `મારા કુટુંબના તમામ સભ્યોની તમામ સાધનોમાંથી થતી કુલ વાર્ષિક આવક આશરે રૂ. ${incomeVal} (અંકે રૂપિયા પૂરા) થાય છે.` }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [
            new TextRun({ text: 'આવકનું મુખ્ય સાધન: ', bold: true }),
            new TextRun({ text: String(sourceVal) }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'આ આવક અંગે સરકાર સમક્ષ મેં રજૂ કરેલ વિગત સંપૂર્ણ સાચી છે. જો આ વિગત ભવિષ્યમાં ખોટી સાબિત થાય તો સરકારી લાભો પાછા ખેંચી લેવા અને ભારતીય કાનૂની જોગવાઈ મુજબ શિક્ષાત્મક પગલાં ભરવા હું જવાબદાર રહીશ.',
            }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'I, the undersigned applicant ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: `, aged about ${ageVal} years, Occupation: ` }),
            new TextRun({ text: String(occVal), bold: true }),
            new TextRun({ text: ', residing at ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', do hereby solemnly affirm and state as follows:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'Annual Income Declaration:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: `The total aggregate annual income of my family from all sources is approximately Rs. ${incomeVal} per annum.` }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 240, line: 320 },
          children: [
            new TextRun({ text: 'Primary Income Source: ', bold: true }),
            new TextRun({ text: String(sourceVal) }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 360 },
          children: [
            new TextRun({
              text: 'I certify that the information given above is correct to the best of my knowledge. If found fraudulent or misstated, I shall be liable to criminal and administrative penalties under the law.',
            }),
          ],
        })
      );
    }
  } else if (layoutKey === 'undertaking_utility') {
    const undertakingVal = answers.undertakingPurpose || answers.declarationPurpose || (language === 'gu' ? 'નવા જોડાણ અથવા સેવા મેળવવા માટેની તમામ શરતોનું પાલન કરવાની બાંહેધરી.' : 'Undertaking to comply with all statutory municipal regulations and charges.');
    if (language === 'gu') {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'હું નીચે સહી કરનાર અરજદાર ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: ', પિતા/પતિનું નામ: ' }),
            new TextRun({ text: String(parentVal), bold: true }),
            new TextRun({ text: ', સરનામું: ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', આથી લેખિત બાંહેધરી આપું છું કે:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'બાંહેધરીનો મુખ્ય વિષય / શરતો:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 320 },
          children: [new TextRun({ text: String(undertakingVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: '૧. હું બાંહેધરી આપું છું કે જે મિલકત/જગ્યા માટે અરજી કરેલ છે તે અંગે કોઈ ન્યાયાલયીન વિવાદ કે સ્ટે નથી.' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: '૨. નિયત સરકારી નિયમો, ચાર્જ અને ટેક્સ હું નિયમિતપણે ભરવા બંધાયેલ છું.' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 320 },
          children: [
            new TextRun({ text: '૩. જો કોઈ અનધિકૃત બાંધકામ કે ખોટી વિગત જણાશે તો આ જોડાણ રદ કરવા સામે મારો કોઈ હક્ક-દાવો રહેશે નહીં.' }),
          ],
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 360 },
          children: [
            new TextRun({ text: 'I, the undersigned applicant ' }),
            new TextRun({ text: String(nameVal), bold: true }),
            new TextRun({ text: ', Son / Daughter / Wife of ' }),
            new TextRun({ text: String(parentVal), bold: true }),
            new TextRun({ text: ', residing at ' }),
            new TextRun({ text: String(addrVal), bold: true }),
            new TextRun({ text: ', do hereby undertake and declare as follows:' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: 'Terms and Purpose of Undertaking:', bold: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200, line: 320 },
          children: [new TextRun({ text: String(undertakingVal), italics: true })],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: '1. I undertake that there is no pending court dispute, injunction, or illegal encroachment regarding the premises.' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 120, line: 320 },
          children: [
            new TextRun({ text: '2. I agree to pay all statutory tariffs, dues, and assessment taxes in accordance with municipal laws.' }),
          ],
        })
      );
      paragraphs.push(
        new Paragraph({
          spacing: { after: 300, line: 320 },
          children: [
            new TextRun({ text: '3. If any detail furnished herein is found misleading or false, the authority shall be entitled to disconnect or cancel the approval without notice.' }),
          ],
        })
      );
    }
  } else {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: `Applicant: ${nameVal}`, bold: true })],
      })
    );
    paragraphs.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: `Address: ${addrVal}` })],
      })
    );
    if (statementVal) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: String(statementVal) })],
        })
      );
    }
  }

  // 4. Date, Place, and Signature Layout (Using a 2-column table)
  const metaLeftText = language === 'gu' ? `તારીખ: ${dateVal}\nસ્થળ: ${placeVal}` : `Date: ${dateVal}\nPlace: ${placeVal}`;
  const signLabel = language === 'gu' ? 'અરજદારની સહી' : 'Signature of Applicant';

  const footerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: language === 'gu' ? 'તારીખ: ' : 'Date: ', bold: true }),
                  new TextRun({ text: String(dateVal) }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: language === 'gu' ? 'સ્થળ: ' : 'Place: ', bold: true }),
                  new TextRun({ text: String(placeVal) }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: '________________________' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: signLabel, bold: true })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `(${nameVal})` })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // 5. Build Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [...paragraphs, new Paragraph({ spacing: { before: 400 } }), footerTable],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
