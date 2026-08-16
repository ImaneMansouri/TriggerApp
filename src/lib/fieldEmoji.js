// A representative emoji per environmental field — used in the Patterns constellation and
// anywhere else a field needs a small glyph. Pollen fields are included only so this doesn't
// throw if one ever appeared (it structurally can't for a US user — see server/API.md) — the
// app never displays a pollen value anywhere.
const FIELD_EMOJI = {
  relative_humidity_2m_mean: "💧",
  temperature_2m_mean: "🌡️",
  ozone: "☀️",
  pm2_5: "🌫️",
  pm10: "🌫️",
  nitrogen_dioxide: "🌫️",
  pressure_change: "🌬️",
  alder_pollen: "🌼",
  birch_pollen: "🌼",
  grass_pollen: "🌼",
  mugwort_pollen: "🌼",
  ragweed_pollen: "🌼",
};

export function fieldEmoji(field) {
  return FIELD_EMOJI[field] || "🌎";
}
