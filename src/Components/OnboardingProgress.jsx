const STEPS = 3;

export function OnboardingProgress({ step }) {
  return (
    <div className="onboarding-progress">
      {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
        <div key={n} className={`onboarding-dot ${n <= step ? "onboarding-dot-active" : ""}`} />
      ))}
    </div>
  );
}
