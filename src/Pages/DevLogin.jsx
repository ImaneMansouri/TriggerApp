import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, setSession } from "../lib/api";

// ============================================================
// DEV-ONLY BYPASS — MUST REMOVE BEFORE DEPLOY.
// Logs in as the seeded demo account (demo@triggerapp.com) and drops straight
// into the app, so pages behind login can be worked on before AuthWin's
// signup/login submit handlers are wired up. Delete this file and its
// "/dev-login" route in App.jsx once real auth is in place.
// ============================================================
export function DevLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiPost("/api/auth/login", { email: "demo@triggerapp.com", password: "demo123" })
      .then(({ token, user }) => {
        if (cancelled) return;
        setSession(token, user);
        navigate("/home", { replace: true });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="page">
      <div className="page-content">
        <p className="status-message">
          {error ? `Dev login failed: ${error}` : "Logging in as demo account..."}
        </p>
      </div>
    </div>
  );
}
