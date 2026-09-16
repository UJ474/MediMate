import React from 'react';
import './landing.css';
import { useLanguage } from '../i18n/LanguageContext';
import { LANGUAGES } from '../i18n/translations';
import {
  User, Stethoscope, ChevronRight, UserPlus, MessageSquareText, UploadCloud, FileSignature,
  LayoutDashboard, ShieldCheck, Phone, Clock, Building2,
} from 'lucide-react';

interface LandingProps {
  onChooseRole: (role: 'patient' | 'doctor') => void;
}

// Public home page — modern, clean layout with hero + login below it.
export const Landing: React.FC<LandingProps> = ({ onChooseRole }) => {
  const { t, lang, setLang } = useLanguage();

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const challenges = [
    { problem: t('hero.p1'), solution: t('hero.s1') },
    { problem: t('hero.p2'), solution: t('hero.s2') },
    { problem: t('hero.p3'), solution: t('hero.s3') },
  ];

  const services: Array<{ icon: React.ReactNode; title: string; desc: string; role: 'patient' | 'doctor' }> = [
    { icon: <UserPlus size={26} />, title: t('svc.register.t'), desc: t('svc.register.d'), role: 'patient' },
    { icon: <MessageSquareText size={26} />, title: t('svc.interview.t'), desc: t('svc.interview.d'), role: 'patient' },
    { icon: <UploadCloud size={26} />, title: t('svc.upload.t'), desc: t('svc.upload.d'), role: 'patient' },
    { icon: <FileSignature size={26} />, title: t('svc.rx.t'), desc: t('svc.rx.d'), role: 'patient' },
    { icon: <LayoutDashboard size={26} />, title: t('svc.doctor.t'), desc: t('svc.doctor.d'), role: 'doctor' },
    { icon: <ShieldCheck size={26} />, title: t('svc.abha.t'), desc: t('svc.abha.d'), role: 'patient' },
  ];

  return (
    <div className="gov-home" id="top">
      {/* ─── Hero section with background image ─── */}
      <section className="landing-hero">
        <figure className="home-banner">
          <img src="/waiting-hall.jpg" alt={t('hero.imageAlt')} />
          <figcaption>
            <h1>{t('hero.title')}</h1>
            <p>{t('hero.sub')}</p>
          </figcaption>
          <a
            className="home-banner-credit"
            href="https://commons.wikimedia.org/wiki/File:Waiting_Hall_(OPD)_Sir_Sunderlal_Hospital,_Banaras_Hindu_University.png"
            target="_blank"
            rel="noreferrer"
          >
            Photo: User4edits, CC BY-SA 4.0
          </a>
        </figure>

        {/* ─── Login area directly below the hero image ─── */}
        <div className="landing-login-section" aria-labelledby="signin-title">
          <h2 id="signin-title">{t('landing.signin')}</h2>
          <p className="landing-login-desc">{t('landing.signinDesc')}</p>

          <div className="landing-login-lang-row">
            <span className="signin-label">{t('landing.language')}</span>
            <div className="signin-langs">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  className={lang === l.code ? 'selected' : ''}
                  onClick={() => setLang(l.code)}
                  lang={l.code}
                  aria-pressed={lang === l.code}
                >
                  {l.native}
                </button>
              ))}
            </div>
          </div>

          <div className="landing-login-buttons">
            <button className="landing-login-btn primary" onClick={() => onChooseRole('patient')}>
              <User size={40} />
              <span>{t('landing.patientLogin')}</span>
            </button>
            <button className="landing-login-btn" onClick={() => onChooseRole('doctor')}>
              <Stethoscope size={40} />
              <span>{t('landing.doctorLogin')}</span>
            </button>
          </div>

          <p className="signin-foot">{t('landing.loginMethods')}</p>
        </div>
      </section>

      {/* ─── About section ─── */}
      <section id="about" className="gov-panel">
        <h2 className="gov-panel-title">{t('landing.about.title')}</h2>
        <div className="gov-panel-body">
          <p>{t('hero.lead')}</p>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('landing.col.challenge')}</th>
                <th>{t('landing.col.solution')}</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c, i) => (
                <tr key={i}>
                  <td>{c.problem}</td>
                  <td>{c.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Services ─── */}
      <section id="services" className="gov-panel">
        <h2 className="gov-panel-title">{t('landing.services.title')}</h2>
        <div className="service-grid">
          {services.map((s) => (
            <button key={s.title} className="service-tile" onClick={() => onChooseRole(s.role)}>
              <span className="service-icon">{s.icon}</span>
              <span className="service-title">{s.title}</span>
              <span className="service-desc">{s.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="gov-panel">
        <h2 className="gov-panel-title">{t('landing.how.title')}</h2>
        <div className="how-grid">
          {[
            { title: t('landing.how.patient'), steps: [t('how.p1'), t('how.p2'), t('how.p3'), t('how.p4')] },
            { title: t('landing.how.doctor'), steps: [t('how.d1'), t('how.d2'), t('how.d3'), t('how.d4')] },
          ].map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              <ol className="how-steps">
                {col.steps.map((step, i) => (
                  <li key={i}>
                    <span className="how-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Help / Contact ─── */}
      <section id="help" className="gov-panel">
        <h2 className="gov-panel-title">{t('landing.help.title')}</h2>
        <div className="help-grid">
          <div className="help-item">
            <Phone size={20} />
            <div>
              <strong>1800-11-4477</strong>
              <span>{t('login.helpline')}</span>
            </div>
          </div>
          <div className="help-item">
            <Clock size={20} />
            <div>
              <strong>{t('gov.helpline')}</strong>
              <span>{t('landing.help.hours')}</span>
            </div>
          </div>
          <div className="help-item">
            <Building2 size={20} />
            <div>
              <strong>OPD</strong>
              <span>{t('landing.help.desk')}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
