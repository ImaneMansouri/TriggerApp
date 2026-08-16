import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { CompanionGlyph } from "../Components/CompanionGlyph.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { apiGet, apiPost, getUser } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

function describeTemperature(mean) {
  if (mean < 10) return { label: "Cold", concerning: true };
  if (mean < 18) return { label: "Cool", concerning: false };
  if (mean < 26) return { label: "Mild", concerning: false };
  if (mean < 32) return { label: "Warm", concerning: false };
  return { label: "Hot", concerning: true };
}

function describeHumidity(mean) {
  if (mean < 30) return { label: "Low", concerning: false };
  if (mean <= 60) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

// EPA AQI breakpoints, PM2.5 24-hour (µg/m³), per the revised NAAQS effective May 2024:
// Good 0-9.0, Moderate 9.1-35.4, Unhealthy for Sensitive Groups 35.5-55.4, Unhealthy+ above
// that. Verified against EPA's own AQS breakpoints table (aqs.epa.gov).
function describeAirQuality(pm25) {
  if (pm25 <= 9.0) return { label: "Good", concerning: false };
  if (pm25 <= 35.4) return { label: "Moderate", concerning: false };
  if (pm25 <= 55.4) return { label: "Poor", concerning: true };
  return { label: "Very poor", concerning: true };
}

// EPA AQI breakpoints, ozone 8-hour: Good 0-0.054ppm, Moderate 0.055-0.070ppm. Open-Meteo
// reports µg/m³, not ppm — converted at EPA's reference conditions (25°C, 760mmHg):
// µg/m³ = ppb × 48/24.45, putting 0.054ppm at ~106 µg/m³ and 0.070ppm at ~137 µg/m³.
function describeOzone(ozone) {
  if (ozone <= 106) return { label: "Good", concerning: false };
  if (ozone <= 137) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

// Exactly the 4 categories the redesign allows as environmental chips. No pollen, ever —
// CAMS pollen coverage is Europe-only, so a value here would almost always be null for a US
// user; never display a value we can't source. Pressure is likewise not part of this set —
// it's not in the redesign's named chip categories, so it's left out of Home entirely.
function buildChips(data) {
  const chips = [];
  const avail = data.dataAvailable;

  if (avail.temperature.mean) {
    const { label } = describeTemperature(data.temperature.mean);
    chips.push({ key: "temperature", emoji: "🌡️", name: "Temp", value: `${Math.round(data.temperature.mean)}°C`, label });
  }
  if (avail.humidity.mean) {
    const { label } = describeHumidity(data.humidity.mean);
    chips.push({ key: "humidity", emoji: "💧", name: "Humidity", value: `${Math.round(data.humidity.mean)}%`, label });
  }
  if (avail.airQuality.pm2_5) {
    const { label } = describeAirQuality(data.airQuality.pm2_5);
    chips.push({ key: "airQuality", emoji: "🌫️", name: "Air quality", value: `${Math.round(data.airQuality.pm2_5 * 10) / 10}µg/m³`, label });
  }
  if (avail.airQuality.ozone) {
    const { label } = describeOzone(data.airQuality.ozone);
    chips.push({ key: "ozone", emoji: "☀️", name: "Ozone", value: `${Math.round(data.airQuality.ozone)}µg/m³`, label });
  }

  return chips;
}

function concerningChips(data) {
  const avail = data.dataAvailable;
  const flags = [];
  if (avail.temperature.mean && describeTemperature(data.temperature.mean).concerning) flags.push("temperature");
  if (avail.humidity.mean && describeHumidity(data.humidity.mean).concerning) flags.push("humidity");
  if (avail.airQuality.pm2_5 && describeAirQuality(data.airQuality.pm2_5).concerning) flags.push("air quality");
  if (avail.airQuality.ozone && describeOzone(data.airQuality.ozone).concerning) flags.push("ozone");
  return flags;
}

function buildRecsHeadline(concerning) {
  if (concerning.length === 0) return "Conditions look calm — a good day to get outside";
  return `Keep an eye on ${concerning[0]} today`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function HomeSkeleton() {
  return (
    <>
      <div className="skeleton" style={{ height: 28, width: "70%", margin: "0 auto 32px" }} />
      <div className="skeleton home-tap-circle-skeleton" style={{ margin: "0 auto" }} />
      <div className="skeleton" style={{ height: 130, marginTop: 32, borderRadius: "var(--radius-lg)" }} />
    </>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [today, setToday] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const user = getUser();

  const load = useCallback(() => {
    let cancelled = false;
    setStatus("loading");
    apiGet("/api/today")
      .then((data) => {
        if (cancelled) return;
        setToday(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(err.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  // Opportunistic refresh (no scheduled job runner in this deployment) — see
  // server/lib/envIngest.js. Fire-and-forget: must never block or affect this screen.
  useEffect(() => {
    apiPost("/api/env/sync", {}).catch(() => {});
  }, []);

  const chips = today ? buildChips(today) : [];
  const concerning = today ? concerningChips(today) : [];
  const recsHeadline = today ? buildRecsHeadline(concerning) : "";

  return (
    <div className="page page-with-nav aura-home">
      <div className="page-content">
        <div className="home-topbar">
          <h1 className="script-heading home-greeting">
            {greeting()}
            {user?.username ? <>, {user.username}</> : ""}
          </h1>
          <div className="home-companion-badge">
            <CompanionGlyph id={user?.avatar} />
          </div>
        </div>

        {status === "loading" && <HomeSkeleton />}
        {status === "error" && <ErrorState message={`Couldn't load today's conditions: ${errorMessage}`} onRetry={load} />}

        {status === "ready" && today && (
          <>
            <svg className="curved-text home-curve" viewBox="0 0 260 90" aria-hidden="true">
              <path id="homeArc" d="M 10,80 A 380,380 0 0 1 250,80" fill="none" />
              <text>
                <textPath href="#homeArc" startOffset="50%" textAnchor="middle">
                  How are you feeling today?
                </textPath>
              </text>
            </svg>

            <button type="button" className="home-tap-circle" onClick={() => navigateWithTransition(navigate, "/log")} aria-label="Log a symptom episode">
              <span className="home-tap-heart" aria-hidden="true">
                ❤️
              </span>
              <span className="home-tap-label">Tap to log</span>
            </button>

            <div className="home-small-cloud" aria-hidden="true">
              ☁️
            </div>

            <div className="coral-card home-recs-card">
              <p className="coral-card-eyebrow">Today's Wellness Recs</p>
              <h2 className="script-heading coral-card-headline">{recsHeadline}</h2>
              <div className="pill-chip-row">
                {chips.map((chip) => (
                  <span key={chip.key} className="pill-chip">
                    <span aria-hidden="true">{chip.emoji}</span> {chip.name} {chip.value} · {chip.label}
                  </span>
                ))}
                {chips.length === 0 && <span className="pill-chip pill-chip-muted">No environmental data yet</span>}
              </div>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
