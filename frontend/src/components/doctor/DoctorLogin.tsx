import React, { useState } from 'react';
import '../patient/login.css';
import type { Doctor } from '../../types';
import { MOCK_DOCTORS, MOCK_HOSPITALS } from '../../data/mockPatients';
import { useLanguage } from '../../i18n/LanguageContext';
import { Phone, Fingerprint, IdCard, ShieldCheck } from 'lucide-react';
import { BiometricScanner } from '../common/BiometricScanner';
import { GovSeal } from '../common/GovSeal';

interface DoctorLoginProps {
  onAuthenticated: (doctor: Doctor) => void;
  onBack: () => void;
}

type Method = 'abha' | 'aadhaar' | 'phone' | 'biometric';

const DOCTORS = MOCK_DOCTORS as Doctor[];

const alnum = (v: string) => v.replace(/[^a-z0-9]/gi, '').toLowerCase();
const digits = (v: string) => v.replace(/\D/g, '');

function findDoctor(method: Method, value: string): Doctor | undefined {
  switch (method) {
    case 'abha':
      return DOCTORS.find((d) => alnum(d.abha) === alnum(value));
    case 'aadhaar':
      return DOCTORS.find((d) => d.aadhaar === digits(value));
    case 'phone': {
      const last10 = digits(value).slice(-10);
      return last10.length === 10 ? DOCTORS.find((d) => digits(d.phone).endsWith(last10)) : undefined;
    }
    default:
      // Kiosk demo: the simulated fingerprint resolves to the first registered practitioner.
      return DOCTORS[0];
  }
}

const METHODS: Array<{ key: Method; icon: React.ReactNode; label: string; field: string; placeholder: string }> = [
  { key: 'abha', icon: <ShieldCheck size={18} />, label: 'ABHA ID', field: 'ABHA Number', placeholder: '91-XXXX-XXXX-XXXX' },
  { key: 'aadhaar', icon: <IdCard size={18} />, label: 'Aadhaar', field: 'Aadhaar Number', placeholder: 'XXXX XXXX XXXX' },
  { key: 'phone', icon: <Phone size={18} />, label: 'Mobile', field: 'Registered Mobile Number', placeholder: '10-digit mobile number' },
  { key: 'biometric', icon: <Fingerprint size={18} />, label: 'Biometric', field: '', placeholder: '' },
];

// Practitioner sign-in. The identity decides the doctor and therefore the
// hospital, so a doctor only ever sees patients registered at that hospital.
export const DoctorLogin: React.FC<DoctorLoginProps> = ({ onAuthenticated, onBack }) => {
  const { t } = useLanguage();
  const [method, setMethod] = useState<Method>('abha');
  const [idValue, setIdValue] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSentTo, setOtpSentTo] = useState<Doctor | null>(null);
  const [error, setError] = useState('');

  const current = METHODS.find((m) => m.key === method)!;

  const selectMethod = (m: Method) => {
    setMethod(m);
    setIdValue('');
    setOtp('');
    setOtpSentTo(null);
    setError('');
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const doctor = findDoctor(method, idValue);
    if (!doctor) {
      setError(`No registered practitioner found for this ${current.label}.`);
      return;
    }
    setOtpSentTo(doctor);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSentTo && otp.trim().length >= 4) onAuthenticated(otpSentTo);
  };

  return (
    <div className="login-page">
      <div className="login-card" dir="ltr">
        <button type="button" className="login-back-link" onClick={onBack}>
          {t('login.back')}
        </button>

        <div className="login-emblem-row">
          <GovSeal size={44} />
          <div>
            <div className="login-hospital-name">Practitioner Login</div>
            <div className="login-hospital-sub">MediMate · Ministry of Ayush, Government of India</div>
          </div>
        </div>

        <p className="login-subtitle">Sign in with any identity linked to your practitioner registration.</p>

        <div className="method-grid" role="tablist">
          {METHODS.map((m) => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={method === m.key}
              className={`method-btn ${method === m.key ? 'selected' : ''}`}
              onClick={() => selectMethod(m.key)}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {method === 'biometric' ? (
          <BiometricScanner
            labels={{
              hint: 'Place your registered finger on the scanner, or tap below to simulate verification.',
              scan: 'Tap to scan fingerprint',
              scanning: 'Scanning fingerprint…',
              place: 'Keep your finger on the scanner',
              verified: 'Fingerprint verified',
            }}
            onVerified={() => {
              const doctor = findDoctor('biometric', '');
              if (doctor) onAuthenticated(doctor);
            }}
          />
        ) : !otpSentTo ? (
          <form className="login-form" onSubmit={sendOtp}>
            <label className="login-field-label" htmlFor="doc-id">
              {current.field}
            </label>
            <input
              id="doc-id"
              className="login-input"
              inputMode={method === 'abha' ? 'text' : 'numeric'}
              autoComplete="off"
              placeholder={current.placeholder}
              value={idValue}
              onChange={(e) => {
                setIdValue(e.target.value);
                setError('');
              }}
            />
            <button type="submit" className="login-btn-primary" disabled={!idValue.trim()}>
              Send OTP
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={verifyOtp}>
            <div className="otp-confirm-banner">
              ✓ OTP sent to the mobile number registered with {current.label} ending{' '}
              {digits(otpSentTo.phone).slice(-4)}
            </div>
            <label className="login-field-label" htmlFor="doc-otp">
              Enter OTP
            </label>
            <input
              id="doc-otp"
              className="login-input otp-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
            />
            <button type="submit" className="login-btn-primary" disabled={otp.trim().length < 4}>
              Verify &amp; Sign In
            </button>
            <button type="button" className="login-back-link" onClick={() => selectMethod(method)}>
              Use a different {current.label}
            </button>
          </form>
        )}

        {error && <div className="login-error-banner">{error}</div>}

        <details className="login-demo-hint">
          <summary>
            <strong>Demo practitioner accounts</strong> (any 4+ digit OTP)
          </summary>
          <table className="demo-accounts">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>ABHA</th>
                <th>Aadhaar</th>
                <th>Mobile</th>
              </tr>
            </thead>
            <tbody>
              {DOCTORS.map((d) => (
                <tr key={d.id}>
                  <td>
                    {d.name}
                    <div>{MOCK_HOSPITALS.find((h) => h.id === d.hospitalId)?.name}</div>
                  </td>
                  <td>
                    <code>{d.abha}</code>
                  </td>
                  <td>
                    <code>{d.aadhaar}</code>
                  </td>
                  <td>
                    <code>{d.phone}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>Biometric signs in as {DOCTORS[0].name}.</div>
        </details>

        <div className="login-footer-note">Need help? Call the ABDM Helpline: 1800-11-4477</div>
      </div>
    </div>
  );
};
