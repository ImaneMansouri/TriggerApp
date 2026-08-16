import { BottomNav } from "../Components/BottomNav.jsx";

export function Resources() {
  return (
    <div className="page page-with-nav">
      <div className="page-content">
        <h1 className="page-title">First aid &amp; resources</h1>

        <section className="log-section">
          <h2 className="log-section-title">When to seek care</h2>
          <div className="resource-card">
            <p>
              This app is for tracking patterns over time, not for evaluating an emergency. Consider contacting a
              healthcare provider or urgent care if symptoms are new, unusual for you, or not improving with rest.
            </p>
            <p>
              Consider emergency care (in the US, call 911) for things like difficulty breathing, chest pain or
              pressure, sudden severe pain, fainting, confusion, or any symptom that feels rapidly worsening or
              out of the ordinary.
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
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
