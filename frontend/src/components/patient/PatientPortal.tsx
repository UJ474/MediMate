import React, { useEffect, useMemo, useRef, useState } from 'react';
import './patient.css';
import type { Patient, PatientDocument } from '../../types';
import {
  INTAKE_QUESTIONS, SKIPPED, buildIntakeRecord, formatMeasurements, nextQuestionIndex, questionOptions,
  questionText, sectionTitle, visibleQuestionCount, type Answers,
} from '../../data/dashavidhaQuestions';
import { MOCK_HOSPITALS } from '../../data/mockPatients';
import { useLanguage } from '../../i18n/LanguageContext';
import { LANGUAGES } from '../../i18n/translations';
import { preloadSpeech, useSpeakText, useVoiceRecorder } from '../../hooks/useSpeech';
import confetti from 'canvas-confetti';
import {
  CheckCircle2, ArrowRight, ArrowLeft, Mic, MicOff, Send, Stethoscope,
  UploadCloud, FileText, Check, ShieldCheck, Sparkles, Volume2, FileCheck2, Building2, Search, MapPin
} from 'lucide-react';

interface PatientPortalProps {
  patient: Patient;
  onConsultationSubmitted: (updated: Patient) => void;
  // 'upload' opens straight on the report upload step and saves reports without a new consultation.
  mode?: 'consultation' | 'upload';
  onReportsSaved?: (updated: Patient) => void;
  onExit: () => void;
}

// How many upcoming questions to fetch audio for ahead of time.
const SPEECH_LOOKAHEAD = 4;

export const PatientPortal: React.FC<PatientPortalProps> = ({
  patient,
  onConsultationSubmitted,
  mode = 'consultation',
  onReportsSaved,
  onExit,
}) => {
  const uploadOnly = mode === 'upload';
  const { t, lang, speechLang, dir } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(uploadOnly ? 4 : 1);
  const [hospitalId, setHospitalId] = useState<string>(patient.hospitalId);
  const [hospitalQuery, setHospitalQuery] = useState('');
  const [showPostInterviewChoice, setShowPostInterviewChoice] = useState(false);

  // Consent toggles
  const [consents, setConsents] = useState({
    healthInterview: true,
    doctorShare: true,
    pastRecords: true,
    abhaSync: true,
  });

  // Interview state. qIndex points into INTAKE_QUESTIONS; `history` holds the
  // indices actually asked, so "Previous" retraces the adaptive path.
  const [qIndex, setQIndex] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');

  // Upload state
  const [uploadedFiles, setUploadedFiles] = useState<PatientDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentQ = INTAKE_QUESTIONS[qIndex] ?? INTAKE_QUESTIONS[0];
  const translatedQText = questionText(currentQ, lang);
  const translatedOptions = currentQ.options ? questionOptions(currentQ, lang) : undefined;

  const { speak, supported: speechSupported } = useSpeakText(speechLang);
  const { isRecording, toggle: toggleRecording } = useVoiceRecorder(
    speechLang,
    (transcript) => {
      setCurrentAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    t('interview.simulatedAnswer')
  );

  const consentReadAloudText = [
    t('consent.interview.title'), t('consent.interview.desc'),
    t('consent.share.title'), t('consent.share.desc'),
    t('consent.records.title'), t('consent.records.desc'),
    t('consent.abha.title'), t('consent.abha.desc'),
  ].join('. ');

  // Fetch audio in the background before it is needed, so each question is spoken
  // the moment it appears: the consent text and first questions up front, then the
  // next few questions (including possible follow-ups) as the interview moves on.
  useEffect(() => {
    const upcoming = INTAKE_QUESTIONS.slice(qIndex, qIndex + 1 + SPEECH_LOOKAHEAD).map((q) => questionText(q, lang));
    preloadSpeech(currentStep < 3 ? [consentReadAloudText, ...upcoming] : upcoming, speechLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, speechLang, qIndex, currentStep]);

  // Read each question aloud automatically as it appears (kiosk-friendly for low-literacy users).
  useEffect(() => {
    if (currentStep === 3 && !showPostInterviewChoice && speechSupported) {
      speak(translatedQText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIndex, currentStep, lang, showPostInterviewChoice]);

  const questionNumber = history.length + 1;
  const questionTotal = Math.max(questionNumber, visibleQuestionCount(answers));
  const progressPct = Math.min(100, Math.round((history.length / questionTotal) * 100));

  const resetInputs = () => {
    setCurrentAnswer('');
    setMultiSelected([]);
    setHeightCm('');
    setWeightKg('');
  };

  // Records the answer and moves to the next question that applies given all answers so far.
  const handleAnswer = (value: string | string[]) => {
    const updated: Answers = { ...answers, [currentQ.id]: value };
    setAnswers(updated);
    resetInputs();
    const next = nextQuestionIndex(qIndex, updated);
    if (next === -1) {
      setShowPostInterviewChoice(true);
      return;
    }
    setHistory((prev) => [...prev, qIndex]);
    setQIndex(next);
  };

  const handlePrevious = () => {
    const prev = history[history.length - 1];
    if (prev === undefined) return;
    setHistory((h) => h.slice(0, -1));
    resetInputs();
    setQIndex(prev);
  };

  // Choice answers are stored as the English option so branching and the doctor's view are language-independent.
  const englishOption = (i: number) => currentQ.options?.en[i] ?? '';

  const handleMultiToggle = (i: number) => {
    const exclusive = /^(None of these|No unusual bleeding|Nothing has changed)$/;
    setMultiSelected((prev) => {
      if (prev.includes(i)) return prev.filter((o) => o !== i);
      // "None" options can't be combined with anything else.
      if (exclusive.test(englishOption(i))) return [i];
      return [...prev.filter((o) => !exclusive.test(englishOption(o))), i];
    });
  };

  const heightNum = Number(heightCm);
  const weightNum = Number(weightKg);
  const measurementsValid = heightNum >= 50 && heightNum <= 250 && weightNum >= 2 && weightNum <= 300;

  const today = new Date().toISOString().slice(0, 10);

  const handleAddSampleReport = () => {
    const samples = [
      { name: 'Recent_Echocardiogram_Report.pdf', size: '840 KB', category: 'Cardiology', extracted: 'EF 58%, LVH pattern' },
      { name: 'Lipid_Panel_HbA1c_Aug2025.pdf', size: '1.4 MB', category: 'Lab Report', extracted: 'HbA1c 8.4%, FBG 176 mg/dL' },
      { name: 'Thyroid_Profile_TSH_Sept2025.pdf', size: '520 KB', category: 'Endocrine', extracted: 'TSH 4.8 mIU/L' },
    ];
    setUploadedFiles((prev) => [
      ...prev,
      { ...samples[prev.length % samples.length], id: `DOC-${Date.now()}`, uploadedOn: today },
    ]);
  };

  const handleFilesChosen = (files: FileList | null) => {
    if (!files?.length) return;
    const added: PatientDocument[] = Array.from(files).map((file, i) => ({
      id: `DOC-${Date.now()}-${i}`,
      name: file.name,
      size: file.size >= 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
      category: file.type === 'application/pdf' ? 'PDF Report' : file.type.startsWith('image/') ? 'Scanned Image' : 'Document',
      uploadedOn: today,
      extracted: t('upload.pending'),
    }));
    setUploadedFiles((prev) => [...prev, ...added]);
  };

  const selectedHospital = MOCK_HOSPITALS.find((h) => h.id === hospitalId);
  const filteredHospitals = useMemo(() => {
    const q = hospitalQuery.trim().toLowerCase();
    if (!q) return MOCK_HOSPITALS;
    return MOCK_HOSPITALS.filter((h) => `${h.name} ${h.city} ${h.state}`.toLowerCase().includes(q));
  }, [hospitalQuery]);

  const buildUpdatedPatient = (): Patient => {
    const newTimelineEntries: Patient['timeline'] = [
      { date: today, event: `Intake interview with Dashavidha assessment completed (${selectedHospital?.name ?? 'hospital'})`, type: 'intake' },
    ];
    if (uploadedFiles.length > 0) {
      newTimelineEntries.push({ date: today, event: `${uploadedFiles.length} diagnostic report(s) uploaded and OCR-processed`, type: 'document' });
    }
    return {
      ...patient,
      language: LANGUAGES.find((l) => l.code === lang)?.name || patient.language,
      hospitalId,
      chiefComplaint:
        typeof answers.C1 === 'string' && answers.C1 !== SKIPPED ? answers.C1 : patient.chiefComplaint,
      intake: buildIntakeRecord(answers, LANGUAGES.find((l) => l.code === lang)?.name ?? lang, today),
      lastVisit: today,
      documents: [...uploadedFiles, ...patient.documents],
      timeline: [...newTimelineEntries, ...patient.timeline],
    };
  };

  const handleFinalSubmit = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0B2447', '#E86A1C', '#138808', '#114B8F'],
    });
    setCurrentStep(5);
  };

  const updatedPatientPreview = currentStep === 5 ? buildUpdatedPatient() : patient;
  const dirArrow = dir === 'rtl' ? '→' : '←';

  return (
    <div className="patient-portal-container">
      {/* Visual Stepper Bar — hidden when the patient only came to upload reports */}
      {uploadOnly ? (
        <button className="portal-exit-link" onClick={onExit}>
          {dirArrow} {t('portal.exit')}
        </button>
      ) : (
      <div className="stepper-card">
        <div className="stepper-header">
          <div className="stepper-title-area">
            <button className="portal-exit-link" onClick={onExit}>
              {dirArrow} {t('portal.exit')}
            </button>
            <h2>{t('portal.title')}</h2>
            <p>{t('portal.consultingFor')}: <strong>{patient.name}</strong> • ABHA: <code>{patient.abha}</code></p>
          </div>
          <div className="badge badge-info">{t('step.of', { n: currentStep, total: 5 })}</div>
        </div>

        <div className="stepper-track">
          {[
            { step: 1, label: t('step.hospital') },
            { step: 2, label: t('step.consent') },
            { step: 3, label: t('step.interview') },
            { step: 4, label: t('step.reports') },
            { step: 5, label: t('step.review') },
          ].map((item) => {
            const isActive = currentStep === item.step;
            const isCompleted = currentStep > item.step;
            return (
              <div
                key={item.step}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div className="step-bubble">
                  {isCompleted ? <Check size={16} /> : item.step}
                </div>
                <span className="step-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* STEP 1: HOSPITAL SELECTION — decides which doctors can see this consultation */}
      {currentStep === 1 && (
        <div className="step-content-card">
          <div className="step-header">
            <h3 className="step-title">{t('hospital.heading')}</h3>
            <p className="step-desc">{t('hospital.desc')}</p>
          </div>

          <div className="hospital-search">
            <Search size={18} className="hospital-search-icon" />
            <input
              type="search"
              className="hospital-search-input"
              placeholder={t('hospital.searchPlaceholder')}
              value={hospitalQuery}
              onChange={(e) => setHospitalQuery(e.target.value)}
              aria-label={t('hospital.searchPlaceholder')}
            />
          </div>

          {filteredHospitals.length === 0 ? (
            <p className="hospital-search-empty">{t('hospital.noResults', { q: hospitalQuery.trim() })}</p>
          ) : (
            <div className="hospital-grid">
              {filteredHospitals.map((h) => (
                <button
                  key={h.id}
                  className={`hospital-card ${hospitalId === h.id ? 'selected' : ''}`}
                  onClick={() => setHospitalId(h.id)}
                >
                  <Building2 size={20} style={{ color: 'var(--color-primary-mid)' }} />
                  <span className="hospital-card-name">{h.name}</span>
                  <span className="hospital-card-city">
                    <MapPin size={12} /> {h.city}, {h.state}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="step-actions">
            <div />
            <button className="btn-primary" disabled={!hospitalId} onClick={() => setCurrentStep(2)}>
              <span>{t('action.continue')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONSENT MANAGEMENT */}
      {currentStep === 2 && (
        <div className="step-content-card">
          <div className="step-header">
            <h3 className="step-title">{t('consent.heading')}</h3>
            <p className="step-desc">{t('consent.desc')}</p>
            {speechSupported && (
              <button
                className="btn-secondary voice-readaloud-btn"
                onClick={() => speak(consentReadAloudText)}
              >
                <Volume2 size={15} />
                <span>{t('consent.readAloud')}</span>
              </button>
            )}
          </div>

          <div className="consent-list">
            <div className={`consent-card ${consents.healthInterview ? 'checked' : ''}`}>
              <input
                type="checkbox"
                className="consent-switch"
                checked={consents.healthInterview}
                onChange={(e) => setConsents({ ...consents, healthInterview: e.target.checked })}
              />
              <div className="consent-info">
                <h4>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary-mid)' }} />
                  {t('consent.interview.title')}
                </h4>
                <p>{t('consent.interview.desc')}</p>
              </div>
            </div>

            <div className={`consent-card ${consents.doctorShare ? 'checked' : ''}`}>
              <input
                type="checkbox"
                className="consent-switch"
                checked={consents.doctorShare}
                onChange={(e) => setConsents({ ...consents, doctorShare: e.target.checked })}
              />
              <div className="consent-info">
                <h4>
                  <ShieldCheck size={16} style={{ color: 'var(--color-primary-mid)' }} />
                  {t('consent.share.title')}
                </h4>
                <p>{t('consent.share.desc')}</p>
              </div>
            </div>

            <div className={`consent-card ${consents.pastRecords ? 'checked' : ''}`}>
              <input
                type="checkbox"
                className="consent-switch"
                checked={consents.pastRecords}
                onChange={(e) => setConsents({ ...consents, pastRecords: e.target.checked })}
              />
              <div className="consent-info">
                <h4>
                  <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
                  {t('consent.records.title')}
                </h4>
                <p>{t('consent.records.desc')}</p>
              </div>
            </div>

            <div className={`consent-card ${consents.abhaSync ? 'checked' : ''}`}>
              <input
                type="checkbox"
                className="consent-switch"
                checked={consents.abhaSync}
                onChange={(e) => setConsents({ ...consents, abhaSync: e.target.checked })}
              />
              <div className="consent-info">
                <h4>
                  <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                  {t('consent.abha.title')}
                </h4>
                <p>
                  {t('consent.abha.desc')} (<code>{patient.abha}</code>)
                </p>
              </div>
            </div>
          </div>

          <div className="step-actions">
            <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
              <ArrowLeft size={16} />
              <span>{t('action.back')}</span>
            </button>
            <button
              className="btn-primary"
              disabled={!consents.healthInterview || !consents.doctorShare}
              onClick={() => setCurrentStep(3)}
            >
              <span>{t('consent.begin')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ADAPTIVE HEALTH INTERVIEW (anaemia pathway + Dashavidha Pariksha) */}
      {currentStep === 3 && !showPostInterviewChoice && (
        <div className="step-content-card">
          <div className="step-header">
            <h3 className="step-title">{t('interview.questionOf', { n: questionNumber, total: questionTotal })}</h3>
            <p className="step-desc">{t('interview.desc')}</p>
          </div>

          <div
            className="interview-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPct}
            aria-label={t('interview.progress', { pct: progressPct })}
          >
            <div className="interview-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="interview-progress-label">{t('interview.progress', { pct: progressPct })}</div>

          <div className="interview-box">
            <div className="interview-ai-header">
              <div className="ai-avatar-circle" aria-hidden="true">
                <Stethoscope size={20} />
              </div>
              <div className="ai-meta">
                <h4>{t('interview.badge')}</h4>
                <span>{sectionTitle(currentQ.section, lang)}</span>
              </div>
            </div>

            <div className="question-bubble">
              <div className="question-text" aria-live="polite">{translatedQText}</div>
              {speechSupported && (
                <div className="question-voice-actions">
                  <button className="voice-action-chip" onClick={() => speak(translatedQText)}>
                    <Volume2 size={14} />
                    <span>{t('interview.playQuestion')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Single choice */}
            {currentQ.type === 'mcq' && translatedOptions && (
              <div className="options-grid">
                {translatedOptions.map((opt, i) => (
                  <button key={`${currentQ.id}-${i}`} className="option-btn" onClick={() => handleAnswer(englishOption(i))}>
                    <span>{opt}</span>
                    <ArrowRight size={15} style={{ opacity: 0.6 }} />
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select */}
            {currentQ.type === 'multi_select' && translatedOptions && (
              <div>
                <p className="multi-select-hint">{t('interview.selectAllApply')}</p>
                <div className="options-grid" role="group" aria-label={translatedQText}>
                  {translatedOptions.map((opt, i) => {
                    const on = multiSelected.includes(i);
                    return (
                      <button
                        key={`${currentQ.id}-${i}`}
                        className={`option-btn multi ${on ? 'selected' : ''}`}
                        onClick={() => handleMultiToggle(i)}
                        aria-pressed={on}
                      >
                        <span className={`multi-checkbox ${on ? 'checked' : ''}`}>{on && <Check size={12} />}</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                  <button
                    className="btn-primary"
                    disabled={multiSelected.length === 0}
                    onClick={() => handleAnswer([...multiSelected].sort((a, b) => a - b).map(englishOption))}
                  >
                    <span>{t('interview.confirmSelection')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Height and weight (Pramana) */}
            {currentQ.type === 'measurements' && (
              <form
                className="measure-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (measurementsValid) handleAnswer(formatMeasurements(heightNum, weightNum));
                }}
              >
                <div className="measure-fields">
                  <label className="measure-field">
                    <span>{t('interview.height')}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={50}
                      max={250}
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="160"
                    />
                  </label>
                  <label className="measure-field">
                    <span>{t('interview.weight')}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={2}
                      max={300}
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="60"
                    />
                  </label>
                </div>
                {heightCm && weightKg && !measurementsValid && (
                  <p className="measure-error" role="alert">{t('interview.measureInvalid')}</p>
                )}
                <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                  <button type="submit" className="btn-primary" disabled={!measurementsValid}>
                    <span>{t('action.continue')}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* Free text / voice */}
            {currentQ.type === 'text' && (
              <div className="voice-text-bar">
                <button
                  className={`voice-mic-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                  aria-label={isRecording ? t('interview.recording') : t('interview.record')}
                  title={isRecording ? t('interview.recording') : t('interview.record')}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <input
                  type="text"
                  className="voice-input-field"
                  aria-label={translatedQText}
                  placeholder={isRecording ? t('interview.recording') : t('interview.typeOrSpeak')}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentAnswer.trim()) handleAnswer(currentAnswer.trim());
                  }}
                />
                <button
                  className="btn-primary"
                  style={{ padding: '0.5rem 0.9rem' }}
                  disabled={!currentAnswer.trim()}
                  onClick={() => handleAnswer(currentAnswer.trim())}
                  aria-label={t('action.continue')}
                >
                  <Send size={15} />
                </button>
              </div>
            )}
          </div>

          <div className="step-actions">
            <button className="btn-secondary" disabled={history.length === 0} onClick={handlePrevious}>
              <ArrowLeft size={16} />
              <span>{t('interview.previous')}</span>
            </button>
            <button className="btn-accent" onClick={() => handleAnswer(SKIPPED)}>
              <span>{t('action.skip')}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3b: POST-INTERVIEW CHOICE — upload reports now, or finish straight away */}
      {currentStep === 3 && showPostInterviewChoice && (
        <div className="step-content-card">
          <div className="post-interview-choice">
            <div className="success-icon-wrap" style={{ width: 64, height: 64, marginBottom: '1rem' }}>
              <FileCheck2 size={30} />
            </div>
            <h3 className="step-title">{t('interview.doneHeading')}</h3>
            <p className="step-desc" style={{ marginBottom: '2rem' }}>{t('interview.doneDesc')}</p>
            <div className="post-interview-actions">
              <button className="btn-primary" onClick={() => { setShowPostInterviewChoice(false); setCurrentStep(4); }}>
                <UploadCloud size={16} />
                <span>{t('interview.uploadPapers')}</span>
              </button>
              <button className="btn-secondary" onClick={() => { setShowPostInterviewChoice(false); handleFinalSubmit(); }}>
                <span>{t('interview.finishWithoutUpload')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: UPLOAD REPORTS */}
      {currentStep === 4 && (
        <div className="step-content-card">
          <div className="step-header">
            <span className="step-badge">{t('upload.badge')}</span>
            <h3 className="step-title">{t('upload.heading')}</h3>
            <p className="step-desc">{t('upload.desc')}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFilesChosen(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon-bubble">
              <UploadCloud size={28} />
            </div>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              {t('upload.dropHeading')}
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              {t('upload.supports')}
            </p>
            <button
              className="btn-secondary"
              style={{ marginTop: '1rem', fontSize: '0.8rem' }}
              onClick={(e) => {
                e.stopPropagation();
                handleAddSampleReport();
              }}
            >
              {t('upload.attachSample')}
            </button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="uploaded-files-list">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                {t('upload.attachedDocs')} ({uploadedFiles.length})
              </div>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="file-item-card">
                  <div className="file-info">
                    <FileText size={20} style={{ color: 'var(--color-primary-mid)' }} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{file.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {file.size} • {file.category}
                      </div>
                    </div>
                  </div>
                  <div className="file-ocr-badge">✓ {file.extracted}</div>
                </div>
              ))}
            </div>
          )}

          {uploadOnly ? (
            <div className="step-actions">
              <button className="btn-secondary" onClick={onExit}>
                <ArrowLeft size={16} />
                <span>{t('portal.exit')}</span>
              </button>
              <button
                className="btn-primary"
                disabled={uploadedFiles.length === 0}
                onClick={() =>
                  onReportsSaved?.({
                    ...patient,
                    documents: [...uploadedFiles, ...patient.documents],
                    timeline: [
                      { date: today, event: `${uploadedFiles.length} report(s) uploaded to health record`, type: 'document' },
                      ...patient.timeline,
                    ],
                  })
                }
              >
                <CheckCircle2 size={16} />
                <span>{t('upload.saveReports')}</span>
              </button>
            </div>
          ) : (
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => { setCurrentStep(3); setShowPostInterviewChoice(true); }}>
                <ArrowLeft size={16} />
                <span>{t('upload.backToInterview')}</span>
              </button>
              <button className="btn-primary" onClick={handleFinalSubmit}>
                <span>{t('upload.reviewSubmit')}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 5: REVIEW & FINAL SUBMISSION */}
      {currentStep === 5 && (
        <div className="step-content-card">
          <div className="success-card">
            <div className="success-icon-wrap">
              <CheckCircle2 size={44} />
            </div>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              {t('review.heading')}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto 2rem', fontSize: '0.925rem' }}>
              {uploadedFiles.length > 0
                ? t('review.linkedDocs', { n: uploadedFiles.length, abha: patient.abha })
                : t('review.linked', { abha: patient.abha })}
            </p>

            <div className="review-snapshot-card">
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                {t('review.snapshot')}:
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                • <strong>{t('review.patient')}:</strong> {patient.name}<br />
                • <strong>{t('review.hospital')}:</strong> {selectedHospital ? `${selectedHospital.name}, ${selectedHospital.city}` : '—'}<br />
                • <strong>{t('review.complaint')}:</strong> {updatedPatientPreview.chiefComplaint}<br />
                • <strong>{t('review.reports')}:</strong> {uploadedFiles.length}
              </div>
              <div className="review-db-badge">
                <FileCheck2 size={14} />
                <span>{t('review.savedToDb')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button
                className="btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
                onClick={() => onConsultationSubmitted(buildUpdatedPatient())}
              >
                <Sparkles size={18} />
                <span>{t('review.openDashboard')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
