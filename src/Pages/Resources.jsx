import { BottomNav } from "../Components/BottomNav.jsx";

export function Resources() {
  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="script-heading page-title">First aid</h1>
        <p className="story-subtitle">Calm, credible guidance — never a diagnosis</p>

        <div className="coral-card alert-card">
          <p className="coral-card-eyebrow">When to get help now</p>
          <ul className="alert-list">
            <li>Trouble breathing</li>
            <li>Throat tightness</li>
            <li>Swelling of the face or lips</li>
            <li>Fainting</li>
          </ul>
          <p className="pattern-footer">In the US, call 911 for any of these — don't wait to see if it passes.</p>
        </div>

        <section className="log-section">
          <div className="white-card">
            <h2 className="log-section-title">When to seek care (non-emergency)</h2>
            <p>
              This app is for tracking patterns over time, not for evaluating an emergency. Consider contacting a
              healthcare provider or urgent care if symptoms are new, unusual for you, or not improving with rest.
            </p>
          </div>
        </section>

        <section className="log-section">
          <div className="white-card">
            <h2 className="log-section-title">General wellness resources</h2>
            <ul className="resource-link-list">
              <li>
                <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer">
                  CDC — health topics &amp; guidance
                </a>
              </li>
              <li>
                <a href="https://www.who.int" target="_blank" rel="noopener noreferrer">
                  World Health Organization
                </a>
              </li>
              <li>
                <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer">
                  MedlinePlus — plain-language health information
                </a>
              </li>
              <li>
                <a href="https://www.redcross.org" target="_blank" rel="noopener noreferrer">
                  American Red Cross — first aid basics
                </a>
              </li>
              <li>
                <a href="https://www.211.org" target="_blank" rel="noopener noreferrer">
                  211.org — find local health &amp; community services
                </a>
              </li>
            </ul>
          </div>
        </section>

        <div className="white-card reminder-card">
          <p className="medical-disclaimer">This isn't medical advice. If something feels serious, contact a healthcare provider.</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
