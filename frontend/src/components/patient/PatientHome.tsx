import React, { useEffect, useState } from 'react';
import './patient.css';
import './patient-home.css';
import type { Patient } from '../../types';
import { MOCK_HOSPITALS } from '../../data/mockPatients';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  FileText, Pill, PlusCircle, CheckCircle2, ClipboardList, History, ShieldCheck,
  Building2, UploadCloud, MapPinned, ArrowRight, CalendarDays,
} from 'lucide-react';

interface PatientHomeProps {
  patient: Patient;
  justSubmitted: boolean;
  reportsSaved?: boolean;
  onStartConsultation: () => void;
  // onUploadReports: () => void;
}


type SectionKey = 'prescriptions' | 'documents' | 'history';

const BANNER_INTERVAL_MS = 5000;

// The patient's own space. Deliberately limited to what the patient uploaded,
// what a doctor prescribed and their visit history — no triage scores, AI
// insights or other patients.
export const PatientHome: React.FC<PatientHomeProps> = ({ patient, justSubmitted, reportsSaved, onStartConsultation, onUploadReports }) => {
  const { t } = useLanguage();
  const hospital = MOCK_HOSPITALS.find((h) => h.id === patient.hospitalId);

  const scrollTo = (key: SectionKey) =>
    document.getElementById(`phome-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Promotional banner carousel, like the offer banners on payment/bank app home screens.
  const banners = [
    { tone: 'saffron', icon: <UploadCloud size={44} />, title: t('home.banner1.title'), desc: t('home.banner1.desc'), cta: t('home.banner1.cta'), action: onUploadReports },
    { tone: 'green', icon: <MapPinned size={44} />, title: t('home.banner2.title'), desc: t('home.banner2.desc'), cta: t('home.banner2.cta'), action: onStartConsultation },
    { tone: 'blue', icon: <ShieldCheck size={44} />, title: t('home.banner3.title'), desc: t('home.banner3.desc'), cta: t('home.banner3.cta'), action: () => scrollTo('history') },
  ];
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);

  useEffect(() => {
    if (bannerPaused) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setBannerIndex((i) => (i + 1) % banners.length), BANNER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [bannerPaused, banners.length]);

  const initials = patient.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const quickActions: Array<{ key: string; icon: React.ReactNode; label: string; tone: string; onClick: () => void }> = [
    { key: 'consult', icon: <PlusCircle size={24} />, label: t('home.quick.consult'), tone: 'saffron', onClick: onStartConsultation },
    { key: 'rx', icon: <Pill size={24} />, label: t('home.quick.prescriptions'), tone: 'green', onClick: () => scrollTo('prescriptions') },
    { key: 'docs', icon: <FileText size={24} />, label: t('home.quick.reports'), tone: 'blue', onClick: () => scrollTo('documents') },
    { key: 'history', icon: <History size={24} />, label: t('home.quick.history'), tone: 'purple', onClick: () => scrollTo('history') },
  ];

  return (
    <div className="phome">
      {(justSubmitted || reportsSaved) && (
        <div className="home-success-banner">
          <CheckCircle2 size={18} />
          <span>{t(reportsSaved ? 'home.reportsSaved' : 'home.submitted')}</span>
        </div>
      )}

      {/* Profile header */}
      <section className="phome-profile">
        <div className="phome-profile-main">
          <div className="phome-avatar">{initials || '🙂'}</div>
          <div className="phome-profile-text">
            <h2>{t('home.greeting', { name: patient.name })}</h2>
            <p>{t('home.subtitle')}</p>
          </div>
        </div>
        <div className="phome-profile-chips">
          <span className="phome-chip">
            <ShieldCheck size={14} /> ABHA · <code>{patient.abha}</code>
          </span>
          <span className="phome-chip">
            <Building2 size={14} /> {hospital ? `${hospital.name}, ${hospital.city}` : t('home.hospitalNone')}
          </span>
        </div>
        <div className="phome-stats">
          <div className="phome-stat">
            <span className="phome-stat-num">{patient.prescriptions.length}</span>
            <span className="phome-stat-label">{t('home.quick.prescriptions')}</span>
          </div>
          <div className="phome-stat">
            <span className="phome-stat-num">{patient.documents.length}</span>
            <span className="phome-stat-label">{t('home.quick.reports')}</span>
          </div>
          <div className="phome-stat">
            <span className="phome-stat-num phome-stat-date">{patient.lastVisit}</span>
            <span className="phome-stat-label">{t('home.lastVisit')}</span>
          </div>
        </div>
      </section>

      {/* Banner carousel */}
      <section
        className="phome-carousel"
        onMouseEnter={() => setBannerPaused(true)}
        onMouseLeave={() => setBannerPaused(false)}
        aria-roledescription="carousel"
        dir="ltr"
      >
        <div className="phome-carousel-track" style={{ transform: `translateX(-${bannerIndex * 100}%)` }}>
          {banners.map((b, i) => (
            <div key={i} className={`phome-banner tone-${b.tone}`} aria-hidden={i !== bannerIndex}>
              <div className="phome-banner-text">
                <h3>{b.title}</h3>
                <p>{b.desc}</p>
                <button className="phome-banner-cta" onClick={b.action} tabIndex={i === bannerIndex ? 0 : -1}>
                  <span>{b.cta}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="phome-banner-art">{b.icon}</div>
            </div>
          ))}
        </div>
        <div className="phome-carousel-dots">
          {banners.map((_, i) => (
            <button
              key={i}
              className={`phome-dot ${i === bannerIndex ? 'active' : ''}`}
              onClick={() => setBannerIndex(i)}
              aria-label={`${i + 1} / ${banners.length}`}
            />
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="phome-quick">
        {quickActions.map((a) => (
          <button key={a.key} className={`phome-quick-tile tone-${a.tone}`} onClick={a.onClick}>
            <span className="phome-quick-icon">{a.icon}</span>
            <span className="phome-quick-label">{a.label}</span>
          </button>
        ))}
      </section>

      {/* Prescriptions */}
      <section id="phome-prescriptions" className="phome-section tone-green">
        <header className="phome-section-header">
          <span className="phome-section-icon"><Pill size={20} /></span>
          <h3>{t('home.prescriptions')}</h3>
          <span className="phome-count">{patient.prescriptions.length}</span>
        </header>
        <div className="phome-section-body">
          {patient.prescriptions.length === 0 ? (
            <p className="phome-empty">{t('home.prescriptionsEmpty')}</p>
          ) : (
            <div className="home-list">
              {patient.prescriptions.map((rx) => (
                <div key={rx.id} className="rx-card">
                  <div className="rx-card-header">
                    <div>
                      <div className="rx-doctor">{rx.doctorName}</div>
                      <div className="rx-meta">
                        {t('home.prescribedBy')}: {rx.doctorSpecialty} · {rx.hospitalName}
                      </div>
                    </div>
                    <span className="phome-date-pill"><CalendarDays size={12} /> {rx.date}</span>
                  </div>

                  {rx.medicines.length > 0 && (
                    <div className="rx-block">
                      <div className="rx-block-label">💊 {t('home.medicines')}</div>
                      <ul>
                        {rx.medicines.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rx.tests.length > 0 && (
                    <div className="rx-block">
                      <div className="rx-block-label">🧪 {t('home.tests')}</div>
                      <ul>
                        {rx.tests.map((test, i) => (
                          <li key={i}>{test}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rx.notes && (
                    <div className="rx-block">
                      <div className="rx-block-label">
                        <ClipboardList size={13} /> {t('home.notes')}
                      </div>
                      <p className="rx-notes">{rx.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Documents */}
      <section id="phome-documents" className="phome-section tone-blue">
        <header className="phome-section-header">
          <span className="phome-section-icon"><FileText size={20} /></span>
          <h3>{t('home.documents')}</h3>
          <span className="phome-count">{patient.documents.length}</span>
        </header>
        <div className="phome-section-body">
          {patient.documents.length === 0 ? (
            <p className="phome-empty">{t('home.documentsEmpty')}</p>
          ) : (
            <div className="phome-doc-grid">
              {patient.documents.map((doc) => (
                <div key={doc.id} className="phome-doc-card">
                  <span className="phome-doc-icon"><FileText size={22} /></span>
                  <div className="phome-doc-text">
                    <div className="home-doc-name">{doc.name}</div>
                    <div className="home-doc-meta">
                      {doc.category} · {doc.size} · {t('home.uploadedOn', { date: doc.uploadedOn })}
                    </div>
                    <div className="file-ocr-badge">✓ {doc.extracted}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Health history timeline */}
      <section id="phome-history" className="phome-section tone-purple">
        <header className="phome-section-header">
          <span className="phome-section-icon"><History size={20} /></span>
          <h3>{t('home.history')}</h3>
          <span className="phome-count">{patient.timeline.length}</span>
        </header>
        <div className="phome-section-body">
          {patient.timeline.length === 0 ? (
            <p className="phome-empty">{t('home.historyEmpty')}</p>
          ) : (
            <ol className="phome-timeline">
              {[...patient.timeline]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((item, i) => (
                  <li key={i} className={`phome-timeline-item type-${item.type}`}>
                    <span className="phome-timeline-dot" />
                    <span className="phome-timeline-date">{item.date}</span>
                    <span className="phome-timeline-event">{item.event}</span>
                  </li>
                ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
};
