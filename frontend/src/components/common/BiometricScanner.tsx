import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, CheckCircle2 } from 'lucide-react';

interface BiometricScannerProps {
  labels: { hint: string; scan: string; scanning: string; place: string; verified: string };
  // Called once the simulated scan completes.
  onVerified: () => void;
}

const SCAN_MS = 2000;

// Simulated fingerprint capture for the kiosk demo: idle → scanning (with
// progress) → verified. A real deployment would call the UIDAI RD service here.
export const BiometricScanner: React.FC<BiometricScannerProps> = ({ labels, onVerified }) => {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'verified'>('idle');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const start = () => {
    if (phase !== 'idle') return;
    setPhase('scanning');
    timers.current.push(
      window.setTimeout(() => setPhase('verified'), SCAN_MS),
      window.setTimeout(onVerified, SCAN_MS + 700)
    );
  };

  return (
    <div className="biometric-panel">
      <p className="biometric-hint">{labels.hint}</p>
      <button
        type="button"
        className={`biometric-scan-btn is-${phase}`}
        onClick={start}
        disabled={phase !== 'idle'}
        aria-live="polite"
      >
        {phase === 'verified' ? <CheckCircle2 size={40} /> : <Fingerprint size={40} />}
        {phase === 'scanning' && <span className="biometric-scan-line" />}
      </button>
      <div className="biometric-status" aria-live="polite">
        <strong>{phase === 'idle' ? labels.scan : phase === 'scanning' ? labels.scanning : labels.verified}</strong>
        {phase === 'scanning' && <span>{labels.place}</span>}
      </div>
      {phase === 'scanning' && (
        <div className="biometric-progress">
          <span style={{ animationDuration: `${SCAN_MS}ms` }} />
        </div>
      )}
    </div>
  );
};
