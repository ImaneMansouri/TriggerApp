import { jsPDF } from "jspdf";

const ENV_FIELDS = [
  { field: "temperature_2m_mean", label: "Temp", unit: "C" },
  { field: "relative_humidity_2m_mean", label: "Humidity", unit: "%" },
  { field: "pm2_5", label: "PM2.5", unit: "ug/m3" },
  { field: "ozone", label: "Ozone", unit: "ug/m3" },
  { field: "pressure_change", label: "Pressure change", unit: "hPa" },
];

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function envSummary(episode) {
  const data = episode.environmentalContext?.data;
  if (!data) return "No environmental data captured.";
  const parts = [];
  for (const { field, label, unit } of ENV_FIELDS) {
    const value = data[field];
    if (value === null || value === undefined) continue;
    parts.push(`${label} ${Math.round(value * 10) / 10}${unit}`);
  }
  return parts.length ? parts.join("  |  ") : "No environmental data captured.";
}

// Builds and downloads a doctor-readable PDF summary of the given episodes. Runs entirely
// client-side (jsPDF) against data the caller already has loaded — no extra network round
// trip, no server-side PDF dependency to stand up under time pressure.
export function downloadDoctorSummaryPdf(episodes, user) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const marginX = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 56;

  function ensureSpace(needed) {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 56;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Symptom & Environment Summary", marginX, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  const name = user?.username || "Patient";
  doc.text(`Prepared for: ${name}`, marginX, y);
  y += 16;
  doc.text(`Generated: ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`, marginX, y);
  y += 16;
  doc.text(`Total logged episodes: ${episodes.length}`, marginX, y);
  y += 24;

  doc.setDrawColor(220, 220, 220);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 22;

  doc.setTextColor(30, 30, 30);

  if (episodes.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.text("No episodes have been logged yet.", marginX, y);
    y += 20;
  }

  for (const episode of episodes) {
    ensureSpace(90);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(formatDate(episode.date), marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const symptomLine = episode.symptoms.map((s) => `${s.name} (severity ${s.severity}/5)`).join(", ");
    const symptomLines = doc.splitTextToSize(symptomLine, pageWidth - marginX * 2);
    doc.text(symptomLines, marginX, y);
    y += symptomLines.length * 14;

    doc.setTextColor(90, 90, 90);
    doc.text(`Location: ${episode.location || "unknown"}`, marginX, y);
    y += 14;

    if (episode.notes) {
      const noteLines = doc.splitTextToSize(`Note: ${episode.notes}`, pageWidth - marginX * 2);
      doc.text(noteLines, marginX, y);
      y += noteLines.length * 14;
    }

    const envLines = doc.splitTextToSize(envSummary(episode), pageWidth - marginX * 2);
    doc.text(envLines, marginX, y);
    y += envLines.length * 14;

    if (episode.safety?.flagged) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(200, 40, 20);
      doc.text("Flagged as possibly needing urgent care when logged.", marginX, y);
      y += 14;
    }

    doc.setTextColor(30, 30, 30);
    y += 12;
    doc.setDrawColor(235, 235, 235);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;
  }

  ensureSpace(40);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(
    "This report reflects self-reported symptom logs and automatically captured environmental data. It is not medical advice or a diagnosis.",
    marginX,
    pageHeight - 32,
    { maxWidth: pageWidth - marginX * 2 }
  );

  doc.save(`${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-symptom-summary.pdf`);
}
