import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiPatch, getToken, setSession } from "../../lib/api";

const CONDITIONS = ["Asthma", "Migraine", "Allergies", "Eczema", "Arthritis", "None"];

export function OnboardingConditions() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function toggle(condition) {
    if (condition === "None") {
      setSelected(["None"]);
      return;
    }
    setSelected((prev) => {
      const withoutNone = prev.filter((c) => c !== "None");
      return withoutNone.includes(condition)
        ? withoutNone.filter((c) => c !== condition)
        : [...withoutNone, condition];
    });
  }

  async function persist(conditions) {
    setSaving(true);
    setErrorMessage("");
    try {
      const { user } = await apiPatch("/api/auth/profile", { conditions });
      setSession(getToken(), user);
      navigate("/onboarding/backfill");
    } catch (err) {
      setErrorMessage(err.message);
      setSaving(false);
    }
  }

  function handleSkip() {
    navigate("/onboarding/backfill");
  }

  function handleContinue() {
    const conditions = selected.includes("None") ? [] : selected.map((c) => c.toLowerCase());
    persist(conditions);
  }

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={2} />
        <h1 className="page-title">Any ongoing conditions?</h1>
        <p className="onboarding-blurb">This helps tailor what we look for. Totally optional.</p>

        <div className="chip-grid">
          {CONDITIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${selected.includes(c) ? "chip-selected" : ""}`}
              onClick={() => toggle(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <div className="onboarding-actions">
          <button type="button" className="secondary-button" onClick={handleSkip} disabled={saving}>
            Skip
          </button>
          <button type="button" className="save-button" onClick={handleContinue} disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
