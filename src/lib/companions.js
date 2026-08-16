// The 4 selectable companions. `image: null` means "render the emoji." To swap in the
// hand-drawn heart once it lands at public/icons/companion-heart.png, change ONE line:
//   { id: "heart", emoji: "❤️", image: "/icons/companion-heart.png" }
// CompanionGlyph (below) picks that up everywhere the heart companion is rendered —
// onboarding, profile, and the Home badge — with no other code changes.
export const COMPANIONS = [
  { id: "heart", emoji: "❤️", image: null },
  { id: "cloud", emoji: "☁️", image: null },
  { id: "sprout", emoji: "🌱", image: null },
  { id: "sun", emoji: "☀️", image: null },
];

export function getCompanion(id) {
  return COMPANIONS.find((c) => c.id === id) || COMPANIONS[0];
}
