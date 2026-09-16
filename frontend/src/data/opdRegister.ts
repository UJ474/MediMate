// Demo OPD register: extra patients for each hospital plus a visit schedule
// expressed relative to today, so the practitioner dashboard always shows a
// realistic "today" and "past 7 days" picture no matter when the demo runs.
import type { Consultation, Patient } from '../types';

export function isoDaysAgo(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

type Severity = 'Critical' | 'High' | 'Moderate' | 'Low' | 'Informational';

interface CompactSpec {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  hospitalId: string;
  bloodGroup: string;
  language: string;
  phone: string;
  risk: Patient['riskLevel'];
  score: number;
  complaint: string;
  vitals: [bp: string, pulse: string, spo2: string, temp: string, weight: string, bmi: string];
  diagnoses?: Array<[name: string, since: string, status: string]>;
  meds?: Array<[name: string, frequency: string, since: string, adherence: string]>;
  allergies?: Array<[substance: string, reaction: string, severity: string]>;
  labs?: Array<[type: string, value: string, unit: string, reference: string, status: string, trend: string]>;
  summary: string;
  insights?: Array<[category: string, severity: Severity, title: string, detail: string, evidence: string[]]>;
  alerts?: Array<[severity: Severity, type: string, message: string, action: string]>;
  tests?: string[];
  ayurveda: [prakriti: string, imbalance: string, agni: string, koshtha: string, herbs: string[]];
  profile?: Partial<Patient['profile']>;
}

function compactPatient(spec: CompactSpec, labDaysAgo: number): Patient {
  const [bp, pulse, spo2, temp, weight, bmi] = spec.vitals;
  const labDate = isoDaysAgo(labDaysAgo);
  return {
    id: spec.id,
    name: spec.name,
    age: spec.age,
    gender: spec.gender,
    phone: spec.phone,
    abha: `ABHA-${spec.id.slice(1)}-${spec.phone.replace(/\D/g, '').slice(-8, -4)}-${spec.phone.replace(/\D/g, '').slice(-4)}`,
    hospitalId: spec.hospitalId,
    bloodGroup: spec.bloodGroup,
    language: spec.language,
    avatar: spec.gender === 'Female' ? '👩' : '👨',
    riskLevel: spec.risk,
    riskScore: spec.score,
    lastVisit: isoDaysAgo(0),
    chiefComplaint: spec.complaint,
    vitals: { bp, pulse, spo2, temp, weight, height: '—', bmi },
    profile: {
      occupation: '—',
      diet: '—',
      smoking: 'Non-smoker',
      alcohol: 'None',
      physicalActivity: '—',
      sleep: '—',
      stress: '—',
      ...spec.profile,
    },
    diagnoses: (spec.diagnoses ?? []).map(([name, since, status]) => ({ name, since, status, severity: '' })),
    medications: (spec.meds ?? []).map(([name, frequency, since, adherence]) => ({ name, frequency, since, adherence })),
    allergies: (spec.allergies ?? []).map(([substance, reaction, severity]) => ({ substance, reaction, severity })),
    labs: (spec.labs ?? []).map(([type, value, unit, reference, status, trend]) => ({
      date: labDate,
      type,
      value,
      unit,
      reference,
      status,
      trend,
    })),
    timeline: (spec.diagnoses ?? []).map(([name, since]) => ({ date: since, event: `${name} diagnosed`, type: 'diagnosis' })),
    ayurvedicContext: {
      prakriti: spec.ayurveda[0],
      currentImbalance: spec.ayurveda[1],
      agni: spec.ayurveda[2],
      koshtha: spec.ayurveda[3],
      previousAyurvedicTreatment: 'None recorded',
      relevantHerbs: spec.ayurveda[4],
    },
    aiInsights: {
      summary: spec.summary,
      keyInsights: (spec.insights ?? []).map(([category, severity, title, detail, evidence]) => ({
        category,
        severity,
        icon: '',
        title,
        detail,
        evidence,
      })),
      safetyAlerts: (spec.alerts ?? []).map(([severity, type, message, action]) => ({ severity, type, message, action })),
      recommendedTests: spec.tests ?? [],
    },
    documents: [],
    prescriptions: [],
  };
}

const SPECS: CompactSpec[] = [
  // ── H001 · Apollo Hospitals — Internal Medicine ──
  {
    id: 'P101', name: 'Sunita Devi Yadav', age: 46, gender: 'Female', hospitalId: 'H001', bloodGroup: 'A+', language: 'Hindi',
    phone: '+91 98111 20456', risk: 'Moderate', score: 52,
    complaint: 'Joint pain and morning stiffness in both hands for 4 months, worse in cold weather',
    vitals: ['132/84 mmHg', '82 bpm', '98%', '98.4°F', '68 kg', '27.1'],
    diagnoses: [['Hypothyroidism', '2021', 'Controlled']],
    meds: [['Levothyroxine 50mcg', 'Once daily (empty stomach)', '2021', 'Good']],
    labs: [
      ['ESR', '42', 'mm/hr', '<20', 'High', 'First measurement'],
      ['CRP', '14', 'mg/L', '<5', 'High', 'First measurement'],
      ['TSH', '2.9', 'mIU/L', '0.4–4.0', 'Normal', 'Stable'],
    ],
    summary: 'Symmetrical small-joint polyarthralgia with morning stiffness >45 min and raised inflammatory markers (ESR 42, CRP 14). Pattern is consistent with an inflammatory arthritis; rheumatoid serology is not yet available.',
    insights: [['Inflammatory arthritis', 'Moderate', 'Possible early rheumatoid arthritis', 'Symmetrical MCP/PIP involvement with prolonged morning stiffness and elevated ESR/CRP meets screening criteria for inflammatory arthritis.', ['Morning stiffness > 45 min', 'ESR 42 mm/hr', 'CRP 14 mg/L', 'Bilateral hand involvement']]],
    tests: ['RA factor', 'Anti-CCP antibodies', 'X-ray both hands (PA view)', 'CBC with differential'],
    ayurveda: ['Vata-Kapha', 'Sandhigata Vata with Kapha avarana', 'Mandagni', 'Madhyama', ['Shallaki (Boswellia)', 'Guggulu formulations']],
  },
  {
    id: 'P102', name: 'Arvind Nair', age: 39, gender: 'Male', hospitalId: 'H001', bloodGroup: 'O+', language: 'Malayalam',
    phone: '+91 97450 33218', risk: 'Low', score: 22,
    complaint: 'Burning sensation in upper abdomen after meals and acid reflux at night for 6 weeks',
    vitals: ['124/80 mmHg', '76 bpm', '99%', '98.2°F', '81 kg', '26.4'],
    meds: [['Antacid syrup', 'SOS', '2026', 'Self-medicated']],
    summary: 'Post-prandial epigastric burning and nocturnal reflux over 6 weeks with no alarm features reported (no weight loss, dysphagia, or bleeding). Symptoms are typical of GERD / functional dyspepsia.',
    insights: [['Gastrointestinal', 'Low', 'Typical reflux symptoms without red flags', 'Absence of alarm features supports an empirical PPI trial with lifestyle modification before endoscopy.', ['No weight loss reported', 'No dysphagia', 'Late-night meals reported']]],
    tests: ['H. pylori stool antigen', 'CBC'],
    ayurveda: ['Pitta', 'Amlapitta (Pitta aggravation)', 'Tikshna Agni', 'Madhyama', ['Avipattikar churna', 'Amla (Indian gooseberry)']],
    profile: { diet: 'Mixed, late dinners', stress: 'Moderate (work)' },
  },
  {
    id: 'P103', name: 'Kamala Venkatesh', age: 71, gender: 'Female', hospitalId: 'H001', bloodGroup: 'B-', language: 'Kannada',
    phone: '+91 94481 90312', risk: 'High', score: 74,
    complaint: 'Swelling of both feet and breathlessness while lying flat for 10 days',
    vitals: ['156/92 mmHg', '104 bpm', '93%', '98.1°F', '72 kg', '29.6'],
    diagnoses: [['Essential Hypertension', '2009', 'Active'], ['Type 2 Diabetes Mellitus', '2014', 'Active']],
    meds: [['Amlodipine 10mg', 'Once daily', '2015', 'Good'], ['Metformin 500mg', 'Twice daily', '2014', 'Good'], ['Pioglitazone 15mg', 'Once daily', '2023', 'Good']],
    allergies: [['Penicillin', 'Rash', 'Moderate']],
    labs: [
      ['NT-proBNP', '1840', 'pg/mL', '<300', 'High', 'First measurement'],
      ['Serum Creatinine', '1.1', 'mg/dL', '0.6–1.1', 'Normal', 'Stable'],
      ['HbA1c', '7.4', '%', '<7.0', 'High', 'Improved from 7.9'],
    ],
    summary: 'Elderly diabetic, hypertensive woman with 10-day bilateral pedal oedema, orthopnoea, tachycardia and SpO2 93%. Markedly raised NT-proBNP suggests new-onset heart failure. Pioglitazone can worsen fluid retention.',
    insights: [['Cardiovascular', 'High', 'Suspected new-onset heart failure', 'Orthopnoea, pedal oedema, tachycardia and NT-proBNP 1840 pg/mL together strongly suggest decompensated heart failure.', ['NT-proBNP 1840 pg/mL', 'Orthopnoea', 'SpO2 93%', 'Pulse 104 bpm']]],
    alerts: [
      ['High', 'Drug-Condition Interaction', 'PIOGLITAZONE — thiazolidinediones cause fluid retention and are contraindicated in symptomatic heart failure.', 'Stop Pioglitazone; review diabetes regimen'],
      ['Moderate', 'Known Allergy', 'PENICILLIN allergy (rash) documented. Avoid beta-lactams if an antibiotic is needed.', 'Choose a non-beta-lactam if required'],
    ],
    tests: ['2D Echocardiogram', 'ECG 12-lead', 'Chest X-ray PA view', 'Serum electrolytes'],
    ayurveda: ['Kapha', 'Shotha with Kapha-Vata avarana', 'Mandagni', 'Mridu', ['Punarnava', 'Arjuna']],
  },
  {
    id: 'P104', name: 'Farhan Qureshi', age: 27, gender: 'Male', hospitalId: 'H001', bloodGroup: 'AB+', language: 'Urdu',
    phone: '+91 99020 71145', risk: 'Low', score: 18,
    complaint: 'Fever with body ache and sore throat for 3 days',
    vitals: ['118/76 mmHg', '96 bpm', '98%', '100.8°F', '70 kg', '22.9'],
    labs: [['Platelet count', '2.1', 'lakh/µL', '1.5–4.5', 'Normal', 'First measurement']],
    summary: 'Young adult with a 3-day acute febrile illness, pharyngitis and myalgia. Platelets are normal. No warning signs of dengue reported.',
    insights: [['Infectious disease', 'Low', 'Likely viral upper respiratory infection', 'Short febrile illness with pharyngitis and myalgia, normal platelet count. Monitor for dengue warning signs given season.', ['Fever 100.8°F', 'Platelets normal', 'Sore throat']]],
    tests: ['NS1 antigen (if fever persists beyond day 5)', 'CBC repeat in 48 hours'],
    ayurveda: ['Pitta-Vata', 'Jwara with Kantha shotha', 'Vishama Agni', 'Madhyama', ['Tulsi', 'Giloy (Guduchi)']],
  },
  {
    id: 'P105', name: 'Meenakshi Iyer', age: 55, gender: 'Female', hospitalId: 'H001', bloodGroup: 'O-', language: 'Tamil',
    phone: '+91 98402 55691', risk: 'Moderate', score: 48,
    complaint: 'Follow-up for diabetes; tingling and numbness in both feet',
    vitals: ['138/86 mmHg', '80 bpm', '98%', '98.3°F', '64 kg', '25.8'],
    diagnoses: [['Type 2 Diabetes Mellitus', '2016', 'Active'], ['Dyslipidemia', '2019', 'Active']],
    meds: [['Metformin 1000mg', 'Twice daily', '2016', 'Good'], ['Rosuvastatin 10mg', 'Once daily (night)', '2019', 'Occasional miss']],
    labs: [
      ['HbA1c', '8.1', '%', '<7.0', 'High', 'Worsening (was 7.5)'],
      ['Vitamin B12', '168', 'pg/mL', '200–900', 'Low', 'First measurement'],
    ],
    summary: 'Long-standing type 2 diabetes with worsening control (HbA1c 8.1%) and symmetrical distal paraesthesia. Low vitamin B12 on long-term metformin may be contributing to neuropathy.',
    insights: [['Neurology', 'Moderate', 'Peripheral neuropathy — diabetic and/or B12 deficiency', 'Long-term metformin is associated with B12 deficiency, which can mimic or worsen diabetic neuropathy.', ['Vitamin B12 168 pg/mL', 'Metformin since 2016', 'Bilateral foot numbness']]],
    tests: ['Monofilament foot examination', 'Nerve conduction study', 'Urine microalbumin'],
    ayurveda: ['Kapha-Pitta', 'Madhumeha with Vata involvement', 'Mandagni', 'Madhyama', ['Nishamamaki (Haridra + Amla)', 'Gudmar']],
  },

  // ── H002 · Manipal Hospitals — Cardiology ──
  {
    id: 'P201', name: 'Harish Chandra Gupta', age: 62, gender: 'Male', hospitalId: 'H002', bloodGroup: 'B+', language: 'Hindi',
    phone: '+91 98807 23390', risk: 'High', score: 81,
    complaint: 'Chest tightness on climbing stairs, relieved by rest, for 2 weeks',
    vitals: ['146/90 mmHg', '84 bpm', '97%', '98.4°F', '78 kg', '27.6'],
    diagnoses: [['Essential Hypertension', '2012', 'Active'], ['Dyslipidemia', '2018', 'Active']],
    meds: [['Telmisartan 40mg', 'Once daily', '2012', 'Good'], ['Atorvastatin 10mg', 'Once daily (night)', '2018', 'Good']],
    labs: [['LDL Cholesterol', '128', 'mg/dL', '<70', 'High', 'Above target'], ['Troponin I', '<0.01', 'ng/mL', '<0.04', 'Normal', 'Single value']],
    summary: 'Exertional chest tightness relieved by rest over 2 weeks in a hypertensive, dyslipidaemic ex-smoker. Troponin negative. Presentation is typical of stable angina.',
    insights: [['Cardiovascular', 'High', 'Typical stable angina', 'Exertional, rest-relieved retrosternal tightness with multiple risk factors gives a high pre-test probability of coronary artery disease.', ['Exertional pattern', 'LDL 128 mg/dL', 'Hypertension', 'Ex-smoker']]],
    tests: ['Treadmill test (TMT)', '2D Echocardiogram', 'Fasting lipid profile'],
    ayurveda: ['Pitta-Kapha', 'Hridroga with Vyana Vata dushti', 'Vishama Agni', 'Madhyama', ['Arjuna', 'Pushkarmool']],
    profile: { smoking: 'Ex-smoker (quit 2019)' },
  },
  {
    id: 'P202', name: 'Lakshmi Prasad Reddy', age: 49, gender: 'Female', hospitalId: 'H002', bloodGroup: 'A-', language: 'Telugu',
    phone: '+91 90000 81274', risk: 'Moderate', score: 46,
    complaint: 'Palpitations and a racing heartbeat in episodes lasting 10–15 minutes',
    vitals: ['126/78 mmHg', '92 bpm', '99%', '98.6°F', '59 kg', '23.0'],
    labs: [['TSH', '0.2', 'mIU/L', '0.4–4.0', 'Low', 'First measurement'], ['Haemoglobin', '10.9', 'g/dL', '12–15', 'Low', 'First measurement']],
    summary: 'Paroxysmal palpitations with suppressed TSH and mild anaemia. Hyperthyroidism and anaemia are reversible contributors that should be excluded before labelling a primary arrhythmia.',
    insights: [['Endocrine', 'Moderate', 'Suppressed TSH — possible hyperthyroidism', 'Low TSH can cause sinus tachycardia and atrial arrhythmias. Free T4/T3 are needed.', ['TSH 0.2 mIU/L', 'Episodic palpitations']]],
    tests: ['Free T3 / Free T4', '24-hour Holter monitoring', 'Iron studies'],
    ayurveda: ['Vata', 'Hrid-drava with Vata prakopa', 'Vishama Agni', 'Krura', ['Jatamansi', 'Shankhpushpi']],
  },
  {
    id: 'P203', name: 'Joseph D’Souza', age: 58, gender: 'Male', hospitalId: 'H002', bloodGroup: 'O+', language: 'Konkani',
    phone: '+91 97417 60021', risk: 'Moderate', score: 55,
    complaint: 'Review after angioplasty (3 months) — no chest pain, mild fatigue',
    vitals: ['122/76 mmHg', '64 bpm', '98%', '98.2°F', '74 kg', '25.2'],
    diagnoses: [['Coronary Artery Disease (post-PCI)', '2026', 'Stable']],
    meds: [['Aspirin 75mg', 'Once daily', '2026', 'Good'], ['Clopidogrel 75mg', 'Once daily', '2026', 'Good'], ['Metoprolol 25mg', 'Twice daily', '2026', 'Good'], ['Rosuvastatin 20mg', 'Once daily', '2026', 'Good']],
    labs: [['LDL Cholesterol', '64', 'mg/dL', '<55', 'High', 'Improved from 142']],
    summary: 'Three months after PCI, asymptomatic apart from mild fatigue likely related to beta-blockade. On dual antiplatelet therapy. LDL has improved but remains above the post-ACS target.',
    alerts: [['Moderate', 'Bleeding Risk', 'Dual antiplatelet therapy — avoid NSAIDs and review any herbal supplements with antiplatelet effect.', 'Counsel on OTC painkillers']],
    tests: ['Lipid profile in 6 weeks', 'ECG 12-lead'],
    ayurveda: ['Kapha', 'Hridroga (post-procedure)', 'Mandagni', 'Madhyama', ['Arjuna (with caution on DAPT)']],
  },

  // ── H003 · Fortis Hospital — Obstetrics & Gynaecology ──
  {
    id: 'P301', name: 'Ananya Bose', age: 29, gender: 'Female', hospitalId: 'H003', bloodGroup: 'B+', language: 'Bengali',
    phone: '+91 98300 41562', risk: 'Moderate', score: 40,
    complaint: 'Antenatal visit at 24 weeks — mild headache and swelling of feet',
    vitals: ['138/88 mmHg', '88 bpm', '99%', '98.4°F', '66 kg', '25.0'],
    labs: [['Haemoglobin', '10.2', 'g/dL', '>11 (pregnancy)', 'Low', 'Down from 11.1'], ['Urine protein', 'Trace', '', 'Nil', 'Borderline', 'New']],
    summary: 'Primigravida at 24 weeks with borderline-high BP (138/88), headache, pedal oedema and trace proteinuria. Needs close monitoring for gestational hypertension / pre-eclampsia. Mild anaemia present.',
    insights: [['Obstetric', 'Moderate', 'Early warning for hypertensive disorder of pregnancy', 'BP near threshold with headache and trace proteinuria warrants repeat BP and urine protein quantification.', ['BP 138/88', 'Trace proteinuria', 'Headache']]],
    tests: ['Urine protein:creatinine ratio', 'Repeat BP in 1 week', 'Anomaly scan review'],
    ayurveda: ['Pitta-Kapha', 'Garbhini with Pandu tendency', 'Madhyama Agni', 'Madhyama', ['Punarnava mandur (after obstetric review)']],
  },
  {
    id: 'P302', name: 'Rekha Sinha', age: 51, gender: 'Female', hospitalId: 'H003', bloodGroup: 'A+', language: 'Hindi',
    phone: '+91 99311 20874', risk: 'Moderate', score: 50,
    complaint: 'Bleeding per vaginum after 14 months of menopause',
    vitals: ['130/84 mmHg', '78 bpm', '98%', '98.2°F', '71 kg', '28.4'],
    diagnoses: [['Hypertension', '2020', 'Active']],
    meds: [['Losartan 50mg', 'Once daily', '2020', 'Good']],
    summary: 'Post-menopausal bleeding 14 months after the last period in an overweight hypertensive woman. Endometrial pathology must be excluded.',
    insights: [['Gynaecology', 'High', 'Post-menopausal bleeding — exclude endometrial pathology', 'Any bleeding after 12 months of amenorrhoea requires endometrial thickness assessment and sampling if thickened.', ['14 months amenorrhoea', 'BMI 28.4', 'Hypertension']]],
    tests: ['Transvaginal ultrasound (endometrial thickness)', 'Endometrial biopsy if ET > 4 mm', 'CBC'],
    ayurveda: ['Kapha', 'Rakta pradara (post-menopausal)', 'Mandagni', 'Madhyama', ['Ashoka (only after malignancy excluded)']],
  },
  {
    id: 'P303', name: 'Divya Menon', age: 33, gender: 'Female', hospitalId: 'H003', bloodGroup: 'O+', language: 'Malayalam',
    phone: '+91 94470 88213', risk: 'Low', score: 20,
    complaint: 'Pre-conception counselling; history of irregular cycles',
    vitals: ['112/72 mmHg', '74 bpm', '99%', '98.4°F', '57 kg', '22.1'],
    labs: [['TSH', '3.1', 'mIU/L', '0.4–2.5 (pre-conception)', 'Borderline', 'First measurement'], ['Rubella IgG', 'Positive', '', 'Immune', 'Normal', '—']],
    summary: 'Healthy 33-year-old planning pregnancy. TSH is above the pre-conception target. Rubella immune.',
    tests: ['Anti-TPO antibodies', 'Folic acid 5mg review', 'Pelvic ultrasound'],
    ayurveda: ['Vata-Pitta', 'Artava vikara (mild)', 'Samagni', 'Madhyama', ['Phala ghrita (under supervision)']],
  },

  // ── H004 · NIMHANS Wellness Centre — Ayurveda & Integrative Medicine ──
  {
    id: 'P401', name: 'Gopal Krishna Bhat', age: 64, gender: 'Male', hospitalId: 'H004', bloodGroup: 'B+', language: 'Kannada',
    phone: '+91 94483 12097', risk: 'Moderate', score: 45,
    complaint: 'Chronic constipation, bloating and poor appetite for 8 months',
    vitals: ['128/82 mmHg', '72 bpm', '98%', '98.0°F', '60 kg', '21.8'],
    diagnoses: [['Benign Prostatic Hyperplasia', '2022', 'Active']],
    meds: [['Tamsulosin 0.4mg', 'Once daily (night)', '2022', 'Good'], ['Isabgol husk', 'At bedtime', '2025', 'Irregular']],
    labs: [['Haemoglobin', '11.8', 'g/dL', '13–17', 'Low', 'Down from 12.9'], ['Stool occult blood', 'Pending', '', 'Negative', 'Pending', '—']],
    summary: 'Elderly man with 8 months of constipation, bloating, reduced appetite and a falling haemoglobin. Change in bowel habit with anaemia after 60 needs colorectal evaluation alongside Ayurvedic management.',
    insights: [['Red flag', 'High', 'New bowel habit change with anaemia after age 60', 'Refer for colonoscopy before attributing symptoms to Vibandha alone.', ['Age 64', 'Hb 11.8 (falling)', '8 months duration', 'Reduced appetite']]],
    tests: ['Colonoscopy referral', 'Serum ferritin', 'Thyroid profile'],
    ayurveda: ['Vata', 'Vibandha with Apana Vata dushti', 'Mandagni', 'Krura', ['Triphala churna', 'Eranda taila (short course)', 'Hingvashtak churna']],
  },
  {
    id: 'P402', name: 'Shalini Hegde', age: 41, gender: 'Female', hospitalId: 'H004', bloodGroup: 'AB-', language: 'Kannada',
    phone: '+91 97419 55023', risk: 'Low', score: 28,
    complaint: 'Difficulty sleeping, anxiety and headaches for 3 months',
    vitals: ['120/78 mmHg', '80 bpm', '99%', '98.4°F', '62 kg', '24.2'],
    meds: [['Alprazolam 0.25mg', 'SOS at night', '2026', 'Frequent use noted']],
    summary: 'Three months of insomnia, anxiety and tension-type headaches with increasing self-directed benzodiazepine use. Suitable for integrative management with a plan to taper sedatives.',
    alerts: [['Moderate', 'Herb-Drug Interaction', 'Jatamansi and Tagara have sedative effects and may be additive with Alprazolam.', 'Avoid combining; plan taper first']],
    tests: ['Thyroid profile', 'PHQ-9 / GAD-7 screening'],
    ayurveda: ['Vata', 'Anidra with Manas Vata prakopa', 'Vishama Agni', 'Krura', ['Brahmi', 'Shankhpushpi', 'Ksheerabala taila (external)']],
  },
  {
    id: 'P403', name: 'Ramesh Patil', age: 52, gender: 'Male', hospitalId: 'H004', bloodGroup: 'O+', language: 'Marathi',
    phone: '+91 98220 47716', risk: 'Moderate', score: 42,
    complaint: 'Lower back pain radiating to left leg for 5 weeks',
    vitals: ['134/86 mmHg', '78 bpm', '98%', '98.2°F', '84 kg', '28.9'],
    diagnoses: [['Type 2 Diabetes Mellitus', '2020', 'Active']],
    meds: [['Metformin 500mg', 'Twice daily', '2020', 'Good'], ['Aceclofenac 100mg', 'Twice daily', '2026', 'Frequent use noted']],
    labs: [['HbA1c', '7.2', '%', '<7.0', 'High', 'Stable']],
    summary: 'Five weeks of lumbar pain with left-sided radicular symptoms, no bladder or bowel involvement reported. Regular NSAID use in a diabetic patient.',
    alerts: [['Moderate', 'Drug Safety', 'Regular NSAID (Aceclofenac) in a diabetic patient — check renal function before continuing.', 'Order serum creatinine; limit duration']],
    tests: ['MRI lumbosacral spine (if no improvement in 2 weeks)', 'Serum creatinine'],
    ayurveda: ['Vata-Kapha', 'Gridhrasi (sciatica)', 'Mandagni', 'Madhyama', ['Yogaraj guggulu', 'Dashamoola kashaya', 'Mahanarayana taila (external)']],
  },
];

// Days-ago offset used for each compact patient's most recent lab date.
const LAB_OFFSET: Record<string, number> = { P103: 1, P105: 5, P201: 0, P203: 3, P401: 2 };

export const DEMO_PATIENTS: Patient[] = SPECS.map((s) => compactPatient(s, LAB_OFFSET[s.id] ?? 0));

interface PlannedVisit {
  daysAgo: number;
  time: string;
  type: Consultation['type'];
  // Today's visits already closed earlier in the day.
  done?: boolean;
  reason?: string;
}

const VISIT_PLAN: Record<string, PlannedVisit[]> = {
  // H001
  P001: [
    { daysAgo: 0, time: '09:40', type: 'Follow-up' },
    { daysAgo: 12, time: '11:20', type: 'Follow-up', reason: 'Diabetes and blood pressure review' },
    { daysAgo: 26, time: '10:05', type: 'New', reason: 'Fatigue and knee pain' },
  ],
  P002: [
    { daysAgo: 0, time: '10:15', type: 'Follow-up' },
    { daysAgo: 20, time: '12:30', type: 'New', reason: 'Irregular periods and weight gain' },
  ],
  P101: [{ daysAgo: 0, time: '09:05', type: 'New', done: true }],
  P102: [{ daysAgo: 0, time: '11:00', type: 'New' }],
  P103: [
    { daysAgo: 1, time: '16:10', type: 'New' },
    { daysAgo: 4, time: '10:40', type: 'Follow-up', reason: 'Blood sugar review' },
  ],
  P104: [{ daysAgo: 2, time: '15:25', type: 'New' }],
  P105: [
    { daysAgo: 5, time: '09:30', type: 'Follow-up' },
    { daysAgo: 35, time: '09:50', type: 'Follow-up', reason: 'Diabetes review' },
  ],
  // H002
  P003: [{ daysAgo: 0, time: '09:05', type: 'Follow-up' }],
  P201: [{ daysAgo: 0, time: '10:30', type: 'New' }],
  P202: [{ daysAgo: 0, time: '08:50', type: 'New', done: true }, { daysAgo: 9, time: '12:10', type: 'New', reason: 'Fatigue' }],
  P203: [{ daysAgo: 3, time: '11:45', type: 'Follow-up' }, { daysAgo: 92, time: '09:00', type: 'New', reason: 'Acute chest pain — referred for PCI' }],
  // H003
  P301: [{ daysAgo: 0, time: '10:00', type: 'Follow-up' }, { daysAgo: 28, time: '10:20', type: 'Follow-up', reason: 'Antenatal visit (20 weeks)' }],
  P302: [{ daysAgo: 1, time: '14:30', type: 'New' }],
  P303: [{ daysAgo: 6, time: '12:00', type: 'New' }],
  // H004
  P401: [{ daysAgo: 0, time: '11:30', type: 'Follow-up' }, { daysAgo: 14, time: '11:00', type: 'New', reason: 'Constipation and bloating' }],
  P402: [{ daysAgo: 0, time: '09:20', type: 'New', done: true }],
  P403: [{ daysAgo: 2, time: '17:00', type: 'New' }, { daysAgo: 8, time: '16:15', type: 'New', reason: 'Back pain' }],
};

// Builds the doctor's consultation register from the hospital's patients.
// A visit counts as completed once a prescription exists for that patient on
// that date; past visits in the demo plan are treated as already closed.
export function buildConsultationRegister(patients: Patient[], today: Date = new Date()): Consultation[] {
  const todayIso = isoDaysAgo(0, today);
  const register: Consultation[] = [];

  for (const p of patients) {
    const plan = VISIT_PLAN[p.id] ?? [{ daysAgo: dayDiff(p.lastVisit, todayIso), time: '12:00', type: 'New' as const }];
    plan.forEach((v, i) => {
      const date = isoDaysAgo(v.daysAgo, today);
      const hasRx = p.prescriptions.some((rx) => rx.date === date);
      register.push({
        id: `OPD-${date.replace(/-/g, '').slice(2)}-${p.id}-${i}`,
        patientId: p.id,
        date,
        time: v.time,
        type: v.type,
        reason: v.reason ?? p.chiefComplaint,
        status: hasRx || v.done || date < todayIso ? 'Completed' : 'Awaiting review',
      });
    });
  }

  return register.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : b.date.localeCompare(a.date)));
}

function dayDiff(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Number.isFinite(ms) ? Math.max(0, Math.round(ms / 86400000)) : 0;
}
