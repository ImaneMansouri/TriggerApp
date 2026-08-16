export function OnboardingProgress({ step, total = 5 }) {
  return (
    <div className="onboarding-progress">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className={`onboarding-dot ${n <= step ? "onboarding-dot-active" : ""}`} />
      ))}
    </div>
  );
}
