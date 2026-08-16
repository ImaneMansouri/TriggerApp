import { NavIcon } from "./NavIcon.jsx";
import { IconHome, IconHistory, IconPatterns, IconProfile, IconResources } from "./NavIcons.jsx";

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavIcon to="/" end icon={IconHome} label="Home" />
      <NavIcon to="/history" icon={IconHistory} label="History" />
      <NavIcon to="/patterns" icon={IconPatterns} label="Patterns" />
      <NavIcon to="/profile" icon={IconProfile} label="Profile" />
      <NavIcon to="/resources" icon={IconResources} label="Resources" />
    </nav>
  );
}
