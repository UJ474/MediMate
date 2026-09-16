import React, { useMemo, useState } from 'react';
import './doctor.css';
import type { Consultation, Doctor, Patient, Prescription } from '../../types';
import { isoDaysAgo } from '../../data/opdRegister';
import { PatientRecord } from './PatientRecord';
import { initialsOf, riskLabel } from './clinicalFormat';
import { CalendarDays, CheckCircle2, ClipboardList, Clock, Search, ShieldAlert, Stethoscope, Users } from 'lucide-react';

interface DoctorDashboardProps {
  doctor: Doctor;
  // Already restricted to patients registered at the doctor's hospital.
  patients: Patient[];
  register: Consultation[];
  onIssuePrescription: (patientId: string, prescription: Prescription) => void;
}

type RegisterView = 'today' | 'week' | 'all';
type StatusFilter = 'all' | Consultation['status'];
type RiskFilter = 'all' | Patient['riskLevel'];

interface RegisterRow {
  key: string;
  patient: Patient;
  visit?: Consultation;
}

const RISK_ORDER: Record<Patient['riskLevel'], number> = { Critical: 0, High: 1, Moderate: 2, Low: 3 };

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Practitioner workstation: OPD register on the left, the selected patient's
// record on the right. On narrow screens the two are shown one at a time.
export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctor, patients, register, onIssuePrescription }) => {
  const today = isoDaysAgo(0);
  const weekStart = isoDaysAgo(6);

  const [view, setView] = useState<RegisterView>('today');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Only used below the tablet breakpoint, where the register and record share the screen.
  const [mobilePane, setMobilePane] = useState<'register' | 'record'>('register');

  const byId = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  // Most recent register visit per patient; the register is sorted newest first.
  const lastVisitById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of register) if (c.date <= today && !map.has(c.patientId)) map.set(c.patientId, c.date);
    return map;
  }, [register, today]);

  const todayVisits = useMemo(() => register.filter((c) => c.date === today), [register, today]);
  const weekVisits = useMemo(() => register.filter((c) => c.date >= weekStart && c.date <= today), [register, weekStart, today]);

  const stats = {
    today: todayVisits.length,
    awaiting: todayVisits.filter((c) => c.status === 'Awaiting review').length,
    completed: todayVisits.filter((c) => c.status === 'Completed').length,
    highRisk: new Set(
      todayVisits.map((c) => byId.get(c.patientId)).filter((p) => p && (p.riskLevel === 'Critical' || p.riskLevel === 'High'))
    ).size,
  };

  const rows: RegisterRow[] = useMemo(() => {
    const base: RegisterRow[] =
      view === 'all'
        ? [...patients]
            .sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel] || a.name.localeCompare(b.name))
            .map((p) => ({ key: p.id, patient: p }))
        : (view === 'today' ? todayVisits : weekVisits).flatMap((c) => {
            const patient = byId.get(c.patientId);
            return patient ? [{ key: c.id, patient, visit: c }] : [];
          });

    const q = query.trim().toLowerCase();
    return base.filter(({ patient, visit }) => {
      if (riskFilter !== 'all' && patient.riskLevel !== riskFilter) return false;
      if (statusFilter !== 'all' && view !== 'all' && visit?.status !== statusFilter) return false;
      if (!q) return true;
      return [patient.name, patient.abha, patient.phone, patient.chiefComplaint, visit?.reason, visit?.id]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [view, patients, todayVisits, weekVisits, byId, query, riskFilter, statusFilter]);

  // Default selection: the first patient still awaiting review today, else the first row.
  const fallbackId =
    todayVisits.find((c) => c.status === 'Awaiting review')?.patientId ?? rows[0]?.patient.id ?? patients[0]?.id ?? null;
  const activePatient = byId.get(selectedId ?? '') ?? byId.get(fallbackId ?? '');
  const activeVisit = activePatient
    ? register.find((c) => c.patientId === activePatient.id && c.date === today) ??
      register.find((c) => c.patientId === activePatient.id)
    : undefined;

  const selectPatient = (id: string) => {
    setSelectedId(id);
    setMobilePane('record');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabs: Array<{ id: RegisterView; label: string; count: number }> = [
    { id: 'today', label: 'Today', count: todayVisits.length },
    { id: 'week', label: 'Last 7 days', count: weekVisits.length },
    { id: 'all', label: 'All patients', count: patients.length },
  ];

  return (
    <div className="dd" data-pane={mobilePane}>
      {/* Practitioner header */}
      <section className="dd-panel dd-doctor" aria-label="Practitioner">
        <div className="dd-doctor-id">
          <span className="dd-doctor-icon" aria-hidden="true">
            <Stethoscope size={22} />
          </span>
          <div>
            <h1 className="dd-doctor-name">{doctor.name}</h1>
            <p className="dd-doctor-meta">
              {doctor.qualification} · {doctor.specialty} · Reg. No. {doctor.registrationNo}
            </p>
            <p className="dd-doctor-meta">{doctor.hospital}</p>
          </div>
        </div>
        <p className="dd-today">
          <CalendarDays size={16} aria-hidden="true" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </section>

      <section className="dd-stats" aria-label="Today's OPD summary">
        <div className="dd-stat">
          <Users size={20} aria-hidden="true" />
          <div>
            <span className="dd-stat-num">{stats.today}</span>
            <span className="dd-stat-label">Today's OPD visits</span>
          </div>
        </div>
        <div className="dd-stat tone-warn">
          <Clock size={20} aria-hidden="true" />
          <div>
            <span className="dd-stat-num">{stats.awaiting}</span>
            <span className="dd-stat-label">Awaiting review</span>
          </div>
        </div>
        <div className="dd-stat tone-ok">
          <CheckCircle2 size={20} aria-hidden="true" />
          <div>
            <span className="dd-stat-num">{stats.completed}</span>
            <span className="dd-stat-label">Completed today</span>
          </div>
        </div>
        <div className="dd-stat tone-alert">
          <ShieldAlert size={20} aria-hidden="true" />
          <div>
            <span className="dd-stat-num">{stats.highRisk}</span>
            <span className="dd-stat-label">High or critical risk today</span>
          </div>
        </div>
      </section>

      <div className="dd-workspace">
        {/* OPD register */}
        <aside className="dd-panel dd-register" aria-labelledby="dd-register-title">
          <h2 id="dd-register-title" className="dd-panel-title">
            <ClipboardList size={18} aria-hidden="true" /> OPD Register
          </h2>

          <div className="dd-register-controls">
            <div className="dd-seg" role="tablist" aria-label="Register view">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={view === tab.id}
                  className={view === tab.id ? 'active' : ''}
                  onClick={() => setView(tab.id)}
                >
                  {tab.label} <span className="dd-seg-count">{tab.count}</span>
                </button>
              ))}
            </div>

            <label className="dd-search">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search patients</span>
              <input
                type="search"
                placeholder="Search name, ABHA, mobile or complaint"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="dd-filters">
              <label>
                <span className="sr-only">Filter by status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  disabled={view === 'all'}
                >
                  <option value="all">All statuses</option>
                  <option value="Awaiting review">Awaiting review</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by risk</span>
                <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}>
                  <option value="all">All risk levels</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </label>
            </div>
          </div>

          <p className="dd-result-count" aria-live="polite">
            {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
          </p>

          {rows.length === 0 ? (
            <p className="dd-empty">No patients match these filters.</p>
          ) : (
            <ul className="dd-register-list">
              {rows.map(({ key, patient, visit }) => {
                const active = patient.id === activePatient?.id;
                return (
                  <li key={key}>
                    <button
                      className={`dd-row ${active ? 'active' : ''}`}
                      onClick={() => selectPatient(patient.id)}
                      aria-current={active ? 'true' : undefined}
                    >
                      <span className="dd-row-when">
                        {visit ? (
                          <>
                            <strong>{visit.time}</strong>
                            {visit.date !== today && <span>{formatDay(visit.date)}</span>}
                          </>
                        ) : (
                          <span className="dd-avatar-sm" aria-hidden="true">
                            {initialsOf(patient.name)}
                          </span>
                        )}
                      </span>
                      <span className="dd-row-main">
                        <span className="dd-row-name">{patient.name}</span>
                        <span className="dd-row-meta">
                          {patient.age} y · {patient.gender}
                          {visit ? ` · ${visit.type}` : ` · Last visit ${formatDay(lastVisitById.get(patient.id) ?? patient.lastVisit)}`}
                        </span>
                        <span className="dd-row-reason">{visit?.reason ?? patient.chiefComplaint}</span>
                      </span>
                      <span className="dd-row-tags">
                        <span className={`dd-risk risk-${patient.riskLevel.toLowerCase()}`}>{riskLabel(patient.riskLevel)}</span>
                        {visit && (
                          <span className={`dd-status ${visit.status === 'Completed' ? 'done' : 'pending'}`}>
                            {visit.status === 'Completed' ? 'Completed' : 'Awaiting'}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Selected patient record */}
        <section className="dd-record-wrap" id="patient-record" aria-label="Patient record">
          {activePatient ? (
            <PatientRecord
              key={activePatient.id}
              patient={activePatient}
              visit={activeVisit}
              visits={register.filter((c) => c.patientId === activePatient.id)}
              doctor={doctor}
              onBack={() => setMobilePane('register')}
              onIssuePrescription={onIssuePrescription}
            />
          ) : (
            <div className="dd-panel dd-empty-record">Select a patient from the OPD register.</div>
          )}
        </section>
      </div>
    </div>
  );
};
