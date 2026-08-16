// A friendly illustrated placeholder — inline SVG so it needs no unshipped asset
// and always renders, unlike plain "No data found" text.
export function EmptyState({ title, message, children }) {
  return (
    <div className="empty-state">
      <svg className="empty-state-illustration" viewBox="0 0 120 90" aria-hidden="true">
        <ellipse cx="60" cy="70" rx="46" ry="8" fill="var(--color-sky-soft)" opacity="0.6" />
        <path
          d="M30 52c-9 0-16-7-16-15 0-7.5 5.7-13.7 13-14.9C29 12 38 5 49 5c12 0 22 8.6 24 19.7 8.4 1 15 8.3 15 17.1 0 9.5-7.7 17.2-17.2 17.2H30Z"
          fill="var(--color-white)"
          stroke="var(--color-sky-soft)"
          strokeWidth="2"
        />
        <circle cx="46" cy="34" r="2.6" fill="var(--color-text)" />
        <circle cx="64" cy="34" r="2.6" fill="var(--color-text)" />
        <path d="M46 42c3.5 3 10 3 13.5 0" stroke="var(--color-text)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {children}
    </div>
  );
}
