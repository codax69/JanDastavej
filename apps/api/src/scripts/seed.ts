import argon2 from 'argon2';
import { connectDB, disconnectDB } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { TemplateModel } from '../models/Template.js';
import { TemplateVersionModel } from '../models/TemplateVersion.js';
import { AuditEventModel } from '../models/AuditEvent.js';
import { ServiceModel } from '../models/Service.js';

export async function seed(): Promise<void> {
  console.log('[Seed] Starting database seed...');
  await connectDB();

  // 1. Create or update Admin & Approver users
  const adminPasswordHash = await argon2.hash('DemoAdminPass123!');
  const approverPasswordHash = await argon2.hash('DemoApproverPass123!');

  const adminUser = await UserModel.findOneAndUpdate(
    { email: 'admin@jandastavej.local' },
    {
      name: 'System Admin (Gandhinagar)',
      email: 'admin@jandastavej.local',
      passwordHash: adminPasswordHash,
      role: 'admin',
      status: 'active',
    },
    { upsert: true, new: true }
  );

  const approverUser = await UserModel.findOneAndUpdate(
    { email: 'approver@jandastavej.local' },
    {
      name: 'Legal Review Officer',
      email: 'approver@jandastavej.local',
      passwordHash: approverPasswordHash,
      role: 'approver',
      status: 'active',
    },
    { upsert: true, new: true }
  );

  console.log('[Seed] Seeded Admin and Approver users.');

  // 2. Define 3 demo templates
  const demoTemplates = [
    {
      slug: 'sample-declaration',
      title: 'Self-Declaration Form',
      titleGu: 'સ્વ-ઘોષણાપત્ર (સેલ્ફ ડિક્લેરેશન)',
      description: 'Standard citizen self-declaration form for general government submissions and administrative verification.',
      descriptionGu: 'સામાન્ય સરકારી કામગીરી અને વહીવટી ચકાસણી માટે અરજદારનું પ્રમાણિત સ્વ-ઘોષણાપત્ર.',
      category: 'declaration',
      supportedLanguages: ['gu', 'en'],
      isDemoOnly: true,
      purpose: 'To provide a written statement declaring facts under citizen responsibility without notary fee.',
      purposeGu: 'કોઈપણ નોટરી ફી વગર નાગરિકની પોતાની જવાબદારી હેઠળ હકીકત રજૂ કરવા માટેનું સ્વ-ઘોષણાપત્ર.',
      requiredDocuments: ['Aadhaar Card or Voter ID', 'Proof of residence'],
      requiredDocumentsGu: ['આધાર કાર્ડ અથવા ચૂંટણી કાર્ડ', 'રહેઠાણનો પુરાવો'],
      nextSteps: 'Print the generated document, sign at the bottom, and attach to your application.',
      nextStepsGu: 'જનરેટ થયેલ દસ્તાવેજ પ્રિન્ટ કરી નીચે સહી કરો અને તમારી અરજી સાથે જોડો.',
      layoutKey: 'sample_declaration',
      fieldsGu: [
        { key: 'fullName', label: 'પૂર્ણ નામ (અરજદાર)', type: 'text', required: true, maxLength: 120, placeholder: 'દા.ત. રમેશભાઈ કાંતિભાઈ પટેલ' },
        { key: 'parentSpouseName', label: 'પિતા અથવા પતિનું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'દા.ત. કાંતિભાઈ પટેલ' },
        { key: 'age', label: 'ઉંમર (વર્ષ)', type: 'number', required: true, min: 18, max: 120 },
        { key: 'occupation', label: 'વ્યવસાય', type: 'text', required: true, maxLength: 100, placeholder: 'દા.ત. ખેતી / વેપાર / નોકરી' },
        { key: 'address', label: 'કાયમી રહેઠાણનું સરનામું', type: 'textarea', required: true, maxLength: 500, placeholder: 'ઘર નં, સોસાયટી, ગામ/શહેર, તાલુકો, જિલ્લો ગાંધીનગર' },
        { key: 'declarationPurpose', label: 'ઘોષણાનો વિગતવાર હેતુ / નિવેદન', type: 'textarea', required: true, maxLength: 1000, placeholder: 'જે બાબત અંગે એકરાર કરવાનો હોય તેની વિગત' },
        { key: 'declarationDate', label: 'તારીખ', type: 'date', required: true },
        { key: 'place', label: 'સ્થળ', type: 'text', required: true, maxLength: 100, placeholder: 'ગાંધીનગર' },
      ],
      fieldsEn: [
        { key: 'fullName', label: 'Full Name (Applicant)', type: 'text', required: true, maxLength: 120, placeholder: 'e.g. Rameshbhai Kantibhai Patel' },
        { key: 'parentSpouseName', label: 'Father / Husband Name', type: 'text', required: true, maxLength: 120, placeholder: 'e.g. Kantibhai Patel' },
        { key: 'age', label: 'Age (in years)', type: 'number', required: true, min: 18, max: 120 },
        { key: 'occupation', label: 'Occupation', type: 'text', required: true, maxLength: 100, placeholder: 'e.g. Agriculture / Business / Service' },
        { key: 'address', label: 'Permanent Residential Address', type: 'textarea', required: true, maxLength: 500, placeholder: 'House No., Society, Village/City, Taluka, Dist. Gandhinagar' },
        { key: 'declarationPurpose', label: 'Purpose of Declaration / Statement', type: 'textarea', required: true, maxLength: 1000, placeholder: 'Details of the statement being made' },
        { key: 'declarationDate', label: 'Date', type: 'date', required: true },
        { key: 'place', label: 'Place', type: 'text', required: true, maxLength: 100, placeholder: 'Gandhinagar' },
      ],
    },
    {
      slug: 'sample-affidavit',
      title: 'General Purpose Affidavit Format',
      titleGu: 'સામાન્ય સોગંદનામું (એફિડેવિટ)',
      description: 'Format for general sworn affidavit before an executive magistrate or notary public.',
      descriptionGu: 'કાર્યપાલક મેજિસ્ટ્રેટ અથવા નોટરી સમક્ષ રજૂ કરવા માટેનું સામાન્ય પ્રતિજ્ઞાપત્ર (સોગંદનામું).',
      category: 'affidavit',
      supportedLanguages: ['gu', 'en'],
      isDemoOnly: true,
      purpose: 'Sworn statement of facts required for legal and administrative procedures.',
      purposeGu: 'કાયદાકીય અને વહીવટી કાર્યવાહી માટે હકીકતો દર્શાવતું સોગંદ પરનું લખાણ.',
      requiredDocuments: ['Aadhaar Card', 'Relevant supporting documents / evidence'],
      requiredDocumentsGu: ['આધાર કાર્ડ', 'સંબંધિત પુરાવા / દસ્તાવેજો'],
      nextSteps: 'Print on prescribed stamp paper (if required) and execute before an authorized notary or magistrate.',
      nextStepsGu: 'જરૂર જણાય તો નિયત સ્ટેમ્પ પેપર પર પ્રિન્ટ કરી સક્ષમ નોટરી અથવા મેજિસ્ટ્રેટ સમક્ષ સહી કરાવો.',
      layoutKey: 'sample_affidavit',
      fieldsGu: [
        { key: 'deponentName', label: 'સોગંદ લેનારનું પૂરું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'શ્રી / શ્રીમતી...' },
        { key: 'deponentAge', label: 'ઉંમર', type: 'number', required: true, min: 18, max: 120 },
        { key: 'deponentAddress', label: 'સરનામું', type: 'textarea', required: true, maxLength: 500, placeholder: 'સંપૂર્ણ સરનામું લખો' },
        { key: 'matterStated', label: 'સોગંદ પરની વિગતવાર હકીકત', type: 'textarea', required: true, maxLength: 2000, placeholder: 'સોગંદ પર જણાવવાની મુખ્ય બાબતો ક્રમશઃ દર્શાવો' },
        { key: 'affidavitDate', label: 'તારીખ', type: 'date', required: true },
        { key: 'place', label: 'સ્થળ', type: 'text', required: true, maxLength: 100, placeholder: 'ગાંધીનગર' },
      ],
      fieldsEn: [
        { key: 'deponentName', label: 'Deponent Full Name', type: 'text', required: true, maxLength: 120, placeholder: 'Mr. / Ms. ...' },
        { key: 'deponentAge', label: 'Age', type: 'number', required: true, min: 18, max: 120 },
        { key: 'deponentAddress', label: 'Residential Address', type: 'textarea', required: true, maxLength: 500, placeholder: 'Complete postal address' },
        { key: 'matterStated', label: 'Statement of Facts on Oath', type: 'textarea', required: true, maxLength: 2000, placeholder: 'State the relevant facts clearly' },
        { key: 'affidavitDate', label: 'Date', type: 'date', required: true },
        { key: 'place', label: 'Place', type: 'text', required: true, maxLength: 100, placeholder: 'Gandhinagar' },
      ],
    },
    {
      slug: 'sample-address-declaration',
      title: 'Address Verification Declaration',
      titleGu: 'સરનામા પુરાવા અંગેનું એકરારનામું',
      description: 'Self declaration regarding proof of current residence and duration of stay in Gandhinagar.',
      descriptionGu: 'ગાંધીનગર ખાતે વર્તમાન રહેઠાણ અને વસવાટના સમયગાળા અંગેનું સ્વ-એકરારનામું.',
      category: 'certificate_support',
      supportedLanguages: ['gu', 'en'],
      isDemoOnly: true,
      purpose: 'Declaration to establish current residence for local government and certificate services.',
      purposeGu: 'સ્થાનિક સરકારી સેવાઓ અને દાખલાઓ મેળવવા માટે વર્તમાન વસવાટ સાબિત કરવા અંગે.',
      requiredDocuments: ['Electricity Bill or Property Tax receipt', 'Identity Proof'],
      requiredDocumentsGu: ['લાઈટ બિલ અથવા વેરા પહોંચ', 'ઓળખનો પુરાવો'],
      nextSteps: 'Print, sign, and submit along with light bill or house tax receipt.',
      nextStepsGu: 'પ્રિન્ટ કરી સહી કરો અને લાઈટ બિલ કે વેરા પહોંચ સાથે રજૂ કરો.',
      layoutKey: 'sample_address_declaration',
      fieldsGu: [
        { key: 'applicantName', label: 'અરજદારનું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'પૂર્ણ નામ' },
        { key: 'currentAddress', label: 'હાલનું રહેઠાણનું સરનામું', type: 'textarea', required: true, maxLength: 500, placeholder: 'મકાન નંબર, શેરી, વિસ્તાર' },
        { key: 'residingSinceYears', label: 'કેટલા વર્ષોથી રહો છો (વર્ષ)', type: 'number', required: true, min: 0, max: 100 },
        {
          key: 'premisesType',
          label: 'મકાનની માલિકીનો પ્રકાર',
          type: 'select',
          required: true,
          options: [
            { value: 'owned', label: 'પોતાની માલિકીનું (Self-owned)' },
            { value: 'rented', label: 'ભાડાનું મકાન (Rented premises)' },
            { value: 'parental', label: 'વાલી/વારસાગત (Parental/Ancestral)' },
          ],
        },
        { key: 'declarationDate', label: 'તારીખ', type: 'date', required: true },
        { key: 'place', label: 'સ્થળ', type: 'text', required: true, maxLength: 100, placeholder: 'ગાંધીનગર' },
      ],
      fieldsEn: [
        { key: 'applicantName', label: 'Applicant Name', type: 'text', required: true, maxLength: 120, placeholder: 'Full Name' },
        { key: 'currentAddress', label: 'Current Address', type: 'textarea', required: true, maxLength: 500, placeholder: 'House No., Street, Area' },
        { key: 'residingSinceYears', label: 'Residing Since (Years)', type: 'number', required: true, min: 0, max: 100 },
        {
          key: 'premisesType',
          label: 'Premises Ownership Type',
          type: 'select',
          required: true,
          options: [
            { value: 'owned', label: 'Self-owned' },
            { value: 'rented', label: 'Rented premises' },
            { value: 'parental', label: 'Parental / Ancestral' },
          ],
        },
        { key: 'declarationDate', label: 'Date', type: 'date', required: true },
        { key: 'place', label: 'Place', type: 'text', required: true, maxLength: 100, placeholder: 'Gandhinagar' },
      ],
    },
    {
      slug: 'undertaking-utility',
      title: 'Undertaking Form for Utility Services',
      titleGu: 'નવા જોડાણ / સેવા માટે બાંહેધરીપત્ર',
      description: 'Standard citizen undertaking for new water, drainage, or power connection in urban areas.',
      descriptionGu: 'શહેરી વિસ્તારમાં નવા નળ, ગટર અથવા વીજ જોડાણ મેળવવા માટેનું પ્રમાણિત બાંહેધરીપત્ર.',
      category: 'general',
      supportedLanguages: ['gu', 'en'],
      isDemoOnly: true,
      purpose: 'Undertaking regarding compliance with municipal rules and absence of court stay.',
      purposeGu: 'મ્યુનિસિપલ નિયમોનું પાલન અને જગ્યા અંગે કોઈ કોર્ટ સ્ટે ન હોવાની ખાતરી આપતું બાંહેધરીપત્ર.',
      requiredDocuments: ['Property Tax Receipt / Index-2', 'Identity Proof (Aadhaar)'],
      requiredDocumentsGu: ['વેરા પહોંચ / ઈન્ડેક્સ-૨ ની નકલ', 'ઓળખનો પુરાવો (આધાર કાર્ડ)'],
      nextSteps: 'Print, sign, and submit to the Civic Center / Ward Office.',
      nextStepsGu: 'પ્રિન્ટ કરી સહી કરો અને સિવિક સેન્ટર અથવા વોર્ડ ઓફિસમાં રજૂ કરો.',
      layoutKey: 'undertaking_utility',
      fieldsGu: [
        { key: 'fullName', label: 'અરજદારનું પૂરું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'દા.ત. રમેશભાઈ પટેલ' },
        { key: 'parentSpouseName', label: 'પિતા અથવા પતિનું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'કાંતિભાઈ પટેલ' },
        { key: 'address', label: 'મિલકતનું સરનામું (જે જગ્યાએ જોડાણ જોઈએ છે)', type: 'textarea', required: true, maxLength: 500, placeholder: 'મકાન/દુકાન નંબર, સોસાયટી, સેક્ટર' },
        { key: 'undertakingPurpose', label: 'બાંહેધરીનો વિગતવાર હેતુ', type: 'textarea', required: true, maxLength: 1000, placeholder: 'નવા નળ / ડ્રેનેજ / વીજળી જોડાણ મેળવવા અંગેની બાંહેધરી' },
        { key: 'declarationDate', label: 'તારીખ', type: 'date', required: true },
        { key: 'place', label: 'સ્થળ', type: 'text', required: true, maxLength: 100, placeholder: 'ગાંધીનગર' },
      ],
      fieldsEn: [
        { key: 'fullName', label: 'Applicant Full Name', type: 'text', required: true, maxLength: 120, placeholder: 'e.g. Rameshbhai Patel' },
        { key: 'parentSpouseName', label: 'Father / Husband Name', type: 'text', required: true, maxLength: 120, placeholder: 'Kantibhai Patel' },
        { key: 'address', label: 'Premises Address (Where connection required)', type: 'textarea', required: true, maxLength: 500, placeholder: 'House/Shop No., Society, Sector' },
        { key: 'undertakingPurpose', label: 'Purpose of Undertaking', type: 'textarea', required: true, maxLength: 1000, placeholder: 'Undertaking for obtaining new water / power utility connection' },
        { key: 'declarationDate', label: 'Date', type: 'date', required: true },
        { key: 'place', label: 'Place', type: 'text', required: true, maxLength: 100, placeholder: 'Gandhinagar' },
      ],
    },
    {
      slug: 'income-declaration',
      title: 'Annual Family Income Declaration',
      titleGu: 'કુટુંબની વાર્ષિક આવક અંગેનું સ્વ-ઘોષણાપત્ર',
      description: 'Declaration of total annual household income across all sources for certificate issuance.',
      descriptionGu: 'આવકના દાખલા મેળવવા માટે કુટુંબની તમામ સાધનોમાંથી થતી કુલ વાર્ષિક આવકનું ઘોષણાપત્ર.',
      category: 'declaration',
      supportedLanguages: ['gu', 'en'],
      isDemoOnly: true,
      purpose: 'Self-declaration of aggregate household income for administrative certification.',
      purposeGu: 'વહીવટી પ્રમાણીકરણ માટે કુટુંબની વાર્ષિક આવક સ્વયં પ્રમાણિત કરવા અર્થે.',
      requiredDocuments: ['Ration Card', 'Bank Passbook / Salary Certificate / Talati Panchnama'],
      requiredDocumentsGu: ['રેશનકાર્ડ', 'બેંક પાસબુક / પગાર પ્રમાણપત્ર / તલાટી પંચનામું'],
      nextSteps: 'Print, sign, and submit to Jan Seva Kendra / Mamlatdar Office.',
      nextStepsGu: 'પ્રિન્ટ કરી સહી કરો અને જન સેવા કેન્દ્ર / મામલતદાર કચેરીએ રજૂ કરો.',
      layoutKey: 'income_declaration',
      fieldsGu: [
        { key: 'fullName', label: 'અરજદારનું પૂરું નામ', type: 'text', required: true, maxLength: 120, placeholder: 'પૂર્ણ નામ' },
        { key: 'age', label: 'ઉંમર (વર્ષ)', type: 'number', required: true, min: 18, max: 120 },
        { key: 'occupation', label: 'ધંધો / વ્યવસાય', type: 'text', required: true, maxLength: 100, placeholder: 'ખેતી / મજૂરી / વેપાર / નોકરી' },
        { key: 'address', label: 'રહેઠાણનું સરનામું', type: 'textarea', required: true, maxLength: 500, placeholder: 'ગામ/શહેર, તાલુકો, જિલ્લો ગાંધીનગર' },
        { key: 'annualIncome', label: 'કુલ વાર્ષિક આવક (રૂપિયામાં)', type: 'number', required: true, min: 1000, max: 10000000, placeholder: 'દા.ત. 120000' },
        { key: 'incomeSource', label: 'આવકનું મુખ્ય સાધન', type: 'text', required: true, maxLength: 150, placeholder: 'ખેતી / છૂટક મજૂરી / પશુપાલન' },
        { key: 'declarationDate', label: 'તારીખ', type: 'date', required: true },
        { key: 'place', label: 'સ્થળ', type: 'text', required: true, maxLength: 100, placeholder: 'ગાંધીનગર' },
      ],
      fieldsEn: [
        { key: 'fullName', label: 'Applicant Full Name', type: 'text', required: true, maxLength: 120, placeholder: 'Full Name' },
        { key: 'age', label: 'Age (in years)', type: 'number', required: true, min: 18, max: 120 },
        { key: 'occupation', label: 'Occupation', type: 'text', required: true, maxLength: 100, placeholder: 'Agriculture / Labour / Business' },
        { key: 'address', label: 'Residential Address', type: 'textarea', required: true, maxLength: 500, placeholder: 'Village/City, Taluka, Dist. Gandhinagar' },
        { key: 'annualIncome', label: 'Total Annual Income (in INR)', type: 'number', required: true, min: 1000, max: 10000000, placeholder: 'e.g. 120000' },
        { key: 'incomeSource', label: 'Primary Source of Income', type: 'text', required: true, maxLength: 150, placeholder: 'Agriculture / Daily Wages / Animal Husbandry' },
        { key: 'declarationDate', label: 'Date', type: 'date', required: true },
        { key: 'place', label: 'Place', type: 'text', required: true, maxLength: 100, placeholder: 'Gandhinagar' },
      ],
    },
  ];

  for (const tpl of demoTemplates) {
    const templateDoc = await TemplateModel.findOneAndUpdate(
      { slug: tpl.slug },
      {
        slug: tpl.slug,
        title: tpl.title,
        titleGu: tpl.titleGu,
        description: tpl.description,
        descriptionGu: tpl.descriptionGu,
        category: tpl.category,
        supportedLanguages: tpl.supportedLanguages,
        status: 'active',
        isDemoOnly: true,
        purpose: tpl.purpose,
        purposeGu: tpl.purposeGu,
        requiredDocuments: tpl.requiredDocuments,
        requiredDocumentsGu: tpl.requiredDocumentsGu,
        nextSteps: tpl.nextSteps,
        nextStepsGu: tpl.nextStepsGu,
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    // Seed Gujarati Published Version (v1)
    const guVersion = await TemplateVersionModel.findOneAndUpdate(
      { templateId: templateDoc._id, version: 1, language: 'gu' },
      {
        templateId: templateDoc._id,
        version: 1,
        language: 'gu',
        fields: tpl.fieldsGu,
        layoutKey: tpl.layoutKey,
        sourceReference: 'Collector Office, Gandhinagar - Standard Prototype Format (Demo)',
        status: 'published',
        createdBy: adminUser._id,
        reviewedBy: approverUser._id,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Seed English Published Version (v1)
    await TemplateVersionModel.findOneAndUpdate(
      { templateId: templateDoc._id, version: 1, language: 'en' },
      {
        templateId: templateDoc._id,
        version: 1,
        language: 'en',
        fields: tpl.fieldsEn,
        layoutKey: tpl.layoutKey,
        sourceReference: 'Collector Office, Gandhinagar - Standard Prototype Format (Demo)',
        status: 'published',
        createdBy: adminUser._id,
        reviewedBy: approverUser._id,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update template's currentPublishedVersionId to the Gujarati primary version
    templateDoc.currentPublishedVersionId = guVersion._id;
    templateDoc.currentVersionNumber = 1;
    await templateDoc.save();

    // Add audit event for seeding
    await AuditEventModel.create({
      actorUserId: adminUser._id,
      actorEmail: adminUser.email,
      action: 'VERSION_PUBLISHED',
      entityType: 'template_version',
      entityId: String(guVersion._id),
      version: 1,
      reason: 'Initial demo seed publication',
      timestamp: new Date(),
      metadata: { slug: tpl.slug, language: 'gu' },
    });
  }

  console.log(`[Seed] Seeded ${demoTemplates.length} demo templates with published versions in GU and EN.`);

  // 3. Define 5 High-Impact Citizen Services with Document Checklists
  const demoServices = [
    {
      slug: 'income-certificate-service',
      title: 'Income Certificate (Dakhla)',
      titleGu: 'આવકનો દાખલો (સર્ટિફિકેટ)',
      department: 'Revenue Department',
      departmentGu: 'મહેસૂલ વિભાગ',
      category: 'revenue',
      jurisdiction: 'Gujarat (Gandhinagar / Statewide)',
      effectiveDate: '2024-04-01',
      verificationStatus: 'verified_sample',
      sourceReference: 'Gujarat Revenue Dept G.R. No. DKH-102018-744-J (Collector Office Gandhinagar)',
      description: 'Statutory income certificate required for scholarships, digital Gujarat schemes, ration card categorization, and housing subsidies.',
      descriptionGu: 'શિષ્યવૃત્તિ, ડિજિટલ ગુજરાત યોજનાઓ, રેશનકાર્ડ કેટેગરી અને સરકારી આવાસ સહાય માટે જરૂરી આવકનું સત્તાવાર પ્રમાણપત્ર.',
      purpose: 'To provide legally binding documentation of aggregate family income to the Talati / Mamlatdar.',
      purposeGu: 'તલાટી / મામલતદાર સમક્ષ કુટુંબની કુલ વાર્ષિક આવકનું પ્રમાણિત પુરાવા સાથેનું નિવેદન રજૂ કરવા.',
      steps: [
        '1. Enter citizen information once for all selected documents.',
        '2. Review and preview both Self-Declaration and Family Income Statement.',
        '3. Download PDF / DOCX formats for printing and physical attestation if needed.',
        '4. Submit online on Digital Gujarat portal or physically at Jan Seva Kendra / Mamlatdar Office.',
      ],
      stepsGu: [
        '૧. પસંદ કરેલ તમામ દસ્તાવેજો માટે એક જ વાર નાગરિક માહિતી ભરો.',
        '૨. સ્વ-ઘોષણાપત્ર અને કુટુંબની વાર્ષિક આવક નિવેદન બંનેનું પ્રીવ્યૂ ચકાસો.',
        '૩. પ્રિન્ટ કરવા માટે PDF / DOCX ફોર્મેટ ડાઉનલોડ કરો.',
        '૪. ડિજિટલ ગુજરાત પોર્ટલ પર ઓનલાઈન અથવા જન સેવા કેન્દ્ર / મામલતદાર કચેરીએ રજૂ કરો.',
      ],
      requiredTemplates: [
        {
          templateSlug: 'sample-declaration',
          templateTitle: 'Self-Declaration Form',
          templateTitleGu: 'સ્વ-ઘોષણાપત્ર',
          isMandatory: true,
          notes: 'Mandatory self-attestation as per Gujarat Administrative Reforms.',
          notesGu: 'વહીવટી સુધારણા નિયમ મુજબ ફરજિયાત સ્વ-પ્રમાણિત એકરાર.',
          category: 'declaration',
        },
        {
          templateSlug: 'income-declaration',
          templateTitle: 'Annual Family Income Declaration',
          templateTitleGu: 'કુટુંબની વાર્ષિક આવક અંગેનું સ્વ-ઘોષણાપત્ર',
          isMandatory: true,
          notes: 'Detailed breakdown of agricultural, business, or wage income.',
          notesGu: 'ખેતી, ધંધો કે મજૂરી આવકની વિગતવાર માહિતી.',
          category: 'declaration',
        },
        {
          templateSlug: 'sample-address-declaration',
          templateTitle: 'Address Verification Declaration',
          templateTitleGu: 'સરનામા પુરાવા અંગેનું એકરારનામું',
          isMandatory: false,
          condition: 'Required if utility bill or property tax receipt is not in applicant name (e.g. rented/ancestral).',
          conditionGu: 'લાઈટ બિલ કે મિલકત પહોંચ અરજદારના પોતાના નામે ન હોય ત્યારે જરૂરી.',
          notes: 'Confirms continuous local stay.',
          notesGu: 'સ્થાનિક વસવાટની ખાતરી.',
          category: 'certificate_support',
        },
      ],
      supportingDocuments: [
        {
          name: 'Ration Card (All pages)',
          nameGu: 'રેશનકાર્ડની નકલ (તમામ પાના)',
          isMandatory: true,
          description: 'Proof of family members and residential categorization.',
          descriptionGu: 'કુટુંબના સભ્યો અને રહેઠાણનો પુરાવો.',
        },
        {
          name: 'Recent Electricity Bill or House Tax Receipt',
          nameGu: 'છેલ્લું લાઈટ બિલ અથવા મકાન વેરા પહોંચ',
          isMandatory: true,
          description: 'Proof of current residential address in Gandhinagar.',
          descriptionGu: 'ગાંધીનગર ખાતે વર્તમાન રહેઠાણનો પુરાવો.',
        },
        {
          name: 'Salary Slip / Talati Income Report (if unorganized sector)',
          nameGu: 'પગાર સ્લિપ / તલાટી આવક પંચનામું',
          isMandatory: false,
          description: 'Supporting documentation for verification.',
          descriptionGu: 'આવકની ચકાસણી માટે સમર્થક પુરાવો.',
        },
      ],
    },
    {
      slug: 'domicile-certificate-service',
      title: 'Domicile / Continuous Residence Certificate',
      titleGu: 'ડૉમિસાઇલ / કાયમી રહેઠાણ પ્રમાણપત્ર',
      department: 'District Administration / Executive Magistrate',
      departmentGu: 'જિલ્લા વહીવટી તંત્ર / કાર્યપાલક મેજિસ્ટ્રેટ',
      category: 'general_administration',
      jurisdiction: 'Gujarat (District: Gandhinagar)',
      effectiveDate: '2024-04-01',
      verificationStatus: 'verified_sample',
      sourceReference: 'Executive Magistrate Standards, Gandhinagar District',
      description: 'Official certification of 10+ years continuous residence in Gujarat for higher education admissions and public employment.',
      descriptionGu: 'ઉચ્ચ શિક્ષણ પ્રવેશ અને સરકારી ભરતી માટે ગુજરાતમાં ૧૦+ વર્ષથી સતત વસવાટનું સત્તાવાર પ્રમાણપત્ર.',
      purpose: 'Sworn statement establishing continuous residence and domicile eligibility.',
      purposeGu: 'સતત રહેઠાણ અને ડૉમિસાઇલ પાત્રતા સાબિત કરતું કાનૂની સોગંદનામું.',
      steps: [
        '1. Enter applicant details once for all required documents.',
        '2. Generate Address Declaration, Sworn Affidavit, and General Declaration.',
        '3. Attach last 10 years address evidence (school leaving, utility bills).',
        '4. Submit for verification at District Collectorate / Jan Seva Kendra.',
      ],
      stepsGu: [
        '૧. તમામ જરૂરી દસ્તાવેજો માટે એક જ વાર અરજદારની વિગત ભરો.',
        '૨. સરનામા એકરારનામું, સોગંદનામું અને સામાન્ય ઘોષણાપત્ર એકસાથે તૈયાર કરો.',
        '૩. છેલ્લા ૧૦ વર્ષના રહેઠાણના પુરાવા (શાળા છોડ્યાનું પ્રમાણપત્ર, લાઈટ બિલ) જોડો.',
        '૪. જિલ્લા કલેક્ટર કચેરી / જન સેવા કેન્દ્ર ખાતે ચકાસણી માટે રજૂ કરો.',
      ],
      requiredTemplates: [
        {
          templateSlug: 'sample-address-declaration',
          templateTitle: 'Address Verification Declaration',
          templateTitleGu: 'સરનામા પુરાવા અંગેનું એકરારનામું',
          isMandatory: true,
          notes: 'Establishing duration of stay and premises status.',
          notesGu: 'વસવાટનો સમયગાળો અને મકાનની માલિકી સ્થિતિ દર્શાવતો એકરાર.',
          category: 'certificate_support',
        },
        {
          templateSlug: 'sample-affidavit',
          templateTitle: 'General Purpose Affidavit Format',
          templateTitleGu: 'સામાન્ય સોગંદનામું (એફિડેવિટ)',
          isMandatory: true,
          notes: 'Sworn affidavit stating domicile status and non-claim in other states.',
          notesGu: 'અન્ય રાજ્યમાં રહેઠાણ હક્ક ન ધરાવવા અંગેનું સોગંદનામું.',
          category: 'affidavit',
        },
        {
          templateSlug: 'sample-declaration',
          templateTitle: 'Self-Declaration Form',
          templateTitleGu: 'સ્વ-ઘોષણાપત્ર',
          isMandatory: true,
          notes: 'Declaration of truthfulness of attached educational certificates.',
          notesGu: 'જોડેલ પ્રમાણપત્રોની સત્યતા દર્શાવતું ઘોષણાપત્ર.',
          category: 'declaration',
        },
      ],
      supportingDocuments: [
        {
          name: 'School Leaving Certificate (LC)',
          nameGu: 'શાળા છોડ્યાનું પ્રમાણપત્ર (એલ.સી.)',
          isMandatory: true,
          description: 'Proof of place of birth and continuous schooling in Gujarat.',
          descriptionGu: 'જન્મ સ્થળ અને ગુજરાતમાં સતત અભ્યાસનો પુરાવો.',
        },
        {
          name: '10 Years Residential Proof (Tax receipts / Electricity bills)',
          nameGu: '૧૦ વર્ષના રહેઠાણના પુરાવા (વેરા પહોંચ / લાઈટ બિલ)',
          isMandatory: true,
          description: 'Documentary evidence of continuous stay.',
          descriptionGu: 'સતત વસવાટ દર્શાવતા દસ્તાવેજી પુરાવા.',
        },
      ],
    },
    {
      slug: 'name-change-service',
      title: 'Name Change / Correction Declaration & Affidavit',
      titleGu: 'નામ સુધારણા અથવા બદલવા અંગેનું સોગંદનામું',
      department: 'Executive Magistrate & General Administration',
      departmentGu: 'કાર્યપાલક મેજિસ્ટ્રેટ અને સામાન્ય વહીવટ',
      category: 'legal_affairs',
      jurisdiction: 'Gujarat (Statewide)',
      effectiveDate: '2024-04-01',
      verificationStatus: 'verified_sample',
      sourceReference: 'Gujarat Government Gazette Rules & District Administration SOP',
      description: 'Sworn legal affidavit and declaration for correction of spelling errors, name change after marriage, or gazette publication.',
      descriptionGu: 'જોડણી સુધારણા, લગ્ન પછી નામ બદલવા અથવા સરકારી ગેઝેટ પ્રસિદ્ધિ માટે જરૂરી કાનૂની સોગંદનામું અને ઘોષણાપત્ર.',
      purpose: 'Sworn statement affirming previous and adopted name for official records.',
      purposeGu: 'સરકારી રેકર્ડમાં જૂનું અને નવું અપનાવેલ નામ માન્ય કરવા અંગેનું પ્રતિજ્ઞાપત્ર.',
      steps: [
        '1. Enter citizen information once with previous name and corrected name.',
        '2. Generate Sworn Affidavit and Supporting Self-Declaration.',
        '3. Execute the affidavit before an Executive Magistrate or Notary Public.',
        '4. Submit to Gazette Office or concerned department (Passport, Aadhaar, Education Board).',
      ],
      stepsGu: [
        '૧. જૂનું નામ અને સુધારેલ નામ દર્શાવતી વિગતો એક જ વાર ભરો.',
        '૨. સોગંદનામું અને સ્વ-ઘોષણાપત્ર એકસાથે તૈયાર કરો.',
        '૩. કાર્યપાલક મેજિસ્ટ્રેટ અથવા નોટરી સમક્ષ સહી કરાવો.',
        '૪. સરકારી ગેઝેટ અથવા સંબંધિત વિભાગ (પાસપોર્ટ, આધાર, શિક્ષણ બોર્ડ) માં રજૂ કરો.',
      ],
      requiredTemplates: [
        {
          templateSlug: 'sample-affidavit',
          templateTitle: 'General Purpose Affidavit Format',
          templateTitleGu: 'સામાન્ય સોગંદનામું (એફિડેવિટ)',
          isMandatory: true,
          notes: 'Sworn statement stating old name, new name, and valid reason.',
          notesGu: 'જૂનું નામ, નવું નામ અને સુધારણાનું કારણ દર્શાવતું સોગંદનામું.',
          category: 'affidavit',
        },
        {
          templateSlug: 'sample-declaration',
          templateTitle: 'Self-Declaration Form',
          templateTitleGu: 'સ્વ-ઘોષણાપત્ર',
          isMandatory: true,
          notes: 'Declaration undertaking responsibility for identity consistency.',
          notesGu: 'ઓળખની સત્યતા અને જવાબદારી સ્વીકારતું ઘોષણાપત્ર.',
          category: 'declaration',
        },
      ],
      supportingDocuments: [
        {
          name: 'Old Identity Proof (Birth certificate / School LC / Aadhaar)',
          nameGu: 'જૂનો ઓળખ પુરાવો (જન્મ તારીખ દાખલો / એલ.સી. / આધાર)',
          isMandatory: true,
          description: 'Document bearing previous name.',
          descriptionGu: 'જૂનું નામ ધરાવતો ઓળખનો દસ્તાવેજ.',
        },
        {
          name: 'Marriage Certificate / Newspaper Notice (if applicable)',
          nameGu: 'લગ્ન નોંધણી પ્રમાણપત્ર / વર્તમાનપત્ર જાહેરાત',
          isMandatory: false,
          description: 'Supporting evidence for name change.',
          descriptionGu: 'નામ બદલવાના સમર્થનમાં પુરાવો.',
        },
      ],
    },
    {
      slug: 'senior-citizen-certificate-service',
      title: 'Senior Citizen Identity Certificate',
      titleGu: 'વરિષ્ઠ નાગરિક ઓળખ પ્રમાણપત્ર',
      department: 'Social Justice & Empowerment Department',
      departmentGu: 'સામાજિક ન્યાય અને અધિકારિતા વિભાગ',
      category: 'social_welfare',
      jurisdiction: 'Gujarat (Gandhinagar / All Districts)',
      effectiveDate: '2024-04-01',
      verificationStatus: 'verified_sample',
      sourceReference: 'Social Justice Dept Scheme - Gujarat Senior Citizen Welfare Policy',
      description: 'Official application declaration and address proof for issuance of Senior Citizen Card with travel, medical, and pension benefits.',
      descriptionGu: 'મુસાફરી, તબીબી સારવાર અને પેન્શન યોજનાઓ માટે વરિષ્ઠ નાગરિક ઓળખકાર્ડ મેળવવા જરૂરી ઘોષણાપત્ર અને સરનામા પુરાવો.',
      purpose: 'Verification of age 60+ and continuous residence in Gujarat.',
      purposeGu: '૬૦ વર્ષથી વધુ ઉંમર અને ગુજરાતમાં કાયમી વસવાટની ચકાસણી.',
      steps: [
        '1. Enter senior citizen personal details once.',
        '2. Generate Self-Declaration and Residential Verification Statement.',
        '3. Attach Age Proof (Election ID, School LC, or Medical Certificate).',
        '4. Submit to District Social Security Officer / Mamlatdar Office.',
      ],
      stepsGu: [
        '૧. વરિષ્ઠ નાગરિકની વ્યક્તિગત વિગતો એક જ વાર ભરો.',
        '૨. સ્વ-ઘોષણાપત્ર અને સરનામા એકરારનામું એકસાથે તૈયાર કરો.',
        '૩. ઉંમરનો પુરાવો (ચૂંટણી કાર્ડ, શાળા એલ.સી. અથવા મેડિકલ સર્ટિફિકેટ) જોડો.',
        '૪. જિલ્લા સમાજ સુરક્ષા અધિકારી / મામલતદાર કચેરીએ રજૂ કરો.',
      ],
      requiredTemplates: [
        {
          templateSlug: 'sample-declaration',
          templateTitle: 'Self-Declaration Form',
          templateTitleGu: 'સ્વ-ઘોષણાપત્ર',
          isMandatory: true,
          notes: 'Affirming age and non-receipt of duplicate senior cards.',
          notesGu: 'ઉંમર અને અગાઉ કાર્ડ ન લીધા અંગેની ખાતરી.',
          category: 'declaration',
        },
        {
          templateSlug: 'sample-address-declaration',
          templateTitle: 'Address Verification Declaration',
          templateTitleGu: 'સરનામા પુરાવા અંગેનું એકરારનામું',
          isMandatory: true,
          notes: 'Proof of current residential address for local delivery.',
          notesGu: 'સ્થાનિક વસવાટ અને કાર્ડ ડિલિવરી માટેનું સરનામું.',
          category: 'certificate_support',
        },
      ],
      supportingDocuments: [
        {
          name: 'Age Proof (Birth Certificate / School LC / Passport / Voter ID)',
          nameGu: 'ઉંમરનો પુરાવો (જન્મ દાખલો / એલ.સી. / પાસપોર્ટ / ચૂંટણી કાર્ડ)',
          isMandatory: true,
          description: 'Document clearly showing date of birth.',
          descriptionGu: 'જન્મ તારીખ સ્પષ્ટ દર્શાવતો માન્ય પુરાવો.',
        },
        {
          name: 'Passport Size Photographs (2 copies)',
          nameGu: 'પાસપોર્ટ સાઇઝના ફોટા (૨ નકલ)',
          isMandatory: true,
          description: 'For physical senior citizen card printing.',
          descriptionGu: 'ઓળખ કાર્ડ પર લગાવવા માટે.',
        },
      ],
    },
    {
      slug: 'utility-connection-service',
      title: 'New Water / Power Connection Undertaking',
      titleGu: 'નવા નળ / વીજ જોડાણ માટે બાંહેધરીપત્ર',
      department: 'Urban Development & Municipal Corporation',
      departmentGu: 'ગાંધીનગર મહાનગરપાલિકા (GMC) / UGVCL',
      category: 'urban_development',
      jurisdiction: 'Gujarat (Gandhinagar Municipal Corporation Area)',
      effectiveDate: '2024-04-01',
      verificationStatus: 'verified_sample',
      sourceReference: 'Gandhinagar Municipal Corporation (GMC) Water Supply Bylaws',
      description: 'Standard citizen undertaking and address verification for obtaining new residential or commercial water, drainage, or electricity connections.',
      descriptionGu: 'રહેણાંક અથવા વાણિજ્યિક હેતુ માટે નવા નળ, ડ્રેનેજ કે વીજ જોડાણ મેળવવા જરૂરી પ્રમાણિત બાંહેધરીપત્ર અને સરનામા પુરાવો.',
      purpose: 'Undertaking to pay statutory charges and declare absence of legal disputes.',
      purposeGu: 'નિયત મ્યુનિસિપલ ચાર્જ ભરપાઈ કરવા અને કાનૂની વિવાદ ન હોવા અંગેની લેખિત બાંહેધરી.',
      steps: [
        '1. Enter applicant and premises information once.',
        '2. Generate Utility Undertaking Form and Address Declaration.',
        '3. Attach property ownership proof (Index-2 / tax receipt).',
        '4. Submit to Civic Center or GMC Ward Office.',
      ],
      stepsGu: [
        '૧. અરજદાર અને મિલકત અંગેની વિગતો એક જ વાર ભરો.',
        '૨. ઉપયોગિતા બાંહેધરીપત્ર અને સરનામા એકરારનામું એકસાથે તૈયાર કરો.',
        '૩. મિલકત માલિકી પુરાવો (ઈન્ડેક્સ-૨ / વેરા પહોંચ) જોડો.',
        '૪. સિવિક સેન્ટર અથવા મનપા વોર્ડ ઓફિસમાં રજૂ કરો.',
      ],
      requiredTemplates: [
        {
          templateSlug: 'undertaking-utility',
          templateTitle: 'Undertaking Form for Utility Services',
          templateTitleGu: 'નવા જોડાણ / સેવા માટે બાંહેધરીપત્ર',
          isMandatory: true,
          notes: 'Legally binding undertaking to adhere to municipal bylaws.',
          notesGu: 'મ્યુનિસિપલ નિયમોના પાલન અંગેની કાનૂની બાંહેધરી.',
          category: 'undertaking',
        },
        {
          templateSlug: 'sample-address-declaration',
          templateTitle: 'Address Verification Declaration',
          templateTitleGu: 'સરનામા પુરાવા અંગેનું એકરારનામું',
          isMandatory: true,
          notes: 'Verification of premises location and ownership type.',
          notesGu: 'મિલકતનું સ્થાન અને માલિકી પ્રકાર દર્શાવતો એકરાર.',
          category: 'certificate_support',
        },
      ],
      supportingDocuments: [
        {
          name: 'Property Tax Bill / Index-2 Copy / Possession Letter',
          nameGu: 'મકાન વેરા બિલ / ઈન્ડેક્સ-૨ ની નકલ / કબજા પાવતી',
          isMandatory: true,
          description: 'Documentary proof of property ownership.',
          descriptionGu: 'મિલકત માલિકી દર્શાવતો સત્તાવાર દસ્તાવેજ.',
        },
        {
          name: 'Applicant Aadhaar Card / ID Proof',
          nameGu: 'અરજદારનું આધાર કાર્ડ / ઓળખ પુરાવો',
          isMandatory: true,
          description: 'Identity proof of the applicant.',
          descriptionGu: 'અરજદારનો ઓળખ પુરાવો.',
        },
      ],
    },
  ];

  for (const s of demoServices) {
    await ServiceModel.findOneAndUpdate(
      { slug: s.slug },
      {
        slug: s.slug,
        title: s.title,
        titleGu: s.titleGu,
        department: s.department,
        departmentGu: s.departmentGu,
        category: s.category,
        jurisdiction: s.jurisdiction,
        effectiveDate: s.effectiveDate,
        verificationStatus: s.verificationStatus,
        sourceReference: s.sourceReference,
        description: s.description,
        descriptionGu: s.descriptionGu,
        purpose: s.purpose,
        purposeGu: s.purposeGu,
        steps: s.steps,
        stepsGu: s.stepsGu,
        requiredTemplates: s.requiredTemplates,
        supportingDocuments: s.supportingDocuments,
        status: 'active',
        isDemoOnly: true,
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`[Seed] Seeded ${demoServices.length} citizen services with document checklists and legal metadata.`);
}

// Execute directly if run as a script
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed()
    .then(async () => {
      console.log('[Seed] Seeding completed successfully.');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed] Seeding failed:', err);
      await disconnectDB();
      process.exit(1);
    });
}
