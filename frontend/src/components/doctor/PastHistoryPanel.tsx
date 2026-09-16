import React from 'react';
import type { Consultation, Doctor, Patient } from '../../types';
import { formatDate } from './clinicalFormat';
import { downloadPrescriptionPdf } from './rxPdf';
import { CalendarClock, Download, FileText, History, Pill, ShieldCheck } from 'lucide-react';

interface PastHistoryPanelProps {
  patient: Patient;
  visits: Consultation[];
  doctor: Doctor;
}

const byDateDesc = <T,>(get: (item: T) => string) => (a: T, b: T) => get(b).localeCompare(get(a));

// Everything the patient sees on their own records page — previous visits,
// prescriptions from any doctor, uploaded reports and the health timeline —
// laid out for the practitioner.
export const PastHistoryPanel: React.FC<PastHistoryPanelProps> = ({ patient, visits, doctor }) => {
  const sortedVisits = [...visits].sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
  const prescriptions = [...patient.prescriptions].sort(byDateDesc((rx) => rx.date));
  const documents = [...patient.documents].sort(byDateDesc((d) => d.uploadedOn));
  const timeline = [...patient.timeline].sort(byDateDesc((e) => e.date));

  return (
    <div className="dd-stack">
      <dl className="dd-history-counts">
        <div>
          <dt>OPD visits</dt>
          <dd>{visits.length}</dd>
        </div>
        <div>
          <dt>Prescriptions</dt>
          <dd>{prescriptions.length}</dd>
        </div>
        <div>
          <dt>Uploaded reports</dt>
          <dd>{documents.length}</dd>
        </div>
        <div>
          <dt>Last visit</dt>
          <dd>{formatDate(sortedVisits[0]?.date ?? patient.lastVisit)}</dd>
        </div>
      </dl>

      <section className="dd-block" aria-labelledby="dd-visits-title">
        <h3 id="dd-visits-title">
          <CalendarClock size={17} aria-hidden="true" /> OPD visits at this hospital ({sortedVisits.length})
        </h3>
        {sortedVisits.length === 0 ? (
          <p className="dd-empty">No visits recorded at this hospital.</p>
        ) : (
          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Type</th>
                  <th scope="col">Reason for visit</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedVisits.map((v) => (
                  <tr key={v.id}>
                    <td className="dd-nowrap">
                      {formatDate(v.date)}
                      <div className="dd-muted">{v.time}</div>
                    </td>
                    <td>{v.type}</td>
                    <td>{v.reason}</td>
                    <td className={v.status === 'Completed' ? 'dd-ok' : 'dd-warn'}>{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dd-block" aria-labelledby="dd-past-rx-title">
        <h3 id="dd-past-rx-title">
          <Pill size={17} aria-hidden="true" /> Previous prescriptions ({prescriptions.length})
        </h3>
        {prescriptions.length === 0 ? (
          <p className="dd-empty">No previous prescriptions on record.</p>
        ) : (
          <ul className="dd-rx-list">
            {prescriptions.map((rx) => (
              <li key={rx.id} className="dd-rx-card">
                <div className="dd-rx-card-head">
                  <div>
                    <strong>{rx.diagnosis || 'Consultation'}</strong>
                    <div className="dd-muted">
                      {rx.doctorName} · {rx.doctorSpecialty} · {rx.hospitalName}
                    </div>
                  </div>
                  <div className="dd-rx-card-side">
                    <span className="dd-date-tag">{formatDate(rx.date)}</span>
                    <button
                      className="dd-icon-btn"
                      onClick={() => downloadPrescriptionPdf(rx, patient, doctor)}
                      aria-label={`Download prescription from ${formatDate(rx.date)} as PDF`}
                      title="Download PDF"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>

                <dl className="dd-rx-body">
                  <div>
                    <dt>Medicines</dt>
                    <dd>
                      {rx.medicines.length ? (
                        <ol>
                          {rx.medicines.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ol>
                      ) : (
                        <span className="dd-muted">None</span>
                      )}
                    </dd>
                  </div>
                  {rx.tests.length > 0 && (
                    <div>
                      <dt>Investigations</dt>
                      <dd>{rx.tests.join('; ')}</dd>
                    </div>
                  )}
                  {rx.notes && (
                    <div>
                      <dt>Advice</dt>
                      <dd>{rx.notes}</dd>
                    </div>
                  )}
                  {rx.followUp && (
                    <div>
                      <dt>Follow-up</dt>
                      <dd>{rx.followUp}</dd>
                    </div>
                  )}
                </dl>

                {rx.signature && (
                  <p className="dd-rx-signed">
                    <ShieldCheck size={14} aria-hidden="true" /> Digitally signed by {rx.signature.signedBy}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dd-block" aria-labelledby="dd-docs-title">
        <h3 id="dd-docs-title">
          <FileText size={17} aria-hidden="true" /> Reports uploaded by the patient ({documents.length})
        </h3>
        {documents.length === 0 ? (
          <p className="dd-empty">The patient has not uploaded any reports.</p>
        ) : (
          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Type</th>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Extracted findings</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <span className="dd-doc">
                        <FileText size={16} aria-hidden="true" />
                        <span>
                          <strong>{doc.name}</strong>
                          <span className="dd-muted"> · {doc.size}</span>
                        </span>
                      </span>
                    </td>
                    <td>{doc.category}</td>
                    <td className="dd-nowrap">{formatDate(doc.uploadedOn)}</td>
                    <td>{doc.extracted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dd-block" aria-labelledby="dd-timeline-title">
        <h3 id="dd-timeline-title">
          <History size={17} aria-hidden="true" /> Health timeline ({timeline.length})
        </h3>
        {timeline.length === 0 ? (
          <p className="dd-empty">No events recorded.</p>
        ) : (
          <ol className="dd-timeline">
            {timeline.map((ev, i) => (
              <li key={`${ev.date}-${i}`}>
                <span className="dd-timeline-date">{formatDate(ev.date)}</span>
                <span className="dd-timeline-type">{ev.type}</span>
                <span>{ev.event}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
