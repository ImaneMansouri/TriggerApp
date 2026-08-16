import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { apiGet } from "../lib/api";

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

function describeAirQuality(pm25) {
  if (pm25 <= 12) return { label: "Good", concerning: false };
  if (pm25 <= 35.4) return { label: "Moderate", concerning: false };
  if (pm25 <= 55.4) return { label: "Poor", concerning: true };
  return { label: "Very poor", concerning: true };
}

function describeOzone(ozone) {
  if (ozone <= 100) return { label: "Good", concerning: false };
  if (ozone <= 140) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

function describePollen(mean) {
  if (mean <= 10) return { label: "Low", concerning: false };
  if (mean <= 50) return { label: "Moderate", concerning: false };
  return { label: "High", concerning: true };
}

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
      unit: "µg/m³ PM2.5",
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

function pickCharacter(tiles) {
  const concerningCount = tiles.filter((t) => t.concerning).length;
  if (concerningCount >= 3) return "character-rough.png";
  if (concerningCount >= 1) return "character-okay.png";
  return "character-good.png";
}

function buildAdvice(tiles) {
  const concerning = tiles.filter((t) => t.concerning);
  if (concerning.length === 0) {
    return "Conditions look calm today — a good day to get outside if you're up for it.";
  }
  const names = concerning.map((t) => t.name.toLowerCase()).join(" and ");
  return `${concerning[0].name} looks like it could be a trigger today (${names}). Consider pacing yourself and checking in with how you're feeling.`;
}

function formatDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function Home() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [today, setToday] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
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

  const tiles = today ? buildTiles(today) : [];
  const character = today ? pickCharacter(tiles) : "character-okay.png";

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        {status === "loading" && <p className="status-message">Loading today's conditions...</p>}

        {status === "error" && (
          <div className="status-message status-message-error">
            <p>Couldn't load today's conditions: {errorMessage}</p>
          </div>
        )}

        {status === "ready" && today && (
          <>
            <div className="date-badge">{formatDate(today.date)}</div>

            <div className="today-layout">
              <div className="tile-ring">
                {tiles.map((tile) => (
                  <div key={tile.key} className="metric-tile">
                    <img src={`/icons/${tile.icon}`} alt="" className="metric-tile-icon" />
                    <div className="metric-tile-value">
                      {tile.value}
                      <span className="metric-tile-unit">{tile.unit}</span>
                    </div>
                    <div className="metric-tile-name">{tile.name}</div>
                    <div className="metric-tile-label">{tile.label}</div>
                  </div>
                ))}

                <button
                  type="button"
                  className="character-button"
                  onClick={() => navigate("/log")}
                  aria-label="Log a symptom episode"
                >
                  <img src={`/icons/${character}`} alt="How you're doing today" />
                </button>
              </div>
            </div>

            <div className="advice-card">
              <p>{buildAdvice(tiles)}</p>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
