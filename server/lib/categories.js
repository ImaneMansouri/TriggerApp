// Every user-defined tracked symptom must pick one category. Shared
// (see lib/patternEngine.js).
const SYMPTOM_CATEGORIES = [
  { id: "nose", label: "Nose" },
  { id: "eyes", label: "Eyes" },
  { id: "skin", label: "Skin" },
  { id: "hives", label: "Hives" },
  { id: "swelling", label: "Swelling" },
  { id: "breathing", label: "Breathing" },
  { id: "mouth_throat", label: "Mouth/Throat" },
  { id: "stomach", label: "Stomach" },
];

const SYMPTOM_CATEGORY_IDS = SYMPTOM_CATEGORIES.map((c) => c.id);

module.exports = { SYMPTOM_CATEGORIES, SYMPTOM_CATEGORY_IDS };
