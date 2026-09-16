import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Landing } from './components/Landing';
import { PatientPortal } from './components/patient/PatientPortal';
import { PatientHome } from './components/patient/PatientHome';
import { DoctorDashboard } from './components/doctor/DoctorDashboard';
import { DoctorLogin } from './components/doctor/DoctorLogin';
import { Login } from './components/patient/Login';
import { MOCK_PATIENTS, MOCK_DOCTORS, MOCK_HOSPITALS } from './data/mockPatients';
import { DEMO_PATIENTS, buildConsultationRegister } from './data/opdRegister';
import { withDemoRecords } from './data/demoRecords';
import { loadPatientDb, savePatientDb, newPatientId } from './services/db';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import type { Doctor, Patient, Prescription, Session } from './types';
import { Landmark, Lock, Phone } from 'lucide-react';

type AuthMethod = 'phone' | 'aadhaar' | 'abha' | 'biometric';

// Screens before sign-in. After sign-in the session decides what is rendered,
// so a patient can never reach doctor views and vice versa.
type PublicScreen = 'LANDING' | 'PATIENT_LOGIN' | 'DOCTOR_LOGIN';

const DOCTORS = MOCK_DOCTORS as Doctor[];

// Seed records: the original demo patients plus each hospital's OPD register patients.
const SEED_PATIENTS: Patient[] = [...(MOCK_PATIENTS as unknown as Patient[]), ...DEMO_PATIENTS];

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

function buildRegisteredPatient(identity: { method: AuthMethod; value: string }): Patient {
  const template = MOCK_PATIENTS[0] as unknown as Patient;
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...template,
    id: newPatientId(),
    name: 'New Patient',
    age: 0,
    gender: '—',
    bloodGroup: '—',
    avatar: '',
    phone: identity.method === 'phone' ? identity.value : '',
    aadhaar: identity.method === 'aadhaar' ? digitsOf(identity.value) : undefined,
    abha: identity.method === 'abha' ? identity.value : `ABHA-PENDING-${digitsOf(identity.value).slice(-4) || '0000'}`,
    hospitalId: '',
    riskLevel: 'Low',
    riskScore: 0,
    lastVisit: today,
    chiefComplaint: 'Pending intake interview',
    vitals: { bp: '—', pulse: '—', spo2: '—', temp: '—', weight: '—', height: '—', bmi: '—' },
    diagnoses: [],
    medications: [],
    allergies: [],
    labs: [],
    documents: [],
    prescriptions: [],
    timeline: [{ date: today, event: `Registered via ${identity.method}`, type: 'registration' }],
    aiInsights: { summary: '', keyInsights: [], safetyAlerts: [], recommendedTests: [] },
  };
}

function findExistingPatient(patients: Patient[], identity: { method: AuthMethod; value: string }): Patient | undefined {
  if (identity.method === 'biometric') {
    // Kiosk demo: the simulated fingerprint resolves to the first seeded record.
    return patients.find((p) => p.id === 'P001') ?? patients[0];
  }
  if (identity.method === 'abha') {
    return patients.find((p) => p.abha.toLowerCase() === identity.value.trim().toLowerCase());
  }
  const digits = digitsOf(identity.value);
  if (digits.length < 10) return undefined;
  if (identity.method === 'aadhaar') {
    return patients.find((p) => p.aadhaar === digits);
  }
  return patients.find((p) => digitsOf(p.phone).endsWith(digits.slice(-10)));
}

function AppShell() {
  const { dir } = useLanguage();
  const [patients, setPatients] = useState<Patient[]>(() =>
    // Demo intake interviews and past history are merged in, including into records restored from storage.
    loadPatientDb(SEED_PATIENTS).map(withDemoRecords)
  );
  const [screen, setScreen] = useState<PublicScreen>('LANDING');
  const [session, setSession] = useState<Session | null>(null);

  // Patient-side view state
  const [patientView, setPatientView] = useState<'HOME' | 'CONSULTATION'>('HOME');
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    savePatientDb(patients);
  }, [patients]);

  const sessionPatient = session?.role === 'patient' ? patients.find((p) => p.id === session.patientId) : undefined;
  const sessionDoctor = session?.role === 'doctor' ? DOCTORS.find((d) => d.id === session.doctorId) : undefined;

  const hospitalPatients = useMemo(
    () => (sessionDoctor ? patients.filter((p) => p.hospitalId === sessionDoctor.hospitalId) : []),
    [patients, sessionDoctor]
  );
  const consultationRegister = useMemo(() => buildConsultationRegister(hospitalPatients), [hospitalPatients]);

  const logout = () => {
    setSession(null);
    setScreen('LANDING');
    setPatientView('HOME');
    setJustSubmitted(false);
  };

  const handlePatientAuthenticated = (identity: { method: AuthMethod; value: string; tab: 'login' | 'register' }): boolean => {
    let patient = findExistingPatient(patients, identity);
    if (identity.tab === 'register' && !patient) {
      patient = buildRegisteredPatient(identity);
      const created = patient;
      setPatients((prev) => [created, ...prev]);
    }
    if (!patient) return false;
    setSession({ role: 'patient', patientId: patient.id });
    setPatientView(identity.tab === 'register' ? 'CONSULTATION' : 'HOME');
    return true;
  };

  const handleConsultationSubmitted = (updated: Patient) => {
    setPatients((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setPatientView('HOME');
    setJustSubmitted(true);
  };

  const handleIssuePrescription = (patientId: string, prescription: Prescription) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? {
              ...p,
              prescriptions: [prescription, ...p.prescriptions],
              timeline: [
                { date: prescription.date, event: `Prescription issued by ${prescription.doctorName}`, type: 'prescription' },
                ...p.timeline,
              ],
            }
          : p
      )
    );
  };

  const signedIn = sessionPatient
    ? { role: 'patient' as const, name: sessionPatient.name, detail: sessionPatient.abha }
    : sessionDoctor
      ? {
          role: 'doctor' as const,
          name: sessionDoctor.name,
          detail: MOCK_HOSPITALS.find((h) => h.id === sessionDoctor.hospitalId)?.name ?? sessionDoctor.hospital,
        }
      : null;

  const renderContent = () => {
    if (sessionPatient) {
      return patientView === 'CONSULTATION' ? (
        <PatientPortal
          key={sessionPatient.id}
          patient={sessionPatient}
          onConsultationSubmitted={handleConsultationSubmitted}
          onExit={() => setPatientView('HOME')}
        />
      ) : (
        <PatientHome
          patient={sessionPatient}
          justSubmitted={justSubmitted}
          onStartConsultation={() => {
            setJustSubmitted(false);
            setPatientView('CONSULTATION');
          }}
          // onUploadReports={onUploadReports}
        />
      );
    }

    if (sessionDoctor) {
      if (hospitalPatients.length === 0) {
        return (
          <div className="doctor-empty-state" dir="ltr">
            <h3>No patients at {signedIn?.detail} yet</h3>
            <p>Patients appear here once they select this hospital during their consultation intake.</p>
          </div>
        );
      }
      return (
        <DoctorDashboard
          doctor={sessionDoctor}
          patients={hospitalPatients}
          register={consultationRegister}
          onIssuePrescription={handleIssuePrescription}
        />
      );
    }

    switch (screen) {
      case 'PATIENT_LOGIN':
        return <Login onAuthenticated={handlePatientAuthenticated} onBack={() => setScreen('LANDING')} />;
      case 'DOCTOR_LOGIN':
        return (
          <DoctorLogin
            onAuthenticated={(doctor) => setSession({ role: 'doctor', doctorId: doctor.id })}
            onBack={() => setScreen('LANDING')}
          />
        );
      default:
        return <Landing onChooseRole={(role) => setScreen(role === 'patient' ? 'PATIENT_LOGIN' : 'DOCTOR_LOGIN')} />;
    }
  };

  return (
    <div className="app-container">
      <Header
        signedIn={signedIn}
        onLogout={logout}
        onBrandClick={() => {
          if (!session) setScreen('LANDING');
          else if (sessionPatient) setPatientView('HOME');
        }}
      />

      <div className="main-viewport" id="main-content" tabIndex={-1} dir={sessionDoctor ? 'ltr' : dir}>
        {renderContent()}
      </div>

      <footer className="gov-footer">
        <div className="gov-footer-inner">
          <div>
            <strong>MediMate</strong> — National Digital Health Intake Service, operated under the Ayushman Bharat Digital Mission (ABDM).
          </div>
          <div className="gov-footer-links">
            <span><Lock size={14} aria-hidden="true" /> ABDM Compliant</span>
            <span><Landmark size={14} aria-hidden="true" /> Ministry of Health &amp; Family Welfare</span>
            <span><Phone size={14} aria-hidden="true" /> Helpline: 1800-11-4477</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  );
}
