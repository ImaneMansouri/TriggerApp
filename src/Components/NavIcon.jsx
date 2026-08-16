import { NavLink } from "react-router-dom";

// Shared "circular icon + small caps label" element — used by BottomNav on every
// page except Home, and reused directly inside Home's own custom bottom groups
// so both places render pixel-identical nav chrome.
export function NavIcon({ to, icon: Icon, label, inert = false, end = false }) {
  const content = (
    <>
      <span className="nav-icon-frame">
        <Icon className="nav-icon-svg" />
      </span>
      <span className="nav-icon-label">{label}</span>
    </>
  );

  if (inert) {
    return (
      <span className="nav-icon nav-icon-inert" aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <NavLink to={to} end={end} className="nav-icon">
      {content}
    </NavLink>
  );
}
