import { useNavigate } from "react-router-dom";
import { NavIcon } from "./NavIcon.jsx";
import { IconHome, IconHistory, IconPatterns, IconProfile } from "./NavIcons.jsx";
import { navigateWithTransition } from "../lib/motion";

// Aura's bottom-nav pattern: two items left, a raised center FAB (always → Log), two
// items right. Resources isn't a bottom-nav destination in Aura — it's reached from
// Home's "First aid" bubble and from a row button on Profile.
export function BottomNav() {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-pill">
        <NavIcon to="/" end icon={IconHome} label="Home" />
        <NavIcon to="/history" icon={IconHistory} label="Story" />
        <button
          type="button"
          className="nav-fab"
          aria-label="Log how you're feeling"
          onClick={() => navigateWithTransition(navigate, "/log")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <NavIcon to="/patterns" icon={IconPatterns} label="Patterns" />
        <NavIcon to="/profile" icon={IconProfile} label="You" />
      </div>
    </nav>
  );
}
