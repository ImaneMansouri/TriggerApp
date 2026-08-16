import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IconHistory, IconPatterns, IconResources } from "../Components/NavIcons.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { AuraAvatar } from "../Components/AuraAvatar.jsx";
import { apiGet, apiPost, getUser } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

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

function describePressure(change) {
  if (change <= -2) return { label: "Dropping fast", concerning: true };
  if (change <= -0.5) return { label: "Falling", concerning: false };
  if (change < 0.5) return { label: "Stable", concerning: false };
  return { label: "Rising", concerning: false };
}

// e.g. "↓5" or "↑2" or "→0" — the trend arrow reads faster than a signed number,
// and it's the change (not the absolute pressure) that correlates with symptoms.
function formatPressureChange(change) {
  const rounded = Math.round(Math.abs(change) * 10) / 10;
  if (change < -0.05) return `↓${rounded}`;
  if (change > 0.05) return `↑${rounded}`;
  return `→${rounded}`;
}

// EPA AQI breakpoints, PM2.5 24-hour (µg/m³), per the revised NAAQS effective May 2024:
// Good 0-9.0, Moderate 9.1-35.4, Unhealthy for Sensitive Groups 35.5-55.4, Unhealthy+ above
// that. The Good/Moderate line moved from 12.0 to 9.0 in the 2024 revision — verified against
// EPA's own AQS breakpoints table (aqs.epa.gov) and the 2024 PM NAAQS fact sheet.
function describeAirQuality(pm25) {
  if (pm25 <= 9.0) return { label: "Good", concerning: false };
  if (pm25 <= 35.4) return { label: "Moderate", concerning: false };
  if (pm25 <= 55.4) return { label: "Poor", concerning: true };
  return { label: "Very poor", concerning: true };
}

// EPA AQI breakpoints, ozone 8-hour: Good 0-0.054ppm, Moderate 0.055-0.070ppm, Unhealthy for
// Sensitive Groups 0.071-0.085ppm (source: aqs.epa.gov/aqsweb/documents/codetables/aqi_breakpoints.html).
// Open-Meteo reports ozone in µg/m³, not ppm, so these are converted at the reference
// conditions EPA specifies for gaseous pollutants (25°C, 760mmHg): µg/m³ = ppb × 48/24.45.
// That puts 0.054ppm at ~106 µg/m³ and 0.070ppm at ~137 µg/m³ — i.e. 59 µg/m³ (~30ppb) is
// genuinely "Good," not a mislabel; the boundary itself just needed tightening from the
// earlier rough 100/140 approximation to these precise converted values.
function describeOzone(ozone) {
  if (ozone <= 106) return { label: "Good", concerning: false };
  if (ozone <= 137) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

function describePollen(mean) {
  if (mean <= 10) return { label: "Low", concerning: false };
  if (mean <= 50) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

// Scattered sky positions, keyed by tile — not a grid. Two loose side columns
// (varying heights/sizes within each) so nothing collides with the curved
// arc text, which owns the center-top strip above the hero button.
const SKY_POSITIONS = {
  temperature: { top: "30%", side: "right", offset: "2%", size: "lg" },
  humidity: { top: "52%", side: "right", offset: "6%", size: "md" },
  ozone: { top: "74%", side: "right", offset: "3%", size: "sm" },
  pressure: { top: "32%", side: "left", offset: "2%", size: "md" },
  airQuality: { top: "54%", side: "left", offset: "5%", size: "sm" },
  pollen: { top: "76%", side: "left", offset: "3%", size: "sm" },
};

// Builds the tile list from a GET /api/today payload, skipping any tile whose
// backing field(s) are unavailable per `dataAvailable` rather than rendering a blank.
function buildTiles(data) {
  const tiles = [];
  const avail = data.dataAvailable;

  if (avail.temperature.mean) {
    const { label, concerning } = describeTemperature(data.temperature.mean);
    tiles.push({
      key: "temperature",
      icon: "temperature.png",
      name: "Temperature",
      value: Math.round(data.temperature.mean),
      unit: "°C",
      label,
      concerning,
    });
  }

  if (avail.humidity.mean) {
    const { label, concerning } = describeHumidity(data.humidity.mean);
    tiles.push({
      key: "humidity",
      icon: "humidity.png",
      name: "Humidity",
      value: Math.round(data.humidity.mean),
      unit: "%",
      label,
      concerning,
    });
  }

  // Labeled "Pressure", not "Wind" — GET /api/today has no wind field, only
  // surface pressure. Shows the day-over-day change rather than the absolute
  // value: a sharp drop is the trigger-relevant signal, not where pressure sits.
  if (avail.pressure.change) {
    const { label, concerning } = describePressure(data.pressure.change);
    tiles.push({
      key: "pressure",
      icon: "pressure.png",
      name: "Pressure",
      value: formatPressureChange(data.pressure.change),
      unit: "hPa",
      label,
      concerning,
    });
  }

  if (avail.airQuality.pm2_5) {
    const { label, concerning } = describeAirQuality(data.airQuality.pm2_5);
    tiles.push({
      key: "airQuality",
      icon: "air-quality.png",
      name: "Air Quality",
      value: Math.round(data.airQuality.pm2_5 * 10) / 10,
      unit: "µg/m³",
      label,
      concerning,
    });
  }

  if (avail.airQuality.ozone) {
    const { label, concerning } = describeOzone(data.airQuality.ozone);
    tiles.push({
      key: "ozone",
      icon: "ozone.png",
      name: "Ozone",
      value: Math.round(data.airQuality.ozone),
      unit: "µg/m³",
      label,
      concerning,
    });
  }

  // Pollen only clears model coverage in Europe — hidden entirely for most US users,
  // per server/API.md. Shown as a bonus tile when any field is available.
  const pollenFields = Object.entries(data.pollen).filter(([field]) => avail.pollen[field]);
  if (pollenFields.length > 0) {
    const mean = pollenFields.reduce((sum, [, v]) => sum + v, 0) / pollenFields.length;
    const { label, concerning } = describePollen(mean);
    tiles.push({
      key: "pollen",
      icon: "air-quality.png",
      name: "Pollen",
      value: Math.round(mean),
      unit: "grains/m³",
      label,
      concerning,
    });
  }

  return tiles;
}

function buildAdviceLines(tiles) {
  const concerning = tiles.filter((t) => t.concerning);
  if (concerning.length === 0) {
    return ["Conditions look calm today.", "A good day to get outside if you're up for it.", "Stay hydrated either way."];
  }
  const lines = [`${concerning[0].name} looks like a possible trigger today (${concerning[0].label.toLowerCase()}).`];
  if (concerning.length > 1) {
    lines.push(`${concerning[1].name} is worth keeping an eye on too.`);
  }
  lines.push("Pace yourself and check in with how you're feeling.");
  return lines.slice(0, 3);
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" }).toUpperCase();
}

function TodaySkeleton() {
  return (
    <>
      {Object.values(SKY_POSITIONS)
        .slice(0, 5)
        .map((pos, i) => (
          <div
            key={i}
            className={`sky-icon-skeleton skeleton sky-icon-${pos.size}`}
            style={{ top: pos.top, [pos.side]: pos.offset }}
          />
        ))}
      <div className="today-hero">
        <div className="character-button-skeleton skeleton" />
        <div className="cloud-badge-skeleton skeleton" />
      </div>
    </>
  );
}

export function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [today, setToday] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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

  // Opportunistic refresh (item 7): there's no scheduled job runner in this deployment, so
  // "keep the environmental baseline current" happens here instead — once, when the app
  // opens. Fire-and-forget: a slow or failed sync must never block or affect the Today
  // screen, which already has its own /api/today fetch and retry above.
  useEffect(() => {
    apiPost("/api/env/sync", {}).catch(() => {});
  }, []);

  const tiles = today ? buildTiles(today) : [];
  const user = getUser();
  const companion = user?.avatar || "fox";
  const adviceLines = today ? buildAdviceLines(tiles) : [];

  return (
    <div className="page today-page">
      <div className="today-sky">
        {status === "loading" && <TodaySkeleton />}

        {status === "error" && (
          <div className="today-hero">
            <ErrorState message={`Couldn't load today's conditions: ${errorMessage}`} onRetry={load} />
          </div>
        )}

        {status === "ready" && today && (
          <div className="today-greeting-row">
            <div>
              <div className="today-greeting-label">{greeting()}</div>
              <div className="today-greeting-name">{user?.username || "there"}</div>
            </div>
            <button
              type="button"
              className="today-avatar-button"
              onClick={() => navigateWithTransition(navigate, "/profile")}
              aria-label="Profile"
            >
              <AuraAvatar id={companion} size={34} />
            </button>
          </div>
        )}

        {status === "ready" && today && (
          <div className="today-sky-content">
            {tiles.map((tile, i) => {
              const pos = SKY_POSITIONS[tile.key] || SKY_POSITIONS.pollen;
              return (
                <div
                  key={tile.key}
                  className={`sky-icon sky-icon-${pos.size}`}
                  style={{ top: pos.top, [pos.side]: pos.offset, animationDelay: `${i * 0.09}s` }}
                >
                  <div
                    className="sky-icon-drift"
                    style={{ animationDuration: `${4.6 + (i % 3) * 0.7}s`, animationDelay: `${(i % 4) * 0.3}s` }}
                  >
                    <img src={`/icons/${tile.icon}`} alt="" className="sky-icon-img" />
                    <div className="sky-icon-label">{tile.name}</div>
                    <div className="sky-icon-value">
                      {tile.value}
                      <span className="sky-icon-unit">{tile.unit}</span>
                      <span className="sky-icon-qualifier"> · {tile.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="today-hero">
              {/* A tight curve (small radius relative to chord width) crams letters together
                  near the peak until they visually overlap — this arc used to be a near-exact
                  semicircle (radius 102 for a 204px chord), which is what made "FEELING" read
                  as garbled overlapping letters. A much larger radius on a wider/shallower
                  viewBox keeps the same gentle "wrapping over the hero" read without the
                  letters colliding into each other. */}
              <svg className="curved-text" viewBox="0 0 260 90" aria-hidden="true">
                <path id="curveArc" d="M 10,80 A 380,380 0 0 1 250,80" fill="none" />
                <text>
                  <textPath href="#curveArc" startOffset="50%" textAnchor="middle">
                    HOW ARE YOU FEELING TODAY?
                  </textPath>
                </text>
              </svg>

              <div className="hero-bubble-area">
                <span className="companion-peek" aria-hidden="true">
                  <AuraAvatar id={companion} size={58} />
                </span>
                <button
                  type="button"
                  className="character-button"
                  onClick={() => navigateWithTransition(navigate, "/log")}
                  aria-label="Log a symptom episode"
                >
                  <span className="character-float">
                    <svg className="character-heart-icon" viewBox="0 0 24 24" fill="none" stroke="#e86a52" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                    <span className="character-tap-label">tap to log</span>
                  </span>
                </button>
              </div>

              <div className="hero-cloud" aria-hidden="true">
                <svg width="112" height="52" viewBox="0 0 112 52">
                  <g>
                    <ellipse cx="40" cy="34" rx="30" ry="17" fill="#fff" />
                    <ellipse cx="66" cy="30" rx="26" ry="20" fill="#fff" />
                    <ellipse cx="84" cy="36" rx="20" ry="13" fill="#fff" />
                    <ellipse cx="56" cy="42" rx="40" ry="10" fill="#fff" />
                  </g>
                </svg>
              </div>

              <div className="cloud-badge">{formatDate(today.date)}</div>
            </div>
          </div>
        )}
      </div>

      {status === "ready" && today && (
        <div className="today-bottom">
          <button type="button" className="advice-card" onClick={() => navigateWithTransition(navigate, "/relief")}>
            <h2 className="advice-card-title">Today's Wellness Recs</h2>
            <ul className="advice-card-list">
              {adviceLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </button>

          <div className="hero-nav-row">
            <button type="button" className="hero-nav-bubble" onClick={() => navigateWithTransition(navigate, "/history")}>
              <span className="hero-nav-circle">
                <IconHistory />
              </span>
              <span className="hero-nav-label">Your story</span>
            </button>
            <button type="button" className="hero-nav-bubble" onClick={() => navigateWithTransition(navigate, "/patterns")}>
              <span className="hero-nav-circle">
                <IconPatterns />
              </span>
              <span className="hero-nav-label">Patterns</span>
            </button>
            <button type="button" className="hero-nav-bubble" onClick={() => navigateWithTransition(navigate, "/resources")}>
              <span className="hero-nav-circle hero-nav-circle-accent">
                <IconResources />
              </span>
              <span className="hero-nav-label">First aid</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
