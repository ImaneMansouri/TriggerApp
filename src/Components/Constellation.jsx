import { categoryEmoji } from "../lib/categories";
import { fieldEmoji } from "../lib/fieldEmoji";

// A loose bipartite layout — symptom nodes down the left, the environmental factors they're
// linked to down the right, dashed lines only between an actual finding's pair. Purely
// illustrative of the *real* findings (not decorative filler): every line here corresponds to
// one entry in `findings`.
export function Constellation({ findings }) {
  if (findings.length === 0) return null;

  const symptomNodes = [];
  const fieldNodes = [];
  const seenSymptoms = new Set();
  const seenFields = new Set();

  for (const f of findings) {
    if (!seenSymptoms.has(f.symptomId)) {
      seenSymptoms.add(f.symptomId);
      symptomNodes.push({ id: f.symptomId, emoji: categoryEmoji(f.category || ""), label: f.symptomName });
    }
    if (!seenFields.has(f.field)) {
      seenFields.add(f.field);
      fieldNodes.push({ id: f.field, emoji: fieldEmoji(f.field), label: f.fieldLabel });
    }
  }

  const width = 300;
  const height = Math.max(120, Math.max(symptomNodes.length, fieldNodes.length) * 56);
  const leftX = 40;
  const rightX = width - 40;

  const symptomY = (i) => (height / (symptomNodes.length + 1)) * (i + 1);
  const fieldY = (i) => (height / (fieldNodes.length + 1)) * (i + 1);
  const symptomIndex = new Map(symptomNodes.map((n, i) => [n.id, i]));
  const fieldIndex = new Map(fieldNodes.map((n, i) => [n.id, i]));

  return (
    <svg className="constellation" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {findings.map((f) => (
        <line
          key={`${f.symptomId}-${f.field}`}
          x1={leftX}
          y1={symptomY(symptomIndex.get(f.symptomId))}
          x2={rightX}
          y2={fieldY(fieldIndex.get(f.field))}
          className="constellation-link"
        />
      ))}
      {symptomNodes.map((n, i) => (
        <g key={n.id} transform={`translate(${leftX}, ${symptomY(i)})`}>
          <circle r="18" className="constellation-node" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="16">
            {n.emoji}
          </text>
        </g>
      ))}
      {fieldNodes.map((n, i) => (
        <g key={n.id} transform={`translate(${rightX}, ${fieldY(i)})`}>
          <circle r="18" className="constellation-node" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="16">
            {n.emoji}
          </text>
        </g>
      ))}
    </svg>
  );
}
