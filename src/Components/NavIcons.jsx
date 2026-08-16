// Small line-icon set for nav items. Inline SVG (not PNG) since these are UI
// chrome, not the illustrated weather/character set living at /icons/*.png.
const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconHome(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function IconHistory(props) {
  return (
    <svg {...common} {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </svg>
  );
}

export function IconPatterns(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 16l4.5-6 4 4L19 6" />
      <circle cx="4" cy="16" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="14" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconProfile(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}

export function IconResources(props) {
  return (
    <svg {...common} {...props}>
      <rect x="3.5" y="8" width="17" height="11" rx="2.2" />
      <path d="M8.5 8V6.3A2.3 2.3 0 0 1 10.8 4h2.4a2.3 2.3 0 0 1 2.3 2.3V8" />
      <path d="M12 11.5v4M9.8 13.5h4.4" />
    </svg>
  );
}
