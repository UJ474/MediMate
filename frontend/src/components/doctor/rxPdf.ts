import type { Doctor, Patient, Prescription } from '../../types';

// jsPDF is large, so the PDF/signing module is only loaded when a doctor signs or downloads.
export const loadPrescriptionPdf = () => import('../../services/prescriptionPdf');

export async function downloadPrescriptionPdf(rx: Prescription, patient: Patient, doctor: Doctor) {
  const { buildPrescriptionPdf, prescriptionFileName } = await loadPrescriptionPdf();
  buildPrescriptionPdf(rx, patient, doctor).save(prescriptionFileName(rx, patient));
}
