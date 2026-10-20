import argon2 from 'argon2';
import { connectDB, disconnectDB } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { TemplateModel } from '../models/Template.js';
import { TemplateVersionModel } from '../models/TemplateVersion.js';
import { AuditEventModel } from '../models/AuditEvent.js';

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
