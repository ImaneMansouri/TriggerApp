import { useNavigate } from "react-router-dom";
import { NavIcon } from "./NavIcon.jsx";
import { navigateWithTransition } from "../lib/motion";

// Home · Story · [+] · Patterns · You. The center [+] is a raised coral circle, always
// routing straight to the logger — it's an action button, not a "current page" indicator,
// so it's a plain button rather than a NavLink (never shows an active state).
export function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      <NavIcon to="/home" end emoji="🏠" label="Home" />
      <NavIcon to="/history" emoji="📖" label="Story" />
      <button
        type="button"
        className="bottom-nav-plus"
        onClick={() => navigateWithTransition(navigate, "/log")}
        aria-label="Log an episode"
      >
        +
      </button>
      <NavIcon to="/patterns" emoji="✨" label="Patterns" />
      <NavIcon to="/profile" emoji="🙂" label="You" />
    </nav>
  );
}
