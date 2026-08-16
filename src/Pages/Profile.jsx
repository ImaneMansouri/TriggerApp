import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { AuraAvatar } from "../Components/AuraAvatar.jsx";
import { clearSession, getUser, setSession, getToken, apiGet, apiPost, apiPatch, apiDelete } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";
import { SYMPTOM_CATEGORIES, AVATAR_OPTIONS } from "../lib/categories";

export function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [username, setUsername] = useState(user?.username || "");
  const [age, setAge] = useState(user?.age ?? "");
  const [basicsStatus, setBasicsStatus] = useState("idle");
  const [basicsError, setBasicsError] = useState("");

  const [symptoms, setSymptoms] = useState([]);
  const [symptomsStatus, setSymptomsStatus] = useState("loading");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(null);
  const [symptomError, setSymptomError] = useState("");

  useEffect(() => {
    apiGet("/api/symptoms")
      .then((data) => {
        setSymptoms(data.symptoms);
        setSymptomsStatus("ready");
      })
      .catch(() => setSymptomsStatus("error"));
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

  async function handleAvatarChange(avatar) {
    try {
      const { user: updated } = await apiPatch("/api/profile", { avatar });
      syncUser(updated);
    } catch {
      // Non-critical UI action; the avatar simply won't change if this fails.
    }
  }

  async function handleEpinephrineToggle(e) {
    try {
      const { user: updated } = await apiPatch("/api/profile", { preferences: { hasEpinephrine: e.target.checked } });
      syncUser(updated);
    } catch {
      // Non-critical; checkbox will just not persist if this fails.
    }
  }

  async function handleAddSymptom() {
    if (!newName.trim() || !newCategory) return;
    setSymptomError("");
    try {
      const data = await apiPost("/api/symptoms", { name: newName.trim(), category: newCategory });
      setSymptoms(data.symptoms);
      setNewName("");
      setNewCategory(null);
    } catch (err) {
      setSymptomError(err.message);
    }
  }

  async function handleRenameSymptom(id, name) {
    try {
      const data = await apiPatch(`/api/symptoms/${id}`, { name });
      setSymptoms(data.symptoms);
    } catch (err) {
      setSymptomError(err.message);
    }
  }

  async function handleRecategorize(id, category) {
    try {
      const data = await apiPatch(`/api/symptoms/${id}`, { category });
      setSymptoms(data.symptoms);
    } catch (err) {
      setSymptomError(err.message);
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
  const removedSymptoms = symptoms.filter((s) => !s.active);

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Profile</h1>

        <section className="log-section">
          <h2 className="log-section-title">About you</h2>
          <div className="profile-card">
            <label className="profile-field-label" htmlFor="profile-username">Name</label>
            <input
              id="profile-username"
              className="note-field"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label className="profile-field-label" htmlFor="profile-age">Age</label>
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
          <h2 className="log-section-title">Character</h2>
          <div className="avatar-grid avatar-grid-compact">
            {AVATAR_OPTIONS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`avatar-option ${user?.avatar === avatar ? "avatar-option-selected" : ""}`}
                onClick={() => handleAvatarChange(avatar)}
                aria-pressed={user?.avatar === avatar}
                aria-label={avatar}
              >
                <AuraAvatar id={avatar} size={40} />
              </button>
            ))}
          </div>
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Tracked symptoms</h2>

          {symptomsStatus === "ready" && activeSymptoms.length > 0 && (
            <ul className="tracked-symptom-list">
              {activeSymptoms.map((s) => (
                <li key={s.id} className="tracked-symptom-row">
                  <input
                    className="tracked-symptom-input"
                    type="text"
                    defaultValue={s.name}
                    onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && handleRenameSymptom(s.id, e.target.value.trim())}
                    aria-label={`Rename ${s.name}`}
                  />
                  <select
                    className="tracked-symptom-select"
                    value={s.category}
                    onChange={(e) => handleRecategorize(s.id, e.target.value)}
                    aria-label={`Category for ${s.name}`}
                  >
                    {SYMPTOM_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="tracked-symptom-remove"
                    onClick={() => handleRemoveSymptom(s.id)}
                    aria-label={`Remove ${s.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="add-symptom-row">
            <input
              className="note-field"
              type="text"
              placeholder="New symptom name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="chip-grid">
              {SYMPTOM_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${newCategory === c.id ? "chip-selected" : ""}`}
                  onClick={() => setNewCategory(newCategory === c.id ? null : c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {symptomError && <p className="status-message status-message-error">{symptomError}</p>}
            <button
              type="button"
              className="secondary-button"
              onClick={handleAddSymptom}
              disabled={!newName.trim() || !newCategory}
            >
              + Add symptom
            </button>
          </div>

          {removedSymptoms.length > 0 && (
            <p className="profile-removed-note">
              Removed: {removedSymptoms.map((s) => s.name).join(", ")}. Their past episodes are still in your history.
            </p>
          )}
        </section>

        <section className="log-section">
          <h2 className="log-section-title">Preferences</h2>
          <label className="acknowledge-row">
            <input type="checkbox" defaultChecked={!!user?.preferences?.hasEpinephrine} onChange={handleEpinephrineToggle} />
            <span>I carry a prescribed epinephrine auto-injector</span>
          </label>
        </section>

        <button
          type="button"
          className="profile-resources-row"
          onClick={() => navigateWithTransition(navigate, "/resources")}
        >
          <span aria-hidden="true">🩹</span>
          <span>First aid &amp; resources</span>
          <span aria-hidden="true" className="profile-resources-row-chevron">›</span>
        </button>

        <button type="button" className="save-button save-button-danger" onClick={handleLogout}>
          Log out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
