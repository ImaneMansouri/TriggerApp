import { NavLink } from "react-router-dom";

// Shared nav item — emoji + small caps label. Active item picks up coral via CSS
// (NavLink applies "active" automatically; see .nav-icon.active in App.css).
export function NavIcon({ to, emoji, label, end = false }) {
  return (
    <NavLink to={to} end={end} className="nav-icon">
      <span className="nav-icon-emoji" aria-hidden="true">
        {emoji}
      </span>
      <span className="nav-icon-label">{label}</span>
    </NavLink>
  );
}
