// Same Arabic normalization as the DB function for client-side checks.
export function normalizeArabicName(name: string): string {
  if (!name) return "";
  const map: Record<string, string> = {
    "أ": "ا", "إ": "ا", "آ": "ا", "ى": "ي", "ئ": "ي",
    "ء": "ء", "ؤ": "و", "ة": "ه", "ـ": "",
  };
  return name
    .toLowerCase()
    .split("")
    .map(c => map[c] ?? c)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeExamNameKey(name: string): string {
  const normalized = normalizeArabicName(name);
  if (!normalized) return "";

  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length <= 1) return normalized;

  return `${parts[0]} ${parts[parts.length - 1]}`;
}
