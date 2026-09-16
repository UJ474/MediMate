// Prototype persistence layer. Simulates the hospital's patient database by
// storing records in localStorage so a submitted consultation "survives"
// across the demo (a stand-in for the PostgreSQL patient table described in
// the architecture doc, until a real backend is wired up).
import type { Patient } from '../types';

const STORAGE_KEY = 'medimate_patient_db_v2';

export function loadPatientDb(seed: Patient[]): Patient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const stored = JSON.parse(raw) as Patient[];
    const byId = new Map(seed.map((p) => [p.id, p]));
    for (const p of stored) byId.set(p.id, p);
    return Array.from(byId.values());
  } catch {
    return seed;
  }
}

export function savePatientDb(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch {
    // Storage unavailable (private mode, kiosk lockdown) — fail silently, in-memory state still works for the demo.
  }
}

export function newPatientId(): string {
  return `P${Date.now().toString().slice(-6)}`;
}
