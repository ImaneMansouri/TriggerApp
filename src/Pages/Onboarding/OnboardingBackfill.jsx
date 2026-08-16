import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingProgress } from "../../Components/OnboardingProgress.jsx";
import { apiPost } from "../../lib/api";

const BACKFILL_DAYS = 30;

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function formatDay(d) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function OnboardingBackfill() {
  const navigate = useNavigate();
  const days = useMemo(() => lastNDays(BACKFILL_DAYS), []);
  const [dayStatus, setDayStatus] = useState({}); // isoDate -> "saving" | "saved" | "error"
  const [finishing, setFinishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleTap(day) {
    const key = day.toISOString();
    if (dayStatus[key] === "saving" || dayStatus[key] === "saved") return;
    setDayStatus((prev) => ({ ...prev, [key]: "saving" }));
    try {
      await apiPost("/api/entries", { date: key, symptom: "felt rough", severity: 6 });
      setDayStatus((prev) => ({ ...prev, [key]: "saved" }));
    } catch {
      setDayStatus((prev) => ({ ...prev, [key]: "error" }));
    }
  }

  async function handleFinish() {
    setFinishing(true);
    setErrorMessage("");
    try {
      await apiPost("/api/env/backfill", { days: BACKFILL_DAYS });
      navigate("/");
    } catch (err) {
      setErrorMessage(err.message);
      setFinishing(false);
    }
  }

  return (
    <div className="page">
      <div className="page-content">
        <OnboardingProgress step={3} />
        <h1 className="page-title">Any rough days recently?</h1>
        <p className="onboarding-blurb">
          Tap any of the last {BACKFILL_DAYS} days you remember feeling rough — it gives your patterns a head
          start. Totally optional.
        </p>

        <div className="backfill-grid">
          {days.map((day) => {
            const key = day.toISOString();
            const s = dayStatus[key] || "idle";
            return (
              <button
                key={key}
                type="button"
                className={`backfill-day backfill-day-${s}`}
                onClick={() => handleTap(day)}
                disabled={s === "saving" || s === "saved"}
              >
                {formatDay(day)}
              </button>
            );
          })}
        </div>

        {errorMessage && <p className="status-message status-message-error">{errorMessage}</p>}

        <button type="button" className="save-button" onClick={handleFinish} disabled={finishing}>
          {finishing ? "Setting up your environmental history..." : "Finish"}
        </button>
      </div>
    </div>
  );
}
