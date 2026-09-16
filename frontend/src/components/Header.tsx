import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import { User, Stethoscope, LogOut, Phone } from 'lucide-react';
import { GovSeal } from './common/GovSeal';

interface HeaderProps {
  // Who is signed in, if anyone. Patients and doctors never share a header view.
  signedIn: { role: 'patient' | 'doctor'; name: string; detail: string } | null;
  onLogout: () => void;
  onBrandClick: () => void;
}

const FONT_STEPS = ['14px', '16px', '18px'];

export const Header: React.FC<HeaderProps> = ({ signedIn, onLogout, onBrandClick }) => {
  const { t, lang, setLang } = useLanguage();
  const [fontStep, setFontStep] = useState(1);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_STEPS[fontStep];
  }, [fontStep]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        {t('gov.skip')}
      </a>

      {/* Government identifier bar */}
      <div className="gov-topbar">
        <div className="gov-topbar-inner">
          <div className="gov-topbar-left">
            <span lang="hi">भारत सरकार</span>
            <span className="gov-topbar-sep" aria-hidden="true" />
            <span>Government of India</span>
          </div>
          <div className="gov-topbar-right">
            <a href="#main-content" className="gov-topbar-link">
              {t('gov.skip')}
            </a>
            <span className="gov-topbar-sep" aria-hidden="true" />
            <div className="font-size-controls" role="group" aria-label="Text size">
              <button onClick={() => setFontStep(0)} className={fontStep === 0 ? 'active' : ''} aria-label="Decrease text size">
                A-
              </button>
              <button onClick={() => setFontStep(1)} className={fontStep === 1 ? 'active' : ''} aria-label="Normal text size">
                A
              </button>
              <button onClick={() => setFontStep(2)} className={fontStep === 2 ? 'active' : ''} aria-label="Increase text size">
                A+
              </button>
            </div>
            <span className="gov-topbar-sep" aria-hidden="true" />
            <select
              className="lang-switch-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              aria-label="Select language / भाषा चुनें"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.native}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header className="gov-masthead">
        <div className="nav-inner">
          <button className="brand-section" onClick={onBrandClick}>
            <GovSeal size={58} />
            <span className="brand-info">
              <span className="brand-ministry">
                <span lang="hi">आयुष मंत्रालय</span> · Ministry of Ayush
              </span>
              <span className="brand-name">{t('brand.name')}</span>
              <span className="brand-tagline">{t('brand.tagline')}</span>
            </span>
          </button>

          <div className="nav-actions">
            {signedIn ? (
              <>
                <div className="session-chip" title={signedIn.detail}>
                  {signedIn.role === 'doctor' ? <Stethoscope size={16} /> : <User size={16} />}
                  <div className="session-chip-text">
                    <span className="session-chip-name">{signedIn.name}</span>
                    <span className="session-chip-detail">{signedIn.detail}</span>
                  </div>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                  <LogOut size={15} />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            ) : (
              <div className="masthead-helpline">
                <Phone size={18} />
                <div>
                  <span>{t('gov.helpline')}</span>
                  <strong>1800-11-4477</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="gov-strip" />
    </>
  );
};
