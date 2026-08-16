import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { AuraAvatar, avatarLabel } from "../../Components/AuraAvatar.jsx";
import { apiPatch, getToken, setSession } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";
import { AVATAR_OPTIONS } from "../../lib/categories";

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
        <OnboardingProgress step={2} back="/onboarding/profile" />
        <h1 className="page-title">Pick your character</h1>
        <p className="onboarding-blurb">This is who'll greet you on the home screen.</p>

        <div className="avatar-grid">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar}
              type="button"
              className={`avatar-option ${selected === avatar ? "avatar-option-selected" : ""}`}
              onClick={() => setSelected(avatar)}
              aria-pressed={selected === avatar}
              aria-label={avatar}
            >
              <AuraAvatar id={avatar} size={56} />
              <span className="avatar-option-label">{avatarLabel(avatar)}</span>
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
