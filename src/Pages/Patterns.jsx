import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "../Components/BottomNav.jsx";
import { Constellation } from "../Components/Constellation.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { EmptyState } from "../Components/EmptyState.jsx";
import { apiGet } from "../lib/api";

const REASON_COPY = {
  category_not_evaluated: "We don't compare weather or air quality against this kind of symptom.",
  below_threshold: "Keep logging — we need a few more matched episodes before we can say anything meaningful.",
};

function Skeleton() {
  return (
    <div className="pattern-list">
      <div className="skeleton pattern-card-skeleton" />
      <div className="skeleton pattern-card-skeleton" />
    </div>
  );
}

export function Patterns() {
  const [status, setStatus] = useState("loading");
  const [data, setData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setStatus("loading");
    apiGet("/api/patterns")
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMessage(err.message);
        setStatus("error");
      });
  }, []);

  useEffect(() => load(), [load]);

  const hasAnything = data && (data.findings.length > 0 || data.stillLearning.length > 0);

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="script-heading page-title">What we're noticing</h1>
        <p className="story-subtitle">Gentle observations from your own history</p>

        {status === "loading" && <Skeleton />}
        {status === "error" && <ErrorState message={`Couldn't load your patterns: ${errorMessage}`} onRetry={load} />}

        {status === "ready" && !hasAnything && (
          <EmptyState
            title="We're still learning your patterns"
            message="Log a few episodes and we'll start comparing them against your environmental baseline."
          />
        )}

        {status === "ready" && hasAnything && (
          <>
            {data.findings.length > 0 && <Constellation findings={data.findings} />}

            {data.findings.length > 0 && (
              <div className="pattern-list">
                {data.findings.map((f) => (
                  <div key={`${f.symptomId}-${f.field}`} className="coral-card pattern-card">
                    <p className="coral-card-eyebrow">Possible pattern</p>
                    <h2 className="script-heading coral-card-headline">{f.message}</h2>
                    <div className="stat-pair">
                      <div className="stat-item">
                        <span className="stat-value">
                          {f.hitRate.hits} of {f.hitRate.total}
                        </span>
                        <span className="stat-label">recent episodes matched</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">
                          {f.percentVsBaseline === null ? "—" : `${f.percentVsBaseline > 0 ? "+" : ""}${f.percentVsBaseline}%`}
                        </span>
                        <span className="stat-label">vs your baseline</span>
                      </div>
                    </div>
                    <p className="pattern-sample">
                      Based on {f.nEpisodes} matched episodes, compared against {f.nBaseline} total observed days.
                    </p>
                    <p className="pattern-footer">A possible pattern in your history — not a diagnosis.</p>
                  </div>
                ))}
              </div>
            )}

            {data.stillLearning.length > 0 && (
              <section className="log-section">
                <p className="coral-card-eyebrow worth-watching-eyebrow">Worth watching</p>
                <div className="pattern-list">
                  {data.stillLearning.map((s) => (
                    <div key={s.symptomId} className="white-card pattern-card-muted">
                      <p className="pattern-message">
                        <strong>{s.name}:</strong> {REASON_COPY[s.reason] || "We're still learning your patterns."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
