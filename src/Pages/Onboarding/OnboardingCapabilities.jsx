import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiPatch, getToken, setSession } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";

export function OnboardingCapabilities() {
  const navigate = useNavigate();
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleContinue() {
    if (!acknowledged) return;
    setStatus("saving");
    setErrorMessage("");
    try {
      const { user } = await apiPatch("/api/profile", { preferences: { acknowledgedDisclaimer: true } });
      setSession(getToken(), user);
      navigateWithTransition(navigate, "/onboarding/location");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={4} back="/onboarding/symptoms" />
        <h1 className="page-title">Before we start</h1>

        <div className="capability-card">
          <h2 className="log-section-title">What this app can do</h2>
          <ul className="capability-list capability-list-can">
            <li>Help you track symptoms and conditions over time</li>
            <li>Compare your own episodes against your own environmental baseline</li>
            <li>Surface possible patterns worth a conversation with your care team</li>
          </ul>
        </div>

        <div className="capability-card">
          <h2 className="log-section-title">What it can't do</h2>
          <ul className="capability-list capability-list-cant">
            <li>Diagnose any condition</li>
            <li>Replace medical care or advice</li>
            <li>Reliably detect or predict a medical emergency</li>
          </ul>
        </div>

        <p className="medical-disclaimer onboarding-disclaimer">
          This isn't medical advice. If something feels serious, contact a healthcare provider
          or emergency services.
        </p>

        <label className="acknowledge-row">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          <span>I understand</span>
        </label>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <button type="button" className="save-button" onClick={handleContinue} disabled={!acknowledged || status === "saving"}>
          {status === "saving" ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
