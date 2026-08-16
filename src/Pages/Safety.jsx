import { useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

// Reached only when the deterministic rule engine (server/lib/safety.js) flags an episode at
// save time. By design this screen does exactly one thing: tell the user this may be an
// emergency and what to do about it. No tips, no environmental context, no hedging — those
// would dilute the one message that matters here. The episode is already saved before this
// screen ever renders (see LogEpisode.jsx) — nothing here can undo or block that.
export function Safety() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const episode = state?.episode;
  const user = getUser();
  const hasEpinephrine = !!user?.preferences?.hasEpinephrine;

  return (
    <div className="page safety-page">
      <div className="page-content safety-content">
        <div className="safety-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 2 20h20L12 3Z" />
            <path d="M12 9.5v5M12 17.5v.1" />
          </svg>
        </div>

        <h1 className="safety-title">This may need urgent medical attention</h1>

        <p className="safety-message">Call emergency services or go to the emergency room now.</p>

        {hasEpinephrine && (
          <p className="safety-message safety-epi">
            If you've been prescribed an epinephrine auto-injector, use it now.
          </p>
        )}

        {episode?.safety?.reasons?.length > 0 && (
          <ul className="safety-reasons">
            {episode.safety.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}

        <button type="button" className="safety-ack-button" onClick={() => navigateWithTransition(navigate, "/home")}>
          I understand
        </button>
      </div>
    </div>
  );
}
