import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiGet, apiPost, apiDelete } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";
import { SYMPTOM_CATEGORIES } from "../../lib/categories";

export function OnboardingSymptoms() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    apiGet("/api/symptoms")
      .then((data) => {
        setSymptoms(data.symptoms.filter((s) => s.active));
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus("ready");
      });
  }, []);

  async function handleAdd() {
    if (!name.trim() || !category) return;
    setErrorMessage("");
    try {
      const data = await apiPost("/api/symptoms", { name: name.trim(), category });
      setSymptoms(data.symptoms.filter((s) => s.active));
      setName("");
      setCategory(null);
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  async function handleRemove(id) {
    try {
      const data = await apiDelete(`/api/symptoms/${id}`);
      setSymptoms(data.symptoms.filter((s) => s.active));
    } catch (err) {
      setErrorMessage(err.message);
    }
  }

  function handleContinue() {
    if (symptoms.length === 0) return;
    navigateWithTransition(navigate, "/onboarding/capabilities");
  }

  const categoryLabel = (id) => SYMPTOM_CATEGORIES.find((c) => c.id === id)?.label || id;

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={3} back="/onboarding/avatar" />
        <h1 className="page-title">What do you want to track?</h1>
        <p className="onboarding-blurb">
          Add the symptoms that matter to you, any name you like. Pick the category closest to
          it so we know what environmental factors are worth comparing later.
        </p>

        <section className="log-section">
          <h2 className="log-section-title">Symptom name</h2>
          <input
            className="note-field"
            type="text"
            placeholder="e.g. rash, cough, brain fog"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            aria-label="Symptom name"
          />
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Category</h2>
          <div className="chip-grid">
            {SYMPTOM_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip ${category === c.id ? "chip-selected" : ""}`}
                onClick={() => setCategory(category === c.id ? null : c.id)}
                aria-pressed={category === c.id}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          className="secondary-button onboarding-add-button"
          onClick={handleAdd}
          disabled={!name.trim() || !category}
        >
          + Add symptom
        </button>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        {status === "ready" && symptoms.length > 0 && (
          <ul className="tracked-symptom-list">
            {symptoms.map((s) => (
              <li key={s.id} className="tracked-symptom-row">
                <span className="tracked-symptom-name">{s.name}</span>
                <span className="tracked-symptom-category">{categoryLabel(s.category)}</span>
                <button
                  type="button"
                  className="tracked-symptom-remove"
                  onClick={() => handleRemove(s.id)}
                  aria-label={`Remove ${s.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="save-button"
          onClick={handleContinue}
          disabled={symptoms.length === 0}
          style={{ marginTop: "20px" }}
        >
          Continue{symptoms.length === 0 ? " (add at least one)" : ""}
        </button>
      </div>
    </div>
  );
}
