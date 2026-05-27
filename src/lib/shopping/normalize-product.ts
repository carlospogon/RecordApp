const quantityPrefixPattern = /^\s*\d+[.,]?\d*\s*/;

function singularizeSpanishWord(value: string) {
  if (value.endsWith("es") && value.length > 4) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }

  return value;
}

export function normalizeProductName(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(quantityPrefixPattern, "")
    .replace(/[.,;:!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "";
  }

  return cleaned
    .split(" ")
    .map((token) => singularizeSpanishWord(token))
    .join(" ");
}
