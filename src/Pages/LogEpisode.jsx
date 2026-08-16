import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { apiPost } from "../lib/api";

const SYMPTOMS = [
  "Headache",
  "Fatigue",
  "Congestion",
  "Joint pain",
  "Shortness of breath",
  "Nausea",
  "Brain fog",
  "Skin flare-up",
];

const SEVERITY_FACES = [
  { value: 2, face: "😊", label: "Mild" },
  { value: 4, face: "🙂", label: "Noticeable" },
  { value: 6, face: "😐", label: "Uncomfortable" },
  { value: 8, face: "😣", label: "Rough" },
  { value: 10, face: "😖", label: "Severe" },
];

export function LogEpisode() {
  const navigate = useNavigate();
  const [symptom, setSymptom] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [location, setLocation] = useState("unknown");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const canSave = symptom !== null && severity !== null && status !== "saving";

  async function handleSave() {
    if (!canSave) return;
    setStatus("saving");
    setErrorMessage("");
    try {
      const entry = await apiPost("/api/entries", {
        date: new Date().toISOString(),
        symptom: symptom.toLowerCase(),
        severity,
        location,
        notes: notes.trim() || undefined,
      });
      navigate("/relief", { state: { entry } });
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Log an episode</h1>

        <section className="log-section">
          <h2 className="log-section-title">What are you feeling?</h2>
          <div className="chip-grid">
            {SYMPTOMS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${symptom === s ? "chip-selected" : ""}`}
                onClick={() => setSymptom(symptom === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        <section className="log-section">
          <h2 className="log-section-title">How bad is it?</h2>
          <div className="face-row">
            {SEVERITY_FACES.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`face-button ${severity === f.value ? "face-button-selected" : ""}`}
                onClick={() => setSeverity(severity === f.value ? null : f.value)}
                aria-label={f.label}
              >
                <span className="face-emoji">{f.face}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Where were you?</h2>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-option ${location === "indoor" ? "toggle-option-selected" : ""}`}
              onClick={() => setLocation(location === "indoor" ? "unknown" : "indoor")}
            >
              Indoor
            </button>
            <button
              type="button"
              className={`toggle-option ${location === "outdoor" ? "toggle-option-selected" : ""}`}
              onClick={() => setLocation(location === "outdoor" ? "unknown" : "outdoor")}
            >
              Outdoor
            </button>
          </div>
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Note (optional)</h2>
          <textarea
            className="note-field"
            placeholder="Anything else worth remembering..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </section>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <button type="button" className="save-button" disabled={!canSave} onClick={handleSave}>
          {status === "saving" ? "Saving..." : "Save"}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
