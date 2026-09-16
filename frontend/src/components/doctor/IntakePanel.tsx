import React from 'react';
import type { IntakeAnswer, Patient } from '../../types';
import { SECTION_TITLES_CLINICAL, type SectionKey } from '../../data/dashavidhaQuestions';
import { formatDate } from './clinicalFormat';
import { AlertTriangle, ClipboardCheck } from 'lucide-react';

const PARIKSHA_ORDER = [
  { name: 'Prakriti', meaning: 'Constitution' },
  { name: 'Vikriti', meaning: 'Recent change from baseline' },
  { name: 'Sara', meaning: 'Tissue quality' },
  { name: 'Samhanana', meaning: 'Body frame' },
  { name: 'Pramana', meaning: 'Body measurements' },
  { name: 'Satmya', meaning: 'Tolerance and suitability' },
  { name: 'Satva', meaning: 'Mental resilience' },
  { name: 'Ahara Shakti', meaning: 'Capacity for food and digestion' },
  { name: 'Vyayama Shakti', meaning: 'Capacity for exertion' },
  { name: 'Vaya', meaning: 'Age' },
];

const SECTION_ORDER: SectionKey[] = ['complaint', 'symptoms', 'bleeding', 'diet', 'history', 'closing'];

// Practitioner view of the patient's structured intake: review flags first, the
// Dashavidha Pariksha table, then every other answer grouped by section.
export const IntakePanel: React.FC<{ patient: Patient }> = ({ patient }) => {
  const intake = patient.intake;

  if (!intake) {
    return (
      <section className="dd-block">
        <h3>
          <ClipboardCheck size={17} aria-hidden="true" /> Intake interview
        </h3>
        <p className="dd-empty">
          No intake interview on record. Patients complete it from the patient portal before their visit.
        </p>
      </section>
    );
  }

  const byPariksha = new Map<string, IntakeAnswer[]>();
  for (const a of intake.answers) {
    if (!a.pariksha) continue;
    byPariksha.set(a.pariksha, [...(byPariksha.get(a.pariksha) ?? []), a]);
  }

  return (
    <div className="dd-stack">
      <p className="dd-note">
        Completed {formatDate(intake.completedOn)} in {intake.language}. Free-text answers are in the patient's own words;
        responses are recorded for assessment and are not a diagnosis.
      </p>

      {intake.flags.length > 0 && (
        <section className="dd-block dd-alerts" aria-labelledby="dd-flags-title">
          <h3 id="dd-flags-title">
            <AlertTriangle size={17} aria-hidden="true" /> For practitioner review ({intake.flags.length})
          </h3>
          <ul>
            {intake.flags.map((flag) => (
              <li key={flag} className="sev-high">
                <p>{flag}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dd-block" aria-labelledby="dd-dashavidha-title">
        <h3 id="dd-dashavidha-title">Dashavidha Pariksha</h3>
        <div className="dd-table-wrap">
          <table className="dd-table dd-pariksha">
            <thead>
              <tr>
                <th scope="col">Pariksha</th>
                <th scope="col">Patient responses</th>
              </tr>
            </thead>
            <tbody>
              {PARIKSHA_ORDER.map(({ name, meaning }) => {
                const answers = byPariksha.get(name) ?? [];
                return (
                  <tr key={name}>
                    <th scope="row">
                      {name}
                      <span className="dd-muted">{meaning}</span>
                    </th>
                    <td>
                      {name === 'Vaya' ? (
                        <span>
                          {patient.age} years <span className="dd-muted">(from registration)</span>
                        </span>
                      ) : answers.length === 0 ? (
                        <span className="dd-muted">Not recorded</span>
                      ) : (
                        <dl className="dd-qa">
                          {answers.map((a) => (
                            <div key={a.id}>
                              <dt>{a.question}</dt>
                              <dd className={a.answer === 'Skipped' ? 'dd-muted' : ''}>{a.answer}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {SECTION_ORDER.map((section) => {
        const answers = intake.answers.filter((a) => a.section === section && !a.pariksha);
        if (answers.length === 0) return null;
        return (
          <section key={section} className="dd-block" aria-labelledby={`dd-sec-${section}`}>
            <h3 id={`dd-sec-${section}`}>{SECTION_TITLES_CLINICAL[section]}</h3>
            <dl className="dd-qa">
              {answers.map((a) => (
                <div key={a.id}>
                  <dt>{a.question}</dt>
                  <dd className={a.answer === 'Skipped' ? 'dd-muted' : ''}>{a.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
};
