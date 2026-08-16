import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "../lib/api";

// Figures out which onboarding step (if any) a user still needs, so a user who drops off
// partway through resumes at the right screen instead of being bounced to step 1 every time.
// Gates the Today screen specifically — other authenticated pages don't force onboarding
// completion, since e.g. Profile itself needs to be reachable to fix things up.
function nextOnboardingStep(user) {
  if (!user) return "/onboarding/profile";
  if (!user.username) return "/onboarding/profile";
  if (!user.avatar) return "/onboarding/avatar";
  if (!(user.trackedSymptoms || []).some((s) => s.active)) return "/onboarding/symptoms";
  if (!user.preferences?.acknowledgedDisclaimer) return "/onboarding/capabilities";
  if (user.lat == null || user.lon == null) return "/onboarding/location";
  return null;
}

export function RequireOnboarding({ children }) {
  const location = useLocation();
  const user = getUser();
  const next = nextOnboardingStep(user);
  if (next && next !== location.pathname) {
    return <Navigate to={next} replace />;
  }
  return children;
}
