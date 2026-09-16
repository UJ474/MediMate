// Builds the printable / shareable prescription document with jsPDF and signs
// it with a SHA-256 digest of its clinical content.
import { jsPDF } from 'jspdf';
import type { Doctor, Patient, Prescription } from '../types';

// Content hash used as the electronic-signature fingerprint. Any change to the
// prescription after signing produces a different digest.
export async function signPrescription(rx: Omit<Prescription, 'signature'>, doctor: Doctor): Promise<Prescription> {
  const signedAt = new Date().toISOString();
  const payload = JSON.stringify({ ...rx, signer: doctor.registrationNo, signedAt });
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  const digest = Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return { ...rx, signature: { signedBy: `${doctor.name} (Reg. No. ${doctor.registrationNo})`, signedAt, digest } };
}

// jsPDF's built-in fonts only cover Latin-1; swap the few typographic characters we use.
function latin(text: string): string {
  return text
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/•/g, '-')
    .replace(/[^\x20-\xFF\n]/g, '');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildPrescriptionPdf(rx: Prescription, patient: Patient, doctor: Doctor): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const M = 16;
  let y = 14;

  const text = (value: string, x: number, size = 10, style: 'normal' | 'bold' = 'normal', color = 20) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color);
    doc.text(latin(value), x, y);
  };
  const wrapped = (value: string, x: number, width: number, size = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(20);
    const lines = doc.splitTextToSize(latin(value), width) as string[];
    lines.forEach((line) => {
      ensureSpace(5);
      doc.text(line, x, y);
      y += size * 0.45;
    });
  };
  const ensureSpace = (needed: number) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 18;
    }
  };
  const section = (title: string) => {
    ensureSpace(14);
    y += 3;
    doc.setFillColor(241, 244, 248);
    doc.rect(M, y - 4.5, W - 2 * M, 7, 'F');
    text(title.toUpperCase(), M + 2, 9, 'bold', 40);
    y += 7;
  };

  // Tricolour rule and letterhead
  doc.setFillColor(255, 153, 51);
  doc.rect(0, 0, W / 3, 3, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(W / 3, 0, W / 3, 3, 'F');
  doc.setFillColor(19, 136, 8);
  doc.rect((2 * W) / 3, 0, W / 3, 3, 'F');

  text('Government of India  |  Ministry of Ayush', M, 8.5, 'normal', 90);
  y += 6;
  text(doctor.hospital, M, 15, 'bold', 11);
  y += 5.5;
  text('MediMate - National Digital Health Intake Service', M, 9, 'normal', 90);
  y = 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 36, 71);
  doc.text(latin(doctor.name), W - M, y, { align: 'right' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70);
  doc.text(latin(doctor.qualification), W - M, y, { align: 'right' });
  y += 4.2;
  doc.text(latin(`${doctor.specialty}  |  Reg. No. ${doctor.registrationNo}`), W - M, y, { align: 'right' });
  y += 5;
  doc.setDrawColor(11, 36, 71);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 7;

  text('PRESCRIPTION', M, 12, 'bold', 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(latin(`Rx No. ${rx.id}   |   Date: ${formatDate(rx.date)}`), W - M, y, { align: 'right' });
  y += 7;

  // Patient block
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.rect(M, y - 4.5, W - 2 * M, 17);
  text(`Patient: ${patient.name}`, M + 3, 10, 'bold');
  doc.setFont('helvetica', 'normal');
  doc.text(latin(`${patient.age} yrs / ${patient.gender}   |   Blood group: ${patient.bloodGroup}`), W - M - 3, y, { align: 'right' });
  y += 5.5;
  text(`ABHA: ${patient.abha}    Mobile: ${patient.phone || '-'}`, M + 3, 9, 'normal', 60);
  y += 5;
  const allergyLine = patient.allergies.length
    ? `Allergies: ${patient.allergies.map((a) => `${a.substance} (${a.reaction})`).join(', ')}`
    : 'Allergies: None recorded';
  text(allergyLine, M + 3, 9, patient.allergies.length ? 'bold' : 'normal', patient.allergies.length ? 150 : 60);
  y += 9;

  if (rx.diagnosis) {
    section('Diagnosis / Provisional diagnosis');
    wrapped(rx.diagnosis, M + 2, W - 2 * M - 4);
  }

  section('Rx - Medicines');
  if (rx.medicines.length === 0) {
    wrapped('No medicines prescribed.', M + 2, W - 2 * M - 4);
  } else {
    rx.medicines.forEach((m, i) => {
      ensureSpace(7);
      text(`${i + 1}.`, M + 2, 10, 'bold');
      wrapped(m, M + 9, W - 2 * M - 11);
      y += 1.5;
    });
  }

  if (rx.tests.length) {
    section('Investigations advised');
    rx.tests.forEach((test) => wrapped(`-  ${test}`, M + 2, W - 2 * M - 4));
  }

  if (rx.notes) {
    section('Advice');
    rx.notes.split('\n').filter(Boolean).forEach((line) => wrapped(line, M + 2, W - 2 * M - 4));
  }

  if (rx.followUp) {
    section('Follow-up');
    wrapped(rx.followUp, M + 2, W - 2 * M - 4);
  }

  // Signature block
  ensureSpace(38);
  y += 8;
  doc.setDrawColor(19, 136, 8);
  doc.setLineWidth(0.4);
  doc.rect(W - M - 86, y - 5, 86, 30);
  text('Digitally signed', W - M - 83, 9, 'bold', 20);
  y += 5;
  if (rx.signature) {
    text(rx.signature.signedBy, W - M - 83, 8.5, 'normal', 30);
    y += 4.5;
    text(`On ${new Date(rx.signature.signedAt).toLocaleString('en-IN')}`, W - M - 83, 8, 'normal', 60);
    y += 4.5;
    text('SHA-256:', W - M - 83, 7, 'bold', 60);
    y += 3.5;
    text(rx.signature.digest.slice(0, 32), W - M - 83, 7, 'normal', 60);
    y += 3.2;
    text(rx.signature.digest.slice(32), W - M - 83, 7, 'normal', 60);
  }

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.setFont('helvetica', 'normal');
    doc.text(
      latin('Electronically generated prescription. Verify the SHA-256 digest against the patient\'s ABHA health record.'),
      M,
      287
    );
    doc.text(`Page ${i} of ${pages}`, W - M, 287, { align: 'right' });
  }

  return doc;
}

export function prescriptionFileName(rx: Prescription, patient: Patient): string {
  return `Prescription_${patient.name.replace(/\s+/g, '_')}_${rx.date}.pdf`;
}
