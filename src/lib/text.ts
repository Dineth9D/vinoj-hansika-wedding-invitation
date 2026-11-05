/** "Dineth Perera" -> "dineth-perera" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Turns a link value like "dineth-perera" or "Dineth" into "Dineth Perera". */
export function nameFromParam(input: string): string {
  return input
    .replace(/[-_+.]+/g, " ")
    .replace(/[^\p{L}\p{N}\s'&]/gu, "")
    .trim()
    .slice(0, 60)
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // drop control characters, keep normal line breaks
  return v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "").trim().slice(0, max);
}
