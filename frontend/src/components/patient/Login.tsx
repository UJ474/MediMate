import React, { useState } from 'react';
import './login.css';
import { useLanguage } from '../../i18n/LanguageContext';
import { Phone, Fingerprint, IdCard, ShieldCheck } from 'lucide-react';
import { BiometricScanner } from '../common/BiometricScanner';
import { GovSeal } from '../common/GovSeal';

type AuthTab = 'login' | 'register';
type AuthMethod = 'phone' | 'aadhaar' | 'abha' | 'biometric';

interface LoginProps {
  // Returns false when no matching patient record exists, so the form can say so.
  onAuthenticated: (identity: { method: AuthMethod; value: string; tab: AuthTab }) => boolean;
  onBack: () => void;
}

export const Login: React.FC<LoginProps> = ({ onAuthenticated, onBack }) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<AuthTab>('login');
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [idValue, setIdValue] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const submitIdentity = (identity: { method: AuthMethod; value: string; tab: AuthTab }) => {
    setNotFound(!onAuthenticated(identity));
  };

  const methods: Array<{ key: AuthMethod; icon: React.ReactNode; label: string }> = [
    { key: 'phone', icon: <Phone size={18} />, label: t('login.method.phone') },
    { key: 'aadhaar', icon: <IdCard size={18} />, label: t('login.method.aadhaar') },
    { key: 'abha', icon: <ShieldCheck size={18} />, label: t('login.method.abha') },
    { key: 'biometric', icon: <Fingerprint size={18} />, label: t('login.method.biometric') },
  ];

  const fieldLabel =
    method === 'phone' ? t('login.field.phone') : method === 'aadhaar' ? t('login.field.aadhaar') : t('login.field.abha');

  const resetForMethod = (m: AuthMethod) => {
    setMethod(m);
    setIdValue('');
    setOtp('');
    setOtpSent(false);
    setNotFound(false);
  };


  return (
    <div className="login-page">
      <div className="login-card">
        <button className="login-back-link" onClick={onBack}>
          {t('login.back')}
        </button>
        <div className="login-emblem-row">
          <GovSeal size={44} />
          <div>
            <div className="login-hospital-name">{t('brand.name')} · {t('gov.ministry')}</div>
            <div className="login-hospital-sub">{t('brand.tagline')}</div>
          </div>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setNotFound(false); }}>
            {t('login.tab.login')}
          </button>
          <button className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setNotFound(false); }}>
            {t('login.tab.register')}
          </button>
        </div>

        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>

        {/* Identity method selector — always on top, per ABDM guidance */}
        <div className="method-grid">
          {methods.map((m) => (
            <button
              key={m.key}
              className={`method-btn ${method === m.key ? 'selected' : ''}`}
              onClick={() => resetForMethod(m.key)}
              type="button"
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {method !== 'biometric' ? (
          <div className="login-form">
            <label className="login-field-label" htmlFor="id-value">
              {fieldLabel}
            </label>
            <input
              id="id-value"
              className="login-input"
              type="text"
              inputMode={method === 'phone' ? 'numeric' : 'text'}
              placeholder={method === 'phone' ? '10-digit mobile number' : method === 'aadhaar' ? 'XXXX XXXX XXXX' : 'name@abdm'}
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
            />

            {!otpSent ? (
              <button
                className="login-btn-primary"
                disabled={!idValue.trim()}
                onClick={() => setOtpSent(true)}
              >
                {t('login.action.sendOtp')}
              </button>
            ) : (
              <>
                <div className="otp-confirm-banner">✓ {t('login.otpSent')}</div>
                <label className="login-field-label" htmlFor="otp-value">
                  {t('login.field.otp')}
                </label>
                <input
                  id="otp-value"
                  className="login-input otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button
                  className="login-btn-primary"
                  disabled={otp.trim().length < 4}
                  onClick={() => submitIdentity({ method, value: idValue, tab })}
                >
                  {t('login.action.verify')}
                </button>
              </>
            )}
          </div>
        ) : (
          <BiometricScanner
            key={tab}
            labels={{
              hint: t('login.biometric.hint'),
              scan: t('login.biometric.scan'),
              scanning: t('login.biometric.scanning'),
              place: t('login.biometric.place'),
              verified: t('login.biometric.verified'),
            }}
            onVerified={() => submitIdentity({ method: 'biometric', value: 'BIO-VERIFIED', tab })}
          />
        )}

        {notFound && <div className="login-error-banner">{t('login.notFound')}</div>}

        <div className="login-footer-note">{t('login.helpline')}</div>
      </div>
    </div>
  );
};
