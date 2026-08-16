export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-card">
      <div className="error-card-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4M12 17.2v.1" />
        </svg>
      </div>
      <p className="error-card-message">{message}</p>
      {onRetry && (
        <button type="button" className="secondary-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
