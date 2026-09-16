import React, { useState } from 'react';
import './doctor.css';
import type { Patient, Doctor, Prescription } from '../../types';
import { generateClinicalSummary } from '../../services/aiService';
import {
  ShieldAlert, Sparkles, CheckCircle2, FileText, Search
} from 'lucide-react';

interface DoctorDashboardProps {
  doctor: Doctor;
  // Already restricted to patients registered at the doctor's hospital.
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  onIssuePrescription: (patientId: string, prescription: Prescription) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor: selectedDoctor,
  patients,
  activePatient,
  onSelectPatient,
  onIssuePrescription,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'AI' | 'CHART'>('AI');

  // AI Summary State
  const [summary, setSummary] = useState<string>(activePatient.aiInsights?.summary || '');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Diagnostic Orders state
  const [orderedOrders, setOrderedOrders] = useState<string[]>(
    activePatient.aiInsights?.recommendedTests?.slice(0, 3) || []
  );

  // Doctor plan & signoff
  // Patient-visible advice — starts empty so internal triage wording never leaks into the prescription.
  const [doctorNotes, setDoctorNotes] = useState<string>('');
  const [medicinesText, setMedicinesText] = useState<string>('');
  const [isSignedOff, setIsSignedOff] = useState<boolean>(false);
  const [showSignModal, setShowSignModal] = useState<boolean>(false);

  // Sync summary when patient changes
  React.useEffect(() => {
    setSummary(activePatient.aiInsights?.summary || '');
    setOrderedOrders(activePatient.aiInsights?.recommendedTests?.slice(0, 3) || []);
    setIsSignedOff(false);
    setMedicinesText('');
    setDoctorNotes('');
  }, [activePatient.id]);

  // Filter patients
  const filteredPatients = patients.filter((p) => {
    if (filterType === 'CRITICAL' && p.riskLevel !== 'Critical') return false;
    if (filterType === 'HIGH' && p.riskLevel !== 'High') return false;
    if (filterType === 'MODERATE' && p.riskLevel !== 'Moderate') return false;
    if (filterType === 'AYURVEDA' && !p.ayurvedicContext?.relevantHerbs?.length) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.abha.toLowerCase().includes(q) ||
      p.chiefComplaint.toLowerCase().includes(q) ||
      p.diagnoses.some((d) => d.name.toLowerCase().includes(q))
    );
  });

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await generateClinicalSummary(activePatient);
      if (res) setSummary(res);
    } catch (e) {
      console.warn('AI call error', e);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleOrder = (test: string) => {
    if (orderedOrders.includes(test)) {
      setOrderedOrders(orderedOrders.filter((t) => t !== test));
    } else {
      setOrderedOrders([...orderedOrders, test]);
    }
  };

  const handleSignOff = () => {
    onIssuePrescription(activePatient.id, {
      id: `RX-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      hospitalName: selectedDoctor.hospital,
      medicines: medicinesText.split('\n').map((m) => m.trim()).filter(Boolean),
      tests: orderedOrders,
      notes: doctorNotes.trim(),
    });
    setIsSignedOff(true);
    setShowSignModal(false);
  };

  const handleAddChipToNotes = (text: string) => {
    setDoctorNotes((prev) => (prev ? `${prev}\n• ${text}` : `• ${text}`));
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'Critical': return 'badge-critical';
      case 'High': return 'badge-high';
      case 'Moderate': return 'badge-moderate';
      default: return 'badge-success';
    }
  };

  return (
    <div className="doctor-dashboard-layout" dir="ltr">
      {/* LEFT COLUMN: PATIENT TRIAGE & SEARCH */}
      <aside className="triage-panel">
        {/* Doctor Identity Header */}
        <div className="doctor-profile-card">
          <div className="doc-avatar-large">{selectedDoctor.avatar}</div>
          <div className="doc-text-meta">
            <h3>{selectedDoctor.name}</h3>
            <p>{selectedDoctor.specialty}</p>
            <span style={{ fontSize: '0.675rem', color: '#BFDBFE', marginTop: '2px', display: 'block' }}>
              📍 {selectedDoctor.hospital}
            </span>
          </div>
        </div>

        {/* Triage Stats Overview */}
        <div className="triage-stats-bar">
          <div className="stat-unit">
            <h4>{patients.length}</h4>
            <p>Hospital Patients</p>
          </div>
          <div className="stat-unit">
            <h4 style={{ color: 'var(--color-danger)' }}>
              {patients.filter((p) => p.riskLevel === 'Critical').length}
            </h4>
            <p>Emergency</p>
          </div>
          <div className="stat-unit">
            <h4 style={{ color: 'var(--color-accent)' }}>
              {patients.filter((p) => p.riskLevel === 'High').length}
            </h4>
            <p>High Risk</p>
          </div>
          <div className="stat-unit">
            <h4 style={{ color: 'var(--color-primary-mid)' }}>100%</h4>
            <p>AI Synced</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="triage-search-wrap">
          <div className="search-input-box">
            <Search size={15} style={{ color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by name, ABHA, symptom, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-chips-row">
            {[
              { id: 'ALL', label: 'All Patients' },
              { id: 'CRITICAL', label: '🚨 Critical (90+)' },
              { id: 'HIGH', label: '⚠️ High Risk' },
              { id: 'MODERATE', label: '🟡 Moderate' },
              { id: 'AYURVEDA', label: '🌿 AYUSH' },
            ].map((f) => (
              <button
                key={f.id}
                className={`filter-chip-btn ${filterType === f.id ? 'active' : ''}`}
                onClick={() => setFilterType(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patient Triage List */}
        <div className="patient-list-scroll">
          {filteredPatients.map((p) => {
            const isSelected = p.id === activePatient.id;
            return (
              <div
                key={p.id}
                className={`patient-triage-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectPatient(p)}
              >
                <div className="patient-card-top">
                  <div className="patient-brief">
                    <div className="patient-avatar-mini">{p.avatar}</div>
                    <div>
                      <div className="patient-name-title">{p.name}</div>
                      <div className="patient-meta-text">
                        {p.age}y • {p.gender} • Blood: {p.bloodGroup}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${getRiskBadgeClass(p.riskLevel)}`}>
                    {p.riskScore}/100
                  </span>
                </div>

                <div className="patient-complaint-snippet">
                  {p.chiefComplaint}
                </div>

                <div className="patient-vitals-row">
                  <span>BP: <strong style={{ color: p.vitals.bp.includes('182') ? '#EF4444' : '#1E293B' }}>{p.vitals.bp}</strong></span>
                  <span>SpO2: <strong style={{ color: parseInt(p.vitals.spo2) < 95 ? '#EF4444' : '#1E293B' }}>{p.vitals.spo2}</strong></span>
                  <span>Pulse: {p.vitals.pulse}</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT COLUMN: CLINICAL WORKSTATION */}
      <main className="workstation-container">
        {/* Active Patient Header Card */}
        <div className="patient-banner-card">
          <div className="banner-top-row">
            <div className="banner-patient-info">
              <div className="banner-avatar-lg">{activePatient.avatar}</div>
              <div className="banner-title-area">
                <h2>{activePatient.name}</h2>
                <div className="banner-demographics">
                  <span>{activePatient.age} years old</span>
                  <span>•</span>
                  <span>{activePatient.gender}</span>
                  <span>•</span>
                  <span>Blood: <strong>{activePatient.bloodGroup}</strong></span>
                  <span>•</span>
                  <span>ABHA: <code>{activePatient.abha}</code></span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${getRiskBadgeClass(activePatient.riskLevel)}`} style={{ fontSize: '0.825rem', padding: '0.35rem 0.85rem' }}>
                {activePatient.riskLevel} Triage ({activePatient.riskScore}/100)
              </span>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.35rem' }}>
                Last Visit: {activePatient.lastVisit}
              </div>
            </div>
          </div>

          {/* Vitals Metrics Grid */}
          <div className="banner-vitals-grid">
            <div className="vital-metric-tile">
              <span className="vital-metric-label">Blood Pressure</span>
              <span className={`vital-metric-val ${activePatient.vitals.bp.includes('182') ? 'alert' : ''}`}>
                {activePatient.vitals.bp}
              </span>
            </div>
            <div className="vital-metric-tile">
              <span className="vital-metric-label">Heart Rate</span>
              <span className="vital-metric-val">{activePatient.vitals.pulse}</span>
            </div>
            <div className="vital-metric-tile">
              <span className="vital-metric-label">Oxygen (SpO2)</span>
              <span className={`vital-metric-val ${parseInt(activePatient.vitals.spo2) < 95 ? 'alert' : ''}`}>
                {activePatient.vitals.spo2}
              </span>
            </div>
            <div className="vital-metric-tile">
              <span className="vital-metric-label">Body Temp</span>
              <span className="vital-metric-val">{activePatient.vitals.temp}</span>
            </div>
            <div className="vital-metric-tile">
              <span className="vital-metric-label">BMI (Weight)</span>
              <span className="vital-metric-val">{activePatient.vitals.bmi} <small style={{ fontSize: '0.75rem', fontWeight: 500 }}>({activePatient.vitals.weight})</small></span>
            </div>
            <div className="vital-metric-tile">
              <span className="vital-metric-label">Language</span>
              <span className="vital-metric-val" style={{ fontSize: '0.95rem' }}>{activePatient.language}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="workstation-tabs-nav">
          <button
            className={`tab-nav-btn ${activeTab === 'AI' ? 'active' : ''}`}
            onClick={() => setActiveTab('AI')}
          >
            <Sparkles size={16} />
            <span>AI Clinical Decision Support Deck</span>
          </button>
          <button
            className={`tab-nav-btn ${activeTab === 'CHART' ? 'active' : ''}`}
            onClick={() => setActiveTab('CHART')}
          >
            <FileText size={16} />
            <span>Longitudinal Medical Chart & AYUSH</span>
          </button>
        </div>

        {/* TAB 1: AI CLINICAL DECISION SUPPORT DECK */}
        {activeTab === 'AI' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Critical Safety Alerts Deck */}
            {activePatient.aiInsights?.safetyAlerts?.length > 0 && (
              <div className="critical-alerts-deck">
                <div className="alerts-header">
                  <ShieldAlert size={26} style={{ color: 'var(--color-danger)' }} />
                  <div>
                    <h3>Critical Clinical Safety Alerts ({activePatient.aiInsights.safetyAlerts.length})</h3>
                    <p style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                      Automated drug-organ, contraindication, and emergency trigger warnings
                    </p>
                  </div>
                </div>

                {activePatient.aiInsights.safetyAlerts.map((alert, i) => (
                  <div key={i} className="alert-item-box">
                    <div className="alert-item-header">
                      <span className="alert-type-title">{alert.type}</span>
                      <span className="badge badge-critical">{alert.severity}</span>
                    </div>
                    <div className="alert-msg-body">{alert.message}</div>
                    <div className="alert-action-pill">
                      <strong style={{ color: 'var(--color-danger)' }}>REQUIRED ACTION:</strong>
                      <span>{alert.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Case Synthesis */}
            <div className="synthesis-card">
              <div className="synthesis-header">
                <div>
                  <h3>
                    <Sparkles size={18} style={{ color: '#2563EB' }} />
                    AI Patient Case Synthesis
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Multi-source synthesis across symptoms, lab trajectories, and vitals
                  </p>
                </div>

                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                >
                  <Sparkles size={14} style={{ color: '#2563EB' }} />
                  <span>{isRegenerating ? 'Analyzing...' : '⚡ Regenerate with Groq / NVIDIA'}</span>
                </button>
              </div>

              <div className="synthesis-box">
                {summary}
              </div>
            </div>

            {/* Multidisciplinary Clinical Insights Cards */}
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--color-primary-navy)', marginBottom: '0.85rem' }}>
                Multidisciplinary Clinical Reasoning & Evidence
              </h3>

              <div className="insights-grid">
                {activePatient.aiInsights?.keyInsights?.map((insight, idx) => (
                  <div key={idx} className="insight-card">
                    <div>
                      <div className="insight-card-top">
                        <span className="insight-category-tag">{insight.category}</span>
                        <span className={`badge ${getRiskBadgeClass(insight.severity)}`}>
                          {insight.severity}
                        </span>
                      </div>
                      <div className="insight-title-group">
                        <h4>{insight.icon} {insight.title}</h4>
                      </div>
                      <div className="insight-detail-body">{insight.detail}</div>
                    </div>

                    {/* Supporting Evidence Chips */}
                    {insight.evidence?.length > 0 && (
                      <div className="evidence-tags-row">
                        <span style={{ fontSize: '0.675rem', color: '#94A3B8', fontWeight: 700, width: '100%', marginBottom: '2px' }}>
                          EVIDENCE SIGNALS:
                        </span>
                        {insight.evidence.map((ev, eIdx) => (
                          <span key={eIdx} className="evidence-pill">✓ {ev}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Diagnostic Orders Pad */}
            {activePatient.aiInsights?.recommendedTests?.length > 0 && (
              <div className="orders-card">
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                  🧪 Suggested Diagnostic Workup & Lab Requisitions
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                  Select recommended tests to append to the patient requisition order
                </p>

                <div className="orders-checklist">
                  {activePatient.aiInsights.recommendedTests.map((test, tIdx) => {
                    const isChecked = orderedOrders.includes(test);
                    return (
                      <div
                        key={tIdx}
                        className={`order-check-item ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleOrder(test)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563EB' }}
                        />
                        <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#1E293B' }}>{test}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Practitioner Clinical Plan & Notes */}
            <div className="action-plan-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                ✍️ Physician Remarks & Clinical Plan
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Add treatment decisions, modify medication, and digitally verify consultation
              </p>

              {/* Quick Action Chips */}
              <div className="quick-order-chips">
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, alignSelf: 'center' }}>
                  Quick Add:
                </span>
                {[
                  'Discontinue NSAID immediately',
                  'STAT ECG & Cardiology consult',
                  'Repeat Renal Function in 2 weeks',
                  'Schedule Endocrine workup',
                  'Dietary & Lifestyle counseling',
                ].map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    className="quick-chip"
                    onClick={() => handleAddChipToNotes(chip)}
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <label className="rx-field-label" htmlFor="rx-medicines">
                💊 Prescribed Medicines <span>(one per line — shared with the patient)</span>
              </label>
              <textarea
                id="rx-medicines"
                className="plan-textarea rx-medicines-textarea"
                value={medicinesText}
                onChange={(e) => setMedicinesText(e.target.value)}
                disabled={isSignedOff}
                placeholder={'e.g. Metformin 500mg — twice daily after food\nAtorvastatin 20mg — once daily at night'}
              />

              <label className="rx-field-label" htmlFor="rx-notes">
                ✍️ Advice &amp; Plan <span>(shared with the patient)</span>
              </label>
              <textarea
                id="rx-notes"
                className="plan-textarea"
                disabled={isSignedOff}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter physician assessment, differential diagnosis, and action plan..."
              />

              {isSignedOff ? (
                <div style={{ background: '#ECFDF5', border: '1.5px solid #10B981', padding: '1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={24} style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#065F46' }}>
                      Consultation Digitally Signed & Locked
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                      Signed by {selectedDoctor.name} ({selectedDoctor.specialty}) • Prescription sent to patient's records
                    </div>
                  </div>
                </div>
              ) : (
                <button className="btn-primary" onClick={() => setShowSignModal(true)}>
                  <CheckCircle2 size={16} />
                  <span>Verify, Sign &amp; Issue Prescription ({orderedOrders.length} Tests Ordered)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMPREHENSIVE MEDICAL CHART & AYUSH */}
        {activeTab === 'CHART' && (
          <div>
            {/* Longitudinal Timeline */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                Longitudinal Medical Timeline
              </h3>
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clinical Event / Milestone</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {activePatient.timeline?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: '#2563EB', width: '120px' }}>{item.date}</td>
                      <td>{item.event}</td>
                      <td><span className="badge badge-info">{item.type}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Patient-uploaded documents */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                Patient-Uploaded Documents & Reports ({activePatient.documents.length})
              </h3>
              {activePatient.documents.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.75rem' }}>No documents uploaded by the patient.</p>
              ) : (
                <table className="chart-table">
                  <thead>
                    <tr>
                      <th>Uploaded</th>
                      <th>File</th>
                      <th>Category</th>
                      <th>Extracted Findings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePatient.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 700, color: '#2563EB', width: '120px' }}>{doc.uploadedOn}</td>
                        <td>📄 {doc.name} <span style={{ color: '#94A3B8' }}>({doc.size})</span></td>
                        <td><span className="badge badge-info">{doc.category}</span></td>
                        <td>{doc.extracted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Prescriptions issued to this patient */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                Prescriptions Issued ({activePatient.prescriptions.length})
              </h3>
              {activePatient.prescriptions.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.75rem' }}>No prescriptions issued yet.</p>
              ) : (
                <table className="chart-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Doctor</th>
                      <th>Medicines</th>
                      <th>Tests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePatient.prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td style={{ fontWeight: 700, color: '#2563EB', width: '120px' }}>{rx.date}</td>
                        <td>{rx.doctorName}<div style={{ fontSize: '0.72rem', color: '#64748B' }}>{rx.hospitalName}</div></td>
                        <td>{rx.medicines.join('; ') || '—'}</td>
                        <td>{rx.tests.join('; ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Diagnostic Labs Table */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                Diagnostic Labs & Trend Analysis
              </h3>
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result Value</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                    <th>Clinical Trajectory</th>
                  </tr>
                </thead>
                <tbody>
                  {activePatient.labs?.map((lab, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>{lab.type}</td>
                      <td><strong>{lab.value}</strong> {lab.unit}</td>
                      <td style={{ color: '#64748B' }}>{lab.reference || '—'}</td>
                      <td>
                        <span className={`badge ${lab.status.includes('High') || lab.status.includes('Crisis') || lab.status.includes('Supratherapeutic') ? 'badge-critical' : 'badge-success'}`}>
                          {lab.status}
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.8rem' }}>{lab.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Medications & Known Allergies */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-navy)' }}>
                Active Prescriptions & Known Allergies
              </h3>
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Drug Name</th>
                    <th>Frequency</th>
                    <th>Duration Since</th>
                    <th>Patient Adherence</th>
                  </tr>
                </thead>
                <tbody>
                  {activePatient.medications?.map((med, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700 }}>💊 {med.name}</td>
                      <td>{med.frequency}</td>
                      <td style={{ color: '#64748B' }}>{med.since}</td>
                      <td>
                        <span className={`badge ${med.adherence.includes('miss') || med.adherence.includes('Frequent') || med.adherence.includes('Variable') ? 'badge-moderate' : 'badge-success'}`}>
                          {med.adherence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* AYUSH / Ayurvedic Context */}
            {activePatient.ayurvedicContext && (
              <div className="chart-card" style={{ background: '#FDFBF7', borderColor: '#E2D9C8' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#78350F', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🌿 Ayurvedic Constitution & Holistic Profile
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2D9C8' }}>
                    <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Prakriti (Constitution)</span>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#451A03', marginTop: '2px' }}>{activePatient.ayurvedicContext.prakriti}</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2D9C8' }}>
                    <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Agni (Digestive Fire)</span>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#451A03', marginTop: '2px' }}>{activePatient.ayurvedicContext.agni}</div>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: '8px', border: '1px solid #E2D9C8' }}>
                    <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase' }}>Koshtha (Bowel Habit)</span>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#451A03', marginTop: '2px' }}>{activePatient.ayurvedicContext.koshtha}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#78350F', lineHeight: 1.6 }}>
                  <strong>Current Dosha Imbalance (Vikriti):</strong> {activePatient.ayurvedicContext.currentImbalance}
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E', display: 'block', marginBottom: '0.4rem' }}>
                    Documented Herbal Formulations:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {activePatient.ayurvedicContext.relevantHerbs?.map((h, i) => (
                      <span key={i} style={{ background: '#FEF3C7', color: '#92400E', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                        🌱 {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Verification Sign-Off Modal */}
      {showSignModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📜</div>
            <h3 style={{ fontSize: '1.35rem', color: '#0F172A', marginBottom: '0.4rem' }}>
              Confirm & Sign Consultation?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              You are certifying the clinical synthesis for <strong>{activePatient.name}</strong>, approving <strong>{orderedOrders.length} diagnostic test requisitions</strong>, and issuing a prescription that the patient will see in their records.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setShowSignModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSignOff}
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Sign Electronically</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
