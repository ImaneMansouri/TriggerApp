// Deterministic, rule-based only — no model or heuristic scoring, on purpose. An emergency
// screen has to be predictable and auditable, not "usually right."
//
// Symptom names are arbitrary user text ("can't breathe", "throat closing"), so these rules
// key off the fixed CATEGORY a symptom was tagged with at creation (see lib/categories.js),
// not string matching on the name. Severity is the 1-5 scale from episode logging.
const HIGH_SEVERITY = 4; // out of 5
const MAX_SEVERITY = 5;
const MULTI_SYSTEM_SEVERITY = 3; // out of 5 — the threshold for "moderate" when checking spread across categories

// Categories that, together, describe the anaphylaxis-pattern "multiple body systems at once"
// presentation even when no single symptom alone crosses HIGH_SEVERITY.
const SYSTEMIC_CATEGORIES = ["hives", "swelling", "breathing", "mouth_throat"];

function evaluateSafety(symptoms) {
  const reasons = [];
  const moderateSystemicCategories = new Set();

  for (const s of symptoms) {
    if (s.category === "breathing" && s.severity >= HIGH_SEVERITY) {
      reasons.push(`Breathing difficulty ("${s.name}") logged at high severity`);
    }
    if (s.category === "mouth_throat" && s.severity >= HIGH_SEVERITY) {
      reasons.push(`Throat/mouth symptom ("${s.name}") logged at high severity: possible throat tightness, swelling, or trouble swallowing`);
    }
    if (s.category === "swelling" && s.severity >= MAX_SEVERITY) {
      reasons.push(`Swelling ("${s.name}") logged at maximum severity`);
    }
    if (s.severity >= MULTI_SYSTEM_SEVERITY && SYSTEMIC_CATEGORIES.includes(s.category)) {
      moderateSystemicCategories.add(s.category);
    }
  }

  // Multiple systems involved at once, each at least moderate, is itself a recognized severe
  // (anaphylaxis-pattern) presentation — this is what "severe systemic symptoms" maps to here.
  if (moderateSystemicCategories.size >= 2) {
    reasons.push(`Multiple body systems involved at once (${[...moderateSystemicCategories].join(", ")})`);
  }

  return { flagged: reasons.length > 0, reasons };
}

module.exports = { evaluateSafety, HIGH_SEVERITY, MAX_SEVERITY, MULTI_SYSTEM_SEVERITY };
