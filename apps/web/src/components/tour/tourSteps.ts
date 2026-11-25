export type TourPageId = 'home' | 'services' | 'documents' | 'my-documents';

export interface BilingualText {
  en: string;
  gu: string;
}

export interface TourContextState {
  isCitizenAuthenticated: boolean;
}

export interface TourStep {
  id: string;
  pageId: TourPageId;
  route: string;
  targetId?: string;
  fallbackTargetId?: string;
  pageTitle: BilingualText;
  transitionMessage?: BilingualText;
  title: BilingualText;
  description: BilingualText;
  when?: (ctx: TourContextState) => boolean;
}

export const NECESSARY_TOUR_STEPS: TourStep[] = [
  {
    id: 'home-search',
    pageId: 'home',
    route: '/',
    targetId: 'tour-search',
    pageTitle: { en: 'Homepage', gu: 'હોમપેજ' },
    title: {
      en: 'Welcome to JanDastavej',
      gu: 'JanDastavej માં આપનું સ્વાગત છે',
    },
    description: {
      en: 'Search for citizen services here. To find document formats, go to the Document Library. Switch between English and ગુજરાતી from the header.',
      gu: 'અહીં નાગરિક સેવાઓ શોધો. દસ્તાવેજના ફોર્મેટ શોધવા દસ્તાવેજ લાઇબ્રેરી પર જાઓ. હેડરમાંથી English અને ગુજરાતી ભાષા બદલો.',
    },
  },
  {
    id: 'home-services',
    pageId: 'home',
    route: '/',
    targetId: 'tour-citizen-services',
    pageTitle: { en: 'Homepage', gu: 'હોમપેજ' },
    title: {
      en: 'Popular Citizen Services',
      gu: 'મુખ્ય નાગરિક સેવાઓ',
    },
    description: {
      en: 'Pick a high-demand service to view its required document checklist and fill all forms in one go.',
      gu: 'જરૂરી દસ્તાવેજોનું ચેકલિસ્ટ જોવા અને એકસાથે બધા ફોર્મ ભરવા મુખ્ય સેવા પસંદ કરો.',
    },
  },
  {
    id: 'services-directory',
    pageId: 'services',
    route: '/services',
    targetId: 'tour-services-filters',
    fallbackTargetId: 'tour-services',
    pageTitle: { en: 'Citizen Services', gu: 'નાગરિક સેવાઓ' },
    transitionMessage: {
      en: 'Moved to Citizen Services (/services)',
      gu: 'નાગરિક સેવાઓ (/services) પર આવ્યા છીએ',
    },
    title: {
      en: 'Browse & Filter Services',
      gu: 'સેવાઓ શોધો અને ફિલ્ટર કરો',
    },
    description: {
      en: 'Filter services by department or category, then open “View Checklist & Apply” to generate required declarations together.',
      gu: 'વિભાગ અથવા શ્રેણી મુજબ સેવાઓ ફિલ્ટર કરો અને જરૂરી દસ્તાવેજો એકસાથે બનાવવા સેવા ખોલો.',
    },
  },
  {
    id: 'documents-library',
    pageId: 'documents',
    route: '/documents',
    targetId: 'tour-template-library',
    pageTitle: { en: 'Document Library', gu: 'દસ્તાવેજ લાઇબ્રેરી' },
    transitionMessage: {
      en: 'Moved to Document Library (/documents)',
      gu: 'દસ્તાવેજ લાઇબ્રેરી (/documents) પર આવ્યા છીએ',
    },
    title: {
      en: 'Find Individual Formats',
      gu: 'વ્યક્તિગત દસ્તાવેજ ફોર્મેટ શોધો',
    },
    description: {
      en: 'Search or filter affidavits, declarations, and undertakings, then choose “Select Format” to review requirements.',
      gu: 'સોગંદનામા, ઘોષણાપત્ર કે બાંહેધરીપત્ર શોધો અને જરૂરિયાતો જોવા “આગળ વધો” પસંદ કરો.',
    },
  },
  {
    id: 'documents-workflow',
    pageId: 'documents',
    route: '/documents',
    targetId: 'tour-library-grid',
    fallbackTargetId: 'tour-template-library',
    pageTitle: { en: 'Document Library', gu: 'દસ્તાવેજ લાઇબ્રેરી' },
    title: {
      en: 'Fill Once, Preview A4 & Export',
      gu: 'વિગતો ભરો, A4 પ્રિવ્યૂ અને ડાઉનલોડ',
    },
    description: {
      en: 'Enter details once (with optional session reuse), verify the exact A4 preview, accept the legal notice, and download PDF or DOCX.',
      gu: 'માહિતી એકવાર ભરો, A4 પ્રિવ્યૂ તપાસો, કાનૂની સૂચન સ્વીકારો અને PDF અથવા DOCX ડાઉનલોડ કરો.',
    },
  },
  {
    id: 'my-documents-vault',
    pageId: 'my-documents',
    route: '/my-documents',
    targetId: 'tour-my-documents',
    when: (ctx) => ctx.isCitizenAuthenticated,
    pageTitle: { en: 'My Documents', gu: 'મારા દસ્તાવેજો' },
    transitionMessage: {
      en: 'Moved to My Documents (/my-documents)',
      gu: 'મારા દસ્તાવેજો (/my-documents) પર આવ્યા છીએ',
    },
    title: {
      en: 'Manage Saved Supporting Files',
      gu: 'સાચવેલા દસ્તાવેજો મેનેજ કરો',
    },
    description: {
      en: 'Keep uploaded proofs for reuse, manage 30-day retention, or permanently erase your stored files anytime.',
      gu: 'અપલોડ કરેલા પુરાવા સાચવો, ૩૦-દિવસની મર્યાદા મેનેજ કરો અથવા ગમે ત્યારે કાયમી ડિલીટ કરો.',
    },
  },
];
