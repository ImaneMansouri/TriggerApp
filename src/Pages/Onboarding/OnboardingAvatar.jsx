import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { CompanionGlyph } from "../../Components/CompanionGlyph.jsx";
import { apiPatch, getToken, setSession } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";
import { COMPANIONS } from "../../lib/companions";

export function OnboardingAvatar() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleContinue() {
    if (!selected) return;
    setStatus("saving");
    setErrorMessage("");
    try {
      const { user } = await apiPatch("/api/profile", { avatar: selected });
      setSession(getToken(), user);
      navigateWithTransition(navigate, "/onboarding/symptoms");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={2} />
        <h1 className="page-title script-heading">Pick your companion</h1>
        <p className="onboarding-blurb">This is who'll be with you on the home screen.</p>

        <div className="companion-grid">
          {COMPANIONS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`companion-option ${selected === c.id ? "companion-option-selected" : ""}`}
              onClick={() => setSelected(c.id)}
              aria-pressed={selected === c.id}
              aria-label={c.id}
            >
              <CompanionGlyph id={c.id} className="companion-option-glyph" />
            </button>
          ))}
        </div>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <button type="button" className="save-button" onClick={handleContinue} disabled={!selected || status === "saving"}>
          {status === "saving" ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
