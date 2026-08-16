import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { apiGet, apiPost } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

const SEVERITY_LEVELS = [1, 2, 3, 4, 5];
const LOCATIONS = [
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "both", label: "Both" },
];
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LogEpisode() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  // symptomId -> severity (1-5) | undefined when checked but not yet rated
  const [selected, setSelected] = useState({});
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setStatus("loading");
    apiGet("/api/symptoms")
      .then((data) => {
        setSymptoms(data.symptoms.filter((s) => s.active));
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus("error");
      });
  };

  useEffect(load, []);

  function toggleSymptom(id) {
    setSelected((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = undefined;
      return next;
    });
  }

  function setSeverity(id, value) {
    setSelected((prev) => ({ ...prev, [id]: value }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large. Try one under 4MB.");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      setPhotoError("Couldn't read that photo. Try again.");
    }
  }

  function removePhoto() {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const checkedIds = Object.keys(selected);
  const allRated = checkedIds.length > 0 && checkedIds.every((id) => selected[id] !== undefined);
  const canSave = allRated && saveStatus !== "saving";

  async function handleSave() {
    if (!canSave) return;
    setSaveStatus("saving");
    setSaveError("");
    try {
      const payload = {
        date: new Date().toISOString(),
        symptoms: checkedIds.map((symptomId) => ({ symptomId, severity: selected[symptomId] })),
        location: location || "unknown",
        notes: notes.trim() || undefined,
        photoDataUrl: photo || undefined,
      };
      const episode = await apiPost("/api/episodes", payload);
      if (episode.safety?.flagged) {
        navigateWithTransition(navigate, "/safety", { state: { episode } });
      } else {
        navigateWithTransition(navigate, "/relief", { state: { episode } });
      }
    } catch (err) {
      setSaveError(err.message);
      setSaveStatus("idle");
    }
  }

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Log an episode</h1>

        {status === "loading" && (
          <div className="log-section">
            <div className="skeleton" style={{ height: 44, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 44, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 44 }} />
          </div>
        )}

        {status === "error" && <ErrorState message={`Couldn't load your symptoms: ${errorMessage}`} onRetry={load} />}

        {status === "ready" && symptoms.length === 0 && (
          <div className="empty-state">
            <p className="empty-state-message">
              You haven't set up any tracked symptoms yet. Add some from your profile to start logging episodes.
            </p>
            <button type="button" className="secondary-button" onClick={() => navigateWithTransition(navigate, "/profile")}>
              Go to profile
            </button>
          </div>
        )}

        {status === "ready" && symptoms.length > 0 && (
          <>
            <section className="log-section">
              <h2 className="log-section-title">What are you feeling?</h2>
              <div className="symptom-checklist">
                {symptoms.map((s) => {
                  const isChecked = s.id in selected;
                  return (
                    <div key={s.id} className="symptom-check-row">
                      <label className="symptom-check-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSymptom(s.id)}
                        />
                        <span>{s.name}</span>
                      </label>
                      {isChecked && (
                        <div className="severity-control" role="group" aria-label={`Severity for ${s.name}`}>
                          {SEVERITY_LEVELS.map((level) => (
                            <button
                              key={level}
                              type="button"
                              className={`severity-button ${selected[s.id] === level ? "severity-button-selected" : ""}`}
                              onClick={() => setSeverity(s.id, level)}
                              aria-pressed={selected[s.id] === level}
                              aria-label={`Severity ${level} of 5`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="log-section">
              <h2 className="log-section-title">Where were you?</h2>
              <div className="toggle-group">
                {LOCATIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`toggle-option ${location === opt.value ? "toggle-option-selected" : ""}`}
                    onClick={() => setLocation(location === opt.value ? null : opt.value)}
                    aria-pressed={location === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="log-section">
              <h2 className="log-section-title">Photo (optional)</h2>
              {photo ? (
                <div className="photo-preview">
                  <img src={photo} alt="Attached to this episode" />
                  <button type="button" className="secondary-button" onClick={removePhoto}>
                    Remove photo
                  </button>
                </div>
              ) : (
                <label className="photo-upload-button secondary-button">
                  Add a photo
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: "none" }}
                  />
                </label>
              )}
              {photoError && <p className="status-message status-message-error">{photoError}</p>}
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

            {saveError && <p className="status-message status-message-error">{saveError}</p>}

            <button type="button" className="save-button" disabled={!canSave} onClick={handleSave}>
              {saveStatus === "saving" ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
