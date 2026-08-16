import { BottomNav } from "../Components/BottomNav.jsx";

export function Resources() {
  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">First aid &amp; resources</h1>

        <section className="log-section">
          <div className="emergency-card">
            <svg className="emergency-card-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <h2 className="emergency-card-title">When to get help now</h2>
            <p className="emergency-card-body">
              Difficulty breathing, chest pain or pressure, sudden severe pain, fainting, confusion, or any symptom
              that feels rapidly worsening. In the US, call 911.
            </p>
          </div>

          <div className="resource-card">
            <p>
              This app is for tracking patterns over time, not for evaluating an emergency. Consider contacting a
              healthcare provider or urgent care if symptoms are new, unusual for you, or not improving with rest.
            </p>
            <p className="medical-disclaimer">
              This isn't medical advice. If something feels serious, contact a healthcare provider.
            </p>
          </div>
        </section>

        <section className="log-section">
          <h2 className="log-section-title">General wellness resources</h2>
          <ul className="resource-link-list">
            <li>
              <a href="https://www.cdc.gov" target="_blank" rel="noopener noreferrer">
                CDC: health topics &amp; guidance
              </a>
            </li>
            <li>
              <a href="https://www.who.int" target="_blank" rel="noopener noreferrer">
                World Health Organization
              </a>
            </li>
            <li>
              <a href="https://medlineplus.gov" target="_blank" rel="noopener noreferrer">
                MedlinePlus: plain-language health information
              </a>
            </li>
            <li>
              <a href="https://www.redcross.org" target="_blank" rel="noopener noreferrer">
                American Red Cross: first aid basics
              </a>
            </li>
            <li>
              <a href="https://www.211.org" target="_blank" rel="noopener noreferrer">
                211.org: find local health &amp; community services
              </a>
            </li>
          </ul>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
