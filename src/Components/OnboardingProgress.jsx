import { useNavigate } from "react-router-dom";
import { navigateWithTransition } from "../lib/motion";

// `back` is the route for the previous onboarding step; omit it on the first step.
// Matches Aura's back-pill pattern (chevron + label) used throughout the app.
export function OnboardingProgress({ step, total = 5, back }) {
  const navigate = useNavigate();
  return (
    <>
      {back && (
        <button
          type="button"
          className="onboarding-back-pill"
          onClick={() => navigateWithTransition(navigate, back)}
          aria-label="Back to previous step"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          Back
        </button>
      )}
      <div className="onboarding-progress">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <div key={n} className={`onboarding-dot ${n <= step ? "onboarding-dot-active" : ""}`} />
        ))}
      </div>
    </>
  );
}
