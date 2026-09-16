import { hi } from './locales/hi';
import { te } from './locales/te';
import { bn } from './locales/bn';
import { mr } from './locales/mr';
import { kn } from './locales/kn';

export type LangCode = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'kn';

export interface LanguageMeta {
  code: LangCode;
  name: string;
  native: string;
  speechLang: string; // BCP-47 tag used for speechSynthesis / recognition
  dir: 'ltr' | 'rtl';
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', native: 'English', speechLang: 'en-IN', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', speechLang: 'hi-IN', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', speechLang: 'ta-IN', dir: 'ltr' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', speechLang: 'te-IN', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', speechLang: 'bn-IN', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', speechLang: 'mr-IN', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', speechLang: 'kn-IN', dir: 'ltr' },
];

type Dict = Partial<Record<LangCode, string>>;

// Full translation bundles for languages kept in their own files (Hindi, Telugu,
// Bengali, Marathi, Kannada). English and Tamil live inline below.
export interface LocaleBundle {
  ui: Record<string, string>;
}

const LOCALE_BUNDLES: Partial<Record<LangCode, LocaleBundle>> = { hi, te, bn, mr, kn };

// General interface copy used across the app. Every key falls back to English
// when a translation for the active language is not yet available.
export const UI: Record<string, Dict> = {
  'brand.name': { en: 'MediMate', ta: 'மெடிமேட்' },
  'brand.tagline': {
    en: 'National Digital Health Intake Service',
    ta: 'தேசிய டிஜிட்டல் சுகாதார சேவை',
  },
  'gov.line': {
    en: 'Government of India · Ministry of Ayush',
    ta: 'இந்திய அரசு · ஆயுஷ் அமைச்சகம்',
  },
  'gov.goi': { en: "Government of India", ta: "இந்திய அரசு" },
  'gov.ministry': { en: "Ministry of Ayush", ta: "ஆயுஷ் அமைச்சகம்" },
  'gov.skip': { en: "Skip to main content", ta: "முதன்மை உள்ளடக்கத்திற்குச் செல்லவும்" },
  'gov.helpline': { en: "Helpline", ta: "உதவி எண்" },
  'menu.home': { en: "Home", ta: "முகப்பு" },
  'menu.about': { en: "About", ta: "பற்றி" },
  'menu.services': { en: "Services", ta: "சேவைகள்" },
  'menu.how': { en: "How it works", ta: "இது எப்படி செயல்படுகிறது" },
  'menu.notices': { en: "Notices", ta: "அறிவிப்புகள்" },
  'menu.help': { en: "Help & Contact", ta: "உதவி & தொடர்பு" },
  'landing.whatsNew': { en: "What's New", ta: "புதியவை" },
  'landing.news1': { en: "Health interview now available in 7 Indian languages with voice support", ta: "குரல் ஆதரவுடன் 7 இந்திய மொழிகளில் சுகாதார நேர்காணல்" },
  'landing.news2': { en: "Practitioners can now issue electronically signed prescriptions", ta: "மருத்துவர்கள் இப்போது மின்னணு கையொப்பமிட்ட மருந்துச்சீட்டுகளை வழங்கலாம்" },
  'landing.news3': { en: "Ayurvedic assessment (Prakriti, Agni, Koshtha) added to the practitioner record", ta: "மருத்துவர் பதிவில் ஆயுர்வேத மதிப்பீடு சேர்க்கப்பட்டது" },
  'landing.signin': { en: "Sign in to MediMate", ta: "MediMate இல் உள்நுழைக" },
  'landing.signinDesc': { en: "Select your language, then continue as a patient or a registered practitioner.", ta: "உங்கள் மொழியைத் தேர்ந்தெடுத்து, நோயாளி அல்லது பதிவுசெய்த மருத்துவராகத் தொடரவும்." },
  'landing.language': { en: "Language", ta: "மொழி" },
  'landing.patientLogin': { en: "Patient Login / Registration", ta: "நோயாளர் உள்நுழைவு / பதிவு" },
  'landing.doctorLogin': { en: "Practitioner Login", ta: "மருத்துவர் உள்நுழைவு" },
  'landing.loginMethods': { en: "Sign in with ABHA, Aadhaar, mobile number or biometric", ta: "ABHA, ஆதார், மொபைல் எண் அல்லது கைரேகை மூலம் உள்நுழையவும்" },
  'landing.about.title': { en: "About MediMate", ta: "MediMate பற்றி" },
  'landing.col.challenge': { en: "Challenge today", ta: "இன்றைய சவால்" },
  'landing.col.solution': { en: "How MediMate helps", ta: "MediMate எப்படி உதவுகிறது" },
  'landing.services.title': { en: "Citizen & Practitioner Services", ta: "குடிமக்கள் & மருத்துவர் சேவைகள்" },
  'svc.register.t': { en: "Patient Registration", ta: "நோயாளர் பதிவு" },
  'svc.register.d': { en: "Register with ABHA, Aadhaar or mobile number", ta: "ABHA, ஆதார் அல்லது மொபைல் எண் மூலம் பதிவு" },
  'svc.interview.t': { en: "Health Interview", ta: "சுகாதார நேர்காணல்" },
  'svc.interview.d': { en: "Answer health questions by voice or text in your language", ta: "உங்கள் மொழியில் குரல் அல்லது உரை மூலம் பதிலளிக்கவும்" },
  'svc.upload.t': { en: "Upload Medical Records", ta: "மருத்துவ பதிவுகளைப் பதிவேற்று" },
  'svc.upload.d': { en: "Keep old prescriptions and lab reports in one record", ta: "பழைய மருந்துச்சீட்டுகள், லேப் ரிப்போர்ட்களை ஒரே இடத்தில்" },
  'svc.rx.t': { en: "View Prescriptions", ta: "மருந்துச்சீட்டுகளைப் பார்" },
  'svc.rx.d': { en: "Download signed prescriptions issued by your doctor", ta: "உங்கள் மருத்துவர் வழங்கிய கையொப்பமிட்ட மருந்துச்சீட்டுகள்" },
  'svc.doctor.t': { en: "Practitioner Dashboard", ta: "மருத்துவர் டாஷ்போர்டு" },
  'svc.doctor.d': { en: "Review patient history, decision support and prescribe", ta: "நோயாளர் வரலாற்றைப் பார்த்து மருந்து பரிந்துரைக்கவும்" },
  'svc.abha.t': { en: "ABHA Health Record", ta: "ABHA சுகாதார பதிவு" },
  'svc.abha.d': { en: "Link each visit to your Ayushman Bharat Health Account", ta: "ஒவ்வொரு வருகையையும் ABHA கணக்குடன் இணைக்கவும்" },
  'landing.how.title': { en: "How it works", ta: "இது எப்படி செயல்படுகிறது" },
  'landing.how.patient': { en: "For patients", ta: "நோயாளிகளுக்கு" },
  'landing.how.doctor': { en: "For practitioners", ta: "மருத்துவர்களுக்கு" },
  'how.p1': { en: "Sign in with ABHA, Aadhaar, mobile number or fingerprint", ta: "ABHA, ஆதார், மொபைல் அல்லது கைரேகை மூலம் உள்நுழையவும்" },
  'how.p2': { en: "Choose the hospital and give consent", ta: "மருத்துவமனையைத் தேர்ந்தெடுத்து ஒப்புதல் அளிக்கவும்" },
  'how.p3': { en: "Answer the health interview and upload reports", ta: "சுகாதார நேர்காணலுக்கு பதிலளித்து ரிப்போர்ட்களைப் பதிவேற்றவும்" },
  'how.p4': { en: "Receive a signed prescription from your doctor", ta: "உங்கள் மருத்துவரிடமிருந்து கையொப்பமிட்ட மருந்துச்சீட்டைப் பெறுங்கள்" },
  'how.d1': { en: "Sign in with ABHA, Aadhaar, mobile number or biometric", ta: "ABHA, ஆதார், மொபைல் அல்லது கைரேகை மூலம் உள்நுழையவும்" },
  'how.d2': { en: "Open today's consultations and search past patients", ta: "இன்றைய ஆலோசனைகளைத் திறந்து பழைய நோயாளிகளைத் தேடவும்" },
  'how.d3': { en: "Review history, safety alerts and decision support", ta: "வரலாறு, பாதுகாப்பு எச்சரிக்கைகளைப் பார்க்கவும்" },
  'how.d4': { en: "Issue an e-signed prescription and share it as PDF", ta: "மின் கையொப்பமிட்ட மருந்துச்சீட்டை PDF ஆகப் பகிரவும்" },
  'landing.notices.title': { en: "Notices & Updates", ta: "அறிவிப்புகள்" },
  'notice1': { en: "Patients are advised to carry their ABHA number or Aadhaar-linked mobile for faster registration.", ta: "விரைவான பதிவுக்கு ABHA எண் அல்லது ஆதார் இணைந்த மொபைலைக் கொண்டு வரவும்." },
  'notice2': { en: "Health information is shared only with doctors at the hospital you select, and only with your consent.", ta: "நீங்கள் தேர்ந்தெடுக்கும் மருத்துவமனை மருத்துவர்களுடன் மட்டுமே, உங்கள் ஒப்புதலுடன் பகிரப்படும்." },
  'notice3': { en: "Decision support shown to practitioners is advisory. Final diagnosis and treatment are decided by the doctor.", ta: "மருத்துவர்களுக்குக் காட்டப்படும் பரிந்துரைகள் ஆலோசனை மட்டுமே. இறுதி முடிவு மருத்துவருடையது." },
  'landing.help.title': { en: "Help & Contact", ta: "உதவி & தொடர்பு" },
  'landing.help.hours': { en: "Monday to Saturday, 9:00 AM – 6:00 PM", ta: "திங்கள் முதல் சனி, காலை 9 – மாலை 6" },
  'landing.help.desk': { en: "Hospital help desk: ask at the OPD registration counter", ta: "மருத்துவமனை உதவி மையம்: OPD பதிவு கவுண்டரில் கேளுங்கள்" },
  'login.biometric.scanning': { en: "Scanning fingerprint…", ta: "கைரேகை ஸ்கேன் செய்யப்படுகிறது…" },
  'login.biometric.verified': { en: 'Fingerprint verified', ta: 'கைரேகை சரிபார்க்கப்பட்டது' },
  'login.biometric.place': { en: "Keep your finger on the scanner", ta: "ஸ்கேனரில் விரலை வைத்திருக்கவும்" },
  'nav.patient': { en: 'Patient Portal', ta: 'நோயாளர் போர்டல்' },
  'nav.doctor': { en: 'Doctor Dashboard', ta: 'மருத்துவர் டாஷ்போர்டு' },
  'nav.home': { en: 'My Records', ta: 'எனது பதிவுகள்' },

  // Landing — language first, then patient and doctor part ways
  'landing.title': { en: 'Welcome to MediMate', ta: 'MediMate க்கு வரவேற்கிறோம்' },
  'landing.chooseLanguage': { en: 'Step 1 · Choose your language', ta: 'படி 1 · உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்' },
  'landing.chooseRole': { en: 'Step 2 · Continue as', ta: 'படி 2 · இவ்வாறு தொடரவும்' },
  'landing.patient.title': { en: 'I am a Patient', ta: 'நான் நோயாளி' },
  'landing.patient.desc': {
    en: 'Register or log in, answer health questions, upload reports and view your prescriptions.',
    ta: 'பதிவு செய்யவும் அல்லது உள்நுழையவும், சுகாதார கேள்விகளுக்கு பதிலளிக்கவும், அறிக்கைகளைப் பதிவேற்றி உங்கள் மருந்துச்சீட்டுகளைப் பார்க்கவும்.',
  },
  'landing.doctor.title': { en: 'I am a Doctor', ta: 'நான் மருத்துவர்' },
  'landing.doctor.desc': {
    en: 'Hospital staff login to review patients registered at your hospital.',
    ta: 'உங்கள் மருத்துவமனையில் பதிவுசெய்த நோயாளிகளை மதிப்பாய்வு செய்ய மருத்துவமனை பணியாளர் உள்நுழைவு.',
  },

  // Patient home — only the patient's own documents and doctor-issued prescriptions
  'home.greeting': { en: 'Namaste, {name}', ta: 'வணக்கம், {name}' },
  'home.subtitle': {
    en: 'Your personal health records. Only you and doctors at your hospital can see these.',
    ta: 'உங்கள் தனிப்பட்ட சுகாதார பதிவுகள். இவற்றை நீங்களும் உங்கள் மருத்துவமனை மருத்துவர்களும் மட்டுமே பார்க்க முடியும்.',
  },
  'home.newConsult': { en: 'Start New Consultation', ta: 'புதிய ஆலோசனையைத் தொடங்கு' },
  'home.newConsultDesc': {
    en: 'Choose your hospital, answer a short health interview and upload reports for your doctor.',
    ta: 'உங்கள் மருத்துவமனையைத் தேர்ந்தெடுத்து, சிறிய சுகாதார நேர்காணலுக்கு பதிலளித்து, மருத்துவருக்கான அறிக்கைகளைப் பதிவேற்றவும்.',
  },
  'home.documents': { en: 'My Uploaded Documents & Reports', ta: 'நான் பதிவேற்றிய ஆவணங்கள் & அறிக்கைகள்' },
  'home.documentsEmpty': { en: 'You have not uploaded any documents yet.', ta: 'நீங்கள் இதுவரை எந்த ஆவணத்தையும் பதிவேற்றவில்லை.' },
  'home.prescriptions': { en: 'Prescriptions from My Doctor', ta: 'எனது மருத்துவரின் மருந்துச்சீட்டுகள்' },
  'home.prescriptionsEmpty': {
    en: 'No prescriptions yet. They will appear here after your doctor reviews your consultation.',
    ta: 'இதுவரை மருந்துச்சீட்டுகள் இல்லை. மருத்துவர் உங்கள் ஆலோசனையை மதிப்பாய்வு செய்த பிறகு இங்கே தோன்றும்.',
  },
  'home.prescribedBy': { en: 'Prescribed by', ta: 'பரிந்துரைத்தவர்' },
  'home.medicines': { en: 'Medicines', ta: 'மருந்துகள்' },
  'home.tests': { en: 'Tests advised', ta: 'பரிந்துரைக்கப்பட்ட பரிசோதனைகள்' },
  'home.notes': { en: "Doctor's advice", ta: 'மருத்துவரின் அறிவுரை' },
  'home.uploadedOn': { en: 'Uploaded on {date}', ta: '{date} அன்று பதிவேற்றப்பட்டது' },
  'home.reportsSaved': { en: 'Your reports have been saved to your health record.', ta: 'உங்கள் ரிப்போர்ட்கள் உங்கள் சுகாதார பதிவில் சேமிக்கப்பட்டன.' },
  'upload.saveReports': { en: 'Save reports to my record', ta: 'ரிப்போர்ட்களை என் பதிவில் சேமி' },
  'home.submitted': { en: 'Your consultation has been submitted to the doctor.', ta: 'உங்கள் ஆலோசனை மருத்துவருக்கு சமர்ப்பிக்கப்பட்டது.' },
  'home.hospital': { en: 'Hospital', ta: 'மருத்துவமனை' },
  'home.hospitalNone': { en: 'Not selected yet', ta: 'இன்னும் தேர்ந்தெடுக்கப்படவில்லை' },

  // Public home page hero
  'hero.eyebrow': { en: 'Ayushman Bharat Digital Mission · For every patient', ta: 'ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் · ஒவ்வொரு நோயாளிக்கும்' },
  'hero.title': { en: 'Less time in the queue. More time with your doctor.', ta: 'வரிசையில் குறைவான நேரம். மருத்துவருடன் அதிக நேரம்.' },
  'hero.lead': {
    en: 'MediMate is an AI-powered platform that unifies patient history and medical records into structured clinical insights for practitioner-led care.',
    ta: 'MediMate உங்கள் உடல்நல வரலாறு மற்றும் மருத்துவ பதிவுகளை ஒன்றிணைத்து, மருத்துவர் தெளிவாகப் புரிந்துகொள்ளும் வகையில் தரும் AI தளம்.',
  },
  'hero.sub': {
    en: 'Digitise your reports once and get a better consultation with any doctor of your choice, from anywhere in the country.',
    ta: 'உங்கள் ரிப்போர்ட்களை ஒருமுறை டிஜிட்டலாக்குங்கள் — நாட்டின் எந்த இடத்திலும் நீங்கள் விரும்பும் மருத்துவரிடம் சிறந்த ஆலோசனை பெறுங்கள்.',
  },
  'hero.cta': { en: 'Get started', ta: 'தொடங்குங்கள்' },
  'hero.scroll': { en: 'Scroll to begin', ta: 'தொடங்க கீழே உருட்டவும்' },
  'hero.imageAlt': { en: 'Hospital OPD waiting hall', ta: 'மருத்துவமனை OPD காத்திருப்பு அறை' },
  'hero.p1': { en: 'Only 2–5 minutes with the doctor in a crowded OPD', ta: 'கூட்டமான OPD-யில் மருத்துவருடன் 2–5 நிமிடங்கள் மட்டுமே' },
  'hero.s1': { en: 'Your health history is ready before you walk in', ta: 'நீங்கள் உள்ளே செல்லும் முன்பே உங்கள் உடல்நல வரலாறு தயார்' },
  'hero.p2': { en: 'Prescriptions and lab reports scattered on paper', ta: 'காகிதங்களில் சிதறிக் கிடக்கும் மருந்துச்சீட்டுகள், ரிப்போர்ட்கள்' },
  'hero.s2': { en: 'All your reports in one digital record', ta: 'உங்கள் எல்லா ரிப்போர்ட்களும் ஒரே இடத்தில்' },
  'hero.p3': { en: 'Repeating your whole story at every new hospital', ta: 'ஒவ்வொரு மருத்துவமனையிலும் எல்லாவற்றையும் மீண்டும் சொல்வது' },
  'hero.s3': { en: 'Consult any doctor, anywhere in India', ta: 'இந்தியாவில் எங்கும், எந்த மருத்துவரிடமும் ஆலோசிக்கலாம்' },
  'landing.startDesc': { en: 'Choose your language and tell us who you are. It takes less than a minute.', ta: 'உங்கள் மொழியைத் தேர்ந்தெடுத்து நீங்கள் யார் என்று சொல்லுங்கள். ஒரு நிமிடம் கூட ஆகாது.' },

  // Patient home dashboard
  'home.banner1.title': { en: 'Keep all your reports in one place', ta: 'உங்கள் எல்லா ரிப்போர்ட்களையும் ஒரே இடத்தில் வைத்திருங்கள்' },
  'home.banner1.desc': {
    en: 'Upload old prescriptions and lab reports once — every doctor you visit can see your full history.',
    ta: 'பழைய மருந்துச்சீட்டுகள், லேப் ரிப்போர்ட்களை ஒருமுறை பதிவேற்றுங்கள் — நீங்கள் பார்க்கும் ஒவ்வொரு மருத்துவரும் முழு வரலாற்றையும் பார்க்கலாம்.',
  },
  'home.banner1.cta': { en: 'Upload reports', ta: 'ரிப்போர்ட் பதிவேற்று' },
  'home.banner2.title': { en: 'Consult a doctor anywhere in India', ta: 'இந்தியாவில் எங்கும் மருத்துவரை அணுகுங்கள்' },
  'home.banner2.desc': {
    en: 'Pick any hospital in the country. Your answers and reports go straight to the doctor.',
    ta: 'நாட்டின் எந்த மருத்துவமனையையும் தேர்ந்தெடுங்கள். உங்கள் பதில்களும் ரிப்போர்ட்களும் நேராக மருத்துவரிடம் செல்லும்.',
  },
  'home.banner2.cta': { en: 'Start consultation', ta: 'ஆலோசனை தொடங்கு' },
  'home.banner3.title': { en: 'Your ABHA health record is linked', ta: 'உங்கள் ABHA சுகாதார பதிவு இணைக்கப்பட்டுள்ளது' },
  'home.banner3.desc': {
    en: 'Every visit, test and prescription is saved safely to your health account.',
    ta: 'ஒவ்வொரு வருகை, பரிசோதனை, மருந்துச்சீட்டும் உங்கள் கணக்கில் பாதுகாப்பாக சேமிக்கப்படும்.',
  },
  'home.banner3.cta': { en: 'See my history', ta: 'என் வரலாற்றைப் பார்' },
  'home.quick.consult': { en: 'New consultation', ta: 'புதிய ஆலோசனை' },
  'home.quick.prescriptions': { en: 'Prescriptions', ta: 'மருந்துச்சீட்டுகள்' },
  'home.quick.reports': { en: 'Reports', ta: 'ரிப்போர்ட்கள்' },
  'home.quick.history': { en: 'Health history', ta: 'உடல்நல வரலாறு' },
  'home.lastVisit': { en: 'Last visit', ta: 'கடைசி வருகை' },
  'home.history': { en: 'My Health History', ta: 'எனது உடல்நல வரலாறு' },
  'home.historyEmpty': { en: 'Your visits and health events will show up here.', ta: 'உங்கள் வருகைகளும் உடல்நல நிகழ்வுகளும் இங்கே தோன்றும்.' },

  // Hospital search
  'hospital.searchPlaceholder': { en: 'Search by hospital name, city or state', ta: 'மருத்துவமனை பெயர், நகரம் அல்லது மாநிலம் மூலம் தேடுங்கள்' },
  'hospital.noResults': { en: 'No hospital found for "{q}".', ta: '"{q}" க்கு எந்த மருத்துவமனையும் கிடைக்கவில்லை.' },

  // Hospital step
  'hospital.heading': { en: 'Select your hospital', ta: 'உங்கள் மருத்துவமனையைத் தேர்ந்தெடுக்கவும்' },
  'hospital.desc': {
    en: 'Your answers and reports will be shared only with doctors at this hospital.',
    ta: 'உங்கள் பதில்களும் அறிக்கைகளும் இந்த மருத்துவமனை மருத்துவர்களுடன் மட்டுமே பகிரப்படும்.',
  },

  // Consultation wizard chrome
  'portal.title': { en: 'Patient Intake & Pre-Consultation', ta: 'நோயாளர் பதிவு & முன் ஆலோசனை' },
  'portal.consultingFor': { en: 'Consulting for', ta: 'ஆலோசனை' },
  'portal.exit': { en: 'Back to My Records', ta: 'எனது பதிவுகளுக்குத் திரும்பு' },
  'nav.logout': { en: 'Log out', ta: 'வெளியேறு' },

  // Login / Register
  'login.title': { en: 'Patient Login / Registration', ta: 'நோயாளர் உள்நுழைவு / பதிவு' },
  'login.subtitle': {
    en: 'Verify your identity to continue to the health intake service.',
    ta: 'சுகாதார சேவையைத் தொடர உங்கள் அடையாளத்தைச் சரிபார்க்கவும்.',
  },
  'login.tab.login': { en: 'Log In', ta: 'உள்நுழைய' },
  'login.tab.register': { en: 'New Registration', ta: 'புதிய பதிவு' },
  'login.method.phone': { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
  'login.method.aadhaar': { en: 'Aadhaar', ta: 'ஆதார்' },
  'login.method.abha': { en: 'ABHA ID', ta: 'ABHA அடையாள எண்' },
  'login.method.biometric': { en: 'Biometric', ta: 'உயிரி அளவீடு' },
  'login.field.phone': { en: 'Mobile Number', ta: 'மொபைல் எண்' },
  'login.field.aadhaar': { en: 'Aadhaar Number', ta: 'ஆதார் எண்' },
  'login.field.abha': { en: 'ABHA Number / ABHA Address', ta: 'ABHA எண் / ABHA முகவரி' },
  'login.field.otp': { en: 'Enter OTP', ta: 'OTP ஐ உள்ளிடவும்' },
  'login.action.sendOtp': { en: 'Send OTP', ta: 'OTP அனுப்பு' },
  'login.action.verify': { en: 'Verify & Continue', ta: 'சரிபார்த்து தொடரவும்' },
  'login.biometric.hint': {
    en: 'Place your registered finger on the scanner at the kiosk, or tap below to simulate biometric verification.',
    ta: 'கியோஸ்கில் உள்ள ஸ்கேனரில் உங்கள் பதிவுசெய்யப்பட்ட விரலை வைக்கவும், அல்லது உயிரி அளவீட்டைப் பின்பற்ற கீழே தட்டவும்.',
  },
  'login.biometric.scan': { en: 'Scan Fingerprint', ta: 'கைரேகையை ஸ்கேன் செய்யவும்' },
  'login.otpSent': { en: 'OTP sent successfully.', ta: 'OTP வெற்றிகரமாக அனுப்பப்பட்டது.' },
  'login.back': { en: '← Change language or role', ta: '← மொழி அல்லது பங்கை மாற்றவும்' },
  'login.notFound': {
    en: 'No record found for these details. Please check the number or use New Registration.',
    ta: 'இந்த விவரங்களுக்கு எந்த பதிவும் இல்லை. எண்ணைச் சரிபார்க்கவும் அல்லது புதிய பதிவைப் பயன்படுத்தவும்.',
  },
  'login.helpline': { en: 'Need help? Call the ABDM Helpline: 1800-11-4477', ta: 'உதவி தேவையா? ABDM உதவி எண்: 1800-11-4477' },

  // Stepper labels
  'step.hospital': { en: 'Hospital', ta: 'மருத்துவமனை' },
  'step.consent': { en: 'Consent', ta: 'ஒப்புதல்' },
  'step.interview': { en: 'Health Interview', ta: 'சுகாதார நேர்காணல்' },
  'step.reports': { en: 'Reports & Files', ta: 'அறிக்கைகள் & கோப்புகள்' },
  'step.review': { en: 'Review & Submit', ta: 'மதிப்பாய்வு & சமர்ப்பிக்கவும்' },
  'step.of': { en: 'Step {n} of {total}', ta: 'படி {n} / {total}' },

  // Language step
  'lang.heading': { en: 'Choose your preferred language', ta: 'உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்' },
  'lang.desc': {
    en: 'Questions, voice prompts, and your health summary will be shown in this language.',
    ta: 'கேள்விகள், குரல் அறிவிப்புகள் மற்றும் உங்கள் சுகாதார சுருக்கம் இந்த மொழியில் காட்டப்படும்.',
  },
  'action.continue': { en: 'Continue', ta: 'தொடரவும்' },
  'action.back': { en: 'Back', ta: 'பின்' },
  'action.next': { en: 'Next', ta: 'அடுத்து' },
  'action.skip': { en: 'Skip & Continue', ta: 'தவிர்த்து தொடரவும்' },

  // Consent step
  'consent.heading': { en: 'Informed Patient Consent', ta: 'அறிவறிந்த நோயாளர் ஒப்புதல்' },
  'consent.desc': {
    en: 'Your data is processed in compliance with the Ayushman Bharat Digital Mission (ABDM) and DISHA health privacy standards.',
    ta: 'உங்கள் தரவு ஆயுஷ்மான் பாரத் டிஜிட்டல் மிஷன் (ABDM) மற்றும் DISHA தனியுரிமை தரநிலைகளுக்கு இணங்க செயலாக்கப்படுகிறது.',
  },
  'consent.readAloud': { en: 'Read consent aloud', ta: 'ஒப்புதலை சத்தமாகப் படிக்கவும்' },
  'consent.interview.title': { en: 'AI Health Intake Interview (Required)', ta: 'AI சுகாதார நேர்காணல் (கட்டாயம்)' },
  'consent.interview.desc': {
    en: 'Allows MediMate AI to ask tailored follow-up questions to understand your symptoms, onset, and chief complaints.',
    ta: 'உங்கள் அறிகுறிகள், தொடக்கம் மற்றும் முக்கிய புகாரைப் புரிந்து கொள்ள MediMate AI தொடர் கேள்விகள் கேட்க அனுமதிக்கிறது.',
  },
  'consent.share.title': { en: 'Practitioner Sharing & Clinical Dashboard (Required)', ta: 'மருத்துவர் பகிர்வு & மருத்துவ டாஷ்போர்டு (கட்டாயம்)' },
  'consent.share.desc': {
    en: 'Grants your consulting doctor and care team access to the AI synthesized case summary, safety alerts, and lab trends.',
    ta: 'உங்கள் மருத்துவர் மற்றும் பராமரிப்பு குழுவிற்கு AI சுருக்கம், பாதுகாப்பு எச்சரிக்கைகள் மற்றும் ஆய்வக போக்குகளை அணுக அனுமதிக்கிறது.',
  },
  'consent.records.title': { en: 'Link Historical Diagnoses & Prescriptions (Recommended)', ta: 'கடந்தகால நோயறிதல் & மருந்துச்சீட்டுகளை இணைக்கவும் (பரிந்துரைக்கப்படுகிறது)' },
  'consent.records.desc': {
    en: 'Cross-references prior medications and allergies to trigger instant drug contraindication warnings.',
    ta: 'முந்தைய மருந்துகள் மற்றும் ஒவ்வாமைகளை ஒப்பிட்டு உடனடி மருந்து முரண்பாடு எச்சரிக்கைகளைக் காட்டுகிறது.',
  },
  'consent.abha.title': { en: 'Sync to ABHA Health Locker', ta: 'ABHA சுகாதார லாக்கருடன் ஒத்திசை' },
  'consent.abha.desc': {
    en: 'Automatically updates your national Ayushman Bharat Health Account.',
    ta: 'உங்கள் தேசிய ஆயுஷ்மான் பாரத் சுகாதார கணக்கை தானாக புதுப்பிக்கிறது.',
  },
  'consent.begin': { en: 'Begin AI Intake Interview', ta: 'AI நேர்காணலைத் தொடங்கு' },

  // Interview step
  'interview.badge': { en: 'Adaptive Clinical Intake', ta: 'தகவமைப்பு மருத்துவ சேகரிப்பு' },
  'interview.questionOf': { en: 'Question {n} of {total}', ta: 'கேள்வி {n} / {total}' },
  'interview.desc': {
    en: 'Answer the questions below so the AI engine can prepare your clinical summary for the doctor.',
    ta: 'மருத்துவருக்கான உங்கள் சுருக்கத்தைத் தயாரிக்க கீழேயுள்ள கேள்விகளுக்கு பதிலளிக்கவும்.',
  },
  'interview.playQuestion': { en: 'Read question aloud', ta: 'கேள்வியை சத்தமாகப் படிக்கவும்' },
  'interview.replay': { en: 'Read again', ta: 'மீண்டும் படிக்கவும்' },
  'interview.record': { en: 'Record answer', ta: 'பதிலைப் பதிவு செய்யவும்' },
  'interview.recording': { en: 'Listening…', ta: 'கேட்கிறது…' },
  'interview.typeOrSpeak': { en: 'Type or speak your answer…', ta: 'உங்கள் பதிலைத் தட்டச்சு செய்யவும் அல்லது பேசவும்…' },
  'interview.selectAllApply': { en: 'Select all that apply, then continue', ta: 'பொருந்தும் அனைத்தையும் தேர்ந்தெடுத்து தொடரவும்' },
  'interview.confirmSelection': { en: 'Confirm Selection', ta: 'தேர்வை உறுதிப்படுத்தவும்' },
  'interview.previous': { en: 'Previous Question', ta: 'முந்தைய கேள்வி' },
  'interview.confirmSeverity': { en: 'Confirm Severity', ta: 'தீவிரத்தை உறுதிப்படுத்தவும்' },
  'interview.progress': { en: '{pct}% complete', ta: '{pct}% முடிந்தது' },
  'interview.generalCategory': { en: 'General Assessment', ta: 'பொது மதிப்பீடு' },
  'interview.simulatedAnswer': {
    en: 'I feel discomfort and would like the doctor to check it.',
    ta: 'எனக்கு அசௌகரியமாக உள்ளது, மருத்துவர் இதைப் பரிசோதிக்க வேண்டும்.',
  },
  'interview.doneHeading': { en: 'Interview Complete', ta: 'நேர்காணல் முடிந்தது' },
  'interview.doneDesc': {
    en: 'Would you like to upload your medical reports and prescriptions now, or finish the intake without uploading?',
    ta: 'இப்போது உங்கள் மருத்துவ அறிக்கைகள் மற்றும் மருந்துச்சீட்டுகளைப் பதிவேற்ற விரும்புகிறீர்களா, அல்லது பதிவேற்றாமல் முடிக்கவா?',
  },
  'interview.uploadPapers': { en: 'Upload Reports', ta: 'அறிக்கைகளைப் பதிவேற்றவும்' },
  'interview.finishWithoutUpload': { en: 'Finish Without Uploading', ta: 'பதிவேற்றாமல் முடிக்கவும்' },

  'interview.height': { en: 'Height (cm)', ta: 'உயரம் (செ.மீ)' },
  'interview.weight': { en: 'Weight (kg)', ta: 'எடை (கிலோ)' },
  'interview.measureInvalid': { en: 'Please check the numbers — height should be 50–250 cm and weight 2–300 kg.', ta: 'எண்களைச் சரிபார்க்கவும் — உயரம் 50–250 செ.மீ, எடை 2–300 கிலோ இருக்க வேண்டும்.' },

  // Upload step
  'upload.badge': { en: 'Document Intelligence', ta: 'ஆவண நுண்ணறிவு' },
  'upload.heading': { en: 'Upload Diagnostic Reports & Prescriptions', ta: 'கண்டறிதல் அறிக்கைகள் & மருந்துச்சீட்டுகளைப் பதிவேற்றவும்' },
  'upload.desc': {
    en: 'MediMate OCR automatically extracts lab values, vital trends, and medication lists from your uploaded files.',
    ta: 'MediMate OCR உங்கள் கோப்புகளிலிருந்து ஆய்வக மதிப்புகள் மற்றும் மருந்துப் பட்டியலைத் தானாக பிரித்தெடுக்கிறது.',
  },
  'upload.dropHeading': { en: 'Tap here to choose a report from your device', ta: 'உங்கள் சாதனத்திலிருந்து அறிக்கையைத் தேர்ந்தெடுக்க இங்கே தட்டவும்' },
  'upload.supports': {
    en: 'PDF, PNG, JPG (blood tests, ECG, discharge summaries, prescriptions)',
    ta: 'PDF, PNG, JPG (இரத்த பரிசோதனை, ECG, டிஸ்சார்ஜ் சுருக்கம், மருந்துச்சீட்டுகள்)',
  },
  'upload.pending': { en: 'Text extraction pending', ta: 'தகவல் பிரித்தெடுப்பு நிலுவையில் உள்ளது' },
  'upload.attachSample': { en: '+ Attach Sample Report', ta: '+ மாதிரி அறிக்கையை இணைக்கவும்' },
  'upload.attachedDocs': { en: 'Attached Documents', ta: 'இணைக்கப்பட்ட ஆவணங்கள்' },
  'upload.backToInterview': { en: 'Back to Interview', ta: 'நேர்காணலுக்குத் திரும்பு' },
  'upload.reviewSubmit': { en: 'Review & Submit', ta: 'மதிப்பாய்வு செய்து சமர்ப்பிக்கவும்' },

  // Review step
  'review.heading': { en: 'Intake Consultation Ready', ta: 'ஆலோசனை பதிவு தயார்' },
  'review.snapshot': { en: 'Consultation Snapshot', ta: 'ஆலோசனை சுருக்கம்' },
  'review.openDashboard': { en: 'Submit to Doctor', ta: 'மருத்துவருக்கு சமர்ப்பிக்கவும்' },
  'review.linked': { en: 'All your answers have been saved to ABHA profile {abha}.', ta: 'உங்கள் அனைத்து பதில்களும் ABHA சுயவிவரம் {abha} இல் சேமிக்கப்பட்டன.' },
  'review.linkedDocs': {
    en: 'All your answers and {n} report(s) have been saved to ABHA profile {abha}.',
    ta: 'உங்கள் அனைத்து பதில்களும் {n} அறிக்கை(கள்) ABHA சுயவிவரம் {abha} இல் சேமிக்கப்பட்டன.',
  },
  'review.patient': { en: 'Patient', ta: 'நோயாளி' },
  'review.complaint': { en: 'Main concern', ta: 'முக்கிய பிரச்சனை' },
  'review.reports': { en: 'Reports attached', ta: 'இணைக்கப்பட்ட அறிக்கைகள்' },
  'review.hospital': { en: 'Hospital', ta: 'மருத்துவமனை' },
  'review.savedToDb': { en: 'Saved to hospital records', ta: 'மருத்துவமனை பதிவேட்டில் சேமிக்கப்பட்டது' },
};

export function translate(key: string, lang: LangCode, vars?: Record<string, string | number>): string {
  const entry = UI[key];
  let text = entry?.[lang] ?? LOCALE_BUNDLES[lang]?.ui[key] ?? entry?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}
