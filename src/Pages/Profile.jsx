import { useNavigate } from "react-router-dom";
import { BottomNav } from "../Components/BottomNav.jsx";
import { clearSession, getUser } from "../lib/api";

export function Profile() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">Profile</h1>

        {!user && <p className="status-message">No profile info found. Try logging in again.</p>}

        {user && (
          <div className="profile-card">
            <div className="profile-row">
              <span className="profile-row-label">Email</span>
              <span className="profile-row-value">{user.email}</span>
            </div>
            <div className="profile-row">
              <span className="profile-row-label">Location</span>
              <span className="profile-row-value">
                {user.lat != null && user.lon != null
                  ? `${user.lat.toFixed(2)}, ${user.lon.toFixed(2)}`
                  : "Not set"}
              </span>
            </div>
            <div className="profile-row">
              <span className="profile-row-label">Conditions</span>
              <span className="profile-row-value">
                {user.conditions && user.conditions.length > 0 ? user.conditions.join(", ") : "None listed"}
              </span>
            </div>
          </div>
        )}

        <button type="button" className="save-button save-button-danger" onClick={handleLogout}>
          Log out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
