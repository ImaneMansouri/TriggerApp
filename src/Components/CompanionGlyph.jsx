import { getCompanion } from "../lib/companions";

// Renders whichever a companion currently is — emoji text today, an <img> once a hand-drawn
// PNG is wired up in lib/companions.js — without any caller needing to know which.
export function CompanionGlyph({ id, className = "" }) {
  const companion = getCompanion(id);
  if (companion.image) {
    return <img src={companion.image} alt="" className={`companion-glyph-image ${className}`} />;
  }
  return (
    <span className={`companion-glyph-emoji ${className}`} role="img" aria-label={companion.id}>
      {companion.emoji}
    </span>
  );
}
