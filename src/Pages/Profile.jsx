import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { CompanionGlyph } from "../Components/CompanionGlyph.jsx";
import { clearSession, getUser, setSession, getToken, apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";
import { SYMPTOM_CATEGORIES, categoryEmoji } from "../lib/categories";
import { COMPANIONS } from "../lib/companions";

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [username, setUsername] = useState(user?.username || "");
  const [age, setAge] = useState(user?.age ?? "");
  const [basicsStatus, setBasicsStatus] = useState("idle");
  const [basicsError, setBasicsError] = useState("");
  const [momentsLogged, setMomentsLogged] = useState(null);

  const [symptoms, setSymptoms] = useState([]);
  const [symptomsStatus, setSymptomsStatus] = useState("loading");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(null);
  const [symptomError, setSymptomError] = useState("");
  const [addingSymptom, setAddingSymptom] = useState(false);

  useEffect(() => {
    apiGet("/api/symptoms")
      .then((data) => {
        setSymptoms(data.symptoms);
        setSymptomsStatus("ready");
      })
      .catch(() => setSymptomsStatus("error"));
    apiGet("/api/episodes")
      .then((data) => setMomentsLogged(data.length))
      .catch(() => setMomentsLogged(null));
  }, []);

  function syncUser(updatedUser) {
    setSession(getToken(), updatedUser);
    setUser(updatedUser);
  }

  async function handleSaveBasics() {
    setBasicsStatus("saving");
    setBasicsError("");
    try {
      const body = { username: username.trim() || undefined, age: age === "" ? null : Number(age) };
      const { user: updated } = await apiPatch("/api/profile", body);
      syncUser(updated);
      setBasicsStatus("saved");
      setTimeout(() => setBasicsStatus("idle"), 1500);
    } catch (err) {
      setBasicsError(err.message);
      setBasicsStatus("idle");
    }
  }

  async function handleCompanionChange(companionId) {
    try {
      const { user: updated } = await apiPatch("/api/profile", { avatar: companionId });
      syncUser(updated);
    } catch {
      // Non-critical UI action; the companion simply won't change if this fails.
    }
  }

  async function handleAddSymptom() {
    if (!newName.trim() || !newCategory) return;
    setSymptomError("");
    setAddingSymptom(true);
    try {
      const data = await apiPost("/api/symptoms", { name: newName.trim(), category: newCategory });
      setSymptoms(data.symptoms);
      setNewName("");
      setNewCategory(null);
    } catch (err) {
      setSymptomError(err.message);
    } finally {
      setAddingSymptom(false);
    }
  }

  async function handleRemoveSymptom(id) {
    try {
      const data = await apiDelete(`/api/symptoms/${id}`);
      setSymptoms(data.symptoms);
    } catch (err) {
      setSymptomError(err.message);
    }
  }

  function handleLogout() {
    clearSession();
    navigateWithTransition(navigate, "/login");
  }

  const activeSymptoms = symptoms.filter((s) => s.active);

  return (
    <div className="page page-with-nav aura-profile">
      <div className="page-content">
        <div className="profile-hero">
          <div className="profile-companion-circle">
            <CompanionGlyph id={user?.avatar} className="profile-companion-glyph" />
          </div>
          <h1 className="script-heading profile-name">{user?.username || "You"}</h1>
          <p className="profile-meta">
            {user?.age ? `Age ${user.age}` : "Age not set"} · {momentsLogged === null ? "…" : momentsLogged} moments logged
          </p>
        </div>

        <section className="log-section">
          <div className="white-card">
            <h2 className="log-section-title">About you</h2>
            <label className="profile-field-label" htmlFor="profile-username">
              Name
            </label>
            <input
              id="profile-username"
              className="note-field"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label className="profile-field-label" htmlFor="profile-age">
              Age
            </label>
            <input
              id="profile-age"
              className="note-field"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={0}
              max={130}
            />
            {basicsError && <p className="status-message status-message-error">{basicsError}</p>}
            <button type="button" className="secondary-button" onClick={handleSaveBasics} disabled={basicsStatus === "saving"}>
              {basicsStatus === "saving" ? "Saving..." : basicsStatus === "saved" ? "Saved!" : "Save"}
            </button>
          </div>
        </section>

        <section className="log-section">
          <div className="white-card">
            <h2 className="log-section-title">Your companion</h2>
            <div className="companion-grid">
              {COMPANIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`companion-option ${user?.avatar === c.id ? "companion-option-selected" : ""}`}
                  onClick={() => handleCompanionChange(c.id)}
                  aria-pressed={user?.avatar === c.id}
                  aria-label={c.id}
                >
                  <CompanionGlyph id={c.id} className="companion-option-glyph" />
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="log-section">
          <div className="white-card">
            <h2 className="log-section-title">What you're keeping an eye on</h2>

            {symptomsStatus === "ready" && activeSymptoms.length > 0 && (
              <ul className="watch-symptom-list">
                {activeSymptoms.map((s) => (
                  <li key={s.id} className="watch-symptom-row">
                    <span className="watch-symptom-emoji" aria-hidden="true">
                      {categoryEmoji(s.category)}
                    </span>
                    <span className="watch-symptom-name">{s.name}</span>
                    <button
                      type="button"
                      className="watch-symptom-remove"
                      onClick={() => handleRemoveSymptom(s.id)}
                      aria-label={`Remove ${s.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!addingSymptom && (
              <button type="button" className="add-symptom-trigger" onClick={() => setAddingSymptom(true)}>
                + Add a symptom
              </button>
            )}

            {addingSymptom && (
              <div className="add-symptom-row">
                <input
                  className="note-field"
                  type="text"
                  placeholder="Symptom name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
                <div className="chip-grid">
                  {SYMPTOM_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chip ${newCategory === c.id ? "chip-selected" : ""}`}
                      onClick={() => setNewCategory(newCategory === c.id ? null : c.id)}
                    >
                      {categoryEmoji(c.id)} {c.label}
                    </button>
                  ))}
                </div>
                {symptomError && <p className="status-message status-message-error">{symptomError}</p>}
                <button type="button" className="secondary-button" onClick={handleAddSymptom} disabled={!newName.trim() || !newCategory}>
                  Add
                </button>
              </div>
            )}

            <p className="profile-removed-note">Removing one keeps your past logs safe — it just won't show on new entries.</p>
          </div>
        </section>

        <button type="button" className="profile-link-row" onClick={() => navigateWithTransition(navigate, "/resources")}>
          <span>🩹 First aid</span>
          <span aria-hidden="true">›</span>
        </button>

        <button type="button" className="logout-button" onClick={handleLogout}>
          Log out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
