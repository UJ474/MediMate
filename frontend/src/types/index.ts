export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  abha: string;
  aadhaar?: string;
  hospitalId: string;
  bloodGroup: string;
  language: string;
  avatar: string;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  riskScore: number;
  lastVisit: string;
  chiefComplaint: string;
  vitals: {
    bp: string;
    pulse: string;
    spo2: string;
    temp: string;
    weight: string;
    height: string;
    bmi: string;
  };
  profile: {
    occupation: string;
    diet: string;
    smoking: string;
    alcohol: string;
    physicalActivity: string;
    sleep: string;
    stress: string;
  };
  diagnoses: Array<{
    name: string;
    since: string;
    status: string;
    severity: string;
  }>;
  medications: Array<{
    name: string;
    frequency: string;
    since: string;
    adherence: string;
  }>;
  allergies: Array<{
    substance: string;
    reaction: string;
    severity: string;
  }>;
  labs: Array<{
    date: string;
    type: string;
    value: string;
    unit: string;
    reference: string;
    status: string;
    trend: string;
  }>;
  timeline: Array<{
    date: string;
    event: string;
    type: string;
  }>;
  ayurvedicContext: {
    prakriti: string;
    currentImbalance: string;
    agni: string;
    koshtha: string;
    previousAyurvedicTreatment: string;
    relevantHerbs: string[];
  };
  aiInsights: {
    summary: string;
    keyInsights: Array<{
      category: string;
      severity: string;
      icon: string;
      title: string;
      detail: string;
      evidence: string[];
    }>;
    safetyAlerts: Array<{
      severity: string;
      type: string;
      message: string;
      action: string;
    }>;
    recommendedTests: string[];
  };
  // Files the patient uploaded themselves — visible to the patient and to doctors at the patient's hospital.
  documents: PatientDocument[];
  // Prescriptions issued by a doctor after sign-off — the only clinical output the patient can see.
  prescriptions: Prescription[];
}

export interface PatientDocument {
  id: string;
  name: string;
  size: string;
  category: string;
  uploadedOn: string;
  extracted: string;
}

export interface Prescription {
  id: string;
  date: string;
  doctorName: string;
  doctorSpecialty: string;
  hospitalName: string;
  medicines: string[];
  tests: string[];
  notes: string;
  // Structured fields added by the practitioner prescription pad. Older records may not have them.
  diagnosis?: string;
  followUp?: string;
  doctorRegNo?: string;
  // Electronic signature block: signer, time and a SHA-256 digest of the prescription content.
  signature?: {
    signedBy: string;
    signedAt: string;
    digest: string;
  };
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  hospitalId: string;
  experience: string;
  rating: number;
  avatar: string;
  available: boolean;
  nextSlot: string;
  // Identities a practitioner can sign in with.
  abha: string;
  aadhaar: string;
  phone: string;
  registrationNo: string;
  qualification: string;
}

// One OPD visit in a doctor's consultation register.
export interface Consultation {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'New' | 'Follow-up';
  reason: string;
  status: 'Awaiting review' | 'Completed';
}

export type Session =
  | { role: 'patient'; patientId: string }
  | { role: 'doctor'; doctorId: string };
