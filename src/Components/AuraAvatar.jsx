// Companion character art in the Aura visual language (soft blob shape, dot eyes, blush
// cheeks, small smile) — adapted from the Aura design's four companions (design/Aura.dc.html
// avatarSVG()), but kept mapped to this app's existing avatar ids (fox/owl/cat/bear) so no
// backend/data changes are needed for accounts that already picked one.
const AVATARS = {
  fox: {
    label: "Fox",
    swatch: "#ef5a44",
    svg: (sz) => (
      <svg width={sz} height={sz} viewBox="0 0 64 64">
        <path d="M32 56C10 40 8 22 20 16c8-4 12 4 12 4s4-8 12-4c12 6 10 24-12 40z" fill="#ef5a44" />
        <circle cx="25" cy="31" r="2.4" fill="#4a221a" />
        <circle cx="39" cy="31" r="2.4" fill="#4a221a" />
        <circle cx="20.5" cy="36" r="3" fill="#ff9b86" opacity=".75" />
        <circle cx="43.5" cy="36" r="3" fill="#ff9b86" opacity=".75" />
        <path d="M28 39q4 3 8 0" stroke="#4a221a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  owl: {
    label: "Owl",
    swatch: "#bfe0f0",
    svg: (sz) => (
      <svg width={sz} height={sz} viewBox="0 0 64 64">
        <g>
          <ellipse cx="24" cy="38" rx="15" ry="11" fill="#eef7fc" />
          <ellipse cx="40" cy="34" rx="14" ry="13" fill="#eef7fc" />
          <ellipse cx="46" cy="40" rx="11" ry="8" fill="#eef7fc" />
          <ellipse cx="32" cy="44" rx="20" ry="7" fill="#eef7fc" />
        </g>
        <circle cx="27" cy="37" r="2.3" fill="#5a7f95" />
        <circle cx="39" cy="36" r="2.3" fill="#5a7f95" />
        <circle cx="22" cy="41" r="2.6" fill="#bfe0f0" />
        <circle cx="44" cy="40" r="2.6" fill="#bfe0f0" />
        <path d="M30 41q3 2.5 6 0" stroke="#5a7f95" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  cat: {
    label: "Cat",
    swatch: "#8cc07a",
    svg: (sz) => (
      <svg width={sz} height={sz} viewBox="0 0 64 64">
        <path d="M32 54V30" stroke="#6a9a5b" strokeWidth="4" strokeLinecap="round" />
        <path d="M32 34c-10 2-16-4-16-12 9-1 15 4 16 12z" fill="#8cc07a" />
        <path d="M32 30c9 1 15-5 15-13-8-1-14 5-15 13z" fill="#a6d492" />
        <circle cx="26" cy="46" r="2.2" fill="#3f5f34" />
        <circle cx="38" cy="46" r="2.2" fill="#3f5f34" />
        <circle cx="23" cy="50" r="2.4" fill="#f4b6a0" opacity=".8" />
        <circle cx="41" cy="50" r="2.4" fill="#f4b6a0" opacity=".8" />
        <path d="M28 51q4 2.5 8 0" stroke="#3f5f34" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  bear: {
    label: "Bear",
    swatch: "#ffd766",
    svg: (sz) => (
      <svg width={sz} height={sz} viewBox="0 0 64 64">
        <g stroke="#f0b429" strokeWidth="3" strokeLinecap="round">
          <path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4" />
        </g>
        <circle cx="32" cy="32" r="15" fill="#ffd766" />
        <circle cx="27" cy="30" r="2.4" fill="#9a6a12" />
        <circle cx="37" cy="30" r="2.4" fill="#9a6a12" />
        <circle cx="23" cy="35" r="2.8" fill="#ffb27a" opacity=".8" />
        <circle cx="41" cy="35" r="2.8" fill="#ffb27a" opacity=".8" />
        <path d="M28 36q4 3 8 0" stroke="#9a6a12" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
};

export const AVATAR_IDS = Object.keys(AVATARS);

export function avatarLabel(id) {
  return AVATARS[id]?.label || AVATARS.fox.label;
}

export function AuraAvatar({ id, size = 48, className }) {
  const entry = AVATARS[id] || AVATARS.fox;
  return <span className={className}>{entry.svg(size)}</span>;
}
