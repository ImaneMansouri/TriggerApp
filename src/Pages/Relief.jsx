import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { apiGet } from "../lib/api";

function buildSuggestions(entry, today) {
  const suggestions = [
    "Sip water steadily through the day — even mild dehydration can make you feel worse.",
    "Give yourself permission to rest. Slowing down for a bit isn't a setback.",
  ];

  const hour = new Date().getHours();
  const isAfternoon = hour >= 12 && hour < 18;
  const ozone = today?.airQuality?.ozone;
  const pm25 = today?.airQuality?.pm2_5;

  if (isAfternoon && (ozone == null || ozone > 100)) {
    suggestions.push(
      "Ozone tends to peak in the afternoon — if you can, plan outdoor time for the morning or evening instead."
    );
  }

  if ((ozone != null && ozone > 100) || (pm25 != null && pm25 > 35)) {
    suggestions.push(
      "Air quality looks rough today — keeping windows closed and running an air purifier indoors can help."
    );
  }

  if (entry?.location === "outdoor") {
    suggestions.push(
      "Since you were outside, consider a calm indoor stretch for the rest of the day to give yourself a break from the elements."
    );
  }

  if (entry?.severity >= 8) {
    suggestions.push("That sounds like a tough one. Keep things low-key today and lean on your usual comfort routine.");
  }

  suggestions.push("A quiet, dim, well-ventilated space can make discomfort easier to sit with.");

  return suggestions;
}

export function Relief() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const entry = state?.entry;
  const [today, setToday] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiGet("/api/today")
      .then((data) => {
        if (!cancelled) setToday(data);
      })
      .catch(() => {
        // Non-critical: suggestions still render without today's conditions.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = buildSuggestions(entry, today);

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Take care of yourself</h1>
        {entry && (
          <p className="relief-subtitle">
            Logged: {entry.symptom} · severity {entry.severity}/10
            {entry.location && entry.location !== "unknown" ? ` · ${entry.location}` : ""}
          </p>
        )}

        <div className="suggestion-list">
          {suggestions.map((s, i) => (
            <div key={i} className="suggestion-card">
              <p>{s}</p>
            </div>
          ))}
        </div>

        <p className="medical-disclaimer">
          This isn't medical advice. If something feels serious, contact a healthcare provider.
        </p>

        <button type="button" className="secondary-button" onClick={() => navigate("/")}>
          Back to today
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
