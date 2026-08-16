import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiPatch, getToken, setSession, getUser } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";

export function OnboardingProfile() {
  const navigate = useNavigate();
  const existing = getUser();
  const [username, setUsername] = useState(existing?.username || "");
  const [age, setAge] = useState(existing?.age ?? "");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canContinue = username.trim().length > 0;

  async function handleContinue() {
    if (!canContinue) return;
    setStatus("saving");
    setErrorMessage("");
    try {
      const body = { username: username.trim() };
      if (age !== "") body.age = Number(age);
      const { user } = await apiPatch("/api/profile", body);
      setSession(getToken(), user);
      navigateWithTransition(navigate, "/onboarding/avatar");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={1} />
        <h1 className="page-title">What should we call you?</h1>
        <p className="onboarding-blurb">Just the basics to get started.</p>

        <section className="log-section">
          <h2 className="log-section-title">Name</h2>
          <input
            className="note-field"
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={40}
            aria-label="Name"
          />
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Age (optional)</h2>
          <input
            className="note-field"
            type="number"
            inputMode="numeric"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            min={0}
            max={130}
            aria-label="Age"
          />
        </section>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <button type="button" className="save-button" onClick={handleContinue} disabled={!canContinue || status === "saving"}>
          {status === "saving" ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
