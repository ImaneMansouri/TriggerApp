import { Navigate } from "react-router-dom";
import { getUser } from "../lib/api";

// Gates the Today screen specifically: a user with no saved location hasn't
// finished onboarding yet, so bounce them back into it instead of showing empty tiles.
export function RequireOnboarding({ children }) {
  const user = getUser();
  if (!user || user.lat == null || user.lon == null) {
    return <Navigate to="/onboarding/location" replace />;
  }
  return children;
}
