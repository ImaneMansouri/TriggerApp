import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiPatch, apiPost, getToken, setSession } from "../../lib/api";
import { navigateWithTransition } from "../../lib/motion";

// Free, keyless US zip -> lat/lon lookup, used only for the "deny geolocation" fallback path.
const ZIP_LOOKUP = (zip) => `https://api.zippopotam.us/us/${zip}`;

export function OnboardingLocation() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle"); // idle | locating | saving
  const [errorMessage, setErrorMessage] = useState("");
  const [showZipFallback, setShowZipFallback] = useState(false);
  const [zip, setZip] = useState("");

  async function saveLocation(lat, lon) {
    setStatus("saving");
    try {
      const { user } = await apiPatch("/api/auth/profile", { lat, lon });
      setSession(getToken(), user);
      // One-time setup, not the frequent episode-save path — worth actually waiting for
      // (with a loading state) rather than firing-and-forgetting, so Home doesn't show an
      // empty/error state on first load. If Open-Meteo is having a bad day, we still let the
      // user in — Home's own retry handles a missing today's row gracefully either way.
      await apiPost("/api/env/backfill", {}).catch(() => {});
      navigateWithTransition(navigate, "/home");
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      setShowZipFallback(true);
      setErrorMessage("Location isn't available in this browser — enter your zip code instead.");
      return;
    }
    setStatus("locating");
    setErrorMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => saveLocation(pos.coords.latitude, pos.coords.longitude),
      () => {
        setStatus("idle");
        setShowZipFallback(true);
        setErrorMessage("Couldn't get your location — enter your zip code instead.");
      },
      { timeout: 10000 }
    );
  }

  async function handleZipSubmit(e) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zip)) {
      setErrorMessage("Enter a 5-digit US zip code.");
      return;
    }
    setStatus("saving");
    setErrorMessage("");
    try {
      const res = await fetch(ZIP_LOOKUP(zip));
      if (!res.ok) throw new Error("Couldn't find that zip code.");
      const data = await res.json();
      const place = data.places?.[0];
      if (!place) throw new Error("Couldn't find that zip code.");
      await saveLocation(parseFloat(place.latitude), parseFloat(place.longitude));
    } catch (err) {
      setErrorMessage(err.message);
      setStatus("idle");
    }
  }

  const busy = status === "locating" || status === "saving";

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={5} />
        <h1 className="page-title">Where are you?</h1>
        <p className="onboarding-blurb">So we can match your symptoms to your local air and weather.</p>

        <button type="button" className="save-button" onClick={handleUseLocation} disabled={busy}>
          {status === "locating" ? "Locating..." : status === "saving" ? "Setting up your data..." : "Use my location"}
        </button>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        {showZipFallback && (
          <form className="zip-form" onSubmit={handleZipSubmit}>
            <label className="log-section-title" htmlFor="zip">
              Or enter your zip code
            </label>
            <input
              id="zip"
              className="note-field"
              type="text"
              inputMode="numeric"
              placeholder="52803"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              maxLength={5}
            />
            <button type="submit" className="secondary-button" disabled={busy}>
              Continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
