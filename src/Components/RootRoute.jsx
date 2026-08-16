import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../lib/api";
import { Login } from "../Pages/Login.jsx";

// A hard page load (typing the URL, refreshing, opening a bookmark) resets this module's
// state to false — that's the JS execution context starting over. It's what makes "/" show
// Login on a *fresh visit* "regardless of what's in localStorage" (per spec) while still
// letting a same-session login land on Home instead of bouncing straight back to the login
// screen it just came from.
let hasRenderedSinceLoad = false;

export function RootRoute() {
  const navigate = useNavigate();
  // Read-only — mutating this directly in the render body (not here, in an effect) broke
  // under React 18 StrictMode: it double-invokes render functions in development specifically
  // to catch impure renders, so the second call would see the flag already flipped by the
  // first and decide differently. useState's lazy initializer's return value is only taken
  // from the first call either way, so capturing the read here is safe from that.
  const [isFreshLoad] = useState(() => !hasRenderedSinceLoad);

  useEffect(() => {
    hasRenderedSinceLoad = true;
  }, []);

  useEffect(() => {
    const initialToken = getToken();

    // Not a fresh load, and already logged in — e.g. clicking a "Home" link while already
    // signed in elsewhere in the app. Go straight to Home.
    if (!isFreshLoad && initialToken) {
      navigate("/home", { replace: true });
      return;
    }

    // Otherwise (fresh load, or logged out): stay on Login, but watch for a *new* token to
    // show up. AuthWin lives on this same "/" route, so its own `navigate('/')` right after a
    // successful login doesn't change the path — React Router won't naturally re-render this
    // element on its own. Polling localStorage is what actually catches that transition;
    // "new" (not just "present") is what keeps a fresh load with an old token from
    // auto-redirecting on its own — see isFreshLoad's own doc comment above.
    const interval = setInterval(() => {
      const current = getToken();
      if (current && current !== initialToken) {
        clearInterval(interval);
        navigate("/home", { replace: true });
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isFreshLoad, navigate]);

  if (isFreshLoad) {
    return <Login />;
  }

  // Not fresh, still logged out: show Login while the effect above waits for a login.
  // Not fresh, already logged in: render nothing for the instant before the effect redirects.
  return getToken() ? null : <Login />;
}
