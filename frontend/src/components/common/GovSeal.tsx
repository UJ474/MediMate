// Neutral circular seal used as the portal mark. Deliberately not the State
// Emblem of India, whose use is restricted by law.
export const GovSeal: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="MediMate seal">
    <circle cx="32" cy="32" r="30" fill="#FFFFFF" stroke="#0B2447" strokeWidth="2.5" />
    <circle cx="32" cy="32" r="24.5" fill="none" stroke="#0B2447" strokeWidth="1" strokeDasharray="2 2.2" />
    <path d="M32 46c-9-4.5-12.5-12-10.5-21 7 .8 11.3 5 12.3 11.4" fill="#138808" opacity="0.9" />
    <path d="M32 46c9-4.5 12.5-12 10.5-21-7 .8-11.3 5-12.3 11.4" fill="#2E9E3E" />
    <path d="M32 46V27" stroke="#0B2447" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="29.6" y="14" width="4.8" height="13" rx="1" fill="#E86A1C" />
    <rect x="25.5" y="18.1" width="13" height="4.8" rx="1" fill="#E86A1C" />
  </svg>
);
