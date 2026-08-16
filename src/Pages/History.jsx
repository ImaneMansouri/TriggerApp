import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { apiGet, apiDownload } from "../lib/api";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function History() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [entries, setEntries] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    apiGet("/api/entries")
      .then((data) => {
        if (cancelled) return;
        setEntries(data);
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

  async function handleDownload() {
    setDownloading(true);
    setDownloadError("");
    try {
      await apiDownload("/api/export", "triggerapp-export.csv");
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Symptom history</h1>

        <div className="history-actions">
          <button type="button" className="secondary-button" onClick={() => navigate("/log")}>
            Log new episode
          </button>
          <button type="button" className="secondary-button" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Preparing..." : "Download summary for your doctor"}
          </button>
        </div>

        {downloadError && <p className="status-message status-message-error">{downloadError}</p>}

        {status === "loading" && <p className="status-message">Loading your history...</p>}
        {status === "error" && (
          <p className="status-message status-message-error">Couldn't load history: {errorMessage}</p>
        )}

        {status === "ready" && entries.length === 0 && (
          <p className="status-message">No episodes logged yet.</p>
        )}

        {status === "ready" && entries.length > 0 && (
          <ul className="entry-list">
            {entries.map((entry) => (
              <li key={entry._id} className="entry-card">
                <div className="entry-card-date">{formatDate(entry.date)}</div>
                <div className="entry-card-body">
                  <span className="entry-card-symptom">{entry.symptom}</span>
                  <span className="entry-card-severity">Severity {entry.severity}/10</span>
                  <span className="entry-card-location">{entry.location}</span>
                </div>
                {entry.notes && <div className="entry-card-notes">{entry.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
