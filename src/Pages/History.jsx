import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { EmptyState } from "../Components/EmptyState.jsx";
import { apiGet, getUser } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";
import { downloadDoctorSummaryPdf } from "../lib/pdf";

// Ordered by how commonly useful each field is to see at a glance; the first 2-3 with real
// data for a given episode become its "highlights" on the timeline card.
const HIGHLIGHT_FIELDS = [
  { field: "relative_humidity_2m_mean", label: "Humidity", unit: "%", round: true },
  { field: "temperature_2m_mean", label: "Temp", unit: "°C", round: true },
  { field: "ozone", label: "Ozone", unit: " µg/m³", round: true },
  { field: "pm2_5", label: "PM2.5", unit: " µg/m³", round: false },
  { field: "pressure_change", label: "Pressure Δ", unit: " hPa", round: false },
];

function envHighlights(episode) {
  const data = episode.environmentalContext?.data;
  if (!data) return [];
  const highlights = [];
  for (const { field, label, unit, round } of HIGHLIGHT_FIELDS) {
    const value = data[field];
    if (value === null || value === undefined) continue;
    const displayValue = round ? Math.round(value) : Math.round(value * 10) / 10;
    highlights.push(`${label} ${displayValue}${unit}`);
    if (highlights.length === 3) break;
  }
  return highlights;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function TimelineSkeleton() {
  return (
    <div className="timeline">
      {[0, 1, 2].map((i) => (
        <div key={i} className="timeline-row">
          <div className="timeline-rail">
            <span className="timeline-dot skeleton" />
          </div>
          <div className="skeleton timeline-card-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function History() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [episodes, setEpisodes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const pendingRetriesLeft = useRef(4);

  const load = useCallback(() => {
    let cancelled = false;
    setStatus("loading");
    apiGet("/api/episodes")
      .then((data) => {
        if (cancelled) return;
        setEpisodes(data);
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

  // Enrichment runs fire-and-forget on the server (see server/lib/enrichEpisode.js) — usually
  // a fast DB lookup (under a second) once a user's environmental baseline already exists,
  // but the very first episode logged before any backfill has completed can trigger a full
  // cold-start fetch that takes several seconds. A few spaced-out quiet re-fetches (not an
  // open-ended poll loop) cover both cases without the user having to manually refresh.
  useEffect(() => {
    if (status !== "ready" || pendingRetriesLeft.current <= 0) return;
    const stillPending = episodes.some((ep) => ep.environmentalContext?.status === "pending");
    if (!stillPending) return;
    pendingRetriesLeft.current -= 1;
    const timer = setTimeout(() => {
      apiGet("/api/episodes").then(setEpisodes).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [status, episodes]);

  function handleDownloadPdf() {
    setDownloadError("");
    try {
      downloadDoctorSummaryPdf(episodes, getUser());
    } catch {
      setDownloadError("Couldn't generate the PDF summary. Try again.");
    }
  }

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Your story</h1>

        <div className="history-actions">
          <button type="button" className="secondary-button" onClick={() => navigateWithTransition(navigate, "/log")}>
            Log new episode
          </button>
          <button type="button" className="secondary-button" onClick={handleDownloadPdf} disabled={episodes.length === 0}>
            Download PDF summary for your doctor
          </button>
        </div>

        {downloadError && <p className="status-message status-message-error">{downloadError}</p>}

        {status === "loading" && <TimelineSkeleton />}

        {status === "error" && <ErrorState message={`Couldn't load your history: ${errorMessage}`} onRetry={load} />}

        {status === "ready" && episodes.length === 0 && (
          <EmptyState title="Your story starts here" message="Episodes you log will show up on this timeline, newest first." />
        )}

        {status === "ready" && episodes.length > 0 && (
          <div className="timeline">
            {episodes.map((ep) => (
              <div key={ep._id} className="timeline-row">
                <div className="timeline-rail">
                  <span className={`timeline-dot ${ep.safety?.flagged ? "timeline-dot-flagged" : ""}`} />
                  <span className="timeline-line" />
                </div>
                <button
                  type="button"
                  className="timeline-card"
                  onClick={() => navigateWithTransition(navigate, `/history/${ep._id}`)}
                >
                  <div className="timeline-card-date">{formatDate(ep.date)}</div>
                  <div className="timeline-card-symptoms">
                    {ep.symptoms.map((s) => (
                      <span key={s.symptomId} className="timeline-symptom-badge">
                        {s.name} {s.severity}/5
                      </span>
                    ))}
                  </div>
                  <div className="timeline-card-meta">
                    <span className="timeline-card-location">{ep.location}</span>
                    {ep.environmentalContext?.status === "pending" ? (
                      <span className="timeline-card-highlight timeline-card-highlight-pending">Gathering details...</span>
                    ) : (
                      envHighlights(ep).map((h) => (
                        <span key={h} className="timeline-card-highlight">
                          {h}
                        </span>
                      ))
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
