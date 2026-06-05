export function buildRepeatedListTitle(baseTitle: string, referenceDate = new Date()) {
  const cleanBase = baseTitle
    .replace(/\s*[·-]\s*repetida\s+\d{2}\/\d{2}$/i, "")
    .replace(/\s*\(plantilla\)$/i, "")
    .trim();
  const formattedDate = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit"
  }).format(referenceDate);

  return `${cleanBase || "Lista de compra"} · Repetida ${formattedDate}`;
}
