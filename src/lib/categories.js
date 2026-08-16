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

export const AVATAR_OPTIONS = ["fox", "owl", "cat", "bear"];
