import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "../Components/BottomNav.jsx";
import { ErrorState } from "../Components/ErrorState.jsx";
import { EmptyState } from "../Components/EmptyState.jsx";
import { apiGet } from "../lib/api";

const REASON_COPY = {
  category_not_evaluated: "We don't compare weather or air quality against this kind of symptom.",
  below_threshold: "Keep logging: we need a few more matched episodes before we can say anything meaningful.",
};

const SUPPORT_LABEL = { strong: "Strong signal", moderate: "Moderate signal", limited: "Limited signal" };

// Decorative "linked environmental factors" graphic — purely illustrative, represents
// the idea that patterns connect several environmental signals to a symptom.
function Constellation() {
  return (
    <div className="constellation">
      <svg viewBox="0 0 320 200" className="constellation-lines" aria-hidden="true">
        <path
          d="M70,60 L160,110 M250,50 L160,110 M110,160 L160,110 M235,150 L160,110"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeDasharray="3 7"
          strokeLinecap="round"
          opacity=".85"
        />
      </svg>
      <div className="constellation-node constellation-node-center">🌿</div>
      <div className="constellation-node constellation-node-a">💧</div>
      <div className="constellation-node constellation-node-b">🌡</div>
      <div className="constellation-node constellation-node-c">🍃</div>
      <div className="constellation-node constellation-node-d">🌫</div>
    </div>
  );
}

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
        <h1 className="page-title">Your patterns</h1>

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
            <Constellation />

            {data.findings.length > 0 && (
              <div className="pattern-list">
                {data.findings.map((f) => (
                  <div
                    key={`${f.symptomId}-${f.field}`}
                    className={`pattern-card ${f.support === "strong" ? "pattern-card-strong" : ""}`}
                  >
                    <span className={`pattern-support pattern-support-${f.support}`}>{SUPPORT_LABEL[f.support]}</span>
                    <p className="pattern-message">{f.message}</p>
                    <p className="pattern-sample">
                      Based on {f.nEpisodes} matched episodes, compared against {f.nBaseline} total observed days.
                    </p>
                    <p className="pattern-disclaimer">Possible pattern, not a medical diagnosis.</p>
                  </div>
                ))}
              </div>
            )}

            {data.stillLearning.length > 0 && (
              <section className="log-section">
                <h2 className="log-section-title">Still learning</h2>
                <div className="pattern-list">
                  {data.stillLearning.map((s) => (
                    <div key={s.symptomId} className="pattern-card pattern-card-muted">
                      <p className="pattern-message">
                        <strong>{s.name}:</strong> {REASON_COPY[s.reason] || "We're still learning your patterns."}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="medical-disclaimer">Possible pattern, not a medical diagnosis.</p>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
