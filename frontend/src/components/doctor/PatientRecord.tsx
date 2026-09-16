import React, { useRef, useState } from 'react';
import type { Consultation, Doctor, Patient, Prescription } from '../../types';
import { isoDaysAgo } from '../../data/opdRegister';
import { IntakePanel } from './IntakePanel';
import { PastHistoryPanel } from './PastHistoryPanel';
import { PrescriptionPad } from './PrescriptionPad';
import { formatDate, initialsOf, riskLabel, severityClass, vitalFlags } from './clinicalFormat';
import {
  AlertTriangle, ArrowLeft, ClipboardCheck, FlaskConical, History, Leaf, ListChecks, NotebookPen, Stethoscope,
} from 'lucide-react';

interface PatientRecordProps {
  patient: Patient;
  visit?: Consultation;
  // All of this patient's OPD visits at the hospital.
  visits: Consultation[];
  doctor: Doctor;
  onBack: () => void;
  onIssuePrescription: (patientId: string, prescription: Prescription) => void;
}

type TabId = 'overview' | 'intake' | 'past' | 'clinical' | 'prescribe';

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <ListChecks size={16} /> },
  { id: 'intake', label: 'Intake & Dashavidha', icon: <ClipboardCheck size={16} /> },
  { id: 'past', label: 'Past history', icon: <History size={16} /> },
  { id: 'clinical', label: 'Conditions & labs', icon: <Stethoscope size={16} /> },
  { id: 'prescribe', label: 'Prescribe', icon: <NotebookPen size={16} /> },
];

const VITALS: Array<{ key: keyof Patient['vitals']; label: string }> = [
  { key: 'bp', label: 'Blood pressure' },
  { key: 'pulse', label: 'Pulse' },
  { key: 'spo2', label: 'SpO2' },
  { key: 'temp', label: 'Temperature' },
  { key: 'weight', label: 'Weight' },
  { key: 'bmi', label: 'BMI' },
];

export const PatientRecord: React.FC<PatientRecordProps> = ({ patient, visit, visits, doctor, onBack, onIssuePrescription }) => {
  const [tab, setTab] = useState<TabId>('overview');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const flags = vitalFlags(patient.vitals);

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    let next = index + delta;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next === index) return;
    e.preventDefault();
    const wrapped = (next + TABS.length) % TABS.length;
    setTab(TABS[wrapped].id);
    tabRefs.current[wrapped]?.focus();
  };

  const alerts = patient.aiInsights?.safetyAlerts ?? [];
  const insights = patient.aiInsights?.keyInsights ?? [];
  const tests = patient.aiInsights?.recommendedTests ?? [];

  return (
    <article className="dd-panel dd-record">
      <button className="dd-back" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" /> Back to OPD register
      </button>

      {/* Identity */}
      <header className="dd-record-head">
        <span className="dd-avatar" aria-hidden="true">
          {initialsOf(patient.name)}
        </span>
        <div className="dd-record-id">
          <h2>{patient.name}</h2>
          <p>
            {patient.age} years · {patient.gender} · Blood group {patient.bloodGroup} · {patient.language}
          </p>
          <p className="dd-mono">
            ABHA {patient.abha}
            {patient.phone ? ` · ${patient.phone}` : ''}
          </p>
        </div>
        <div className="dd-record-risk">
          <span className={`dd-risk risk-${patient.riskLevel.toLowerCase()} lg`}>{riskLabel(patient.riskLevel)}</span>
          <span className="dd-muted">Triage score {patient.riskScore}/100</span>
        </div>
      </header>

      {visit && (
        <p className="dd-visit-line">
          <strong>{visit.date === isoDaysAgo(0) ? "Today's visit" : 'Visit'}:</strong> {visit.reason} ·{' '}
          {visit.type} · {formatDate(visit.date)} {visit.time} · <span className={visit.status === 'Completed' ? 'dd-ok' : 'dd-warn'}>{visit.status}</span>
        </p>
      )}

      {patient.allergies.length > 0 && (
        <div className="dd-allergy" role="note">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>
            <strong>Allergies:</strong>{' '}
            {patient.allergies.map((a) => `${a.substance} (${a.reaction})`).join('; ')}
          </span>
        </div>
      )}

      <dl className="dd-vitals">
        {VITALS.map(({ key, label }) => (
          <div key={key} className={flags[key] ? 'flag' : ''}>
            <dt>{label}</dt>
            <dd>
              {flags[key] && <AlertTriangle size={14} aria-hidden="true" />}
              {patient.vitals[key] || '—'}
              {flags[key] && <span className="sr-only"> (outside normal range)</span>}
            </dd>
          </div>
        ))}
      </dl>

      {/* Tabs */}
      <div className="dd-tabs" role="tablist" aria-label="Patient record sections">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`dd-tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`dd-tabpanel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.id === 'intake' && patient.intake?.flags.length ? (
              <span className="dd-tab-dot" aria-label={`${patient.intake.flags.length} flags`} />
            ) : null}
          </button>
        ))}
      </div>

      <div className="dd-tabpanel" role="tabpanel" id={`dd-tabpanel-${tab}`} aria-labelledby={`dd-tab-${tab}`}>
        {tab === 'overview' && (
          <div className="dd-stack">
            {alerts.length > 0 && (
              <section className="dd-block dd-alerts" aria-labelledby="dd-alerts-title">
                <h3 id="dd-alerts-title">
                  <AlertTriangle size={17} aria-hidden="true" /> Safety alerts ({alerts.length})
                </h3>
                <ul>
                  {alerts.map((a, i) => (
                    <li key={i} className={severityClass(a.severity)}>
                      <div className="dd-alert-top">
                        <strong>{a.type}</strong>
                        <span className={`dd-sev ${severityClass(a.severity)}`}>{a.severity}</span>
                      </div>
                      <p>{a.message}</p>
                      <p className="dd-alert-action">
                        <strong>Action:</strong> {a.action}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="dd-block" aria-labelledby="dd-summary-title">
              <h3 id="dd-summary-title">Case summary</h3>
              <p className="dd-note">Prepared from the patient's intake and records. Verify before clinical use.</p>
              <p className="dd-summary">{patient.aiInsights?.summary || patient.chiefComplaint}</p>
            </section>

            {insights.length > 0 && (
              <section className="dd-block" aria-labelledby="dd-findings-title">
                <h3 id="dd-findings-title">Key findings</h3>
                <div className="dd-table-wrap">
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th scope="col">Finding</th>
                        <th scope="col">Area</th>
                        <th scope="col">Severity</th>
                        <th scope="col">Supporting evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.map((ins, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{ins.title}</strong>
                            <div className="dd-muted">{ins.detail}</div>
                          </td>
                          <td>{ins.category}</td>
                          <td>
                            <span className={`dd-sev ${severityClass(ins.severity)}`}>{ins.severity}</span>
                          </td>
                          <td>{ins.evidence?.join('; ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tests.length > 0 && (
              <section className="dd-block" aria-labelledby="dd-tests-title">
                <h3 id="dd-tests-title">
                  <FlaskConical size={17} aria-hidden="true" /> Suggested investigations
                </h3>
                <ul className="dd-list">
                  {tests.map((test) => (
                    <li key={test}>{test}</li>
                  ))}
                </ul>
                <button className="btn-secondary dd-inline-btn" onClick={() => setTab('prescribe')}>
                  <NotebookPen size={15} aria-hidden="true" /> Open prescription pad
                </button>
              </section>
            )}
          </div>
        )}

        {tab === 'intake' && <IntakePanel patient={patient} />}

        {tab === 'past' && <PastHistoryPanel patient={patient} visits={visits} doctor={doctor} />}

        {tab === 'clinical' && (
          <div className="dd-stack">
            <section className="dd-block" aria-labelledby="dd-dx-title">
              <h3 id="dd-dx-title">Diagnoses</h3>
              {patient.diagnoses.length === 0 ? (
                <p className="dd-empty">No diagnoses recorded.</p>
              ) : (
                <div className="dd-table-wrap">
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th scope="col">Condition</th>
                        <th scope="col">Since</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.diagnoses.map((d, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{d.name}</strong>
                          </td>
                          <td>{d.since}</td>
                          <td>
                            {d.status}
                            {d.severity ? ` · ${d.severity}` : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="dd-block" aria-labelledby="dd-meds-title">
              <h3 id="dd-meds-title">Current medicines</h3>
              {patient.medications.length === 0 ? (
                <p className="dd-empty">No current medicines recorded.</p>
              ) : (
                <div className="dd-table-wrap">
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th scope="col">Medicine</th>
                        <th scope="col">Frequency</th>
                        <th scope="col">Since</th>
                        <th scope="col">Adherence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.medications.map((m, i) => (
                        <tr key={i}>
                          <td>
                            <strong>{m.name}</strong>
                          </td>
                          <td>{m.frequency}</td>
                          <td>{m.since}</td>
                          <td className={/miss|frequent|variable|irregular/i.test(m.adherence) ? 'dd-warn' : ''}>{m.adherence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="dd-block" aria-labelledby="dd-labs-title">
              <h3 id="dd-labs-title">Laboratory results</h3>
              {patient.labs.length === 0 ? (
                <p className="dd-empty">No laboratory results on record.</p>
              ) : (
                <div className="dd-table-wrap">
                  <table className="dd-table">
                    <thead>
                      <tr>
                        <th scope="col">Test</th>
                        <th scope="col">Result</th>
                        <th scope="col">Reference</th>
                        <th scope="col">Status</th>
                        <th scope="col">Trend</th>
                        <th scope="col">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.labs.map((lab, i) => {
                        const abnormal = !/normal|in range|immune|negative|pending/i.test(lab.status);
                        return (
                          <tr key={i}>
                            <td>
                              <strong>{lab.type}</strong>
                            </td>
                            <td className={abnormal ? 'dd-alert-text' : ''}>
                              {lab.value} {lab.unit}
                            </td>
                            <td>{lab.reference || '—'}</td>
                            <td className={abnormal ? 'dd-alert-text' : ''}>{lab.status}</td>
                            <td>{lab.trend}</td>
                            <td className="dd-nowrap">{formatDate(lab.date)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {patient.ayurvedicContext && (
              <section className="dd-block" aria-labelledby="dd-ayush-title">
                <h3 id="dd-ayush-title">
                  <Leaf size={17} aria-hidden="true" /> Ayurveda profile
                </h3>
                <dl className="dd-dl">
                  <div>
                    <dt>Prakriti</dt>
                    <dd>{patient.ayurvedicContext.prakriti}</dd>
                  </div>
                  <div>
                    <dt>Current imbalance (Vikriti)</dt>
                    <dd>{patient.ayurvedicContext.currentImbalance}</dd>
                  </div>
                  <div>
                    <dt>Agni</dt>
                    <dd>{patient.ayurvedicContext.agni}</dd>
                  </div>
                  <div>
                    <dt>Koshtha</dt>
                    <dd>{patient.ayurvedicContext.koshtha}</dd>
                  </div>
                  {patient.ayurvedicContext.relevantHerbs?.length > 0 && (
                    <div className="wide">
                      <dt>Formulations on record</dt>
                      <dd>{patient.ayurvedicContext.relevantHerbs.join('; ')}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

          </div>
        )}

        {tab === 'prescribe' && (
          <PrescriptionPad patient={patient} doctor={doctor} onIssuePrescription={onIssuePrescription} />
        )}
      </div>
    </article>
  );
};
