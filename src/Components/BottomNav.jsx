import { NavLink } from "react-router-dom";

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-item">
        Home
      </NavLink>
      <NavLink to="/history" className="bottom-nav-item">
        History
      </NavLink>
      {/* Intentionally not a NavLink — visible in the nav but does nothing when tapped.
          There is no Patterns page yet. */}
      <span className="bottom-nav-item bottom-nav-item-inert">Patterns</span>
      <NavLink to="/profile" className="bottom-nav-item">
        Profile
      </NavLink>
      <NavLink to="/resources" className="bottom-nav-item">
        Resources
      </NavLink>
    </nav>
  );
}
