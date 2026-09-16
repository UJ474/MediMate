import React, { useEffect, useId, useRef, useState } from 'react';
import type { Doctor, Patient, Prescription } from '../../types';
import { formatDate } from './clinicalFormat';
import { isoDaysAgo } from '../../data/opdRegister';
import { downloadPrescriptionPdf as downloadPdf, loadPrescriptionPdf as loadPdf } from './rxPdf';
import { CheckCircle2, Download, Plus, ShieldCheck, Trash2, X } from 'lucide-react';

interface PrescriptionPadProps {
  patient: Patient;
  doctor: Doctor;
  onIssuePrescription: (patientId: string, prescription: Prescription) => void;
}

interface MedicineRow {
  id: number;
  name: string;
  dose: string;
  duration: string;
}

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'At bedtime', 'When required (SOS)'];
const FOLLOW_UPS = ['', 'After 3 days', 'After 1 week', 'After 2 weeks', 'After 1 month', 'After 3 months'];


let rowSeq = 0;
const newRow = (): MedicineRow => ({ id: ++rowSeq, name: '', dose: FREQUENCIES[1], duration: '' });

export const PrescriptionPad: React.FC<PrescriptionPadProps> = ({ patient, doctor, onIssuePrescription }) => {
  const formId = useId();
  const suggested = patient.aiInsights?.recommendedTests ?? [];

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<MedicineRow[]>(() => [newRow()]);
  const [tests, setTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [signing, setSigning] = useState(false);
  const [issued, setIssued] = useState<Prescription | null>(null);
  const [error, setError] = useState('');

  const filledMedicines = medicines.filter((m) => m.name.trim());
  const allTests = [...suggested, ...tests.filter((t) => !suggested.includes(t))];
  const hasContent = filledMedicines.length > 0 || tests.length > 0 || advice.trim().length > 0;

  const updateRow = (id: number, patch: Partial<MedicineRow>) =>
    setMedicines((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const toggleTest = (test: string) =>
    setTests((prev) => (prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]));

  const addCustomTest = () => {
    const value = customTest.trim();
    if (!value) return;
    if (!tests.includes(value)) setTests((prev) => [...prev, value]);
    setCustomTest('');
  };

  const medicineLines = () =>
    filledMedicines.map((m) => [m.name.trim(), m.dose, m.duration.trim()].filter(Boolean).join(' — '));

  const draft = (id: string): Omit<Prescription, 'signature'> => ({
    id,
    date: isoDaysAgo(0),
    doctorName: doctor.name,
    doctorSpecialty: doctor.specialty,
    hospitalName: doctor.hospital,
    doctorRegNo: doctor.registrationNo,
    diagnosis: diagnosis.trim() || undefined,
    medicines: medicineLines(),
    tests,
    notes: advice.trim(),
    followUp: followUp || undefined,
  });

  const sign = async () => {
    setSigning(true);
    setError('');
    try {
      const { signPrescription } = await loadPdf();
      const signed = await signPrescription(draft(`RX-${String(new Date().getTime()).slice(-8)}`), doctor);
      onIssuePrescription(patient.id, signed);
      setIssued(signed);
      setConfirming(false);
    } catch (e) {
      console.warn('Signing failed', e);
      setError('The prescription could not be signed. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const startNew = () => {
    setIssued(null);
    setDiagnosis('');
    setMedicines([newRow()]);
    setTests([]);
    setAdvice('');
    setFollowUp('');
  };

  return (
    <div className="dd-stack">
      {issued ? (
        <section className="dd-block dd-issued" aria-live="polite">
          <h3>
            <CheckCircle2 size={18} aria-hidden="true" /> Prescription signed and issued
          </h3>
          <p>
            {issued.id} is now in {patient.name}'s records. Signed by {issued.signature?.signedBy} on{' '}
            {issued.signature ? new Date(issued.signature.signedAt).toLocaleString('en-IN') : '—'}.
          </p>
          <p className="dd-mono dd-digest">SHA-256 {issued.signature?.digest}</p>
          <div className="dd-actions">
            <button className="btn-primary" onClick={() => downloadPdf(issued, patient, doctor)}>
              <Download size={16} aria-hidden="true" /> Download PDF
            </button>
            <button className="btn-secondary" onClick={startNew}>
              Write another prescription
            </button>
          </div>
        </section>
      ) : (
        <form
          className="dd-block dd-rx-form"
          aria-labelledby={`${formId}-title`}
          onSubmit={(e) => {
            e.preventDefault();
            if (hasContent) setConfirming(true);
          }}
        >
          <h3 id={`${formId}-title`}>New prescription</h3>

          <div className="dd-field">
            <label htmlFor={`${formId}-dx`}>Provisional diagnosis</label>
            <input
              id={`${formId}-dx`}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Iron deficiency anaemia (suspected)"
            />
          </div>

          <fieldset className="dd-fieldset">
            <legend>Medicines</legend>
            <div className="dd-med-head" aria-hidden="true">
              <span>Medicine and strength</span>
              <span>Frequency</span>
              <span>Duration</span>
              <span />
            </div>
            {medicines.map((row, i) => (
              <div key={row.id} className="dd-med-row">
                <label className="sr-only" htmlFor={`${formId}-med-${row.id}`}>
                  Medicine {i + 1}
                </label>
                <input
                  id={`${formId}-med-${row.id}`}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder="e.g. Ferrous sulphate 200 mg"
                />
                <label className="sr-only" htmlFor={`${formId}-freq-${row.id}`}>
                  Frequency for medicine {i + 1}
                </label>
                <select id={`${formId}-freq-${row.id}`} value={row.dose} onChange={(e) => updateRow(row.id, { dose: e.target.value })}>
                  {FREQUENCIES.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
                <label className="sr-only" htmlFor={`${formId}-dur-${row.id}`}>
                  Duration for medicine {i + 1}
                </label>
                <input
                  id={`${formId}-dur-${row.id}`}
                  value={row.duration}
                  onChange={(e) => updateRow(row.id, { duration: e.target.value })}
                  placeholder="e.g. 30 days"
                />
                <button
                  type="button"
                  className="dd-icon-btn"
                  onClick={() => setMedicines((rows) => (rows.length === 1 ? [newRow()] : rows.filter((r) => r.id !== row.id)))}
                  aria-label={`Remove medicine ${i + 1}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary dd-inline-btn" onClick={() => setMedicines((rows) => [...rows, newRow()])}>
              <Plus size={15} aria-hidden="true" /> Add medicine
            </button>
          </fieldset>

          <fieldset className="dd-fieldset">
            <legend>Investigations</legend>
            {allTests.length > 0 && (
              <div className="dd-checks">
                {allTests.map((test) => (
                  <label key={test} className="dd-check">
                    <input type="checkbox" checked={tests.includes(test)} onChange={() => toggleTest(test)} />
                    <span>{test}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="dd-add-test">
              <label className="sr-only" htmlFor={`${formId}-test`}>
                Add another investigation
              </label>
              <input
                id={`${formId}-test`}
                value={customTest}
                onChange={(e) => setCustomTest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomTest();
                  }
                }}
                placeholder="Add another investigation, e.g. Serum ferritin"
              />
              <button type="button" className="btn-secondary" onClick={addCustomTest} disabled={!customTest.trim()}>
                <Plus size={15} aria-hidden="true" /> Add
              </button>
            </div>
          </fieldset>

          <div className="dd-field">
            <label htmlFor={`${formId}-advice`}>Advice for the patient</label>
            <textarea
              id={`${formId}-advice`}
              rows={4}
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Diet, lifestyle and warning signs. The patient sees this text."
            />
          </div>

          <div className="dd-field dd-field-inline">
            <label htmlFor={`${formId}-fu`}>Follow-up</label>
            <select id={`${formId}-fu`} value={followUp} onChange={(e) => setFollowUp(e.target.value)}>
              {FOLLOW_UPS.map((f) => (
                <option key={f} value={f}>
                  {f || 'Not required'}
                </option>
              ))}
            </select>
          </div>

          {!hasContent && <p className="dd-muted">Add at least one medicine, investigation or advice to issue a prescription.</p>}

          <div className="dd-actions">
            <button type="submit" className="btn-primary" disabled={!hasContent}>
              <ShieldCheck size={16} aria-hidden="true" /> Review and sign
            </button>
          </div>
        </form>
      )}

      <section className="dd-block" aria-labelledby={`${formId}-past`}>
        <h3 id={`${formId}-past`}>Prescriptions issued ({patient.prescriptions.length})</h3>
        {patient.prescriptions.length === 0 ? (
          <p className="dd-empty">No prescriptions issued yet.</p>
        ) : (
          <div className="dd-table-wrap">
            <table className="dd-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Doctor</th>
                  <th scope="col">Diagnosis</th>
                  <th scope="col">Medicines</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...patient.prescriptions].sort((a, b) => b.date.localeCompare(a.date)).map((rx) => (
                  <tr key={rx.id}>
                    <td className="dd-nowrap">{formatDate(rx.date)}</td>
                    <td>
                      {rx.doctorName}
                      <div className="dd-muted">{rx.hospitalName}</div>
                    </td>
                    <td>{rx.diagnosis || '—'}</td>
                    <td>{rx.medicines.length ? rx.medicines.join('; ') : '—'}</td>
                    <td>
                      <button
                        className="dd-icon-btn"
                        onClick={() => downloadPdf(rx, patient, doctor)}
                        aria-label={`Download prescription ${rx.id} as PDF`}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirming && (
        <ConfirmDialog
          title="Sign and issue this prescription?"
          onCancel={() => setConfirming(false)}
          onConfirm={sign}
          busy={signing}
          error={error}
        >
          <dl className="dd-qa">
            <div>
              <dt>Patient</dt>
              <dd>
                {patient.name}, {patient.age} y, ABHA {patient.abha}
              </dd>
            </div>
            {diagnosis.trim() && (
              <div>
                <dt>Diagnosis</dt>
                <dd>{diagnosis.trim()}</dd>
              </div>
            )}
            <div>
              <dt>Medicines</dt>
              <dd>{filledMedicines.length ? medicineLines().join('; ') : 'None'}</dd>
            </div>
            <div>
              <dt>Investigations</dt>
              <dd>{tests.length ? tests.join('; ') : 'None'}</dd>
            </div>
            {followUp && (
              <div>
                <dt>Follow-up</dt>
                <dd>{followUp}</dd>
              </div>
            )}
          </dl>
          {patient.allergies.length > 0 && (
            <p className="dd-alert-text">
              Recorded allergies: {patient.allergies.map((a) => a.substance).join(', ')}. Check before signing.
            </p>
          )}
          <p className="dd-muted">
            The prescription is signed as {doctor.name} (Reg. No. {doctor.registrationNo}) and shared with the patient's records.
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
};

// Modal confirmation: traps focus inside, closes on Escape, restores focus on close.
const ConfirmDialog: React.FC<{
  title: string;
  children: React.ReactNode;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, children, busy, error, onCancel, onConfirm }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Latest props for the key handler, so the effect below runs once per open and focus isn't reset on re-render.
  const latest = useRef({ busy, onCancel });
  useEffect(() => {
    latest.current = { busy, onCancel };
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !latest.current.busy) latest.current.onCancel();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, []);

  return (
    <div className="dd-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div className="dd-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <div className="dd-modal-head">
          <h3 id={titleId}>{title}</h3>
          <button className="dd-icon-btn" onClick={onCancel} disabled={busy} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="dd-modal-body">{children}</div>
        {error && (
          <p className="dd-alert-text" role="alert">
            {error}
          </p>
        )}
        <div className="dd-actions dd-modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onConfirm} disabled={busy}>
            <ShieldCheck size={16} aria-hidden="true" /> {busy ? 'Signing…' : 'Sign and issue'}
          </button>
        </div>
      </div>
    </div>
  );
};
