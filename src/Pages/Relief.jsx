import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { apiGet } from "../lib/api";
import { navigateWithTransition } from "../lib/motion";

function buildSuggestions(episode, envData) {
  const suggestions = [
    "Sip water steadily through the day — even mild dehydration can make you feel worse.",
    "Give yourself permission to rest. Slowing down for a bit isn't a setback.",
  ];

  const hour = new Date().getHours();
  const isAfternoon = hour >= 12 && hour < 18;
  const ozone = envData?.ozone;
  const pm25 = envData?.pm2_5;

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

  if (episode?.location === "outdoor" || episode?.location === "both") {
    suggestions.push(
      "Since you were outside, consider a calm indoor stretch for the rest of the day to give yourself a break from the elements."
    );
  }

  const maxSeverity = Math.max(0, ...(episode?.symptoms || []).map((s) => s.severity));
  if (maxSeverity >= 4) {
    suggestions.push("That sounds like a tough one. Keep things low-key today and lean on your usual comfort routine.");
  }

  suggestions.push("A quiet, dim, well-ventilated space can make discomfort easier to sit with.");

  return suggestions;
}

export function Relief() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const episode = state?.episode;
  const [todayEnv, setTodayEnv] = useState(null);

  // The episode's own environmentalContext (captured for that specific moment) is the more
  // relevant source; /api/today is only a fallback for when it hasn't finished enriching yet
  // (enrichment is fire-and-forget on the server — see server/lib/enrichEpisode.js) or when
  // this page is opened without episode state at all.
  const hasEpisodeContext =
    episode?.environmentalContext?.status === "complete" || episode?.environmentalContext?.status === "partial";

  useEffect(() => {
    if (hasEpisodeContext) return;
    let cancelled = false;
    apiGet("/api/today")
      .then((data) => {
        if (!cancelled) {
          setTodayEnv({
            ozone: data.airQuality?.ozone,
            pm2_5: data.airQuality?.pm2_5,
          });
        }
      })
      .catch(() => {
        // Non-critical: suggestions still render without any environmental data.
      });
    return () => {
      cancelled = true;
    };
  }, [hasEpisodeContext]);

  const envData = hasEpisodeContext ? episode.environmentalContext.data : todayEnv;
  const suggestions = buildSuggestions(episode, envData);

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Take care of yourself</h1>
        {episode && (
          <p className="relief-subtitle">
            Logged: {episode.symptoms.map((s) => `${s.name} (${s.severity}/5)`).join(", ")}
            {episode.location && episode.location !== "unknown" ? ` · ${episode.location}` : ""}
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

        <button type="button" className="secondary-button" onClick={() => navigateWithTransition(navigate, "/home")}>
          Back to today
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
