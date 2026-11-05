export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span className="line" />
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="line" />
    </div>
  );
}

export function ChurchIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M24 4v8M20.5 7.5h7" />
      <path d="M14 22 24 12l10 10" />
      <path d="M16 20v24h16V20" />
      <path d="M8 44V30l8-6M40 44V30l-8-6" />
      <path d="M21 44v-7a3 3 0 0 1 6 0v7" />
      <path d="M22 26a2 2 0 0 1 4 0v3h-4z" />
      <path d="M5 44h38" />
    </svg>
  );
}

export function GlassesIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 8h9l-.5 10a4 4 0 0 1-8 0z" transform="rotate(-12 16.5 18)" />
      <path d="M27 8h9l-.5 10a4 4 0 0 1-8 0z" transform="rotate(12 31.5 18)" />
      <path d="M14.6 26.5 12.5 40M33.4 26.5 35.5 40M8.5 40.5h8M31.5 40.5h8" />
      <path d="M22 5l2-2 2 2M24 3v4" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
