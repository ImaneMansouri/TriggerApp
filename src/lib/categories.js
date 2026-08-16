// Mirrors server/lib/categories.js — the frontend has no shared-code path to the backend, so
// this list is kept in sync by hand. GET /api/symptoms/categories also returns the same list
// live from the server; this local copy exists so onboarding/profile screens can render
// immediately without waiting on a fetch.
export const SYMPTOM_CATEGORIES = [
  { id: "nose", label: "Nose" },
  { id: "eyes", label: "Eyes" },
  { id: "skin", label: "Skin" },
  { id: "hives", label: "Hives" },
  { id: "swelling", label: "Swelling" },
  { id: "breathing", label: "Breathing" },
  { id: "mouth_throat", label: "Mouth/Throat" },
  { id: "stomach", label: "Stomach" },
];

// A representative emoji per category — used wherever a tracked symptom needs a small glyph
// (Story timeline, You/profile symptom list) without asking the user to pick one themselves.
export const CATEGORY_EMOJI = {
  nose: "👃",
  eyes: "👁️",
  skin: "🧴",
  hives: "🔴",
  swelling: "🎈",
  breathing: "🫁",
  mouth_throat: "👄",
  stomach: "🤢",
};

export function categoryEmoji(category) {
  return CATEGORY_EMOJI[category] || "🩹";
}
