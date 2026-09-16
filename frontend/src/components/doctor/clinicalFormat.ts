// Small formatting helpers shared by the practitioner dashboard components.
import type { Patient } from '../../types';

export function initialsOf(name: string): string {
  return (
    name
      .replace(/^(Dr|Mr|Mrs|Ms)\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

export function riskLabel(level: Patient['riskLevel']): string {
  return `${level} risk`;
}

const num = (value: string) => {
  const m = value.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

// Rough out-of-range checks used only to highlight a value for the doctor's attention.
export function vitalFlags(v: Patient['vitals']): Record<keyof Patient['vitals'], boolean> {
  const [sys, dia] = v.bp.split('/').map(num);
  const pulse = num(v.pulse);
  const spo2 = num(v.spo2);
  const temp = num(v.temp);
  const bmi = num(v.bmi);
  const tempF = temp > 50 ? temp : temp * 1.8 + 32;
  return {
    bp: sys >= 140 || dia >= 90 || sys < 90,
    pulse: pulse > 100 || pulse < 50,
    spo2: spo2 < 95,
    temp: tempF >= 100.4,
    weight: false,
    height: false,
    bmi: bmi >= 30 || bmi < 18.5,
  };
}

export function severityClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s.includes('critical') || s.includes('severe')) return 'sev-critical';
  if (s.includes('high')) return 'sev-high';
  if (s.includes('moderate')) return 'sev-moderate';
  return 'sev-low';
}

export function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
