import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { apiGet } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

const ENV_LABELS = [
  { field: "temperature_2m_mean", label: "Temperature", unit: "°C" },
  { field: "relative_humidity_2m_mean", label: "Humidity", unit: "%" },
  { field: "surface_pressure_mean", label: "Pressure", unit: "hPa" },
  { field: "pressure_change", label: "Pressure change", unit: "hPa" },
  { field: "pm2_5", label: "PM2.5", unit: "µg/m³" },
  { field: "pm10", label: "PM10", unit: "µg/m³" },
  { field: "ozone", label: "Ozone", unit: "µg/m³" },
  { field: "nitrogen_dioxide", label: "Nitrogen dioxide", unit: "µg/m³" },
  { field: "alder_pollen", label: "Alder pollen", unit: "grains/m³" },
  { field: "birch_pollen", label: "Birch pollen", unit: "grains/m³" },
  { field: "grass_pollen", label: "Grass pollen", unit: "grains/m³" },
  { field: "mugwort_pollen", label: "Mugwort pollen", unit: "grains/m³" },
  { field: "ragweed_pollen", label: "Ragweed pollen", unit: "grains/m³" },
];

const STATUS_COPY = {
  pending: "Still gathering environmental details for this episode.",
  complete: null,
  partial: "Your episode was saved. We couldn't capture some environmental details this time.",
  unavailable: "Your episode was saved. We couldn't capture environmental details this time.",
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EpisodeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [episode, setEpisode] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = () => {
    setStatus("loading");
    apiGet(`/api/episodes/${id}`)
      .then((data) => {
        setEpisode(data);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus("error");
      });
  };

  useEffect(load, [id]);

  const envData = episode?.environmentalContext?.data;
  const envStatus = episode?.environmentalContext?.status;
  const availableEnv = envData ? ENV_LABELS.filter((f) => envData[f.field] !== null && envData[f.field] !== undefined) : [];

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <button type="button" className="detail-back-link" onClick={() => navigateWithTransition(navigate, "/history")}>
          ← Back to history
        </button>

        {status === "loading" && (
          <>
            <div className="skeleton" style={{ height: 28, width: "60%", marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 120 }} />
          </>
        )}

        {status === "error" && <ErrorState message={`Couldn't load this episode: ${errorMessage}`} onRetry={load} />}

        {status === "ready" && episode && (
          <>
            <h1 className="page-title">{formatDateTime(episode.date)}</h1>

            {episode.safety?.flagged && (
              <div className="detail-safety-banner">This episode was flagged as possibly needing urgent care when logged.</div>
            )}

            <section className="detail-section">
              <h2 className="log-section-title">What you felt</h2>
              <div className="detail-card">
                <ul className="detail-symptom-list">
                  {episode.symptoms.map((s) => (
                    <li key={s.symptomId} className="detail-symptom-row">
                      <span>{s.name}</span>
                      <span className="detail-symptom-severity">{s.severity}/5</span>
                    </li>
                  ))}
                </ul>
                <div className="detail-meta-row">
                  <span className="detail-meta-label">Location</span>
                  <span>{episode.location}</span>
                </div>
                {episode.notes && (
                  <div className="detail-notes">
                    <span className="detail-meta-label">Note</span>
                    <p>{episode.notes}</p>
                  </div>
                )}
                {episode.photoDataUrl && (
                  <img src={episode.photoDataUrl} alt="Attached to this episode" className="detail-photo" />
                )}
              </div>
            </section>

            <section className="detail-section">
              <h2 className="log-section-title">What was happening around you</h2>
              <div className="detail-card">
                {STATUS_COPY[envStatus] && <p className="detail-env-notice">{STATUS_COPY[envStatus]}</p>}
                {availableEnv.length > 0 ? (
                  <div className="detail-env-grid">
                    {availableEnv.map((f) => (
                      <div key={f.field} className="detail-env-item">
                        <span className="detail-env-value">
                          {Math.round(envData[f.field] * 10) / 10}
                          <span className="detail-env-unit">{f.unit}</span>
                        </span>
                        <span className="detail-env-label">{f.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  !STATUS_COPY[envStatus] && <p className="detail-env-notice">No environmental data available.</p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
